sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, Sorter) {
  "use strict";

  return Controller.extend("claima.controller.ManageSub", {

    // ============================================================
    // INIT
    // ============================================================
    onInit: function () {
      const oVM = new JSONModel({
        hasSelection: false,
        todayDate: new Date(),
        today: this._fmtYMD(new Date()), // yyyy-MM-dd in local time
        subValid: false,
        subInfo: "",
        isApprover: false,
        canDelete: false
      });
      this.getView().setModel(oVM, "vm");
      this._oSessionModel 	= this.getOwnerComponent().getModel("session");
      this._oRoleModel      = this.getOwnerComponent().getModel("roleModel");
      
    // Resolve user type via function import
      const oModel = this.getOwnerComponent().getModel();
      const ctx = oModel.bindContext("/getUserType()");
      var isApprover = this._oRoleModel.getProperty("/isApprover");
      ctx.requestObject().then((oData) => {
        const sType = (oData && oData.userType) || "UNKNOWN";
        oVM.setProperty("/isApprover", isApprover);
        // Recompute delete visibility with current selection state
        oVM.setProperty(
          "/canDelete",
          oVM.getProperty("/isApprover") && oVM.getProperty("/hasSelection")
        );
      }).catch(() => {
      });

      const oTable = this.byId("tblSubs");
      oTable.attachEventOnce("updateFinished", () => {
        this._applyActiveFilter();
      });

      this._scheduleMidnightRefresh();
    },

    /** Format local date as yyyy-MM-dd  */
    _fmtYMD: function (d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },

    /** Applies filter: VALID_TO >= vm>/today */
    _applyActiveFilter: function () {
      const oTable = this.byId("tblSubs");
      const oBinding = oTable.getBinding("items");
      if (!oBinding) return;

      const sToday = this.getView().getModel("vm").getProperty("/today");

      const oFilter = new sap.ui.model.Filter({
        path: "VALID_TO",
        operator: sap.ui.model.FilterOperator.GE,
        value1: sToday
      });

      oBinding.filter([oFilter]);
    },

    /** Schedules a refresh exactly at the next local midnight, then every 24h */
    _scheduleMidnightRefresh: function () {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      this._midnightTimer && clearTimeout(this._midnightTimer);
      this._midnightTimer = setTimeout(() => {
        const vm = this.getView().getModel("vm");
        vm.setProperty("/todayDate", new Date());           // Date object
        vm.setProperty("/today", this._fmtYMD(new Date())); // 'yyyy-MM-dd' string
        this._applyActiveFilter();

        this._midnightInterval && clearInterval(this._midnightInterval);
        this._midnightInterval = setInterval(() => {
          const vm2 = this.getView().getModel("vm");
          vm2.setProperty("/todayDate", new Date());
          vm2.setProperty("/today", this._fmtYMD(new Date()));
          this._applyActiveFilter();
        }, 24 * 60 * 60 * 1000);
      }, msUntilMidnight);
    },

    onExit: function () {
      this._midnightTimer && clearTimeout(this._midnightTimer);
      this._midnightInterval && clearInterval(this._midnightInterval);
    },

    // ============================================================
    // DIALOG OPEN/CLOSE
    // ============================================================
    onAdd: function () {
      const oDlg = this.byId("dlgAdd");
      oDlg.setBusy(false);
      oDlg.open();
    },

    onCancel: function () {
      this.byId("dlgAdd").close();
      this.byId("inpUser").setValue("");
      const oDRS = this.byId("drs");
      oDRS.setDateValue(null);
      oDRS.setSecondDateValue(null);

      // reset UI state
      const oVM = this.getView().getModel("vm");
      oVM.setProperty("/subValid", false);
      oVM.setProperty("/subInfo", "");
      this.byId("inpUser").setValueState("None");
      this.byId("inpUser").setValueStateText("");
    },

    // ============================================================
    // SAVE (OData V4 create)
    // ============================================================
    onSave: async function () {
      const sSubstituteId = this.byId("inpUser").getValue().trim(); // expected to be EEID
      const oDRS = this.byId("drs");
      const dStart = oDRS.getDateValue();
      const dEnd   = oDRS.getSecondDateValue();
      const userModelData = this._oSessionModel.getData();
			const emp_data = await this._getEmpIdDetail(userModelData.email);
      const sUserId = emp_data.eeid;

      const oResult = await this._getCurrentSubNumber("NR04");
      const sSubstituteRulesId = oResult && oResult.subNo;

      if (!sSubstituteId || !dStart || !dEnd) {
        MessageToast.show(this._i18n("pleaseProvideAll"));
        return;
      }
      if (dEnd < dStart) {
        MessageToast.show(this._i18n("endBeforeStart"));
        return;
      }

      let oEmp;
      try {
        //oEmp = await this._getEmployeeByEEID(sSubstituteId);
        oEmp = await this._getEmployeeByIdOrEmail(sSubstituteId);
      } catch (e) {
        MessageBox.error(this._i18n("backendUnavailable") || "Unable to validate employee at the moment.");
        return;
      }
      if (!oEmp) {
        const oInp = this.byId("inpUser");
        oInp.setValueState("Error");
        oInp.setValueStateText(this._i18n("empNotFound") || "Employee not found in ZEMP_MASTER.");
        MessageBox.error(this._i18n("empNotFound") || "Employee not found in ZEMP_MASTER.");
        return;
      } else {
        this.byId("inpUser").setValueState("Success");
        this.byId("inpUser").setValueStateText(`Matched: ${oEmp.EEID} — ${oEmp.EMAIL || ""}`);
      }

      try {
          const bOverlap = await this._hasOverlappingRule(sUserId, oEmp.EEID, dStart, dEnd);
          if (bOverlap) {
            MessageBox.error(this._i18n("overlappingRuleSameSubOnly") || "A substitution already exists for the same user & substitute within the selected period.");
            return;
          }
        } catch (e) {
          MessageBox.error(this._i18n("backendUnavailable") || "Failed to check overlap. Please try again.");
          return;
        }

      // Map UI -> backend fields
      const toISO = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      const oPayload = {
        SUBSTITUTE_RULE_ID: sSubstituteRulesId,
        USER_ID: sUserId,   
        SUBSTITUTE_ID: oEmp.EEID,   
        VALID_FROM: toISO(dStart),
        VALID_TO:   toISO(dEnd)
      };

      const oTable = this.byId("tblSubs");
      const oListBinding = oTable.getBinding("items");

      try {
        this.byId("dlgAdd").setBusy(true);
        const oCreatedCtx = oListBinding.create(oPayload);
        await oCreatedCtx.created();

        this.onCancel();
        MessageToast.show(this._i18n("created"));
      } catch (err) {
        MessageBox.error(err.message || "Create failed");
        this.byId("dlgAdd").setBusy(false);
      } finally {
        if (oResult) {
          this._updateCurrentReqNumber(oResult.current);
        }
        this.byId("dlgAdd").setBusy(false);
      }
    },

    _getCurrentSubNumber: async function (range_id) {
      const oMainModel = this.getOwnerComponent().getModel();
      const oListBinding = oMainModel.bindList("/ZNUM_RANGE", null, null, [
        new Filter("RANGE_ID", FilterOperator.EQ, range_id)
      ]);

      try {
        const aContexts = await oListBinding.requestContexts(0, 1);
        if (aContexts.length === 0) throw new Error("Range ID not found");

        const oData = aContexts[0].getObject();
        const prefix = oData.PREFIX;
        const current = Number(oData.CURRENT);
        const subNo = `${prefix}${String(current).padStart(7, "0")}`;
        return { subNo, current };
      } catch (err) {
        console.error("Number Range Error:", err);
        return null;
      }
    },

    _updateCurrentReqNumber: async function (currentNumber) {
      const oMainModel = this.getOwnerComponent().getModel();
      const oContext = oMainModel.bindContext(`/ZNUM_RANGE('${encodeURIComponent('NR04')}')`).getBoundContext();

      try {
        await oContext.setProperty("CURRENT", String(currentNumber + 1));
        return true;
      } catch (e) {
        console.error("Update Failed", e);
        return false;
      }
    },

    // get backend data
		async _getEmpIdDetail(sEMAIL) {
			const oModel = this.getOwnerComponent().getModel();
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
				new sap.ui.model.Filter("EMAIL", "EQ", sEMAIL)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return {
						eeid: oData.EEID,
						name: oData.NAME
					};
				} else {
					console.warn("No employee found with email: " + sEMAIL);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; // Return null so the app doesn't crash
			}
		},

    // ============================================================
    // CHECK IF THERE'S AN OVERLAPPING RULE FOR USER ID + SUBSTITUTE
    // ============================================================
      
    _hasOverlappingRule: async function (sUserId, sSubstituteId, dStart, dEnd) {
      if (!sUserId || !sSubstituteId || !dStart || !dEnd) return false;

      const toISO = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const sStart = toISO(dStart);
      const sEnd   = toISO(dEnd);

      const oModel = this.getOwnerComponent().getModel();

      let sEntitySetPath = "/ZSUBSTITUTION_RULES";
      const oTable = this.byId("tblSubs");
      const oBinding = oTable && oTable.getBinding && oTable.getBinding("items");
      if (oBinding && typeof oBinding.getPath === "function" && oBinding.getPath()) {
        sEntitySetPath = oBinding.getPath();
      }

      // Overlap (inclusive): existing.VALID_TO >= newStart AND existing.VALID_FROM <= newEnd
      const aFilters = [
        new sap.ui.model.Filter("USER_ID",        sap.ui.model.FilterOperator.EQ, sUserId),
        //new sap.ui.model.Filter("SUBSTITUTE_ID",  sap.ui.model.FilterOperator.EQ, sSubstituteId),
        new sap.ui.model.Filter("VALID_TO",       sap.ui.model.FilterOperator.GE, sStart),
        new sap.ui.model.Filter("VALID_FROM",     sap.ui.model.FilterOperator.LE, sEnd)
      ];

      const oList = oModel.bindList(
        sEntitySetPath,
        null,
        null,
        aFilters,
        { $select: "USER_ID,SUBSTITUTE_ID,VALID_FROM,VALID_TO" }
      );

      try {
        const aCtx = await oList.requestContexts(0, 1);
        if (!aCtx.length) return false;

        // Extra local check to be robust to any server-side date normalization
        const rec = aCtx[0].getObject();
        const parseYMDLocal = (s) => {
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
          return m ? new Date(+m[1], +m[2] - 1, +m[3]) : (isNaN(new Date(s)) ? null : new Date(s));
        };
        const exFrom = parseYMDLocal(rec.VALID_FROM);
        const exTo   = parseYMDLocal(rec.VALID_TO);
        if (!exFrom || !exTo) return true;

        const dA1 = new Date(exFrom.getFullYear(), exFrom.getMonth(), exFrom.getDate());
        const dA2 = new Date(exTo.getFullYear(),   exTo.getMonth(),   exTo.getDate());
        const dB1 = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate());
        const dB2 = new Date(dEnd.getFullYear(),   dEnd.getMonth(),   dEnd.getDate());

        return (dA2 >= dB1) && (dA1 <= dB2); // inclusive overlap
      } catch (e) {
        console.error("Overlap check failed", e);
        // Fail-closed so we don't permit duplicates silently
        throw e;
      }
    },

    // ============================================================
    // SELECTION + DELETE (OData V4)
    // ============================================================
    onSelectionChange: function (oEvent) {
      const vm = this.getView().getModel("vm");
      const bHasSelection = !!oEvent.getSource().getSelectedItem();
      vm.setProperty("/hasSelection", bHasSelection);
        vm.setProperty(
          "/canDelete",
          vm.getProperty("/isApprover") && bHasSelection
        );
      },

    onDelete: function () {
      const oTable = this.byId("tblSubs");
      const oItem = oTable.getSelectedItem();
      if (!oItem) {
        MessageToast.show(this._i18n("nothingSelected"));
        return;
      }
      MessageBox.confirm(
        this._i18n("confirmDeleteMsg"),
        {
          title: this._i18n("confirmDeleteTitle"),
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: async (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              try {
                const oCtx = oItem.getBindingContext(); // V4 context
                await oCtx.delete();
                this.getView().getModel("vm").setProperty("/hasSelection", false);
                MessageToast.show(this._i18n("deleted"));
              } catch (e) {
                MessageBox.error(e.message || "Delete failed");
              }
            }
          }
        }
      );
    },

    // ============================================================
    // LIVE VALIDATION: EEID -> show eeid + email
    // ============================================================
    onSubstituteIdChange: async function (oEvent) {
        const sVal = oEvent.getParameter("value").trim();
        const oInp = oEvent.getSource();
        const oVM  = this.getView().getModel("vm");

        if (!sVal) {
          oInp.setValueState("None");
          oInp.setValueStateText("");
          oVM.setProperty("/subValid", false);
          oVM.setProperty("/subInfo", "");
          return;
        }

        if (this._subChkTimer) clearTimeout(this._subChkTimer);
        this._subChkTimer = setTimeout(async () => {
          try {
            const oEmp = await this._getEmployeeByIdOrEmail(sVal);
            if (oEmp) {
              oInp.setValueState("Success");
              oInp.setValueStateText("");
              oVM.setProperty("/subValid", true);
              // Show both when available
              const info = [oEmp.EEID, oEmp.EMAIL].filter(Boolean).join(" - ");
              oVM.setProperty("/subInfo", info);
            } else {
              oInp.setValueState("Error");
              oInp.setValueStateText(this._i18n("empNotFound") || "Employee not found in ZEMP_MASTER.");
              oVM.setProperty("/subValid", false);
              oVM.setProperty("/subInfo", "");
            }
          } catch (e) {
            oInp.setValueState("Warning");
            oInp.setValueStateText(this._i18n("backendUnavailable") || "Unable to validate employee right now.");
            oVM.setProperty("/subValid", false);
            oVM.setProperty("/subInfo", "");
          }
        }, 250);
      },

    // ============================================================
    // HELPERS (period text) — corrected & timezone-safe
    // ============================================================
    fmtPeriodMessage: function (validFrom, validTo) {
      if (!validFrom || !validTo) return "";

      // Strict local parsing for yyyy-MM-dd (avoid UTC drift)
      function parseYMDLocal(s) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (!m) return null;
        return new Date(+m[1], +m[2] - 1, +m[3]);
      }
      function toLocalMidnight(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
      function toDateLocal(v) {
        if (v instanceof Date) return toLocalMidnight(v);

        if (typeof v === "string") {
          const ticks = v.match(/\/Date\((\d+)\)\//);
          if (ticks) {
            const d = new Date(parseInt(ticks[1], 10));
            return toLocalMidnight(d);
          }
          const dLocal = parseYMDLocal(v);
          if (dLocal) return dLocal;
          const d = new Date(v);
          return isNaN(d) ? null : toLocalMidnight(d);
        }

        const d = new Date(v);
        return isNaN(d) ? null : toLocalMidnight(d);
      }

      const from = toDateLocal(validFrom);
      const to   = toDateLocal(validTo);
      if (!from || !to) return "";

      const today = toLocalMidnight(new Date());
      const msPerDay = 24 * 60 * 60 * 1000;

      const daysToStart = Math.floor((from - today) / msPerDay); // 1 if starts tomorrow
      const daysToEnd   = Math.floor((to   - today) / msPerDay); // 0 if ends today

      // Not yet started
      if (daysToStart > 0) {
        return `starts in ${daysToStart} day${daysToStart === 1 ? "" : "s"}`;
      }

      // Active (inclusive from..to)
      if (daysToStart <= 0 && daysToEnd >= 0) {
        const remainingInclusive = daysToEnd + 1; // include today
        return `ends in ${remainingInclusive} day${remainingInclusive === 1 ? "" : "s"}`;
      }

      // Ended
      if (daysToEnd < 0) {
        const endedDaysAgo = Math.abs(daysToEnd);
        return `ended ${endedDaysAgo} day${endedDaysAgo === 1 ? "" : "s"} ago`;
      }

      return "";
    },

    // ============================================================
    // OData helper: ZEMP_MASTER by EEID with $select
    // ============================================================
    /** Lookup employee by EEID (projects only eeid,email) */
    _getEmployeeByEEID: async function (sEEID) {
      if (!sEEID) return null;

      const oMainModel = this.getOwnerComponent().getModel(); // OData V4
      const oList = oMainModel.bindList(
        "/ZEMP_MASTER",
        null,                  // context
        null,                  // sorters
        [ new sap.ui.model.Filter("EEID", sap.ui.model.FilterOperator.EQ, sEEID) ],
        { $select: "EEID,EMAIL" } // ← only fetch eeid,email
      );

      try {
        const aCtx = await oList.requestContexts(0, 1);
        return aCtx.length ? aCtx[0].getObject() : null; // { eeid, email }
      } catch (e) {
        console.error("ZEMP_MASTER lookup failed", e);
        throw e;
      }
    },

        /**Lookup employee by EEID or EMAIL.*/
    _getEmployeeByIdOrEmail: async function (sValue) {
      if (!sValue) return null;

      const oModel = this.getOwnerComponent().getModel(); // OData V4

      // Simple detection
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sValue);
      const looksLikeEEID  = /^[A-Za-z0-9]+$/.test(sValue); 

      // Build filters
      const fEEID  = new sap.ui.model.Filter("EEID",  sap.ui.model.FilterOperator.EQ, sValue);
      const fEMAIL = new sap.ui.model.Filter("EMAIL", sap.ui.model.FilterOperator.EQ, sValue);

      //  - If clearly email → filter by EMAIL only
      //  - Else if clearly EEID → filter by EEID only
      //  - Else → try OR(EEID eq v OR EMAIL eq v)
      let aFilters;
      if (looksLikeEmail) {
        aFilters = [ fEMAIL ];
      } else if (looksLikeEEID) {
        aFilters = [ fEEID ];
      } else {
        aFilters = [ new sap.ui.model.Filter({
          filters: [ fEEID, fEMAIL ],
          and: false // OR
        }) ];
      }

      const oList = oModel.bindList(
        "/ZEMP_MASTER",
        null,
        null,
        aFilters,
        { $select: "EEID,EMAIL,NAME" }
      );

      try {
        const aCtx = await oList.requestContexts(0, 2); // fetch up to 2 to detect duplicates
        if (!aCtx.length) return null;
        if (aCtx.length > 1) {
          const a = aCtx.map(c => c.getObject());
          if (looksLikeEmail) {
            const exact = a.find(x => (x.EMAIL || "").toLowerCase() === sValue.toLowerCase());
            if (exact) return exact;
          }
          return a[0];
        }
        return aCtx[0].getObject();
      } catch (e) {
        console.error("ZEMP_MASTER lookup failed", e);
        throw e;
      }
    },

    _i18n: function (sKey) {
      return this.getView().getModel("i18n").getResourceBundle().getText(sKey);
    }
  });
});