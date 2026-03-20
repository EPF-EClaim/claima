sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./DalamNegara",
    "./LuarNegara",
    "./KursusDalam",
    "./KursusLuar",
    "./Pelbagai",
], function (Filter, FilterOperator, DalamNegara, LuarNegara, KursusDalam, KursusLuar, Pelbagai) {
    "use strict";
    return {
        onEligibilityCheck: async function (oModel, oConstant, oPayload) {
            // Get Employee ID
            // oPayload.EmpId = 1234567;
            const oEmpBindList = oModel.bindList("/ZEMP_MASTER");

            var aEmpFilters = [];
            var aEmpAndFilters = [];
            aEmpAndFilters.push(new Filter("EEID", FilterOperator.EQ, oPayload.EmpId));
            aEmpAndFilters = new Filter(aEmpAndFilters, true);

            aEmpFilters.push(new Filter(aEmpAndFilters));
            aEmpFilters = new Filter(aEmpFilters, true);
           
            const oEmp = await oEmpBindList.filter(aEmpFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                // var sGrade = aContexts.map(context => context.getObject())[0].GRADE;
                 console.log("aContext",aContexts);
                var oEmp = aContexts.map(context => context.getObject())[0];
                // var aEmp = aContexts.map(context => context.getObject());
                return oEmp;
            });
 
            const oRulesBindList = oModel.bindList("/ZELIGIBILITY_RULE");

             // Get eligibility rules based on Employee Personal Grade
            var aRulesFilters = [];
            var aRulesAndFilters = [];
            var aRulesOrFilters = [];

            aRulesAndFilters.push(new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oPayload.ClaimTypeItem));
            aRulesAndFilters.push(new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oPayload.ClaimType));
            aRulesAndFilters = new Filter(aRulesAndFilters, true);

            aRulesOrFilters.push(new Filter("PERSONAL_GRADE", FilterOperator.EQ, oEmp.GRADE));
            aRulesOrFilters.push(new Filter("PERSONAL_GRADE", FilterOperator.EQ, "*"));
            aRulesOrFilters = new Filter(aRulesOrFilters, false);
            
            aRulesFilters.push(new Filter(aRulesAndFilters));
            aRulesFilters.push(new Filter(aRulesOrFilters));
            aRulesFilters = new Filter(aRulesFilters, true);

            const aRules = await oRulesBindList.filter(aRulesFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                // var sGrade = aContexts.map(context => context.getObject())[0];
                var aRules = aContexts.map(context => context.getObject());
                return aRules;
            });
            
            // LuarNegara.onEligibleCheck(oModel, oConstant, oPayload, oEmp, aRules);
            switch (oPayload.ClaimType) {
                case oConstant.ClaimType.DLM_NEGARA:
                    var oReturnPayload = DalamNegara.onEligibleCheck(oConstant, oPayload, aRules);
                    break;

                case oConstant.ClaimType.LUAR_NEGARA:
                    oReturnPayload = LuarNegara.onEligibleCheck(oConstant, oPayload, aRules);
                    break;

                case oConstant.ClaimType.KURSUS_DLM_NEGARA:
                    oReturnPayload = KursusDalam.onEligibleCheck(oConstant, oPayload, aRules);
                    break;

                case oConstant.ClaimType.KURSUS_LUAR_NEGARA:
                    oReturnPayload = KursusLuar.onEligibleCheck(oConstant, oPayload, aRules);
                    break;

                // case PELBAGAI: // Pelbagai no requirement checking needed
                //     Pelbagai.onEligibleCheck(oConstant, oPayload, aRules);
                //     break;

                default:
                    break;
            }

            return oReturnPayload;
        }

    };

});
