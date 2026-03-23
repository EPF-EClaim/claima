sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"claima/utils/Utility"
], (Controller, JSONModel, Sorter, Utility) => {
    "use strict";

    return Controller.extend("claima.controller.dashboard", {
        onInit: function() {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oDashboardModel = new JSONModel({
				claims: [],
				requests: [],
				approvals: []
			});
			this.getView().setModel(this._oDashboardModel, "dashboardModel");

            this._oRouter.getRoute("Dashboard").attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function() {
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
		},

		onClickNavigate: function (oEvent) {
			let id = oEvent.getParameters().id;

			const userType = this.getView().getModel("session")?.getProperty("/userType")
				|| this._userType
				|| "UNKNOWN";

			if (id.includes("dashboard-claim")) {
				this._oRouter.navTo("ClaimStatus")
			} else if (id.includes("request")) {
				this._oRouter.navTo("RequestFormStatus");
			} else if (id.includes("approval")) {
				if (userType === "Approver") {
					this._oRouter.navTo("MyApproval");
				} else {
					var message = Utility.getText("msg_unauthorized_role");
					sap.m.MessageBox.error(message);
				}
			}
		}
    });
}); 