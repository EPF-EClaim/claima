const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../utils/constant");
const { constants } = require('@sap/xssec');
const { getBudgetRecord, processEarmarkedFunds, rollUpCostCenter, updateEarmarkedFundDetails } = require('../ifams/ifams-budget');

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
        entityAmount        : Constant.EntitiesFields.AMOUNT,
        statusField         : Constant.EntitiesFields.STATUS_ID,
        entityClaimTypeItem : cds.entities['eclaim_srv.ZCLAIM_TYPE_ITEM']
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
        entityAmount        : Constant.EntitiesFields.EST_AMOUNT,
        statusField         : Constant.EntitiesFields.STATUS,
        entityClaimTypeItem : cds.entities['eclaim_srv.ZCLAIM_TYPE_ITEM']
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
                Constant.EntitiesFields.DIVISION
            )
    )
    if(!oEmployeeContext) {
        return null;
    }
    const aRoleRankContext = await retrieveRoleRank(oEmployeeContext[Constant.EntitiesFields.ROLE])
    if(!aRoleRankContext.length){
        return null;
    }
    const oRoleRankContext = aRoleRankContext[0];
    return {
        [Constant.EntitiesFields.EEID]              : oEmployeeContext[Constant.EntitiesFields.EEID],
        [Constant.EntitiesFields.NAME]              : oEmployeeContext[Constant.EntitiesFields.NAME],
        [Constant.EntitiesFields.DEP]               : oEmployeeContext[Constant.EntitiesFields.DEP],
        [Constant.EntitiesFields.EMAIL]             : oEmployeeContext[Constant.EntitiesFields.EMAIL],
        [Constant.EntitiesFields.DIRECT_SUPERIOR]   : oEmployeeContext[Constant.EntitiesFields.DIRECT_SUPERIOR],
        [Constant.EntitiesFields.ROLE]              : oEmployeeContext[Constant.EntitiesFields.ROLE],
        [Constant.EntitiesFields.RANK]              : oRoleRankContext[Constant.EntitiesFields.RANK]
    };
}
async function retrieveRoleRank(sRole) {

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

    if(sRole == "") {
        return [{ RANK: '0', ROLE: 'Normal' }]
    }

    return await cds.run(sQuery)
}
async function retrieveItems(sId, oDescriptor) {
    const aColumns = [
        Constant.EntitiesFields.CLAIM_TYPE_ID,
        Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID,
        Constant.EntitiesFields.GL_ACCOUNT,
        oDescriptor.entityAmount,
        Constant.EntitiesFields.MATERIAL_CODE,
        Constant.EntitiesFields.COST_CENTER
    ];

    if (oDescriptor.entityPrefix === Constant.WorkflowType.REQUEST) {
        aColumns.push(Constant.EntitiesFields.CASH_ADVANCE);
    }

    // Only ZCLAIM_ITEM has the IFAMS item number
    if (oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        aColumns.push('EARMARKED_FUNDS_DOC_ITEM_ID');
    }

    let oQuery = SELECT
        .from(oDescriptor.entityItem)
        .columns(...aColumns)
        .where({ [oDescriptor.idField]: sId });

    if (oDescriptor.entityPrefix === Constant.WorkflowType.REQUEST) {
        oQuery.where({ CASH_ADVANCE: false });
    }

    if (oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        oQuery.where`CLAIM_TYPE_ITEM_ID not in ('CASH_REPAY', 'POTONGAN_ELAUN', 'PERSONAL_EXPENSE')`;
    }

    const aItems = await cds.run(oQuery);

    if (!aItems.length) {
        return aItems;
    }

    // all items share the same claim type, so fetch descriptions with one CLAIM_TYPE_ID + item-id list
    const sClaimTypeId = aItems[0][Constant.EntitiesFields.CLAIM_TYPE_ID];
    const aTypeItemIds = [...new Set(aItems.map(r => r[Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]))];

    const aDescriptions = await cds.run(
        SELECT.from(oDescriptor.entityClaimTypeItem)
            .columns('CLAIM_TYPE_ITEM_ID', 'CLAIM_TYPE_ITEM_DESC')
            .where({
                CLAIM_TYPE_ID: sClaimTypeId,
                CLAIM_TYPE_ITEM_ID: { in: aTypeItemIds }
            })
    );

    const oDescMap = new Map(aDescriptions.map(d => [d.CLAIM_TYPE_ITEM_ID, d.CLAIM_TYPE_ITEM_DESC]));

    return aItems.map(r => ({
        ...r,
        CLAIM_TYPE_ITEM_DESC: oDescMap.get(r[Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]) ?? null
    }));
}
async function retrieveBudgetContext(sId, oDescriptor, sAction) {

    const aBudgetContexts = [];
    const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
    if(!oHeaderContext) {
        return null;
    }
    const sSubmittedDate = oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE];
    const dSubmittedYear = sSubmittedDate ? String(new Date(oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE]).getFullYear()) : String(new Date().getFullYear());
    const sInternalOrder = oHeaderContext[Constant.EntitiesFields.PROJECT_CODE] || Constant.Wildcard.NA;
    const aItemsContext = await retrieveItems(sId, oDescriptor);
    if(!aItemsContext.length) {
        return aBudgetContexts;
    }
    for(const oItemContext of aItemsContext) {

        aBudgetContexts.push({
            YEAR            : dSubmittedYear,
            INTERNAL_ORDER  : sInternalOrder,
            FUND_CENTER     : oItemContext[Constant.EntitiesFields.COST_CENTER],
            MATERIAL_GROUP  : oItemContext[Constant.EntitiesFields.MATERIAL_CODE],
            COMMITMENT_ITEM : oItemContext[Constant.EntitiesFields.GL_ACCOUNT],
            CLAIM_TYPE_ITEM : oItemContext[Constant.EntitiesFields.CLAIM_TYPE_ITEM_DESC],
            AMOUNT          : oItemContext[oDescriptor.entityAmount],
            INDICATOR       : oDescriptor.entityPrefix, //CLM and REQ
            EMP_ID          : oHeaderContext.EMP_ID, // to be used for cost center roll up
            EARMARKED_FUNDS_DOC_ITEM_ID: oItemContext.EARMARKED_FUNDS_DOC_ITEM_ID, // Budget release
            ALTERNATE_COST_CENTER   : oHeaderContext.ALTERNATE_COST_CENTER  // for checking against roll up cost center
        })
    }
    return aBudgetContexts
}
function generateReturnMessage(bStatus, sId, sArea, sMessage, sAutoApproved) {
    return {
        Success         : bStatus,
        DocumentID      : sId,
        Area            : sArea,
        Message         : sMessage,
        AutoApproved    : sAutoApproved
    };
}
async function retrieveRejectReasonDesc(sRejectReasonId) {
    const sRejectReasonTable = cds.entities['eclaim_srv.ZREJECT_REASON'];
    const oRejectReasonContext = await cds.run(
        SELECT
            .one
            .from(sRejectReasonTable)
            .where({
                [Constant.EntitiesFields.REASON_ID] : sRejectReasonId
            })
            .columns(
                Constant.EntitiesFields.REASON_ID,
                Constant.EntitiesFields.REASON_DESC
            )
    )
    return oRejectReasonContext ? oRejectReasonContext[Constant.EntitiesFields.REASON_DESC] : null;
}
/**
 * Releases the previously locked claim budget by processing the associated
 * earmarked fund document items.
 *
 * Only budget context entries containing an earmarked fund document item ID
 * are included in the release request. When the release succeeds, the
 * earmarked fund details are updated in the database.
 *
 * @param {object} oTx - cds transaction
 * @param {Array<object>} aBudgetContext - Claim budget context containing the earmarked fund item details
 * @param {string} sId - Claim 
 * @param {string} sEarmarkedFundsDocId - Earmarked funds document ID to be released
 * @param {string} sAction - Claim workflow action
 * @returns {Promise<Array<object>|Error>} Release error results, an empty array on success, or the caught error
 */
