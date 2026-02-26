
sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/ui/core/Fragment",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/library",
	"sap/tnt/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (
	Device,
	Controller,
	JSONModel,
	Popover,
	Fragment,
	Button,
	Dialog,
	MessageToast,
	Text,
	library,
	tntLibrary,
	Filter,
	FilterOperator
) {
	"use strict";


	return Controller.extend("claima.controller.App", {
		onInit: function () {
			// oReportModel
			var oReportModel = new JSONModel({
				"purpose": "",
				"startdate": "",
				"enddate": "",
				"category": "",
				"amt_approved": "",
				"comment": ""
			});
			this.getView().setModel(oReportModel, "report");

			const oItemsModel = new JSONModel({ results: [] });
			this.getView().setModel(oItemsModel, "items");

			// sap.ui.core.routing.HashChanger.getInstance().replaceHash(""); //clear routing after navigate from configuration page
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Dashboard");

			this._loadCurrentUser();
		},

		onCollapseExpandPress: function () {
			var oModel = this.getView().getModel();
			var oNavigationList = this.byId("navigationList");
			var bExpanded = oNavigationList.getExpanded();

			oNavigationList.setExpanded(!bExpanded);
		},

		onNavItemPress: function (oEvent) {
			const oItem = oEvent.getParameter("item"),
				sText = oItem.getText();
		},
		onNavItemSelect: function (oEvent) {
			var oItem = oEvent.getParameter("item");
			var oKey = oItem.getKey();
			var oRouter = this.getOwnerComponent().getRouter();
			sap.ui.core.routing.HashChanger.getInstance().replaceHash("");

			switch (oKey) {
				case "sidenav_claimsubmission":
					this.onNav_ClaimSubmission();
					break;
				// Start added by Jefry 15-01-2026
				case "createrequest":
					this.onClickMyRequest();
					break;
				// End added by Jefry 15-01-2026
				case "config":
					oRouter.navTo("Configuration");
					break;
				case "dashboard":
					oRouter.navTo("Dashboard");
					break;
				default:
					// navigate to page with ID same as the key
					var oPage = this.byId(oKey); // make sure your NavContainer has a page with this ID
					if (oPage) {
						this.byId("pageContainer").to(oPage);
					}
					break;
			}
		},

		onMenuButtonPress: function () {
			var toolPage = this.byId("toolPage");
			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		onSideNavButtonPress: function () {
			var oToolPage = this.byId("toolPage");
			var bSideExpanded = oToolPage.getSideExpanded();

			this._setToggleButtonTooltip(bSideExpanded);

			oToolPage.setSideExpanded(!bSideExpanded);
		},

		_setToggleButtonTooltip: function (bLarge) {
			var oToggleButton = this.byId('sideNavigationToggleButton');
			if (bLarge) {
				oToggleButton.setTooltip('Large Size Navigation');
			} else {
				oToggleButton.setTooltip('Small Size Navigation');
			}
		},

		// Functions - Claim Submission
		onNav_ClaimSubmission: async function () {
			// load Claim Process dialog
			var oName = "claima.fragment.claimsubmission_claimprocess"
			this.oDialog_ClaimProcess ??= await this.loadFragment({
				name: oName,
			});
			if (this.oDialog_ClaimProcess) {
				this._onInit_ClaimProcess();
				this.oDialog_ClaimProcess.open();
			}
			else {
				MessageToast.show(this._getTexti18n("msg_nav_error_fragment", [oName]));
			}
		},

		_getNewEmployeeModel: function (modelName) {
			// Employee Model
			var oEmployeeModel = new JSONModel({
				"eeid": null,
				"name": null,
				"grade": null,
				"cc": null,
				"pos": null,
				"dep": null,
				"unit_section": null,
				"b_place": null,
				"marital": null,
				"job_group": null,
				"office_location": null,
				"address_line1": null,
				"address_line2": null,
				"address_line3": null,
				"postcode": null,
				"state": null,
				"country": null,
				"contact_no": null,
				"email": null,
				"direct_supperior": null,
				"role": null,
				"user_type": null,
				"mobile_bill_eligibility": null,
				"mobile_bill_elig_amount": null,
				"employee_type": null,
				"position_name": null,
				"position_start_date": null,
				"position_event_reason": null,
				"confirmation_date": null,
				"effective_date": null,
				"updated_date": null,
				"inserted_date": null,
				"medical_insurance_entitlement": null,
				"descr": {
					"cc": null,
					"dep": null,
					"unit_section": null,
					"marital": null,
					"job_group": null,
					"state": null,
					"country": null,
					"direct_supperior": null,
					"role": null,
					"user_type": null,
					"employee_type": null
				}
			});
			//// set input
			this.getView().setModel(oEmployeeModel, modelName);
			return this.getView().getModel(modelName);
		},

		_getNewClaimSubmissionModel: function (modelName) {
			// Employee Model
			var oEmployeeModel = this._getNewEmployeeModel("emp_current");

			// Claim Submission Model
			var oClaimSubmissionModel = new JSONModel({
				"emp_master": oEmployeeModel.getData(),
				"claimtype": {
					"type": null,
					"item": null,
					"category": null,
					"requestform": {
						"request_id": null,
						"objective_purpose": null,
						"preapproval_amount": null,
						"trip_start_date": null,
						"trip_end_date": null,
						"event_start_date": null,
						"event_end_date": null,
						"alternate_cost_center": null,
						"descr": {
							"alternate_cost_center": null
						}
					},
					"requestform_amt": null,
					"descr": {
						"type": null,
						"item": null,
						"category": null,
					}
				},
				"claim_header": {
					"claim_id": null,
					"emp_id": null,
					"purpose": null,
					"trip_start_date": null,
					"trip_end_date": null,
					"event_start_date": null,
					"event_end_date": null,
					"submission_type": null,
					"comment": null,
					"alternate_cost_center": null,
					"cost_center": null,
					"request_id": null,
					"attachment_email_approver": null,
					"status_id": null,
					"claim_type_id": null,
					"total_claim_amount": null,
					"final_amount_to_receive": null,
					"last_modified_date": null,
					"submitted_date": null,
					"last_approved_date": null,
					"last_approved_time": null,
					"payment_date": null,
					"location": null,
					"spouse_office_address": null,
					"house_completion_date": null,
					"move_in_date": null,
					"housing_loan_scheme": null,
					"lender_name": null,
					"specify_details": null,
					"new_house_address": null,
					"dist_old_house_to_office_km": null,
					"dist_old_house_to_new_house_km": null,
					"approver1": null,
					"approver2": null,
					"approver3": null,
					"approver4": null,
					"approver5": null,
					"last_send_back_date": null,
					"course_code": null,
					"project_code": null,
					"cash_advance_amount": null,
					"preapproved_amount": null,
					"reject_reason_id": null,
					"send_back_reason_id": null,
					"last_send_back_time": null,
					"reject_reason_date": null,
					"reject_reason_time": null,
					"descr": {
						"submission_type": null,
						"alternate_cost_center": null,
						"cost_center": null,
						"request_id": null,
						"status_id": null,
						"claim_type_id": null,
						"housing_loan_scheme": null,
						"lender_name": null,
						"course_code": null,
						"project_code": null,
					}
				},
				"claimitems": [],
				"claimitem_count": 0,
				"reportnumber": {
					"reportno": null,
					"current": null
				}
			});
			//// set input
			this.getView().setModel(oClaimSubmissionModel, modelName);
			return this.getView().getModel(modelName);
		},

		//// Functions - Claim Process
		_onInit_ClaimProcess: async function () {
			// reset claim process data
			this._reset_ClaimProcess();

			// set new claim submission model;
			var oInputModel = this._getNewClaimSubmissionModel("claimsubmission_input");
			//// set employee data
			var sUserId = sap.ushell ? sap.ushell.Container.getUser().getId() : null;
			var emp_data = await this._getEmpIdDetail(sUserId);
			// var sCostCenter = emp_data ? emp_data.cc : "";

			//// placeholder - set placeholder data
			if (!emp_data) {
				oInputModel.setProperty("/emp_master/eeid", "DEFAULT_USER");
				oInputModel.setProperty("/emp_master/name", "NAME11380");
				oInputModel.setProperty("/emp_master/grade", "G3");
				oInputModel.setProperty("/emp_master/cc", "108S37362");
				oInputModel.setProperty("/emp_master/pos", "10003793");
				oInputModel.setProperty("/emp_master/dep", "3600100000");
				oInputModel.setProperty("/emp_master/unit_section", "3700903102");
				oInputModel.setProperty("/emp_master/marital", "M");
				oInputModel.setProperty("/emp_master/office_location", "3700903100");
				oInputModel.setProperty("/emp_master/address_line1", "EE ADDRESS1");
				oInputModel.setProperty("/emp_master/address_line2", "EE ADDRESS2");
				oInputModel.setProperty("/emp_master/address_line3", "EE ADDRESS3");
				oInputModel.setProperty("/emp_master/postcode", "88888");
				oInputModel.setProperty("/emp_master/state", "SEL");
				oInputModel.setProperty("/emp_master/country", "MYS");
				oInputModel.setProperty("/emp_master/email", "1900668smsm1@epf.gov.my.test.test");
				oInputModel.setProperty("/emp_master/direct_supperior", "1902045");
				oInputModel.setProperty("/emp_master/employee_type", "2378");
				oInputModel.setProperty("/emp_master/position_name", "MAIN DUTY");
				oInputModel.setProperty("/emp_master/position_start_date", "1993-06-16");
				oInputModel.setProperty("/emp_master/position_event_reason", "Z302");
				oInputModel.setProperty("/emp_master/effective_date", "1993-12-16");
				oInputModel.setProperty("/emp_master/descr/cc", "SA Seb. Jaya-Penguatkuasaan");
				oInputModel.setProperty("/emp_master/descr/dep", "Department 1");
				oInputModel.setProperty("/emp_master/descr/unit_section", "test unit section");
				oInputModel.setProperty("/emp_master/descr/marital", "Married");
				oInputModel.setProperty("/emp_master/descr/state", "Selangor");
				oInputModel.setProperty("/emp_master/descr/country", "Malaysia");
				oInputModel.setProperty("/emp_master/descr/direct_supperior", "test direct supperior");
				oInputModel.setProperty("/emp_master/descr/employee_type", "test employee type");
			}
		},

		onSelect_ClaimProcess_ClaimType: function (oEvent) {
			// validate claim type
			var claimType = oEvent.getParameters().selectedItem;
			if (claimType) {
				// set claim items based on selected claim type
				this.byId("select_claimprocess_claimitem").bindAggregation("items", {
					path: "employee>/ZCLAIM_TYPE_ITEM",
					filters: [new sap.ui.model.Filter('CLAIM_TYPE_ID', sap.ui.model.FilterOperator.EQ, claimType.getKey())],
					// sorter: [
					// 	{ path: 'CLAIM_TYPE_ITEM_DESC' },
					// 	{ path: 'CLAIM_TYPE_ITEM_ID' },
					// ],
					parameters: {
						$expand: {
							"ZCLAIM_CATEGORY": {
								$select: "CLAIM_CATEGORY_DESC"
							}
						},
						$select: "CATEGORY_ID"
					},
					template: new sap.ui.core.Item({
						key: "{employee>CLAIM_TYPE_ITEM_ID}",
						text: "{employee>CLAIM_TYPE_ITEM_DESC}"
					})
				});
				this.byId("select_claimprocess_claimitem").setEditable(true);
				this.byId("select_claimprocess_claimitem").setSelectedItem(null);

				// clear claim item category if new claim type selected
				if (this.byId("input_claimprocess_category").getValue().length > 0) {
					this.byId("input_claimprocess_category").setValue(null);
				}

				// reset request form
				if (this.byId("select_claimprocess_requestform").getEnabled()) {
					this._reset_ClaimProcess_RequestForm();
				}

				// disable 'Start Claim' button if new claim type selected 
				if (this.byId("button_claimprocess_startclaim").getEnabled()) {
					this.byId("button_claimprocess_startclaim").setEnabled(false);
				}
			}
		},

		onSelect_ClaimProcess_ClaimItem: function (oEvent) {
			// validate claim item
			var claimItem = oEvent.getParameters().selectedItem;
			if (claimItem) {
				// get category values from claim item
				var categoryId = claimItem.getBindingContext("employee").getObject("CATEGORY_ID");
				var claimCategoryDesc = claimItem.getBindingContext("employee").getObject("ZCLAIM_CATEGORY/CLAIM_CATEGORY_DESC");

				// show claim item category in category input
				this.byId("input_claimprocess_category").setValue(claimCategoryDesc);
				var oInputModel = this.getView().getModel("claimsubmission_input");

				// enable 'Request Form' selection
				if (categoryId == 'PREAPPROVAL') {
					if (!this.byId("select_claimprocess_requestform").getEnabled()) {
						this.byId("select_claimprocess_requestform").bindAggregation("items", {
							path: "employee>/ZREQUEST_HEADER",
							filters: [
								new sap.ui.model.Filter('EMP_ID', sap.ui.model.FilterOperator.EQ, oInputModel.getProperty("/emp_master/eeid")),
								new sap.ui.model.Filter('CLAIM_TYPE_ID', sap.ui.model.FilterOperator.EQ, oInputModel.getProperty("/claimtype/type")),
							],
							parameters: {
								$expand: {
									"COSTCENTER": {
										$select: "COST_CENTER_DESC"
									}
								},
								$select: "PREAPPROVAL_AMOUNT,EVENT_START_DATE,EVENT_END_DATE,ALTERNATE_COST_CENTER"
							},
							template: new sap.ui.core.Item({
								key: "{employee>REQUEST_ID}",
								text: "{employee>REQUEST_ID} {employee>OBJECTIVE_PURPOSE} ({employee>TRIP_START_DATE} – {employee>TRIP_END_DATE})"
							})
						});
						this.byId("select_claimprocess_requestform").setEnabled(true);
						this.byId("select_claimprocess_requestform").setVisible(true);
						this.byId("select_claimprocess_requestform").setEditable(true);
						this.byId("select_claimprocess_requestform").setSelectedItem(null);

						// enable 'Create Pre-Approval Request' button
						this.byId("button_claimprocess_preapproval").setEnabled(true);
						this.byId("button_claimprocess_preapproval").setVisible(true);

						// disable 'Start Claim' button if active
						if (this.byId("button_claimprocess_startclaim").getEnabled()) {
							this.byId("button_claimprocess_startclaim").setEnabled(false);
						}
					}
				}

				// enable 'Start Claim' button if not Pre-Approval
				if (categoryId != 'PREAPPROVAL') {
					this.byId("button_claimprocess_startclaim").setEnabled(true);
				}
			}
		},

		onSelect_ClaimProcess_RequestForm: function () {
			// enable 'Start Claim' button if not already enabled
			if (!this.byId("button_claimprocess_startclaim").getEnabled()) {
				this.byId("button_claimprocess_startclaim").setEnabled(true);
			}
		},

		onPreApproval_ClaimProcess: function () {
			// reset Claim Process dialog before closing
			this._reset_ClaimProcess();
			this.oDialog_ClaimProcess.close();

			// load Pre-Approval Request dialog 
			this.onClickMyRequest();
		},

		onStartClaim_ClaimProcess: async function () {
			// validate input data
			var oInputModel = this.getView().getModel("claimsubmission_input");
			//// get claim type/item description
			oInputModel.setProperty("/claimtype/descr/type", this.byId("select_claimprocess_claimtype")._getSelectedItemText());
			oInputModel.setProperty("/claimtype/descr/item", this.byId("select_claimprocess_claimitem")._getSelectedItemText());
			//// get claim item category ID
			oInputModel.setProperty("/claimtype/category", this.byId("select_claimprocess_claimitem").getSelectedItem().getBindingContext("employee").getObject("CATEGORY_ID"));
			//// get request form values
			if (this.byId("select_claimprocess_requestform").getSelectedItem()) {
				oInputModel.setProperty("/claimtype/requestform/objective_purpose", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("OBJECTIVE_PURPOSE"));
				oInputModel.setProperty("/claimtype/requestform/preapproval_amount", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("PREAPPROVAL_AMOUNT"));
				oInputModel.setProperty("/claimtype/requestform/trip_start_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("TRIP_START_DATE")));
				oInputModel.setProperty("/claimtype/requestform/trip_end_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("TRIP_END_DATE")));
				oInputModel.setProperty("/claimtype/requestform/event_start_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("EVENT_START_DATE")));
				oInputModel.setProperty("/claimtype/requestform/event_end_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("EVENT_END_DATE")));
				oInputModel.setProperty("/claimtype/requestform/alternate_cost_center", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("ALTERNATE_COST_CENTER"));
				oInputModel.setProperty("/claimtype/requestform/descr/alternate_cost_center", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("COSTCENTER/COST_CENTER_DESC"));
			}

			// close Claim Process dialog
			this.oDialog_ClaimProcess.close();

			// load Claim Input dialog
			var oName = "claima.fragment.claimsubmission_claiminput";
			this.oDialog_ClaimInput ??= await this.loadFragment({
				name: oName,
			});
			if (this.oDialog_ClaimInput) {
				this._onInit_ClaimInput();
				this.oDialog_ClaimInput.open();
			}
			else {
				MessageToast.show(this._getTexti18n("msg_nav_error_fragment", [oName]));
			}
		},

		onCancel_ClaimProcess: function () {
			this._reset_ClaimProcess();
			this.oDialog_ClaimProcess.close();
		},

		_reset_ClaimProcess: function () {
			// reset claim type select
			if (this.byId("select_claimprocess_claimtype").getSelectedItem()) {
				this.byId("select_claimprocess_claimtype").setSelectedItem(null);
			}

			// reset claim item select
			if (this.byId("select_claimprocess_claimitem").getEditable()) {
				this.byId("select_claimprocess_claimitem").unbindAggregation("items");
				this.byId("select_claimprocess_claimitem").setSelectedItem(null);
				this.byId("select_claimprocess_claimitem").setEditable(false);
			}

			// reset claim item category
			if (this.byId("input_claimprocess_category").getValue().length > 0) {
				this.byId("input_claimprocess_category").setValue(null);
			}

			// reset request form
			if (this.byId("select_claimprocess_requestform").getEnabled()) {
				this._reset_ClaimProcess_RequestForm();
			}

			// disable 'Start Claim' button
			if (this.byId("button_claimprocess_startclaim").getEnabled()) {
				this.byId("button_claimprocess_startclaim").setEnabled(false);
			}
		},

		_reset_ClaimProcess_RequestForm: function () {
			// disable request form select
			this.byId("select_claimprocess_requestform").unbindAggregation("items");
			this.byId("select_claimprocess_requestform").setEnabled(false);
			this.byId("select_claimprocess_requestform").setVisible(false);
			this.byId("select_claimprocess_requestform").setEditable(false);
			this.byId("select_claimprocess_requestform").setSelectedItem(null);

			// disable 'Create Pre-Approval Request' button
			this.byId("button_claimprocess_preapproval").setEnabled(false);
			this.byId("button_claimprocess_preapproval").setVisible(false);
		},
		//// end Functions - Claim Process

		//// Functions - Claim Input
		_onInit_ClaimInput: function () {
			// reset claim input data if exists
			this._reset_ClaimInput();

			// set data for claim header
			var oInputModel = this.getView().getModel("claimsubmission_input");
			var lastModifiedDate = this._getJsonDate(new Date());
			oInputModel.setProperty("/claim_header/emp_id", oInputModel.getProperty("/emp_master/eeid"));
			oInputModel.setProperty("/claim_header/status_id", "DRAFT");
			oInputModel.setProperty("/claim_header/last_modified_date", lastModifiedDate);
			oInputModel.setProperty("/claim_header/claim_type_id", oInputModel.getProperty("/claimtype/type"));
			oInputModel.setProperty("/claim_header/submission_type", oInputModel.getProperty("/claimtype/category"));
			oInputModel.setProperty("/claim_header/cost_center", oInputModel.getProperty("/emp_master/cc"));
			//// request form values
			oInputModel.setProperty("/claim_header/request_id", oInputModel.getProperty("/claimtype/requestform/request_id"));
			oInputModel.setProperty("/claim_header/preapproved_amount", oInputModel.getProperty("/claimtype/requestform/preapproval_amount"));
			oInputModel.setProperty("/claim_header/trip_start_date", oInputModel.getProperty("/claimtype/requestform/trip_start_date"));
			oInputModel.setProperty("/claim_header/trip_end_date", oInputModel.getProperty("/claimtype/requestform/trip_end_date"));
			oInputModel.setProperty("/claim_header/event_start_date", oInputModel.getProperty("/claimtype/requestform/event_start_date"));
			oInputModel.setProperty("/claim_header/event_end_date", oInputModel.getProperty("/claimtype/requestform/event_end_date"));
			oInputModel.setProperty("/claim_header/alternate_cost_center", oInputModel.getProperty("/claimtype/requestform/alternate_cost_center"));
			oInputModel.setProperty("/claim_header/descr/alternate_cost_center", oInputModel.getProperty("/claimtype/requestform/descr/alternate_cost_center"));
			//// initialized amount values
			oInputModel.setProperty("/claim_header/total_claim_amount", "0.00");
			oInputModel.setProperty("/claim_header/final_amount_to_receive", "0.00");
			oInputModel.setProperty("/claim_header/cash_advance_amount", "0.00");
			//// include description in data
			oInputModel.setProperty("/claim_header/descr/status_id", this._getTexti18n("value_claiminput_status_draft"));
			oInputModel.setProperty("/claim_header/descr/claim_type_id", oInputModel.getProperty("/claimtype/descr/type"));
			oInputModel.setProperty("/claim_header/descr/submission_type", oInputModel.getProperty("/claimtype/descr/category"));
			oInputModel.setProperty("/claim_header/descr/cost_center", oInputModel.getProperty("/emp_master/descr/cc"));
			oInputModel.setProperty("/claim_header/descr/request_id", oInputModel.getProperty("/claimtype/requestform/objective_purpose"));

			// pre-approval request values
			var oInputModel = this.getView().getModel("claimsubmission_input");
			if (oInputModel.getProperty("/claimtype/category") == 'PREAPPROVAL') {
				// make Pre-Approval Request, Approve Amount visible
				this.byId("text_claiminput_preapprovalreq").setVisible(true);
				this.byId("text_claiminput_amtapproved").setVisible(true);
				//// disable editing if dates already set from request
				if (oInputModel.getProperty("/claimtype/requestform/trip_start_date")) {
					this.byId("datepicker_claiminput_tripstartdate").setEditable(false);
				}
				if (oInputModel.getProperty("/claimtype/requestform/trip_end_date")) {
					this.byId("datepicker_claiminput_tripenddate").setEditable(false);
				}
				if (oInputModel.getProperty("/claimtype/requestform/event_start_date")) {
					this.byId("datepicker_claiminput_eventstartdate").setEditable(false);
				}
				if (oInputModel.getProperty("/claimtype/requestform/event_end_date")) {
					this.byId("datepicker_claiminput_eventenddate").setEditable(false);
				}
				//// disable editing alternate cost center if already set from request
				if (oInputModel.getProperty("/claimtype/requestform/alternate_cost_center")) {
					this.byId("select_claiminput_altcc").setEnabled(false);
					this.byId("select_claiminput_altcc").setEditable(false);
					this.byId("select_claiminput_altcc").setVisible(false);

					this.byId("input_claiminput_altcc").setEnabled(true);
					this.byId("input_claiminput_altcc").setVisible(true);
				}
			}
		},

		_getJsonDate: function (date) {
			if (date) {
				var oDate = new Date (date);
				var oDateString = oDate.toLocaleString('default', { day: '2-digit' }) + " " + oDate.toLocaleString('default', { month: 'short' }) + " " + oDate.toLocaleString('default', { year: 'numeric' });
				return oDateString;
			} else {
				return null;
			}
		},

		onCreateReport_Create: async function () {
			// validate input data
			var oInputModel = this.getView().getModel("input");
			var oInputData = oInputModel.getData();

			if (
				oInputData.report.purpose == '' ||
				oInputData.report.startdate == '' ||
				oInputData.report.enddate == '' ||
				oInputData.report.comment == '') {
				// required fields without value
				var message = this._getTexti18n("dialog_createreport_required");
				MessageToast.show(message);
			} else {

				// get current claim number
				var currentReportNumber = await this.getCurrentReportNumber();

				// use default value for category if no value detected
				if (oInputData.report.category == '') {
					oInputData.report.category = 'expcat_direct';
				}
				//// Claim Date (get current date)
				var currentDate = new Date().toJSON().substring(0, 10);
				//// Amount Approved (Total)
				var amtApproved = Number.parseFloat(oInputData.report.amt_approved).toFixed(2);
				if (amtApproved == 'NaN') {
					amtApproved = 0.00;
				}
				//// Claim Main Category ID
				switch (oInputData.report.category) {
					case "expcat_direct":
						var claimMainCatID = "0000000001";
						break;
					case "expcat_auto":
						claimMainCatID = "0000000002";
						break;
					case "expcat_withoutrequest":
						claimMainCatID = "0000000003";
						break;
				}

				//// set as current data
				// var oCurrentModel = this.getView().getModel("current");
				// oCurrentModel.setData(oInputData);

				// set context
				var currentEntity = {
					"CLAIM_ID": currentReportNumber.reportNo,
					"CLAIM_MAIN_CAT_ID": claimMainCatID,
					"EMP_ID": "000001",
					"CLAIM_DATE": currentDate,
					"CATEGORY": oInputData.report.purpose,
					"ALTERNATE_COST_CENTER": null,
					"CLAIM_TYPE_ID": "001",
					"TOTAL": amtApproved,
					"STATUS_ID": "Draft",
					"DEPARTMENT": "IT Dept 2",
					"EMP_NAME": "Ahmad Anthony",
					"JOB_POSITION": "Junior Analyst",
					"PERSONAL_GRADE": "22",
					"POSITION_NO": "000003",
					"ZCLAIM_ITEM": null
				}

				// map header → current schema used by report.fragment
				// const mapped = this._mapHeaderToCurrent(row);
				const mapped = this._mapHeaderToCurrent(currentEntity);


				// set "current" model data
				let oCurrent = this.getView().getModel("current");
				if (!oCurrent) {
					oCurrent = new sap.ui.model.json.JSONModel();
					this.getView().setModel(oCurrent, "current");
				}
				oCurrent.setData(mapped);


				// navigate to the detail page that contains report.fragment
				const oDetailPage = this.byId("expensereport");
				if (!oDetailPage) {
					sap.m.MessageToast.show("Detail page 'expensereport' not found.");
					return;
				}
				this.byId("pageContainer").to(oDetailPage);

				//// go to expense report screen
				// var view = "expensereport";
				this.oDialog.close();
				// this.byId("pageContainer").to(this.getView().createId(view));
				// this.getView().byId("expensetypescr").setVisible(true);
				// this.getView().byId("claimscr").setVisible(false);
				// this.createreportButtons("expensetypescr");
			}
		},

		onClaimSubmission_ClaimInput: async function () {
			// validate required fields
			if (
				!this.byId("input_claiminput_purpose").getValue() ||
				!this.byId("datepicker_claiminput_tripstartdate").getValue() ||
				!this.byId("datepicker_claiminput_tripenddate").getValue() ||
				!this.byId("input_claiminput_comment").getValue()
			) {
				// stop claim submission if values empty
				MessageToast.show(this._getTexti18n("msg_claiminput_required"));
				return;
			}
			// validate attachment
			if (this.byId("fileuploader_claiminput_attachment").getValue()) {
				var isUploadSuccess = this._onUpload_ClaimInput_Attachment();
				if (!isUploadSuccess) {
					// don't proceed claim submission if attachment upload fails
					return;
				}
			}
			// validate date range
			//// trip start/end date
			if (!this._validDateRange("datepicker_claiminput_tripstartdate", "datepicker_claiminput_tripenddate")) {
				// stop claim submission if incomplete
				return;
			}
			//// event start/end date (optional)
			if (this.byId("datepicker_claiminput_eventstartdate").getValue() || this.byId("datepicker_claiminput_eventenddate").getValue()) {
				if (!this._validDateRange("datepicker_claiminput_eventstartdate", "datepicker_claiminput_eventenddate")) {
					// stop claim submission if incomplete
					return;
				}
			}

			// validate input data
			var oInputModel = this.getView().getModel("claimsubmission_input");
			//// get alternate cost center
			if (this.byId("select_claiminput_altcc").getEnabled()) {
				// select value from drop-down
				var altCostCenter = this.byId("select_claiminput_altcc").getSelectedItem();
				if (altCostCenter) {
					oInputModel.setProperty("/claim_header/descr/alternate_cost_center", altCostCenter.getBindingContext("employee").getObject("COST_CENTER_DESC"));
				}
			}
			//// get claim report number for Claim ID
			var currentReportNumber = await this.getCurrentReportNumber();
			if (currentReportNumber) {
				oInputModel.setProperty("/claim_header/claim_id", currentReportNumber.reportNo);
				oInputModel.setProperty("/reportnumber/reportno", currentReportNumber.reportNo);
				oInputModel.setProperty("/reportnumber/current", currentReportNumber.current);
			}

			// close Claim Input dialog
			this.oDialog_ClaimInput.close();

			// load Claim Submission page
			//// load Claim Submission init
			var oClaimSubmissionPage = this.getView().byId('navcontainer_claimsubmission');
			// if (oClaimSubmissionPage) {
			// 	setTimeout(function () {
			// 		// find the first descendant that exposes getController() (typically the inner XMLView)
			// 		var aViews = (typeof oClaimSubmissionPage.findAggregatedObjects === "function")
			// 			? oClaimSubmissionPage.findAggregatedObjects(true, function (c) {
			// 				return typeof c.getController === "function";
			// 			})
			// 			: [];

			// 		var oCtrl = (aViews && aViews.length) ? aViews[0].getController() : null;

			// 		if (oCtrl && typeof oCtrl._getInputModel === "function") {
			// 			oCtrl._getInputModel();
			// 		} else {
			// 			jQuery.sap.log.warning("RequestForm controller API 'loadItemsForRequest' not found.");
			// 		}
			// 	}, 0);
			// }
			// this.byId("pageContainer").to(this.getView().byId('page_claimsubmission'));
			this.byId("pageContainer").to(oClaimSubmissionPage);
		},

		_onUpload_ClaimInput_Attachment: function () {
			// check if file can be uploaded
			var oFileUploader = this.byId("fileuploader_claiminput_attachment");
			oFileUploader.checkFileReadable().then(function () {
				oFileUploader.upload();
				return true;
			}, function (error) {
				MessageToast.show(this._getTexti18n("msg_claiminput_attachment_upload_error"));
			}).then(function () {
				oFileUploader.clear();
				return false;
			});
		},

		onUploadComplete_ClaimInput_Attachment: function (oEvent) {
			// Please note that the event response should be taken from the event parameters but for our test example, it is hardcoded.

			var sResponse = "File upload complete. Status: 200",
				iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0]),
				sMessage;

			if (sResponse) {
				sMessage = iHttpStatusCode === 200 ? sResponse + " (Upload Success)" : sResponse + " (Upload Error)";
				MessageToast.show(sMessage);
			}
		},

		onTypeMissmatch_ClaimInput_Attachment: function (oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			aFileTypes.map(function (sType) {
				return "*." + sType;
			});
			MessageToast.show(this._getTexti18n("msg_claiminput_attachment_upload_mismatch", [this.byId("fileuploader_claiminput_attachment").getValue()]));
		},
		
		_validDateRange: function (startdate, enddate) {
			var startDateValue = this.byId(startdate).getValue();
			var endDateValue = this.byId(enddate).getValue();
			// check for missing value
			if (!startDateValue || !endDateValue) {
				MessageToast.show(this._getTexti18n("msg_daterange_missing"));
				return false;
			}
			// check if end date earlier than start date
			var startDateUnix 	= new Date (startDateValue).valueOf();
			var endDateUnix 	= new Date (endDateValue).valueOf();
			if (startDateUnix > endDateUnix) {
				MessageToast.show(this._getTexti18n("msg_daterange_order"));
				return false;
			}
			else {
				return true;
			}
		},

		onCancel_ClaimInput: function () {
			this._reset_ClaimInput();
			this.oDialog_ClaimInput.close();
		},

		_reset_ClaimInput: function () {
			// reset input fields
			//// report purpose
			if (this.byId("input_claiminput_purpose").getValue()) {
				this.byId("input_claiminput_purpose").setValue(null);
			}
			//// trip dates
			if (this.byId("datepicker_claiminput_tripstartdate").getValue()) {
				this.byId("datepicker_claiminput_tripstartdate").setValue(null);
			}
			if (!this.byId("datepicker_claiminput_tripstartdate").getEditable()) {
				this.byId("datepicker_claiminput_tripstartdate").setEditable(true);
			}
			if (this.byId("datepicker_claiminput_tripenddate").getValue()) {
				this.byId("datepicker_claiminput_tripenddate").setValue(null);
			}
			if (!this.byId("datepicker_claiminput_tripenddate").getEditable()) {
				this.byId("datepicker_claiminput_tripenddate").setEditable(true);
			}
			//// event dates
			if (this.byId("datepicker_claiminput_eventstartdate").getValue()) {
				this.byId("datepicker_claiminput_eventstartdate").setValue(null);
			}
			if (!this.byId("datepicker_claiminput_eventstartdate").getEditable()) {
				this.byId("datepicker_claiminput_eventstartdate").setEditable(true);
			}
			if (this.byId("datepicker_claiminput_eventenddate").getValue()) {
				this.byId("datepicker_claiminput_eventenddate").setValue(null);
			}
			if (!this.byId("datepicker_claiminput_eventenddate").getEditable()) {
				this.byId("datepicker_claiminput_eventenddate").setEditable(true);
			}
			//// location
			if (this.byId("input_claiminput_location").getValue()) {
				this.byId("input_claiminput_location").setValue(null);
			}
			//// alternate cost center
			if (!this.byId("select_claiminput_altcc").getEnabled()) {
				this.byId("select_claiminput_altcc").setEnabled(true);
				this.byId("select_claiminput_altcc").setEditable(true);
				this.byId("select_claiminput_altcc").setVisible(true);
			}
			if (this.byId("select_claiminput_altcc").getSelectedItem()) {
				this.byId("select_claiminput_altcc").setSelectedItem(null);
			}
			if (this.byId("input_claiminput_altcc").getEnabled()) {
				this.byId("input_claiminput_altcc").setEnabled(false);
				this.byId("input_claiminput_altcc").setEditable(false);
				this.byId("input_claiminput_altcc").setVisible(false);
			}
			//// attachment email approval
			if (this.byId("fileuploader_claiminput_attachment").getValue()) {
				this.byId("fileuploader_claiminput_attachment").setValue(null);
			}
			//// comment
			if (this.byId("input_claiminput_comment").getValue()) {
				this.byId("input_claiminput_comment").setValue(null);
			}

			// rehide pre-approval display fields
			if (this.byId("text_claiminput_preapprovalreq").getVisible()) {
				this.byId("text_claiminput_preapprovalreq").setVisible(false);
			}
			if (this.byId("text_claiminput_amtapproved").getVisible()) {
				this.byId("text_claiminput_amtapproved").setVisible(false);
			}
		},
		//// end Functions - Claim Input
		// end Functions - Claim Submission

		onPressBack: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("dashboard"));
		},

		onPressSaveDraft: async function (oEvent) {
			var currentReportNumber = await this.getCurrentReportNumber();

			// Set data for ZCLAIM_HEADER
			var oCurrentModel = this.getView().getModel("current");
			//// Claim Type ID
			oCurrentModel.setProperty("/report/claim_type", "001")
			//// Status ID
			oCurrentModel.setProperty("/report/status_id", "Draft")
			//// get data from current claim header shown
			var oCurrentData = oCurrentModel.getData();

			////// Claim Main Category ID
			// switch (oCurrentData.report.category) {
			// case "expcat_direct":
			// var claimMainCatID = "0000000001";
			// break;
			// case "expcat_auto":
			// claimMainCatID = "0000000002";
			// break;
			// case "expcat_withoutrequest":
			// claimMainCatID = "0000000003";
			// break;
			// }

			//// Alternate Cost Center
			var altCC = oCurrentData.altcc;
			if (altCC == '') {
				altCC = null;
			}

			//// Amount Approved (Total)
			var amtApproved = Number.parseFloat(oCurrentData.report.amt_approved).toFixed(2);
			if (amtApproved == 'NaN') {
				amtApproved = 0.00;
			}

			// Write to Database Table ZCLAIM_HEADER
			var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
			var sServiceUrl = sBaseUri + "/ZCLAIM_HEADER";

			fetch(sServiceUrl,
				{
					method: "POST", headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						CLAIM_ID: oCurrentData.report.id,
						// CLAIM_MAIN_CAT_ID      : claimMainCatID,
						CLAIM_MAIN_CAT_ID: oCurrentData.costcenter,
						EMP_ID: "000001",
						CLAIM_DATE: oCurrentData.report.startdate,
						CATEGORY: oCurrentData.report.purpose,
						ALTERNATE_COST_CENTER: altCC,
						CLAIM_TYPE_ID: oCurrentData.report.claim_type,
						TOTAL: amtApproved,
						STATUS_ID: oCurrentData.report.status_id,
						DEPARTMENT: "IT Dept 2",
						EMP_NAME: "Ahmad Anthony",
						JOB_POSITION: "Junior Analyst",
						PERSONAL_GRADE: "22",
						POSITION_NO: "000003",
						ZCLAIM_ITEM: null
					})
				})
				.then(r => r.json())
				.then((res) => {
					if (!res.error) {
						MessageToast.show("Record created");
						this.updateCurrentReportNumber(currentReportNumber.current);
						this.byId("pageContainer").to(this.getView().createId("dashboard"));
					} else {
						MessageToast.show(res.error.code, res.error.message);
					};
				});
		},

		getCurrentReportNumber: async function () {
			const sBaseUri = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri || "/odata/v4/EmployeeSrv/";
			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZNUM_RANGE";

			try {
				const response = await fetch(sServiceUrl);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				const nr02 = (data.value || data).find(x => x.RANGE_ID === "NR02");
				if (!nr02 || nr02.CURRENT == null) {
					throw new Error("NR02 not found or CURRENT is missing");
				}

				const current = Number(nr02.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const reportNo = `CLM${yy}${String(current).padStart(9, "0")}`;

				return { reportNo, current };

			} catch (err) {
				console.error("Error fetching CDS data:", err);
				return null; // or: throw err;
			}
		},

		updateCurrentReportNumber: async function (currentNumber) {
			const sId = "NR02";
			const sBaseUri =
				this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri
				|| "/odata/v4/EmployeeSrv/";

			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZNUM_RANGE('" + encodeURIComponent(sId) + "')";
			const nextNumber = currentNumber + 1;

			try {
				const res = await fetch(sServiceUrl, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ CURRENT: String(nextNumber) })
				});

				if (!res.ok) {
					const errText = await res.text().catch(() => "");
					throw new Error(`PATCH failed ${res.status} ${res.statusText}: ${errText}`);
				}

				// PATCH often returns 204
				if (res.status === 204) return { CURRENT: nextNumber };

				// If the server returns JSON entity
				const contentType = res.headers.get("content-type") || "";
				if (contentType.includes("application/json")) {
					return await res.json();
				}
				return await res.text(); // fallback
			} catch (e) {
				console.error("Error updating number range:", e);
				return null;
			}
		},

		onPressClaimDetails: function () {
			this.getView().byId("expensetypescr").setVisible(false);
			this.getView().byId("claimscr").setVisible(true);
			this.createreportButtons("claimscr");
		},

		createreportButtons: function (oId) {
			var button = ["cancelbtn", "savebtn", "backbtn", "draft", "delete", "submit"];
			var button_exp = ["backbtn", "draft", "delete", "submit"];
			var button_cd = ["cancelbtn", "savebtn"];

			// select visible buttons based on visible fragment
			var button_set;
			switch (oId) {
				case "expensetypescr":
					button_set = button_exp;
					break;
				case "claimscr":
					button_set = button_cd;
					break;
			}

			var i = 0;
			for (i; i < button.length; i++) {
				var btnid = button[i];
				if (button_set.includes(btnid)) {
					this.getView().byId(btnid).setVisible(true);
				} else {
					this.getView().byId(btnid).setVisible(false);
				}
			}

		},
		// Start added by Aiman Salim 22/1/2026 - For Create Expense Report.To show or hide fields based on Claim Item
		onClaimItemChange: function (oEvent) {
			const sKey = oEvent.getSource().getSelectedKey();
			//set ids 
			const oFe = this.byId("claimFrag--trDateFE") || this.byId("trDateFE");
			const oAltCost = this.byId("claimFrag--altcc") || this.byId("altcc");
			const oStartDate = this.byId("claimFrag--startdate") || this.byId("startdate");
			const oEndDate = this.byId("claimFrag--enddate") || this.byId("enddate");
			const oRecptnum = this.byId("claimFrag--receiptnum") || this.byId("receiptnum");
			const oVehicle = this.byId("claimFrag--vetype") || this.byId("vetype");

			const claimShow = (sKey !== "claim2");

			oFe.setVisible(claimShow);
			oAltCost.setVisible(claimShow);
			oStartDate.setVisible(claimShow);
			oEndDate.setVisible(claimShow);
			oRecptnum.setVisible(claimShow);
			oVehicle.setVisible(claimShow);

		},

		//Testing for User ID fetch based on user login
		_getUserIdFromFLP: function () {
			try {
				if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser) {
					return sap.ushell.Container.getUser().getId(); // e.g. AIMAN.SALIM
				}
			} catch (e) { }
			return null;
		},
		//For MyClaimStatus(myexpensereport) on item click. This will fetch data based on row selected and push to detail page

		onRowPress: async function (oEvent) {
			const oItem = oEvent.getParameter("listItem");
			const oCtx = oItem && oItem.getBindingContext("employee");

			if (!oCtx) {
				sap.m.MessageToast.show("No context found on the selected row.");
				return;
			}

			// optional: clear the selection (nice UX)
			const oSrcTable = oEvent.getSource();
			if (oSrcTable && oSrcTable.removeSelections) {
				oSrcTable.removeSelections(true);
			}

			const oModel = oCtx.getModel();        // OData V4 model "employee"
			const oPage = this.byId("expensereport");

			try {
				oPage.setBusy(true);

				// 2) Full header (gets anything not in $select)
				const oHeader = await oCtx.requestObject();
				const sClaimId = String(oHeader.CLAIM_ID || "").trim();

				if (!sClaimId) {
					sap.m.MessageToast.show("Selected row does not have a valid CLAIM_ID.");
					return;
				}

				// 3) Map header → "current" (report.fragment)
				let oCurrent = this.getView().getModel("current");
				if (!oCurrent) {
					oCurrent = new sap.ui.model.json.JSONModel();
					this.getView().setModel(oCurrent, "current");
				}
				oCurrent.setData(this._mapHeaderToCurrent(oHeader));

				// 4) Fetch items → "items" model (expensetype.fragment)
				const oItemsBinding = oModel.bindList(
					"/ZCLAIM_ITEM",
      /* oContext  */ undefined,
      /* aSorters  */[],
      /* aFilters  */[new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId)],
      /* mParams   */ {
						$select: "CLAIM_ID,START_DATE,CLAIM_TYPE_ITEM,CLAIM_ITEM_ID,AMOUNT,CURRENCY,STAFF_CATEGORY"
					}
				);

				const aItemCtxs = await oItemsBinding.requestContexts(0, Infinity);
				const aItems = await Promise.all(aItemCtxs.map(c => c.requestObject()));

				let oItemsModel = this.getView().getModel("items");
				if (!oItemsModel) {
					oItemsModel = new sap.ui.model.json.JSONModel({ results: [] });
					this.getView().setModel(oItemsModel, "items");
				}
				oItemsModel.setData({ results: aItems || [] });

				// 5) Navigate
				const oPageContainer = this.byId("pageContainer");
				oPageContainer.to(oPage);

				// Show expensetype first (your current UX)
				this.getView().byId("expensetypescr").setVisible(true);
				this.getView().byId("claimscr").setVisible(false);
				this.createreportButtons("expensetypescr");

			} catch (e) {
				jQuery.sap.log.error("onRowPress error: " + e);
				sap.m.MessageToast.show("Failed to load claim header/items.");
			} finally {
				oPage.setBusy(false);
			}
		},

		_mapHeaderToCurrent: function (row) {
			// Helper: convert to yyyy-MM-dd (adjust to your locale if needed)
			const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
			const toYMD = (d) => {
				if (d instanceof Date) return fmt.format(d);
				// handle ISO string "2026-01-26" or similar -> keep
				if (typeof d === "string") return d;
				return d || "";
			};

			return {
				id: row.CLAIM_ID,
				location: row.CLAIM_MAIN_CAT_ID || "",
				costcenter: row.CLAIM_MAIN_CAT_ID || "",
				altcc: row.ALTERNATE_COST_CENTRE || "",
				total: row.TOTAL,          // you use TOTAL in the table
				cashadv: row.CLAIM_ID || "",
				finalamt: row.CLAIM_ID || "",
				report: {
					id: row.CLAIM_ID,
					purpose: row.CATEGORY || "",
					startdate: toYMD(row.CLAIM_DATE),
					enddate: toYMD(row.CLAIM_DATE),
					location: row.LOCATION || "",
					category: row.CATEGORY || "",
					comment: row.CLAIM_ID || "",
					amt_approved: row.TOTAL || ""
				}
			};
		},

		//For My Pre-Approval (MyRequestForm) view - Upon click, it will move to MyRequestForm detail page. 
		onRowPressForm: async function (oEvent) {
			// row context from named model "employee"
			const oItem = oEvent.getParameter("listItem");
			const oCtx = oItem && oItem.getBindingContext("employee");

			if (!oCtx) {
				sap.m.MessageToast.show("No context found on the selected row.");
				return;
			}

			try {
				this.getView().setBusy(true);

				// Fetch the full entity (remaining props will be resolved as needed)
				const fullEntity = await oCtx.requestObject();

				// Map backend entity → MyRequestForm view model schema
				const mapped = this._mapHeaderToCurrentRequest(fullEntity);

				// Set/refresh the "request" JSON model (same pattern as onRowPress)
				let oRequest = this.getView().getModel("request");
				if (!oRequest) {
					oRequest = new sap.ui.model.json.JSONModel();
					this.getView().setModel(oRequest, "request");
				}
				oRequest.setData(mapped);


				const oModel = this.getOwnerComponent().getModel("request")
					|| this.getView().getModel("request");
				if (oModel) {
					oModel.setProperty("/view", "list");   // your custom flag
				}

				const sReqId = String(fullEntity.REQUEST_ID || "").trim();

				// Navigate to detail page that consumes the "request" model
				const oPageContainer = this.byId("pageContainer");
				const oDetailPage = this.byId("new_request");
				if (!oDetailPage) {
					sap.m.MessageToast.show("Detail page 'new_request' not found.");
					return;
				}
				oPageContainer.to(oDetailPage);

				this._callRequestFormLoad(oDetailPage, sReqId);

			} catch (e) {
				jQuery.sap.log.error("onRowPressForm failed: " + e);
				sap.m.MessageToast.show("Failed to load request data.");
			} finally {
				this.getView().setBusy(false);
			}
		},

		_mapHeaderToCurrentRequest: function (row) {
			// Helper: format date (if row.CLAIM_DATE is Date or /Date(...)/)
			const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd MMM yyyy" });
			const toYMD = (d) => {
				try {
					if (d instanceof Date) {
						return fmt.format(d);
					}
					if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
						return fmt.format(new Date(d));
					}
				} catch (e) {/* ignore */ }
				return d || "";
			};

			return {
				purpose: row.OBJECTIVE_PURPOSE || "",
				reqid: row.REQUEST_ID || "",
				tripstartdate: toYMD(row.TRIP_START_DATE),
				tripenddate: toYMD(row.TRIP_END_DATE),
				eventstartdate: toYMD(row.EVENT_START_DATE),
				eventenddate: toYMD(row.EVENT_END_DATE),
				costcenter: row.COST_CENTER || "",
				altcostcenter: row.ALTERNATE_COST_CENTRE || "",
				location: row.LOCATION || "",
				detail: row.REMARK || "",
				grptype: row.REQUEST_GROUP_ID || "",
				transport: row.TYPE_OF_TRANSPORTATION || "",
				reqstatus: row.STATUS || "",
				reqtype: row.REQUEST_TYPE_ID || "",
				comment: row.REMARK || "",
				// Static totals shown as "0.00" in fragment; keep if you plan to compute later
				saved: "",
				// If you later bind these, set proper numbers/strings:
				// caa / amt / total_amt not present in fragment's model; they are static "0.00" texts
				// You can add them when needed:
				// cashadvamount : "0.00",
				// amount        : "0.00",
				// totalamount   : "0.00"
			};
		},

		/**
		 * Call RequestForm.loadItemsForRequest by scanning descendants of the page.
		 * No changes needed in RequestForm.controller.
		 */
		_callRequestFormLoad: function (oDetailPage, sReqId) {
			// Defer to allow NavContainer to render the page content
			setTimeout(function () {
				// find the first descendant that exposes getController() (typically the inner XMLView)
				var aViews = (typeof oDetailPage.findAggregatedObjects === "function")
					? oDetailPage.findAggregatedObjects(true, function (c) {
						return typeof c.getController === "function";
					})
					: [];

				var oCtrl = (aViews && aViews.length) ? aViews[0].getController() : null;

				if (oCtrl && typeof oCtrl.loadItemsForRequest === "function") {
					oCtrl.loadItemsForRequest(sReqId);
				} else {
					jQuery.sap.log.warning("RequestForm controller API 'loadItemsForRequest' not found.");
				}
			}, 0);
		},
		// End added by Aiman Salim 22/1/2026 - 05/02/2026

		/* =========================================================
		 * Mileage dialog (Fragment) — use a dedicated controller - For Google Maps
		 * ========================================================= */

		// <<< CHANGED: use the new lazy loader instead of openHelloDialog()
		onValueHelpRequest: function () {
			this._openMileageFrag(); // <<< CHANGED
		},

		// <<< ADDED: lazy-load the fragment + its own controller
		_openMileageFrag: function () {
			var oView = this.getView();

			if (!this._pMileageFrag) {
				this._pMileageFrag = new Promise((resolve, reject) => {

					// Load the fragment controller class dynamically
					sap.ui.require(["claima/controller/mileagecalculator.controller"], (MileageFragController) => {
						try {
							var oFragController = new MileageFragController();

							// Pass host + fragment id prefix so Fragment.byId works inside the controller
							oFragController.setHost(this, oView.getId());

							// Load the fragment with id prefix
							Fragment.load({
								id: oView.getId(), // critical for byId() to resolve fragment controls
								name: "claima.fragment.mileagecalculator",
								controller: oFragController
							}).then((oDialog) => {
								// models + lifecycle
								oView.addDependent(oDialog);

								// Submit handler: push values back to your form inputs
								oFragController.setSubmitHandler(function (res) {
									// res = { from, to, km }

									// Put into From input
									var oFrom = this.byId("fromloc_id");
									if (oFrom) {
										oFrom.setValue(res.from);
										var b = oFrom.getBinding("value");
										if (b) {
											var m = b.getModel(), p = b.getPath();
											m.setProperty(p.charAt(0) === "/" ? p : "/" + p, res.from);
										}
									}

									// Put into To input
									var oTo = this.byId("toloc_id");
									if (oTo) {
										oTo.setValue(res.to);
										var b2 = oTo.getBinding("value");
										if (b2) {
											var m2 = b2.getModel(), p2 = b2.getPath();
											m2.setProperty(p2.charAt(0) === "/" ? p2 : "/" + p2, res.to);
										}
									}

									// Optional: push km to your model/input if you want
									var oKm = this.byId("km_input_id");
									if (oKm) { oKm.setValue(res.km); }
									var oKm = this.byId("km_input_id");
									if (oKm) { oKm.setValue(res.km); }

								}.bind(this));

								// Cache references
								this._mileageFrag = { controller: oFragController, dialog: oDialog };
								resolve(this._mileageFrag);
							}).catch(reject);

						} catch (e) {
							reject(e);
						}
					}, reject);
				});
			}

			// Open the dialog and prefill
			this._pMileageFrag.then(function (ctx) {
				var sFrom = (this.byId("fromloc_id") && this.byId("fromloc_id").getValue()) || "";
				var sTo = (this.byId("toloc_id") && this.byId("toloc_id").getValue()) || "";
				ctx.controller.prefill({ from: sFrom, to: sTo });
				ctx.controller.open();
			}.bind(this));
		},

		// --- (Deprecated in this flow) ---
		// Keeping these for backward-compatibility. Not used anymore.
		openHelloDialog: function () {
			// NO-OP: legacy method kept to avoid breaking any existing reference.
			// Use this._openMileageFrag() instead.
		},
		onAddMileage: function () {
			// NO-OP — handled by MileageFrag.controller via submit handler
		},
		onCancelMileage: function () {
			var oDialog = this.byId("helloDialog");
			if (oDialog) {
				oDialog.close();
			}
		},
		// --- end of mileage integration ---

		// ==================================================
		// Request Form Controller
		// ==================================================

		onClickMyRequest: async function () {
			// Reset JSON Model for the Form
			const oRequestModel = this.getOwnerComponent().getModel("request");
			oRequestModel.setData({
				list_count: 0,
				view: "view",
				req_header: {
					purpose: "",
					reqtype: "travel",
					tripstartdate: null,
					tripenddate: null,
					eventstartdate: null,
					eventenddate: null,
					grptype: "individual",
					location: "",
					transport: "",
					altcostcenter: "",
					doc1: "",
					doc2: "",
					comment: "",
					eventdetail1: "",
					eventdetail2: "",
					eventdetail3: "",
					eventdetail4: "",
					reqid: "",
					reqstatus: "",
					costcenter: "",
					cashadvamt: 0,
					reqamt: 0
				}
			});

			this._loadReqTypeSelectionData();

			if (!this.oDialogFragment) {
				this.oDialogFragment = await Fragment.load({
					id: "request",
					name: "claima.fragment.request",
					controller: this
				});
				this.getView().addDependent(this.oDialogFragment);

				this.oDialogFragment.attachAfterClose(() => {
					// Note: In many V4 apps, we keep the fragment and just reset the data
					// But staying true to your logic of destroying it:
					this.oDialogFragment.destroy();
					this.oDialogFragment = null;
				});
			}
			this.oDialogFragment.open();
			this.oDialogFragment.addStyleClass('requestDialog');
		},

		_loadReqTypeSelectionData: function () {
			const oMainModel = this.getOwnerComponent().getModel(); // OData V4 Model
			const oListBinding = oMainModel.bindList("/ZREQUEST_TYPE", null, null, [
				new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });
				this.getView().setModel(oTypeModel, "req_type_list");
			}).catch(err => console.error("Type Load Failed", err));
		},

		onClickCreateRequest: function () {
			const oReqModel = this.getView().getModel("request");
			const oData = oReqModel.getProperty("/req_header");
			let okcode = true;
			let message = '';

			// Simplified Validation Logic
			const mandatoryFields = {
				'RT0001': ['purpose', 'reqtype', 'tripstartdate', 'tripenddate', 'eventstartdate', 'eventenddate', 'grptype', 'location', 'transport', 'comment'],
				'RT0002': ['purpose', 'reqtype', 'grptype', 'comment'],
				'RT0003': ['purpose', 'reqtype', 'eventstartdate', 'eventenddate', 'grptype', 'location', 'comment', 'eventdetail1', 'eventdetail2', 'eventdetail3', 'eventdetail4'],
				'RT0004': ['purpose', 'reqtype', 'tripstartdate', 'tripenddate', 'grptype', 'comment']
			};

			const fieldsToCheck = mandatoryFields[oData.reqtype] || ['purpose'];
			const isMissing = fieldsToCheck.some(field => !oData[field] || oData[field] === "");

			if (isMissing || (oData.reqtype === 'RT0000')) {
				okcode = false;
				message = 'Please enter all mandatory details';
			} else if (!oData.doc1) {
				okcode = false;
				message = 'Please upload Attachment 1 (Mandatory)';
			} else if (oData.tripenddate < oData.tripstartdate) {
				okcode = false;
				message = "End Date cannot be earlier than begin date";
			}

			if (!okcode) {
				MessageToast.show(message);
			} else {
				this.createRequestHeader(oData, oReqModel);
			}
		},

		createRequestHeader: async function (oInputData, oReqModel) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oResult = await this.getCurrentReqNumber('NR01');

			if (oResult) {
				const sUserId = sap.ushell.Container.getUser().getId();
				const oListBinding = oMainModel.bindList("/ZREQUEST_HEADER");

				// FIX 1: Use 'await' to wait for the employee details
				const emp_data = await this._getEmpIdDetail(sUserId);

				// Safety check in case employee data isn't found
				const sCostCenter = emp_data ? emp_data.cc : "";

				const oPayload = {
					EMP_ID: sUserId,
					REQUEST_ID: oResult.reqNo,
					REQUEST_TYPE_ID: oInputData.reqtype,
					OBJECTIVE_PURPOSE: oInputData.purpose,
					REMARK: oInputData.comment,
					IND_OR_GROUP: oInputData.grptype,
					ALTERNATE_COST_CENTRE: oInputData.altcostcenter,
					LOCATION: oInputData.location,
					TYPE_OF_TRANSPORTATION: oInputData.transport,
					ATTACHMENT1: oInputData.doc1,
					ATTACHMENT2: oInputData.doc2,
					CASH_ADVANCE: parseFloat(oInputData.cashadvamt).toFixed(2),
					COST_CENTER: sCostCenter, // Now correctly populated
					EVENT_START_DATE: oInputData.eventstartdate,
					EVENT_END_DATE: oInputData.eventenddate,
					TRIP_START_DATE: oInputData.tripstartdate,
					TRIP_END_DATE: oInputData.tripenddate,
					REQUEST_AMOUNT: String(oInputData.reqamt),
					STATUS: "DRAFT"
				};

				const oContext = oListBinding.create(oPayload);

				oContext.created().then(() => {
					this.updateCurrentReqNumber(oResult.current);
					this.oDialogFragment.close();

					oReqModel.setProperty("/view", 'list');
					oReqModel.setProperty("/req_header/reqid", oResult.reqNo);
					oReqModel.setProperty("/req_header/reqstatus", 'DRAFT');
					oReqModel.setProperty("/req_header/costcenter", sCostCenter);
					this._getItemList(oResult.reqNo);

					this.byId("pageContainer").to(this.getView().byId('new_request'));
				}).catch(err => {
					sap.m.MessageToast.show("Creation failed: " + err.message);
				});
			}
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

		getCurrentReqNumber: async function (range_id) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZNUM_RANGE", null, null, [
				new Filter("RANGE_ID", FilterOperator.EQ, range_id)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);
				if (aContexts.length === 0) throw new Error("Range ID not found");

				const oData = aContexts[0].getObject();
				const current = Number(oData.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const reqNo = `REQ${yy}${String(current).padStart(9, "0")}`;

				return { reqNo, current };
			} catch (err) {
				console.error("Number Range Error:", err);
				return null;
			}
		},

		updateCurrentReqNumber: async function (currentNumber) {
			const oMainModel = this.getOwnerComponent().getModel();
			// In V4, we address a single entity by binding a context to its path
			const oContext = oMainModel.bindContext(`/ZNUM_RANGE('${encodeURIComponent('NR01')}')`).getBoundContext();

			try {
				await oContext.setProperty("CURRENT", String(currentNumber + 1));
				// V4 automatically queues changes; if using SubmitMode.Auto, it sends immediately.
				// If using Manual, you'd call oMainModel.submitBatch("groupName");
				return true;
			} catch (e) {
				console.error("Update Failed", e);
				return false;
			}
		},

		_getItemList: async function (req_id) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oRequestModel = this.getOwnerComponent().getModel('request');

			const oListBinding = oMainModel.bindList("/ZREQUEST_ITEM", null, [
				new Sorter("REQUEST_SUB_ID", false)
			], [
				new Filter("REQUEST_ID", FilterOperator.EQ, req_id)
			]);

			try {
				const aContexts = await oListBinding.requestContexts();
				const aItems = aContexts.map(oCtx => {
					const obj = oCtx.getObject();
					// Type conversion as per original logic
					if (obj.EST_AMOUNT) obj.EST_AMOUNT = parseFloat(obj.EST_AMOUNT);
					if (obj.EST_NO_PARTICIPANT) obj.EST_NO_PARTICIPANT = parseInt(obj.EST_NO_PARTICIPANT);
					return obj;
				});

				oRequestModel.setProperty("/req_item_rows", aItems);
				oRequestModel.setProperty('/list_count', aItems.length);
			} catch (err) {
				console.error("Fetch Items failed:", err);
				oRequestModel.setProperty("/req_item_rows", []);
			}
		},

		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
		// End of Request Form Controller
		// ==================================================

		onPressSave: function () {
			var oModel = this.getView().getModel("employee");
			const oListBinding = oModel.bindList("/ZNUM_RANGE");

			//dummy testing
			const oContext = oListBinding.create({
				RANGE_ID: "E0012",
				FROM: "AS"
			});
			oContext.created()
				.then(() => {
					sap.m.MessageToast.show("Record created");
				})
				.catch((oError) => {
					console.error(oError);
					sap.m.MessageBox.error("Create failed");
				});

		},

		onClickCancel: function () {
			this.oDialogFragment.close();
		},

		onClickNavigate: function (oEvent) {
			let id = oEvent.getParameters().id;
			if (id === "container-claima---App--dashboard-claim" || id === "application-app-preview-component---App--dashboard-claim") {
				this.byId("pageContainer").to(this.getView().createId("myrequest")); //Aiman Salim Start Add 10/02/2026 - Change myreport to myrequest
			} else if (id === "container-claima---App--dashboard-request" || id === "application-app-preview-component---App--dashboard-request") {
				this.byId("pageContainer").to(this.getView().createId("myreport")); //Aiman Salim Start Add 10/02/2026 - Change myreport to myrequest
			}
		},

		_getTexti18n: function (i18nKey, array_i18nParameters) {
			if (array_i18nParameters) {
				return this.getView().getModel("i18n").getResourceBundle().getText(i18nKey, array_i18nParameters);
			}
			else {
				return this.getView().getModel("i18n").getResourceBundle().getText(i18nKey);
			}
		},
		_loadCurrentUser: function () {
			var that = this;

			$.ajax({
				type: "GET",
				url: "/user-api/currentUser",
				success: async function(resultData) {
					// Extract email safely with fallbacks (covers common IdP shapes)
					var email =
						resultData.email ||
						(Array.isArray(resultData.emails) && resultData.emails[0] && resultData.emails[0].value) ||
						resultData.userPrincipalName ||
						null;

					if (email && typeof email === 'string' && email.trim() !== '') {
						// (Optional) set a model if your view needs it
						var oUserModel = new sap.ui.model.json.JSONModel({ email: email });
						that.getView().setModel(oUserModel, 'user');

						sap.m.MessageToast.show('Email: ' + email);
					} else {
						sap.m.MessageToast.show('Email is empty or not provided for this user.');
					}
				},
				error: function (xhr) {
					// If you’re still getting 404 here, your approuter may not expose /user-api
					console.error('currentUser failed:', xhr.status, xhr.responseText);
					sap.m.MessageToast.show('Failed to load user info (currentUser).');
				}
			});

		}

	});
});
