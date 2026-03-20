sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "claima/utils/Constants",
    "./DalamNegara",
    "./LuarNegara",
    "./KursusDalam",
    "./KursusLuar",
    "./Pelbagai"
], function (Filter, FilterOperator, Constants, DalamNegara, LuarNegara, KursusDalam, KursusLuar, Pelbagai) {
    "use strict";
    return {
        /**
		 * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 value
		 * @public
		 * @param {sap.ui.base.Event} sVal1 - Value Input to be checked;
         * @param {sap.ui.base.Event} sVal2 - Value Input to be checked against;
         * @returns {Boolean/Integer/String} Comparison Output
		 */
        onEligibilityCheck: async function (oModel, oPayload) {
            // Get Employee ID
            const oEmpBindList = oModel.bindList("/ZEMP_MASTER");
            // Prep Filters for ZEMP_MASTER Selection
            var aEmpFilters = [];
            var aEmpAndFilters = [];
            aEmpAndFilters.push(new Filter("EEID", FilterOperator.EQ, oPayload.EmpId));
            aEmpAndFilters = new Filter(aEmpAndFilters, true);

            aEmpFilters.push(new Filter(aEmpAndFilters));
            aEmpFilters = new Filter(aEmpFilters, true);
           
            const oEmp = await oEmpBindList.filter(aEmpFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                var oEmp = aContexts.map(context => context.getObject())[0];
                return oEmp;
            });

            // Get eligibility rules based on Employee Data
            const oRulesBindList = oModel.bindList("/ZELIGIBILITY_RULE");
            // Prep Filters for ZELIGIBILITY_RULE Selection
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
                var aRules = aContexts.map(context => context.getObject());
                return aRules;
            });

            // Proceed to each Claim Type
            switch (oPayload.ClaimType) {
                case Constants.ClaimType.DLM_NEGARA:
                    var oReturnPayload = DalamNegara.onEligibleCheck(oPayload, aRules);//, oHeader
                    break;

                case Constants.ClaimType.LUAR_NEGARA:
                    oReturnPayload = LuarNegara.onEligibleCheck(oPayload, aRules);
                    break;

                case Constants.ClaimType.KURSUS_DLM_NEGARA:
                    oReturnPayload = KursusDalam.onEligibleCheck(oPayload, aRules);
                    break;

                case Constants.ClaimType.KURSUS_LUAR_NEGARA:
                    oReturnPayload = KursusLuar.onEligibleCheck(oPayload, aRules);
                    break;

                // case PELBAGAI: // Pelbagai no requirement checking needed
                //     break;

                default:
                    break;
            }

            // Return Payload with Result Populated for front end validation
            return oReturnPayload;
        }

    };

});
