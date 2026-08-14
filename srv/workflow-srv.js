// Require START
const cds = require('@sap/cds');
const { Constant } = require("./utils/constant");
const UpdateHeader = require("./utils/UpdateHeader");
const {
    determineWorkflow
} = require("./workflow/determination/determination-workflow");
const {
    determineApprovers
} = require("./workflow/determination/determination-approver");
const {
    setApproversContext,
    sendClaimBatch,
    deleteApproverDetails,
    insertRecords,
    sendFinalApproveLog
} = require("./workflow/determination/determination-helper");
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

// Require END

module.exports = (srv) => {

    srv.on('startWorkflow', async req => {
        const oTx = cds.tx(req)
        const { id: sId, currentStatus: sCurrentStatus } = req.data
        let bStatus = false;    // default to false, will be set to true
        let sStatus = '';
        let aReturn = [];
        let aBudgetContext = [];

        const oDescriptor = resolveDocDescriptor(sId);
        if (!oDescriptor) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `Prefix not found for document: ${sId}`, false);
        }

        //1. Determine workflow
        const oWorkflowContext = await determineWorkflow(oTx, sId);
        if (!oWorkflowContext) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, 'No workflow rule matched', false);
        }
        console.log('[workflow-srv] oWorkflowContext:', oWorkflowContext)

        //2. Determine approvers and substitutes
        const aApproversContext = await determineApprovers(oTx, sId, oWorkflowContext)
        if (!aApproversContext.length) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.APPROVER_DETERMINATION, 'No approvers determined', false);
        }

        //3. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
        const aApproversContextNew = setApproversContext(oDescriptor, sId, aApproversContext);
        if (!aApproversContextNew.length) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.APPROVER_DETERMINATION, 'Error encountered during Approver Normalization', false);
        }
        console.log('[workflow-srv] aApproversContextNew:', aApproversContextNew)

        const sDelete = await deleteApproverDetails(oDescriptor.entityApprovers, oDescriptor.approverIdField, sId, oTx);
        const sInsert = await insertRecords(oDescriptor.entityApprovers, aApproversContextNew, oTx);
        console.log(sDelete);
        console.log(sInsert);

        //4. Perform budget actualization for auto approve
        if (aApproversContext[0].LEVEL == 0) {
            aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, Constant.ApproverActions.APPROVE);
            aReturn = await performBudgetChecking(oTx, aBudgetContext);
            const oReturn = aReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND);
            if (oReturn) {
                bStatus = false;
                return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.BUDGET_CHECKING, 'Error encountered during Budget Checking', false);
            }
            //   If successful, update Header table with approved status and timestamp
            await UpdateHeader.updateApproverActionToHeader(sId, Constant.Status.APPROVED, oTx);
        } else {
            // Normal flow - the request/claim is now pending approver action.
            try {
                await updateCorpoCardAdvance(oTx, sId, Constant.Status.PENDING_APPROVAL);
            } catch (oAdvErr) {
                console.error("Failed to update corpo card advance (pending approval):", oAdvErr);
                throw new Error('Error encountered during Corporate Card Advance update');
            }
        }

        //5. Notify claimant/approver
        //If workflow is AUTO, send email to claimant to inform claimant that claim has been auto approved
        //Else, send email to approver 1 to inform approver that claim is awaiting approver action
        if (aApproversContextNew[0].LEVEL == 0) {
            sStatus = await sendEmailToClaimant(sId, aApproversContextNew[0].APPROVER_ID, oDescriptor, Constant.ApprovalEmailAction.ACTION_APPROVE);
            const oSendClaimResponse = await sendClaimBatch(sId);
            console.log("Final Approval: ", oSendClaimResponse);
        }
        else {
            sStatus = await sendEmailToApprover(aApproversContext, sId, oDescriptor, Constant.ApprovalEmailAction.ACTION_NOTIFY);
            await UpdateHeader.updateApproverActionToHeader(sId, Constant.Status.PENDING_APPROVAL, oTx);
        }
        if (!sStatus) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_NOTIFICATION, 'Error encountered during Workflow Notification', false);
        }
        console.log('[workflow-srv] sStatus:', sStatus)

        // check if workflow found and approvers determined, change bStatus to true
        if (oWorkflowContext && aApproversContext.length) {
            bStatus = true;
            console.log(sCurrentStatus)
            const sSubmitText = sCurrentStatus === Constant.Status.PUSH_BACK ? "resubmitted" : "submitted";

            await oTx.run(INSERT.into("ZLOG").entries({
                TIMESTAMP: new Date(),
                RECORD_ID: `${sId}`,
                PROGRAM: 'WORKFLOW',
                MESSAGE_TYPE: 'A',
                STATUS_CODE: '200',
                MESSAGE: `${sId} is ${sSubmitText}.`
            }));
        }

        return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Workflow Started', aApproversContextNew[0].LEVEL === 0 ? true : false);

    }),

        srv.on('processApproval', async req => {
            console.log("Request Payload: ", req.data);
            const {
                Id: sId,
                UserId: sUserId,
                ApproverAction: sAction,
                Comments: sComments,
                RejectionReason: sRejectionReason
            } = req.data.request

            const oDescriptor = resolveDocDescriptor(sId);
            let bStatus = true;

            const oTx = cds.tx(req)
            // const sActionValue = actionValues[sAction]
            const oActionDescriptor = resolveActionDescriptor(sAction);
            if (!oActionDescriptor) {
                throw new Error(`Unsupported workflow action: ${sAction}`);
            }
            console.log("ActionDescriptor: ", oActionDescriptor);
            // Verify if Approver is correct approver        
            bStatus = await verifyCorrectApproverForAction(sId, sUserId, oDescriptor);
            if (!bStatus) {
                //Return error message
                throw new Error(`Invalid Approver ${sUserId} for Document ${sId}`);
            }
            console.log("Approver Validation: ", bStatus);
            // Check if approver is last level approver
            const oLastLevelApproverStatus = await determineLastApproverLevel(sId, sUserId, oDescriptor);

            console.log("Final Approver Context: ", oLastLevelApproverStatus);
            // Once Approver is validated, perform action
            console.log("Rejection Reason: ", sRejectionReason);
            bStatus = await updateApproverDetailsTable(oTx, sId, sUserId, oActionDescriptor, sComments, sRejectionReason, oDescriptor);
            if (!bStatus) {
                //Return error message
                throw new Error(`Error Encountered during action: ${sAction} for Document ${sId}`);
            }
            console.log("Approver Action Completed: ", bStatus);

            // If approver is final level approver or if action is REJECT/PUSH BACK, perform budget checking
            if (oActionDescriptor.actionValue == Constant.Status.REJECTED || oActionDescriptor.actionValue == Constant.Status.PUSH_BACK || oLastLevelApproverStatus.SUCCESS) {
                const aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, oActionDescriptor.budgetActionValue);
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
            await updateUsedEntitlementAmount(sId, oActionDescriptor.actionValue, oTx);

            // Update ZCLAIM_HEADER / ZREQUEST_HEADER with the status, timestamp and Reject Reason if necessary
            if (oActionDescriptor.actionValue == Constant.Status.REJECTED || oActionDescriptor.actionValue == Constant.Status.PUSH_BACK || (oLastLevelApproverStatus.SUCCESS && oLastLevelApproverStatus.ISLASTLEVEL)) {
                const sStatus = await UpdateHeader.updateApproverActionToHeader(sId, oActionDescriptor.actionValue, oTx);
                console.log("Header table update: ", sStatus);
            }

        // Notify claimant/next level approver
        // If action is REJECT/PUSH BACK, notify claimant
        // If action is APPROVE, notify next level approver
        // If action is APPROVE and there are no next level approver, notify claimant
        // Retrieve Reject reason description if rejection reason is provided
        let sRejectionReasonDesc = null;
        if(sAction === Constant.Status.REJECTED || sAction === Constant.Status.PUSH_BACK){
            sRejectionReasonDesc = await retrieveRejectReasonDesc(sRejectionReason);
            if(!sRejectionReasonDesc) {
                throw new Error('Rejection reason is required for rejection or push back action');
            }
            console.log("sRejectionReasonDesc: ", sRejectionReasonDesc);
            try {
                await updateCorpoCardAdvance(oTx, sId, oActionDescriptor.actionValue);
            } catch (oAdvErr) {
                console.error("Failed to update corpo card advance:", oAdvErr);
                throw new Error('Error encountered during Corporate Card Advance update');
            }
            bStatus = await sendEmailToClaimant(sId, sUserId, oDescriptor, oActionDescriptor.emailAction, sComments, sRejectionReasonDesc);
        } 
        else if(sAction === Constant.Status.APPROVED && oLastLevelApproverStatus.ISLASTLEVEL) {
            //trigger final approval process to send batch claim to IS 
            console.log("Final approval Start");
            const oSendClaimBatch = await sendClaimBatch(sId);
            console.log("Final Approval: ", oSendClaimBatch);

            try {
                await updateCorpoCardAdvance(oTx, sId, oActionDescriptor.actionValue);
            } catch (oAdvErr) {
                console.error("Failed to update corpo card advance:", oAdvErr);
                throw new Error('Error encountered during Corporate Card Advance update');
            }

            // Once a Corporate Credit Card request is fully approved, notify the cardholder(s)
            if (sAction === Constant.Status.APPROVED && sId.slice(0, 3) === Constant.WorkflowType.REQUEST) {
                console.log("Sending final approve CCC email")
                await notifyCardholdersOfRequestApproval(oTx, sId);
                await notifyCCCMakerOfApproval(oTx, sId, sUserId);

                const aFinalApprovalPayload = await buildFinalApprovalPayloadForCCC(oTx, sId);
                console.log("Final approval payload:", JSON.stringify(aFinalApprovalPayload));

            }
            bStatus = await sendEmailToClaimant(sId, sUserId, oDescriptor, oActionDescriptor.emailAction, sComments, sRejectionReasonDesc);
        }
        else {
            const aApproversContext = await getApproverContextByLevel(sId, oDescriptor, oLastLevelApproverStatus.NEXTLEVEL)
            console.log("Approver context for next level approver: ", aApproversContext);
            try {
                await updateCorpoCardAdvance(oTx, sId, oActionDescriptor.actionValue);
            } catch (oAdvErr) {
                console.error("Failed to update corpo card advance:", oAdvErr);
                throw new Error('Error encountered during Corporate Card Advance update');
            }
            bStatus = await sendEmailToApprover(aApproversContext, sId, oDescriptor, Constant.ApprovalEmailAction.ACTION_NOTIFY, oLastLevelApproverStatus.NEXTLEVEL)
        }
        if(!bStatus) {
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

                const sMessage = `${sId} is ${sActionText} by ${oUser?.NAME ?? sUserId}${sCommentText}.`;

                await oTx.run(
                    INSERT.into("ZLOG").entries({
                        TIMESTAMP: new Date(),
                        RECORD_ID: sId,
                        PROGRAM: 'WORKFLOW',
                        MESSAGE_TYPE: 'A',
                        STATUS_CODE: Constant.StatusCode.SUCCESS,
                        MESSAGE: sMessage
                    })
                );
            }

            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Approver Process Completed');
        })
}
