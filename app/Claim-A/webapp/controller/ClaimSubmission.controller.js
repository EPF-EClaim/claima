sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (
	Fragment,
	Controller,
	JSONModel,
	MessageToast
) {
	"use strict";

	return Controller.extend("claima.controller.ClaimSubmission", {
		onInit: function () {
			// Claim Submission Model
			// // set "input" model data
			// let oCurrent = this.getView().getModel("current");
			// if (!oCurrent) {
			// 	oCurrent = new sap.ui.model.json.JSONModel();
			// 	this.getView().setModel(oCurrent, "current");
			// }

			// Set the initial form to show claim summary
			if (!this._formFragments) {
				this._formFragments = {};
				this._showInitFormFragment();
			}
		},
 
		_getInputModel: function () {
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (oClaimSubmissionModel) {
				oClaimSubmissionModel.getData();
				// set input
				this.getView().setModel(oClaimSubmissionModel, "claimsubmission_input");
			}

			// oReportModel
			var oReportModel = this.getView().getModel("report");
			if (oReportModel) {
				oReportModel.getData();
				// set input
				this.getView().setModel(oReportModel, "report");
			}
		},

		_getFormFragment: function (sFragmentName) {
			var pFormFragment = this._formFragments[sFragmentName],
				oView = this.getView();

			if (!pFormFragment) {
				pFormFragment = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sFragmentName,
					controller: this
				});
				this._formFragments[sFragmentName] = pFormFragment;
			}

			return pFormFragment;
		},

		_showInitFormFragment: function () {
			var oPage = this.byId("page_claimsubmission");

			// display 
			this._getFormFragment("claimsubmission_summary_claimheader").then(function (oVBox) {
				oPage.insertContent(oVBox, 0);
			});
			this._getFormFragment("claimsubmission_summary_claimitem").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
		},

		_getNewClaimItemModel: function (modelName) {
			// Claim Item Model
			var oClaimItemModel = new JSONModel({
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
				}
			});
			//// set input
			this.getView().setModel(oClaimItemModel, modelName);
			return this.getView().getModel(modelName);
		},

		onCreateClaim_ClaimSummary: async function () {
			// show claim details screen
			var oPage = this.byId("page_claimsubmission");
			var oClaimItemFragment = this._getFormFragment("claimsubmission_summary_claimitem");
			if (oClaimItemFragment) {
				oClaimItemFragment.then(function (oVBox) {
					oPage.removeContent(oVBox);
				});
			}
			const fpromise = await this._getFormFragment("claimsubmission_claimdetails_input").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
			// set new claim submission model;
			this._testClaimItem();
		},

		_testClaimItem: function () {
			// change footer buttons
			this._displayFooterButtons("claimsubmission_claimdetails_input");

			// set claim item model
			var oInputModel = this._getNewClaimItemModel("claimitem_input");

			// update claim item selection
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			this.byId("select_claimdetails_input_claimitem").bindAggregation("items", {
				path: "employee>/ZCLAIM_TYPE_ITEM",
				filters: [new sap.ui.model.Filter('CLAIM_TYPE_ID', sap.ui.model.FilterOperator.EQ, oClaimSubmissionModel.getProperty("/claim_header/claim_type_id"))],
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
		},

		onScanReceipt_ClaimSummary: function () {
			MessageToast.show("reachable scanreceipt");
		},

		_displayFooterButtons: function (oId) {
			var button = [
				"button_claimsubmission_savedraft",
				"button_claimsubmission_deletereport",
				"button_claimsubmission_submitreport",
				"button_claimsubmission_back",

				"button_claimdetails_input_save",
				"button_claimdetails_input_cancel",
			];
			var button_claimsummary = [
				"button_claimsubmission_savedraft",
				"button_claimsubmission_deletereport",
				"button_claimsubmission_submitreport",
				"button_claimsubmission_back"
			];
			var button_claimdetails = [
				"button_claimdetails_input_save",
				"button_claimdetails_input_cancel",
			];

			// select visible buttons based on visible fragment
			var button_set;
			switch (oId) {
				case "claimsubmission_summary_claimitem":
					button_set = button_claimsummary;
					break;
				case "claimsubmission_claimdetails_input":
					button_set = button_claimdetails;
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

		onSelect_ClaimDetails_ClaimItem: function (oEvent) {
			// validate claim item
			var claimItem = oEvent.getParameters().selectedItem;
			if (claimItem) {
				// get category values from claim item
				var claimCategoryDesc = claimItem.getBindingContext("employee").getObject("ZCLAIM_CATEGORY/CLAIM_CATEGORY_DESC");

				// show claim item category in category input
				this.byId("input_claimdetails_input_category").setValue(claimCategoryDesc);
			}
		},

		onSave_ClaimDetails: async function () {
			// validate required fields
			if (
				!this.byId("select_claimdetails_input_claimitem").getSelectedItem() ||
				!this.byId("input_claimdetails_input_amt").getValue() ||
				!this.byId("datepicker_claimdetails_input_tripstartdate").getValue() ||
				!this.byId("datepicker_claimdetails_input_tripenddate").getValue()
			) {
				// stop claim submission if values empty
				MessageToast.show(this._getTexti18n("msg_claiminput_required"));
				return;
			}
			// validate date range
			//// trip start/end date
			if (!this._validDateRange("datepicker_claimdetails_input_tripstartdate", "datepicker_claimdetails_input_tripenddate")) {
				// stop claim details if incomplete
				return;
			}

			// validate input data
			var oInputModel = this.getView().getModel("claimitem_input");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			//// get claim item sub ID
			oInputModel.setProperty("/claim_id", oClaimSubmissionModel.getProperty("/claim_header/claim_id"));
			oInputModel.setProperty("/claim_sub_id", ('00' + oClaimSubmissionModel.getProperty("/claim_items").length+1).slice(-3));
			//// get claim type from claim header
			oInputModel.setProperty("/claim_type_id", oClaimSubmissionModel.getProperty("/claim_header/claim_type_id"));
			//// get claim category key
			oInputModel.setProperty("/claim_category", this.byId("select_claimdetails_input_claimitem").getSelectedItem().getBindingContext("employee").getObject("CATEGORY_ID"));
			//// get descriptions
			oInputModel.setProperty("/descr/claim_type_id", oClaimSubmissionModel.getProperty("/claim_header/descr/claim_type_id"));
			oInputModel.setProperty("/descr/claim_type_item_id", this.byId("select_claimdetails_input_claimitem")._getSelectedItemText());
			oInputModel.setProperty("/descr/claim_category", this.byId("select_claimdetails_input_claimitem")._getSelectedItemText());
			// add claim item details to claim submission model
			oClaimSubmissionModel.setProperty("/claim_items", oClaimSubmissionModel.getProperty("/claim_items").concat(oInputModel.getData()));
			oClaimSubmissionModel.setProperty("/claim_items_count", oClaimSubmissionModel.getProperty("/claim_items").length);

			// return to claim item screen
			this.onCancel_ClaimDetails();
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

		onCancel_ClaimDetails: async function () {
			// show claim details screen
			var oPage = this.byId("page_claimsubmission");
			var oClaimItemFragment = this._getFormFragment("claimsubmission_claimdetails_input");
			if (oClaimItemFragment) {
				oClaimItemFragment.then(function (oVBox) {
					oPage.removeContent(oVBox);
				});
			}
			const fpromise = await this._getFormFragment("claimsubmission_summary_claimitem").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
			this._displayFooterButtons("claimsubmission_summary_claimitem");
			this.byId("table_claimsummary_claimitem").getBinding("items").refresh();
		},

		onSaveDraft_ClaimSubmission: function () {
			MessageToast.show("reachable savedraft");

			// get input model
			var oInputModel = this.getView().getModel("claimsubmission_input");
			//// get data from current claim header shown
			var oInputData = oInputModel.getData();

			// write to backend table ZCLAIM_HEADER
			var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
			var sServiceUrl = sBaseUri + "/ZCLAIM_HEADER";

			fetch(sServiceUrl,
				{
					method: "POST", headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						CLAIM_ID: oInputModel.getProperty("/claim_header/claim_id"),
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
						TOTAL_CLAIM_AMOUNT: parseFloat(oInputModel.getProperty("/claim_header/total_claim_amount")).toFixed(2),
						FINAL_AMOUNT_TO_RECEIVE: parseFloat(oInputModel.getProperty("/claim_header/final_amount_to_receive")).toFixed(2),
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
						DIST_OLD_HOUSE_TO_OFFICE_KM: parseFloat(oInputModel.getProperty("/claim_header/dist_old_house_to_office_km")),
						DIST_OLD_HOUSE_TO_NEW_HOUSE_KM: parseFloat(oInputModel.getProperty("/claim_header/dist_old_house_to_new_house_km")),
						APPROVER1: oInputModel.getProperty("/claim_header/approver1"),
						APPROVER2: oInputModel.getProperty("/claim_header/approver2"),
						APPROVER3: oInputModel.getProperty("/claim_header/approver3"),
						APPROVER4: oInputModel.getProperty("/claim_header/approver4"),
						APPROVER5: oInputModel.getProperty("/claim_header/approver5"),
						LAST_SEND_BACK_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/last_send_back_date")),
						COURSE_CODE: oInputModel.getProperty("/claim_header/course_code"),
						PROJECT_CODE: oInputModel.getProperty("/claim_header/project_code"),
						CASH_ADVANCE_AMOUNT: parseFloat(oInputModel.getProperty("/claim_header/cash_advance_amount")).toFixed(2),
						PREAPPROVED_AMOUNT: parseFloat(oInputModel.getProperty("/claim_header/preapproved_amount")).toFixed(2),
						REJECT_REASON_ID: oInputModel.getProperty("/claim_header/reject_reason_id"),
						SEND_BACK_REASON_ID: oInputModel.getProperty("/claim_header/send_back_reason_id"),
						LAST_SEND_BACK_TIME: this._getHanaTime(oInputModel.getProperty("/claim_header/last_send_back_time")),
						REJECT_REASON_DATE: this._getHanaDate(oInputModel.getProperty("/claim_header/reject_reason_date")),
						REJECT_REASON_TIME: this._getHanaTime(oInputModel.getProperty("/claim_header/reject_reason_time"))
					})
				})
				.then(r => r.json())
				.then(async (res) => {
					if (!res.error) {
						// successfully created record
						MessageToast.show(this._getTexti18n("msg_claimsubmission_created"));
						this._updateCurrentReportNumber(oInputData.reportnumber.current);

						// return to dashboard
						this._returnToDashboard();
					} else {
						// replace current claim ID with updated claim ID
						switch (res.error.code) {
							case '301':
								MessageToast.show(this._getTexti18n("msg_claimsubmission_uniqueid", [oInputData.claim_header.claim_id]));
								// get updated claim report number
								this._updateCurrentReportNumber(oInputModel.getProperty("/reportnumber/current"));
								var currentReportNumber = await this.getCurrentReportNumber();
								if (currentReportNumber) {
									oInputModel.setProperty("/claim_header/claim_id", currentReportNumber.reportNo);
									oInputModel.setProperty("/reportnumber/reportno", currentReportNumber.reportNo);
									oInputModel.setProperty("/reportnumber/current", currentReportNumber.current);
								}
								break;
							default:
								MessageToast.show(res.error.code + " - " + res.error.message);
								break;
						}
					};
				});
		},

		_getHanaDate: function (date) {
			if (date) {
				var oDate = new Date (date);
				var oDateString = oDate.getFullYear() + '-' + ('0' + (oDate.getMonth()+1)).slice(-2) + '-' + ('0' + oDate.getDate()).slice(-2);
				return oDateString;
			} else {
				return null;
			}
		},

		_getHanaTime: function (time) {
			if (time) {
				var oDate = new Date (time);
				var oTimeString = ('0' + oDate.getHours()).slice(-2) + ':' + ('0' + oDate.getMinutes()).slice(-2) + ':' + ('0' + oDate.getSeconds()).slice(-2);
				return oTimeString;
			} else {
				return null;
			}
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

		_updateCurrentReportNumber: async function (currentNumber) {
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

		onBack_ClaimSubmission: function () {
			this._returnToDashboard();
		},

		_returnToDashboard: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Dashboard");
		},

		_getTexti18n: function (i18nKey, array_i18nParameters) {
			if (array_i18nParameters) {
				return this.getView().getModel("i18n").getResourceBundle().getText(i18nKey, array_i18nParameters);
			}
			else {
				return this.getView().getModel("i18n").getResourceBundle().getText(i18nKey);
			}
		}

	});
});
