sap.ui.define([
    "claima/utils/Constants"
], function (Constants) {
    "use strict";

    return {
        
		/**
         * Initialize the RequestUtility
         * @public
         */
        init: function(oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
		},

        costCenterDetermination: async function (sClaimTypeId) {
            
			try {
				const oFunction = this._oOwnerComponent.getModel().bindContext("/checkDefaultCostCenter(...)");
				
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