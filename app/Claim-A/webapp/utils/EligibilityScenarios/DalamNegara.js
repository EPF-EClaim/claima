sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";
    return {
        async onEligibleCheck(oModel, sClaimType, ClaimItmType, oEmp) {
            const o2ndBindList = oModel.bindList("/ZELIGIBILITY_RULE");

             // Get eligibility rules based on Employee Personal Grade
            var a2ndFilters = [];
            var a2ndAndFilters = [];
            var a2ndOrFilters = [];

            // var sEmpGrade = oEmp.Grade;

            a2ndAndFilters.push(new Filter("PERSONAL_GRADE", FilterOperator.EQ, oEmp.GRADE));
            a2ndAndFilters.push(new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, ClaimItmType));
            a2ndAndFilters.push(new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimType));
            a2ndAndFilters = new Filter(a2ndAndFilters, true);

            const aRules = await o2ndBindList.filter(a2ndAndFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                // console.log("Filtered books:", aContexts.map(context => context.getObject())[0]);
                // var sGrade = aContexts.map(context => context.getObject())[0];
                var aRules = aContexts.map(context => context.getObject());
                return aRules;
            });

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