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
    setApproversContext 
} = require("./workflow/determination/determination-helper");
const { 
    deleteApproverDetails,
    insertRecords
} = require('./workflow/determination/determination-helper');
const {
    resolveDocDescriptor,
    retrieveBudgetContext,
    generateReturnMessage,
    performBudgetChecking
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
    checkFinalLevelApproverStatus
} = require('./workflow/action/action-helper');
const { message } = require('@sap/cds/lib/log/cds-error');

const actionValues = {
    [Constant.ApproverActions.APPROVE]      : Constant.Status.APPROVED,
    [Constant.ApproverActions.REJECT]       : Constant.Status.REJECTED,
    [Constant.ApproverActions.PUSHBACK]     : Constant.Status.PUSH_BACK
}
const budgetActionValues = {
    [Constant.ApproverActions.APPROVE]      : Constant.ApproverActions.APPROVE,
    [Constant.ApproverActions.REJECT]       : Constant.ApproverActions.REJECT,
    [Constant.ApproverActions.PUSHBACK]     : Constant.ApproverActions.REJECT
}


const aApproverTableByPrefix = {
    [Constant.WorkflowType.CLAIM]   : Constant.Entities.ZAPPROVER_DETAILS_CLAIMS,
    [Constant.WorkflowType.REQUEST] : Constant.Entities.ZAPPROVER_DETAILS_PREAPPROVAL
}

// Require END
    
module.exports = (srv) => {

    srv.on('startWorkflow', async req => {
        const oTx = cds.tx(req)
        const { id : sId } = req.data
        let bStatus = true;
        let aReturn = [];
        const oDescriptor = resolveDocDescriptor(sId);
        let aBudgetContext = [];
        if (!oDescriptor) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `Prefix not found for document: ${sId}`);
        }

        //1. Determine workflow
        const oWorkflowContext = await determineWorkflow(oTx, sId);
        if(!oWorkflowContext) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, 'No workflow rule matched')
        }
        console.log('[workflow-srv] oWorkflowContext:', oWorkflowContext)
        //2. Determine approvers and substitutes
        const aApproversContext = await determineApprovers(oTx, sId, oWorkflowContext)
        if(!aApproversContext.length) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.APPROVER_DETERMINATION, 'No approvers determined')
        }
        //3. Perform budget checking for auto approve
        if(aApproversContext[0].LEVEL == 0) {
            aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, Constant.ApproverActions.APPROVE);
            aReturn = await performBudgetChecking(oTx, aBudgetContext);
            const oReturn = aReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND);
            if(oReturn) {
                bStatus = false;
                return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.BUDGET_CHECKING, 'Error encountered during Budget Checking')
            }
            //   If successful, update Header table with approved status and timestamp
            sStatus = await UpdateHeader.updateApproverActionToHeader(sId, Constant.Status.APPROVED, oTx);
        }

        //4. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
        const aApproversContextNew = setApproversContext(oDescriptor, sId, aApproversContext);
        if(!aApproversContextNew.length) {
            bStatus = false;
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.APPROVER_DETERMINATION, 'Error encountered during Approver Normalization')
        }
        console.log('[workflow-srv] aApproversContextNew:', aApproversContextNew)
        const sDelete = await deleteApproverDetails(oDescriptor.entityApprovers, oDescriptor.approverIdField, sId, oTx);
        const sInsert = await insertRecords(oDescriptor.entityApprovers, aApproversContextNew, oTx);
        console.log(sDelete);
        console.log(sInsert);

        //5. Notify claimant/approver
        //If workflow is AUTO, send email to claimant to inform claimant that claim has been auto approved
        //Else, send email to approver 1 to inform approver that claim is awaiting approver action
        let sStatus = '';
        if(aApproversContextNew[0].LEVEL == 0) {
            sStatus = await sendEmailToClaimant(aApproversContext, sId, oDescriptor, Constant.ApprovalProcessAction.ACTION_APPROVE);
        }
        else {
            sStatus = await sendEmailToApprover(aApproversContext, sId, oDescriptor, Constant.ApprovalProcessAction.ACTION_NOTIFY);
        }
        if(!sStatus) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_NOTIFICATION, 'Error encountered during Workflow Notification')
        }
        console.log('[workflow-srv] sStatus:', sStatus)
        return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, 'Workflow Started');
        
    }),
    srv.on('processApproval', async req => {
        const { 
            Id              : sId = null, 
            UserId          : sUserId = null, 
            Action          : sAction = null, 
            Comments        : sComments = null, 
            RejectionReason : sRejectionReason = null 
        } = req.data.request

        const oDescriptor = resolveDocDescriptor(sId);

        const oTx = cds.tx(req)
        const sActionValue = actionValues[sAction]
        if(!aHandler) {
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_ACTION, `Unsupported workflow action: ${sAction}`);
        }
        const sBudgetActionValue = budgetActionValues[sAction];

        // Verify if Approver is correct approver
        const bStatus = await verifyCorrectApproverForAction(sId, sUserId, oDescriptor);
        if(!bStatus) {
            //Return error message
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_ACTION, `Invalid Approver ${sUserId} for Document ${sId}`);
        }

        // Once Approver is validated, perform action
        bStatus = await updateApproverDetailsTable(oTx, sId, sUserId, sActionValue, sComments, sRejectionReason, oDescriptor);
        if(!bStatus) {
            //Return error message
            return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.WORKFLOW_ACTION, `Error Encountered during action: ${sAction} for Document ${sId}`);
        }

        // Check if approver is final level approver or if action is REJECT/PUSH BACK. If yes, perform budget checking
        const bFinalLevelApprover = await checkFinalLevelApproverStatus(sId, oDescriptor);
        if(sActionValue == Constant.Status.REJECTED || sActionValue == Constant.Status.PUSH_BACK || bFinalLevelApprover) {
            const aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, sBudgetActionValue);
            const aReturn = await performBudgetChecking(oTx, aBudgetContext);
            const oReturn = aReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND);
            if(oReturn) {
                bStatus = false;
                return generateReturnMessage(bStatus, sId, Constant.WorkflowArea.BUDGET_CHECKING, 'Error encountered during Budget Checking')
            }
        }

        // Update ZCLAIM_HEADER / ZREQUEST_HEADER with the timestamp and Reject Reason if necessary
        const sStatus = await UpdateHeader.updateApproverActionToHeader(sId, sActionValue, oTx);

        // Notify claimant/next level approver
        // If action is REJECT/PUSH BACK, notify claimant
        // If action is APPROVE, notify next level approver
        // If action is APPROVE and there are no next level approver, notify claimant

    })
}
