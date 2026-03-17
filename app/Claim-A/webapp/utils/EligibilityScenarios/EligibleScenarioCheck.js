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

            DalamNegara.onEligibleCheck(oModel, sClaimType, sClaimItmType, oEmp);
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
