sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], (
	Fragment,
	Controller,
	JSONModel,
	MessageToast
) => {
	"use strict";

	return Controller.extend("claima.controller.ClaimSubmission", {
		onInit: function () {
			// Claim Submission Model
			if (!this.getView().getModel("claimsubmission_input")) {
				var oClaimSubmissionModel = new JSONModel({
					"employee": {
						"eeid": null,
						"name": null,
						"cc": null,
						"descr": {
							"cc": null
						}
					},
					"claimtype": {
						"type": null,
						"item": null,
						"category": null,
						"requestform": null,
						"requestform_amt": null,
						"descr": {
							"type": null,
							"item": null,
							"category": null,
							"requestform": null
						}
					},
					"claimheader": {
						"claim_id": null,
						"emp_id": null,
						"purpose": null,
						"status": null,
						"lastmodifieddate": null,
						"submitteddate": null,
						"trip_startdate": null,
						"trip_enddate": null,
						"event_startdate": null,
						"event_enddate": null,
						"claimtype": null,
						"claimitem": null,
						"subtype": null,
						"location": null,
						"cc": null,
						"altcc": null,
						"comment": null,
						"reqform": null,
						"attachment": null,
						"amt_total": null,
						"amt_approved": null,
						"amt_cashadvance": null,
						"amt_receivefinal": null,
						"lastapproveddate": null,
						"lastapprovedtime": null,
						"lastapproveddate": null,
						"paymentdate": null,
						"movinghouse": {
							"spouseoffice": null,
							"housecompletiondate": null,
							"moveindate": null,
							"housingloanscheme": null,
							"lendername": null,
							"specifydetails": null,
							"newhouseaddress": null,
							"housecompletiondate": null,
							"distoldhouse_officekm": null,
							"distoldhouse_newhousekm": null
						},
						"descr": {
							"status": null,
							"claimtype": null,
							"claimitem": null,
							"subtype": null,
							"cc": null,
							"altcc": null,
							"reqform": null
						}
					}
				});
				//// set input
				this.getView().setModel(oClaimSubmissionModel, "claimsubmission_input");
			}
			else {
				// set input
				this.getView().setModel(oClaimSubmissionModel, "claimsubmission_input");
			}

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

			// Set the initial form to show the claim summary
			this._formFragments = {};
			this._showInitFormFragment();
		},

		_getFormFragment: function (sFragmentName) {
			var pFormFragment = this._formFragments[sFragmentName],
				oView = this.getView();

			if (!pFormFragment) {
				pFormFragment = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sFragmentName
				});
				this._formFragments[sFragmentName] = pFormFragment;
			}

			return pFormFragment;
		},

		_showInitFormFragment : function () {
			var oPage = this.byId("page_claimsubmission");

			// display 
			this._getFormFragment("report").then(function(oVBox){
				oPage.insertContent(oVBox, 0);
			});
			this._getFormFragment("expensetype").then(function(oVBox){
				oPage.insertContent(oVBox, 1);
			});
		}
	});
});
