sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    // NEW:
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    // Added: JSONModel import (best practice)
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, Fragment, Spreadsheet, Dialog, Button, Input, Label, VBox, JSONModel) {
    "use strict";

    // --- helpers (NEW) ---
    function sanitizeFileName(s) {
        // Remove characters not allowed by OS/Excel file systems: \ / : * ? " < > |
        // Collapse spaces, trim, and limit to 80 chars
        return (s || "")
            .replace(/[\\/:*?"<>|]/g, "_")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 80);
    }

    const TABLE_ID = "analyticsclaimsumtab"; // (kept for future use)

    return Controller.extend("claima.controller.analytics", {

        // Unified open handler
        onOpenAnalytics: function (oEvent) {
            const oBtn = oEvent.getSource();

            // Read the target from customData
            let sTarget = oBtn.data("target");
            if (!sTarget) {
                const aCD = oBtn.getCustomData?.() || [];
                const oCD = aCD.find(d => d.getKey && d.getKey() === "target");
                sTarget = oCD?.getValue?.();
            }
            if (!sTarget) {
                MessageToast.show("Configuration issue: target not found on the pressed button.");
                return;
            }
            this._analyticsTarget = sTarget;

            // small VM
            const mFlags = this.getVisibilityForTarget(sTarget);
            if (!this._oAnalyticsVM) {
                // ✅ use imported JSONModel instead of global
                this._oAnalyticsVM = new JSONModel(mFlags);
                this.getView().setModel(this._oAnalyticsVM, "anaVM");
            } else {
                this._oAnalyticsVM.setData(mFlags);
            }

            // open shared dialog
            this._openFragment("claima.fragment.analyticsdialog");
        },

        // === Generic fragment loader (caches dialogs per view) ===
        _openFragment: function (sFragmentPath) {
            this._mDialogs ??= {};

            if (!this._mDialogs[sFragmentPath]) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: sFragmentPath,
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    this._mDialogs[sFragmentPath] = oDialog;
                    oDialog.open();
                }.bind(this));
            } else {
                this._mDialogs[sFragmentPath].open();
            }
        },

        // Close button in dialog
        onCloseDialog: function (oEvent) {
            let oCtrl = oEvent.getSource();
            while (oCtrl && !oCtrl.isA?.("sap.m.Dialog")) {
                oCtrl = oCtrl.getParent?.();
            }
            oCtrl?.close();
        },

        onClickCreateRequest_ana: async function (oEvent) {
            // Close dialog first
            let oCtrl = oEvent.getSource();
            while (oCtrl && !oCtrl.isA?.("sap.m.Dialog")) {
                oCtrl = oCtrl.getParent?.();
            }
            oCtrl?.close();

            const sTarget = this._analyticsTarget;
            if (!sTarget) {
                MessageToast.show("No target selected.");
                return;
            }

            await this._navToFragmentTarget(sTarget);
        },

        // Fragment-based navigation helper
        _navToFragmentTarget: async function (sTarget) {
            const mTargetToFragment = {
                analyticsClaimReportSummary: "claima.fragment.analyticsclaimreportsummary",
                analyticsClaimReportDetails: "claima.fragment.analyticsclaimreport",
                preApprovedSummary: "claima.fragment.analyticsreqreportsummary",
                preApprovedDetails: "claima.fragment.analyticsreqreport"
            };

            const sFragmentName = mTargetToFragment[sTarget];
            if (!sFragmentName) {
                MessageToast.show("Unknown target: " + sTarget);
                return;
            }

            const oRoot = this.getOwnerComponent().getRootControl();
            const oNav = oRoot && oRoot.byId("pageContainer");
            if (!oNav) {
                MessageToast.show("Main NavContainer not found.");
                return;
            }

            // Cache created pages
            this._pages ??= {};
            const sCacheKey = sTarget; // one page per target

            if (!this._pages[sCacheKey]) {
                try {
                    const oPage = await sap.ui.core.Fragment.load({
                        id: oRoot.getId(), //
                        name: sFragmentName,
                        controller: this
                    });

                    const oClaimModel = this.getOwnerComponent().getModel("employee_view");
                    if (!oClaimModel) {
                        console.error("OData V4 model 'employee_view' not found in component.");
                        MessageToast.show("Model 'employee_view' is missing (check manifest.json).");
                    } else {
                        oPage.setModel(oClaimModel, "employee_view");
                    }

                    oNav.addPage(oPage);
                    this._pages[sCacheKey] = oPage;


                    // The delegate ('sap/ui/mdc/TableDelegate') with payload { modelName, collectionName }
                    // will auto-bind to /ZEMP_CLAIM_REPORT_SUMMARY on the 'employee_view' model.

                } catch (e) {
                    console.error("Failed to load fragment '" + sFragmentName + "':", e);
                    MessageToast.show("Failed to open the selected page (see console).");
                    return;
                }
            }

            oNav.to(this._pages[sCacheKey], "slide");
        },

        // If you still need Cancel to only close dialog
        onClickCancel_ana: function (oEvent) {
            let oCtrl = oEvent.getSource();
            while (oCtrl && !oCtrl.isA?.("sap.m.Dialog")) {
                oCtrl = oCtrl.getParent?.();
            }
            oCtrl?.close();
        },

        getVisibilityForTarget: function (sTarget) {
            switch (sTarget) {
                case "analyticsClaimReportSummary":
                    return { showRequestType: false, showClaimCategory: true, showNextButton: true };
                case "analyticsClaimReportDetails":
                    return { showRequestType: false, showClaimCategory: true, showNextButton: true };
                case "preApprovedSummary":
                    return { showRequestType: true, showClaimCategory: false, showNextButton: true };
                case "preApprovedDetails":
                    return { showRequestType: true, showClaimCategory: false, showNextButton: true };
                default:
                    return { showRequestType: true, showClaimCategory: true, showNextButton: true };
            }
        },

        // =======================
        // EXPORT (with "Save As")
        // =======================

        // Opens a "Save As" dialog first
        onExportAnalyticsReport: function () {
            const oDlg = this._createSaveAsDialog();
            oDlg.open();
        },

        // Build a default file name (can include target & date)
        _buildDefaultReportName: function () {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const sTarget = this._analyticsTarget || "Report";
            // Example: PreApprovedSummary_2026-02-16
            return `${sTarget}_${dateStr}`;
        },

        // Create (or reuse) the dialog
        _createSaveAsDialog: function () {
            if (this._oSaveAsDialog) {
                this.byId("saveAsInput")?.setValue(this._buildDefaultReportName());
                this._validateSaveAsDialog();
                return this._oSaveAsDialog;
            }

            const oInput = new Input(this.createId("saveAsInput"), {
                value: this._buildDefaultReportName(),
                description: ".xlsx",
                liveChange: (oEvt) => {
                    const sVal = sanitizeFileName(oEvt.getParameter("value"));
                    oEvt.getSource().setValue(sVal);
                    this._validateSaveAsDialog();
                },
                submit: () => this._confirmSaveAs() // Enter key
            });

            const oCsvBtn = new Button({
                text: "Export (CSV, choose folder)",
                type: "Transparent",
                press: () => this._confirmSaveAsCsv()
            });

            const oContent = new VBox({
                width: "100%",
                items: [
                    new Label({ text: "Report name", labelFor: oInput }),
                    oInput,
                    oCsvBtn // secondary action inside dialog
                ]
            }).addStyleClass("sapUiSmallMargin");

            this._oSaveAsDialog = new Dialog({
                title: "Save As",
                contentWidth: "30rem",
                draggable: true,
                resizable: true,
                content: [oContent],
                beginButton: new Button({
                    text: "Export (.xlsx)",
                    type: "Emphasized",
                    press: () => this._confirmSaveAs()
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: () => this._oSaveAsDialog.close()
                })
            });

            this.getView().addDependent(this._oSaveAsDialog);
            this._validateSaveAsDialog();
            return this._oSaveAsDialog;
        },

        _validateSaveAsDialog: function () {
            const oInput = this.byId("saveAsInput");
            const sVal = sanitizeFileName(oInput.getValue());
            const bValid = !!sVal;
            oInput.setValueState(bValid ? "None" : "Error");
            oInput.setValueStateText(bValid ? "" : "Please enter a report name");
            this._oSaveAsDialog.getBeginButton().setEnabled(bValid);
        },

        _confirmSaveAs: async function () {
            const oInput = this.byId("saveAsInput");
            let sName = sanitizeFileName(oInput.getValue());
            if (!sName) {
                this._validateSaveAsDialog();
                return;
            }
            if (!/\.xlsx$/i.test(sName)) {
                sName += ".xlsx";
            }
            this._oSaveAsDialog.close();
            await this._exportSpreadsheet(sName);
        },

        // NEW: CSV path using File System Access API (Chromium only)
        _confirmSaveAsCsv: async function () {
            const oInput = this.byId("saveAsInput");
            let sName = sanitizeFileName(oInput.getValue());
            if (!sName) {
                this._validateSaveAsDialog();
                return;
            }
            if (!/\.csv$/i.test(sName)) {
                sName += ".csv";
            }
            this._oSaveAsDialog.close();
            await this._exportAsCsvWithPicker(sName);
        },

        // Actually perform the export via OData V4 (XLSX)
        _exportSpreadsheet: async function (sFileName) {
            const aCols = [
                { label: "Employee", property: "employee", type: "string" },
                { label: "Personal Grade", property: "personal_grade", type: "string" },
                { label: "Department", property: "dept_name", type: "string" },
                { label: "Pre-App Date", property: "preappreq_date", type: "date" },
                { label: "Submitted Date", property: "submitted_date", type: "date" },
                { label: "Final App Date", property: "final_app_date", type: "date" },
                { label: "Days Approved", property: "days_approved", type: "number" },
                { label: "Total Amount", property: "total_req_amt", type: "number", scale: 2, delimiter: true }
            ];

            const oSettings = {
                workbook: { columns: aCols },
                dataSource: [],         // HEADERS ONLY (no data)
                fileName: sFileName,
                worker: true
            };

            const oSheet = new sap.ui.export.Spreadsheet(oSettings);
            oSheet.build().finally(() => oSheet.destroy());
        },

        // NEW: CSV export with folder picker (Chromium browsers)
        _exportAsCsvWithPicker: async function (sSuggestedNameCsv) {
            if (!("showSaveFilePicker" in window)) {
                MessageToast.show("Picking a folder isn’t supported by this browser. Using normal download instead.");
                await this._exportSpreadsheet(sSuggestedNameCsv.replace(/\.csv$/i, ".xlsx"));
                return;
            }

            const oTable = this._getMdcTable();
            if (!oTable || !oTable.getRowBinding) {
                MessageToast.show("Export failed: table not found.");
                return;
            }

            const oBinding = oTable.getRowBinding();

            try { await oBinding.requestContexts(0, 1); } catch (e) { /* no-op */ }
            const iLen = oBinding.getLength();
            if (iLen === 0) {
                MessageToast.show("Nothing to export. Adjust filters and try again.");
                return;
            }

            const aCtx = await oBinding.requestContexts(0, iLen);
            const aRows = aCtx.map(c => c.getObject());

            const aCols = [
                { header: "Employee", prop: "employee" },
                { header: "Personal Grade", prop: "personal_grade" },
                { header: "Department", prop: "dept_name" },
                { header: "Pre-App Date", prop: "preappreq_date" },
                { header: "Submitted Date", prop: "submitted_date" },
                { header: "Final App Date", prop: "final_app_date" },
                { header: "Days Approved", prop: "days_approved" },
                { header: "Total Amount", prop: "total_req_amt" }
            ];

            const escapeCsv = (v) => {
                if (v == null) return "";
                const s = String(v);
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const sHeader = aCols.map(c => escapeCsv(c.header)).join(",");
            const sLines = aRows.map(r => aCols.map(c => escapeCsv(r[c.prop])).join(","));
            const sCsv = [sHeader, ...sLines].join("\n");
            const oBlob = new Blob([sCsv], { type: "text/csv;charset=utf-8" });

            let handle;
            try {
                handle = await window.showSaveFilePicker({
                    suggestedName: sSuggestedNameCsv,
                    types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }]
                });
            } catch (e) {
                if (e && e.name === "AbortError") {
                    return; // user canceled
                }
                throw e;
            }

            const writable = await handle.createWritable();
            await writable.write(oBlob);
            await writable.close();

            MessageToast.show("CSV saved.");
        },

        _getMdcTable: function () {
            const oRoot = this.getOwnerComponent().getRootControl();
            // Because Fragment.load used: id: oRoot.getId(), the real ID is <AppId>--analyticsclaimsumtab
            return oRoot && (oRoot.byId(TABLE_ID) || sap.ui.getCore().byId(oRoot.getId() + "--" + TABLE_ID));
        }

    });
});