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

				const oLocationTypeSelect = this.byId("select_location_type");
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

					
					if (!Object.values(this._oConstant.NumberOfDaysCalculationException).includes(this._oClaimModel.getProperty("/claim_item/claim_type_item_id"))) {
						var iDiffDays = DateUtility.calculateNumberOfDays(this._oConstant.SubmissionTypePrefix.CLAIM, _oHeader, _oItem);
						this._oClaimModel.setProperty("/claim_item/no_of_days", iDiffDays);
					}
					
					// get number of family members including requestor him/herself
					var iNoOfFamilyMember = await Utility.getNumberOfFamilyMembers(sClaimTypeItem);
					this._oClaimModel.setProperty("/claim_item/no_of_family_member", iNoOfFamilyMember);

					//filter fare type
					this._filterFareType();
					//populate fields that are required to be auto populated
					ClaimUtility.onPopulateAllocatedAmount();
					//calculation for matawang
					if (this._oClaimModel.getProperty("/claim_item/claim_type_item_id") === this._oConstant.ClaimTypeItem.MATAWANG) {
						await ClaimUtility.calculateMatawangAmount();
					}
					// this._onFilterRegion();

					// // set filters for state and location (office) fields if values exist
					// Utility.init(this.getOwnerComponent(), this.getView());
					// Utility.setFiltersExistingStateLocation(this._oConstant.SubmissionTypePrefix.REQUEST);

					//special initialization based on claim type item
					
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
			this.byId("fileuploader_attachment_file_1").setRequired(true);

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
				"select_type_of_professional_body",
				"select_funeral_transportation",
				"select_study_levels_id",
				"select_insurance_provider_id",
				"select_insurance_package_id",
				"select_vehicle_type",
				"select_vehicle_ownership_id",
				"select_fare_type_id",
				"select_vehicle_class_id",
				"select_flight_class",
				"select_room_type",
				"select_region",
				"select_area",
				"select_lodging_category",
				"select_claim_category",
				"select_mobile_category_purpose_id"
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
				"select_dependent_name",
				"combo_dependent"
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
			this.byId("select_claimitem").bindAggregation("items", {
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

		_filterFareType: function () {
			var oSelect = this.byId("select_fare_type_id");
			var oBinding = oSelect.getBinding("items");
			if (!oBinding) return;
			var aFareTypeFilters = ClaimUtility.getFareTypeFilters(this._oClaimModel.getProperty("/claim_header/claim_type_id"), this._oClaimModel.getProperty("/claim_item/claim_type_item_id"));
			oBinding.filter(aFareTypeFilters);
		},

		_onCalculate: async function (){
			ClaimUtility.onCalculation();
		},

		onDownloadExcelReport: async function () {
			// get header data
			const oHeader = this.getView().getModel("claimsubmission_input").getProperty("/claim_header");
			const oHeaderRow = {
				"Claim ID": oHeader.claim_id || "",
				"Purpose": oHeader.purpose || "",
				"Trip Start Date": oHeader.trip_start_date,
				"Trip End Date": oHeader.trip_end_date,
				"Event Start Date": oHeader.event_start_date,
				"Event End Date": oHeader.event_end_date,
				"Pre-Approval Request": oHeader.request_id + oHeader.descr.request_id,
				"Location": oHeader.location || "",
				"Comment": oHeader.comment || "",
				"Cost Center": oHeader.cost_center || "",
				"Alternate Cost Center": oHeader.alternate_cost_center || "",
				"Total Claim Amount": oHeader.total_claim_amount,
				"Pre-Approved Amount": oHeader.preapproved_amount,
				"Cash Advance": oHeader.cash_advance_amount,
				"Final Amount To Receive": oHeader.final_amount_to_receive
			};
			const aHeaderColumns = [
				{ label: "Claim ID", property: "Claim ID", width: 18 },
				{ label: "Purpose", property: "Purpose", width: 30 },
				{ label: "Trip Start Date", property: "Trip Start Date", width: 18 },
				{ label: "Trip End Date", property: "Trip End Date", width: 18 },
				{ label: "Event Start Date", property: "Event Start Date", width: 18 },
				{ label: "Event End Date", property: "Event End Date", width: 18 },
				{ label: "Pre-Approval Request", property: "Pre-Approval Request", width: 50 },
				{ label: "Location", property: "Location", width: 20 },
				{ label: "Comment", property: "Comment", width: 30 },
				{ label: "Cost Center", property: "Cost Center", width: 18 },
				{ label: "Alternate Cost Center", property: "Alternate Cost Center", width: 20 },
				{ label: "Total Claim Amount", property: "Total Claim Amount", type: "number", scale: 2, width: 18 },
				{ label: "Pre-Approved Amount", property: "Pre-Approved Amount", type: "number", scale: 2, width: 18 },
				{ label: "Cash Advance", property: "Cash Advance", type: "number", scale: 2, width: 18 },
				{ label: "Final Amount To Receive", property: "Final Amount To Receive", type: "number", scale: 2, width: 18 }
			];

			// get item data
			const aItems = this.getView().getModel("claimsubmission_input").getProperty("/claim_items");
			const aItemsColumnsMain = [
				{ label: Utility.getText("label_claimdetails_input_claim_id"), property: "claim_id", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_claim_sub_id"), property: "claim_sub_id", width: 20 },
				{ label: Utility.getText("label_claimdetails_input_claimtype"), property: "claim_type_id", type: "descr", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_claimitem"), property: "claim_type_item_id", type: "descr", width: 30 },
			];
			const aItemsColumnsAdditional = [
				{ label: Utility.getText("label_claimdetails_input_depedent_or_anggota"), property: "dependent_type", field: "select_claimdetails_input_depedent_or_anggota", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_anggota"), property: "anggota_name", field: "field_claimdetails_input_anggota_name", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_dependent"), property: "dependent_name", field: "select_claimdetails_input_dependent_name", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_dependent_combo"), property: "dependent", field: "combo_claimdetails_input_dependent", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_profbodytype"), property: "type_of_professional_body", field: "select_claimdetails_input_type_of_professional_body", type: "descr", width: 40 },
				{ label: Utility.getText("label_claimdetails_input_policyno"), property: "policy_number", field: "input_claimdetails_input_policy_number", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_funeraltransport"), property: "funeral_transportation", field: "select_claimdetails_input_funeral_transportation", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_amount_actual"), property: "actual_amount", field: "input_claimdetails_input_actual_amount", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_amount_subsidised"), property: "subsidised_amount", field: "input_claimdetails_input_subsidised_amount", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_amount_reqapproved"), property: "request_approval_amount", field: "input_claimdetails_input_request_approval_amount", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_amount"), property: "amount", field: "input_claimdetails_input_amount", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_compensation"), property: "percentage_compensation", field: "input_claimdetails_input_percentage_compensation", type: "number", scale: 2, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_coursetitle"), property: "course_title", field: "input_claimdetails_input_course_title", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_levelstudies"), property: "study_levels_id", field: "select_claimdetails_input_study_levels_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_receiptno"), property: "receipt_number", field: "input_claimdetails_input_receipt_number", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_receiptdate"), property: "receipt_date", field: "datepicker_claimdetails_input_receipt_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_purpose"), property: "purpose", field: "input_claimdetails_input_purpose", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_startdate"), property: "start_date", field: "datepicker_claimdetails_input_startdate", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_starttime"), property: "start_time", field: "timepicker_claimdetails_input_starttime", type: "time", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_enddate"), property: "end_date", field: "datepicker_claimdetails_input_enddate", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_endtime"), property: "end_time", field: "timepicker_claimdetails_input_endtime", type: "time", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_insurance_provider_id"), property: "insurance_provider_id", field: "select_claimdetails_input_insurance_provider_id", type: "descr", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_insurance_provider_name"), property: "insurance_provider_name", field: "input_claimdetails_input_insurance_provider_name", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_insurance_package_id"), property: "insurance_package_id", field: "select_claimdetails_input_insurance_package_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_insurance_purchase_date"), property: "insurance_purchase_date", field: "datepicker_claimdetails_input_insurance_purchase_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_insurance_cert_start_date"), property: "insurance_cert_start_date", field: "datepicker_claimdetails_input_insurance_cert_start_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_insurance_cert_end_date"), property: "insurance_cert_end_date", field: "datepicker_claimdetails_input_insurance_cert_end_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_mode_of_transfer"), property: "mode_of_transfer", field: "select_claiminput_mode_of_transfer", type: "descr", width: 18 },
				{ label: Utility.getText("label_claiminput_travel_alone_family"), property: "travel_alone_family", field: "select_claiminput_travel_alone_family", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_transfer_date"), property: "transfer_date", field: "datepicker_claimdetails_input_transfer_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_numberofdays"), property: "no_of_days", field: "input_claimdetails_input_no_of_days", type: "number", scale: 0, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_typeofvehicle"), property: "vehicle_type", field: "select_claimdetails_input_vehicle_type", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_number_of_travellers"), property: "number_of_travellers", field: "input_claimdetails_input_number_of_travellers", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_vehicleownership"), property: "vehicle_ownership_id", field: "select_claimdetails_input_vehicle_ownership_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_km_rate"), property: "rate_per_km", field: "input_claimdetails_input_rate_per_km", width: 14 },
				{ label: Utility.getText("label_claimdetails_input_faretype"), property: "fare_type_id", field: "select_claimdetails_input_fare_type_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_vehicleclass"), property: "vehicle_class_id", field: "select_claimdetails_input_vehicle_class_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_flightclass"), property: "flight_class", field: "select_claimdetails_input_flight_class", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_toll"), property: "toll", field: "input_claimdetails_input_toll", type: "number", scale: 2, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_parking"), property: "parking", field: "checkbox_claimdetails_input_parking", width: 10 },
				{ label: Utility.getText("label_claimdetails_input_locationtype"), property: "location_type", field: "select_claimdetails_input_location_type", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_state_from"), property: "from_state_id", field: "select_claimdetails_input_from_state_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_location_from"), property: "from_location", field: "input_claimdetails_input_from_location", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_location_from_office"), property: "from_location_office", field: "select_claimdetails_input_from_location", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_state_to"), property: "to_state_id", field: "select_claimdetails_input_to_state_id", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_location_to"), property: "to_location", field: "input_claimdetails_input_to_location", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_location_to_office"), property: "to_location_office", field: "select_claimdetails_input_to_location", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_km"), property: "km", field: "input_claimdetails_input_km", type: "number", scale: 2, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_roomtype"), property: "room_type", field: "select_claimdetails_input_room_type", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_country"), property: "country", field: "select_claimdetails_input_country", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_location"), property: "location", field: "input_claimdetails_input_location", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_needforeigncurrency"), property: "need_foreign_currency", field: "checkbox_claimdetails_input_needforeigncurrency", width: 10 },
				{ label: Utility.getText("label_claimdetails_input_currencycode"), property: "currency_code", field: "select_claimdetails_input_currency_code", width: 10 },
				{ label: Utility.getText("label_claimdetails_input_currencyrate"), property: "currency_rate", field: "input_claimdetails_input_currency_rate", type: "number", scale: 2, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_currencyamt"), property: "currency_amount", field: "input_claimdetails_input_currency_amount", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "trip_start_date", field: "datepicker_claimdetails_input_trip_start_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_trip_starttime"), property: "trip_start_time", field: "timepicker_claimdetails_input_trip_starttime", type: "time", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_time_depart"), property: "departure_time", field: "timepicker_claimdetails_input_departure_time", type: "time", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "trip_end_date", field: "datepicker_claimdetails_input_trip_end_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_trip_endtime"), property: "trip_end_time", field: "timepicker_claimdetails_input_trip_endtime", type: "time", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_time_arrive"), property: "arrival_time", field: "timepicker_claimdetails_input_arrival_time", type: "time", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_travel_duration_day"), property: "travel_duration_day", field: "input_claimdetails_input_travel_duration_day", type: "number", scale: 1, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_travel_duration_hour"), property: "travel_duration_hour", field: "input_claimdetails_input_travel_duration_hour", type: "number", scale: 1, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_provided_breakfast"), property: "provided_breakfast", field: "input_claimdetails_input_provided_breakfast", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_provided_lunch"), property: "provided_lunch", field: "input_claimdetails_input_provided_lunch", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_provided_dinner"), property: "provided_dinner", field: "input_claimdetails_input_provided_dinner", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_entitled_breakfast"), property: "entitled_breakfast", field: "input_claimdetails_input_entitled_breakfast", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_entitled_lunch"), property: "entitled_lunch", field: "input_claimdetails_input_entitled_lunch", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_entitled_dinner"), property: "entitled_dinner", field: "input_claimdetails_input_entitled_dinner", type: "number", scale: 2, width: 14 },
				{ label: Utility.getText("label_claimdetails_input_lodging_address"), property: "lodging_address", field: "input_claimdetails_input_lodging_address", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_region"), property: "region", field: "select_claimdetails_input_region", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_area"), property: "area", field: "select_claimdetails_input_area", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_lodging_category"), property: "lodging_category", field: "select_claimdetails_input_lodging_category", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_familyno"), property: "no_of_family_member", field: "input_claimdetails_input_no_of_family_member", type: "number", scale: 2, width: 10 },
				{ label: Utility.getText("label_claimdetails_input_cat_purpose"), property: "claim_category", field: "select_claimdetails_input_claim_category", type: "descr", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_billno"), property: "bill_no", field: "input_claimdetails_input_bill_no", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_accountno"), property: "account_no", field: "input_claimdetails_input_account_no", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_billdate"), property: "bill_date", field: "datepicker_claimdetails_input_bill_date", type: "date", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_phoneno"), property: "phone_no", field: "input_claimdetails_input_phone_no", width: 18 },
				{ label: Utility.getText("label_claimdetails_input_disclaimer"), property: "disclaimer", field: "checkbox_claimdetails_input_disclaimer", width: 10 },
				{ label: Utility.getText("label_claimdetails_input_remarks"), property: "remark", field: "input_claimdetails_input_remarks", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_attachment_file_1"), property: "attachment_file_1", field: "fileuploader_claimdetails_input_attachment_file_1", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_attachment_file_2"), property: "attachment_file_2", field: "fileuploader_claimdetails_input_attachment_file_2", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_marriagecategory"), property: "marriage_category", field: "select_claimdetails__input_marriagecategory", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_actual_meter_cube"), property: "actual_meter_cube", field: "input_claimdetails_meter_cube_actual", width: 30 },
				{ label: Utility.getText("label_claimdetails_input_entitled_meter_cube"), property: "entitled_meter_cube", field: "input_claimdetails_meter_cube", width: 30 },

			];

			await ExcelExport.onDownloadExcelReport(this._oConstant.SubmissionTypePrefix.CLAIM,
				oHeader,
				oHeaderRow,
				aHeaderColumns,
				aItems,
				aItemsColumnsMain,
				aItemsColumnsAdditional
			);
		},

	});
});
