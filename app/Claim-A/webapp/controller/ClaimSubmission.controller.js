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
			// else {
			// 	var oClaimSubmissionModel = new JSONModel({
			// 		"employee": {
			// 			"eeid": null,
			// 			"name": null,
			// 			"cc": null,
			// 			"descr": {
			// 				"cc": null
			// 			}
			// 		},
			// 		"claimtype": {
			// 			"type": null,
			// 			"item": null,
			// 			"category": null,
			// 			"requestform": null,
			// 			"requestform_amt": null,
			// 			"descr": {
			// 				"type": null,
			// 				"item": null,
			// 				"category": null,
			// 				"requestform": null
			// 			}
			// 		},
			// 		"claimheader": {
			// 			"claim_id": null,
			// 			"emp_id": null,
			// 			"purpose": null,
			// 			"status": null,
			// 			"lastmodifieddate": null,
			// 			"submitteddate": null,
			// 			"trip_startdate": null,
			// 			"trip_enddate": null,
			// 			"event_startdate": null,
			// 			"event_enddate": null,
			// 			"claimtype": null,
			// 			"claimitem": null,
			// 			"subtype": null,
			// 			"location": null,
			// 			"cc": null,
			// 			"altcc": null,
			// 			"comment": null,
			// 			"reqform": null,
			// 			"attachment": null,
			// 			"amt_total": null,
			// 			"amt_approved": null,
			// 			"amt_cashadvance": null,
			// 			"amt_receivefinal": null,
			// 			"lastapproveddate": null,
			// 			"lastapprovedtime": null,
			// 			"lastapproveddate": null,
			// 			"paymentdate": null,
			// 			"movinghouse": {
			// 				"spouseoffice": null,
			// 				"housecompletiondate": null,
			// 				"moveindate": null,
			// 				"housingloanscheme": null,
			// 				"lendername": null,
			// 				"specifydetails": null,
			// 				"newhouseaddress": null,
			// 				"housecompletiondate": null,
			// 				"distoldhouse_officekm": null,
			// 				"distoldhouse_newhousekm": null
			// 			},
			// 			"descr": {
			// 				"status": null,
			// 				"claimtype": null,
			// 				"claimitem": null,
			// 				"subtype": null,
			// 				"cc": null,
			// 				"altcc": null,
			// 				"reqform": null
			// 			}
			// 		},
			// 		"claimitems": [{
			// 			"item_id": null,
			// 			"date": null,
			// 			"receipt": null,
			// 			"claimtype": null,
			// 			"claimitem": null,
			// 			"amt": null,
			// 			"category": null,
			// 			"descr": {
			// 				"claimtype": null,
			// 				"claimitem": null,
			// 				"category": null
			// 			}
			// 		}],
			// 		"claimitem_count": 0
			// 	});
			// 	//// set input
			// 	this.getView().setModel(oClaimSubmissionModel, "claimsubmission_input");
			// }

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

		onCreateClaim_ClaimSummary: function () {
			MessageToast.show("reachable");

			// show claim details screen
			var oPage = this.byId("page_claimsubmission");
			var oClaimItemFragment = this._getFormFragment("claimsubmission_summary_claimitem");
			if (oClaimItemFragment) {
				oClaimItemFragment.then(function (oVBox) {
					oPage.removeContent(oVBox);
				});
			}
			this._getFormFragment("claimdetails").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
		},

		onScanReceipt_ClaimSummary: function () {
			MessageToast.show("reachable scanreceipt");

			// show claim details screen
			var oPage = this.byId("page_claimsubmission");
			oPage.removeContent(oVBox, 1);
			this._getFormFragment("claimdetails").then(function (oVBox) {
				oPage.insertContent(oVBox, 1);
			});
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
						CLAIM_ID                       : oInputData.claimheader.claim_id,
						EMP_ID                         : oInputData.claimheader.emp_id,
						PURPOSE                        : oInputData.claimheader.purpose,
						TRIP_START_DATE                : this._getJSONDate(oInputData.claimheader.trip_startdate),
						TRIP_END_DATE                  : this._getJSONDate(oInputData.claimheader.trip_enddate),
						EVENT_START_DATE               : this._getJSONDate(oInputData.claimheader.event_startdate),
						EVENT_END_DATE                 : this._getJSONDate(oInputData.claimheader.event_enddate),
						SUBMISSION_TYPE                : oInputData.claimheader.subtype,
						COMMENT                        : oInputData.claimheader.comment,
						ALTERNATE_COST_CENTER          : oInputData.claimheader.altcc,
						COST_CENTER                    : oInputData.claimheader.cc,
						REQUEST_ID                     : oInputData.claimheader.reqform,
						ATTACHMENT_EMAIL_APPROVER      : oInputData.claimheader.attachment,
						STATUS_ID                      : oInputData.claimheader.status,
						CLAIM_TYPE_ID                  : oInputData.claimheader.claimtype,
						CLAIM_TYPE_ITEM_ID             : oInputData.claimheader.claimitem,
						TOTAL_CLAIM_AMOUNT             : parseFloat(oInputData.claimheader.amt_total),
						PREAPPROVED_AMOUNT             : parseFloat(oInputData.claimheader.amt_approved),
						CASH_ADVANCE_AMOUNT            : parseFloat(oInputData.claimheader.amt_cashadvance),
						FINAL_AMOUNT_TO_RECEIVE        : parseFloat(oInputData.claimheader.amt_receivefinal),
						LAST_MODIFIED_DATE             : this._getJSONDate(oInputData.claimheader.lastmodifieddate),
						SUBMITTED_DATE                 : this._getJSONDate(oInputData.claimheader.submitteddate),
						LAST_APPROVED_DATE             : this._getJSONDate(oInputData.claimheader.lastapproveddate),
						LAST_APPROVED_TIME             : oInputData.claimheader.lastapprovedtime,
						LAST_SEND_BACK_DATE            : this._getJSONDate(oInputData.claimheader.lastsendbackdate),
						PAYMENT_DATE                   : this._getJSONDate(oInputData.claimheader.paymentdate),
						LOCATION                       : oInputData.claimheader.location,
						SPOUSE_OFFICE_ADDRESS          : oInputData.claimheader.movinghouse.spouseoffice,
						HOUSE_COMPLETION_DATE          : this._getJSONDate(oInputData.claimheader.movinghouse.housecompletiondate),
						MOVE_IN_DATE                   : this._getJSONDate(oInputData.claimheader.movinghouse.moveindate),
						HOUSING_LOAN_SCHEME            : oInputData.claimheader.movinghouse.housingloanscheme,
						LENDER_NAME                    : oInputData.claimheader.movinghouse.lendername,
						SPECIFY_DETAILS                : oInputData.claimheader.movinghouse.specifydetails,
						NEW_HOUSE_ADDRESS              : oInputData.claimheader.movinghouse.newhouseaddress,
						DIST_OLD_HOUSE_TO_OFFICE_KM    : parseFloat(oInputData.claimheader.movinghouse.distoldhouse_officekm),
						DIST_OLD_HOUSE_TO_NEW_HOUSE_KM : parseFloat(oInputData.claimheader.movinghouse.distoldhouse_newhousekm),
						PROJECT_CODE                   : oInputData.claimheader.projectcode,
						COURSE_CODE                    : oInputData.claimheader.coursecode,
						APPROVER1                      : oInputData.claimheader.approver.approver1,
						APPROVER2                      : oInputData.claimheader.approver.approver2,
						APPROVER3                      : oInputData.claimheader.approver.approver3,
						APPROVER4                      : oInputData.claimheader.approver.approver4,
						APPROVER5                      : oInputData.claimheader.approver.approver5,
					})
				})
				.then(r => r.json())
				.then(async (res) => {
					if (!res.error) {
						// successfully created record
						MessageToast.show(this._getTexti18n("msg_claimsubmission_created"));
						this._updateCurrentReportNumber(oInputData.claimheader.claim_id.slice(-9));

						// return to dashboard
						this._returnToDashboard();
					} else {
						// replace current claim ID with updated claim ID
						switch (res.error.code) {
							case '301':
								MessageToast.show(this._getTexti18n("msg_claimsubmission_uniqueid", [oInputData.claimheader.claim_id]));
								// get updated claim report number
								this._updateCurrentReportNumber(oInputModel.getProperty("/reportnumber/current"));
								var currentReportNumber = await this.getCurrentReportNumber();
								if (currentReportNumber) {
									oInputModel.setProperty("/claimheader/claim_id", currentReportNumber.reportNo);
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

		_getJSONDate: function (date) {
			if (date) {
				var oDate = new Date (date);
				var oDateString = oDate.getFullYear() + '-' + ('0' + (oDate.getMonth()+1)).slice(-2) + '-' + ('0' + oDate.getDate()).slice(-2);
				return oDateString;
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
			// Navigate to dashboard (parent NavContainer)
			const oScroll = this.getView().getParent();              // ScrollContainer
			const oNav    = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer
			const aPages  = oNav?.getPages ? oNav.getPages() : oNav?.getAggregation?.("pages");
			const oMain   = aPages && aPages.find(p => p.getId && p.getId().endsWith("dashboard"));
			if (oMain) oNav.to(oMain, "slide");
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
