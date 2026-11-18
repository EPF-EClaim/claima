const cds = require('@sap/cds');
const { Constant } = require("./utils/constant");
const UpdateHeader = require("./utils/UpdateHeader");
const {
    sendClaimBatch,
    sendFinalApproveLog
} = require("./workflow/determination/determination-helper");
const {
    runPreWorkflowChecks
} = require("./workflow/pre-workflow-checks");
const {
    resolveDocDescriptor,
    retrieveBudgetContext,
    generateReturnMessage,
    buildBudgetErrorMessage,
    getApproverContextByLevel,
    retrieveRejectReasonDesc,
    logWorkflowHistory,
    releaseClaimBudget
} = require('./workflow/workflow-helper');
const {
    sendEmailToClaimant
} = require('./workflow/notification/notification-claimant');
const {
    sendEmailToApprover
} = require('./workflow/notification/notification-approver');
const {
    updateApproverDetailsTable,
    verifyCorrectApproverForAction,
    determineLastApproverLevel,
    resolveActionDescriptor,
    updateCorpoCardAdvance,
    notifyCardholdersOfRequestApproval,
    notifyCCCMakerOfApproval,
    buildFinalApprovalPayloadForCCC
} = require('./workflow/action/action-helper');
const {
    updateUsedEntitlementAmount
} = require('./utils/UpdateDependent');
const { notifyIFAMSConnectionError } = require('./utils/EmailNotification');

