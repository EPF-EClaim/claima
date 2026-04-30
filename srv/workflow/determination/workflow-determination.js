const cds = require('@sap/cds')
const { SELECT } = require('@sap/cds/lib/ql/cds-ql')
const { Constant } = require("../../utils/constant");

const aEntityTableByPrefix = {
    [Constant.WorkflowType.CLAIM]   : {
        entityPrefix    : Constant.WorkflowType.CLAIM,
        entityHeader    : cds.entities['eclaim_srv.ZCLAIM_HEADER'],
        entityItem      : cds.entities['eclaim_srv.ZCLAIM_ITEM'],
        idField         : Constant.EntitiesFields.CLAIMID,
        typeField       : Constant.EntitiesFields.SUBMISSION_TYPE 
    },
    [Constant.WorkflowType.REQUEST] : {
        entityPrefix    : Constant.WorkflowType.REQUEST,
        entityHeader    : cds.entities['eclaim_srv.ZREQUEST_HEADER'],
        entityItem      : cds.entities['eclaim_srv.ZREQUEST_ITEM'],
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

async function fetchHeaderForWorkflow(oTx, sId, oDescriptor) {
    
    const oHeader =  await oTx.run(
        SELECT
            .from(oDescriptor.entityHeader)
            .columns(   oDescriptor.idField,
                        oDescriptor.typeField
            )
            .where( { [oDescriptor.idField]:sId })
    );
    //console.log('[workflow-determination/fetchHeaderForWorkflow] oHeader:', oHeader)
    
    return oHeader;
}

async function fetchItemsForWorkflow(oTx, sId, oDescriptor) {
    
    const aItems = await oTx.run(
        SELECT
            .from(oDescriptor.entityItem)
            .columns(   Constant.EntitiesFields.CLAIM_TYPE_ID,
                        Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID
            )
            .where( { [oDescriptor.idField]:sId })
    );
    //console.log('[workflow-determination/fetchItemsForWorkflow] aItems:', aItems)
   
    return aItems;
}

async function retrieveWorkflowByClaimTypeAndDepartment(oTx, sId, oDescriptor) {
    
    const oToday = new Date()

    const sDepartment = await retrieveDepartment(oTx, sId, oDescriptor);

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(oTx,sId,oDescriptor);
    console.log('[workflow-determination/retrieveWorkflowByClaimType] oWorkflowRequestType:', oWorkflowRequestType)

    if(oWorkflowRequestType){
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await oTx.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.CLAIM_TYPE_ID]     : oWorkflowRequestType.claimTypeId,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday},
                    [Constant.EntitiesFields.DEPARTMENT]        : sDepartment
                })
                .columns(
                    Constant.EntitiesFields.RISK_LEVEL,
                    Constant.EntitiesFields.THRESHOLD_AMOUNT,
                    Constant.EntitiesFields.THRESHOLD_VALUE,
                    Constant.EntitiesFields.RECEIPT_DAY,    
                    Constant.EntitiesFields.RECEIPT_AGE,
                    Constant.EntitiesFields.EMPLOYEE_COST_CENTER,
                    Constant.EntitiesFields.CASH_ADVANCE,
                    Constant.EntitiesFields.TRIP_START_DATE,
                    Constant.EntitiesFields.OUTCOME_WORKFLOW_CODE
                )
        )
        //console.log('[workflow-determination/retrieveWorkflowByClaimType] aWorkflowContext:', aWorkflowContext)
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
    }
}

async function retrieveDepartment(oTx, sId, oDescriptor) {
    let oDepartment = null;
    const oDoc = await oTx.run(
        SELECT
            .from(oDescriptor.entityHeader)
            .where( { [oDescriptor.idField]:sId })
            .columns(
                Constant.EntitiesFields.EMP_ID
            )
    )
    if(oDoc) {
        oDepartment = await oTx.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZEMP_MASTER'])
                .where({    [Constant.EntitiesFields.EEID]  : oDoc[Constant.EntitiesFields.EMP_ID]  })
                .columns(   Constant.EntitiesFields.DEP )
        );
    }

    return oDepartment[Constant.EntitiesFields.DEP];
    
}

