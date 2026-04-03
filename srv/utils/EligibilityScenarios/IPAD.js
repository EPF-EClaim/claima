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

        var oRule = aRules[0];

        this._validateClaimItem(oRule, oPayload);
        return oPayload;
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Array} aPayload - flat parsed payload from _parsePayload
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    */
    _validateClaimItem: function (oRule, oPayload) {
        var iIndex;

        switch (oPayload.ClaimTypeItem) {

            // I-PAD - return true if claim amount is less than eligible amount * travel days
            case Constant.ClaimTypeItem.I_PAD:
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