async function releaseClaimBudget(oTx, aBudgetContext, sId, sEarmarkedFundsDocId, sAction) {

    try {
        let bError = false;
        let aErrorResults = [];
        let aSuccessResults = [];

        const aItems =
            aBudgetContext
                .filter(oBudgetContext => oBudgetContext.EARMARKED_FUNDS_DOC_ITEM_ID)
                .map(oBudgetContext => ({
                    EarmarkedFundsDocumentItem: String(oBudgetContext.EARMARKED_FUNDS_DOC_ITEM_ID).trim(),
                    FundsCenter: String(oBudgetContext.FUND_CENTER).trim(),
                    CommitmentItem: String(oBudgetContext.COMMITMENT_ITEM).trim()
                }))

        const oReleaseResult = await processEarmarkedFunds(aItems, sEarmarkedFundsDocId, sAction);

        if (oReleaseResult?.Error) {
            bError = true;
            aErrorResults.push({
                STATUS: Constant.BudgetCheckStatus.RELEASE_ERROR,
                RELEASE_ERROR: true,
                ERROR_MESSAGE: oReleaseResult?.Message
            });
        } else {
            await updateEarmarkedFundDetails(
                oTx,
                sId,
                oReleaseResult?.oEarmarkedFundsDocument,
                oReleaseResult?.Message,
                sAction
            );

            aSuccessResults.push({
                STATUS: Constant.BudgetCheckStatus.RELEASED,
            });
        }

        if (bError) {
            return aErrorResults;
        }

        return aSuccessResults;

    } catch (oError) {
        return oError;
    }
}
/**
 * Locks the required claim budget by creating an earmarked funds document.
 *
 * For employees outside the RD, HOD, and CXO roles, the function determines
 * the applicable upper-level cost center before processing the earmarked
 * funds request. When the lock succeeds, the generated earmarked fund details
 * are updated in the database.
 *
 * @param {object} oTx - cds transaction
 * @param {Array<object>} aBudgetContext - Claim budget context containing the amount and account assignment details
 * @param {string} sId - Claim or record ID used for the earmarked funds request
 * @returns {Promise<Array<object>|Error>} Lock error results, an empty array on success, or the caught error
 */
