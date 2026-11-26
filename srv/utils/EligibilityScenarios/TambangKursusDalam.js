const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators');
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

        // FLIGHT_KURSUS may return more than 1 eligible rule value, so find the rule matching the selected flight class
        if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.FLIGHT_KURSUS) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.FLIGHT_CLASS_ID === aPayload.sFlightClassId;
            });

            oRule = aFilteredRules[0];
        }

        this._validateClaimItem(oRule, oPayload);
        return oPayload;
    },

    /**
     * To parse oPayload.CheckFields array into a key value object. To avoid repeated array searching when accessing field values
     * @private
     * @param {Object} oPayload - payload contains user input passed from frontend
     * @returns {Object} key user input value in the form of object
     */
    _parsePayload: function (oPayload) {
        var sFlightClassId;

        for (let i = 0; i < oPayload.CheckFields.length; i++) {
            // Convert the Payload values
            try {
                oPayload.CheckFields[i].value = JSON.parse(oPayload.CheckFields[i].value);
            } catch (error) {
                // no handler, remain as string
            }

            switch (oPayload.CheckFields[i].fieldName) {
                case Constant.EntitiesFields.FLIGHT_CLASS_ID:
                    sFlightClassId = oPayload.CheckFields[i].value;
                    break;
            }
        }

        return { sFlightClassId };
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
            // FLIGHT_KURSUS - return true if selected flight class matches user's personal grade
            case Constant.ClaimTypeItem.FLIGHT_KURSUS:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.FLIGHT_CLASS_ID);
                if (iIndex == -1) return;
                // if no rule matches the selected flight class, return false
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                        oPayload.CheckFields[iIndex].value,
                        oRule.FLIGHT_CLASS_ID
                    );
                }
                break;
        }
    }
};