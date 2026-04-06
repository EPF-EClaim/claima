sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"claima/utils/Utility",
	"sap/suite/ui/commons/BusinessCard",
	"sap/m/BusyIndicator",
	"claima/utils/DateUtility"
], function (Controller,
	JSONModel,
	MessageToast,
	Filter,
	FilterOperator,
	Sorter,
	Utility,
	BusinessCard,
	BusyIndicator,
	DateUtility) {
	"use strict";

	return Controller.extend("claima.controller.ClaimStatus", {

		onInit: function () {
			// Track current sort direction per path: true = DESC, false = ASC
			this._mSortState = {};
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
			this._oSessionModel 	= this.getOwnerComponent().getModel("session");
			this.getOwnerComponent().getRouter().getRoute("ClaimStatus").attachPatternMatched(this._onMatched, this);
		},

		_onMatched: async function() {
			const _oReq = this.getOwnerComponent().getModel("claim_status2");
			const _oModel = this.getOwnerComponent().getModel("employee_view");

			const oListBinding = _oModel.bindList("/ZEMP_CLAIM_EE_VIEW", undefined,
				[new Sorter("modifiedAt", true)],
				null,
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$updateGroupId: "$auto",
					$count: true
				}
			);
			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => {
							const oCtxObj = ctx.getObject();
							oCtxObj.modifiedAt = DateUtility.convertUTCToLocal(oCtxObj.modifiedAt);
							return oCtxObj;
						});

				_oReq.setProperty("/claim_header_list", a);
				_oReq.setProperty("/claim_header_count", a.length);
			} catch (err) {
				console.error("OData bindList failed:", err);
				_oReq.setProperty("/claim_header_list", []);
				_oReq.setProperty("/claim_header_count", 0);
			} finally {
				BusyIndicator.hide();
			}
		},

		_getClaimModel() {
			return this.getOwnerComponent().getModel("claim");
		},

		_getClaimStatModel() {
			return this.getOwnerComponent().getModel("claim_status2");
		},

		async onRowPress(oEvent) {
			try {
				this.getView().setBusy(true);

				const oListItem = oEvent?.getParameter("listItem");

				let oCtx =
					oListItem?.getBindingContext("claim_status2") ||
					oListItem?.getBindingContext("request_status") ||
					oListItem?.getBindingContext() || null;

				if (!oCtx) {
					const oTable = this.byId("tb_myapproval_claim"); // adjust ID if different
					const oSelected = oTable?.getSelectedItem?.();
					if (oSelected) {
						oCtx =
							oSelected.getBindingContext("claim_status2") ||
							oSelected.getBindingContext("request_status") ||
							oSelected.getBindingContext();
					}
				}

				if (!oCtx) {
					MessageToast.show(Utility.getText("msg_claimstatus_select"));
					return;
				}

				const row = oCtx.getObject();

				const sClaimId =
					row.CLAIM_ID ||
					row.CLAIM_REQUEST_ID ||
					row.CLAIMID ||
					null;

				if (!sClaimId) {
					MessageToast.show(Utility.getText("msg_claimstatus_missing"));
					return;
				}
                // Navigate to claim submission ID
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("ClaimSubmission", { claim_id: encodeURIComponent(String(sClaimId)) });
			} catch (e) {
				sap.base.Log.error("openItemFromClaimList failed:", e);
				MessageToast.show(Utility.getText("msg_claimstatus_failed"));
			} finally {
				this.getView().setBusy(false);
			}
		},

		/* =========================================================
		 *                        SORTING (OData V4)
		 * ========================================================= */

		onSortToggle: function (oEvent) {
			// Property to sort by, passed via core:CustomData on the header button
			var sPath = oEvent.getSource().data("path");
			if (!sPath) { return; }

			var oTable = this.byId("tb_myexpenserepo");
			if (!oTable) { return; }

			var oBinding = oTable.getBinding("items");
			if (!oBinding) { return; }

			// Toggle direction for this path (default first click = ASC)
			var bDesc = !!this._mSortState[sPath];

			// IMPORTANT: For OData V4, do not pass comparator; backend does the ordering ($orderby)
			var oSorter = new Sorter(sPath, bDesc);

			// Apply sort -> triggers a backend request with $orderby
			oBinding.sort([oSorter]);

			// Flip state for next press and update icon for user feedback
			this._mSortState[sPath] = !bDesc;
			oEvent.getSource().setIcon(this._mSortState[sPath] ? "sap-icon://sort-descending" : "sap-icon://sort-ascending");
		},

		onResetSort: function () {
			var oTable = this.byId("tb_myexpenserepo");
			var oBinding = oTable && oTable.getBinding("items");
			if (oBinding) {
				oBinding.sort(null); // clears sorters; backend reload without $orderby
			}

			// Clear sort state memory
			this._mSortState = {};

			// Reset header icons back to neutral
			this._resetSortIcons(oTable);
		},

		/** Reset all sort button icons inside a table to neutral "sort" */
		_resetSortIcons: function (oTable) {
			if (!oTable) { return; }

			// Loop through table columns and search their header content
			oTable.getColumns().forEach(function (oCol) {
				var oHeader = oCol.getHeader();
				if (oHeader && oHeader.findAggregatedObjects) {
					// Find all Button controls that have data("path") - our sort buttons
					var aSortBtns = oHeader.findAggregatedObjects(true, function (oCtrl) {
						return oCtrl.isA("Button") && !!oCtrl.data("path");
					});
					aSortBtns.forEach(function (oBtn) {
						oBtn.setIcon("sap-icon://sort"); // back to neutral
					});
				}
			});
		}
	});
});