async function lockClaimBudget(oTx, aBudgetContext, sId) {

    try {
        let bError = false;
        let aErrorResults = [];
        let aSuccessResults = [];
        var oEmployeeRollupCC;

        // determine upper cost center, incase for no budget allocation for each item
        oEmployeeRollupCC = await getRollUpCostCenter(aBudgetContext[0].EMP_ID, aBudgetContext[0].ALTERNATE_COST_CENTER);
        if (oEmployeeRollupCC.error) {
            bError = true;
            errorResults.push({
                STATUS: Constant.BudgetCheckStatus.ERROR,
                MESSAGE: oEmployeeRollupCC.message
            })

            return errorResults;
        }

        const aItems =
            aBudgetContext.map((oBudgetContext) => ({
                ...Constant.EarmarkedFundPosting_Item,
                EmrkdFndsAmountInTransCrcy: Number(oBudgetContext.AMOUNT),
                FundsCenter: String(oBudgetContext.FUND_CENTER).trim(),
                CommitmentItem: String(oBudgetContext.COMMITMENT_ITEM).trim(),
                ...(oBudgetContext.INTERNAL_ORDER !== Constant.Wildcard.NA &&
                    oBudgetContext.INTERNAL_ORDER && {
                    InternalOrder: String(oBudgetContext.INTERNAL_ORDER).trim()
                })
            }));

        let oBudgetRecord = await processEarmarkedFunds(aItems, sId, null, oEmployeeRollupCC.oEmployeeRollupCC);

        if (oBudgetRecord?.Error) {
            bError = true;
            aErrorResults.push({
                STATUS: Constant.BudgetCheckStatus.LOCK_ERROR,
                LOCK_BUDGET: true,
                ERROR_MESSAGE: oBudgetRecord?.Message
            });
        } else {
            await updateEarmarkedFundDetails(
                oTx,
                sId,
                oBudgetRecord?.oEarmarkedFundsDocument,
                oBudgetRecord?.Message
            );

            aSuccessResults.push({
                STATUS: Constant.BudgetCheckStatus.SUFFICIENT,
            });
        }

        if (bError) {
            return aErrorResults;
        }

        return aSuccessResults;

    } catch (oError) {
        return oError;
    }
}
/**
 * Checks whether sufficient budget is available for each request item.
 *
 * The applicable budget record is retrieved using the internal order or the
 * relevant fund center, material group, and commitment item combination.
 * For employees outside the RD, HOD, and CXO roles, the upper-level cost
 * center may be used when retrieving the budget record.
 *
 * If any item fails the check, only the failed results are returned.
 * Otherwise, the function returns the successful results for all items.
 *
 * @param {Array<object>} aBudgetContext - Request budget context containing employee, amount, and account assignment details
 * @returns {Promise<Array<object>|Error>} Budget-check results or the caught error
 */
