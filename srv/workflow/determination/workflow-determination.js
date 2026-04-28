const cds = require('@sap/cds')
const { SELECT } = require('@sap/cds/lib/ql/cds-ql')
const { Constant } = require("../../utils/constant");
const { constants } = require('@sap/xssec');

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
    console.log('[workflow-determination/fetchHeaderForWorkflow] oHeader:', oHeader)
    
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
    console.log('[workflow-determination/fetchItemsForWorkflow] aItems:', aItems)
   
    return aItems;
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
        console.log('[workflow-determination/retrieveWorkflowByClaimType] aWorkflowContext:', aWorkflowContext)
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
        console.log('[workflow-determination/retrieveWorkflow] aWorkflowContext:', aWorkflowContext)
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
    return sOverallRiskLevel ? 'H' : 'L'

}

async function determineWorkflow(oTx, sId) {

    const oDescriptor = resolveDocDescriptor(sId);
    if (!oDescriptor) {
        return null
    }
    //1. Retrieve Header details
    const oHeader = await fetchHeaderForWorkflow(oTx, sId, oDescriptor);

    //2. Retrieve Item details
    const aItems = await fetchItemsForWorkflow(oTx, sId, oDescriptor);

    //3. Retrieve Workflow rules based on header/item details
    //3.1 Retrieve Workflow with priority for Claim Type with Department


    //3.2 Retrieve Workflow with priority for Claim Type
    let aWorkflowContext = await retrieveWorkflowByClaimType(oTx, sId, oDescriptor);
    console.log('[workflow-determination/determineWorkflow] aWorkflowContext:', aWorkflowContext)

    //3.3 Retrieve Workflow as normal based on Submission Type/Request Type
    if(!aWorkflowContext.length){
        aWorkflowContext = await retrieveWorkflow(oTx, sId, oDescriptor);
        console.log('[workflow-determination/determineWorkflow] aWorkflowContext:', aWorkflowContext)
    }

    //4. Validate workflow rules
    //4.1 Validate risk item
    const sRiskLevel = await determineRiskLevel(oTx, sId, oDescriptor);
    console.log('[workflow-determination/determineWorkflow] sRiskLevel:', sRiskLevel)

    //4.2 Validate Threshold (Include total amt vs preapproved amt)

    //4.3 Validate Receipt date aging

    //4.4 Validate Cost Center (EQ or NE)

    //4.5 Validate Cash Advance (true or NULL)

    if(!oHeader) {
        return null;
    }
    return oHeader;

}
module.exports = { determineWorkflow }