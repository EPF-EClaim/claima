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

		_ensureRequestModelDefaults() {
			const oReq = this._getReqModel();
			const data = oReq.getData() || {};
			// Fill missing sections safely
			data.req_header        = data.req_header || { reqid: "", grptype: "individual" };
			data.req_item_rows     = Array.isArray(data.req_item_rows) ? data.req_item_rows : [];
			data.req_item          = data.req_item || {
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
			data.participant       = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view              = data.view || "list";
			data.list_count        = data.list_count ?? 0;
			oReq.setData(data);
		},

		_serviceRoot() {
			// Correct way to read from manifest
			const s = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri
				|| "/odata/v4/EmployeeSrv/";
			return s.replace(/\/$/, ""); // no trailing slash
		},

		_entityUrl(sEntitySet) {
			return new URL(this._serviceRoot() + "/" + sEntitySet, window.location.origin).toString();
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

		/* =========================================================
		* Footer / Navigation Buttons
		* ======================================================= */

		onBack() {
			if (!this.oBackDialog) {
				this.oBackDialog = new Dialog({
				title: "Warning",
				type: "Message",
				content: [ new Label({ text: "You haven't saved, do you confirm to go back?" }) ],
				beginButton: new Button({
					type: "Emphasized",
					text: "Confirm",
					press: function () {
						this.oBackDialog.close();
						// Navigate to dashboard (parent NavContainer)
						const oScroll = this.getView().getParent();              // ScrollContainer
						const oNav    = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer
						const aPages  = oNav?.getPages ? oNav.getPages() : oNav?.getAggregation?.("pages");
						const oMain   = aPages && aPages.find(p => p.getId && p.getId().endsWith("dashboard"));
						if (oMain) oNav.to(oMain, "slide");
					}.bind(this)
				}),
				endButton: new Button({ text: "Cancel", press: () => this.oBackDialog.close() })
				});
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

			if (!this.oDeleteDialog) {
				this.oDeleteDialog = new sap.m.Dialog({
				title: "Delete Request",
				type: "Message",
				state: "Warning",
				content: [
					new sap.m.Label({ text: "Do you want to delete this request?" })
				],
				beginButton: new sap.m.Button({
					type: "Emphasized",
					text: "Delete",
					press: async () => {
					try {
						// UX: disable delete while processing
						this.oDeleteDialog.getBeginButton().setEnabled(false);
						sap.ui.core.BusyIndicator.show(0);

						await this._updateHeaderStatusToDeleted(empId, reqId);

						sap.m.MessageToast.show("Request deleted");
						this.oDeleteDialog.close();

						// Navigate back to dashboard
						const oScroll = this.getView().getParent();
						const oNav    = oScroll && oScroll.getParent && oScroll.getParent();
						const aPages  = oNav?.getPages ? oNav.getPages() : oNav?.getAggregation?.("pages");
						const oMain   = aPages && aPages.find(p => p.getId && p.getId().endsWith("dashboard"));
						if (oMain) oNav.to(oMain, "slide");

					} catch (e) {
						sap.m.MessageToast.show(e.message || "Delete failed");
					} finally {
						sap.ui.core.BusyIndicator.hide();
						this.oDeleteDialog.getBeginButton().setEnabled(true);
					}
					}
				}),
				endButton: new sap.m.Button({
					text: "Cancel",
					press: () => this.oDeleteDialog.close()
				})
				});
				this.getView().addDependent(this.oDeleteDialog);
			}

			this.oDeleteDialog.open();
		},

		async _updateHeaderStatusToDeleted(empId, reqId) {
			const base = this._serviceRoot();
			const url  = `${base}/ZREQUEST_HEADER(EMP_ID='${encodeURIComponent(empId)}',REQUEST_ID='${encodeURIComponent(reqId)}')`;

			// Soft-delete payload: adjust fields if your backend uses different flags
			const payload = {
				STATUS: "DELETED"
			};

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

			// Update local model so the UI reflects the change immediately
			this._getReqModel().setProperty("/req_header/status", "DELETED");
		},

		async onSubmitRequest() {
			const oReq = this._getReqModel();
			const data = oReq.getData();
			const rows = oReq.getProperty("/req_item_rows") || [];

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

			let aRows = oReq.getProperty("/participant");
			if (!Array.isArray(aRows)) {
				aRows = [];
				oReq.setProperty("/participant", aRows);
			}

			oReq.setProperty(`/participant/${idx}/PARTICIPANTS_ID`, sTrim);

			// Keep exactly 1 trailing empty
			this._normalizeTrailingEmptyRow(aRows);

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

		onRowDeleteParticipant(oEvent) {
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

			// Ensure at least 1 empty row remains
			if (!Array.isArray(aRows) || aRows.length === 0) {
				aRows = [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			} else {
				this._normalizeTrailingEmptyRow(aRows);
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

				// 3) POST participants (skip empty)
				const parts = Array.isArray(data.participant) ? data.participant : [];
				const urlPart = this._entityUrl("ZREQ_ITEM_PART"); // ensure this entity is exposed
				for (const p of parts) {
					const pid = String(p.PARTICIPANTS_ID || "").trim();
					if (!pid) continue;
						const alloc = parseFloat(p.ALLOCATED_AMOUNT || 0);

						const res = await fetch(urlPart, {
							method: "POST",
							headers: { "Content-Type": "application/json", "Accept": "application/json" },
							body: JSON.stringify({
							REQUEST_ID: reqId,
							REQUEST_SUB_ID: requestSubId,
							PARTICIPANTS_ID: pid,
							ALLOCATED_AMOUNT: alloc
							})
						}
					);
					if (!res.ok) {
						const t = await res.text();
						throw new Error(`Participant save failed: ${res.status} ${t}`);
					}
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

		/* =========================================================
		* Backend: Fetch list / Number Range
		* ======================================================= */

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

		async getCurrentReqNumber(range_id) {
			const url = this._entityUrl("ZNUM_RANGE");
			try {
				const res = await fetch(url, { headers: { "Accept": "application/json" } });
				if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
				const data = await res.json();
				const row = (data.value || data || []).find(x => x.RANGE_ID === range_id);
				if (!row || row.CURRENT == null) throw new Error(`${range_id} not found or CURRENT missing`);

				const current = Number(row.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const result = `REQ${yy}${String(current).padStart(9, "0")}`;
				return { result, current };
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("Error fetching number range:", e);
				return null;
			}
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