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
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter"
], function (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment, Spreadsheet, BusyIndicator, History, Filter, FilterOperator, Sorter) {
	"use strict";
 
	return Controller.extend("claima.controller.RequestForm", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */
		async onInit() {
			this._fragments = Object.create(null);

			// URL Access
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("RequestForm").attachPatternMatched(this._onMatched, this);
		},

		/* =========================================================
		* URL Access
		* ======================================================= */
		
		_onMatched(oEvent) {
			let sRequestId = oEvent.getParameter("arguments").request_id;

			try { sRequestId = decodeURIComponent(sRequestId); } catch (e) {}

			console.log("Deep-link request ID:", sRequestId);

			const oReqModel = this.getOwnerComponent().getModel("request");
			oReqModel.setProperty("/req_header/reqid", sRequestId);

			// 3. Load data for this request ID
			this._loadRequest(sRequestId);
		},

		_loadRequest: function (sReqId) {
			this._getHeader(sReqId);
			this._getItemList(sReqId);
		},

		/* =========================================================
		* Helpers: Model
		* ======================================================= */

		_getReqModel() {
			return this.getOwnerComponent().getModel("request");
		},

		_ensureRequestModelDefaults: function () {
			const oReq = this._getReqModel();
			const data = oReq.getData() || {};
			data.user 			   = data.user;
			data.req_header        = { reqid: "", grptype: "IND" };
			// data.req_item_rows     = Array.isArray(data.req_item_rows) ? data.req_item_rows : [];
			data.req_item_rows     = [];
			data.req_item          = data.req_item || {
				cash_advance: "no_cashadv"
			};
			data.participant       = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view              = "view";
			data.list_count        = data.list_count ?? 0;
			oReq.setData(data);
		},

		/* =========================================================
		* Helpers: Fragment Management
		* ======================================================= */

		async _getFormFragment(sName) {
			const oView = this.getView();
			if (!this._fragments[sName]) {
				this._fragments[sName] = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sName,
					type: "XML",
					controller: this
				}).then((oFrag) => {
					oView.addDependent(oFrag);
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
			ctrl.destroy();
			this._fragments = Object.create(null);
		},

		async _showItemCreate(state) {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			await this._removeByLocalId(this.byId("request_item_list_fragment_d") ? "request_item_list_fragment_d" : "request_item_list_fragment");

			const oCreate = await this._getFormFragment("req_create_item");
			await this._replaceContentAt(oPage, 1, oCreate);

			this._getReqModel().setProperty("/view", state);
		},

		async _showItemList(state) {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			await this._removeByLocalId("request_create_item_fragment");

			const oCreate = await this._getFormFragment("req_item_list");
			await this._replaceContentAt(oPage, 1, oCreate);

			this._getReqModel().setProperty("/view", state);
		},

		/* =========================================================
		* Footer / Navigation Buttons
		* ======================================================= */

		onBack() {
			const oReqModel = this._getReqModel();
			const data = oReqModel.getData();
			if (data.req_header.reqstatus == "DRAFT") {
				if (!this.oBackDialog) {
					this.oBackDialog = new Dialog({
					title: "Warning",
					type: "Message",
					state: "Warning",
					content: [ new Label({ text: "You haven't submit, do you confirm to go back?" }) ],
					beginButton: new Button({
						type: "Emphasized",
						text: "Confirm",
						press: async function () {
							this.oBackDialog.close();
							this._ensureRequestModelDefaults();
							var oHistory = History.getInstance();
							var sPreviousHash = oHistory.getPreviousHash();
							if (sPreviousHash) {
								window.history.go(-1);
							} else {
								var oRouter = this.getOwnerComponent().getRouter();
								oRouter.navTo("Dashboard");
							}
						}.bind(this)
					}),
					endButton: new Button({ text: "Cancel", press: () => this.oBackDialog.close() })
					});
				}
				this.oBackDialog.open();
			}
		},

		onDeleteRequest() {
			const oReq   = this._getReqModel();
			const empId  = oReq.getProperty("/user");
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
						this.oDeleteDialog.getBeginButton().setEnabled(false);
						sap.ui.core.BusyIndicator.show(0);

						await this._updateHeaderStatusToDeleted(empId, reqId);

						sap.m.MessageToast.show("Request deleted");
						this.oDeleteDialog.close();

						var oRouter = this.getOwnerComponent().getRouter();
						oRouter.navTo("Dashboard");

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
			const oReqJson = this._getReqModel();
			const oModel   = this.getOwnerComponent().getModel();
			const sUpdateGroupId = "$auto";

			const literal = (v) => /^\d+$/.test(String(v)) ? String(Number(v)) : `'${String(v).replace(/'/g, "''")}'`;

			const sPath = `/ZREQUEST_HEADER(EMP_ID=${literal(empId)},REQUEST_ID=${literal(reqId)})`;
			const oCtxBinding = oModel.bindContext(sPath, null, { $$updateGroupId: sUpdateGroupId, $$ownRequest: true });

			try {
				await oCtxBinding.requestObject();

				const oCtx = oCtxBinding.getBoundContext();
				oCtx.setProperty("STATUS", "DELETED");
				await oModel.submitBatch(sUpdateGroupId);

				oReqJson.setProperty("/req_header/status", "DELETED");
			} catch (err) {
				console.error("Update header to DELETED failed:", err);
				throw err;
			}
		},

		async onSubmitRequest() {
			const oReq = this._getReqModel();
			const data = oReq.getData();
			const rows = oReq.getProperty("/req_item_rows") || [];

			if (!rows.length) {
				this._showMustAddClaimDialog();
				return;
			}

			const reqId = String(data.req_header.reqid || "").trim();
			const empId  = oReq.getProperty("/user");

			if (!reqId || !empId) {
				sap.m.MessageToast.show("EMP ID or Request ID missing");
				return;
			}

			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new sap.m.Dialog({
				title: "Submit Request",
				type: "Message",
				content: [new sap.m.Label({ text: "Confirm to submit Request?" })],
				beginButton: new sap.m.Button({
					type: "Emphasized",
					text: "Submit",
					press: async () => {
						try {
							sap.ui.core.BusyIndicator.show(0);

							const oModel = this.getOwnerComponent().getModel(); 

							const oListBinding = oModel.bindList(
								"/ZREQUEST_HEADER",
								null,
								null,
								[
									new sap.ui.model.Filter({
										path: "EMP_ID",
										operator: sap.ui.model.FilterOperator.EQ,
										value1: empId
									}),
									new sap.ui.model.Filter({
										path: "REQUEST_ID",
										operator: sap.ui.model.FilterOperator.EQ,
										value1: reqId
									})
								],
								{
									$$ownRequest: true,
									$$groupId: "$auto",
									$$updateGroupId: "$auto"
								}
							);

							const aCtx = await oListBinding.requestContexts(0, 1);
							const oCtx = aCtx[0];

							if (!oCtx) {
								throw new Error("Request not found for submit.");
							}

							oCtx.setProperty("STATUS", "PENDING APPROVAL");
							oCtx.setProperty("CASH_ADVANCE", parseFloat(data.req_header.cashadvamt));
							oCtx.setProperty("PREAPPROVAL_AMOUNT", parseFloat(data.req_header.reqamt));

							await oModel.submitBatch("$auto");

							sap.m.MessageToast.show("Request submitted successfully");

							const oRouter = this.getOwnerComponent().getRouter();
							oRouter.navTo("RequestFormStatus");
							this.getPARHeaderList(empId);

						} catch (e) {
							sap.m.MessageToast.show(e.message || "Submission failed");
						} finally {
							sap.ui.core.BusyIndicator.hide();
							this.oSubmitDialog.close();
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
			this._getClaimTypeItemSelection();

			const oReq = this._getReqModel();
			const data = oReq.getData();

			data.req_item = {
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
				var oData = this._getReqModel().getData();
				const emp_data = await this._getEmpIdDetail(oData.user);
				
				data.participant = [{ 
					PARTICIPANTS_ID: emp_data ? emp_data.eeid : "", 
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
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return { 
						eeid: oData.EEID,
						name: oData.NAME, 
						cc: oData.CC 
					};
				} else {
					console.warn("No employee found with ID: " + sEEID);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; 
			}
		},

		onOpenItemView (oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ false);
		},
		
		onOpenItemEdit (oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ true);
		},
		
		async _openItemFromList (oEvent, bEdit) {
			const oReq   = this._getReqModel();
			const oTable = this.byId("req_item_table");

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

			const row = oCtx.getObject();
			const reqId = String(row.REQUEST_ID || oReq.getProperty("/req_header/reqid") || "").trim();
			const subId = String(row.REQUEST_SUB_ID || "").trim();

			oReq.setProperty("/req_header/reqid", reqId);
			oReq.setProperty("/req_item", {
				req_subid            : subId,
				claim_type           : row.CLAIM_TYPE_ID || "",
				claim_type_item_id 	 : row.CLAIM_TYPE_ITEM_ID || "",
				est_amount           : row.EST_AMOUNT ?? "",
				est_no_participant   : row.EST_NO_PARTICIPANT ?? "",
				start_date           : row.START_DATE || "",
				end_date             : row.END_DATE || "",
				location             : row.LOCATION || "",
				cash_advance         : row.CASH_ADVANCE || "no_cashadv",
				remark               : row.REMARK || ""
			});

			oReq.setProperty("/view", bEdit ? "i_edit" : "view");

			this._showItemCreate(oReq.getProperty("/view"));
			await this._loadParticipantsForItem(reqId, subId);
			await this._getClaimTypeItemSelection();
		},

		async _loadParticipantsForItem(reqId, subId) {
			const oReq = this._getReqModel();

			const setEmpty = () => {
				oReq.setProperty("/participant", [
					{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }
				]);
			};

			if (!reqId || !subId) {
				setEmpty();
				return;
			}

			try {
				const oModel = this.getOwnerComponent().getModel("employee_view");

				const oListBinding = oModel.bindList(
					"/ZEMP_REQUEST_PART_VIEW",
					null,
					[new sap.ui.model.Sorter("PARTICIPANTS_ID", false)],
					[
						new sap.ui.model.Filter({ path: "REQUEST_ID",     operator: sap.ui.model.FilterOperator.EQ, value1: reqId }),
						new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: subId })
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$count: false,
						$select: "PARTICIPANTS_ID,NAME,CC,ALLOCATED_AMOUNT"
					}
				);

				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const parts = aCtx.map((ctx) => ctx.getObject());

				const aMapped = parts.map((p) => ({
					PARTICIPANTS_ID: p.PARTICIPANTS_ID ?? "",
					PARTICIPANT_NAME: p.NAME ?? "",
					PARTICIPANT_COST_CENTER: p.CC ?? "",
					ALLOCATED_AMOUNT: p.ALLOCATED_AMOUNT ?? ""
				}));

				oReq.setProperty(
					"/participant",
					aMapped.length
						? aMapped
						: [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }]
				);
			} catch (e) {
				console.error("Load participants failed:", e);
				setEmpty();
			}
		},

		async onBackView() {
			var oCreate = this.byId('request_create_item_fragment');
			if (oCreate) {
				await this._showItemList('view');
			} else {
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
				if (sPreviousHash) {
					window.history.go(-1);
				} else {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("RequestFormStatus");
				}
			}
			this._ensureRequestModelDefaults();
		},

		/* =========================================================
		* Item List: Delete Row(s)
		* ======================================================= */

		async onRowDeleteReqItem(oEvent) {
			const oTable = this.byId("req_item_table_d"); 
			const oReq   = this._getReqModel();
			const aRows  = oReq.getProperty("/req_item_rows") || [];

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

			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);

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
					errorMsg = e.message || "Delete failed for one or more rows.";
				}
				}
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}

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

		async _deleteItemCascade(requestId, requestSubId) {
			const oModel  = this.getOwnerComponent().getModel(); 
			const sGroup  = "deleteItemCascade";

			const cast = (v) => /^\d+$/.test(String(v)) ? Number(v) : String(v);

			const isNotFound = (e) => {
				const s = e?.status || e?.statusCode || e?.httpStatus || e?.cause?.status || e?.cause?.statusCode;
				return s === 404;
			};

			const vReq = cast(requestId);
			const vSub = cast(requestSubId);

			let aPartCtx = [];
			try {
				const oPartList = oModel.bindList(
				"/ZREQ_ITEM_PART",
				null,
				null,
				[
					new sap.ui.model.Filter({ path: "REQUEST_ID",     operator: sap.ui.model.FilterOperator.EQ, value1: vReq }),
					new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vSub })
				],
				{
					$$ownRequest: true,
					$$groupId: "$auto", 
					$select: "REQUEST_ID,REQUEST_SUB_ID,PARTICIPANTS_ID"
				}
				);
				aPartCtx = await oPartList.requestContexts(0, Infinity);
			} catch (e) {
				if (!isNotFound(e)) {
				console.error("Load participants failed:", e);
				throw e;
				}
			}

			let oItemCtx = null;
			try {
				const oItemList = oModel.bindList(
				"/ZREQUEST_ITEM",
				null,
				null,
				[
					new sap.ui.model.Filter({ path: "REQUEST_ID",     operator: sap.ui.model.FilterOperator.EQ, value1: vReq }),
					new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vSub })
				],{
					$$ownRequest: true,
					$$groupId: "$auto",
					$select: "REQUEST_ID,REQUEST_SUB_ID"
				}
				);
				const aItem = await oItemList.requestContexts(0, 1);
				oItemCtx = aItem[0] || null;
			} catch (e) {
				if (!isNotFound(e)) {
				console.error("Load item failed:", e);
				throw e;
				}
			}

			try {
				aPartCtx.forEach((ctx) => {
				ctx.delete(sGroup).catch((e) => {
					if (!isNotFound(e)) {
					throw e;
					}
				});
				});

				if (oItemCtx) {
				oItemCtx.delete(sGroup).catch((e) => {
					if (!isNotFound(e)) {
					throw e;
					}
				});
				}

				await oModel.submitBatch(sGroup);
				return true;
			} catch (e) {
				console.error("Delete item cascade failed:", e);
				throw e;
			}
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

			const path = oCtx.getPath();
			const segs = path.split("/");
			const idx  = parseInt(segs[segs.length - 1], 10);
			if (!Number.isInteger(idx)) return;

			let aRows = oReq.getProperty("/participant");
			if (!Array.isArray(aRows)) {
				aRows = [];
				oReq.setProperty("/participant", aRows);
			}

			oReq.setProperty(`/participant/${idx}/PARTICIPANTS_ID`, sTrim);

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
			const desiredLength = Math.max(lastNonEmpty + 2, 1); 
			if (aRows.length > desiredLength) {
				aRows.splice(desiredLength);
				oReq.setProperty("/participant", aRows.slice());
			} else if (aRows.length === 0) {
				aRows.push({ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
				oReq.setProperty("/participant", aRows);
			}
		},

		async onRowDeleteParticipant(oEvent) {
			const oTable = this.byId("req_participant_table");
			const oReq   = this._getReqModel();
			let aRows    = oReq.getProperty("/participant") || [];

			let idxFromAction = null;
			const oRow   = oEvent.getParameter && oEvent.getParameter("row");
			const visIdx = oEvent.getParameter && oEvent.getParameter("rowIndex");

			const extractIndexFromCtxPath = (oCtx) => {
				if (!oCtx) return null;
				const seg = oCtx.getPath().split("/").pop();
				const i = parseInt(seg, 10);
				return Number.isInteger(i) ? i : null;
			};

			if (oRow) {
				const oCtx = oRow.getBindingContext("request");
				idxFromAction = extractIndexFromCtxPath(oCtx);
			} else if (Number.isInteger(visIdx)) {
				const oCtx = oTable.getContextByIndex(visIdx);
				idxFromAction = extractIndexFromCtxPath(oCtx);
			}

			let aToDelete = [];
			const aSel = oTable.getSelectedIndices() || [];
			if (aSel.length > 0) {
				aToDelete = aSel.map((v) => extractIndexFromCtxPath(oTable.getContextByIndex(v)))
								.filter((x) => x !== null);
			} else if (Number.isInteger(idxFromAction)) {
				aToDelete = [idxFromAction];
			}

			if (aToDelete.length === 0) {
				sap.m.MessageToast.show("Select participant row to delete");
				return;
			}

			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);

			const oModel = this.getOwnerComponent().getModel(); 
			const sGroupId = "delParticipants"; 

			const toNumberIfNumeric = (v) => /^\d+$/.test(String(v)) ? Number(v) : String(v);

			const successIdx = [];
			let errorMsg = "";

			sap.ui.core.BusyIndicator.show(0);
			try {
				const deletePromises = [];

				for (const i of aToDelete) {
				if (i < 0 || i >= aRows.length) continue;

				const row   = aRows[i] || {};
				const pid   = String(row.PARTICIPANTS_ID ?? row.PARTICIPANT_ID ?? "").trim();
				const reqId = String(row.REQUEST_ID ?? oReq.getProperty("/req_header/reqid") ?? "").trim();
				const subId = String(row.REQUEST_SUB_ID ?? oReq.getProperty("/req_item/req_subid") ?? "").trim();

				const hasKeys = !!(reqId && subId && pid);

				if (!hasKeys) {
					successIdx.push(i);
					continue;
				}

				const vReq = toNumberIfNumeric(reqId);
				const vSub = toNumberIfNumeric(subId);
				const vPid = toNumberIfNumeric(pid);

				const oListBinding = oModel.bindList(
					"/ZREQ_ITEM_PART",
					null,
					null,
					[
						new sap.ui.model.Filter({ path: "REQUEST_ID",     operator: sap.ui.model.FilterOperator.EQ, value1: vReq }),
						new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vSub }),
						new sap.ui.model.Filter({ path: "PARTICIPANTS_ID",operator: sap.ui.model.FilterOperator.EQ, value1: vPid })
					],
					{
						$$ownRequest: true,
						$$groupId: sGroupId,
						$$updateGroupId: sGroupId,
						$count: false,
						$select: "REQUEST_ID,REQUEST_SUB_ID,PARTICIPANTS_ID"
					}
				);

				const pDel = oListBinding.requestContexts(0, 1)
					.then((aCtx) => {
					const oCtx = aCtx[0];
					if (!oCtx) {
						successIdx.push(i);
						return;
					}
					return oCtx.delete(sGroupId).then(() => {
						successIdx.push(i);
					});
					})
					.catch((e) => {
					errorMsg = errorMsg || (e && e.message) || "Failed to delete one or more participants.";
					});

				deletePromises.push(pDel);
				}

				await Promise.allSettled(deletePromises);

				if (deletePromises.length > 0) {
				await oModel.submitBatch(sGroupId);
				}
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}

			if (successIdx.length > 0) {
				successIdx.sort((a, b) => b - a).forEach((i) => {
					if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
				});

				if (!Array.isArray(aRows) || aRows.length === 0) {
					aRows = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
				} else if (this._normalizeTrailingEmptyRow) {
					this._normalizeTrailingEmptyRow(aRows);
				}

				oReq.setProperty("/participant", aRows);
				oTable.clearSelection();
				sap.m.MessageToast.show(`Deleted ${successIdx.length} participant(s)`);
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
				claim_type_item_id: "",
				est_amount: "",
				est_no_participant: "",
				cash_advance: "no_cashadv",
				start_date: "",
				end_date: "",
				location: "",
				remarks: ""
			};
			if (data.req_header.grptype === 'IND') {
				const emp_data = await this._getEmpIdDetail(data.eeid);
				data.participant = [{ 
					PARTICIPANTS_ID: emp_data ? emp_data.eeid : "", 
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
			const oReq  = this._getReqModel();
			const data  = oReq.getData();
			const oModel = this.getOwnerComponent().getModel();

			const reqId = String(data.req_header.reqid || "").trim();
			const isEdit = oReq.getProperty("/view") === "i_edit";

			const claimType = data.req_header.claimtype;
			const claimItem = data.req_item.claim_type_item_id;
			const estAmt    = parseFloat(data.req_item.est_amount || 0);
			const estNoPart = parseInt(data.req_item.est_no_participant || 1, 10);

			if (!reqId) { sap.m.MessageToast.show("Missing Request ID"); return; }
			if (!claimType || !claimItem) { sap.m.MessageToast.show("Select claim type/item"); return; }

			sap.ui.core.BusyIndicator.show(0);

			try {
				const alloc_total = data.participant.reduce(
					(sum, it) => sum + (parseFloat(it.ALLOCATED_AMOUNT) || 0),
					0
				);
				if (alloc_total > estAmt) {
					sap.m.MessageToast.show("Allocated Amount cannot exceed Estimated Amount");
					return;
				}

				if (isEdit) {
					const requestSubId = String(data.req_item.req_subid || "").trim();
					if (!requestSubId) throw new Error("Missing Request Sub ID for edit");

					const oList = oModel.bindList(
						"/ZREQUEST_ITEM",
						null,
						null,
						[
							new sap.ui.model.Filter({ path: "REQUEST_ID", operator: "EQ", value1: reqId }),
							new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: "EQ", value1: subId })
						],
						{ $$ownRequest: true, $$updateGroupId: "itemSave" }
					);

					const aCtx = await oList.requestContexts(0, 1);
					const oItemCtx = aCtx[0];
					if (!oItemCtx) throw new Error("Item not found for edit");

					oItemCtx.setProperty("CLAIM_TYPE_ID",      claimType);
					oItemCtx.setProperty("CLAIM_TYPE_ITEM_ID", claimItem);
					oItemCtx.setProperty("EST_AMOUNT",         estAmt);
					oItemCtx.setProperty("EST_NO_PARTICIPANT", estNoPart);
					oItemCtx.setProperty("START_DATE",         data.req_item.start_date || null);
					oItemCtx.setProperty("END_DATE",           data.req_item.end_date   || null);
					oItemCtx.setProperty("LOCATION",           data.req_item.location  || "");
					oItemCtx.setProperty("REMARK",             data.req_item.remark    || "");

					await this._replaceParticipantsForItem(reqId, requestSubId, data.participant);

					await oModel.submitBatch("itemSave");

					await this._getItemList(reqId);
					await this._showItemList("list");

					sap.m.MessageToast.show("Updated Successfully");
					return;
				}

				const nr = await this.getCurrentReqNumber("NR03");
				if (!nr) throw new Error("Number range not available");

				const requestSubId = String(nr.result);

				const oItemCtx = oModel.bindList("/ZREQUEST_ITEM").create(
					{
						REQUEST_ID			:	reqId,
						REQUEST_SUB_ID		:	requestSubId,
						CLAIM_TYPE_ID		:	claimType,
						CLAIM_TYPE_ITEM_ID	:	claimItem,
						EST_AMOUNT			:	estAmt,
						EST_NO_PARTICIPANT	:	estNoPart,
						START_DATE			:	data.req_item.start_date || null,
						END_DATE			:	data.req_item.end_date   || null,
						LOCATION			:	data.req_item.location  || "",
						REMARK				:	data.req_item.remark    || ""
					},                  
					{ $$updateGroupId: "itemCreate" }
				);

				const parts = data.participant || [];
				for (const p of parts) {
					const pid = String(p.PARTICIPANTS_ID || "").trim();
					if (!pid) continue;

					const alloc = parseFloat(p.ALLOCATED_AMOUNT || 0);

					oModel.bindList("/ZREQ_ITEM_PART").create(
						{
						REQUEST_ID:         reqId,
						REQUEST_SUB_ID:     requestSubId,
						PARTICIPANTS_ID:    pid,
						ALLOCATED_AMOUNT:   alloc
						},
						{ $$updateGroupId: "itemCreate" }
					);
				}

				await oModel.submitBatch("itemCreate");

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
			const oModel = this.getOwnerComponent().getModel();
			const sGroup = "replaceParts";

			const isNotFound = (err) => {
				const c = err?.status || err?.statusCode || err?.cause?.status || err?.cause?.statusCode;
				return c === 404;
			};

			let aExistingCtx = [];
			try {
				const oList = oModel.bindList(
				"/ZREQ_ITEM_PART",
				null,
				null,
				[
					new sap.ui.model.Filter({ path: "REQUEST_ID",     operator: "EQ", value1: requestId }),
					new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: "EQ", value1: requestSubId })
				],
				{
					$$ownRequest : true,
					$$groupId    : "$auto",
					$select      : "PARTICIPANTS_ID"
				}
				);

				aExistingCtx = await oList.requestContexts(0, Infinity);

			} catch (err) {
				if (!isNotFound(err)) {
				console.error("Load participants failed:", err);
				throw err;
				}
			}

			try {
				aExistingCtx.forEach((ctx) => {
				ctx.delete(sGroup).catch((err) => {
					if (!isNotFound(err)) throw err;
				});
				});
			} catch (err) {
				console.error("Participant deletion failed:", err);
				throw err;
			}

			const aList = Array.isArray(aParticipants) ? aParticipants : [];
			try {
				const oPartList = oModel.bindList("/ZREQ_ITEM_PART", null, null, null, {
				$$updateGroupId: sGroup
				});

				aList.forEach((p) => {
				const pid = String(p.PARTICIPANTS_ID || p.PARTICIPANT_ID || "").trim();
				if (!pid) return;

				const alloc = parseFloat(p.ALLOCATED_AMOUNT || 0);

				oPartList.create(
					{
					REQUEST_ID:       requestId,
					REQUEST_SUB_ID:   requestSubId,
					PARTICIPANTS_ID:  cast(pid),
					ALLOCATED_AMOUNT: alloc
					},
					true
				);
				});

			} catch (err) {
				console.error("Insert participant failed:", err);
				throw err;
			}

			await oModel.submitBatch(sGroup);
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

		async _getHeader(req_id) {
			const oReq = this._getReqModel();

			if (!req_id) {
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}

			const oModel = this.getOwnerComponent().getModel('employee_view');

			const sReq = String(req_id);

			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_VIEW",
				null,
				null,
				[new sap.ui.model.Filter({
					path: "REQUEST_ID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sReq
				})],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$top: 1
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, 1);
				const a = aCtx[0]?.getObject();

				if (a.PREAPPROVAL_AMOUNT == null) {a.PREAPPROVAL_AMOUNT = 0.0;}

				oReq.setProperty("/req_header", a[0]); 
				return a;
			} catch (err) {
				console.error("OData V4 bindList failed:", err);
				oReq.setProperty("/req_header", a); 
				return [];
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

		async getCurrentReqNumber(range_id) {
			const oModel = this.getOwnerComponent().getModel();

			try {
				const oListBinding = oModel.bindList(
				"/ZNUM_RANGE",
				null,
				null,
				[
					new sap.ui.model.Filter({
					path: "RANGE_ID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: range_id
					})
				],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$select: "RANGE_ID,CURRENT"
				}
				);

				const aCtx = await oListBinding.requestContexts(0, 1);
				const oCtx = aCtx[0];

				if (!oCtx) {
					throw new Error(`${range_id} not found`);
				}

				const row = oCtx.getObject();
				if (row.CURRENT == null) {
					throw new Error(`${range_id} missing CURRENT`);
				}

				const current = Number(row.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const result = `REQ${yy}${String(current).padStart(9, "0")}`;

				return { result, current };

			} catch (err) {
				console.error("Error fetching number range:", err);
				return null;
			}
		},

		async updateCurrentReqNumber(rangeId, currentNumber) {
			const oModel = this.getOwnerComponent().getModel();
			const sGroup = "updateRange";
			const nextNumber = currentNumber + 1;

			try {
				const sPath = `/ZNUM_RANGE(RANGE_ID='${rangeId.replace(/'/g, "''")}')`;

				const oCtxBinding = oModel.bindContext(sPath, null, {
				$$updateGroupId: sGroup,
				$$ownRequest: true
				});

				await oCtxBinding.requestObject();
				const oCtx = oCtxBinding.getBoundContext();

				oCtx.setProperty("CURRENT", String(nextNumber));

				await oModel.submitBatch(sGroup);

				return { CURRENT: nextNumber };

			} catch (err) {
				console.error("Error updating number range:", err);
				return null;
			}
		}, 

		async _getClaimTypeItemSelection() {
			const oReq   = this._getReqModel();
			const data   = oReq.getData();
			const claim_type_id = data.req_header.claimtype;

			if (!claim_type_id) {
				oReq.setProperty("/claim_type_items", []);
				return [];
			}

			const oModel = this.getOwnerComponent().getModel();

			try {
				const oListBinding = oModel.bindList(
					"/ZCLAIM_TYPE_ITEM",
					null,
					[
						new sap.ui.model.Sorter("CLAIM_TYPE_ID", false)
					],
					[
						new sap.ui.model.Filter({
							path: "CLAIM_TYPE_ID",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: claim_type_id
						}),
						new sap.ui.model.Filter({
							path: "CATEGORY_ID",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: "PREAPPROVAL"
						}),
						new sap.ui.model.Filter({
							path: "CATEGORY_ID",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: "AUTOAPPROVE"
						})
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$count: true,
						$select: "CLAIM_TYPE_ID,CLAIM_TYPE_ITEM_ID,CLAIM_TYPE_ITEM_DESC"
					}
				);

				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				oReq.setProperty("/claim_type_items", a);
				return a;

			} catch (err) {
				console.error("ODataV4 load claim type items failed:", err);
				oReq.setProperty("/claim_type_items", []);
				return [];
			}
		},

		// My Pre-Approval Request Status function
		getPARHeaderList: async function (emp_id) {
			const oReq = this.getOwnerComponent().getModel("request_status");
			const oModel = this.getOwnerComponent().getModel();

			const oListBinding = oModel.bindList("/ZREQUEST_HEADER", undefined,
				[new Sorter("REQUEST_ID")],
				[new Filter({ path: "EMP_ID", operator: FilterOperator.EQ, value1: String(emp_id) })],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$updateGroupId: "$auto",
					$count: true
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				a.forEach((it) => {
				if (it.PREAPPROVAL_AMOUNT == null) it.PREAPPROVAL_AMOUNT = 0.0;
				});

				oReq.setProperty("/req_header_list", a);
				oReq.setProperty("/req_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/req_header_list", []);
				oReq.setProperty("/req_header_count", 0);
				return [];
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
                { label: 'PARTICIPANTS_ID', property: 'PARTICIPANTS_ID', type: 'string' },
                { label: 'PARTICIPANT_NAME', property: 'PARTICIPANT_NAME', type: 'string' },
                { label: 'PARTICIPANT_COST_CENTER', property: 'PARTICIPANT_COST_CENTER', type: 'string' },
                { label: 'ALLOCATED_AMOUNT', property: 'ALLOCATED_AMOUNT', type: 'number' }
                // Add more columns as per your /req_item_rows structure
            ];
        }, 

		onUploadParticipants(oEvent) {
			var file = oEvent.getParameter("files")[0];
			if (!file) return; // Safety check

			var reader = new FileReader();

			reader.onload = function (e) {
				var data = new Uint8Array(e.target.result);
				var workbook = XLSX.read(data, { type: "array" });
				var worksheet = workbook.Sheets[workbook.SheetNames[0]];
				var jsonData = XLSX.utils.sheet_to_json(worksheet);
				jsonData.push({ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
				const oReqModel = this._getReqModel();
				oReqModel.setProperty("/participant", jsonData);

				// MessageToast.show("Upload successful!");
			}.bind(this);

			reader.readAsArrayBuffer(file);
		},

		/* =========================================================
		* Approver Functions 
		* ======================================================= */

	});
});