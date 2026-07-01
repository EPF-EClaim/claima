const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");
const {
    retrieveEmployeeDetails
} = require("../../workflow/workflow-helper");

const WORKFLOW_RULE_COLUMNS = [
    Constant.EntitiesFields.CLAIM_TYPE_ID,
    Constant.EntitiesFields.RISK_LEVEL,
    Constant.EntitiesFields.THRESHOLD_AMOUNT,
    Constant.EntitiesFields.THRESHOLD_VALUE,
    Constant.EntitiesFields.RECEIPT_DAY,
    Constant.EntitiesFields.RECEIPT_AGE,
    Constant.EntitiesFields.EMPLOYEE_COST_CENTER,
    Constant.EntitiesFields.CASH_ADVANCE,
    Constant.EntitiesFields.TRIP_START_DATE,
    Constant.EntitiesFields.OUTCOME_WORKFLOW_CODE,
    Constant.EntitiesFields.ROLE,
    Constant.EntitiesFields.DIVISION,
    Constant.EntitiesFields.LOCATION_TYPE
];
async function determineWorkflowStepContext(oTx, sOutcomeWorkflowCode, oDescriptor) {
    return cds.run(
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


async function retrieveFromConstantTable(oTx, sId){

    return await cds.run(
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
async function retrieveApprover(sEEID, iApproverRank, idepth = 0) {
    // Safety: stop infinite recursion
    if (idepth > 20) {
        return null;
    }

    // Fetch employee
    const oEmp = await retrieveEmployeeDetails(sEEID);
    if (!oEmp) return null;

    // If employee has no superior → stop
    if (!oEmp[Constant.EntitiesFields.DIRECT_SUPERIOR]) {
        return null;
    }

    // Fetch direct superior
    const oDirectSuperior = await retrieveEmployeeDetails(oEmp[Constant.EntitiesFields.DIRECT_SUPERIOR]);
    if (!oDirectSuperior) return null;

    // CEO check
    if (oDirectSuperior[Constant.EntitiesFields.ROLE] === Constant.Role.CEO) {
        return oDirectSuperior;
    }

    if (oDirectSuperior.RANK >= iApproverRank) {
        return oDirectSuperior; // ✅ Found the correct manager
    }

    // Otherwise recurse deeper up the chain
    return await retrieveApprover(oDirectSuperior[Constant.EntitiesFields.EEID], iApproverRank, idepth + 1);
}
async function retrieveBudgetDetails(sCostCenter, sYear) {
    let oBudgetContext = null;

    // Main table path
    const sBudgetTablePath = cds.entities['eclaim_srv.ZBUDGET'];
    const sCostCenterSafe = String(sCostCenter);
    const sYearSafe = String(sYear);
    let sEEID = "";

    // Fetch data
    console.log("Start Budget check");
    oBudgetContext = await cds.run(
        SELECT
            .one
            .from(sBudgetTablePath)
            .where({
                [Constant.EntitiesFields.FUND_CENTER]   : sCostCenterSafe,
                [Constant.EntitiesFields.YEAR]          : sYearSafe
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
    const oBudgetOwnerContext = await retrieveEmployeeDetails(null, oBudgetContext[Constant.EntitiesFields.BUDGET_OWNER_ID])
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
async function retrieveProjectOwnerDetails(sProjectCode, sYear){
    let oBudgetContext = null;

    // Main table path
    const sBudgetTablePath = cds.entities['eclaim_srv.ZBUDGET'];
    const sProjectCodeSafe = String(sProjectCode);
    const sYearSafe = String(sYear);
    let sEEID = "";

    // Fetch data
    console.log("Start Project Code check");
    oBudgetContext = await cds.run(
        SELECT
            .one
            .from(sBudgetTablePath)
            .where({
                [Constant.EntitiesFields.FUND_CENTER]   : sProjectCodeSafe,
                [Constant.EntitiesFields.YEAR]          : sYearSafe
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
    const oProjectOwnerContext = await retrieveEmployeeDetails(null, oBudgetContext[Constant.EntitiesFields.BUDGET_OWNER_ID])
    if (oProjectOwnerContext){
        sEEID = oProjectOwnerContext[Constant.EntitiesFields.EEID];
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
function populateApproverDetails(oApproverDetails, iLevel) {
    if(!oApproverDetails) return null;
        return {
            EEID: oApproverDetails.EEID,
            NAME: oApproverDetails.NAME,
            EMAIL: oApproverDetails.EMAIL,
            LEVEL: Number(iLevel) + 1,
            GROUP: Number(iLevel) + 1
        };
}
function normalizeApproversByGroup(aApproversDetails, oClaimantDetails) {
    // 1. Remove duplicate approvers
    // 2. Remove approvers who is the claimant
    // 3. Renumber levels after operation
    const oSeen = new Set();
    let iLevel = 0;
    let aUniqueApproversDetails = [];
    let aResult = [];
    oSeen.add(oClaimantDetails.EEID);
    for (const oApprover of aApproversDetails){
        if(!oSeen.has(oApprover.EEID)){
            oSeen.add(oApprover.EEID);
            aUniqueApproversDetails.push(oApprover);
        }
    }

    // Group by GROUP (Preserve order)
    const mGroupMap = new Map();
    for(oApprover of aUniqueApproversDetails) {
        if(!mGroupMap.has(oApprover.GROUP)) {
            mGroupMap.set(oApprover.GROUP, []);
        }
        mGroupMap.get(oApprover.GROUP).push(oApprover);
    }

    iLevel = 0;
    //Renumber LEVEL per GROUP
    for(const [, aApproversInGroup] of mGroupMap) {
        iLevel += 1 ;
        for(const oApprover of aApproversInGroup) {
            oApprover.LEVEL = iLevel;
            aResult.push(oApprover);
        }
    }
    return aResult;
}
async function retrieveSubstitute(sApproverEEID, dDate = new Date()) {
    
    // Main table path
    const sSubstitutionRulesTablePath = Constant.Entities.ZEMP_SUBSTITUTION_RULE;
    // Convert to ISO date string (YYYY-MM-DD)
    const dToday = dDate.toISOString().split("T")[0];
    const oSubstituteContext = await cds.run
        (SELECT.one
            .from(sSubstitutionRulesTablePath)
            .where({
                [Constant.EntitiesFields.USER_ID]           : sApproverEEID,
                [Constant.EntitiesFields.VALID_FROM]        : { '<=' : dToday},
                [Constant.EntitiesFields.VALID_TO]          : { '>=' : dToday}
            })
            .columns(
                Constant.EntitiesFields.USER_ID,
                Constant.EntitiesFields.SUBSTITUTE_ID
            )
        );
    if(!oSubstituteContext) {
        return null;
    }
    return oSubstituteContext.SUBSTITUTE_ID
}
function setApproversContext(oDescriptor, sId, aApproversContext) {
    let aApproversContextNew = [];
    for (const oApprover of aApproversContext) {
        let sStatus = "";
        let iLevel = Number(oApprover.LEVEL) || 0;
        let dProcessTimestamp = null;

        // If item is auto approval, set the timestamp for approval
        if(iLevel == 0) {
            sStatus = Constant.Status.APPROVED;
            dProcessTimestamp = new Date();
        }
        else if(iLevel == 1) {
            sStatus = Constant.Status.PENDING_APPROVAL;
        }
        aApproversContextNew.push({
            [oDescriptor.approverIdField]   : sId,
            LEVEL                           : oApprover.LEVEL,
            APPROVER_ID                     : oApprover.APPROVER_EEID,
            SUBSTITUTE_APPROVER_ID          : oApprover.SUB_EEID,
            STATUS                          : sStatus,
            PROCESS_TIMESTAMP               : dProcessTimestamp

        });
    }

    return aApproversContextNew;
}
/**
 * Deletes Approver Details based on Table name and Claim ID / Preapproval ID field
 * @public
 * @param {String} sTableName - Table name to delete records from;
 * @param {String} sKeyName - Claim ID field name;
 * @param {String} sClaimID - Claim ID / Preapproval ID;
 * @param {Array} tx - CDS call;
 * @returns {String} sResult - Result of deletion of records
 */
async function deleteApproverDetails(sTableName, sKeyName, sClaimID, oTx) {

    sResult = await oTx.run(
        DELETE.from(sTableName).where({ [sKeyName]: sClaimID })
    )
    return sResult;
}
/**
 * Inserts Records into table
 * @public
 * @param {String} sTableName - Table name for records to be inserted;
 * @param {Array} aRecordDetails - Array of records to be inserted;
 * @param {Array} oTx - CDS call;
 * @returns {String} sResult - Result of Insertion of records
 */
async function insertRecords(sTableName, aRecordDetails, oTx) {
    sResult = await oTx.run(
        INSERT(aRecordDetails).into(sTableName)
    )
    return sResult;
}

async function retrieveWorkflowByClaimTypeRoleAndDivision(sId, oDescriptor, sEmpId) {
    
    const oToday = new Date()

    const oEmp = await retrieveEmployeeDetails(sEmpId);

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(sId,oDescriptor);

    if(!oWorkflowRequestType){
        return null
    }
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await cds.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.CLAIM_TYPE_ID]     : oWorkflowRequestType.claimTypeId,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday},
                    [Constant.EntitiesFields.ROLE]              : oEmp[Constant.EntitiesFields.ROLE],   
                    [Constant.EntitiesFields.DIVISION]          : oEmp[Constant.EntitiesFields.DIVISION]
                })
                .columns(...WORKFLOW_RULE_COLUMNS)
        )
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
    
}
async function retrieveWorkflowByClaimTypeAndDivision(sId, oDescriptor, sEmpId) {
    
    const oToday = new Date()

    const oEmp = await retrieveEmployeeDetails(sEmpId);

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(sId,oDescriptor);

    if(!oWorkflowRequestType){
        return null
    }
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await cds.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.CLAIM_TYPE_ID]     : oWorkflowRequestType.claimTypeId,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday},
                    [Constant.EntitiesFields.DIVISION]          : oEmp[Constant.EntitiesFields.DIVISION]
                })
                .columns(...WORKFLOW_RULE_COLUMNS)
        )
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
    
}
async function retrieveWorkflowByClaimTypeAndRole(sId, oDescriptor, sEmpId) {
    
    const oToday = new Date()

    const oEmp = await retrieveEmployeeDetails(sEmpId);

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(sId,oDescriptor);

    if(!oWorkflowRequestType){
        return null
    }
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await cds.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.CLAIM_TYPE_ID]     : oWorkflowRequestType.claimTypeId,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday},
                    [Constant.EntitiesFields.ROLE]              : oEmp[Constant.EntitiesFields.ROLE]
                })
                .columns(...WORKFLOW_RULE_COLUMNS)
        )
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
    
}
async function retrieveWorkflowByClaimType(sId, oDescriptor) {
    const oToday = new Date()

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(sId,oDescriptor);

    if(!oWorkflowRequestType){
        return null
    }
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await cds.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.CLAIM_TYPE_ID]     : oWorkflowRequestType.claimTypeId,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday}
                })
                .columns(...WORKFLOW_RULE_COLUMNS)
        )
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
}
async function retrieveWorkflowByDefault(sId, oDescriptor) {
    const oToday = new Date()

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(sId,oDescriptor);

    if(!oWorkflowRequestType){
        return null
    }
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await cds.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday}
                })
                .columns(...WORKFLOW_RULE_COLUMNS)
        )
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
}
async function normalizeWorkflowRequestType(sId, oDescriptor) {
    if(oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        const oWorkflowRequestType = await cds.run(
            SELECT
                .one
                .from(oDescriptor.entityHeader)
                .where({
                    [oDescriptor.idField]   : sId
                })
                .columns(   Constant.EntitiesFields.SUBMISSION_TYPE,
                            Constant.EntitiesFields.CLAIM_TYPE_ID
                )
        )
        if(!oWorkflowRequestType) {
            return null;
        }
        else{
            return {
                workflowRequestType : oWorkflowRequestType[Constant.EntitiesFields.SUBMISSION_TYPE],
                claimTypeId         : oWorkflowRequestType[Constant.EntitiesFields.CLAIM_TYPE_ID]
            };
        }
    } 
    if(oDescriptor.entityPrefix === Constant.WorkflowType.REQUEST) {
        const oWorkflowRequestType = await cds.run(
            SELECT
                .one
                .from(oDescriptor.entityHeader)
                .where({
                    [oDescriptor.idField]   : sId
                })
                .columns(   Constant.EntitiesFields.REQUEST_TYPE_ID,
                            Constant.EntitiesFields.CLAIM_TYPE_ID
                )
        )
        if(!oWorkflowRequestType) {
            return null;
        }
        else{
            return {
                workflowRequestType : oWorkflowRequestType[Constant.EntitiesFields.REQUEST_TYPE_ID],
                claimTypeID         : oWorkflowRequestType[Constant.EntitiesFields.CLAIM_TYPE_ID]
            };
        }
    }
    return null;
}
module.exports = { 
    determineWorkflowStepContext,
    retrieveFromConstantTable,
    retrieveApprover,
    retrieveBudgetDetails,
    retrieveProjectOwnerDetails,
    populateApproverDetails,
    normalizeApproversByGroup,
    retrieveSubstitute,
    setApproversContext,
    deleteApproverDetails,
    insertRecords,
    retrieveWorkflowByClaimTypeAndRole,
    normalizeWorkflowRequestType,
    retrieveWorkflowByDefault,
    retrieveWorkflowByClaimTypeRoleAndDivision,
    retrieveWorkflowByClaimTypeAndDivision,
    retrieveWorkflowByClaimType    
};