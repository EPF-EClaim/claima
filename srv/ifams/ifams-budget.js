const cds = require('@sap/cds');
const { Constant } = require("../utils/constant");

let _ifamsConnection;
async function getIFAMSConnection() {
    if (!_ifamsConnection) {
        _ifamsConnection = await cds.connect.to('IFAMS_S4_QAS');
    }
    return _ifamsConnection;
}

async function getBudgetRecord(oCondition, oEmployeeRollupCC) {
    let oBudget;

    try {
        const norm = v => {
            const s = String(v ?? '').trim();
            return s === Constant.Wildcard.NA ? '' : s;
        };

        const esc = v => norm(v).replace(/'/g, "''");

        const sPath = Constant.IFAMS_API_PATH.BUDGET_SF
            .replace('{YEAR}', esc(oCondition.YEAR))
            .replace('{INTERNAL_ORDER}', esc(oCondition.INTERNAL_ORDER));

        const aBudgetRecords = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.GET, sPath);

        const eq = (recVal, condVal) => !norm(condVal) || norm(recVal) === norm(condVal);
        const fnFind = fc => aBudgetRecords.find(r =>
            eq(r.FundCenter, fc)
            && eq(r.CommitmentItem, oCondition.COMMITMENT_ITEM)
            && eq(r.MaterialGroup, oCondition.MATERIAL_GROUP));

        oBudget = fnFind(oCondition.FUND_CENTER);

        if (!oBudget && norm(oCondition.FUND_CENTER) && oEmployeeRollupCC && Object.keys(oEmployeeRollupCC).length > 0) {
            oBudget = [oEmployeeRollupCC.HOS_CC, oEmployeeRollupCC.HOB_CC, oEmployeeRollupCC.HOD_CC]
                .filter(cc => norm(cc))
                .map(fnFind)
                .find(Boolean);
        }
    } catch (oError) {
        return { error: true, data: oBudget, message: oError.message};
    }
    return { error: false, data: oBudget, message: 'Successfully retrieved the budget' };
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

async function processEarmarkedFunds(aEarmarkedFundItems, sRecordID, sAction, oEmployeeRollupCC) {
    var oEarmarkedFundsDocument;
    var oEarMarkedFundsPayload;
    var sPath;
    var sMessage;
    var bError;

    try {
        if ((sAction === Constant.Status.PUSH_BACK || sAction === Constant.Status.REJECTED) && aEarmarkedFundItems.length > 0) {
            var oResponse;

            for (const item of aEarmarkedFundItems) {
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
                aEarmarkedFundItems
        };

        sPath = Constant.IFAMS_API_PATH.EARMARKEDFUNDS;
        oEarmarkedFundsDocument = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.POST, sPath, oEarMarkedFundsPayload);

        // if no budget allocation, use budget lookup to higher hierarchy
        if (!oEarmarkedFundsDocument && oEmployeeRollupCC && Object.keys(oEmployeeRollupCC).length > 0) {
            var aNewCCItems = [];
            var iCount = 2;
            let sCostCenter = Constant.RollUp_CostCenter.HOS_COSTCENTER;

            while (iCount > 0) {
                iCount--;
                aNewCCItems = []; // clear item for next iteration
                if (oEmployeeRollupCC[sCostCenter]) {
                    // rebuild payload
                    for (const item of aEarmarkedFundItems) {
                        aNewCCItems.push({
                            ...
                            Constant.EarmarkedFundPosting_Item,
                            EmrkdFndsAmountInTransCrcy: item.EmrkdFndsAmountInTransCrcy,
                            FundsCenter: oEmployeeRollupCC[sCostCenter],
                            CommitmentItem: item.CommitmentItem
                        });
                    }

                    oEarMarkedFundsPayload = {
                        ...
                        Constant.EarmarkedFundPosting_DocHeader,
                        EarmarkedFundsHeaderText: sRecordID,
                        _EarmarkedFundsDocumentItem:
                            aNewCCItems
                    }

                    oEarmarkedFundsDocument = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.POST, sPath, oEarMarkedFundsPayload);

                    if (oEarmarkedFundsDocument) break;
                }
                if (oEmployeeRollupCC[Constant.RollUp_CostCenter.HOB_COSTCENTER]) {
                    sCostCenter = Constant.RollUp_CostCenter.HOB_COSTCENTER;
                } else if (oEmployeeRollupCC[Constant.RollUp_CostCenter.HOD_COSTCENTER]) {
                    sCostCenter = Constant.RollUp_CostCenter.HOD_COSTCENTER;
                }
            }
        }

    } catch (oError) {
        return {
            Error: true,
            oEarmarkedFundsDocument,
            Message: oError.message
        }
    }

    if (!oEarmarkedFundsDocument) {
        bError = true;
        sMessage = 'Budget not found';
    } else {
        bError = false;
        sMessage = `EarmarkedFunds Document created. Doc ID: ${oEarmarkedFundsDocument.EarmarkedFundsDocument}`;
    }

    return {
        Error: bError,
        oEarmarkedFundsDocument,
        Message: sMessage
    }
}

async function rollUpCostCenter(oEmployeeDetails) {
    const sEmpMasterTable = cds.entities['eclaim_srv.ZEMP_MASTER'];
    const sRoleHierarchyTable = cds.entities['eclaim_srv.ZROLEHIERARCHY'];

    let sDirectSuperior = oEmployeeDetails[Constant.EntitiesFields.DIRECT_SUPERIOR];
    let iCounter = 20;
    var oEmployeeRollupCC = {};
    let sRank;

    try {
        const aRoleHierarchy = await cds.run(SELECT.from(sRoleHierarchyTable));
        while (iCounter > 0) {
            iCounter--;

            var oDirectSuperior = await cds.run(SELECT.one.from(sEmpMasterTable).
                where({ [Constant.EntitiesFields.EEID]: sDirectSuperior }));

            if (!oDirectSuperior) break;

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
                case (Constant.Role.HOD):
                    oEmployeeRollupCC.HOD_CC = oDirectSuperior.CC;
                    break;
                default:
                    break;
            }

            sDirectSuperior = oDirectSuperior[Constant.EntitiesFields.DIRECT_SUPERIOR];

            if (oEmployeeRollupCC.HOD_CC || oEmployeeRollupCC.HOB_CC) break;
        }

        return oEmployeeRollupCC;
    } catch (oError) {
        console.log(oError.message);
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
            UPDATE(Constant.Entities.ZCLAIM_HEADER)
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
            SELECT.from(Constant.Entities.ZCLAIM_ITEM)
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

            await oTx.run(
                UPDATE(Constant.Entities.ZCLAIM_ITEM)
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