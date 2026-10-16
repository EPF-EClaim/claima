const { Constant } = require("../utils/constant");
const { generateReturnMessage } = require('../workflow/workflow-helper');

let _ifamsConnection;
async function getIFAMSConnection() {
    if (!_ifamsConnection) {
        _ifamsConnection = await cds.connect.to('IFAMS_S4_QAS');
    }
    return _ifamsConnection;
}

async function getBudgetRecord(oCondition) {
    var oBudgetRecord;

    try {
        const sPath = Constant.IFAMS_API_PATH.BUDGET_SF
            .replace('{YEAR}', oCondition.YEAR)
            .replace('{FUND_CENTER}', oCondition?.FUND_CENTER)
            .replace('{COMMITMENT_ITEM}', oCondition?.COMMITMENT_ITEM)
            .replace('{MATERIAL_GROUP}', oCondition?.MATERIAL_GROUP)
            .replace('{INTERNAL_ORDER}', oCondition.INTERNAL_ORDER === Constant.Wildcard.NA ? '' : oCondition.INTERNAL_ORDER);

        const aBudgetRecords = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.GET, sPath);

        // further filter on the returned records
        oBudgetRecord = aBudgetRecords.find(record => String(record.FundCenter.trim() === String(oCondition.FUND_CENTER).trim() &&
            String(record.CommitmentItem.trim() === String(oCondition.COMMITMENT_ITEM.trim()))));


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

async function processEarmarkedFunds(aEarmakedFundItems, sRecordID, sAction) {
    var oEarmarkedFundsDocument;
    var oEarMarkedFundsPayload

    try {
        sAction = Constant.Status.PUSH_BACK; // testing pushback
        sRecordID = '200000143';

        if (sAction === Constant.Status.PUSH_BACK || sAction === Constant.Status.REJECTED) {
            var sPath = `${Constant.IFAMS_API_PATH.EARMARKEDFUNDS}` + `?$filter=EarmarkedFundsDocument eq '${sRecordID}'` + `&$expand=_EarmarkedFundsDocumentItem`;
            oEarmarkedFundsDocument = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.GET, sPath);

            if (oEarmarkedFundsDocument.length > 0) {
                var oResponse;
                for (const item of oEarmarkedFundsDocument[0]._EarmarkedFundsDocumentItem) {
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
                return { oResponse, Message: `EarmarkedFunds Document has been released. Doc ID: ${oEarmarkedFundsDocument.EarmarkedFundsDocument}` }
            }
        }

        // testing on API 
        var aItems = [{
            ...Constant.EarmarkedFundPosting_Item,
            EmrkdFndsAmountInTransCrcy: 1000000.00,
            FundsCenter: '100050500',
            CommitmentItem: '721000'
        }];
        // testing on API 

        oEarMarkedFundsPayload = {
            ...
            Constant.EarmarkedFundPosting_DocHeader,
            EarmarkedFundsHeaderText: sRecordID,
            _EarmarkedFundsDocumentItem:
                aItems //aEarmakedFundItems
        };

        oEarmarkedFundsDocument = await executeIFAMSRequest(Constant.API_REQUEST_METHOD.POST, sPath, oEarMarkedFundsPayload);

    } catch (error) {
        return generateReturnMessage(false, sClaimID, Constant.WorkflowArea.WORKFLOW_DETERMINATION, error.message, false);
    }

    return {
        oEarmarkedFundsDocument,
        Message: `EarmarkedFunds Document created. Doc ID: ${oEarmarkedFundsDocument.EarmarkedFundsDocument}`
    }
}



module.exports = {
    getBudgetRecord,
    processEarmarkedFunds
}