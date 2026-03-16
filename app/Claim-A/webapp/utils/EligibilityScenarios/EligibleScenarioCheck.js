sap.ui.define([
    "./DalamNegara",
    "./LuarNegara",
    "./KursusDalam",
    "./KursusLuar",
    "./Pelbagai"
], function (oModel, boxid, DalamNegara, LuarNegara, KursusDalam, KursusLuar, Pelbagai) {
    "use strict";
    return {
        onEligibilityCheck: async function (oModel, Boxid, ClaimItmType) {
            
            switch (ClaimItmType) {
                case value:
                    
                    break;
            
                default:
                    break;
            }
            DalamNegara.onEligibleCheck();
            LuarNegara.onEligibleCheck();
            KursusDalam.onEligibleCheck();
            KursusLuar.onEligibleCheck();
            Pelbagai.onEligibleCheck();
        }

    };

});
