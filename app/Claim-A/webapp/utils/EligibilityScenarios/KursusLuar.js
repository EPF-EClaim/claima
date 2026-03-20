sap.ui.define([
    "./ComparisonOperators/EqualsTo",
    "./ComparisonOperators/GreaterEquals",
    "./ComparisonOperators/LesserEquals"
], function (EqualsTo, GreaterEquals, LesserEquals) {
    "use strict";
    return {
        onEligibleCheck(oConstant, oPayload, aRules) {
            // Get Days value
            const aDays = oPayload.CheckFields.find((field) => field.fieldName == oConstant.FIELDNAME.TRAVEL_DAYS_ID);
            const sDays = aDays.value;

            // Switch Based on Claim Item Type
            for (var oRule of aRules) {
                var sSkipFlag = "";
                switch (oPayload.ClaimTypeItem) {
                    case oConstant.ClaimTypeItem.DOBI:
                        var iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.TRAVEL_DAYS_ID);
                        oPayload.CheckFields[iIndex].result = GreaterEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.TRAVEL_DAYS_ID);
                        break;

                    case oConstant.ClaimTypeItem.FLIGHT_L:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.FLIGHT_CLASS_ID);
                        oPayload.CheckFields[iIndex].result = EqualsTo.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.FLIGHT_CLASS_ID);
                        // sSkipFlag assigned to exit when result is true
                        sSkipFlag = oPayload.CheckFields[iIndex].result;
                        break;

                    case oConstant.ClaimTypeItem.FLIGHT_O:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.FLIGHT_CLASS_ID);
                        oPayload.CheckFields[iIndex].result = EqualsTo.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.FLIGHT_CLASS_ID);
                        // sSkipFlag assigned to exit when result is true
                        sSkipFlag = oPayload.CheckFields[iIndex].result;
                        // Check if min travel hours required
                        if (oRule.TRAVEL_HOURS != undefined || oRule.TRAVEL_HOURS != null) {
                            iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.TRAVEL_HOURS);
                            oPayload.CheckFields[iIndex].result = GreaterEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.TRAVEL_HOURS);
                        }
                        break;

                    case oConstant.ClaimTypeItem.HOTEL_L:
                        // Calculate max amount eligible
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = LesserEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case oConstant.ClaimTypeItem.HOTEL_O:
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = LesserEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, iMaxAmountEligible);

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ROOM_TYPE_ID);
                        oPayload.CheckFields[iIndex].result = EqualsTo.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.ROOM_TYPE_ID);
                        // sSkipFlag assigned to exit when result is true
                        sSkipFlag = oPayload.CheckFields[iIndex].result;
                        break;

                    case oConstant.ClaimTypeItem.LODG_O:
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = LesserEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case oConstant.ClaimTypeItem.LODGING_L:
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = LesserEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case oConstant.ClaimTypeItem.PARKING:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = LesserEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.ELIGIBLE_AMOUNT);
                        break;

                    case oConstant.ClaimTypeItem.PKN_PANAS:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = LesserEquals.CheckComparison(oConstant, oPayload.CheckFields[iIndex].value, oRule.ELIGIBLE_AMOUNT);
                        break;

                    default:
                        // if item type not found, mark as fail
                        for (var iRow of oPayload.CheckFields) {
                            oPayload.CheckFields[iRow].result = oConstant.STATUS.FAIL;
                        }
                        break;
                }
                // if skip flag set to true, no need to process more rows
                if (sSkipFlag == oConstant.STATUS.SUCCESS) {
                    break;
                } else if (sSkipFlag != oConstant.STATUS.SUCCESS && sSkipFlag != "") {
                    oPayload.CheckFields[iIndex].result = oConstant.STATUS.FAIL;
                }
            }

            // Return Payload with Result Values
            return oPayload;
        }
    };

});