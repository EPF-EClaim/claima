sap.ui.define([
    "claima/utils/Constants"
], function (Constants) {
    "use strict";

    return {
        
        init: function(oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
		},

        costCenterDetermination: async function (oController, sClaimTypeId) {
            
			try {
				const oFunction = oController._oDataModel.bindContext("/checkDefaultCostCenter(...)");
				
				oFunction.setParameter("sClaimTypeId", sClaimTypeId);

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

                return oResult.sCostCenter;

			} catch (oError) {
				console.error("Failed to check eligibility", oError);
			}
        }
    };
});