async function retrieveWorkflowByClaimType(oTx, sId, oDescriptor) {
    
    const oToday = new Date()

    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(oTx,sId,oDescriptor);
    console.log('[workflow-determination/retrieveWorkflowByClaimType] oWorkflowRequestType:', oWorkflowRequestType)

    if(oWorkflowRequestType){
        // Retrieve workflow rules by workflow type/workflow request type/claim type id
        const aWorkflowContext = await oTx.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.CLAIM_TYPE_ID]     : oWorkflowRequestType.claimTypeId,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday}
                })
                .columns(
                    Constant.EntitiesFields.RISK_LEVEL,
                    Constant.EntitiesFields.THRESHOLD_AMOUNT,
                    Constant.EntitiesFields.THRESHOLD_VALUE,
                    Constant.EntitiesFields.RECEIPT_DAY,    
                    Constant.EntitiesFields.RECEIPT_AGE,
                    Constant.EntitiesFields.EMPLOYEE_COST_CENTER,
                    Constant.EntitiesFields.CASH_ADVANCE,
                    Constant.EntitiesFields.TRIP_START_DATE,
                    Constant.EntitiesFields.OUTCOME_WORKFLOW_CODE
                )
        )
        //console.log('[workflow-determination/retrieveWorkflowByClaimType] aWorkflowContext:', aWorkflowContext)
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
    }
}

async function retrieveWorkflow(oTx, sId, oDescriptor) {
    
    const oToday = new Date()

    
    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(oTx,sId,oDescriptor);
    console.log('[workflow-determination/retrieveWorkflow] oWorkflowRequestType:', oWorkflowRequestType)

    if(oWorkflowRequestType){
        // Retrieve workflow rules by workflow type/workflow request type
        const aWorkflowContext = await oTx.run(
            SELECT
                .from(cds.entities['eclaim_srv.ZWORKFLOW_RULE'])
                .where({
                    [Constant.EntitiesFields.WORKFLOW_TYPE]     : oDescriptor.entityPrefix,
                    [Constant.EntitiesFields.REQUEST_TYPE_ID]   : oWorkflowRequestType.workflowRequestType,
                    [Constant.EntitiesFields.START_DATE]        : { '<=' : oToday},
                    [Constant.EntitiesFields.END_DATE]          : { '>=' : oToday}
                })
                .columns(
                    Constant.EntitiesFields.RISK_LEVEL,
                    Constant.EntitiesFields.THRESHOLD_AMOUNT,
                    Constant.EntitiesFields.THRESHOLD_VALUE,
                    Constant.EntitiesFields.RECEIPT_DAY,    
                    Constant.EntitiesFields.RECEIPT_AGE,
                    Constant.EntitiesFields.EMPLOYEE_COST_CENTER,
                    Constant.EntitiesFields.CASH_ADVANCE,
                    Constant.EntitiesFields.TRIP_START_DATE,
                    Constant.EntitiesFields.OUTCOME_WORKFLOW_CODE
                )
        )
        //console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext:', aWorkflowContext)
        if(!aWorkflowContext) {
            return null;
        }
    
    return aWorkflowContext
    }
}

