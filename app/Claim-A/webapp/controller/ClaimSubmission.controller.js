sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/PDFViewer"
], function (
	Fragment,
	Controller,
	JSONModel,
	MessageToast,
	PDFViewer
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
 
		onBeforeRendering: function () {
			//// enable view attachment at claim summary
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (oClaimSubmissionModel && oClaimSubmissionModel.getProperty("/claim_header/attachment_email_approver")) {
				this.byId("button_claimsummary_viewattachment").setEnabled(true);
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
					"attachment_file_1": null,
					"attachment_file_2": null,
				}
			});
			//// set input
			this.getView().setModel(oClaimItemModel, modelName);
			return this.getView().getModel(modelName);
		},

		onView_ClaimSummary_Attachment: async function (oEvent) {
			// // retrieve from SuccessFactors API
			// var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri");
			// var sServiceUrl = sBaseUri + "/SuccessFactors_API/odata/v2/Attachment('1168')";

			// var aQuery = await $.ajax({
			// 	type: "GET",
			// 	// headers: {
			// 	// 	'Access-Control-Allow-Origin': '*',
			// 	// },
			// 	// url: "https://api44preview.sapsf.com/odata/v2/Attachment('1168')",
			// 	url: sServiceUrl,
			// 	// username: "SFAPI@EPFSFDEV",
			// 	// password: "Enjoysap@4",
			// 	success: async function (resultData) {
			// 		// Extract email safely with fallbacks (covers common IdP shapes)
			// 		var testVar = true;
			// 		// var email =
			// 		// 	resultData.email ||
			// 		// 	(Array.isArray(resultData.emails) && resultData.emails[0] && resultData.emails[0].value) ||
			// 		// 	resultData.userPrincipalName ||
			// 		// 	null;

			// 		// if (email && typeof email === 'string' && email.trim() !== '') {
			// 		// 	// (Optional) set a model if your view needs it
			// 		// 	var oUserModel = new sap.ui.model.json.JSONModel({ email: email });
			// 		// 	that.getView().setModel(oUserModel, 'user');

			// 		// 	sap.m.MessageToast.show('Email: ' + email);
			// 		// } else {
			// 		// 	sap.m.MessageToast.show('Email is empty or not provided for this user.');
			// 		// }
			// 	},
			// 	error: function (xhr) {
			// 		// If you’re still getting 404 here, your approuter may not expose /user-api
			// 		console.error('SF attachment failed:', xhr.status, xhr.responseText);
			// 		sap.m.MessageToast.show('Failed to load claim attachment.');
			// 	}
			// });

			var base64EncodedPDF = "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";
			var decodedPdfContent = atob(base64EncodedPDF);
			var byteArray = new Uint8Array(decodedPdfContent.length)
			for(var i=0; i<decodedPdfContent.length; i++){
				byteArray[i] = decodedPdfContent.charCodeAt(i);
			}
			var blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
			// var blob = new Blob([byteArray.buffer], { type: 'image/png' });
			// var blob = new Blob([byteArray.buffer], { type: 'image/jpg' });
			// var blob = new Blob([byteArray.buffer], { type: 'image/jpeg' });
			var _pdfurl = URL.createObjectURL(blob);
			
			if(!this._PDFViewer){
				this._PDFViewer = new sap.m.PDFViewer({
					isTrustedSource : true,
					title: this._getTexti18n("pdfviewer_claimsummary_attachment"),
					width:"auto",
					source:_pdfurl
				});
				this.getView().addDependent(this._pdfViewer);
				jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist

				this._PDFViewer.open();
			}
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
			this._onInit_ClaimDetails_Input();
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

		_onInit_ClaimDetails_Input: function () {
			// change footer buttons
			this._displayFooterButtons("claimsubmission_claimdetails_input");

			// set claim item model
			var oInputModel = this._getNewClaimItemModel("claimitem_input");

			// update selection fields
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			this._setClaimDetailSelection(oClaimSubmissionModel);
		},

		_setClaimDetailSelection: function (oModel) {
			//// Claim Item
			this.byId("select_claimdetails_input_claimitem").bindAggregation("items", {
				path: "employee>/ZCLAIM_TYPE_ITEM",
				filters: [new sap.ui.model.Filter('CLAIM_TYPE_ID', sap.ui.model.FilterOperator.EQ, oModel.getProperty("/claim_header/claim_type_id"))],
				sorter: [
					{ path: 'CLAIM_TYPE_ITEM_DESC' },
					{ path: 'CLAIM_TYPE_ITEM_ID' },
				],
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
			//// Type of Professional Body
			this._setClaimDetailSelectionMaster("select_claimdetails_input_type_of_professional_body", "ZPROFESIONAL_BODY");
			//// Funeral Transportation
			this._setClaimDetailSelectionMaster("select_claimdetails_input_funeral_transportation", "ZTRANSPORT_PASSING");
			//// Level of Studies
			this._setClaimDetailSelectionMaster("select_claimdetails_input_study_levels_id", "ZSTUDY_LEVELS");
			//// Type of Vehicle
			this._setClaimDetailSelectionMaster("select_claimdetails_input_vehicle_type", "ZVEHICLE_TYPE");
			//// Vehicle Ownership ID (Sendiri/Penjabat)
			this._setClaimDetailSelectionMaster("select_claimdetails_input_vehicle_ownership_id", "ZVEHICLE_OWNERSHIP");
			//// Type of Fare
			this._setClaimDetailSelectionMaster("select_claimdetails_input_fare_type_id", "ZFARE_TYPE");
			//// Vehicle Class
			this._setClaimDetailSelectionMaster("select_claimdetails_input_vehicle_class_id", "ZVEHICLE_CLASS");
			//// Flight Class
			this._setClaimDetailSelectionMaster("select_claimdetails_input_flight_class", "ZFLIGHT_CLASS");
			//// Location Type
			this._setClaimDetailSelectionMaster("select_claimdetails_input_location_type", "ZLOC_TYPE");
			//// Room Type
			this._setClaimDetailSelectionMaster("select_claimdetails_input_room_type", "ZROOM_TYPE");
			//// Country
			this._setClaimDetailSelectionMaster("select_claimdetails_input_country", "ZCOUNTRY");
			//// Region (Semenanjung/Sabah/Sarawak)
			this._setClaimDetailSelectionMaster("select_claimdetails_input_region", "ZREGION");
			//// Area (Negara/Wilayah)
			this._setClaimDetailSelectionMaster("select_claimdetails_input_area", "ZAREA");
			//// Lodging Category
			this._setClaimDetailSelectionMaster("select_claimdetails_input_lodging_category", "ZLODGING_CAT", "LODGING_CATEGORY");
			//// Category/Purpose (Mobile)
			this._setClaimDetailSelectionMaster("select_claimdetails_input_mobile_category_purpose_id", "ZMOBILE_CATEGORY_PURPOSE");
		},

		_setClaimDetailSelectionMaster: function (oId, oTable, oField) {
			if (this.byId(oId).getVisible()) {
				if (!oField) {
					var oField = oTable.slice(1);
				}
				this.byId(oId).bindAggregation("items", {
					path: "employee>/" + oTable,
					sorter: [
						{ path: oField + '_DESC' },
						{ path: oField + '_ID' },
					],
					template: new sap.ui.core.Item({
						key: "{employee>" + oField + "_ID}",
						text: "{employee>" + oField + "_DESC}"
					})
				});
			}
		},

		onSave_ClaimDetails_Input: async function () {
			// validate required fields
			if (
				!this.byId("select_claimdetails_input_claimitem").getSelectedItem() ||
				!this.byId("input_claimdetails_input_amount").getValue() ||
				!this.byId("datepicker_claimdetails_input_startdate").getValue() ||
				!this.byId("datepicker_claimdetails_input_enddate").getValue()
			) {
				// stop claim submission if values empty
				MessageToast.show(this._getTexti18n("msg_claiminput_required"));
				return;
			}
			// validate date range
			//// trip start/end date
			if (!this._validDateRange("datepicker_claimdetails_input_startdate", "datepicker_claimdetails_input_enddate")) {
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
			this.onCancel_ClaimDetails_Input();
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

		onCancel_ClaimDetails_Input: async function () {
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
