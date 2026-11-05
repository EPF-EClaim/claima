const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../utils/constant");
const { constants } = require('@sap/xssec');
const { getBudgetRecord, processEarmarkedFunds, rollUpCostCenter, updateEarmarkedFundDetails } = require('../ifams/ifams-budget');
const { retrieveClaimFlexiPosting, determineBudgetYear, determineClaimPostingDate } = require('../ifams/pre-checking-budget');

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
    if (typeof sId !== "string") return undefined;
    return aEntityTableByPrefix[sId.slice(0, 3)];
}
async function retrieveHeaderDetails(sId, oDescriptor) {
    const aColumns = [
        oDescriptor.idField,
        oDescriptor.typeField,
        oDescriptor.entityTypeDesc,
        Constant.EntitiesFields.EMP_ID,
        Constant.EntitiesFields.COST_CENTER,
        Constant.EntitiesFields.ALTERNATE_COST_CENTER,
        Constant.EntitiesFields.PROJECT_CODE
    ];

    if (oDescriptor.entityPrefix === Constant.WorkflowType.REQUEST) aColumns.push(Constant.EntitiesFields.TRIP_START_DATE);  // to be used for cross budget checking

    const oHeader =  await cds.run(
        SELECT
            .one
            .from(oDescriptor.entityHeader)
            .columns(...aColumns)
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
        return [{ RANK: '0', ROLE: 'Normal' }];
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
        aColumns.push(Constant.EntitiesFields.RECEIPT_DATE);    // to be used for cross budget checking
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
            ALTERNATE_COST_CENTER   : oHeaderContext.ALTERNATE_COST_CENTER,  // for checking against roll up cost center
            HEADER_COST_CENTER: oHeaderContext[Constant.EntitiesFields.COST_CENTER], // for item cost center validation
            RECEIPT_DATE: oDescriptor.entityPrefix === Constant.WorkflowType.REQUEST ?
                oHeaderContext[Constant.EntitiesFields.TRIP_START_DATE] : oItemContext[Constant.EntitiesFields.RECEIPT_DATE] // to be used for cross budget checking
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
    );
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
async function lockClaimBudget(oTx, aBudgetContext, sId, aCheckResults = []) {

    try {
        let bError = false;
        let aErrorResults = [];
        let aSuccessResults = [];

        // fetch data from SF MDF to determine cross budget year
        var oClaimFlexiPosting = await retrieveClaimFlexiPosting();
        if (oClaimFlexiPosting.error) {
            bError = true;
            aErrorResults.push({
                STATUS: Constant.BudgetCheckStatus.ERROR,
                MESSAGE: oClaimFlexiPosting.message
            })

            return aErrorResults;
        }

        // map each line index -> fund center that has sufficient budget
        const oResolvedFC = {};
        for (const r of aCheckResults) {
            if (r.IS_IO || !r.RESOLVED_FUND_CENTER) continue;   // internal order lines keep their own FC
            for (const i of (r.ITEM_INDEXES || [])) {
                oResolvedFC[i] = r.RESOLVED_FUND_CENTER;
            }
        }

        const aItems =
            aBudgetContext.map((oBudgetContext, iIndex) => ({
                ...Constant.EarmarkedFundPosting_Item,
                EmrkdFndsAmountInTransCrcy: Number(oBudgetContext.AMOUNT),
                FundsCenter: String(oResolvedFC[iIndex] || oBudgetContext.FUND_CENTER).trim(),
                CommitmentItem: String(oBudgetContext.COMMITMENT_ITEM).trim(),
                DocumentItemText: String(oBudgetContext.MATERIAL_GROUP).trim(),
                PostingDate: determineClaimPostingDate(oBudgetContext.RECEIPT_DATE, oClaimFlexiPosting.oFlexiPostingRecord),
                ...(oBudgetContext.INTERNAL_ORDER !== Constant.Wildcard.NA &&
                    oBudgetContext.INTERNAL_ORDER && {
                    InternalOrder: String(oBudgetContext.INTERNAL_ORDER).trim()
                })
            }));

        let oBudgetRecord = await processEarmarkedFunds(aItems, sId, null);

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

            // fund center will be the same for all items
            // update claim header/item based on the new cost center (in case of roll up cost center)
            // skip if alternate cost center available as the budget check/lock will always take alternate if available
            var sFundCenter = oBudgetRecord?.oEarmarkedFundsDocument?._EarmarkedFundsDocumentItem?.[0]?.FundsCenter;
            if (sFundCenter && !aBudgetContext[0].ALTERNATE_COST_CENTER) {
                for (const sEntity of [Constant.Entities.ZCLAIM_HEADER, Constant.Entities.ZCLAIM_ITEM]) {
                    await oTx.run(UPDATE(sEntity).set({ [Constant.EntitiesFields.COST_CENTER]: sFundCenter }).where({ CLAIM_ID: sId }));
                }
            }
        }

        if (bError) {
            return aErrorResults;
        }

        return aSuccessResults;

    } catch (oError) {
        return [{
            STATUS: Constant.BudgetCheckStatus.LOCK_ERROR,
            LOCK_BUDGET: true,
            ERROR_MESSAGE: oError.message
        }];
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
 * @param {object} oTx - cds transaction
 * @param {Array<object>} aBudgetContext - Request budget context containing employee, amount, and account assignment details
 * @param {string} sId - Request ID
 * @returns {Promise<Array<object>|Error>} Budget-check results or the caught error
 */
async function checkRequestBudget(oTx, aBudgetContext, sId) {

    const toNum = (v) => Number(v) || 0;
    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

    const norm = (v) => {
        const s = String(v ?? '').trim();
        return s === Constant.Wildcard.NA ? '' : s;
    };

    try {
        let bError = false;
        let aErrorResults = [];
        let aSuccessResults = [];

        if (!Array.isArray(aBudgetContext) || !aBudgetContext.length) {
            return [{
                STATUS: Constant.BudgetCheckStatus.ERROR,
                MESSAGE: 'No claim items to check budget'
            }];
        }

        // determine upper cost center, in case of no budget allocation for each item
        const oEmployeeRollupCC = await getRollUpCostCenter(aBudgetContext[0].EMP_ID, aBudgetContext[0].ALTERNATE_COST_CENTER);
        if (oEmployeeRollupCC.error) {
            bError = true;
            aErrorResults.push({
                STATUS: Constant.BudgetCheckStatus.ERROR,
                MESSAGE: oEmployeeRollupCC.message
            });
            return aErrorResults;
        }

        // check for range date against api
        const oClaimFlexiPosting = await retrieveClaimFlexiPosting();
        if (oClaimFlexiPosting.error) {
            bError = true;
            aErrorResults.push({
                STATUS: Constant.BudgetCheckStatus.ERROR,
                MESSAGE: oClaimFlexiPosting.message
            });
            return aErrorResults;
        }

        const oGroups = {};

        for (const [iIndex, entry] of aBudgetContext.entries()) {
            const sYear = determineBudgetYear(entry.RECEIPT_DATE, oClaimFlexiPosting.oFlexiPostingRecord);

            let sCondition;
            if (entry.INTERNAL_ORDER != Constant.Wildcard.NA) {
                sCondition = {
                    YEAR: sYear,
                    INTERNAL_ORDER: entry.INTERNAL_ORDER
                };
            } else {
                sCondition = {
                    YEAR: sYear,
                    INTERNAL_ORDER: entry.INTERNAL_ORDER,
                    FUND_CENTER: entry.FUND_CENTER,
                    COMMITMENT_ITEM: entry.COMMITMENT_ITEM,
                    MATERIAL_GROUP: entry.MATERIAL_GROUP
                };
            }

            const sKey = [
                sCondition.YEAR,
                sCondition.INTERNAL_ORDER,
                sCondition.FUND_CENTER || '',
                sCondition.COMMITMENT_ITEM || '',
                sCondition.MATERIAL_GROUP || ''
            ].join('|');

            if (!oGroups[sKey]) {
                oGroups[sKey] = {
                    sCondition: sCondition,
                    TOTAL_AMOUNT: 0,
                    CLAIM_TYPE_ITEMS: [],
                    ITEM_INDEXES: [],
                    NOT_FOUND_AT: [],
                    oBudgetData: null,
                    bIO: entry.INTERNAL_ORDER != Constant.Wildcard.NA
                };
            }

            oGroups[sKey].TOTAL_AMOUNT = round2(oGroups[sKey].TOTAL_AMOUNT + toNum(entry.AMOUNT));
            oGroups[sKey].CLAIM_TYPE_ITEMS.push(entry.CLAIM_TYPE_ITEM);
            oGroups[sKey].ITEM_INDEXES.push(iIndex);
        }

        const aGroups = Object.values(oGroups);

        const oRollup = oEmployeeRollupCC.oEmployeeRollupCC || {};
        const aLevels = [
            { LEVEL: 'EMP', FUND_CENTER: null },
            { LEVEL: 'HOS', FUND_CENTER: norm(oRollup.HOS_CC) },
            { LEVEL: 'HOB', FUND_CENTER: norm(oRollup.HOB_CC) },
            { LEVEL: 'HOD', FUND_CENTER: norm(oRollup.HOD_CC) }
        ].filter(l => l.LEVEL === 'EMP' || l.FUND_CENTER);

        const oCache = {};
        let sFinalLevel = 'EMP';

        for (const oLevel of aLevels) {
            let bRollUpNeeded = false;

            for (const oGroup of aGroups) {

                // internal order groups have no fund center, check at Employee level only
                if (oGroup.bIO && oLevel.LEVEL !== 'EMP') continue;

                const sFC = oLevel.LEVEL === 'EMP'
                    ? oGroup.sCondition.FUND_CENTER
                    : oLevel.FUND_CENTER;

                if (!oGroup.bIO && !sFC) {
                    oGroup.oBudgetData = null;
                    oGroup.NOT_FOUND_AT.push(`- (${oLevel.LEVEL})`);
                    bRollUpNeeded = true;
                    continue;
                }

                const oBudgetRecord = await getBudgetRecord(oGroup.sCondition, sFC, oCache);

                if (oBudgetRecord.error) {
                    aErrorResults.push({
                        ...oGroup.sCondition,
                        STATUS: Constant.BudgetCheckStatus.ERROR,
                        CLAIM_TYPE_ITEMS: oGroup.CLAIM_TYPE_ITEMS,
                        TOTAL_AMOUNT: oGroup.TOTAL_AMOUNT,
                        MESSAGE: oBudgetRecord.message
                    });
                    return aErrorResults;
                }

                oGroup.oBudgetData = oBudgetRecord.data;

                if (!oBudgetRecord.data) {
                    oGroup.NOT_FOUND_AT.push(oGroup.bIO
                        ? `${oLevel.LEVEL}`
                        : `${sFC || '-'} (${oLevel.LEVEL})`);

                    if (!oGroup.bIO) bRollUpNeeded = true;

                }
            }

            sFinalLevel = oLevel.LEVEL;

            // Only roll up when there is NOT_FOUND
            if (!bRollUpNeeded) break;
        }

        const fnGroupLabel = (c) => c.INTERNAL_ORDER != Constant.Wildcard.NA
            ? `Internal Order ${c.INTERNAL_ORDER}`
            : `Fund Center ${c.FUND_CENTER}`;

        const fnMsg = (...aParts) => aParts.filter(Boolean).join('. ') || null;

        const oConsumed = {};

        for (const oGroup of aGroups) {
            const oBudgetData = oGroup.oBudgetData;
            const sGroupLevel = oGroup.bIO ? 'EMP' : sFinalLevel;
            const sLabel = fnGroupLabel(oGroup.sCondition);

            const sNotFoundMsg = oGroup.NOT_FOUND_AT.length
                ? `Not found at ${oGroup.NOT_FOUND_AT.join(', ')}`
                : null;

            const sRollUpMsg = (sGroupLevel !== 'EMP' && oBudgetData)
                ? `Rolled up to ${oBudgetData.FundCenter} (${sGroupLevel})`
                : null;

            const oBase = {
                ...oGroup.sCondition,
                CLAIM_TYPE_ITEMS: oGroup.CLAIM_TYPE_ITEMS,
                ROLLUP_LEVEL: sGroupLevel,
                NOT_FOUND_AT: oGroup.NOT_FOUND_AT
            };

            // NOT FOUND (still missing at final level)
            if (!oBudgetData) {
                bError = true;
                aErrorResults.push({
                    ...oBase,
                    STATUS: Constant.BudgetCheckStatus.NOT_FOUND,
                    MESSAGE: fnMsg(sLabel, sNotFoundMsg)
                });
                continue;
            }

            const sResolvedKey = [
                oGroup.sCondition.YEAR,
                oGroup.sCondition.INTERNAL_ORDER,
                oBudgetData.FundCenter,
                oBudgetData.CommitmentItem,
                oBudgetData.MaterialGroup
            ].join('|');

            const nUsed = oConsumed[sResolvedKey] || 0;
            const nAvailable = round2(toNum(oBudgetData.BudgetBalance) - nUsed);

            // INSUFFICIENT (checked at final level)
            if (oGroup.TOTAL_AMOUNT > nAvailable) {
                bError = true;
                aErrorResults.push({
                    ...oBase,
                    STATUS: Constant.BudgetCheckStatus.INSUFFICIENT,
                    RESOLVED_FUND_CENTER: oBudgetData.FundCenter,
                    MESSAGE: fnMsg(sLabel, sNotFoundMsg, sRollUpMsg)
                });
                continue;
            }

            // SUFFICIENT
            oConsumed[sResolvedKey] = round2(nUsed + oGroup.TOTAL_AMOUNT);

            aSuccessResults.push({
                ...oBase,
                STATUS: Constant.BudgetCheckStatus.SUFFICIENT,
                AVAILABLE: nAvailable,
                RESOLVED_FUND_CENTER: oBudgetData.FundCenter,
                ITEM_INDEXES: oGroup.ITEM_INDEXES,
                IS_IO: oGroup.bIO,
                MESSAGE: fnMsg(sNotFoundMsg, sRollUpMsg)
            });
        }


        return bError ? aErrorResults : aSuccessResults;

    } catch (oError) {
        return [{
            STATUS: Constant.BudgetCheckStatus.ERROR,
            MESSAGE: oError.message
        }];
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

    const aMessages = [];

    const fnGetItems = (r) => {
        return Array.isArray(r.CLAIM_TYPE_ITEMS) && r.CLAIM_TYPE_ITEMS.length
            ? [...new Set(r.CLAIM_TYPE_ITEMS)].join(", ")
            : (r.CLAIM_TYPE_ITEM || "-");
    };

    aBudgetResults.forEach(r => {
        const sItem = fnGetItems(r);

        // ============================================================
        // 1. BUDGET NOT FOUND AT PREVIOUS LEVEL(S)
        // ============================================================
        if (Array.isArray(r.NOT_FOUND_AT) && r.NOT_FOUND_AT.length) {
            const bIO = r.INTERNAL_ORDER && r.INTERNAL_ORDER !== Constant.Wildcard.NA;  

            r.NOT_FOUND_AT.forEach(sNotFoundAt => {

                // >>> CHANGE 2: IO shows Internal Order, FC strips "(EMP)"
                const sTarget = bIO
                    ? `Internal Order ${r.INTERNAL_ORDER}`
                    : `Fund Center ${sNotFoundAt.replace(/\s*\(EMP\)\s*$/i, "")}`;

                aMessages.push(`• Budget Not Found: ${sItem} (${sTarget})`); 
            });
        }

        // ============================================================
        // 2. FINAL STATUS = BUDGET NOT FOUND
        //
        // Only add this if NOT_FOUND_AT does not already contain it,
        // otherwise we would show the same level twice.
        // ============================================================
        if (
            r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND &&
            (!Array.isArray(r.NOT_FOUND_AT) || !r.NOT_FOUND_AT.length)
        ) {
            const sLevel = r.ROLLUP_LEVEL
                ? ` (${r.ROLLUP_LEVEL})`
                : "";

            const sFundCenter =
                r.RESOLVED_FUND_CENTER ||
                r.FUND_CENTER;

            aMessages.push(
                `• Budget Not Found: ${sItem} ` +
                `(Fund Center ${sFundCenter}${sLevel})`
            );
        }

        // ============================================================
        // 3. FINAL STATUS = INSUFFICIENT BUDGET
        // ============================================================
        if (r.STATUS === Constant.BudgetCheckStatus.INSUFFICIENT) {
            const sFundCenter =
                r.RESOLVED_FUND_CENTER ||
                r.FUND_CENTER;

            const sLevel =
                r.ROLLUP_LEVEL && r.ROLLUP_LEVEL !== "EMP"
                    ? ` (${r.ROLLUP_LEVEL})`
                    : "";

            aMessages.push(
                `• Insufficient Budget: ${sItem} ` +
                `(Fund Center ${sFundCenter}${sLevel})`
            );
        }

        // ============================================================
        // 4. BUDGET LOCK ERROR
        // ============================================================
        if (r.STATUS === Constant.BudgetCheckStatus.LOCK_ERROR) {
            aMessages.push(
                `• ${r.ERROR_MESSAGE || 'Failed to lock budget in IFAMS.'}`
            );
        }

        // ============================================================
        // 5. BUDGET RELEASE ERROR
        // ============================================================
        if (r.STATUS === Constant.BudgetCheckStatus.RELEASE_ERROR) {
            aMessages.push(
                `• ${r.ERROR_MESSAGE || 'Failed to release budget in IFAMS.'}`
            );
        }

        // ============================================================
        // 6. GENERAL BUDGET ERROR
        // ============================================================
        if (r.STATUS === Constant.BudgetCheckStatus.ERROR) {
            const sMessage = String(r.MESSAGE ?? '').trim();

            aMessages.push(
                `• Error encountered during budget checking: ${sItem}` +
                (sMessage ? ` (${sMessage})` : "")
            );
        }

        // ============================================================
        // 7. COST CENTER VALIDATION ERROR
        // ============================================================
        if (r.STATUS === Constant.BudgetCheckStatus.CC_VALIDATION) {
            const sMessage = String(r.MESSAGE ?? '').trim();

            aMessages.push(
                `• Cost Center Validation Failed for claim item(s): ${sItem}` +
                (sMessage ? ` (${sMessage})` : "")
            );
        }
    });

    // Remove duplicate messages, if any
    const aUniqueMessages = [...new Set(aMessages)];

    return aUniqueMessages.length
        ? aUniqueMessages.join("\n")
        : null;
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
    );
    if(!aApproversDetails.length) {
        return null;
    }
    for (const oApproverDetails of aApproversDetails) {
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
        });
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

/**
 * Get roll up cost center
 * In case of no parent cost center found during budget checking or budget locking
 * roll up cost center will be used to determine the budget 
 *
 * @param {string} sEmpID Employee ID
 * @param {string} sAlternateCostCenter Alternate cost center
 * @returns  {Promise<{error: boolean, message: string, oEmployeeRollupCC: object}>}
 */
async function getRollUpCostCenter(sEmpID, sAlternateCostCenter) {
    const oSkipped = { error: false, message: 'Roll up skipped', oEmployeeRollupCC: {} };
    if (!sEmpID || sAlternateCostCenter?.trim()) return oSkipped;

    let oEmployeeDetails = await retrieveEmployeeDetails(sEmpID);
    if (!oEmployeeDetails) return oSkipped;

    const aNoRollUpRoles = [Constant.Role.RD, Constant.Role.HOD, Constant.Role.CXO];
    if (aNoRollUpRoles.includes(oEmployeeDetails[Constant.EntitiesFields.ROLE])) return oSkipped;

    return rollUpCostCenter(oEmployeeDetails);
}

/**
 * Validates the fund center against the expected cost center for each budget context.
 *
 * The expected cost center is determined using the alternate cost center when
 * available; otherwise, the header cost center is used. If the fund center does
 * not match the expected cost center, a cost center validation error is added.
 *
 * If all cost centers are valid, an empty array is returned.
 *
 * @param {Array<object>} aBudgetContext - Budget context containing fund center and cost center details
 * @returns {Array<object>} Cost center validation errors, or an empty array if all cost centers are valid
 */
function validateCostCenter(aBudgetContext) {
    const aErrorResults = [];

    if (!Array.isArray(aBudgetContext) || aBudgetContext.length === 0) {
        return aErrorResults;
    }

    for (const oBudgetContext of aBudgetContext) {
        const sExpectedCostCenter =
            oBudgetContext.ALTERNATE_COST_CENTER ||
            oBudgetContext.HEADER_COST_CENTER;

        if (
            sExpectedCostCenter &&
            oBudgetContext.FUND_CENTER !== sExpectedCostCenter
        ) {
            aErrorResults.push({
                STATUS: Constant.BudgetCheckStatus.CC_VALIDATION,
                CLAIM_TYPE_ITEM: oBudgetContext.CLAIM_TYPE_ITEM,
                MESSAGE: `Cost center ${oBudgetContext.FUND_CENTER} does not match expected cost center ${sExpectedCostCenter}.`
            });
        }
    }

    return aErrorResults;
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
    releaseClaimBudget,
    validateCostCenter
};