async function normalizeWorkflowRequestType(oTx, sId, oDescriptor) {
    if(oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        const oWorkflowRequestType = await oTx.run(
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
        const oWorkflowRequestType = await oTx.run(
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

async function determineRiskLevel(oTx, sId, oDescriptor) {
    
    const oItemsTable = oDescriptor.entityItem;
    const sOverallRiskLevel = await oTx.run(
        SELECT
            .one
            .from(oItemsTable)
            .where({
                [oDescriptor.idField]   : sId,
                'ZCLAIM_TYPE_ITEM.RISK' : Constant.RiskLevels.HIGH
            })
            .columns('ZCLAIM_TYPE_ITEM.RISK')
    )

    //console.log('[workflow-determination/determineRiskLevel] sOverallRiskLevel:', sOverallRiskLevel)
    return sOverallRiskLevel ? Constant.RiskLevels.HIGH : Constant.RiskLevels.LOW

}

async function determineMaxThresholdAmt(oTx, sId, oDescriptor) {
    
    const oItemsTable = oDescriptor.entityItem;
    const oMaxThresholdAmt = await oTx.run(
        SELECT
            .one
            .from(oItemsTable)
            .where({
                [oDescriptor.idField]   : sId
            })
            .columns({
                xpr: ['max(', { ref: [Constant.EntitiesFields.AMOUNT] }, ')'],
                as: 'MaxAmount'
            })
    )
    if(!oMaxThresholdAmt){
        return 0;
    }
    return oMaxThresholdAmt.MaxAmount;
}

async function determineEarliestReceiptDate(oTx, sId, oDescriptor) {
    
    const oItemsTable = oDescriptor.entityItem;
    const oEarliestReceiptDate = await oTx.run(
        SELECT
            .one
            .from(oItemsTable)
            .where({
                [oDescriptor.idField]   : sId
            })
            .columns({
                xpr: ['min(', { ref: [Constant.EntitiesFields.RECEIPT_DATE] }, ')'],
                as: 'EarliestReceiptDate'
            })
    )
    if(!oEarliestReceiptDate){
        return null;
    }
    return new Date(oEarliestReceiptDate.EarliestReceiptDate);
}

async function determineCashAdvance(oTx, sId, oDescriptor) {
    
    const oHeaderTable = oDescriptor.entityHeader;
    const oItemsTable = oDescriptor.entityItem;
    let oCashAdvance = null;
    if(oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        oCashAdvance = await oTx.run(
            SELECT
                .one
                .from(oHeaderTable)
                .where({
                    [oDescriptor.idField]   : sId
                })
                .columns(Constant.EntitiesFields.CASH_ADVANCE_AMOUNT)
        )
        if(!oCashAdvance) {        
            return null;
        }
        const sCashAdvanceAmount = Number(oCashAdvance[Constant.EntitiesFields.CASH_ADVANCE_AMOUNT]) || 0;
        return sCashAdvanceAmount > 0;
    }

    if(oDescriptor.entityPrefix === Constant.WorkflowType.REQUEST) {
        oCashAdvance = await oTx.run(
            SELECT
                .one
                .from(oItemsTable)
                .where({
                    [oDescriptor.idField]                   : sId,
                    [Constant.EntitiesFields.CASH_ADVANCE]  : true
                })
                .columns(Constant.EntitiesFields.CASH_ADVANCE)
        )
        if(!oCashAdvance) {
            return false;
        }
        else{
            return true;
        }
    }
}

function validateWorkflowRule(oDocumentRulesContext, oWorkflowContext) {
    const sValue = evaluateCashAdvance(oDocumentRulesContext, oWorkflowContext)
    console.log('[workflow-determination/validateWorkflowRule] sValue:', sValue)
    return (
        evaluateThresholdAmount(oDocumentRulesContext, oWorkflowContext) &&
        evaluateRiskLevel(oDocumentRulesContext, oWorkflowContext) &&
        evaluateReceiptDate(oDocumentRulesContext, oWorkflowContext) &&
        evaluateCostCenter(oDocumentRulesContext, oWorkflowContext) &&
        evaluateCashAdvance(oDocumentRulesContext, oWorkflowContext) &&
        evaluateTripStartDate(oDocumentRulesContext, oWorkflowContext)
    )
}

function evaluateThresholdAmount(oDocumentRulesContext, oWorkflowContext) {
    if(!oWorkflowContext.THRESHOLD_VALUE){
        return true;
    }
    switch(oWorkflowContext.THRESHOLD_VALUE) {
        case Constant.Operator.GREATERTHAN:
            return (
                oDocumentRulesContext.totalClaimAmt >= oDocumentRulesContext.preapprovedAmt ||
                oDocumentRulesContext.maxThresholdAmt > oWorkflowContext.THRESHOLD_AMOUNT
            );
        case Constant.Operator.LESSTHANOREQUAL:
            return oDocumentRulesContext.maxThresholdAmt <= oWorkflowContext.THRESHOLD_AMOUNT;
        default:
            throw new Error(
                `Unsupported THRESHOLD_VALUE: ${oWorkflowContext.THRESHOLD_VALUE}`
            );
    }
}

function evaluateRiskLevel(oDocumentRulesContext, oWorkflowContext) {
    if(!oWorkflowContext.RISK_LEVEL) {
        return true;
    }
    return oDocumentRulesContext.riskLevel === oWorkflowContext.RISK_LEVEL;
}

function evaluateReceiptDate(oDocumentRulesContext, oWorkflowContext) {
    if(!oWorkflowContext.RECEIPT_AGE){
        return true;
    }
    switch(oWorkflowContext.RECEIPT_AGE){
        case Constant.Operator.GREATERTHAN:
            return oDocumentRulesContext.agingDays > oWorkflowContext.RECEIPT_DAY;
        case Constant.Operator.LESSTHANOREQUAL:
            return oDocumentRulesContext.agingDays <= oWorkflowContext.RECEIPT_DAY;
        default:
            throw new Error(
                `Unsupported RECEIPT_AGE: ${oWorkflowContext.RECEIPT_AGE} or RECEIPT_DATE: ${oDocumentRulesContext.receiptDate}`
            );
    }
}

function evaluateCostCenter(oDocumentRulesContext, oWorkflowContext) {
    if(!oWorkflowContext.EMPLOYEE_COST_CENTER){
        return true;
    }
    return oDocumentRulesContext.costCenter === oWorkflowContext.EMPLOYEE_COST_CENTER;
}

function evaluateCashAdvance(oDocumentRulesContext, oWorkflowContext) {
    switch(oWorkflowContext.CASH_ADVANCE) {
        case true:
            return (oDocumentRulesContext.isCashAdvance);
        case null:
            return (!oDocumentRulesContext.isCashAdvance);
        default:
            throw new Error(
                `Unsupported CASH_ADVANCE: ${oWorkflowContext.CASH_ADVANCE}`
            );
    }
}

function evaluateTripStartDate(oDocumentRulesContext, oWorkflowContext) {
    if(!oWorkflowContext.TRIP_START_DATE){
        return true;
    }

    const dTargetDate = normalizeDate(oDocumentRulesContext.tripStartDate);
    const dCurrentDate = new Date();
    dCurrentDate.setHours(0,0,0,0);
    switch(oWorkflowContext.TRIP_START_DATE) {
        case Constant.Operator.GREATERTHANOREQUAL:
            return (dTargetDate >= dCurrentDate );
        case Constant.Operator.LESSTHAN:
            return (dTargetDate < dCurrentDate);
        default:
            throw new Error(
                `Unsupported TRIP_START_DATE: ${oWorkflowContext.TRIP_START_DATE}`
            );
    }
}

function normalizeDate(dDate) {
    const dNewDate = new Date(dDate);
    dNewDate.setHours(0,0,0,0);
    return dNewDate;
}

async function determineWorkflow(oTx, sId) {

    let sRiskLevel = '';
    let sThresholdOperator = '';
    let sMaxThresholdAmt = 0;
    let dEarliestReceiptDate = new Date();
    const dToday = new Date();
    let sAgingDays = 0;
    let sPreapprovedAmt = 0;
    let sTotalClaimAmt = 0;
    let oDeterminedWorkflowContext = null;
    let aWorkflowContext = [];

    const oDescriptor = resolveDocDescriptor(sId);
    if (!oDescriptor) {
        return null
    }
    //1. Retrieve Header details
    const oHeader = await fetchHeaderForWorkflow(oTx, sId, oDescriptor);

    //2. Retrieve Item details
    const aItems = await fetchItemsForWorkflow(oTx, sId, oDescriptor);

    //3. Build workflow context
    // Put all rules into the workflow context
    // | Risk Level | Threshold Amount | Receipt Date | Cost Center | Cash Advance | Trip Start Date |
    sRiskLevel = await determineRiskLevel(oTx, sId, oDescriptor);

    // get threshold amount, total claim amount, preapproved amount for claim
    if(oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        sMaxThresholdAmt = await determineMaxThresholdAmt( oTx, sId, oDescriptor);
        sTotalClaimAmt = oHeader[Constant.EntitiesFields.TOTAL_CLAIM_AMOUNT];
        sPreapprovedAmt = oHeader[Constant.EntitiesFields.PREAPPROVED_AMOUNT];
    }
    
    dEarliestReceiptDate = await determineEarliestReceiptDate(oTx, sId, oDescriptor);
    // Convert the date into days comparing current date
    const sMilisecondsPerDay = 24 * 60 * 60 * 1000;
    const sAgingMiliseconds = dToday.getTime() - dEarliestReceiptDate.getTime();
    sAgingDays = Math.floor(sAgingMiliseconds / sMilisecondsPerDay);
    let sCostCenter = oHeader[Constant.EntitiesFields.ALTERNATE_COST_CENTER] ? Constant.Operator.NOTEQUAL : Constant.Operator.EQUAL
    let bIsCashAdvance = await determineCashAdvance(oTx, sId, oDescriptor);
    const sTripStartDate = oHeader[Constant.EntitiesFields.TRIP_START_DATE];

    const oDocumentRulesContext = {
        riskLevel       : sRiskLevel,
        maxThresholdAmt : Number(sMaxThresholdAmt) || 0,
        totalClaimAmt   : Number(sTotalClaimAmt) || 0,
        preapprovedAmt  : Number(sPreapprovedAmt) || 0,
        receiptDate     : dEarliestReceiptDate || null,
        agingDays       : Number(sAgingDays),
        costCenter      : oHeader[Constant.EntitiesFields.ALTERNATE_COST_CENTER] ? Constant.Operator.NOTEQUAL : Constant.Operator.EQUAL,
        isCashAdvance   : bIsCashAdvance,
        tripStartDate   : sTripStartDate
    }

    //console.log('[workflow-determination/determineWorkflow] oDocumentRulesContext:', oDocumentRulesContext)

    //4. Retrieve Workflow rules based on header/item details
    //4.1 Retrieve Workflow with priority for Claim Type with Department (To be added into ZWORKFLOW_TABLE by Sean)
    //aWorkflowContext = await retrieveWorkflowByClaimTypeAndDepartment(oTx, sId, oDescriptor);

    //4.2 Retrieve Workflow with priority for Claim Type
    if(!aWorkflowContext.length){
        aWorkflowContext = await retrieveWorkflowByClaimType(oTx, sId, oDescriptor);
    }
    //console.log('[workflow-determination/determineWorkflow] aWorkflowContext:', aWorkflowContext)

    //4.3 Retrieve Workflow as normal based on Submission Type/Request Type
    if(!aWorkflowContext.length){
        aWorkflowContext = await retrieveWorkflow(oTx, sId, oDescriptor);
        //console.log('[workflow-determination/determineWorkflow] aWorkflowContext:', aWorkflowContext)
    }

    //5. Validate workflow rules
    //Proceed only if workflow rules are found
    if(aWorkflowContext.length){
        for (const oWorkflowContext of aWorkflowContext) {
            // run the rule validator
            // validator will return true if all rules were successful
            let bIsValidatedRule = await validateWorkflowRule(oDocumentRulesContext, oWorkflowContext);
            if(bIsValidatedRule) {
                oDeterminedWorkflowContext = oWorkflowContext;
                console.log('[workflow-determination/determineWorkflow] oWorkflowContext:', oWorkflowContext)
                break;
            }
        }
    }
    if(!oDeterminedWorkflowContext) {
        return null;
    }
    return oDeterminedWorkflowContext;
}
module.exports = { determineWorkflow }