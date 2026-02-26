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

  // ===== Entity roots (for reference only) =====
  const ENTITY_CLAIM_SUM = "/ZEMP_CLAIM_REPORT_SUMMARY";
  const ENTITY_REQ_SUM = "/ZEMP_REQUEST_REPORT_SUMMARY";
  const ENTITY_CLAIM_DET = "/ZEMP_CLAIM_REPORT_DETAILS";
  const ENTITY_REQ_DET = "/ZEMP_REQUEST_REPORT_DETAILS";

  return Controller.extend("claima.controller.analytics", {

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
      if (!this._mDialogs[sFragmentPath]) {
        Fragment.load({
          id: this.getView().getId(),
          name: sFragmentPath,
          controller: this
        }).then(d => {
          this.getView().addDependent(d);
          this._mDialogs[sFragmentPath] = d;
          d.open();
        });
      } else {
        this._mDialogs[sFragmentPath].open();
      }
    },

    onCloseDialog: function (oEvent) {
      let oCtrl = oEvent.getSource();
      while (oCtrl && !oCtrl.isA("sap.m.Dialog")) oCtrl = oCtrl.getParent();
      oCtrl?.close();
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
        const statusTexts = this._getSelectedItemTexts("status");
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

      // Cost Center (both)
      const ccKeys = this._getKeys("cc");
      this._addOrFilter(a, "COST_CENTER", ccKeys);

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

      

      // Fallback: if no back history, route to a known start page if you have one
      // Example if you keep a landing page cached:
      // const oStart = oRoot.byId("analyticsLandingPage");
      // if (oStart) { oNav.to(oStart, "slide"); }
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

      // In OData V4 we DON'T need dataReceived for Days Approved; it's computed via formatter.
      // setTimeout(() => this._attachCalculatedFields(), 300); // ← no longer needed

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

        const sheet = new sap.ui.export.Spreadsheet({
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
      if (this._analyticsTarget === "preApprovedSummary") {
        return [
          { label: "Employee Name", property: "NAME", width: 20 },
          { label: "Personal Grade", property: "GRADE", width: 20 },
          { label: "SF Department/Branch ID", property: "DEP", width: 20 },
          { label: "SF Department/Branch Name", property: "DEPARTMENT_DESC", width: 20 },
          { label: "Unit/Seksyen", property: "UNIT_SECTION", width: 20 },
          { label: "Position Name", property: "POSITION_NAME", width: 20 },
          { label: "Employee ID", property: "EMP_ID", width: 12 },
          { label: "Request Type", property: "REQUEST_TYPE_DESC", width: 16 },
          { label: "Pre-Approval Request ID", property: "REQUEST_ID", width: 14 },
          { label: "Pre-Approval Request Date", property: "REQUEST_DATE", width: 14 },
          { label: "Submitted Date", property: "SUBMITTED_DATE", type: "date", width: 14 },
          { label: "Approval 1", property: "APPROVER1", width: 20 },
          { label: "Approval 2", property: "APPROVER2", width: 20 },
          { label: "Approval 3", property: "APPROVER3", width: 20 },
          { label: "Approval 4", property: "APPROVER4", width: 20 },
          { label: "Approval 5", property: "APPROVER5", width: 20 },
          { label: "Final Approved Date", property: "LAST_APPROVED_DATE", type: "date", width: 14 },
          { label: "Last Send Back Date", property: "LAST_SEND_BACK_DATE", type: "date", width: 14 },
          { label: "DAY(S) APPROVED", property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
          { label: "Cash Advance Received Date", property: "CASH_ADVANCE_DATE", type: "date", width: 14 },
          { label: "Payment Date", property: "PAYMENT_DATE", type: "date", width: 14 },
          { label: "Pre-Approval Request  Status", property: "STATUS", width: 14 },
          { label: "Cost Center", property: "COST_CENTER", width: 12 },
          { label: "Cost Center Text", property: "COST_CENTER_DESC", width: 12 },
          { label: "Alternate Cost Center Code", property: "ALTERNATE_COST_CENTRE", width: 12 },
          { label: "Alternate Cost Center Text", property: "ALT_COST_CENTER_DESC", width: 12 },
          { label: "GL No (Claim Item)", property: "GL_ACCOUNT", width: 12 },
          { label: "Code Material (Claim Item)", property: "MATERIAL_CODE", width: 12 },
          { label: "Total Request Amount", property: "TOTAL_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: "Cash Advance", property: "CASH_ADVANCE", type: "number", scale: 2, width: 16 },
          { label: "Purpose", property: "OBJECTIVE_PURPOSE", width: 24 },
          { label: "Remarks", property: "REMARK", width: 24 },
          { label: "Trip Start Date", property: "TRIP_START_DATE", type: "date", width: 14 },
          { label: "Trip End Date", property: "TRIP_END_DATE", type: "date", width: 14 },
          { label: "Event Start Date", property: "EVENT_START_DATE", type: "date", width: 14 },
          { label: "Event End Date", property: "EVENT_END_DATE", type: "date", width: 14 },
          { label: "Location", property: "LOCATION", width: 40 },
          { label: "Type of Transportation", property: "TYPE_OF_TRANSPORTATION", width: 40 }
        ];
      }

      // ===== Claim SUMMARY =====
      if (this._analyticsTarget === "analyticsClaimReportSummary") {
        return [
          { label: "Employee Name", property: "NAME", width: 20 },
          { label: "Personal Grade", property: "GRADE", width: 20 },
          { label: "SF Department/Branch ID", property: "DEP", width: 20 },
          { label: "SF Department/Branch Name", property: "DEPARTMENT_DESC", width: 20 },
          { label: "Unit/Seksyen", property: "UNIT_SECTION", width: 20 },
          { label: "Position Name", property: "POSITION_NAME", width: 20 },
          { label: "Employee ID", property: "EMP_ID", width: 12 },
          { label: "Claim Type", property: "CLAIM_TYPE_DESC", width: 16 },
          { label: "Claim ID", property: "CLAIM_ID", width: 12 },
          { label: "Pre-Approval Request ID", property: "REQUEST_ID", width: 14 },
          { label: "Pre-Approval Request Date", property: "REQUEST_DATE", width: 14 },
          { label: "Submission Type", property: "SUBMISSION_TYPE_DESC", width: 12 },
          { label: "Submitted Date", property: "", type: "date", width: 14 },
          { label: "Approval 1", property: "APPROVER1", width: 20 },
          { label: "Approval 2", property: "APPROVER2", width: 20 },
          { label: "Approval 3", property: "APPROVER3", width: 20 },
          { label: "Approval 4", property: "APPROVER4", width: 20 },
          { label: "Approval 5", property: "APPROVER5", width: 20 },
          { label: "Final Approved Date", property: "LAST_APPROVED_DATE", type: "date", width: 14 },
          { label: "Last Send Back Date", property: "", type: "date", width: 14 },
          { label: "DAY(S) APPROVED", property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
          { label: "Cash Advance Received Date", property: "CASH_ADVANCE_DATE", type: "date", width: 14 },
          { label: "Payment Date", property: "PAYMENT_DATE", width: 14 },
          { label: "Claim Status", property: "STATUS_ID", width: 14 },
          { label: "Cost Center", property: "COST_CENTER", width: 12 },
          { label: "Cost Center Text", property: "COST_CENTER_DESC", width: 12 },
          { label: "Alternate Cost Center Code", property: "ALTERNATE_COST_CENTRE", width: 12 },
          { label: "Alternate Cost Center Text", property: "ALT_COST_CENTER_DESC", width: 12 },
          { label: "GL No (Claim Item)", property: "GL_ACCOUNT", width: 12 },
          { label: "Code Material (Claim Item)", property: "MATERIAL_CODE", width: 12 },
          { label: "Total Claim Amt", property: "TOTAL_CLAIM_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: "Cash Advance", property: "CASH_ADVANCE_AMOUT", type: "number", scale: 2, width: 16 },
          { label: "Final Amount", property: "FINAL_AMOUNT_RECEIVE", type: "number", scale: 2, width: 18 },
          { label: "Course Code", property: "COURSE_ID", width: 12 },
          { label: "Course Code", property: "COURSE_DESC", width: 12 },
          { label: "Course Session", property: "COURSE_DESC", width: 12 },
          { label: "Purpose", property: "PURPOSE", width: 24 },
          { label: "Remarks", property: "REMARK", width: 24 },
          { label: "Trip Start Date", property: "TRIP_START_DATE", width: 24 },
          { label: "Trip End Date", property: "TRIP_END_DATE", width: 14 },
          { label: "Location", property: "LOCATION", width: 40 }
        ];
      }

      // ===== Request DETAILS =====
      if (this._analyticsTarget === "preApprovedDetails") {
        return [
          // Identity
          { label: "Employee Name", property: "NAME", width: 20 },
          { label: "Personal Grade", property: "GRADE", width: 20 },
          { label: "SF Department/Branch ID", property: "DEP", width: 20 },
          { label: "SF Department/Branch Name", property: "DEPARTMENT_DESC", width: 20 },
          { label: "Unit/Seksyen", property: "UNIT_SECTION", width: 20 },
          { label: "Position Name", property: "POSITION_NAME", width: 20 },
          { label: "Employee ID", property: "EMP_ID", width: 12 },
          { label: "Request Type", property: "REQUEST_TYPE_DESC", width: 16 },
          { label: "Pre-Approval Request ID", property: "REQUEST_ID", width: 14 },
          { label: "Pre-Approval Request Sub ID", property: "REQUEST_SUB_ID", width: 14 },
          { label: "Pre-Approval Request Date", property: "REQUEST_DATE", width: 14 },
          { label: "Submitted Date", property: "SUBMITTED_DATE", type: "date", width: 14 },
          { label: "Approval 1", property: "APPROVER1", width: 20 },
          { label: "Approval 2", property: "APPROVER2", width: 20 },
          { label: "Approval 3", property: "APPROVER3", width: 20 },
          { label: "Approval 4", property: "APPROVER4", width: 20 },
          { label: "Approval 5", property: "APPROVER5", width: 20 },
          { label: "Final Approved Date", property: "LAST_APPROVED_DATE", type: "date", width: 14 },
          { label: "Last Send Back Date", property: "LAST_SEND_BACK_DATE", type: "date", width: 14 },
          { label: "DAY(S) APPROVED", property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
          { label: "Cash Advance Received Date", property: "CASH_ADVANCE_DATE", type: "date", width: 14 },
          { label: "Payment Date", property: "PAYMENT_DATE", type: "date", width: 14 },
          { label: "Pre-Approval Request  Status", property: "STATUS", width: 14 },
          { label: "Cost Center", property: "COST_CENTER", width: 12 },
          { label: "Cost Center Text", property: "COST_CENTER_DESC", width: 12 },
          { label: "Alternate Cost Center Code", property: "ALTERNATE_COST_CENTRE", width: 12 },
          { label: "Alternate Cost Center Text", property: "ALT_COST_CENTER_DESC", width: 12 },
          { label: "GL No (Claim Item)", property: "GL_ACCOUNT", width: 12 },
          { label: "Code Material (Claim Item)", property: "MATERIAL_CODE", width: 12 },
          { label: "Total Request Amount", property: "TOTAL_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: "Cash Advance", property: "CASH_ADVANCE", type: "number", scale: 2, width: 16 },
          { label: "Purpose", property: "OBJECTIVE_PURPOSE", width: 24 },
          { label: "Remarks", property: "REMARK", width: 24 },
          { label: "Trip Start Date", property: "TRIP_START_DATE", type: "date", width: 14 },
          { label: "Trip End Date", property: "TRIP_END_DATE", type: "date", width: 14 },
          { label: "Event Start Date", property: "EVENT_START_DATE", type: "date", width: 14 },
          { label: "Event End Date", property: "EVENT_END_DATE", type: "date", width: 14 },
          { label: "Location", property: "LOCATION", width: 40 },
          { label: "Type of Transportation", property: "TYPE_OF_TRANSPORTATION", width: 40 },
          { label: "Claim/Request Item", property: "LOCATION", width: 40 },
          { label: "Estimated Amount", property: "EST_AMOUNT", type: "number", scale: 2, width: 16 },
          { label: "Estimated Number of Participant", property: "EST_NO_PARTICIPANT", type: "number", scale: 2, width: 16 },
          { label: "Cash Advance", property: "CASH_ADVANCE", type: "number", scale: 2, width: 16 },
          { label: "Start Date", property: "START_DATE", type: "date", width: 14 },
          { label: "End Date", property: "END_DATE", type: "date", width: 14 },
          { label: "Remarks", property: "REMARK", width: 24 },
          { label: "Berdasarkan terma keahlian kelab, sila nyatakan sama ada keahlian ini boleh dipindah milik atau tidak?", property: "DECLARE_CLUB_MEMBERSHIP", width: 24 },
          { label: "Mewakili KWSP dalam aktiviti sukan anjuran pengurusan KWSP atau Pihak Luar", property: "KWSP_SPORTS_REPRESENTATION", width: 24 },
          { label: "Disclaimer: Sebarang penyertaan dalam sukan anjuran jabatan dan cawangan masing-masing adalah tidak layak membuat tuntutan", property: "SPORTS_CLAIM_DISCLAIMER", width: 24 },
          { label: "Vehicle (Sendiri/Pejabat)", property: "VEHICLE_TYPE", width: 24 },
          { label: "Mode of Transfer", property: "MODE_OF_TRANSFER", width: 24 },
          { label: "Tarikh Pindah", property: "TRANSFER_DATE", type: "date", width: 14 },
          { label: "Number of Days", property: "NO_OF_DAYS", type: "number", scale: 0, width: 16 },
          { label: "Marriage Category", property: "MARRIAGE_CATEGORY", width: 24 },
          { label: "Number of family member (per head)", property: "FAMILY_COUNT", type: "number", scale: 0, width: 16 },
          { label: "Total Participant", property: "EST_NO_PARTICIPANT", type: "number", scale: 0, width: 16 },

        ];
      }

      // ===== Claim DETAILS =====
      return [

        { label: "Employee Name", property: "NAME", width: 20 },
        { label: "Personal Grade", property: "GRADE", width: 20 },
        { label: "SF Department/Branch ID", property: "DEP", width: 20 },
        { label: "SF Department/Branch Name", property: "DEPARTMENT_DESC", width: 20 },
        { label: "Unit/Seksyen", property: "UNIT_SECTION", width: 20 },
        { label: "Position Name", property: "POSITION_NAME", width: 20 },
        { label: "Employee ID", property: "EMP_ID", width: 12 },
        { label: "Claim Type", property: "CLAIM_TYPE_DESC", width: 16 },
        { label: "Claim ID", property: "CLAIM_ID", width: 12 },
        { label: "Pre-Approval Request ID", property: "REQUEST_ID", width: 14 },
        { label: "Pre-Approval Request Date", property: "REQUEST_DATE", width: 14 },
        { label: "Submission Type", property: "SUBMISSION_TYPE_DESC", width: 12 },
        { label: "Submitted Date", property: "SUBMITTED_DATE", type: "date", width: 14 },
        { label: "Approval 1", property: "APPROVER1", width: 20 },
        { label: "Approval 2", property: "APPROVER2", width: 20 },
        { label: "Approval 3", property: "APPROVER3", width: 20 },
        { label: "Approval 4", property: "APPROVER4", width: 20 },
        { label: "Approval 5", property: "APPROVER5", width: 20 },
        { label: "Final Approved Date", property: "LAST_APPROVED_DATE", type: "date", width: 14 },
        { label: "Last Send Back Date", property: "LAST_SEND_BACK_DATE", type: "date", width: 14 },
        { label: "DAY(S) APPROVED", property: "DAYS_APPROVED", type: "number", scale: 0, width: 8 },
        { label: "Cash Advance Received Date", property: "CASH_ADVANCE_DATE", type: "date", width: 14 },
        { label: "Payment Date", property: "PAYMENT_DATE", type: "date", width: 14 },
        { label: "Claim Status", property: "STATUS_ID", width: 14 },
        { label: "Cost Center", property: "COST_CENTER", width: 12 },
        { label: "Cost Center Text", property: "COST_CENTER_DESC", width: 12 },
        { label: "Alternate Cost Center Code", property: "ALTERNATE_COST_CENTRE", width: 12 },
        { label: "Alternate Cost Center Text", property: "ALT_COST_CENTER_DESC", width: 12 },
        { label: "GL No (Claim Item)", property: "GL_ACCOUNT", width: 12 },
        { label: "Code Material (Claim Item)", property: "MATERIAL_CODE", width: 12 },
        { label: "Total Claim Amt", property: "TOTAL_CLAIM_AMOUNT", type: "number", scale: 2, width: 16 },
        { label: "Cash Advance", property: "CASH_ADVANCE_AMOUT", type: "number", scale: 2, width: 16 },
        { label: "Final Amount", property: "FINAL_AMOUNT_RECEIVE", type: "number", scale: 2, width: 18 },
        { label: "Course Code", property: "COURSE_ID", width: 12 },
        { label: "Course Code", property: "COURSE_DESC", width: 12 },
        { label: "Course Session", property: "COURSE_DESC", width: 12 },
        { label: "Purpose", property: "PURPOSE", width: 24 },
        { label: "Remarks", property: "REMARK", width: 24 },
        { label: "Trip Start Date", property: "TRIP_START_DATE", type: "date", width: 14 },
        { label: "Trip End Date", property: "TRIP_END_DATE", type: "date", width: 14 },
        { label: "Location", property: "LOCATION", width: 40 },
        { label: "Claim ID", property: "CLAIM_ID", width: 14 },
        { label: "Claim Sub ID", property: "CLAIM_SUB_ID", width: 14 },
        { label: "Item No", property: "", width: 14 },
        { label: "% Compensation", property: "PERCENTAGE_COMPENSATION", width: 14 },
        { label: "Account No", property: "ACCOUNT_NO", width: 14 },
        { label: "Amount", property: "AMOUNT", width: 14 },
        { label: "Bill Date", property: "BILL_DATE", width: 14 },
        { label: "Bill No", property: "BILL_NO", width: 14 },
        { label: "Category/Purpose", property: "CLAIM_CATEGORY", width: 14 },
        { label: "Claim Type", property: "CLAIM_TYPE_DESC", width: 18 },
        { label: "Claim Item", property: "CLAIM_TYPE_ITEM_DESC", width: 20 },
        { label: "Country", property: "COUNTRY", width: 14 },
        { label: "Disclaimer: - installment, entertainment subs, games, roaming, storage, any other personal usage", property: "DISCLAIMER", width: 14 },
        { label: "End Date", property: "END_DATE", width: 14 },
        { label: "End Time", property: "END_TIME", width: 14 },
        { label: "Flight Class ", property: "FLIGHT_CLASS_DESC", width: 14 },
        { label: "From Location", property: "FROM_LOCATION_DESC", width: 14 },
        { label: "From Location (Office)", property: "FROM_LOCATION_OFFICE", width: 14 },
        { label: "Kilometer", property: "KM", width: 14 },
        { label: "Location", property: "LOCATION", width: 14 },
        { label: "Location Type", property: "LOCATION_TYPE", width: 14 },
        { label: "Lodging Address", property: "LODGING_ADDRESS", width: 14 },
        { label: "Lodging Category", property: "LODGING_CATEGORY_DESC", width: 14 },
        { label: "Marriage Category", property: "MARRIAGE_CATEGORY_DESC", width: 14 },
        { label: "Negara/wilayah", property: "REGION", width: 14 },
        { label: "Num of Family Members", property: "NO_OF_FAMILY_MEMBER", type: "number", scale: 2, width: 16 },
        { label: "Parking", property: "PARKING", width: 14 },
        { label: "Phone No", property: "PHONE_NO", width: 14 },
        { label: "Rate Per Kilometer", property: "RATE_PER_KM", width: 14 },
        { label: "Receipt Date", property: "RECEIPT_DATE", type: "date", width: 14 },
        { label: "Receipt Number", property: "RECEIPT_NUMBER", width: 14 },
        { label: "Remark/Justification", property: "REMARK", width: 14 },
        { label: "Room Type", property: "ROOM_TYPE", width: 14 },
        { label: "Semenanjung Or Sabah Sarawak", property: "AREA_DESC", width: 14 },
        { label: "Start Date", property: "START_DATE", width: 14 },
        { label: "Start Time", property: "START_TIME", width: 14 },
        { label: "State", property: "FROM_STATE_ID", width: 14 },
        { label: "To Location", property: "TO_LOCATION", width: 14 },
        { label: "To Location (Office)", property: "TO_LOCATION_OFFICE", width: 14 },
        { label: "Toll", property: "TOLL", width: 14 },
        { label: "Total Expenses Amount", property: "TOTAL_EXP_AMOUNT", type: "number", scale: 2, width: 16 },
        { label: "Type of Vehicle", property: "VEHICLE_TYPE_DESC", width: 14 },
        { label: "Vehicle (Tambang)", property: "VEHICLE_TYPE", width: 14 },
        { label: "Trip Start Date", property: "TRIP_START_DATE", type: "date", width: 14 },
        { label: "Trip Start Time", property: "START_TIME", width: 14 },
        { label: "Trip End Date", property: "TRIP_END_DATE", type: "date", width: 14 },
        { label: "Trip End Time", property: "END_TIME", width: 14 },
        { label: "Travel duration (days)", property: "TRAVEL_DURATION_DAY", width: 14 },
        { label: "Travel duration (hours)", property: "TRAVEL_DURATION_HOUR", width: 14 },
        { label: "Provided_Breakfast", property: "PROVIDED_BREAKFAST", width: 14 },
        { label: "Provided_Lunch", property: "PROVIDED_LUNCH", width: 14 },
        { label: "Provided_Dinner", property: "PROVIDED_DINNER", width: 14 },
        { label: "Retrieving data. Wait a few seconds and try to cut or copy again.", property: "ENTITLED_BREAKFAST", width: 14 },
        { label: "Entitled_Lunch", property: "ENTITLED_LUNCH", width: 14 },
        { label: "Entitled_Dinner", property: "ENTITLED_DINNER", width: 14 },
        { label: "Anggota ID", property: "ANGGOTA_ID", width: 14 },
        { label: "Anggota Name", property: "ANGGOTA_NAME", width: 14 },
        { label: "Dependent Name", property: "DEPENDENT_NAME", width: 14 },

      ];
    }
  });
});