async function checkRequestBudget(aBudgetContext) {

    const toNum = (v) => Number(v) || 0;

    try {
        let bError = false;
        let aErrorResults = [];
        let aSuccessResults = [];
        let sCondition;
        var oEmployeeRollupCC;

        // determine upper cost center, incase for no budget allocation for each item
        oEmployeeRollupCC = await getRollUpCostCenter(aBudgetContext[0].EMP_ID, aBudgetContext[0].ALTERNATE_COST_CENTER);
        if (oEmployeeRollupCC.error) {
            bError = true;
            errorResults.push({
                STATUS: Constant.BudgetCheckStatus.ERROR,
                MESSAGE: oEmployeeRollupCC.message
            });

            return errorResults;
        }

        for (const entry of aBudgetContext) {
            if (entry.INTERNAL_ORDER != Constant.Wildcard.NA) {
                sCondition = {
                    YEAR: entry.YEAR,
                    INTERNAL_ORDER: entry.INTERNAL_ORDER,
                };
            } else {
                sCondition = {
                    YEAR: entry.YEAR,
                    INTERNAL_ORDER: entry.INTERNAL_ORDER,
                    FUND_CENTER: entry.FUND_CENTER,
                    MATERIAL_GROUP: entry.MATERIAL_GROUP,
                    COMMITMENT_ITEM: entry.COMMITMENT_ITEM
                };
            }

            let oBudgetRecord = await getBudgetRecord(sCondition, oEmployeeRollupCC.oEmployeeRollupCC);
            let oBudgetData = oBudgetRecord.data;

            if (!oBudgetData) {
                bError = true;
                aErrorResults.push({
                    ...sCondition,
                    STATUS: oBudgetRecord.error ? Constant.BudgetCheckStatus.ERROR : Constant.BudgetCheckStatus.NOT_FOUND,
                    CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM,
                    MESSAGE: oBudgetRecord.error ? oBudgetRecord.message : null
                });
                continue;
            }

            const bSufficient = toNum(entry.AMOUNT) <= toNum(oBudgetData.BudgetBalance);
            if (!bSufficient) {
                bError = true;
                aErrorResults.push({
                    ...sCondition,
                    STATUS: Constant.BudgetCheckStatus.INSUFFICIENT,
                    CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM,
                    AMOUNT: entry.AMOUNT,
                    AVAILABLE: oBudgetData.BudgetBalance
                });
                continue;
            }

            aSuccessResults.push({
                ...sCondition,
                STATUS: Constant.BudgetCheckStatus.SUFFICIENT,
                CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM
            });
            continue;
        }

        if (bError) {
            return aErrorResults;
        }

        return aSuccessResults;

    } catch (oError) {
        return oError;
    }
}
/**
 * Builds a readable error message from budget checking results, distinguishing
 * budget records that were not found from budgets with insufficient balance.
 *
 * Used by:
 *  - pre-workflow-checks.js (request/claim submission)
 *  - ../workflow-srv.js (auto-approval, final approval, reject, push back)
 *
 * @param {Array} aBudgetResults - results returned by checkRequestBudget
 *                                 lockClaimBudget and releaseClaimBudget
 *                                 (each with STATUS and CLAIM_TYPE_ITEM)
 * @returns {string|null} error message, or null when there is no budget error
 */
