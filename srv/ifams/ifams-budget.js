const { Constant } = require("../utils/constant");

let _ifamsConnection;
async function getIFAMSConnection() {
    if (!_ifamsConnection) {
        _ifamsConnection = await cds.connect.to('IFAMS_S4_QAS');
    }
    return _ifamsConnection;
}

async function getBudgetRecord(oCondition, oEmployeeRollupCC) {
    var oBudgetRecord;

    try {
        const sPath = Constant.IFAMS_API_PATH.BUDGET_SF
            .replace('{YEAR}', oCondition.YEAR)
            .replace('{COMMITMENT_ITEM}', oCondition?.COMMITMENT_ITEM)
            // .replace('{MATERIAL_GROUP}', String(oCondition?.MATERIAL_GROUP))
            .replace('{INTERNAL_ORDER}', oCondition.INTERNAL_ORDER === Constant.Wildcard.NA ? '' : oCondition.INTERNAL_ORDER);

        const aBudgetRecords = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.GET, sPath);

        // further filter on the returned records
        oBudgetRecord = aBudgetRecords.find(record => String(record.FundCenter).trim() === String(oCondition.FUND_CENTER).trim() &&
            String(record.CommitmentItem).trim() === String(oCondition.COMMITMENT_ITEM).trim() &&
            String(record.MaterialGroup).trim() === String(oCondition.MATERIAL_GROUP).trim());

        // if no budget found, look into roll up CC
        if (!oBudgetRecord && oEmployeeRollupCC) {
            var oHOSBudget, oHOBBudget, oHODBudget;

            if (oEmployeeRollupCC.HOS_CC) {
                oHOSBudget = aBudgetRecords.find(record => String(record.FundCenter).trim() === String(oEmployeeRollupCC.HOS_CC).trim() &&
                    String(record.CommitmentItem).trim() === String(oCondition.COMMITMENT_ITEM).trim() &&
                    String(record.MaterialGroup).trim() === String(oCondition.MATERIAL_GROUP).trim());
            }

            if (oEmployeeRollupCC.HOB_CC) {
                oHOBBudget = aBudgetRecords.find(record => String(record.FundCenter).trim() === String(oEmployeeRollupCC.HOB_CC).trim() &&
                    String(record.CommitmentItem).trim() === String(oCondition.COMMITMENT_ITEM).trim() &&
                    String(record.MaterialGroup).trim() === String(oCondition.MATERIAL_GROUP).trim());
            }

            if (oEmployeeRollupCC.HOD_CC) {
                oHODBudget = aBudgetRecords.find(record => String(record.FundCenter).trim() === String(oEmployeeRollupCC.HOD_CC).trim() &&
                    String(record.CommitmentItem).trim() === String(oCondition.COMMITMENT_ITEM).trim() &&
                    String(record.MaterialGroup).trim() === String(oCondition.MATERIAL_GROUP).trim());
            }

            switch (true) {
                case (oHOSBudget): 
                    oBudgetRecord = oHOSBudget;
                    break;
                case (!oHOSBudget && oHOBBudget): 
                    oBudgetRecord = oHOBBudget;
                    break;
                case (!oHOSBudget && oHODBudget): 
                    oBudgetRecord = oHODBudget;
                    break;
                default:
                    break;
            }
        }
    } catch (error) {
        console.log(error);
    }

    return oBudgetRecord;
}

async function executeIFAMSRequest(sMethod, sPath, oData = undefined) {
    const IFAMS_Service = await getIFAMSConnection();
    var aRecords = await IFAMS_Service.send({
        method: sMethod,
        path: sPath,
        data: oData
    });
    return aRecords;
}

