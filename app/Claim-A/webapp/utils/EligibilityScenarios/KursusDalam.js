sap.ui.define([
], function () {
    "use strict";

    return {
        onEligibleCheck(oConstant, oPayload, aRules) {

            var oRule, aFilteredRules, aResults;

            var aPayload = this._parsePayload(oPayload, oConstant);

            if (aPayload.CLAIM_TYPE_ITEM_ID === oConstant.ClaimTypeItem.FLIGHT_L) {

                aFilteredRules = aRules.filter(function (rule) {
                    return rule.FLIGHT_CLASS_ID === aPayload[oConstant.FIELDNAME.FLIGHT_CLASS_ID];
                })

                oRule = aFilteredRules[0];

            } 
            else if (aPayload.CLAIM_TYPE_ITEM_ID === oConstant.ClaimTypeItem.TAMBANG) {

                aFilteredRules = aRules.filter(function (rule) {
                    return rule.TRANSPORT_CLASS === aPayload[oConstant.FIELDNAME.FARE_TYPE_ID];
                })

                oRule = aFilteredRules[0];

            }
            else {
                oRule = aRules[0];
            }

            aResults = this._validateClaimItem(aPayload, oConstant, oRule);
            return aResults;

        },

        _parsePayload(oPayload, oConstant){
            var CLAIM_TYPE_ITEM_ID, TRAVEL_DAYS_ID, ELIGIBLE_AMOUNT, FLIGHT_CLASS_ID, FARE_TYPE_ID;

            CLAIM_TYPE_ITEM_ID = oPayload.ClaimTypeItem;

            for (let index = 0; index < oPayload.CheckFields.length; index++) {
                if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.TRAVEL_DAYS_ID) {
                    TRAVEL_DAYS_ID = oPayload.CheckFields[index].value;
                } else if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.ELIGIBLE_AMOUNT) {
                    ELIGIBLE_AMOUNT = oPayload.CheckFields[index].value;
                } else if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.FLIGHT_CLASS_ID) {
                    FLIGHT_CLASS_ID = oPayload.CheckFields[index].value;
                } else if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.FARE_TYPE_ID) {
                    FARE_TYPE_ID = oPayload.CheckFields[index].value;
                }
            }

            return { CLAIM_TYPE_ITEM_ID, TRAVEL_DAYS_ID, ELIGIBLE_AMOUNT, FLIGHT_CLASS_ID, FARE_TYPE_ID  };
        },
        _validateClaimItem(aPayload, oConstant, oEligibilityRule) {

            var oValidators = {
                [oConstant.ClaimTypeItem.DOBI]: {
                    payloadField: oConstant.FIELDNAME.TRAVEL_DAYS_ID,
                    eligibilityRuleField: oConstant.FIELDNAME.TRAVEL_DAYS_ID,
                    type: oConstant.VALIDATION_TYPE.MIN,
                },
                [oConstant.ClaimTypeItem.FLIGHT_L]: {
                    payloadField: oConstant.FIELDNAME.FLIGHT_CLASS_ID,
                    eligibilityRuleField: oConstant.FIELDNAME.FLIGHT_CLASS_ID,
                    type: oConstant.VALIDATION_TYPE.EQUAL,
                },
                [oConstant.ClaimTypeItem.HOTEL_L]: {
                    payloadField: oConstant.FIELDNAME.ELIGIBLE_AMOUNT,
                    eligibilityRuleField: oConstant.FIELDNAME.ELIGIBLE_AMOUNT,
                    type: oConstant.VALIDATION_TYPE.MAX,
                },
                [oConstant.ClaimTypeItem.LODGING_L]: {
                    payloadField: oConstant.FIELDNAME.ELIGIBLE_AMOUNT,
                    eligibilityRuleField: oConstant.FIELDNAME.ELIGIBLE_AMOUNT,
                    type: oConstant.VALIDATION_TYPE.MAX,
                },
                [oConstant.ClaimTypeItem.TAMBANG]: {
                    payloadField: oConstant.FIELDNAME.FARE_TYPE_ID,
                    eligibilityRuleField: oConstant.FIELDNAME.TRANSPORT_CLASS,
                    type: oConstant.VALIDATION_TYPE.EQUAL,
                },
            };
            var oValidator = oValidators[aPayload.CLAIM_TYPE_ITEM_ID];

            return this._validateField(aPayload, oConstant, oEligibilityRule, oValidator);

        },

        _validateField(aPayload, oConstant, oEligibilityRule, oValidator) {

            var sPayloadField = oValidator.payloadField;
            var sEligibilityRuleField = oValidator.eligibilityRuleField;
            var sType = oValidator.type;
            var eligibilityRuleValue, userValue;

            let result; 

            if (!oEligibilityRule) {
                result = false;
                return [{ field: sPayloadField, value: userValue, result: result }];
            } else {
                eligibilityRuleValue = oEligibilityRule[sEligibilityRuleField];
            }

            switch (sType) {
                // ✅ Must match exactly — Flight class, Tambang class
                case oConstant.VALIDATION_TYPE.EQUAL:
                    userValue = aPayload[oConstant.FIELDNAME.FLIGHT_CLASS_ID] || aPayload[oConstant.FIELDNAME.FARE_TYPE_ID];

                    if (userValue !== eligibilityRuleValue) {
                        result = false;
                    } else { result = true; }

                    break;

                // ✅ Must not exceed — Hotel, Lodging
                case oConstant.VALIDATION_TYPE.MAX:
                    userValue = aPayload[oConstant.FIELDNAME.ELIGIBLE_AMOUNT];

                    var eligibilityRuleValue = eligibilityRuleValue * aPayload[oConstant.FIELDNAME.TRAVEL_DAYS_ID];
                    if (parseFloat(userValue) > parseFloat(eligibilityRuleValue)) {
                        result = eligibilityRuleValue;
                    } else { result = true; }

                    break;

                // ✅ must exceed min — Dobi
                case oConstant.VALIDATION_TYPE.MIN:
                    userValue = aPayload[oConstant.FIELDNAME.TRAVEL_DAYS_ID];

                    if (userValue < eligibilityRuleValue) {
                        result = eligibilityRuleValue;
                    } else { result = true; }

                    break;
            }
            return [{ field: sPayloadField, value: userValue, result }];

        }

    };
});
