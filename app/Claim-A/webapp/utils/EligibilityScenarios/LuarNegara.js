sap.ui.define([

], function () {
    "use strict";
    return {
        async onEligibleCheck(oConstant, oPayload, aRules) {
            // Load to check each Payload Claim Item Field
            var iRows = 0;
            for (var i = iRows; i < oPayload.CheckFields.length; i++) {
                // Initialize values
                var sFlag = "";
                var sRulesVal = "";
                // Get Days value
                const aDays = oPayload.CheckFields.find((field) => field.fieldName == oConstant.FIELDNAME.TRAVEL_DAYS_ID);
                const sDays = aDays.value;
                // if (oPayload.CheckFields[i].field = oConstant.FIELDNAME.TRAVEL_DAYS_ID) {
                //     var iDays = oPayload.CheckFields[i].value
                // }

                // Switch Based on Claim Item Type
                for (var oRule of aRules) {
                    switch (oPayload.ClaimTypeItem) {
                        case oConstant.ClaimItmType.DOBI:
                            if (oPayload.CheckFields[i].value >= oRule.TRAVEL_DAYS_ID) {
                                sFlag = oConstant.STATUS.SUCCESS;
                                break;
                            } else {
                                sRulesVal = oRule.TRAVEL_DAYS_ID;
                            }
                            break;

                        case oConstant.ClaimItmType.FLIGHT_L:
                            // Loop Through the Rules table
                            // for (var oRule of aRules) {
                            if (oPayload.CheckFields[i].value == oRule.FLIGHT_CLASS_ID) {
                                sFlag = oConstant.STATUS.SUCCESS;
                                break;
                            } else {
                                sRulesVal = oConstant.STATUS.FAIL;
                            }
                            // }
                            break;

                        case oConstant.ClaimItmType.FLIGHT_O:
                            if (oPayload.CheckFields[i].fieldName = oConstant.FIELDNAME.FLIGHT_CLASS_ID) {
                                // for (var oRule of aRules) {
                                if (oPayload.CheckFields[i].value == oRule.FLIGHT_CLASS_ID) {
                                    sFlag = oConstant.STATUS.SUCCESS;
                                    break;
                                }
                                else {
                                    sRulesVal = oConstant.STATUS.FAIL;
                                }
                                // }
                            } else if (oPayload.CheckFields[i].fieldName = oConstant.FIELDNAME.TRAVEL_HOURS) {
                                // for (var oRule of aRules) {
                                if (oPayload.CheckFields[i].value >= oRule.TRAVEL_HOURS) {
                                    sFlag = oConstant.STATUS.SUCCESS;
                                    break;
                                }
                                else {
                                    sRulesVal = oConstant.STATUS.FAIL;
                                }
                                // }
                            }
                            break;
                        case oConstant.ClaimItmType.HOTEL_L:
                            // for (var oRule of aRules) {
                            var MaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;
                            if (oPayload.CheckFields[i].value <= MaxAmountEligible) {
                                sFlag = oConstant.STATUS.SUCCESS;
                                break;
                            } else {
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                            // }

                            break;
                        case oConstant.ClaimItmType.HOTEL_O:
                            if (oPayload.CheckFields[i].fieldName = oConstant.FIELDNAME.ELIGIBLE_AMOUNT) {
                                // for (var oRule of aRules) {
                                var MaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;
                                if (oPayload.CheckFields[i].value <= MaxAmountEligible) {
                                    sFlag = oConstant.STATUS.SUCCESS;
                                    break;
                                } else {
                                    sRulesVal = oRule.ELIGIBLE_AMOUNT;
                                }
                                // }
                            } else if (oPayload.CheckFields[i].fieldName = oConstant.FIELDNAME.ROOM_TYPE_ID) {
                                // for (var oRule of aRules) {
                                if (oPayload.CheckFields[i].value == oRule.ROOM_TYPE_ID) {
                                    sFlag = oConstant.STATUS.SUCCESS;
                                    break;
                                }
                                else {
                                    sRulesVal = oConstant.STATUS.FAIL;
                                }
                                // }
                            }
                            break;

                        case oConstant.ClaimItmType.LODG_O:
                            // for (var oRule of aRules) {
                            var MaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;
                            if (oPayload.CheckFields[i].value <= MaxAmountEligible) {
                                sFlag = oConstant.STATUS.SUCCESS;
                                break;
                            } else {
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                            // }
                            break;

                        case oConstant.ClaimItmType.LODGING_L:
                            // for (var oRule of aRules) {
                            var MaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;
                            if (oPayload.CheckFields[i].value <= MaxAmountEligible) {
                                sFlag = oConstant.STATUS.SUCCESS;
                                break;
                            } else {
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                            // }
                            break;

                        case oConstant.ClaimItmType.PARKING:
                            if (oPayload.CheckFields[i].value <= oRule.ELIGIBLE_AMOUNT) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            } else {
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                            break;

                        case oConstant.ClaimItmType.PKN_PANAS:
                            if (oPayload.CheckFields[i].value <= oRule.ELIGIBLE_AMOUNT) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            } else {
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                            break;

                        default:
                            // if item type not found, mark as fail
                            oPayload.CheckFields[i].Result = oConstant.STATUS.FAIL;
                            break;
                    }
                }

                // If Flag is not success, assign correct value from Rules
                if (sFlag == oConstant.STATUS.SUCCESS) {
                    oPayload.CheckFields[i].Result = sFlag;
                } else {
                    oPayload.CheckFields[i].Result = sRulesVal;
                }

            }
            // Return Payload with Result Values
            return oPayload;
        }
    };

});