function buildBudgetErrorMessage(aBudgetResults) {
    if (!Array.isArray(aBudgetResults)) {
        return `Budget check failed: ${aBudgetResults?.message ?? 'unknown error'}`;
    }

    const fnItems = (sStatus) => [...new Set(
        aBudgetResults
            .filter(r => r.STATUS === sStatus)
            .map(r => {
                const sItem = r.CLAIM_TYPE_ITEM || "-";
                const sMsg = String(r.MESSAGE ?? '').trim();
                return sMsg ? `${sItem} (${sMsg})` : sItem;
            })
    )].join(", ");

    const aMessages = [];
    const sNotFoundItems = fnItems(Constant.BudgetCheckStatus.NOT_FOUND);
    const sInsufficientItems = fnItems(Constant.BudgetCheckStatus.INSUFFICIENT);

    const aBudgetLockErrors = aBudgetResults.filter(r => r.STATUS === Constant.BudgetCheckStatus.LOCK_ERROR);
    const aBudgetReleaseErrors = aBudgetResults.filter(r => r.STATUS === Constant.BudgetCheckStatus.RELEASE_ERROR);
    const sBudgetError = fnItems(Constant.BudgetCheckStatus.ERROR);

    if (sNotFoundItems) {
        aMessages.push(`Budget not found for claim item(s): ${sNotFoundItems}.`);
    }
    if (sInsufficientItems) {
        aMessages.push(`Insufficient budget for claim item(s): ${sInsufficientItems}.`);
    }
    if (aBudgetLockErrors.length) {
        aMessages.push(aBudgetLockErrors[0].ERROR_MESSAGE || 'Failed to lock budget in IFAMS.');
    }
    if (aBudgetReleaseErrors.length) {
        aMessages.push(aBudgetReleaseErrors[0].ERROR_MESSAGE || 'Failed to release budget in IFAMS.');
    }
    if (sBudgetError) {
        aMessages.push(`Error encountered during budget checking: ${sBudgetError}`);
    }

    return aMessages.length ? aMessages.join("\n") : null;
}
async function getApproverContextByLevel(sId, oDescriptor, sLevel){
    let aApproversContext = [];
    const aApproversDetails = await cds.run(
        SELECT
            .from(oDescriptor.entityApprovers)
            .where({
                [oDescriptor.approverIdField]   : sId,
                [Constant.EntitiesFields.LEVEL] : sLevel
            })
            .columns(
                Constant.EntitiesFields.APPROVER_ID,
                Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID
            )
    )
    if(!aApproversDetails.length) {
        return null;
    }
    for(const oApproverDetails of aApproversDetails) {
        let oEmployeeDetails = await retrieveEmployeeDetails(oApproverDetails[Constant.EntitiesFields.APPROVER_ID]);
        let oSubEmployeeDetails = null;
        let sSubEEID = "";
        let sSubName = "";
        let sSubEmail = "";
        if(!oEmployeeDetails) {
            return null;
        }
        console.log("Employee Details: ", oEmployeeDetails);
        if(oApproverDetails[Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID]){
            oSubEmployeeDetails = await retrieveEmployeeDetails(oApproverDetails[Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID]);
            sSubEEID = oSubEmployeeDetails ?? null;
            sSubName = oSubEmployeeDetails ? oSubEmployeeDetails[Constant.EntitiesFields.NAME] : null;
            sSubEmail = oSubEmployeeDetails ? oSubEmployeeDetails[Constant.EntitiesFields.EMAIL] : null;
            console.log("Substitute Employee Details: ", oSubEmployeeDetails);
        }
        aApproversContext.push({
            APPROVER_EEID   : oEmployeeDetails[Constant.EntitiesFields.EEID],
            APPROVER_NAME   : oEmployeeDetails[Constant.EntitiesFields.NAME],
            APPROVER_EMAIL  : oEmployeeDetails[Constant.EntitiesFields.EMAIL],
            LEVEL           : Number(oApproverDetails.LEVEL),
            SUB_EEID        : sSubEEID,
            SUB_NAME        : sSubName,
            SUB_EMAIL       : sSubEmail
        })
    }
    return aApproversContext;
}
/**
 * Inserts a ZLOG history record. Does not roll back or throw on its own
 * failure — callers decide whether a log-write failure should abort their
 * step; this function's only job is the insert.
 *
 * @param {object} oTx - cds transaction
 * @param {string} sRecordId
 * @param {string} sMessage
 * @param {string} [sMessageType='A'] - 'A' informational, 'E' error, etc.
 * @param {string} [sStatusCode='200']
 * @returns {Promise<void>}
 */
async function logWorkflowHistory(oTx, sRecordId, sMessage, sMessageType = 'A', sStatusCode = '200', sProgram = 'WORKFLOW') {
    await oTx.run(INSERT.into("ZLOG").entries({
        TIMESTAMP: new Date(),
        RECORD_ID: `${sRecordId}`,
        PROGRAM: sProgram,
        MESSAGE_TYPE: sMessageType,
        STATUS_CODE: sStatusCode,
        MESSAGE: sMessage
    }));
}

async function getRollUpCostCenter(sEmpID, sAlternateCostCenter) {
    var oEmployeeRollupCC;
    const oSkipped = { error: false, message: 'Roll up skipped', oEmployeeRollupCC: {} };

    if (sAlternateCostCenter?.trim()) return oSkipped;

    let oEmployeeDetails = await retrieveEmployeeDetails(sEmpID);
    if (!oEmployeeDetails) return oSkipped;

    if (oEmployeeDetails &&
        oEmployeeDetails[Constant.EntitiesFields.ROLE] != Constant.Role.RD &&
        oEmployeeDetails[Constant.EntitiesFields.ROLE] != Constant.Role.HOD &&
        oEmployeeDetails[Constant.EntitiesFields.ROLE] != Constant.Role.CXO &&
        !sAlternateCostCenter) {
        oEmployeeRollupCC = await rollUpCostCenter(oEmployeeDetails);
    }

    return oEmployeeRollupCC;
}

module.exports = {
    resolveDocDescriptor,
    retrieveHeaderDetails,
    retrieveEmployeeDetails,
    retrieveBudgetContext,
    retrieveItems,
    generateReturnMessage,
    buildBudgetErrorMessage,
    getApproverContextByLevel,
    retrieveRoleRank,
    retrieveRejectReasonDesc,
    logWorkflowHistory,
    checkRequestBudget,
    lockClaimBudget,
    releaseClaimBudget
};