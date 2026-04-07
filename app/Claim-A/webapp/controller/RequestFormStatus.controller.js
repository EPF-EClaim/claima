sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/StandardListItem",
	"sap/m/SelectDialog",
	"sap/ui/core/BusyIndicator",
	"claima/utils/PARequestSharedFunction",
	"claima/utils/Utility",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"claima/utils/DateUtility"
], function (
	Controller,
	MessageToast,
	StandardListItem,
	SelectDialog,
	BusyIndicator,
	PARequestSharedFunction,
	Utility,
	Sorter,
	Filter,
	FilterOperator,
	DateUtility ) {
	"use strict";

	return Controller.extend("claima.controller.RequestFormStatus", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */

		DateUtility: DateUtility,
		onInit() {
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oDataModel = this.getOwnerComponent().getModel();
			this._oViewModel = this.getOwnerComponent().getModel('employee_view');
			this._oReqModel = this.getOwnerComponent().getModel('request');
			this._oReqStatusModel = this.getOwnerComponent().getModel("request_status");

			this._oRouter.getRoute("RequestFormStatus").attachPatternMatched(this._onMatched, this);

			this._mSortState = {};
		},

		async _onMatched(oEvent) {
			const oArgs = oEvent.getParameter("arguments");
			await this.getPARHeaderList(this._oReqStatusModel, this._oViewModel);
		},

		/* =========================================================
		* Main Logic
		* ======================================================= */

		async getPARHeaderList(oReqStatusModel, oViewModel) {

			const oListBinding = oViewModel.bindList("/ZEMP_REQUEST_EE_VIEW", undefined,
				[new Sorter("modifiedAt", true)], null,
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$updateGroupId: "$auto",
					$count: true
				}
			);

			try {
				const oContext = await oListBinding.requestContexts(0, Infinity);
				const oContextItems = oContext.map((ctx) => ctx.getObject());

				oContextItems.forEach((it) => {
					if (it.PREAPPROVAL_AMOUNT == null) it.PREAPPROVAL_AMOUNT = 0.0;
				});

				oReqStatusModel.setProperty("/req_header_list", oContextItems);
				oReqStatusModel.setProperty("/req_header_count", oContextItems.length);

				return oContextItems;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReqStatusModel.setProperty("/req_header_list", []);
				oReqStatusModel.setProperty("/req_header_count", 0);
				return [];
			}
		},

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

				this._oRouter.navTo("RequestForm", { request_id: encodeURIComponent(sReqId) });
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
		},

		onOpenFilterDialog: function () {
			Utility.openClaimTypeFilterDialog(
				this,
				'request_status',
				'/req_header_list'
			);
		},

		onFilterSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("title", FilterOperator.Contains, sValue);
			oEvent.getParameter("itemsBinding").filter([oFilter]);
		},

		onFilterCancel: function () {
			if (this._oFilterDialog) this._oFilterDialog.close();
		},

		onFilterConfirm: function (oEvent) {
			Utility.confirmClaimTypeFilter(
				this,
				'request_status',
				'/req_header_list',
				'/req_header_count',
				oEvent
			);
		},
	});
});