sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/ui/core/Fragment",
	"sap/ui/export/Spreadsheet",
	"sap/ui/core/BusyIndicator"
], function (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment, Spreadsheet, BusyIndicator) {
	"use strict";

	return Controller.extend("claima.controller.RequestForm", {
 
		/* =========================================================
		* Lifecycle
		* ======================================================= */
		async onInit() {

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
		
		/* =========================================================
		* Main Logic
		* ======================================================= */

        async openItemFromList(oEvent) {
            try {
                this.getView().setBusy(true);

                const oReqModel = this._getReqModel();
                const oTable    = this.byId("tb_myrequestform");

                oReqModel.setProperty("/view", "view");

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

                const row   = oCtx.getObject(); 

                oReqModel.setProperty("/req_header", {
					purpose        : row.OBJECTIVE_PURPOSE || "",
					reqtype        : row.REQUEST_TYPE_ID || "",
					tripstartdate  : row.TRIP_START_DATE || "",
					tripenddate    : row.TRIP_END_DATE || "",
					eventstartdate : row.EVENT_START_DATE || "",
					eventenddate   : row.EVENT_END_DATE || "",
					grptype        : row.IND_OR_GROUP || "",
					location       : row.LOCATION || "",
					transport      : row.TYPE_OF_TRANSPORTATION || "",
					altcostcenter  : row.ALTERNATE_COST_CENTER || "",
					doc1           : row.ATTACHMENT1 || "",
					doc2           : row.ATTACHMENT2 || "",
					comment        : "",
					eventdetail1   : row.EVENT_FIELD1 || "",
					eventdetail2   : row.EVENT_FIELD2 || "",
					eventdetail3   : row.EVENT_FIELD3 || "",
					eventdetail4   : row.EVENT_FIELD4 || "",
					reqid          : row.REQUEST_ID || "",
					reqstatus      : row.STATUS || "",
					costcenter     : row.COST_CENTER || "",
					cashadvamt     : row.CASH_ADVANCE || 0,
					reqamt         : row.PREAPPROVAL_AMOUNT || 0,
					claimtype	   : row.CLAIM_TYPE_ID || ""
                });

                this._getItemList(row.REQUEST_ID);

				if (row.STATUS == 'DRAFT') {
                	oReqModel.setProperty("/view", "list");
				}

                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RequestForm", {request_id: encodeURIComponent(row.REQUEST_ID)});
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
		
	});
});