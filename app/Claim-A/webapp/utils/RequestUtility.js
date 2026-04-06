sap.ui.define([
    "claima/utils/Constants",
    "sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
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
        init: function(oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
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

        onFilterToState: function (oEvent) {
            const oReqItem  = this._oReqModel.getProperty("/req_item");
            
            var sFromState  = oReqItem.from_state;
            var sFromOffice = oReqItem.from_location_office;

			const oSelect   = this.byId("item_to_state");
			const oBinding  = oSelect.getBinding("items");
			const aFilters  = oSelect ? [
                                new Filter("FROM_STATE_ID", FilterOperator.EQ, sFromState),
                                new Filter("FROM_LOCATION_ID", FilterOperator.EQ, sFromOffice)
                            ]: [];
			oBinding.filter(aFilters);
		},

        onFilterToOffice: function (oEvent) {
            const oReqItem  = this._oReqModel.getProperty("/req_item");
            
            var sFromState  = oReqItem.from_state;
            var sFromOffice = oReqItem.from_location_office;
            var sToState    = oReqItem.to_state;

			const oSelect   = this.byId("item_to_location_office");
			const oBinding  = oSelect.getBinding("items");
			const aFilters  = oSelect ? [
                                new Filter("FROM_STATE_ID", FilterOperator.EQ, sFromState),
                                new Filter("FROM_LOCATION_ID", FilterOperator.EQ, sFromOffice),
                                new Filter("TO_STATE_ID", FilterOperator.EQ, sToState)
                            ]: [];
			oBinding.filter(aFilters);
		},

        populateAllocatedAmount: function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oReqItem  = oReqModel.getProperty("/req_item");
            const oReqPart  = oReqModel.getProperty("/participant");

            var fKilometer  = parseFloat(oReqItem.kilometer);
            var fRatePerKm  = parseFloat(oReqItem.rate_per_kilometer);

            if (!fKilometer || !fRatePerKm) return;

            // globalize this amount 
            this._calculatedAllocAmount = fKilometer * fRatePerKm;

            oReqPart.forEach((row, index) => {
                if (row.PARTICIPANTS_ID) {
                    oReqModel.setProperty(`/participant/${index}/ALLOCATED_AMOUNT`,
                        parseFloat(this._calculatedAllocAmount).toFixed(2)
                    );
                }
            });

            return parseFloat(this._calculatedAllocAmount).toFixed(2);

        },

		populateEstimatedAmount(fAllocatedAmount) {
			const aParticipantList = this._oReqModel.getProperty("/participant");

			// Use let OR use reduce directly
			const fEstAmount = aParticipantList.reduce((sum, row) => {
				return sum + parseFloat(row.ALLOCATED_AMOUNT || 0);
			}, 0);

			this._oReqModel.setProperty("/req_item/est_amount", fEstAmount.toFixed(2));
            return fAllocatedAmount;
		},
        
    };
});