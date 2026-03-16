sap.ui.define([
    "./DalamNegara",
    "./LuarNegara",
    "./KursusDalam",
    "./KursusLuar",
    "./Pelbagai"
], function (DalamNegara, LuarNegara, KursusDalam, KursusLuar, Pelbagai) {
    "use strict";
    return {
        onEligibilityCheck: async function () {
            
            this._oConstant = this.getOwnerComponent().getModel("constant").getData();

            switch (ClaimType) {
                case cDalamNegara:
                    DalamNegara.onEligibleCheck(oModel, Boxid, ClaimItmType);
                    break;
                
                case cLuarNegara:
                    LuarNegara.onEligibleCheck();
                    break;

                case cKursusDalamNegara:
                    KursusDalam.onEligibleCheck();
                    break;

                case cKursusLuarNegara:
                    KursusLuar.onEligibleCheck();
                    break;

                case cPelbagai:
                    Pelbagai.onEligibleCheck();;
                    break;

                default:
                    break;
            }
        }

    };

});
