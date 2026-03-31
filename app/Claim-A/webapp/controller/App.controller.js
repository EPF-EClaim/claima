sap.ui.define([
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/MessageBox",
	"sap/m/HBox",
	"sap/m/VBox",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/Item",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/Icon",
	"claima/utils/Utility",
	"claima/utils/PARequestSharedFunction",
	"claima/utils/Attachment",
	"claima/utils/EligibilityCheck"
], function (
	Popover,
	Button,
	Dialog,
	Label,
	MessageToast,
	Text,
	MessageBox,
	HBox,
	VBox,
	Controller,
	JSONModel,
	Fragment,
	BusyIndicator,
	Item,
	HashChanger,
	Filter,
	FilterOperator,
	Sorter,
	Icon,
	Utility,
	PARequestSharedFunction,
	Attachment,
	EligibilityCheck
) {
	"use strict";

	return Controller.extend("claima.controller.App", {

		onInit: async function () {
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oDataModel = this.getOwnerComponent().getModel();
			this._oViewModel = this.getOwnerComponent().getModel('employee_view');
			this._oReqModel = this.getOwnerComponent().getModel('request');
			this._oReqStatusModel = this.getOwnerComponent().getModel("request_status");
			this._oSessionModel = this.getOwnerComponent().getModel("session");
			this._oRoleModel = this.getOwnerComponent().getModel("roleModel");

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
		onNavItemSelect: async function (oEvent) {
			var oItem = oEvent.getParameter("item");
			var oKey = oItem.getKey();
			// const oCtx = oModel.bindContext("/FeatureControl");

			const bDTDAdmin = this._oRoleModel.getProperty("/isDTDAdmin"),
				bAdminSystem = this._oRoleModel.getProperty("/isAdminSystem"),
				bAdminCC = this._oRoleModel.getProperty("/isAdminCC"),
				bClaimant = this._oRoleModel.getProperty("/isClaimant"),
				bApprover = this._oRoleModel.getProperty("/isApprover");

			const sEmpMaster = this._oConstant.Configuration.ZEMP_MASTER,
				sEmpMasterDTD = this._oConstant.Configuration.ZEMP_MASTER_DTD,
				sEmpDep = this._oConstant.Configuration.ZEMP_DEPENDENT,
				sEmpDepDTD = this._oConstant.Configuration.ZEMP_DEPENDENT_DTD,
				sNumRange = this._oConstant.Configuration.ZNUM_RANGE,
				sNumRangeDTD = this._oConstant.Configuration.ZNUM_RANGE_DTD,
				sBudget = this._oConstant.Configuration.ZBUDGET;

			// Make sure userType is available
			// const sType = this.getOwnerComponent().getModel("session").getProperty("/userType");
			// if (!bClaimant || !bApprover) {
			// 	MessageToast.show("Please wait… loading your access.");
			// 	return;
			// }

			switch (oKey) {
				case "nav_claimsubmission":
					this.onNav_ClaimSubmission();
					break;
				case "createrequest":
					this.onClickMyRequest();
					break;
				case "myrequest":
					this._oRouter.navTo("RequestFormStatus");
					break;
				case "mysubstitution":
					this._oRouter.navTo("ManageSub");
					break;
				// Start Aiman Salim 10/02/2026 - Added for analytics
				case "analytics":
					if (bDTDAdmin || bAdminSystem || bAdminCC ) {
						HashChanger.getInstance().replaceHash("");
						this._oRouter.navTo("Analytics");
					} else {
						var message = Utility.getText("msg_unauthorized_role");
						MessageBox.error(message);
					}
					break;
				// End 	 Aiman Salim 10/02/2026 - Added for analytics
				// Start Aiman Salim 03/03/2026 - Added for MyClaim
				case "myreport":
					this._oRouter.navTo("ClaimStatus")
					break;
				//Start Aiman Salim 08/03/2026 - Added for MyApproval
				case "approval":
					this._oRouter.navTo("MyApproval");
					break;
				//End Aiman Salim 08/03/2026 - Added for MyApproval
				// End 	 Aiman Salim 03/03/2026 - Added for MyClaim
				case "dashboard":
					this._oRouter.navTo("Dashboard");
					break;
				// End 	 Aiman Salim 03/03/2026 - Added for MyClaim
				default:
					// navigate to page with ID same as the key
					if (this._oConstant.ConfigAccess.includes(oKey)) {
						if (bDTDAdmin || bAdminSystem || bAdminCC ) {
							if (bDTDAdmin && oKey === sEmpMaster) {
								oKey = sEmpMasterDTD;
							} else if (bDTDAdmin && oKey === sEmpDep) {
								oKey = sEmpDepDTD;
							} else if (bDTDAdmin && oKey === sNumRange) {
								oKey = sNumRangeDTD;
							} else if (bAdminCC && oKey === sBudget) {
								oKey = "ZBUDGET_GA";
							}
							this._oRouter.navTo(oKey);
						} else {
							var message = Utility.getText("msg_unauthorized_role");
							MessageBox.error(message);
						}
					} else {
						var oPage = this.byId(oKey); // make sure your NavContainer has a page with this ID
						if (oPage) {
							this.byId("pageContainer").to(oPage);
						}
					}
					break;
			}
		},
		// Analytics App
		onClickAnalytics: async function () {
			var oPageContainer = this.byId("pageContainer");
			if (!this.byId("analyticsPage")) {
				var oPage = new sap.m.Page(this.createId("analyticsPage"), {
				});
			}
			oPageContainer.to(this.byId("analyticsPage"));
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
			BusyIndicator.show();
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
				MessageToast.show(Utility.getText("msg_nav_error_fragment", [oName]));
			}
			BusyIndicator.hide();
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
					"office_location": null,
					"state": null,
					"country": null,
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
						"cash_advance": null,
						"descr": {
							"alternate_cost_center": null
						}
					},
					"requestform_amt": null,
					"req_emailapprove": null,
					"descr": {
						"type": null,
						"item": null,
						"category": null,
					}
				},
				"is_new": false,
				"is_approver": false,
				"view_only": false,
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
						"attachment_email_approver": null,
					}
				},
				"claim_items": [],
				"claim_items_count": 0,
				"reportnumber": {
					"reportno": null,
					"current": null
				},
				"attachment": {
					"fileName": null,
					"fileContent": null
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
			var oUserModelData = this.getView().getModel('user')?.getData() || this._oSessionModel?.getData() || null;
			if (!oUserModelData) {
				MessageToast.show(Utility.getText("msg_claimprocess_nouser"));
				if (this.oDialog_ClaimProcess) {
					this.oDialog_ClaimProcess.close();
					return;
				}
			}
			const oEmpData = await this._getEmpIdDetail(oUserModelData.email);
			if (oEmpData) {
				oInputModel.setProperty("/emp_master", oEmpData);
				await this._getEmpDataDescr(oInputModel);
			}
		},

		_getEmpDataDescr: async function (oModel) {
			// cost center
			if (oModel.getProperty("/emp_master/cc")) {
				oModel.setProperty("/emp_master/descr/cc", await this._bindEclaimDescr("/ZCOST_CENTER", oModel.getProperty("/emp_master/cc"), 'COST_CENTER_ID', 'COST_CENTER_DESC'));
			}
			// department
			if (oModel.getProperty("/emp_master/dep")) {
				oModel.setProperty("/emp_master/descr/dep", await this._bindEclaimDescr("/ZDEPARTMENT", oModel.getProperty("/emp_master/dep"), 'DEPARTMENT_ID', 'DEPARTMENT_DESC'));
			}
			// branch / unit section
			if (oModel.getProperty("/emp_master/unit_section")) {
				oModel.setProperty("/emp_master/descr/unit_section", await this._bindEclaimDescr("/ZBRANCH", oModel.getProperty("/emp_master/unit_section"), 'BRANCH_ID', 'BRANCH_DESC'));
			}
			// marital status
			if (oModel.getProperty("/emp_master/marital")) {
				oModel.setProperty("/emp_master/descr/marital", await this._bindEclaimDescr("/ZMARITAL_STAT", oModel.getProperty("/emp_master/marital"), 'MARRIAGE_STATUS_ID', 'MARRIAGE_STATUS_DESC'));
			}
			// job group
			if (oModel.getProperty("/emp_master/job_group")) {
				oModel.setProperty("/emp_master/descr/job_group", await this._bindEclaimDescr("/ZJOB_GROUP", oModel.getProperty("/emp_master/job_group"), 'JOB_GROUP_ID', 'JOB_GROUP_DESC'));
			}
			// office location
			if (oModel.getProperty("/emp_master/office_location")) {
				oModel.setProperty("/emp_master/descr/office_location", await this._bindEclaimDescr("/ZOFFICE_LOCATION", oModel.getProperty("/emp_master/office_location"), 'LOCATION_ID', 'LOCATION_DESC', oModel.getProperty("/emp_master/state"), 'STATE_ID'));
			}
			// state
			if (oModel.getProperty("/emp_master/state")) {
				oModel.setProperty("/emp_master/descr/state", await this._bindEclaimDescr("/ZSTATE", oModel.getProperty("/emp_master/state"), 'STATE_ID', 'STATE_DESC', oModel.getProperty("/emp_master/country"), 'COUNTRY_ID'));
			}
			// country
			if (oModel.getProperty("/emp_master/country")) {
				oModel.setProperty("/emp_master/descr/country", await this._bindEclaimDescr("/ZCOUNTRY", oModel.getProperty("/emp_master/country"), 'COUNTRY_ID', 'COUNTRY_DESC'));
			}
			// role
			if (oModel.getProperty("/emp_master/role")) {
				oModel.setProperty("/emp_master/descr/role", await this._bindEclaimDescr("/ZROLE", oModel.getProperty("/emp_master/role"), 'ROLE_ID', 'ROLE_DESC'));
			}
			// user type
			if (oModel.getProperty("/emp_master/user_type")) {
				oModel.setProperty("/emp_master/descr/user_type", await this._bindEclaimDescr("/ZUSER_TYPE", oModel.getProperty("/emp_master/user_type"), 'USER_TYPE_ID', 'USER_TYPE_DESC'));
			}
			// employee type
			if (oModel.getProperty("/emp_master/employee_type")) {
				oModel.setProperty("/emp_master/descr/employee_type", await this._bindEclaimDescr("/ZEMP_TYPE", oModel.getProperty("/emp_master/employee_type"), 'EMP_TYPE_ID', 'EMP_TYPE_DESC'));
			}
		},

		_bindEclaimDescr: async function (oTable, oInputValue, oFieldId, oFieldDescr, oInputValue2, oFieldId2) {
			const oModel = this.getOwnerComponent().getModel();
			var aFilterArray = [new Filter(oFieldId, FilterOperator.EQ, oInputValue)];
			if (oFieldId2) {
				aFilterArray = aFilterArray.concat(new Filter(oFieldId2, FilterOperator.EQ, oInputValue2));
			}
			const oListBinding = oModel.bindList(oTable, null, null, aFilterArray);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData[oFieldDescr];
				} else {
					console.warn("No description found");
					return null;
				}
			} catch (oError) {
				console.error("Error fetching description: ", oError);
				return null; // Return null so the app doesn't crash
			}
		},

		onSelect_ClaimProcess_ClaimType: function (oEvent) {
			// validate claim type
			var claimType = oEvent.getParameters().selectedItem;
			if (claimType) {
				// set claim items based on selected claim type
				this.byId("select_claimprocess_claimitem").bindAggregation("items", {
					path: "employee>/ZCLAIM_TYPE_ITEM",
					filters: [new Filter('CLAIM_TYPE_ID', FilterOperator.EQ, claimType.getKey())],
					sorter: [
						new Sorter('CLAIM_TYPE_ITEM_DESC'),
						new Sorter('CLAIM_TYPE_ITEM_ID')
					],
					parameters: {
						$expand: {
							"ZSUBMISSION_TYPE": {
								$select: "SUBMISSION_TYPE_DESC"
							}
						},
						$select: "SUBMISSION_TYPE"
					},
					template: new Item({
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
				var categoryId = claimItem.getBindingContext("employee").getObject("SUBMISSION_TYPE");
				var claimCategoryDesc = claimItem.getBindingContext("employee").getObject("ZSUBMISSION_TYPE/SUBMISSION_TYPE_DESC");

				// show claim item category in category input
				this.byId("input_claimprocess_category").setValue(claimCategoryDesc);
				var oInputModel = this.getView().getModel("claimsubmission_input");

				// enable 'Request Form' selection
				if (categoryId == 'ST0003') {
					if (!this.byId("select_claimprocess_requestform").getVisible()) {
						this.byId("select_claimprocess_requestform").bindAggregation("items", {
							path: "employee>/ZREQUEST_HEADER",
							filters: [
								new Filter('EMP_ID', FilterOperator.EQ, oInputModel.getProperty("/emp_master/eeid")),
								new Filter('CLAIM_TYPE_ID', FilterOperator.EQ, oInputModel.getProperty("/claimtype/type")),
								new Filter('STATUS', FilterOperator.EQ, this._oConstant.ClaimStatus.APPROVED),
							],
							parameters: {
								$expand: {
									"ZCOST_CENTER": { $select: "COST_CENTER_DESC" },
									"COSTCENTER": { $select: "COST_CENTER_DESC" },
								},
								$select: "PREAPPROVAL_AMOUNT,EVENT_START_DATE,EVENT_END_DATE,COST_CENTER,ALTERNATE_COST_CENTER,CASH_ADVANCE"
							},
							template: new Item({
								key: "{employee>REQUEST_ID}",
								text: "{employee>REQUEST_ID} {employee>OBJECTIVE_PURPOSE} ({employee>TRIP_START_DATE} – {employee>TRIP_END_DATE})"
							})
						});
						this.byId("select_claimprocess_requestform").setEnabled(true);
						this.byId("select_claimprocess_requestform").setVisible(true);
						this.byId("select_claimprocess_requestform").setEditable(true);
						this.byId("select_claimprocess_requestform").setSelectedItem(null);

						// enable 'Use email approval?' switch
						if (!this.byId("switch_claimprocess_req_emailapprove").getEnabled()) {
							// check if function is within grace period
							var currentDateUnix = new Date().valueOf();
							var endGraceDateUnix = new Date('2026-10-01').valueOf();
							if (currentDateUnix < endGraceDateUnix) {
								// current date within grace period
								this.byId("switch_claimprocess_req_emailapprove").setEnabled(true);
								this.byId("switch_claimprocess_req_emailapprove").setVisible(true);
							}
						}

						// enable 'Create Pre-Approval Request' button
						this.byId("button_claimprocess_preapproval").setEnabled(true);
						this.byId("button_claimprocess_preapproval").setVisible(true);

						// disable 'Start Claim' button if active
						if (this.byId("button_claimprocess_startclaim").getEnabled()) {
							this.byId("button_claimprocess_startclaim").setEnabled(false);
						}
					}
				}
				else {
					// disable request form field
					if (this.byId("select_claimprocess_requestform").getVisible()) {
						this.byId("select_claimprocess_requestform").setEnabled(false);
						this.byId("select_claimprocess_requestform").setVisible(false);
						this.byId("select_claimprocess_requestform").setEditable(false);
						this.byId("select_claimprocess_requestform").setSelectedItem(null);
					}

					// disable 'Use email approval?' switch
					if (this.byId("switch_claimprocess_req_emailapprove").getEnabled()) {
						this.byId("switch_claimprocess_req_emailapprove").setEnabled(false);
						this.byId("switch_claimprocess_req_emailapprove").setVisible(false);
					}

					// disable 'Create Pre-Approval Request' button
					if (this.byId("button_claimprocess_preapproval").getEnabled()) {
						this.byId("button_claimprocess_preapproval").setEnabled(false);
						this.byId("button_claimprocess_preapproval").setVisible(false);
					}

					// enable 'Start Claim' button
					if (!this.byId("button_claimprocess_startclaim").getEnabled()) {
						this.byId("button_claimprocess_startclaim").setEnabled(true);
					}
				}
			}
		},

		onSelect_ClaimProcess_RequestForm: function () {
			// enable 'Start Claim' button if not already enabled
			if (!this.byId("button_claimprocess_startclaim").getEnabled() && this.byId("select_claimprocess_requestform").getSelectedItem()) {
				this.byId("button_claimprocess_startclaim").setEnabled(true);
			}
		},

		onSwitch_ClaimProcess_Req_EmailApprove: function (oEvent) {
			var oState = oEvent.getSource().getState();
			switch (oState) {
				case true:
					// disable request form field
					if (this.byId("select_claimprocess_requestform").getEnabled()) {
						this.byId("select_claimprocess_requestform").setEnabled(false);
					}

					// enable 'Start Claim' button if not already enabled
					if (!this.byId("button_claimprocess_startclaim").getEnabled()) {
						this.byId("button_claimprocess_startclaim").setEnabled(true);
					}
					break;
				case false:
					// enable request form field
					if (!this.byId("select_claimprocess_requestform").getEnabled()) {
						this.byId("select_claimprocess_requestform").setEnabled(true);
					}

					// disable 'Start Claim' button if request form has no value
					if (this.byId("button_claimprocess_startclaim").getEnabled() && !this.byId("select_claimprocess_requestform").getSelectedItem()) {
						this.byId("button_claimprocess_startclaim").setEnabled(false);
					}
					break;
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
			oInputModel.setProperty("/claimtype/category", this.byId("select_claimprocess_claimitem").getSelectedItem().getBindingContext("employee").getObject("SUBMISSION_TYPE"));
			//// get request form values
			if (this.byId("select_claimprocess_requestform").getSelectedItem() && !this.byId("switch_claimprocess_req_emailapprove").getState()) {
				var oRequestForm = this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee");
				if (oRequestForm) {
					oInputModel.setProperty("/claimtype/requestform/objective_purpose", oRequestForm.getObject("OBJECTIVE_PURPOSE"));
					oInputModel.setProperty("/claimtype/requestform/preapproval_amount", oRequestForm.getObject("PREAPPROVAL_AMOUNT"));
					oInputModel.setProperty("/claimtype/requestform/trip_start_date", this._getJsonDate(oRequestForm.getObject("TRIP_START_DATE")));
					oInputModel.setProperty("/claimtype/requestform/trip_end_date", this._getJsonDate(oRequestForm.getObject("TRIP_END_DATE")));
					oInputModel.setProperty("/claimtype/requestform/event_start_date", this._getJsonDate(oRequestForm.getObject("EVENT_START_DATE")));
					oInputModel.setProperty("/claimtype/requestform/event_end_date", this._getJsonDate(oRequestForm.getObject("EVENT_END_DATE")));
					oInputModel.setProperty("/claimtype/requestform/alternate_cost_center", oRequestForm.getObject("ALTERNATE_COST_CENTER"));
					oInputModel.setProperty("/claimtype/requestform/cash_advance", oRequestForm.getObject("CASH_ADVANCE"));
					oInputModel.setProperty("/claimtype/requestform/descr/alternate_cost_center", oRequestForm.getObject("COSTCENTER/COST_CENTER_DESC"));
				}
			}
			if (this.byId("switch_claimprocess_req_emailapprove").getEnabled()) {
				oInputModel.setProperty("/claimtype/req_emailapprove", this.byId("switch_claimprocess_req_emailapprove").getState());
			}

			// Mobile Eligibility Pre-check
			var sClaimType = oInputModel.getProperty("/claimtype/type")
			if (sClaimType === this._oConstant.ClaimType.HANDPHONE) {
				var bEligible = await EligibilityCheck.onCheckEligibility(this);
				if (!bEligible) {
					MessageBox.warning(Utility.getText("warning_msg_mobile_not_eligible"));
					return;
				}
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
				MessageToast.show(Utility.getText("msg_nav_error_fragment", [oName]));
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
			if (this.byId("select_claimprocess_requestform").getVisible()) {
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

			// disable 'Use email approval?' switch
			if (this.byId("switch_claimprocess_req_emailapprove").getEnabled()) {
				this.byId("switch_claimprocess_req_emailapprove").setEnabled(false);
				this.byId("switch_claimprocess_req_emailapprove").setVisible(false);
				this.byId("switch_claimprocess_req_emailapprove").setState(false);
			}

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
			oInputModel.setProperty("/is_new", true);
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
			oInputModel.setProperty("/claim_header/cash_advance_amount", oInputModel.getProperty("/claimtype/requestform/cash_advance"));
			//// initialized amount values
			oInputModel.setProperty("/claim_header/total_claim_amount", "0.00");
			oInputModel.setProperty("/claim_header/final_amount_to_receive", "0.00");
			if (!oInputModel.getProperty("/claim_header/preapproved_amount")) {
				oInputModel.setProperty("/claim_header/preapproved_amount", "0.00");
			}
			if (!oInputModel.getProperty("/claim_header/cash_advance_amount")) {
				oInputModel.setProperty("/claim_header/cash_advance_amount", "0.00");
			}
			//// include description in data
			oInputModel.setProperty("/claim_header/descr/claim_type_id", oInputModel.getProperty("/claimtype/descr/type"));
			oInputModel.setProperty("/claim_header/descr/submission_type", oInputModel.getProperty("/claimtype/descr/category"));
			oInputModel.setProperty("/claim_header/descr/cost_center", oInputModel.getProperty("/emp_master/descr/cc"));
			oInputModel.setProperty("/claim_header/descr/request_id", oInputModel.getProperty("/claimtype/requestform/objective_purpose"));

			// pre-approval request values
			var oInputModel = this.getView().getModel("claimsubmission_input");
			if (oInputModel.getProperty("/claimtype/category") == 'ST0003') {
				// make Pre-Approval Request, Approve Amount visible
				this.byId("text_claiminput_preapprovalreq").setVisible(true);
				this.byId("text_claiminput_amtapproved").setVisible(true);
				switch (oInputModel.getProperty("/claimtype/req_emailapprove")) {
					case true:
						// set text for using email approval
						oInputModel.setProperty("/claim_header/request_id", "");
						oInputModel.setProperty("/claim_header/descr/request_id", Utility.getText("text_claiminput_preapprovalreq_email"));

						// require attachment email approval
						this.byId("fileuploader_claiminput_attachment").setEnabled(true);
						this.byId("fileuploader_claiminput_attachment").setVisible(true);
						this.byId("fileuploader_claiminput_attachment").setRequired(true);
						break;
					default:
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
							this.byId("field_claiminput_altcc").setVisible(false);

							this.byId("input_claiminput_altcc").setEnabled(true);
							this.byId("input_claiminput_altcc").setVisible(true);
						}
						break;
				}
			} else if (oInputModel.getProperty("/claimtype/category") == this._oConstant.SubmissionType.DIRECT_CLAIM) {
				this.byId("fileuploader_claiminput_attachment").setEnabled(false);
				this.byId("fileuploader_claiminput_attachment").setVisible(false);
			}
		},

		_getJsonDate: function (date) {
			if (date) {
				var oDate = new Date(date);
				var oDateString = oDate.toLocaleString('default', { day: '2-digit' }) + " " + oDate.toLocaleString('default', { month: 'short' }) + " " + oDate.toLocaleString('default', { year: 'numeric' });
				return oDateString;
			} else {
				return null;
			}
		},

		_getHanaDate: function (date) {
			if (date) {
				var oDate = new Date(date);
				var oDateString = oDate.getFullYear() + '-' + ('0' + (oDate.getMonth() + 1)).slice(-2) + '-' + ('0' + oDate.getDate()).slice(-2);
				return oDateString;
			} else {
				return null;
			}
		},

		_getHanaTime: function (time) {
			if (time) {
				var oDate = new Date(time);
				var oTimeString = ('0' + oDate.getHours()).slice(-2) + ':' + ('0' + oDate.getMinutes()).slice(-2) + ':' + ('0' + oDate.getSeconds()).slice(-2);
				return oTimeString;
			} else {
				return null;
			}
		},

		_nonNan: function (iNumber) {
			if (isNaN(iNumber)) {
				return 0;
			} else {
				return iNumber;
			}
		},

		onAction_ClaimInput: function () {
			// confirm claim submission dialog
			this._newDialog(
				Utility.getText("dialog_claiminput_submit"),
				Utility.getText("label_claiminput_submit"),
				function () {
					this.onClaimSubmission_ClaimInput();
				}.bind(this)
			);
		},

		onClaimSubmission_ClaimInput: async function () {
			// validate input data
			var oInputModel = this.getView().getModel("claimsubmission_input");

			if (!this.getOwnerComponent().getValidator().validate(this.getView())) {
				MessageToast.show(Utility.getText("msg_claiminput_required"), {
					closeOnBrowserNavigation: false
				});
				return;
			}

			// validate required fields
			var reqFields = [
				"input_claiminput_purpose",
				"datepicker_claiminput_tripstartdate",
				"datepicker_claiminput_tripenddate",
				"input_claiminput_comment",
			];
			//// add attachment field if using email approval
			if (this.byId("fileuploader_claiminput_attachment").getRequired()) {
				reqFields.push("fileuploader_claiminput_attachment");
			}
			for (let i = 0; i < reqFields.length; i++) {
				if (!this.byId(reqFields[i]).getValue()) {
					// stop claim submission if values empty
					MessageToast.show(Utility.getText("msg_claiminput_required"));
					return;
				}
			}
			// validate attachment
			if (this.byId("fileuploader_claiminput_attachment").getValue()) {
				BusyIndicator.show(0);
				var attachmentNumber = await Attachment.postAttachment(
					oInputModel.getProperty("/attachment/fileName"),
					oInputModel.getProperty("/attachment/fileContent"),
					this._oSessionModel.getProperty("/userId")
				);
				if (attachmentNumber) {
					oInputModel.setProperty("/claim_header/attachment_email_approver", attachmentNumber);
					oInputModel.setProperty("/claim_header/descr/attachment_email_approver", oInputModel.getProperty("/attachment/fileName"));
					BusyIndicator.hide();
				}
				else {
					MessageToast.show(Utility.getText("msg_claiminput_attachment_upload_error"));
					// don't proceed claim item if attachment upload fails
					BusyIndicator.hide();
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

			// send new claim submission to database
			await this._updateClaimSubmission();
		},

		_updateClaimSubmission: async function () {
			// get input model
			var oInputModel = this.getView().getModel("claimsubmission_input");
			//// update last modified date
			var lastModifiedDate = this._getJsonDate(new Date());
			oInputModel.setProperty("/claim_header/last_modified_date", lastModifiedDate);

			//// set status for new claim as draft
			if (oInputModel.getProperty("/is_new")) {
				oInputModel.setProperty("/claim_header/status_id", this._oConstant.ClaimStatus.DRAFT);
				oInputModel.setProperty("/claim_header/descr/status_id", "DRAFT");
			}

			// set body for update
			var oBody = new JSONModel({
				EMP_ID: this._oSessionModel.getProperty("/userId"),
				PURPOSE: oInputModel.getProperty("/claim_header/purpose"),
				TRIP_START_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/trip_start_date")),
				TRIP_END_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/trip_end_date")),
				EVENT_START_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/event_start_date")),
				EVENT_END_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/event_end_date")),
				SUBMISSION_TYPE: oInputModel.getProperty("/claim_header/submission_type"),
				COMMENT: oInputModel.getProperty("/claim_header/comment"),
				ALTERNATE_COST_CENTER: oInputModel.getProperty("/claim_header/alternate_cost_center"),
				COST_CENTER: oInputModel.getProperty("/claim_header/cost_center"),
				REQUEST_ID: oInputModel.getProperty("/claim_header/request_id"),
				ATTACHMENT_EMAIL_APPROVER: oInputModel.getProperty("/claim_header/attachment_email_approver"),
				STATUS_ID: oInputModel.getProperty("/claim_header/status_id"),
				CLAIM_TYPE_ID: oInputModel.getProperty("/claim_header/claim_type_id"),
				TOTAL_CLAIM_AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_header/total_claim_amount"))).toFixed(2),
				FINAL_AMOUNT_TO_RECEIVE: this._nonNan(parseFloat(oInputModel.getProperty("/claim_header/final_amount_to_receive"))).toFixed(2),
				LAST_MODIFIED_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/last_modified_date")),
				SUBMITTED_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/submitted_date")),
				LAST_APPROVED_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/last_approved_date")),
				LAST_APPROVED_TIME: this._getHanaTime(oInputModel.getProperty("/claim_header/last_approved_time")),
				PAYMENT_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/payment_date")),
				LOCATION: oInputModel.getProperty("/claim_header/location"),
				SPOUSE_OFFICE_ADDRESS: oInputModel.getProperty("/claim_header/spouse_office_address"),
				HOUSE_COMPLETION_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/house_completion_date")),
				MOVE_IN_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/move_in_date")),
				HOUSING_LOAN_SCHEME: oInputModel.getProperty("/claim_header/housing_loan_scheme"),
				LENDER_NAME: oInputModel.getProperty("/claim_header/lender_name"),
				SPECIFY_DETAILS: oInputModel.getProperty("/claim_header/specify_details"),
				NEW_HOUSE_ADDRESS: oInputModel.getProperty("/claim_header/new_house_address"),
				DIST_OLD_HOUSE_TO_OFFICE_KM: this._nonNan(parseFloat(oInputModel.getProperty("/claim_header/dist_old_house_to_office_km"))),
				DIST_OLD_HOUSE_TO_NEW_HOUSE_KM: this._nonNan(parseFloat(oInputModel.getProperty("/claim_header/dist_old_house_to_new_house_km"))),
				APPROVER1: oInputModel.getProperty("/claim_header/approver1"),
				APPROVER2: oInputModel.getProperty("/claim_header/approver2"),
				APPROVER3: oInputModel.getProperty("/claim_header/approver3"),
				APPROVER4: oInputModel.getProperty("/claim_header/approver4"),
				APPROVER5: oInputModel.getProperty("/claim_header/approver5"),
				LAST_SEND_BACK_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/last_send_back_date")),
				COURSE_CODE: oInputModel.getProperty("/claim_header/course_code"),
				PROJECT_CODE: oInputModel.getProperty("/claim_header/project_code"),
				CASH_ADVANCE_AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_header/cash_advance_amount"))).toFixed(2),
				PREAPPROVED_AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_header/preapproved_amount"))).toFixed(2),
				REJECT_REASON_ID: oInputModel.getProperty("/claim_header/reject_reason_id"),
				SEND_BACK_REASON_ID: oInputModel.getProperty("/claim_header/send_back_reason_id"),
				LAST_SEND_BACK_TIME: this._getHanaTime(oInputModel.getProperty("/claim_header/last_send_back_time")),
				REJECT_REASON_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/reject_reason_date")),
				REJECT_REASON_TIME: this._getHanaTime(oInputModel.getProperty("/claim_header/reject_reason_time"))
			});
			//// addon for new claim
			if (oInputModel.getProperty("/is_new")) {
				oBody.setProperty("/CLAIM_ID", oInputModel.getProperty("/claim_header/claim_id"));
			}

			try {
				BusyIndicator.show(0);

				const oModel = this.getOwnerComponent().getModel();
				var oListBinding;
				var claimSaved;

				if (oInputModel.getProperty("/is_new")) {
					oListBinding = oModel.bindList("/ZCLAIM_HEADER");
					const oContext = oListBinding.create(oBody.getData());
					oContext.created().then(async () => {
						claimSaved = true;

						// assign report number to new claim
						var currentReportNumber = oContext.getProperty("CLAIM_ID");
						if (!isNaN(currentReportNumber.slice(-1))) {
							oInputModel.setProperty("/claim_header/claim_id", currentReportNumber);
							oInputModel.setProperty("/reportnumber/reportno", currentReportNumber);
							// oInputModel.setProperty("/reportnumber/current", currentReportNumber.current);
						}
						else {
							this.oDialog = new Dialog({
								title: Utility.getText("dialog_claiminput_claimid"),
								type: "Message",
								state: "None",
								content: [new Label({ text: Utility.getText("msg_claiminput_claimid") })],
								endButton: new Button({
									text: Utility.getText("endbutton_claiminput_claimid"),
									press: function () {
										this.oDialog.close();
									}
								})
							});
							this.oDialog.open();
							return;
						}
						// Always post Parent MDF
						await Attachment.postMDF(
							oInputModel.getProperty("/claim_header/claim_id"),
							oInputModel.getProperty("/claim_header/attachment_email_approver")
						)

						if (claimSaved) {
							MessageToast.show(Utility.getText("msg_claimsubmission_created", [oInputModel.getProperty("/claim_header/claim_id")]));
						}
						oInputModel.setProperty("/is_new", false);
						// close Claim Input dialog
						this.oDialog_ClaimInput.close();

						// load Claim Submission page
						this._oRouter.navTo("ClaimSubmission", { claim_id: encodeURIComponent(String(oInputModel.getProperty("/claim_header/claim_id"))) });
					});
				}

			} catch (e) {
				MessageToast.show(Utility.getText("msg_claimsubmission_failed", [e.message]));
			} finally {
				BusyIndicator.hide();
			}
		},

		onChange_ClaimInput_Attachment: function (oEvent) {
			// check if file can be uploaded
			var fileName = oEvent.getSource().getValue();
			var domRef = oEvent.getSource().getFocusDomRef();
			var file = domRef.files[0];
			var reader = new FileReader();

			reader.addEventListener("load", () => {
				var oInputModel = this.getView().getModel("claimsubmission_input");
				if (oInputModel) {
					oInputModel.setProperty("/attachment/fileName", fileName);
					oInputModel.setProperty("/attachment/fileContent", reader.result.replace("data:" + file.type + ";base64,", ""));
				}
			});

			if (file) {
				reader.readAsDataURL(file);
			}
		},

		onUploadComplete_ClaimInput_Attachment: function (oEvent) {
			var iHttpStatusCode = oEvent.getParameters("status");
			var sResponse = oEvent.getParameters("response");
			var sMessage = iHttpStatusCode === 200 ? sResponse + " (Upload Success)" : sResponse + " (Upload Error)";
			MessageToast.show(sMessage);
		},

		onFileSizeExceed_ClaimInput_Attachment: function (oEvent) {
			MessageToast.show(Utility.getText("msg_claiminput_attachment_upload_filesize"));
		},

		onTypeMissmatch_ClaimInput_Attachment: function (oEvent) {
			MessageToast.show(Utility.getText("msg_claiminput_attachment_upload_mismatch"));
		},

		_validDateRange: function (startdate, enddate) {
			var startDateValue = this.byId(startdate).getValue();
			var endDateValue = this.byId(enddate).getValue();
			// check for missing value
			if (!startDateValue || !endDateValue) {
				MessageToast.show(Utility.getText("msg_daterange_missing"));
				return false;
			}
			// check if end date earlier than start date
			var startDateUnix = new Date(startDateValue).valueOf();
			var endDateUnix = new Date(endDateValue).valueOf();
			if (startDateUnix > endDateUnix) {
				MessageToast.show(Utility.getText("msg_daterange_order"));
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
			if (!this.byId("field_claiminput_altcc").getVisible()) {
				this.byId("field_claiminput_altcc").setVisible(true);
			}
			if (this.byId("field_claiminput_altcc").getValue()) {
				this.byId("field_claiminput_altcc").setValue(null);
			}
			if (this.byId("input_claiminput_altcc").getEnabled()) {
				this.byId("input_claiminput_altcc").setEnabled(false);
				this.byId("input_claiminput_altcc").setEditable(false);
				this.byId("input_claiminput_altcc").setVisible(false);
			}
			//// attachment email approval
			if (this.byId("fileuploader_claiminput_attachment").getValue()) {
				this.byId("fileuploader_claiminput_attachment").clear();
			}
			if (this.byId("fileuploader_claiminput_attachment").getRequired()) {
				this.byId("fileuploader_claiminput_attachment").setRequired(false);
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

		_getCurrentReportNumber: async function (range_id) {
			const oModel = this.getOwnerComponent().getModel();

			try {
				var oListBinding = oModel.bindList(
					"/ZNUM_RANGE",
					null,
					null,
					[
						new Filter({
							path: "RANGE_ID",
							operator: FilterOperator.EQ,
							value1: range_id
						})
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$select: "RANGE_ID,CURRENT,PREFIX"
					}
				);

				var aCtx = await oListBinding.requestContexts(0, 1);
				var oCtx = aCtx[0];

				if (!oCtx) {
					throw new Error(`${range_id} not found`);
				}

				var row = oCtx.getObject();
				if (row.CURRENT == null) {
					throw new Error(`${range_id} missing CURRENT`);
				}

				var current = Number(row.CURRENT);
				var prefix = row.PREFIX;
				var yy = String(new Date().getFullYear()).slice(-2);
				var result = `${prefix}${yy}${String(current).padStart(9, "0")}`;

				// verify result is not in database
				oListBinding = oModel.bindList(
					"/ZCLAIM_HEADER",
					null,
					null,
					[
						new Filter({
							path: "CLAIM_ID",
							operator: FilterOperator.EQ,
							value1: result
						})
					],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
					}
				);

				aCtx = await oListBinding.requestContexts(0, 1);
				oCtx = aCtx[0];

				if (!oCtx) {
					return { result, current };
				}
				else {
					row = oCtx.getObject();
					console.warn(`Claim ${oCtx.CLAIM_ID} already exists in DB, please update number range`);
					result = 'X';
					return { result, current };
				}

			} catch (err) {
				console.error("Error fetching number range:", err);
				return null;
			}
		},

		_updateCurrentReportNumber: async function (rangeId, currentNumber) {
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

		// ==================================================
		// Request Form Controller
		// ==================================================

		onClickMyRequest: async function () {

			if (!this.oDialogFragment) {
				this.oDialogFragment = await Fragment.load({
					id: "request",
					name: "claima.fragment.request",
					controller: this
				});

				this.getView().addDependent(this.oDialogFragment);

				var oRequestDialogModel = new JSONModel({ reqid: "", grptype: "IND" });
				this.oDialogFragment.setModel(oRequestDialogModel, "reqDialog");

				this.oDialogFragment.attachAfterClose(() => {
					this.oDialogFragment.destroy();
					this.oDialogFragment = null;
				});
			}

			this.oDialogFragment.addStyleClass('requestDialog');
			this.oDialogFragment.open();
			this._applyReqTypeFilters(this._oSessionModel.getProperty("/userType"));
		},

		onClickCreateRequest: async function () {
			BusyIndicator.show(0);
			const oDialogModel = this.oDialogFragment.getModel("reqDialog");
			const oDialogData = oDialogModel.getData();
			const sEmpId = this._oSessionModel.getProperty("/userId");

			try {

				// validate mandatory fields
				if (!this.getOwnerComponent().getValidator().validate(this.getView())) {
					MessageBox.show(Utility.getText("req_d_w_mandatory_field"), {
						closeOnBrowserNavigation: false
					});
					return;
				}

				const sAttachment1Binary = await Attachment.getFileAsBinary(oDialogData.doc1);
				const sAttachment1SFId = await Attachment.postAttachment(oDialogData.doc1.name, sAttachment1Binary, sEmpId);
				oDialogData.doc1 = `${sAttachment1SFId} - ${oDialogData.doc1.name}`;

				if (oDialogData.doc2) {
					const sAttachment2Binary = await Attachment.getFileAsBinary(oDialogData.doc2);
					const sAttachment2SFId = await Attachment.postAttachment(oDialogData.doc2.name, sAttachment2Binary, sEmpId);
					oDialogData.doc2 = `${sAttachment2SFId} - ${oDialogData.doc2.name}`;
				}

				await this.createRequestHeader(oDialogData);

			} catch (err) {
				MessageBox.error(err.message || "An error occurred during submission.");
			} finally {
				BusyIndicator.hide();
			}
		},

		createRequestHeader: async function (oInputData) {
			const oListBinding = this._oDataModel.bindList("/ZREQUEST_HEADER");

			let sEmpId = this._oSessionModel.getProperty("/userId");
			let sCostCenter = this._oSessionModel.getProperty("/costCenters");

			try {
				BusyIndicator.show(0);

				let sGrpType = oInputData.grptype ? String(oInputData.grptype).trim() : null;
				if (sGrpType && sGrpType.length > 4) {
					sGrpType = sGrpType.substring(0, 4);
				}

				const oContext = oListBinding.create({
					EMP_ID: sEmpId || null,
					REQUEST_TYPE_ID: oInputData.reqtype || null,
					OBJECTIVE_PURPOSE: oInputData.purpose || null,
					REMARK: oInputData.comment || null,
					IND_OR_GROUP: sGrpType,
					ALTERNATE_COST_CENTER: oInputData.altcostcenter || null,
					LOCATION: oInputData.location || null,
					TYPE_OF_TRANSPORTATION: oInputData.transport || null,
					ATTACHMENT1: oInputData.doc1 || null,
					ATTACHMENT2: oInputData.doc2 || null,
					COST_CENTER: sCostCenter || null,

					EVENT_START_DATE: oInputData.eventstartdate || null,
					EVENT_END_DATE: oInputData.eventenddate || null,
					TRIP_START_DATE: oInputData.tripstartdate || null,
					TRIP_END_DATE: oInputData.tripenddate || null,

					STATUS: this._oConstant.ClaimStatus.DRAFT,
					CLAIM_TYPE_ID: oInputData.claimtype || null,
					REQUEST_DATE: new Date().toISOString().slice(0, 10),
					PREAPPROVAL_AMOUNT: parseFloat(0),
					CASH_ADVANCE: parseFloat(0)
				});

				await oContext.created();

				const sNewReqId = oContext.getProperty("REQUEST_ID");

				if (sNewReqId) {
					this.oDialogFragment.close();

					await Attachment.postMDF(sNewReqId, oInputData.doc1?.split(" - ")[0], oInputData.doc2?.split(" - ")[0]);

					this._oReqModel.setProperty("/view", 'list');
					this._oReqModel.setProperty("/req_header/reqid", sNewReqId);

					this._oRouter.navTo("RequestForm", {
						request_id: sNewReqId
					});
				}

			} catch (err) {
				MessageBox.error("Creation failed: " + err.message);
			} finally {
				BusyIndicator.hide();
			}
		},

		onImportChange1(oEvent) {
			const oDialogModel = this.oDialogFragment.getModel("reqDialog");
			const oDialogData = oDialogModel.getData();
			oDialogData.doc1 = oEvent.getParameters("files").files[0];
		},

		onImportChange2(oEvent) {
			const oDialogModel = this.oDialogFragment.getModel("reqDialog");
			const oDialogData = oDialogModel.getData();
			oDialogData.doc2 = oEvent.getParameters("files").files[0];
		},

		// get backend data
		async _getEmpIdDetail(sEMAIL) {
			const oListBinding = this._oDataModel.bindList("/ZEMP_MASTER", null, null, [
				new Filter({
					path: "EMAIL",
					operator: FilterOperator.EQ,
					value1: sEMAIL,
					caseSensitive: false
				}) // non case-sensitive search
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return {
						eeid: oData.EEID,
						name: oData.NAME,
						grade: oData.GRADE,
						cc: oData.CC,
						pos: oData.POS,
						dep: oData.DEP,
						unit_section: oData.UNIT_SECTION,
						b_place: oData.B_PLACE,
						marital: oData.MARITAL,
						job_group: oData.JOB_GROUP,
						office_location: oData.OFFICE_LOCATION,
						address_line1: oData.ADDRESS_LINE1,
						address_line2: oData.ADDRESS_LINE2,
						address_line3: oData.ADDRESS_LINE3,
						postcode: oData.POSTCODE,
						state: oData.STATE,
						country: oData.COUNTRY,
						contact_no: oData.CONTACT_NO,
						email: oData.EMAIL,
						direct_supperior: oData.DIRECT_SUPPERIOR,
						role: oData.ROLE,
						user_type: oData.USER_TYPE,
						mobile_bill_eligibility: oData.MOBILE_BILL_ELIGIBILITY,
						mobile_bill_elig_amount: oData.MOBILE_BILL_ELIG_AMOUNT,
						employee_type: oData.EMPLOYEE_TYPE,
						position_name: oData.POSITION_NAME,
						position_start_date: oData.POSITION_START_DATE,
						position_event_reason: oData.POSITION_EVENT_REASON,
						confirmation_date: oData.CONFIRMATION_DATE,
						effective_date: oData.EFFECTIVE_DATE,
						updated_date: oData.UPDATED_DATE,
						inserted_date: oData.INSERTED_DATE,
						medical_insurance_entitlement: oData.MEDICAL_INSURANCE_ENTITLEMENT,
						descr: {
							cc: null,
							dep: null,
							unit_section: null,
							marital: null,
							job_group: null,
							state: null,
							country: null,
							direct_supperior: null,
							role: null,
							user_type: null,
							employee_type: null
						}
					};
				} else {
					console.warn("No employee found with email: " + sEMAIL);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; // Return null so the app doesn't crash
			}
		},

		_applyReqTypeFilters: function (sUserType) {
            var oSelect = Fragment.byId("request", "req_reqtype");
            
            var oBinding = oSelect.getBinding("items");

            if (!oBinding) {
                return;
            }

            var aFilters = [
                new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
            ];

            if (sUserType !== this._oConstant.Role.GA_ADMIN) {
                aFilters.push(new Filter("REQUEST_TYPE_ID", FilterOperator.NE, this._oConstant.RequestType.MOBILE));
            }

            oBinding.filter(aFilters);
        },

		_loadClaimTypeSelectionData: function (sReqType) {
			if (!sReqType) return;

			if (this.oDialogFragment) {
				const oDialogModel = this.oDialogFragment.getModel("reqDialog");
				if (oDialogModel) {
					oDialogModel.setProperty('/claimtype', "");
				}
			} else {
				this._oReqModel.setProperty('/req_header/claimtype', "");
			}

			const oSelect = Fragment.byId("request", "req_claimtype");

			if (oSelect) {
				oSelect.setForceSelection(false);
				oSelect.setSelectedKey("");
			}

			const oListBinding = this._oDataModel.bindList("/ZCLAIM_TYPE", null, null, [
				new Filter("REQUEST_TYPE", FilterOperator.EQ, sReqType)
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });

				if (this.oDialogFragment) {
					this.oDialogFragment.setModel(oTypeModel, "claim_type_list");
				} else {
					this.getView().setModel(oTypeModel, "claim_type_list");
				}

			}).catch(err => console.error("ClaimType Load Failed", err));
		},

		_loadCourseCodeSelectionData: function (sClaimType) {
			if (!sReqType) return;

			if (this.oDialogFragment) {
				const oDialogModel = this.oDialogFragment.getModel("reqDialog");
				if (oDialogModel) {
					oDialogModel.setProperty('/coursecode', "");
				}
			} else {
				this._oReqModel.setProperty('/req_header/coursecode', ""); 
			}

			const oSelect = Fragment.byId("request", "req_coursecode");
			
			if (oSelect) {
				oSelect.setForceSelection(false);
				oSelect.setSelectedKey("");
			}

			const oListBinding = this._oDataModel.bindList("/ZTRAIN_COURSE_PART", null, null, [
				new Filter("PARTICIPANT_ID", FilterOperator.EQ, this._oSessionModel.getProperty("/userId")),
				new Filter("ATTENDENCE_STATUS", FilterOperator.EQ, false)
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });
				
				if (this.oDialogFragment) {
					this.oDialogFragment.setModel(oTypeModel, "course_list");
				} else {
					this.getView().setModel(oTypeModel, "course_list");
				}
				
			}).catch(err => console.error("Course List Load Failed", err));
		},

		getFieldVisibility_ReqType: async function (oEvent) {
			const sReqType = oEvent?.getSource?.().getSelectedKey?.();

			if (!sReqType) {
				console.warn("No request type found.");
				return;
			}

			BusyIndicator.show(0);

			try {
				const oListBinding = this._oDataModel.bindList("/ZDB_STRUCTURE", null, null, [
					new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.RequestFieldVisibilityConfig.SUBMISSION_TYPE),
					new Filter("COMPONENT_LEVEL", FilterOperator.EQ, this._oConstant.RequestFieldVisibilityConfig.HEADER),
					new Filter("REQUEST_TYPE_ID", FilterOperator.EQ, sReqType)
				]);

				const aCtx = await oListBinding.requestContexts(0, 1);

				if (!aCtx || aCtx.length === 0) {
					console.warn("No configuration rows for req_type:", sReqType);
					this._setAllHeaderControlsVisible(false);
					return;
				}

				const oData = aCtx[0].getObject();
				const sFields = oData.FIELD || "";

				const aFieldIds = sFields.replace(/[\[\]\s]/g, "").split(",").filter(id => id.length > 0);

				this._setAllHeaderControlsVisible(false);

				if (aFieldIds.length > 0) {
					aFieldIds.forEach(id => {
						const control = this._resolveControl(id, "request");
						if (control && typeof control.setVisible === "function") {
							control.setVisible(true);
						} else {
							console.warn("Control not found or not visible-capable:", id);
						}
					});
				}

				this._loadClaimTypeSelectionData(sReqType);

			} catch (err) {
				console.error("OData bindList failed:", err);
				this._setAllHeaderControlsVisible(false);
			} finally {
				switch (sReqType) {
					case this._oConstant.RequestType.MOBILE:
						this.oDialogFragment.getModel("reqDialog").setProperty("/grptype", "GRP");
						Fragment.byId("request", "req_grptype").setEnabled(false);
						break;

					case this._oConstant.RequestType.REIMBURSEMENT:
						this.oDialogFragment.getModel("reqDialog").setProperty("/grptype", "IND");
						Fragment.byId("request", "req_grptype").setEnabled(false);
						break;

					default:
						Fragment.byId("request", "req_grptype").setEnabled(true);
						break;
				}
				BusyIndicator.hide();
			}
		},

		_setAllHeaderControlsVisible: function (bVisible) {
			const aHeaderControlIds = ["req_tripstartdate", "req_tripenddate", "req_eventstartdate", "req_eventenddate", "req_grptype", "req_location", "req_transport", "req_acc", "req_attachment_1", "req_attachment_2", "req_comment"];
			aHeaderControlIds.forEach(id => {
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

		onClickCancel: function () {
			this.oDialogFragment.close();
		},

		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
		// End of Request Form Controller
		// ==================================================

		_newDialog: function (title, content, onPress) {
			this.oDialog = new Dialog({
				title: title,
				type: "Message",
				state: "None",
				content: [new Label({ text: content })],
				beginButton: new Button({
					type: "Emphasized",
					text: Utility.getText("button_claimsummary_confirm"),
					press: async function () {
						this.oDialog.close();
						await onPress();
					}.bind(this)
				}),
				endButton: new Button({
					text: Utility.getText("button_claimsummary_cancel"),
					press: function () {
						this.oDialog.close();
					}.bind(this)
				})
			});
			this.oDialog.open();
		},

		onAvatarPress: function (oEvent) {
			const oAvatar = oEvent.getSource();

			if (!this._oAvatarPopover) {
				this._oAvatarPopover = new Popover({
					placement: "Bottom",
					showHeader: false,
					content: [
						new VBox({
							class: "sapUiSmallMargin",
							items: [
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiTinyMarginTop",
									items: [
										new Icon({
											src: "sap-icon://employee",
											width: "1rem",
											class: "sapUiLargeMarginBeginEnd"
										}),
										new Text({ text: "{session>/userId}" })
									]
								}),
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiTinyMarginTop",
									items: [
										new Icon({
											src: "sap-icon://person-placeholder",
											width: "1rem",
											class: "sapUiLargeMarginBeginEnd"
										}),
										new Text({ text: "{session>/userName}" })
									]
								}),
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiMediumMarginTopBottom",
									items: [
										new Icon({
											src: "sap-icon://employee-pane",
											width: "1rem",
											class: "sapUiLargeMarginBeginEnd"
										}),
										new Text({ text: "{session>/grade}" })
									]
								}),
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiMediumMarginTopBottom",
									items: [
										new Icon({
											src: "sap-icon://suitcase",
											width: "1rem",
											class: "sapUiLargeMarginBeginEnd"
										}),
										new Text({ text: "{session>/position}" })
									]
								}),
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiMediumMarginTopBottom",
									items: [
										new Icon({
											src: "sap-icon://business-card",
											width: "1rem",
											class: "sapUiLargeMarginBeginEnd"
										}),
										new Text({ text: "{session>/department}" })
									]
								}),
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiTinyMarginTop",
									items: [
										new Icon({
											src: "sap-icon://email",
											width: "1rem",
											class: "sapUiLargeMarginBeginEnd"
										}),
										new Text({ text: "{session>/email}" })
									]
								}),
								new Button({
									icon: "sap-icon://log",
									text: "Sign Out",
									type: "Transparent",
									width: "100%",
									press: function () {
										window.location.href = "/claima/do/logout";
									}
								})
							]
						})
					]
				});
				this.getView().addDependent(this._oAvatarPopover);
			}
			if (this._oAvatarPopover.isOpen()) {
				this._oAvatarPopover.close();
			} else {
				this._oAvatarPopover.openBy(oAvatar);
			}
		}

	});
});
