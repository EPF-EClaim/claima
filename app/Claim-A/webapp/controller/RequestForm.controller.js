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
				claim_type_item_id: "CTI1",
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

		async _showItemCreate(state) {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			// Remove list fragment so only create is visible
			await this._removeByLocalId("request_item_list_fragment");

			const oCreate = await this._getFormFragment("req_create_item");
			await this._replaceContentAt(oPage, 1, oCreate);

			// Mark view state
			this._getReqModel().setProperty("/view", state);
		},

		async _showItemList(state) {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			// Remove list fragment so only create is visible
			await this._removeByLocalId("request_create_item_fragment");

			const oCreate = await this._getFormFragment("req_item_list");
			await this._replaceContentAt(oPage, 1, oCreate);

			// Mark view state
			this._getReqModel().setProperty("/view", state);
		},

		/* =========================================================
		* Footer / Navigation Buttons
		* ======================================================= */

		onBack() {
			if (!this.oBackDialog) {
				this.oBackDialog = new Dialog({
				title: "Warning",
				type: "Message",
				state: "Warning",
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
			const empId  = this._userId;
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
			const empId = this._userId;

			if (!reqId || !empId) {
				sap.m.MessageToast.show("EMP ID or Request ID missing");
				return;
			}

			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new sap.m.Dialog({
				title: "Submit Request",
				type: "Message",
				content: [
					new sap.m.Label({ text: "Confirm to submit Request?" })
				],
				beginButton: new sap.m.Button({
					type: "Emphasized",
					text: "Submit",
					press: async () => {
					try {
						sap.ui.core.BusyIndicator.show(0);

						// Build composite key URL for PATCH:
						// Example: /ZREQUEST_HEADER(EMP_ID='E12345',REQUEST_ID='REQ26000000339')
						const base = this._serviceRoot();
						const entityUrl = `${base}/ZREQUEST_HEADER(EMP_ID='${encodeURIComponent(empId)}',REQUEST_ID='${encodeURIComponent(reqId)}')`;

						// PATCH payload
						const payload = {
							STATUS: "PENDING APPROVAL",
							CASH_ADVANCE: parseFloat(data.req_header.cashadvamt),
							REQUEST_AMOUNT: parseFloat(data.req_header.reqamt)
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

						const oScroll = this.getView().getParent();              // ScrollContainer
						const oNav    = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer
						const aPages  = oNav?.getPages ? oNav.getPages() : oNav?.getAggregation?.("pages");
						const oMain   = aPages && aPages.find(p => p.getId && p.getId().endsWith("myrequest"));
						if (oMain) oNav.to(oMain, "slide");

					} catch (e) {
						sap.m.MessageToast.show(e.message || "Submission failed");
					} finally {
						sap.ui.core.BusyIndicator.hide();
						this.oSubmitDialog.close()
					}
					}
					
				}),
				endButton: new sap.m.Button({
					text: "Cancel",
					press: () => this.oSubmitDialog.close()
				})
				});
				this.getView().addDependent(this.oSubmitDialog);
			}

			this.oSubmitDialog.open();

			
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

		async onAddItem(oEvent) {
			await this._showItemCreate("create");

			const oReq = this._getReqModel();
			const data = oReq.getData();

			data.req_item = {
				claim_type: "CT1",
				claim_type_item_id: "CTI1",
				est_amount: "",
				est_no_participant: "",
				cash_advance: "no_cashadv",
				start_date: "",
				end_date: "",
				location: "",
				remarks: ""
			};
			

			if (data.req_header.grptype === 'individual') {
				const emp_data = await this._getEmpIdDetail(this._userId);
				// Use the returned data to populate the fields
				data.participant = [{ 
					PARTICIPANTS_ID: this._userId, 
					PARTICIPANT_NAME: emp_data ? emp_data.name : "", 
					PARTICIPANT_COST_CENTER: emp_data ? emp_data.cc : "", 
					ALLOCATED_AMOUNT: "" 
				}];
			} else {
				data.participant = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
			}
			
			data.view = "create";
			oReq.setData(data);
		},

		async _getEmpIdDetail(sEEID) {
			const oModel = this.getView().getModel(); 
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
				new sap.ui.model.Filter("EEID", "EQ", sEEID)
			]);

			try {
				// FIX: You MUST await the requestContexts call
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return { 
						name: oData.NAME, 
						cc: oData.CC 
					};
				} else {
					console.warn("No employee found with ID: " + sEEID);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; // Return null so the app doesn't crash
			}
		},

		// Convenience wrappers
		onOpenItemView (oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ false);
		},
		
		onOpenItemEdit (oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ true);
		},
		
		async _openItemFromList (oEvent, bEdit) {
			const oReq   = this._getReqModel();           // your named JSONModel "request"
			const oTable = this.byId("req_item_table");

			// 1) Determine the selected row context (row action, rowIndex, or first selected)
			let oCtx = null;
			const oRow    = oEvent?.getParameter?.("row");
			const iRowIdx = oEvent?.getParameter?.("rowIndex");

			if (oRow) {
				oCtx = oRow.getBindingContext("request");
			} else if (Number.isInteger(iRowIdx)) {
				oCtx = oTable.getContextByIndex(iRowIdx);
			} else {
				const aSel = oTable.getSelectedIndices();
				if (aSel?.length) {
				oCtx = oTable.getContextByIndex(aSel[0]);
				}
			}

			if (!oCtx) {
				sap.m.MessageToast.show("Select an item to open");
				return;
			}

			// 2) Read the row object from the JSON model
			const row = oCtx.getObject();   // {REQUEST_ID, REQUEST_SUB_ID, CLAIM_TYPE_ID, ...}
			const reqId = String(row.REQUEST_ID || oReq.getProperty("/req_header/reqid") || "").trim();
			const subId = String(row.REQUEST_SUB_ID || "").trim();

			// 3) Map list row → /req_item (matching your fragment bindings)
			//    NOTE: claim_type_item_id is what your fragment binds to.
			oReq.setProperty("/req_header/reqid", reqId); // keep header in sync
			oReq.setProperty("/req_item", {
				req_subid            : subId,
				claim_type           : row.CLAIM_TYPE_ID || "",
				claim_type_item_id 	 : row.CLAIM_TYPE_ITEM_ID || "",  // <- fragment binding expects this name
				est_amount           : row.EST_AMOUNT ?? "",
				est_no_participant   : row.EST_NO_PARTICIPANT ?? "",
				start_date           : row.START_DATE || "",
				end_date             : row.END_DATE || "",
				location             : row.LOCATION || "",
				cash_advance         : row.CASH_ADVANCE || "no_cashadv",
				remark               : row.REMARK || ""
			});

			// 4) Set read-only (view) vs editable (create) mode per your fragment's logic
			oReq.setProperty("/view", bEdit ? "i_edit" : "view");

			// 5) Swap the fragment into the page (reuse your existing helper)
			await this._showItemCreate(oReq.getProperty("/view"));   // shows claima.fragment.req_create_item in the "details" slot

			// 6) Load participants for the selected item from backend
			await this._loadParticipantsForItem(reqId, subId);
		},

		/**
		 * Loads participants for (REQUEST_ID, REQUEST_SUB_ID) into request>/participant
		 */
		async _loadParticipantsForItem (reqId, subId) {
			const oReq = this._getReqModel();

			// Default: one empty row (for local add)
			const setEmpty = () => oReq.setProperty("/participant", [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }]);

			if (!reqId || !subId) {
				setEmpty();
				return;
			}

			try {
				// const base = this._entityUrl("ZEMP_REQUEST_PART_VIEW", "eclaimViewService");
				const base = this._entityUrl("ZREQ_ITEM_PART");
				const filter = encodeURIComponent(
					`REQUEST_ID eq '${String(reqId).replace(/'/g, "''")}' and REQUEST_SUB_ID eq '${String(subId).replace(/'/g, "''")}'`
				);
				const orderby = encodeURIComponent("PARTICIPANTS_ID asc");
				const url = `${base}?$filter=${filter}&$orderby=${orderby}&$format=json`;

				const res = await fetch(url, { headers: { "Accept": "application/json" } });
				if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

				const data = await res.json();
				const parts = Array.isArray(data.value) ? data.value : [];

				const aMapped = parts.map(p => ({
					PARTICIPANTS_ID : p.PARTICIPANTS_ID || "",
					PARTICIPANT_NAME : p.NAME || "",
					PARTICIPANT_COST_CENTER : p.CC || "",
					ALLOCATED_AMOUNT: p.ALLOCATED_AMOUNT ?? ""
				}));

				oReq.setProperty("/participant", aMapped.length ? aMapped : [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }]);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("Load participants failed:", e);
				setEmpty();
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
					CLAIM_TYPE_ITEM_ID: data.req_item._id,
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

		async onRowDeleteReqItem(oEvent) {
			const oTable = this.byId("req_item_table"); // sap.ui.table.Table
			const oReq   = this._getReqModel();
			const aRows  = oReq.getProperty("/req_item_rows") || [];

			// Determine which indices to delete (selection or row action)
			let iFromAction = null;
			const oRow    = oEvent.getParameter && oEvent.getParameter("row");
			const iRowIdx = oEvent.getParameter && oEvent.getParameter("rowIndex");

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
				}).filter((x) => x !== null);
			} else if (Number.isInteger(iFromAction)) {
				aToDelete = [iFromAction];
			}

			if (aToDelete.length === 0) {
				sap.m.MessageToast.show("Select row to delete");
				return;
			}

			// Remove duplicates, sort desc so splices don't shift indices
			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);

			// === Backend delete first ===
			sap.ui.core.BusyIndicator.show(0);
			const successIdx = [];
			let errorMsg = "";

			try {
				for (const i of aToDelete) {
				if (i < 0 || i >= aRows.length) continue;
				const row = aRows[i] || {};
				const reqId = String(row.REQUEST_ID || "").trim();
				const subId = String(row.REQUEST_SUB_ID || "").trim();

				if (!reqId || !subId) {
					errorMsg = "Missing REQUEST_ID or REQUEST_SUB_ID in row.";
					continue;
				}

				try {
					await this._deleteItemCascade(reqId, subId);
					successIdx.push(i);
				} catch (e) {
					// Collect errors but keep processing other rows
					errorMsg = e.message || "Delete failed for one or more rows.";
				}
				}
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}

			// === Update local model only for successful deletes ===
			if (successIdx.length > 0) {
				successIdx.sort((a, b) => b - a).forEach((i) => {
				if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
				});
				oReq.setProperty("/req_item_rows", aRows);
				oReq.setProperty("/list_count", aRows.length);
				sap.m.MessageToast.show(`Deleted ${successIdx.length} item(s)`);
			}

			if (errorMsg) {
				sap.m.MessageToast.show(errorMsg);
			}

			const toNumber = (v) => {
				if (v === null || v === undefined || v === "") return 0;
				const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
				return Number.isFinite(n) ? n : 0;
			};
			
			const total = (oReq.getProperty("/req_item_rows") || []).reduce((acc, row) => {
				const amt = row?.EST_AMOUNT ?? row?.est_amount ?? row?.EST_AMT ?? 0;
				return acc + toNumber(amt);
			}, 0);
			
			const round2 = (n) => Math.round(n * 100) / 100;

			
			const oHeader = oReq.getProperty("/req_header") || {};
			if (!oReq.getProperty("/req_header")) {
				oReq.setProperty("/req_header", oHeader);
			}
			oReq.setProperty("/req_header/reqamt", round2(total));


			oTable.clearSelection();
		},

		/**
		 * Deletes all ZREQ_ITEM_PART entries for (REQUEST_ID, REQUEST_SUB_ID)
		 * then deletes the ZREQUEST_ITEM row for the same key.
		 * Accepts 404 as "already gone".
		 */
		async _deleteItemCascade(requestId, requestSubId) {
			const base     = this._serviceRoot();
			const partSet  = "ZREQ_ITEM_PART";
			const itemSet  = "ZREQUEST_ITEM";

			// 1) Fetch participants for this item (so we can delete each by key)
			const reqIdLit  = requestId.replace(/'/g, "''");     // escape for OData literal
			const subIdLit  = requestSubId.replace(/'/g, "''");  // escape for OData literal
			const filter    = encodeURIComponent(`REQUEST_ID eq '${reqIdLit}' and REQUEST_SUB_ID eq '${subIdLit}'`);
			const selUrl    = `${base}/${partSet}?$select=PARTICIPANTS_ID&$filter=${filter}&$format=json`;

			const resp = await fetch(selUrl, { headers: { "Accept": "application/json" } });
			if (!resp.ok && resp.status !== 404) {
				const t = await resp.text().catch(() => "");
				throw new Error(`Load participants failed: ${resp.status} ${t}`);
			}

			const data = resp.ok ? await resp.json() : { value: [] };
			const parts = Array.isArray(data?.value) ? data.value : [];

			// 2) Delete participants
			for (const p of parts) {
				const pid = String(p.PARTICIPANTS_ID ?? "");
				// Compose key predicate (encode values; keep quotes)
				const delPartUrl = `${base}/${partSet}(REQUEST_ID='${encodeURIComponent(requestId)}',REQUEST_SUB_ID='${encodeURIComponent(requestSubId)}',PARTICIPANTS_ID='${encodeURIComponent(pid)}')`;

				const delP = await fetch(delPartUrl, {
				method: "DELETE",
				headers: { "If-Match": "*" } // avoid ETag issues
				});

				if (!delP.ok && delP.status !== 404) {
				const t = await delP.text().catch(() => "");
				throw new Error(`Delete participant failed: ${delP.status} ${t}`);
				}
			}

			// 3) Delete the item
			const delItemUrl = `${base}/${itemSet}(REQUEST_ID='${encodeURIComponent(requestId)}',REQUEST_SUB_ID='${encodeURIComponent(requestSubId)}')`;
			const delI = await fetch(delItemUrl, { method: "DELETE", headers: { "If-Match": "*" } });
			if (!delI.ok && delI.status !== 404) {
				const t = await delI.text().catch(() => "");
				throw new Error(`Delete item failed: ${delI.status} ${t}`);
			}

			return true;
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

		// Replace your handler with this version
		async onRowDeleteParticipant(oEvent) {
			const oTable = this.byId("req_participant_table");
			const oReq   = this._getReqModel();
			let aRows    = oReq.getProperty("/participant") || [];

			// --- Determine indices to delete (selection or row-action) ---
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
				sap.m.MessageToast.show("Select participant row to delete");
				return;
			}

			// --- Prepare service root (self-contained, works with or without _serviceRoot) ---
			const serviceRoot = (this._serviceRoot ? this._serviceRoot() :
				(this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri || "/odata/v4/EmployeeSrv/"))
				.replace(/\/$/, "");

			const buildDelUrl = (reqId, subId, pid) =>
				`${serviceRoot}/ZREQ_ITEM_PART(` +
				`REQUEST_ID='${encodeURIComponent(reqId)}',` +
				`REQUEST_SUB_ID='${encodeURIComponent(subId)}',` +
				`PARTICIPANTS_ID='${encodeURIComponent(pid)}'` +
				`)`;

			// --- Delete: DB when keys exist, else local-only ---
			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);
			const successIdx = [];
			let errorMsg = "";

			sap.ui.core.BusyIndicator.show(0);
			try {
				for (const i of aToDelete) {
				if (i < 0 || i >= aRows.length) continue;

				const row  = aRows[i] || {};
				const pid  = String(row.PARTICIPANTS_ID ?? row.PARTICIPANT_ID ?? "").trim();
				const reqId = String(row.REQUEST_ID ?? oReq.getProperty("/req_header/reqid") ?? "").trim();
				const subId = String(row.REQUEST_SUB_ID ?? oReq.getProperty("/req_item/req_subid") ?? "").trim();

				const hasKeys = !!(reqId && subId && pid);

				if (hasKeys) {
					try {
					const url = buildDelUrl(reqId, subId, pid);
					const res = await fetch(url, {
						method: "DELETE",
						headers: { "If-Match": "*" } // avoid ETag issues
					});
					// Treat 404 as already deleted
					if (!res.ok && res.status !== 404) {
						const t = await res.text().catch(() => "");
						throw new Error(`Delete participant failed (${res.status}): ${t}`);
					}
					successIdx.push(i);
					} catch (e) {
					errorMsg = e.message || "Failed to delete one or more participants.";
					}
				} else {
					// Local-only (not yet saved to DB)
					successIdx.push(i);
				}
				}
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}

			// --- Remove locally only successful ones and normalize trailing row ---
			if (successIdx.length > 0) {
				successIdx.sort((a, b) => b - a).forEach((i) => {
				if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
				});

				if (!Array.isArray(aRows) || aRows.length === 0) {
				aRows = [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
				} else {
				this._normalizeTrailingEmptyRow(aRows); // your existing helper
				}

				oReq.setProperty("/participant", aRows);
				oTable.clearSelection();
				sap.m.MessageToast.show(`Deleted ${successIdx.length - 1 || 1} participant(s)`);
			}

			if (errorMsg) {
				sap.m.MessageToast.show(errorMsg);
			}
		},

		/* =========================================================
		* Save Draft / Save Item / Save+Another
		* ======================================================= */

		onSaveItem() {
			this.onSave();
		},

		async onSaveAddAnother() {
			const oReq = this._getReqModel();
			await this.onSave(); // saves current
			// Re-open create form fresh
			await this._showItemCreate("create");

			// Reset create buffers
			const data = oReq.getData();
			data.req_item = {
				claim_type: "CT1",
				claim_type_item_id: "CTI1",
				est_amount: "",
				est_no_participant: "",
				cash_advance: "no_cashadv",
				start_date: "",
				end_date: "",
				location: "",
				remarks: ""
			};
			const emp_data = await this._getEmpIdDetail(this._userId);
			if (data.req_header.grptype === 'individual') {
				// Use the returned data to populate the fields
				data.participant = [{ 
					PARTICIPANTS_ID: this._userId, 
					PARTICIPANT_NAME: emp_data ? emp_data.name : "", 
					PARTICIPANT_COST_CENTER: emp_data ? emp_data.cc : "", 
					ALLOCATED_AMOUNT: "" 
				}];
			} else {
				data.participant = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
			}
			data.view = "create";
			oReq.setData(data);
		},

		async onSave() {
			// Validate & save to backend
			const oReq      = this._getReqModel();
			const data      = oReq.getData();
			const reqId     = String(data.req_header.reqid || "").trim();

			// View flag: 'i_edit' triggers EDIT flow; otherwise CREATE flow
			const isEdit    = oReq.getProperty("/view") === "i_edit";

			// Common field extraction
			const claimType = data.req_item.claim_type;
			const claimItem = data.req_item.claim_type_item_id;
			const estAmt    = parseFloat(data.req_item.est_amount || 0);
			const estNoPart = parseInt(data.req_item.est_no_participant || 1, 10);

			if (!reqId) { sap.m.MessageToast.show("Missing Request ID"); return; }
			if (!claimType || !claimItem) { sap.m.MessageToast.show("Select claim type/item"); return; }

			sap.ui.core.BusyIndicator.show(0);

			try {
				const alloc_total = data.participant.reduce((sum, it) => {
					return sum + (parseFloat(it.ALLOCATED_AMOUNT) || 0);
				}, 0);

				if (alloc_total > estAmt) {
					sap.m.MessageToast.show('Allocated Amount cannot be more than Estimated Amount');
					return;
				}

				if (isEdit) {
					const requestSubId = String(data.req_item.req_subid || "").trim();
					if (!requestSubId) {
						throw new Error("Missing Request Sub ID for edit");
					}

					const urlItem = this._entityUrl(
						`ZREQUEST_ITEM(REQUEST_ID='${encodeURIComponent(reqId)}',REQUEST_SUB_ID='${encodeURIComponent(requestSubId)}')`
					);
					const payloadItem = {
						CLAIM_TYPE_ID: claimType,
						CLAIM_TYPE_ITEM_ID: claimItem,
						EST_AMOUNT: estAmt,
						EST_NO_PARTICIPANT: estNoPart,
						START_DATE: data.req_item.start_date || null,
						END_DATE  : data.req_item.end_date   || null,
						LOCATION  : data.req_item.location  || "",
						REMARK    : data.req_item.remark    || ""
					};

					const resPatch = await fetch(urlItem, {
						method: "PATCH",
						headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"If-Match": "*" 
						},
						body: JSON.stringify(payloadItem)
					});
					if (!resPatch.ok) {
						const e = await resPatch.text();
						throw new Error(`Item update failed: ${resPatch.status} ${e}`);
					}

					await this._replaceParticipantsForItem(reqId, requestSubId, data.participant);

					await this._getItemList(reqId);
					await this._showItemList('list');

					sap.m.MessageToast.show("Updated Successfully");
					return;
				}

				
				const nr = await this.getCurrentReqNumber("NR03");
				if (!nr) throw new Error("Number range not available");
				const requestSubId = String(nr.result);

				const urlItem = this._entityUrl("ZREQUEST_ITEM");
				const payloadItem = {
					REQUEST_ID: reqId,
					REQUEST_SUB_ID: requestSubId,
					CLAIM_TYPE_ID: claimType,
					CLAIM_TYPE_ITEM_ID: claimItem,
					EST_AMOUNT: estAmt,
					EST_NO_PARTICIPANT: estNoPart,
					START_DATE: data.req_item.start_date || null,
					END_DATE  : data.req_item.end_date   || null,
					LOCATION  : data.req_item.location  || "",
					REMARK    : data.req_item.remark    || ""
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

				const parts = Array.isArray(data.participant) ? data.participant : [];
				const urlPart = this._entityUrl("ZREQ_ITEM_PART");
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
					});
					if (!res.ok) {
						const t = await res.text();
						throw new Error(`Participant save failed: ${res.status} ${t}`);
					}
				}

				await this.updateCurrentReqNumber("NR03", nr.current);

				await this._getItemList(reqId);

				await this._showItemList("list");

				sap.m.MessageToast.show("Saved Successfully");
			} catch (e) {
				sap.m.MessageToast.show(e.message || "Save failed");
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}
		},

		async _replaceParticipantsForItem(requestId, requestSubId, aParticipants) {
			const base = this._serviceRoot();

			// 1) Delete existing (best-effort; DELETE by filter is not standard → load then delete, or implement a backend action)
			// Here: load keys then delete one-by-one
			const filter = encodeURIComponent(
				`REQUEST_ID eq '${String(requestId).replace(/'/g, "''")}' and REQUEST_SUB_ID eq '${String(requestSubId).replace(/'/g, "''")}'`
			);
			const selUrl = `${base}/ZREQ_ITEM_PART?$select=PARTICIPANTS_ID&$filter=${filter}&$format=json`;

			const resSel = await fetch(selUrl, { headers: { "Accept": "application/json" } });
			if (!resSel.ok && resSel.status !== 404) {
				const t = await resSel.text().catch(() => "");
				throw new Error(`Load participants failed: ${resSel.status} ${t}`);
			}
			const data = resSel.ok ? await resSel.json() : { value: [] };
			const existing = Array.isArray(data?.value) ? data.value : [];

			for (const r of existing) {
				const pid = String(r.PARTICIPANTS_ID ?? "").trim();
				if (!pid) continue;
				const delUrl = `${base}/ZREQ_ITEM_PART(` +
							`REQUEST_ID='${encodeURIComponent(requestId)}',` +
							`REQUEST_SUB_ID='${encodeURIComponent(requestSubId)}',` +
							`PARTICIPANTS_ID='${encodeURIComponent(pid)}'` +
							`)`;
				const del = await fetch(delUrl, { method: "DELETE", headers: { "If-Match": "*" } });
				if (!del.ok && del.status !== 404) {
				const t = await del.text().catch(() => "");
				throw new Error(`Delete participant failed: ${del.status} ${t}`);
				}
			}

			// 2) Insert from current array
			const urlPart = `${base}/ZREQ_ITEM_PART`;
			const list = Array.isArray(aParticipants) ? aParticipants : [];
			for (const p of list) {
				const pid = String(p.PARTICIPANTS_ID || p.PARTICIPANT_ID || "").trim();
				if (!pid) continue;
				const alloc = parseFloat(p.ALLOCATED_AMOUNT || 0);

				const ins = await fetch(urlPart, {
				method: "POST",
				headers: { "Content-Type": "application/json", "Accept": "application/json" },
				body: JSON.stringify({
					REQUEST_ID: requestId,
					REQUEST_SUB_ID: requestSubId,
					PARTICIPANTS_ID: pid,
					ALLOCATED_AMOUNT: alloc
				})
				});
				if (!ins.ok) {
				const t = await ins.text().catch(() => "");
				throw new Error(`Insert participant failed: ${ins.status} ${t}`);
				}
			}
		},

		async onCancelItem() {
			const oReq      = this._getReqModel();
			const data      = oReq.getData();
			const reqId     = String(data.req_header.reqid || "").trim();
			
			await this._getItemList(reqId);
			await this._showItemList('list');
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
		}, 

		/* =========================================================
		* Participant Value Help 
		* ======================================================= */

		onValueHelpRequest (oEvent) {
			this._oInputSource = oEvent.getSource();
			if (!this._pEmployeeDialog) {
				this._pEmployeeDialog = sap.ui.core.Fragment.load({
					id: this.getView().getId(),
					name: "claima.fragment.req_participant_vh",
					controller: this
				}).then(oDialog => {
					this.getView().addDependent(oDialog);
					return oDialog;
				});
			}
			this._pEmployeeDialog.then(oDialog => oDialog.open());
		},

		onParticipantInputChange (oEvent) {
			const oInput = oEvent.getSource();
			const sValue = oInput.getValue();
			const sPath = oInput.getBindingContext("request").getPath();
			const oSelectedRow = oEvent.getParameter("selectedRow");

			// --- CASE 1: INPUT CLEARED ---
			if (!sValue) {
				this._updateParticipantData(sPath, null); // Pass null to clear
				return;
			}

			// --- CASE 2: SUGGESTION SELECTED ---
			if (oSelectedRow) {
				const oEmpData = oSelectedRow.getBindingContext().getObject();
				this._updateParticipantData(sPath, oEmpData);
				this.appendNewRow(oEvent);
				return;
			}

			// --- CASE 3: MANUAL ENTER / TAB OUT ---
			const oListBinding = this.getView().getModel().bindList("/ZEMP_MASTER");
			const oFilter = new sap.ui.model.Filter("EEID", "EQ", sValue);
			
			oInput.setBusy(true);
			oListBinding.filter(oFilter).requestContexts(0, 1).then(aContexts => {
				oInput.setBusy(false);
				if (aContexts.length > 0) {
					const oEmpData = aContexts[0].getObject();
					this._updateParticipantData(sPath, oEmpData);
					this.appendNewRow(oEvent);
				} else {
					// Invalid ID entered manually
					this._updateParticipantData(sPath, null); 
					sap.m.MessageToast.show("Employee ID not found");
				}
			}).catch(() => oInput.setBusy(false));
		},

		onValueHelpConfirm (oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				const sPath = this._oInputSource.getBindingContext("request").getPath();
				const oEmpData = oSelectedItem.getBindingContext().getObject();
				this._updateParticipantData(sPath, oEmpData);
				this.appendNewRow(oEvent);
			}
		},

		_updateParticipantData (sRowPath, oEmpData) {
			const oReqModel = this._getReqModel();

			if (oEmpData) {
				// Populate fields
				oReqModel.setProperty(sRowPath + "/PARTICIPANTS_ID", oEmpData.EEID || oEmpData.ID);
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_NAME", oEmpData.NAME);
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_COST_CENTER", oEmpData.CC);
			} else {
				// Clear fields
				oReqModel.setProperty(sRowPath + "/PARTICIPANTS_ID", "");
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_NAME", "");
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_COST_CENTER", "");
			}
		},

		onValueHelpSearch (oEvent) {
			const sValue = oEvent.getParameter("value");
			const oBinding = oEvent.getSource().getBinding("items");
			const aFilters = sValue ? [
				new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("EEID", "Contains", sValue),
						new sap.ui.model.Filter("NAME", "Contains", sValue)
					],
					and: false
				})
			] : [];
			oBinding.filter(aFilters);
		}, 

		/* =========================================================
		* Excel Files Logics 
		* ======================================================= */

		onExport: function() {
			var oModel = this.getView().getModel("request");
			var aData = oModel.getProperty("/participant") || [];
			
			// Logic: If the array is empty OR the first row's EEID is falsy, export an empty list.
			// Otherwise, export the full list.
			var aExportData = (aData.length > 0 && aData[0].PARTICIPANTS_ID) ? aData : [];

			var aCols = this._createColumnConfig();
			var oSettings = {
				workbook: { 
					columns: aCols 
				},
				dataSource: aExportData,
				fileName: "Pre-Approval Request Participant Data.xlsx",
				worker: false // Set to false for small datasets or if debugging
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function() {
					sap.m.MessageToast.show("Export successful");
				})
				.finally(function() {
					oSheet.destroy();
				});
		},

        _createColumnConfig: function() {
            return [
                { label: 'Participant ID (EEID)', property: 'PARTICIPANTS_ID', type: 'string' },
                { label: 'Participant Name', property: 'PARTICIPANT_NAME', type: 'string' },
                { label: 'Participant Cost Center', property: 'PARTICIPANT_COST_CENTER', type: 'string' },
                { label: 'Allocated Amount (MYR)', property: 'ALLOCATED_AMOUNT', type: 'number' }
                // Add more columns as per your /req_item_rows structure
            ];
        }, 

		onUploadParticipants: function(oEvent) {
			const oFileUploader = oEvent.getSource();
			const oFile = oEvent.getParameter("files")[0];
			
			if (!oFile) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const data = new Uint8Array(e.target.result);
				const workbook = XLSX.read(data, { type: 'array' });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];
				
				// Convert Excel rows to JSON
				const aExcelData = XLSX.utils.sheet_to_json(worksheet);

				// Map Excel headers back to your Model Properties
				const aMappedParticipants = aExcelData.map(row => ({
					PARTICIPANTS_ID: row["Participant ID (EEID) "], // "EEID" is the label from your export
					PARTICIPANT_NAME: row["Participant Name"] || "",
					PARTICIPANT_COST_CENTER: row["Participant Cost Center"] || "",
					ALLOCATED_AMOUNT: row["Allocated Amount"] || "0"
				}));

				// Update your Request Model
				const oReqModel = this.getView().getModel("request");
				oReqModel.setProperty("/participant", aMappedParticipants);
				
				sap.m.MessageToast.show("Participants updated from file!");
			};
			reader.readAsArrayBuffer(oFile);
		}

		/* =========================================================
		* Aiman changes 
		* ======================================================= */

		// loadItemsForRequest: async function (sReqId) {
		// 	if (!sReqId) {
		// 		MessageToast.show("Missing Request ID.");
		// 		return;
		// 	}
		// 	try {
		// 		BusyIndicator.show(0);

		// 		// Fetch from backend (OData V4)
		// 		const aItems = await this._fetchReqItemsByReqId(sReqId);

		// 		// Bind to the JSON model used by req_item_list.fragment
		// 		const oLocal = this.getView().getModel(); // default JSON model
		// 		oLocal.setProperty("/req_item_rows", aItems);

		// 		// Update counts for the toolbar title and any badges
		// 		const oVM = this.getView().getModel("view");
		// 		if (oVM) {
		// 			oVM.setProperty("/totalCount", aItems.length);
		// 			oVM.setProperty("/visibleCount", aItems.length);
		// 		}


		// 		// Refresh the correct table binding (sap.ui.table.Table uses "rows")
		// 		const oTable = this.byId("req_item_table2");
		// 		if (oTable && oTable.getBinding && oTable.getBinding("rows")) {
		// 			oTable.getBinding("rows").refresh();
		// 		}


		// 		// If your table is already rendered and has listeners attached:
		// 		if (typeof this._updateTableCounts === "function") {
		// 			this._updateTableCounts();
		// 		}
		// 	} catch (e) {
		// 		jQuery.sap.log.error("loadItemsForRequest failed: " + e);
		// 		MessageToast.show("Unable to load request items.");
		// 	} finally {
		// 		BusyIndicator.hide();
		// 	}
		// },

		// _fetchReqItemsByReqId: async function (sReqId) {
		// 	// Get your V4 OData model (inherited from Component or View)
		// 	const oModel =
		// 		this.getView().getModel("employee") ||
		// 		this.getOwnerComponent().getModel("employee");
		// 	if (!oModel) {
		// 		throw new Error("OData model 'employee' not found.");
		// 	}


		// 	// Build V4 filter properly (use Filter argument, not $filter in mParameters)
		// 	const Filter = sap.ui.model.Filter;
		// 	const FilterOperator = sap.ui.model.FilterOperator;
		// 	const aFilters = [new Filter("REQUEST_ID", FilterOperator.EQ, sReqId)];


		// 	// Adjust entity set and $select fields to your service metadata if needed
		// 	const oListBinding = oModel.bindList("/ZREQUEST_ITEM", null, null, aFilters, {
		// 		$select: "REQUEST_ID,CLAIM_TYPE_ID,CLAIM_TYPE_ITEM_ID,EST_NO_PARTICIPANT,EST_AMOUNT",
		// 		$orderby: "REQUEST_ID,CLAIM_TYPE_ITEM_ID"
		// 	});

		// 	const aCtx = await oListBinding.requestContexts(0, Infinity);
		// 	const aEntities = await Promise.all(aCtx.map((c) => c.requestObject()));

		// 	return aEntities.map((e) => ({
		// 		request_id: e.REQUEST_ID || "",
		// 		claim_type: e.CLAIM_TYPE_ID || "",
		// 		claim_type_item: e.CLAIM_TYPE_ITEM_ID || "",
		// 		est_amount: Number(e.EST_AMOUNT) || "",
		// 		//curenncy_code: "MYR",
		// 		est_no_of_participant: e.EST_NO_PARTICIPANT || "",
		// 	}));
		// },
	});
});