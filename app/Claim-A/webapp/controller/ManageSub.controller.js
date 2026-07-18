sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "claima/utils/DateUtility",
  "claima/utils/Utility"
], function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, DateUtility, Utility) {
  "use strict";

  return Controller.extend("claima.controller.ManageSub", {

    // ============================================================
    // INIT
    // ============================================================
    onInit: function () {
      const oVM = new JSONModel({
        hasSelection: false,
        todayDate: new Date(),
        today: DateUtility.toYMD(new Date()), // yyyy-MM-dd in local time
        subValid: false,
        subInfo: "",
        isApprover: false,
        canEdit: false,
        subInput: "",
        editRule: {
          SUBSTITUTE_RULE_ID: "",
          USER_ID: "",
          SUBSTITUTE_ID: "",
          VALID_FROM: "",
          VALID_TO: ""
        }

      });
      this.getView().setModel(oVM, "vm");
      this._oSessionModel 	= this.getOwnerComponent().getModel("session");
      this._oRoleModel      = this.getOwnerComponent().getModel("roleModel");
      
    // Resolve user type via function import
      const oModel = this.getOwnerComponent().getModel();
      const ctx = oModel.bindContext("/getUserType()");
      var isApprover = this._oRoleModel.getProperty("/isApprover");
        oVM.setProperty("/isApprover", isApprover);
        oVM.setProperty("/canEdit",oVM.getProperty("/isApprover") && oVM.getProperty("/hasSelection"));

      const oTable = this.byId("tblSubs");
      oTable.attachEventOnce("updateFinished", () => {
        this._applyActiveFilter();
      });

      this._scheduleMidnightRefresh();
    },

    /** Applies filter: VALID_TO >= vm>/today */
    _applyActiveFilter: function () {
      const oTable = this.byId("tblSubs");
      const oBinding = oTable.getBinding("items");
      if (!oBinding) return;

      const sToday = this.getView().getModel("vm").getProperty("/today");

      const oFilter = new Filter({
        path: "VALID_TO",
        operator: FilterOperator.GE,
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
        vm.setProperty("/today", DateUtility.toYMD(new Date())); // 'yyyy-MM-dd' string
        this._applyActiveFilter();

        this._midnightInterval && clearInterval(this._midnightInterval);
        this._midnightInterval = setInterval(() => {
          const vm2 = this.getView().getModel("vm");
          vm2.setProperty("/todayDate", new Date());
          vm2.setProperty("/today", DateUtility.toYMD(new Date()));
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
        MessageToast.show(Utility.getText("pleaseProvideAll"));
        return;
      }
      if (dEnd < dStart) {
        MessageToast.show(Utility.getText("endBeforeStart"));
        return;
      }

      let oEmp;
      try {
        oEmp = await this._getEmployeeByIdOrEmail(sSubstituteId);
      } catch (e) {
        MessageBox.error(Utility.getText("backendUnavailable"));
        return;
      }
      if (!oEmp) {
        MessageBox.error(Utility.getText("empNotFound"));
        return;
      }

      // BACKEND OVERLAP CHECK
      try {
          const oOverlapAction = this.getOwnerComponent()
          .getModel()
          .bindContext("/checkSubstitutionOverlap(...)");

        oOverlapAction.setParameter("USER_ID", sUserId);
        oOverlapAction.setParameter("VALID_FROM", DateUtility.toYMD(dStart));
        oOverlapAction.setParameter("VALID_TO", DateUtility.toYMD(dEnd));
        oOverlapAction.setParameter("SUBSTITUTE_RULE_ID", "");

        await oOverlapAction.execute("$auto");

        const bOverlap = oOverlapAction
          .getBoundContext()
          .getObject()
          .value;
        if (bOverlap) {
          MessageBox.error(Utility.getText("overlappingRuleSameSubOnly") );
          return;
        }

         } catch (e) {
        return;
      }
      
      const oPayload = {
        SUBSTITUTE_RULE_ID: sSubstituteRulesId,
        USER_ID: sUserId,   
        SUBSTITUTE_ID: oEmp.EEID,   
        VALID_FROM: DateUtility.toYMD(dStart),
        VALID_TO:DateUtility.toYMD(dEnd)
      };

      const oTable = this.byId("tblSubs");
      const oListBinding = oTable.getBinding("items");

      try {
        this.byId("dlgAdd").setBusy(true);
        const oCreatedCtx = oListBinding.create(oPayload);
        await oCreatedCtx.created();

        this.onCancel();
        MessageToast.show(Utility.getText("created"));
      } catch (err) {
        MessageBox.error(err.message || "Create failed");
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
				new Filter("EMAIL", "EQ", sEMAIL)
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
    // SELECTION + EDIT (OData V4)
    // ============================================================
    onSelectionChange: function (oEvent) {
      const vm = this.getView().getModel("vm");
      const bHasSelection = !!oEvent.getSource().getSelectedItem();
      vm.setProperty("/hasSelection", bHasSelection);
      vm.setProperty("/canEdit",vm.getProperty("/isApprover") && bHasSelection);
      },

    onEdit: function () {

      const oTable = this.byId("tblSubs");
      const oItem = oTable.getSelectedItem();
      if (!oItem) {
        MessageToast.show(Utility.getText("msg_mngesub_no_select"));
        return;
      }

      const oData = oItem.getBindingContext().getObject();
      const oVM = this.getView().getModel("vm");

      oVM.setProperty("/editRule", {
        SUBSTITUTE_RULE_ID: oData.SUBSTITUTE_RULE_ID,
        USER_ID: oData.USER_ID,
        SUBSTITUTE_ID: oData.SUBSTITUTE_ID,
        VALID_FROM: oData.VALID_FROM,
        VALID_TO: oData.VALID_TO
      });

      // Restrict VALID_TO: cannot select before VALID_FROM
      const dValidFrom = DateUtility.toDate(oData.VALID_FROM);

      this.byId("dpEditValidTo").setMinDate(dValidFrom);
      this.byId("dlgEdit").open();
    },

    onCancelEdit: function () {
      this.byId("dlgEdit").close();

      const oVM = this.getView().getModel("vm");
      oVM.setProperty("/editRule", {
        SUBSTITUTE_RULE_ID: "",
        USER_ID: "",
        SUBSTITUTE_ID: "",
        VALID_FROM: "",
        VALID_TO: ""
      });
    },

    onSaveEdit: async function () {
      const oVM = this.getView().getModel("vm");
      const oEdit = oVM.getProperty("/editRule");

      const oTable = this.byId("tblSubs");
      const oItem = oTable.getSelectedItem();

      if (!oItem) {
        MessageToast.show(Utility.getText("msg_mngesub_no_select"));
        return;
      }

      const dValidFrom = DateUtility.toDate(oEdit.VALID_FROM);
      const dValidTo = DateUtility.toDate(oEdit.VALID_TO);

      if (dValidTo < dValidFrom) {
        MessageBox.error(Utility.getText("msg_mngesub_valid_to_before_from") );
        return;
      }

      try {
        this.byId("dlgEdit").setBusy(true);

        // Overlap check during edit
        const oOverlapAction = this.getOwnerComponent()
          .getModel()
          .bindContext("/checkSubstitutionOverlap(...)");

        oOverlapAction.setParameter("USER_ID", oEdit.USER_ID);
        oOverlapAction.setParameter("VALID_FROM", DateUtility.toYMD(dValidFrom));
        oOverlapAction.setParameter("VALID_TO", DateUtility.toYMD(dValidTo));
        oOverlapAction.setParameter("SUBSTITUTE_RULE_ID", oEdit.SUBSTITUTE_RULE_ID);

        await oOverlapAction.execute("$auto");

        const bOverlap = oOverlapAction
          .getBoundContext()
          .getObject()
          .value;

        if (bOverlap) {
          MessageBox.error(Utility.getText("msg_mngesub_overlapping"));
          return;
        }

        const oOldData =
          oItem.getBindingContext().getObject();

        const oAction =
          this.getOwnerComponent()
            .getModel()
            .bindContext("/updateSubstitutionValidTo(...)");

        oAction.setParameter("SUBSTITUTE_RULE_ID",oOldData.SUBSTITUTE_RULE_ID);
        oAction.setParameter("USER_ID",oOldData.USER_ID);
        oAction.setParameter("SUBSTITUTE_ID",oOldData.SUBSTITUTE_ID);
        oAction.setParameter("VALID_FROM",oOldData.VALID_FROM);
        oAction.setParameter("OLD_VALID_TO",oOldData.VALID_TO);
        oAction.setParameter("NEW_VALID_TO",DateUtility.toYMD(dValidTo));

        await oAction.execute("$auto");

        const oBinding = oTable.getBinding("items");

        if (oBinding) {
          oBinding.refresh();
        }

        MessageToast.show(
          Utility.getText("msg_mngesub_update_success")
        );

        this.onCancelEdit();

      } catch (e) {
        MessageBox.error(e?.message || Utility.getText("msg_update_failed"));
      } finally {
        this.byId("dlgEdit").setBusy(false);
      }
    },


    // ============================================================
    // LIVE VALIDATION: EEID -> show eeid + email
    // ============================================================
    onSubstituteIdChange: async function (oEvent) {
        const sVal = oEvent.getParameter("value").trim();
        const oVM  = this.getView().getModel("vm");

        if (!sVal) {
          oVM.setProperty("/subValid", false);
          oVM.setProperty("/subInfo", "");
          return;
        }

        if (this._subChkTimer) clearTimeout(this._subChkTimer);
        this._subChkTimer = setTimeout(async () => {
          try {
            const oEmp = await this._getEmployeeByIdOrEmail(sVal);
            if (oEmp) {
              oVM.setProperty("/subValid", true);
              // Show both when available
              const info = [oEmp.EEID, oEmp.NAME].filter(Boolean).join(" - ");
              oVM.setProperty("/subInfo", info);
            } else {
              oVM.setProperty("/subValid", false);
              oVM.setProperty("/subInfo", "");
            }
          } catch (e) {
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

        /**Lookup employee by EEID or EMAIL.*/
    _getEmployeeByIdOrEmail: async function (sValue) {
      if (!sValue) return null;

      const oModel = this.getOwnerComponent().getModel(); // OData V4

      // Simple detection
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sValue);
      const looksLikeEEID  = /^[A-Za-z0-9]+$/.test(sValue); 
      const looksLikeName = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sValue);

      // Build filters
      const fEEID  = new Filter("EEID",  FilterOperator.EQ, sValue);
      const fEMAIL = new Filter("EMAIL", FilterOperator.EQ, sValue);
      const fName = new Filter("NAME", FilterOperator.EQ, sValue);

      //  - If clearly email → filter by EMAIL only
      //  - Else if clearly EEID → filter by EEID only
      //  - Else → try OR(EEID eq v OR EMAIL eq v)
      let aFilters;
      if (looksLikeEmail) {
        aFilters = [ fEMAIL ];
      } else if (looksLikeName) {
      aFilters = [ fName ];
      } else if (looksLikeEEID) {
        aFilters = [ fEEID ];
      } else {
        aFilters = [ new Filter({
          filters: [ fEEID, fEMAIL, fName],
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

  });
});