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
    onEligibleCheck: async function (oPayload, oEmp, aRules) {
        var oRule;
        oRule = this._SequenceCheck(oEmp, aRules);
        this._validateClaimItem(oRule, oPayload);
        return oPayload;
    },

    /**
     * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
     * @public
     * @param {Object} oEmp - Employee Data
     * @param {Array} aRules - list of eligibility rule from backend
     * @returns {Object} oPayload - return original payload but with result field filled
     */
    _SequenceCheck: function (oEmp, aRules) {
        var oRule;
        //Check if there is value in aRules table
        if (!!aRules) {
            // Check for Role first
            aPositionRule = aRules.filter(function (rule) {
                return ((rule.ROLE_ID === oEmp.ROLE));
            });
            if ((!!aPositionRule[0])) {
                aFilteredRules = aPositionRule;
            } else {
                // if Role check is not applicable, check for Personal Grade
                aFilteredRules = aRules.filter(function (rule) {
                    return ((rule.PERSONAL_GRADE === oEmp.GRADE));
                })
            };
        }
        oRule = aFilteredRules[0];
        return oRule;
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
            case Constant.ClaimTypeItem.SEWAPETAK:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.VEHICLE_OWNERSHIP_ID);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                        oPayload.CheckFields[iIndex].value,
                        oRule.VEHICLE_OWNERSHIP_ID
                    );
                }
                break;
        }
    }
};