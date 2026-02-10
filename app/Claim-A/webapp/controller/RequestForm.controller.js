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

], (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment, Spreadsheet, BusyIndicator) => {
	"use strict";

	return Controller.extend("claima.controller.RequestForm", {

			// Item Table
			const oModel = new JSONModel({
				control: [
					{ view: "list" }
				],
				/* req_item_rows : [
					{claim_type: "Testing Claim Type 01", est_amount: 10100, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 02", est_amount: 100670, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 03", est_amount: 100230, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 04", est_amount: 1000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 05", est_amount: 10300, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 06", est_amount: 1000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 07", est_amount: 15000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 08", est_amount: 1000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 09", est_amount: 500, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 10", est_amount: 10000, currency_code: "MYR", est_no_of_participant: 10}
				], */
				participant: [
					{
						participant_name: "",
						emp_cost_center: "",
						alloc_amount: ""
					}
				]

			});
			oModel.setSizeLimit(50);
			this.getView().setModel(oModel);

			// Item Table Count
			const oVM = new sap.ui.model.json.JSONModel({
				visibleCount: 0, // number of rows currently shown (respects filters)
				totalCount: 0,   // total items in the underlying array (no filters)
				selectedCount: 0 // selected row count (if you use selection)
			});
			this.getView().setModel(oVM, "view");

		},

			// Fragment cache
			this._fragments = Object.create(null);

			// Ensure model defaults exist (OPTION 1 structure)
			this._ensureRequestModelDefaults();

			// Show default header + list fragments
			await this._showHeaderAndList();
		},

		/* =========================================================
		* Helpers: Model & Service
		* ======================================================= */

		_getReqModel() {
			return this.getOwnerComponent().getModel("request");
		},

		_showFormFragment: function () {
			var oPage = this.byId("request_form");

			oPage.removeAllContent();
			this._getFormFragment("req_header").then(function (oVBox) {
				oPage.insertContent(oVBox, 0);
			});
			this._getFormFragment("req_item_list_v").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
		},

		// ==================================================
		// Footer Button logic

		onBack: function () {
			if (!this.oBackDialog) {
				this.oBackDialog = new Dialog({
					title: "Warning",
					type: "Message",
					content: [
						new Label({
							text: "You haven't save, do you confirm to go back?",
							labelFor: "rejectionNote"
						})
					],
					beginButton: new Button({
						type: "Emphasized",
						text: "Confirm",
						press: function () {
							this.oBackDialog.close();
							// nav to dashboard
							var oScroll = this.getView().getParent();          // ScrollContainer
							var oMaybeNav = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer

							var aPages = oMaybeNav.getPages ? oMaybeNav.getPages() : oMaybeNav.getAggregation("pages");
							var oMainPage = aPages && aPages.find(function (p) {
								return p.getId && p.getId().endsWith("dashboard");
							});

							if (oMainPage) {
								oMaybeNav.to(oMainPage, "slide");
							}


						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oBackDialog.close();
						}.bind(this)
					})
				});
			}

		_serviceRoot() {
			// Correct way to read from manifest
			const s = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri
				|| "/odata/v4/EmployeeSrv/";
			return s.replace(/\/$/, ""); // no trailing slash
		},

		onSaveRequestDraft: function () {
			MessageToast.show("save draft")
			// write database
			var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
			var sServiceUrl = sBaseUri + "/ZREQUEST_TYPE";

			fetch(sServiceUrl,
				{
					method: "POST", headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						REQUEST_TYPE_ID: "RT0006",
						REQUEST_TYPE_DESC: "Testing Create Data",
						END_DATE: "9999-12-31",
						START_DATE: "2026-01-01",
						STATUS: "INACTIVE"
					})
				})
				.then(r => r.json());
			// .then(console.log);
		},

		/* =========================================================
		* Helpers: Fragment Management
		* ======================================================= */

		async _getFormFragment(sName) {
			const oView = this.getView();
			if (!this._fragments[sName]) {
				this._fragments[sName] = Fragment.load({
				id: oView.getId(),                // stable IDs
				name: "claima.fragment." + sName, // e.g., "req_header", "req_item_list", "req_create_item"
				type: "XML",
				controller: this
				}).then((oFrag) => {
				oView.addDependent(oFrag);        // inherit models & i18n
				return oFrag;
				});
			}
			return this._fragments[sName];
		},

		async _replaceContentAt(oPage, iIndex, oControl) {
			// Ensure the slot exists
			const iSafe = Math.min(iIndex, oPage.getContent().length);
			oPage.insertContent(oControl, iSafe);
		},

		async _removeByLocalId(sLocalId) {
			const ctrl = this.byId(sLocalId);
			if (!ctrl) return;
			const parent = ctrl.getParent && ctrl.getParent();
			if (parent?.removeContent) parent.removeContent(ctrl);
			else if (parent?.removeItem) parent.removeItem(ctrl);
			// ctrl.destroy();
		},

		async _showHeaderAndList() {
			const oPage = this.byId("request_form"); // <Page id="request_form"/>
			if (!oPage) return;

			// Remove any open "create item" fragment to enforce list mode
			await this._removeByLocalId("request_create_item_fragment");

			const oHeader = await this._getFormFragment("req_header");
			const oList   = await this._getFormFragment("req_item_list");

			oPage.removeAllContent();
			await this._replaceContentAt(oPage, 0, oHeader);
			await this._replaceContentAt(oPage, 1, oList);

			// Mark view state
			this._getReqModel().setProperty("/view", "list");
		},

		async _showItemCreate() {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			// Remove list fragment so only create is visible
			await this._removeByLocalId("request_item_list_fragment");

			const oCreate = await this._getFormFragment("req_create_item");
			await this._replaceContentAt(oPage, 1, oCreate);

			// Mark view state
			this._getReqModel().setProperty("/view", "create");
		},

		async _showItemList() {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			// Remove list fragment so only create is visible
			await this._removeByLocalId("request_create_item_fragment");

			const oCreate = await this._getFormFragment("req_item_list");
			await this._replaceContentAt(oPage, 1, oCreate);

			// Mark view state
			this._getReqModel().setProperty("/view", "list");
		},

		onDeleteSelectedReqItem: function () {
			this.onRowDelete({ getSource: function () { return null; } });
		},

		onCancel: async function () {

			const oPage = this.byId("request_form");

			// 2) Remove the existing list fragment if present
			//    Make sure the root control inside the fragment has id="--request_item_list_fragment"
			const oListRoot = this.byId("request_create_item_fragment");
			if (oListRoot) {
				// Remove from its immediate parent aggregation
				const oParent = oListRoot.getParent();
				if (oParent && typeof oParent.removeContent === "function") {
					oParent.removeContent(oListRoot);
				} else if (oParent && typeof oParent.removeItem === "function") {
					oParent.removeItem(oListRoot);
				}
				oListRoot.destroy(); // free resources
			}
			this.oBackDialog.open();
		},

		onDeleteRequest() {
			const oReq   = this._getReqModel();
			const empId  = String(oReq.getProperty("/req_header/empid") || "").trim();
			const reqId  = String(oReq.getProperty("/req_header/reqid") || "").trim();

			if (!empId || !reqId) {
				sap.m.MessageToast.show("EMP ID or Request ID missing");
				return;
			}

			const oModel = this.getView().getModel();
			oModel.setProperty("/control/view", 'list');
		},

		onSave: function () {

			const oModel = this.getView().getModel(); // JSONModel
			const aRows = oModel.getProperty("/req_item_rows") || [];

			const res = await fetch(url, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
					"If-Match": "*"                // avoid ETag / concurrency issues
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const txt = await res.text().catch(() => "");
				throw new Error(`Delete failed: ${res.status} ${txt}`);
			}

			this.onCancel();
		},

		onSaveAddAnother: function () {
			this.onSave();
		},

		// ==================================================
		// Count Request Item

			// check req_item_rows if it is empty
			if (!rows.length) {
				this._showMustAddClaimDialog();
				return;   
			}

			const reqId = String(data.req_header.reqid || "").trim();
			const empId = sap.ushell.Container.getUser().getId();

			if (!reqId || !empId) {
				sap.m.MessageToast.show("EMP ID or Request ID missing");
				return;
			}

			try {
				sap.ui.core.BusyIndicator.show(0);

				// Build composite key URL for PATCH:
				// Example: /ZREQUEST_HEADER(EMP_ID='E12345',REQUEST_ID='REQ26000000339')
				const base = this._serviceRoot();
				const entityUrl = `${base}/ZREQUEST_HEADER(EMP_ID='${encodeURIComponent(empId)}',REQUEST_ID='${encodeURIComponent(reqId)}')`;

				// PATCH payload
				const payload = {
					STATUS: "SUBMITTED",
				};

				const res = await fetch(entityUrl, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"If-Match": "*" // important for OData v4
					},
					body: JSON.stringify(payload)
				});

				if (!res.ok) {
					const t = await res.text().catch(() => "");
					throw new Error(`Update failed: ${res.status} ${t}`);
				}

				sap.m.MessageToast.show("Request submitted successfully");

				// Optional: update local model
				oReq.setProperty("/req_header/status", "SUBMITTED");

			} catch (e) {
				sap.m.MessageToast.show(e.message || "Submission failed");
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}
		},

		_showMustAddClaimDialog() {
			if (!this._oAddClaimDialog) {
				this._oAddClaimDialog = new sap.m.Dialog({
					title: "Missing Claim Item",
					type: "Message",
					state: "Warning",
					content: [
						new sap.m.Label({
							text: "Please add at least one claim item before submitting.",
						})
					],
					beginButton: new sap.m.Button({
						text: "OK",
						press: () => {
							this._oAddClaimDialog.close();
						}
					})
				});
				this.getView().addDependent(this._oAddClaimDialog);
			}
			this._oAddClaimDialog.open();
		},

		/* =========================================================
		* Header & Item List Area
		* ======================================================= */

		async onAddItem() {
			await this._showItemCreate();

			// Reset current item + participants
			const oReq = this._getReqModel();
			const data = oReq.getData();
			data.req_item = {
				claim_type: "CT1",
				claim_type_item: "CTI1",
				est_amount: "",
				est_no_participant: "",
				cash_advance: "no_cashadv",
				start_date: "",
				end_date: "",
				location: "",
				remarks: ""
			};
			data.participant = [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view = "create";
			oReq.setData(data);
		},

		async navToItemDetail() {
			// From list → open create/edit screen
			await this._showItemCreate();

			// If not explicitly set, default to 'create'
			const oReq = this._getReqModel();
			if (oReq.getProperty("/view") !== "view") {
				oReq.setProperty("/view", "create");
			}
		},

		// Back from create to list (cancel)
		async onBackView() {
			await this._showHeaderAndList();
		},

		// Cancel alias (keep one implementation)
		async onCancel() {
			await this._showHeaderAndList();

			// When coming back to list, optionally add the just-entered item (if needed)
			// Here we push a new row **only if** you want to keep the behavior.
			// Comment this block if you don't want an auto-append on cancel.
			const oReq = this._getReqModel();
			const data = oReq.getData();
			const rows = Array.isArray(data.req_item_rows) ? data.req_item_rows : [];

			if (data.req_item?.claim_type || data.req_item?.est_amount) {
				rows.push({
				CLAIM_TYPE_ID: data.req_item.claim_type,
				CLAIM_TYPE_ITEM_ID: data.req_item.claim_type_item,
				EST_AMOUNT: parseFloat(data.req_item.est_amount || 0),
				EST_NO_PARTICIPANT: parseInt(data.req_item.est_no_participant || 1, 10)
				});
				oReq.setProperty("/req_item_rows", rows);
				oReq.setProperty("/list_count", rows.length);
			}
		},

		/* =========================================================
		* Item List: Delete Row(s)
		* ======================================================= */

		onRowDeleteReqItem(oEvent) {
			const oTable = this.byId("req_item_table");             // sap.ui.table.Table
			const oReq   = this._getReqModel();
			const aRows  = oReq.getProperty("/req_item_rows") || [];

			// RowAction press gives row/rowIndex
			let iFromAction = null;
			const oRow      = oEvent.getParameter && oEvent.getParameter("row");
			const iRowIdx   = oEvent.getParameter && oEvent.getParameter("rowIndex");

			if (oRow) {
				const oCtx = oRow.getBindingContext("request");
				if (oCtx) {
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				if (Number.isInteger(i)) iFromAction = i;
				}
			} else if (Number.isInteger(iRowIdx)) {
				const oCtx = oTable.getContextByIndex(iRowIdx);
				if (oCtx) {
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				if (Number.isInteger(i)) iFromAction = i;
				}
			}

			let aToDelete = [];
			const aSelected = oTable.getSelectedIndices() || [];
			if (aSelected.length > 0) {
				aToDelete = aSelected.map((vis) => {
				const oCtx = oTable.getContextByIndex(vis);
				if (!oCtx) return null;
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				return Number.isInteger(i) ? i : null;
				}).filter(x => x !== null);
			} else if (Number.isInteger(iFromAction)) {
				aToDelete = [iFromAction];
			}

			if (aToDelete.length === 0) {
				MessageToast.show("Select row to delete");
				return;
			}

			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);
			aToDelete.forEach((i) => {
				if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
			});

			oReq.setProperty("/req_item_rows", aRows);
			oReq.setProperty("/list_count", aRows.length);
			oTable.clearSelection();
		},

		/* =========================================================
		* Participant list: auto-append last empty row + delete
		* ======================================================= */

		appendNewRow(oEvent) {
			const oReq = this._getReqModel();
			if (oReq.getProperty("/req_header/grptype") !== "group") return;

			const src  = oEvent.getSource();
			const sVal = (oEvent.getParameter && oEvent.getParameter("value"))
				?? (src?.getValue?.() ?? "");
			const sTrim = String(sVal).trim();

			const oCtx = src.getBindingContext("request");
			if (!oCtx) return;

			const path = oCtx.getPath(); // "/participant/<index>"
			const segs = path.split("/");
			const idx  = parseInt(segs[segs.length - 1], 10);
			if (!Number.isInteger(idx)) return;

		onExit: function () {
			const oTable = this.byId && this.byId("req_item_table");
			if (oTable && this._countsAttached) {
				const oBinding = oTable.getBinding("rows");
				if (oBinding) {
					oBinding.detachEvent("change", this._updateTableCounts, this);
					oBinding.detachEvent("dataReceived", this._updateTableCounts, this);
					oBinding.detachEvent("refresh", this._updateTableCounts, this);
				}
				oTable.detachRowSelectionChange(this._updateSelectedCount, this);
			}
			this._countsAttached = false;
		},

		// ==================================================
		//  Append new row for participant list

		appendNewRow: function (oEvent) {
			const sVal = (oEvent.getParameter("value") || "").trim();
			const oCtx = oEvent.getSource().getBindingContext();
			if (!oCtx) { return; }

			const sPath = oCtx.getPath();
			const iIndex = parseInt(sPath.split("/").pop(), 10);

			const oModel = oCtx.getModel();
			const aRows = oModel.getProperty("/participant") || [];

			const aHeader = oCtx.getModel("request");
			const aGrpType = aHeader.getProperty("/grptype");

			if (aRows[iIndex]) {
				aRows[iIndex].participant_name = sVal;
			}

			oReq.setProperty(`/participant/${idx}/PARTICIPANTS_ID`, sTrim);

			const bIsLast = iIndex === aRows.length - 1;
			if (bIsLast && sVal) {
				aRows.push({
					req_item_row: 0,
					participant_name: "",
					emp_cost_center: "",
					alloc_amount: ""
				});
			}

			const isLast = idx === aRows.length - 1;
			if (isLast && sTrim) {
				oReq.setProperty(`/participant/${aRows.length}`, { PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
			}
		},

		_normalizeTrailingEmptyRow(aRows) {
			const oReq = this._getReqModel();
			let lastNonEmpty = -1;
			for (let i = 0; i < aRows.length; i++) {
				const r = aRows[i] || {};
				const isEmpty = !String(r.PARTICIPANTS_ID || "").trim() && !String(r.ALLOCATED_AMOUNT || "").trim();
				if (!isEmpty) lastNonEmpty = i;
			}
			const desiredLength = Math.max(lastNonEmpty + 2, 1); // keep one trailing empty
			if (aRows.length > desiredLength) {
				aRows.splice(desiredLength);
				oReq.setProperty("/participant", aRows.slice()); // new ref
			} else if (aRows.length === 0) {
				aRows.push({ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
				oReq.setProperty("/participant", aRows);
			}
		},

		_normalizeTrailingEmptyRow: function (aRows) {
			// Remove extra trailing empties if any
			while (aRows.length > 1 && this._isEmptyRow(aRows[aRows.length - 1]) && this._isEmptyRow(aRows[aRows.length - 2])) {
				aRows.pop();
			}
			// If list became empty (shouldn't happen), ensure at least one blank row
			if (aRows.length === 0) {
				aRows.push({ req_item_row: 0, participant_name: "", emp_cost_center: "", alloc_amount: "" });
			}
		},

		_isEmptyRow: function (oRow) {
			if (!oRow) return true;
			const nameEmpty = !oRow.participant_name || String(oRow.participant_name).trim() === "";
			const costEmpty = !oRow.emp_cost_center || String(oRow.emp_cost_center).trim() === "";
			const allocEmpty = !oRow.alloc_amount || String(oRow.alloc_amount).trim() === "";
			return nameEmpty && costEmpty && allocEmpty;
		},

		// ==================================================
		// Delete Participant Row Logic

		onRowDeleteParticipant: function (oEvent) {
			const oTable = this.byId("req_participant_table");
			const oReq   = this._getReqModel();
			let aRows    = oReq.getProperty("/participant") || [];

			let idxFromAction = null;
			const oRow    = oEvent.getParameter && oEvent.getParameter("row");
			const visIdx  = oEvent.getParameter && oEvent.getParameter("rowIndex");

			if (oRow) {
				const oCtx = oRow.getBindingContext("request");
				if (oCtx) {
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				if (Number.isInteger(i)) idxFromAction = i;
				}
			} else if (Number.isInteger(visIdx)) {
				const oCtx = oTable.getContextByIndex(visIdx);
				if (oCtx) {
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				if (Number.isInteger(i)) idxFromAction = i;
				}
			}

			let aToDelete = [];
			const aSel = oTable.getSelectedIndices() || [];
			if (aSel.length > 0) {
				aToDelete = aSel.map((v) => {
				const oCtx = oTable.getContextByIndex(v);
				if (!oCtx) return null;
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				return Number.isInteger(i) ? i : null;
				}).filter(x => x !== null);
			} else if (Number.isInteger(idxFromAction)) {
				aToDelete = [idxFromAction];
			}

			if (aToDelete.length === 0) {
				MessageToast.show("Select row to delete");
				return;
			}

			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);
			aToDelete.forEach((i) => { if (i >= 0 && i < aRows.length) aRows.splice(i, 1); });

			aModelIdxToDelete.forEach(function (iIdx) {
				if (iIdx >= 0 && iIdx < aRows.length) {
					aRows.splice(iIdx, 1);
				}
			});

			// Optional: keep one empty row to support your auto-append UX
			if (aRows.length === 0) {
				aRows.push({
					participant_name: "",
					emp_cost_center: "",
					alloc_amount: ""
				});
			}

			oReq.setProperty("/participant", aRows);
			oTable.clearSelection();
		},

		/* =========================================================
		* Save Draft / Save Item / Save+Another
		* ======================================================= */

		async onSaveRequestDraft() {
			MessageToast.show("save draft");
			const url = this._entityUrl("ZREQUEST_TYPE");
			const payload = {
				REQUEST_TYPE_ID: "RT0006",
				REQUEST_TYPE_DESC: "Testing Create Data",
				END_DATE: "9999-12-31",
				START_DATE: "2026-01-01",
				STATUS: "INACTIVE"
			};

			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", "Accept": "application/json" },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const t = await res.text();
				MessageToast.show(`Draft failed: ${res.status} ${t}`);
				return;
			}
			MessageToast.show("Draft saved");
		},

		onSaveItem() {
			this.onSave();
		},

		async onSaveAddAnother() {
			const oReq = this._getReqModel();
			await this.onSave(); // saves current
			// Re-open create form fresh
			await this._showItemCreate();

			// Reset create buffers
			const data = oReq.getData();
			data.req_item = {
				claim_type: "CT1",
				claim_type_item: "CTI1",
				est_amount: "",
				est_no_participant: "",
				cash_advance: "no_cashadv",
				start_date: "",
				end_date: "",
				location: "",
				remarks: ""
			};
			data.participant = [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view = "create";
			oReq.setData(data);
		},

		async onSave() {
			// Validate & save to backend
			const oReq      = this._getReqModel();
			const data      = oReq.getData();
			const reqId     = String(data.req_header.reqid || "").trim();
			const claimType = data.req_item.claim_type;
			const claimItem = data.req_item.claim_type_item;
			const estAmt    = parseFloat(data.req_item.est_amount || 0);
			const estNoPart = parseInt(data.req_item.est_no_participant || 1, 10);

			if (!reqId) { MessageToast.show("Missing Request ID"); return; }
			if (!claimType || !claimItem) { MessageToast.show("Select claim type/item"); return; }

			BusyIndicator.show(0);

			try {
				// 1) Get number range
				const nr = await this.getCurrentReqNumber("NR03");
				if (!nr) throw new Error("Number range not available");
				const requestSubId = String(nr.result);

				// 2) POST to ZREQUEST_ITEM
				const urlItem = this._entityUrl("ZREQUEST_ITEM");
				const payloadItem = {
					REQUEST_ID: reqId,
					REQUEST_SUB_ID: requestSubId,
					CLAIM_TYPE_ID: claimType,
					CLAIM_TYPE_ITEM_ID: claimItem,
					EST_AMOUNT: estAmt,
					EST_NO_PARTICIPANT: estNoPart
				};

				const resItem = await fetch(urlItem, {
					method: "POST",
					headers: { "Content-Type": "application/json", "Accept": "application/json" },
					body: JSON.stringify(payloadItem)
				});
				if (!resItem.ok) {
					const e = await resItem.text();
					throw new Error(`Item save failed: ${resItem.status} ${e}`);
				}


				// Refresh the correct table binding (sap.ui.table.Table uses "rows")
				const oTable = this.byId("req_item_table2");
				if (oTable && oTable.getBinding && oTable.getBinding("rows")) {
					oTable.getBinding("rows").refresh();
				}


				// If your table is already rendered and has listeners attached:
				if (typeof this._updateTableCounts === "function") {
					this._updateTableCounts();
				}

				// 4) Update number range
				await this.updateCurrentReqNumber("NR03", nr.current);

				// 5) Refresh list view (pull latest from backend)
				await this._getItemList(reqId);

				// 6) Back to list view
				await this._showItemList();

				MessageToast.show("Saved Successfully");
			} catch (e) {
				MessageToast.show(e.message || "Save failed");
			} finally {
				BusyIndicator.hide();
			}
		},

		_fetchReqItemsByReqId: async function (sReqId) {
			// Get your V4 OData model (inherited from Component or View)
			const oModel =
				this.getView().getModel("employee") ||
				this.getOwnerComponent().getModel("employee");
			if (!oModel) {
				throw new Error("OData model 'employee' not found.");
			}


			// Build V4 filter properly (use Filter argument, not $filter in mParameters)
			const Filter = sap.ui.model.Filter;
			const FilterOperator = sap.ui.model.FilterOperator;
			const aFilters = [new Filter("REQUEST_ID", FilterOperator.EQ, sReqId)];

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

			// Adjust entity set and $select fields to your service metadata if needed
			const oListBinding = oModel.bindList("/ZREQUEST_ITEM", null, null, aFilters, {
				$select: "REQUEST_ID,CLAIM_TYPE_ID,CLAIM_TYPE_ITEM_ID,EST_NO_PARTICIPANT,EST_AMOUNT",
				$orderby: "REQUEST_ID,CLAIM_TYPE_ITEM_ID"
			});

			const aCtx = await oListBinding.requestContexts(0, Infinity);
			const aEntities = await Promise.all(aCtx.map((c) => c.requestObject()));

			return aEntities.map((e) => ({
				request_id: e.REQUEST_ID || "",
				claim_type: e.CLAIM_TYPE_ID || "",
				claim_type_item: e.CLAIM_TYPE_ITEM_ID || "",
				est_amount: Number(e.EST_AMOUNT) || "",
				//curenncy_code: "MYR",
				est_no_of_participant: e.EST_NO_PARTICIPANT || "",
			}));
		},

		async updateCurrentReqNumber(nr, currentNumber) {
			const id  = encodeURIComponent(nr);
			const url = this._entityUrl(`ZNUM_RANGE('${id}')`);
			const nextNumber = currentNumber + 1;

			try {
				const res = await fetch(url, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"If-Match": "*" // avoid ETag issues
				},
				body: JSON.stringify({ CURRENT: String(nextNumber) })
				});

				if (!res.ok) {
				const t = await res.text().catch(() => "");
				throw new Error(`PATCH failed ${res.status} ${res.statusText}: ${t}`);
				}
				if (res.status === 204) return { CURRENT: nextNumber };

				const ct = res.headers.get("content-type") || "";
				return ct.includes("application/json") ? await res.json() : await res.text();
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("Error updating number range:", e);
				return null;
			}
		}

	});
});