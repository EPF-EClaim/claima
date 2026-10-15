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
        const IFAMS_Service = await getIFAMSConnection();
        const sPath = Constant.IFAMS_API_PATH.BUDGET_SF
            .replace('{YEAR}', oCondition.YEAR)
            .replace('{FUND_CENTER}', oCondition?.FUND_CENTER)
            .replace('{COMMITMENT_ITEM}', oCondition?.COMMITMENT_ITEM)
            .replace('{MATERIAL_GROUP}', oCondition?.MATERIAL_GROUP)
            .replace('{INTERNAL_ORDER}', oCondition.INTERNAL_ORDER === Constant.Wildcard.NA ? '' : oCondition.INTERNAL_ORDER);

        const aBudgetRecords = await IFAMS_Service.send({
            method: 'GET',
            path: sPath
        });

        // further filter on the returned records
        oBudgetRecord = aBudgetRecords.find(record => String(record.FundCenter.trim() === String(oCondition.FUND_CENTER).trim() &&
            String(record.CommitmentItem.trim() === String(oCondition.COMMITMENT_ITEM.trim()))));


    } catch (error) {
        console.log(error);
    }

    return oBudgetRecord;
}

async function performPostEarmarkedfunds(aEarmakedFundItems, sClaimID) {
    
    var oEarmarkedFundsDocument;

    try{
        const IFAMS_Service = await getIFAMSConnection();
        // testing on API 
        var aItems = [{
                    ...Constant.EarmarkedFundPosting_Item,
                    EmrkdFndsAmountInTransCrcy:10000000.00,
                    FundsCenter: '100050500',
                    CommitmentItem: '721000'
                },
                {
                    ...Constant.EarmarkedFundPosting_Item,
                    EmrkdFndsAmountInTransCrcy:10.00,
                    FundsCenter: '100050500',
                    CommitmentItem: '721000'
                }
            ];
        // API testing
        
        var oEarMarkedFundsPayload = {
            ...
            Constant.EarmarkedFundPosting_DocHeader,
            EarmarkedFundsHeaderText: sClaimID,
            _EarmarkedFundsDocumentItem: 
                aItems //aEarmakedFundItems
            
        };

        oEarmarkedFundsDocument = await IFAMS_Service.send({
            method: 'POST',
            path: Constant.IFAMS_API_PATH.EARMARKEDFUNDS,
            data: oEarMarkedFundsPayload
        })
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
    performPostEarmarkedfunds
}