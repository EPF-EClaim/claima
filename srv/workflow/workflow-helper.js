const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../utils/constant");

const aEntityTableByPrefix = {
    [Constant.WorkflowType.CLAIM]   : {
        entityPrefix        : Constant.WorkflowType.CLAIM,
        entityHeader        : cds.entities['eclaim_srv.ZCLAIM_HEADER'],
        entityItem          : cds.entities['eclaim_srv.ZCLAIM_ITEM'],
        entityApprovers     : cds.entities['eclaim_srv.ZAPPROVER_DETAILS_CLAIMS'],
        idField             : Constant.EntitiesFields.CLAIMID,
        typeField           : Constant.EntitiesFields.SUBMISSION_TYPE,
        approverIdField     : Constant.ApproverDetailsTable.CLAIM_ID,
        entityTypeDesc      : 'ZSUBMISSION_TYPE.SUBMISSION_TYPE_DESC',
        entityTypeDescField : 'ZSUBMISSION_TYPE_SUBMISSION_TYPE_DESC',
        entityAmount        : Constant.EntitiesFields.AMOUNT
    },
    [Constant.WorkflowType.REQUEST] : {
        entityPrefix        : Constant.WorkflowType.REQUEST,
        entityHeader        : cds.entities['eclaim_srv.ZREQUEST_HEADER'],
        entityItem          : cds.entities['eclaim_srv.ZREQUEST_ITEM'],
        entityApprovers     : cds.entities['eclaim_srv.ZAPPROVER_DETAILS_PREAPPROVAL'],
        idField             : Constant.EntitiesFields.REQUESTID,
        typeField           : Constant.EntitiesFields.REQUEST_TYPE_ID,
        approverIdField     : Constant.ApproverDetailsTable.PREAPPROVAL_ID,
        entityTypeDesc      : 'ZREQUEST_TYPE.REQUEST_TYPE_DESC',
        entityTypeDescField : 'ZREQUEST_TYPE_REQUEST_TYPE_DESC',
        entityAmount        : Constant.EntitiesFields.EST_AMOUNT
    }
}
function resolveDocDescriptor(sId) {
    const sPrefix = sId.slice(0,3);

    const oDescriptor = aEntityTableByPrefix[sPrefix]
    //console.log('[workflow-determination/resolveDocDescriptor] oDescriptor:', oDescriptor)
    return oDescriptor
}
async function retrieveHeaderDetails(sId, oDescriptor) {
    const oHeader =  await cds.run(
        SELECT
            .one
            .from(oDescriptor.entityHeader)
            .columns(   oDescriptor.idField,
                        oDescriptor.typeField,
                        oDescriptor.entityTypeDesc,
                        Constant.EntitiesFields.EMP_ID,
                        Constant.EntitiesFields.COST_CENTER,
                        Constant.EntitiesFields.ALTERNATE_COST_CENTER,
                        Constant.EntitiesFields.PROJECT_CODE
            )
            .where( { [oDescriptor.idField]:sId })
    );
    return oHeader;
}
async function retrieveEmployeeDetails(sId, sEmail){

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
    const oEmployeeContext =  await cds.run(
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
    if(!oEmployeeContext) {
        return null;
    }
    return oEmployeeContext;
}

async function retrieveItems(sId, oDescriptor) {
    
    const aItems = await cds.run(
        SELECT
            .from(oDescriptor.entityItem)
            .columns(   Constant.EntitiesFields.CLAIM_TYPE_ID,
                        Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID,
                        //Constant.EntitiesFields.COST_CENTER,
                        //Constant.EntitiesFields.ALTERNATE_COST_CENTER,
                        Constant.EntitiesFields.GL_ACCOUNT,
                        oDescriptor.entityAmount
            )
            .where( { [oDescriptor.idField]:sId })
    );
    //console.log('[workflow-determination/fetchItemsForWorkflow] aItems:', aItems)
   
    return aItems;
}
async function retrieveBudgetContext(sId, oDescriptor, sAction) {

    const aBudgetContexts = [];
    const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
    if(!oHeaderContext) {
        return null;
    }
    console.log("SubmittedDate: ", oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE]);
    const sSubmittedDate = oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE];
    const dSubmittedYear = sSubmittedDate ? String(new Date(oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE]).getFullYear()) : String(new Date().getFullYear());
    const sFinalCostCenter = oHeaderContext[Constant.EntitiesFields.COST_CENTER] ?? oHeaderContext[Constant.EntitiesFields.ALTERNATE_COST_CENTER] ?? null;
    const sInternalOrder = oHeaderContext[Constant.EntitiesFields.PROJECT_CODE] ?? Constant.Wildcard.NA;
    const aItemsContext = await retrieveItems(sId, oDescriptor);
    if(!aItemsContext.length) {
        return null;
    }
    for(const oItemContext of aItemsContext) {
        
        aBudgetContexts.push({
            YEAR            : dSubmittedYear,
            INTERNAL_ORDER  : sInternalOrder,
            FUND_CENTER     : sFinalCostCenter,
            MATERIAL_GROUP  : oItemContext[Constant.EntitiesFields.MATERIAL_CODE] ?? null,
            COMMITMENT_ITEM : oItemContext[Constant.EntitiesFields.GL_ACCOUNT],
            CLAIM_TYPE_ITEM : oItemContext[Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID],
            AMOUNT          : oItemContext[oDescriptor.entityAmount],
            INDICATOR       : oDescriptor.entityPrefix, //CLM and REQ
            ACTION          : sAction //SUBMIT, REJECT, APPROVE;
        })
    }
    return aBudgetContexts
}
function generateReturnMessage(bStatus, sId, sArea, sMessage){
    return {
        Success         : bStatus,
        DocumentID      : sId,
        Area            : sArea,
        Message         : sMessage
    };
}
async function performBudgetChecking(oTx, aBudgetContext) {
    const ZBUDGET = cds.entities['eclaim_srv.ZBUDGET'];
    // const { budget } = req.data;

    const toNum = (v) => Number(v) || 0;
    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

    // const tx = cds.tx(req);
    // const results = [];
    // let error = false;

    try {
        let error = false;
        let errorResults = [];
        let successResults = [];

        for (const entry of aBudgetContext) {
            const condition = {
                YEAR: entry.YEAR,
                INTERNAL_ORDER: entry.INTERNAL_ORDER,
                FUND_CENTER: entry.FUND_CENTER,
                MATERIAL_GROUP: entry.MATERIAL_GROUP,
                COMMITMENT_ITEM: entry.COMMITMENT_ITEM
            };

            let budgetRecord = entry.INDICATOR === Constant.BudgetSubmissionType.CLAIM
                ? await cds.run(SELECT.one.from(ZBUDGET).where(condition).forShareLock())
                : await cds.run(SELECT.one.from(ZBUDGET).where(condition));

            if (!budgetRecord) {
                error = true;
                errorResults.push({
                    ...condition,
                    STATUS: Constant.BudgetCheckStatus.NOT_FOUND,
                    CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM
                });
                continue;
            }

            if (entry.INDICATOR === Constant.BudgetSubmissionType.REQUEST ||
                (entry.INDICATOR === Constant.BudgetSubmissionType.CLAIM && entry.ACTION === Constant.BudgetProcessingAction.SUBMIT)) {
                const bSufficient = toNum(entry.AMOUNT) <= toNum(budgetRecord.BUDGET_BALANCE);
                if (!bSufficient) {
                    error = true;
                    errorResults.push({
                        ...condition,
                        STATUS: Constant.BudgetCheckStatus.INSUFFICIENT,
                        CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM,
                        AMOUNT: entry.AMOUNT,
                        AVAILABLE: budgetRecord.BUDGET_BALANCE
                    });
                    continue;
                }
            }

            if (error) continue;

            if (entry.INDICATOR === Constant.BudgetSubmissionType.REQUEST) {
                successResults.push({
                    ...condition,
                    STATUS: Constant.BudgetCheckStatus.SUFFICIENT,
                    CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM
                });
                continue;
            }

            let newCommitment = toNum(budgetRecord.COMMITMENT);
            let newActual = toNum(budgetRecord.ACTUAL);
            const amount = toNum(entry.AMOUNT);
            if (entry.ACTION === Constant.BudgetProcessingAction.SUBMIT) {
                newCommitment = round2(newCommitment - amount);
            } else if (entry.ACTION === Constant.BudgetProcessingAction.APPROVE) {
                newCommitment = round2(newCommitment + amount);
                newActual = round2(newActual - amount);
            } else if (entry.ACTION === Constant.BudgetProcessingAction.REJECT) {
                newCommitment = round2(newCommitment + amount);
            }

            const newConsumed = round2(newCommitment + newActual);
            const newBudgetBalance = round2(toNum(budgetRecord.CURRENT_BUDGET) + newConsumed);

            await oTx.run(
                UPDATE(ZBUDGET)
                    .set({
                        CONSUMED: newConsumed.toFixed(2),
                        COMMITMENT: newCommitment.toFixed(2),
                        BUDGET_BALANCE: newBudgetBalance.toFixed(2),
                        ACTUAL: newActual.toFixed(2)
                    })
                    .where(condition)
            );

            successResults.push({
                ...condition,
                STATUS: Constant.BudgetCheckStatus.UPDATED,
                CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM,
                NEW_CONSUMED: newConsumed,
                NEW_BUDGETBALANCE: newBudgetBalance
            });
        }

        if (error) {
            await oTx.rollback();
            return errorResults;
        }

        await oTx.commit();
        return successResults;

    } catch (err) {
        await oTx.rollback();
        return err;
        // req.error(400, `Budget checking failed: ${err.message}`);
    }
}
module.exports = { 
    resolveDocDescriptor,
    retrieveHeaderDetails,
    retrieveEmployeeDetails,
    retrieveBudgetContext,
    retrieveItems,
    generateReturnMessage,
    performBudgetChecking
};