async function processEarmarkedFunds(aEarmakedFundItems, sRecordID, sAction, oEmployeeRollupCC) {
    var oEarmarkedFundsDocument;
    var oEarMarkedFundsPayload
    var sPath;

    try {
        if ((sAction === Constant.Status.PUSH_BACK || sAction === Constant.Status.REJECTED) && aEarmakedFundItems.length > 0) {
            var oResponse;

            for (const item of aEarmakedFundItems) {
                sPath = Constant.IFAMS_API_PATH.RELEASE_EARMARKEDFUNDS
                    .replace('{DOC_NO}', sRecordID)
                    .replace('{ITEM_NO}', item.EarmarkedFundsDocumentItem);

                oEarMarkedFundsPayload = {
                    FundsCenter: item.FundsCenter,
                    CommitmentItem: item.CommitmentItem,
                    EmrkdFndsItmIsCompleted: true
                }

                oResponse = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.PATCH, sPath, oEarMarkedFundsPayload);
            }
            return { oResponse, Message: `EarmarkedFunds Document has been released. Doc ID: ${sRecordID}` }
        
        } 

        oEarMarkedFundsPayload = {
            ...
            Constant.EarmarkedFundPosting_DocHeader,
            EarmarkedFundsHeaderText: sRecordID,
            _EarmarkedFundsDocumentItem:
                aEarmakedFundItems
        };

        // check for budget allocation, if no allocation, use budget lookup to higher hierarchy

        sPath = Constant.IFAMS_API_PATH.EARMARKEDFUNDS;
        oEarmarkedFundsDocument = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.POST, sPath, oEarMarkedFundsPayload);

    } catch (error) {
        return {
            Error: true,
            Message: error.message
        }
    }

    return {
        oEarmarkedFundsDocument,
        Message: `EarmarkedFunds Document created. Doc ID: ${oEarmarkedFundsDocument.EarmarkedFundsDocument}`
    }
}

async function rollUpCostCenter(oEmployeeDetails) {
    const sEmpMasterTable = cds.entities['eclaim_srv.ZEMP_MASTER'];
    const sRoleHierarchyTable = cds.entities['eclaim_srv.ZROLEHIERARCHY'];
    const aRoleHierarchy = await cds.run(SELECT.from(sRoleHierarchyTable));

    let sDirectSuperior = oEmployeeDetails[Constant.EntitiesFields.DIRECT_SUPERIOR];
    let iCounter = 20;
    var oEmployeeRollupCC = {};
    let sRank;

    try {
        while (iCounter > 0) {
            iCounter--;

            var oDirectSuperior = await cds.run(SELECT.one.from(sEmpMasterTable).
                where({ [Constant.EntitiesFields.EEID]: sDirectSuperior }));

            sRank = (aRoleHierarchy.find(role => role.ROLE === oDirectSuperior.ROLE))?.RANK;
            if (sRank > (aRoleHierarchy.find(role => role.ROLE === Constant.Role.HOD)).RANK) {
                break;
            }

            switch (oDirectSuperior.ROLE) {
                case (Constant.Role.HOS):
                    oEmployeeRollupCC.HOS_CC = oDirectSuperior.CC;
                    break;
                case (Constant.Role.HOB):
                    oEmployeeRollupCC.HOB_CC = oDirectSuperior.CC;
                    break;
                case (Constant.Role.RD):
                    oEmployeeRollupCC.RD_CC = oDirectSuperior.CC;
                    break;
                case (Constant.Role.HOD):
                    oEmployeeRollupCC.HOD_CC = oDirectSuperior.CC;
                    break;
                default:
                    break;
            }

            sDirectSuperior = oDirectSuperior[Constant.EntitiesFields.DIRECT_SUPERIOR];

            if (oEmployeeRollupCC.HOD_CC || oEmployeeRollupCC.HOB_CC || oEmployeeRollupCC.RD_CC) break;
        }

        return oEmployeeRollupCC;
    } catch (error) {
        console.log(error.message);
    }
}

