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
			// Get current user (FLP)
			try {
				this._userId = sap.ushell?.Container?.getUser?.().getId() || "";
			} catch (e) { this._userId = ""; }

			// Ensure model defaults exist (OPTION 1 structure)
			this._ensureRequestModelDefaults();

            this._getHeaderList();
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

		_ensureRequestModelDefaults() {
			const oReq = this._getReqModel();
			const data = oReq.getData() || {};
			data.view = "view";
            data.req_header_count  = data.req_header_count ?? 0;
            data.req_header_list   = Array.isArray(data.req_header_list) ? data.req_item_rows: [];
			oReq.setData(data);
		},

		_serviceRoot(sDataSource = "mainService") {
			const oManifest = this.getOwnerComponent().getManifestEntry("sap.app");
			const sUri = oManifest?.dataSources?.[sDataSource]?.uri;
			
			let sPath = sUri;
			if (!sPath) {
				sPath = (sDataSource === "mainService") 
					? "/odata/v4/EmployeeSrv/" 
					: "/odata/v4/eclaim-view-srv/";
			}

			return sPath.replace(/\/$/, "");
		},
		
		_entityUrl(sEntitySet, sDataSource = "mainService") {
			const sBase = this._serviceRoot(sDataSource);
			return new URL(`${sBase}/${sEntitySet}`, window.location.origin).toString();
		},
		
		/* =========================================================
		* Main Logic
		* ======================================================= */

        async _getHeaderList() {
			const oReq = this._getReqStatModel();

			const base       = this._entityUrl("ZREQUEST_HEADER");
			const orderby    = "REQUEST_ID asc";
			const query = [
				`$orderby=${encodeURIComponent(orderby)}`,
				`$count=true`,
				`$format=json`
			].join("&"); // IMPORTANT: use '&' (not &amp;)

			const url = `${base}?${query}`;

			try {
				const res = await fetch(url, { headers: { "Accept": "application/json" } });
				if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
				const data = await res.json();
				const a = Array.isArray(data?.value) ? data.value : [];

                a.forEach((it) => {
					if (it.PREAPPROVAL_AMOUNT == null) it.PREAPPROVAL_AMOUNT = parseFloat(0);
				});

				oReq.setProperty("/req_header_list", a);
				oReq.setProperty("/req_header_count", a.length);
				return a;
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Fetch failed:", err, { url });
				oReq.setProperty("/req_header_list", []);
				oReq.setProperty("/req_header_count", 0);
				return [];
			}
		},

        async openItemFromList(oEvent) {
            try {
                this.getView().setBusy(true);

                const oReqStatModel = this._getReqStatModel();              // your helper returning the named JSON model "request"
                const oReqModel = this._getReqModel();              // your helper returning the named JSON model "request"
                const oTable    = this.byId("tb_myrequestform");

                // Optional UI state on the same model
                oReqModel.setProperty("/view", "view");

                // 1) Try to get the context from the event's listItem (sap.m.ColumnListItem)
                let oCtx = oEvent?.getParameter?.("listItem")?.getBindingContext("request");

                // 2) Fallback: if no listItem (e.g., programmatic call), use the table's selection
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

                // For JSON model, we use getObject() (not requestObject())
                const row   = oCtx.getObject(); // e.g., the element from request>/req_header_list/2

                // Map/set the current request header into the same "request" model, under /req_header
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

                // Load items/details for this request
                this._getItemList(row.REQUEST_ID);

				if (row.STATUS == 'DRAFT') {
                	oReqModel.setProperty("/view", "list");
				}

                // Navigate to detail route/view
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RequestForm");
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

			const sReq = String(req_id);
			const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sReq);
			const isNumeric = /^\d+$/.test(sReq);
			let sLiteral;
			if (isNumeric) sLiteral = sReq;
			else if (isGuid) sLiteral = `guid'${sReq}'`;
			else sLiteral = `'${sReq.replace(/'/g, "''")}'`;

			const base       = this._entityUrl("ZREQUEST_ITEM");
			const filterExpr = `REQUEST_ID eq ${sLiteral}`;
			const orderby    = "REQUEST_SUB_ID asc";
			const query = [
				`$filter=${encodeURIComponent(filterExpr)}`,
				`$orderby=${encodeURIComponent(orderby)}`,
				`$count=true`,
				`$format=json`
			].join("&"); // IMPORTANT: use '&' (not &amp;)

			const url = `${base}?${query}`;

			try {
				const res = await fetch(url, { headers: { "Accept": "application/json" } });
				if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
				const data = await res.json();
				const a = Array.isArray(data?.value) ? data.value : [];

				// Fix numeric types if backend returns strings
				a.forEach((it) => {
					if (it.EST_AMOUNT != null) it.EST_AMOUNT = parseFloat(it.EST_AMOUNT);
					if (it.EST_NO_PARTICIPANT != null) it.EST_NO_PARTICIPANT = parseInt(it.EST_NO_PARTICIPANT, 10);
				});

				const cashadv_amt = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === "YES" ? sum + (parseFloat(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				const req_amt = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === null ? sum + (parseFloat(it.EST_AMOUNT) || 0) : sum;
				}, 0);
				
				oReq.setProperty("/req_header/cashadvamt", cashadv_amt);
				oReq.setProperty("/req_header/reqamt", req_amt);

				oReq.setProperty("/req_item_rows", a);
				oReq.setProperty("/list_count", a.length);
				return a;
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Fetch failed:", err, { url });
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}
		},
		
	});
});