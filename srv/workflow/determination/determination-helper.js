const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
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
async function determineWorkflowStepContext(oTx, sOutcomeWorkflowCode, oDescriptor) {
    return oTx.run(
        SELECT
            .one
            .from(cds.entities['eclaim_srv.ZWORKFLOW_STEP'])
            .where({
                [Constant.EntitiesFields.WORKFLOW_CODE] : sOutcomeWorkflowCode,
                [Constant.EntitiesFields.WORKFLOW_TYPE] : oDescriptor.entityPrefix
            })
            .columns(
                Constant.EntitiesFields.WORKFLOW_CODE,
                Constant.EntitiesFields.WORKFLOW_NAME,
                Constant.EntitiesFields.WORKFLOW_APPROVAL_LEVELS
            )
    )
}
async function retrieveRoleRank(oTx, sRole) {

    const sRoleHierarchyTable = cds.entities['eclaim_srv.ZROLEHIERARCHY'];

    let sQuery = SELECT
        .from(sRoleHierarchyTable)
        .columns(
                Constant.EntitiesFields.ROLE,
                Constant.EntitiesFields.RANK
        );
    if(sRole) {
        sQuery = sQuery.where({
            [Constant.EntitiesFields.ROLE]  : sRole
        });
    }
    return await oTx.run(sQuery)
}
async function retrieveHeaderDetails(oTx, sId, oDescriptor) {
    
    const oHeader =  await oTx.run(
        SELECT
            .one
            .from(oDescriptor.entityHeader)
            .columns(   oDescriptor.idField,
                        oDescriptor.typeField,
                        Constant.EntitiesFields.EMP_ID,
                        Constant.EntitiesFields.COST_CENTER,
                        Constant.EntitiesFields.ALTERNATE_COST_CENTER
            )
            .where( { [oDescriptor.idField]:sId })
    );
    
    return oHeader;
}
async function retrieveEmployeeDetails(oTx, sId, sEmail){

    const sEmpMasterTable = cds.entities['eclaim_srv.ZEMP_MASTER'];
    let sWhereClause;
    if(sId && sEmail) {
        sWhereClause = {
            [Constant.EntitiesFields.EEID]      : sId,
            [Constant.EntitiesFields.EMAIL]     : sEmail
        }
    }
    else if(sId) {
        sWhereClause = {
            [Constant.EntitiesFields.EEID]  : sId
        };
    }
    else if(sEmail) {
        sWhereClause = {
            [Constant.EntitiesFields.EMAIL]     : sEmail
        };
    }    
    return await oTx.run(
        SELECT  
            .one
            .from(sEmpMasterTable)
            .where(sWhereClause)
            .columns(
                Constant.EntitiesFields.EEID,
                Constant.EntitiesFields.NAME,
                Constant.EntitiesFields.DEP,
                Constant.EntitiesFields.EMAIL,
                Constant.EntitiesFields.DIRECT_SUPERIOR,
                Constant.EntitiesFields.ROLE,
            )
    )
}
async function retrieveFromConstantTable(oTx, sId){

    return await oTx.run(
        SELECT  
            .from(cds.entities['eclaim_srv.ZCONSTANTS'])
            .where({
                [Constant.EntitiesFields.ID]  : sId
            })
            .columns(
                Constant.EntitiesFields.VALUE,
            )
    )
}
async function retrieveApprover(oTx, sEEID, iApproverRank, idepth = 0) {
    // Safety: stop infinite recursion
    if (idepth > 20) {
        return null;
    }

    // Fetch employee
    const oEmp = await retrieveEmployeeDetails(oTx, sEEID);
    if (!oEmp) return null;

    // If employee has no superior → stop
    if (!oEmp[Constant.EntitiesFields.DIRECT_SUPERIOR]) {
        return null;
    }

    // Fetch direct superior
    const oDirectSuperior = await retrieveEmployeeDetails(oTx, oEmp[Constant.EntitiesFields.DIRECT_SUPERIOR]);
    if (!oDirectSuperior) return null;

    // CEO check
    if (oDirectSuperior[Constant.EntitiesFields.ROLE] === Constant.Role.CEO) {
        return oDirectSuperior;
    }

    if (oDirectSuperior.RANK >= iApproverRank) {
        return oDirectSuperior; // ✅ Found the correct manager
    }

    // Otherwise recurse deeper up the chain
    return await this.retrieveApprover(oTx, oDirectSuperior[Constant.EntitiesFields.EEID], iApproverRank, idepth + 1);
}
async function retrieveBudgetDetails(oTx, sCostCenter, sYear) {
    let oData = null;
    let oBudgetContext = null;

    // Main table path
    const sBudgetTablePath = cds.entities['eclaim_srv.ZBUDGET'];
    let sEEID = "";

    // Fetch data
    oBudgetContext = await oTx.run(
        SELECT
            .one
            .from(sBudgetTablePath)
            .where({
                [Constant.EntitiesFields.FUND_CENTER]   : sCostCenter,
                [Constant.EntitiesFields.YEAR]          : sYear
            })
            .columns(
                Constant.EntitiesFields.YEAR,
                Constant.EntitiesFields.INTERNAL_ORDER,
                Constant.EntitiesFields.COMMITMENT_ITEM,
                Constant.EntitiesFields.FUND_CENTER,
                Constant.EntitiesFields.MATERIAL_GROUP,
                Constant.EntitiesFields.BUDGET_OWNER_ID
            )
    )
    if(!oBudgetContext){
        return null;
    }
    const oBudgetOwnerContext = await this.retrieveEmployeeDetails(oTx, '', oBudgetContext[Constant.EntitiesFields.BUDGET_OWNER_ID])
    if (oBudgetOwnerContext){
        sEEID = oBudgetOwnerContext[Constant.EntitiesFields.EEID];
    }
    
    // Return only the required fields
    return {
        YEAR:               oBudgetContext[Constant.EntitiesFields.YEAR],
        INTERNAL_ORDER:     oBudgetContext[Constant.EntitiesFields.INTERNAL_ORDER],
        COMMITMENT_ITEM:    oBudgetContext[Constant.EntitiesFields.COMMITMENT_ITEM],
        FUND_CENTER:        oBudgetContext[Constant.EntitiesFields.FUND_CENTER],
        MATERIAL_GROUP:     oBudgetContext[Constant.EntitiesFields.MATERIAL_GROUP],
        BUDGET_OWNER_EMAIL: oBudgetContext[Constant.EntitiesFields.BUDGET_OWNER_ID],
        BUDGET_OWNER_ID:    sEEID
    };
}

module.exports = { 
    resolveDocDescriptor,
    determineWorkflowStepContext,
    retrieveRoleRank,
    retrieveHeaderDetails,
    retrieveEmployeeDetails,
    retrieveFromConstantTable,
    retrieveApprover,
    retrieveBudgetDetails
};