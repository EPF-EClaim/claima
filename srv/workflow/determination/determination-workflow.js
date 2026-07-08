const cds = require('@sap/cds')
const { SELECT } = require('@sap/cds/lib/ql/cds-ql')
const { Constant } = require("../../utils/constant");
const {
    resolveDocDescriptor,
    retrieveEmployeeDetails
} = require("../../workflow/workflow-helper")
const {
    retrieveWorkflowByClaimTypeRoleAndDivision,
    retrieveWorkflowByClaimTypeAndDivision,
    retrieveWorkflowByClaimTypeAndRole,
    retrieveWorkflowByClaimType,
    retrieveWorkflowByDefault
} = require('./determination-helper');
const { constants } = require('@sap/xssec');
const { identityServicesCache } = require('@sap-cloud-sdk/connectivity/dist/internal');

async function fetchHeaderForWorkflow(sId, oDescriptor) {
    
    const aCommonFields = [
        oDescriptor.idField,
        oDescriptor.typeField,
        Constant.EntitiesFields.COST_CENTER,
        Constant.EntitiesFields.ALTERNATE_COST_CENTER,
        Constant.EntitiesFields.TRIP_START_DATE,
        Constant.EntitiesFields.CLAIM_TYPE_ID
    ];

    // header tables are ZCLAIM_HEADER and ZREQUEST_HEADER
    // if document is a claims, PREAPPROVED_AMOUNT and TOTAL_CLAIM_AMOUNT fields are required for workflow determination, otherwise for request document, these two fields do not exist and will not be retrieved
    let oMapping = {
        CLM : {
            fields: [
                'PREAPPROVED_AMOUNT as PREAPPROVED_AMOUNT',
                'TOTAL_CLAIM_AMOUNT as TOTAL_CLAIM_AMOUNT'
            ]
        },
        REQ : {
            fields: [
                'PREAPPROVAL_AMOUNT as PREAPPROVED_AMOUNT',
                'TOTAL_AMOUNT as TOTAL_CLAIM_AMOUNT'
            ]
        }
    }
    console.log('[workflow-determination/fetchHeaderForWorkflow] oMapping:', oMapping)
    console.log('[workflow-determination/fetchHeaderForWorkflow] oDescriptor.entityPrefix:', oDescriptor.entityPrefix)
    const oConfig = oMapping[oDescriptor.entityPrefix];
    console.log('[workflow-determination/fetchHeaderForWorkflow] oConfig:', oConfig)

    const oHeader =  await cds.run(
        SELECT
            .one
            .from(oDescriptor.entityHeader)
            .columns([   
                ...aCommonFields,
                ...oConfig.fields
            ])
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

async function retrieveWorkflow(oTx, sId, oDescriptor, sEmpId) {
    
    const oToday = new Date()

    
    // Before retrieving workflow from ZWORKFLOW_RULE, we need to normalize the Submission Type/ Request Type ID field to workflowRequestType
    const oWorkflowRequestType = await normalizeWorkflowRequestType(oTx,sId,oDescriptor);
    console.log('[workflow-determination/retrieveWorkflow] oWorkflowRequestType:', oWorkflowRequestType)

    // We need to retrieve workflow rules based on priority:
    // 1. Workflow Type + Request Type + Claim Type + Role + Division   (Phase 2)
    // 2. Workflow Type + Request Type + Claim Type + Role              (Phase 2)
    // 3. Workflow Type + Request Type + Claim Type + Division          (Phase 2)
    // 4. Workflow Type + Request Type + Claim Type                     (Phase 2)
    // 5. Workflow Type + Request Type                                  (Phase 1)
    // If workflow rules exist for higher priority, then the lower priority ones will be ignored. For example, if there are workflow rules maintained for Workflow Type + Request Type + Claim Type + Role, then the rules with Workflow Type + Request Type + Claim Type will not be considered even if they exist.
    if(oWorkflowRequestType){
        let aWorkflowContext = [];
        // Retrieve workflow rules by workflow type/workflow request type/ claim type/ role / division
        aWorkflowContext = await retrieveWorkflowByClaimTypeRoleAndDivision(sId, oDescriptor, sEmpId);
        console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext by claim type, role and division:', aWorkflowContext)
        if(!aWorkflowContext.length) {
            // Retrieve workflow rules by workflow type/workflow request type/ claim type/ role
            aWorkflowContext = await retrieveWorkflowByClaimTypeAndRole(sId, oDescriptor, sEmpId);
            console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext by claim type and role:', aWorkflowContext)
        }
        if(!aWorkflowContext.length) {
            // Retrieve workflow rules by workflow type/workflow request type/ claim type/ division
            aWorkflowContext = await retrieveWorkflowByClaimTypeAndDivision(sId, oDescriptor, sEmpId);
            console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext by claim type and division:', aWorkflowContext)
        }
        if(!aWorkflowContext.length) {
            // Retrieve workflow rules by workflow type/workflow request type/ claim type
            aWorkflowContext = await retrieveWorkflowByClaimType(sId, oDescriptor);
            console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext by claim type:', aWorkflowContext)
        }
        if(!aWorkflowContext.length) {
             // Retrieve workflow rules by workflow type/workflow request type
            aWorkflowContext = await retrieveWorkflowByDefault(sId, oDescriptor);
            console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext by default:', aWorkflowContext)
        }
        if(!aWorkflowContext.length) {
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

async function determineRiskLevel(sId, oDescriptor) {
    
    const oItemsTable = oDescriptor.entityItem;
    const sOverallRiskLevel = await cds.run(
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
    
    if(oDescriptor.entityPrefix == Constant.WorkflowType.CLAIM) {

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
    return null;
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

async function determineProjectCode(oTx, sId, oDescriptor) {
    const oProjectCode = await oTx.run(
        SELECT.one
            .from(oDescriptor.entityHeader)
            .where({
                [oDescriptor.idField]: sId
            })
            .columns(Constant.EntitiesFields.PROJECT_CODE)
    );

    if (!oProjectCode) {
        return null;
    }

    const sProjectCode =
        oProjectCode[Constant.EntitiesFields.PROJECT_CODE] || null;

    return sProjectCode != null;
}

function validateWorkflowRule(oDocumentRulesContext, oWorkflowContext) {
    return (
        evaluateThresholdAmount(oDocumentRulesContext, oWorkflowContext) &&
        evaluateRiskLevel(oDocumentRulesContext, oWorkflowContext) &&
        evaluateReceiptDate(oDocumentRulesContext, oWorkflowContext) &&
        evaluateCostCenter(oDocumentRulesContext, oWorkflowContext) &&
        evaluateCashAdvance(oDocumentRulesContext, oWorkflowContext) &&
        evaluateTripStartDate(oDocumentRulesContext, oWorkflowContext) &&
        evaluateLocationType(oDocumentRulesContext, oWorkflowContext) &&
        evaluateProjectCode(oDocumentRulesContext, oWorkflowContext) 
    )
}

function evaluateThresholdAmount(oDocumentRulesContext, oWorkflowContext) {
    console.log("evaluateThresholdAmount oWorkflowContext.THRESHOLD_VALUE: ", oWorkflowContext.THRESHOLD_VALUE);
    console.log("evaluateThresholdAmount oDocumentRulesContext.maxThresholdAmt: ",  oDocumentRulesContext.maxThresholdAmt);
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
    console.log("evaluateRiskLevel oWorkflowContext.RISK_LEVEL: ", oWorkflowContext.RISK_LEVEL);
    console.log("evaluateRiskLevel oDocumentRulesContext.riskLevel: ",  oDocumentRulesContext.riskLevel);
    if(!oWorkflowContext.RISK_LEVEL) {
        return true;
    }
    return oDocumentRulesContext.riskLevel === oWorkflowContext.RISK_LEVEL;
}

function evaluateReceiptDate(oDocumentRulesContext, oWorkflowContext) {
    console.log("evaluateReceiptDate oWorkflowContext.RECEIPT_AGE: ", oWorkflowContext.RECEIPT_AGE);
    console.log("evaluateReceiptDate oDocumentRulesContext.agingDays: ",  oDocumentRulesContext.agingDays);
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
    console.log("evaluateCostCenter oWorkflowContext.EMPLOYEE_COST_CENTER: ", oWorkflowContext.EMPLOYEE_COST_CENTER);
    console.log("evaluateCostCenter oDocumentRulesContext.costCenter: ",  oDocumentRulesContext.costCenter);
    if(!oWorkflowContext.EMPLOYEE_COST_CENTER){
        return true;
    }
    return oDocumentRulesContext.costCenter === oWorkflowContext.EMPLOYEE_COST_CENTER;
}

function evaluateCashAdvance(oDocumentRulesContext, oWorkflowContext) {
    console.log("evaluateCashAdvance oWorkflowContext.CASH_ADVANCE: ", oWorkflowContext.CASH_ADVANCE);
    console.log("evaluateCashAdvance oDocumentRulesContext.isCashAdvance: ",  oDocumentRulesContext.isCashAdvance);
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

function evaluateProjectCode(oDocumentRulesContext, oWorkflowContext) {
    console.log("evaluateProjectCode oWorkflowContext.PROJECT_CODE: ", oWorkflowContext.PROJECT_CLAIM);
    console.log("evaluateProjectCode oDocumentRulesContext.isProjectCode: ",  oDocumentRulesContext.isProjectCode);
    switch(oWorkflowContext.PROJECT_CLAIM) {
        case true:
            return (oDocumentRulesContext.isProjectCode);
        case null:
            return (!oDocumentRulesContext.isProjectCode);
        default:
            throw new Error(
                `Unsupported PROJECT_CLAIM: ${oWorkflowContext.PROJECT_CLAIM}`
            );
    }
}

function evaluateTripStartDate(oDocumentRulesContext, oWorkflowContext) {
    console.log("evaluateTripStartDate oWorkflowContext.TRIP_START_DATE: ", oWorkflowContext.TRIP_START_DATE);
    console.log("evaluateTripStartDate oDocumentRulesContext.tripStartDate: ",  oDocumentRulesContext.tripStartDate);
    if(!oWorkflowContext.TRIP_START_DATE){
        return true;
    }

    const dTargetDate = normalizeDate(oDocumentRulesContext.tripStartDate);
    if(!dTargetDate) {
        throw new Error(
            `Unsupported TRIP_START_DATE: ${oWorkflowContext.TRIP_START_DATE}`
        );
    }
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
function evaluateLocationType(oDocumentRulesContext, oWorkflowContext) {
    console.log("evaluateLocationType oWorkflowContext.LOCATION_TYPE: ", oWorkflowContext.LOCATION_TYPE);
    console.log("evaluateLocationType oDocumentRulesContext.locationType: ",  oDocumentRulesContext.locationType);
    if(!oWorkflowContext.LOCATION_TYPE){
        return true;
    }
    return oDocumentRulesContext.locationType === oWorkflowContext.LOCATION_TYPE;
}

function normalizeDate(dDate) {
    if(!dDate) {
        return null;
    }   
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
    let sMilisecondsPerDay = 24 * 60 * 60 * 1000;
    let sAgingMiliseconds = null;

    const oDescriptor = resolveDocDescriptor(sId);
    if (!oDescriptor) {
        return null;
    }
    //1. Retrieve Header details
    const oHeader = await fetchHeaderForWorkflow(sId, oDescriptor);

    //3. Build workflow context
    // Put all rules into the workflow context
    // | Risk Level | Threshold Amount | Receipt Date | Cost Center | Cash Advance | Trip Start Date | (NEW) Location Type | (NEW) Role | (NEW) Project Code
    // Location type has two values, 'HQ' and 'Branch'
    // If CC is fully numeric, it is considered as 'HQ', otherwise 'Branch'
    sRiskLevel = await determineRiskLevel(sId, oDescriptor);

    // get threshold amount, total claim amount, preapproved amount for claim
    if(oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        sMaxThresholdAmt = await determineMaxThresholdAmt( oTx, sId, oDescriptor);
        sTotalClaimAmt = oHeader[Constant.EntitiesFields.TOTAL_CLAIM_AMOUNT];
        sPreapprovedAmt = oHeader[Constant.EntitiesFields.PREAPPROVED_AMOUNT];
    }
    
    dEarliestReceiptDate = await determineEarliestReceiptDate(oTx, sId, oDescriptor);
    if(dEarliestReceiptDate) {
        // Convert the date into days comparing current date
        sAgingMiliseconds = dToday.getTime() - dEarliestReceiptDate.getTime();
        sAgingDays = Math.floor(sAgingMiliseconds / sMilisecondsPerDay);
    }
    let sCostCenterContext = oHeader[Constant.EntitiesFields.ALTERNATE_COST_CENTER] ? Constant.Operator.NOTEQUAL : Constant.Operator.EQUAL;
    // Retrieve Location Type based on Cost Center
    let sLocationType = "";
    if(oHeader[Constant.EntitiesFields.COST_CENTER]) {
        sLocationType = isNaN(oHeader[Constant.EntitiesFields.COST_CENTER]) ? Constant.LocationType.BRANCH : Constant.LocationType.HQ;
    }

    // Retrieve claimant role for workflow determination
    const oClaimantDetails = await retrieveEmployeeDetails(oHeader[Constant.EntitiesFields.EMP_ID]);
    if(!oClaimantDetails) {
        return null;
    }
    const sClaimantRole = oClaimantDetails ? oClaimantDetails[Constant.EntitiesFields.ROLE] : null;
    let bIsCashAdvance = await determineCashAdvance(oTx, sId, oDescriptor);
    let bIsProjectCode = await determineProjectCode(oTx, sId, oDescriptor)
    const sTripStartDate = oHeader[Constant.EntitiesFields.TRIP_START_DATE] ?? null;

    const oDocumentRulesContext = {
        claimTypeId     : oHeader[Constant.EntitiesFields.CLAIM_TYPE_ID] || null, 
        riskLevel       : sRiskLevel,
        maxThresholdAmt : Number(sMaxThresholdAmt) || 0,
        totalClaimAmt   : Number(sTotalClaimAmt) || 0,
        preapprovedAmt  : Number(sPreapprovedAmt) || 0,
        receiptDate     : dEarliestReceiptDate || null,
        agingDays       : Number(sAgingDays),
        costCenter      : sCostCenterContext,
        isCashAdvance   : bIsCashAdvance,
        tripStartDate   : sTripStartDate,
        locationType    : sLocationType,
        claimantRole    : sClaimantRole,
        isProjectCode   : bIsProjectCode
    }

    console.log('[workflow-determination/determineWorkflow] oDocumentRulesContext:', oDocumentRulesContext)

    //4. Retrieve Workflow rules based on header/item details
    //4.1 Retrieve Workflow as normal based on Submission Type/Request Type
    if(!aWorkflowContext.length){
        aWorkflowContext = await retrieveWorkflow(oTx, sId, oDescriptor, oHeader[Constant.EntitiesFields.EMP_ID]);
        console.log("Workflow by Submission Type: ", aWorkflowContext);
    }

    if(!aWorkflowContext.length){
        return null;
    }

    //5. Validate workflow rules
    //Proceed only if workflow rules are found
    if(aWorkflowContext.length){
        for (const oWorkflowContext of aWorkflowContext) {
            // run the rule validator
            // validator will return true if all rules were successful
            console.log("Validating workflow rules for workflow context: ", oWorkflowContext.OUTCOME_WORKFLOW_CODE);
            let bIsValidatedRule = validateWorkflowRule(oDocumentRulesContext, oWorkflowContext);
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