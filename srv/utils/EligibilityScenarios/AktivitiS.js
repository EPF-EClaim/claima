const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators')
module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Array} aRules - list of eligibility rule from backend
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: function (oPayload, aRules) {
        var oRule, aFilteredRules;

        // to extract the key values from oPayload
        var aPayload = this._parsePayload(oPayload);

        if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.JENAZAH) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.TRANSPORT_PASSING_ID === aPayload.sTransportPassingId;//[Constant.EntitiesFields.TRANSPORT_PASSING_ID];
            })

            oRule = aFilteredRules[0];
        }
        else if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.KEMATIAN) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.DEPENDENT_TYPE_ID === aPayload.sDependentTypeId;//[Constant.EntitiesFields.DEPENDENT_TYPE_ID];
            })

            oRule = aFilteredRules[0];
        }
        else {
            oRule = aRules[0];
        }

        this._validateClaimItem(oRule, oPayload);
        return oPayload;
    },

    /**
    * To parse oPayload.CheckFields array into a key value object. To avoid repeated array searching when accessing field values
    * @private
    * @param {Object} oPayload - payload contains user input passed from frontend
    * @returns {Object} aPayload - return key user input value in the form of object based on selected claim type item
    */
    _parsePayload: function (oPayload) {
        var sTransportPassingId, sDependentTypeId;

        for (let i = 0; i < oPayload.CheckFields.length; i++) {

            switch (oPayload.CheckFields[i].fieldName) {
                case Constant.EntitiesFields.FUNERAL_TRANSPORTATION:
                    sTransportPassingId = oPayload.CheckFields[i].value;
                    break;
                case Constant.EntitiesFields.DEPENDENT_TYPE:
                    sDependentTypeId = oPayload.CheckFields[i].value;
                    break;
            }
        };

        return { sTransportPassingId, sDependentTypeId };
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    */
    _validateClaimItem: function (oRule, oPayload) {
        var iIndex;
        switch (oPayload.ClaimTypeItem) {
            // KEMATIAN - return true if claim amount is less than eligible amount
            case Constant.ClaimTypeItem.KEMATIAN:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {// if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;
            // JENAZAH - return true if claim amount is less than eligible amount, unlimited for Flight
            case Constant.ClaimTypeItem.JENAZAH:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {// if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;                
        }
    }
};