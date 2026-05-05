sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/Item",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/format/DateFormat",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/ListMode",
	"sap/m/library",
	"sap/ui/core/library",
	"claima/model/models",
	"claima/utils/Utility",
	"claima/utils/ClaimUtility",
	"claima/utils/Attachment",
	"claima/utils/budgetCheck",
	"claima/utils/ApprovalLog",
	"claima/utils/ApproveDialog",
	"claima/utils/RejectDialog",
	"claima/utils/SendBackDialog",
	"claima/utils/ApproverUtility",
	"claima/utils/workflowApproval",
	"claima/utils/DateUtility",
	"claima/utils/ExcelExport",
	"claima/utils/EligibilityCheck",
	"claima/utils/EligibilityScenarios/EligibleScenarioCheck",
	"claima/utils/CustomValidator",
	"claima/utils/CustomDuplicationCheck",
	"claima/utils/Constants",
	"claima/utils/Common",
	"claima/utils/ClaimInitialization"
], function (
	Fragment,
	Item,
	Controller,
	BusyIndicator,
	History,
	JSONModel,
	Filter,
	FilterOperator,
	Sorter,
	DateFormat,
	MessageBox,
	MessageToast,
	Dialog,
	Button,
	Label,
	ListMode,
	mLibrary,
	coreLibrary,
	models,
	Utility,
	ClaimUtility,
	Attachment,
	budgetCheck,
	ApprovalLog,
	ApproveDialog,
	RejectDialog,
	SendBackDialog,
	ApproverUtility,
	workflowApproval,
	DateUtility,
	ExcelExport,
	EligibilityCheck,
	EligibleScenarioCheck,
	CustomValidator,
	CustomDuplicationCheck,
	Constants,
	Common,
	ClaimInitialization
) {
	"use strict";

	const DialogType = mLibrary.DialogType;
	const ValueState = coreLibrary.ValueState;
	const ButtonType = mLibrary.ButtonType;

	return Controller.extend("claima.controller.ClaimSubmission", {

		DateUtility: DateUtility,

		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
			this._oClaimModel = this.getOwnerComponent().getModel("claim");
			this._oApprovalLogModel = this.getOwnerComponent().getModel('approval_log')
			this._oDataModel = this.getOwnerComponent().getModel();
			this._oViewModel = this.getOwnerComponent().getModel("employee_view");
			this._oSessionModel = this.getOwnerComponent().getModel("session");
			this._oClaimFragments = Object.create(null);
			this._oDeleteAttachmentDialog = null;

			// declare claim utility
			ClaimUtility.init(this.getOwnerComponent(), this.getView());
			// decalre custom validator
			CustomValidator.init(this.getOwnerComponent(), this.getView());
			// declare excel export utility
			ExcelExport.init(this.getOwnerComponent(), this.getView(), window.XLSX);
			//declare utility
			Utility.init(this.getOwnerComponent(), this.getView());

			// URL Access
			this._oRouter.getRoute("ClaimSubmission").attachPatternMatched(this._onMatched, this);

			this.getOwnerComponent().setModel(new JSONModel({
				fieldControl: {
					[this._oConstant.EntitiesFields.RECEIPT_DATE]: {
						customErrorMessage: "",
						customMinDateError: "",
						customMaxDateError: ""
					},
					[this._oConstant.EntitiesFields.BILL_DATE]: {
						customErrorMessage: "",
						customMinDateError: "",
						customMaxDateError: ""
					},
					[this._oConstant.EntitiesFields.INSURANCE_PURCH_DATE]: {
						customErrorMessage: "",
					},
					[this._oConstant.EntitiesFields.INSURANCE_CERT_START_DATE]: {
						customErrorMessage: "",
						customMaxDateError: ""
					},
					[this._oConstant.EntitiesFields.INSURANCE_CERT_END_DATE]: {
						customErrorMessage: "",
						customMinDateError: "",
					},
					[this._oConstant.EntitiesFields.MOVE_IN_DATE]: {
						customErrorMessage: "",
						customMinDateError: "",
						customMaxDateError: ""
					},
					[this._oConstant.EntitiesFields.TRIP_START_DATE]: {
						customErrorMessage: "",
						customMinDateError: "",
						customMaxDateError: ""
					},
					[this._oConstant.EntitiesFields.TRIP_END_DATE]: {
						customErrorMessage: "",
						customMinDateError: "",
						customMaxDateError: ""
					}
				}
			}), "appModel");

			this.getView().setModel(models.createClaimHeaderEditableModel(), "claimSubmissionHeaderEditableModel");
			this.getView().setModel(models.createEditButtonModel(), "editButtonModel");
		},

		/* =========================================================
		* URL Access
		* ======================================================= */

		_onMatched: async function (oEvent) {
			let sClaimId = oEvent.getParameter("arguments").claim_id;

			try { sClaimId = decodeURIComponent(sClaimId); } catch (e) { }

			console.log("Deep-link claim ID:", sClaimId);

			this._oClaimModel.setProperty("/claim_header/claim_id", sClaimId);
			this._oClaimModel.setProperty('/view', 'view');

			this.getView().getModel("editButtonModel").setProperty("/state", false);

			await this._loadClaim(sClaimId);
		},

		_loadClaim: async function (sClaimId) {
			BusyIndicator.show(0);
			const oClaimSubmissionPage = this.byId("page_claimsubmission");
			// hard reset
			oClaimSubmissionPage.removeAllContent();

			// destroy ALL fragments
			if (this._oClaimFragments) {
				for (const sFrag of Object.keys(this._oClaimFragments)) {
					try {
						const oFrag = await this._oClaimFragments[sFrag];
						oFrag?.destroy(true);
					} catch { }
				}
			}
			this._oClaimFragments = Object.create(null);
			// declare claim initialization
			ClaimInitialization.init(this.getOwnerComponent(), this.getView());
			try {
				await ClaimInitialization.getHeader(sClaimId);
				await ClaimInitialization.getItemList(sClaimId);
				await this._showHeaderFragment();
				await this._showItemList(sClaimId);
			} catch (error) {
				console.log(error);
			} finally {
				BusyIndicator.hide();
			}
		},

		/* =========================================================
		* Helpers: Fragment Management
		* ======================================================= */

		_getFormFragment: async function (sName) {
			const oView = this.getView();
			if (!this._oClaimFragments[sName]) {
				this._oClaimFragments[sName] = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sName,
					type: "XML",
					controller: this
				}).then((oFrag) => {
					oView.addDependent(oFrag);
					return oFrag;
				});
			}
			return this._oClaimFragments[sName];
		},

		_replaceContentAt: async function (oPage, iIndex, oControl) {
			// Ensure the slot exists
			const iSafe = Math.min(iIndex, oPage.getContent().length);
			oPage.insertContent(oControl, iSafe);
		},

		/**
		 * Remove fragment from display
		 * @param {string} sLocalId name of fragment to be removed
		 * @returns 
		 */
		_removeByLocalId: async function (sLocalId) {
			const oCache = this._oClaimFragments;
			const oFragment = oCache?.[sLocalId];
			if (!oFragment) return;

			const oResolved = await oFragment;
			this.byId("page_claimsubmission").removeContent(oResolved);
			oResolved.destroy(true);
			delete oCache[sLocalId];
		},

		_showItemCreate: async function (bEdit) {
			const oPage = this.byId("page_claimsubmission");
			if (!oPage) return;

			await this._removeByLocalId("claimsubmission_summary_claimitem");
			await this._removeByLocalId("approval_log");

			const oCreate = await this._getFormFragment("claimsubmission_claimdetails_input");
			await this._replaceContentAt(oPage, 1, oCreate);

			ClaimInitialization.determineFooterButton(this);		// check if the footer button can share with PAR
		},

		/**
		 * Display editable/non-editable header fragment based on edit button state
		 * If edit button state is true, displays editable fragment, if false, displays non-editable fragment
		 */
		_showHeaderFragment: async function () {
			this._removeByLocalId("claimsubmission_summary_claimheader");
			var oClaimPage = this.byId("page_claimsubmission");

			const sFragmentName = this.getView().getModel("editButtonModel").getProperty("/state") ? "request_header_edit" : "claimsubmission_summary_claimheader"
			await this._getFormFragment(sFragmentName).then(function (oVBox) {
				oClaimPage.insertContent(oVBox, 0);
			});
		},


		_showItemList: async function (sClaimId) {
			const oPage = this.byId("page_claimsubmission");
			if (!oPage) return;

			await this._removeByLocalId("claimsubmission_summary_claimitem");
			await this._removeByLocalId("claimsubmission_claimdetails_input");
			await this._removeByLocalId("approval_log");

			const oList = await this._getFormFragment("claimsubmission_summary_claimitem");
			await this._replaceContentAt(oPage, 1, oList);

			// determine approver mode
			var sClaimStatus = this._oClaimModel.getProperty("/claim_header/status_id");
			var bDisplayApproval = sClaimStatus !== this._oConstant.ClaimStatus.DRAFT && sClaimStatus !== this._oConstant.ClaimStatus.CANCELLED;
			if (bDisplayApproval) {
				var aApprover = await ApprovalLog.getApproverList(this._oApprovalLogModel, this._oViewModel, sClaimId);
				for (const row of aApprover) {
					if (row.STATUS === this._oConstant.ClaimStatus.PENDING_APPROVAL &&
						(row.SUBSTITUTE_APPROVER_ID == this._oSessionModel.getProperty("/userId") ||
							row.APPROVER_ID == this._oSessionModel.getProperty("/userId"))) {
						this._oClaimModel.setProperty('/view', this._oConstant.AccessMode.APPROVER);
						break;
					} else {
						this._oClaimModel.setProperty('/view', this._oConstant.AccessMode.VIEW);
					}
				}
				const oApproval = await this._getFormFragment("approval_log");
				await this._replaceContentAt(oPage, 2, oApproval);
			} else {
				ClaimInitialization.getCurrentState(this);
			}

			Common.init(this.getOwnerComponent(), this.getView());
			if (sClaimStatus !== this._oConstant.RequestStatus.DRAFT && sClaimStatus !== this._oConstant.RequestStatus.SEND_BACK) {
				await Common.setHeaderEditable(Constants.SubmissionTypePrefix.CLAIMHEADER, false);
			}
			ClaimInitialization.determineFooterButton(this);
		},

		/* =========================================================
		* Footer / Navigation Buttons
		* ======================================================= */

		/**
		 * On click method for the back button in xml
		 */
		onBack: function () {
			const sClaimStatus = this._oClaimModel.getProperty("/claim_header/status_id");

			if (sClaimStatus == this._oConstant.ClaimStatus.DRAFT ||
				sClaimStatus == this._oConstant.ClaimStatus.SEND_BACK) {
				if (!this._oBackDialog) {
					this._oBackDialog = new Dialog({
						title: "Warning",
						type: DialogType.Message,
						state: ValueState.Warning,
						content: [new Label({ text: Utility.getText("req_d_w_back", []) })],
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Confirm",
							press: async function () {
								this._oBackDialog.close();
								await this._removeByLocalId("approval_log");
								var oHistory = History.getInstance();
								var sPreviousHash = oHistory.getPreviousHash();
								if (sPreviousHash) {
									window.history.go(-1);
								} else {
									this._oRouter.navTo("ClaimStatus");
								}
							}.bind(this)
						}),
						endButton: new Button({ text: "Cancel", press: () => this._oBackDialog.close() })
					});
				}
				this._oBackDialog.open();
			} else {
				this._onBackView();
			}
		},

		/**
		 * on back view method if the dialog is not needed.
		 */
		_onBackView: async function () {
			var oCreate = this.byId('claimsubmission_claimdetais_input');
			const sClaimId = this._oClaimModel.getProperty("/claim_header/claim_id");
			if (oCreate) {
				this._showItemList(sClaimId);
				this._oClaimModel.setProperty('/claim_item', {});		// set blank for the item details screen
			} else {
				await this._removeByLocalId("approval_log");
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
				if (sPreviousHash) {
					window.history.go(-1);
				} else {
					this._oRouter.navTo("ClaimStatus");
				}
			}
		},

		/* =========================================================
		* Header & Item List Area
		* ======================================================= */

		/**
		 * Method to view the attachment in pop out dialog window
		 * @param {Object} oEvent 
		 */
		onDocLinkPress: function(oEvent) {
			// calling function from Attachment.js
			let sDocument = oEvent.getSource().getText();
			let sDocumentSFId = sDocument.split(" - ")[0];
			Attachment.onViewDocument(this, sDocumentSFId);
		},

		/**
		 * on click add claim item button method to go to the detail input screen
		 */
		onAddItem: async function (oEvent) {
			this._oClaimModel.setProperty("/view", this._oConstant.AccessMode.CREATE);
			await this._showItemCreate(false);

			const oClaimHeader = this._oClaimModel.getProperty("/claim_header");
			this._oClaimModel.setProperty("/claim_item/claim_type_id", oClaimHeader.claim_type_id);
			this._oClaimModel.setProperty("/claim_item/descr/claim_type_id", oClaimHeader.descr.claim_type_id);
			this._loadAllSelection()
		},

		/* =========================================================
		* Field Visibility Functions 
		* ======================================================= */

		initializeClaimTypeItemFields: async function (bReset = true) {
			const sClaimTypeItem = this._oClaimModel.getProperty("/claim_item/claim_type_item_id");
			const sClaimType = this._oClaimModel.getProperty("/claim_item/claim_type_id");

			if (!sClaimTypeItem) {
				console.warn("No claim type item found yet.");
				return;
			}

			// reset model
			if (bReset) {
				this._resetClaimItemInputs();

				const oLocationTypeSelect = this.byId("select_claimdetails_input_location_type");
				if (oLocationTypeSelect) {
					oLocationTypeSelect.setForceSelection(false);
					oLocationTypeSelect.setSelectedKey("");
				}
			}

			BusyIndicator.show(0);

			try {
				const oListBinding = this._oDataModel.bindList("/ZDB_STRUCTURE", null, null, [
					new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.ClaimFieldVisibilityConfig.SUBMISSION_TYPE),
					new Filter("COMPONENT_LEVEL", FilterOperator.EQ, this._oConstant.ClaimFieldVisibilityConfig.ITEM),
					new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaimTypeItem),
					new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimType)
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
						const control = this._resolveControl(id, "claimsubmission_claimdetails_input");
						if (control && typeof control.setVisible === "function") {
							control.setVisible(true);
						} else {
							console.warn("Control not found or not visible-capable:", id);
						}
					});

					 const _oHeader = this._oClaimModel.getProperty("/claim_header") || {};
					 const _oItem = this._oClaimModel.getProperty("/claim_item") || {};

					// // calculate number of days
					// var iDiffDays = DateUtility.calculateNumberOfDays(this._oConstant.SubmissionTypePrefix.REQUEST, _oHeader, _oItem);
					// this._oClaimModel.setProperty("/req_item/no_of_days", iDiffDays);

					// get number of family members including requestor him/herself
					var iNoOfFamilyMember = await Utility.getNumberOfFamilyMembers(sClaimTypeItem);
					this._oClaimModel.setProperty("/claim_item/no_of_family_member", iNoOfFamilyMember);

					// this._onFilterRegion();

					// // set filters for state and location (office) fields if values exist
					// Utility.init(this.getOwnerComponent(), this.getView());
					// Utility.setFiltersExistingStateLocation(this._oConstant.SubmissionTypePrefix.REQUEST);

					//special initialization based on claim type item
					// switch (sClaimTypeItem) {
					// 	// set visible for the number of family member and traveller when choosing travel with Family Now
					// 	case Constants.ClaimTypeItem.LOD_TUKAR:
					// 	case Constants.ClaimTypeItem.MKN_TUKAR:
					// 		if (_oHeader.travel_family_now_later === Constants.TravelWithFamilyNowOrLater.NOW_DESC) {
					// 			Object.values(Constants.ClaimSpecialFieldVisibilityForElaunTukar).forEach(id => {
					// 				const control = this._resolveControl(id, "claimsubmission_claimdetails_input");
					// 				if (control && typeof control.setVisible === "function") {
					// 					control.setVisible(true);
					// 				} else {
					// 					console.warn("Control not found or not visible-capable:", id);
					// 				}
					// 			});
					// 		}
					// 		break;
					// 	case Constants.ClaimTypeItem.DARAT:
					// 		if (_oHeader.travel_family_now_later === Constants.TravelWithFamilyNowOrLater.NOW_DESC) {
					// 			const control = this._resolveControl("select_claimdetails__input_marriagecategory", "claimsubmission_claimdetails_input");
					// 			if (control && typeof control.setVisible === "function") {
					// 				control.setVisible(true);
					// 			} else {
					// 				console.warn("Control not found or not visible-capable:", id);
					// 			}
					// 		}
					// 		break;	
					// 	// populate entitled amount 
					// 	// case Constants.ClaimTypeItem.LAUT:
					// 	// case Constants.ClaimTypeItem.LODGING_L:
					// 	// case Constants.ClaimTypeItem.LOD_TUKAR:
					// 		// if (this._oClaimModel.getProperty("/view") === Constants.AccessMode.CREATE) { select_claimdetails__input_marriagecategory
					// 		// 	RequestUtility.populateAllocatedAmount();
					// 		// }
					// 		// break;

					// 	// remove business class option for FLIGHT_L
					// 	// case Constants.ClaimTypeItem.FLIGHT_L:
					// 		//this._removeBusinessClass();

					// 	default:
					// 		break;
					// }
				}

			} catch (err) {
				console.error("OData bindList failed:", err);
			} finally {
				BusyIndicator.hide();
			}
		},

		_resetClaimItemInputs: function () {
			const oClaimItem = this._oClaimModel.getProperty("/claim_item");
			
			const aExcludedFields = [
				Constants.ExcludeField.CLAIM_TYPE_ID,
				Constants.ExcludeField.CLAIM_TYPE_ITEM_ID,
				Constants.ExcludeField.DESCR,
				Constants.ExcludeField.REQUEST_SUB_ID
			];

			Object.keys(oClaimItem).forEach((sKey) => {
				if (aExcludedFields.includes(sKey)) {
					return;
				}

				const vCurrentValue = oClaimItem[sKey];

				if (sKey === "est_amount" || typeof vCurrentValue === "number") {
					this._oClaimModel.setProperty(`/claim_item/${sKey}`, 0);
				} else if (typeof vCurrentValue === "boolean") {
					this._oClaimModel.setProperty(`/claim_item/${sKey}`, false);
				} else {
					this._oClaimModel.setProperty(`/claim_item/${sKey}`, null);
				}
			});

			// set attachment 1 field to be required (mandatory)
			this.byId("fileuploader_claimdetails_input_attachment_file_1").setRequired(true);

		},

		_setAllControlsVisible: function (bVisible) {
			const aControlIds = [
				"select_claimdetails_input_depedent_or_anggota",
				"select_claimdetails_input_type_of_professional_body",
				"input_claimdetails_input_policy_number",
				"select_claimdetails_input_funeral_transportation",
				"input_claimdetails_input_actual_amount",
				"input_claimdetails_input_subsidised_amount",
				"input_claimdetails_input_request_approval_amount",
				"input_claimdetails_input_amount",
				"input_claimdetails_input_percentage_compensation",
				"input_claimdetails_input_course_title",
				"select_claimdetails_input_study_levels_id",
				"input_claimdetails_input_receipt_number",
				"datepicker_claimdetails_input_receipt_date",
				"input_claimdetails_input_purpose",
				"datepicker_claimdetails_input_startdate",
				"timepicker_claimdetails_input_starttime",
				"datepicker_claimdetails_input_enddate",
				"timepicker_claimdetails_input_endtime",
				"select_claimdetails_input_insurance_provider_id",
				"select_claimdetails_input_insurance_package_id",
				"datepicker_claimdetails_input_insurance_purchase_date",
				"datepicker_claimdetails_input_insurance_cert_start_date",
				"datepicker_claimdetails_input_insurance_cert_end_date",
				"input_claimdetails_input_no_of_days",
				"select_claimdetails_input_vehicle_type",
				"select_claimdetails_input_vehicle_ownership_id",
				"input_claimdetails_input_km",
				"input_claimdetails_input_rate_per_km",
				"select_claimdetails_input_fare_type_id",
				"select_claimdetails_input_flight_class",
				"input_claimdetails_input_toll",
				"checkbox_claimdetails_input_parking",
				"select_claimdetails_input_location_type",
				"select_claimdetails_input_from_state_id",
				"input_claimdetails_input_from_location",
				"select_claimdetails_input_to_state_id",
				"input_claimdetails_input_to_location",
				"select_claimdetails_input_room_type",
				"select_claimdetails_input_country",
				"input_claimdetails_input_location",
				"checkbox_claimdetails_input_needforeigncurrency",
				"datepicker_claimdetails_input_trip_start_date",
				"timepicker_claimdetails_input_trip_starttime",
				"timepicker_claimdetails_input_departure_time",
				"datepicker_claimdetails_input_trip_end_date",
				"timepicker_claimdetails_input_trip_endtime",
				"timepicker_claimdetails_input_arrival_time",
				"input_claimdetails_input_travel_duration_day",
				"input_claimdetails_input_travel_duration_hour",
				"input_claimdetails_input_provided_breakfast",
				"input_claimdetails_input_provided_lunch",
				"input_claimdetails_input_provided_dinner",
				"input_claimdetails_input_entitled_breakfast",
				"input_claimdetails_input_entitled_lunch",
				"input_claimdetails_input_entitled_dinner",
				"input_claimdetails_input_lodging_address",
				"select_claimdetails_input_region",
				"select_claimdetails_input_area",
				"select_claimdetails_input_lodging_category",
				"input_claimdetails_input_no_of_family_member",
				"select_claimdetails_input_claim_category",
				"select_claimdetails_input_mobile_category_purpose_id",
				"input_claimdetails_input_bill_no",
				"input_claimdetails_input_account_no",
				"datepicker_claimdetails_input_bill_date",
				"input_claimdetails_input_phone_no",
				"checkbox_claimdetails_input_disclaimer",
				"input_claimdetails_input_remarks",
				"fileuploader_claimdetails_input_attachment_file_1",
				"fileuploader_claimdetails_input_attachment_file_2",
				"select_claimdetails__input_marriagecategory",
				"input_claimdetails_meter_cube_actual",
				"input_claimdetails_meter_cube",
				"input_claimdetails_input_tips",
				"input_claimdetails_input_exclude_tips",
				"input_claimdetails_input_daily_allowance",
				"input_claimdetails_input_number_of_travellers"
			];

			aControlIds.forEach(id => {
				const c = this._resolveControl(id, "claimsubmission_claimdetails_input");
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

		// ===========================================
		// Load selections
		// ===========================================
		_loadSelection: function(){
			this._onConfigDropdownFilter();
			this._getDependent();
		},
		_onConfigDropdownFilter: function(){
			// list of id with configs for dropdown
			var aDropdownList = [
				"select_claimdetails_input_type_of_professional_body",
				"select_claimdetails_input_funeral_transportation",
				"select_claimdetails_input_study_levels_id",
				"select_claimdetails_input_insurance_provider_id",
				"select_claimdetails_input_insurance_package_id",
				"select_claimdetails_input_vehicle_type",
				"select_claimdetails_input_vehicle_ownership_id",
				"select_claimdetails_input_fare_type_id",
				"select_claimdetails_input_vehicle_class_id",
				"select_claimdetails_input_flight_class",
				"select_claimdetails_input_room_type",
				"select_claimdetails_input_region",
				"select_claimdetails_input_area",
				"select_claimdetails_input_lodging_category",
				"select_claimdetails_input_claim_category",
				"select_claimdetails_input_mobile_category_purpose_id"
			];
			//filter by start, end date and also by status
			var aFilters = [
				new Filter(this._oConstant.EntitiesFields.STATUS, FilterOperator.EQ, this._oConstant.ClaimTypeItemStatus.ACTIVE),
				new Filter(this._oConstant.EntitiesFields.START_DATE, FilterOperator.LE, DateUtility.getHanaDate(DateUtility.today())),
				new Filter(this._oConstant.EntitiesFields.END_DATE, FilterOperator.GE, DateUtility.getHanaDate(DateUtility.today()))
			];

			// need to add specific logic for region and claim type item FLIGHT_L when buttons work
			//calls the array to load all the select with the filters
			aDropdownList.forEach(sFieldId => {

				var oSelect = this.byId(sFieldId);
				var oBinding = oSelect.getBinding("items");
				oBinding.filter(aFilters);
			});
		},

		_getDependentFilters: function () {
			// getting the models for item and header
			var oItem = this._oClaimModel.getProperty("/claim_item") || {};
			var oHeader =  this._oClaimModel.getProperty("/claim_header") || {};

			if(!oItem || !oHeader) return;

			var oEmpFilter = new Filter(
				this._oConstant.EntitiesFields.EMP_ID,
				FilterOperator.EQ,
				oHeader.emp_id
			);
			// specific filter for specific claim type items
			switch (oItem.claim_type_item_id) {
				case this._oConstant.ClaimTypeItem.POST_EDUCATION_ASSISTANCE:
					var oPeduFilter = new Filter(this._oConstant.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, this._oConstant.Relationship.CHILD);

					return new Filter({
						filters: [
							oEmpFilter,
							oPeduFilter
						],
						and: true
					})

				case this._oConstant.ClaimTypeItem.FLIGHT_WIL:
					// filter by child aged < 18 and also aged between 19 - 25 with status as studying
					var d18YearsFromCurrentDate = DateUtility.today().getFullYear() - 18;
					var d19YearsFromCurrentDate = DateUtility.today().getFullYear() - 19;
					var d25YearsFromCurrentDate = DateUtility.today().getFullYear() - 25;

					d18YearsFromCurrentDate = new Date(d18YearsFromCurrentDate, 0, 1).toLocaleDateString("en-CA");
					d19YearsFromCurrentDate = new Date(d19YearsFromCurrentDate, 0, 1).toLocaleDateString("en-CA");
					d25YearsFromCurrentDate = new Date(d25YearsFromCurrentDate, 0, 1).toLocaleDateString("en-CA");

					var oSpouseFilter = new Filter(this._oConstant.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, this._oConstant.Relationship.SPOUSE);

					var oChildBelow18 = new Filter({
						filters: [
							new Filter(this._oConstant.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, this._oConstant.Relationship.CHILD),
							new Filter(this._oConstant.EntitiesFields.DOB, FilterOperator.GT, d18YearsFromCurrentDate)
						],
						and: true
					})

					var oChildStudying = new Filter({
						filters: [
							new Filter(this._oConstant.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, this._oConstant.Relationship.CHILD),
							new Filter(this._oConstant.EntitiesFields.DOB, FilterOperator.BT, d25YearsFromCurrentDate, d19YearsFromCurrentDate),
							new Filter(this._oConstant.EntitiesFields.STUDENT, FilterOperator.EQ, true),
						],
						and: true
					})

					var oDependentRuleFilter = new Filter({
						filters: [
							oSpouseFilter,
							oChildBelow18,
							oChildStudying
						],
						and: false
					})

					return new Filter({
						filters: [
							oEmpFilter,
							oDependentRuleFilter
						],
						and: true
					})

				default:
					return new Filter({
						filters: [
							oEmpFilter
						]
					})
			}
		},
		_getDependent: function (){
			var oFilter = this._getDependentFilters();
			// 2 dropdown for dependent, one normal select and 1 is combobox
			var aDropdownList = [
				"select_claimdetails_input_dependent_name",
				"combo_claimdetails_input_dependent"
			];

			aDropdownList.forEach(sFieldId => {
				var oSelect = this.byId(sFieldId);
				var oBinding = oSelect.getBinding("items");
				oBinding.filter(oFilter);
			})
		},
		_onClaimItemDropdownFilter: function () {
			// filter by submission type
			if (this._oClaimModel.getProperty("/claim_header/submission_type") === this._oConstant.SubmissionType.PRE_APPROVE ||
				this._oClaimModel.getProperty("/claim_header/submission_type") === this._oConstant.SubmissionType.CASH_REPAYMENT ||
				this._oClaimModel.getProperty("/claim_header/submission_type") === this._oConstant.SubmissionType.CURR_SUBSIDY
			) {
				// filter items by claim header submission type + cash repayment
				var oFilterSubsmissionType = new Filter({
					filters: [
						new Filter('SUBMISSION_TYPE', FilterOperator.EQ, this._oConstant.SubmissionType.PRE_APPROVE),
						new Filter('SUBMISSION_TYPE', FilterOperator.EQ, this._oConstant.SubmissionType.CASH_REPAYMENT),
						new Filter('SUBMISSION_TYPE', FilterOperator.EQ, this._oConstant.SubmissionType.CURR_SUBSIDY),
					],
					and: false
				});
			} else {
				oFilterSubsmissionType = new Filter('SUBMISSION_TYPE', FilterOperator.EQ, this._oClaimModel.getProperty("/claim_header/submission_type"));
			}

			// set dropdown for claim items
			this.byId("select_claimdetails_input_claimitem").bindAggregation("items", {
				path: "employee>/ZCLAIM_TYPE_ITEM",
				filters: [
					new Filter('CLAIM_TYPE_ID', FilterOperator.EQ, this._oClaimModel.getProperty("/claim_header/claim_type_id")),
					oFilterSubsmissionType,
					// ensure status is active
					new Filter("STATUS", FilterOperator.EQ, this._oConstant.ClaimTypeItemStatus.ACTIVE),
					new Filter("START_DATE", FilterOperator.LE, DateUtility.getHanaDate(DateUtility.today())),
					new Filter("END_DATE", FilterOperator.GE, DateUtility.getHanaDate(DateUtility.today()))
				],
				sorter: [
					new Sorter('CLAIM_TYPE_ITEM_DESC'),
					new Sorter('CLAIM_TYPE_ITEM_ID')
				],
				template: new Item({
					key: "{employee>CLAIM_TYPE_ITEM_ID}",
					text: "{employee>CLAIM_TYPE_ITEM_DESC}"
				})
			});
		},
		_loadAllSelection: function(){
			//loads all the select items with the filters
			this._getDependent();
			this._onConfigDropdownFilter();
			this._onClaimItemDropdownFilter();
		},
		// ===========================================
		// dropdown specific logics
		// ===========================================
		onSelectCountry: async function(oEvent){
			var oItem = this._oClaimModel.getProperty("/claim_item");
			if(oItem.claim_type_item_id == Constants.ClaimTypeItem.LODG_O){
				var oResult = await Utility.getLodgingOverseaAmountAndCat(Constants.SubmissionTypePrefix.CLAIM);
				
				this._oClaimModel.setProperty("/claim_item/lodging_category", oResult.sCategory);
				this._oClaimModel.setProperty("/claim_item/eligible_amount", oResult.iEligibleAmount);
				this._oClaimModel.setProperty("/claim_item/amount", ClaimUtility.calculateAmountLodging());
			}
		},
	});
});
