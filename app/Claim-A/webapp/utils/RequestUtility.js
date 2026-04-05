sap.ui.define([
    "claima/utils/Constants",
    "sap/ui/core/Fragment"
], function (
    Constants,
	Fragment) {
    "use strict";

    return {
        
		/**
         * Initialize the RequestUtility
         * @public
         */
        init: function(oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
		},

        determineDefaultCostCenter: async function (oEvent) {
			var oSelectControl = oEvent.getSource();
    		var sClaimTypeId = oSelectControl.getSelectedKey();
			const oDialogModel = this.oDialogFragment.getModel("reqDialog");

            try {
				const oFunction = this._oDataModel.bindContext("/checkDefaultCostCenter(...)");
				
				oFunction.setParameter("sClaimTypeId", sClaimTypeId);

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

                var sCostCenter = oResult.sCostCenter;
                var sCostCenterDesc = oResult.sCostCenterDesc;

                if (sCostCenter) {
                    Fragment.byId("request", "req_acc").setEditMode("ReadOnly");
                    oDialogModel.setProperty("/altcostcenter", sCostCenter);
                    oDialogModel.setProperty("/altcostcenter_desc", sCostCenterDesc);
                } else {
                    Fragment.byId("request", "req_acc").setEditMode("Editable");
                    oDialogModel.setProperty("/altcostcenter", null);
                    oDialogModel.setProperty("/altcostcenter_desc", null);
                }

			} catch (oError) {
				return null;
			}
		},

        
    };
});