async function updateEarmarkedFundDetails(oTx, sClaimId, oEarmarkedFundsDocument, sMessage, sAction) {
    const bIsBudgetReleaseAction = sAction === Constant.Status.REJECTED || sAction === Constant.Status.PUSH_BACK;
    let sProgram;

    // =====================================================
    // REJECT / PUSH BACK
    // Clear Earmarked Funds references after IFAMS release
    // =====================================================
    if (bIsBudgetReleaseAction) {

        // 1. Clear ZCLAIM_HEADER
        await oTx.run(
            UPDATE(Constant.Entities.ZCLAIM_HEADER)
                .set({
                    EARMARKED_FUNDS_DOC_COMP_CODE: null,
                    EARMARKED_FUNDS_DOC_ID: null,
                    EARMARKED_FUNDS_DOC_YEAR: null
                })
                .where({
                    CLAIM_ID: sClaimId
                })
        );

        // 2. Clear ZCLAIM_ITEM
        await oTx.run(
            UPDATE(Constant.Entities.ZCLAIM_ITEM)
                .set({
                    EARMARKED_FUNDS_DOC_ITEM_ID: null
                })
                .where({
                    CLAIM_ID: sClaimId
                })
        );
        // Set ZLOG program for release
        sProgram = Constant.BudgetLog.PROGRAM.RELEASE;
    }
    // =====================================================
    // Save newly created Earmarked Funds information
    // =====================================================
    else {
        if (!oEarmarkedFundsDocument) {  
            throw new Error(
                `Earmarked Funds Document is required for Claim ${sClaimId}`
            );
        }
        const sDocumentYear = oEarmarkedFundsDocument.EmrkdFndsDocCreationDate?.substring(0, 4);

        // 1. Update ZCLAIM_HEADER
        await oTx.run(
            UPDATE('ZCLAIM_HEADER')
                .set({
                    EARMARKED_FUNDS_DOC_COMP_CODE:
                        oEarmarkedFundsDocument.CompanyCode,
                    EARMARKED_FUNDS_DOC_ID:
                        oEarmarkedFundsDocument.EarmarkedFundsDocument,
                    EARMARKED_FUNDS_DOC_YEAR:
                        sDocumentYear
                })
                .where({
                    CLAIM_ID: sClaimId
                })
        );

        const aClaimItems = await oTx.run(
            SELECT.from('ZCLAIM_ITEM')
                .columns('CLAIM_ID', 'CLAIM_SUB_ID')
                .where({
                    CLAIM_ID: sClaimId
                })
        );

        // 2. Update ZCLAIM_ITEM
        for (const oEarmarkedItem of oEarmarkedFundsDocument._EarmarkedFundsDocumentItem) {

            const sItemNo = String(
                oEarmarkedItem.EarmarkedFundsDocumentItem
            ).padStart(3, '0');

            const oClaimItem = aClaimItems.find(
                oItem => oItem.CLAIM_SUB_ID?.slice(-3) === sItemNo
            );

            if (!oClaimItem) {
                continue;
            }

            const iUpdated = await oTx.run(
                UPDATE('ZCLAIM_ITEM')
                    .set({
                        EARMARKED_FUNDS_DOC_ITEM_ID:
                            oEarmarkedItem.EarmarkedFundsDocumentItem
                    })
                    .where({
                        CLAIM_ID: oClaimItem.CLAIM_ID,
                        CLAIM_SUB_ID: oClaimItem.CLAIM_SUB_ID
                    })
            );
        }

        // Set ZLOG program for submission
        sProgram = Constant.BudgetLog.PROGRAM.SUBMISSION_LOCK;
    }
    // =====================================================
    // ZLOG
    // Used for both CREATE and RELEASE
    // =====================================================
    await oTx.run(
        INSERT.into(Constant.Entities.ZLOG)
            .entries({
                TIMESTAMP: new Date(),
                RECORD_ID: sClaimId,
                PROGRAM: sProgram,
                MESSAGE_TYPE: Constant.BudgetLog.MESSAGE_TYPE,
                STATUS_CODE: Constant.StatusCode.SUCCESS,
                MESSAGE: sMessage
            })
    );
}

module.exports = {
    getBudgetRecord,
    processEarmarkedFunds,
    rollUpCostCenter,
    updateEarmarkedFundDetails    
}