sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"claima/utils/Utility",
	"sap/m/MessageBox",
	"claima/utils/Request",
	"claima/utils/MyApproval",
	"claima/utils/Constants",
	"sap/ui/core/BusyIndicator"
], (Controller, JSONModel, Sorter, Utility, MessageBox, Request, MyApproval, Constants, BusyIndicator) => {
	"use strict";

	return Controller.extend("claima.controller.Dashboard", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oDashboardModel = new JSONModel({
				claims: [],
				requests: [],
				approvals: []
			});
			this.getView().setModel(this._oDashboardModel, "dashboardModel");

			this._oRouter.getRoute("Dashboard").attachPatternMatched(this._onMatched, this);
		},

		_onMatched: function () {
			this.getOwnerComponent().getModel("employee")?.refresh();
			this.getOwnerComponent().getModel("employee_view")?.refresh();
			this._loadDashboardData();
		},

		_loadDashboardData: function () {
			const _oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");

			_oEmployeeViewModel.bindList("/ZEMP_CLAIM_EE_VIEW", null, [
				new Sorter("modifiedAt", true)
			]).requestContexts(0, Infinity)
				.then(aContexts => {
					this._oDashboardModel.setProperty("/claims", aContexts.map(c => c.getObject()));
				})
				.catch(err => console.log("claims error:", err));

			_oEmployeeViewModel.bindList("/ZEMP_REQUEST_EE_VIEW", null, [
				new Sorter("modifiedAt", true)
			]).requestContexts(0, Infinity)
				.then(aContexts => {
					this._oDashboardModel.setProperty("/requests", aContexts.map(c => c.getObject()));
				})
				.catch(err => console.log("requests error:", err));

			_oEmployeeViewModel.bindList("/ZEMP_APPROVER_DETAILS").requestContexts(0, Infinity)
				.then(aContexts => {
					this._oDashboardModel.setProperty("/approvals", aContexts.map(c => c.getObject()));
				})
				.catch(err => {
					console.log("approvals not available for this role");
					this._oDashboardModel.setProperty("/approvals", []);
				});
			// Hide indicator once everything is loaded
			BusyIndicator.hide();
		},

		onClickNavigate: function (oEvent) {
			let sId = oEvent.getParameters().id;

			if (sId.includes("dashboard-claim")) {
				this._oRouter.navTo("ClaimStatus")
			} else if (sId.includes("request")) {
				this._oRouter.navTo("RequestFormStatus");
			} else if (sId.includes("approval")) {
				this._oRouter.navTo("MyApproval");
			}
		},
		/**
		 * My Claim Status table row item on press event handlder
		 * @public
		 * @param {sap.ui.base.Event} oEvent - on row item press event
		 */
		onRequestFormItemPress: function (oEvent) {
			this._oRouter.navTo("RequestForm", { request_id: oEvent.getSource().getSelectedContexts()[0].getProperty('REQUEST_ID') });
		},
		/**
		 * My Pre-Approval Status table row on press event handlder
		 * @public
		 * @param {sap.ui.base.Event} oEvent - on row item press event
		 */
		onClaimSubmissionItemPress: function (oEvent) {
			this._oRouter.navTo("ClaimSubmission", { claim_id: oEvent.getSource().getSelectedContexts()[0].getProperty('CLAIM_ID') });
		},
		/**
		 * Required Approval table row item press event handlder
		 * @public
		 * @param {sap.ui.base.Event} oEvent - on row item press event
		 */
		onOpenApprovalListItemPress: function (oEvent) {
			var sId = oEvent.getSource().getSelectedContexts()[0].getProperty("ID");
			if (sId.startsWith(Constants.WorkflowType.REQUEST)) {
				this._oRouter.navTo("RequestForm", { request_id: sId });
			} else if (sId.startsWith(Constants.WorkflowType.CLAIM)) {
				this._oRouter.navTo("ClaimSubmission", { claim_id: sId });
			}
		}
	});
}); 