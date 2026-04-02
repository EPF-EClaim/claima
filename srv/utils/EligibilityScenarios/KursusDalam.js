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

        //to find the matching eligibility rule for FLIGHT & TAMBANG as these 2 may return more than 1 eligible rule value
        if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.FLIGHT_L) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.FLIGHT_CLASS_ID === aPayload.sFlightClassId;//[Constant.EntitiesFields.FLIGHT_CLASS_ID];
            })

            oRule = aFilteredRules[0];
        }
        else if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.TAMBANG) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.TRANSPORT_CLASS === aPayload.sFareTypeId;//[Constant.EntitiesFields.FARE_TYPE_ID];
            })

            oRule = aFilteredRules[0];
        }
        else {
            // DOBI, HOTEL_L, LODGING_L will only return single eligible rule value based on user's personal grade
            oRule = aRules[0];
        }

        this._validateClaimItem(aPayload, oRule, oPayload);
        return oPayload;

    },

    /**
    * To parse oPayload.CheckFields array into a key value object. To avoid repeated array searching when accessing field values
    * @private
    * @param {Object} oPayload - payload contains user input passed from frontend
    * @returns {Object} aPayload - return key user input value in the form of object based on selected claim type item
    */
    _parsePayload: function (oPayload) {
        var sTravelDaysId, sFlightClassId, sFareTypeId;

        for (let i = 0; i < oPayload.CheckFields.length; i++) {
            //Convert the Payload values
            try {
                oPayload.CheckFields[i].value = JSON.parse(oPayload.CheckFields[i].value);
            } catch (error) {
                // no handler, remain as string
            }

            switch (oPayload.CheckFields[i].fieldName) {
                case Constant.EntitiesFields.TRAVEL_DAYS_ID:
                    sTravelDaysId = oPayload.CheckFields[i].value;
                    break;
                case Constant.EntitiesFields.FLIGHT_CLASS_ID:
                    sFlightClassId = oPayload.CheckFields[i].value;
                    break;
                case Constant.EntitiesFields.FARE_TYPE_ID:
                    sFareTypeId = oPayload.CheckFields[i].value;
                    break;
            }
        }

        return { sTravelDaysId, sFlightClassId, sFareTypeId };
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Array} aPayload - flat parsed payload from _parsePayload
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    */
    _validateClaimItem: function (aPayload, oRule, oPayload) {
        var iIndex;

        switch (oPayload.ClaimTypeItem) {
            // DOBI - return true if user's traveling days >= eligible min days
            case Constant.ClaimTypeItem.DOBI:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.TRAVEL_DAYS_ID);

                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                // calculate min days of traveling days required
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(
                        oPayload.CheckFields[iIndex].value,
                        oRule.TRAVEL_DAYS_ID
                    );
                }
                break;

            // FLIGHT - return true if selected flight class matches user's personal grade
            case Constant.ClaimTypeItem.FLIGHT_L:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.FLIGHT_CLASS_ID);

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

            // HOTEL & LODGING - return true if claim amount is less than eligible amount * travel days
            case Constant.ClaimTypeItem.HOTEL_L:
            case Constant.ClaimTypeItem.LODGING_L:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.ELIGIBLE_AMOUNT);

                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                // calculate max claim amount allowed
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                        parseFloat(oPayload.CheckFields[iIndex].value),
                        parseFloat(oRule.ELIGIBLE_AMOUNT) * parseFloat(aPayload.sTravelDaysId)
                    );
                }
                break;

            // TAMBANG - return true if selected transport class matches user's personal grade
            case Constant.ClaimTypeItem.TAMBANG:
                iIndex = oPayload.CheckFields.findIndex((field) =>
                    field.fieldName === Constant.EntitiesFields.FARE_TYPE_ID);

                // if no rule matches the selected transport class, return false
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                        oPayload.CheckFields[iIndex].value,
                        oRule.TRANSPORT_CLASS
                    );
                }
                break;
        }
    }
};