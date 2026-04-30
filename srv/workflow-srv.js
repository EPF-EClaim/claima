const cds = require('@sap/cds');
const { Constant } = require("./utils/constant");
const approve = require("./workflow/action/workflow-approve");
const reject = require("./workflow/action/workflow-reject");
const pushback = require("./workflow/action/workflow-pushback");
//const notification = require("/workflow/notification");
const { determineWorkflow } = require("./workflow/determination/determination-workflow");
const { determineApprovers } = require("./workflow/determination/determination-approver");

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

        // Get the appropriate table based on id prefix
        const sApproverDetailsTable = resolveApproverTable(sId);
        if(!sApproverDetailsTable) {
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
        const aApprovers = await determineApprovers(oTx, sId, oWorkflowContext)
        console.log('[workflow-srv] aApprovers:', aApprovers)
        if(!aApprovers.length) {
            req.reject(400, "No approvers determined");
        }
        // 3. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
        //for (const oApprover of aApprovers) {
        //    await oTx.run(
        //        INSERT.into(sApproverDetailsTable).entries({
        //            CLAIM_ID                : sId,
        //            LEVEL                   : oApprover.LEVEL,
        //            APPROVER_ID             : oApprover.APPROVER_ID,
        //            SUBSTITUTE_APPROVER_ID  : oApprover.SUBSTITUTE_APPROVER_ID,
        //            STATUS                  : oApprover.STATUS
        //        })
        //    )
        //}

        // 4. Notify claimant/approver
        //await notification.approver-notification(oTx, sId, aApprovers[0])
        
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