module.exports = (srv) => {

    srv.on('startWorkflow', async req => {
        const oTx = cds.tx(req)
        const { id: sRecordId, currentStatus: sCurrentStatus } = req.data

        let bStatus = false;    // default to false, will be set to true

        if (!sRecordId) {
            return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.WORKFLOW_GENERAL, "Document ID is required to start workflow", false);
        }

        const oDescriptor = resolveDocDescriptor(sRecordId);
        if (!oDescriptor) {
            return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `Prefix not found for document: ${sRecordId}`, false);
        }

        // Steps 1-5: eligibility, budget locking, workflow determination,
        // approver determination, approver detail persistence.
        const oPreWorkflowResult = await runPreWorkflowChecks(oTx, sRecordId, oDescriptor);
        if (oPreWorkflowResult.Success === false) {
            return oPreWorkflowResult;
        }
        const { oWorkflowContext, aApproversContext, aApproversContextNew } = oPreWorkflowResult;

        // 6.1 update header status
        // 6.2 update entitlement amount 
        // 6.3 update ccc advance value
        if (aApproversContext.length && aApproversContext[0].LEVEL == 0) {
            var bAutoApprove = true;

            // If successful, update Header table with approved status and timestamp
            try {
                await UpdateHeader.updateApproverActionToHeader(sRecordId, Constant.Status.APPROVED, oTx, bAutoApprove);
            } catch (oError) {
                await oTx.rollback();
                throw new Error(`Error encountered while updating claim status to Approved\n${oError.message}`);
            }

            // send the auto approved claim to SF MDF
            try {
                await sendClaimBatch(sRecordId);
            } catch (oError) {
                await oTx.rollback();
                throw new Error(`Error encountered while sending auto-approved claim record to CENTRA MDF.\n${oError.message}`);
            }
        } else {
            // Normal flow - the request/claim is now pending approver action.
            try {
                // update Corporate Credit Card Advance Value
                await updateCorpoCardAdvance(oTx, sRecordId, Constant.Status.PENDING_APPROVAL);
                // update PEDU entitlement usage
                await updateUsedEntitlementAmount(sRecordId, Constant.Status.PENDING_APPROVAL, oTx);
                // Update Header Status
                await UpdateHeader.updateApproverActionToHeader(sRecordId, Constant.Status.PENDING_APPROVAL, oTx);
            } catch (oError) {
                await oTx.rollback();
                throw new Error(`${oError.message}`);
            }
        }
        // ==========

        // 7. finalizing the workflow ===
        // check if workflow found and approvers determined, change bStatus to true
        // log record history
        // send email notification
        if (oWorkflowContext && aApproversContext.length) {
            bStatus = true;
            const sSubmitText = sCurrentStatus === Constant.Status.PUSH_BACK ? "resubmitted" : "submitted";

            // 7.1 log record history
            try {
                await logWorkflowHistory(oTx, sRecordId, `${sRecordId} is ${sSubmitText}.`);

                // log as auto approved
                if (aApproversContextNew[0].LEVEL == 0) {
                    await logWorkflowHistory(oTx, sRecordId, `${sRecordId} has been auto-approved.`);
                }
            } catch (oError) {
                await oTx.rollback();
                throw new Error(`Error encountered during Corporate Card Advance update\n${oError.message}`);
            }

            // 7.2 send email to claimant or approver
            // Notify claimant/approver (isolated from the determination of workflow status)
            // If workflow is AUTO, send email to claimant to inform claimant that claim has been auto approved
            // Else, send email to approver 1 to inform approver that claim is awaiting approver action
            try {
                if (aApproversContextNew[0].LEVEL == 0) {
                    await sendEmailToClaimant(sRecordId, aApproversContextNew[0].APPROVER_ID, oDescriptor, Constant.ApprovalEmailAction.ACTION_APPROVE);
                } else {
                    await sendEmailToApprover(aApproversContext, sRecordId, oDescriptor, Constant.ApprovalEmailAction.ACTION_NOTIFY);
                }
            } catch (oError) {
                // Log the failure for audit visibility, but don't roll back or throw -
                // the workflow itself already succeeded by this point.
                await logWorkflowHistory(oTx, sRecordId, `Notification failed for ${sRecordId}: ${oError.message}`, Constant.MessageType.ERROR, Constant.StatusCode.ERROR);
            }
        }
        // ==========

        return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Workflow Started', aApproversContextNew[0].LEVEL === 0 ? true : false);

    });

    /* =========================================================================
    * processApproval helpers
    * ========================================================================= */

    /**
     * Whether the action ends the workflow stage
     * (REJECT / PUSH BACK, or APPROVE by the last-level approver).
     */
    const isFinalStageAction = (sActionValue, oLastLevel) =>
        sActionValue === Constant.Status.REJECTED ||
        sActionValue === Constant.Status.PUSH_BACK ||
        (oLastLevel.SUCCESS && oLastLevel.ISLASTLEVEL);

    /**
     * Updates the Corporate Card advance and wraps any failure in a standard error.
     */
    const updateCorpoCardAdvanceSafe = async (oTx, sRecordId, sActionValue) => {
        try {
            await updateCorpoCardAdvance(oTx, sRecordId, sActionValue);
        } catch (oAdvErr) {
            throw new Error('Error encountered during Corporate Card Advance update');
        }
    };

    /**
     * Final-approval steps for Corporate Credit Card requests.
     */
    const handleCCCFinalApproval = async (oTx, sRecordId, sUserId) => {
        await notifyCardholdersOfRequestApproval(oTx, sRecordId);   // send email to cardholder(s) to inform that request has been approved
        await notifyCCCMakerOfApproval(oTx, sRecordId, sUserId);    // send email to maker to inform that request has been approved
        await buildFinalApprovalPayloadForCCC(oTx, sRecordId);      // send CCC records to SF MDF
    };

    /**
     * Builds the workflow history message for the approver action.
     */
    const buildApprovalLogMessage = async (oTx, sRecordId, sUserId, oActionDescriptor, sComments) => {
        const oUser = await oTx.run(
            SELECT.one.from('ZEMP_MASTER')
                .columns('EEID', 'NAME')
                .where({ EEID: sUserId })
        );

        const sActionText = Constant.UIAction[oActionDescriptor.approverActionValue]
            ?? oActionDescriptor.approverActionValue?.toLowerCase();
        const sCommentText = sComments ? ` with comment: ${sComments}` : '';

        return `${sRecordId} is ${sActionText} by ${oUser?.NAME ?? sUserId}${sCommentText}.`;
    };

    /**
     * Sends the approval notification:
     * - REJECT / PUSH BACK  → claimant
     * - Final APPROVE       → claimant
     * - Intermediate APPROVE → next level approver(s)
     */
    const sendApprovalNotification = async ({
        sRecordId, sUserId, oDescriptor, oActionDescriptor, oLastLevel,
        sComments, sRejectionReasonDesc, bIsRejectOrPushBack, bIsFinalApprove
    }) => {
        if (bIsRejectOrPushBack || bIsFinalApprove) {
            return sendEmailToClaimant(sRecordId, sUserId, oDescriptor,
                oActionDescriptor.emailAction, sComments, sRejectionReasonDesc);
        }

        const aApproversContext = await getApproverContextByLevel(sRecordId, oDescriptor, oLastLevel.NEXTLEVEL);
        return sendEmailToApprover(aApproversContext, sRecordId, oDescriptor,
            Constant.ApprovalEmailAction.ACTION_NOTIFY, oLastLevel.NEXTLEVEL);
    };

    /* =========================================================================
    * processApproval
    * ========================================================================= */
    srv.on('processApproval', async (req) => {

        const {
            Id: sRecordId,
            UserId: sUserId,
            ApproverAction: sAction,
            Comments: sComments,
            RejectionReason: sRejectionReason
        } = req.data.request;

        if (!sRecordId) {
            return generateReturnMessage(false, sRecordId, Constant.WorkflowArea.WORKFLOW_GENERAL,
                "Document ID is required to process approval", false);
        }

        const oTx = cds.tx(req);
        const oDescriptor = resolveDocDescriptor(sRecordId);

        // 1. Resolve action
        const oActionDescriptor = resolveActionDescriptor(sAction);
        if (!oActionDescriptor) {
            throw new Error(`Unsupported workflow action: ${sAction}`);
        }

        // 2. Validate approver
        const bValidApprover = await verifyCorrectApproverForAction(sRecordId, sUserId, oDescriptor);
        if (!bValidApprover) {
            throw new Error(`Invalid Approver ${sUserId} for Document ${sRecordId}`);
        }

        // 3. Determine approver level
        const oLastLevel = await determineLastApproverLevel(sRecordId, sUserId, oDescriptor);

        const sActionValue = oActionDescriptor.actionValue;
        const bFinalStage = isFinalStageAction(sActionValue, oLastLevel);

        // 4. Update approver details
        const bApproverUpdated = await updateApproverDetailsTable(
            oTx, sRecordId, sUserId, oActionDescriptor, sComments, sRejectionReason, oDescriptor);
        if (!bApproverUpdated) {
            throw new Error(`Error Encountered during action: ${sAction} for Document ${sRecordId}`);
        }

        // REJECT / PUSH BACK:
        // Release Earmarked Funds reservation in IFAMS,
        // log the successful release and clear the local IFAMS references.
        if (
            oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM &&
            (
                oActionDescriptor.actionValue === Constant.Status.REJECTED ||
                oActionDescriptor.actionValue === Constant.Status.PUSH_BACK
            )
        ) {
            const aBudgetContext = await retrieveBudgetContext(sRecordId, oDescriptor);
            // Earmarked Funds Document ID must be available
            const oClaimHeader = await oTx.run(
                SELECT.one
                    .from(Constant.Entities.ZCLAIM_HEADER)
                    .columns("EARMARKED_FUNDS_DOC_ID")
                    .where({
                        CLAIM_ID: sRecordId
                    })
            );
            const sEarmarkedFundsDocId = oClaimHeader?.EARMARKED_FUNDS_DOC_ID;
            if (!sEarmarkedFundsDocId) {
                throw new Error(
                    `Earmarked Funds Document ID not found for ${sRecordId}`
                );
            }

            // Call IFAMS to release the budget
            const aReturn = await releaseClaimBudget(oTx, aBudgetContext, sRecordId, sEarmarkedFundsDocId, oActionDescriptor.actionValue);

            // Send admin notification when IFAMS connection fails during budget release
            await notifyIFAMSConnectionError(aReturn, sRecordId);

            const sBudgetError = buildBudgetErrorMessage(aReturn);
            if (sBudgetError) {
                throw new Error(
                    `Error encountered during IFAMS Budget Release\n${sBudgetError}`
                );
            }
        }

        // 6. PEDU entitlement usage
        await updateUsedEntitlementAmount(sRecordId, sActionValue, oTx);

        // 7. Header status update (final stage only)
        if (bFinalStage) {
            await UpdateHeader.updateApproverActionToHeader(sRecordId, sActionValue, oTx);
        }

        // 8. Follow-up actions
        const bIsRejectOrPushBack = sAction === Constant.Status.REJECTED || sAction === Constant.Status.PUSH_BACK;
        const bIsFinalApprove = sAction === Constant.Status.APPROVED && oLastLevel.ISLASTLEVEL;
        let sRejectionReasonDesc = null;

        try {
            if (bIsRejectOrPushBack) {
                sRejectionReasonDesc = await retrieveRejectReasonDesc(sRejectionReason);
                if (!sRejectionReasonDesc) {
                    throw new Error('Rejection reason is required for rejection or push back action');
                }
                await updateCorpoCardAdvanceSafe(oTx, sRecordId, sActionValue);

            } else if (bIsFinalApprove) {
                await updateCorpoCardAdvanceSafe(oTx, sRecordId, sActionValue);
                await sendClaimBatch(sRecordId);

                if (sRecordId.slice(0, 3) === Constant.WorkflowType.REQUEST) {
                    await handleCCCFinalApproval(oTx, sRecordId, sUserId);
                }
            }
        } catch (oError) {
            throw new Error(`Follow-up action failed for ${sRecordId}: ${oError.message}`);
        }

        // 9. Email notification
        try {
            await sendApprovalNotification({
                sRecordId, sUserId, oDescriptor, oActionDescriptor, oLastLevel,
                sComments, sRejectionReasonDesc, bIsRejectOrPushBack, bIsFinalApprove
            });
        } catch (oError) {
            await logWorkflowHistory(oTx, sRecordId, `Notification failed for ${sRecordId}: ${oError.message}`, Constant.MessageType.ERROR, Constant.StatusCode.ERROR);
        }

        // 10. Workflow history
        const sLogMessage = await buildApprovalLogMessage(oTx, sRecordId, sUserId, oActionDescriptor, sComments);
        await logWorkflowHistory(oTx, sRecordId, sLogMessage, Constant.MessageType.WORKFLOW, Constant.StatusCode.SUCCESS);

        return generateReturnMessage(true, sRecordId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Approver Process Completed');
    });
}