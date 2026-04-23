sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/core/Fragment",
  "sap/ui/export/Spreadsheet",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/FilterType"
], function (
  Controller, MessageToast, Fragment, Spreadsheet,
  JSONModel, Filter, FilterOperator, FilterType
) {
  "use strict";

  function sanitizeFileName(s) {
    return (s || "").replace(/[\\/:*?"<>\|]/g, "_").replace(/\s+/g, " ").trim().substring(0, 80);
  }

  // ===== Table IDs (Summary & Details) =====
  const CLAIM_SUM_TABLE_ID = "analyticsclaimsumtabGrid"; // Claim Summary
  const REQ_SUM_TABLE_ID = "analyticsreqsumtab";       // Request Summary
  const CLAIM_DET_TABLE_ID = "analyticsclaimtabGrid";    // Claim Details
  const REQ_DET_TABLE_ID = "analyticsreqtab";          // Request Details

  return Controller.extend("claima.controller.analytics", {
    onInit: function () {
      this._oSessionModel = this.getOwnerComponent().getModel("session");
    },
    /* ===========================================================
     *  NAVIGATION + DIALOG
     * =========================================================== */
    onOpenAnalytics: function (oEvent) {
      let sTarget = oEvent.getSource().data("target");
      if (!sTarget) {
        const aCD = oEvent.getSource().getCustomData?.() || [];
        const oCD = aCD.find(d => d.getKey?.() === "target");
        sTarget = oCD?.getValue();
      }

      console.log("[Analytics] onOpenAnalytics: source id =", oEvent.getSource().getId(), "target =", sTarget);

      if (!sTarget) {
        MessageToast.show("Configuration error: missing target.");
        return;
      }

      this._analyticsTarget = sTarget;

      const flags = this.getVisibilityForTarget(sTarget);
      flags.showTripDates = true;
      flags.tripDatesRequired = true;

      this._oAnalyticsVM = this._oAnalyticsVM || new JSONModel();
      this._oAnalyticsVM.setData(flags);
      this.getView().setModel(this._oAnalyticsVM, "anaVM");

      this._openFragment("claima.fragment.analyticsdialog");
    },

    getVisibilityForTarget: function (sTarget) {
      switch (sTarget) {
        case "analyticsClaimReportSummary":
        case "analyticsClaimReportDetails":
          return { showRequestType: false, showClaimCategory: true };
        case "preApprovedSummary":
        case "preApprovedDetails":
          return { showRequestType: true, showClaimCategory: false };
        default:
          return { showRequestType: true, showClaimCategory: true };
      }
    },

    _openFragment: function (sFragmentPath) {
      this._mDialogs ??= {};

      const afterLoad = (dialog) => {
        this.getView().addDependent(dialog);
        this._mDialogs[sFragmentPath] = dialog;

        // 1) Clear all filter controls
        this._resetAnalyticsDialogControls(dialog);

        // 2) Re-apply Cost Center access (this will enforce non-admin CC)
        this._applyCostCenterAccess(dialog);

        // 3) Open
        dialog.open();
      };

      if (!this._mDialogs[sFragmentPath]) {
        Fragment.load({
          id: this.getView().getId(),
          name: sFragmentPath,
          controller: this
        }).then(afterLoad);
      } else {
        const dlg = this._mDialogs[sFragmentPath];

        // If already loaded, we still do the reset each time before opening
        this._resetAnalyticsDialogControls(dlg);
        this._applyCostCenterAccess(dlg);

        dlg.open();
      }
    },


    //Helper for enable/disable cc
    _applyCostCenterAccess: function () {
      const userCC = this._oSessionModel.getProperty("/costCenters");
      const isAdmin = this.isAdminRole(this._oSessionModel.getProperty("/userType"));
      const ccMCB = this.byId("cc");         // MultiComboBox
      const ccText = this.byId("ccText");    // Text input for non-admins

      if (!ccMCB || !ccText) {
        setTimeout(this._applyCostCenterAccess.bind(this), 0);
        return;
      }

      if (isAdmin) {
        // ADMIN: Show MultiComboBox, hide Text
        ccMCB.setVisible(true);
        ccText.setVisible(false);
        ccMCB.setEditable(true);
        ccMCB.setEnabled(true);

      } else {
        // NON-ADMIN: Show read-only text
        ccMCB.setVisible(false);
        ccText.setVisible(true);

        // Convert array → joined text
        const displayCC = Array.isArray(userCC) ? userCC.join(", ") : userCC;
        ccText.setValue(displayCC);
      }

      // MultiComboBox selection (still needed for admin users)
      const bindItems = ccMCB.getBinding("items");

      const applySelection = () => {
        if (isAdmin) return; // admin selects themselves

        const keys = Array.isArray(userCC) ? userCC : (userCC ? [userCC] : []);
        ccMCB.setSelectedKeys(keys); // invisible but needed for filtering
      };

      if (bindItems) {
        bindItems.attachEventOnce("change", applySelection);
      } else {
        setTimeout(applySelection, 0);
      }
    },

    isAdminRole: function (userType) {
      const adminRoles = ["DTD Admin", "JKEW Admin", "Super Admin"];
      return adminRoles.includes(userType);
    },

    onCloseDialog: function (oEvent) {
      let oCtrl = oEvent.getSource();
      while (oCtrl && !oCtrl.isA("sap.m.Dialog")) oCtrl = oCtrl.getParent();
      oCtrl?.close();
    },

    //Reset Helper to reset Dialog Box;

    /**
 * Reset all filter controls in the analytics dialog.
 * - Clears DatePickers / DateRanges
 * - Clears MultiComboBox selections
 * - Clears Select, MultiInput tokens, Input value states
 * - Preserves CC rule by letting _applyCostCenterAccess() re-apply afterwards
 */
    _resetAnalyticsDialogControls: function (oDialog) {
      if (!oDialog) return;

      // 1) Generic clearing for typical controls living inside the dialog
      const aAll = oDialog.findAggregatedObjects(true, function (o) {
        return o?.isA?.("sap.ui.core.Control");
      }) || [];

      aAll.forEach(oCtrl => {
        // Value state reset (if any)
        if (oCtrl.setValueState) {
          oCtrl.setValueState("None");
          if (oCtrl.setValueStateText) oCtrl.setValueStateText("");
        }

        // MultiComboBox
        if (oCtrl.isA && oCtrl.isA("sap.m.MultiComboBox")) {
          // Do NOT clear Cost Center here; we will handle CC afterward
          if (oCtrl.getId().endsWith("--cc")) return;
          oCtrl.setSelectedKeys([]);
          if (oCtrl.setValue) oCtrl.setValue(""); // clear typed value if any (filter)
        }

        // Select
        if (oCtrl.isA && oCtrl.isA("sap.m.Select")) {
          oCtrl.setSelectedKey("");
        }

        // MultiInput (tokens)
        if (oCtrl.isA && oCtrl.isA("sap.m.MultiInput")) {
          if (oCtrl.removeAllTokens) oCtrl.removeAllTokens();
          if (oCtrl.setValue) oCtrl.setValue("");
        }

        // Input
        if (oCtrl.isA && oCtrl.isA("sap.m.Input")) {
          if (oCtrl.setValue) oCtrl.setValue("");
        }

        // DatePicker
        if (oCtrl.isA && oCtrl.isA("sap.m.DatePicker")) {
          oCtrl.setDateValue(null);
          if (oCtrl.setSecondDateValue) oCtrl.setSecondDateValue(null);
          if (oCtrl.setValue) oCtrl.setValue("");
        }

        // DateRangeSelection (if you use it)
        if (oCtrl.isA && oCtrl.isA("sap.m.DateRangeSelection")) {
          oCtrl.setDateValue(null);
          oCtrl.setSecondDateValue(null);
          if (oCtrl.setValue) oCtrl.setValue("");
        }
      });

      // 2) Explicitly clear your known date fields (IDs from your code)
      const clearDateById = (id) => {
        const c = this.byId(id);
        if (!c) return;
        c.setDateValue?.(null);
        c.setSecondDateValue?.(null);
        c.setValue?.("");
        c.setValueState?.("None");
      };

      [
        "analytics_tripstartdate",
        "analytics_tripenddate",
        "analytics_eventstartdate",
        "analytics_eventenddate",
        "analytics_paydate"
      ].forEach(clearDateById);

      // 3) If Status has Required, clear error and selection
      const statusCtrl = this.byId("status");
      if (statusCtrl) {
        statusCtrl.setValueState?.("None");
        // It's a MultiComboBox in your code → clear selections now
        statusCtrl.setSelectedKeys?.([]);
        statusCtrl.setValue?.("");
      }
    },



    /* ===========================================================
     *  FILTERING (ENTITY‑AWARE)
     * =========================================================== */

    _isRequestTarget: function () {
      return (
        this._analyticsTarget === "preApprovedSummary" ||
        this._analyticsTarget === "preApprovedDetails"
      );
    },
    _isClaimTarget: function () {
      return !this._isRequestTarget();
    },
    _isClaimDetails: function () {
      return this._analyticsTarget === "analyticsClaimReportDetails";
    },
    _isReqDetails: function () {
      return this._analyticsTarget === "preApprovedDetails";
    },

    // ---- Helpers for MultiComboBox filters
    _getKeys: function (id) {
      return this.byId(id)?.getSelectedKeys?.() || [];
    },
    _addOrFilter: function (collector, field, keys) {
      if (!keys || keys.length === 0) return;
      collector.push(new Filter({
        and: false,
        filters: keys.map(k => new Filter(field, FilterOperator.EQ, k))
      }));
    },

    // For Status (when Request expects STATUS (text), Claim expects STATUS_ID (key))
    _getSelectedItemTexts: function (id) {
      const c = this.byId(id);
      return c?.getSelectedItems()?.map(it => (it.getText() || "").trim()) || [];
    },

    _buildFiltersFromDialog: function () {
      const isReq = this._isRequestTarget();
      const isClaim = !isReq;
      const isClaimDet = this._isClaimDetails();
      const isReqDet = this._isReqDetails();

      const get = this.byId.bind(this);
      const a = [];

      // ---- Dates
      const dTripStart = get("analytics_tripstartdate")?.getDateValue();
      const dTripEnd = get("analytics_tripenddate")?.getDateValue();
      if (dTripStart) a.push(new Filter("TRIP_START_DATE", FilterOperator.GE, this._formatDate(dTripStart)));
      if (dTripEnd) a.push(new Filter("TRIP_END_DATE", FilterOperator.LE, this._formatDate(dTripEnd)));

      const dEvStart = get("analytics_eventstartdate")?.getDateValue();
      const dEvEnd = get("analytics_eventenddate")?.getDateValue();
      if (dEvStart) a.push(new Filter("EVENT_START_DATE", FilterOperator.GE, this._formatDate(dEvStart)));
      if (dEvEnd) a.push(new Filter("EVENT_END_DATE", FilterOperator.LE, this._formatDate(dEvEnd)));

      const dPay = get("analytics_paydate")?.getDateValue();
      if (dPay) a.push(new Filter("PAYMENT_DATE", FilterOperator.EQ, this._formatDate(dPay)));

      // ---- Multi-selects

      // Status (entity-aware)
      if (isReq) {
        // Request must filter on STATUS (text)
        const statusTexts = this._getKeys("status");
        if (statusTexts.length) this._addOrFilter(a, "STATUS", statusTexts);
      } else {
        // Claim must filter on STATUS_ID (keys)
        const statusKeys = this._getKeys("status");
        if (statusKeys.length) this._addOrFilter(a, "STATUS_ID", statusKeys);
      }

      // Course Code (Claim only)
      const courseKeys = this._getKeys("Course_code");
      if (isClaim) this._addOrFilter(a, "COURSE_ID", courseKeys);

      // Department (both)
      const deptKeys = this._getKeys("select_department");
      this._addOrFilter(a, "DEP", deptKeys);

      // GL Code (both)
      const glKeys = this._getKeys("glcode");
      this._addOrFilter(a, "GL_ACCOUNT", glKeys);

      // Cost Center rules
      const userCC = this._oSessionModel.getProperty("/costCenters");
      const isAdmin = this.isAdminRole(this._oSessionModel.getProperty("/userType"));

      if (isAdmin) {
        // ADMIN → free selection
        const ccKeys = this._getKeys("cc");
        this._addOrFilter(a, "COST_CENTER", ccKeys);
      } else {
        // NON-ADMIN → force user's own CC
        const enforcedCC = Array.isArray(userCC) ? userCC : [userCC];
        this._addOrFilter(a, "COST_CENTER", enforcedCC);
      }

      // Claim Type (Claim targets only)
      const claimTypeKeys = this._getKeys("claim_type");
      if (isClaim) this._addOrFilter(a, "CLAIM_TYPE_ID", claimTypeKeys);

      // Claim Item (Claim DETAILS only)
      const claimItemKeys = this._getKeys("claim_item");
      if (isClaimDet) this._addOrFilter(a, "CLAIM_TYPE_ITEM_ID", claimItemKeys);

      // Location (both)
      const locKeys = this._getKeys("location");
      this._addOrFilter(a, "LOCATION", locKeys);

      // Individual / Group (only if backend supports this on the target entity)
      const grpKeys = this._getKeys("grouping");
      this._addOrFilter(a, "IND_OR_GROUP_ID", grpKeys);

      // Employee
      const empKeys = this._getKeys("emp_name");
      this._addOrFilter(a, "EMP_ID", empKeys);

      // Request Type (Request only)
      const reqTypeKeys = this._getKeys("reqtype");
      if (isReq && reqTypeKeys?.length) this._addOrFilter(a, "REQUEST_TYPE_ID", reqTypeKeys);

      // Claim Category (Claim only)
      const claimCatKeys = this._getKeys("claim_cat");
      if (isClaim && claimCatKeys?.length) this._addOrFilter(a, "SUBMISSION_TYPE", claimCatKeys);

      return a;
    },

    // Edm.Date-safe (no UTC shift)
    _formatDate(d) {
      if (!d) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },

    /* ===========================================================
     *  NAVIGATION + TABLE HANDLING
     * =========================================================== */

    onClickCreateRequest_ana: async function (oEvent) {
      // Simple guard: if Status is required in dialog and none selected
      const statusControl = this.byId("status");
      if (statusControl?.getRequired?.()) {
        const sel = statusControl.getSelectedKeys?.() || [];
        if (sel.length === 0) {
          statusControl.setValueState("Error");
          statusControl.setValueStateText("Please choose at least one Status");
          MessageToast.show("Please choose at least one Status");
          return;
        }
        statusControl.setValueState("None");
      }

      this.onCloseDialog(oEvent);

      const aFilters = this._buildFiltersFromDialog();
      const oPage = await this._navToFragmentTarget(this._analyticsTarget);

      if (oPage) {
        this._applyFiltersToCurrentTable(aFilters);
      }
    },

    onClickCancel_ana: async function (oEvent) {
      this.onCloseDialog(oEvent);
    },

    onBackFromAnalyticsClaimReport: function () {
      // Navigate back in the NavContainer history if possible
      const oRoot = this.getOwnerComponent().getRootControl();
      const oNav = oRoot.byId("pageContainer");
      if (oNav && oNav.back) {
        oNav.back();
        return;
      }
    },

    _navToFragmentTarget: async function (sTarget) {
      const map = {
        analyticsClaimReportSummary: "claima.fragment.analyticsclaimreportsummary",
        analyticsClaimReportDetails: "claima.fragment.analyticsclaimreport",
        preApprovedSummary: "claima.fragment.analyticsreqreportsummary",
        preApprovedDetails: "claima.fragment.analyticsreqreport"
      };

      const sFrag = map[sTarget];
      if (!sFrag) return null;

      const oRoot = this.getOwnerComponent().getRootControl();
      const oNav = oRoot.byId("pageContainer");

      this._pages ??= {};
      if (!this._pages[sTarget]) {
        const oPage = await Fragment.load({
          id: oRoot.getId(),
          name: sFrag,
          controller: this
        });

        oPage.setModel(
          this.getOwnerComponent().getModel("employee_view"),
          "employee_view"
        );

        oNav.addPage(oPage);
        this._pages[sTarget] = oPage;
      }

      const oPage = this._pages[sTarget];
      oNav.to(oPage, "slide");

      return oPage;
    },

    _getTargetTableId: function () {
      switch (this._analyticsTarget) {
        case "analyticsClaimReportSummary": return CLAIM_SUM_TABLE_ID;
        case "preApprovedSummary": return REQ_SUM_TABLE_ID;
        case "analyticsClaimReportDetails": return CLAIM_DET_TABLE_ID;
        case "preApprovedDetails": return REQ_DET_TABLE_ID;
        default: return CLAIM_SUM_TABLE_ID;
      }
    },

    _getCurrentGrid: function () {
      const oRoot = this.getOwnerComponent().getRootControl();
      return oRoot.byId(this._getTargetTableId());
    },

    _getCurrentBinding: function () {
      return this._getCurrentGrid()?.getBinding("rows");
    },

    /* ===========================================================
     *  FORMATTERS (V4-safe derived values)
     * =========================================================== */

    // UI formatter for Days Approved (used by XML)
    daysApprovedFormatter: function (sSubmitted, sApproved) {
      const toDateOnlyUTC = (v) => {
        if (!v) return null;
        const d = (v instanceof Date) ? v : new Date(v);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      };
      const d1 = toDateOnlyUTC(sSubmitted);
      const d2 = toDateOnlyUTC(sApproved);
      return (d1 && d2) ? Math.floor((d2 - d1) / 86400000) : null;
    },

    // Helper for export (same logic, plain function)
    _calcDaysApproved: function (sSubmitted, sApproved) {
      const toDateOnlyUTC = (v) => {
        if (!v) return null;
        const d = (v instanceof Date) ? v : new Date(v);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      };
      const d1 = toDateOnlyUTC(sSubmitted);
      const d2 = toDateOnlyUTC(sApproved);
      return (d1 && d2) ? Math.floor((d2 - d1) / 86400000) : null;
    },

    /* ===========================================================
     *  APPLY FILTERS
     * =========================================================== */
    _applyFiltersToCurrentTable: function (aFilters) {
      const oTable = this._getCurrentGrid();
      if (!oTable) return;

      const tryApply = () => {
        const b = this._getCurrentBinding();
        if (b) {
          b.filter(aFilters, FilterType.Application);
          return true;
        }
        return false;
      };

      if (tryApply()) return;

      const onRowsUpdated = () => {
        if (tryApply()) {
          oTable.detachRowsUpdated(onRowsUpdated);
        }
      };
      oTable.attachRowsUpdated(onRowsUpdated);

      setTimeout(() => tryApply(), 0);
    },

    /* ===========================================================
     *  EXPORT
     * =========================================================== */
    onExportAnalyticsReport: function () {
      this._openExportPrompt();
    },


    _getReportBaseName: function () {
      const map = {
        analyticsClaimReportSummary: "Claim Summary",
        analyticsClaimReportDetails: "Claim Details",
        preApprovedSummary: "Pre-Approval Summary",
        preApprovedDetails: "Pre-Approval Details"
      };
      return map[this._analyticsTarget] || "Report";
    },

    _getTodayString: function () {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    },

    _openExportPrompt: function () {

      const defaultName = sanitizeFileName(
        `${this._getReportBaseName()} ${this._getTodayString()}.xlsx`
      );

      if (this._dlgExport) {
        this._dlgExport.getContent()[0].setValue(defaultName);
        this._dlgExport.open();
        return;
      }

      const oInput = new sap.m.Input({
        value: defaultName,
        width: "100%",
        liveChange: function (e) {
          let v = e.getParameter("value");
          // Sanitize filename live
          v = v.replace(/[\\/:*?"<>|]/g, "_").trim();
          e.getSource().setValue(v);
        }
      });

      this._dlgExport = new sap.m.Dialog({
        title: "Export Report",
        contentWidth: "30rem",
        content: [oInput],

        beginButton: new sap.m.Button({
          text: "Download",
          type: "Emphasized",
          press: () => {
            const enteredName = oInput.getValue().trim();
            const fileName = enteredName || defaultName;
            this._dlgExport.close();
            this._runExportWithFileName(fileName);
          }
        }),

        endButton: new sap.m.Button({
          text: "Cancel",
          press: () => this._dlgExport.close()
        })
      });

      this.getView().addDependent(this._dlgExport);
      this._dlgExport.open();
    },

    _runExportWithFileName: async function (fileName) {
      const b = this._getCurrentBinding();
      if (!b) return MessageToast.show("Table not ready.");

      const oView = this.getView();
      oView.setBusy(true);

      try {
        const len = b.getLength();
        const rowsRaw = [];

        for (let i = 0; i < len; i += 1000) {
          const ctx = await b.requestContexts(i, Math.min(1000, len - i));
          ctx.forEach(c => rowsRaw.push(c.getObject()));
        }

        // Build derived rows (add DAYS_APPROVED)
        const rows = rowsRaw.map(o => ({
          ...o,
          DAYS_APPROVED: this._calcDaysApproved?.(o.SUBMITTED_DATE, o.LAST_APPROVED_DATE)
        }));

        const cols = this._getExportColumnsForTarget();

        const sheet = new Spreadsheet({
          workbook: {
            columns: cols,
            context: {
              sheetName: "sheet1"
            }
          },
          dataSource: rows,
          fileName: sanitizeFileName(fileName)
        });

        await sheet.build();
        sheet.destroy();

      } finally {
        oView.setBusy(false);
      }
    },

    _getExportColumnsForTarget: function () {
      // ===== Request SUMMARY =====
      //{ label: Utility.getText("label_claimdetails_input_depedent_or_anggota"), property: "dependent_type", field: "select_claimdetails_input_depedent_or_anggota", width: 30 },
      if (this._analyticsTarget === "preApprovedSummary") {
        return [
          { label: Utility.getText("employee_name"), property: "NAME", width: 20 },
          { label: Utility.getText("personal_grade"), property: "GRADE", width: 20 },
          { label: Utility.getText("department_id"), property: "DEP", width: 20 },
          { label: Utility.getText("department_name"), property: "DEPARTMENT_DESC", width: 20 },
          { label: Utility.getText("unit"), property: "UNIT_SECTION", width: 20 },
          { label: Utility.getText("position"), property: "POSITION_NAME", width: 20 },
          { label: Utility.getText("employee_id"), property: "EMP_ID", width: 12 },
          { label: Utility.getText("req_rtype"), property: "REQUEST_TYPE_DESC", width: 16 },
          { label: Utility.getText("preappreq_id"), property: "REQUEST_ID", width: 14 },
          { label: Utility.getText("preappreq_date"), property: "REQUEST_DATE", width: 14 },
          { label: Utility.getText("submitted_date"), property: "SUBMITTED_DATE", width: 14 },
          { label: Utility.getText("approval1"), property: "APPROVER1", width: 20 },
          { label: Utility.getText("approval2"), property: "APPROVER2", width: 20 },
          { label: Utility.getText("approval3"), property: "APPROVER3", width: 20 },
          { label: Utility.getText("approval4"), property: "APPROVER4", width: 20 },
          { label: Utility.getText("approval5"), property: "APPROVER5", width: 20 },
          { label: Utility.getText("final_app_date"), property: "LAST_APPROVED_DATE", width: 14 },
          { label: Utility.getText("last_send_date"), property: "LAST_SEND_BACK_DATE", width: 14 },
          { label: Utility.getText("days_approved"), property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
          { label: Utility.getText("cash_adv_recei_date"), property: "CASH_ADVANCE_DATE", width: 14 },
          { label: Utility.getText("payment_date"), property: "PAYMENT_DATE", width: 14 },
          { label: Utility.getText("pre_app_status"), property: "STATUS", width: 14 },
          { label: Utility.getText("cc_code"), property: "COST_CENTER", width: 12 },
          { label: Utility.getText("cc_desc"), property: "COST_CENTER_DESC", width: 12 },
          { label: Utility.getText("alt_cc_code"), property: "ALTERNATE_COST_CENTER", width: 12 },
          { label: Utility.getText("alt_cc_desc"), property: "ALT_COST_CENTER_DESC", width: 12 },
          { label: Utility.getText("gl_acct"), property: "GL_ACCOUNT", width: 12 },
          { label: Utility.getText("total_req_amt"), property: "TOTAL_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("cash_advance"), property: "CASH_ADVANCE", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("purpose"), property: "OBJECTIVE_PURPOSE", width: 24 },
          { label: Utility.getText("remarkonly"), property: "REMARK", width: 24 },
          { label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "TRIP_START_DATE", width: 14 },
          { label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "TRIP_END_DATE", width: 14 },
          { label: Utility.getText("label_claimsummary_claimheader_eventstartdate"), property: "EVENT_START_DATE", width: 14 },
          { label: Utility.getText("label_claimsummary_claimheader_eventenddate"), property: "EVENT_END_DATE", width: 14 },
          { label: Utility.getText("location"), property: "LOCATION", width: 40 },
          { label: Utility.getText("req_transport"), property: "TYPE_OF_TRANSPORTATION", width: 40 }
        ];
      }

      // ===== Claim SUMMARY =====
      if (this._analyticsTarget === "analyticsClaimReportSummary") {
        return [
          { label: Utility.getText("employee_name"), property: "NAME", width: 20 },
          { label: Utility.getText("personal_grade"), property: "GRADE", width: 20 },
          { label: Utility.getText("department_id"), property: "DEP", width: 20 },
          { label: Utility.getText("department_name"), property: "DEPARTMENT_DESC", width: 20 },
          { label: Utility.getText("unit"), property: "UNIT_SECTION", width: 20 },
          { label: Utility.getText("position"), property: "POSITION_NAME", width: 20 },
          { label: Utility.getText("employee_id"), property: "EMP_ID", width: 12 },
          { label: Utility.getText("claim_type"), property: "CLAIM_TYPE_DESC", width: 16 },
          { label: Utility.getText("claim_id"), property: "CLAIM_ID", width: 12 },
          { label: Utility.getText("preappreq_id"), property: "REQUEST_ID", width: 14 },
          { label: Utility.getText("preappreq_date"), property: "REQUEST_DATE", width: 14 },
          { label: Utility.getText("submitted_type"), property: "SUBMISSION_TYPE_DESC", width: 12 },
          { label: Utility.getText("submitted_date"), property: "SUBMITTED_DATE", width: 14 },
          { label: Utility.getText("approval1"), property: "APPROVER1", width: 20 },
          { label: Utility.getText("approval2"), property: "APPROVER2", width: 20 },
          { label: Utility.getText("approval3"), property: "APPROVER3", width: 20 },
          { label: Utility.getText("approval4"), property: "APPROVER4", width: 20 },
          { label: Utility.getText("approval5"), property: "APPROVER5", width: 20 },
          { label: Utility.getText("final_app_date"), property: "LAST_APPROVED_DATE", width: 14 },
          { label: Utility.getText("last_send_date"), property: "LAST_SEND_BACK_DATE", width: 14 },
          { label: Utility.getText("days_approved"), property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
          { label: Utility.getText("cash_adv_recei_date"), property: "CASH_ADVANCE_DATE", width: 14 },
          { label: Utility.getText("payment_date"), property: "PAYMENT_DATE", width: 14 },
          { label: Utility.getText("claim_status"), property: "STATUS_ID", width: 14 },
          { label: Utility.getText("cc_code"), property: "COST_CENTER", width: 12 },
          { label: Utility.getText("cc_desc"), property: "COST_CENTER_DESC", width: 12 },
          { label: Utility.getText("alt_cc_code"), property: "ALTERNATE_COST_CENTER", width: 12 },
          { label: Utility.getText("alt_cc_desc"), property: "ALT_COST_CENTER_DESC", width: 12 },
          { label: Utility.getText("gl_acct"), property: "GL_ACCOUNT", width: 12 },
          { label: Utility.getText("total_claim_amt"), property: "TOTAL_CLAIM_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("cash_adv"), property: "CASH_ADVANCE_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("final_amt"), property: "FINAL_AMOUNT_TO_RECEIVE", type: "number", scale: 2, width: 18 },
          { label: Utility.getText("course_code"), property: "COURSE_ID", width: 12 },
          { label: Utility.getText("course_desc"), property: "COURSE_DESC", width: 12 },
          { label: Utility.getText("course_session"), property: "SESSION_NUMBER", width: 12 },
          { label: Utility.getText("purpose"), property: "PURPOSE", width: 24 },
          { label: Utility.getText("remarkonly"), property: "COMMENT", width: 24 },
          { label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "TRIP_START_DATE", width: 24 },
          { label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "TRIP_END_DATE", width: 14 },
          { label: Utility.getText("location"), property: "LOCATION", width: 40 }

        ];
      }

      // ===== Request DETAILS =====
      if (this._analyticsTarget === "preApprovedDetails") {
        return [
          // Identity
          { label: Utility.getText("employee_name"), property: "NAME", width: 20 },
          { label: Utility.getText("personal_grade"), property: "GRADE", width: 20 },
          { label: Utility.getText("department_id"), property: "DEP", width: 20 },
          { label: Utility.getText("department_name"), property: "DEPARTMENT_DESC", width: 20 },
          { label: Utility.getText("unit"), property: "UNIT_SECTION", width: 20 },
          { label: Utility.getText("position"), property: "POSITION_NAME", width: 20 },
          { label: Utility.getText("employee_id"), property: "EMP_ID", width: 12 },
          { label: Utility.getText("req_rtype"), property: "REQUEST_TYPE_DESC", width: 16 },
          { label: Utility.getText("preappreq_id"), property: "REQUEST_ID", width: 14 },
          { label: Utility.getText("preappreq_sub_id"), property: "REQUEST_SUB_ID", width: 14 },
          { label: Utility.getText("preappreq_date"), property: "REQUEST_DATE", width: 14 },
          { label: Utility.getText("submitted_date"), property: "SUBMITTED_DATE", width: 14 },
          { label: Utility.getText("approval1"), property: "APPROVER1", width: 20 },
          { label: Utility.getText("approval2"), property: "APPROVER2", width: 20 },
          { label: Utility.getText("approval3"), property: "APPROVER3", width: 20 },
          { label: Utility.getText("approval4"), property: "APPROVER4", width: 20 },
          { label: Utility.getText("approval5"), property: "APPROVER5", width: 20 },
          { label: Utility.getText("final_app_date"), property: "LAST_APPROVED_DATE", width: 14 },
          { label: Utility.getText("last_send_date"), property: "LAST_SEND_BACK_DATE", width: 14 },
          { label: Utility.getText("days_approved"), property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
          { label: Utility.getText("cash_adv_recei_date"), property: "CASH_ADVANCE_DATE", width: 14 },
          { label: Utility.getText("payment_date"), property: "PAYMENT_DATE", width: 14 },
          { label: Utility.getText("pre_app_status"), property: "STATUS", width: 14 },
          { label: Utility.getText("cc_code"), property: "COST_CENTER", width: 12 },
          { label: Utility.getText("cc_desc"), property: "COST_CENTER_DESC", width: 12 },
          { label: Utility.getText("alt_cc_code"), property: "ALTERNATE_COST_CENTER", width: 12 },
          { label: Utility.getText("alt_cc_desc"), property: "ALT_COST_CENTER_DESC", width: 12 },
          { label: Utility.getText("gl_acct"), property: "GL_ACCOUNT", width: 12 },
          { label: Utility.getText("code_mat"), property: "MATERIAL_CODE", width: 12 },
          { label: Utility.getText("total_req_amt"), property: "TOTAL_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("cash_advance"), property: "CASH_ADVANCE", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("purpose"), property: "OBJECTIVE_PURPOSE", width: 24 },
          { label: Utility.getText("remarkonly"), property: "REMARK", width: 24 },
          { label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "TRIP_START_DATE", width: 14 },
          { label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "TRIP_END_DATE", width: 14 },
          { label: Utility.getText("label_claiminput_eventstartdate"), property: "EVENT_START_DATE", width: 14 },
          { label: Utility.getText("label_claiminput_eventenddate"), property: "EVENT_END_DATE", width: 14 },
          { label: Utility.getText("location"), property: "LOCATION", width: 40 },
          { label: Utility.getText("req_transport"), property: "TYPE_OF_TRANSPORTATION", width: 40 },
          { label: Utility.getText("claim_item"), property: "CLAIM_TYPE_ITEM_ID", width: 40 },
          { label: Utility.getText("estimated_amt"), property: "EST_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("estparticipant"), property: "EST_NO_PARTICIPANT", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("cash_advance"), property: "CASH_ADVANCE", type: "number", scale: 2, width: 16 },
          { label: Utility.getText("start_date"), property: "START_DATE", width: 14 },
          { label: Utility.getText("end_date"), property: "END_DATE", width: 14 },
          { label: Utility.getText("remarkonly"), property: "REMARK", width: 24 },
          { label: Utility.getText("terma"), property: "DECLARE_CLUB_MEMBERSHIP", width: 24 },
          { label: Utility.getText("mewakili"), property: "KWSP_SPORTS_REPRESENTATION", width: 24 },
          { label: Utility.getText("disclaimer2"), property: "SPORTS_CLAIM_DISCLAIMER", width: 24 },
          { label: Utility.getText("vehicle_own"), property: "VEHICLE_TYPE", width: 24 },
          { label: Utility.getText("mod"), property: "MODE_OF_TRANSFER", width: 24 },
          { label: Utility.getText("pindah"), property: "TRANSFER_DATE", width: 14 },
          { label: Utility.getText("num_days"), property: "NO_OF_DAYS", type: "number", scale: 0, width: 16 },
          { label: Utility.getText("marriage_cat"), property: "MARRIAGE_CATEGORY_DESC", width: 24 },
          { label: Utility.getText("num_fam_head"), property: "FAMILY_COUNT", type: "number", scale: 0, width: 16 },
          { label: Utility.getText("total_part"), property: "EST_NO_PARTICIPANT", type: "number", scale: 0, width: 16 },
          { label: Utility.getText("purpose"), property: "PURPOSE", width: 24 },
          { label: Utility.getText("mobile_cat"), property: "MOBILE_CATEGORY_PURPOSE_ID", width: 24 },
          { label: Utility.getText("mobile_cat"), property: "MOBILE_CATEGORY_PURPOSE_DESC", width: 24 },
          { label: Utility.getText("kilometer"), property: "KM", width: 24 },
          { label: Utility.getText("rate_per_km"), property: "RATE_PER_KM", width: 24 },
          { label: Utility.getText("flight_class"), property: "FLIGHT_CLASS_DESC", width: 24 },
          { label: Utility.getText("location"), property: "LOCATION_ITEM", width: 24 },
          { label: Utility.getText("location_type"), property: "LOC_TYPE_DESC", width: 24 },
          { label: Utility.getText("country"), property: "COUNTRY", width: 24 },
          { label: Utility.getText("from_state_id"), property: "FROM_STATE_ID", width: 24 },
          { label: Utility.getText("from_state_desc"), property: "FROM_STATE_DESC", width: 24 },
          { label: Utility.getText("to_state"), property: "TO_STATE_ID", width: 24 },
          { label: Utility.getText("to_state_desc"), property: "TO_STATE_DESC", width: 24 },
          { label: Utility.getText("fromloc"), property: "FROM_LOCATION", width: 24 },
          { label: Utility.getText("fromloc"), property: "FROM_LOCATION_DESC", width: 24 },
          { label: Utility.getText("fromloc_office"), property: "FROM_LOCATION_OFFICE", width: 24 },
          { label: Utility.getText("to_location"), property: "TO_LOCATION", width: 24 },
          { label: Utility.getText("to_location_desc"), property: "TO_LOCATION_DESC", width: 24 },
          { label: Utility.getText("to_location_off"), property: "TO_LOCATION_OFFICE", width: 24 },
          { label: Utility.getText("toll"), property: "TOLL", width: 24 },
          { label: Utility.getText("type_of_vehicle"), property: "VEHICLE_TYPE_DESC", width: 24 },
          { label: Utility.getText("depart_time"), property: "DEPARTURE_TIME", width: 14 },
          { label: Utility.getText("arrival_time"), property: "ARRIVAL_TIME", width: 14 },
          { label: Utility.getText("semenanjung_or_sabah_sarawak"), property: "REGION_DESC", width: 24 },
          { label: Utility.getText("room_type"), property: "ROOM_TYPE", width: 24 },
          { label: Utility.getText("lodging_cat"), property: "LODGING_CATEGORY_DESC", width: 24 },
          { label: Utility.getText("wilayah"), property: "AREA_DESC", width: 24 },
          { label: Utility.getText("start_time"), property: "START_TIME", width: 24 },
          { label: Utility.getText("req_i_end_time"), property: "END_TIME", width: 24 },
          { label: Utility.getText("dependent_name"), property: "DEPENDENT_NAME", width: 24 },
          { label: Utility.getText("meter_cube_ent"), property: "METER_CUBE_ENTITLED", width: 24 },
          { label: Utility.getText("meter_cube_act"), property: "METER_CUBE_ACTUAL", width: 24 },
          { label: Utility.getText("fare_type_id"), property: "FARE_TYPE_ID", width: 24 },
          { label: Utility.getText("fare_type_desc"), property: "FARE_TYPE_DESC", width: 24 },
          { label: Utility.getText("vehicle_class_id"), property: "VEHICLE_CLASS_ID", width: 24 },
        ];
      }

      // ===== Claim DETAILS =====
      return [
        { label: Utility.getText("employee_name"), property: "NAME", width: 20 },
        { label: Utility.getText("personal_grade"), property: "GRADE", width: 20 },
        { label: Utility.getText("department_id"), property: "DEP", width: 20 },
        { label: Utility.getText("department_name"), property: "DEPARTMENT_DESC", width: 20 },
        { label: Utility.getText("unit"), property: "UNIT_SECTION", width: 20 },
        { label: Utility.getText("position"), property: "POSITION_NAME", width: 20 },
        { label: Utility.getText("employee_id"), property: "EMP_ID", width: 12 },
        { label: Utility.getText("claim_id"), property: "CLAIM_ID", width: 14 },
        { label: Utility.getText("claim_sub_id"), property: "CLAIM_SUB_ID", width: 14 },
        { label: Utility.getText("claim_type"), property: "CLAIM_TYPE_DESC", width: 16 },
        { label: Utility.getText("preappreq_id"), property: "REQUEST_ID", width: 14 },
        { label: Utility.getText("preappreq_date"), property: "REQUEST_DATE", width: 14 },
        { label: Utility.getText("submitted_type"), property: "SUBMISSION_TYPE_DESC", width: 12 },
        { label: Utility.getText("submitted_date"), property: "SUBMITTED_DATE", width: 14 },
        { label: Utility.getText("approval1"), property: "APPROVER1", width: 20 },
        { label: Utility.getText("approval2"), property: "APPROVER2", width: 20 },
        { label: Utility.getText("approval3"), property: "APPROVER3", width: 20 },
        { label: Utility.getText("approval4"), property: "APPROVER4", width: 20 },
        { label: Utility.getText("approval5"), property: "APPROVER5", width: 20 },
        { label: Utility.getText("final_app_date"), property: "LAST_APPROVED_DATE", width: 14 },
        { label: Utility.getText("last_send_date"), property: "LAST_SEND_BACK_DATE", width: 14 },
        { label: Utility.getText("days_approved"), property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
        { label: Utility.getText("cash_adv_recei_date"), property: "CASH_ADVANCE_DATE", width: 14 },
        { label: Utility.getText("payment_date"), property: "PAYMENT_DATE", width: 14 },
        { label: Utility.getText("claim_status"), property: "STATUS_ID", width: 14 },
        { label: Utility.getText("cc_code"), property: "COST_CENTER", width: 12 },
        { label: Utility.getText("cc_desc"), property: "COST_CENTER_DESC", width: 12 },
        { label: Utility.getText("alt_cc_code"), property: "ALTERNATE_COST_CENTER", width: 12 },
        { label: Utility.getText("alt_cc_desc"), property: "ALT_COST_CENTER_DESC", width: 12 },
        { label: Utility.getText("gl_acct"), property: "GL_ACCOUNT", width: 12 },
        { label: Utility.getText("code_mat"), property: "MATERIAL_CODE", width: 12 },
        { label: Utility.getText("total_claim_amt"), property: "TOTAL_CLAIM_AMOUNT", type: "number", scale: 2, width: 16 },
        { label: Utility.getText("cash_adv"), property: "CASH_ADVANCE_AMOUNT", type: "number", scale: 2, width: 16 },
        { label: Utility.getText("final_amt_receive"), property: "FINAL_AMOUNT_TO_RECEIVE", type: "number", scale: 2, width: 18 },
        { label: Utility.getText("course_code"), property: "COURSE_ID", width: 12 },
        { label: Utility.getText("course_desc"), property: "COURSE_DESC", width: 12 },
        { label: Utility.getText("course_session"), property: "SESSION_NUMBER", width: 12 },
        { label: Utility.getText("purpose"), property: "PURPOSE", width: 24 },
        { label: Utility.getText("remarkonly"), property: "REMARK", width: 24 },
        { label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "TRIP_START_DATE", width: 14 },
        { label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "TRIP_END_DATE", width: 14 },
        { label: Utility.getText("location"), property: "LOCATION", width: 40 },
        { label: Utility.getText("compensation"), property: "PERCENTAGE_COMPENSATION", width: 14 },
        { label: Utility.getText("acct_no"), property: "ACCOUNT_NO", width: 14 },
        { label: Utility.getText("amount"), property: "AMOUNT", width: 14 },
        { label: Utility.getText("bill_date"), property: "BILL_DATE", width: 14 },
        { label: Utility.getText("bill_no"), property: "BILL_NO", width: 14 },
        { label: Utility.getText("category"), property: "CLAIM_CATEGORY", width: 14 },
        { label: Utility.getText("claim_type"), property: "CLAIM_TYPE_DESC", width: 18 },
        { label: Utility.getText("claim_type_item"), property: "CLAIM_TYPE_ITEM_DESC", width: 20 },
        { label: Utility.getText("country"), property: "COUNTRY", width: 14 },
        { label: Utility.getText("disclaimer"), property: "DISCLAIMER", width: 14 },
        { label: Utility.getText("end_date"), property: "END_DATE", width: 14 },
        { label: Utility.getText("end_time"), property: "END_TIME", width: 14 },
        { label: Utility.getText("flight_class"), property: "FLIGHT_CLASS_DESC", width: 14 },
        { label: Utility.getText("from_location"), property: "FROM_LOCATION", width: 14 },
        { label: Utility.getText("from_location_location_off"), property: "FROM_LOCATION_OFFICE", width: 14 },
        { label: Utility.getText("kilometer"), property: "KM", width: 14 },
        { label: Utility.getText("location"), property: "LOCATION_ITEM", width: 14 },
        { label: Utility.getText("location_type"), property: "LOC_TYPE_DESC", width: 14 },
        { label: Utility.getText("lodging_add"), property: "LODGING_ADDRESS", width: 14 },
        { label: Utility.getText("lodging_cat"), property: "LODGING_CATEGORY_DESC", width: 14 },
        { label: Utility.getText("marriage"), property: "MARRIAGE_CATEGORY_DESC", width: 14 },
        { label: Utility.getText("wilayah"), property: "AREA_DESC", width: 14 },
        { label: Utility.getText("num_fm"), property: "NO_OF_FAMILY_MEMBER", type: "number", scale: 0, width: 16 },
        { label: Utility.getText("parking"), property: "PARKING", width: 14 },
        { label: Utility.getText("phone"), property: "PHONE_NO", width: 14 },
        { label: Utility.getText("rate_per_km"), property: "RATE_PER_KM", width: 14 },
        { label: Utility.getText("receipt_date"), property: "RECEIPT_DATE", width: 14 },
        { label: Utility.getText("receipt_num"), property: "RECEIPT_NUMBER", width: 14 },
        { label: Utility.getText("remark"), property: "REMARK", width: 14 },
        { label: Utility.getText("room_type"), property: "ROOM_TYPE", width: 14 },
        { label: Utility.getText("semenanjung_or_sabah_sarawak"), property: "REGION", width: 14 },
        { label: Utility.getText("start_date"), property: "START_DATE", width: 14 },
        { label: Utility.getText("start_time"), property: "START_TIME", width: 14 },
        { label: Utility.getText("state"), property: "FROM_STATE_ID", width: 14 },
        { label: Utility.getText("to_loc"), property: "TO_LOCATION", width: 14 },
        { label: Utility.getText("to_loc_off"), property: "TO_LOCATION_OFFICE", width: 14 },
        { label: Utility.getText("toll"), property: "TOLL", width: 14 },
        { label: Utility.getText("total_expenses_amount"), property: "TOTAL_EXP_AMOUNT", type: "number", scale: 2, width: 16 },
        { label: Utility.getText("type_of_vehicle"), property: "VEHICLE_TYPE_DESC", width: 14 },
        { label: Utility.getText("vehicle"), property: "VEHICLE_FARE", width: 14 },
        { label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "TRIP_START_DATE", width: 14 },
        { label: Utility.getText("trip_start_time"), property: "TRIP_START_TIME", width: 14 },
        { label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "TRIP_END_DATE", width: 14 },
        { label: Utility.getText("trip_end_time"), property: "TRIP_END_TIME", width: 14 },
        { label: Utility.getText("travel_duration_days"), property: "TRAVEL_DURATION_DAY", width: 14 },
        { label: Utility.getText("travel_duration_hrs"), property: "TRAVEL_DURATION_HOUR", width: 14 },
        { label: Utility.getText("provided_breakfast"), property: "PROVIDED_BREAKFAST", width: 14 },
        { label: Utility.getText("provided_lunch"), property: "PROVIDED_LUNCH", width: 14 },
        { label: Utility.getText("provided_dinner"), property: "PROVIDED_DINNER", width: 14 },
        { label: Utility.getText("entitled_breakfast"), property: "ENTITLED_BREAKFAST", width: 14 },
        { label: Utility.getText("entitled_lunch"), property: "ENTITLED_LUNCH", width: 14 },
        { label: Utility.getText("entitled_dinner"), property: "ENTITLED_DINNER", width: 14 },
        { label: Utility.getText("anggota_id"), property: "ANGGOTA_ID", width: 14 },
        { label: Utility.getText("anggota_name"), property: "ANGGOTA_NAME", width: 14 },
        { label: Utility.getText("dependent"), property: "DEPENDENT", width: 14 },
        { label: Utility.getText("dependent_name"), property: "DEPENDENT_NAME", width: 14 },
        { label: Utility.getText("roundtrip"), property: "ROUND_TRIP", width: 14 },
        { label: Utility.getText("type_of_prof_body"), property: "TYPE_OF_PROFESSIONAL_BODY", width: 14 },
        { label: Utility.getText("disclaimer_galakan"), property: "disclaimer_galakan", width: 14 },
        { label: Utility.getText("vehicle_own_id"), property: "VEHICLE_OWNERSHIP_ID", width: 14 },
        { label: Utility.getText("vehicle_own_desc"), property: "VEHICLE_OWNERSHIP_DESC", width: 14 },
        { label: Utility.getText("mode_of_transfer"), property: "MODE_OF_TRANSFER", width: 14 },
        { label: Utility.getText("mode_of_transfer_desc"), property: "TRANSFER_MODE_DESC", width: 14 },
        { label: Utility.getText("transfer_date"), property: "TRANSFER_DATE", width: 14 },
        { label: Utility.getText("num_days"), property: "NO_OF_DAYS", type: "number", scale: 2, width: 14 },
        { label: Utility.getText("num_fam_head"), property: "FAMILY_COUNT", type: "number", scale: 2, width: 14 },
        { label: Utility.getText("funeral_transport"), property: "FUNERAL_TRANSPORTATION", width: 14 },
        { label: Utility.getText("course_title"), property: "COURSE_TITLE", width: 14 },
        { label: Utility.getText("mobile_cat"), property: "MOBILE_CATEGORY_PURPOSE_ID", width: 14 },
        { label: Utility.getText("mobile_cat_desc"), property: "MOBILE_CATEGORY_PURPOSE_DESC", width: 14 },
        { label: Utility.getText("level_studies_id"), property: "STUDY_LEVELS_ID", width: 14 },
        { label: Utility.getText("level_studies_desc"), property: "STUDY_LEVELS_DESC", width: 14 },
        { label: Utility.getText("actual_amount"), property: "ACTUAL_AMOUNT", type: "number", scale: 2, width: 14 },
        { label: Utility.getText("fare_type_id"), property: "FARE_TYPE_ID", width: 14 },
        { label: Utility.getText("fare_type_desc"), property: "FARE_TYPE_DESC", width: 14 },
        { label: Utility.getText("vehicle_class_id"), property: "VEHICLE_CLASS_ID", width: 14 },
        { label: Utility.getText("vehicle_class_desc"), property: "VEHICLE_CLASS_DESC", width: 14 },
        { label: Utility.getText("need_foreign_cur"), property: "NEED_FOREIGN_CURRENCY", width: 14 },
        { label: Utility.getText("currency_code"), property: "CURRENCY_CODE", width: 14 },
        { label: Utility.getText("currency_code_descr"), property: "CURRENCY_DESC", width: 14 },
        { label: Utility.getText("currency_rate"), property: "CURRENCY_RATE", width: 14 },
        { label: Utility.getText("currency_amount"), property: "CURRENCY_AMOUNT", type: "number", scale: 2, width: 14 },
        { label: Utility.getText("req_approve_amount"), property: "REQUEST_APPROVAL_AMOUNT", width: 14 },
        { label: Utility.getText("depart_time"), property: "DEPARTURE_TIME", width: 14 },
        { label: Utility.getText("arrival_time"), property: "ARRIVAL_TIME", width: 14 },
        { label: Utility.getText("policy_num"), property: "POLICY_NUMBER", width: 14 },
        { label: Utility.getText("insurance_provider_id"), property: "INSURANCE_PROVIDER_ID", width: 14 },
        { label: Utility.getText("insurance_provider_desc"), property: "INSURANCE_PROVIDER_DESC", width: 14 },
        { label: Utility.getText("insurance_package_id"), property: "INSURANCE_PACKAGE_ID", width: 14 },
        { label: Utility.getText("insurance_package_desc"), property: "ZINSURANCE_PACKAGE_DESC", width: 14 },
        { label: Utility.getText("insurance_purch_date"), property: "INSURANCE_PURCHASE_DATE", width: 14 },
        { label: Utility.getText("insurance_cert_start"), property: "INSURANCE_CERT_START_DATE", width: 14 },
        { label: Utility.getText("insurance_cert_end"), property: "INSURANCE_CERT_END_DATE", width: 14 },
        { label: Utility.getText("days_category"), property: "TRAVEL_DAYS_ID", width: 14 },
        { label: Utility.getText("meter_cube_ent"), property: "METER_CUBE_ENTITLED", width: 14 },
        { label: Utility.getText("meter_cube_act"), property: "METER_CUBE_ACTUAL", width: 14 },
      ];
    },
  });
});