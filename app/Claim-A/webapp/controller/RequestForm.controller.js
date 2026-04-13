sap.ui.define([
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Label",
    "sap/m/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/ui/core/library",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/export/Spreadsheet",
    "sap/ui/mdc/enums/FieldEditMode",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "claima/utils/ApprovalLog",
    "claima/utils/ApproveDialog",
    "claima/utils/ApproverUtility",
    "claima/utils/Attachment",
    "claima/utils/budgetCheck",
    "claima/utils/Constants",
    "claima/utils/CustomValidator",
    "claima/utils/DateUtility",
    "claima/utils/EligibilityCheck",
    "claima/utils/EligibilityScenarios/EligibleScenarioCheck",
    "claima/utils/PARequestSharedFunction",
    "claima/utils/RejectDialog",
    "claima/utils/RequestUtility",
    "claima/utils/SendBackDialog",
    "claima/utils/Utility",
    "claima/utils/workflowApproval",
], function (
    Button,
    Dialog,
    Label,
    mLibrary,
    MessageBox,
    MessageToast,
    BusyIndicator,
    Fragment,
    coreLibrary,
    Controller,
    History,
    Spreadsheet,
    FieldEditMode,
    Filter,
    FilterOperator,
    JSONModel,
    Sorter,
    ApprovalLog,
    ApproveDialog,
    ApproverUtility,
    Attachment,
    budgetCheck,
    Constants,
    CustomValidator,
    DateUtility,
    EligibilityCheck,
    EligibleScenarioCheck,
    PARequestSharedFunction,
    RejectDialog,
    RequestUtility,
    SendBackDialog,
    Utility,
    workflowApproval,
) {
	"use strict";

	const DialogType = mLibrary.DialogType;
    const ValueState = coreLibrary.ValueState;
	const ButtonType = mLibrary.ButtonType;

	return Controller.extend("claima.controller.RequestForm", {

		/* =========================================================
		* Lifecycle
		* ======================================================= */

		onInit() {
			this._oRouter 			= this.getOwnerComponent().getRouter();
			this._oConstant 		= this.getOwnerComponent().getModel("constant").getData();
			this._oReqModel 		= this.getOwnerComponent().getModel("request");
			this._oApprovalLogModel	= this.getOwnerComponent().getModel('approval_log')
			this._oDataModel 		= this.getOwnerComponent().getModel();
			this._oViewModel 		= this.getOwnerComponent().getModel("employee_view");
			this._oSessionModel 	= this.getOwnerComponent().getModel("session");
			this._oFragments 		= Object.create(null);

			RequestUtility.init(this.getOwnerComponent(), this.getView());
			CustomValidator.init(this.getOwnerComponent(), this.getView());

			// URL Access
			this._oRouter.getRoute("RequestForm").attachPatternMatched(this._onMatched, this);
		},

		/* =========================================================
		* URL Access
		* ======================================================= */

		_onMatched(oEvent) {
			let sRequestId = oEvent.getParameter("arguments").request_id;

			try { sRequestId = decodeURIComponent(sRequestId); } catch (e) { }

			console.log("Deep-link request ID:", sRequestId);

			this._oReqModel.setProperty("/req_header/reqid", sRequestId);
			this._oReqModel.setProperty('/view', 'view');

			this._loadRequest(sRequestId);
		},

		async _loadRequest(sReqId) {
			BusyIndicator.show(0);
			try {
				await PARequestSharedFunction._getHeader(this, sReqId);
				await PARequestSharedFunction._getItemList(this, sReqId);
				await this._showItemList(sReqId);
			} catch (error) {
				console.log(error);
			} finally {
				BusyIndicator.hide();
			}
		},

		/* =========================================================
		* Helpers: Fragment Management
		* ======================================================= */

		async _getFormFragment(sName) {
			const oView = this.getView();
			if (!this._oFragments[sName]) {
				this._oFragments[sName] = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sName,
					type: "XML",
					controller: this
				}).then((oFrag) => {
					oView.addDependent(oFrag);
					return oFrag;
				});
			}
			return this._oFragments[sName];
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
			this._oFragments = Object.create(null);
		},

		async _showItemCreate(bEdit) {
			this._loadSelections();
			const oPage = this.byId("request_form");
			if (!oPage) return;

			await this._removeByLocalId(this.byId("request_item_list_fragment_d") ? "request_item_list_fragment_d" : "request_item_list_fragment");
			await this._removeByLocalId("req_approval_log");

			const oCreate = await this._getFormFragment("req_create_item");
			await this._replaceContentAt(oPage, 1, oCreate);

			if (bEdit && this._oReqModel.getProperty("/req_item/doc1_filename")) {
				this.byId("i_attachment_1_file").setRequired(false);
			} 

			PARequestSharedFunction.determineFooterButton(this);
		},

		async _showItemList(sReqId) {
			const oPage = this.byId("request_form");
			if (!oPage) return;

			await this._removeByLocalId("request_item_list_fragment");
			await this._removeByLocalId("request_create_item_fragment");
			await this._removeByLocalId("req_approval_log");

			const oList = await this._getFormFragment("req_item_list");
			await this._replaceContentAt(oPage, 1, oList);

			var sReqStatus = this._oReqModel.getProperty("/req_header/reqstatus");
			var bApproval = sReqStatus !== this._oConstant.RequestStatus.DRAFT && sReqStatus !== this._oConstant.RequestStatus.CANCELLED;
			if (bApproval) {
				var aApprover = await ApprovalLog.getApproverList(this._oApprovalLogModel, this._oViewModel, sReqId);
				for (const row of aApprover) {
					if (row.STATUS === this._oConstant.ClaimStatus.PENDING_APPROVAL && 
						(row.SUBSTITUTE_APPROVER_ID == this._oSessionModel.getProperty("/userId") || 
							row.APPROVER_ID == this._oSessionModel.getProperty("/userId"))) {
						this._oReqModel.setProperty('/view', this._oConstant.PARMode.APPROVER);
						break;
					} else {
						this._oReqModel.setProperty('/view', this._oConstant.PARMode.VIEW);
					}
				}
				const oApproval = await this._getFormFragment("approval_log");
				await this._replaceContentAt(oPage, 2, oApproval);
			} else {
				PARequestSharedFunction.getCurrentState(this);
			}

			PARequestSharedFunction.determineFooterButton(this);
		},

		/* =========================================================
		* Footer / Navigation Buttons
		* ======================================================= */

		onBack() {
			const sReqStatus = this._oReqModel.getProperty("/req_header/reqstatus");

			if (sReqStatus == this._oConstant.RequestStatus.DRAFT || 
				sReqStatus == this._oConstant.RequestStatus.SEND_BACK) {
				if (!this.oBackDialog) {
					this.oBackDialog = new Dialog({
						title: "Warning",
						type: DialogType.Message,
						state: ValueState.Warning,
						content: [new Label({ text: Utility.getText("req_d_w_back") })],
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Confirm",
							press: async function () {
								this.oBackDialog.close();
								await PARequestSharedFunction._ensureRequestModelDefaults(this._oReqModel);
								await this._removeByLocalId("req_approval_log");
								var oHistory = History.getInstance();
								var sPreviousHash = oHistory.getPreviousHash();
								if (sPreviousHash) {
									window.history.go(-1);
								} else {
									this._oRouter.navTo("Dashboard");
								}
							}.bind(this)
						}),
						endButton: new Button({ text: "Cancel", press: () => this.oBackDialog.close() })
					});
				}
				this.oBackDialog.open();
			} else {
				this.onBackView();
			}
		},

		onDeleteRequest() {
			const sEmpId = this._oSessionModel.getProperty("/userId");
			const sReqId = String(this._oReqModel.getProperty("/req_header/reqid") || "").trim();

			if (!sEmpId || !sReqId) {
				MessageBox.error(Utility.getText("req_tm_w_emp_id_req_id_not_found"));
				return;
			}

			if (!this.oDeleteDialog) {
				this.oDeleteDialog = new Dialog({
					title: "Delete Request",
					type: DialogType.Message,
					state: ValueState.Warning,
					content: [
						new Label({ text: Utility.getText("req_d_w_delete") })
					],
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Delete",
						press: async () => {
							try {
								this.oDeleteDialog.getBeginButton().setEnabled(false);
								BusyIndicator.show(0);

								const sCurrentReqId = String(this._oReqModel.getProperty("/req_header/reqid") || "").trim();

								// update status to CANCELLED
								await Utility._updateStatus(this._oDataModel, sCurrentReqId, this._oConstant.ClaimStatus.CANCELLED);
								
								MessageToast.show(Utility.getText("req_tm_s_delete_request"));
								// Placeholder to put delete function for ZAPPROVER_DETAILS_PREAPPROVAL
								//Call CAP action 
								const oAction = this._oDataModel.bindContext("/DeleteApproverDetails(...)");
								oAction.setParameter("ID", sCurrentReqId);
								try {
									await oAction.execute();
								} catch (oError) {
									MessageBox.error(Utility.getText("msg_failed_generic_error", [oError]))
								}    
								this.oDeleteDialog.close();

								this._oRouter.navTo("RequestFormStatus");

							} catch (e) {
								MessageBox.error(e.message || Utility.getText("req_d_e_delete_failed"));
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
			const oReqData = this._oReqModel.getData();
			const aReqItemRows = this._oReqModel.getProperty("/req_item_rows") || [];

			if (!aReqItemRows.length) {
				this._showMustAddClaimDialog();
				return;
			}

			const sReqId = String(oReqData.req_header.reqid || "").trim();
			const sEmpId = this._oSessionModel.getProperty("/userId");

			if (!sReqId || !sEmpId) {
				MessageBox.error(Utility.getText("req_tm_w_emp_id_req_id_not_found"));
				return;
			}

			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new Dialog({
					title: "Submit Request",
					type: DialogType.Message,
					content: [new Label({ text: Utility.getText("req_d_w_submit") })],
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: Utility.getText("req_btn_confirm"),
						press: async () => {
							try {
								BusyIndicator.show(0);

								// budget checking
								var aResult = await budgetCheck.backendBudgetChecking(this, "REQ");
								var oErrorHandling = budgetCheck.budgetCheckHandling(aResult);
								var bApproversDetermined = true;

								if (oErrorHandling.bCanProceed) {

									// move approver determination function before claim is saved
									// if approvers are determined, bApproversDetermined = true and proceed with changing status to PENDING APPROVAL
									// else, do not change claim status
									// update status to PENDING APPROVAL
									var oModel = this.getView().getModel();
									var oEmployeeViewModel = this.getView().getModel("employee_view");
									const sCurrentReqId = String(this._oReqModel.getProperty("/req_header/reqid") || "").trim();
									bApproversDetermined = await workflowApproval.onPARApproverDetermination(this, oModel, sCurrentReqId, oEmployeeViewModel);
									if(bApproversDetermined){
										await Utility._updateStatus(this._oDataModel, sCurrentReqId, this._oConstant.ClaimStatus.PENDING_APPROVAL);
										await Utility._updateSubmittedDate(this._oDataModel, sCurrentReqId);
										this._oReqModel.setProperty("/view", 'view');
										
										// this._oReqModel.setProperty("/req_header/reqstatus", this._oConstant.ClaimStatus.PENDING_APPROVAL)
										await this._loadRequest(sCurrentReqId);
									}else{
										throw new Error(Utility.getText("msg_failed_no_approver"))
									}

								} else {
									MessageBox.error(Utility.getText("req_tm_w_inform_cc_owner", oErrorHandling.aClaimTypeItem));
								}
							} catch (e) {
								MessageBox.error(e.message || Utility.getText("req_d_e_submit_failed"));
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
					title: Utility.getText("req_d_w_missing_item"),
					type: DialogType.Message,
					state: ValueState.Warning,
					content: [
						new Label({
							text: Utility.getText("req_tm_w_submit"),
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

		async onBackView() {
			var oCreate = this.byId('request_create_item_fragment');
			const sReqId = this._oReqModel.getProperty("/req_header/reqid");
			if (oCreate) {
				this._showItemList(sReqId);
				this._oReqModel.setProperty('/req_item', {});
			} else {
				PARequestSharedFunction._ensureRequestModelDefaults(this._oReqModel);
				await this._removeByLocalId("req_approval_log");
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
				if (sPreviousHash) {
					window.history.go(-1);
				} else {
					this._oRouter.navTo("RequestFormStatus");
				}
			}
		},

		onCancelItem() {
			const oData = this._oReqModel.getData();
			const sReqId = String(oData.req_header.reqid || "").trim();
			this._oReqModel.setProperty('/req_item', {});
			this._oReqModel.setProperty('/view', "view");

			PARequestSharedFunction._getItemList(this, sReqId);
			this._showItemList(sReqId);
			this._resetReqItemInputs();
		},

		/* =========================================================
		* Header & Item List Area
		* ======================================================= */

		async onDocLinkPress(oEvent) {
			// calling function from Attachment.js
			let sDocument = oEvent.getSource().getText();
			let sDocumentSFId = sDocument.split(" - ")[0];
			Attachment.onViewDocument(this, sDocumentSFId);
		},

		async onAddItem(oEvent) {
			this._oReqModel.setProperty("/view", this._oConstant.PARMode.CREATE);
			await this._showItemCreate(false);
			this._loadSelections();

			const oReqData = this._oReqModel.getData();
			const aIndividual = ['IND', 'Individual'];
			const sHeaderGrpType = oReqData.req_header.grptype;

			oReqData.req_item = {               
				est_amount: 0,
				kilometer: 0,
				rate_per_kilometer: 0,
				cash_advance: false,
				entitled_breakfast: 0,
				entitled_lunch: 0,
				entitled_dinner: 0,
				daily_allowance: 0,
				travel_day: 0,
				travel_hour: 0
			};

			// if group type is Individual
			if (aIndividual.includes(sHeaderGrpType)) {
				this.byId("ipb_upload_participant").setEnabled(false);
				this.byId("ipb_delete_participant").setEnabled(false);
				this.byId("idp_delete_row_participant").setVisible(false);
				oReqData.participant = [{
					PARTICIPANTS_ID: this._oSessionModel.getProperty("/userId"),
					PARTICIPANT_NAME: this._oSessionModel.getProperty("/userName"),
					PARTICIPANT_COST_CENTER: this._oSessionModel.getProperty("/costCenters"),
					ALLOCATED_AMOUNT: "",
					_EDIT_MODE: "Display"
				}];
			} else {
				oReqData.participant = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
			}
			this._oReqModel.setData(oReqData);
		},

		onOpenItemView(oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ false);
		},

		onOpenItemEdit(oEvent) {
			return this._openItemFromList(oEvent, /* bEdit = */ true);
		},

		_openItemFromList(oEvent, bEdit) {
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
				MessageBox.warning(Utility.getText("req_tm_w_select"));
				return;
			}

			const oReqItem = oCtx.getObject();
			const sReqId = String(oReqItem.REQUEST_ID || oReq.getProperty("/req_header/reqid") || "").trim();
			const sReqSubId = String(oReqItem.REQUEST_SUB_ID || "").trim();

			this._oReqModel.setProperty("/req_item", {
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
				doc1_filename			: oReqItem.ATTACHMENT1 || "",
				cat_purpose				: oReqItem.MOBILE_CATEGORY_PURPOSE_ID || "",
				doc2_filename			: oReqItem.ATTACHMENT2 || "",
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
				fare_type				: oReqItem.FARE_TYPE_ID || "",
				vehicle_class			: oReqItem.VEHICLE_CLASS || "",
				kilometer				: oReqItem.KILOMETER || 0,
				rate_per_kilometer		: oReqItem.RATE || 0,
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
				trip_start_date			: oReqItem.TRIP_START_DATE || null,
				trip_end_date			: oReqItem.TRIP_END_DATE || null,
				trip_start_time			: oReqItem.TRIP_START_TIME || null,
				trip_end_time			: oReqItem.TRIP_END_TIME || null,
				travel_day				: oReqItem.TRAVEL_DURATION_DAY || 0,
				travel_hour				: oReqItem.TRAVEL_DURATION_HOUR || 0,
				entitled_breakfast		: oReqItem.ENTITLED_BREAKFAST || 0,
				entitled_lunch			: oReqItem.ENTITLED_LUNCH || 0,
				entitled_dinner			: oReqItem.ENTITLED_DINNER || 0,
				daily_allowance			: oReqItem.DAILY_ALLOWANCE || 0,
				currency_code		    : oReqItem.CURRENCY_CODE || null,
				currency_rate			: oReqItem.CURRENCY_RATE || 0,
				type_of_professional_body		: oReqItem.TYPE_OF_PROFESSIONAL_BODY || null,
				// extra hidden field value
				cost_center				: oReqItem.COST_CENTER || "",
				gl_account				: oReqItem.GL_ACCOUNT || "",
				material_code			: oReqItem.MATERIAL_CODE || "",
				dependent_relationship	: oReqItem.DEPENDENT_RELATIONSHIP || "",
				meter_cube_actual		: oReqItem.METER_CUBE_ACTUAL || 0
			});

			const sState = this._oReqModel.getProperty("/view");
			if (sState != this._oConstant.PARMode.APPROVER) {
				this._oReqModel.setProperty("/view", bEdit ? this._oConstant.PARMode.EDIT : this._oConstant.PARMode.VIEW);
				this._getClaimTypeItemSelection();
			} else {
				this._oReqModel.setProperty("/view", this._oConstant.PARMode.VIEWAPPR);
			}
			this._showItemCreate(bEdit);
			this._loadParticipantsForItem(sReqId, sReqSubId);
			this.initializeClaimTypeItemFields(false);
		},

		async _loadParticipantsForItem(sReqId, sReqSubId) {
			
			const setEmpty = () => {
				this._oReqModel.setProperty("/participant", [
					{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }
				]);
			};

			if (!sReqId || !sReqSubId) {
				setEmpty();
				return;
			}

			try {

				const oListBinding = this._oViewModel.bindList(
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

				var sMode = this._oReqModel.getProperty("/view");

				const aMapped = aParticipants.map((p) => ({
					PARTICIPANTS_ID			: p.PARTICIPANTS_ID 	?? "",
					PARTICIPANT_NAME		: p.NAME 				?? "",
					PARTICIPANT_COST_CENTER	: p.CC 					?? "",
					ALLOCATED_AMOUNT		: p.ALLOCATED_AMOUNT 	?? "",
					_EDIT_MODE				: sMode == this._oConstant.PARMode.CREATE ? "Editable" : "Display"
				}));

				if ( this._oReqModel.getProperty('/req_header/grptype') == this._oConstant.GroupType.GROUP && 
					( sMode != this._oConstant.PARMode.VIEW && sMode != this._oConstant.PARMode.APPROVER) ) {
					aMapped.push({ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" });
				}

				this._oReqModel.setProperty(
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

		/* =========================================================
		* Item List: Delete Row(s)
		* ======================================================= */

		async onRowDeleteReqItem(oEvent) {
			const oTable = this._resolveControl("req_item_table_d", "request") || this._resolveControl("req_item_table", "request");
			let aRows = this._oReqModel.getProperty("/req_item_rows") || [];

			const getIndexFromCtx = (oCtx) => {
				if (!oCtx) return null;
				const i = parseInt(oCtx.getPath().split("/").pop(), 10);
				return Number.isInteger(i) ? i : null;
			};

			let aToDelete = [];
			const aSelected = oTable.getSelectedIndices() || [];

			if (aSelected.length > 0) {
				aToDelete = aSelected
					.map(idx => getIndexFromCtx(oTable.getContextByIndex(idx)))
					.filter(idx => idx !== null);
			} else {
				const oRow = oEvent.getParameter("row");
				const iRowIdx = oEvent.getParameter("rowIndex");
				
				let oCtx = oRow ? oRow.getBindingContext("request") : 
						(Number.isInteger(iRowIdx) ? oTable.getContextByIndex(iRowIdx) : null);
						
				const iSingleIdx = getIndexFromCtx(oCtx);
				if (iSingleIdx !== null) aToDelete.push(iSingleIdx);
			}

			if (aToDelete.length === 0) {
				MessageBox.warning(Utility.getText("req_d_e_select_item"));
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
						sErrorMsg = Utility.getText("req_tm_w_missing_reqid_reqsubid");
						continue;
					}

					try {
						await this._deleteItemCascade(reqId, subId);
						aSuccessIdx.push(i);
					} catch (e) {
						sErrorMsg = e.message || Utility.getText('req_tm_w_delete_req_item');
					}
				}

				if (aSuccessIdx.length > 0) {
					aSuccessIdx.forEach((i) => aRows.splice(i, 1));
					
					this._oReqModel.setProperty("/req_item_rows", aRows);
					this._oReqModel.setProperty("/list_count", aRows.length);
					MessageToast.show(Utility.getText('req_tm_s_delete_req_item', [aSuccessIdx.length]));
				}

				if (sErrorMsg) {
					MessageBox.error(sErrorMsg);
				}

				const toNumber = (v) => {
					if (v === null || v === undefined || v === "") return 0;
					const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
					return Number.isFinite(n) ? n : 0;
				};

				const oTotals = aRows.reduce((acc, row) => {
					const fReqAmt = row?.EST_AMOUNT ?? row?.est_amount ?? row?.EST_AMT ?? 0;
					
					const fCashAdvAmt = row?.CASH_ADVANCE ? row.EST_AMOUNT : 0;
					
					return {
						fReqTotal: acc.fReqTotal + toNumber(fReqAmt),
						fCashTotal: acc.fCashTotal + toNumber(fCashAdvAmt)
					};
				}, { fReqTotal: 0, fCashTotal: 0 });

				const oRound2 = (n) => Math.round(n * 100) / 100;

				const oHeader = this._oReqModel.getProperty("/req_header") || {};
				oHeader.reqamt = oRound2(oTotals.fReqTotal);
				oHeader.cashadvamt = oRound2(oTotals.fCashTotal);
				
				this._oReqModel.setProperty("/req_header", oHeader);
				oTable.clearSelection();

			} finally {
				BusyIndicator.hide();
			}
		},

		async _deleteItemCascade(sReqId, sReqSubId) {
			const sGroup = "deleteItemCascade";

			const cast = (v) => /^\d+$/.test(String(v)) ? Number(v) : String(v);
			const isNotFound = (e) => [404].includes(e?.status || e?.statusCode || e?.httpStatus || e?.cause?.status || e?.cause?.statusCode);

			const vReq = cast(sReqId);
			const vSub = cast(sReqSubId);

			try {
				const oPartList = this._oDataModel.bindList("/ZREQ_ITEM_PART", null, null, [
					new Filter("REQUEST_ID", FilterOperator.EQ, vReq),
					new Filter("REQUEST_SUB_ID", FilterOperator.EQ, vSub)
				], { $$ownRequest: true, $$groupId: "$auto", $select: "REQUEST_ID,REQUEST_SUB_ID,PARTICIPANTS_ID" });

				const oItemList = this._oDataModel.bindList("/ZREQUEST_ITEM", null, null, [
					new Filter("REQUEST_ID", FilterOperator.EQ, vReq),
					new Filter("REQUEST_SUB_ID", FilterOperator.EQ, vSub)
				], { $$ownRequest: true, $$groupId: "$auto", $select: "REQUEST_ID,REQUEST_SUB_ID" });

				const [aPartCtx, aItemCtx] = await Promise.all([
					oPartList.requestContexts(0, 500).catch(e => isNotFound(e) ? [] : Promise.reject(e)),
					oItemList.requestContexts(0, 1).catch(e => isNotFound(e) ? [] : Promise.reject(e))
				]);

				aPartCtx.forEach(ctx => {
					ctx.delete(sGroup).catch(e => { if (!isNotFound(e)) throw e; });
				});

				if (aItemCtx && aItemCtx.length > 0) {
					aItemCtx[0].delete(sGroup).catch(e => { if (!isNotFound(e)) throw e; });
				}

				await this._oDataModel.submitBatch(sGroup);
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
			if (this._oReqModel.getProperty("/req_header/grptype") !== this._oConstant.GroupType.GROUP) return;

			const src = oEvent.getSource();
			const sVal = (oEvent.getParameter && oEvent.getParameter("value")) ?? (src?.getValue?.() ?? "");
			const sTrim = String(sVal).trim();

			const oCtx = src.getBindingContext("request");
			if (!oCtx) return;

			const path = oCtx.getPath();
			const segs = path.split("/");
			const idx = parseInt(segs[segs.length - 1], 10);
			if (!Number.isInteger(idx)) return;

			let aRows = this._oReqModel.getProperty("/participant");
			if (!Array.isArray(aRows)) {
				aRows = [];
				this._oReqModel.setProperty("/participant", aRows);
			}

			this._oReqModel.setProperty(`/participant/${idx}/PARTICIPANTS_ID`, sTrim);

			this._normalizeTrailingEmptyRow(aRows);

			const isLast = idx === aRows.length - 1;
			if (isLast && sTrim) {
				this._oReqModel.setProperty(`/participant/${aRows.length}`, { PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
			}
		},

		_normalizeTrailingEmptyRow(aRows) {
			let iLastNonEmpty = -1;
			for (let i = 0; i < aRows.length; i++) {
				const r = aRows[i] || {};
				const isEmpty = !String(r.PARTICIPANTS_ID || "").trim() && !String(r.ALLOCATED_AMOUNT || "").trim();
				if (!isEmpty) iLastNonEmpty = i;
			}
			const desiredLength = Math.max(iLastNonEmpty + 2, 1);
			if (aRows.length > desiredLength) {
				aRows.splice(desiredLength);
				this._oReqModel.setProperty("/participant", aRows.slice());
			} else if (aRows.length === 0) {
				aRows.push({ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" });
				this._oReqModel.setProperty("/participant", aRows);
			}
		},

		async onRowDeleteParticipant(oEvent) {
			const oTable = this.byId("req_participant_table");
			let aRows = this._oReqModel.getProperty("/participant") || [];

			// --- 1. Identify which row(s) to delete ---
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
				idxFromAction = extractIndexFromCtxPath(oRow.getBindingContext("request"));
			} else if (Number.isInteger(visIdx)) {
				idxFromAction = extractIndexFromCtxPath(oTable.getContextByIndex(visIdx));
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
				MessageBox.warning(Utility.getText("req_tm_w_select_participant"));
				return;
			}

			aToDelete = Array.from(new Set(aToDelete));

			let aBackendPayload = [];
			let aIndicesToRemove = []; 

			aToDelete.forEach(i => {
				const rowData = aRows[i] || {};
				const sPID = String(rowData.PARTICIPANTS_ID ?? rowData.PARTICIPANT_ID ?? "").trim();
				const sReqId = String(rowData.REQUEST_ID ?? this._oReqModel.getProperty("/req_header/reqid") ?? "").trim();
				const sReqSubId = String(rowData.REQUEST_SUB_ID ?? this._oReqModel.getProperty("/req_item/req_subid") ?? "").trim();

				if (sPID && sReqId && sReqSubId) {
					aBackendPayload.push({
						REQUEST_ID: sReqId,
						REQUEST_SUB_ID: sReqSubId,
						PARTICIPANTS_ID: sPID,
						_localIndex: i 
					});
				} else {
					aIndicesToRemove.push(i);
				}
			});

			if (aBackendPayload.length > 0) {
				BusyIndicator.show(0);
				try {
					const aCleanPayload = aBackendPayload.map(item => {
						return {
							REQUEST_ID: item.REQUEST_ID,
							REQUEST_SUB_ID: item.REQUEST_SUB_ID,
							PARTICIPANTS_ID: item.PARTICIPANTS_ID
						};
					});

					const oAction = this._oDataModel.bindContext("/deleteParticipants(...)");
					oAction.setParameter("participants", aCleanPayload);
					
					await oAction.execute();

					aBackendPayload.forEach(item => aIndicesToRemove.push(item._localIndex));
					
				} catch (error) {
					MessageBox.error(Utility.getText("req_d_e_delete_participant"));
					BusyIndicator.hide();
					return; 
				} finally {
					BusyIndicator.hide();
				}
			}

			if (aIndicesToRemove.length > 0) {
				aIndicesToRemove.sort((a, b) => b - a).forEach((i) => {
					if (i >= 0 && i < aRows.length) aRows.splice(i, 1);
				});

				if (!Array.isArray(aRows) || aRows.length === 0) {
					aRows = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
				} else if (this._normalizeTrailingEmptyRow) {
					this._normalizeTrailingEmptyRow(aRows);
				}

				this._oReqModel.setProperty("/participant", aRows);
				oTable.clearSelection();
				
				MessageToast.show(Utility.getText("req_tm_s_delete_participant", [aIndicesToRemove.length]));

				if (typeof RequestUtility !== "undefined" && RequestUtility.populateAllocatedAmount) {
					RequestUtility.populateAllocatedAmount();
				}
			}
		},

		/* =========================================================
		* Save Draft / Save Item / Save+Another
		* ======================================================= */

		onSaveItem() {
			this.onSave();
		},

		async onSaveAddAnother(oEvent) {
			await this.onSave(oEvent, true);
			
			this._setAllControlsVisible(false);
			const oData = this._oReqModel.getData();
			oData.req_item = {};
			if (oData.req_header.grptype === 'Individual') {
				oData.participant = [{
					PARTICIPANTS_ID: oData.user.emp_id,
					PARTICIPANT_NAME: oData.user.name,
					PARTICIPANT_COST_CENTER: oData.user.cost_center,
					ALLOCATED_AMOUNT: ""
				}];
			} else {
				oData.participant = [{ PARTICIPANTS_ID: "", PARTICIPANT_NAME: "", PARTICIPANT_COST_CENTER: "", ALLOCATED_AMOUNT: "" }];
			}
			oData.view = "create";
			this._oReqModel.setData(oData);
		},
		
		async onSave(oEvent, bAddAnother = false) {
			const oData = this._oReqModel.getData();
			const oReqHeader = oData.req_header;
			const oReqItem = oData.req_item;
			const sReqId = String(oData.req_header.reqid || "").trim();
			const sEmpId = this._oSessionModel.getProperty("/userId");
			const bIsEdit = this._oReqModel.getProperty("/view") === "i_edit";

			if (!sReqId || !sEmpId) return MessageBox.error(Utility.getText("req_tm_w_emp_id_req_id_not_found"));
			this.calculateNumberOfHours();

			// validate mandatory fields
			if (!this.getOwnerComponent().getValidator().validate(this.getView())) {
				MessageBox.error(Utility.getText("req_d_w_mandatory_field"), {
					closeOnBrowserNavigation: false
				});
				return;
			}

			var fEstAmount = this._oReqModel.getProperty('/req_item/est_amount');
			if (parseFloat(fEstAmount) <= parseFloat(0)) {
				MessageBox.error(Utility.getText("req_d_w_error_amount"))
				return;
			}

			// Eligibility Checking
			var aPayload = EligibilityCheck.generateEligibilityCheckPayload(this, this._oConstant.SubmissionTypePrefix.REQUEST);
			var oReturnPayload = await EligibleScenarioCheck.onEligibilityCheck(this._oDataModel, aPayload);
			var	bCanProceed = await EligibilityCheck.eligibilityHandling(this, oReturnPayload, this._oConstant.SubmissionTypePrefix.REQUEST);

			if (!bCanProceed) return;

			BusyIndicator.show(0);

			try {
				let sAttachment1_SFID, sAttachment2_SFID;
				if (oReqItem.doc1) {
					const sAttachment1Binary = await Attachment.getFileAsBinary(oReqItem.doc1);
					sAttachment1_SFID = await Attachment.postAttachment(oReqItem.doc1.name, sAttachment1Binary, sEmpId);
				}
				if (oReqItem.doc2) {
					const sAttachment2Binary = await Attachment.getFileAsBinary(oReqItem.doc2);
					sAttachment2_SFID = await Attachment.postAttachment(oReqItem.doc2.name, sAttachment2Binary, sEmpId);
				}

				if (oReqItem.cash_advance) {
					oReqItem.cost_center 	= this._oConstant.CashAdvanceInfo.COST_CENTER;
					oReqItem.gl_account		= this._oConstant.CashAdvanceInfo.GL_ACCOUNT;
				} else {
					oReqItem.cost_center 	= (oReqHeader.altcostcenter && oReqHeader.altcostcenter !== "-") 
											? oReqHeader.altcostcenter 
											: oReqHeader.costcenter;
					oReqItem.gl_account		= await budgetCheck._getGLAccount(this._oDataModel, oReqHeader.claimtype);
					oReqItem.material_code	= await budgetCheck._getMaterialCode(this._oDataModel, oReqHeader.claimtype, oReqItem.claim_type_item_id);
				}

				if (oReqItem.departure_time || oReqItem.arrival_time) {
					var dtDeparture_date 	= new Date(oReqItem.departure_time).toISOString() || null;
					var dtArrival_date 	= new Date(oReqItem.arrival_time).toISOString() || null;
				}

				let oPayload = {
					EMP_ID: 					  sEmpId,
					REQUEST_ID:                   sReqId,
					CLAIM_TYPE_ID:                oData.req_header.claimtype,
					CLAIM_TYPE_ITEM_ID:           oReqItem.claim_type_item_id,
					PURPOSE:                      oReqItem.purpose || null,
					REMARK:                       oReqItem.remark || null,
					COURSE_TITLE:                 oReqItem.course || null,
					DEPENDENT:                    oReqItem.dependent || null,
					DEPENDENT_RELATIONSHIP:       oReqItem.dependent_relationship || null,
					KWSP_SPORTS_REPRESENTATION:   oReqItem.sport_rep || null,
					MOBILE_CATEGORY_PURPOSE_ID:   oReqItem.cat_purpose || null,
					VEHICLE_OWNERSHIP_ID:         oReqItem.vehicle_ownership || null,
					VEHICLE_TYPE:                 oReqItem.type_of_vehicle || null,
					VEHICLE_CLASS_ID:             oReqItem.vehicle_class || null,
					ROOM_TYPE:                    oReqItem.room_type || null,
					FLIGHT_CLASS:                 oReqItem.flight_class || null,
					FARE_TYPE_ID:                 oReqItem.fare_type || null,
					MARRIAGE_CATEGORY:            oReqItem.marriage_cat || null,
					MODE_OF_TRANSFER:             oReqItem.mode_of_transfer || null,
					COUNTRY:                      oReqItem.country || null,
					REGION:                       oReqItem.sss || null,
					AREA:                         oReqItem.area || null,
					LOCATION:                     oReqItem.location || null,
					LOCATION_TYPE:                oReqItem.location_type || null,
					FROM_STATE_ID:                oReqItem.from_state || null,
					FROM_LOCATION:                oReqItem.from_location || null,
					FROM_LOCATION_OFFICE:         oReqItem.from_location_office || null,
					TO_STATE_ID:                  oReqItem.to_state || null,
					TO_LOCATION:                  oReqItem.to_location || null,
					TO_LOCATION_OFFICE:           oReqItem.to_location_office || null,
					COST_CENTER:                  oReqItem.COST_CENTER || null,
					GL_ACCOUNT:                   oReqItem.gl_account || null,
					MATERIAL_CODE:                oReqItem.material_code || null,
					START_DATE:                   oReqItem.start_date || null,
					END_DATE:                     oReqItem.end_date || null,
					TRANSFER_DATE:                oReqItem.tarikh_pindah || null,
					START_TIME:                   oReqItem.start_time || null, 
					END_TIME:                     oReqItem.end_time || null,
					DEPARTURE_TIME:               dtDeparture_date || null,
					ARRIVAL_TIME:                 dtArrival_date || null,
					NO_OF_DAYS:                   parseInt(oReqItem.no_of_days, 10) || 0,
					FAMILY_COUNT:                 parseInt(oReqItem.no_of_family_member, 10) || 0,
					EST_NO_PARTICIPANT:           parseInt(oReqItem.est_no_participant, 10) || 1,
					EST_AMOUNT:                   parseFloat(oReqItem.est_amount || 0),
					KILOMETER:                    parseFloat(oReqItem.kilometer || 0),
					RATE_PER_KM:                  oReqItem.rate_per_kilometer_id || null,
					TOLL:                         parseFloat(oReqItem.toll_amt || 0),
					METER_CUBE_ENTITLED:          parseFloat(oReqItem.cube_eligible || 0),
					METER_CUBE_ACTUAL:            parseFloat(oReqItem.meter_cube_actual || 0),
					DECLARE_CLUB_MEMBERSHIP:      !!oReqItem.club_membership,
					CASH_ADVANCE:                 !!oReqItem.cash_advance,
					TRAVEL_DURATION_DAY:          parseFloat(oReqItem.travel_day || 0), 
                    TRAVEL_DURATION_HOUR:         parseFloat(oReqItem.travel_hour || 0),
                    TRIP_START_DATE:              oReqItem.trip_start_date || null,
                    TRIP_END_DATE:                oReqItem.trip_end_date || null,
                    TRIP_START_TIME:              oReqItem.trip_start_time || null,
                    TRIP_END_TIME:                oReqItem.trip_end_time || null,
                    DAILY_ALLOWANCE:              parseInt(oReqItem.daily_allowance, 10) || 0,
                    ENTITLED_BREAKFAST:           parseInt(oReqItem.entitled_breakfast, 10) || 0,
                    ENTITLED_LUNCH:               parseInt(oReqItem.entitled_lunch, 10) || 0,
                    ENTITLED_DINNER:              parseInt(oReqItem.entitled_dinner, 10) || 0,
					CURRENCY_CODE:				  oReqItem.currency_code || null,
					CURRENCY_RATE:			      parseFloat(oReqItem.currency_rate || 0),
					TYPE_OF_PROFESSIONAL_BODY:    oReqItem.type_of_professional_body || null
				};

				if (sAttachment1_SFID) oPayload.ATTACHMENT1 = `${sAttachment1_SFID} - ${oReqItem.doc1.name}`;
				if (sAttachment2_SFID) oPayload.ATTACHMENT2 = `${sAttachment2_SFID} - ${oReqItem.doc2.name}`;

				if (bIsEdit) {
                    const sReqSubId = String(oReqItem.req_subid || "").trim();
                    const oList = this._oDataModel.bindList("/ZREQUEST_ITEM", null, null, [
                        new Filter("REQUEST_ID", FilterOperator.EQ, sReqId),
                        new Filter("REQUEST_SUB_ID", FilterOperator.EQ, sReqSubId)
                    ], { $$updateGroupId: "itemSave" });

                    const aCtx = await oList.requestContexts(0, 1);
                    if (!aCtx[0]) throw new Error("Item not found");
                    
                    Object.keys(oPayload).forEach(key => aCtx[0].setProperty(key, oPayload[key]));

                    await this._upsertParticipantsForItem(sReqId, sReqSubId, oData.participant);
                    await this._oDataModel.submitBatch("itemSave");

					Attachment.postMDFChild(sReqId, sReqSubId, sAttachment1_SFID ,sAttachment2_SFID)

                } else {
                    const oItemContext = this._oDataModel.bindList("/ZREQUEST_ITEM").create(oPayload, { $$updateGroupId: "itemCreate" });
                    
                    await this._oDataModel.submitBatch("itemCreate");
					await oItemContext.created();
                    
                    const sGeneratedSubId = oItemContext.getProperty("REQUEST_SUB_ID");

                    if (!sGeneratedSubId) {
                        throw new Error("Failed to retrieve generated Request Sub ID from backend.");
                    }
					
					// upload Child MDF
					Attachment.postMDFChild(sReqId, sGeneratedSubId, sAttachment1_SFID ,sAttachment2_SFID)

                    const aParts = oData.participant || [];
                    let bHasParticipants = false;

                    for (const p of aParts) {
                        const sPID = String(p.PARTICIPANTS_ID || "").trim();
                        if (!sPID) continue;
                        
                        bHasParticipants = true;
                        this._oDataModel.bindList("/ZREQ_ITEM_PART").create({
                            REQUEST_ID: sReqId,
                            REQUEST_SUB_ID: sGeneratedSubId,
                            PARTICIPANTS_ID: sPID,
                            ALLOCATED_AMOUNT: parseFloat(p.ALLOCATED_AMOUNT || 0)
                        }, { $$updateGroupId: "partCreate" });
                    }

                    if (bHasParticipants) {
                        await this._oDataModel.submitBatch("partCreate");
                    }
                    
                    const oHeaderContext = this.getView().getBindingContext(); 
                    if (oHeaderContext) oHeaderContext.refresh();

                }

                MessageToast.show("Success");
				if (!bAddAnother) {
					this._loadRequest(sReqId);
					this._oReqModel.setProperty("/view", this._oConstant.PARMode.VIEW);
				}

			} catch (e) {
				MessageBox.error(e.message || Utility.getText("req_d_e_save_failed"));
			} finally {
				BusyIndicator.hide();
				this._resetReqItemInputs();
			}
		},

		onImportChange1( oEvent ) {
			const oData = this._oReqModel.getProperty("/req_item")
			oData.doc1 = oEvent.getParameters("files").files[0];
		},
		
		onImportChange2( oEvent ) {
			const oData = this._oReqModel.getProperty("/req_item")
			oData.doc2 = oEvent.getParameters("files").files[0];
		},

		async _upsertParticipantsForItem(sReqId, sReqSubId, aParticipants) {
			const sGroup = "upsertParts";
			const aList = Array.isArray(aParticipants) ? aParticipants : [];

			let aExistingCtx = [];
			try {
				const oList = this._oDataModel.bindList(
					"/ZREQ_ITEM_PART",
					null,
					null,
					[
						new Filter("REQUEST_ID", FilterOperator.EQ, sReqId),
						new Filter("REQUEST_SUB_ID", FilterOperator.EQ, sReqSubId)
					],
					{ $$ownRequest: true }
				);
				aExistingCtx = await oList.requestContexts(0, Infinity);
			} catch (err) {
				console.error("Load failed:", err);
			}

			const mExisting = {};
			aExistingCtx.forEach(oCtx => {
				const oData = oCtx.getObject();
				const sKey = `${oData.REQUEST_ID}-${oData.REQUEST_SUB_ID}-${oData.PARTICIPANTS_ID}`;
				mExisting[sKey] = oCtx;
			});

			const oPartList = this._oDataModel.bindList("/ZREQ_ITEM_PART", null, null, null, {
				$$updateGroupId: sGroup
			});

			const aProcessedKeys = [];

			aList.forEach((p) => {
				const sPID = String(p.PARTICIPANTS_ID || p.PARTICIPANT_ID || "").trim();
				if (!sPID) return;

				const sCurrentKey = `${sReqId}-${sReqSubId}-${sPID}`;
				const fAlloc = parseFloat(p.ALLOCATED_AMOUNT || 0);
				aProcessedKeys.push(sCurrentKey);

				if (mExisting[sCurrentKey]) {
					// --- UPDATE CASE ---
					const oExistingCtx = mExisting[sCurrentKey];
					if (oExistingCtx.getProperty("ALLOCATED_AMOUNT") !== fAlloc) {
						oExistingCtx.setProperty("ALLOCATED_AMOUNT", fAlloc, sGroup);
					}
				} else {
					// --- CREATE CASE ---
					oPartList.create({
						REQUEST_ID: sReqId,
						REQUEST_SUB_ID: sReqSubId,
						PARTICIPANTS_ID: sPID,
						ALLOCATED_AMOUNT: fAlloc
					}, true);
				}
			});

			Object.keys(mExisting).forEach(sKey => {
				if (!aProcessedKeys.includes(sKey)) {
					mExisting[sKey].delete(sGroup).catch(() => { /* handle silent */ });
				}
			});

			if (this._oDataModel.hasPendingChanges(sGroup)) {
				await this._oDataModel.submitBatch(sGroup);
			}
		},

		/* =========================================================
		* Participant Value Help 
		* ======================================================= */

		onCashAdvanceChange: function (oEvent) {

			// Get model
			const oRequestModel = this.getView().getModel("request");

			// Read event start date
			const dTripDate = oRequestModel.getProperty("/req_header/tripstartdate");

			if (!dTripDate) {
				return; // no date entered yet
			}

			// Convert to JS Date
			const dEventDate = new Date(dTripDate);
			const dToday = new Date();
			dToday.setHours(0,0,0,0);

			// ✅ If event date is before today → backdated
			if (dEventDate < dToday) {

				// Update model value
				oRequestModel.setProperty("/req_item/cash_advance", false);

				// Show message
				MessageBox.error(
					Utility.getText("msg_cash_advance_not_allow")
				);
			}
		},

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
					MessageBox.error(Utility.getText("req_d_e_emp_not_found"));
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

			if (oEmpData) {
				this._oReqModel.setProperty(sRowPath + "/PARTICIPANTS_ID", oEmpData.EEID || oEmpData.ID);
				this._oReqModel.setProperty(sRowPath + "/PARTICIPANT_NAME", oEmpData.NAME);
				this._oReqModel.setProperty(sRowPath + "/PARTICIPANT_COST_CENTER", oEmpData.CC);
				RequestUtility.populateAllocatedAmount();	// populate allocated amount if applicable
				
			} else {
				this._oReqModel.setProperty(sRowPath + "/PARTICIPANTS_ID", "");
				this._oReqModel.setProperty(sRowPath + "/PARTICIPANT_NAME", "");
				this._oReqModel.setProperty(sRowPath + "/PARTICIPANT_COST_CENTER", "");
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
			if (!oFile) return;
			
			BusyIndicator.show(0);

			var oReader = new FileReader();

			oReader.onload = async (e) => { 
				try {
					var oData = new Uint8Array(e.target.result);
					var oWorkbook = XLSX.read(oData, { type: "array" });
					var oWorkSheet = oWorkbook.Sheets[oWorkbook.SheetNames[0]];
					var aJsonData = XLSX.utils.sheet_to_json(oWorkSheet);

					if (!aJsonData || aJsonData.length === 0) {
						MessageBox.error(Utility.getText("req_d_e_excel_file_empty"));
						return;
					}

					const aUploadedIds = [...new Set(
						aJsonData
							.map(row => String(row.PARTICIPANTS_ID || "").trim())
							.filter(id => id !== "")
					)];

					if (aUploadedIds.length === 0) {
						MessageBox.error(Utility.getText("req_d_e_excel_no_valid_participant"));
						return;
					}

					const aInvalidIds = await this._getInvalidParticipantIds(aUploadedIds);

					if (aInvalidIds.length > 0) {
						MessageBox.error(
							Utility.getText("req_d_e_excel_upload_failed") + 
							aInvalidIds.join(", ")
						);
						return;
					}

					this._oReqModel.setProperty("/participant", aJsonData);
					MessageToast.show("Participants successfully validated and uploaded.");

				} catch (err) {
					MessageBox.error("Error processing file: " + err.message);
				} finally {
					var fu = this.byId("participant_list_upload");
					if (fu) fu.clear();
					BusyIndicator.hide();
				}
			};

			oReader.readAsArrayBuffer(oFile);
		},

		async _getInvalidParticipantIds(aUploadedIds) {
			const iChunkSize = 100; 
			let aFoundIdsInDB = [];

			for (let i = 0; i < aUploadedIds.length; i += iChunkSize) {
				const aChunk = aUploadedIds.slice(i, i + iChunkSize);
				
				const aFilters = aChunk.map(id => new sap.ui.model.Filter("EEID", sap.ui.model.FilterOperator.EQ, id));
				const oCombinedFilter = new sap.ui.model.Filter({ filters: aFilters, and: false });

				const oListBinding = this._oDataModel.bindList("/ZEMP_MASTER", null, null, [oCombinedFilter], {
					$$groupId: "$auto",
					$select: "EEID" 
				});

				const aContexts = await oListBinding.requestContexts(0, aChunk.length);
				const aChunkFound = aContexts.map(ctx => ctx.getProperty("EEID"));
				
				aFoundIdsInDB = aFoundIdsInDB.concat(aChunkFound);
			}

			const aInvalidIds = aUploadedIds.filter(id => !aFoundIdsInDB.includes(id));
			
			return aInvalidIds;
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

				const input = this._oReqModel?.getData();
				if (!input) {
					MessageBox.error(Utility.getText("req_d_e_excel_no_request_data"));
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
					"Cost Center"				: header.costcenter,
					"Alternate Cost Center"		: header.altcostcenter || "-",
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
				MessageBox.error(Utility.getText("req_d_e_excel_export_failed"));
			} finally {
				oView.setBusy(false);
			}
		},

		async _getParticipantsList(reqid) {
			const oListBinding = this._oViewModel.bindList(
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
			const oData = this._oReqModel.getData();
			const sClaimTypeId = oData.req_header.claimtype;
			const sGroupType = oData.req_header.grptype;

			if (!sClaimTypeId) {
				this._oReqModel.setProperty("/claim_type_items", []);
				return [];
			}

			BusyIndicator.show(0);

			try {
				const oListBinding = this._oDataModel.bindList(
					"/ZCLAIM_TYPE_ITEM",
					null,
					[
						new Sorter("CLAIM_TYPE_ITEM_ID", false)
					],
					[
						new Filter("STATUS", FilterOperator.EQ, "ACTIVE"),
						new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimTypeId),
						new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.SubmissionType.AUTO_APPROVE ),
						new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.SubmissionType.PRE_APPROVE ),
						new Filter("CATEGORY_ID", FilterOperator.NE, "X" )			// filter out claim type item that is not required for PAR
						// new Filter("IND_OR_GROUP", FilterOperator.EQ, sGroupType),
						// new Filter("IND_OR_GROUP", FilterOperator.EQ, "I_G")
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$select: "CLAIM_TYPE_ID,CLAIM_TYPE_ITEM_ID,CLAIM_TYPE_ITEM_DESC"
					}
				);

				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				this._oReqModel.setProperty("/claim_type_items", a);
				return a;

			} catch (err) {
				console.error("ODataV4 load claim type items failed:", err);
				this._oReqModel.setProperty("/claim_type_items", []);
				return [];
			} finally {
				BusyIndicator.hide();
			}
		},

		_getDependent() {
			const sEmpId = this._oSessionModel.getProperty("/userId");
			const oListBinding = this._oDataModel.bindList("/ZEMP_DEPENDENT", null, null, [
				new Filter("EMP_ID", FilterOperator.EQ, sEmpId)
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				this._oReqModel.setProperty('/ZEMP_DEPENDENT', aData);
			}).catch(err => console.error("RequestType Load Failed", err));
		},

		calculateNumberOfHours () {
			const oItem = this._oReqModel.getProperty("/req_item") || {};

			const sDeparture = oItem.departure_time;
			const sArrival   = oItem.arrival_time;

			if (!sDeparture || !sArrival) {
				this._oReqModel.setProperty("/req_item/no_of_hours", 0);
				return;
			}

			const dDeparture = new Date(sDeparture);
			const dArrival   = new Date(sArrival);

			if (isNaN(dDeparture.getTime()) || isNaN(dArrival.getTime())) {
				this._oReqModel.setProperty("/req_item/no_of_hours", 0);
				return; 
			}

			const iDiffMs = dArrival.getTime() - dDeparture.getTime();

			if (iDiffMs < 0) {
				MessageBox.error(Utility.getText("req_d_e_arrival_time_departure_time"));
				this._oReqModel.setProperty("/req_item/no_of_hours", 0);
				return;
			}

			const fHours = Math.round((iDiffMs / (1000 * 60 * 60)) * 100) / 100;

			// 7. Save it back to the JSON model
			this._oReqModel.setProperty("/req_item/no_of_hours", fHours);
		},

		getFromLocationByState () {
            var oSelect = this.byId("item_from_location_office");
            
            var oBinding = oSelect.getBinding("items");

            if (!oBinding) {
                return;
            }

            var aFilters = [
                new Filter("STATUS", FilterOperator.EQ, "ACTIVE"),
				new Filter("STATE_ID", FilterOperator.EQ, this._oReqModel.getProperty("/req_item/from_state"))
            ];

            oBinding.filter(aFilters);
        },

		getToLocationByState () {
            var oSelect = this.byId("item_to_location_office");
            
            var oBinding = oSelect.getBinding("items");

            if (!oBinding) {
                return;
            }

            var aFilters = [
                new Filter("STATUS", FilterOperator.EQ, "ACTIVE"),
				new Filter("STATE_ID", FilterOperator.EQ, this._oReqModel.getProperty("/req_item/to_state"))
            ];

            oBinding.filter(aFilters);
        },

		async getRatePerKM () {
			var sVehicleType = this._oReqModel.getProperty("/req_item/type_of_vehicle");
			const oListBinding = this._oDataModel.bindList("/ZRATE_KM", null, null, [
				new Filter("VEHICLE_TYPE_ID", FilterOperator.EQ, sVehicleType)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					this._oReqModel.setProperty("/req_item/rate_per_kilometer", oData.RATE);
					this._oReqModel.setProperty("/req_item/rate_per_kilometer_id", oData.RATE_KM_ID);
                	RequestUtility.populateAllocatedAmount();
					RequestUtility.determineOfficeMileage();
				}
			} catch (oError) {
				console.error("Error fetching Rate Per KM detail", oError);
			}
		},

		/* =========================================================
		* Field Visibility Functions 
		* ======================================================= */

		initializeClaimTypeItemFields: async function (bReset = true) {
			const sClaimTypeItem = this._oReqModel.getProperty("/req_item/claim_type_item_id");
			const sClaimType = this._oReqModel.getProperty("/req_header/claimtype");

			if (!sClaimTypeItem) {
				console.warn("No claim type item found yet.");
				return;
			}

			if (bReset) {
				this._resetReqItemInputs();
			} 

			const oLocationTypeSelect = this.byId("item_location_type");
			if (oLocationTypeSelect) {
				oLocationTypeSelect.setForceSelection(false);
				oLocationTypeSelect.setSelectedKey("");
			}

			BusyIndicator.show(0);

			try {
				const oListBinding = this._oDataModel.bindList("/ZDB_STRUCTURE", null, null, [
					new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.RequestFieldVisibilityConfig.SUBMISSION_TYPE),
					new Filter("COMPONENT_LEVEL", FilterOperator.EQ, this._oConstant.RequestFieldVisibilityConfig.ITEM),
					new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimType),
					new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaimTypeItem)
				]);

				const aCtx = await oListBinding.requestContexts(0, 1);

				if (!aCtx || aCtx.length === 0) {
					console.warn("No configuration rows for claim type item:", sClaimTypeItem);
					this._setAllControlsVisible(false);
					return; 
				}
				
				const oData = aCtx[0].getObject();
				const sFields = oData.FIELD || "";

				const aFieldIds = sFields.replace(/[\[\]\s]/g, "").split(",").filter(id => id.length > 0);

				this._setAllControlsVisible(false);

				if (aFieldIds.length > 0) {
					aFieldIds.forEach(id => {
						const control = this._resolveControl(id, "request");
						if (control && typeof control.setVisible === "function") {
							control.setVisible(true);
						} else {
							console.warn("Control not found or not visible-capable:", id);
						}
					});
					const _oHeader = this._oReqModel.getProperty("/req_header") || {};
					const _oItem = this._oReqModel.getProperty("/req_item") || {};
					var iDiffDays = DateUtility.calculateNumberOfDays(this._oConstant.SubmissionTypePrefix.REQUEST, _oHeader, _oItem);

					this._oReqModel.setProperty("/req_item/no_of_days", iDiffDays);
					this._onFilterRegion();

					switch (sClaimTypeItem) {
						case Constants.ClaimTypeItem.LODGING_L:
						case Constants.ClaimTypeItem.LODG_O:
							RequestUtility.populateAllocatedAmount();
							break;
					
						default:
							break;
					}
				}

			} catch (err) {
				console.error("OData bindList failed:", err);
			} finally {
				BusyIndicator.hide();
			}
		},

		_setAllControlsVisible (bVisible) {
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
				"i_fare_type",
				"i_vehicle_class",
				"i_kilometer",
				"i_rate_per_kilometer",
				"i_toll",
				"i_flight_class",
				"i_location_type",
				"i_mode_of_transfer",
				"i_tarikh_pindah",
				"i_no_of_days_3",
				"i_sss",
				"i_marriage_cat",
				"i_cube_eligible",
				"i_departure_time",
				"i_arrival_time",
				"i_lodging_cat",
				"i_trip_start_date",
				"i_trip_end_date",
				"i_trip_start_time", 
				"i_trip_end_time", 
				"i_travel_day", 
				"i_travel_hour", 
				"i_breakfast", 
				"i_lunch", 
				"i_dinner", 
				"i_daily_allowance",
				"i_currency_code",
				"i_currency_rate",
				"i_type_of_prof_body"
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
			if (this._approveDialog) { this._approveDialog.close(); }
			if (this._sendBackDialog) { this._sendBackDialog.close(); }
			if (this._rejectDialog) { this._rejectDialog.close(); }
		},
		
		onClickCreate_app: async function () {
			// Minimal validation for reject flow (reason + comment)
			const oReject = this.getView().getModel("Reject");
			const sMode = oReject?.getProperty("/mode"); // "REJECT" here
			const sComment = oReject?.getProperty("/approvalComment")?.trim();
			const sUserId = this._oSessionModel.getProperty("/userId");
			const oRequestModel = this.getView().getModel("request");
			const sReqId = oRequestModel?.getProperty("/req_header/reqid")?.trim();

			const oModelMain = this._oDataModel;
			const oModelView = this._oViewModel;

			if (sMode === this._oConstant.PARMode.APPROVE) {

				try {

					// 1. Approve + get payloads from util
					const { payloads } = await ApproverUtility.approveMultiLevel(
						oModelMain,
						sReqId,
						sUserId,
						sComment,
						oModelView,
						this
					);

					// 2. Send emails (1 or 2 depending on next approver / sub approver)
					for (const aPayloadEmail of payloads) {
						await workflowApproval.onSendEmailApprover(oModelMain, aPayloadEmail);
					}

					// 3. Close dialog
					this._approveDialog && this._approveDialog.close();

					// 4. Navigate back after small delay
					setTimeout(() => {
						this._oRouter.navTo("Dashboard", {}, true);
					}, 400);

				} catch (e) {
					MessageBox.error(e.message);
				}
			}
		},

		/**
		 * Submit handler for Push Back (STAT03) - PRE-APPROVAL REQUEST
		 * Called by SendBackDialog endButton (see dialog's robust handler binding).
		 */
		onSendBack_app: async function () {
			const oReject = this.getView().getModel("Reject");

			// Read inputs
			const sReason = oReject?.getProperty("/sendBackReasonKey");
			const sComment = oReject?.getProperty("/approvalComment")?.trim();

			// Client-side validation (dialog also disables button, but keep server-safe checks)
			if (!sReason) { MessageBox.error(Utility.getText("req_d_e_approval_push_back_reason")); return; }
			if (!sComment) { MessageBox.error(Utility.getText("req_d_e_approval_comment_empty")); return; }

			try {
				BusyIndicator.show(0);

				// Models
				const oModelMain = this._oDataModel;               // OData main
				const oModelView = this._oViewModel;// OData views

				// Who & what
				const sUserId = this._oSessionModel.getProperty("/userId");
				const oRequestModel = this.getOwnerComponent().getModel("request");
				const sReqId = oRequestModel?.getProperty("/req_header/reqid")?.trim();

				if (!sUserId || !sReqId) {
					throw new Error(Utility.getText("req_tm_w_emp_id_req_id_not_found"));
				}

	

				// 1) Update approval rows + header, build dataset & email payloads
				const { payloads, dataset, submissionType } =
					await ApproverUtility.rejectOrSendBackMultiLevel(
						oModelMain,
						sReqId,       // id
						sUserId,      // approver user id
						Constants.ClaimStatus.SEND_BACK,
						sReason,
						sComment,
						oModelView
					);

				// 2) Budget release (if your finance process requires release on push back)
				/** Commenting budgetProcessing as it will be replaced by backend function from Jefry 
				await budgetCheck.budgetProcessing(
					oModelMain,
					dataset,          // budget rows from the view
					submissionType,   // "REQ"
					"release"
				);
				*/
				const sSubmissionType2 = sReqId.substring(0, 3);
				try{
					const aResult = await budgetCheck.backendBudgetChecking(this, sSubmissionType2, Constants.BudgetCheckAction.REJECT);
				}catch (oError){

				}

				// 3) Send notifications
				const oMailModel = this._oDataModel;
				for (const p of payloads) {
					await workflowApproval.onSendEmailApprover(oMailModel, p);
				}

				// 4) Close dialog
				if (this._sendBackDialog) {
					this._sendBackDialog.close();
				}

				// 5) Navigate back
				setTimeout(() => {
					this._oRouter.navTo("Dashboard", {}, true);
				}, 400);

			} catch (e) {
				MessageBox.error(e.message || Utility.getText("req_d_e_push_back_failed"));
			} finally {
				BusyIndicator.hide();
			}
		},

		onReject_app: async function () {
			const oReject = this.getView().getModel("Reject");
			const sReason = oReject?.getProperty("/rejectReasonKey");
			const sComment = oReject?.getProperty("/approvalComment")?.trim();

			if (!sReason) { MessageBox.error(Utility.getText("req_d_e_approval_reject_reason")); return; }
			if (!sComment) { MessageBox.error(Utility.getText("req_d_e_approval_comment")); return; }

			try {
				BusyIndicator.show(0);

				const oModelMain = this._oDataModel;
				const oModelView = this._oViewModel;

				const reqModel = this.getView().getModel("request");
				const sReqId = reqModel?.getProperty("/req_header/reqid")?.trim();

				

				const { payloads, dataset, submissionType } =
					await ApproverUtility.rejectOrSendBackMultiLevel(
						oModelMain,
						sReqId,
						this._oSessionModel.getProperty("/userId"),
						Constants.ClaimStatus.REJECTED,
						sReason,
						sComment,
						oModelView
					);

				// Budget release if applicable
				/** Commenting budgetProcessing as it will be replaced by backend function from Jefry 
				await budgetCheck.budgetProcessing(oModelMain, dataset, submissionType, "release");
				*/
				const sSubmissionType2 = sReqId.substring(0, 3);
				try{
					const aResult = await budgetCheck.backendBudgetChecking(this, sSubmissionType2, Constants.BudgetCheckAction.REJECT);
				}catch (oError){

				}

				for (const p of payloads) {
					await workflowApproval.onSendEmailApprover(oModelMain, p);
				}

				this._rejectDialog && this._rejectDialog.close();

				setTimeout(() => this._oRouter.navTo("Dashboard", {}, true), 400);

			} catch (e) {
				MessageBox.error(e.message || Utility.getText("req_d_e_reject_failed"));
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

		/* =========================================================
		* xml onchange event trigger
		* ======================================================= */

		/**
		 * method to populate allocated amount if applicable
		 * @public
		 */
		onInputAllocatedAmount: function () {
			RequestUtility.populateAllocatedAmount();
		},

		/**
		 * method to filter the to state selection
		 * @public
		 */
		onFilterToState: function () {
            const oReqItem  = this._oReqModel.getProperty("/req_item");
            
            var sFromState  = oReqItem.from_state;
            var sFromOffice = oReqItem.from_location_office;

			const oSelect   = this.byId("item_to_state");
			const oBinding  = oSelect.getBinding("items");
			const aFilters  = oSelect ? [
                                new Filter(Constants.EntitiesFields.FROM_STATE_ID, FilterOperator.EQ, sFromState),
                                new Filter(Constants.EntitiesFields.FROM_LOCATION_ID, FilterOperator.EQ, sFromOffice)
                            ]: [];
			oBinding.filter(aFilters);
		},

		/**
		 * method to filter the to location (office) selection
		 * @public
		 */
        onFilterToOffice: function () {
            const oReqItem  = this._oReqModel.getProperty("/req_item");
            
            var sFromState  = oReqItem.from_state;
            var sFromOffice = oReqItem.from_location_office;
            var sToState    = oReqItem.to_state;

			const oSelect   = this.byId("item_to_location_office");
			const oBinding  = oSelect.getBinding("items");
			const aFilters  = oSelect ? [
                                new Filter(Constants.EntitiesFields.FROM_STATE_ID, FilterOperator.EQ, sFromState),
                                new Filter(Constants.EntitiesFields.FROM_LOCATION_ID, FilterOperator.EQ, sFromOffice),
                                new Filter(Constants.EntitiesFields.TO_STATE_ID, FilterOperator.EQ, sToState)
                            ]: [];
			oBinding.filter(aFilters);
		},

		/**
		 * check mileage of the office location selected when select 'to location (office)'
		 * @public
		 */
		onSelectToOffice: function () {
			RequestUtility.determineOfficeMileage();
		},

		/**
         * Dynamic Filter for Semenanjung/Sabah/Sarawak Dropdown selection 
		 * Check if the claim type item end with L or O to determine the filter for local or oversea
         * @private
         */
		_onFilterRegion: function () {
			const oSelect = this.byId("item_select_sss");
			
			if (!oSelect || !oSelect.getBinding("items")) {
				return;
			}

			const oBinding = oSelect.getBinding("items");
			
			const sClaimTypeItem = this._oReqModel.getProperty("/req_item/claim_type_item_id") || "";

			let aFilters = [];

			if (sClaimTypeItem.endsWith("_L")) {
				aFilters.push(new Filter(Constants.EntitiesFields.REGION_ID, FilterOperator.NE, Constants.Region.OVERSEA));

			} else if (sClaimTypeItem.endsWith("_O")) {
				aFilters.push(new Filter(Constants.EntitiesFields.REGION_ID, FilterOperator.EQ, Constants.Region.OVERSEA));
			}

			oBinding.filter(aFilters);
		},

		/**
         * Reset the Request Item Input when changing to new claim type item
		 * @private
         */
        _resetReqItemInputs: function () {
            const oReqItem = this._oReqModel.getProperty("/req_item");

            const aExcludedFields = [
                Constants.ExcludeField.CLAIM_TYPE_ID,
                Constants.ExcludeField.CLAIM_TYPE_ITEM_ID, 
                Constants.ExcludeField.REQUEST_SUB_ID 
            ];

            Object.keys(oReqItem).forEach((sKey) => {
                if (aExcludedFields.includes(sKey)) {
                    return;
                }

                const vCurrentValue = oReqItem[sKey];
                
                if (sKey === "est_amount" || typeof vCurrentValue === "number") {
                    this._oReqModel.setProperty(`/req_item/${sKey}`, 0);
                } else if (typeof vCurrentValue === "boolean") {
                    this._oReqModel.setProperty(`/req_item/${sKey}`, false);
                } else {
                    this._oReqModel.setProperty(`/req_item/${sKey}`, null);
                }
            });

            let aParticipants = this._oReqModel.getProperty("/participant") || [];
            aParticipants.forEach((row, index) => {
                this._oReqModel.setProperty(`/participant/${index}/ALLOCATED_AMOUNT`, "");
            });
			
			// set attachment 1 field to be required (mandatory)
			this.byId("i_attachment_1_file").setRequired(true);

        },

	});
});