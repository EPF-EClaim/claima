sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/ui/core/ValueState",
	"sap/m/Button",
	"sap/m/ButtonType",
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
	"claima/utils/workflowApproval",
	"claima/utils/Attachment"

], function (
	Controller,
	MessageToast,
	JSONModel,
	Dialog,
	DialogType,
	ValueState,
	Button,
	ButtonType,
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
	workflowApproval,
	Attachment
) {
	"use strict";

	return Controller.extend("claima.controller.RequestForm", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */

		_ReqAttachmentFile1: null,
		_ReqAttachmentFile2: null,

		onInit() {
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
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

			this._loadRequest(sRequestId);
		},

		async _loadRequest(sReqId) {
			await this._getHeader(sReqId);
			await this._getItemList(sReqId, true);

			var sReqStatus = this._getReqModel().getProperty("/req_header/reqstatus");
			var bApproval = sReqStatus !== this._oConstant.RequestStatus.DRAFT && sReqStatus !== this._oConstant.RequestStatus.CANCELLED;
			if (bApproval) {
				const oReq = this.getOwnerComponent().getModel('approval_log');
				const oViewModel = this.getOwnerComponent().getModel('employee_view');
				ApprovalLog.getApproverList(oReq, oViewModel, sReqId);
				ApprovalLog._showApprovalLog(this);
			}
			PARequestSharedFunction._determineCurrentState(this, this._getReqModel());
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

			var sReqStatus = this._getReqModel().getProperty("/req_header/reqstatus");
			var bApproval = sReqStatus !== this._oConstant.RequestStatus.DRAFT && sReqStatus !== this._oConstant.RequestStatus.CANCELLED;
			if (bApproval) {
				const oReq = this.getOwnerComponent().getModel('approval_log');
				const oViewModel = this.getOwnerComponent().getModel('employee_view');
				ApprovalLog.getApproverList(oReq, oViewModel, oReq.getProperty('req_header/reqid'));
				const oApproval = await this._getFormFragment("approval_log");
				await this._replaceContentAt(oPage, 2, oApproval);
			}

			PARequestSharedFunction._determineCurrentState(this, this._getReqModel());
		},

		/* =========================================================
		* Footer / Navigation Buttons
		* ======================================================= */

		onBack() {
			const oReqModel = this._getReqModel();
			const oData = oReqModel.getData();
			if (oData.req_header.reqstatus == "DRAFT") {
				if (!this.oBackDialog) {
					this.oBackDialog = new Dialog({
						title: "Warning",
						type: DialogType.Message,
						state: ValueState.Warning,
						content: [new Label({ text: Utility.getText(this, "req_d_w_back") })],
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Confirm",
							press: async function () {
								this.oBackDialog.close();
								await PARequestSharedFunction._ensureRequestModelDefaults(oReqModel);
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
			const oReqModel = this._getReqModel();
			const sEmpId = oReqModel.getProperty("/user");
			const sReqId = String(oReqModel.getProperty("/req_header/reqid") || "").trim();

			if (!sEmpId || !sReqId) {
				MessageToast.show(Utility.getText(this, "req_tm_w_emp_id_req_id_not_found"));
				return;
			}

			if (!this.oDeleteDialog) {
				this.oDeleteDialog = new Dialog({
					title: "Delete Request",
					type: DialogType.Message,
					state: ValueState.Warning,
					content: [
						new Label({ text: Utility.getText(this, "req_d_w_delete") })
					],
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Delete",
						press: async () => {
							try {
								this.oDeleteDialog.getBeginButton().setEnabled(false);
								BusyIndicator.show(0);

								// update status to CANCELLED
								await Utility._updateStatus(oModel, sReqId, 'STAT07');

								MessageToast.show("Request deleted");
								this.oDeleteDialog.close();

								var oRouter = this.getOwnerComponent().getRouter();
								oRouter.navTo("Dashboard");

							} catch (e) {
								MessageToast.show(e.message || "Delete failed");
							} finally {
								BusyIndicator.hide();
								this.oDeleteDialog.getBeginButton().setEnabled(true);
							}
						}
					}),
					endButton: new Button({
						text: "Cancel",
						press: () => this.oDeleteDialog.close()
					})
				});
				this.getView().addDependent(this.oDeleteDialog);
			}

			this.oDeleteDialog.open();
		},

		async onSubmitRequest() {
			const oReqModel = this._getReqModel();
			const oReqList = this.getOwnerComponent().getModel("request_status");
			const oData = oReqModel.getData();
			const aRows = oReqModel.getProperty("/req_item_rows") || [];

			if (!aRows.length) {
				this._showMustAddClaimDialog();
				return;
			}

			const sSubmissionType = "REQ";
			const sReqId = String(oData.req_header.reqid || "").trim();
			const sEmpId = oReqModel.getProperty("/user");
			const sReqDate = oData.req_header.reqdate;
			const sProjCode = "1";
			const sReqCC = oData.req_header.costcenter;
			const sReqClaimType = oData.req_header.claimtype;

			if (!sReqId || !sEmpId) {
				MessageToast.show(Utility.getText(this, "req_tm_w_emp_id_req_id_not_found"));
				return;
			}

			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new Dialog({
					title: "Submit Request",
					type: DialogType.Message,
					content: [new Label({ text: Utility.getText(this, "req_d_w_submit") })],
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Submit",
						press: async () => {
							try {
								BusyIndicator.show(0);
								const oModel = this.getOwnerComponent().getModel();
								const oViewModel = this.getOwnerComponent().getModel('employee_view');

								// budget checking
								const aDataRows = aRows.map(({ CLAIM_TYPE_ITEM_ID, EST_AMOUNT, CASH_ADVANCE }) => ({
									claim_type_item: CLAIM_TYPE_ITEM_ID,
									amount: EST_AMOUNT
								}));
								const aResult = await budgetCheck.budgetChecking(oModel, sSubmissionType, sReqDate, sProjCode, sReqCC, sReqClaimType, aDataRows);

								if (aResult.passed) {

									await Utility._updateStatus(oModel, sReqId, 'PENDING_APPROVAL');
									oReqModel.setProperty("/view", 'view');

									// Add in onPARApproverDetermination function
									workflowApproval.onPARApproverDetermination(oModel, sReqId, oViewModel);

									await PARequestSharedFunction.getPARHeaderList(oReqList, oViewModel);
									const oRouter = this.getOwnerComponent().getRouter();
									oRouter.navTo("RequestFormStatus");

								} else {
									MessageToast.show(Utility.getText(this, "req_tm_w_inform_cc_owner", [aResult.aErrors]));
								}
							} catch (e) {
								MessageToast.show(e.message || "Submission failed");
							} finally {
								BusyIndicator.hide();
								this.oSubmitDialog.close();
							}
						}
					}),
					endButton: new Button({
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
				this._oAddClaimDialog = new Dialog({
					title: Utility.getText(this, "req_d_w_missing_item"),
					type: DialogType.Message,
					state: ValueState.Warning,
					content: [
						new Label({
							text: Utility.getText(this, "req_tm_w_submit"),
						})
					],
					beginButton: new Button({
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
			// calling function from Attachment.js
			Attachment.onViewDocument(this, oEvent.getSource().getText());
		},

		async onAddItem(oEvent) {
			await this._showItemCreate("create");
			this._loadSelections();

			const oReqModel = this._getReqModel();
			const oData = oReqModel.getData();
			const aIndividual = ['IND', 'Individual'];	// will move to constants.js 
			const sHeaderGrpType = oData.req_header.grptype;

			oData.req_item = {
				cash_advance: false
			};

			// if group type is Individual
			if (aIndividual.includes(sHeaderGrpType)) {
				const oEmp_data = await PARequestSharedFunction._getEmpIdDetail(this, oData.user);

				oData.participant = [{
					PARTICIPANTS_ID: oEmp_data ? oEmp_data.eeid : "",
					PARTICIPANT_NAME: oEmp_data ? oEmp_data.name : "",
					PARTICIPANT_COST_CENTER: oEmp_data ? oEmp_data.cc : "",
					ALLOCATED_AMOUNT: ""
				}];
			} else {
				oData.participant = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
			}
			oReqModel.setData(oData);
		},

		onOpenItemView(oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ false);
		},

		onOpenItemEdit(oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ true);
		},

		_openItemFromList(oEvent, bEdit) {
			const oReqModel = this._getReqModel();
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
				MessageToast.show(Utility.getText(this, "req_tm_w_select"));
				return;
			}

			const oReqItem = oCtx.getObject();
			const sReqId = String(oReqItem.REQUEST_ID || oReq.getProperty("/req_header/reqid") || "").trim();
			const sReqSubId = String(oReqItem.REQUEST_SUB_ID || "").trim();

			oReqModel.setProperty("/req_item", {
				req_subid				: sReqSubId,
				claim_type				: oReqItem.CLAIM_TYPE_ID || "",
				claim_type_item_id		: oReqItem.CLAIM_TYPE_ITEM_ID || "",
				no_of_days				: oReqItem.NO_OF_DAYS ?? 0,
				purpose					: oReqItem.PURPOSE || "",
				est_amount				: oReqItem.EST_AMOUNT ?? 0,
				dependent				: oReqItem.DEPENDENT || "",
				remark					: oReqItem.REMARK || "",
				course					: oReqItem.COURSE_TITLE || "",
				sport_rep				: oReqItem.KWSP_SPORTS_REPRESENTATION || "",
				club_membership			: oReqItem.DECLARE_CLUB_MEMBERSHIP || false,
				doc1					: oReqItem.ATTACHMENT1 || "",
				cat_purpose				: oReqItem.MOBILE_CATEGORY_PURPOSE_ID || "",
				doc2					: oReqItem.ATTACHMENT2 || "",
				start_date				: oReqItem.START_DATE || "",
				end_date				: oReqItem.END_DATE || "",
				start_time				: oReqItem.START_TIME || "",
				end_time				: oReqItem.END_TIME || "",
				vehicle_ownership		: oReqItem.VEHICLE_OWNERSHIP_ID || "",
				room_type				: oReqItem.ROOM_TYPE || "",
				country					: oReqItem.COUNTRY || "",
				location				: oReqItem.LOCATION || "",
				area					: oReqItem.AREA || "",
				no_of_family_member		: oReqItem.FAMILY_COUNT || 0,
				type_of_vehicle			: oReqItem.VEHICLE_TYPE || "",
				kilometer				: oReqItem.KILOMETER || 0,
				rate_per_kilometer		: oReqItem.RATE_PER_KM || 0,
				toll_amt				: oReqItem.TOLL || 0,
				flight_class			: oReqItem.FLIGHT_CLASS || "",
				location_type			: oReqItem.LOCATION_TYPE || "",
				from_state				: oReqItem.FROM_STATE_ID || "",
				from_location			: oReqItem.FROM_LOCATION || "",
				from_location_office	: oReqItem.FROM_LOCATION_OFFICE || "",
				to_state				: oReqItem.TO_STATE_ID || "",
				to_location				: oReqItem.TO_LOCATION || "",
				to_location_office		: oReqItem.TO_LOCATION_OFFICE || "",
				mode_of_transfer		: oReqItem.MODE_OF_TRANSFER || "",
				tarikh_pindah			: oReqItem.TRANSFER_DATE || "",
				sss						: oReqItem.REGION || "",
				marriage_cat			: oReqItem.MARRIAGE_CATEGORY || "",
				cube_eligible			: oReqItem.METER_CUBE_ENTITLED | 0,
				departure_time			: oReqItem.DEPARTURE_TIME || "",
				arrival_time			: oReqItem.ARRIVAL_TIME || "",
				est_no_participant		: oReqItem.EST_NO_PARTICIPANT ?? 0,
				cash_advance			: oReqItem.CASH_ADVANCE || false,
				// extra hidden field value
				COST_CENTER				: oReqItem.COST_CENTER || "",
				gl_account				: oReqItem.GL_ACCOUNT || "",
				material_code			: oReqItem.MATERIAL_CODE || "",
				dependent_relationship	: oReqItem.DEPENDENT_RELATIONSHIP || "",
				meter_cube_actual		: oReqItem.METER_CUBE_ACTUAL || 0,
				fare_type				: oReqItem.FARE_TYPE_ID || "",
				vehicle_class			: oReqItem.VEHICLE_CLASS || ""
			});

			oReqModel.setProperty("/view", bEdit ? "i_edit" : "view");

			this._showItemCreate(oReqModel.getProperty("/view"));
			this._loadParticipantsForItem(sReqId, sReqSubId);
			this._getClaimTypeItemSelection();
			this.getFieldVisibility_ClaimTypeItem(oEvent);
		},

		async _loadParticipantsForItem(sReqId, sReqSubId) {
			const oReqModel = this._getReqModel();

			const setEmpty = () => {
				oReqModel.setProperty("/participant", [
					{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }
				]);
			};

			if (!sReqId || !sReqSubId) {
				setEmpty();
				return;
			}

			try {
				const oModel = this.getOwnerComponent().getModel("employee_view");

				const oListBinding = oModel.bindList(
					"/ZEMP_REQUEST_PART_VIEW",
					null,
					[new Sorter("PARTICIPANTS_ID", false)],
					[
						new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: sReqId }),
						new Filter({ path: "REQUEST_SUB_ID", operator: FilterOperator.EQ, value1: sReqSubId })
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$count: false,
						$select: "PARTICIPANTS_ID,NAME,CC,ALLOCATED_AMOUNT"
					}
				);

				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const aParticipants = aCtx.map((ctx) => ctx.getObject());

				const aMapped = aParticipants.map((p) => ({
					PARTICIPANTS_ID			: p.PARTICIPANTS_ID 	?? "",
					PARTICIPANT_NAME		: p.NAME 				?? "",
					PARTICIPANT_COST_CENTER	: p.CC 					?? "",
					ALLOCATED_AMOUNT		: p.ALLOCATED_AMOUNT 	?? ""
				}));

				if (oReqModel.getProperty('/req_header/grptype') == 'Group') {
					aMapped.push({ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" });
				}

				oReqModel.setProperty(
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
				MessageToast.show("Select row to delete");
				return;
			}

			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);

			BusyIndicator.show(0);
			const aSuccessIdx = [];
			let sErrorMsg = "";

			try {
				for (const i of aToDelete) {
					if (i < 0 || i >= aRows.length) continue;
					const row = aRows[i] || {};
					const reqId = String(row.REQUEST_ID || "").trim();
					const subId = String(row.REQUEST_SUB_ID || "").trim();

					if (!reqId || !subId) {
						sErrorMsg = Utility.getText(this, "req_tm_w_missing_reqid_reqsubid");
						continue;
					}

					try {
						await this._deleteItemCascade(reqId, subId);
						aSuccessIdx.push(i);
					} catch (e) {
						sErrorMsg = e.message || Utility.getText(this, 'req_tm_w_delete_req_item');
					}
				}
			} finally {
				BusyIndicator.hide();
			}

			if (aSuccessIdx.length > 0) {
				aSuccessIdx.sort((a, b) => b - a).forEach((i) => {
					if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
				});
				oReq.setProperty("/req_item_rows", aRows);
				oReq.setProperty("/list_count", aRows.length);
				MessageToast.show(Utility.getText(this, 'req_tm_s_delete_req_item', [aSuccessIdx.length]));
			}

			if (sErrorMsg) {
				MessageToast.show(sErrorMsg);
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

		async _deleteItemCascade(sReqId, sReqSubId) {
			const oModel = this.getOwnerComponent().getModel();
			const sGroup = "deleteItemCascade";

			const cast = (v) => /^\d+$/.test(String(v)) ? Number(v) : String(v);

			const isNotFound = (e) => {
				const s = e?.status || e?.statusCode || e?.httpStatus || e?.cause?.status || e?.cause?.statusCode;
				return s === 404;
			};

			const vReq = cast(sReqId);
			const vSub = cast(sReqSubId);

			let aPartCtx = [];
			try {
				const oPartList = oModel.bindList(
					"/ZREQ_ITEM_PART", null, null,
					[
						new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: vReq }),
						new Filter({ path: "REQUEST_SUB_ID", operator: FilterOperator.EQ, value1: vSub })
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
					"/ZREQUEST_ITEM", null, null,
					[
						new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: vReq }),
						new Filter({ path: "REQUEST_SUB_ID", operator: FilterOperator.EQ, value1: vSub })
					], 
					{
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
			const oReqModel = this._getReqModel();
			if (oReqModel.getProperty("/req_header/grptype") !== "Group") return;

			const src = oEvent.getSource();
			const sVal = (oEvent.getParameter && oEvent.getParameter("value")) ?? (src?.getValue?.() ?? "");
			const sTrim = String(sVal).trim();

			const oCtx = src.getBindingContext("request");
			if (!oCtx) return;

			const path = oCtx.getPath();
			const segs = path.split("/");
			const idx = parseInt(segs[segs.length - 1], 10);
			if (!Number.isInteger(idx)) return;

			let aRows = oReqModel.getProperty("/participant");
			if (!Array.isArray(aRows)) {
				aRows = [];
				oReqModel.setProperty("/participant", aRows);
			}

			oReqModel.setProperty(`/participant/${idx}/PARTICIPANTS_ID`, sTrim);

			this._normalizeTrailingEmptyRow(aRows);

			const isLast = idx === aRows.length - 1;
			if (isLast && sTrim) {
				oReqModel.setProperty(`/participant/${aRows.length}`, { PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
			}
		},

		_normalizeTrailingEmptyRow(aRows) {
			const oReq = this._getReqModel();
			let iLastNonEmpty = -1;
			for (let i = 0; i < aRows.length; i++) {
				const r = aRows[i] || {};
				const isEmpty = !String(r.PARTICIPANTS_ID || "").trim() && !String(r.ALLOCATED_AMOUNT || "").trim();
				if (!isEmpty) iLastNonEmpty = i;
			}
			const desiredLength = Math.max(iLastNonEmpty + 2, 1);
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
				MessageToast.show(Utility.getText(this, "req_tm_w_select_participant"));
				return;
			}

			aToDelete = Array.from(new Set(aToDelete)).sort((a, b) => b - a);

			const oModel = this.getOwnerComponent().getModel();
			const sGroupId = "delParticipants";

			const toNumberIfNumeric = (v) => /^\d+$/.test(String(v)) ? Number(v) : String(v);

			const aSuccessIdx = [];
			let errorMsg = "";

			BusyIndicator.show(0);
			try {
				const deletePromises = [];

				for (const i of aToDelete) {
					if (i < 0 || i >= aRows.length) continue;

					const oRow = aRows[i] || {};
					const sPID = String(oRow.PARTICIPANTS_ID ?? oRow.PARTICIPANT_ID ?? "").trim();
					const sReqId = String(oRow.REQUEST_ID ?? oReq.getProperty("/req_header/reqid") ?? "").trim();
					const sReqSubId = String(oRow.REQUEST_SUB_ID ?? oReq.getProperty("/req_item/req_subid") ?? "").trim();

					const hasKeys = !!(sReqId && sReqSubId && sPID);

					if (!hasKeys) {
						aSuccessIdx.push(i);
						continue;
					}

					const vReq = toNumberIfNumeric(sReqId);
					const vSub = toNumberIfNumeric(sReqSubId);
					const vPid = toNumberIfNumeric(sPID);

					const oListBinding = oModel.bindList(
						"/ZREQ_ITEM_PART",
						null,
						null,
						[
							new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: vReq }),
							new Filter({ path: "REQUEST_SUB_ID", operator: FilterOperator.EQ, value1: vSub }),
							new Filter({ path: "PARTICIPANTS_ID", operator: FilterOperator.EQ, value1: vPid })
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
								aSuccessIdx.push(i);
								return;
							}
							return oCtx.delete(sGroupId).then(() => {
								aSuccessIdx.push(i);
							});
						})
						.catch((e) => {
							errorMsg = errorMsg || (e && e.message) || Utility.getText(this, "req_tm_w_delete_participant");
						});

					deletePromises.push(pDel);
				}

				await Promise.allSettled(deletePromises);

				if (deletePromises.length > 0) {
					await oModel.submitBatch(sGroupId);
				}
			} finally {
				BusyIndicator.hide();
			}

			if (aSuccessIdx.length > 0) {
				aSuccessIdx.sort((a, b) => b - a).forEach((i) => {
					if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
				});

				if (!Array.isArray(aRows) || aRows.length === 0) {
					aRows = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
				} else if (this._normalizeTrailingEmptyRow) {
					this._normalizeTrailingEmptyRow(aRows);
				}

				oReq.setProperty("/participant", aRows);
				oTable.clearSelection();
				MessageToast.show(Utility.getText(this, "req_tm_s_delete_participant", [aSuccessIdx.length]));
			}

			if (errorMsg) {
				MessageToast.show(errorMsg);
			}
		},

		/* =========================================================
		* Save Draft / Save Item / Save+Another
		* ======================================================= */

		onSaveItem() {
			this.onSave();
		},

		async onSaveAddAnother() {
			const oReqModel = this._getReqModel();
			await this.onSave(); // saves current
			// Re-open create form fresh
			await this._showItemCreate("create");

			// Reset create buffers
			const oData = oReqModel.getData();
			oData.req_item = {};
			if (oData.req_header.grptype === 'Individual') {
				const emp_data = await PARequestSharedFunction._getEmpIdDetail(this, oData.user);
				oData.participant = [{
					PARTICIPANTS_ID: emp_data ? emp_data.eeid : "",
					PARTICIPANT_NAME: emp_data ? emp_data.name : "",
					PARTICIPANT_COST_CENTER: emp_data ? emp_data.cc : "",
					ALLOCATED_AMOUNT: ""
				}];
			} else {
				oData.participant = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
			}
			oData.view = "create";
			oReqModel.setData(oData);
		},

		async onSave() {
			const oReqModel = this._getReqModel();
			const oData 	= oReqModel.getData();
			const oReqItem	= oData.req_item;
			const oModel 	= this.getOwnerComponent().getModel();

			const sEmpId	= String(oData.user);
			const sReqId 	= String(oData.req_header.reqid || "").trim();
			const isEdit 	= oReqModel.getProperty("/view") === "i_edit";

			const sClaimType = oData.req_header.claimtype;
			const sClaimTypeItem = oReqItem.claim_type_item_id;
			const fEstAmount 	= parseFloat(oReqItem.est_amount || 0);

			if (!sReqId) { MessageToast.show("Missing Request ID"); return; }
			if (!sClaimType || !sClaimTypeItem) { MessageToast.show("Select claim type/item"); return; }

			BusyIndicator.show(0);

			try {
				const fAllocatedAmount = oData.participant.reduce((sum, it) => sum + (parseFloat(it.ALLOCATED_AMOUNT) || 0), 0);
				if (fAllocatedAmount > fEstAmount) {
					MessageToast.show("Total participant amount exceeds Estimated Amount.");
					BusyIndicator.hide();
					return; 
				}

				const oPayload = PARequestSharedFunction.generateEligibilityCheckPayload(this);

				if (isEdit) {
					const sReqSubId = String(oData.req_item.req_subid || "").trim();
					const oList = oModel.bindList("/ZREQUEST_ITEM", null, null, [
						new Filter("REQUEST_ID", FilterOperator.EQ, sReqId),
						new Filter("REQUEST_SUB_ID", FilterOperator.EQ, sReqSubId)
					], { $$updateGroupId: "itemSave" });

					const aCtx = await oList.requestContexts(0, 1);
					if (!aCtx[0]) throw new Error("Item not found");

					const oItemCtx = aCtx[0];
					oItemCtx.setProperty("CLAIM_TYPE_ID"				, sClaimType);
					oItemCtx.setProperty("CLAIM_TYPE_ITEM_ID"			, sClaimTypeItem);
					oItemCtx.setProperty('NO_OF_DAYS'					, parseInt(oReqItem.no_of_days));
					oItemCtx.setProperty("PURPOSE" 						, oReqItem.purpose);
					oItemCtx.setProperty("EST_AMOUNT" 					, parseFloat(oReqItem.est_amount));
					oItemCtx.setProperty("DEPENDENT" 					, oReqItem.dependent);
					oItemCtx.setProperty("REMARK" 						, oReqItem.remark);
					oItemCtx.setProperty("COURSE_TITLE" 				, oReqItem.course);
					oItemCtx.setProperty("KWSP_SPORTS_REPRESENTATION" 	, oReqItem.sport_rep);
					oItemCtx.setProperty("DECLARE_CLUB_MEMBERSHIP" 		, oReqItem.club_membership);
					oItemCtx.setProperty("ATTACHMENT1" 					, sAttachment1_SFID);
					oItemCtx.setProperty("MOBILE_CATEGORY_PURPOSE_ID" 	, oReqItem.cat_purpose);
					oItemCtx.setProperty("ATTACHMENT2" 					, sAttachment2_SFID);
					oItemCtx.setProperty("START_DATE" 					, oReqItem.start_date);
					oItemCtx.setProperty("END_DATE" 					, oReqItem.end_date);
					oItemCtx.setProperty("START_TIME" 					, oReqItem.start_time);
					oItemCtx.setProperty("END_TIME" 					, oReqItem.end_time);
					oItemCtx.setProperty("VEHICLE_OWNERSHIP_ID" 		, oReqItem.vehicle_ownership);
					oItemCtx.setProperty("ROOM_TYPE" 					, oReqItem.room_type);
					oItemCtx.setProperty("COUNTRY" 						, oReqItem.country);
					oItemCtx.setProperty("LOCATION" 					, oReqItem.location);
					oItemCtx.setProperty("AREA" 						, oReqItem.area);
					oItemCtx.setProperty("FAMILY_COUNT" 				, parseInt(oReqItem.no_of_family_member));
					oItemCtx.setProperty("VEHICLE_TYPE" 				, oReqItem.type_of_vehicle);
					oItemCtx.setProperty("KILOMETER" 					, parseFloat(oReqItem.kilometer));
					oItemCtx.setProperty("RATE_PER_KM" 					, parseFloat(oReqItem.rate_per_kilometer));
					oItemCtx.setProperty("TOLL" 						, parseFloat(oReqItem.toll_amt));
					oItemCtx.setProperty("FLIGHT_CLASS" 				, oReqItem.flight_class);
					oItemCtx.setProperty("LOCATION_TYPE" 				, oReqItem.location_type);
					oItemCtx.setProperty("FROM_STATE_ID" 				, oReqItem.from_state);
					oItemCtx.setProperty("FROM_LOCATION" 				, oReqItem.from_location);
					oItemCtx.setProperty("FROM_LOCATION_OFFICE" 		, oReqItem.from_location_office);
					oItemCtx.setProperty("TO_STATE_ID" 					, oReqItem.to_state);
					oItemCtx.setProperty("TO_LOCATION" 					, oReqItem.to_location);
					oItemCtx.setProperty("TO_LOCATION_OFFICE" 			, oReqItem.to_location_office);
					oItemCtx.setProperty("MODE_OF_TRANSFER" 			, oReqItem.mode_of_transfer);
					oItemCtx.setProperty("TRANSFER_DATE" 				, oReqItem.tarikh_pindah);
					oItemCtx.setProperty("REGION"					 	, oReqItem.sss);
					oItemCtx.setProperty("MARRIAGE_CATEGORY" 			, oReqItem.marriage_cat);
					oItemCtx.setProperty("METER_CUBE_ENTITLED" 			, parseFloat(oReqItem.cube_eligible));
					oItemCtx.setProperty("DEPARTURE_TIME" 				, oReqItem.departure_time);
					oItemCtx.setProperty("ARRIVAL_TIME" 				, oReqItem.arrival_time);
					oItemCtx.setProperty("EST_NO_PARTICIPANT" 			, parseInt(oReqItem.est_no_participant) || 1);
					oItemCtx.setProperty("CASH_ADVANCE" 				, oReqItem.cash_advance || false);
					oItemCtx.setProperty("COST_CENTER" 					, oReqItem.COST_CENTER);
					oItemCtx.setProperty("GL_ACCOUNT" 					, oReqItem.gl_account);
					oItemCtx.setProperty("MATERIAL_CODE" 				, oReqItem.material_code);
					oItemCtx.setProperty("DEPENDENT_RELATIONSHIP" 		, oReqItem.dependent_relationship);
					oItemCtx.setProperty("METER_CUBE_ACTUAL" 			, parseFloat(oReqItem.meter_cube_actual));
					oItemCtx.setProperty("FARE_TYPE_ID" 				, oReqItem.fare_type);
					oItemCtx.setProperty("VEHICLE_CLASS" 				, oReqItem.vehicle_clas);
					

					await this._replaceParticipantsForItem(sReqId, subId, oData.participant);
					await oModel.submitBatch("itemSave");
					
				} else {
					const sNewReqSubId = await this.getCurrentReqSubIdNumber(sReqId);
					const sReqSubId = String(sNewReqSubId);
					const oData = oReqModel.getProperty("/req_item");
					

					let sAttachment1_SFID,sAttachment2_SFID;
					if (oData.doc1) {
						const attachment_1 = await this.getFileAsBinary("i_attachment_1_file");
						sAttachment1_SFID = await Attachment.postAttachment(oData.doc1, attachment_1, oData.user);
					}
					if (oData.doc2) {
						const attachment_2 = await this.getFileAsBinary("i_attachment_2_file");
						sAttachment2_SFID = await Attachment.postAttachment(oData.doc2, attachment_2, oData.user);
					}

					oModel.bindList("/ZREQUEST_ITEM").create({
						EMP_ID						: sEmpId,
						REQUEST_ID					: sReqId,
						REQUEST_SUB_ID				: sReqSubId,
						CLAIM_TYPE_ID				: sClaimType,
						CLAIM_TYPE_ITEM_ID			: sClaimTypeItem,
						NO_OF_DAYS					: parseInt(oReqItem.no_of_days),
						PURPOSE						: oReqItem.purpose,
						EST_AMOUNT					: parseFloat(oReqItem.est_amount),
						DEPENDENT					: oReqItem.dependent,
						REMARK						: oReqItem.remark,
						COURSE_TITLE				: oReqItem.course,
						KWSP_SPORTS_REPRESENTATION	: oReqItem.sport_rep,
						DECLARE_CLUB_MEMBERSHIP		: oReqItem.club_membership,
						ATTACHMENT1					: sAttachment1_SFID,
						MOBILE_CATEGORY_PURPOSE_ID	: oReqItem.cat_purpose,
						ATTACHMENT2					: sAttachment2_SFID,
						START_DATE					: oReqItem.start_date,
						END_DATE					: oReqItem.end_date,
						START_TIME					: oReqItem.start_time,
						END_TIME					: oReqItem.end_time,
						VEHICLE_OWNERSHIP_ID		: oReqItem.vehicle_ownership,
						ROOM_TYPE					: oReqItem.room_type,
						COUNTRY						: oReqItem.country,
						LOCATION					: oReqItem.location,
						AREA						: oReqItem.area,
						FAMILY_COUNT				: parseInt(oReqItem.no_of_family_member),
						VEHICLE_TYPE				: oReqItem.type_of_vehicle,
						KILOMETER					: parseFloat(oReqItem.kilometer),
						RATE_PER_KM					: parseFloat(oReqItem.rate_per_kilometer),
						TOLL						: parseFloat(oReqItem.toll_amt),
						FLIGHT_CLASS				: oReqItem.flight_class,
						LOCATION_TYPE				: oReqItem.location_type,
						FROM_STATE_ID				: oReqItem.from_state,
						FROM_LOCATION				: oReqItem.from_location,
						FROM_LOCATION_OFFICE		: oReqItem.from_location_office,
						TO_STATE_ID					: oReqItem.to_state,
						TO_LOCATION					: oReqItem.to_location,
						TO_LOCATION_OFFICE			: oReqItem.to_location_office,
						MODE_OF_TRANSFER			: oReqItem.mode_of_transfer,
						TRANSFER_DATE				: oReqItem.tarikh_pindah,
						REGION						: oReqItem.sss,
						MARRIAGE_CATEGORY			: oReqItem.marriage_cat,
						METER_CUBE_ENTITLED			: parseFloat(oReqItem.cube_eligible),
						DEPARTURE_TIME				: oReqItem.departure_time,
						ARRIVAL_TIME				: oReqItem.arrival_time,
						EST_NO_PARTICIPANT			: parseInt(oReqItem.est_no_participant) || 1,
						CASH_ADVANCE				: oReqItem.cash_advance || false,
						COST_CENTER					: oReqItem.COST_CENTER,
						GL_ACCOUNT					: oReqItem.gl_account,
						MATERIAL_CODE				: oReqItem.material_code,
						DEPENDENT_RELATIONSHIP		: oReqItem.dependent_relationship,
						METER_CUBE_ACTUAL			: parseFloat(oReqItem.meter_cube_actual),
						FARE_TYPE_ID				: oReqItem.fare_type,
						VEHICLE_CLASS_ID			: oReqItem.vehicle_class
					}, { $$updateGroupId: "itemCreate" });

					const aParts = oData.participant || [];
					for (const p of aParts) {
						const sPID = String(p.PARTICIPANTS_ID || "").trim();
						if (!sPID) continue;
						oModel.bindList("/ZREQ_ITEM_PART").create({
							REQUEST_ID: sReqId,
							REQUEST_SUB_ID: sReqSubId,
							PARTICIPANTS_ID: sPID,
							ALLOCATED_AMOUNT: parseFloat(p.ALLOCATED_AMOUNT || 0)
						}, { $$updateGroupId: "itemCreate" });
					}

					await oModel.submitBatch("itemCreate");
					
					if (sAttachment1_SFID) {
						await Attachment.postMDFChild(sReqId, requestSubId, sAttachment1_SFID, sAttachment2_SFID);
					}
				}

				MessageToast.show("Success");

			} catch (e) {
				MessageToast.show(e.message || "Save failed");
			} finally {
				await new Promise(resolve => setTimeout(resolve, 500));
				
				await this._getItemList(sReqId);
				
				BusyIndicator.hide();
				this._showItemList("list");
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
					BusyIndicator.hide();
					return;
				}

				// Validate type
				const check = this.isAllowedFile(file);
				if (!check.ok) {
					reject(new Error(check.reason));
					MessageToast.show(new Error(check.reason));
					BusyIndicator.hide();
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

		async _replaceParticipantsForItem(sReqId, sReqSubId, aParticipants) {
			const oModel = this.getOwnerComponent().getModel();
			const sGroup = "replaceParts";

			const isNotFound = (err) => {
				const c = err?.status || err?.statusCode || err?.cause?.status || err?.cause?.statusCode;
				return c === 404;
			};

			let aExistingCtx = [];
			try {
				const oList = oModel.bindList(
					"/ZREQ_ITEM_PART", null, null,
					[
						new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: sReqId }),
						new Filter({ path: "REQUEST_SUB_ID", operator: FilterOperator.EQ, value1: sReqSubId })
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
					const sPID = String(p.PARTICIPANTS_ID || p.PARTICIPANT_ID || "").trim();
					if (!sPID) return;

					const alloc = parseFloat(p.ALLOCATED_AMOUNT || 0);

					oPartList.create(
						{
							REQUEST_ID: sReqId,
							REQUEST_SUB_ID: sReqSubId,
							PARTICIPANTS_ID: sPID,
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
			const oReqModel = this._getReqModel();
			const oData = oReqModel.getData();
			const sReqId = String(oData.req_header.reqid || "").trim();
			oReqModel.setProperty('/req_item', {})

			this._getItemList(sReqId);
			this._showItemList('list');
		},

		/* =========================================================
		* Backend: Fetch list / Number Range
		* ======================================================= */

		async _getHeader(sReqId) {
			const oReqModel = this._getReqModel();

			if (!sReqId) {
				oReqModel.setProperty("/req_item_rows", []);
				oReqModel.setProperty("/list_count", 0);
				return [];
			}

			const oModel = this.getOwnerComponent().getModel("employee_view");
			const oListBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", null, null, [
				new Filter("REQUEST_ID", FilterOperator.EQ, sReqId)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, 1);

				if (aCtx.length > 0) {
					const oData = aCtx[0].getObject();
					oReqModel.setProperty("/req_header", {
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
				oReqModel.setProperty("/req_header", a);
				return [];
			}
		},

		async _getItemList(sReqId, bFirst = false) {
			const oReqModel = this._getReqModel();

			if (!sReqId) {
				oReqModel.setProperty("/req_item_rows", []);
				oReqModel.setProperty("/list_count", 0);
				return [];
			}

			const oModel = this.getOwnerComponent().getModel('employee_view');
			const sReq = String(sReqId);
			const sEmp = String(oReqModel.getProperty('/user'));

			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_ITEM_VIEW", null,
				[new Sorter("REQUEST_SUB_ID", false)],
				[new Filter({
					path: "REQUEST_ID",
					operator: FilterOperator.EQ,
					value1: sReq
				})],
				{
					$$ownRequest: true,
					$$groupId: '$direct',
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

				const fCashAdvAmount = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === true ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				const fReqAmount = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === false ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				oReqModel.setProperty("/req_header/cashadvamt", fCashAdvAmount);
				oReqModel.setProperty("/req_header/reqamt", fReqAmount);
				oReqModel.setProperty("/req_item_rows", a);
				oReqModel.setProperty("/list_count", a.length);

				if (bFirst != true) {
					this.updateRequestAmount(sEmp, sReq, fCashAdvAmount, fReqAmount);
				}

				return a;
			} catch (err) {
				console.error("OData V4 bindList failed:", err);
				oReqModel.setProperty("/req_item_rows", []);
				oReqModel.setProperty("/list_count", 0);
				return [];
			}
		},

		async updateRequestAmount(sEmpId, sReqId, fCashAdvAmount, fReqAmount) {
			
			const oModel = this.getOwnerComponent().getModel();

			const oListBinding = oModel.bindList("/ZREQUEST_HEADER", null, null,
				[
					new Filter({ path: "EMP_ID", operator: FilterOperator.EQ, value1: sEmpId }),
					new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: sReqId })
				],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$updateGroupId: "$auto"
				}
			);

			try {

				BusyIndicator.show(0);
				const aCtx = await oListBinding.requestContexts(0, 1);
				const oCtx = aCtx[0];

				if (!oCtx) {
					throw new Error("Request not found for submit.");
				}

				oCtx.setProperty("CASH_ADVANCE", parseFloat(fCashAdvAmount));
				oCtx.setProperty("PREAPPROVAL_AMOUNT", parseFloat(fReqAmount));

				await oModel.submitBatch("$auto");
			} catch (e) {
				MessageToast.show(e.message || "Submission failed");
			} finally {
				BusyIndicator.hide();
			}
		},

		getCurrentReqSubIdNumber(sReqId) {
			
			const oModel = this.getOwnerComponent().getModel('request');
			const length = oModel.getProperty('/req_item_rows').length;
			const next = String(length + 1).padStart(3, "0");
			return sReqId + next;
		},

		/* =========================================================
		* Participant Value Help 
		* ======================================================= */

		onValueHelpRequest(oEvent) {
			this._oInputSource = oEvent.getSource();
			if (!this._pEmployeeDialog) {
				this._pEmployeeDialog = Fragment.load({
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

			if (!sValue) {
				this._updateParticipantData(sPath, null); 
				return;
			}

			if (oSelectedRow) {
				const oEmpData = oSelectedRow.getBindingContext().getObject();
				this._updateParticipantData(sPath, oEmpData);
				this.appendNewRow(oEvent);
				return;
			}

			const oListBinding = this.getView().getModel().bindList("/ZEMP_MASTER");
			const oFilter = new Filter("EEID", FilterOperator.EQ, sValue);

			oInput.setBusy(true);
			oListBinding.filter(oFilter).requestContexts(0, 1).then(aContexts => {
				oInput.setBusy(false);
				if (aContexts.length > 0) {
					const oEmpData = aContexts[0].getObject();
					this._updateParticipantData(sPath, oEmpData);
					this.appendNewRow(oEvent);
				} else {
					this._updateParticipantData(sPath, null);
					MessageToast.show("Employee ID not found");
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
				oReqModel.setProperty(sRowPath + "/PARTICIPANTS_ID", oEmpData.EEID || oEmpData.ID);
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_NAME", oEmpData.NAME);
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_COST_CENTER", oEmpData.CC);
			} else {
				oReqModel.setProperty(sRowPath + "/PARTICIPANTS_ID", "");
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_NAME", "");
				oReqModel.setProperty(sRowPath + "/PARTICIPANT_COST_CENTER", "");
			}
		},

		onValueHelpSearch(oEvent) {
			const sValue = oEvent.getParameter("value");
			const oBinding = oEvent.getSource().getBinding("items");
			const aFilters = sValue ? [
				new Filter({
					filters: [
						new Filter("EEID", "Contains", sValue),
						new Filter("NAME", "Contains", sValue)
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

			var aExportData = (aData.length > 0 && aData[0].PARTICIPANTS_ID) ? aData : [];
			var sFileName = this._getExcelFileName("participant");

			var aCols = this._createColumnConfig();
			var oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: aExportData,
				fileName: sFileName,
				worker: false // Set to false for small datasets or if debugging
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show("Export successful");
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
			var oFile = oEvent.getParameter("files")[0];
			if (!oFile) return; // Safety check

			var oReader = new FileReader();

			oReader.onload = function (e) {
				var oData = new Uint8Array(e.target.result);
				var oWorkbook = XLSX.read(oData, { type: "array" });
				var oWorkSheet = oWorkbook.Sheets[oWorkbook.SheetNames[0]];
				var oJsonData = XLSX.utils.sheet_to_json(oWorkSheet);
				oJsonData.push({ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
				const oReqModel = this._getReqModel();
				oReqModel.setProperty("/participant", oJsonData);


				var fu = this.byId("participant_list_upload");
				fu.clear();

			}.bind(this);

			oReader.readAsArrayBuffer(file);
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

		_getExcelFileName(sParticipant) {
			if (sParticipant == 'participant') {
				const oInput = this.getOwnerComponent().getModel("request")?.getData() || {};
				const sReqId = oInput?.req_header?.reqid || "";
				const sReqSubId = oInput?.req_item?.req_subid || "";

				return this._sanitizeFileName(`Pre_Approval_Request_${sReqId}_${sReqSubId}_Participant_Data.xlsx`);
			} else {
				const oInput = this.getOwnerComponent().getModel("request")?.getData() || {};
				const sReqId = oInput?.req_header?.reqid || "";

				return this._sanitizeFileName(`Pre_Approval_Request_${sReqId}_${this._getTodayString()}.xlsx`);
			}
		},

		_toDate(val) {

			if (!val) return null;

			if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/i.test(val)) {
				const d = new Date(val);
				if (!isNaN(d.getTime())) {
					return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
				}
				return null;
			}

			if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
				const [y, m, d] = val.split("-").map(Number);
				return new Date(Date.UTC(y, m - 1, d));
			}

			if (val instanceof Date && !isNaN(val.getTime())) {
				return new Date(Date.UTC(val.getFullYear(), val.getMonth(), val.getDate()));
			}

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

						if (meta.type === "date") {
							const dt = that._toDate(cell.v);

							if (dt) {
								cell.t = "d";
								cell.v = dt;
								cell.z = "yyyy-mm-dd";
							} else {
								delete ws[addr];
							}
						}
						
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
					MessageToast.show("No request data loaded.");
					return;
				}

				const header = input.req_header || {};
				const items = input.req_item_rows || [];
				const item_part = await this._getParticipantsList(header.reqid);

				// -------------------------------
				// Build Header Row
				// -------------------------------
				const headerRow = {
					"Request ID"				: header.reqid,
					"Purpose"					: header.purpose,
					"Trip Start Date"			: header.tripstartdate,
					"Trip End Date"				: header.tripenddate,
					"Event Start Date"			: header.eventstartdate,
					"Event End Date"			: header.eventenddate,
					"Location"					: header.location || "",
					"Individual/Group"			: header.grptype || "",
					"Type of Transportation"	: header.transport || "",
					"Request Status"			: header.reqstatus,
					"Cost Center"				: header.cc,
					"Alternate Cost Center"		: header.acc || "-",
					"Cash Advance (MYR)"		: header.cashadvamt,
					"Pre Approval Amount (MYR)"	: header.reqamt,
					"Request Type"				: header.reqtype,
					"Comment"					: header.comment || "",
					"Claim Type"				: header.claimtype,
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
				MessageToast.show("Excel export failed.");
			} finally {
				oView.setBusy(false);
			}
		},

		async _getParticipantsList(reqid) {
			const oModel = this.getOwnerComponent().getModel('employee_view');
			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_PART_VIEW",
				null,
				[new Sorter("REQUEST_SUB_ID", false)],
				[new Filter({
					path: "REQUEST_ID",
					operator: FilterOperator.EQ,
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
			this._getDependent();
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
						new Sorter("CLAIM_TYPE_ITEM_ID", false)
					],
					[
						new Filter({ path: "CLAIM_TYPE_ID", operator: FilterOperator.EQ, value1: claim_type_id }),
						new Filter({ path: "SUBMISSION_TYPE", operator: 'NE', value1: "ST0001" })
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

		_getDependent() {
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

		_calculateNumberOfDays() {
			const oReqModel = this._getReqModel();
			const oData = oReqModel.getData();

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
			oReqModel.setData(oData);
		},

		/* =========================================================
		* Field Visibility Functions 
		* ======================================================= */

		getFieldVisibility_ClaimTypeItem: async function (oEvent) {
			const oModel = this.getOwnerComponent().getModel();

			const sClaimTypeItemFromSelect = oEvent?.getSource?.().getSelectedKey?.();
			const sClaimTypeItemFromModel = this._getReqModel().getProperty("/req_item/claim_type_item_id");
			const sClaimTypeItem = sClaimTypeItemFromSelect || sClaimTypeItemFromModel;

			if (!sClaimTypeItem) {
				console.warn("No req_type found yet.");
				return;
			}

			const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
				new Filter("SUBMISSION_TYPE", FilterOperator.EQ, "PREAPPROVAL_R"),
				new Filter("COMPONENT_LEVEL", FilterOperator.EQ, "ITEM"),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaimTypeItem)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);

				if (!aCtx || aCtx.length === 0) {
					console.warn("No configuration rows for claim type item:", sClaimTypeItem);
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
					// calculate no of days
					this._calculateNumberOfDays();
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
				c = Fragment.byId(this.getView().createId(sFragmentId), sId);
				if (c) return c;

				c = Fragment.byId(sFragmentId, sId);
				if (c) return c;
			}

			return sap.ui.getCore().byId(`${sFragmentId}--${sId}`) || sap.ui.getCore().byId(sId);
		},

		/* =========================================================
		* Approver Functions (Aiman)
		* ======================================================= */

		onApproveRequest: function () {
			// 1) Ensure Reject model exists (for comment)
			let oReject = this.getView().getModel("Reject");
			if (!oReject) {
				oReject = new JSONModel({ approvalComment: "" });
				this.getView().setModel(oReject, "Reject");
			}
			oReject.setProperty("/approvalComment", "");

			// 2) Ensure Type model exists (for visibility/mode)
			let oType = this.getView().getModel("Type");
			if (!oType) {
				oType = new JSONModel({ mode: "" });
				this.getView().setModel(oType, "Type");
			}
			oType.setProperty("/mode", "APPROVE_REQ");

			ApproveDialog.open(this);
		},


		onRejectRequest: function () {
			// 1) Ensure form model
			let oReject = this.getView().getModel("Reject");
			if (!oReject) {
				oReject = new JSONModel({ rejectReasonKey: "", approvalComment: "" });
				this.getView().setModel(oReject, "Reject");
			} else {
				oReject.setProperty("/rejectReasonKey", "");
				oReject.setProperty("/approvalComment", "");
			}

			// 2) Ensure UI state model
			let oType = this.getView().getModel("Type");
			if (!oType) {
				oType = new JSONModel({ mode: "" });
				this.getView().setModel(oType, "Type");
			}
			oType.setProperty("/mode", "REJECT_REQ");

			RejectDialog.open(this);
		},

		onSendBackRequest: function () {
			// Ensure form model
			let oReject = this.getView().getModel("Reject");
			if (!oReject) {
				oReject = new JSONModel({ sendBackReasonKey: "", approvalComment: "" });
				this.getView().setModel(oReject, "Reject");
			}
			oReject.setProperty("/sendBackReasonKey", "");
			oReject.setProperty("/approvalComment", "");

			// Ensure UI state model
			let oType = this.getView().getModel("Type");
			if (!oType) {
				oType = new JSONModel({ mode: "" });
				this.getView().setModel(oType, "Type");
			}
			oType.setProperty("/mode", "SENDBACK_REQ");

			SendBackDialog.open(this);
		},
		
		onClickCancel_app: function () {
			if (this.__approveDialog) { this.__approveDialog.close(); }
			if (this.__sendBackDialog) { this.__sendBackDialog.close(); }
			if (this.__rejectDialog) { this.__rejectDialog.close(); }
		},
		
		onClickCreate_app: async function () {
			// Minimal validation for reject flow (reason + comment)
			const oReject = this.getView().getModel("Reject");
			const mode = oReject?.getProperty("/mode"); // "REJECT" here
			//const reason = oReject?.getProperty("/rejectReasonKey");
			const comment = oReject?.getProperty("/approvalComment")?.trim();
			const accessModel = this.getOwnerComponent().getModel("access");
			const userId = accessModel?.getProperty("/userId");
			const requestModel = this.getView().getModel("request");
			const reqId = requestModel?.getProperty("/req_header/reqid")?.trim();

			const id = reqId;
			const userID = userId;
			const oModel = this.getOwnerComponent().getModel();
			const oModel2 = this.getOwnerComponent().getModel("employee_view");
			const oModel3 = this.getOwnerComponent().getModel();


			if (mode === "APPROVE") {
				if (!comment) {
					MessageToast.show("Please enter approval comment.");
					return;
				}
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
						await workflowApproval.onSendEmailApprover(oModel3, p);
					}

					// 3. Close dialog
					this.__approveDialog && this.__approveDialog.close();

					// 4. Navigate back after small delay
					const oRouter = this.getOwnerComponent().getRouter();
					setTimeout(() => {
						oRouter.navTo("Dashboard", {}, true);
					}, 400);

				} catch (e) {
					MessageToast.show(e.message);
				}
			}
		},

		/**
		 * Submit handler for Send Back (STAT03) - PRE-APPROVAL REQUEST
		 * Called by SendBackDialog endButton (see dialog's robust handler binding).
		 */
		onSendBack_app: async function () {
			const oReject = this.getView().getModel("Reject");

			// Read inputs
			const reason = oReject?.getProperty("/sendBackReasonKey");
			const comment = oReject?.getProperty("/approvalComment")?.trim();

			// Client-side validation (dialog also disables button, but keep server-safe checks)
			if (!reason) { MessageToast.show("Please select a Send Back Reason."); return; }
			if (!comment) { MessageToast.show("Please enter approval comment."); return; }

			try {
				BusyIndicator.show(0);

				// Models
				const oModelMain = this.getOwnerComponent().getModel();               // OData main
				const oModelView = this.getOwnerComponent().getModel("employee_view");// OData views
				const accessModel = this.getOwnerComponent().getModel("access");

				// Who & what
				const userId = accessModel?.getProperty("/userId");
				const requestModel = this.getOwnerComponent().getModel("request");
				const reqId = requestModel?.getProperty("/req_header/reqid")?.trim();

				if (!userId || !reqId) {
					throw new Error("Missing User ID or Request ID.");
				}

				// STAT03 = SEND BACK
				const reject_status = "STAT03";

				// 1) Update approval rows + header, build dataset & email payloads
				const { payloads, dataset, submissionType } =
					await ApproverUtility.rejectOrSendBackMultiLevel(
						oModelMain,
						reqId,       // id
						userId,      // approver user id
						reject_status,
						reason,
						comment,
						oModelView
					);

				// 2) Budget release (if your finance process requires release on send back)
				await budgetCheck.budgetProcessing(
					oModelMain,
					dataset,          // budget rows from the view
					submissionType,   // "REQ"
					"release"
				);

				// 3) Send notifications
				const oMailModel = this.getOwnerComponent().getModel();
				for (const p of payloads) {
					await workflowApproval.onSendEmailApprover(oMailModel, p);
				}

				// 4) Close dialog
				if (this.__sendBackDialog) {
					this.__sendBackDialog.close();
				}

				// 5) Navigate back
				setTimeout(() => {
					const oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("Dashboard", {}, true);
				}, 400);

			} catch (e) {
				MessageToast.show(e.message || "Send Back failed");
			} finally {
				BusyIndicator.hide();
			}
		},

		onReject_app: async function () {
			const oReject = this.getView().getModel("Reject");
			const reason = oReject?.getProperty("/rejectReasonKey");
			const comment = oReject?.getProperty("/approvalComment")?.trim();

			if (!reason) { MessageToast.show("Please select a Reject Reason."); return; }
			if (!comment) { MessageToast.show("Please enter approval comment."); return; }

			try {
				BusyIndicator.show(0);

				const oModelMain = this.getOwnerComponent().getModel();
				const oModelView = this.getOwnerComponent().getModel("employee_view");
				const accessModel = this.getOwnerComponent().getModel("access");
				const userId = accessModel?.getProperty("/userId");

				const reqModel = this.getView().getModel("request");
				const reqId = reqModel?.getProperty("/req_header/reqid")?.trim();

				const reject_status = "STAT04"; // REJECT

				const { payloads, dataset, submissionType } =
					await ApproverUtility.rejectOrSendBackMultiLevel(
						oModelMain,
						reqId,
						userId,
						reject_status,
						reason,
						comment,
						oModelView
					);

				// Budget release if applicable
				await budgetCheck.budgetProcessing(oModelMain, dataset, submissionType, "release");

				for (const p of payloads) {
					await workflowApproval.onSendEmailApprover(oModelMain, p);
				}

				this.__rejectDialog && this.__rejectDialog.close();

				setTimeout(() => this.getOwnerComponent().getRouter().navTo("Dashboard", {}, true), 400);

			} catch (e) {
				MessageToast.show(e.message || "Reject failed");
			} finally {
				BusyIndicator.hide();
			}
		},



		onExit: function () {
			try {
				RejectDialog.destroy(this);
			} catch (e) { }
			try {
				SendBackDialog.destroy(this);
			} catch (e) { }
		},







	});
});