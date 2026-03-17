sap.ui.define([
    "./DalamNegara",
    "./LuarNegara",
    "./KursusDalam",
    "./KursusLuar",
    "./Pelbagai"
], function (DalamNegara, LuarNegara, KursusDalam, KursusLuar, Pelbagai) {
    "use strict";
    return {
        onEligibilityCheck: async function (oModel, ClaimType, ClaimItmType) {
            // initialize Constants file
            this._oConstant = this.getOwnerComponent().getModel("constant").getData();

            DalamNegara.onEligibleCheck(oModel, ClaimItmType);
            switch (ClaimType) {
                case _oConstant.ClaimType.DLM_NEGARA:
                    DalamNegara.onEligibleCheck(oModel, ClaimItmType);
                    break;
                
                case _oConstant.ClaimType.LUAR_NEGARA:
                    LuarNegara.onEligibleCheck(oModel, ClaimItmType);
                    break;

                case KURSUS_DLM_NEGARA:
                    KursusDalam.onEligibleCheck(oModel, ClaimItmType);
                    break;

                case KURSUS_LUAR_NEGARA:
                    KursusLuar.onEligibleCheck(oModel, ClaimItmType);
                    break;

                case PELBAGAI: // Pelbagai no requirement checking needed
                    Pelbagai.onEligibleCheck(oModel, ClaimItmType);
                    break;

                default:
                    break;
            }
        }

    };

});
