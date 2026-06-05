sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("claima.controller.BudgetDetail", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();

            oRouter.getRoute("ZEMP_CC_BUDGET_DETAIL")
                .attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function (oEvent) {
            const args = oEvent.getParameter("arguments");

            const aFilters = [
                new Filter("FUND_CENTER", FilterOperator.EQ, args.fundCenter),
                new Filter("COMMITMENT_ITEM", FilterOperator.EQ, args.glCode),
                new Filter("MATERIAL_GROUP", FilterOperator.EQ, args.material)
            ];

            const oTable = this.byId("detailTable");

            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").filter(aFilters);
            }
        }

    });
});