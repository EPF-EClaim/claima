
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("claima.controller.analytics", {

        // === Public handlers bound in the view ===
        onOpenAnalytics1: function () {
            MessageToast.show("Opening Analytics 1");
            this._openFragment("claima.fragment.analytics_dialog"); // dialog for card 1
        },

        onOpenAnalytics2: function () {
            MessageToast.show("Opening Analytics 2");
            this._openFragment("claima.fragment.analytics_dialog"); // if you have other dialogs
        },

        onOpenAnalytics3: function () {
            this._openFragment("claima.fragment.analytics_dialog");
        },

        onOpenAnalytics4: function () {
            this._openFragment("claima.fragment.analytics_dialog");
        },

        // === Generic fragment loader (caches dialogs per view) ===
        _openFragment: function (sFragmentPath) {
            this._mDialogs ??= {};

            if (!this._mDialogs[sFragmentPath]) {
                Fragment.load({
                    id: this.getView().getId(),         // IMPORTANT: prefix fragment IDs with the view ID
                    name: sFragmentPath,
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog); // lifecycle with view
                    this._mDialogs[sFragmentPath] = oDialog;
                    oDialog.open();
                }.bind(this));
            } else {
                this._mDialogs[sFragmentPath].open();
            }
        },

        // bound in fragment: <Button press=".onCloseDialog" />
        onCloseDialog: function (oEvent) {
            const oBtn = oEvent.getSource();
            const oDialog = oBtn?.getParent(); // beginButton's parent is the Dialog
            if (oDialog && oDialog.close) {
                oDialog.close();
            }
        }
    });
});
