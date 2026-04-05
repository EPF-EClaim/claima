const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators')
const GetHistoricalData = require('../GetHistoricalData')
module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Array} aRules - list of eligibility rule from backend
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: async function (oPayload, aRules, tx) {
        let sDate = null;
        var oRule = aRules[0];

        // get Historical Claims Data
        // find field for date
        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE);
        sMonth = oPayload.CheckFields[iIndex].value.substring(6, 8);
        sYear = oPayload.CheckFields[iIndex].value.substring(0, 4);

        if (oRule.FREQUENCY > 1) {
            iFrequency = oRule.FREQUENCY - 1;
        } else {
            // If frequency is 1, only check within same Year/Month. Do not need to do subtraction
            iFrequency = 0;
        }

        switch (oRule.PERIOD) {
            case Constant.FrequencyPeriod.MONTH:
                sMonth = parseInt(sMonth) - iFrequency;
                if (sMonth < 10) {
                    sMonth = Constant.Wildcard.ZERO + sMonth;
                }
                break;

            case Constant.FrequencyPeriod.YEAR:
                sYear = parseInt(sYear) - iFrequency;
                break;

            case Constant.FrequencyPeriod.THREE_YEARS:
                iFrequency = 2;
                sYear = sYear - iFrequency;
                break;

            default:
                break;
        }
        sDate = sYear + Constant.Wildcard.DASH + sMonth + Constant.Wildcard.DASH;
        sDate = sDate + Constant.Wildcard.LIKE_PATTERN;
        console.log(sYear, sMonth, sDate);

        const aItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            [Constant.EntitiesFields.RECEIPT_DATE]: { LIKE: sDate }
        };

        const aHistoricalData = await GetHistoricalData.getHistoricalData(Constant.Entities.ZCLAIM_HEADER,
            Constant.Entities.ZCLAIM_ITEM,
            aItemcondition,
            tx);

        // return aHistoricalData;
        this._validateClaimItem(oRule, oPayload, aHistoricalData);
        return oPayload;
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Array} aPayload - flat parsed payload from _parsePayload
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    */
    _validateClaimItem: function (oRule, oPayload, oHistoricalData) {
        var iIndex;

        switch (oPayload.ClaimTypeItem) {

            
            case Constant.ClaimTypeItem.I_PAD:
                // I-PAD - return true if there is no historical claims within same Year/Month based on frequency and period
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE);
                if (oHistoricalData.length > 0) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    oPayload.CheckFields[iIndex].result = true;
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