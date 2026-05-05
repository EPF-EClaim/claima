// Require START
const cds = require('@sap/cds');
const { Constant } = require("./utils/constant");
const approve = require("./workflow/action/workflow-approve");
const reject = require("./workflow/action/workflow-reject");
const pushback = require("./workflow/action/workflow-pushback");
const eclaim_srv = require('./eclaim_srv');
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
    generateReturnMessage
} = require('./workflow/workflow-helper');
const {
    sendEmailToClaimant
} = require('./workflow/notification/notification-claimant');
const {
    sendEmailToApprover
} = require('./workflow/notification/notification-approver');
const { message } = require('@sap/cds/lib/log/cds-error');

const actionHandlers = {
    [Constant.ApproverActions.APPROVE]     : approve,
    [Constant.ApproverActions.REJECT]      : reject,
    [Constant.ApproverActions.PUSHBACK]    : pushback
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
            req.reject(400, `Prefix not found for document: ${sId}`);
        }

        //1. Determine workflow
        const oWorkflowContext = await determineWorkflow(oTx, sId);
        //console.log('[workflow-srv] oWorkflowContext:', oWorkflowContext)
        if(!oWorkflowContext) {
            req.reject(400, "No workflow rule matched");
        }
        console.log('[workflow-srv] oWorkflowContext:', oWorkflowContext)
        //2. Determine approvers and substitutes
        const aApproversContext = await determineApprovers(oTx, sId, oWorkflowContext)
        console.log('[workflow-srv] aApproversContext:', aApproversContext)
        if(!aApproversContext.length) {
            req.reject(400, "No approvers determined");
        }
        else {
            console.log("Approver Determined for document: ", sId)
        }

        //3. Perform budget checking for auto approve
        
        if(aApproversContext[0].LEVEL == 0) {
            aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, Constant.ApproverActions.APPROVE);
            console.log("aBudgetContext: ", aBudgetContext);
            aReturn = await eclaim_srv.performBudgetChecking(oTx, aBudgetContext);
        }
        const oReturn = aReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND);
        if(oReturn) {
            bStatus = false;
            return generateReturnMessage(bStatus, sId, 'Budget Checking', Constant.BudgetCheckStatus.NOT_FOUND)
        }
        //   If successful, update Header table with approved status and timestamp
        sStatus = await UpdateHeader.updateApproverActionToHeader(sId, Constant.Status.APPROVED, oTx);

        //4. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
        const aApproversContextNew = setApproversContext(oDescriptor, sId, aApproversContext);
        if(!aApproversContextNew.length) {
            bStatus = false;
            return generateReturnMessage(bStatus, sId, 'Approver Determination', 'Approver not found')
        }
        const sDelete = await deleteApproverDetails(oDescriptor.entityApprovers, oDescriptor.approverIdField, sId, oTx);
        const sInsert = await insertRecords(oDescriptor.entityApprovers, aApproversContextNew, oTx);
        console.log(sDelete);
        console.log(sInsert);

        //5. Notify claimant/approver
        //If workflow is AUTO, send email to claimant to inform claimant that claim has been auto approved
        //Else, send email to approver 1 to inform approver that claim is awaiting approver action
        let sStatus = '';
        if(aApproversContextNew[0].LEVEL == 0) {
            //sStatus = await sendEmailToClaimant(oTx, aApproversContext, sId, oDescriptor, Constant.ApprovalProcessAction.ACTION_APPROVE);
        }
        else {
            //sStatus = await sendEmailToApprover(oTx, aApproversContext, sId, oDescriptor, Constant.ApprovalProcessAction.ACTION_NOTIFY);
        }

        return {
            success         : sStatus,
            documentID      : sId,
            documentPrefix  : oDescriptor.entityPrefix,
            workflowCode    : oWorkflowContext.OUTCOME_WORKFLOW_CODE,
            area            : 'EndWorkflow',
            message         : 'Workflow successfully started'  
        };
        
    }),
    srv.on('processApproval', async req => {
        const { sId, sAction, sComments, sRejectionReason } = req.data.request
        const oTx = cds.tx(req)

        const aHandler = actionHandlers[sAction]

        if(!aHandler) {
            req.reject(400, `Unsupported workflow action: ${sAction}`)
        }
        await aHandler({
            oTx, 
            sId,
            sComments,
            sRejectionReason
        })
    })
}
