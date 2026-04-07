sap.ui.define([
    "claima/utils/Constants",
    "sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"claima/utils/Utility"
], function (
    Constants,
	Fragment,
	Filter,
	FilterOperator) {
    "use strict";

    return {
        
		/**
         * Initialize the RequestUtility
         * @public
         */
        init: function(oOwnerComponent, oView) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
		},

        determineDefaultCostCenter: async function (oEvent) {
			var oSelectControl = oEvent.getSource();
    		var sClaimTypeId = oSelectControl.getSelectedKey();
			const oDialogModel = this.oDialogFragment.getModel("reqDialog");

            const oFunction = this._oDataModel.bindContext("/checkDefaultCostCenter(...)");
            oFunction.setParameter("sClaimTypeId", sClaimTypeId);
          
            try {
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

        determineOfficeMileage: async function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oDataModel = this._oDataModel ? this._oDataModel : this._oOwnerComponent.getModel();
            const oReqItem  =oReqModel.getProperty("/req_item");

            var sFromState  = oReqItem.from_state;
            var sFromOffice = oReqItem.from_location_office;
            var sToState    = oReqItem.to_state
            var sToOffice   = oReqItem.to_location_office;

            if (!sFromState || !sFromOffice || !sToState || !sToOffice) return;

            const oFunction = oDataModel.bindContext("/getOfficeDistance(...)");
            oFunction.setParameter("sFromState", sFromState);
            oFunction.setParameter("sFromOffice", sFromOffice);
            oFunction.setParameter("sToState", sToState);
            oFunction.setParameter("sToOffice", sToOffice);

            try {
                await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

                var fMileage = parseFloat(oResult.value);

                oReqModel.setProperty("/req_item/kilometer", fMileage);

                this.populateAllocatedAmount();

            } catch (error) {
                return parseFloat(0).toFixed(2);
            }
        },

        populateAllocatedAmount: function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oReqItem  = oReqModel.getProperty("/req_item");
            const aReqPart  = oReqModel.getProperty("/participant");

            // calculate kilometer amount 
            var calculatedAllocAmount = this._calculateAllocatedAmountForKilometer(oReqItem);

            // populate allocated amount
            if (calculatedAllocAmount) {
                aReqPart.forEach((row, index) => {
                    if (row.PARTICIPANTS_ID) {
                        oReqModel.setProperty(`/participant/${index}/ALLOCATED_AMOUNT`,
                            parseFloat(calculatedAllocAmount).toFixed(2)
                        );
                    }
                });
            }

            // populate estimated amount
            var fEstAmount = this._calculateEstimatedAmount(oReqItem, aReqPart);
            oReqModel.setProperty("/req_item/est_amount", fEstAmount.toFixed(2));
        },

        _calculateAllocatedAmountForKilometer: function (oReqItem) {
            var fKilometer  = parseFloat(oReqItem.kilometer).toFixed(2) || 0;
            var fRatePerKm  = parseFloat(oReqItem.rate_per_kilometer).toFixed(2) || 0;

            if (!fKilometer || !fRatePerKm) return;

            return parseFloat(fKilometer) * parseFloat(fRatePerKm);
        },

		_calculateEstimatedAmount(oReqItem, aParticipantList) {

			const fTotalSum = aParticipantList.reduce((sum, row) => {
				return sum + parseFloat(row.ALLOCATED_AMOUNT || 0);
			}, 0);

            // add up toll amount
            if (oReqItem.toll_amt) return parseFloat(fTotalSum) + parseFloat(oReqItem.toll_amt);

			return fTotalSum;
		},
        
    };
});