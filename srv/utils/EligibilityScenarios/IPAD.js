const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators')
const GetHistoricalData = require('../GetHistoricalData')
module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Array} aRules - list of eligibility rule from backend
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: async function (oPayload, aRules, tx) {
        var oRule = aRules[0];
        var iHistoricalData = await this._getHistoricalData(oPayload, oRule, tx);
        var iCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, oRule, tx);

        // console.log(iHistoricalData, iCurrentRecordItemData);
        this._validateClaimItem(oRule, oPayload, iHistoricalData + iCurrentRecordItemData);
        return oPayload;
    },

    /**
         * Get Historical Claims Data by building querying conditions and using GetHistoricalData for data retrieval
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Object} oRule - Eligibility rule from backend
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    _getHistoricalData: async function (oPayload, oRule, tx) {
        let sDate = null;
        var sHeaderTable = "";
        var sItemTable = "";
        // get Historical Claims Data
        // find field for date
        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE);
        // const sYearMonth = oPayload.CheckFields[iIndex].value.substring(0, 7);
        // Derive first and last day of the month
        // const [year, month] = sYearMonth.split('-').map(Number);
        // const dDateFrom = `${sYearMonth}-01`;
        // const dDateTo = new Date(year, month, 0)  // last day of month
        //     .toISOString().split('T')[0]; // 'YYYY-MM-DD'

        // const nDateFrom = new Date(dDateFrom); 
        // const nDateTo = new Date(dDateTo)   
        // console.log(nDateFrom, nDateTo);

        sMonth = parseInt(oPayload.CheckFields[iIndex].value.substring(6, 8));
        sYear = parseInt(oPayload.CheckFields[iIndex].value.substring(0, 4));

        switch (oRule.PERIOD) {
            case Constant.FrequencyPeriod.MONTH:
                // need to search as "##"
                if (sMonth < 10) {
                    sMonth = Constant.Wildcard.ZERO + sMonth;
                }
                break;

            default:
                break;
        }
        sDate = sYear + Constant.Wildcard.DASH + sMonth + Constant.Wildcard.DASH;
        sDate = sDate + Constant.Wildcard.LIKE_PATTERN;

        // Map ClaimID or RequestID based on which HeaderTable to use
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
        } else {
            sHeaderTable = Constant.Entities.ZREQUEST_HEADER
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
        }

        const aItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            [Constant.EntitiesFields.RECEIPT_DATE]: { LIKE: sDate }
            // [Constant.EntitiesFields.RECEIPT_DATE]: {
            //     [Constant.ComparisonOperators.GreaterEquals]: nDateFrom,
            //     [Constant.ComparisonOperators.LesserEquals]: nDateTo
            // }
        };
        // console.log(aItemcondition);
        const iHistoricalData = await GetHistoricalData.getHistoricalData(sHeaderTable,
            sItemTable,
            aItemcondition,
            tx);

        return iHistoricalData;
    },

    /**
         * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Object} oRule - Eligibility rule from backend
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    _getCurrentRecordItemData: async function (oPayload, oRule, tx) {
        let sDate = null;
        var sHeaderField = "";
        var sItemField = "";
        var sItemTable = "";
        // get Historical Claims Data
        // find field for date
        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE);
        sMonth = parseInt(oPayload.CheckFields[iIndex].value.substring(6, 8));
        sYear = parseInt(oPayload.CheckFields[iIndex].value.substring(0, 4));

        switch (oRule.PERIOD) {
            case Constant.FrequencyPeriod.MONTH:
                // need to search as "##"
                if (sMonth < 10) {
                    sMonth = Constant.Wildcard.ZERO + sMonth;
                }
                break;

            default:
                break;
        }
        sDate = sYear + Constant.Wildcard.DASH + sMonth + Constant.Wildcard.DASH;
        sDate = sDate + Constant.Wildcard.LIKE_PATTERN;

        //Map Headers
        // Map ClaimID or RequestID based on which HeaderTable to use
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sItemField = Constant.EntitiesFields.CLAIM_SUB_ID;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
        } else {
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sItemField = Constant.EntitiesFields.REQUEST_SUB_ID;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
        }

        const aCurrentItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [sHeaderField]: oPayload.RecordId,
            [sItemField]: { '!=': oPayload.RecordSubId },
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            [Constant.EntitiesFields.RECEIPT_DATE]: { LIKE: sDate }
        };

        return iCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
            aCurrentItemcondition,
            tx);
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    * @param {iFrequencyCount} - Date frequency count
    */
    _validateClaimItem: function (oRule, oPayload, iFrequencyCount) {
        var iIndex;

        switch (oPayload.ClaimTypeItem) {
            case Constant.ClaimTypeItem.I_PAD:
                // I-PAD - return true if there is no historical claims within same Year/Month based on frequency and period
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE);
                if (iFrequencyCount < oRule.FREQUENCY) {
                    oPayload.CheckFields[iIndex].result = true;
                } else {
                    oPayload.CheckFields[iIndex].result = false;
                }

                iIndex = null;
                // I-PAD - return true if claim amount is less than eligible amount
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                    // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                        oPayload.CheckFields[iIndex].value,
                        parseFloat(oRule.ELIGIBLE_AMOUNT));
                }
                break;
        }
    }
};