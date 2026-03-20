sap.ui.define([
    "./ComparisonOperators",
    "claima/utils/Constants",
], function (ComparisonOperators, Constants) {
    "use strict";
    return {
        /**
		 * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 value
		 * @public
		 * @param {sap.ui.base.Event} sVal1 - Value Input to be checked;
         * @param {sap.ui.base.Event} sVal2 - Value Input to be checked against;
         * @param {sap.ui.base.Event} sVal2 - Value Input to be checked against;
         * @returns {Boolean/Integer/String} Comparison Output
		 */
        onEligibleCheck(oPayload, aRules) {
            // Get Days value
            const aDays = oPayload.CheckFields.find((field) => field.fieldName == Constants.FIELDNAME.TRAVEL_DAYS_ID);
            const sDays = aDays.value;

            // Switch Based on Claim Item Type
            for (var oRule of aRules) {
                var sSkipFlag = "";
                switch (oPayload.ClaimTypeItem) {
                    case Constants.ClaimTypeItem.DOBI:
                        var iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.TRAVEL_DAYS_ID);
                        // if user has 4 day trip while Rules table is min 3 days, return true
                        // if user has 1 day trip while Rules table is min 3 days, return Rules table value (3)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(oPayload.CheckFields[iIndex].value, oRule.TRAVEL_DAYS_ID);
                        break;

                    case Constants.ClaimTypeItem.FLIGHT_L:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.FLIGHT_CLASS_ID);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(oPayload.CheckFields[iIndex].value, oRule.FLIGHT_CLASS_ID);
                        // sSkipFlag assigned to exit when result is true
                        sSkipFlag = oPayload.CheckFields[iIndex].result;
                        break;

                    case Constants.ClaimTypeItem.FLIGHT_O:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.FLIGHT_CLASS_ID);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(oPayload.CheckFields[iIndex].value, oRule.FLIGHT_CLASS_ID);
                        // sSkipFlag assigned to exit when result is true
                        sSkipFlag = oPayload.CheckFields[iIndex].result;
                        // Check if min travel hours required
                        if (oRule.TRAVEL_HOURS != undefined || oRule.TRAVEL_HOURS != null) {
                            iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.TRAVEL_HOURS);
                            oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(oPayload.CheckFields[iIndex].value, oRule.TRAVEL_HOURS);
                        }
                        break;

                    case Constants.ClaimTypeItem.HOTEL_L:
                        // Calculate max amount eligible
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case Constants.ClaimTypeItem.HOTEL_O:
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ROOM_TYPE_ID);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(oPayload.CheckFields[iIndex].value, oRule.ROOM_TYPE_ID);
                        // sSkipFlag assigned to exit when result is true
                        sSkipFlag = oPayload.CheckFields[iIndex].result;
                        break;

                    case Constants.ClaimTypeItem.LODG_O:
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case Constants.ClaimTypeItem.LODGING_L:
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case Constants.ClaimTypeItem.PARKING:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, oRule.ELIGIBLE_AMOUNT);
                        break;

                    case Constants.ClaimTypeItem.PKN_PANAS:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.FIELDNAME.ELIGIBLE_AMOUNT);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, oRule.ELIGIBLE_AMOUNT);
                        break;

                    default:
                        // if item type not found, mark as fail
                        for (var iRow of oPayload.CheckFields) {
                            oPayload.CheckFields[iRow].result = false;
                        }
                        sSkipFlag = true;
                        break;
                }
                // if skip flag set to true, no need to process more rows
                if (sSkipFlag == true) {
                    break;
                }
            }

            // Return Payload with Result Values
            return oPayload;
        }
    };

});