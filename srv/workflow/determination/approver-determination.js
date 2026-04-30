const cds = require('@sap/cds')
const { SELECT } = require('@sap/cds/lib/ql/cds-ql')
const { Constant } = require("../../utils/constant");

const aEntityTableByPrefix = {
    [Constant.WorkflowType.CLAIM]   : {
        entityPrefix    : Constant.WorkflowType.CLAIM,
        entityHeader    : cds.entities['eclaim_srv.ZCLAIM_HEADER'],
        entityItem      : cds.entities['eclaim_srv.ZCLAIM_ITEM'],
        entityApprovers : cds.entities['eclaim_srv.ZAPPROVER_DETAILS_CLAIMS'],
        idField         : Constant.EntitiesFields.CLAIMID,
        typeField       : Constant.EntitiesFields.SUBMISSION_TYPE 
    },
    [Constant.WorkflowType.REQUEST] : {
        entityPrefix    : Constant.WorkflowType.REQUEST,
        entityHeader    : cds.entities['eclaim_srv.ZREQUEST_HEADER'],
        entityItem      : cds.entities['eclaim_srv.ZREQUEST_ITEM'],
        entityApprovers : cds.entities['eclaim_srv.ZAPPROVER_DETAILS_PREAPPROVAL'],
        idField         : Constant.EntitiesFields.REQUESTID,
        typeField       : Constant.EntitiesFields.REQUEST_TYPE_ID
    }
}

function resolveDocDescriptor(sId) {
    const sPrefix = sId.slice(0,3);

    const oDescriptor = aEntityTableByPrefix[sPrefix]
    //console.log('[workflow-determination/resolveDocDescriptor] oDescriptor:', oDescriptor)
    return oDescriptor
}

async function determineApprovers(oTx, sId, oWorkflowContext) {

    //1. Retrieve Workflow Step from Workflow Context
    //2. Check if Workflow Step is AUTO. If yes, populate ApproverContext
    //3. If Workflow Step is not AUTO, retrieve claimant details (department | role | direct superior)
    //4. Retrieve role hierarchy from ZROLEHIERARCHY table
    //5. Compare claimant role against Workflow Step role. If claimant role is higher than current Workflow Step role, increase required role rank by 1
    //6. Iterate search for approver with role rank equal to or higher than required role rank based on claimant direct superior
    
    //Special cases:
    //required role not found in ZROLEHIERARCHY table - retrieve from ZCONSTANT table
    //claimant is CEO - all required roles are to be replaced with CEO_FI role
    //claimant is high ranking, not able to get all level of approvers (Eg CXO role needs approvers HOS -> CXO, will only be converted to one approver, CEO)

    //Post approver determination
    //1. Check for and remove duplicate approvers and delete
    //2. Check for and remove approvers where the claimant is included (Possible when using ZCONSTANT table special approver)
    //3. Refactor approver levels - including group approvers
    
    //Save Approver Contexts in ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL if Approver Context has at least 1 approver
    //If Approver Context has 0 approvers, throw error

    const oDescriptor = resolveDocDescriptor(sId);
    if (!oDescriptor) {
        return null
    }

    const oWorkflowStep = await determineWorkflowStep(oTx, oWorkflowContext.OUTCOME_WORKFLOW_CODE)
    

    return ({
        APPROVER : "test"
    });
}
module.exports = { determineApprovers }