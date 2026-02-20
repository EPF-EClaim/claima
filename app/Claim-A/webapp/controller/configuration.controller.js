sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
], (Controller, Fragment) => {
    "use strict";

    return Controller.extend("claima.controller.configuration", {
        onInit() {

            this._oAppModel = new sap.ui.model.json.JSONModel({
                mode: "list",
                selectedHeader: null
            });
            this.getView().setModel(this._oAppModel, "config");


            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ZCLAIM_TYPE").attachPatternMatched(this._onListRouteMatched, this);
        },

        onOpenConfigTable: function (oEvent) {
            var oNavigation = oEvent.getSource().getId().split("--").pop();
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo(oNavigation);
        },

        onNavigate: async function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();

            const oConfigModel = this.getView().getModel("config");
            oConfigModel.setProperty("/selectedHeader", oData);
            oConfigModel.setProperty("/mode", "object");

            if (!this._oItemsFragment) {
                this._oItemsFragment = await sap.ui.core.Fragment.load({
                    id: this.createId("ClaimItems"),
                    name: "claima.fragment.configtableitem",
                    controller: this
                });
                this._oItemsFragment.setModel(this.getView().getModel());
            }

            const oContainer = this.byId("objectContainer");
            if (oContainer.indexOfItem(this._oItemsFragment) === -1) {
                oContainer.removeAllItems(); // optional
                oContainer.addItem(this._oItemsFragment);
            }
            this._oItemsFragment.setBindingContext(oContext);
        },

        _onListRouteMatched: function () {
            const oConfig = this.getView().getModel("config");
            oConfig.setProperty("/mode", "list");
            oConfig.setProperty("/selectedHeader", null);

            const oObjectContainer = this.byId("objectContainer");
            if (oObjectContainer) {
                oObjectContainer.removeAllItems();
            }
        },

        onCopy: function (oEvent) {

        },
        onEdit: function (oEvent) {

        },
        onCreate: function () {

        },
        onDelete: function (oEvent) {

        }

    });
});
