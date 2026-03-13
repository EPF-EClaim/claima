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
	"sap/ui/model/Sorter",
	"claima/utils/PARequestSharedFunction",
	"claima/utils/budgetCheck",
	"claima/utils/ApprovalLog",
	"claima/utils/ApproveDialog",
	"claima/utils/RejectDialog",
	"claima/utils/SendBackDialog",
	'claima/utils/Utility',
	"claima/utils/ApproverUtility",
	"claima/utils/workflowApproval"

], function (
	Controller,
	MessageToast,
	JSONModel,
	Dialog,
	Button,
	Label,
	Fragment,
	Spreadsheet,
	BusyIndicator,
	History,
	Filter,
	FilterOperator,
	Sorter,
	PARequestSharedFunction,
	budgetCheck,
	ApprovalLog,
	ApproveDialog,
	RejectDialog,
	SendBackDialog,
	Utility,
	ApproverUtility,
	workflowApproval
) {
	"use strict";

	return Controller.extend("claima.controller.RequestForm", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */

		_ReqAttachmentFile1: null,
		_ReqAttachmentFile2: null,

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

			try { sRequestId = decodeURIComponent(sRequestId); } catch (e) { }

			console.log("Deep-link request ID:", sRequestId);

			const oReqModel = this._getReqModel();
			oReqModel.setProperty("/req_header/reqid", sRequestId);

			// 3. Load data for this request ID
			this._loadRequest(sRequestId);
		},

		async _loadRequest(sReqId) {
			await this._getHeader(sReqId);
			await this._getItemList(sReqId);

			var status = this._getReqModel().getProperty("/req_header/reqstatus");
			if (status != 'DRAFT' && status != 'DELETED') {
				const oReq = this.getOwnerComponent().getModel('approval_log');
				const oViewModel = this.getOwnerComponent().getModel('employee_view');
				ApprovalLog.getApproverList(oReq, oViewModel, sReqId);
				ApprovalLog._showApprovalLog(this);
			}
			PARequestSharedFunction._determineCurrentState(this, this._getReqModel()); //This part overriding View = Approver
		},

		/* =========================================================
		* Helpers: Model
		* ======================================================= */

		_getReqModel() {
			return this.getOwnerComponent().getModel("request");
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
			await this._removeByLocalId("req_approval_log");

			const oCreate = await this._getFormFragment("req_create_item");
			await this._replaceContentAt(oPage, 1, oCreate);

			this._getReqModel().setProperty("/view", state);
		},

		async _showItemList(state) {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			await this._removeByLocalId("request_create_item_fragment");

			const oList = await this._getFormFragment("req_item_list");
			await this._replaceContentAt(oPage, 1, oList);

			var status = this._getReqModel().getProperty("/req_header/reqstatus");
			if (status != 'DRAFT' && status != 'DELETED') {
				const oReq = this.getOwnerComponent().getModel('approval_log');
				const oViewModel = this.getOwnerComponent().getModel('employee_view');
				ApprovalLog.getApproverList(oReq, oViewModel, oReq.getProperty('req_header/reqid'));
				const oApproval = await this._getFormFragment("approval_log");
				await this._replaceContentAt(oPage, 2, oApproval);
			}

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
						content: [new Label({ text: "You haven't submit, do you confirm to go back?" })],
						beginButton: new Button({
							type: "Emphasized",
							text: "Confirm",
							press: async function () {
								this.oBackDialog.close();
								PARequestSharedFunction._ensureRequestModelDefaults(oReqModel);
								await this._removeByLocalId("req_approval_log");
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
			const oReq = this._getReqModel();
			const empId = oReq.getProperty("/user");
			const reqId = String(oReq.getProperty("/req_header/reqid") || "").trim();
			const oModel = this.getOwnerComponent().getModel();

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
			const oReq = this._getReqModel();
			const oModel = this.getOwnerComponent().getModel();
			const sUpdateGroupId = "$auto";

			const oListBinding = oModel.bindList("/ZREQUEST_HEADER", null, null, [
				new sap.ui.model.Filter("EMP_ID", sap.ui.model.FilterOperator.EQ, empId),
				new sap.ui.model.Filter("REQUEST_ID", sap.ui.model.FilterOperator.EQ, reqId)
			], {
				$$updateGroupId: sUpdateGroupId,
				$$ownRequest: true
			});

			try {
				const aCtx = await oListBinding.requestContexts(0, 1);

				if (!aCtx || aCtx.length === 0) {
					throw new Error(`Header not found for EMP_ID=${empId}, REQUEST_ID=${reqId}`);
				}

				const oCtx = aCtx[0];

				const oData = oCtx.getObject();
				if (oData?.STATUS === "DELETED") {
					oReq.setProperty("/req_header/status", "DELETED");
					return;
				}

				oCtx.setProperty("STATUS", "DELETED");

				await oModel.submitBatch(sUpdateGroupId);
				oReq.setProperty("/req_header/status", "DELETED");
			} catch (err) {
				console.error("Update header to DELETED failed:", err);
				throw err;
			}
		},

		async onSubmitRequest() {
			const oReq = this._getReqModel();
			const oReqList = this.getOwnerComponent().getModel("request_status");
			const data = oReq.getData();
			const rows = oReq.getProperty("/req_item_rows") || [];

			if (!rows.length) {
				this._showMustAddClaimDialog();
				return;
			}

			const submissionType = "REQ";
			const reqId = String(data.req_header.reqid || "").trim();
			const empId = oReq.getProperty("/user");
			const reqDate = data.req_header.reqdate;
			const proj = "1";
			const reqCC = data.req_header.costcenter;
			const reqClaimType = data.req_header.claimtype;

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
								const oViewModel = this.getOwnerComponent().getModel('employee_view');

								// budget checking
								const dataRow = rows.map(({ CLAIM_TYPE_ITEM_ID, EST_AMOUNT, CASH_ADVANCE }) => ({
									claim_type_item: CLAIM_TYPE_ITEM_ID,
									amount: EST_AMOUNT
								}));
								const result = await budgetCheck.budgetChecking(oModel, submissionType, reqDate, proj, reqCC, reqClaimType, dataRow);

								if (result.passed) {

									await Utility._updateStatus(oModel, reqId, 'PENDING_APPROVAL');
									oReq.setProperty("/view", 'view');

									await PARequestSharedFunction.getPARHeaderList(oReqList, oViewModel);
									const oRouter = this.getOwnerComponent().getRouter();
									oRouter.navTo("RequestFormStatus");
								} else {
									MessageToast.show(`Please inform Cost Center owner to increase the budget for Claim Item ${result.aErrors} before submit Pre-Approval Request`);
								}
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

		async onDocLinkPress(oEvent) {
			var attachmentID = oEvent.getSource().getText();

			var sServiceUrl =
				"SuccessFactors_API/odata/v2/Attachment('" + attachmentID + "')";

			try {
				const response = await fetch(sServiceUrl, {
					method: "GET"
				});

				if (!response.ok) {
					const errText = await response.text().catch(() => "");
					throw new Error("HTTP " + response.status + " " + response.statusText + ": " + errText);
				}

				const xmlText = await response.text();

				// turn XML into JSON
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlText, "text/xml");

				// Check XML parsing errors
				const parseError = xmlDoc.querySelector("parsererror");
				if (parseError) {
					console.log("Failed to parse XML response.")
					throw new Error("Failed to parse XML response.");
				}

				// get content from xmlDoc
				const content = xmlDoc.querySelector("content");
				if (!content) {
					console.log("No attachment details found (missing <content>).")
					throw new Error("No attachment details found (missing <content>).");
				}

				const props = content.querySelector("properties");
				if (!props) {
					console.log("No attachment details found (missing <properties>).")
					throw new Error("No attachment details found (missing <properties>).");
				}

				const jsonData = {};

				// Only iterate element nodes
				const contentNodes = props.children;
				for (let i = 0; i < contentNodes.length; i++) {
					const node = contentNodes[i];
					jsonData[node.localName] = (node.textContent || "").trim();
				}

				// Validate required fields
				if (!jsonData.fileContent) {
					throw new Error("Attachment fileContent is empty or missing.");
				}
				if (!jsonData.mimeType) {
					jsonData.mimeType = "application/pdf"; // fallback
				}
				if (!jsonData.fileName) {
					jsonData.fileName = "Attachment";
				}

				// Convert base64 -> Blob
				const base64Encoded = jsonData.fileContent;
				// Decode base64 into bytes (note: atob works for base64)
				const decoded = atob(base64Encoded);
				const byteArray = new Uint8Array(decoded.length);

				for (let i = 0; i < decoded.length; i++) {
					byteArray[i] = decoded.charCodeAt(i);
				}

				const blob = new Blob([byteArray], { type: jsonData.mimeType });
				const pdfUrl = URL.createObjectURL(blob);

				// Create/reuse PDFViewer
				if (!this._PDFViewer) {
					this._PDFViewer = new sap.m.PDFViewer({
						isTrustedSource: true,
						width: "auto"
					});

					this.getView().addDependent(this._PDFViewer);

					// Optional: cleanup object URL when viewer closes
					this._PDFViewer.attachEventOnce("afterClose", function () {
						try {
							URL.revokeObjectURL(pdfUrl);
						} catch (e) {
							// ignore cleanup errors
						}
					});
				}

				console.log(pdfUrl);

				// Update viewer properties each time
				// this._PDFViewer.setTitle(
				// 	this._getTexti18n("pdfviewer_claimsummary_attachment", [jsonData.fileName])
				// );
				this._PDFViewer.setSource(pdfUrl);

				// Register blob as trusted/whitelisted (older UI5)
				jQuery.sap.addUrlWhitelist("blob");

				// Open viewer
				this._PDFViewer.open();
			} catch (error) {
				console.log("Error viewing attachment: ", error);
				MessageToast.show("Error viewing attachment: " + (error.message || error));
			}
		},

		async onAddItem(oEvent) {
			await this._showItemCreate("create");
			this._loadSelections();

			const oReq = this._getReqModel();
			const data = oReq.getData();

			data.req_item = {
				claim_type_item_id: "",
				cash_advance: "no_cashadv"
			};

			if (data.req_header.grptype === 'IND' || data.req_header.grptype === 'Individual') {
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

		onOpenItemView(oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ false);
		},

		onOpenItemEdit(oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ true);
		},

		_openItemFromList(oEvent, bEdit) {
			const oReq = this._getReqModel();
			const oTable = this.byId("req_item_table");

			let oCtx = null;
			const oRow = oEvent?.getParameter?.("row");
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
				req_subid: subId,
				claim_type: row.CLAIM_TYPE_ID || "",
				claim_type_item_id: row.CLAIM_TYPE_ITEM_ID || "",
				est_amount: row.EST_AMOUNT ?? "",
				est_no_participant: row.EST_NO_PARTICIPANT ?? "",
				start_date: row.START_DATE || "",
				end_date: row.END_DATE || "",
				location: row.LOCATION || "",
				cash_advance: row.CASH_ADVANCE || "no_cashadv",
				remark: row.REMARK || ""
			});

			oReq.setProperty("/view", bEdit ? "i_edit" : "view");

			this._showItemCreate(oReq.getProperty("/view"));
			this._loadParticipantsForItem(reqId, subId);
			this._getClaimTypeItemSelection();
			this.getFieldVisibility_ClaimTypeItem(oEvent);
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
						new sap.ui.model.Filter({ path: "REQUEST_ID", operator: sap.ui.model.FilterOperator.EQ, value1: reqId }),
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

				aMapped.push({ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" });

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
			var oReqModel = this._getReqModel();
			var oCreate = this.byId('request_create_item_fragment');
			if (oCreate) {
				this._showItemList('view');
				oReqModel.setProperty('/req_item', {});
			} else {
				PARequestSharedFunction._ensureRequestModelDefaults(oReqModel);
				await this._removeByLocalId("req_approval_log");
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
				if (sPreviousHash) {
					window.history.go(-1);
				} else {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("RequestFormStatus");
				}
			}
		},

		/* =========================================================
		* Item List: Delete Row(s)
		* ======================================================= */

		async onRowDeleteReqItem(oEvent) {
			const oTable = this._resolveControl("req_item_table_d", "request") || this._resolveControl("req_item_table", "request");
			const oReq = this._getReqModel();
			const aRows = oReq.getProperty("/req_item_rows") || [];

			let iFromAction = null;
			const oRow = oEvent.getParameter && oEvent.getParameter("row");
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
			const oModel = this.getOwnerComponent().getModel();
			const sGroup = "deleteItemCascade";

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
						new sap.ui.model.Filter({ path: "REQUEST_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vReq }),
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
						new sap.ui.model.Filter({ path: "REQUEST_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vReq }),
						new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vSub })
					], {
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
			if (oReq.getProperty("/req_header/grptype") !== "Group") return;

			const src = oEvent.getSource();
			const sVal = (oEvent.getParameter && oEvent.getParameter("value"))
				?? (src?.getValue?.() ?? "");
			const sTrim = String(sVal).trim();

			const oCtx = src.getBindingContext("request");
			if (!oCtx) return;

			const path = oCtx.getPath();
			const segs = path.split("/");
			const idx = parseInt(segs[segs.length - 1], 10);
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
			const oReq = this._getReqModel();
			let aRows = oReq.getProperty("/participant") || [];

			let idxFromAction = null;
			const oRow = oEvent.getParameter && oEvent.getParameter("row");
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

					const row = aRows[i] || {};
					const pid = String(row.PARTICIPANTS_ID ?? row.PARTICIPANT_ID ?? "").trim();
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
							new sap.ui.model.Filter({ path: "REQUEST_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vReq }),
							new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vSub }),
							new sap.ui.model.Filter({ path: "PARTICIPANTS_ID", operator: sap.ui.model.FilterOperator.EQ, value1: vPid })
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


		async deleteAttachment(attachmentID) {
			var url = `SuccessFactors_API/odata/v2/Attachment(attachmentId=${attachmentID})`;

			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const text = await response.text().catch(() => '');
				throw new Error(`Delete failed: ${response.status} ${response.statusText} ${text}`);
			}

			return true;
		},

		async onSave() {
			const oReq = this._getReqModel();
			const data = oReq.getData();
			const oModel = this.getOwnerComponent().getModel();

			const reqId = String(data.req_header.reqid || "").trim();
			const isEdit = oReq.getProperty("/view") === "i_edit";

			const claimType = data.req_header.claimtype;
			const claimItem = data.req_item.claim_type_item_id;
			const estAmt = parseFloat(data.req_item.est_amount || 0);
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
					sap.m.MessageToast.show("Please ensure that the total amount in the participant list does NOT exceeds the Estimated Amount entered in the Request Details section.");
					return;
				}

				if (isEdit) {
					const subId = String(data.req_item.req_subid || "").trim();
					if (!subId) throw new Error("Missing Request Sub ID for edit");

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

					oItemCtx.setProperty("CLAIM_TYPE_ID", claimType);
					oItemCtx.setProperty("CLAIM_TYPE_ITEM_ID", claimItem);
					oItemCtx.setProperty("EST_AMOUNT", estAmt);
					oItemCtx.setProperty("EST_NO_PARTICIPANT", estNoPart);
					oItemCtx.setProperty("START_DATE", data.req_item.start_date || null);
					oItemCtx.setProperty("END_DATE", data.req_item.end_date || null);
					oItemCtx.setProperty("LOCATION", data.req_item.location || "");
					oItemCtx.setProperty("REMARK", data.req_item.remark || "");

					await this._replaceParticipantsForItem(reqId, subId, data.participant);

					await oModel.submitBatch("itemSave");

					await this._getItemList(reqId);
					await this._showItemList("list");

					sap.m.MessageToast.show("Updated Successfully");
					return;
				}

				const nr = await this.getCurrentReqNumber("NR03");
				if (!nr) throw new Error("Number range not available");

				const requestSubId = String(nr.result);

				const oReqModel = this.getView().getModel("request");
				const oData = oReqModel.getProperty("/req_item");

				if (oData.doc1) {
					var attachment_1 = await this.getFileAsBinary("i_attachment_1_file");
					var attachment1_ID = await this.postFilesToSF(oData.doc1, attachment_1);
				}
				if (oData.doc2) {
					var attachment_2 = await this.getFileAsBinary("i_attachment_2_file");
					var attachment2_ID = await this.postFilesToSF(oData.doc2, attachment_2);
				}

				console.log(attachment1_ID)
				console.log(attachment2_ID)

				const oItemCtx = oModel.bindList("/ZREQUEST_ITEM").create(
					{
						REQUEST_ID: reqId,
						REQUEST_SUB_ID: requestSubId,
						CLAIM_TYPE_ID: claimType,
						CLAIM_TYPE_ITEM_ID: claimItem,
						EST_AMOUNT: estAmt,
						EST_NO_PARTICIPANT: estNoPart,
						START_DATE: data.req_item.start_date || null,
						END_DATE: data.req_item.end_date || null,
						LOCATION: data.req_item.location || "",
						REMARK: data.req_item.remark || "",
						ATTACHMENT1: attachment1_ID,
						ATTACHMENT2: attachment2_ID
					},
					{ $$updateGroupId: "itemCreate" }
				);

				const parts = data.participant || [];
				for (const p of parts) {
					const pid = String(p.PARTICIPANTS_ID || "").trim();
					if (!pid) continue;

					const alloc = parseFloat(p.ALLOCATED_AMOUNT || 0);

					const oContent = oModel.bindList("/ZREQ_ITEM_PART").create(
						{
							REQUEST_ID: reqId,
							REQUEST_SUB_ID: requestSubId,
							PARTICIPANTS_ID: pid,
							ALLOCATED_AMOUNT: alloc
						},
						{ $$updateGroupId: "itemCreate" }
					);

					oContent.created().then(() => {
						this.postMDF(reqId, requestSubId, attachment1_ID, attachment2_ID);
					})
				}

				await oModel.submitBatch("itemCreate");

				// await this.updateCurrentReqNumber("NR03", nr.current);

				await this._getItemList(reqId);
				await this._showItemList("list");

				sap.m.MessageToast.show("Saved Successfully");

			} catch (e) {
				sap.m.MessageToast.show(e.message || "Save failed");
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}
		},

		onImportChange1(oEvent) {
			this._ReqAttachmentFile1 = oEvent.getParameters("files").files[0];
		},

		onImportChange2(oEvent) {
			this._ReqAttachmentFile2 = oEvent.getParameters("files").files[0];
		},

		getFileAsBinary: function (attachmentID) {

			return new Promise((resolve, reject) => {

				const file =
					attachmentID === 'i_attachment_1_file'
						? this._ReqAttachmentFile1
						: this._ReqAttachmentFile2;

				// Validate file presence
				if (!file) {
					reject(new Error('No file selected.'));
					sap.ui.core.BusyIndicator.hide();
					return;
				}

				// Validate type
				const check = this.isAllowedFile(file);
				if (!check.ok) {
					reject(new Error(check.reason));
					MessageToast.show(new Error(check.reason));
					sap.ui.core.BusyIndicator.hide();
					return;
				}

				var reader = new FileReader();
				reader.onload = (e) => {
					var vContent = e.currentTarget.result;
					console.log(vContent.split(",")[1])
					resolve(vContent.split(",")[1]);
				}

				reader.onerror = (e) => {
					reject(new Error(`Failed to read file: ${e?.target?.error?.message || 'Unknown error'}`));
				};

				if (attachmentID == 'i_attachment_1_file') {
					reader.readAsDataURL(this._ReqAttachmentFile1);
				}
				else if (attachmentID == 'i_attachment_2_file') {
					reader.readAsDataURL(this._ReqAttachmentFile2);
				}
			})
		},

		isAllowedFile(file) {

			const ALLOWED_MIME_TYPES = new Set([
				'application/pdf',
				'image/jpeg',
				'image/png',
			]);

			const ALLOWED_EXTENSIONS = new Set([
				'pdf', 'jpg', 'jpeg', 'png'
			]);

			if (!file) return { ok: false, reason: 'No file provided.' };

			// Prefer MIME type check
			const mime = (file.type || '').toLowerCase().trim();
			if (mime) {
				// Allow any image/* plus application/pdf, but also restrict to known image types above for safety.
				const isPdf = mime === 'application/pdf';
				const isImage = mime.startsWith('image/') && ALLOWED_MIME_TYPES.has(mime);
				if (isPdf || isImage) {
					return { ok: true };
				}
			}

			// Fallback to extension if MIME is missing or generic (e.g., application/octet-stream)
			const name = file.name || '';
			const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
			if (ALLOWED_EXTENSIONS.has(ext)) {
				return { ok: true };
			}

			return { ok: false, reason: 'Only PDF and image files are allowed.' };
		},

		postMDF: async function (reqID, reqSubID, attachment1, attachment2) {
			// Write to Success Factors API
			var sServiceUrl = "SuccessFactors_API/odata/v2/cust_EPF_CLAIM_ATTACHMENTS";

			try {
				const response = await fetch(sServiceUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						__metadata: {
							uri: 'cust_EPF_CLAIM_ATTACHMENTS'
						},
						Claim_Sub_ID: reqSubID,
						cust_EPF_CLAIM_ATTACHMENTS_Parent_Claim_ID: reqID,

						cust_attachment1Nav: {
							__metadata: {
								uri: `Attachment('${attachment1}')`
							}
						},
						...(String(attachment2).trim().length > 0 && attachment2 ? {
							cust_Parent_attachment2Nav: {
								__metadata: {
									uri: `Attachment('${attachment2}')`
								}
							}
						} : {}
						)
					})
				});

				if (!response.ok) {
					const errText = await response.text().catch(() => "");
					throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText}`);
				}
				else {
					console.log("MDF Updated")
				}

			} catch (error) {
				console.log("Error creating MDF: " + error);
				MessageToast.show("Error creating MDF: " + error);
				return false;
			}
		},

		postFilesToSF: async function (fileName, fileString) {

			// Write to Success Factors API
			var sServiceUrl = "SuccessFactors_API/odata/v2/Attachment";

			try {
				const response = await fetch(sServiceUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						__metadata: {
							uri: 'Attachment'
						},
						deletable: true,
						fileName: fileName,
						moduleCategory: 'UNSPECIFIED',
						module: 'DEFAULT',
						userId: 'SFAPI',
						viewable: true,
						searchable: true,
						fileContent: fileString
					})
				});

				if (!response.ok) {
					const errText = await response.text().catch(() => "");
					throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText}`);
				}

				const data = await response.text();

				// turn XML into JSON
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(data, 'text/xml');
				const jsonData = {};

				const nodes = xmlDoc.documentElement.childNodes;
				for (let i = 0; i < nodes.length; i++) {
					const node = nodes[i];
					if (node.nodeType === 1) {
						jsonData[node.nodeName] = node.textContent.trim();
					}
				}

				var attachmentNumber = jsonData.id.slice(jsonData.id.indexOf('(') + 1, jsonData.id.indexOf(')') - 1);

				return attachmentNumber;
			} catch (error) {
				console.log("Error uploading attachment: " + error);
				MessageToast.show("Error uploading attachment: " + error);
				return false;
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
						new sap.ui.model.Filter({ path: "REQUEST_ID", operator: "EQ", value1: requestId }),
						new sap.ui.model.Filter({ path: "REQUEST_SUB_ID", operator: "EQ", value1: requestSubId })
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$select: "PARTICIPANTS_ID"
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
							REQUEST_ID: requestId,
							REQUEST_SUB_ID: requestSubId,
							PARTICIPANTS_ID: pid,
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

		onCancelItem() {
			const oReq = this._getReqModel();
			const data = oReq.getData();
			const reqId = String(data.req_header.reqid || "").trim();
			oReq.setProperty('/req_item', {})

			this._getItemList(reqId);
			this._showItemList('list');
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

			const oModel = this.getOwnerComponent().getModel("employee_view");
			const oListBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", null, null, [
				new sap.ui.model.Filter("REQUEST_ID", "EQ", req_id)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, 1);

				if (aCtx.length > 0) {
					const oData = aCtx[0].getObject();
					oReq.setProperty("/req_header", {
						purpose: oData.OBJECTIVE_PURPOSE || "",
						reqid: oData.REQUEST_ID || "",
						tripstartdate: oData.TRIP_START_DATE || "",
						tripenddate: oData.TRIP_END_DATE || "",
						eventstartdate: oData.EVENT_START_DATE || "",
						eventenddate: oData.EVENT_END_DATE || "",
						location: oData.LOCATION || "",
						grptype: oData.IND_OR_GROUP_DESC || "",
						transport: oData.TYPE_OF_TRANSPORTATION || "",
						reqstatus: oData.STATUS_DESC || "",
						costcenter: oData.COST_CENTER || "",
						altcostcenter: oData.ALTERNATE_COST_CENTER || "",
						cashadvamt: oData.CASH_ADVANCE || 0,
						reqamt: oData.PREAPPROVAL_AMOUNT || 0,
						reqtype: oData.REQUEST_TYPE_DESC || "",
						comment: oData.REMARK || "",
						doc1: oData.ATTACHMENT1 || "",
						doc2: oData.ATTACHMENT2 || "",
						claimtype: oData.CLAIM_TYPE_ID || "",
						claimtypedesc: oData.CLAIM_TYPE_DESC || "",
						reqdate: oData.REQUEST_DATE
					});

				} else {
					console.warn("Request Id " + reqid + " not found");

				}

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
			const sEmp = String(oReq.getProperty('/user'));

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
				this.updateRequestAmount(sEmp, sReq, cashadv_amt, req_amt);

				return a;
			} catch (err) {
				console.error("OData V4 bindList failed:", err);
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}
		},

		async updateRequestAmount(empId, reqId, cashadvamt, reqamt) {
			try {
				sap.ui.core.BusyIndicator.show(0);
				const oModel = this.getOwnerComponent().getModel();

				const oListBinding = oModel.bindList("/ZREQUEST_HEADER", null, null,
					[
						new sap.ui.model.Filter({ path: "EMP_ID", operator: sap.ui.model.FilterOperator.EQ, value1: empId }),
						new sap.ui.model.Filter({ path: "REQUEST_ID", operator: sap.ui.model.FilterOperator.EQ, value1: reqId })
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

				oCtx.setProperty("CASH_ADVANCE", parseFloat(cashadvamt));
				oCtx.setProperty("PREAPPROVAL_AMOUNT", parseFloat(reqamt));

				await oModel.submitBatch("$auto");
			} catch (e) {
				sap.m.MessageToast.show(e.message || "Submission failed");
			} finally {
				sap.ui.core.BusyIndicator.hide();
			}
		},

		async getCurrentReqNumber(range_id) {
			const oModel = this.getOwnerComponent().getModel();

			try {
				const oListBinding = oModel.bindList("/ZNUM_RANGE", null, null,
					[
						new Filter({ path: "RANGE_ID", operator: sap.ui.model.FilterOperator.EQ, value1: range_id })
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

		/* =========================================================
		* Participant Value Help 
		* ======================================================= */

		onValueHelpRequest(oEvent) {
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

		onParticipantInputChange(oEvent) {
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

		onValueHelpConfirm(oEvent) {
			const oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				const sPath = this._oInputSource.getBindingContext("request").getPath();
				const oEmpData = oSelectedItem.getBindingContext().getObject();
				this._updateParticipantData(sPath, oEmpData);
				this.appendNewRow(oEvent);
			}
		},

		_updateParticipantData(sRowPath, oEmpData) {
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

		onValueHelpSearch(oEvent) {
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

		onExport() {
			var oModel = this.getView().getModel("request");
			var aData = oModel.getProperty("/participant") || [];

			// Logic: If the array is empty OR the first row's EEID is falsy, export an empty list.
			// Otherwise, export the full list.
			var aExportData = (aData.length > 0 && aData[0].PARTICIPANTS_ID) ? aData : [];
			var filename = this._getExcelFileName("participant");

			var aCols = this._createColumnConfig();
			var oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: aExportData,
				fileName: filename,
				worker: false // Set to false for small datasets or if debugging
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					sap.m.MessageToast.show("Export successful");
				})
				.finally(function () {
					oSheet.destroy();
				});
		},

		_createColumnConfig() {
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


				var fu = this.byId("participant_list_upload");
				fu.clear();

			}.bind(this);

			reader.readAsArrayBuffer(file);
		},

		_sanitizeFileName(s) {
			return (s || "")
				.replace(/[\\/:*?"<>|]/g, "_")
				.replace(/\s+/g, " ")
				.trim()
				.substring(0, 80);
		},

		_getTodayString() {
			const d = new Date();
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${y}-${m}-${day}`;
		},

		_getExcelFileName(is_participant) {
			if (is_participant == 'participant') {
				const input = this.getOwnerComponent().getModel("request")?.getData() || {};
				const id = input?.req_header?.reqid || "";
				const subid = input?.req_item?.req_subid || "";

				return this._sanitizeFileName(`Pre_Approval_Request_${id}_${subid}_Participant_Data.xlsx`);
			} else {
				const input = this.getOwnerComponent().getModel("request")?.getData() || {};
				const id = input?.req_header?.reqid || "";

				return this._sanitizeFileName(`Pre_Approval_Request_${id}_${this._getTodayString()}.xlsx`);
			}
		},

		_toDate(val) {

			if (!val) return null;

			// ISO 8601 with or without milliseconds
			if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/i.test(val)) {
				const d = new Date(val);
				if (!isNaN(d.getTime())) {
					return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
				}
				return null;
			}

			// YYYY-MM-DD
			if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
				const [y, m, d] = val.split("-").map(Number);
				return new Date(Date.UTC(y, m - 1, d));
			}

			// JS Date
			if (val instanceof Date && !isNaN(val.getTime())) {
				return new Date(Date.UTC(val.getFullYear(), val.getMonth(), val.getDate()));
			}

			// SAP Edm.Date { year, month, day }
			if (typeof val === "object" && val.year && val.month && val.day) {
				return new Date(Date.UTC(val.year, val.month - 1, val.day));
			}

			return null;
		},

		async onDownloadExcelReport() {
			const oView = this.getView();
			const XLSX = window.XLSX;
			const that = this;

			function _num(val) {
				if (val === null || val === undefined || val === "") return null;
				const n = Number(val);
				return Number.isFinite(n) ? n : null;
			}

			function _applyColumnMeta(ws, columns, startDataRow) {
				ws["!cols"] = columns.map(c => ({ wch: c.width || 12 }));

				const ref = ws["!ref"];
				if (!ref) return;

				const range = XLSX.utils.decode_range(ref);

				for (let c = 0; c < columns.length; c++) {
					const meta = columns[c];
					if (!meta.type) continue;

					for (let r = startDataRow; r <= range.e.r; r++) {
						const addr = XLSX.utils.encode_cell({ c, r });
						const cell = ws[addr];
						if (!cell) continue;

						// FORCE DATE FORMAT YYYY-MM-DD

						if (meta.type === "date") {
							const dt = that._toDate(cell.v);

							if (dt) {
								cell.t = "d";
								cell.v = dt;
								cell.z = "yyyy-mm-dd";
							} else {
								// clear invalid date to avoid showing 1970-01-01
								delete ws[addr];
							}
						}


						// Numbers
						if (meta.type === "number") {
							const n = _num(cell.v);
							if (n === null) {
								delete ws[addr];
							} else {
								cell.t = "n";
								cell.v = n;
								cell.z = meta.scale === 2 ? "#,##0.00" : "#,##0";
							}
						}
					}
				}
			}

			try {
				oView.setBusy(true);

				const input = this.getOwnerComponent().getModel("request")?.getData();
				if (!input) {
					sap.m.MessageToast.show("No request data loaded.");
					return;
				}

				const header = input.req_header || {};
				const items = input.req_item_rows || [];
				const item_part = await this._getParticipantsList(header.reqid);

				// -------------------------------
				// Build Header Row
				// -------------------------------
				const headerRow = {
					"Request ID": header.reqid,
					"Purpose": header.purpose,
					"Trip Start Date": header.tripstartdate,
					"Trip End Date": header.tripenddate,
					"Event Start Date": header.eventstartdate,
					"Event End Date": header.eventenddate,
					"Location": header.location || "",
					"Individual/Group": header.grptype || "",
					"Type of Transportation": header.transport || "",
					"Request Status": header.reqstatus,
					"Cost Center": header.cc,
					"Alternate Cost Center": header.acc || "-",
					"Cash Advance (MYR)": header.cashadvamt,
					"Pre Approval Amount (MYR)": header.reqamt,
					"Request Type": header.reqtype,
					"Comment": header.comment || "",
					"Claim Type": header.claimtype,
				};

				const headerColumns = [
					{ label: "Request ID", property: "Request ID", type: "string" },
					{ label: "Purpose", property: "Purpose", type: "string" },
					{ label: "Trip Start Date", property: "Trip Start Date", type: "date" },
					{ label: "Trip End Date", property: "Trip End Date", type: "date" },
					{ label: "Event Start Date", property: "Event Start Date", type: "date" },
					{ label: "Event End Date", property: "Event End Date", type: "date" },
					{ label: "Location", property: "Location", type: "string" },
					{ label: "Individual/Group", property: "Individual/Group", type: "string" },
					{ label: "Type of Transportation", property: "Type of Transportation", type: "string" },
					{ label: "Request Status", property: "Request Status", type: "string" },
					{ label: "Cost Center", property: "Cost Center", type: "string" },
					{ label: "Alternate Cost Center", property: "Alternate Cost Center", type: "string" },
					{ label: "Cash Advance (MYR)", property: "Cash Advance (MYR)", type: "number", scale: 2 },
					{ label: "Pre Approval Amount (MYR)", property: "Pre Approval Amount (MYR)", type: "number", scale: 2 },
					{ label: "Request Type", property: "Request Type", type: "string" },
					{ label: "Comment", property: "Comment", type: "string" },
					{ label: "Claim Type", property: "Claim Type", type: "string" }
				];

				const headerLabels = headerColumns.map(c => c.label);
				const headerValues = headerColumns.map(c => headerRow[c.property] ?? "");

				const wsHeader = XLSX.utils.aoa_to_sheet([headerLabels, headerValues]);
				_applyColumnMeta(wsHeader, headerColumns, 1);

				// -------------------------------
				// Items Sheet
				// -------------------------------
				const itemsColumns = [
					{ label: "Employee ID", property: "EMP_ID", type: "string" },
					{ label: "Request ID", property: "REQUEST_ID", type: "string" },
					{ label: "Request Sub ID", property: "REQUEST_SUB_ID", type: "string" },
					{ label: "Claim Type ID", property: "CLAIM_TYPE_ID", type: "string" },
					{ label: "Claim Type Desc", property: "CLAIM_TYPE_DESC", type: "string" },
					{ label: "GL Account", property: "GL_ACCOUNT", type: "string" },
					{ label: "Claim Type Item ID", property: "CLAIM_TYPE_ITEM_ID", type: "string" },
					{ label: "Claim Type Item Desc", property: "CLAIM_TYPE_ITEM_DESC", type: "string" },
					{ label: "Cost Center", property: "COST_CENTER", type: "string" },
					{ label: "Material Code", property: "MATERIAL_CODE", type: "string" },
					{ label: "Number of days", property: "NO_OF_DAYS", type: "number" },
					{ label: "Purpose", property: "PURPOSE", type: "string" },
					{ label: "Est. Amount (MYR)", property: "EST_AMOUNT", type: "string" },
					{ label: "Dependent", property: "DEPENDENT", type: "string" },
					{ label: "Dependent Name", property: "LEGAL_NAME", type: "string" },
					{ label: "Dependent Relationship", property: "RELATIONSHIP", type: "string" },
					{ label: "Remarks/Justification", property: "REMARK", type: "string" },
					{ label: "Course Title", property: "COURSE TITLE", type: "string" },
					{ label: "KWSP Sport Represent", property: "KWSP_SPORTS_REPRESENTATION", type: "string" },
					{ label: "Sport Represent Desc", property: "SPORTS_REPRESENTATION_DESC", type: "string" },
					{ label: "Declare Club Membership", property: "DECLARE_CLUB_MEMBERSHIP", type: "string" },
					{ label: "Category/Purpose (Mobile) ID", property: "MOBILE_CATEGORY_PURPOSE_ID", type: "string" },
					{ label: "Category/Purpose (Mobile) Desc", property: "MOBILE_CATEGORY_PURPOSE_DESC", type: "string" },
					{ label: "Attachment 1", property: "ATTACHMENT 1", type: "string" },
					{ label: "Attachment 2", property: "ATTACHMENT 2", type: "string" },
					{ label: "Start Date", property: "START DATE", type: "date" },
					{ label: "End Date", property: "END DATE", type: "date" },
					{ label: "Vehicle Ownership ID", property: "VEHICLE OWNERSHIP_ID", type: "string" },
					{ label: "Vehicle Ownership Desc", property: "VEHICLE OWNERSHIP_DESC", type: "string" },
					{ label: "Room Type", property: "ROOM TYPE", type: "string" },
					{ label: "Room Type Desc", property: "ROOM_TYPE_DESC", type: "string" },
					{ label: "Country", property: "COUNTRY", type: "string" },
					{ label: "Location", property: "LOCATION", type: "string" },
					{ label: "Negara/Wilayah", property: "AREA", type: "string" },
					{ label: "Description", property: "AREA_DESC", type: "string" },
					{ label: "Number of Family Member", property: "FAMILY_COUNT", type: "number" },
					{ label: "Vehicle Type", property: "VEHICLE_TYPE", type: "string" },
					{ label: "vehicle Type Desc", property: "VEHICLE_TYPE_DESC", type: "string" },
					{ label: "Kilometer", property: "KILOMETER", type: "number" },
					{ label: "Rate per KM ID", property: "RATE PER KM (RATE_KM_ID)", type: "string" },
					{ label: "Rate", property: "RATE", type: "number" },
					{ label: "Toll", property: "TOLL", type: "string" },
					{ label: "Flight Class ID", property: "FLIGHT CLASS", type: "string" },
					{ label: "Flight Class Desc", property: "FLIGHT_CLASS_DESC", type: "string" },
					{ label: "Location Type", property: "LOCATION TYPE", type: "string" },
					{ label: "Location Type Desc", property: "LOC_TYPE_DESC", type: "string" },
					{ label: "From State", property: "FROM STATE", type: "string" },
					{ label: "From Location", property: "FROM LOCATION", type: "string" },
					{ label: "From Location (Office)", property: "FROM_LOCATION_OFFICE", type: "string" },
					{ label: "To State", property: "TO STATE", type: "string" },
					{ label: "To Location", property: "TO LOCATION", type: "string" },
					{ label: "To Location (Office)", property: "TO_LOCATION_OFFICE", type: "string" },
					{ label: "Mode of Transfer", property: "MODE OF TRANSFER", type: "string" },
					{ label: "Tarikh Pindah", property: "TARIKH PINDAH", type: "date" },
					{ label: "Region", property: "REGION", type: "string" },
					{ label: "Region Description", property: "REGION_DESC", type: "string" },
					{ label: "Marriage Category ID", property: "MARRIAGE_CATEGORY", type: "string" },
					{ label: "Marriage Category Desc", property: "MARRIAGE_CATEGORY_DESC", type: "string" },
					{ label: "Member Cube (Eligible)", property: "MEMBER CUBE ELIGIBLE", type: "string" },
					{ label: "Member Cube (Actual)", property: "MEMBER CUBE ACTUAL", type: "string" },
					{ label: "Departure Time", property: "DEPARTURE TIME", type: "time" },
					{ label: "Arrival Time", property: "ARRIVAL TIME", type: "time" },
					{ label: "Lodging Category ID", property: "LODGING CATEGORY", type: "string" },
					{ label: "Lodging Category Desc", property: "LODGING_CATEGORY_DESC", type: "string" },
					{ label: "Estimated Participants", property: "ESTIMATED PARTICIPANTS", type: "string" },
					{ label: "Cash Advance (Yes/No)", property: "CASH ADVANCE", type: "string" }
				];

				const itemsLabels = itemsColumns.map(c => c.label);

				const itemRows = items.map(it => {
					return itemsColumns.map(c => {
						if (c.type === "date") return that._toDate(it[c.property]);
						if (c.type === "number") return _num(it[c.property]);
						return it[c.property] ?? "";
					});
				});

				const wsItems = XLSX.utils.aoa_to_sheet([itemsLabels, ...itemRows]);
				_applyColumnMeta(wsItems, itemsColumns, 1);

				// -------------------------------
				// Build Item Participants Row
				// -------------------------------

				const itemPartColumns = [
					{ label: "Request ID", property: "REQUEST_ID", type: "string", width: 15 },
					{ label: "Request Sub ID", property: "REQUEST_SUB_ID", type: "string", width: 15 },
					{ label: "Participant ID", property: "PARTICIPANTS_ID", type: "string", width: 13 },
					{ label: "Participant Name", property: "NAME", type: "string", width: 20 },
					{ label: "Cost Center", property: "CC", type: "string", width: 13 },
					{ label: "Allocated Amount (MYR)", property: "ALLOCATED_AMOUNT", type: "string", width: 21 }
				];

				const itemPartLabels = itemPartColumns.map(c => c.label);
				const itemPartValues = item_part.map(it => {
					return itemPartColumns.map(c => {
						if (c.type === "date") return that._toDate(it[c.property]);
						if (c.type === "number") return _num(it[c.property]);
						return it[c.property] ?? "";
					});
				});

				const wsItemParts = XLSX.utils.aoa_to_sheet([itemPartLabels, ...itemPartValues]);
				_applyColumnMeta(wsItemParts, itemPartColumns, 1);

				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(wb, wsHeader, "Header");
				XLSX.utils.book_append_sheet(wb, wsItems, "Items");
				XLSX.utils.book_append_sheet(wb, wsItemParts, "Participants");

				XLSX.writeFile(wb, this._getExcelFileName(), {
					bookType: "xlsx",
					cellDates: true,
					compression: true
				});

			} catch (e) {
				console.error("Excel export failed:", e);
				sap.m.MessageToast.show("Excel export failed.");
			} finally {
				oView.setBusy(false);
			}
		},

		async _getParticipantsList(reqid) {
			const oModel = this.getOwnerComponent().getModel('employee_view');
			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_PART_VIEW",
				null,
				[new sap.ui.model.Sorter("REQUEST_SUB_ID", false)],
				[new sap.ui.model.Filter({
					path: "REQUEST_ID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: reqid
				})],
				{
					$$ownRequest: true,
					$$groupId: "$auto"
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());
				return a;
			} catch (err) {
				console.error("OData V4 bindList failed:", err);
				return [];
			}
		},

		/* =========================================================
		* Create Item Selection Items
		* ======================================================= */

		_loadSelections() {
			this._getClaimTypeItemSelection();
			this.getDependent();
			this.calculateNumberOfDays();
		},

		async _getClaimTypeItemSelection() {
			const oReq = this._getReqModel();
			const data = oReq.getData();
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
						new sap.ui.model.Sorter("CLAIM_TYPE_ITEM_ID", false)
					],
					[
						new sap.ui.model.Filter({ path: "CLAIM_TYPE_ID", operator: "EQ", value1: claim_type_id }),
						new sap.ui.model.Filter({ path: "SUBMISSION_TYPE", operator: 'NE', value1: "ST0001" })
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
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

		getDependent() {
			const oReq = this._getReqModel();
			const empId = oReq.getProperty("/user");
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZEMP_DEPENDENT", null, null, [
				new Filter("EMP_ID", FilterOperator.EQ, empId)
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				this._getReqModel().setProperty('/ZEMP_DEPENDENT', aData);
			}).catch(err => console.error("RequestType Load Failed", err));
		},

		calculateNumberOfDays() {
			const oReq = this._getReqModel();
			const oData = oReq.getData();

			let headerStart = oData.req_header.tripstartdate ? new Date(oData.req_header.tripstartdate) : null;
			let headerEnd = oData.req_header.tripenddate ? new Date(oData.req_header.tripenddate) : null;

			let itemStart = oData.req_item.start_date ? new Date(oData.req_item.start_date) : null;
			let itemEnd = oData.req_item.end_date ? new Date(oData.req_item.end_date) : null;

			let finalStart = itemStart || headerStart;
			let finalEnd = itemEnd || headerEnd;

			if (!finalStart || !finalEnd || isNaN(finalStart) || isNaN(finalEnd)) {
				return 0;
			}

			const diffMs = finalEnd.getTime() - finalStart.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

			oData.req_item.no_of_days = diffDays;
			oReq.setData(oData);
		},

		/* =========================================================
		* Field Visibility Functions 
		* ======================================================= */

		getFieldVisibility_ClaimTypeItem: async function (oEvent) {
			const oModel = this.getOwnerComponent().getModel();

			const claimTypeItemFromSelect = oEvent?.getSource?.().getSelectedKey?.();
			const claimTypeItemFromModel = this._getReqModel().getProperty("/req_item/claim_type_item_id");
			const claim_type_item = claimTypeItemFromSelect || claimTypeItemFromModel;

			if (!claim_type_item) {
				console.warn("No req_type found yet.");
				return;
			}

			const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
				new sap.ui.model.Filter("SUBMISSION_TYPE", "EQ", "PREAPPROVAL_R"),
				new sap.ui.model.Filter("COMPONENT_LEVEL", "EQ", "ITEM"),
				new sap.ui.model.Filter("CLAIM_TYPE_ITEM_ID", "EQ", claim_type_item)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);

				if (!aCtx || aCtx.length === 0) {
					console.warn("No configuration rows for claim type item:", claim_type_item);
					this._setAllControlsVisible(false);
					return;
				}
				const oData = aCtx[0].getObject();

				const aFieldIds = oData.FIELD.replace(/[\[\]\s]/g, "").split(",");

				if (aFieldIds != []) {
					this._setAllControlsVisible(false);
					aFieldIds.forEach(id => {
						const control = this._resolveControl(id, "request");
						if (control && typeof control.setVisible === "function") {
							control.setVisible(true);
						} else {
							console.warn("Control not found or not visible-capable:", id);
						}
					});
				} else {
					this._setAllControlsVisible(false);
				}

			} catch (err) {
				console.error("OData bindList failed:", err);
				this._loadClaimTypeSelectionData(false);
			}
		},

		_setAllControlsVisible: function (bVisible) {
			const aControlIds = [
				"i_no_of_days_1",
				"i_purpose",
				"i_amount",
				"i_dependent",
				"i_remarks",
				"i_course_title",
				"i_sport_rep",
				"i_club_membership",
				"i_attachment_1",
				"i_category_purpose",
				"i_attachment_2",
				"i_no_of_days_2",
				"i_start_date",
				"i_end_date",
				"i_vehicle_ownership",
				"i_room_type",
				"i_country",
				"i_location",
				"i_negara_wilayah",
				"i_no_of_family_member",
				"i_type_of_vehicle",
				"i_kilometer",
				"i_rate_per_kilometer",
				"i_toll",
				"i_flight_class",
				"i_location_type",
				"i_from_state",
				"i_from_location",
				"i_from_location_office",
				"i_to_state",
				"i_to_location",
				"i_to_location_office",
				"i_mode_of_transfer",
				"i_tarikh_pindah",
				"i_no_of_days_3",
				"i_sss",
				"i_marriage_cat",
				"i_cube_eligible",
				"i_departure_time",
				"i_arrival_time",
				"i_cash_adv"
			];

			aControlIds.forEach(id => {
				const c = this._resolveControl(id, "request");
				if (c && typeof c.setVisible === "function") {
					c.setVisible(bVisible);
				}
			});
		},

		_resolveControl: function (sId, sFragmentId) {
			let c = this.getView().byId(sId);
			if (c) return c;

			if (sFragmentId) {
				c = sap.ui.core.Fragment.byId(this.getView().createId(sFragmentId), sId);
				if (c) return c;

				c = sap.ui.core.Fragment.byId(sFragmentId, sId);
				if (c) return c;
			}

			return sap.ui.getCore().byId(`${sFragmentId}--${sId}`) || sap.ui.getCore().byId(sId);
		},

		/* =========================================================
		* Approver Functions 
		* ======================================================= */
		onApproveRequest: function () {
			ApproveDialog.open(this);  // <--- clean and simple
		},

		onRejectRequest: function () {
			RejectDialog.open(this);
		},

		onSendBackRequest: function () {
			SendBackDialog.open(this);
		},


		onClickCancel_app: function () {
			// Close via the stored instance (util keeps it on controller)
			this.__approveDialog && this.__approveDialog.close();
		},

		onClickCreate_app: async function () {
			// Minimal validation for reject flow (reason + comment)
			const oReject = this.getView().getModel("Reject");
			const mode = oReject?.getProperty("/mode"); // "REJECT" here
			const reason = oReject?.getProperty("/rejectReasonKey");
			const comment = oReject?.getProperty("/approvalComment")?.trim();
			const accessModel = this.getOwnerComponent().getModel("access");
			const userId = accessModel?.getProperty("/userId");
			const requestModel = this.getView().getModel("request");
			const reqId = requestModel?.getProperty("/req_header/reqid")?.trim();

			const id = reqId;
			const userID = userId;
			const oModel = this.getOwnerComponent().getModel();
			const oModel2 = this.getOwnerComponent().getModel("employee_view");


			if (mode === "APPROVE") {
				if (!comment) {
					sap.m.MessageToast.show("Please enter approval comment.");
					return;
				}
				/* // TODO: Submit your reject action via OData here, then:
				this.__rejectDialog && this.__rejectDialog.close();
				sap.m.MessageToast.show("Rejected.");
				return; */

				/* try {
					await ApproverUtility.approveMultiLevel(oModel, id, userID, comment, oModel2);
					this.__approveDialog && this.__approveDialog.close();
					const oRouter = this.getOwnerComponent().getRouter();


					try {
						const { payloads } = await ApproverUtility.approveMultiLevel(
							oModel,
							id,
							userID,
							comment,
							oModel2
						);

						// Loop & send all payloads
						for (const p of payloads) {
							await workflowApproval.onSendEmailApprover(oModel, p);
						}

						this.__approveDialog && this.__approveDialog.close();
						const oRouter = this.getOwnerComponent().getRouter();
						setTimeout(() => oRouter.navTo("Dashboard", {}, true), 400);

					} catch (e) {
						sap.m.MessageToast.show(e.message);
					}

					setTimeout(() => {
						oRouter.navTo("Dashboard", {}, true); // true = replace history
					}, 400);


				} catch (e) {
					sap.m.MessageToast.show(e.message);
				} */

				try {

					// 1. Approve + get payloads from util
					const { payloads } = await ApproverUtility.approveMultiLevel(
						oModel,
						id,
						userID,
						comment,
						oModel2
					);

					// 2. Send emails (1 or 2 depending on next approver / sub approver)
					for (const p of payloads) {
						await workflowApproval.onSendEmailApprover(oModel, p);
					}

					// 3. Close dialog
					this.__approveDialog && this.__approveDialog.close();

					// 4. Navigate back after small delay
					const oRouter = this.getOwnerComponent().getRouter();
					setTimeout(() => {
						oRouter.navTo("Dashboard", {}, true);
					}, 400);

				} catch (e) {
					sap.m.MessageToast.show(e.message);
				}
			}
		},

		onSendBack_app: async function () {
			// Minimal validation for reject flow (reason + comment)
			const oReject = this.getView().getModel("Reject");
			const mode = oReject?.getProperty("/mode"); // "REJECT" here
			const reason = oReject?.getProperty("/rejectReasonKey");
			//const sendbackreason = oReject?.getProperty("/sendBackReasonKey");
			const comment = oReject?.getProperty("/approvalComment")?.trim();

			const accessModel = this.getOwnerComponent().getModel("access");
			const userId = accessModel?.getProperty("/userId");
			const requestModel = this.getView().getModel("request");
			const reqId = requestModel?.getProperty("/req_header/reqid")?.trim();
			const id = reqId;
			const userID = userId;

			//const displayUserId = Array.isArray(userId) ? userId.join(", ") : userCC;     // logged-in user
			const oModel = this.getOwnerComponent().getModel();


			if (mode === "SENDBACK") {
				if (!reason) {
					sap.m.MessageToast.show("Please select a Reject Reason.");
					return;
				}
				if (!comment) {
					sap.m.MessageToast.show("Please enter approval comment.");
					return;
				}
				// TODO: Submit your reject action via OData here, then:
				/* this.__rejectDialog && this.__rejectDialog.close();
				sap.m.MessageToast.show("Rejected.");
				return; */

				try {
					await ApproverUtility.rejectOrSendBackMultiLevel(oModel, id, userID, "STAT03", reason, comment);
					this.__sendBackDialog.close();
					const oRouter = this.getOwnerComponent().getRouter();

					setTimeout(() => {
						oRouter.navTo("Dashboard", {}, true); // true = replace history
					}, 400);
				} catch (e) {
					sap.m.MessageToast.show(e.message);
				}
			}
		},

		onReject_app: async function () {

			// Minimal validation for reject flow (reason + comment)
			const oReject = this.getView().getModel("Reject");
			const mode = oReject?.getProperty("/mode"); // "REJECT" here
			const reason = oReject?.getProperty("/rejectReasonKey");
			const comment = oReject?.getProperty("/approvalComment")?.trim();
			const accessModel = this.getOwnerComponent().getModel("access");
			const userId = accessModel?.getProperty("/userId");
			const requestModel = this.getView().getModel("request");
			const reqId = requestModel?.getProperty("/req_header/reqid")?.trim();
			const id = reqId;
			const userID = userId;

			//const displayUserId = Array.isArray(userId) ? userId.join(", ") : userCC;     // logged-in user
			const oModel = this.getOwnerComponent().getModel();


			if (mode === "REJECT") {
				if (!reason) {
					sap.m.MessageToast.show("Please select a Reject Reason.");
					return;
				}
				if (!comment) {
					sap.m.MessageToast.show("Please enter approval comment.");
					return;
				}
				/* 				// TODO: Submit your reject action via OData here, then:
								this.__rejectDialog && this.__rejectDialog.close();
								sap.m.MessageToast.show("Rejected.");
								return; */

				try {
					await ApproverUtility.rejectOrSendBackMultiLevel(oModel, id, userID, "STAT04", reason, comment);
					this.__rejectDialog.close();
					const oRouter = this.getOwnerComponent().getRouter();

					setTimeout(() => {
						oRouter.navTo("Dashboard", {}, true); // true = replace history
					}, 400);
				} catch (e) {
					sap.m.MessageToast.show(e.message);
				}
			}


		},




		onExit: function () {
			RejectDialog.destroy(this);
		}






	});
});