sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("claima.controller.BudgetReport", {

        onInit: function () {
            const oModel = this.getOwnerComponent().getModel("employee_view");
            this.getView().setModel(oModel, "employee_view");
        }

    });
});