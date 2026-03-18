sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./DalamNegara",
    "./LuarNegara",
    "./KursusDalam",
    "./KursusLuar",
    "./Pelbagai"
], function (Filter, FilterOperator, DalamNegara, LuarNegara, KursusDalam, KursusLuar, Pelbagai) {
    "use strict";
    return {
        onEligibilityCheck: async function (oModel, oConstant, sEmpId, sClaimType, sClaimItmType) {
            // Get Employee ID

            const oBindList = oModel.bindList("/ZEMP_MASTER");

            var aFilters = [];
            var aAndFilters = [];
            aAndFilters.push(new Filter("EEID", FilterOperator.EQ, sEmpId));
            aAndFilters = new Filter(aAndFilters, true);

            aFilters.push(new Filter(aAndFilters));
            aFilters = new Filter(aFilters, true);

            const oEmp = await oBindList.filter(aFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                // console.log("Filtered books:", aContexts.map(context => context.getObject())[0]);
                // var sGrade = aContexts.map(context => context.getObject())[0].GRADE;
                var oEmp = aContexts.map(context => context.getObject())[0];
                // var aEmp = aContexts.map(context => context.getObject());
                return oEmp;
            });

            const o2ndBindList = oModel.bindList("/ZELIGIBILITY_RULE");

             // Get eligibility rules based on Employee Personal Grade
            var a2ndFilters = [];
            var a2ndAndFilters = [];
            var a2ndOrFilters = [];

            // var sEmpGrade = oEmp.Grade;

            a2ndAndFilters.push(new Filter("PERSONAL_GRADE", FilterOperator.EQ, oEmp.GRADE));
            a2ndAndFilters.push(new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaimItmType));
            a2ndAndFilters.push(new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimType));
            a2ndAndFilters = new Filter(a2ndAndFilters, true);
            a2ndFilters.push(new Filter(a2ndAndFilters));
            a2ndFilters = new Filter(a2ndFilters, true);

            const aRules = await o2ndBindList.filter(a2ndFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                // console.log("Filtered books:", aContexts.map(context => context.getObject())[0]);
                // var sGrade = aContexts.map(context => context.getObject())[0];
                var aRules = aContexts.map(context => context.getObject());
                return aRules;
            });

            DalamNegara.onEligibleCheck(oModel, sClaimType, sClaimItmType, aRules);
            // switch (sClaimType) {
            //     case oConstant.ClaimType.DLM_NEGARA:
            //         DalamNegara.onEligibleCheck(oModel, sClaimItmType);
            //         break;

            //     case oConstant.ClaimType.LUAR_NEGARA:
            //         LuarNegara.onEligibleCheck(oModel, sClaimItmType);
            //         break;

            //     case KURSUS_DLM_NEGARA:
            //         KursusDalam.onEligibleCheck(oModel, sClaimItmType);
            //         break;

            //     case KURSUS_LUAR_NEGARA:
            //         KursusLuar.onEligibleCheck(oModel, sClaimItmType);
            //         break;

            //     case PELBAGAI: // Pelbagai no requirement checking needed
            //         Pelbagai.onEligibleCheck(oModel, sClaimItmType);
            //         break;

            //     default:
            //         break;
            // }
        }

    };

});
