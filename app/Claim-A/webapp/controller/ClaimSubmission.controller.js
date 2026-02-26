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
				"item_id": null,
				"date": null,
				"receipt": null,
				"claimitem": null,
				"amt": null,
				"category": null,
				"descr": {
					"claimitem": null,
					"category": null
				}
			});
			//// set input
			this.getView().setModel(oClaimItemModel, modelName);
			return this.getView().getModel(modelName);
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
						EMP_ID: oInputModel.getProperty("claim_header/emp_id"),
						PURPOSE: oInputModel.getProperty("claim_header/purpose"),
						TRIP_START_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/trip_start_date")),
						TRIP_END_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/trip_end_date")),
						EVENT_START_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/event_start_date")),
						EVENT_END_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/event_end_date")),
						SUBMISSION_TYPE: oInputModel.getProperty("claim_header/submission_type"),
						COMMENT: oInputModel.getProperty("claim_header/comment"),
						ALTERNATE_COST_CENTER: oInputModel.getProperty("claim_header/alternate_cost_center"),
						COST_CENTER: oInputModel.getProperty("claim_header/cost_center"),
						REQUEST_ID: oInputModel.getProperty("claim_header/request_id"),
						ATTACHMENT_EMAIL_APPROVER: oInputModel.getProperty("claim_header/attachment_email_approver"),
						STATUS_ID: oInputModel.getProperty("claim_header/status_id"),
						CLAIM_TYPE_ID: oInputModel.getProperty("claim_header/claim_type_id"),
						TOTAL_CLAIM_AMOUNT: parseFloat(oInputModel.getProperty("claim_header/total_claim_amount")).toFixed(2),
						FINAL_AMOUNT_TO_RECEIVE: parseFloat(oInputModel.getProperty("claim_header/final_amount_to_receive")).toFixed(2),
						LAST_MODIFIED_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/last_modified_date")),
						SUBMITTED_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/submitted_date")),
						LAST_APPROVED_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/last_approved_date")),
						LAST_APPROVED_TIME: this._getHanaTime(oInputModel.getProperty("claim_header/last_approved_time")),
						PAYMENT_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/payment_date")),
						LOCATION: oInputModel.getProperty("claim_header/location"),
						SPOUSE_OFFICE_ADDRESS: oInputModel.getProperty("claim_header/spouse_office_address"),
						HOUSE_COMPLETION_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/house_completion_date")),
						MOVE_IN_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/move_in_date")),
						HOUSING_LOAN_SCHEME: oInputModel.getProperty("claim_header/housing_loan_scheme"),
						LENDER_NAME: oInputModel.getProperty("claim_header/lender_name"),
						SPECIFY_DETAILS: oInputModel.getProperty("claim_header/specify_details"),
						NEW_HOUSE_ADDRESS: oInputModel.getProperty("claim_header/new_house_address"),
						DIST_OLD_HOUSE_TO_OFFICE_KM: parseFloat(oInputModel.getProperty("claim_header/dist_old_house_to_office_km")).toFixed(2),
						DIST_OLD_HOUSE_TO_NEW_HOUSE_KM: parseFloat(oInputModel.getProperty("claim_header/dist_old_house_to_new_house_km")).toFixed(2),
						APPROVER1: oInputModel.getProperty("claim_header/approver1"),
						APPROVER2: oInputModel.getProperty("claim_header/approver2"),
						APPROVER3: oInputModel.getProperty("claim_header/approver3"),
						APPROVER4: oInputModel.getProperty("claim_header/approver4"),
						APPROVER5: oInputModel.getProperty("claim_header/approver5"),
						LAST_SEND_BACK_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/last_send_back_date")),
						COURSE_CODE: oInputModel.getProperty("claim_header/course_code"),
						PROJECT_CODE: oInputModel.getProperty("claim_header/project_code"),
						CASH_ADVANCE_AMOUNT: parseFloat(oInputModel.getProperty("claim_header/cash_advance_amount")).toFixed(2),
						PREAPPROVED_AMOUNT: parseFloat(oInputModel.getProperty("claim_header/preapproved_amount")).toFixed(2),
						REJECT_REASON_ID: oInputModel.getProperty("claim_header/reject_reason_id"),
						SEND_BACK_REASON_ID: oInputModel.getProperty("claim_header/send_back_reason_id"),
						LAST_SEND_BACK_TIME: this._getHanaTime(oInputModel.getProperty("claim_header/last_send_back_time")),
						REJECT_REASON_DATE: this._getHanaDate(oInputModel.getProperty("claim_header/reject_reason_date")),
						REJECT_REASON_TIME: this._getHanaTime(oInputModel.getProperty("claim_header/reject_reason_time"))
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
