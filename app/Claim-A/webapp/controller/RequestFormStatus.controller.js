sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/ui/core/Fragment",
	"sap/ui/export/Spreadsheet",
	"sap/ui/core/BusyIndicator",
	"claima/utils/PARequestSharedFunction",
	"sap/ui/model/Sorter"
], function (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment, Spreadsheet, BusyIndicator, PARequestSharedFunction, Sorter) {
	"use strict";

	return Controller.extend("claima.controller.RequestFormStatus", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */
		onInit() {
			// initialize PAR Status List
			PARequestSharedFunction.getPARHeaderList(this._getReqStatModel(), this._getViewModel());
			//For Sort
			this._mSortState = {};
		},

		/* =========================================================
		* Helpers: Model & Service
		* ======================================================= */

		_getReqModel() {
			return this.getOwnerComponent().getModel("request");
		},

		_getReqStatModel() {
			return this.getOwnerComponent().getModel("request_status");
		},

		_getViewModel() {
			return this.getOwnerComponent().getModel("employee_view");
		},

		/* =========================================================
		* Main Logic
		* ======================================================= */



		async openItemFromList(oEvent) {
			try {
				this.getView().setBusy(true);

				const oReqModel = this._getReqModel();
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

				const row = oCtx.getObject();
				const sReqId = row.REQUEST_ID;

				const oModel = this.getOwnerComponent().getModel('employee_view');
				const oListBinding = oModel.bindList(
					"/ZEMP_REQUEST_EE_VIEW",
					null,
					null,
					[
						new sap.ui.model.Filter({
							path: "REQUEST_ID",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sReqId
						})
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto"
					}
				);

				const aCtx = await oListBinding.requestContexts(0, 1);
				const oData = aCtx[0]?.getObject();

				if (!oData) {
					sap.m.MessageToast.show("No data found for request " + sReqId);
					oReqModel.setProperty("/req_header", {});
					return;
				}

				oReqModel.setProperty("/req_header", {
					purpose: oData.OBJECTIVE_PURPOSE || "",
					reqtype: oData.REQUEST_TYPE_DESC || "",
					tripstartdate: oData.TRIP_START_DATE || "",
					tripenddate: oData.TRIP_END_DATE || "",
					eventstartdate: oData.EVENT_START_DATE || "",
					eventenddate: oData.EVENT_END_DATE || "",
					grptype: oData.IND_OR_GROUP_DESC || "",
					location: oData.LOCATION || "",
					transport: oData.TYPE_OF_TRANSPORTATION || "",
					altcostcenter: oData.ALTERNATE_COST_CENTER || "",
					doc1: oData.ATTACHMENT1 || "",
					doc2: oData.ATTACHMENT2 || "",
					comment: oData.REMARK || "",
					eventdetail1: oData.EVENT_FIELD1 || "",
					eventdetail2: oData.EVENT_FIELD2 || "",
					eventdetail3: oData.EVENT_FIELD3 || "",
					eventdetail4: oData.EVENT_FIELD4 || "",
					reqid: oData.REQUEST_ID || "",
					reqstatus: oData.STATUS_DESC || "",
					reqstatus_id: oData.STATUS_ID || "",
					costcenter: oData.COST_CENTER || "",
					cashadvamt: oData.CASH_ADVANCE || 0,
					reqamt: oData.PREAPPROVAL_AMOUNT || 0,
					claimtype: oData.CLAIM_TYPE_ID || "",
					claimtypedesc: oData.CLAIM_TYPE_DESC || "",
					reqdate: oData.REQUEST_DATE
				});

				await this._getItemList(sReqId);

				if (row.STATUS === "CREATED") {
					oReqModel.setProperty("/view", "list");
				}

				const oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("RequestForm", {
					request_id: encodeURIComponent(sReqId)
				});

			} catch (e) {
				jQuery.sap.log.error("openItemFromList failed: " + e);
				sap.m.MessageToast.show("Failed to open the selected item.");
			} finally {
				this.getView().setBusy(false);
			}
		},

		async _getItemList(req_id) {
			const oReq = this._getReqModel();

			if (!req_id) {
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}

			const oModel = this.getOwnerComponent().getModel('employee_view');

			const sReq = String(req_id);

			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_ITEM_VIEW",
				null,
				[new sap.ui.model.Sorter("REQUEST_SUB_ID", false)],
				[new sap.ui.model.Filter({
					path: "REQUEST_ID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sReq
				})],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$count: true
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				a.forEach((it) => {
					if (it.EST_AMOUNT != null) it.EST_AMOUNT = parseFloat(it.EST_AMOUNT);
					if (it.EST_NO_PARTICIPANT != null) it.EST_NO_PARTICIPANT = parseInt(it.EST_NO_PARTICIPANT, 10);
				});

				const cashadv_amt = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === "YES" ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				const req_amt = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === null ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				oReq.setProperty("/req_header/cashadvamt", cashadv_amt);
				oReq.setProperty("/req_header/reqamt", req_amt);
				oReq.setProperty("/req_item_rows", a);
				oReq.setProperty("/list_count", a.length);

				return a;
			} catch (err) {
				console.error("OData V4 bindList failed:", err);
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}
		},

		//Added for sorter;


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