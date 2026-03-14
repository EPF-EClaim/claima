sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/PDFViewer",
	"claima/utils/budgetCheck",
	"claima/utils/ApprovalLog"
], function (
	Fragment,
	Controller,
	BusyIndicator,
	JSONModel,
	MessageToast,
	Dialog,
	Button,
	Label,
	PDFViewer,
	budgetCheck,
	ApprovalLog
) {
	"use strict";

	return Controller.extend("claima.controller.ClaimSubmission", {
		onInit: function () {
			this._navContainerDelegate = { onBeforeShow: this.onBeforeShow };
			this.getView().addEventDelegate(this._navContainerDelegate, this);

			// Set the initial form to show claim summary
			if (!this._formFragments) {
				this._formFragments = {};
				this._showInitFormFragment();
			}
		},
 
		onBeforeShow: function () {
			// enable view attachment at claim summary
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			if (oClaimSubmissionModel && oClaimSubmissionModel.getProperty("/claim_header/attachment_email_approver")) {
				this.byId("button_claimsummary_viewattachment").setEnabled(true);
			}

			// enable additional functionality if 1 or more claim items exist
			if (oClaimSubmissionModel) {
				this._setEnabledToolbarFooter();

				// show approval log fragment for user
				if (oClaimSubmissionModel.getProperty("/claim_header/status_id" === 'STAT02') || oClaimSubmissionModel.getProperty("/is_approver")) {
					var oPage = this.byId("page_claimsubmission");
					this._getFormFragment("approval_log").then(function (oVBox) {
						oPage.insertContent(oVBox, 2);
					});
				}

				// change screen details if approver
				if (oClaimSubmissionModel.getProperty("/is_approver")) {
					// update footer buttons
					this._displayFooterButtons("claimsubmission_approver");

					// table changes
					if (this.byId("button_claimsummary_edit")) {
						//// hide buttons
						if (this.byId("button_claimsummary_createclaim").getVisible()) { this.byId("button_claimsummary_createclaim").setVisible(false); }
						if (this.byId("button_claimsummary_edit").getVisible()) { this.byId("button_claimsummary_edit").setVisible(false); }
						if (this.byId("button_claimsummary_duplicate").getVisible()) { this.byId("button_claimsummary_duplicate").setVisible(false); }
						if (this.byId("button_claimsummary_delete").getVisible()) { this.byId("button_claimsummary_delete").setVisible(false); }
					}

					// table properties
					this.byId("table_claimsummary_claimitem").setMode(sap.m.ListMode.SingleSelectMaster);
				}
			}
		},
 
		onExit: function() {
			this.getView().removeEventDelegate(this._navContainerDelegate);
			this._navContainerDelegate = null;
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

		onView_Claim_Attachment: function (oLevel, fieldNumber, itemSubId) {
			var that = this;
			// Write to Success Factors API
			var fileName = "";
			if (oLevel == 'parent') {
				// get parent attachment
				var oInputModel = this.getView().getModel("claimsubmission_input");
				var sServiceUrl = "/SuccessFactors_API/odata/v2/Attachment('" + oInputModel.getProperty("/claim_header/attachment_email_approver") + "')";
				var attachmentDescr = oInputModel.getProperty("/claim_header/descr/attachment_email_approver") || "";
				var pdfViewer_title = this._getTexti18n("pdfviewer_claimsummary_attachment", [attachmentDescr]);
			}
			else if (oLevel == 'child_det') {
				// get child attachment
				oInputModel = this.getView().getModel("claimitem_input");
				sServiceUrl = "/SuccessFactors_API/odata/v2/Attachment('" + oInputModel.getProperty("/claim_item/attachment_file_" + fieldNumber) + "')";
				attachmentDescr = oInputModel.getProperty("/claim_item/descr/attachment_email_" + fieldNumber) || "";
				pdfViewer_title = this._getTexti18n("pdfviewer_claimdetails_input_attachment" + fieldNumber, [attachmentDescr]);
			}
			else {
				// get child attachment
				oInputModel = this.getView().getModel("claimsubmission_input");
				//// get claim item index from claim submission
				let itemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
				if (itemIndex !== -1) {
					sServiceUrl = "/SuccessFactors_API/odata/v2/Attachment('" + oInputModel.getProperty("/claim_items/" + itemIndex + "/attachment_file_" + fieldNumber) + "')";
					attachmentDescr = oInputModel.getProperty("/claim_items/" + itemIndex + "/descr/attachment_email_" + fieldNumber) || "";
					pdfViewer_title = this._getTexti18n("pdfviewer_claimdetails_input_attachment" + fieldNumber, [attachmentDescr]);
				}
				else {
					MessageToast.show("Unable to view attachment");
					return;
				}
			}

			BusyIndicator.show(0);
			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: sServiceUrl,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					// show attachment in PDF viewer
					var base64EncodedPDF = data.d.fileContent;
					var decodedPdfContent = atob(base64EncodedPDF);
					var byteArray = new Uint8Array(decodedPdfContent.length)
					for(var i=0; i<decodedPdfContent.length; i++){
						byteArray[i] = decodedPdfContent.charCodeAt(i);
					}
					var blob = new Blob([byteArray.buffer], { type: data.d.mimeType });
					var _pdfurl = URL.createObjectURL(blob);
					
					that._PDFViewer = new PDFViewer({
						isTrustedSource : true,
						title: pdfViewer_title,
						width:"auto",
						source:_pdfurl
					});
					that.getView().addDependent(that._pdfViewer);
					jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
				
					BusyIndicator.hide();
					that._PDFViewer.open();
				},
				error: function (xhr) {
					console.log("Error viewing attachment: " + xhr.status + xhr.responseText);
					MessageToast.show("Error viewing attachment: " + xhr.status + xhr.responseText);

					BusyIndicator.hide();
					return false;
				}
			});
		},

		onCreateClaim_ClaimSummary: async function (indexNumber) {
			BusyIndicator.show(0);
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
			if (Number.isInteger(indexNumber)) {
				this._onInit_ClaimDetails_Input(indexNumber);
			}
			else {
				this._onInit_ClaimDetails_Input();
				this.getView().getModel("claimitem_input").setProperty("/is_new", true);
			}
			BusyIndicator.hide(0);
		},

		onScanReceipt_ClaimSummary: function () {
			MessageToast.show("reachable scanreceipt");
		},

		onAction_ClaimSummary: function (oAction) {
			// count items in table
			var table = this.getView().byId("table_claimsummary_claimitem");
			if (table) {
				// dont proceed if no items selected
				if (table.getSelectedItems().length == 0) {
					MessageToast.show(this._getTexti18n("msg_claimsummary_noitem"));
					return;
				}

				// get action
				switch (oAction) {
					//// Edit
					case 'Edit':
						// only allow one item selection
						if (table.getSelectedItems().length > 1) {
							MessageToast.show(this._getTexti18n("msg_claimsummary_singleitem"));
							return;
						}
						else {
							this.onEdit_ClaimSummary(table.getSelectedItem());
						}
						break;
					//// Duplicate
					case 'Duplicate':
						// confirm dialog
						this._newDialog(
							this._getTexti18n("dialog_claimsummary_duplicate"),
							this._getTexti18n("label_claimsummary_duplicate"),
							function () {
								this.onDuplicate_ClaimSummary(table.getSelectedItems())
								table.removeSelections(true);
							}.bind(this)
						);
						break;
					//// Delete
					case 'Delete':
						// confirm dialog
						this._newDialog(
							this._getTexti18n("dialog_claimsummary_delete"),
							this._getTexti18n("label_claimsummary_delete"),
							function () {
								this.onDelete_ClaimSummary(table.getSelectedItems())
								table.removeSelections(true);
							}.bind(this)
						);
						break;
					default:
						MessageToast.show(this._getTexti18n("msg_claimsummary_noaction"));
						break;
				}
			}
			else {
				MessageToast.show(this._getTexti18n("msg_claimsummary_notable"));
			}
		},

		onEdit_ClaimSummary: function (item) {
			var itemSubId;
			var oInputModel = this.getView().getModel("claimsubmission_input");
			// get value from selected items
			itemSubId = item.getCells()[0].getText();
			let itemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
			if (itemIndex !== -1) {
				this.onCreateClaim_ClaimSummary(itemIndex);
			}
		},

		onItemPress_ClaimSubmission: function (oEvent) {
			var oInputModel = this.getView().getModel("claimsubmission_input");
			if (!oInputModel.getProperty("/is_approver")) {
				return;
			}

			var table = this.getView().byId("table_claimsummary_claimitem");
			var item = table.getSelectedItem();

			// get value from selected items
			var itemSubId;
			itemSubId = item.getCells()[0].getText();
			let itemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
			if (itemIndex !== -1) {
				this.onCreateClaim_ClaimSummary(itemIndex);
			}
		},

		onDuplicate_ClaimSummary: function (items) {
			var itemSubId;
			var oInputModel = this.getView().getModel("claimsubmission_input");
			// get value from selected items
			jQuery.each( items,
				function (id, value) {
					itemSubId = value.getCells()[0].getText();
					let itemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
					if (itemIndex !== -1) {
						var oObject = oInputModel.getProperty("/claim_items/" + itemIndex);
						oInputModel.setProperty("/claim_items", oInputModel.getProperty("/claim_items").concat(structuredClone(oObject)));
						oInputModel.setProperty(
							"/claim_items/" + (oInputModel.getProperty("/claim_items").length-1) + "/claim_sub_id",
							( oInputModel.getProperty("/claim_items/" + (oInputModel.getProperty("/claim_items").length-1) + "/claim_id") ?? "" ) + ('' + '00' + (oInputModel.getProperty("/claim_items").length)).slice(-3)
						);
						oInputModel.setProperty("/claim_items_count", oInputModel.getProperty("/claim_items").length);

						// add to total claim amount
						oInputModel.setProperty(
							"/claim_header/total_claim_amount",
							(
								parseFloat(oInputModel.getProperty("/claim_header/total_claim_amount")) +
								parseFloat(oInputModel.getProperty("/claim_items/" + itemIndex + "/amount"))
							).toFixed(2)
						);
					}
				}
			);

			// refresh table
			this.byId("table_claimsummary_claimitem").getBinding("items").refresh();
		},

		onDelete_ClaimSummary: function (items) {
			var itemSubId;
			var oInputModel = this.getView().getModel("claimsubmission_input");
			// get value from selected items
			jQuery.each( items,
				function (id, value) {
					itemSubId = value.getCells()[0].getText();
					let itemIndex = oInputModel.getProperty("/claim_items").findIndex((claim_item) => claim_item.claim_sub_id === itemSubId);
					if (itemIndex !== -1) {
						// reduce total claim amount from claim header
						oInputModel.setProperty(
							"/claim_header/total_claim_amount",
							(
								parseFloat(oInputModel.getProperty("/claim_header/total_claim_amount")) -
								parseFloat(oInputModel.getProperty("/claim_items/" + itemIndex + "/amount"))
							).toFixed(2)
						);
						
						if (oInputModel.getProperty("/claim_items").length > 1) {
							oInputModel.getProperty("/claim_items").splice(itemIndex, 1);
							oInputModel.setProperty("/claim_items_count", oInputModel.getProperty("/claim_items").length);
						}
						else {
							oInputModel.setProperty("/claim_items", []); 
						}
					}
				}
			);

			// update claim sub item number
			oInputModel.getProperty("/claim_items").forEach( function (claim_item, i) {
				oInputModel.setProperty(
					"/claim_items/" + i + "/claim_sub_id",
					( oInputModel.getProperty("/claim_items/" + i + "/claim_id") ?? "" ) + ('' + '00' + (i + 1)).slice(-3)
				);
			});

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
						this._getTexti18n("dialog_claimsubmission_savedraft"),
						this._getTexti18n("label_claimsubmission_savedraft"),
						function () {
							this._updateClaimSubmission(oAction);
						}.bind(this)
					);
					break;
				//// Delete Report
				case 'Delete Report':
					// confirm dialog
					this._newDialog(
						this._getTexti18n("dialog_claimsubmission_deletereport"),
						this._getTexti18n("label_claimsubmission_deletereport"),
						function () {
							this._updateClaimSubmission(oAction);
						}.bind(this)
					);
					break;
				//// Submit Report
				case 'Submit Report':
					// confirm dialog
					this._newDialog(
						this._getTexti18n("dialog_claimsubmission_submitreport"),
						this._getTexti18n("label_claimsubmission_submitreport"),
						function () {
							this._updateClaimSubmission(oAction);
						}.bind(this)
					);
					break;
				//// Back
				case 'Back':
					// new claim submission
					this._newDialog(
						this._getTexti18n("dialog_claimsubmission_back"),
						this._getTexti18n("label_claimsubmission_back_return"),
						function () {
							this.onBack_ClaimSubmission();
						}.bind(this)
					);
					// // confirm dialog
					// var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
					// if (oClaimSubmissionModel.getProperty("is_new")) {
					// 	// new claim submission
					// 	this._newDialog(
					// 		this._getTexti18n("dialog_claimsubmission_back"),
					// 		this._getTexti18n("label_claimsubmission_back_create"),
					// 		function () {
					// 			this.onBack_ClaimSubmission();
					// 		}.bind(this)
					// 	);
					// }
					// else if (oClaimSubmissionModel.getProperty("is_approver")) {
					// 	// new claim submission
					// 	this._newDialog(
					// 		this._getTexti18n("dialog_claimsubmission_back"),
					// 		this._getTexti18n("label_claimapprover_back"),
					// 		function () {
					// 			this.onBack_ClaimSubmission();
					// 		}.bind(this)
					// 	);
					// }
					// else {
					// 	// new claim submission
					// 	this._newDialog(
					// 		this._getTexti18n("dialog_claimsubmission_back"),
					// 		this._getTexti18n("label_claimsubmission_back_change"),
					// 		function () {
					// 			this.onBack_ClaimSubmission();
					// 		}.bind(this)
					// 	);
					// }
					// break;
				//// Reject
				case 'Reject':
					// confirm dialog
					this._newDialog(
						this._getTexti18n("dialog_claimapprover_reject"),
						this._getTexti18n("label_claimapprover_reject"),
						function () {
							this.onReject_ClaimSubmission();
						}.bind(this)
					);
					break;
				//// Back to Employee
				case 'Back to Employee':
					this.onBackToEmp_ClaimSubmission();
					break;
				//// Approve
				case 'Approve':
					// confirm dialog
					this._newDialog(
						this._getTexti18n("dialog_claimapprover_approve"),
						this._getTexti18n("label_claimapprover_approve"),
						function () {
							this.onApprove_ClaimSubmission();
						}.bind(this)
					);
					break;
				default:
					MessageToast.show(this._getTexti18n("msg_claimsummary_noaction"));
					break;
			}
		},

		_displayFooterButtons: function (oId) {
			var button = [
				"button_claimapprover_reject",
				"button_claimapprover_backtoemp",
				"button_claimapprover_approve",

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
			var button_approver = [
				"button_claimapprover_reject",
				"button_claimapprover_backtoemp",
				"button_claimapprover_approve",
				"button_claimsubmission_back"
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
				case "claimsubmission_approver":
					button_set = button_approver;
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

		onSelect_ClaimDetails_ClaimItem: async function (oEvent) {
			// validate claim item
			var claimItem = oEvent.getParameters().selectedItem;
			if (claimItem) {
				// get category values from claim item
				var claimCategoryDesc = claimItem.getBindingContext("employee").getObject("ZSUBMISSION_TYPE/SUBMISSION_TYPE_DESC");

				// show claim item category in category input
				this.byId("input_claimdetails_input_category").setValue(claimCategoryDesc);
			}

			// set app visibility controls
			await this.getFieldVisibility_ClaimTypeItem();
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
		},

		_onInit_ClaimDetails_Input: async function (indexNumber) {
			// set claim item model
			var oInputModel = this._getNewClaimItemModel("claimitem_input");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");

			// change footer buttons
			if (!oClaimSubmissionModel.getProperty("/is_approver")) {
				this._displayFooterButtons("claimsubmission_claimdetails_input");
			}

			// update selection fields
			if (Number.isInteger(indexNumber)) {
				// add claim item values to claim detail screen
				oInputModel.setProperty("/claim_item", oClaimSubmissionModel.getProperty("/claim_items/" + indexNumber));

				// set app visibility controls
				await this.getFieldVisibility_ClaimTypeItem();
			}
			this._setClaimDetailSelection(oClaimSubmissionModel);

			// approver view changes
			if (oClaimSubmissionModel.getProperty("/is_approver")) {
				if (!this.byId("button_claimdetails_input_return").getVisible()) {
					this.byId("button_claimdetails_input_return").setVisible(true);
				}
				this._getFieldEditable_ClaimTypeItem();
			}
		},

		_setClaimDetailSelection: function (oModel) {
			//// Claim Item
			this.byId("select_claimdetails_input_claimitem").bindAggregation("items", {
				path: "employee>/ZCLAIM_TYPE_ITEM",
				filters: [new sap.ui.model.Filter('CLAIM_TYPE_ID', sap.ui.model.FilterOperator.EQ, oModel.getProperty("/claim_header/claim_type_id"))],
				sorter: [
					new sap.ui.model.Sorter('CLAIM_TYPE_ITEM_DESC'),
					new sap.ui.model.Sorter('CLAIM_TYPE_ITEM_ID')
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
			//// Country
			this._setClaimDetailSelectionField("select_claimdetails_input_country", "ZCOUNTRY");
			//// Region (Semenanjung/Sabah/Sarawak)
			this._setClaimDetailSelectionField("select_claimdetails_input_region", "ZREGION");
			//// Area (Negara/Wilayah)
			this._setClaimDetailSelectionField("select_claimdetails_input_area", "ZAREA");
			//// Lodging Category
			this._setClaimDetailSelectionField("select_claimdetails_input_lodging_category", "ZLODGING_CAT", "LODGING_CATEGORY");
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
						new sap.ui.model.Sorter(oField + '_DESC'),
						new sap.ui.model.Sorter(oField + '_ID')
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
				( !this.byId("input_claimdetails_input_amount").getValue() && this.byId("input_claimdetails_input_amount").getVisible() )
				// !this.byId("datepicker_claimdetails_input_startdate").getValue() ||
				// !this.byId("datepicker_claimdetails_input_enddate").getValue()
			) {
				// stop claim submission if values empty
				MessageToast.show(this._getTexti18n("msg_claiminput_required"));
				return;
			}
			// validate attachment
			//// attachment 1
			if (this.byId("fileuploader_claimdetails_input_attachment1").getValue()) {
				var isUploadSuccess = this._onUpload_ClaimDetails_Input_Attachment(1);
				if (!isUploadSuccess) {
					// don't proceed claim submission if attachment upload fails
					return;
				}
			}
			//// attachment 2
			if (this.byId("fileuploader_claimdetails_input_attachment2").getValue()) {
				var isUploadSuccess = this._onUpload_ClaimDetails_Input_Attachment(2);
				if (!isUploadSuccess) {
					// don't proceed claim submission if attachment upload fails
					return;
				}
			}
			// validate date range
			//// start/end date
			if (this.byId("datepicker_claimdetails_input_startdate").getValue() || this.byId("datepicker_claimdetails_input_enddate").getValue()) {
				if (!this._validDateRange("datepicker_claimdetails_input_startdate", "datepicker_claimdetails_input_enddate")) {
					// stop claim details if incomplete
					return;
				}
			}

			// validate input data
			var oInputModel = this.getView().getModel("claimitem_input");
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			//// get claim item sub ID
			if (oInputModel.getProperty("/is_new")) {
				oInputModel.setProperty("/claim_item/claim_id", oClaimSubmissionModel.getProperty("/claim_header/claim_id"));
				var claimSubId = oClaimSubmissionModel.getProperty("/claim_items").length + 1;
				var totalClaimSubId = ( oInputModel.getProperty("/claim_item/claim_id") ?? "" ) + ('' + '00' + claimSubId).slice(-3);
				oInputModel.setProperty("/claim_item/claim_sub_id", totalClaimSubId);
			}
			//// get claim type from claim header
			oInputModel.setProperty("/claim_item/claim_type_id", oClaimSubmissionModel.getProperty("/claim_header/claim_type_id"));
			//// get claim category key
			oInputModel.setProperty("/claim_item/claim_category", this.byId("select_claimdetails_input_claimitem").getSelectedItem().getBindingContext("employee").getObject("SUBMISSION_TYPE"));
			//// get descriptions
			oInputModel.setProperty("/claim_item/descr/claim_type_id", oClaimSubmissionModel.getProperty("/claim_header/descr/claim_type_id"));
			oInputModel.setProperty("/claim_item/descr/claim_type_item_id", this.byId("select_claimdetails_input_claimitem")._getSelectedItemText());
			oInputModel.setProperty("/claim_item/descr/claim_category", this.byId("input_claimdetails_input_category").getValue());
			// add claim item details to claim submission model
			if (oInputModel.getProperty("/is_new")) {
				oClaimSubmissionModel.setProperty("/claim_items", oClaimSubmissionModel.getProperty("/claim_items").concat(oInputModel.getProperty("/claim_item")));
				oClaimSubmissionModel.setProperty("/claim_items_count", oClaimSubmissionModel.getProperty("/claim_items").length);
			}
			else {
				oClaimSubmissionModel.getProperty("/claim_items").find( function (claim_item, i) {
					if (
						oClaimSubmissionModel.getProperty("/claim_items/" + i + "/claim_sub_id") === 
						oInputModel.getProperty("/claim_item/claim_sub_id")
					) {
						oClaimSubmissionModel.setProperty("/claim_items/" + i, oInputModel.getProperty("/claim_item"));
					}
				});
			}
			// update claim submission header details
			oClaimSubmissionModel.setProperty("/claim_header/total_claim_amount", "0.00");
			oClaimSubmissionModel.getProperty("/claim_items").forEach((claim_item, i) => {
				oClaimSubmissionModel.setProperty(
					"/claim_header/total_claim_amount",
					(
						parseFloat(oClaimSubmissionModel.getProperty("/claim_header/total_claim_amount")) +
						oClaimSubmissionModel.getProperty("/claim_items/"+ i + "/amount")
					).toFixed(2)
				)
			});

			// return to claim item screen
			this.onCancel_ClaimDetails_Input();
		},

		_onUpload_ClaimDetails_Input_Attachment: function (fieldNumber) {
			var success;
			// get claim submission model
			var oInputModel = this.getView().getModel("claimitem_input");

			// get csrf token
			var tokenModel = sap.ui.getCore().getModel("oToken");
			if (!tokenModel) {
				this._fetchToken();
				tokenModel = sap.ui.getCore().getModel("oToken");
			}
			var tokenData = tokenModel.getData();
			var token = tokenData["csrfToken"];
			if (!token) {
				// cannot proceed without token
				sap.ui.getCore().setModel(null,"oToken");
				return false;
			}

			BusyIndicator.show(0);
			$.ajax({
				type: "POST",
				contentType: "application/json",
				url: "/SuccessFactors_API/odata/v2/Attachment",
				dataType: "json",
				async: false,
				headers: {
					'X-CSRF-Token': token,
				},
				crossDomain: true,
				data: JSON.stringify({
						__metadata: {
							uri: 'Attachment'
						},
						deletable: true,
						fileName: oInputModel.getProperty("/attachment/fileName"),
						moduleCategory: 'UNSPECIFIED',
						module: 'DEFAULT',
						userId: 'SFAPI',
						viewable: true,
						searchable: true,
						fileContent: oInputModel.getProperty("/attachment/fileContent")
					}),
				success: function (data, textStatus, jqXHR) {
					// get generated attachment number
					oInputModel.setProperty("/claim_item/attachment_file_" + fieldNumber, data.d.attachmentId);
					oInputModel.setProperty("/claim_item/descr/attachment_file_" + fieldNumber, data.d.fileName);

					BusyIndicator.hide();
					success = true;
				},
				error: function (xhr) {
					console.log("Error uploading attachment " + fieldNumber + ": " + xhr.status + xhr.responseText);
					MessageToast.show("Error uploading attachment " + fieldNumber + ": " + xhr.status + xhr.responseText);

					BusyIndicator.hide();
					success = false;
				}
			});
			return success;
		},

		_fetchToken: function () {
			var token = {			
				"csrfToken" : ""
			};

			var oToken = new JSONModel(token);
			sap.ui.getCore().setModel(oToken,"oToken");
			var tokenModel = sap.ui.getCore().getModel("oToken").getData();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: "/SuccessFactors_API/odata/v2/",
				async: false,
				headers: {
					'X-CSRF-Token': "Fetch",
				},
				success: function (data, textStatus, jqXHR) {
					// get token
					tokenModel["csrfToken"] = jqXHR.getResponseHeader('X-Csrf-Token');
				},
				error: function (xhr) {
					console.log("Error getting token: " + xhr.status + xhr.responseText);
				}
			});
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
			MessageToast.show(this._getTexti18n("msg_claiminput_attachment_upload_filesize"));
		},

		onTypeMissmatch_ClaimInput_Attachment: function (oEvent) {
			MessageToast.show(this._getTexti18n("msg_claiminput_attachment_upload_mismatch"));
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
			}
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
				( this.byId(startDate).getVisible() && !this.byId(startDate).getValue() ) ||
				( this.byId(startTime).getVisible() && !this.byId(startTime).getValue() ) ||
				( this.byId(endDate).getVisible() && !this.byId(endDate).getValue() ) ||
				( this.byId(endTime).getVisible() && !this.byId(endTime).getValue() ) ||
				( this.byId("select_claimdetails_input_region").getVisible() && !oInputModel.getProperty("/claim_item/region") )
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
				new sap.ui.model.Filter("PERSONAL_GRADE", "EQ", oClaimSubmissionModel.getProperty("/emp_master/grade")),
				new sap.ui.model.Filter("LOCATION", "EQ", oInputModel.getProperty("/claim_item/region")),
				new sap.ui.model.Filter("CLAIM_TYPE_ID", "EQ", oInputModel.getProperty("/claim_item/claim_type_id")),
				new sap.ui.model.Filter("CLAIM_TYPE_ITEM_ID", "EQ", oInputModel.getProperty("/claim_item/claim_type_item_id")),
				new sap.ui.model.Filter("EFFECTIVE_START_DATE", "LE", this._getHanaDate(this.byId(startDate).getValue())),
				new sap.ui.model.Filter("EFFECTIVE_END_DATE", "GE", this._getHanaDate(this.byId(endDate).getValue()))
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					// // get employee personal grade
					// var empGrade = oClaimSubmissionModel.getProperty("/emp_master/grade");
					// var empGradeLetter = empGrade.match(/\d+/g);
					// var empGradeNum = empGrade.match(/[a-zA-Z]+/g);

					// var oDataId = 0;
					// for (let i = 0; i < aContexts.length; i++) {
					// 	var oGrade = aContexts[i].getObject().PERSONAL_GRADE_FROM;
					// 	var oGradeLetter = oGrade.match(/\d+/g);
					// 	if (oGradeLetter !== empGradeLetter) {
					// 		continue;
					// 	}
					// 	var oGradeNum = oGrade.match(/[a-zA-Z]+/g);
					// 	if (oGradeNum > empGradeNum) {
					// 		continue;
					// 	}
					// 	oDataId = i;
					// 	break;
					// }

					// get amount from oData
					var oData = aContexts[0].getObject();
					var entBfast = parseFloat(oData.AMOUNT) * 0.2;
					var entLunch = parseFloat(oData.AMOUNT) * 0.4;
					var entDinner = parseFloat(oData.AMOUNT) * 0.4;
					//// modifier based on travel duration (hours)
					if (this.byId("input_claimdetails_input_travel_duration_hour").getVisible()) {
						if (this._nonNAN(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))) > 24) {
							// full meal allowance
							entBfast = entBfast * this._nonNAN(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day")));
							entLunch = entLunch * this._nonNAN(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day")));
							entDinner = entDinner * this._nonNAN(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_day")));
						}
						else if (this._nonNAN(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))) > 8) {
							// daily allowance (half of meal allowance)
							entBfast = entBfast / 2;
							entLunch = entLunch / 2;
							entDinner = entDinner / 2;
						}
						else { // if (this._nonNAN(parseFloat(oInputModel.getProperty("/claim_item/travel_duration_hour"))) < 8)
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
					console.warn("No entitled meal values found");
					MessageToast.show("No entitled meal values found");
				}
				BusyIndicator.hide();
			} catch (oError) {
				console.error("Error fetching entitled meal values", oError);
				MessageToast.show("Error fetching entitled meal values", oError);
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
				MessageToast.show(this._getTexti18n("msg_daterange_missing"));
				return false;
			}
			// check if end date earlier than start date
			var startDateUnix = new Date(startDateValue).valueOf();
			var endDateUnix = new Date(endDateValue).valueOf();
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
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			var oClaimItemFragment = this._getFormFragment("claimsubmission_claimdetails_input");
			if (oClaimItemFragment) {
				// disable item visibility
				this._setAllControlsVisible(false);

				// check if amount is editable
				if (!this.byId("input_claimdetails_input_amount").getEditable()) {
					this.byId("input_claimdetails_input_amount").setEditable(true);
				}

				// approver view changes
				if (oClaimSubmissionModel.getProperty("/is_approver")) {
					if (this.byId("button_claimdetails_input_return").getVisible()) {
						this.byId("button_claimdetails_input_return").setVisible(false);
					}
					this._setAllControlsEditable(true);
				}
				
				oClaimItemFragment.then(function (oVBox) {
					oPage.removeContent(oVBox);
				});
			}
			const fpromise = await this._getFormFragment("claimsubmission_summary_claimitem").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
			if (!oClaimSubmissionModel.getProperty("/is_approver")) {
				this._displayFooterButtons("claimsubmission_summary_claimitem");
				this._setEnabledToolbarFooter();
			}
			this.byId("table_claimsummary_claimitem").getBinding("items").refresh();
		},

		_updateClaimSubmission: async function (oAction) {
			try {
				BusyIndicator.show(0);

				// get input model
				var oInputModel = this.getView().getModel("claimsubmission_input");
				//// update last modified date
				var lastModifiedDate = this._getJsonDate(new Date());
				oInputModel.setProperty("/claim_header/last_modified_date", lastModifiedDate);

				// assign report number to new claim
				if (oInputModel.getProperty("/is_new")) {
					var currentReportNumber = await this._getCurrentReportNumber('NR02');
					if (currentReportNumber) {
						oInputModel.setProperty("/claim_header/claim_id", currentReportNumber.result);
						oInputModel.setProperty("/reportnumber/reportno", currentReportNumber.result);
						oInputModel.setProperty("/reportnumber/current", currentReportNumber.current);
					}
					else {
						console.log("No claim ID available");
						MessageToast.show("No claim ID available");
					}
				}
				//// set status for new claim as draft
				if (oInputModel.getProperty("/is_new")) {
					oInputModel.setProperty("/claim_header/status_id", "STAT01");
					oInputModel.setProperty("/claim_header/descr/status_id", "DRAFT");
				}
				//// change status based on oAction
				switch (oAction) {
					case 'Delete Report':
						oInputModel.setProperty("/claim_header/status_id", "STAT07");
						oInputModel.setProperty("/claim_header/descr/status_id", "CANCELLED");
						break;
					case 'Submit Report':
						var prevStatus = new JSONModel({
							status_id: oInputModel.getProperty("/claim_header/status_id"),
							descr: {
								status_id: oInputModel.getProperty("/claim_header/descr/status_id")
							}
						});
						oInputModel.setProperty("/claim_header/status_id", "STAT02");
						oInputModel.setProperty("/claim_header/descr/status_id", "PENDING APPROVAL");
						if (!oInputModel.getProperty("/claim_header/submitted_date")) {
							var submittedDate = this._getJsonDate(new Date());
							oInputModel.setProperty("/claim_header/submitted_date", submittedDate);
						}
						break;
					default:
						break;
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

				const oModel = this.getOwnerComponent().getModel();
				var oListBinding;
				var claimSaved;

				if (oInputModel.getProperty("/is_new")) {
					oListBinding = oModel.bindList("/ZCLAIM_HEADER");
					const oContext = oListBinding.create(oBody.getData());
					oContext.created().then( async () => {
						switch (oAction) {
							case 'Save Draft':
								MessageToast.show(this._getTexti18n("msg_claimsubmission_created"));
								break;
							case 'Submit Report':
								MessageToast.show(this._getTexti18n("msg_claimsubmission_pending"));
								break;
							default:
								throw new Error("Invalid action selected: " + oAction);
						}
						await this._updateCurrentReportNumber("NR02", oInputModel.getProperty("/reportnumber/current"));

						if (oInputModel.getProperty("/claim_items_count") > 0) {
							await this._updateClaimItems();
						}

						// determine claims approver
						if (oAction === 'Submit Report') {
							var oModelAppr = this.getView().getModel();
							ApprovalLog.onClaimsApproverDetermination(oModelAppr, oInputModel.getProperty("/claim_header/claim_id"));
						}
						MessageToast.show(oMsg);
						// this._returnToDashboard();
					}).catch(err => {
						console.log("Creation failed: " + err.message);
						MessageToast.show("Creation failed: " + err.message);
					});
				}
				else {
					oListBinding = oModel.bindList("/ZCLAIM_HEADER", null,null,
						[
							new sap.ui.model.Filter({ path: "CLAIM_ID", operator: sap.ui.model.FilterOperator.EQ, value1: oInputModel.getProperty("/claim_header/claim_id") })
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

					switch (oAction) {
						case 'Save Draft':
							for (const [key, value] of Object.entries(oBody.getData())) {
								oCtx.setProperty(key, value);
							}
							var oMsg = this._getTexti18n("msg_claimsubmission_changed");
							break;
						case 'Delete Report':
							oCtx.setProperty("STATUS_ID", "STAT07");
							oMsg = this._getTexti18n("msg_claimsubmission_deleted");
							break;
						case 'Submit Report':
							// budget checking
							const dataRow = oInputModel.getProperty("/claim_items").map(({ claim_type_item_id, amount }) => ({
								claim_type_item: claim_type_item_id,
								amount: amount
							}));
							var budgetCc = oInputModel.getProperty("/claim_header/cost_center") || oInputModel.getProperty("/claim_header/alternate_cost_center") || null;
							const result = await budgetCheck.budgetChecking(
								oModel,
								"CLM",
								oInputModel.getProperty("/claim_header/submitted_date"),
								oInputModel.getProperty("/claim_header/project_code"),
								budgetCc,
								oInputModel.getProperty("/claim_header/claim_type_id"),
								dataRow
							);

							if (!result.passed) {
								MessageToast.show(result.messages);
								return;
							}
							else {
								oCtx.setProperty("STATUS_ID", "STAT02");
								oMsg = this._getTexti18n("msg_claimsubmission_pending");
							}
							break;
						default:
							throw new Error("Invalid action selected: " + oAction);
					}

					await oModel.submitBatch("$auto");

					if (oInputModel.getProperty("/claim_items_count") > 0) {
						await this._updateClaimItems();
					}
					
					// determine claims approver
					if (oAction === 'Submit Report') {
						var oModelAppr = this.getView().getModel();
						// ApprovalLog.onClaimsApproverDetermination(oModelAppr, oInputModel.getProperty("/claim_header/claim_id"));
					}
					MessageToast.show(oMsg);
					// this._returnToDashboard();
				}

			} catch (e) {
				console.log(e.message || "Submission failed");
				MessageToast.show(e.message || "Submission failed");

				if (prevStatus && (prevStatus.getProperty("/status_id") !== oInputModel.getProperty("/claim_header/status_id"))) {
					oInputModel.setProperty("/claim_header/status_id", prevStatus.getProperty("/status_id"));
					oInputModel.setProperty("/claim_header/descr/status_id", prevStatus.getProperty("/descr/status_id"));
				}
			} finally {
				BusyIndicator.hide();
			}
		},

		_updateClaimItems: async function () {
			// get input model
			var oInputModel = this.getView().getModel("claimsubmission_input");
			//// update last modified date
			var lastModifiedDate = this._getJsonDate(new Date());
			oInputModel.setProperty("/claim_header/last_modified_date", lastModifiedDate);

			// // assign report number to new claim
			// if (oInputModel.getProperty("/is_new")) {
			// 	var currentReportNumber = oInputModel.getProperty("/claim_header/claim_id");
			// 	if (currentReportNumber) {
			// 		oInputModel.getProperty("/claim_items").forEach((claim_item) => {
			// 			claim_item.claim_id = currentReportNumber;
			// 			claim_item.claim_sub_id = currentReportNumber + claim_item.claim_sub_id;
			// 		})
			// 	}
			// 	else {
			// 		console.log("No claim ID available");
			// 		MessageToast.show("No claim ID available");
			// 		return false;
			// 	}
			// }

			// for each item
			oInputModel.getProperty("/claim_items").forEach(async (claim_item) => {
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
					CURRENCY_CODE: this._nonNan(parseFloat(claim_item.currency_code)).toFixed(2),
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

				 try {
					BusyIndicator.show(0);

					const oModel = this.getOwnerComponent().getModel();
					var oListBinding;

					oListBinding = oModel.bindList("/ZCLAIM_ITEM", null,null,
						[
							new sap.ui.model.Filter({ path: "CLAIM_ID", operator: sap.ui.model.FilterOperator.EQ, value1: claim_item.claim_id }),
							new sap.ui.model.Filter({ path: "CLAIM_SUB_ID", operator: sap.ui.model.FilterOperator.EQ, value1: claim_item.claim_sub_id })
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
						console.log("Claim item not found in database; creating new item");
						// create new item
						oListBinding = oModel.bindList("/ZCLAIM_ITEM");
						const oContext = oListBinding.create(oBody.getData());
						oContext.created().then(() => {
							console.log("New claim item created");
						}).catch(err => {
							console.log("Item creation failed: " + err.message);
							MessageToast.show("Item creation failed: " + err.message);
						});
					}

					for (const [key, value] of Object.entries(oBody.getData())) {
						oCtx.setProperty(key, value);
					}

					await oModel.submitBatch("$auto");
					
					console.log("Save claim item success");
				} catch (e) {
					console.log(e.message || "Submission failed");
					MessageToast.show(e.message || "Submission failed");
				}
			})
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

		_getCurrentReportNumber: async function (range_id) {
			const oModel = this.getOwnerComponent().getModel();

			try {
				const oListBinding = oModel.bindList(
				"/ZNUM_RANGE",
				null,
				null,
				[
					new sap.ui.model.Filter({
					path: "RANGE_ID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: range_id
					})
				],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$select: "RANGE_ID,CURRENT,PREFIX"
				}
				);

				const aCtx = await oListBinding.requestContexts(0, 1);
				const oCtx = aCtx[0];

				if (!oCtx) {
					throw new Error(`${range_id} not found`);
				}

				const row = oCtx.getObject();
				if (row.CURRENT == null) {
					throw new Error(`${range_id} missing CURRENT`);
				}

				const current = Number(row.CURRENT);
				const prefix = row.PREFIX;
				const yy = String(new Date().getFullYear()).slice(-2);
				const result = `${prefix}${yy}${String(current).padStart(9, "0")}`;

				return { result, current };

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

		onBack_ClaimSubmission: function () {
			// remove approval log fragment
			var oPage = this.byId("page_claimsubmission");
			var oApprovalLogFragment = this._getFormFragment("approval_log");
			if (oApprovalLogFragment) {
				oApprovalLogFragment.then(function (oVBox) {
					oPage.removeContent(oVBox);
				});
			}

			// reset UI from approver page
			if (oClaimSubmissionModel.getProperty("/is_approver")) {
				// update footer buttons
				this._displayFooterButtons("claimsubmission_summary_claimitem");

				// table changes
				if (this.byId("button_claimsummary_edit")) {
					//// hide buttons
					if (!this.byId("button_claimsummary_createclaim").getVisible()) { this.byId("button_claimsummary_createclaim").setVisible(true); }
					if (!this.byId("button_claimsummary_edit").getVisible()) { this.byId("button_claimsummary_edit").setVisible(true); }
					if (!this.byId("button_claimsummary_duplicate").getVisible()) { this.byId("button_claimsummary_duplicate").setVisible(true); }
					if (!this.byId("button_claimsummary_delete").getVisible()) { this.byId("button_claimsummary_delete").setVisible(true); }
				}

				// table properties
				this.byId("table_claimsummary_claimitem").setMode(sap.m.ListMode.MultiSelect);

				// return to approver screen
				this.getMyApproverPAReq();
				this.getMyApproverClaim();
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("MyApproval");
			}
			else {
				this._returnToDashboard();
			}
		},

		_returnToDashboard: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Dashboard");
		},

		onReject_ClaimSubmission: function () {
			// reject code here
		},

		onBackToEmp_ClaimSubmission: function () {
			// back to employee code here
		},

		onApprove_ClaimSubmission: function () {
			// approval code here
		},

		_newDialog: function (title, content, onPress) {
			this.oDialog = new Dialog({
				title: title,
				type: "Message",
				state: "None",
				content: [ new Label({ text: content }) ],
				beginButton: new Button({
					type: "Emphasized",
					text: this._getTexti18n("button_claimsummary_confirm"),
					press: async function () {
						this.oDialog.close();
						await onPress();
					}.bind(this)
				}),
				endButton: new Button({
					text: this._getTexti18n("button_claimsummary_cancel"),
					press: function () {
						this.oDialog.close();
					}
				})
			});
			this.oDialog.open();
		},

		_getTexti18n: function (i18nKey, array_i18nParameters) {
			if (array_i18nParameters) {
				return this.getView().getModel("i18n").getResourceBundle().getText(i18nKey, array_i18nParameters);
			}
			else {
				return this.getView().getModel("i18n").getResourceBundle().getText(i18nKey);
			}
		},

		// App Control Visibility
		getFieldVisibility_ClaimTypeItem: async function () {
			const oModel = this.getOwnerComponent().getModel();
			var oInputModel = this.getView().getModel("claimitem_input");

			const claimTypeItemFromModel  = oInputModel.getProperty("/claim_item/claim_type_item_id");
			const claim_type_item = claimTypeItemFromModel;

			if (!claim_type_item) {
				console.warn("No claim item found.");
				return;
			}

			const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
				new sap.ui.model.Filter("SUBMISSION_TYPE", "EQ", "CLAIM"),
				new sap.ui.model.Filter("COMPONENT_LEVEL", "EQ", "ITEM"),
				new sap.ui.model.Filter("CLAIM_TYPE_ITEM_ID", "EQ", claim_type_item)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);

				if (!aCtx || aCtx.length === 0) {
					console.warn("No configuration rows for claim type item:", claim_type_item);
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

			} catch (err) {
				console.error("OData bindList failed:", err);
				// this._loadClaimTypeSelectionData(false);
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
				"input_claimdetails_input_from_state_id",
				"input_claimdetails_input_from_location",
				"input_claimdetails_input_to_state_id",
				"input_claimdetails_input_to_location",
				"select_claimdetails_input_room_type",
				"select_claimdetails_input_country",
				"input_claimdetails_input_location",
				"checkbox_claimdetails_input_needforeigncurrency",
				"input_claimdetails_input_currency_code",
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
				c = sap.ui.core.Fragment.byId(this.getView().createId(sFragmentId), sId);
				if (c) return c;

				c = sap.ui.core.Fragment.byId(sFragmentId, sId);
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
					} else {
						console.warn("Control not found or not editable-capable:", id);
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
				"input_claimdetails_input_from_state_id",
				"input_claimdetails_input_from_location",
				"input_claimdetails_input_to_state_id",
				"input_claimdetails_input_to_location",
				"select_claimdetails_input_room_type",
				"select_claimdetails_input_country",
				"input_claimdetails_input_location",
				"checkbox_claimdetails_input_needforeigncurrency",
				"input_claimdetails_input_currency_code",
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

		_toDate: function (val) {

			if (!val) return null;

			// ISO 8601 with or without milliseconds
			if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/i.test(val)) {
				const d = new Date(val);
				if (!isNaN(d.getTime())) {
					return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
				}
				return null;
			}

			// YYYY-MM-DD
			if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
				const [y, m, d] = val.split("-").map(Number);
				return new Date(Date.UTC(y, m - 1, d));
			}

			// JS Date
			if (val instanceof Date && !isNaN(val.getTime())) {
				return new Date(Date.UTC(val.getFullYear(), val.getMonth(), val.getDate()));
			}

			// SAP Edm.Date { year, month, day }
			if (typeof val === "object" && val.year && val.month && val.day) {
				return new Date(Date.UTC(val.year, val.month - 1, val.day));
			}

			return null;
		},

		onDownloadExcelReport: async function () {
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

						// FORCE DATE FORMAT YYYY-MM-DD

						if (meta.type === "date") {
							const dt = that._toDate(cell.v);

							if (dt) {
								cell.t = "d";
								cell.v = dt;
								cell.z = "yyyy-mm-dd";
							} else {
								// clear invalid date to avoid showing 1970-01-01
								delete ws[addr];
							}
						}


						// Numbers
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

				const input = oView.getModel("claimsubmission_input")?.getData();
				if (!input) {
					sap.m.MessageToast.show("No claim data loaded.");
					return;
				}

				const header = input.claim_header || {};
				const items = input.claim_items || [];

				// -------------------------------
				// Build Header Row
				// -------------------------------
				const headerRow = {
					"Claim ID": header.claim_id || "",
					"Purpose": header.purpose || "",
					"Trip Start Date": header.trip_start_date,
					"Trip End Date": header.trip_end_date,
					"Event Start Date": header.event_start_date,
					"Event End Date": header.event_end_date,
					"Location": header.location || "",
					"Comment": header.comment || "",
					"Cost Center": header.cost_center || "",
					"Alternate Cost Center": header.alternate_cost_center || "",
					"Total Claim Amount": header.total_claim_amount,
					"Cash Advance": header.cash_advance_amount,
					"Final Amount To Receive": header.final_amount_to_receive
				};

				const headerColumns = [
					{ label: "Claim ID", property: "Claim ID", width: 18 },
					{ label: "Purpose", property: "Purpose", width: 30 },
					{ label: "Trip Start Date", property: "Trip Start Date", width: 18 },
					{ label: "Trip End Date", property: "Trip End Date", width: 18 },
					{ label: "Event Start Date", property: "Event Start Date", width: 18 },
					{ label: "Event End Date", property: "Event End Date", width: 18 },
					{ label: "Location", property: "Location", width: 20 },
					{ label: "Comment", property: "Comment", width: 30 },
					{ label: "Cost Center", property: "Cost Center", width: 18 },
					{ label: "Alternate Cost Center", property: "Alternate Cost Center", width: 20 },
					{ label: "Total Claim Amount", property: "Total Claim Amount", type: "number", scale: 2, width: 18 },
					{ label: "Cash Advance", property: "Cash Advance", type: "number", scale: 2, width: 18 },
					{ label: "Final Amount To Receive", property: "Final Amount To Receive", type: "number", scale: 2, width: 18 }
				];

				const headerLabels = headerColumns.map(c => c.label);
				const headerValues = headerColumns.map(c => headerRow[c.property] ?? "");

				const wsHeader = XLSX.utils.aoa_to_sheet([headerLabels, headerValues]);
				_applyColumnMeta(wsHeader, headerColumns, 1);

				// -------------------------------
				// Items Sheet
				// -------------------------------
				const itemsColumns = [
					{ label: "Start Date", property: "start_date", width: 18 },
					{ label: "Receipt No", property: "receipt_number", width: 18 },
					{ label: "Claim Type", property: "claim_type_item_id", width: 20 },
					{ label: "Amount", property: "amount", type: "number", scale: 2, width: 14 },
					{ label: "Category", property: "staff_category", width: 18 }
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

				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(wb, wsHeader, "Header");
				XLSX.utils.book_append_sheet(wb, wsItems, "Items");

				XLSX.writeFile(wb, this._getExcelFileName(), {
					bookType: "xlsx",
					cellDates: true,
					compression: true
				});

			} catch (e) {
				console.error("Excel export failed:", e);
				sap.m.MessageToast.show("Excel export failed.");
			} finally {
				oView.setBusy(false);
			}
		},
		//End

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
				"STAT02" // use the exact code/value your backend expects
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
				"STAT02" // use the exact code/value your backend expects
			);
			// (APPROVER = id OR SUBSTITUTE_APPROVER = id) AND STATUS = 'PENDING APPROVAL'
			const oCombined = new sap.ui.model.Filter({
				filters: [oApproverOrSub, oStatusPending],
				and: true // AND between groups
			});
			const oListBinding = oModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
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
	});
});
