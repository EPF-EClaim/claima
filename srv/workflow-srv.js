const cds = require('@sap/cds');
const { Constant } = require("./utils/constant");
const approve = require("./workflow/action/workflow-approve");
const reject = require("./workflow/action/workflow-reject");
const pushback = require("./workflow/action/workflow-pushback");
//const notification = require("/workflow/notification");
const { determineWorkflow } = require("./workflow/determination/determination-workflow");
const { determineApprovers } = require("./workflow/determination/determination-approver");
const { setApproversContext } = require("./workflow/determination/determination-helper");
const { 
    deleteApproverDetails,
    insertRecords
} = require('./workflow/determination/determination-helper');
const {
    resolveDocDescriptor
} = require('./workflow/workflow-helper');

const actionHandlers = {
    [Constant.ApproverActions.APPROVE]     : approve,
    [Constant.ApproverActions.REJECT]      : reject,
    [Constant.ApproverActions.PUSHBACK]    : pushback
}

const aApproverTableByPrefix = {
    [Constant.WorkflowType.CLAIM]   : Constant.Entities.ZAPPROVER_DETAILS_CLAIMS,
    [Constant.WorkflowType.REQUEST] : Constant.Entities.ZAPPROVER_DETAILS_PREAPPROVAL
}
    
module.exports = (srv) => {

    /**
     * Get approver details table based on id prefix
     * @public
     * @param {String} id - id of the document. It could be either claims or request
     * @returns {String} If Success, returns the name of the approver details table. If Fail, return empty string
     */
    function resolveApproverTable(id) {
        const prefix = id.slice(0,3);
        const sApproverDetailsTable = aApproverTableByPrefix[prefix]

        if(!sApproverDetailsTable) {
            sApproverDetailsTable = "";
        }

        return sApproverDetailsTable;
    }
    srv.on('startWorkflow', async req => {
        const oTx = cds.tx(req)

        const { id : sId } = req.data

        const oDescriptor = resolveDocDescriptor(sId);
        if (!oDescriptor) {
            req.reject(400, `Prefix not found for document: ${sId}`);
        }

        // 1. Determine workflow
        const oWorkflowContext = await determineWorkflow(oTx, sId);
        //console.log('[workflow-srv] oWorkflowContext:', oWorkflowContext)
        if(!oWorkflowContext) {
            req.reject(400, "No workflow rule matched");
        }
        console.log('[workflow-srv] oWorkflowContext:', oWorkflowContext)
        // 2. Determine approvers and substitutes
        const aApproversContext = await determineApprovers(oTx, sId, oWorkflowContext)
        console.log('[workflow-srv] aApproversContext:', aApproversContext)
        if(!aApproversContext.length) {
            req.reject(400, "No approvers determined");
        }
        else {
            console.log("Approver Determined for document: ", sId)
        }
        // 3. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
        const aApproversContextNew = setApproversContext(oDescriptor, sId, aApproversContext);
        const sDelete = await deleteApproverDetails(oDescriptor.approverTable, oDescriptor.approverIdField, sId, oTx);
        const sInsert = await insertRecords(oDescriptor.approverTable, aApproversContextNew, oTx);
        console.log(sDelete);
        console.log(sInsert);

        // 4. Notify claimant/approver
        //If workflow is AUTO, send email to claimant to inform claimant that claim has been auto approved
        //Else, send email to approver 1 to inform approver that claim is awaiting approver action
        if(aApproversContextNew[0].LEVEL == 0) {

        }
        else {

        }
        
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
