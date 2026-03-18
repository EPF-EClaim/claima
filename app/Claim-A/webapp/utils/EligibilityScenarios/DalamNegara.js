sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";
    return {
        async onEligibleCheck(oModel, sClaimType, ClaimItmType, aRules) {
            

            for (var rule of aRules) {
                switch (ClaimItmType) {
                    case DOBI:
                        aRules[row].MaximumDays
                        if ((day1 - day3) > 3) {
                            return fail;
                        }
                        break;
                    case FLIGHT_L:
                        if (PersonalGrade < 21 && FlightClass != 3) {
                            return fail;
                        }
                        break;
                    case HOTEL_L:

                        break;

                    default:
                        break;
                }

            }

        }
    };

});