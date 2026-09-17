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
    performBudgetChecking,
    getApproverContextByLevel,
    retrieveRejectReasonDesc
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
const { message } = require('@sap/cds/lib/log/cds-error');
const {
    updateUsedMedicalAmount
} = require('./utils/UpdateMedical');

module.exports = (srv) => {

    srv.on('startWorkflow', async req => {
        const oTx = cds.tx(req)
        const { id: sRecordId, currentStatus: sCurrentStatus } = req.data

        let bStatus = false;    // default to false, will be set to true

        const oDescriptor = resolveDocDescriptor(sRecordId);
        if (!oDescriptor) {
            return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `Prefix not found for document: ${sRecordId}`, false);
        }

        // Steps 1-5: eligibility, budget locking, workflow determination,
        // approver determination, approver detail persistence.
        // Any failure inside rolls back and throws - see runPreWorkflowChecks.
        const { oWorkflowContext, aApproversContext, aApproversContextNew } = await runPreWorkflowChecks(oTx, sRecordId, oDescriptor);

        // 6.1 Perform budget actualization for auto approve ===
        // 6.2 update header status
        // 6.3 update entitlement amount 
        // 6.4 update ccc advance value
        let aBudgetContext, aBudgetCheckReturn;
        if (aApproversContext.length && aApproversContext[0].LEVEL == 0) {
            try {
                aBudgetContext = await retrieveBudgetContext(sRecordId, oDescriptor, Constant.ApproverActions.APPROVE);
                aBudgetCheckReturn = await performBudgetChecking(oTx, aBudgetContext);
            } catch (oError) {
                await oTx.rollback();
                throw new Error(`Error encountered during Budget Actualization\n${oError.message}`);
            }

            var oReturn = aBudgetCheckReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND);
            if (oReturn) {
                await oTx.rollback();
                return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.BUDGET_ACTUALIZATION, 'Error encountered during Budget Checking', false);
            }

            // If successful, update Header table with approved status and timestamp
            try {
                await UpdateHeader.updateApproverActionToHeader(sRecordId, Constant.Status.APPROVED, oTx);
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
                // update Medical Entitlement usage
                await updateUsedMedicalAmount(sRecordId, Constant.Status.PENDING_APPROVAL, oTx);
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
                await oTx.run(INSERT.into("ZLOG").entries({
                    TIMESTAMP: new Date(),
                    RECORD_ID: `${sRecordId}`,
                    PROGRAM: 'WORKFLOW',
                    MESSAGE_TYPE: 'A',
                    STATUS_CODE: '200',
                    MESSAGE: `${sRecordId} is ${sSubmitText}.`
                }));
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
                console.error(`[${sRecordId}] Notification step failed:`, oError.message);
            }
        }
        // ==========

        return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Workflow Started', aApproversContextNew[0].LEVEL === 0 ? true : false);

    });

    srv.on('processApproval', async req => {
        console.log("Request Payload: ", req.data);
        const {
            Id: sRecordId,
            UserId: sUserId,
            ApproverAction: sAction,
            Comments: sComments,
            RejectionReason: sRejectionReason
        } = req.data.request

        const oDescriptor = resolveDocDescriptor(sRecordId);
        let bStatus = true;

        const oTx = cds.tx(req)
        const oActionDescriptor = resolveActionDescriptor(sAction);
        if (!oActionDescriptor) {
            throw new Error(`Unsupported workflow action: ${sAction}`);
        }
        console.log("ActionDescriptor: ", oActionDescriptor);
        // Verify if Approver is correct approver        
        bStatus = await verifyCorrectApproverForAction(sRecordId, sUserId, oDescriptor);
        if (!bStatus) {
            //Return error message
            throw new Error(`Invalid Approver ${sUserId} for Document ${sRecordId}`);
        }
        console.log("Approver Validation: ", bStatus);
        // Check if approver is last level approver
        const oLastLevelApproverStatus = await determineLastApproverLevel(sRecordId, sUserId, oDescriptor);

        console.log("Final Approver Context: ", oLastLevelApproverStatus);
        // Once Approver is validated, perform action
        console.log("Rejection Reason: ", sRejectionReason);
        bStatus = await updateApproverDetailsTable(oTx, sRecordId, sUserId, oActionDescriptor, sComments, sRejectionReason, oDescriptor);
        if (!bStatus) {
            //Return error message
            throw new Error(`Error Encountered during action: ${sAction} for Document ${sRecordId}`);
        }
        console.log("Approver Action Completed: ", bStatus);

        // If approver is final level approver or if action is REJECT/PUSH BACK, perform budget checking
        if (oActionDescriptor.actionValue == Constant.Status.REJECTED || oActionDescriptor.actionValue == Constant.Status.PUSH_BACK || (oLastLevelApproverStatus.SUCCESS && oLastLevelApproverStatus.ISLASTLEVEL)) {
            const aBudgetContext = await retrieveBudgetContext(sRecordId, oDescriptor, oActionDescriptor.budgetActionValue);
            console.log("aBudgetContext: ", aBudgetContext);
            const aReturn = await performBudgetChecking(oTx, aBudgetContext);
            console.log("aReturn: ", aReturn);
            const oReturn = aReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND);
            if (oReturn) {
                bStatus = false;
                throw new Error('Error encountered during Budget Checking')
            }
            console.log("Budget Checking Status: ", bStatus);
        }

        // update PEDU entitlement usage if action is reject
        await updateUsedEntitlementAmount(sRecordId, oActionDescriptor.actionValue, oTx);

        // update Medical Entitlement usage if action is reject
        await updateUsedMedicalAmount(sRecordId, oActionDescriptor.actionValue, oTx);

        // Update ZCLAIM_HEADER / ZREQUEST_HEADER with the status, timestamp and Reject Reason if necessary
        if (oActionDescriptor.actionValue == Constant.Status.REJECTED || oActionDescriptor.actionValue == Constant.Status.PUSH_BACK || (oLastLevelApproverStatus.SUCCESS && oLastLevelApproverStatus.ISLASTLEVEL)) {
            const sStatus = await UpdateHeader.updateApproverActionToHeader(sRecordId, oActionDescriptor.actionValue, oTx);
            console.log("Header table update: ", sStatus);
        }

        // Notify claimant/next level approver
        // If action is REJECT/PUSH BACK, notify claimant
        // If action is APPROVE, notify next level approver
        // If action is APPROVE and there are no next level approver, notify claimant
        // Retrieve Reject reason description if rejection reason is provided
        let sRejectionReasonDesc = null;
        if (sAction === Constant.Status.REJECTED || sAction === Constant.Status.PUSH_BACK) {
            sRejectionReasonDesc = await retrieveRejectReasonDesc(sRejectionReason);
            if (!sRejectionReasonDesc) {
                throw new Error('Rejection reason is required for rejection or push back action');
            }
            console.log("sRejectionReasonDesc: ", sRejectionReasonDesc);
            try {
                await updateCorpoCardAdvance(oTx, sRecordId, oActionDescriptor.actionValue);
            } catch (oAdvErr) {
                console.error("Failed to update corpo card advance:", oAdvErr);
                throw new Error('Error encountered during Corporate Card Advance update');
            }
            bStatus = await sendEmailToClaimant(sRecordId, sUserId, oDescriptor, oActionDescriptor.emailAction, sComments, sRejectionReasonDesc);
        }
        else if (sAction === Constant.Status.APPROVED && oLastLevelApproverStatus.ISLASTLEVEL) {
            try {
                await updateCorpoCardAdvance(oTx, sRecordId, oActionDescriptor.actionValue);
            } catch (oAdvErr) {
                console.error("Failed to update corpo card advance:", oAdvErr);
                throw new Error('Error encountered during Corporate Card Advance update');
            }

            //trigger final approval process to send batch claim to IS 
            console.log("Final approval Start");
            const oSendClaimBatch = await sendClaimBatch(sRecordId);
            console.log("Final Approval: ", oSendClaimBatch);

            // Once a Corporate Credit Card request is fully approved, notify the cardholder(s)
            if (sAction === Constant.Status.APPROVED && sRecordId.slice(0, 3) === Constant.WorkflowType.REQUEST) {
                console.log("Sending final approve CCC email")
                await notifyCardholdersOfRequestApproval(oTx, sRecordId);
                await notifyCCCMakerOfApproval(oTx, sRecordId, sUserId);

                const aFinalApprovalPayload = await buildFinalApprovalPayloadForCCC(oTx, sRecordId);
                console.log("Final approval payload:", JSON.stringify(aFinalApprovalPayload));

            }
            bStatus = await sendEmailToClaimant(sRecordId, sUserId, oDescriptor, oActionDescriptor.emailAction, sComments, sRejectionReasonDesc);
        }
        else {
            const aApproversContext = await getApproverContextByLevel(sRecordId, oDescriptor, oLastLevelApproverStatus.NEXTLEVEL)
            console.log("Approver context for next level approver: ", aApproversContext);
            bStatus = await sendEmailToApprover(aApproversContext, sRecordId, oDescriptor, Constant.ApprovalEmailAction.ACTION_NOTIFY, oLastLevelApproverStatus.NEXTLEVEL)
        }
        if (!bStatus) {
            throw new Error('Error encountered during Email Notification');
        }
        console.log("Approver Action Status: ", bStatus);

        const mActionText = {
            APPROVE: "approved",
            REJECT: "rejected",
            PUSHBACK: "pushed back"
        };

        if (bStatus) {
            const oUser = await oTx.run(
                SELECT.one
                    .from('ZEMP_MASTER')
                    .where({ EEID: sUserId })
                    .columns('EEID', 'NAME')
            );

            const sActionText = Constant.UIAction[oActionDescriptor.approverActionValue] ?? oActionDescriptor.approverActionValue?.toLowerCase();
            const sCommentText = sComments
                ? ` with comment: ${sComments}`
                : '';

            const sMessage = `${sRecordId} is ${sActionText} by ${oUser?.NAME ?? sUserId}${sCommentText}.`;

            await oTx.run(
                INSERT.into("ZLOG").entries({
                    TIMESTAMP: new Date(),
                    RECORD_ID: sRecordId,
                    PROGRAM: 'WORKFLOW',
                    MESSAGE_TYPE: 'A',
                    STATUS_CODE: Constant.StatusCode.SUCCESS,
                    MESSAGE: sMessage
                })
            );
        }

        return generateReturnMessage(bStatus, sRecordId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Approver Process Completed');
    });
}