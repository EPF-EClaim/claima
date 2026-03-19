sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/ui/core/Fragment",
	"sap/ui/core/BusyIndicator",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/library",
	"sap/tnt/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/export/Spreadsheet",
	"claima/utils/Utility",
	"claima/utils/PARequestSharedFunction",
	"claima/utils/Attachment",
	"claima/utils/ApprovalLog",
	"claima/utils/workflowApproval",
	"claima/utils/claimstatus",
	"claima/utils/claim",
	"sap/m/HBox",
	"sap/m/VBox",
	"sap/ui/core/Icon",
	"sap/ui/core/routing/HashChanger"
], function (
	Device,
	Controller,
	JSONModel,
	Popover,
	Fragment,
	BusyIndicator,
	Button,
	Dialog,
	Label,
	MessageToast,
	Text,
	library,
	tntLibrary,
	Filter,
	FilterOperator,
	Sorter,
	Spreadsheet,
	Utility,
	PARequestSharedFunction,
	Attachment,
	ApprovalLog,
	workflowApproval,
	claimstatus,
	claim,
	HBox,
	VBox,
	Icon,
	HashChanger
) {
	"use strict";

	return Controller.extend("claima.controller.App", {

		_ReqAttachmentFile1: null,
		_ReqAttachmentFile2: null,

		onInit: async function () {
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();

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

			const oSession = new sap.ui.model.json.JSONModel({
				userType: "UNKNOWN",
				origin: ""
			});
			this.getView().setModel(oSession, "session");

			var oRouter = this.getOwnerComponent().getRouter();

			const oImageModel = new sap.ui.model.json.JSONModel({
				homeIcon: sap.ui.require.toUrl("claima/images/EPFLogo.png"),
				initials: "",
				userName: "",
				position: ""
			});
			this.getView().setModel(oImageModel, "imageModel");

			const oDashboardModel = new JSONModel({
				claims: [],
				requests: [],
				approvals: []
			});
			this.getView().setModel(oDashboardModel, "dashboardModel");
			this._loadCurrentUser();

			const oModel = this.getOwnerComponent().getModel();
			const ctx = oModel.bindContext("/getUserType()");
			ctx.requestObject().then(oData => {
				this._userType = oData.userType || "UNKNOWN";
				this.costcenters = oData.costcenters || "UNKNOWN"; //Added by Aiman Salim 06/03/2026
				this.userId = oData.userId || "UNKNOWN";
				const sname = oData.name || "";
				const sposition = oData.position;
				const sInitials = sname.substring(0, 2).toUpperCase();
				oImageModel.setProperty("/initials", sInitials);
				oImageModel.setProperty("/userName", sname);
				oImageModel.setProperty("/position", sposition);

				oSession.setProperty("/origin", oData.origin);

				// save userId to model
				var oUserIdModel = new JSONModel({
					"userId": oData.userId,
					"email": oData.id
				});
				//// set input
				this.getView().setModel(oUserIdModel, "userId");
				oSession.setProperty("/userType", this._userType);
				this._loadDashboardData();
			}).catch(err => {
				console.error("getUserType failed:", err);
				this._userType = "UNKNOWN";
				console.error("getUserType failed:", err); //Added by Aiman Salim 06/03/2026
				this.costcenters = "UNKNOWN";
				console.error("getUserType failed:", err); //Added by Aiman Salim 08/03/2026
				this.userId = "UNKNOWN";
			});

			PARequestSharedFunction._ensureRequestModelDefaults(this._getReqModel());
			// var oUserModel = new sap.ui.model.json.JSONModel({ email: "jefry.yap@my.ey.com" });
			// this.getView().setModel(oUserModel, 'user');
			// const emp_data = await this._getEmpIdDetail("jefry.yap@my.ey.com");
			// const oReqModel = this._getReqModel().getData();
			// oReqModel.user = emp_data.eeid;
			// this._getReqModel().setData(oReqModel);

			// Route to Dashboard on first initialize only. Refresh will only reload the page you at.
			const oHashChanger = HashChanger.getInstance();
			const sHash = oHashChanger.getHash();
			oRouter.getRoute("Dashboard").attachMatched(this._onDashboardMatched, this);
			const bIsDeepLink = sHash.includes("RequestForm") || sHash.includes("Claim");

			if (!bIsDeepLink || sHash === "") {
				oRouter.navTo("Dashboard", {}, true); 
			} else {
				oRouter.initialize();
			}
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
			var oRouter = this.getOwnerComponent().getRouter();

			//Start EY_ATHIRAH
			const key = oEvent.getSource().data("key");

			// Make sure userType is available
			const type = this._userType; // << read what we stored earlier
			if (!type) {
				sap.m.MessageToast.show("Please wait… loading your access.");
				return;
			}

			//Aiman Salim - 05/03/2026 - Added to make it global usage;
			const oUserAccessModel = new sap.ui.model.json.JSONModel({
				userType: this._userType,
				costcenters: this.costcenters,
				userId: this.userId, // 08/03/2026 - Added to fetch emp id
			});
			this.getOwnerComponent().setModel(oUserAccessModel, "access");
			//Aiman Salim - 05/03/2026 - Added to make it global;

			//End EY_ATHIRAH

			switch (oKey) {
				case "nav_claimsubmission":
					this.onNav_ClaimSubmission();
					break;
				case "createrequest":
					this.onClickMyRequest();
					break;
				case "myrequest":
					this._navToPARStatus();
					break;
				case "mysubstitution":
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("ManageSub");
					break;
				case "config":
					//Start EY_ATHIRAH
					if (type === "DTD Admin" || type === "JKEW Admin" || type === "Super Admin") {
						oRouter.navTo("Configuration");
					} else {
						var message = Utility.getText(this, "msg_unauthorized_role");
						sap.m.MessageBox.error(message);
					}
					//End EY_ATHIRAH
					break;
				// Start Aiman Salim 10/02/2026 - Added for analytics
				case "analytics":
					if (type === "JKEW Admin" || type === "DTD Admin" || type === "GA Admin" || type === "Super Admin") {
						oRouter.navTo("Analytics")
					} else {
						var message = Utility.getText(this, "msg_unauthorized_role");
						sap.m.MessageBox.error(message);
					}
					break;
				// End 	 Aiman Salim 10/02/2026 - Added for analytics
				// Start Aiman Salim 03/03/2026 - Added for MyClaim
				case "myreport":
					this.getCLAIMHeaderList();
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("ClaimStatus")
					break;
				//Start Aiman Salim 08/03/2026 - Added for MyApproval
				case "approval":
					if (type === "Approver" || type === "Super Admin") {
						this.getMyApproverPAReq();
						this.getMyApproverClaim();
						var oRouter = this.getOwnerComponent().getRouter();
						oRouter.navTo("MyApproval");
					} else {
						var message = Utility.getText(this, "msg_unauthorized_role");
						sap.m.MessageBox.error(message);
					}
					break;
				//End Aiman Salim 08/03/2026 - Added for MyApproval
				// End 	 Aiman Salim 03/03/2026 - Added for MyClaim
				case "dashboard":
					this.getOwnerComponent().getModel("employee")?.refresh();
					this.getOwnerComponent().getModel("employee_view")?.refresh();
					const oDashboardModel = this.getView().getModel("dashboardModel");
					oDashboardModel.setData({
						claims: [],
						requests: [],
						approvals: []
					});
					this._loadDashboardData();

					oRouter.navTo("Dashboard");
					break;
				// End 	 Aiman Salim 03/03/2026 - Added for MyClaim
				default:
					// navigate to page with ID same as the key
					var oPage = this.byId(oKey); // make sure your NavContainer has a page with this ID
					if (oPage) {
						this.byId("pageContainer").to(oPage);
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
				MessageToast.show(Utility.getText(this, "msg_nav_error_fragment", [oName]));
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
			var userModelData = this.getView().getModel('user')?.getData() || this.getView().getModel("userId")?.getData() || null;
			if (!userModelData) {
				MessageToast.show(Utility.getText(this, "msg_claimprocess_nouser"));
				if (this.oDialog_ClaimProcess) {
					this.oDialog_ClaimProcess.close();
					return;
				}
			}
			const emp_data = await this._getEmpIdDetail(userModelData.email);
			if (emp_data) {
				oInputModel.setProperty("/emp_master", emp_data);
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
								$select: "PREAPPROVAL_AMOUNT,EVENT_START_DATE,EVENT_END_DATE,COST_CENTER,ALTERNATE_COST_CENTER"
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
				oInputModel.setProperty("/claimtype/requestform/objective_purpose", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("OBJECTIVE_PURPOSE"));
				oInputModel.setProperty("/claimtype/requestform/preapproval_amount", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("PREAPPROVAL_AMOUNT"));
				oInputModel.setProperty("/claimtype/requestform/trip_start_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("TRIP_START_DATE")));
				oInputModel.setProperty("/claimtype/requestform/trip_end_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("TRIP_END_DATE")));
				oInputModel.setProperty("/claimtype/requestform/event_start_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("EVENT_START_DATE")));
				oInputModel.setProperty("/claimtype/requestform/event_end_date", this._getJsonDate(this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("EVENT_END_DATE")));
				oInputModel.setProperty("/claimtype/requestform/alternate_cost_center", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("ALTERNATE_COST_CENTER"));
				oInputModel.setProperty("/claimtype/requestform/descr/alternate_cost_center", this.byId("select_claimprocess_requestform").getSelectedItem().getBindingContext("employee").getObject("COSTCENTER/COST_CENTER_DESC"));
			}
			if (this.byId("switch_claimprocess_req_emailapprove").getEnabled()) {
				oInputModel.setProperty("/claimtype/req_emailapprove", this.byId("switch_claimprocess_req_emailapprove").getState());
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
				MessageToast.show(Utility.getText(this, "msg_nav_error_fragment", [oName]));
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
			oInputModel.setProperty("/claim_header/emp_id", oInputModel.getProperty("/emp_master/eeid"));
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
			if (!oInputModel.getProperty("/claim_header/preapproved_amount")) {
				oInputModel.setProperty("/claim_header/preapproved_amount", "0.00");
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
						oInputModel.setProperty("/claim_header/descr/request_id", Utility.getText(this, "text_claiminput_preapprovalreq_email"));

						// require attachment email approval
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
				Utility.getText(this, "dialog_claiminput_submit"),
				Utility.getText(this, "label_claiminput_submit"),
				function () {
					this.onClaimSubmission_ClaimInput();
				}.bind(this)
			);
		},

		onClaimSubmission_ClaimInput: async function () {
			// validate input data
			var oInputModel = this.getView().getModel("claimsubmission_input");
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
					MessageToast.show(Utility.getText(this, "msg_claiminput_required"));
					return;
				}
			}
			// validate attachment
			if (this.byId("fileuploader_claiminput_attachment").getValue()) {
				var attachmentNumber = await Attachment.postAttachment(
					oInputModel.getProperty("/attachment/fileName"),
					oInputModel.getProperty("/attachment/fileContent"),
					oInputModel.getProperty("/claim_header/emp_id")
				);
				if (attachmentNumber) {
					oInputModel.setProperty("/claim_header/attachment_email_approver", attachmentNumber);
					oInputModel.setProperty("/claim_header/descr/attachment_email_approver", oInputModel.getProperty("/attachment/fileName"));
				}
				else {
					MessageToast.show(Utility.getText(this, "msg_claiminput_attachment_upload_error"));
					// don't proceed claim item if attachment upload fails
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

			// assign report number to new claim
			if (oInputModel.getProperty("/is_new")) {
				var currentReportNumber = await this._getCurrentReportNumber('NR02');
				var retries = 5;
				while (retries-- > 0 && currentReportNumber.result === 'X') {
					await this._updateCurrentReportNumber('NR02', currentReportNumber.current);
					currentReportNumber = await this._getCurrentReportNumber('NR02');
				}
				if (!isNaN(currentReportNumber.result.slice(-1))) {
					oInputModel.setProperty("/claim_header/claim_id", currentReportNumber.result);
					oInputModel.setProperty("/reportnumber/reportno", currentReportNumber.result);
					oInputModel.setProperty("/reportnumber/current", currentReportNumber.current);
				}
				else {
					this.oDialog = new Dialog({
						title: Utility.getText(this, "dialog_claiminput_claimid"),
						type: "Message",
						state: "None",
						content: [new Label({ text: Utility.getText(this, "msg_claiminput_claimid") })],
						endButton: new Button({
							text: Utility.getText(this, "endbutton_claiminput_claimid"),
							press: function () {
								this.oDialog.close();
							}
						})
					});
					this.oDialog.open();
					return;
				}
			}
			//// set status for new claim as draft
			if (oInputModel.getProperty("/is_new")) {
				oInputModel.setProperty("/claim_header/status_id", this._oConstant.ClaimStatus.DRAFT);
				oInputModel.setProperty("/claim_header/descr/status_id", "DRAFT");
			}

			// set body for update
			var oBody = new JSONModel({
				EMP_ID: oInputModel.getProperty("/claim_header/emp_id"),
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
						await this._updateCurrentReportNumber("NR02", oInputModel.getProperty("/reportnumber/current"));
						// post MDF for header attachment
						if (oInputModel.getProperty("/claim_header/attachment_email_approver")) {
							await Attachment.postMDF(
								oInputModel.getProperty("/claim_header/claim_id"),
								oInputModel.getProperty("/claim_header/attachment_email_approver")
							)
						}

						if (claimSaved) {
							MessageToast.show(Utility.getText(this, "msg_claimsubmission_created", [oInputModel.getProperty("/claim_header/claim_id")]));
						}
						oInputModel.setProperty("/is_new", false);
						// close Claim Input dialog
						this.oDialog_ClaimInput.close();

						// load Claim Submission page
						const oRouter = this.getOwnerComponent().getRouter();
						oRouter.navTo("ClaimSubmission", { claim_id: encodeURIComponent(String(oInputModel.getProperty("/claim_header/claim_id"))) });
					});
				}

			} catch (e) {
				MessageToast.show(Utility.getText(this, "msg_claimsubmission_failed", [e.message]));
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
			MessageToast.show(Utility.getText(this, "msg_claiminput_attachment_upload_filesize"));
		},

		onTypeMissmatch_ClaimInput_Attachment: function (oEvent) {
			MessageToast.show(Utility.getText(this, "msg_claiminput_attachment_upload_mismatch"));
		},

		_validDateRange: function (startdate, enddate) {
			var startDateValue = this.byId(startdate).getValue();
			var endDateValue = this.byId(enddate).getValue();
			// check for missing value
			if (!startDateValue || !endDateValue) {
				MessageToast.show(Utility.getText(this, "msg_daterange_missing"));
				return false;
			}
			// check if end date earlier than start date
			var startDateUnix = new Date(startDateValue).valueOf();
			var endDateUnix = new Date(endDateValue).valueOf();
			if (startDateUnix > endDateUnix) {
				MessageToast.show(Utility.getText(this, "msg_daterange_order"));
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

		_getReqModel: function () {
			return this.getOwnerComponent().getModel("request");
		},

		onClickMyRequest: async function () {
			PARequestSharedFunction._ensureRequestModelDefaults(this._getReqModel());
			this._loadDefaultSelection();
			this._loadReqTypeSelectionData();

			if (!this.oDialogFragment) {
				this.oDialogFragment = await Fragment.load({
					id: "request",
					name: "claima.fragment.request",
					controller: this
				});
				this.getView().addDependent(this.oDialogFragment);

				this.oDialogFragment.attachAfterClose(() => {
					this.oDialogFragment.destroy();
					this.oDialogFragment = null;
				});
			}
			this.oDialogFragment.open();
			this.oDialogFragment.addStyleClass('requestDialog');
		},

		onClickCreateRequest: async function () {
			sap.ui.core.BusyIndicator.show(0);
			const oReqModel = this._getReqModel();
			const oData = oReqModel.getProperty("/req_header");
			const emp_id = oReqModel.getProperty('/user');
			let okcode = true;
			let message = '';

			// Simplified Validation Logic
			const mandatoryFields = {
				'RT0001': ['purpose', 'reqtype', 'tripstartdate', 'tripenddate', 'eventstartdate', 'eventenddate', 'grptype', 'location', 'transport', 'comment'],
				'RT0002': ['purpose', 'reqtype', 'grptype', 'comment'],
				'RT0003': ['purpose', 'reqtype', 'eventstartdate', 'eventenddate', 'grptype', 'location', 'comment', 'eventdetail1', 'eventdetail2', 'eventdetail3', 'eventdetail4'],
				'RT0004': ['purpose', 'reqtype', 'tripstartdate', 'tripenddate', 'grptype', 'comment'],
			};

			const fieldsToCheck = mandatoryFields[oData.reqtype] || ['purpose'];
			const isMissing = fieldsToCheck.some(field => !oData[field] || oData[field] === "");

			if (isMissing) {
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
				var attachment_1 = await this.getFileAsBinary("req_attachment_1");
				var attachment1_ID = await Attachment.postAttachment(oData.doc1, attachment_1, emp_id);
				oData.doc1 = attachment1_ID;
				if (oData.doc2) {
					var attachment_2 = await this.getFileAsBinary("req_attachment_2");
					var attachment2_ID = await Attachment.postAttachment(oData.doc2, attachment_2, emp_id);
					oData.doc2 = attachment2_ID;
				}
				await this.createRequestHeader(oData, oReqModel);
			}
			sap.ui.core.BusyIndicator.hide();
		},

		onImportChange1(oEvent) {
			this._ReqAttachmentFile1 = oEvent.getParameters("files").files[0];
		},

		onImportChange2(oEvent) {
			this._ReqAttachmentFile2 = oEvent.getParameters("files").files[0];
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

		getFileAsBinary: function (attachmentID) {

			return new Promise((resolve, reject) => {

				const file =
					attachmentID === 'req_attachment_1'
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
					resolve(vContent.split(",")[1]);
				}

				reader.onerror = (e) => {
					reject(new Error(`Failed to read file: ${e?.target?.error?.message || 'Unknown error'}`));
				};

				if (attachmentID == 'req_attachment_1') {
					reader.readAsDataURL(this._ReqAttachmentFile1);
				}
				else {
					reader.readAsDataURL(this._ReqAttachmentFile2);
				}
			})
		},

		createRequestHeader: async function (oInputData, oReqModel) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oResult = await this._getCurrentReqNumber('NR01');

			if (oResult) {
				const oListBinding = oMainModel.bindList("/ZREQUEST_HEADER");

				var userModelData = this.getView().getModel('user').getData();
				const emp_data = await this._getEmpIdDetail(userModelData.email);

				const sCostCenter = emp_data ? emp_data.cc : "";

				const oPayload = {
					EMP_ID: emp_data.eeid,
					REQUEST_ID: oResult.reqNo,
					REQUEST_TYPE_ID: oInputData.reqtype,
					OBJECTIVE_PURPOSE: oInputData.purpose,
					REMARK: oInputData.comment,
					IND_OR_GROUP: oInputData.grptype,
					ALTERNATE_COST_CENTER: oInputData.altcostcenter,
					LOCATION: oInputData.location,
					TYPE_OF_TRANSPORTATION: oInputData.transport,
					ATTACHMENT1: oInputData.doc1,
					ATTACHMENT2: oInputData.doc2,
					COST_CENTER: sCostCenter,
					EVENT_START_DATE: oInputData.eventstartdate,
					EVENT_END_DATE: oInputData.eventenddate,
					TRIP_START_DATE: oInputData.tripstartdate,
					TRIP_END_DATE: oInputData.tripenddate,
					STATUS: this._oConstant.ClaimStatus.DRAFT,
					CLAIM_TYPE_ID: oInputData.claimtype,
					REQUEST_DATE: new Date().toISOString().slice(0, 10)
				};

				const oContext = oListBinding.create(oPayload);

				oContext.created().then(async () => {
					await this._updateCurrentReqNumber(oResult.current);
					await Attachment.postMDF(oResult.reqNo, oInputData.doc1, oInputData.doc2)
					this.oDialogFragment.close();

					oReqModel.setProperty("/view", 'list');
					this._getHeaderView(oResult.reqNo)
					oReqModel.setProperty("/req_header/reqid", oResult.reqNo);
					oReqModel.setProperty("/req_header/reqstatus", 'DRAFT');
					oReqModel.setProperty("/req_header/costcenter", sCostCenter);
					oReqModel.setProperty("/eeid", emp_data.eeid);
					// PARequestSharedFunction._getItemList(this, oResult.reqNo, true);
					//oResult.reqNo send this to approval determination

					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("RequestForm", {request_id: oResult.reqNo});
				}).catch(err => {
					sap.m.MessageToast.show("Creation failed: " + err.message);
				});
			}
		},

		async _getHeaderView(reqid) {

			const oReqModel = this._getReqModel();
			const oModel = this.getOwnerComponent().getModel("employee_view");
			const oListBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", null, null, [
				new sap.ui.model.Filter("REQUEST_ID", "EQ", reqid)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
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
			} catch (oError) {
				console.error("Error fetching Header view", oError);
				return null; // Return null so the app doesn't crash
			}
		},

		// get backend data
		async _getEmpIdDetail(sEMAIL) {
			const oModel = this.getOwnerComponent().getModel();
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
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

		_loadDefaultSelection: function () {
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZINDIV_GROUP", null, null, [
				new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });
				this.getView().setModel(oTypeModel, "indiv_list");
			}).catch(err => console.error("GroupType Load Failed", err));
		},

		_loadReqTypeSelectionData: function () {
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZREQUEST_TYPE", null, null, [
				new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });
				this.getView().setModel(oTypeModel, "req_type_list");
			}).catch(err => console.error("RequestType Load Failed", err));
		},

		_loadClaimTypeSelectionData: function (req_type) {
			if (req_type) {
				const oMainModel = this.getOwnerComponent().getModel();
				const oListBinding = oMainModel.bindList("/ZCLAIM_TYPE", null, null, [
					new Filter("REQUEST_TYPE", FilterOperator.EQ, req_type)
				]);

				oListBinding.requestContexts().then((aContexts) => {
					const aData = aContexts.map(oCtx => oCtx.getObject());
					const oTypeModel = new JSONModel({ types: aData });
					this.getView().setModel(oTypeModel, "claim_type_list");
				}).catch(err => console.error("ClaimType Load Failed", err));
			}
		},

		_getCurrentReqNumber: async function (range_id) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZNUM_RANGE", null, null, [
				new Filter("RANGE_ID", FilterOperator.EQ, range_id)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);
				if (aContexts.length === 0) throw new Error("Range ID not found");

				const oData = aContexts[0].getObject();
				const prefix = oData.PREFIX;
				const current = Number(oData.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const reqNo = `${prefix}${yy}${String(current).padStart(9, "0")}`;
				// const reqNo = `REQ${yy}${String(current).padStart(9, "0")}`;

				return { reqNo, current };
			} catch (err) {
				console.error("Number Range Error:", err);
				return null;
			}
		},

		_updateCurrentReqNumber: async function (currentNumber) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oContext = oMainModel.bindContext(`/ZNUM_RANGE('${encodeURIComponent('NR01')}')`).getBoundContext();

			try {
				await oContext.setProperty("CURRENT", String(currentNumber + 1));
				return true;
			} catch (e) {
				console.error("Update Failed", e);
				return false;
			}
		},

		//Aiman Salim - 08/03/2026 - MyApproval - My Pre-Approval Request Status;
		getMyApproverPAReq: async function () {
			const oReq = this.getOwnerComponent().getModel("request_status");
			const oModel = this.getOwnerComponent().getModel("employee_view");

			const userID = this.userId;
			const oApproverOrSub = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("APPROVER_ID", sap.ui.model.FilterOperator.EQ, userID),
					new sap.ui.model.Filter("SUBSTITUTE_APPROVER_ID", sap.ui.model.FilterOperator.EQ, userID)
				],
				and: false // OR condition between the two
			});

			const oStatusPending = new sap.ui.model.Filter(
				"STATUS",
				sap.ui.model.FilterOperator.EQ,
				this._oConstant.ClaimStatus.PENDING_APPROVAL // use the exact code/value your backend expects
			);
			// (APPROVER = id OR SUBSTITUTE_APPROVER = id) AND STATUS = 'PENDING APPROVAL'
			const oCombined = new sap.ui.model.Filter({
				filters: [oApproverOrSub, oStatusPending],
				and: true // AND between groups
			});


			const oListBinding = oModel.bindList("/ZEMP_APPROVER_REQUEST_DETAILS", undefined,
				[new sap.ui.model.Sorter("STATUS", true)], // desc by STATUS
				[oCombined],
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
		//MyApproval - Claim Request Status;

		getMyApproverClaim: async function () {
			const oReq = this.getOwnerComponent().getModel("claim_status");
			const oModel = this.getOwnerComponent().getModel("employee_view");

			const userID = this.userId;
			const oApproverOrSub = new Filter({
				filters: [
					new Filter("APPROVER_ID", FilterOperator.EQ, userID),
					new Filter("SUBSTITUTE_APPROVER_ID", FilterOperator.EQ, userID)
				],
				and: false // OR condition between the two
			});

			const oStatusPending = new Filter(
				"STATUS",
				FilterOperator.EQ,
				this._oConstant.ClaimStatus.PENDING_APPROVAL // use the exact code/value your backend expects
			);
			// (APPROVER = id OR SUBSTITUTE_APPROVER = id) AND STATUS = 'PENDING APPROVAL'
			const oCombined = new Filter({
				filters: [oApproverOrSub, oStatusPending],
				and: true // AND between groups
			});
			const oListBinding = oModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
				[new Sorter("STATUS", true)], // desc by STATUS
				[oCombined],

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
					if (it.TOTAL_CLAIM_AMOUNT == null) it.TOTAL_CLAIM_AMOUNT = 0.0;
				});

				oReq.setProperty("/claim_header_list", a);
				oReq.setProperty("/claim_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/claim_header_list", []);
				oReq.setProperty("/claim_header_count", 0);
				return [];
			}
		},

		//For MyClaimStatus
		getCLAIMHeaderList: async function () {
			const oReq = this.getOwnerComponent().getModel("claim_status2");
			const oModel = this.getOwnerComponent().getModel("employee_view");

			const oListBinding = oModel.bindList("/ZEMP_CLAIM_EE_VIEW", undefined,
				[new Sorter("modifiedAt", true)],
				null,
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

				/* 				a.forEach((it) => {
									if (it.PREAPPROVAL_AMOUNT == null) it.PREAPPROVAL_AMOUNT = 0.0;
								}); */

				oReq.setProperty("/claim_header_list", a);
				oReq.setProperty("/claim_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/claim_header_list", []);
				oReq.setProperty("/claim_header_count", 0);
				return [];
			}
		},
		//END - Aiman Salim

		getFieldVisibility_ReqType: async function (oEvent) {
			const oModel = this.getOwnerComponent().getModel();

			const reqTypeFromSelect = oEvent?.getSource?.().getSelectedKey?.();
			const reqTypeFromModel = this._getReqModel().getProperty("/req_header/reqtype");
			const req_type = reqTypeFromSelect || reqTypeFromModel;

			if (!req_type) {
				console.warn("No req_type found yet.");
				return;
			}

			const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
				new sap.ui.model.Filter("SUBMISSION_TYPE", "EQ", "PREAPPROVAL_R"),
				new sap.ui.model.Filter("COMPONENT_LEVEL", "EQ", "HEADER"),
				new sap.ui.model.Filter("REQUEST_TYPE_ID", "EQ", req_type)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);

				if (!aCtx || aCtx.length === 0) {
					console.warn("No configuration rows for req_type:", req_type);
					this._setAllHeaderControlsVisible(false);
					return;
				}
				const oData = aCtx[0].getObject();

				const aFieldIds = oData.FIELD.replace(/[\[\]\s]/g, "").split(",");

				if (aFieldIds != []) {
					this._setAllHeaderControlsVisible(false);
					aFieldIds.forEach(id => {
						const control = this._resolveControl(id, "request");
						if (control && typeof control.setVisible === "function") {
							control.setVisible(true);
						} else {
							console.warn("Control not found or not visible-capable:", id);
						}
					});
				} else {
					this._setAllHeaderControlsVisible(false);
				}

				this._loadClaimTypeSelectionData(req_type);

			} catch (err) {
				console.error("OData bindList failed:", err);
				this._setAllHeaderControlsVisible(false);
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
				c = sap.ui.core.Fragment.byId(this.getView().createId(sFragmentId), sId);
				if (c) return c;

				c = sap.ui.core.Fragment.byId(sFragmentId, sId);
				if (c) return c;
			}

			return sap.ui.getCore().byId(`${sFragmentId}--${sId}`) || sap.ui.getCore().byId(sId);
		},

		_navToPARStatus() {
			const oReq = this.getOwnerComponent().getModel("request_status");
			const oModel = this.getOwnerComponent().getModel('employee_view');

			PARequestSharedFunction._ensureRequestModelDefaults(this._getReqModel());
			PARequestSharedFunction.getPARHeaderList(oReq, oModel);
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("RequestFormStatus");
		},

		onClickCancel: function () {
			this.oDialogFragment.close();
		},

		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
		// End of Request Form Controller
		// ==================================================

		onClickNavigate: function (oEvent) {
			let id = oEvent.getParameters().id;
			var oRouter = this.getOwnerComponent().getRouter();

			const userType = this.getView().getModel("session")?.getProperty("/userType")
				|| this._userType
				|| "UNKNOWN";

			if (id.includes("dashboard-claim")) {
				this.getCLAIMHeaderList();
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("ClaimStatus")
			} else if (id.includes("request")) {
				this._navToPARStatus();
			} else if (id.includes("approval")) {
				if (userType === "Approver") {
					this.getMyApproverPAReq();
					this.getMyApproverClaim();
					oRouter.navTo("MyApproval");
				}
				else {
					var message = Utility.getText(this, "msg_unauthorized_role");
					sap.m.MessageBox.error(message);
				}
			}
		},

		_newDialog: function (title, content, onPress) {
			this.oDialog = new Dialog({
				title: title,
				type: "Message",
				state: "None",
				content: [new Label({ text: content })],
				beginButton: new Button({
					type: "Emphasized",
					text: Utility.getText(this, "button_claimsummary_confirm"),
					press: async function () {
						this.oDialog.close();
						await onPress();
					}.bind(this)
				}),
				endButton: new Button({
					text: Utility.getText(this, "button_claimsummary_cancel"),
					press: function () {
						this.oDialog.close();
					}.bind(this)
				})
			});
			this.oDialog.open();
		},

		_loadCurrentUser: function () {
			var that = this;

			$.ajax({
				type: "GET",
				url: "/user-api/currentUser",
				success: async function (resultData) {
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

						const emp_data = await that._getEmpIdDetail(email);
						const oReqModel = that._getReqModel().getData();
						oReqModel.user = emp_data.eeid;
						oReqModel.user_grade = emp_data.grade;
						that._getReqModel().setData(oReqModel);

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
											class: "sapUiMediumMarginBegin sapUiMediumMarginEnd"
										}),
										new Text({ text: "{userId>/userId}" })
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
											class: "sapUiMediumMarginBegin sapUiMediumMarginEnd"
										}),
										new Text({ text: "{imageModel>/userName}" })
									]
								}),
								new HBox({
									alignItems: "Center",
									width: "100%",
									class: "sapUiTinyMarginTop sapUiSmallMarginBottom",
									items: [
										new Icon({
											src: "sap-icon://business-card",
											width: "1rem",
											class: "sapUiMediumMarginBegin sapUiMediumMarginEnd"
										}),
										new Text({ text: "{imageModel>/position}" })
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

			// toggle open/close
			if (this._oAvatarPopover.isOpen()) {
				this._oAvatarPopover.close();
			} else {
				this._oAvatarPopover.openBy(oAvatar);
			}
		},

		async openItemFromList(oEvent) {
			claimstatus.onRowPress({
				controller: this,
				event: oEvent,
				keyProp: "REQUEST_ID",
				routeName: "RequestForm",
				modelName: "dashboardModel",
				paramName: "request_id"
			});
		},

		async onRowPress(oEvent) {

			claim.onRowPress({
				controller: this,
				event: oEvent,
				modelName: "dashboardModel",
				keyProp: "CLAIM_ID",
				navContainerId: "pageContainer",
				pageId: "navcontainer_claimsubmission"
			});

		},

		_onDashboardMatched: function () {
			if (!this.userId || this.userId === "UNKNOWN") return;
			const oDashboardModel = this.getView().getModel("dashboardModel");
			oDashboardModel.setData({
				claims: [],
				requests: [],
				approvals: []
			});
			this._loadDashboardData();
		},

		_loadDashboardData: function () {
			const oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");
			const oDashboardModel = this.getView().getModel("dashboardModel");

			oEmployeeViewModel.bindList("/ZEMP_CLAIM_EE_VIEW", null, [
				new Sorter("modifiedAt", true)
			]).requestContexts(0, Infinity)
				.then(aContexts => {
					oDashboardModel.setProperty("/claims", aContexts.map(c => c.getObject()));
				})
				.catch(err => console.log("claims error:", err));

			oEmployeeViewModel.bindList("/ZEMP_REQUEST_EE_VIEW", null, [
				new Sorter("modifiedAt", true)
			]).requestContexts(0, Infinity)
				.then(aContexts => {
					oDashboardModel.setProperty("/requests", aContexts.map(c => c.getObject()));
				})
				.catch(err => console.log("requests error:", err));

			oEmployeeViewModel.bindList("/ZEMP_APPROVER_DETAILS").requestContexts(0, Infinity)
				.then(aContexts => {
					oDashboardModel.setProperty("/approvals", aContexts.map(c => c.getObject()));
				})
				.catch(err => {
					console.log("approvals not available for this role");
					oDashboardModel.setProperty("/approvals", []);
				});
		},
		onHomeIconPressed: function () {
			const oSession = this.getView().getModel("session");
			const origin = oSession.getProperty("/origin");
			var sSFURL;

			sSFURL = origin === "httpsa6s6cq33s.accounts.ondemand.com" ? "https://hcm-ap20-preview.hr.cloud.sap/login?company=EPFSFDEV" :
				origin === "sap.custom" ? "https://hcm-ap20.hr.cloud.sap/login?company=EPFSFUAT" :
					"https://hcm-ap20.hr.cloud.sap/login?company=EPFSFPRD";

			window.open(sSFURL, "_self");

		},


	});
});
