
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("claima.controller.analytics", {
        

        // === Public handlers bound in the view ===
        onOpenAnalytics1: function () {
            var oReqModel = this.getView().getModel("request");
			var oInputData = oReqModel.getData();
			var okcode = true;
			var message = '';
            this._openFragment("claima.fragment.analyticsdialog"); // dialog for card 1
        },

        onOpenAnalytics2: function () {
            this._openFragment("claima.fragment.analyticsdialog"); // if you have other dialogs
        },

        onOpenAnalytics3: function () {
            this._openFragment("claima.fragment.analyticsdialog");
        },

        onOpenAnalytics4: function () {
            this._openFragment("claima.fragment.analyticsdialog");
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
        },

        onClickCreateRequest_ana: async function (oEvent) {
            let oCtrl = oEvent.getSource();
            while (oCtrl && !oCtrl.isA?.("sap.m.Dialog")) {
                oCtrl = oCtrl.getParent?.();
            }
            oCtrl?.close();

            var oRoot = this.getOwnerComponent().getRootControl();  // App.view root
            var oNav = oRoot && oRoot.byId("pageContainer");
            if (!oNav) {
                sap.m.MessageToast.show("Main NavContainer not found.");
                return;
            }

            // Cache container to avoid reloading on next open
            this._pages ??= {};

            if (!this._pages.analyticsClaimReportPage) {
                try {
                    // Load the FRAGMENT (module path mirrors /fragment/ file path)
                    const oPage = await sap.ui.core.Fragment.load({
                        id: oRoot.getId(),                              // prefix fragment IDs with App View ID
                        name: "claima.fragment.analyticsclaimreportsummary",   // <-- if file is analytics_claim_report.fragment.xml, use "claima.fragment.analytics_claim_report"
                        controller: this
                    });

      /*               // 5) Sanity check: we expect a sap.m.Page as fragment root
                    if (!oPage?.isA?.("sap.m.Page")) {
                        sap.m.MessageToast.show("Report fragment must have a sap.m.Page as the root control.");
                        return;
                    } */

                    // 6) Add once to the NavContainer and cache
                    oNav.addPage(oPage);
                    this._pages.analyticsClaimReportPage = oPage;

                } catch (e) {
                    /* eslint-disable no-console */
                    console.error("Failed to load fragment 'claima.fragment.analyticsclaimreport':", e);
                    sap.m.MessageToast.show("Failed to open report page (see console).");
                    return;
                }
            }

            // 7) Navigate to the fragment page
            oNav.to(this._pages.analyticsClaimReportPage, "slide");
        },
        onClickCancel_ana: function (oEvent) {
            let oCtrl = oEvent.getSource();
            while (oCtrl && !oCtrl.isA?.("sap.m.Dialog")) {
                oCtrl = oCtrl.getParent?.();
            }
            if (oCtrl) {
                oCtrl.close();
            } else {
                // Optional: log if not found
                // jQuery.sap.log.warning("Close requested but no parent Dialog was found.");
            }

        },





    });
});
