sap.ui.define([
    "./ComparisonOperators",
    "claima/utils/Constants"
], function (ComparisonOperators, Constants) {
    "use strict";
    return {
        /**
		 * Eligibility Scenario checking for Luar Negara
		 * @public
		 * @param {Object} oPayload - Payload with ClaimType, ClaimItmType and Item Fields;
         * @param {Array} aRules - Retrieved Eligibility Rules data;
         * @returns {Object} Payload with results of checkfield arrays populated
		 */
        onEligibleCheck(oPayload, aRules) {
            // Get Days value
            const aDays = oPayload.CheckFields.find((field) => field.fieldName == Constants.EntitiesFields.TRAVEL_DAYS_ID);
            const sDays = aDays.value;

            // Switch Based on Claim Item Type
            for (var oRule of aRules) {
                var bSkipChecking = false;
                switch (oPayload.ClaimTypeItem) {
                    case Constants.ClaimTypeItem.DOBI:
                        var iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.TRAVEL_DAYS_ID);
                        // if user has 4 day trip while Rules table is min 3 days, return true
                        // if user has 1 day trip while Rules table is min 3 days, return Rules table value (3)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(oPayload.CheckFields[iIndex].value, oRule.TRAVEL_DAYS_ID);
                        break;

                    case Constants.ClaimTypeItem.FLIGHT_L:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.FLIGHT_CLASS_ID);
                        // if user input and rules table flight class are same values, return true
                        // if user input and rules table flight class are NOT same values, return false
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(oPayload.CheckFields[iIndex].value, oRule.FLIGHT_CLASS_ID);
                        // bSkipChecking assigned to exit when result is true
                        bSkipChecking = oPayload.CheckFields[iIndex].result;
                        break;

                    case Constants.ClaimTypeItem.FLIGHT_O:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.FLIGHT_CLASS_ID);
                        // if user input and rules table flight class are same values, return true
                        // if user input and rules table flight class are NOT same values, return false
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(oPayload.CheckFields[iIndex].value, oRule.FLIGHT_CLASS_ID);
                        // bSkipChecking assigned to exit when result is true
                        bSkipChecking = oPayload.CheckFields[iIndex].result;
                        // Check if min travel hours required
                        if (oRule.TRAVEL_HOURS != undefined || oRule.TRAVEL_HOURS != null) {
                            iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.TRAVEL_HOURS);
                            // if user has 4 hr flight while Rules table is min 3 hrs, return true
                            // if user has 1 hr flight while Rules table is min 3 hrs, return Rules table value (3)
                            oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(oPayload.CheckFields[iIndex].value, oRule.TRAVEL_HOURS);
                        }
                        break;

                    case Constants.ClaimTypeItem.HOTEL_L:
                        // Calculate max amount eligible
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ELIGIBLE_AMOUNT);
                        // if user input has amount 100 while Rules table has calculated max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has calculated max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case Constants.ClaimTypeItem.HOTEL_O:
                        // Calculate max amount eligible
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ELIGIBLE_AMOUNT);
                        // if user input has amount 100 while Rules table has calculated max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has calculated max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ROOM_TYPE_ID);
                        // if user input and rules table room type are same values, return true
                        // if user input and rules table room type are NOT same values, return false
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(oPayload.CheckFields[iIndex].value, oRule.ROOM_TYPE_ID);
                        // bSkipChecking assigned to exit when result is true
                        bSkipChecking = oPayload.CheckFields[iIndex].result;
                        break;

                    case Constants.ClaimTypeItem.LODG_O:
                        // Calculate max amount eligible
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;
                        
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ELIGIBLE_AMOUNT);
                        // if user input has amount 100 while Rules table has calculated max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has calculated max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case Constants.ClaimTypeItem.LODGING_L:
                        // Calculate max amount eligible
                        var iMaxAmountEligible = sDays * oRule.ELIGIBLE_AMOUNT;

                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ELIGIBLE_AMOUNT);
                        // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, iMaxAmountEligible);
                        break;

                    case Constants.ClaimTypeItem.PARKING:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ELIGIBLE_AMOUNT);
                        // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, oRule.ELIGIBLE_AMOUNT);
                        break;

                    case Constants.ClaimTypeItem.PKN_PANAS:
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constants.EntitiesFields.ELIGIBLE_AMOUNT);
                        // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, oRule.ELIGIBLE_AMOUNT);
                        break;

                    default:
                        // if item type not found, mark all fields as fail and quit loop
                        for (var iRow of oPayload.CheckFields) {
                            oPayload.CheckFields[iRow].result = false;
                        }
                        bSkipChecking = true;
                        break;
                }
                // if skip flag set to true, no need to process more rows
                if (bSkipChecking) {
                    break;
                }
            }

            // Return Payload with Result Values
            return oPayload;
        }
    };

});