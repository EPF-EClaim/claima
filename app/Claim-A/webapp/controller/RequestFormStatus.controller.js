sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/BusyIndicator",
	"claima/utils/PARequestSharedFunction",
	"sap/ui/model/Sorter"
], function (
	Controller, 
	MessageToast,
	BusyIndicator, 
	PARequestSharedFunction, 
	Sorter) {
	"use strict";

	return Controller.extend("claima.controller.RequestFormStatus", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */
		onInit() {
			this._oConstant 		= this.getOwnerComponent().getModel("constant").getData();
			this._oRouter 			= this.getOwnerComponent().getRouter();
			this._oDataModel		= this.getOwnerComponent().getModel();
			this._oViewModel 		= this.getOwnerComponent().getModel('employee_view');
			this._oReqModel			= this.getOwnerComponent().getModel('request');
			this._oReqStatusModel 	= this.getOwnerComponent().getModel("request_status");
			
			PARequestSharedFunction.getPARHeaderList(this._oReqStatusModel, this._oViewModel);
			
			this._mSortState = {};
		},

		/* =========================================================
		* Main Logic
		* ======================================================= */

		async openItemFromList(oEvent) {
			try {
				BusyIndicator.show(0);
				const oTable = this.byId("tb_myrequestform");

				let oCtx = oEvent?.getParameter?.("listItem")?.getBindingContext("request");

				if (!oCtx) {
					const oSelected = oTable.getSelectedItem?.();
					if (oSelected) {
						oCtx = oSelected.getBindingContext("request_status");
					}
				}

				if (!oCtx) {
					sap.m.MessageToast.show("Select an item to open");
					return;
				}

				const oSelectedRequest = oCtx.getObject();
				const sReqId = oSelectedRequest.REQUEST_ID;
				
				this._oRouter.navTo("RequestForm", {request_id: encodeURIComponent(sReqId)});
			} catch (e) {
				jQuery.sap.log.error("openItemFromList failed: " + e);
				MessageToast.show("Failed to open the selected item.");
			} finally {
				BusyIndicator.hide();
			}
		},

		/* =========================================================
		* Sorter Logic
		* ======================================================= */

		onSortToggle: function (oEvent) {
			var sPath = oEvent.getSource().data("path");
			if (!sPath) { return; }

			var oTable = this.byId("tb_myrequestform");
			if (!oTable) { return; }

			var oBinding = oTable.getBinding("items");
			if (!oBinding) { return; }

			// Toggle current direction for this path
			var bDesc = !!this._mSortState[sPath];

			// OData V4: do NOT pass a comparator; backend applies $orderby
			var oSorter = new Sorter(sPath, bDesc);

			oBinding.sort([oSorter]); // triggers a backend request with $orderby

			// Flip for next click and update the icon for feedback
			this._mSortState[sPath] = !bDesc;
			oEvent.getSource().setIcon(
				this._mSortState[sPath] ? "sap-icon://sort-descending" : "sap-icon://sort-ascending"
			);
		},

		onResetSort: function () {
			var oTable = this.byId("tb_myrequestform");
			var oBinding = oTable?.getBinding("items");
			if (oBinding) {
				oBinding.sort(null); // clear sorters -> reload without $orderby
			}
			// Clear state
			this._mSortState = {};
			this._resetSortIcons(oTable);
		},

		_resetSortIcons: function (oTable) {
			if (!oTable) { return; }
			oTable.getColumns().forEach(function (oCol) {
				var oHeader = oCol.getHeader();
				if (oHeader && oHeader.findAggregatedObjects) {
					// Find all sap.m.Buttons that carry data("path") -> our sort buttons
					var aSortBtns = oHeader.findAggregatedObjects(true, function (oCtrl) {
						return oCtrl.isA("sap.m.Button") && !!oCtrl.data("path");
					});
					aSortBtns.forEach(function (oBtn) {
						oBtn.setIcon("sap-icon://sort");
					});
				}
			});
		}







	});
});