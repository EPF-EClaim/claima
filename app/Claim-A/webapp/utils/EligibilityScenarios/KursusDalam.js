sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    return {
        async onEligibleCheck(aPayload, oConstant, sClaimType, sClaimItmType, aRules) {

            var oRule, aFilteredRules, aResults;

            var aPayload = [{ field: 'claimAmount', value: '70', result: '' },
            { field: 'flightClass', value: '', result: '' },//'03'
            { field: 'days', value: '2', result: '' },
            { field: 'transportClass', value: '02', result: '' },
            ];

            var oPayload = this._parsePayload(aPayload, oConstant);

            if (sClaimItmType === oConstant.KURSUS_DLM_NEGARA_TypeItem.FLIGHT_L) {
                // var flightClass = '03';//to replace with payload. if 01 then will have problem

                aFilteredRules = aRules.filter(function (rule) {
                    return rule.FLIGHT_CLASS_ID === oPayload[oConstant.PAYLOAD_FIELD.flightClass];//to replace with payload
                })

                oRule = aFilteredRules[0];

            } else if (sClaimItmType === oConstant.KURSUS_DLM_NEGARA_TypeItem.TAMBANG) {
                // var transportclass = '02';

                aFilteredRules = aRules.filter(function (rule) {
                    return rule.TRANSPORT_CLASS === oPayload[oConstant.PAYLOAD_FIELD.transportClass];//to replace with payload
                })

                oRule = aFilteredRules[0];

            }
            else {
                oRule = aRules[0];

            }

            aResults = this._validateClaimItem(oPayload, oConstant, oRule, sClaimItmType);
            return aResults;

        },

        _parsePayload(aPayload, oConstant){
            var userValue, days, claimAmount, flightClass, transportClass;

            for (let index = 0; index < aPayload.length; index++) {
                if (aPayload[index].field === oConstant.PAYLOAD_FIELD.days) {
                    days = aPayload[index].value;
                } else if (aPayload[index].field === oConstant.PAYLOAD_FIELD.claimAmount) {
                    claimAmount = aPayload[index].value;
                } else if (aPayload[index].field === oConstant.PAYLOAD_FIELD.flightClass) {//to confirm if transportclass and flightclass share same field
                    flightClass = aPayload[index].value; //transportClass if shared then no need to worry transportclass getting overwriiten
                } else if (aPayload[index].field === oConstant.PAYLOAD_FIELD.transportClass) {
                    transportClass = aPayload[index].value;
                }
            }

            return { days, claimAmount, flightClass, transportClass };
        },
        _validateClaimItem(oPayload, oConstant, oEligibilityRule, sClaimItmType) {

            var oValidators = {
                [oConstant.KURSUS_DLM_NEGARA_TypeItem.DOBI]: {
                    payloadField: oConstant.PAYLOAD_FIELD.days,
                    eligibilityRuleField: oConstant.ELIGIBILITY_RULE_FIELD.TRAVEL_DAYS_ID,
                    type: oConstant.VALIDATION_TYPE.MIN,
                },
                [oConstant.KURSUS_DLM_NEGARA_TypeItem.FLIGHT_L]: {
                    payloadField: oConstant.PAYLOAD_FIELD.flightClass,//to confirm if it's transportclass
                    eligibilityRuleField: oConstant.ELIGIBILITY_RULE_FIELD.FLIGHT_CLASS_ID,
                    type: oConstant.VALIDATION_TYPE.EQUAL,
                },
                [oConstant.KURSUS_DLM_NEGARA_TypeItem.HOTEL_L]: {
                    payloadField: oConstant.PAYLOAD_FIELD.claimAmount,
                    eligibilityRuleField: oConstant.ELIGIBILITY_RULE_FIELD.ELIGIBLE_AMOUNT,
                    type: oConstant.VALIDATION_TYPE.MAX,
                },
                [oConstant.KURSUS_DLM_NEGARA_TypeItem.LODGING_L]: {
                    payloadField: oConstant.PAYLOAD_FIELD.claimAmount,
                    eligibilityRuleField: oConstant.ELIGIBILITY_RULE_FIELD.ELIGIBLE_AMOUNT,
                    type: oConstant.VALIDATION_TYPE.MAX,
                },
                [oConstant.KURSUS_DLM_NEGARA_TypeItem.TAMBANG]: {
                    payloadField: oConstant.PAYLOAD_FIELD.transportClass,
                    eligibilityRuleField: oConstant.ELIGIBILITY_RULE_FIELD.TRANSPORT_CLASS,
                    type: oConstant.VALIDATION_TYPE.EQUAL,
                },
            };
            var oValidator = oValidators[sClaimItmType];

            return this._validateField(oPayload, oConstant, oEligibilityRule, oValidator);

        },

        _validateField(oPayload, oConstant, oEligibilityRule, oValidator) {

            var sPayloadField = oValidator.payloadField;
            var sEligibilityRuleField = oValidator.eligibilityRuleField;
            var sType = oValidator.type;
            var eligibilityRuleValue, userValue;

            let result; // to not set true in invalid switch case

            if (!oEligibilityRule) {
                result = false;
                return [{ field: sPayloadField, value: userValue, result: result }];
            } else {
                eligibilityRuleValue = oEligibilityRule[sEligibilityRuleField];
            }

            // var userValue, days, claimAmount, flightClass, transportClass;

            // for (let index = 0; index < aPayload.length; index++) {
            //     if (aPayload[index].field === oConstant.PAYLOAD_FIELD.days) {
            //         days = aPayload[index].value;
            //     } else if (aPayload[index].field === oConstant.PAYLOAD_FIELD.claimAmount) {
            //         claimAmount = aPayload[index].value;
            //     } else if (aPayload[index].field === oConstant.PAYLOAD_FIELD.flightClass) {//to confirm if transportclass and flightclass share same field
            //         flightClass = aPayload[index].value; //transportClass if shared then no need to worry transportclass getting overwriiten
            //     } else if (aPayload[index].field === oConstant.PAYLOAD_FIELD.transportClass) {
            //         transportClass = aPayload[index].value;
            //     }
            // }

            switch (sType) {
                // ✅ Must match exactly — Flight class, Tambang class
                case oConstant.VALIDATION_TYPE.EQUAL:
                    userValue = oPayload[oConstant.PAYLOAD_FIELD.flightClass] || oPayload[oConstant.PAYLOAD_FIELD.transportClass];

                    if (userValue !== eligibilityRuleValue) {
                        result = false;
                    } else { result = true; }

                    break;

                // ✅ Must not exceed — Hotel, Lodging
                case oConstant.VALIDATION_TYPE.MAX:
                    userValue = oPayload[oConstant.PAYLOAD_FIELD.claimAmount];

                    var eligibilityRuleValue = eligibilityRuleValue * oPayload[oConstant.PAYLOAD_FIELD.days];
                    if (parseFloat(userValue) > parseFloat(eligibilityRuleValue)) {
                        result = eligibilityRuleValue;
                    } else { result = true; }

                    break;

                // ✅ days >= nights from trip dates — Dobi
                case oConstant.VALIDATION_TYPE.MIN:
                    userValue = oPayload[oConstant.PAYLOAD_FIELD.days];

                    if (userValue < eligibilityRuleValue) {
                        result = eligibilityRuleValue;
                    } else { result = true; }

                    break;
            }
            return [{ field: sPayloadField, value: userValue, result }];

        }


    };
});