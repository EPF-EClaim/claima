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
	"claima/utils/Utility",
	"claima/utils/Attachment",
	"claima/utils/budgetCheck",
	"claima/utils/ApprovalLog",
	"claima/utils/ApproveDialog",
	"claima/utils/RejectDialog",
	"claima/utils/SendBackDialog",
	"claima/utils/ApproverUtility",
	"claima/utils/workflowApproval",
	"claima/utils/DateUtility",
	"claima/utils/EligibilityCheck",
	"claima/utils/EligibilityScenarios/EligibleScenarioCheck"
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
	Utility,
	Attachment,
	budgetCheck,
	ApprovalLog,
	ApproveDialog,
	RejectDialog,
	SendBackDialog,
	ApproverUtility,
	workflowApproval,
	DateUtility,
	EligibilityCheck,
	EligibleScenarioCheck
) {
	"use strict";

	return Controller.extend("claima.controller.ClaimSubmission", {

		onInit: function () {
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
			this._fragments = Object.create(null);
			this._clearExit = false;
			this.currentHash = null;
			this._oModel = this.getOwnerComponent().getModel();
			this._oSessionModel = this.getOwnerComponent().getModel("session");

			// URL Access
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("ClaimSubmission").attachPatternMatched((event) => { this._onMatched(event); }, this);
			oRouter.attachBeforeRouteMatched((event) => { this._beforeRouteMatched(event); }, this);


		},

		_beforeRouteMatched: async function (oEvent) {
			if (!this.currentHash || this.currentHash.indexOf("ClaimSubmission") === -1) {
				// skip check if not on claim submission page
				return;
			}

			// refresh data
			this.currentHash = null;
			this.getOwnerComponent().getModel("employee")?.refresh();
			this.getOwnerComponent().getModel("employee_view")?.refresh();

			if (!this._clearExit) {
				// return from claim detail input screen
				this.onCancel_ClaimDetails_Input();

				let oSideNav = true;
				this.onBack_ClaimSubmission(oSideNav);
			}
			else {
				this._clearExit = false;
			}
		},

		_onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous step
				window.history.go(-1);
			} else {
				// No history, go to home page
				var oRouter = this.getOwnerComponent().getRouter();
				this._clearExit = true;
				oRouter.navTo("Dashboard", {}, true); // 'true' replaces history
			}
		},

		_onMatched: async function (oEvent) {
			const _oRouter = this.getOwnerComponent().getRouter();
			this.currentHash = _oRouter.getHashChanger().getHash();

			let sClaimId = oEvent.getParameter("arguments").claim_id;

			try {
				sClaimId = decodeURIComponent(sClaimId);
			}
			catch (e) {
				// unable to decode URL
				MessageBox.error(Utility.getText("msg_claimsubmission_decode", [sClaimId]))
				this._onNavBack();
			}

			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (!oClaimSubmissionModel) {
				oClaimSubmissionModel = this._getNewClaimSubmissionModel("claimsubmission_input");
				await this._loadClaimById(String(sClaimId));
				if (Object.keys(oClaimSubmissionModel.getProperty("/claim_header")).length === 0) {
					// unable to load claim details
					MessageBox.error(Utility.getText("msg_claimsubmission_missing", [sClaimId]))
					this._onNavBack();
				}
			}
			else if (oClaimSubmissionModel.getProperty("/claim_header/claim_id") !== sClaimId) {
				await this._loadClaimById(String(sClaimId));
				if (!oClaimSubmissionModel.getProperty("/claim_header")) {
					// unable to load claim details
					MessageBox.error(Utility.getText("msg_claimsubmission_missing", [sClaimId]))
					this._onNavBack();
				}
			}
			// set view-only
			// TODO: Revisit to make sure the claim is reloaded everytime
			if (
				oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.DRAFT &&
				oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.SEND_BACK
			) {
				oClaimSubmissionModel.setProperty("/view_only", true)
			}
			else {
				oClaimSubmissionModel.setProperty("/view_only", false)
			}

			// load form fragments
			//// reset fragments
			if (Object.keys(this._fragments).length !== 0) {
				var oPage = this.byId("page_claimsubmission");
				Object.entries(this._fragments).forEach(([key, value]) => {
					this._fragments[key].then(function (oVBox) {
						oPage.removeContent(oVBox);
					});
				});
			}
			await this._showInitFormFragment();
			await this._afterLoadFragments();
		},

		_showInitFormFragment: async function () {
			var oPage = this.byId("page_claimsubmission");

			// display initial fragments
			await this._getFormFragment("claimsubmission_summary_claimheader", true).then(function (oVBox) {
				oPage.insertContent(oVBox, 0);
			});
			await this._getFormFragment("claimsubmission_summary_claimitem", true).then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
		},

		_getFormFragment: async function (sName, toCreate) {
			const oView = this.getView();
			if (this._fragments[sName]) {
				return this._fragments[sName];
			}
			else if (toCreate) {
				this._fragments[sName] = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sName,
					type: "XML",
					controller: this
				}).then((oFrag) => {
					oView.addDependent(oFrag);
					return oFrag;
				});
				return this._fragments[sName];
			}
			else {
				return null;
			}
		},

		_afterLoadFragments: async function () {
			// enable view attachment at claim summary
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (oClaimSubmissionModel && oClaimSubmissionModel.getProperty("/claim_header/attachment_email_approver")) {
				this.byId("button_claimsummary_viewattachment").setEnabled(true);
			}

			// enable additional functionality if 1 or more claim items exist
			if (oClaimSubmissionModel) {
				this._setEnabledToolbarFooter();

				// disable footer buttons if claim already cancelled
				this.updateFooterState();

				// set view-only features
				if (!oClaimSubmissionModel.getProperty("/view_only")) {
					if (
						oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.DRAFT &&
						oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.SEND_BACK
					) {
						oClaimSubmissionModel.setProperty("/view_only", true)
					}
				}
				if (oClaimSubmissionModel.getProperty("/view_only")) {
					this._setClaimItemTableToolbar(false);
				}

				// show approval log fragment for non-draft
				if (oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.DRAFT &&
					oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.SEND_BACK) {
					this._setApprovalLog(true);
					//this._displayFooterButtons("claimsubmission_view");
					this.updateFooterState(this._oConstant.ClaimFooterMode.VIEW_ONLY);

					// display approval log data
					const oApprovalLogModel = this.getOwnerComponent().getModel('approval_log');
					const oEmployeeViewModel = this.getOwnerComponent().getModel('employee_view');
					await ApprovalLog.getApproverList(oApprovalLogModel, oEmployeeViewModel, oClaimSubmissionModel.getProperty("/claim_header/claim_id"));
					this.byId("approval_log_table")?.getBinding("rows").refresh();

					// approver view
					//// set approver view if current user is approver
					let oApprovalLogFragment = await this._getFormFragment("approval_log");
					let iApproverCount = oApprovalLogModel.getProperty("/approval")?.length || 0;
					if (oApprovalLogFragment && iApproverCount > 0 && !oClaimSubmissionModel.getProperty("/is_approver")) {
						var sUserId = this._oSessionModel.getProperty("/userId");
						if (sUserId) {
							let iItemIndex = oApprovalLogModel.getProperty("/approval").findIndex((oApproval) => oApproval.APPROVER_ID === sUserId);
							if (iItemIndex !== -1) {
								oClaimSubmissionModel.setProperty("/is_approver", true);
							}
						}
					}
					//// change screen details if approver
					if (oClaimSubmissionModel.getProperty("/is_approver")) {
						// update footer buttons
						//this._displayFooterButtons("claimsubmission_approver");
						this.updateFooterState(this._oConstant.ClaimFooterMode.APPROVER);
					}
				}
				else {
					// ensure footer buttons display default 
					//this._displayFooterButtons("claimsubmission_summary_claimitem");
					this.updateFooterState(this._oConstant.ClaimFooterMode.SUMMARY);
				}

			}
		},

		_loadClaimById: async function (sClaimId) {
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			const oEmployeeViewModel = await this._ensureModelReady("employee_view");
			const sId = String(sClaimId);

			const aFilters = [new Filter("CLAIM_ID", FilterOperator.EQ, sId)];

			// Header binding
			const oHeaderBinding = oEmployeeViewModel.bindList(
				"/ZEMP_CLAIM_HEADER_VIEW", // <-- adjust if different
				null,
				null,
				aFilters,
				{
					$$ownRequest: true,
					$count: true,
					$select: ["*"]
				}
			);

			// Items binding
			const oItemBinding = oEmployeeViewModel.bindList(
				"/ZEMP_CLAIM_ITEM_VIEW", // <-- adjust if different
				null,
				[new Sorter("CLAIM_SUB_ID", false)],
				aFilters,
				{
					$$ownRequest: true,
					$count: true,
					$select: ["*"]
				}
			);

			// Items Descr binding
			const oItemDescrBinding = oEmployeeViewModel.bindList(
				"/ZEMP_CLAIM_ITEM_VIEW", // <-- adjust if different
				null,
				[new Sorter("CLAIM_SUB_ID", false)],
				aFilters,
				{
					$$ownRequest: true,
					$count: true,
					$select: ["*"]
				}
			);

			try {
				BusyIndicator.show(0);

				const [aHeaderCtx, aItemCtx, aItemDCtx] = await Promise.all([
					oHeaderBinding.requestContexts(0, 1),
					oItemBinding.requestContexts(0, Infinity),
					oItemDescrBinding.requestContexts(0, Infinity)
				]);

				// Header
				const oHeaderRaw = aHeaderCtx[0]?.getObject();
				if (!oHeaderRaw) {
					var _oRouter = this.getOwnerComponent().getRouter();
					console.error("Failed to load claim submission!");
					oClaimSubmissionModel.setProperty("/claim_header", {});
					oClaimSubmissionModel.setProperty("/claim_items", []);
					oClaimSubmissionModel.setProperty("/claim_items_count", 0);
					_oRouter.navTo("ClaimStatus", {}, {}, true);
				}

				const oHeader = this._mapClaimHeaderToForm(oHeaderRaw);
				oClaimSubmissionModel.setProperty("/claim_header", oHeader);
				await this._getClaimHeaderDataDescr(oClaimSubmissionModel);

				// set view-only
				if (
					oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.DRAFT &&
					oClaimSubmissionModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.SEND_BACK
				) {
					oClaimSubmissionModel.setProperty("/view_only", true)
				}
				else {
					oClaimSubmissionModel.setProperty("/view_only", false)
				}

				// disable is_approver from claim status
				if (oClaimSubmissionModel.getProperty("/is_approver")) {
					oClaimSubmissionModel.setProperty("/is_approver", false)
				}

				// Items
				const aItems = aItemCtx.map(ctx => ctx.getObject()).map(it => ({
					// Map to the fragment's structure
					claim_id: it.CLAIM_ID,
					claim_sub_id: it.CLAIM_SUB_ID,
					claim_type_item_id: it.CLAIM_TYPE_ITEM_ID,
					percentage_compensation: it.PERCENTAGE_COMPENSATION,
					account_no: it.ACCOUNT_NO,
					amount: it.AMOUNT != null ? parseFloat(it.AMOUNT) : 0,
					attachment_file_1: it.ATTACHMENT_FILE_1,
					attachment_file_2: it.ATTACHMENT_FILE_2,
					bill_no: it.BILL_NO,
					bill_date: it.BILL_DATE,
					claim_category: it.CLAIM_CATEGORY,
					country: it.COUNTRY,
					disclaimer: it.DISCLAIMER,
					start_date: it.START_DATE,
					end_date: it.END_DATE,
					start_time: it.START_TIME,
					end_time: it.END_TIME,
					flight_class: it.FLIGHT_CLASS,
					from_location: it.FROM_LOCATION,
					from_location_office: it.FROM_LOCATION_OFFICE,
					km: it.KM,
					location: it.LOCATION,
					location_type: it.LOCATION_TYPE,
					lodging_category: it.LODGING_CATEGORY,
					lodging_address: it.LODGING_ADDRESS,
					marriage_category: it.MARRIAGE_CATEGORY,
					area: it.AREA,
					no_of_family_member: it.NO_OF_FAMILY_MEMBER,
					parking: it.PARKING,
					phone_no: it.PHONE_NO,
					rate_per_km: it.RATE_PER_KM,
					receipt_date: it.RECEIPT_DATE,
					receipt_number: it.RECEIPT_NUMBER,
					remark: it.REMARK,
					room_type: it.ROOM_TYPE,
					region: it.REGION,
					from_state_id: it.FROM_STATE_ID,
					to_state_id: it.TO_STATE_ID,
					to_location: it.TO_LOCATION,
					to_location_office: it.TO_LOCATION_OFFICE,
					toll: it.TOLL,
					total_exp_amount: it.TOTAL_EXP_AMOUNT,
					vehicle_type: it.VEHICLE_TYPE,
					vehicle_fare: it.VEHICLE_FARE,
					trip_start_date: it.TRIP_START_DATE,
					trip_end_date: it.TRIP_END_DATE,
					event_start_date: it.EVENT_START_DATE,
					event_end_date: it.EVENT_END_DATE,
					travel_duration_day: it.TRAVEL_DURATION_DAY,
					travel_duration_hour: it.TRAVEL_DURATION_HOUR,
					provided_breakfast: it.PROVIDED_BREAKFAST,
					provided_lunch: it.PROVIDED_LUNCH,
					provided_dinner: it.PROVIDED_DINNER,
					entitled_breakfast: it.ENTITLED_BREAKFAST,
					entitled_lunch: it.ENTITLED_LUNCH,
					entitled_dinner: it.ENTITLED_DINNER,
					anggota_id: it.ANGGOTA_ID,
					anggota_name: it.ANGGOTA_NAME,
					dependent_name: it.DEPENDENT_NAME,
					type_of_professional_body: it.TYPE_OF_PROFESSIONAL_BODY,
					disclaimer_galakan: it.DISCLAIMER_GALAKAN,
					mode_of_transfer: it.MODE_OF_TRANSFER,
					transfer_date: it.TRANSFER_DATE,
					no_of_days: it.NO_OF_DAYS,
					family_count: it.FAMILY_COUNT,
					funeral_transportation: it.FUNERAL_TRANSPORTATION,
					round_trip: it.ROUND_TRIP,
					trip_end_time: it.TRIP_END_TIME,
					trip_start_time: it.TRIP_START_TIME,
					cost_center: it.COST_CENTER,
					gl_account: it.GL_ACCOUNT,
					material_code: it.MATERIAL_CODE,
					vehicle_ownership_id: it.VEHICLE_OWNERSHIP_ID,
					actual_amount: it.ACTUAL_AMOUNT,
					arrival_time: it.ARRIVAL_TIME,
					claim_type_id: it.CLAIM_TYPE_ID,
					course_title: it.COURSE_TITLE,
					currency_amount: it.CURRENCY_AMOUNT,
					currency_code: it.CURRENCY_CODE,
					currency_rate: it.CURRENCY_RATE,
					departure_time: it.DEPARTURE_TIME,
					dependent: it.DEPENDENT,
					dependent_relationship: it.DEPENDENT_RELATIONSHIP,
					emp_id: it.EMP_ID,
					fare_type_id: it.FARE_TYPE_ID,
					insurance_cert_end_date: it.INSURANCE_CERT_END_DATE,
					insurance_cert_start_date: it.INSURANCE_CERT_START_DATE,
					insurance_package_id: it.INSURANCE_PACKAGE_ID,
					insurance_provider_id: it.INSURANCE_PROVIDER_ID,
					insurance_provider_name: it.INSURANCE_PROVIDER_NAME,
					insurance_purchase_date: it.INSURANCE_PURCHASE_DATE,
					meter_cube_actual: it.METER_CUBE_ACTUAL,
					meter_cube_entitled: it.METER_CUBE_ENTITLED,
					mobile_category_purpose_id: it.MOBILE_CATEGORY_PURPOSE_ID,
					need_foreign_currency: it.NEED_FOREIGN_CURRENCY,
					policy_number: it.POLICY_NUMBER,
					purpose: it.PURPOSE,
					request_approval_amount: it.REQUEST_APPROVAL_AMOUNT,
					study_levels_id: it.STUDY_LEVELS_ID,
					travel_days_id: it.TRAVEL_DAYS_ID,
					vehicle_class_id: it.VEHICLE_CLASS_ID,
					descr: {},
				}));

				// Only overwrite header totals if header had null/0 (tweak to your preference)
				if (!oHeader.total_claim_amount) {
					// Derive totals from items (just in case)
					const nTotal = aItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

					oClaimSubmissionModel.setProperty("/claim_header/total_claim_amount", nTotal);
				}

				oClaimSubmissionModel.setProperty("/claim_items", aItems);
				oClaimSubmissionModel.setProperty("/claim_items_count", aItems.length);

				// Items (descriptions)
				const aItemsD = aItemDCtx.map(ctx => ctx.getObject()).map(it => ({
					// Provide `descr/*` fields the fragment uses
					claim_type_item_id: it.CLAIM_TYPE_ITEM_DESC,
					claim_category: it.CLAIM_CATEGORY_DESC,
					country: it.COUNTRY_DESC,
					flight_class: it.FLIGHT_CLASS_DESC,
					from_location_office: null,
					location_type: it.LOC_TYPE_DESC,
					lodging_category: it.LODGING_CATEGORY_DESC,
					marriage_category: it.MARRIAGE_CATEGORY_DESC,
					area: it.AREA_DESC,
					rate_per_km: null,
					room_type: it.ROOM_TYPE_DESC,
					region: it.REGION_DESC,
					from_state_id: null,
					to_state_id: null,
					to_location_office: null,
					vehicle_type: it.VEHICLE_TYPE_DESC,
					type_of_professional_body: null,
					mode_of_transfer: null,
					no_of_days: null,
					funeral_transportation: null,
					material_code: null,
					vehicle_ownership_id: it.VEHICLE_OWNERSHIP_DESC,
					dependent: null,
					dependent_relationship: null,
					fare_type_id: null,
					insurance_package_id: null,
					insurance_provider_id: null,
					meter_cube_entitled: null,
					mobile_category_purpose_id: null,
					study_levels_id: null,
					claim_type_id: it.CLAIM_TYPE_DESC,
					vehicle_class_id: null,
					attachment_file_1: null,
					attachment_file_2: null,
				}));

				// assign description based on claim item index
				oClaimSubmissionModel.getProperty("/claim_items").forEach(function (claim_item, i) {
					oClaimSubmissionModel.setProperty("/claim_items/" + i + "/descr", aItemsD[i]);
				});

				// set employee data
				const emp_data = await this._getEmpIdDetail(this._oSessionModel.getProperty("/userId"));
				if (emp_data) {
					oClaimSubmissionModel.setProperty("/emp_master", emp_data);
					await this._getEmpDataDescr(oClaimSubmissionModel);
				}

				return { header: oHeaderRaw, items: aItems };
			} catch (err) {
				console.error("Failed to load claim header/items:", err);
				oClaimSubmissionModel.setProperty("/claim_header", {});
				oClaimSubmissionModel.setProperty("/claim_items", []);
				oClaimSubmissionModel.setProperty("/claim_items_count", 0);
				return { header: null, items: [] };
			} finally {
				BusyIndicator.hide();
			}
		},

		_ensureModelReady: async function (sName) {
			const oModel = await this._waitForModel(sName);
			// V4 meta ready
			if (oModel?.getMetaModel?.()?.requestObject) {
				try {
					await oModel.getMetaModel().requestObject("/$EntityContainer");
				} catch (e) {
					// swallow; some backends may restrict $EntityContainer; any requestObject call will do
					await oModel.getMetaModel().requestObject("/");
				}
				return oModel;
			}
			// V2 meta ready
			if (oModel?.metadataLoaded) {
				await oModel.metadataLoaded();
			}
			return oModel;
		},

		_waitForModel: function (sName) {
			return new Promise((resolve) => {
				const check = () => {
					const m = this.getOwnerComponent().getModel(sName);
					if (m) {
						resolve(m);
					} else {
						setTimeout(check, 40);
					}
				};
				check();
			});
		},

		_mapClaimHeaderToForm: function (o) {
			return {
				claim_id: o.CLAIM_ID,
				emp_id: o.EMP_ID,
				purpose: o.PURPOSE,
				trip_start_date: o.TRIP_START_DATE,
				trip_end_date: o.TRIP_END_DATE,
				event_start_date: o.EVENT_START_DATE,
				event_end_date: o.EVENT_END_DATE,
				submission_type: o.SUBMISSION_TYPE,
				comment: o.COMMENT,
				alternate_cost_center: o.ALTERNATE_COST_CENTER,
				cost_center: o.COST_CENTER,
				request_id: o.REQUEST_ID,
				attachment_email_approver: o.ATTACHMENT_EMAIL_APPROVER,
				status_id: o.STATUS_ID,
				claim_type_id: o.CLAIM_TYPE_ID,
				total_claim_amount: o.TOTAL_CLAIM_AMOUNT,
				final_amount_to_receive: o.FINAL_AMOUNT_TO_RECEIVE,
				last_modified_date: o.LAST_MODIFIED_DATE,
				submitted_date: o.SUBMITTED_DATE,
				last_approved_date: o.LAST_APPROVED_DATE,
				last_approved_time: o.LAST_APPROVED_TIME,
				payment_date: o.PAYMENT_DATE,
				location: o.LOCATION,
				spouse_office_address: o.SPOUSE_OFFICE_ADDRESS,
				house_completion_date: o.HOUSE_COMPLETION_DATE,
				move_in_date: o.MOVE_IN_DATE,
				housing_loan_scheme: o.HOUSING_LOAN_SCHEME,
				lender_name: o.LENDER_NAME,
				specify_details: o.SPECIFY_DETAILS,
				new_house_address: o.NEW_HOUSE_ADDRESS,
				dist_old_house_to_office_km: o.DIST_OLD_HOUSE_TO_OFFICE_KM,
				dist_old_house_to_new_house_km: o.DIST_OLD_HOUSE_TO_NEW_HOUSE_KM,
				approver1: null,
				approver2: null,
				approver3: null,
				approver4: null,
				approver5: null,
				last_send_back_date: null,
				course_code: null,
				project_code: null,
				cash_advance_amount: o.CASH_ADVANCE_AMOUNT,
				preapproved_amount: o.PREAPPROVED_AMOUNT,
				reject_reason_id: null,
				send_back_reason_id: null,
				last_send_back_time: null,
				reject_reason_date: null,
				reject_reason_time: null,
				descr: {
					submission_type: null,
					alternate_cost_center: o.ALT_COST_CENTER_DESC,
					cost_center: o.COST_CENTER_DESC,
					request_id: null,
					status_id: o.STATUS_DESC,
					claim_type_id: o.CLAIM_TYPE_DESC,
					housing_loan_scheme: null,
					lender_name: null,
					course_code: null,
					project_code: null,
					attachment_email_approver: null,
				}
			};
		},

		_getClaimHeaderDataDescr: async function (oModel) {
			// submission type
			if (oModel.getProperty("/claim_header/submission_type")) {
				oModel.setProperty("/claim_header/descr/submission_type", await this._bindEclaimDescr("/ZSUBMISSION_TYPE", oModel.getProperty("/claim_header/submission_type"), 'SUBMISSION_TYPE_ID', 'SUBMISSION_TYPE_DESC'));
			}
			// request ID
			if (oModel.getProperty("/claim_header/request_id")) {
				oModel.setProperty("/claim_header/descr/request_id", await this._bindEclaimDescr("/ZREQUEST_HEADER", oModel.getProperty("/claim_header/request_id"), 'REQUEST_ID', 'OBJECTIVE_PURPOSE'));
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

		async _getEmpIdDetail(sEEID) {
			const oModel = this.getOwnerComponent().getModel();
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
				new Filter("EEID", FilterOperator.EQ, sEEID)
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
					console.warn("No employee found with employee ID: " + sEEID);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; // Return null so the app doesn't crash
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

		_setApprovalLog: async function (bCheckPage) {
			var oPage = this.byId("page_claimsubmission");
			if (bCheckPage) {
				// display approval log
				await this._getFormFragment("approval_log", true).then(function (oVBox) {
					oPage.insertContent(oVBox, 2);
				});
			}
			else {
				// remove approval log
				var oApprovalLogFragment = await this._getFormFragment("approval_log");
				if (oApprovalLogFragment) {
					oPage.removeContent(oApprovalLogFragment);
				}
			}
		},

		/* _setClaimItemTableToolbar: function (oBool) {
			var oPage = this.byId("page_claimsubmission");
			if (oBool) {
				// table changes
				if (this.byId("button_claimsummary_edit")) {
					//// hide buttons
					if (!this.byId("button_claimsummary_createclaim").getVisible()) { this.byId("button_claimsummary_createclaim").setVisible(true); }
					if (!this.byId("button_claimsummary_edit").getVisible()) { this.byId("button_claimsummary_edit").setVisible(true); }
					if (!this.byId("button_claimsummary_duplicate").getVisible()) { this.byId("button_claimsummary_duplicate").setVisible(true); }
					if (!this.byId("button_claimsummary_delete").getVisible()) { this.byId("button_claimsummary_delete").setVisible(true); }
				}

				// table properties
				if (this.byId("table_claimsummary_claimitem")) {
					this.byId("table_claimsummary_claimitem").setMode(ListMode.MultiSelect);
				}
			}
			else {
				// table changes
				if (this.byId("button_claimsummary_edit")) {
					//// hide buttons
					if (this.byId("button_claimsummary_createclaim").getVisible()) { this.byId("button_claimsummary_createclaim").setVisible(false); }
					if (this.byId("button_claimsummary_edit").getVisible()) { this.byId("button_claimsummary_edit").setVisible(false); }
					if (this.byId("button_claimsummary_duplicate").getVisible()) { this.byId("button_claimsummary_duplicate").setVisible(false); }
					if (this.byId("button_claimsummary_delete").getVisible()) { this.byId("button_claimsummary_delete").setVisible(false); }
				}

				// table properties
				if (this.byId("table_claimsummary_claimitem")) {
					this.byId("table_claimsummary_claimitem").setMode(ListMode.SingleSelectMaster);
				}
			}
		}, */

		_setClaimItemTableToolbar: function (bViewCheck) {


			// ---------------------------------------------------------
			// Existing logic (now using canEdit)
			// ---------------------------------------------------------
			if (bViewCheck) {
				// SHOW buttons
				this.byId("button_claimsummary_createclaim")?.setVisible(true);
				this.byId("button_claimsummary_edit")?.setVisible(true);
				this.byId("button_claimsummary_duplicate")?.setVisible(true);
				this.byId("button_claimsummary_delete")?.setVisible(true);

				// Multi select mode
				this.byId("table_claimsummary_claimitem")?.setMode(ListMode.MultiSelect);
			} else {
				// HIDE buttons
				this.byId("button_claimsummary_createclaim")?.setVisible(false);
				this.byId("button_claimsummary_edit")?.setVisible(false);
				this.byId("button_claimsummary_duplicate")?.setVisible(false);
				this.byId("button_claimsummary_delete")?.setVisible(false);

				// Single select when not editable
				this.byId("table_claimsummary_claimitem")?.setMode(ListMode.SingleSelectMaster);
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

		_getNewClaimItemModel: function (modelName) {
			// Claim Item Model
			var oClaimItemModel = new JSONModel({
				"is_new": false,
				"screen_array": [],
				"claim_item": {
					"claim_id": null,
					"claim_sub_id": null,
					"claim_type_item_id": null,
					"percentage_compensation": null,
					"account_no": null,
					"amount": null,
					"attachment_file_1": null,
					"attachment_file_2": null,
					"bill_no": null,
					"bill_date": null,
					"claim_category": null,
					"country": null,
					"disclaimer": null,
					"start_date": null,
					"end_date": null,
					"start_time": null,
					"end_time": null,
					"flight_class": null,
					"from_location": null,
					"from_location_office": null,
					"km": null,
					"location": null,
					"location_type": null,
					"lodging_category": null,
					"lodging_address": null,
					"marriage_category": null,
					"area": null,
					"no_of_family_member": null,
					"parking": null,
					"phone_no": null,
					"rate_per_km": null,
					"receipt_date": null,
					"receipt_number": null,
					"remark": null,
					"room_type": null,
					"region": null,
					"from_state_id": null,
					"to_state_id": null,
					"to_location": null,
					"to_location_office": null,
					"toll": null,
					"total_exp_amount": null,
					"vehicle_type": null,
					"vehicle_fare": null,
					"trip_start_date": null,
					"trip_end_date": null,
					"event_start_date": null,
					"event_end_date": null,
					"travel_duration_day": null,
					"travel_duration_hour": null,
					"provided_breakfast": null,
					"provided_lunch": null,
					"provided_dinner": null,
					"entitled_breakfast": null,
					"entitled_lunch": null,
					"entitled_dinner": null,
					"anggota_id": null,
					"anggota_name": null,
					"dependent_name": null,
					"type_of_professional_body": null,
					"disclaimer_galakan": null,
					"mode_of_transfer": null,
					"transfer_date": null,
					"no_of_days": null,
					"family_count": null,
					"funeral_transportation": null,
					"round_trip": null,
					"trip_end_time": null,
					"trip_start_time": null,
					"cost_center": null,
					"gl_account": null,
					"material_code": null,
					"vehicle_ownership_id": null,
					"actual_amount": null,
					"arrival_time": null,
					"claim_type_id": null,
					"course_title": null,
					"currency_amount": null,
					"currency_code": null,
					"currency_rate": null,
					"departure_time": null,
					"dependent": null,
					"dependent_relationship": null,
					"emp_id": null,
					"fare_type_id": null,
					"insurance_cert_end_date": null,
					"insurance_cert_start_date": null,
					"insurance_package_id": null,
					"insurance_provider_id": null,
					"insurance_provider_name": null,
					"insurance_purchase_date": null,
					"meter_cube_actual": null,
					"meter_cube_entitled": null,
					"mobile_category_purpose_id": null,
					"need_foreign_currency": null,
					"policy_number": null,
					"purpose": null,
					"request_approval_amount": null,
					"study_levels_id": null,
					"travel_days_id": null,
					"vehicle_class_id": null,
					"descr": {
						"claim_type_item_id": null,
						"claim_category": null,
						"country": null,
						"flight_class": null,
						"from_location_office": null,
						"location_type": null,
						"lodging_category": null,
						"marriage_category": null,
						"area": null,
						"rate_per_km": null,
						"room_type": null,
						"region": null,
						"from_state_id": null,
						"to_state_id": null,
						"to_location_office": null,
						"vehicle_type": null,
						"type_of_professional_body": null,
						"mode_of_transfer": null,
						"no_of_days": null,
						"funeral_transportation": null,
						"material_code": null,
						"vehicle_ownership_id": null,
						"dependent": null,
						"dependent_relationship": null,
						"fare_type_id": null,
						"insurance_package_id": null,
						"insurance_provider_id": null,
						"meter_cube_entitled": null,
						"mobile_category_purpose_id": null,
						"study_levels_id": null,
						"claim_type_id": null,
						"vehicle_class_id": null,
						"attachment_file_1": null,
						"attachment_file_2": null,
					}
				},
				"attachments": {
					"attachment1": {
						"fileName": null,
						"fileContent": null
					},
					"attachment2": {
						"fileName": null,
						"fileContent": null
					}
				}
			});
			//// set input
			this.getView().setModel(oClaimItemModel, modelName);
			return this.getView().getModel(modelName);
		},

		onView_Claim_Attachment: function (oLevel, iFieldNumber) {
			// Write to Success Factors API
			BusyIndicator.show(0);
			if (oLevel == 'parent') {
				// get parent attachment
				var oInputModel = this.getView().getModel("claimsubmission_input");
				Attachment.onViewDocument(this, oInputModel.getProperty("/claim_header/attachment_email_approver"));
			}
			else if (oLevel == 'child') {
				// get child attachment
				oInputModel = this.getView().getModel("claimitem_input");
				var iAttachmentId = this._determineAttachmentId(oInputModel.getProperty("/claim_item/attachment_file_" + iFieldNumber));
				Attachment.onViewDocument(this, iAttachmentId);
			}
			BusyIndicator.hide();
		},

		_determineAttachmentId: function (sAttachment) {
			if (sAttachment.indexOf(' ') > 0) {
				return sAttachment.substring(0, sAttachment.indexOf(' '));
			}
			else {
				// for attachments with no filename in db
				return sAttachment;
			}
		},

		onCreateClaim_ClaimSummary: async function (indexNumber) {

			// Destroy previous detail fragment to avoid stale bindings
			if (this._fragments["claimsubmission_claimdetails_input"]) {
				const frag = await this._fragments["claimsubmission_claimdetails_input"];
				frag.destroy(true);
				delete this._fragments["claimsubmission_claimdetails_input"];
			}

			BusyIndicator.show(0);
			// show claim details screen
			var oPage = this.byId("page_claimsubmission");
			var oClaimItemFragment = await this._getFormFragment("claimsubmission_summary_claimitem");
			if (oClaimItemFragment) {
				oPage.removeContent(oClaimItemFragment);
			}
			await this._getFormFragment("claimsubmission_claimdetails_input", true).then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
			// set new claim submission model;
			if (Number.isInteger(indexNumber)) {
				this._onInit_ClaimDetails_Input(indexNumber);
			}
			else {
				this._onInit_ClaimDetails_Input();

				// initialize new item values
				var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
				var oInputModel = this.getView().getModel("claimitem_input");

				oInputModel.setProperty("/is_new", true);
				//// get claim type from claim header
				oInputModel.setProperty("/claim_item/claim_type_id", oClaimSubmissionModel.getProperty("/claim_header/claim_type_id"));
				//// get GL account
				const oModel = this.getOwnerComponent().getModel();
				var glAccount = await this._getGLAccount(oModel, oInputModel.getProperty("/claim_item/claim_type_id"));
				oInputModel.setProperty("/claim_item/gl_account", glAccount);
				//// get cost center
				var itemCc = oClaimSubmissionModel.getProperty("/claim_header/cost_center") || oClaimSubmissionModel.getProperty("/claim_header/alternate_cost_center") || null;
				oInputModel.setProperty("/claim_item/cost_center", itemCc);
				//// get descriptions
				oInputModel.setProperty("/claim_item/descr/claim_type_id", oClaimSubmissionModel.getProperty("/claim_header/descr/claim_type_id"));
			}
			BusyIndicator.hide(0);
		},

		onAction_ClaimSummary: function (oAction) {
			// count items in table
			var table = this.getView().byId("table_claimsummary_claimitem");
			if (table) {
				// dont proceed if no items selected
				if (table.getSelectedItems().length == 0) {
					MessageBox.error(Utility.getText("msg_claimsummary_noitem"));
					return;
				}

				// get action
				switch (oAction) {
					//// Edit
					case 'Edit':
						// only allow one item selection
						if (table.getSelectedItems().length > 1) {
							MessageBox.error(Utility.getText("msg_claimsummary_singleitem"));
							return;
						}
						else {
							this.onEdit_ClaimSummary(table.getSelectedItem());
						}
						break;
					//// Duplicate
					case 'Duplicate':
						// only allow one item selection
						if (table.getSelectedItems().length > 1) {
							MessageBox.error(Utility.getText("msg_claimsummary_singleitem"));
							return;
						}
						else {
							// confirm dialog
							this._newDialog(
								Utility.getText("dialog_claimsummary_duplicate"),
								Utility.getText("label_claimsummary_duplicate"),
								async function () {
									await this.onDuplicate_ClaimSummary(table.getSelectedItem());
									table.removeSelections(true);
								}.bind(this)
							);
						}
						break;
					//// Delete
					case 'Delete':
						// confirm dialog
						this._newDialog(
							Utility.getText("dialog_claimsummary_delete"),
							Utility.getText("label_claimsummary_delete"),
							async function () {
								await this.onDelete_ClaimSummary(table.getSelectedItems());
								table.removeSelections(true);
							}.bind(this)
						);
						break;
					default:
						MessageBox.error(Utility.getText("msg_claimsummary_noaction"));
						break;
				}
			}
			else {
				MessageBox.error(Utility.getText("msg_claimsummary_notable"));
			}
		},

		//Check duplication
		onSelectionChange_ClaimSummary: function () {
			var oTable = this.byId("table_claimsummary_claimitem");
			var aSelected = oTable.getSelectedItems();

			// Enable Duplicate only when exactly 1 item selected
			this.byId("button_claimsummary_duplicate").setEnabled(aSelected.length === 1);

			// Enable Edit only when exactly 1 item selected
			this.byId("button_claimsummary_edit").setEnabled(aSelected.length === 1);

		},


		onEdit_ClaimSummary: function (oItem) {
			var itemSubId;
			var oInputModel = this.getView().getModel("claimsubmission_input");
			// get value from selected item
			itemSubId = oItem.getCells()[0].getText();
			let iItemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
			if (iItemIndex !== -1) {
				this.onCreateClaim_ClaimSummary(iItemIndex);
			}
		},

		onItemPress_ClaimSubmission: function (oEvent) {
			var oInputModel = this.getView().getModel("claimsubmission_input");
			if (!oInputModel.getProperty("/view_only")) {
				return;
			}

			var table = this.getView().byId("table_claimsummary_claimitem");
			var item = table.getSelectedItem();

			// get value from selected items
			var itemSubId;
			itemSubId = item.getCells()[0].getText();
			let iItemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
			if (iItemIndex !== -1) {
				this.onCreateClaim_ClaimSummary(iItemIndex);
			}
		},

		onDuplicate_ClaimSummary: async function (oItem) {
			var itemSubId;
			var oInputModel = this.getView().getModel("claimsubmission_input");
			var tempItems = {
				claim_items: oInputModel.getProperty("/claim_items"),
				total_claim_amount: oInputModel.getProperty("/claim_header/total_claim_amount")
			};
			// get value from selected item
			itemSubId = oItem.getCells()[0].getText();
			let iItemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
			if (iItemIndex !== -1) {
				var oObject = oInputModel.getProperty("/claim_items/" + iItemIndex);
				oInputModel.setProperty("/claim_items", oInputModel.getProperty("/claim_items").concat(structuredClone(oObject)));
				var addrIndex = "/claim_items/" + (oInputModel.getProperty("/claim_items").length - 1);
				oInputModel.setProperty(
					addrIndex + "/claim_sub_id",
					(oInputModel.getProperty("/claim_items/" + (oInputModel.getProperty("/claim_items").length - 1) + "/claim_id") ?? "") + ('' + '00' + (oInputModel.getProperty("/claim_items").length)).slice(-3)
				);
				oInputModel.setProperty("/claim_items_count", oInputModel.getProperty("/claim_items").length);

				// reset values
				//// amount
				oInputModel.setProperty(addrIndex + "/amount", 0);
				//// start/end dates
				oInputModel.setProperty(addrIndex + "/start_date", null);
				oInputModel.setProperty(addrIndex + "/end_date", null);
				oInputModel.setProperty(addrIndex + "/trip_start_date", null);
				oInputModel.setProperty(addrIndex + "/trip_end_date", null);
				oInputModel.setProperty(addrIndex + "/event_start_date", null);
				oInputModel.setProperty(addrIndex + "/event_end_date", null);

				// calculate new total
				const nTotal = oInputModel.getProperty("/claim_items").reduce((s, it) => s + (Number(it.amount) || 0), 0);
				oInputModel.setProperty("/claim_header/total_claim_amount", nTotal);
			}

			// update to database
			var updateSuccess = await this._updateClaimItems();
			if (!updateSuccess) {
				// recover previous claim item list
				oInputModel.setProperty("/claim_items", tempItems.claim_items);
				oInputModel.setProperty("/claim_items_count", tempItems.claim_items.length);
				oInputModel.setProperty("/claim_header/total_claim_amount", tempItems.total_claim_amount);
			}

			// refresh table
			this.byId("table_claimsummary_claimitem").getBinding("items").refresh();
			BusyIndicator.hide();
		},

		onDelete_ClaimSummary: async function (aItems) {
			var itemSubId;
			var oInputModel = this.getView().getModel("claimsubmission_input");
			var tempItems = {
				claim_items: oInputModel.getProperty("/claim_items"),
				total_claim_amount: oInputModel.getProperty("/claim_header/total_claim_amount")
			};
			// get value from selected items
			jQuery.each(aItems,
				function (id, value) {
					itemSubId = value.getCells()[0].getText();
					let iItemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
					if (iItemIndex !== -1) {
						if (oInputModel.getProperty("/claim_items").length > 1) {
							oInputModel.getProperty("/claim_items").splice(iItemIndex, 1);
							oInputModel.setProperty("/claim_items_count", oInputModel.getProperty("/claim_items").length);
						}
						else {
							oInputModel.setProperty("/claim_items", []);
						}
					}
				}
			);

			// update claim sub item number
			oInputModel.getProperty("/claim_items").forEach(function (claim_item, i) {
				oInputModel.setProperty(
					"/claim_items/" + i + "/claim_sub_id",
					(oInputModel.getProperty("/claim_items/" + i + "/claim_id") ?? "") + ('' + '00' + (i + 1)).slice(-3)
				);
			});

			// calculate new total
			const nTotal = oInputModel.getProperty("/claim_items").reduce((s, it) => s + (Number(it.amount) || 0), 0);
			oInputModel.setProperty("/claim_header/total_claim_amount", nTotal);
			oInputModel.setProperty("/claim_header/final_amount_to_receive", nTotal);

			// update to database
			var updateSuccess = await this._updateClaimItems();
			if (!updateSuccess) {
				// recover previous claim item list
				oInputModel.setProperty("/claim_items", tempItems.claim_items);
				oInputModel.setProperty("/claim_items_count", tempItems.claim_items.length);
				oInputModel.setProperty("/claim_header/total_claim_amount", tempItems.total_claim_amount);
			}

			// refresh table
			this.byId("table_claimsummary_claimitem").getBinding("items").refresh();
		},

		onAction_ClaimSubmission_Toolbar: function (oAction) {
			// get action
			switch (oAction) {
				//// Save Draft
				case 'Save Draft':
					// confirm dialog
					this._newDialog(
						Utility.getText("dialog_claimsubmission_savedraft"),
						Utility.getText("label_claimsubmission_savedraft"),
						function () {
							this._updateClaimSubmission(oAction);
						}.bind(this)
					);
					break;
				//// Delete Report
				case 'Delete Report':
					// confirm dialog
					this._newDialog(
						Utility.getText("dialog_claimsubmission_deletereport"),
						Utility.getText("label_claimsubmission_deletereport"),
						function () {
							this._updateClaimSubmission(oAction);
						}.bind(this)
					);
					break;
				//// Submit Report
				case 'Submit Report':

					//Add checker for Trip End date greater than current date;
					var oInputModel = this.getView().getModel("claimsubmission_input");
					var sTripEndDate = oInputModel.getProperty("/claim_header/trip_end_date");


					if (DateUtility.isFutureDate(sTripEndDate)) {
						MessageBox.error(Utility.getText("msg_claimsubmit_datecheck"));
						return;
					}

					// confirm dialog
					this._newDialog(
						Utility.getText("dialog_claimsubmission_submitreport"),
						Utility.getText("label_claimsubmission_submitreport"),
						function () {
							this._updateClaimSubmission(oAction);
						}.bind(this)
					);
					break;
				//// Back
				case 'Back':
					var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
					this.onBack_ClaimSubmission();
					break;
				//// Reject
				case 'Reject': {

					// Ensure form model
					let oReject = this.getView().getModel("Reject");
					if (!oReject) {
						oReject = new JSONModel({ rejectReasonKey: "", approvalComment: "" });
						this.getView().setModel(oReject, "Reject");
					} else {
						oReject.setProperty("/rejectReasonKey", "");
						oReject.setProperty("/approvalComment", "");
					}

					// Ensure UI state model (Claim)
					let oType = this.getView().getModel("Type");
					if (!oType) {
						oType = new JSONModel({ mode: "" });
						this.getView().setModel(oType, "Type");
					}
					oType.setProperty("/mode", "REJECT_CLAIM");

					try {
						RejectDialog.open(this);
					} catch (e) {
						MessageBox.error("Failed to open Reject Dialog:\n" + (e?.message || e));
					}
					break;
				}

				//// Back to Employee
				case 'Back to Employee':

					{
						// 1) Ensure Reject model (form data: reason + comment)
						let oReject = this.getView().getModel("Reject");
						if (!oReject) {
							oReject = new JSONModel({
								sendBackReasonKey: "",
								approvalComment: ""
							});
							this.getView().setModel(oReject, "Reject");
						} else {
							// clear previous values each time you open
							oReject.setProperty("/sendBackReasonKey", "");
							oReject.setProperty("/approvalComment", "");
						}

						// 2) Ensure Type model (UI state: dialog mode)
						let oType = this.getView().getModel("Type");
						if (!oType) {
							oType = new JSONModel({ mode: "" });
							this.getView().setModel(oType, "Type");
						}
						oType.setProperty("/mode", "SENDBACK_CLAIM");  // <<< IMPORTANT

						// 3) Open SendBackDialog (not ApproveDialog)
						try {
							SendBackDialog.open(this);
						} catch (e) {
							MessageBox.error("Failed to open Send Back Dialog:\n" + (e?.message || e));
						}
					}
					break;

				//// Approve


				case 'Approve': {
					let oReject = this.getView().getModel("Reject");
					if (!oReject) {
						oReject = new JSONModel({ approvalComment: "" });
						this.getView().setModel(oReject, "Reject");
					}
					oReject.setProperty("/approvalComment", "");

					let oType = this.getView().getModel("Type");
					if (!oType) {
						oType = new JSONModel({ mode: "" });
						this.getView().setModel(oType, "Type");
					}
					oType.setProperty("/mode", "APPROVE_CLAIM");

					ApproveDialog.open(this);
				}
					break;


			}
		},

		// Aiman Salim - 14/03/2026 - For Approval Process. 

		onClickCancel_app: function () {
			// Close via the stored instance (ApproveDialog keeps it on controller as __approveDialog)
			if (this._approveDialog) {
				this._approveDialog.close();
			}
			if (this._sendBackDialog) { this._sendBackDialog.close(); }
			if (this._rejectDialog) { this._rejectDialog.close(); }
		},
		//Button config for Approve
		onClickCreate_app: async function () {


			if (this.bIsApproving) {
				return;
			}

			this.bIsApproving = true;

			try {
				const oReject = this.getView().getModel("Reject");
				const sMode = this.getView().getModel("Type")?.getProperty("/mode");
				const sComment = oReject?.getProperty("/approvalComment")?.trim();
				const sUserId = this._oSessionModel.getProperty("/userId");
				const oClaimModel = this.getView().getModel("claimsubmission_input");
				const sClaimId = oClaimModel?.getProperty("/claim_header/claim_id")?.trim();

				if (sMode !== this._oConstant.ApprovalProcess.CLAIM_APPROVE) {
					return;
				}

				if (!sComment) {
					MessageBox.error(Utility.getText("msg_claimapprover_comment"));
					return;
				}

				try {

					BusyIndicator.show(0);

					const oModel = this.getOwnerComponent().getModel();
					const oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");

					const { payloads: aPayloadEmail, sMessageKey } = await ApproverUtility.approveMultiLevel(
						oModel,
						sClaimId,
						sUserId,
						sComment,
						oEmployeeViewModel,
						this
					);

					if (Array.isArray(aPayloadEmail) && aPayloadEmail.length > 0) {
						for (const oPayloadEmail of aPayloadEmail) {
							await workflowApproval.onSendEmailApprover(oModel, oPayloadEmail);
						}
					}
					MessageToast.show(sMessageKey);
					if (this._oApproveDialog) {
						this._oApproveDialog.close();
					}

					setTimeout(() => {
						this._fnGoToDashboard();
					}, 400);

				} catch (oErrorMessage) {
					MessageBox.error(Utility.getText(oErrorMessage.sCode));
					setTimeout(() => {
						this._fnGoToDashboard();
					}, 400);
				} finally {
					BusyIndicator.hide();
				}

			} catch (oErrorApprove) {
				MessageBox.error(Utility.getText("msg_claimapprover_fail"));
				return;

			} finally {
				this.bIsApproving = false;
			}

		},

		//Button config for Reject
		onReject_ClaimSubmission: async function () {

			const oReject = this.getView().getModel("Reject");
			const sReason = oReject?.getProperty("/rejectReasonKey");
			const sComment = oReject?.getProperty("/approvalComment")?.trim();

			if (!sReason) {
				MessageBox.error(Utility.getText("msg_claimapprover_reject"));
				return;
			}

			if (!sComment) {
				MessageBox.error(Utility.getText("msg_claimapprover_comment"));
				return;
			}

			try {
				BusyIndicator.show(0);

				const oModelMain = this.getOwnerComponent().getModel();
				const oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");
				const sUserId = this._oSessionModel.getProperty("/userId");

				const oClaimModel = this.getView().getModel("claimsubmission_input");
				const sClaimId = oClaimModel?.getProperty("/claim_header/claim_id")?.trim();

				const sRejectStatus = this._oConstant.ClaimStatus.REJECTED; // REJECT

				const {
					payloads: aPayloads,
					dataset: aDataset,
					submissionType: sSubmissionType,
					sMessageKey
				} = await ApproverUtility.rejectOrSendBackMultiLevel(
					oModelMain,
					sClaimId,
					sUserId,
					sRejectStatus,
					sReason,
					sComment,
					oEmployeeViewModel,
					this
				);
				/** Commenting budgetProcessing as it will be replaced by backend function from Jefry 
				await budgetCheck.budgetProcessing(
					oModelMain,
					aDataset,
					sSubmissionType,
					this._oConstant.ApprovalProcessAction.RELEASE_IND
				);
				*/
				const sSubmissionType2 = sClaimId.substring(0, 3);
				try {
					const aResult = await budgetCheck.backendBudgetChecking(this, sSubmissionType2, Constants.BudgetCheckAction.REJECT);
				} catch (oError) {

				}
				for (const oPayload of aPayloads) {
					await workflowApproval.onSendEmailApprover(oModelMain, oPayload);
				}

				MessageToast.show(sMessageKey);
				if (this._oRejectDialog) {
					this._oRejectDialog.close();
				}
				setTimeout(() => {
					this._fnGoToDashboard();
				}, 400);
			} catch (oErrorReject) {
				MessageBox.error(Utility.getText(oErrorReject.sCode));
				setTimeout(() => {
					this._fnGoToDashboard();
				}, 400);
			} finally {
				BusyIndicator.hide();
			}
		},
		//Button config for Send Back
		onSendBack_ClaimSubmission: async function () {

			const oReject = this.getView().getModel("Reject");
			const sReason = oReject?.getProperty("/sendBackReasonKey");
			const sComment = oReject?.getProperty("/approvalComment")?.trim();

			if (!sReason) {
				MessageBox.error(Utility.getText("msg_claimapprover_sendback"));
				return;
			}

			if (!sComment) {
				MessageBox.error(Utility.getText("msg_claimapprover_comment"));
				return;
			}

			try {
				BusyIndicator.show(0);

				const oModelMain = this.getOwnerComponent().getModel();
				const oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");
				const sUserId = this._oSessionModel.getProperty("/userId");

				const oClaimModel = this.getView().getModel("claimsubmission_input");
				const sClaimId = oClaimModel?.getProperty("/claim_header/claim_id")?.trim();

				const sSendBackStatus = this._oConstant.ClaimStatus.SEND_BACK;

				const {
					payloads: aPayloads,
					dataset: aDataset,
					submissionType: sSubmissionType,
					sMessageKey
				} = await ApproverUtility.rejectOrSendBackMultiLevel(
					oModelMain,
					sClaimId,
					sUserId,
					sSendBackStatus,
					sReason,
					sComment,
					oEmployeeViewModel,
					this
				);

				/** Commenting budgetProcessing as it will be replaced by backend function from Jefry 
				await budgetCheck.budgetProcessing(
					oModelMain,
					aDataset,
					sSubmissionType,
					this._oConstant.ApprovalProcessAction.RELEASE_IND
				);
				*/


				const sSubmissionType2 = sClaimId.substring(0, 3);
				try {
					const aResult = await budgetCheck.backendBudgetChecking(this, sSubmissionType2, Constants.BudgetCheckAction.REJECT);
				} catch (oError) {

				}


				for (const oPayload of aPayloads) {
					await workflowApproval.onSendEmailApprover(oModelMain, oPayload);
				}
				MessageToast.show(sMessageKey);
				if (this._oSendBackDialog) {
					this._oSendBackDialog.close();
				}
				setTimeout(() => {
					this._fnGoToDashboard();
				}, 400);



			} catch (oErrorSendBack) {
				MessageBox.error(Utility.getText(oErrorSendBack.sCode));
				setTimeout(() => {
					this._fnGoToDashboard();
				}, 400);
			} finally {
				BusyIndicator.hide();
			}
		},


		_fnGoToDashboard: function () {
			const oRouter = this.getOwnerComponent().getRouter();
			this._clearExit = true;    // If you use this flag in your pattern
			oRouter.navTo("Dashboard", {}, true);
		},


		//End Approval



		// Example: wire this to your "Back to Employee" or "Send Back" action
		onOpenSendBack_Claim: function () {
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
			oType.setProperty("/mode", "SENDBACK_CLAIM");

			SendBackDialog.open(this);
		},


		_setEnabledToolbarFooter: function () {
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (oClaimSubmissionModel && oClaimSubmissionModel.getProperty("/claim_items_count") && (Number.parseInt(oClaimSubmissionModel.getProperty("/claim_items_count")) > 0)) {
				//// Edit
				if (this.byId("button_claimsummary_edit").getVisible() && !this.byId("button_claimsummary_edit").getEnabled()) {
					this.byId("button_claimsummary_edit").setEnabled(true);
				}
				//// Duplicate
				if (this.byId("button_claimsummary_duplicate").getVisible() && !this.byId("button_claimsummary_duplicate").getEnabled()) {
					this.byId("button_claimsummary_duplicate").setEnabled(true);
				}
				//// Delete
				if (this.byId("button_claimsummary_delete").getVisible() && !this.byId("button_claimsummary_delete").getEnabled()) {
					this.byId("button_claimsummary_delete").setEnabled(true);
				}
				//// Submit Report
				if (this.byId("button_claimsubmission_submitreport").getVisible() && !this.byId("button_claimsubmission_submitreport").getEnabled()) {
					this.byId("button_claimsubmission_submitreport").setEnabled(true);
				}
			}
			else {
				//// Edit
				if (this.byId("button_claimsummary_edit").getVisible() && this.byId("button_claimsummary_edit").getEnabled()) {
					this.byId("button_claimsummary_edit").setEnabled(false);
				}
				//// Duplicate
				if (this.byId("button_claimsummary_duplicate").getVisible() && this.byId("button_claimsummary_duplicate").getEnabled()) {
					this.byId("button_claimsummary_duplicate").setEnabled(false);
				}
				//// Delete
				if (this.byId("button_claimsummary_delete").getVisible() && this.byId("button_claimsummary_delete").getEnabled()) {
					this.byId("button_claimsummary_delete").setEnabled(false);
				}
				//// Submit Report
				if (this.byId("button_claimsubmission_submitreport").getVisible() && this.byId("button_claimsubmission_submitreport").getEnabled()) {
					this.byId("button_claimsubmission_submitreport").setEnabled(false);
				}
			}
		},

		_getGLAccount: async function (oModel, claim_type) {

			const oListBinding = oModel.bindList("/ZCLAIM_TYPE", null, null, [
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, claim_type)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData.GL_ACCOUNT;
				} else {
					MessageBox.error(Utility.getText("msg_claimdetails_input_glaccount"));
					return "";
				}
			} catch (oError) {
				console.error("Error fetching Claim Type detail", oError);
			}

		},

		onSelect_ClaimDetails_ClaimItem: async function (oEvent) {
			// validate claim item
			var claimItem = oEvent.getParameters().selectedItem;
			var oInputModel = this.getView().getModel("claimitem_input");
			if (claimItem) {
				// Reset Location Type
				oInputModel.setProperty("/claim_item/location_type", "");

				// get material code from claim item
				var materialCode = claimItem.getBindingContext("employee").getObject("MATERIAL_CODE");
				oInputModel.setProperty("/claim_item/material_code", materialCode);
			}

			// set app visibility controls
			await this.getFieldVisibility_ClaimTypeItem();

			// When Location Type is visible but no selection yet, hide From State & To State by default
			// If show, then State will be Select but Location will be input, which inconsistent from UI
			if (this.byId("select_claimdetails_input_location_type").getVisible()) {
				this.byId("select_claimdetails_input_from_state_id")?.setVisible(false);
				this.byId("select_claimdetails_input_to_state_id")?.setVisible(false);
			}

			// set claim detail selection values
			this._setClaimDetailSelectionMaster();

			// check if provided/entitled meals is visible
			if (this.byId("input_claimdetails_input_entitled_breakfast").getVisible()) {
				this.byId("input_claimdetails_input_amount").setEditable(false);
			}
			else {
				if (!this.byId("input_claimdetails_input_amount").getEditable()) {
					this.byId("input_claimdetails_input_amount").setEditable(true);
				}
			}

			//set disclaimer field as false if they are visible for validation
			if (this.byId("checkbox_claimdetails_input_disclaimer").getVisible()) {
				oInputModel.setProperty("/claim_item/disclaimer", false);
			}

			if (this.byId("checkbox_claimdetails_input_disclaimer_galakan").getVisible()) {
				//remove to string when db is updated
				oInputModel.setProperty("/claim_item/disclaimer_galakan", false);
			}

			// calculate number of days
			oInputModel.setProperty("/claim_item/no_of_days", this._calculateNumberOfDays());
		},

		_onInit_ClaimDetails_Input: async function (indexNumber) {

			// HARD RESET – prevents stale binding values
			this.getView().setModel(null, "claimitem_input");
			sap.ui.getCore().applyChanges();

			// set claim item model
			var oInputModel = this._getNewClaimItemModel("claimitem_input");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");

			// change footer buttons
			if (!oClaimSubmissionModel.getProperty("/view_only") && !oClaimSubmissionModel.getProperty("/is_approver")) {
				//this._displayFooterButtons("claimsubmission_claimdetails_input");
				this.updateFooterState(this._oConstant.ClaimFooterMode.DETAILS);
			}

			// update selection fields
			if (Number.isInteger(indexNumber)) {
				// add claim item values to claim detail screen
				oInputModel.setProperty("/claim_item", structuredClone(oClaimSubmissionModel.getProperty("/claim_items/" + indexNumber)));

				// set app visibility controls
				await this.getFieldVisibility_ClaimTypeItem();

				//FUT issue #58
				if (this.byId("checkbox_claimdetails_input_disclaimer").getVisible()) {
					oInputModel.setProperty("/claim_item/disclaimer", true)
				}

				if (this.byId("checkbox_claimdetails_input_disclaimer_galakan").getVisible()) {
					oInputModel.setProperty("/claim_item/disclaimer_galakan", true)
				}


			}
			this._setClaimDetailSelection(oClaimSubmissionModel);

			// approver view changes
			if (oClaimSubmissionModel.getProperty("/view_only")) {
				if (!this.byId("button_claimdetails_input_return").getVisible()) {
					this.byId("button_claimdetails_input_return").setVisible(true);
				}
				this._getFieldEditable_ClaimTypeItem();
			}
		},

		_setClaimDetailSelection: function (oModel) {
			// filter by submission type
			if (oModel.getProperty("/claim_header/submission_type") === this._oConstant.SubmissionType.PRE_APPROVE ||
				oModel.getProperty("/claim_header/submission_type") === this._oConstant.SubmissionType.CASH_REPAYMENT ||
				oModel.getProperty("/claim_header/submission_type") === this._oConstant.SubmissionType.CURR_SUBSIDY
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
				oFilterSubsmissionType = new Filter('SUBMISSION_TYPE', FilterOperator.EQ, oModel.getProperty("/claim_header/submission_type"));
			}

			// set dropdown for claim items
			this.byId("select_claimdetails_input_claimitem").bindAggregation("items", {
				path: "employee>/ZCLAIM_TYPE_ITEM",
				filters: [
					new Filter('CLAIM_TYPE_ID', FilterOperator.EQ, oModel.getProperty("/claim_header/claim_type_id")),
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
				parameters: {
					$expand: {
						"ZSUBMISSION_TYPE": {
							$select: "SUBMISSION_TYPE_DESC"
						}
					},
					$select: "SUBMISSION_TYPE,MATERIAL_CODE"
				},
				template: new Item({
					key: "{employee>CLAIM_TYPE_ITEM_ID}",
					text: "{employee>CLAIM_TYPE_ITEM_DESC}"
				})
			});
			// claim detail selection values
			this._setClaimDetailSelectionMaster();
		},

		_setClaimDetailSelectionMaster: function () {
			//// Type of Professional Body
			this._setClaimDetailSelectionField("select_claimdetails_input_type_of_professional_body", "ZPROFESIONAL_BODY");
			//// Funeral Transportation
			this._setClaimDetailSelectionField("select_claimdetails_input_funeral_transportation", "ZTRANSPORT_PASSING");
			//// Level of Studies
			this._setClaimDetailSelectionField("select_claimdetails_input_study_levels_id", "ZSTUDY_LEVELS");
			//// Type of Vehicle
			this._setClaimDetailSelectionField("select_claimdetails_input_vehicle_type", "ZVEHICLE_TYPE");
			//// Vehicle Ownership ID (Sendiri/Penjabat)
			this._setClaimDetailSelectionField("select_claimdetails_input_vehicle_ownership_id", "ZVEHICLE_OWNERSHIP");
			//// Type of Fare
			this._setClaimDetailSelectionField("select_claimdetails_input_fare_type_id", "ZFARE_TYPE");
			//// Vehicle Class
			this._setClaimDetailSelectionField("select_claimdetails_input_vehicle_class_id", "ZVEHICLE_CLASS");
			//// Flight Class
			this._setClaimDetailSelectionField("select_claimdetails_input_flight_class", "ZFLIGHT_CLASS");
			//// Location Type
			this._setClaimDetailSelectionField("select_claimdetails_input_location_type", "ZLOC_TYPE");
			//// Room Type
			this._setClaimDetailSelectionField("select_claimdetails_input_room_type", "ZROOM_TYPE");
			//// Region (Semenanjung/Sabah/Sarawak)
			this._setClaimDetailSelectionField("select_claimdetails_input_region", "ZREGION");
			//// Area (Negara/Wilayah)
			this._setClaimDetailSelectionField("select_claimdetails_input_area", "ZAREA");
			//// Lodging Category
			this._setClaimDetailSelectionField("select_claimdetails_input_lodging_category", "ZLODGING_CAT", "LODGING_CATEGORY");
			//// Category/Purpose
			this._setClaimDetailSelectionField("select_claimdetails_input_claim_category", "ZCLAIM_CATEGORY");
			//// Category/Purpose (Mobile)
			this._setClaimDetailSelectionField("select_claimdetails_input_mobile_category_purpose_id", "ZMOBILE_CATEGORY_PURPOSE");
		},

		_setClaimDetailSelectionField: function (oId, oTable, oField) {
			if (this.byId(oId).getVisible()) {
				if (!oField) {
					var oField = oTable.slice(1);
				}
				this.byId(oId).bindAggregation("items", {
					path: "employee>/" + oTable,
					sorter: [
						new Sorter(oField + '_DESC'),
						new Sorter(oField + '_ID')
					],
					template: new Item({
						key: "{employee>" + oField + "_ID}",
						text: "{employee>" + oField + "_ID} - {employee>" + oField + "_DESC}"
					})
				});
			}
		},

		onAction_ClaimDetails_Toolbar: function (oAction) {
			// get action
			switch (oAction) {
				//// Save
				case 'Save':
					// confirm dialog
					this._newDialog(
						Utility.getText("dialog_claimdetails_input_save"),
						Utility.getText("label_claimdetails_input_save"),
						async function () {
							await this.onSave_ClaimDetails_Input();
						}.bind(this)
					);
					break;
				//// Others
				default:
					MessageBox.error(Utility.getText("msg_claimdetails_input_noaction"));
					break;
			}
		},

		onSave_ClaimDetails_Input: async function () {
			// validate input data
			var oInputModel = this.getView().getModel("claimitem_input");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");

			// Validate required fields
			if (!this.getOwnerComponent().getValidator().validate(this.getView())) {
				MessageBox.error(Utility.getText("msg_claiminput_required"), {
					closeOnBrowserNavigation: false
				});
				return;
			}

			// Reuben (FUT Issue 17)
			// When creating claim for post education assistance, actual amount is used instead of amount for input
			// To resolve issue, check first if the element is visible and active before performing the value check
			// Also will check for actual_amount as this is specific to post education asssistance scenario
			// will create a variable to store the IDs of elements for future ease of use

			const oInputAmountField = this.byId("input_claimdetails_input_amount");
			const oInputActualAmountField = this.byId("input_claimdetails_input_actual_amount");

			// Check for amount field visibility and value
			if (oInputAmountField && oInputAmountField.getVisible()) {
				const sInputAmount = oInputAmountField.getValue()?.trim().replace(/[^0-9.-]+/g, "");
				const fInputAmount = parseFloat(sInputAmount);
				if (isNaN(fInputAmount) || fInputAmount <= 0) {
					// stop claim submission if amount is zero or less
					MessageBox.error(Utility.getText("msg_claiminput_amount_invalid"));
					return;
				}
			}

			// Check for actual amount field visibility and value
			if (oInputActualAmountField && oInputActualAmountField.getVisible()) {
				const sInputActualAmount = oInputActualAmountField.getValue()?.trim().replace(/[^0-9.-]+/g, "");
				const fInputActualAmount = parseFloat(sInputActualAmount);
				if (isNaN(fInputActualAmount) || fInputActualAmount <= 0) {
					// stop claim submission if amount is zero or less
					MessageBox.error(Utility.getText("msg_claiminput_amount_invalid"));
					return;
				}
			}

			// Reuben End Issue 17



			// Eligibility Checking
			var oPayload = EligibilityCheck.generateEligibilityCheckPayload(this, this._oConstant.SubmissionTypePrefix.CLAIM);
			var oReturnPayload = await EligibleScenarioCheck.onEligibilityCheck(this._oModel, oPayload);
			var bCanProceed = await EligibilityCheck.eligibilityHandling(this, oReturnPayload, this._oConstant.SubmissionTypePrefix.CLAIM);

			if (!bCanProceed) return;

			// upload Attachment 1
			const bUploadAttachment1 = await this._handleAttachmentUpload(
				oInputModel,
				"/attachments/attachment1",
				"/claim_item/attachment_file_1"
			);
			if (!bUploadAttachment1) return; // stop processing if upload fails for attachment 1

			// upload Attachment 2
			const bUploadAttachment2 = await this._handleAttachmentUpload(
				oInputModel,
				"/attachments/attachment2",
				"/claim_item/attachment_file_2"
			);
			if (!bUploadAttachment2) return; // stop processing if upload fails for attachment 2

			// validate date range
			//// start/end date
			if (this.byId("datepicker_claimdetails_input_startdate").getValue() || this.byId("datepicker_claimdetails_input_enddate").getValue()) {
				if (!this._validDateRange("datepicker_claimdetails_input_startdate", "datepicker_claimdetails_input_enddate")) {
					// stop claim details if incomplete
					return;
				}
			}

			// get claim item sub ID
			if (oInputModel.getProperty("/is_new")) {
				oInputModel.setProperty("/claim_item/claim_id", oClaimSubmissionModel.getProperty("/claim_header/claim_id"));
				var claimSubId = oClaimSubmissionModel.getProperty("/claim_items").length + 1;
				var totalClaimSubId = (oInputModel.getProperty("/claim_item/claim_id") ?? "") + ('' + '00' + claimSubId).slice(-3);
				oInputModel.setProperty("/claim_item/claim_sub_id", totalClaimSubId);
			}
			// get descriptions
			oInputModel.setProperty("/claim_item/descr/claim_type_item_id", this.byId("select_claimdetails_input_claimitem")._getSelectedItemText());

			//// Added for duplication check;
			var aExistingItems = oClaimSubmissionModel.getProperty("/claim_items") || [];
			var oNewItem = oInputModel.getProperty("/claim_item");

			var aTemp = [];
			if (!oInputModel.getProperty("/is_new")) {
				aTemp = aExistingItems.filter(it => it.claim_sub_id !== oNewItem.claim_sub_id);
			} else {
				aTemp = [...aExistingItems];
			}
			aTemp.push(oNewItem);

			// Check duplicates
			if (this._CheckDuplicateClaimItems(aTemp)) {
				MessageBox.error(Utility.getText("msg_duplication_prompt"));
				return;
			}

			// update claim item to database
			var saveSuccess = await this._saveClaimItem();

			if (saveSuccess) {
				// add claim item details to claim submission model
				if (oInputModel.getProperty("/is_new")) {
					oClaimSubmissionModel.setProperty("/claim_items", oClaimSubmissionModel.getProperty("/claim_items").concat(oInputModel.getProperty("/claim_item")));
					oClaimSubmissionModel.setProperty("/claim_items_count", oClaimSubmissionModel.getProperty("/claim_items").length);
				}
				else {
					oClaimSubmissionModel.getProperty("/claim_items").find(function (claim_item, i) {
						if (
							oClaimSubmissionModel.getProperty("/claim_items/" + i + "/claim_sub_id") ===
							oInputModel.getProperty("/claim_item/claim_sub_id")
						) {
							oClaimSubmissionModel.setProperty("/claim_items/" + i, oInputModel.getProperty("/claim_item"));
						}
					});
				}

				// calculate new total amount of claim submission header
				const nTotal = oClaimSubmissionModel.getProperty("/claim_items").reduce((s, it) => s + (Number(it.amount) || 0), 0);
				oClaimSubmissionModel.setProperty("/claim_header/total_claim_amount", nTotal);

				// return to claim item screen
				this.onCancel_ClaimDetails_Input();
			}
		},
		/**
		 * Handle Attachment Upload
		 * @public
		 * @param {JSONModel} oInputModel - Claim input JSON Model;
		 * @param {String} sAttachmentPath - Attachment Path;
		 * @param {String} sClaimItemPathPrefix - Claim item path prefix;
		 * @returns {Boolean} Upload successful indicator
		 */
		_handleAttachmentUpload: async function (oInputModel, sAttachmentPath, sClaimItemPathPrefix) {
			const sFileName = oInputModel.getProperty(`${sAttachmentPath}/fileName`);
			const sFileBinary = oInputModel.getProperty(`${sAttachmentPath}/fileContent`);

			if (!sFileName || !sFileBinary) {
				// nothing to upload
				return true;
			}

			BusyIndicator.show(0);

			try {
				const sAttachmentNumber = await Attachment.postAttachment(sFileName, sFileBinary, this._oSessionModel.getProperty("/userId"));
				const sAttachmentString = `${sAttachmentNumber} - ${sFileName}`;
				oInputModel.setProperty(`${sClaimItemPathPrefix}`, sAttachmentString);
				oInputModel.setProperty(`${sClaimItemPathPrefix.replace("/claim_item/", "/claim_item/descr/")}`, sFileName);
			} catch (oError) {
				BusyIndicator.hide();
				MessageBox.error(Utility.getText("msg_claiminput_attachment_upload_error"));
				return false;   // stop further processing
			}

			BusyIndicator.hide();
			return true;
		},

		_saveClaimItem: async function () {
			// get input model
			var oInputModel = this.getView().getModel("claimitem_input");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");

			/* 	4 scenarios for Receipt Date to be populated
					1. Get Receipt Date based on input
					2. If Receipt Date is null, get item Bill Date
					3. If Bill Date is null, get item Start Date
					4. If Start Date is null, get header Trip Start Date 
			*/
			if (oInputModel.getProperty("/claim_item/receipt_date") === null) {
				if (oInputModel.getProperty("/claim_item/bill_date") !== null) {
					oInputModel.setProperty("/claim_item/receipt_date", oInputModel.getProperty("/claim_item/bill_date"));
				} else {
					if (oInputModel.getProperty("/claim_item/start_date") !== null) {
						oInputModel.setProperty("/claim_item/receipt_date", oInputModel.getProperty("/claim_item/start_date"));
					} else {
						oInputModel.setProperty("/claim_item/receipt_date", oClaimSubmissionModel.getProperty("/claim_header/trip_start_date"));
					}
				}
			}

			//FUT issue #81
			var dTripEndDate = new Date(oClaimSubmissionModel.getProperty("/claim_header/trip_end_date")).toLocaleDateString('en-CA');
			var dReceiptDate = new Date(oInputModel.getProperty("/claim_item/receipt_date")).toLocaleDateString('en-CA');

			if (dReceiptDate > dTripEndDate) {
				MessageToast.show(Utility.getText("msg_claimsubmission_invalid_receipt_date"));
				return;
			}

			//FUT issue #58
			//checking for galakan disclaimer if its ticked or not
			if (oInputModel.getProperty("/claim_item/disclaimer_galakan") == false || oInputModel.getProperty("/claim_item/disclaimer") == false) {
				MessageToast.show(Utility.getText("msg_claimdetails_no_check_disclaimer"));
				return;
			}

			//FUT issue #81
			var dTripEndDate = new Date(oClaimSubmissionModel.getProperty("/claim_header/trip_end_date")).toLocaleDateString('en-CA');
			var dReceiptDate = new Date(oInputModel.getProperty("/claim_item/receipt_date")).toLocaleDateString('en-CA');

			if (dReceiptDate > dTripEndDate) {
				MessageToast.show(Utility.getText("msg_claimsubmission_invalid_receipt_date"));
				return;
			}
			try {
				BusyIndicator.show(0);
				var oModel = this.getOwnerComponent().getModel();
				var oListBinding = null;

				// set body for update
				var oBody = new JSONModel({
					CLAIM_ID: oInputModel.getProperty("/claim_item/claim_id"),
					CLAIM_SUB_ID: oInputModel.getProperty("/claim_item/claim_sub_id"),
					CLAIM_TYPE_ITEM_ID: oInputModel.getProperty("/claim_item/claim_type_item_id"),
					PERCENTAGE_COMPENSATION: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/percentage_compensation"))).toFixed(2),
					ACCOUNT_NO: oInputModel.getProperty("/claim_item/account_no"),
					AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/amount"))).toFixed(2),
					ATTACHMENT_FILE_1: oInputModel.getProperty("/claim_item/attachment_file_1"),
					ATTACHMENT_FILE_2: oInputModel.getProperty("/claim_item/attachment_file_2"),
					BILL_NO: oInputModel.getProperty("/claim_item/bill_no"),
					BILL_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/bill_date")),
					CLAIM_CATEGORY: oInputModel.getProperty("/claim_item/claim_category"),
					COUNTRY: oInputModel.getProperty("/claim_item/country"),
					DISCLAIMER: oInputModel.getProperty("/claim_item/disclaimer"),
					START_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/start_date")),
					END_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/end_date")),
					START_TIME: this._getHanaTime(oInputModel.getProperty("/claim_item/start_time")),
					END_TIME: this._getHanaTime(oInputModel.getProperty("/claim_item/end_time")),
					FLIGHT_CLASS: oInputModel.getProperty("/claim_item/flight_class"),
					FROM_LOCATION: oInputModel.getProperty("/claim_item/from_location"),
					FROM_LOCATION_OFFICE: oInputModel.getProperty("/claim_item/from_location_office"),
					KM: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/km"))).toFixed(2),
					LOCATION: oInputModel.getProperty("/claim_item/location"),
					LOCATION_TYPE: oInputModel.getProperty("/claim_item/location_type"),
					LODGING_CATEGORY: oInputModel.getProperty("/claim_item/lodging_category"),
					LODGING_ADDRESS: oInputModel.getProperty("/claim_item/lodging_address"),
					MARRIAGE_CATEGORY: oInputModel.getProperty("/claim_item/marriage_category"),
					AREA: oInputModel.getProperty("/claim_item/area"),
					NO_OF_FAMILY_MEMBER: oInputModel.getProperty("/claim_item/no_of_family_member"),
					PARKING: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/parking"))),
					PHONE_NO: oInputModel.getProperty("/claim_item/phone_no"),
					RATE_PER_KM: oInputModel.getProperty("/claim_item/rate_per_km"),
					RECEIPT_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/receipt_date")),
					RECEIPT_NUMBER: oInputModel.getProperty("/claim_item/receipt_number"),
					REMARK: oInputModel.getProperty("/claim_item/remark"),
					ROOM_TYPE: oInputModel.getProperty("/claim_item/room_type"),
					REGION: oInputModel.getProperty("/claim_item/region"),
					FROM_STATE_ID: oInputModel.getProperty("/claim_item/from_state_id"),
					TO_STATE_ID: oInputModel.getProperty("/claim_item/to_state_id"),
					TO_LOCATION: oInputModel.getProperty("/claim_item/to_location"),
					TO_LOCATION_OFFICE: oInputModel.getProperty("/claim_item/to_location_office"),
					TOLL: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/toll"))).toFixed(2),
					TOTAL_EXP_AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/total_exp_amount"))).toFixed(2),
					VEHICLE_TYPE: oInputModel.getProperty("/claim_item/vehicle_type"),
					VEHICLE_FARE: oInputModel.getProperty("/claim_item/vehicle_fare"),
					TRIP_START_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/trip_start_date")),
					TRIP_END_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/trip_end_date")),
					EVENT_START_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/event_start_date")),
					EVENT_END_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/event_end_date")),
					TRAVEL_DURATION_DAY: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day"))).toFixed(1),
					TRAVEL_DURATION_HOUR: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))).toFixed(1),
					PROVIDED_BREAKFAST: oInputModel.getProperty("/claim_item/provided_breakfast"),
					PROVIDED_LUNCH: oInputModel.getProperty("/claim_item/provided_lunch"),
					PROVIDED_DINNER: oInputModel.getProperty("/claim_item/provided_dinner"),
					ENTITLED_BREAKFAST: oInputModel.getProperty("/claim_item/entitled_breakfast"),
					ENTITLED_LUNCH: oInputModel.getProperty("/claim_item/entitled_lunch"),
					ENTITLED_DINNER: oInputModel.getProperty("/claim_item/entitled_dinner"),
					ANGGOTA_ID: oInputModel.getProperty("/claim_item/anggota_id"),
					ANGGOTA_NAME: oInputModel.getProperty("/claim_item/anggota_name"),
					DEPENDENT_NAME: oInputModel.getProperty("/claim_item/dependent_name"),
					TYPE_OF_PROFESSIONAL_BODY: oInputModel.getProperty("/claim_item/type_of_professional_body"),
					DISCLAIMER_GALAKAN: oInputModel.getProperty("/claim_item/disclaimer_galakan"),
					MODE_OF_TRANSFER: oInputModel.getProperty("/claim_item/mode_of_transfer"),
					TRANSFER_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/transfer_date")),
					NO_OF_DAYS: oInputModel.getProperty("/claim_item/no_of_days"),
					FAMILY_COUNT: oInputModel.getProperty("/claim_item/family_count"),
					FUNERAL_TRANSPORTATION: oInputModel.getProperty("/claim_item/funeral_transportation"),
					ROUND_TRIP: oInputModel.getProperty("/claim_item/round_trip"),
					TRIP_END_TIME: this._getHanaTime(oInputModel.getProperty("/claim_item/trip_end_time")),
					TRIP_START_TIME: this._getHanaTime(oInputModel.getProperty("/claim_item/trip_start_time")),
					COST_CENTER: oInputModel.getProperty("/claim_item/cost_center"),
					GL_ACCOUNT: oInputModel.getProperty("/claim_item/gl_account"),
					MATERIAL_CODE: oInputModel.getProperty("/claim_item/material_code"),
					VEHICLE_OWNERSHIP_ID: oInputModel.getProperty("/claim_item/vehicle_ownership_id"),
					ACTUAL_AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/actual_amount"))).toFixed(2),
					ARRIVAL_TIME: this._getHanaTime(oInputModel.getProperty("/claim_item/arrival_time")),
					CLAIM_TYPE_ID: oInputModel.getProperty("/claim_item/claim_type_id"),
					COURSE_TITLE: oInputModel.getProperty("/claim_item/course_title"),
					CURRENCY_AMOUNT: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/currency_amount"))).toFixed(2),
					CURRENCY_CODE: oInputModel.getProperty("/claim_item/currency_code"),
					CURRENCY_RATE: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/currency_rate"))).toFixed(2),
					DEPARTURE_TIME: this._getHanaTime(oInputModel.getProperty("/claim_item/departure_time")),
					DEPENDENT: oInputModel.getProperty("/claim_item/dependent"),
					DEPENDENT_RELATIONSHIP: oInputModel.getProperty("/claim_item/dependent_relationship"),
					EMP_ID: this._oSessionModel.getProperty("/userId"),
					FARE_TYPE_ID: oInputModel.getProperty("/claim_item/fare_type_id"),
					INSURANCE_CERT_END_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/insurance_cert_end_date")),
					INSURANCE_CERT_START_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/insurance_cert_start_date")),
					INSURANCE_PACKAGE_ID: oInputModel.getProperty("/claim_item/insurance_package_id"),
					INSURANCE_PROVIDER_ID: oInputModel.getProperty("/claim_item/insurance_provider_id"),
					INSURANCE_PROVIDER_NAME: oInputModel.getProperty("/claim_item/insurance_provider_name"),
					INSURANCE_PURCHASE_DATE: this._getHanaDate(oInputModel.getProperty("/claim_item/insurance_purchase_date")),
					METER_CUBE_ACTUAL: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/meter_cube_actual"))).toFixed(2),
					METER_CUBE_ENTITLED: this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/meter_cube_entitled"))).toFixed(2),
					MOBILE_CATEGORY_PURPOSE_ID: oInputModel.getProperty("/claim_item/mobile_category_purpose_id"),
					NEED_FOREIGN_CURRENCY: oInputModel.getProperty("/claim_item/need_foreign_currency"),
					POLICY_NUMBER: oInputModel.getProperty("/claim_item/policy_number"),
					PURPOSE: oInputModel.getProperty("/claim_item/purpose"),
					REQUEST_APPROVAL_AMOUNT: oInputModel.getProperty("/claim_item/request_approval_amount"),
					STUDY_LEVELS_ID: oInputModel.getProperty("/claim_item/study_levels_id"),
					TRAVEL_DAYS_ID: oInputModel.getProperty("/claim_item/travel_days_id"),
					VEHICLE_CLASS_ID: oInputModel.getProperty("/claim_item/vehicle_class_id")
				});

				if (oInputModel.getProperty("/is_new")) {
					// create new item
					oListBinding = oModel.bindList("/ZCLAIM_ITEM");
					var oContext = oListBinding.create(oBody.getData());
					await oContext.created().then(async () => {
						// post MDF for item attachments
						if (oInputModel.getProperty("/claim_item/attachment_file_1") || oInputModel.getProperty("/claim_item/attachment_file_2")) {
							await Attachment.postMDFChild(
								oInputModel.getProperty("/claim_item/claim_id"),
								oInputModel.getProperty("/claim_item/claim_sub_id"),
								oInputModel.getProperty("/claim_item/attachment_file_1"),
								oInputModel.getProperty("/claim_item/attachment_file_2")
							)
						}

						MessageToast.show(Utility.getText("msg_claimsubmission_creation_item", [oInputModel.getProperty("/claim_item/claim_sub_id")]));
					});
				}
				else {
					oListBinding = oModel.bindList("/ZCLAIM_ITEM", null, null,
						[
							new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: oInputModel.getProperty("/claim_item/claim_id") }),
							new Filter({ path: "CLAIM_SUB_ID", operator: FilterOperator.EQ, value1: oInputModel.getProperty("/claim_item/claim_sub_id") })
						],
						{
							$$ownRequest: true,
							$$groupId: "$auto",
							$$updateGroupId: "$auto"
						}
					);

					var aCtx = await oListBinding.requestContexts(0, 1);
					var oCtx = aCtx[0];

					if (!oCtx) {
						throw new Error("Claim item not found in database");
					}
					else {
						// get existing attachment file values
						var oAttachmentFile1 = oCtx.getProperty("ATTACHMENT_FILE_1");
						var oAttachmentFile2 = oCtx.getProperty("ATTACHMENT_FILE_2");

						for (const [key, value] of Object.entries(oBody.getData())) {
							oCtx.setProperty(key, value);
						}

						await oModel.submitBatch("$auto");

						// post MDF for item attachments
						if (
							(oInputModel.getProperty("/claim_item/attachment_file_1") && oInputModel.getProperty("/claim_item/attachment_file_1") !== oAttachmentFile1) ||
							(oInputModel.getProperty("/claim_item/attachment_file_2") && oInputModel.getProperty("/claim_item/attachment_file_2") !== oAttachmentFile2)
						) {
							await Attachment.postMDFChild(
								oInputModel.getProperty("/claim_item/claim_id"),
								oInputModel.getProperty("/claim_item/claim_sub_id"),
								oInputModel.getProperty("/claim_item/attachment_file_1"),
								oInputModel.getProperty("/claim_item/attachment_file_2")
							)
						}
						MessageToast.show(Utility.getText("msg_claimsubmission_save_item", [oInputModel.getProperty("/claim_item/claim_sub_id")]));
					}
				}

				return true;
			} catch (e) {
				MessageBox.error(e.message);
				return false;
			} finally {
				BusyIndicator.hide();
			}
		},

		onChange_ClaimDetails_Input_Attachment: function (oEvent, fieldNumber) {
			// check if file can be uploaded
			var fileName = oEvent.getSource().getValue();
			var domRef = oEvent.getSource().getFocusDomRef();
			var file = domRef.files[0];
			var reader = new FileReader();

			reader.addEventListener("load", () => {
				var oInputModel = this.getView().getModel("claimitem_input");
				if (oInputModel) {
					oInputModel.setProperty("/attachments/attachment" + fieldNumber + "/fileName", fileName);
					oInputModel.setProperty("/attachments/attachment" + fieldNumber + "/fileContent", reader.result.replace("data:" + file.type + ";base64,", ""));
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
			MessageBox.error(Utility.getText("msg_claiminput_attachment_upload_filesize"));
		},

		onTypeMissmatch_ClaimInput_Attachment: function (oEvent) {
			MessageBox.error(Utility.getText("msg_claiminput_attachment_upload_mismatch"));
		},

		onChange_ClaimDetails_DateRange: async function (startdate, enddate) {
			// reset claim detail amounts
			this._resetPerDiem();

			var startDateValue = this.byId(startdate).getValue();
			var endDateValue = this.byId(enddate).getValue();
			// check for missing value
			if (!startDateValue || !endDateValue) {
				return;
			}
			// check if end date earlier than start date
			var startDateUnix = new Date(startDateValue).valueOf();
			var endDateUnix = new Date(endDateValue).valueOf();
			if (startDateUnix > endDateUnix) {
				return;
			}
			else {
				// calculate per diem details
				if (this.byId("input_claimdetails_input_entitled_breakfast").getVisible()) {
					await this._calculatePerDiem();
				}
				// Calculate number of days
				this.getView().getModel("claimitem_input").setProperty("/claim_item/no_of_days", this._calculateNumberOfDays());
			}
		},

		/**
		 * Determine which method to use when calculating number of days for claim item
		 * if claim item is Dobi, pass start/end date value from claim header
		 * else if header is empty, pass start/end date value from claim item
		 * @private
		 * @return {integer} retrieve number of days value based on start/end date from claim
		 */
		_calculateNumberOfDays: function () {
			var oHeader = {};
			var oItem = {};
			var oInputModel = this.getView().getModel("claimitem_input");
			//// get header if claim type item is DOBI
			if (oInputModel.getProperty("/claim_item/claim_type_item_id") === this._oConstant.ClaimTypeItem.DOBI) {
				var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
				oHeader = {
					tripstartdate: oClaimSubmissionModel.getProperty("/claim_header/trip_start_date"),
					tripenddate: oClaimSubmissionModel.getProperty("/claim_header/trip_end_date"),
				};
			}
			//// get item if header is not populated
			if (Object.keys(oHeader).length === 0) {
				oItem = oInputModel.getProperty("/claim_item") || {};
			}
			return DateUtility.calculateNumberOfDays(oHeader, oItem);
		},

		onChange_ClaimDetails_TimeRange: async function (startdate, starttime, enddate, endtime) {
			// reset claim detail amounts
			this._resetPerDiem();

			// check for missing value
			var startDateValue = this.byId(startdate).getValue();
			var endDateValue = this.byId(enddate).getValue();
			if (!startDateValue || !endDateValue) {
				return;
			}
			var startTimeValue = this.byId(starttime).getDateValue();
			var endTimeValue = this.byId(endtime).getDateValue();
			if (!startTimeValue || !endTimeValue) {
				return;
			}
			// check if end datetime earlier than start datetime
			var startDateUnix = new Date(startDateValue).valueOf();
			startDateUnix = startDateUnix + new Date(startTimeValue).valueOf()
			var endDateUnix = new Date(endDateValue).valueOf();
			endDateUnix = endDateUnix + new Date(endTimeValue).valueOf()
			if (startDateUnix > endDateUnix) {
				return;
			}
			else {
				// calculate per diem details
				if (this.byId("input_claimdetails_input_entitled_breakfast").getVisible()) {
					await this._calculatePerDiem();
				}
			}
		},

		_resetPerDiem: function () {
			// reset claim detail amounts
			if (this.byId("input_claimdetails_input_travel_duration_day").getVisible()) {
				this.byId("input_claimdetails_input_travel_duration_day").setValue("");
			}
			if (this.byId("input_claimdetails_input_travel_duration_hour").getVisible()) {
				this.byId("input_claimdetails_input_travel_duration_hour").setValue("");
			}
			if (this.byId("input_claimdetails_input_entitled_breakfast").getVisible()) {
				this.byId("input_claimdetails_input_entitled_breakfast").setValue("");
			}
			if (this.byId("input_claimdetails_input_entitled_lunch").getVisible()) {
				this.byId("input_claimdetails_input_entitled_lunch").setValue("");
			}
			if (this.byId("input_claimdetails_input_entitled_dinner").getVisible()) {
				this.byId("input_claimdetails_input_entitled_dinner").setValue("");
			}
		},

		onSelect_ClaimDetails_Region: async function () {
			await this._calculatePerDiem();
		},

		_calculatePerDiem: async function () {
			// check date/time values to be used for calculation
			//// Start Date/Start Time/End Date/End Time
			if (this.byId("datepicker_claimdetails_input_startdate").getVisible()) {
				var startDate = "datepicker_claimdetails_input_startdate";
				var startTime = "timepicker_claimdetails_input_starttime";
				var endDate = "datepicker_claimdetails_input_enddate";
				var endTime = "timepicker_claimdetails_input_endtime";
			}
			else if (this.byId("datepicker_claimdetails_input_trip_start_date").getVisible()) {
				startDate = "datepicker_claimdetails_input_trip_start_date";
				startTime = "timepicker_claimdetails_input_trip_starttime";
				endDate = "datepicker_claimdetails_input_trip_end_date";
				endTime = "timepicker_claimdetails_input_trip_endtime";
			}
			else {
				return;
			}
			// check if required fields have values
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			var oInputModel = this.getView().getModel("claimitem_input");
			if (
				(this.byId(startDate).getVisible() && !this.byId(startDate).getValue()) ||
				(this.byId(startTime).getVisible() && !this.byId(startTime).getValue()) ||
				(this.byId(endDate).getVisible() && !this.byId(endDate).getValue()) ||
				(this.byId(endTime).getVisible() && !this.byId(endTime).getValue()) ||
				(this.byId("select_claimdetails_input_region").getVisible() && !oInputModel.getProperty("/claim_item/region"))
			) {
				return;
			}
			// calculate travel duration (days/hours)
			var startDateValue = this.byId(startDate).getValue();
			var endDateValue = this.byId(endDate).getValue();
			var startTimeValue = this.byId(startTime).getDateValue();
			var endTimeValue = this.byId(endTime).getDateValue();
			var startDateUnix = new Date(startDateValue).valueOf();
			startDateUnix = startDateUnix + new Date(startTimeValue).valueOf();
			var endDateUnix = new Date(endDateValue).valueOf();
			endDateUnix = endDateUnix + new Date(endTimeValue).valueOf();

			if (this.byId("input_claimdetails_input_travel_duration_day").getVisible()) {
				var travelDays = Math.floor((endDateUnix - startDateUnix) / 86400000); // round down days
				this.byId("input_claimdetails_input_travel_duration_day").setValue(travelDays);
			}
			if (this.byId("input_claimdetails_input_travel_duration_hour").getVisible()) {
				var travelHours = Math.floor((endDateUnix - startDateUnix) / 3600000); // round down hours
				this.byId("input_claimdetails_input_travel_duration_hour").setValue(travelHours);
			}

			// get details from per diem table
			BusyIndicator.show(0);
			const oModel = this.getOwnerComponent().getModel();
			const oListBinding = oModel.bindList("/ZPERDIEM_ENT", null, null, [
				new Filter("PERSONAL_GRADE", FilterOperator.EQ, oClaimSubmissionModel.getProperty("/emp_master/grade")),
				new Filter("LOCATION", FilterOperator.EQ, oInputModel.getProperty("/claim_item/region")),
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oInputModel.getProperty("/claim_item/claim_type_id")),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oInputModel.getProperty("/claim_item/claim_type_item_id")),
				new Filter("START_DATE", FilterOperator.LE, this._getHanaDate(this.byId(startDate).getValue())),
				new Filter("END_DATE", FilterOperator.GE, this._getHanaDate(this.byId(endDate).getValue()))
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					// get amount from oData
					var oData = aContexts[0].getObject();
					var entBfast = parseFloat(oData.AMOUNT) * 0.2;
					var entLunch = parseFloat(oData.AMOUNT) * 0.4;
					var entDinner = parseFloat(oData.AMOUNT) * 0.4;
					//// modifier based on travel duration (hours)
					if (this.byId("input_claimdetails_input_travel_duration_hour").getVisible()) {
						if (this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))) > 24) {
							// full meal allowance
							entBfast = entBfast * this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day")));
							entLunch = entLunch * this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day")));
							entDinner = entDinner * this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day")));
						}
						else if (this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))) > 8) {
							// daily allowance (half of meal allowance)
							entBfast = entBfast / 2;
							entLunch = entLunch / 2;
							entDinner = entDinner / 2;
						}
						else { // if (this._nonNan(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))) < 8)
							// no meal allowance
							entBfast = entBfast * 0;
							entLunch = entLunch * 0;
							entDinner = entDinner * 0;
						}
					}

					// assign entitled meal values
					if (this.byId("input_claimdetails_input_entitled_breakfast").getVisible()) {
						this.byId("input_claimdetails_input_entitled_breakfast").setValue(entBfast);
					}
					if (this.byId("input_claimdetails_input_entitled_lunch").getVisible()) {
						this.byId("input_claimdetails_input_entitled_lunch").setValue(entLunch);
					}
					if (this.byId("input_claimdetails_input_entitled_dinner").getVisible()) {
						this.byId("input_claimdetails_input_entitled_dinner").setValue(entDinner);
					}
					this.onChange_ClaimDetails_ProvidedMeals();
				} else {
					MessageToast.show(Utility.getText("msg_claimdetails_input_entmeals"));
				}
				BusyIndicator.hide();
			} catch (oError) {
				MessageBox.error(Utility.getText("msg_claimdetails_input_entmeals_err", [oError]));
				BusyIndicator.hide();
			}
		},

		onChange_ClaimDetails_ProvidedMeals: function () {
			var provBfast = parseFloat(this.byId("input_claimdetails_input_provided_breakfast"));
			if (isNaN(provBfast)) { provBfast = 0.0; }
			var provLunch = parseFloat(this.byId("input_claimdetails_input_provided_lunch"));
			if (isNaN(provLunch)) { provLunch = 0.0; }
			var provDinner = parseFloat(this.byId("input_claimdetails_input_provided_dinner"));
			if (isNaN(provDinner)) { provDinner = 0.0; }
			var entBfast = parseFloat(this.byId("input_claimdetails_input_entitled_breakfast"));
			if (isNaN(entBfast)) { entBfast = 0.0; }
			var entLunch = parseFloat(this.byId("input_claimdetails_input_entitled_lunch"));
			if (isNaN(entLunch)) { entLunch = 0.0; }
			var entDinner = parseFloat(this.byId("input_claimdetails_input_entitled_dinner"));
			if (isNaN(entDinner)) { entDinner = 0.0; }
			var amount = 0.0;

			// calculate total amount
			if (this.byId("input_claimdetails_input_amount").getVisible()) {
				this.byId("input_claimdetails_input_amount").setValue(amount);
			}
			else {
				return;
			}
			//// breakfast
			if (entBfast > 0.0 && provBfast > entBfast) {
				this.byId("input_claimdetails_input_amount").setValue(amount + entBfast);
			}
			else {
				this.byId("input_claimdetails_input_amount").setValue(amount + provBfast);
			}
			//// lunch
			if (entLunch > 0.0 && provLunch > entLunch) {
				this.byId("input_claimdetails_input_amount").setValue(amount + entLunch);
			}
			else {
				this.byId("input_claimdetails_input_amount").setValue(amount + provLunch);
			}
			//// dinner
			if (entDinner > 0.0 && provDinner > entDinner) {
				this.byId("input_claimdetails_input_amount").setValue(amount + entDinner);
			}
			else {
				this.byId("input_claimdetails_input_amount").setValue(amount + provDinner);
			}
		},

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
									var oFrom = this.byId("input_claimdetails_input_from_location");
									if (oFrom) {
										oFrom.setValue(res.from);
										var b = oFrom.getBinding("value");
										if (b) {
											var m = b.getModel(), p = b.getPath();
											m.setProperty(p.charAt(0) === "/" ? p : "/" + p, res.from);
										}
									}

									// Put into To input
									var oTo = this.byId("input_claimdetails_input_to_location");
									if (oTo) {
										oTo.setValue(res.to);
										var b2 = oTo.getBinding("value");
										if (b2) {
											var m2 = b2.getModel(), p2 = b2.getPath();
											m2.setProperty(p2.charAt(0) === "/" ? p2 : "/" + p2, res.to);
										}
									}

									// Optional: push km to your model/input if you want
									var oKm = this.byId("input_claimdetails_input_km");
									if (oKm && oKm.getVisible()) { oKm.setValue(res.km); }

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
				var sFrom = (this.byId("input_claimdetails_input_from_location") && this.byId("input_claimdetails_input_from_location").getValue()) || "";
				var sTo = (this.byId("input_claimdetails_input_to_location") && this.byId("input_claimdetails_input_to_location").getValue()) || "";
				ctx.controller.prefill({ from: sFrom, to: sTo });
				ctx.controller.open();
			}.bind(this));
		},

		_validDateRange: function (startdate, enddate) {
			var startDateValue = this.byId(startdate).getValue();
			var endDateValue = this.byId(enddate).getValue();
			// check for missing value
			if (!startDateValue || !endDateValue) {
				MessageBox.error(Utility.getText("msg_daterange_missing"));
				return false;
			}
			// check if end date earlier than start date
			var startDateUnix = new Date(startDateValue).valueOf();
			var endDateUnix = new Date(endDateValue).valueOf();
			if (startDateUnix > endDateUnix) {
				MessageBox.error(Utility.getText("msg_daterange_order"));
				return false;
			}
			else {
				return true;
			}
		},

		onCancel_ClaimDetails_Input: async function () {
			// show claim details screen
			var oPage = this.byId("page_claimsubmission");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			var oClaimItemFragment = await this._getFormFragment("claimsubmission_claimdetails_input");
			await this._afterLoadFragments();
			if (oClaimItemFragment) {
				// disable item visibility
				this._setAllControlsVisible(false);

				// check if amount is editable
				if (!this.byId("input_claimdetails_input_amount").getEditable()) {
					this.byId("input_claimdetails_input_amount").setEditable(true);
				}

				// approver view changes
				if (oClaimSubmissionModel.getProperty("/view_only")) {
					if (this.byId("button_claimdetails_input_return").getVisible()) {
						this.byId("button_claimdetails_input_return").setVisible(false);
					}
					this._setAllControlsEditable(true);
				}

				// clear fileuploader fields
				for (let i = 1; i <= 2; i++) { // 2 attachment fields per claim item
					this.byId("fileuploader_claimdetails_input_attachment" + i)?.clear();
				}

				oPage.removeContent(oClaimItemFragment);

				await this._getFormFragment("claimsubmission_summary_claimitem", true).then(function (oVBox) {
					oPage.insertContent(oVBox, 1);
				});
				if (!oClaimSubmissionModel.getProperty("/view_only")) {
					this._setEnabledToolbarFooter();
				}
				if (!oClaimSubmissionModel.getProperty("/is_approver")) {
					//this._displayFooterButtons("claimsubmission_summary_claimitem");
					this.updateFooterState(this._oConstant.ClaimFooterMode.SUMMARY);
				}
				this.byId("table_claimsummary_claimitem").getBinding("items").refresh();

				// Reload when item cancellation
				this._loadClaimById(String(oClaimSubmissionModel.getProperty("/claim_header/claim_id")));
			}
		},

		_updateClaimSubmission: async function (oAction) {
			try {
				BusyIndicator.show(0);

				// get input model
				var oInputModel = this.getView().getModel("claimsubmission_input");
				var aItems = oInputModel.getProperty("/claim_items") || [];

				if (oAction !== "Delete Report" && aItems.length === 0) {
					MessageToast.show(Utility.getText("msg_claimdetails_no_items"));
					BusyIndicator.hide();
					return;
				}

				// Total Claim Amount Validation checking
				if (aItems.length > 0 && (isNaN(oInputModel.getProperty("/claim_header/total_claim_amount")) || oInputModel.getProperty("/claim_header/total_claim_amount") <= 0)) {
					MessageBox.error(Utility.getText("msg_claimsubmission_invalid_amount"));
					BusyIndicator.hide();
					return;
				}


				// Cash Advance Repayment Validation checking
				if (oInputModel.getProperty("/claim_header/final_amount_to_receive") < 0) {
					MessageBox.error(Utility.getText("msg_error_cash_advance_repayment_prompt"));
					BusyIndicator.hide();
					return;
				}

				if (this._CheckDuplicateClaimItems(aItems)) {
					MessageBox.error(Utility.getText("msg_duplication_prompt"));
					BusyIndicator.hide();
					return;
				}

				//// update last modified date
				var lastModifiedDate = this._getJsonDate(new Date());
				oInputModel.setProperty("/claim_header/last_modified_date", lastModifiedDate);

				//assign submitted date for submit oAction
				if (oAction == "Submit Report") {
					var submittedDate = this._getJsonDate(new Date());
					oInputModel.setProperty("/claim_header/submitted_date", submittedDate);
				}

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
						MessageBox.error(Utility.getText("msg_claimsubmission_noclaim"));
					}
				}
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

				const oModel = this.getOwnerComponent().getModel();
				var oListBinding;
				var claimSaved;
				var bApproversDetermined = true;

				if (oInputModel.getProperty("/is_new")) {
					oListBinding = oModel.bindList("/ZCLAIM_HEADER");
					const oContext = oListBinding.create(oBody.getData());
					oContext.created().then(async () => {
						switch (oAction) {
							case 'Save Draft':
								MessageToast.show(Utility.getText("msg_claimsubmission_created"));
								break;
							case 'Submit Report':
								// move approver determination function before claim is saved
								// if approvers are determined, bApproversDetermined = true and proceed with changing status to PENDING APPROVAL
								// else, do not send message claim submission pending
								// instead, jump to catch statement with error no approver found
								var oModelAppr = this.getView().getModel();
								var oEmployeeViewModel = this.getView().getModel("employee_view");
								bApproversDetermined = await workflowApproval.onClaimsApproverDetermination(this, oModelAppr, oInputModel.getProperty("/claim_header/claim_id"), oEmployeeViewModel);
								if (bApproversDetermined) {
									MessageToast.show(Utility.getText("msg_claimsubmission_pending"));
								} else {
									throw new Error(Utility.getText("msg_failed_no_approver"))
								}
								break;
							default:
								throw new Error("Invalid action selected: " + oAction);
						}
						await this._updateCurrentReportNumber("NR02", oInputModel.getProperty("/reportnumber/current"));
						MessageToast.show(oMsg);
						this._onNavBack();
					}).catch(err => {
						MessageBox.error(Utility.getText("msg_claimsubmission_creation_err", [err.message]));
					});
				}
				else {
					oListBinding = oModel.bindList("/ZCLAIM_HEADER", null, null,
						[
							new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: oInputModel.getProperty("/claim_header/claim_id") })
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
						throw new Error("Claim not reachable.");
					}

					for (const [key, value] of Object.entries(oBody.getData())) {
						oCtx.setProperty(key, value);
					}
					switch (oAction) {
						case 'Save Draft':
							var oMsg = Utility.getText("msg_claimsubmission_changed");
							break;
						case 'Delete Report':
							oCtx.setProperty("STATUS_ID", this._oConstant.ClaimStatus.CANCELLED);
							oMsg = Utility.getText("msg_claimsubmission_deleted");
							// Placeholder to put delete function for ZAPPROVER_DETAILS_CLAIMS
							//Call CAP action 
							const oAction = oModel.bindContext("/DeleteApproverDetails(...)");
							oAction.setParameter("ID", oInputModel.getProperty("/claim_header/claim_id"));
							try {
								await oAction.execute();
							} catch (oError) {
								MessageBox.error(Utility.getText("msg_failed_generic_error", [oError]))
							}
							break;
						case 'Submit Report':
							// budget checking

							const aPayloadResult = await budgetCheck.backendBudgetChecking(this, this._oConstant.SubmissionTypePrefix.CLAIM, this._oConstant.BudgetCheckAction.SUBMIT);
							const oHandlingResult = await budgetCheck.budgetCheckHandling(aPayloadResult);

							if (!oHandlingResult.bCanProceed) {
								MessageBox.error(Utility.getText("req_tm_w_inform_cc_owner", oHandlingResult.aClaimTypeItem));
								return;
							}
							else {

								// move approver determination function before claim is saved
								// if approvers are determined, bApproversDetermined = true and proceed with changing status to PENDING APPROVAL
								// else, do not change claim status
								var oModelAppr = this.getView().getModel();
								var oEmployeeViewModel = this.getView().getModel("employee_view");
								var bApproversDetermined = await workflowApproval.onClaimsApproverDetermination(this, oModelAppr, oInputModel.getProperty("/claim_header/claim_id"), oEmployeeViewModel);
								if (bApproversDetermined) {
									oCtx.setProperty("STATUS_ID", this._oConstant.ClaimStatus.PENDING_APPROVAL);
									if (oCtx.getProperty("SUBMITTED_DATE", null)) {
										var submittedDate = this._getJsonDate(new Date());
										oCtx.setProperty("SUBMITTED_DATE", this._getHanaDate(submittedDate));
									}
									oMsg = Utility.getText("msg_claimsubmission_pending", []);
								} else {
									throw new Error(Utility.getText("msg_failed_no_approver"))
								}
							}
							break;
						default:
							throw new Error("Invalid action selected: " + oAction);
					}

					await oModel.submitBatch("$auto");

					MessageToast.show(oMsg);
					//// change status based on oAction
					switch (oAction) {
						case 'Delete Report':
							oInputModel.setProperty("/claim_header/status_id", this._oConstant.ClaimStatus.CANCELLED);
							oInputModel.setProperty("/claim_header/descr/status_id", "CANCELLED");
							this.onBack_ClaimSubmission();
							break;
						case 'Submit Report':
							oInputModel.setProperty("/claim_header/status_id", this._oConstant.ClaimStatus.PENDING_APPROVAL);
							oInputModel.setProperty("/claim_header/descr/status_id", "PENDING APPROVAL");
							if (!oInputModel.getProperty("/claim_header/submitted_date")) {
								var submittedDate = this._getJsonDate(new Date());
								oInputModel.setProperty("/claim_header/submitted_date", submittedDate);
							}
							this.onBack_ClaimSubmission();
							break;
						default:
							break;
					}
				}

			} catch (e) {
				// Sync with request error message
				MessageBox.error(e.message || "Submission failed");
			} finally {
				BusyIndicator.hide();
			}
		},

		_updateClaimItems: async function () {
			// get input model
			var oInputModel = this.getView().getModel("claimsubmission_input");
			var itemCountDb = 0;
			var delItems = [];
			BusyIndicator.show(0);


			var aItems = oInputModel.getProperty("/claim_items") || [];

			if (this._CheckDuplicateClaimItems(aItems)) {
				MessageBox.error(Utility.getText("msg_duplication_prompt"));
				BusyIndicator.hide();
				return;
			}


			// count existing items from database
			try {
				var oModel = this.getOwnerComponent().getModel();
				var oListBinding;

				oListBinding = oModel.bindList("/ZCLAIM_ITEM", null,
					[new Sorter("CLAIM_SUB_ID", false)],
					[new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: oInputModel.getProperty("/claim_header/claim_id") })],
					{
						$$ownRequest: true,
						$$groupId: "$auto",
						$$updateGroupId: "$auto"
					}
				);

				var aCtx = await oListBinding.requestContexts();
				itemCountDb = aCtx.length;

				if (itemCountDb > oInputModel.getProperty("/claim_items").length) {
					for (let i = oInputModel.getProperty("/claim_items").length; i < itemCountDb; i++) {
						var oCtx = aCtx[i];
						delItems.push(oCtx);
					}
				}
			} catch (e) {
				console.log(e.message);
				BusyIndicator.hide();
				return false;
			}

			// for each item to be saved
			oInputModel.getProperty("/claim_items").forEach(async (claim_item, i) => {
				try {
					oModel = this.getOwnerComponent().getModel();
					oListBinding = null;

					// set body for update
					var oBody = new JSONModel({
						CLAIM_ID: claim_item.claim_id,
						CLAIM_SUB_ID: claim_item.claim_sub_id,
						CLAIM_TYPE_ITEM_ID: claim_item.claim_type_item_id,
						PERCENTAGE_COMPENSATION: this._nonNan(parseFloat(claim_item.percentage_compensation)).toFixed(2),
						ACCOUNT_NO: claim_item.account_no,
						AMOUNT: this._nonNan(parseFloat(claim_item.amount)).toFixed(2),
						ATTACHMENT_FILE_1: claim_item.attachment_file_1,
						ATTACHMENT_FILE_2: claim_item.attachment_file_2,
						BILL_NO: claim_item.bill_no,
						BILL_DATE: this._getHanaDate(claim_item.bill_date),
						CLAIM_CATEGORY: claim_item.claim_category,
						COUNTRY: claim_item.country,
						DISCLAIMER: claim_item.disclaimer,
						START_DATE: this._getHanaDate(claim_item.start_date),
						END_DATE: this._getHanaDate(claim_item.end_date),
						START_TIME: this._getHanaTime(claim_item.start_time),
						END_TIME: this._getHanaTime(claim_item.end_time),
						FLIGHT_CLASS: claim_item.flight_class,
						FROM_LOCATION: claim_item.from_location,
						FROM_LOCATION_OFFICE: claim_item.from_location_office,
						KM: this._nonNan(parseFloat(claim_item.km)).toFixed(2),
						LOCATION: claim_item.location,
						LOCATION_TYPE: claim_item.location_type,
						LODGING_CATEGORY: claim_item.lodging_category,
						LODGING_ADDRESS: claim_item.lodging_address,
						MARRIAGE_CATEGORY: claim_item.marriage_category,
						AREA: claim_item.area,
						NO_OF_FAMILY_MEMBER: claim_item.no_of_family_member,
						PARKING: this._nonNan(parseFloat(claim_item.parking)),
						PHONE_NO: claim_item.phone_no,
						RATE_PER_KM: claim_item.rate_per_km,
						RECEIPT_DATE: this._getHanaDate(claim_item.receipt_date),
						RECEIPT_NUMBER: claim_item.receipt_number,
						REMARK: claim_item.remark,
						ROOM_TYPE: claim_item.room_type,
						REGION: claim_item.region,
						FROM_STATE_ID: claim_item.from_state_id,
						TO_STATE_ID: claim_item.to_state_id,
						TO_LOCATION: claim_item.to_location,
						TO_LOCATION_OFFICE: claim_item.to_location_office,
						TOLL: this._nonNan(parseFloat(claim_item.toll)).toFixed(2),
						TOTAL_EXP_AMOUNT: this._nonNan(parseFloat(claim_item.total_exp_amount)).toFixed(2),
						VEHICLE_TYPE: claim_item.vehicle_type,
						VEHICLE_FARE: claim_item.vehicle_fare,
						TRIP_START_DATE: this._getHanaDate(claim_item.trip_start_date),
						TRIP_END_DATE: this._getHanaDate(claim_item.trip_end_date),
						EVENT_START_DATE: this._getHanaDate(claim_item.event_start_date),
						EVENT_END_DATE: this._getHanaDate(claim_item.event_end_date),
						TRAVEL_DURATION_DAY: this._nonNan(parseFloat(claim_item.travel_duration_day)).toFixed(1),
						TRAVEL_DURATION_HOUR: this._nonNan(parseFloat(claim_item.travel_duration_hour)).toFixed(1),
						PROVIDED_BREAKFAST: claim_item.provided_breakfast,
						PROVIDED_LUNCH: claim_item.provided_lunch,
						PROVIDED_DINNER: claim_item.provided_dinner,
						ENTITLED_BREAKFAST: claim_item.entitled_breakfast,
						ENTITLED_LUNCH: claim_item.entitled_lunch,
						ENTITLED_DINNER: claim_item.entitled_dinner,
						ANGGOTA_ID: claim_item.anggota_id,
						ANGGOTA_NAME: claim_item.anggota_name,
						DEPENDENT_NAME: claim_item.dependent_name,
						TYPE_OF_PROFESSIONAL_BODY: claim_item.type_of_professional_body,
						DISCLAIMER_GALAKAN: claim_item.disclaimer_galakan,
						MODE_OF_TRANSFER: claim_item.mode_of_transfer,
						TRANSFER_DATE: this._getHanaDate(claim_item.transfer_date),
						NO_OF_DAYS: claim_item.no_of_days,
						FAMILY_COUNT: claim_item.family_count,
						FUNERAL_TRANSPORTATION: claim_item.funeral_transportation,
						ROUND_TRIP: claim_item.round_trip,
						TRIP_END_TIME: this._getHanaTime(claim_item.trip_end_time),
						TRIP_START_TIME: this._getHanaTime(claim_item.trip_start_time),
						COST_CENTER: claim_item.cost_center,
						GL_ACCOUNT: claim_item.gl_account,
						MATERIAL_CODE: claim_item.material_code,
						VEHICLE_OWNERSHIP_ID: claim_item.vehicle_ownership_id,
						ACTUAL_AMOUNT: this._nonNan(parseFloat(claim_item.actual_amount)).toFixed(2),
						ARRIVAL_TIME: this._getHanaTime(claim_item.arrival_time),
						CLAIM_TYPE_ID: claim_item.claim_type_id,
						COURSE_TITLE: claim_item.course_title,
						CURRENCY_AMOUNT: this._nonNan(parseFloat(claim_item.currency_amount)).toFixed(2),
						CURRENCY_CODE: claim_item.currency_code,
						CURRENCY_RATE: this._nonNan(parseFloat(claim_item.currency_rate)).toFixed(2),
						DEPARTURE_TIME: this._getHanaTime(claim_item.departure_time),
						DEPENDENT: claim_item.dependent,
						DEPENDENT_RELATIONSHIP: claim_item.dependent_relationship,
						EMP_ID: claim_item.emp_id,
						FARE_TYPE_ID: claim_item.fare_type_id,
						INSURANCE_CERT_END_DATE: this._getHanaDate(claim_item.insurance_cert_end_date),
						INSURANCE_CERT_START_DATE: this._getHanaDate(claim_item.insurance_cert_start_date),
						INSURANCE_PACKAGE_ID: claim_item.insurance_package_id,
						INSURANCE_PROVIDER_ID: claim_item.insurance_provider_id,
						INSURANCE_PROVIDER_NAME: claim_item.insurance_provider_name,
						INSURANCE_PURCHASE_DATE: this._getHanaDate(claim_item.insurance_purchase_date),
						METER_CUBE_ACTUAL: this._nonNan(parseFloat(claim_item.meter_cube_actual)).toFixed(2),
						METER_CUBE_ENTITLED: this._nonNan(parseFloat(claim_item.meter_cube_entitled)).toFixed(2),
						MOBILE_CATEGORY_PURPOSE_ID: claim_item.mobile_category_purpose_id,
						NEED_FOREIGN_CURRENCY: claim_item.need_foreign_currency,
						POLICY_NUMBER: claim_item.policy_number,
						PURPOSE: claim_item.purpose,
						REQUEST_APPROVAL_AMOUNT: claim_item.request_approval_amount,
						STUDY_LEVELS_ID: claim_item.study_levels_id,
						TRAVEL_DAYS_ID: claim_item.travel_days_id,
						VEHICLE_CLASS_ID: claim_item.vehicle_class_id
					});

					if (i >= itemCountDb) {
						// create new item
						oListBinding = oModel.bindList("/ZCLAIM_ITEM");
						var oContext = oListBinding.create(oBody.getData());
						await oContext.created().then(() => {
							console.log("New claim item created");
						});
					}
					else {
						oListBinding = oModel.bindList("/ZCLAIM_ITEM", null, null,
							[
								new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: claim_item.claim_id }),
								new Filter({ path: "CLAIM_SUB_ID", operator: FilterOperator.EQ, value1: claim_item.claim_sub_id })
							],
							{
								$$ownRequest: true,
								$$groupId: "$auto",
								$$updateGroupId: "$auto"
							}
						);

						aCtx = await oListBinding.requestContexts(0, 1);
						oCtx = aCtx[0];

						if (!oCtx) {
							throw new Error("Claim item not found in database");
						}
						else {
							for (const [key, value] of Object.entries(oBody.getData())) {
								oCtx.setProperty(key, value);
							}

							await oModel.submitBatch("$auto");

							console.log("Save claim item success");
						}
					}
				} catch (e) {
					console.error(e.message);
					BusyIndicator.hide();
					return false;
				}
			})

			// for each item to be deleted
			delItems.forEach(async (claim_item) => {
				try {
					oModel = this.getOwnerComponent().getModel();
					oListBinding = null;

					oListBinding = oModel.bindList("/ZCLAIM_ITEM", null, null,
						[
							new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: claim_item.getProperty("CLAIM_ID") }),
							new Filter({ path: "CLAIM_SUB_ID", operator: FilterOperator.EQ, value1: claim_item.getProperty("CLAIM_SUB_ID") })
						],
						{
							$$ownRequest: true,
							$$groupId: "$auto",
							$$updateGroupId: "$auto"
						}
					);

					var aCtx = await oListBinding.requestContexts(0, 1);
					var oCtx = aCtx[0];

					await oCtx.delete().then(function () {
						console.log("Claim item deleted");
					});
				} catch (e) {
					console.error(e.message);
					BusyIndicator.hide();
					return false;
				}
			})
			BusyIndicator.hide();
			return true;
		},

		//Added for duplication check items via Save Draft and Submit Report btn

		_CheckDuplicateClaimItems: function (aDupCheckItems) {

			const aDuplicateSet = new Set();

			for (let oItem of aDupCheckItems) {

				const sTypeId = oItem.claim_type_id || "";
				const sItemId = oItem.claim_type_item_id || "";

				const sStartDate = DateUtility.formatDate(
					oItem.start_date,
					this._oConstant.Date.DATEFORMAT
				);

				const sEndDate = DateUtility.formatDate(
					oItem.end_date,
					this._oConstant.Date.DATEFORMAT
				);

				const sAmount = parseFloat(oItem.amount || 0).toFixed(2);

				// Build unique key
				const sKey = `${sTypeId}|${sItemId}|${sStartDate}|${sEndDate}|${sAmount}`;

				if (aDuplicateSet.has(sKey)) {
					return true;
				}

				aDuplicateSet.add(sKey);
			}

			return false;
		},

		_getJsonDate: function (iDate) {
			if (iDate) {
				var oDate = new Date(iDate);
				var oDateString = oDate.toLocaleString('default', { day: '2-digit' }) + " " + oDate.toLocaleString('default', { month: 'short' }) + " " + oDate.toLocaleString('default', { year: 'numeric' });
				return oDateString;
			} else {
				return null;
			}
		},

		_getHanaDate: function (iDate) {
			if (iDate) {
				var oDate = new Date(iDate);
				var oDateString = oDate.getFullYear() + '-' + ('0' + (oDate.getMonth() + 1)).slice(-2) + '-' + ('0' + oDate.getDate()).slice(-2);
				return oDateString;
			} else {
				return null;
			}
		},

		_getHanaTime: function (iTime) {
			if (iTime) {
				var oDate = new Date(iTime);
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

		_getCurrentReportNumber: async function (rangeId) {
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
							value1: rangeId
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
					throw new Error(`${rangeId} not found`);
				}

				var row = oCtx.getObject();
				if (row.CURRENT == null) {
					throw new Error(`${rangeId} missing CURRENT`);
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
				MessageBox.error(Utility.getText("msg_claimsubmission_numrange_err", [err]));
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

		onBack_ClaimSubmission: async function (oSideNav) {
			// remove approval log fragment
			if (await this._getFormFragment("approval_log")) {
				this._setApprovalLog(false);
			}

			// reset UI from approver page
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (oClaimSubmissionModel.getProperty("/view_only")) {
				this._setClaimItemTableToolbar(true);
			}
			if (oSideNav) {
				return;
			}
			else if (oClaimSubmissionModel.getProperty("/is_approver")) {
				// update footer buttons
				//this._displayFooterButtons("claimsubmission_summary_claimitem");
				this.updateFooterState(this._oConstant.ClaimFooterMode.SUMMARY);

				// return to approver screen
				this.getMyApproverPAReq();
				this.getMyApproverClaim();

				var oRouter = this.getOwnerComponent().getRouter();
				this._onNavBack();
			}
			else {
				this._onNavBack();
			}
		},

		_newDialog: function (oTitle, oContent, onPress, onPressE) {
			this.oDialog = new Dialog({
				title: oTitle,
				type: "Message",
				state: "None",
				content: [new Label({ text: oContent })],
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
					press: async function () {
						this.oDialog.close();
						if (onPressE) {
							await onPressE();
						}
					}.bind(this)
				})
			});
			this.oDialog.open();
		},

		getFromLocationOfficeByState: function () {
			var _oSelect = this.byId("select_claimdetails_input_from_location");
			var _oBinding = _oSelect.getBinding("items");
			if (!_oBinding) {
				return;
			}

			var _oInputModel = this.getView().getModel("claimitem_input");
			if (!_oInputModel) {
				return;
			}

			var _aFilters = [
				new Filter("STATUS", FilterOperator.EQ, this._oConstant.Status.ACTIVE),
				new Filter("STATE_ID", FilterOperator.EQ, _oInputModel.getProperty("/claim_item/from_state_id"))
			];
			_oBinding.filter(_aFilters);
		},

		getToLocationOfficeByState: function () {
			var _oSelect = this.byId("select_claimdetails_input_to_location");
			var _oBinding = _oSelect.getBinding("items");
			if (!_oBinding) {
				return;
			}

			var _oInputModel = this.getView().getModel("claimitem_input");
			if (!_oInputModel) {
				return;
			}

			var _aFilters = [
				new Filter("STATUS", FilterOperator.EQ, this._oConstant.Status.ACTIVE),
				new Filter("STATE_ID", FilterOperator.EQ, _oInputModel.getProperty("/claim_item/to_state_id"))
			];
			_oBinding.filter(_aFilters);
		},

		// App Control Visibility
		getFieldVisibility_ClaimTypeItem: async function () {
			const oModel = this.getOwnerComponent().getModel();
			var oInputModel = this.getView().getModel("claimitem_input");

			const sClaimTypeItemFromModel = oInputModel.getProperty("/claim_item/claim_type_item_id");
			const sClaimTypeID = oInputModel.getProperty("/claim_item/claim_type_id");
			const sClaim_type_item = sClaimTypeItemFromModel;

			if (!sClaim_type_item) {
				console.warn("No claim item found.");
				return;
			}

			const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
				new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.ClaimFieldVisibilityConfig.SUBMISSION_TYPE),
				new Filter("COMPONENT_LEVEL", FilterOperator.EQ, this._oConstant.ClaimFieldVisibilityConfig.ITEM),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaim_type_item),
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimTypeID)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);

				if (!aCtx || aCtx.length === 0) {
					MessageBox.error("No configuration rows for claim type item:", sClaim_type_item);
					this._setAllControlsVisible(false);
					return;
				}
				const oData = aCtx[0].getObject();

				const aFieldIds = oData.FIELD.replace(/[\[\]\s]/g, "").split(",");

				if (aFieldIds != []) {
					oInputModel.setProperty("/screen_array", aFieldIds);
					this._setAllControlsVisible(false);
					aFieldIds.forEach(id => {
						const control = this._resolveControl(id, "claimsubmission_claimdetails_input");
						if (control && typeof control.setVisible === "function") {
							control.setVisible(true);
						} else {
							console.warn("Control not found or not visible-capable:", id);
						}
					});
				} else {
					this._setAllControlsVisible(false);
				}

				// ------------------------------------------------------------------
				// Force correct visibility of state & location fields on screen load
				// ------------------------------------------------------------------
				var sLocType = oInputModel.getProperty("/claim_item/location_type");
				if (sLocType === this._oConstant.LocationType.OTHER) { // Other Location

					// Show Other Location fields (Input)
					this.byId("input_claimdetails_input_from_location")?.setVisible(true);
					this.byId("input_claimdetails_input_to_location")?.setVisible(true);

					// Hide KWSP Office fields (Select)
					this.byId("select_claimdetails_input_from_state_id")?.setVisible(false);
					this.byId("select_claimdetails_input_to_state_id")?.setVisible(false);
					this.byId("select_claimdetails_input_from_location")?.setVisible(false);
					this.byId("select_claimdetails_input_to_location")?.setVisible(false);
				}
				else if (sLocType === this._oConstant.LocationType.KWSP) { // KWSP Office	

					// Hide Other Location fields (Input)
					this.byId("input_claimdetails_input_from_location")?.setVisible(false);
					this.byId("input_claimdetails_input_to_location")?.setVisible(false);

					// Show KWSP Office fields (Select)
					this.byId("select_claimdetails_input_from_state_id")?.setVisible(true);
					this.byId("select_claimdetails_input_to_state_id")?.setVisible(true);
					this.byId("select_claimdetails_input_from_location")?.setVisible(true);
					this.byId("select_claimdetails_input_to_location")?.setVisible(true);
				}

			} catch (err) {
				console.error("OData bindList failed:", err);
			}
		},

		_setAllControlsVisible: function (bVisible) {
			const aControlIds = [
				"input_claimdetails_input_anggota_name",
				"input_claimdetails_input_dependent_name",
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
				"input_claimdetails_input_no_of_days",
				"select_claimdetails_input_vehicle_type",
				"select_claimdetails_input_vehicle_ownership_id",
				"input_claimdetails_input_km",
				"input_claimdetails_input_rate_per_km",
				"select_claimdetails_input_fare_type_id",
				"select_claimdetails_input_vehicle_class_id",
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
				"select_claimdetails_input_currency_code",
				"input_claimdetails_input_currency_rate",
				"input_claimdetails_input_currency_amount",
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
				"checkbox_claimdetails_input_disclaimer_galakan",
				"input_claimdetails_input_remarks",
				"fileuploader_claimdetails_input_attachment1",
				"fileuploader_claimdetails_input_attachment2",
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

		_getFieldEditable_ClaimTypeItem: async function () {
			const oModel = this.getOwnerComponent().getModel();
			var oInputModel = this.getView().getModel("claimitem_input");
			var screenArray = oInputModel.getProperty("/screen_array");

			if (!screenArray) {
				console.warn("Cannot get field list for claim items");
				this._setAllControlsEditable(true);
				return;
			}
			else {
				this._setAllControlsEditable(true);
				this.byId("select_claimdetails_input_claimitem").setEditable(false);
				screenArray.forEach(id => {
					const control = this._resolveControl(id, "claimsubmission_claimdetails_input");

					if (!control) {
						console.warn("Control not found or not editable-capable:", id);
						return;
					}

					if (control && typeof control.setEditable === "function") {
						control.setEditable(false);
					} else if (control.getMetadata().getName().includes("FileUploader")) {
						control.setVisible(false);

						// set button to open attachment
						var fieldNumber = control.getId().slice(-1);
						var openAttachment = this.byId("button_claimdetails_input_attachment" + fieldNumber);
						if (openAttachment && !openAttachment.getVisible()) {
							openAttachment.setVisible(true);
						}
					} else if (control instanceof sap.ui.mdc.Field) {
						control.setEditMode("Display");
					}
				});
			}
		},

		_setAllControlsEditable: function (bEditable) {
			const aControlIds = [
				"input_claimdetails_input_anggota_name",
				"input_claimdetails_input_dependent_name",
				"select_claimdetails_input_type_of_professional_body",
				"input_claimdetails_input_policy_number",
				"select_claimdetails_input_funeral_transportation",
				"input_claimdetails_input_actual_amount",
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
				"input_claimdetails_input_no_of_days",
				"select_claimdetails_input_vehicle_type",
				"select_claimdetails_input_vehicle_ownership_id",
				"input_claimdetails_input_km",
				"select_claimdetails_input_fare_type_id",
				"select_claimdetails_input_vehicle_class_id",
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
				"select_claimdetails_input_currency_code",
				"input_claimdetails_input_currency_rate",
				"input_claimdetails_input_currency_amount",
				"datepicker_claimdetails_input_trip_start_date",
				"timepicker_claimdetails_input_trip_starttime",
				"timepicker_claimdetails_input_departure_time",
				"datepicker_claimdetails_input_trip_end_date",
				"timepicker_claimdetails_input_trip_endtime",
				"timepicker_claimdetails_input_arrival_time",
				"input_claimdetails_input_provided_breakfast",
				"input_claimdetails_input_provided_lunch",
				"input_claimdetails_input_provided_dinner",
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
				"checkbox_claimdetails_input_disclaimer_galakan",
				"input_claimdetails_input_remarks",
				"fileuploader_claimdetails_input_attachment_file_1",
				"fileuploader_claimdetails_input_attachment_file_2",
			];

			aControlIds.forEach(id => {
				const c = this._resolveControl(id, "claimsubmission_claimdetails_input");
				if (c && typeof c.setEditable === "function") {
					c.setEditable(bEditable);
				} else if (c.getMetadata().getName().includes("FileUploader")) {
					if (c.getVisible() !== bEditable) {
						c.setVisible(bEditable);
					}

					// set button to open attachment
					var fieldNumber = c.getId().slice(-1);
					var openAttachment = this.byId("button_claimdetails_input_attachment" + fieldNumber);
					if (openAttachment && openAttachment.getVisible() === bEditable) {
						openAttachment.setVisible(!bEditable);
					}
				} else {
					console.warn("Control not found or not editable-capable:", id);
				}
			});
		},

		//Start Add - Aiman Salim - 03/03/2026 - Add for excel functionality.
		_sanitizeFileName: function (s) {
			return (s || "")
				.replace(/[\\/:*?"<>|]/g, "_")
				.replace(/\s+/g, " ")
				.trim()
				.substring(0, 80);
		},

		_getTodayString: function () {
			const d = new Date();
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${y}-${m}-${day}`;
		},

		_getExcelFileName: function () {
			const input = this.getView().getModel("claimsubmission_input")?.getData() || {};
			const id = input?.claim_header?.claim_id ?? "Claim";
			return this._sanitizeFileName(`Claim_${id}_${this._getTodayString()}.xlsx`);
		},

		onDownloadExcelReport: async function () {
			const oView = this.getView();
			const oExcel = window.XLSX;

			function _num(iVal) {
				if (iVal === null || iVal === undefined || iVal === "") return null;
				const i = Number(iVal);
				return Number.isFinite(i) ? i : null;
			}

			function _applyColumnMeta(oWorksheet, aColumns, iStartDataRow) {
				oWorksheet["!cols"] = aColumns.map(oColumn => ({ wch: oColumn.width || 12 }));

				const sReference = oWorksheet["!ref"]; // reference to cell range
				if (!sReference) return;

				const sRange = oExcel.utils.decode_range(sReference);

				for (let iColumn = 0; iColumn < aColumns.length; iColumn++) {
					const oMeta = aColumns[iColumn];
					if (!oMeta.type) continue;

					for (let iRow = iStartDataRow; iRow <= sRange.e.r; iRow++) {
						const oAddress = oExcel.utils.encode_cell({ iColumn, iRow });
						const oCell = oWorksheet[oAddress];
						if (!oCell) continue;

						// FORCE DATE FORMAT YYYY-MM-DD

						if (oMeta.type === "date") {
							const oDate = DateUtility.toDate(oCell.v);

							if (oDate) {
								oCell.t = "d";
								oCell.v = oDate;
								oCell.z = "yyyy-mm-dd";
							} else {
								// clear invalid date to avoid showing 1970-01-01
								delete oWorksheet[oAddress];
							}
						}

						// Time
						if (oMeta.type === "time") {
							const oTime = DateUtility.toTime(oCell.v);

							if (oTime) {
								oCell.t = "d";
								oCell.v = oTime;
								oCell.z = "hh:mm:ss";
							} else {
								// clear invalid date to avoid showing incorrect time
								delete oWorksheet[oAddress];
							}
						}

						// Numbers
						if (oMeta.type === "number") {
							const iNumber = _num(oCell.v);
							if (iNumber === null) {
								delete oWorksheet[oAddress];
							} else {
								oCell.t = "n";
								oCell.v = iNumber;
								oCell.z = oMeta.scale === 2 ? "#,##0.00" : "#,##0";
							}
						}
					}
				}
			}

			try {
				oView.setBusy(true);

				const oInput = oView.getModel("claimsubmission_input")?.getData();
				if (!oInput) {
					MessageBox.error(Utility.getText("msg_claimsubmission_noload"));
					return;
				}

				const oHeader = oInput.claim_header || {};
				const aItems = oInput.claim_items || [];

				// -------------------------------
				// Build Header Row
				// -------------------------------
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

				const aHeaderLabels = aHeaderColumns.map(oColumn => oColumn.label);
				const aHeaderValues = aHeaderColumns.map(oColumn => oHeaderRow[oColumn.property] ?? "");

				const oWorksheetHeader = oExcel.utils.aoa_to_sheet([aHeaderLabels, aHeaderValues]);
				_applyColumnMeta(oWorksheetHeader, aHeaderColumns, 1);

				// -------------------------------
				// Items Sheet
				// -------------------------------
				const aItemsColumnsMain = [
					{ label: Utility.getText("label_claimdetails_input_claim_id"), property: "claim_id", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_claim_sub_id"), property: "claim_sub_id", width: 20 },
					{ label: Utility.getText("label_claimdetails_input_claimtype"), property: "claim_type_id", type: "descr", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_claimitem"), property: "claim_type_item_id", type: "descr", width: 30 },
				];

				const aClaimDetailColumns = [
					{ label: Utility.getText("label_claimdetails_input_anggota"), property: "anggota_name", field: "input_claimdetails_input_anggota_name", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_dependent"), property: "dependent_name", field: "input_claimdetails_input_dependent_name", width: 30 },
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
					{ label: Utility.getText("label_claimdetails_input_numberofdays"), property: "no_of_days", field: "input_claimdetails_input_no_of_days", type: "number", scale: 0, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_typeofvehicle"), property: "vehicle_type", field: "select_claimdetails_input_vehicle_type", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_vehicleownership"), property: "vehicle_ownership_id", field: "select_claimdetails_input_vehicle_ownership_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_km"), property: "km", field: "input_claimdetails_input_km", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_km_rate"), property: "rate_per_km", field: "input_claimdetails_input_rate_per_km", width: 14 },
					{ label: Utility.getText("label_claimdetails_input_faretype"), property: "fare_type_id", field: "select_claimdetails_input_fare_type_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_vehicleclass"), property: "vehicle_class_id", field: "select_claimdetails_input_vehicle_class_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_flightclass"), property: "flight_class", field: "select_claimdetails_input_flight_class", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_toll"), property: "toll", field: "input_claimdetails_input_toll", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_parking"), property: "parking", field: "checkbox_claimdetails_input_parking", width: 10 },
					{ label: Utility.getText("label_claimdetails_input_locationtype"), property: "location_type", field: "select_claimdetails_input_location_type", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_state_from"), property: "from_state_id", field: "input_claimdetails_input_from_state_id", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_location_from"), property: "from_location", field: "input_claimdetails_input_from_location", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_state_to"), property: "to_state_id", field: "input_claimdetails_input_to_state_id", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_location_to"), property: "to_location", field: "input_claimdetails_input_to_location", width: 18 },
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
					{ label: Utility.getText("label_claimdetails_input_attachment1"), property: "attachment_file_1", field: "fileuploader_claimdetails_input_attachment_file_1", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_attachment2"), property: "attachment_file_2", field: "fileuploader_claimdetails_input_attachment_file_2", width: 30 },
				];

				// find claim type items used
				const aClaimTypeItems = aItems.map(oItem => {
					return { claim_type_id: oItem.claim_type_id, claim_type_item_id: oItem.claim_type_item_id };
				});
				//// remove duplicates
				const aClaimTypeItemsUnique = [
					...new Set(aClaimTypeItems.map(oItem => JSON.stringify(oItem)))
				].map(oItem => JSON.parse(oItem));

				// get columns based on claim type items used
				var aItemsColumns = aItemsColumnsMain;
				BusyIndicator.show(0);
				for (var i = 0; i < aClaimTypeItemsUnique.length; i++) {
					var oClaimTypeItem = aClaimTypeItemsUnique[i];
					const oModel = this.getOwnerComponent().getModel();
					const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
						new Filter("SUBMISSION_TYPE", FilterOperator.EQ, this._oConstant.ClaimFieldVisibilityConfig.SUBMISSION_TYPE),
						new Filter("COMPONENT_LEVEL", FilterOperator.EQ, this._oConstant.ClaimFieldVisibilityConfig.ITEM),
						new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oClaimTypeItem.claim_type_item_id),
						new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oClaimTypeItem.claim_type_id)
					]);

					const aCtx = await oListBinding.requestContexts(0, Infinity);

					if (!aCtx || aCtx.length === 0) {
						continue;
					}
					else {
						const oData = aCtx[0].getObject();
						const aFieldIds = oData.FIELD.replace(/[\[\]\s]/g, "").split(",");

						if (aFieldIds != []) {
							for (var i = 0; i < aClaimDetailColumns.length; i++) {
								if (aFieldIds.includes(aClaimDetailColumns[i]["field"]) && aItemsColumns.some(oColumn => oColumn["field"]) !== aClaimDetailColumns[i]["field"]) {
									aItemsColumns.push(aClaimDetailColumns[i]);
								}
							}
						} else {
							continue;
						}
					}
				}

				// set labels for claim item columns
				const aItemsLabels = aItemsColumns.map(oColumn => oColumn.label);

				// get item values to include in excel
				const aItemRows = aItems.map(oItem => {
					return aItemsColumns.map(oColumn => {
						if (oColumn.type === "date") return DateUtility.toDate(oItem[oColumn.property]);
						if (oColumn.type === "time") return DateUtility.toTime(oItem[oColumn.property]);
						if (oColumn.type === "number") return _num(oItem[oColumn.property]);
						if (oColumn.type === "descr") return (oItem["descr"][oColumn.property] || oItem[oColumn.property]);
						return oItem[oColumn.property] ?? "";
					});
				});

				const oWorksheetItems = oExcel.utils.aoa_to_sheet([aItemsLabels, ...aItemRows]);
				_applyColumnMeta(oWorksheetItems, aItemsColumns, 1);

				const oWorkbook = oExcel.utils.book_new();
				oExcel.utils.book_append_sheet(oWorkbook, oWorksheetHeader, "Header");
				oExcel.utils.book_append_sheet(oWorkbook, oWorksheetItems, "Items");

				oExcel.writeFile(oWorkbook, this._getExcelFileName(), {
					bookType: "xlsx",
					cellDates: true,
					compression: true
				});

			} catch (e) {
				MessageBox.error(Utility.getText("msg_claimsubmission_excel", [e]));
			} finally {
				oView.setBusy(false);
				BusyIndicator.hide();
			}
		},
		//End

		//Aiman Salim - 08/03/2026 - MyApproval - My Pre-Approval Request Status;
		getMyApproverPAReq: async function () {
			const oReq = this.getOwnerComponent().getModel("request_status");
			const oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");
			var sUserId = this._oSessionModel.getProperty("/userId");

			const oApproverOrSub = new Filter({
				filters: [
					new Filter("APPROVER_ID", FilterOperator.EQ, sUserId),
					new Filter("SUBSTITUTE_APPROVER_ID", FilterOperator.EQ, sUserId)
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


			const oListBinding = oEmployeeViewModel.bindList("/ZEMP_APPROVER_REQUEST_DETAILS", undefined,
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
			const oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");
			var sUserId = this._oSessionModel.getProperty("/userId");

			const oApproverOrSub = new Filter({
				filters: [
					new Filter("APPROVER_ID", FilterOperator.EQ, sUserId),
					new Filter("SUBSTITUTE_APPROVER_ID", FilterOperator.EQ, sUserId)
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
			const oListBinding = oEmployeeViewModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
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

		//AS - Added to standardize footer button set visibility - 02/04/2026
		updateFooterState: function (sMode) {
			const oClaimModel = this.getView().getModel("claimsubmission_input");

			const sStatusId = oClaimModel.getProperty("/claim_header/status_id");
			const iItemCount = oClaimModel.getProperty("/claim_items_count");
			const bViewOnly = oClaimModel.getProperty("/view_only");
			const bIsApprover = oClaimModel.getProperty("/is_approver");

			const oButtons = {
				oBtnReject: this.byId("button_claimapprover_reject"),
				oBtnBackToEmp: this.byId("button_claimapprover_backtoemp"),
				oBtnApprove: this.byId("button_claimapprover_approve"),

				oBtnSaveDraft: this.byId("button_claimsubmission_savedraft"),
				oBtnDeleteReport: this.byId("button_claimsubmission_deletereport"),
				oBtnSubmitReport: this.byId("button_claimsubmission_submitreport"),
				oBtnBack: this.byId("button_claimsubmission_back"),

				oBtnDetailSave: this.byId("button_claimdetails_input_save"),
				oBtnDetailCancel: this.byId("button_claimdetails_input_cancel")
			};

			Object.values(oButtons).forEach(oButton => oButton?.setVisible(false));
			const oModeButtons = {
				SUMMARY: ["oBtnSaveDraft", "oBtnDeleteReport", "oBtnSubmitReport", "oBtnBack"],
				DETAILS: ["oBtnDetailSave", "oBtnDetailCancel"],
				APPROVER: ["oBtnReject", "oBtnBackToEmp", "oBtnApprove", "oBtnBack"],
				VIEW_ONLY: ["oBtnBack"]
			};

			const aVisibleKeys = oModeButtons[sMode] || [];
			aVisibleKeys.forEach(sButtonKey => {
				oButtons[sButtonKey]?.setVisible(true);
			});

			const bIsFinalStatus =
				sStatusId === this._oConstant.ClaimStatus.CANCELLED ||
				sStatusId === this._oConstant.ClaimStatus.PENDING_APPROVAL ||
				sStatusId === this._oConstant.ClaimStatus.APPROVED ||
				sStatusId === this._oConstant.ClaimStatus.COMPLETED_DISBURSEMENT;

			if (bIsFinalStatus) {
				oButtons.oBtnSaveDraft?.setEnabled(false);
				oButtons.oBtnDeleteReport?.setEnabled(false);
				oButtons.oBtnSubmitReport?.setEnabled(false);

			} else {
				// Editable states
				oButtons.oBtnSaveDraft?.setEnabled(true);
				oButtons.oBtnDeleteReport?.setEnabled(true);

				const bAllowSubmit =
					sStatusId === this._oConstant.ClaimStatus.DRAFT ||
					sStatusId === this._oConstant.ClaimStatus.SEND_BACK;

				oButtons.oBtnSubmitReport?.setEnabled(bAllowSubmit);
			}
		}
	});
});
