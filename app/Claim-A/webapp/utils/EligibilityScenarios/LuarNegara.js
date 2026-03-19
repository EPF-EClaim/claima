sap.ui.define([

], function () {
    "use strict";
    return {
        async onEligibleCheck(oModel, oConstant, ClaimItmType, oEmp, aRules) {
            // TEST PAYLOAD, Remove after Full Test
            var aPayload = [
                { field: "FLIGHT_CLASS_ID", Value: "01", Result: "" }
                // { field: "", Value: "", Result: "" },
                // { field: "", Value: "", Result: "" },
                // { field: "", Value: "", Result: "" },
                // { field: "", Value: "", Result: "" }
            ];

            // Load to check each Payload Claim Item Field
            var iRows = 0;
            for (var i = iRows; i < aPayload.length; i++) {
                // Initialize values
                var sFlag = "";
                var sRulesVal = "";
                if (aPayload[i].field = oConstant.FIELDNAME.DAYS) {
                    var iDays = aPayload[i].Value
                }

                switch (ClaimItmType) {
                    case oConstant.ClaimItmType.DOBI:
                        for (var oRule of aRules) {
                            if (aPayload[i].Value >= oRule.TRAVEL_DAYS_ID) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            }else{
                                sRulesVal = aPayload[i].Value;
                            }
                        }
                        break;

                    // case oConstant.ClaimItmType.EXCESS:
                    //     break;

                    case oConstant.ClaimItmType.FLIGHT_L:
                        // Loop Through the Rules table
                        for (var oRule of aRules) {
                            if (aPayload[i].Value == oRule.FLIGHT_CLASS_ID) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            }else{
                                sRulesVal = oConstant.STATUS.FAIL;
                            }
                        }
                        break;

                    case oConstant.ClaimItmType.FLIGHT_O:
                        // for (var oRule of aRules) {
                        //     if (aPayload[i].Value == oRule.FLIGHT_CLASS_ID) {
                        //         if (oRule.TRAVEL_HOURS  ) {
                                    
                        //         }
                        //         sFlag = oConstant.STATUS.SUCCESS;
                        //     }else if(oRule.FLIGHT_CLASS_ID == aPayload[i].Value){

                        //     }
                        //     else{
                        //         sRulesVal = oConstant.STATUS.FAIL;
                        //     }
                        // }

                        break;
                    case oConstant.ClaimItmType.HOTEL_L:
                        if (aPayload[i].Value <= oRule.ELIGIBLE_AMOUNT) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            }else{
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                        break;
                    case oConstant.ClaimItmType.HOTEL_O:
                        // if (aPayload[i].Value <= oRule.ELIGIBLE_AMOUNT) {
                        //         sFlag = oConstant.STATUS.SUCCESS;
                        //     }else{
                        //         sRulesVal = oRule.ELIGIBLE_AMOUNT;
                        //     }
                        break;
                    // case oConstant.ClaimItmType.KILOMETER:

                    //     break;
                    case oConstant.ClaimItmType.LODG_O:

                        break;
                    case oConstant.ClaimItmType.LODGING_L:

                        break;
                    // case oConstant.ClaimItmType.MAKAN_L:

                    //     break;
                    // case oConstant.ClaimItmType.MAKAN_O:

                    //     break;
                    // case oConstant.ClaimItmType.MATAWANG:

                    //     break;
                    case oConstant.ClaimItmType.PARKING:
                        if (aPayload[i].Value <= oRule.ELIGIBLE_AMOUNT) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            }else{
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                        break;

                    case oConstant.ClaimItmType.PKN_PANAS:
                        if (aPayload[i].Value <= oRule.ELIGIBLE_AMOUNT) {
                                sFlag = oConstant.STATUS.SUCCESS;
                            }else{
                                sRulesVal = oRule.ELIGIBLE_AMOUNT;
                            }
                        break;

                    // case oConstant.ClaimItmType.SERVICES:

                    //     break;
                    // case oConstant.ClaimItmType.TAMBANG:

                    //     break;
                    // case oConstant.ClaimItmType.TELEFON:

                    // //     break;
                    // case oConstant.ClaimItmType.TIPS:

                    //     break;
                    // case oConstant.ClaimItmType.VISA:

                    //     break;
                    // case oConstant.ClaimItmType.YURAN:

                    //     break;
                    default:
                        break;
                }

                if (sFlag == oConstant.STATUS.SUCCESS) {
                    aPayload[i].Result = sFlag;
                } else {
                    aPayload[i].Result = sRulesVal;
                }

            }

        }
    };

});