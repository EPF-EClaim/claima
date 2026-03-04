sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  // --- Utility: day difference using UTC---
  function daysBetweenISO(fromISO, toISO) {
    if (!fromISO || !toISO) { return NaN; }
    const [fy, fm, fd] = fromISO.split("-").map(Number);
    const [ty, tm, td] = toISO.split("-").map(Number);
    const fromUTC = Date.UTC(fy, fm - 1, fd);
    const toUTC   = Date.UTC(ty, tm - 1, td);
    return Math.ceil((toUTC - fromUTC) / 86400000);
  }

  return Controller.extend("claima.controller.ManageSub", {

    // ============================================================
    // INIT
    // ============================================================
    onInit: function () {
      // View model for UI state
      const oVM = new JSONModel({ hasSelection: false });
      this.getView().setModel(oVM, "vm");

      // Local, in-memory model for prototyping (NO OData)
      const oLocal = new JSONModel({
        Substitutes: [
          // (optional) seed data
          // { user: "demo.user", status: "Inactive", startISO: "2026-03-02", endISO: "2026-03-06", start: "3/2/26", end: "3/6/26", periodText: "" }
        ]
      });
      this.getView().setModel(oLocal, "local");

      // Initial recalc for any seed data
      this._recalc();
    },

    // ============================================================
    // DIALOG OPEN/CLOSE
    // ============================================================
    onAdd: function () {
      const oDlg = this.byId("dlgAdd");
      oDlg.setBusy(false); // ensure not stuck
      oDlg.open();
    },

    onCancel: function () {
      this.byId("dlgAdd").close();
      // Clear dialog inputs
      this.byId("inpUser").setValue("");
      this.byId("drs").setDateValue(null);
      this.byId("drs").setSecondDateValue(null);
    },

    // ============================================================
    // SAVE (JSON model; NO network)
    // ============================================================
    onSave: function () {
      const sUser = this.byId("inpUser").getValue().trim();
      const oDRS  = this.byId("drs");
      const dStart = oDRS.getDateValue();
      const dEnd   = oDRS.getSecondDateValue();

      if (!sUser || !dStart || !dEnd) {
        MessageToast.show(this._i18n("pleaseProvideAll"));
        return;
      }
      if (dEnd < dStart) {
        MessageToast.show(this._i18n("endBeforeStart"));
        return;
      }

      const toISO = (d) => d.toISOString().slice(0, 10); // yyyy-MM-dd
      const toDisplay = (d) => d.toLocaleDateString(undefined, {
        year: "2-digit", month: "numeric", day: "numeric"
      });

      const oNew = {
        user: sUser,
        status: "Inactive",
        startISO: toISO(dStart),
        endISO:   toISO(dEnd),
        start:    toDisplay(dStart),
        end:      toDisplay(dEnd),
        periodText: ""
      };

      const oLocal = this.getView().getModel("local");
      const a = oLocal.getProperty("/Substitutes") || [];
      a.push(oNew);
      oLocal.setProperty("/Substitutes", a);

      this._recalc();
      this.onCancel();
      MessageToast.show(this._i18n("created"));
    },

    // ============================================================
    // SELECTION + DELETE (JSON model)
    // ============================================================
    onSelectionChange: function (oEvent) {
      const bHasSelection = !!oEvent.getSource().getSelectedItem();
      this.getView().getModel("vm").setProperty("/hasSelection", bHasSelection);
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
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              this._deleteSelectedItem(oItem);
            }
          }
        }
      );
    },

    _deleteSelectedItem: function (oItem) {
      const oCtx = oItem.getBindingContext("local"); // note: local model context
      if (!oCtx) { return; }

      const sPath = oCtx.getPath(); // e.g., "/Substitutes/1"
      const oLocal = oCtx.getModel();
      const a = oLocal.getProperty("/Substitutes") || [];
      const iIndex = parseInt(sPath.split("/").pop(), 10);

      if (Number.isInteger(iIndex) && iIndex >= 0 && iIndex < a.length) {
        a.splice(iIndex, 1);
        oLocal.setProperty("/Substitutes", a);

        this.byId("tblSubs").removeSelections(true);
        this.getView().getModel("vm").setProperty("/hasSelection", false);

        this._recalc();
        MessageToast.show(this._i18n("deleted"));
      }
    },

    // ============================================================
    // HELPERS (compute status + periodText for rows)
    // ============================================================
    _recalc: function () {
      const oLocal = this.getView().getModel("local");
      if (!oLocal) { return; }

      const a = oLocal.getProperty("/Substitutes") || [];
      const todayISO = new Date().toISOString().slice(0, 10); // yyyy-MM-dd

      a.forEach((obj) => {
        if (!obj.startISO && obj.start) {
          obj.startISO = this._parseToISO(obj.start); 
        }
        if (!obj.endISO && obj.end) {
          obj.endISO = this._parseToISO(obj.end);
        }

        const dToStart = daysBetweenISO(todayISO, obj.startISO);
        const dToEnd   = daysBetweenISO(todayISO, obj.endISO);

        if (Number.isFinite(dToStart) && dToStart > 0) {
          // Future
          obj.status = obj.status || "Inactive";
          obj.periodText = `Starts in ${dToStart} day${dToStart === 1 ? "" : "s"}`;
        } else if (Number.isFinite(dToStart) && dToStart <= 0 &&
                   Number.isFinite(dToEnd) && dToEnd >= 0) {
          // Active
          obj.status = "Active";
          obj.periodText = `Ends in ${dToEnd} day${dToEnd === 1 ? "" : "s"}`;
        } else if (Number.isFinite(dToEnd) && dToEnd < 0) {
          // Past
          obj.status = "Inactive";
          obj.periodText = "Ended";
        } else {
          obj.periodText = "";
          obj.status = obj.status || "Inactive";
        }
      });

      oLocal.setProperty("/Substitutes", a);
    },

    _parseToISO: function (shortDate) {
      if (!shortDate) { return ""; }
      const parts = shortDate.split("/");
      if (parts.length !== 3) { return ""; }
      const [dd, mm, yy] = parts.map((s) => s.replace(/[^\d]/g, ""));
      const yyyy = (+yy < 50 ? 2000 + +yy : 1900 + +yy);
      const pad = (n) => String(n).padStart(2, "0");
      return `${yyyy}-${pad(mm)}-${pad(dd)}`;
    },

    _i18n: function (sKey) {
      return this.getView().getModel("i18n").getResourceBundle().getText(sKey);
    }
  });
});




//latest with binding to odata
// sap.ui.define([
//   "sap/ui/core/mvc/Controller",
//   "sap/ui/model/json/JSONModel",
//   "sap/m/MessageToast",
//   "sap/m/MessageBox"
// ], function (Controller, JSONModel, MessageToast, MessageBox) {
//   "use strict";

//   return Controller.extend("claima.controller.ManageSub", {

//     // ============================================================
//     // INIT
//     // ============================================================
//     onInit: function () {
//       // View model to control UI state (e.g., Delete visibility)
//       const oVM = new JSONModel({
//         hasSelection: false
//       });
//       this.getView().setModel(oVM, "vm");
//       // No local recalculation here: let formatters compute display text
//     },

//     // ============================================================
//     // DIALOG OPEN/CLOSE
//     // ============================================================
//     onAdd: function () {
//       this.byId("dlgAdd").open();
//     },

//     onCancel: function () {
//       this.byId("dlgAdd").close();
//       // Clear dialog fields
//       this.byId("inpUser").setValue("");
//       const oDRS = this.byId("drs");
//       oDRS.setDateValue(null);
//       oDRS.setSecondDateValue(null);
//     },

//     // ============================================================
//     // SAVE via OData V4 ListBinding.create()
//     // ============================================================
//     onSave: function () {
//       const sUser = this.byId("inpUser").getValue().trim();
//       const oDRS  = this.byId("drs");
//       const dStart = oDRS.getDateValue();
//       const dEnd   = oDRS.getSecondDateValue();

//       if (!sUser || !dStart || !dEnd) {
//         MessageToast.show(this._i18n("pleaseProvideAll"));
//         return;
//       }
//       if (dEnd < dStart) {
//         MessageToast.show(this._i18n("endBeforeStart"));
//         return;
//       }

//       // For Edm.Date fields use "yyyy-MM-dd"
//       const toISO = (d) => d.toISOString().slice(0, 10);

//       // ⚠️ Adjust property names to your backend if different
//       const oPayload = {
//         UserId: sUser,
//         StartDate: toISO(dStart),
//         EndDate: toISO(dEnd),
//         Status: "Inactive"
//       };

//       const oTable = this.byId("tblSubs");
//       const oListBinding = oTable.getBinding("items");
//       if (!oListBinding) {
//         MessageBox.error("Binding for Substitutes not found.");
//         return;
//       }

//       // Optional: show busy on dialog while creating
//       const oDlg = this.byId("dlgAdd");
//       oDlg.setBusy(true);

//       const oContext = oListBinding.create(oPayload, { refreshAfterChange: true });

//       oContext.created().then(() => {
//         oDlg.setBusy(false);
//         this.onCancel();
//         MessageToast.show(this._i18n("created"));
//       }).catch((err) => {
//         oDlg.setBusy(false);
//         MessageBox.error("Failed to create substitute.\n" + (err && err.message || err));
//       });
//     },

//     // ============================================================
//     // TABLE SELECTION + DELETE (OData V4)
//     // ============================================================
//     onSelectionChange: function (oEvent) {
//       const bHasSelection = !!oEvent.getSource().getSelectedItem();
//       this.getView().getModel("vm").setProperty("/hasSelection", bHasSelection);
//     },

//     onDelete: function () {
//       const oTable = this.byId("tblSubs");
//       const oItem = oTable.getSelectedItem();
//       if (!oItem) {
//         MessageToast.show(this._i18n("nothingSelected"));
//         return;
//       }

//       MessageBox.confirm(
//         this._i18n("confirmDeleteMsg"),
//         {
//           title: this._i18n("confirmDeleteTitle"),
//           actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
//           emphasizedAction: MessageBox.Action.OK,
//           onClose: (sAction) => {
//             if (sAction === MessageBox.Action.OK) {
//               this._deleteItem(oItem);
//             }
//           }
//         }
//       );
//     },

//     _deleteItem: function (oItem) {
//       const oCtx = oItem.getBindingContext(); // V4 context
//       if (!oCtx) { return; }

//       // V4 context.delete() returns a Promise
//       oCtx.delete().then(() => {
//         this.byId("tblSubs").removeSelections(true);
//         this.getView().getModel("vm").setProperty("/hasSelection", false);
//         MessageToast.show(this._i18n("deleted"));
//       }).catch((err) => {
//         MessageBox.error("Failed to delete the record.\n" + (err && err.message || err));
//       });
//     },

//     // ============================================================
//     // i18n helper
//     // ============================================================
//     _i18n: function (sKey) {
//       const oBundle = this.getView().getModel("i18n").getResourceBundle();
//       return oBundle.getText(sKey);
//     }
//   });
// });




// sap.ui.define([
//   "sap/ui/core/mvc/Controller",
//   "sap/ui/model/json/JSONModel",
//   "sap/m/MessageToast",
//   "sap/m/MessageBox"
// ], function (Controller, JSONModel, MessageToast, MessageBox) {
//   "use strict";
  
// // Robust day diff using UTC midnight to avoid timezone DST/offset issues
//   function daysBetweenISO(fromISO, toISO) {
//     if (!fromISO || !toISO) { return NaN; }
//     const [fy, fm, fd] = fromISO.split("-").map(Number);
//     const [ty, tm, td] = toISO.split("-").map(Number);
//     const fromUTC = Date.UTC(fy, fm - 1, fd);
//     const toUTC   = Date.UTC(ty, tm - 1, td);
//     return Math.ceil((toUTC - fromUTC) / 86400000);
//   }
//   return Controller.extend("claima.controller.ManageSub", {

//      onInit: function () {
//       // View model to control UI state (e.g., Delete visibility)
//       const oVM = new JSONModel({
//         hasSelection: false
//       });
//       this.getView().setModel(oVM, "vm");
//       // Recalculate once the default model is ready (if loaded via URI)
//       const oModel = this.getView().getModel();
//       if (oModel && typeof oModel.attachRequestCompleted === "function") {
//         oModel.attachRequestCompleted(() => this._recalc());
//       } else {
//         this._recalc();
//       }
//     },
//     onAdd: function () {
//       this.byId("dlgAdd").open();
//     },
//     onCancel: function () {
//       this.byId("dlgAdd").close();
//       this.byId("inpUser").setValue("");
//       this.byId("drs").setDateValue(null);
//       this.byId("drs").setSecondDateValue(null);
//     },
//     onSave: function () {
//       const sUser = this.byId("inpUser").getValue().trim();
//       const oDRS = this.byId("drs");
//       const dStart = oDRS.getDateValue();
//       const dEnd   = oDRS.getSecondDateValue();
//       if (!sUser || !dStart || !dEnd) {
//         MessageToast.show("Please provide user and both dates.");
//         return;
//       }
//       // Stable ISO (yyyy-MM-dd) for calculations
//       const toISO = (d) => d.toISOString().slice(0, 10);
//       // Friendly display string for the table
//       const toDisplay = (d) => d.toLocaleDateString(undefined, {
//         year: "2-digit", month: "numeric", day: "numeric"
//       });
//       const oNew = {
//         user: sUser,
//         status: "Inactive",
//         startISO: toISO(dStart),  
//         endISO:   toISO(dEnd),
//         start:    toDisplay(dStart),
//         end:      toDisplay(dEnd),
//         periodText: ""            
//       };
//       const oModel = this.getView().getModel();
//       const a = oModel.getProperty("/Substitutes") || [];
//       a.push(oNew);
//       oModel.setProperty("/Substitutes", a);
//       this._recalc();
//       this.onCancel();
//       MessageToast.show("Substitute added.");
//     },
//     // ---- Selection + Delete ----
//     onSelectionChange: function (oEvent) {
//       const bHasSelection = !!oEvent.getSource().getSelectedItem();
//       this.getView().getModel("vm").setProperty("/hasSelection", bHasSelection);
//     },
//     onDelete: function () {
//       const oTable = this.byId("tblSubs");
//       const oItem = oTable.getSelectedItem();
//       if (!oItem) {
//         MessageToast.show(this._i18n("nothingSelected"));
//         return;
//       }
//       MessageBox.confirm(
//         this._i18n("confirmDeleteMsg"),
//         {
//           title: this._i18n("confirmDeleteTitle"),
//           actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
//           emphasizedAction: MessageBox.Action.OK,
//           onClose: (sAction) => {
//             if (sAction === MessageBox.Action.OK) {
//               this._deleteSelectedItem(oItem);
//             }
//           }
//         }
//       );
//     },
//     _deleteSelectedItem: function (oItem) {
//       const oCtx = oItem.getBindingContext();
//       if (!oCtx) { return; }
//       const sPath = oCtx.getPath(); // e.g., "/Substitutes/1"
//       const oModel = oCtx.getModel();
//       const a = oModel.getProperty("/Substitutes") || [];
//       const iIndex = parseInt(sPath.split("/").pop(), 10);
//       if (Number.isInteger(iIndex) && iIndex >= 0 && iIndex < a.length) {
//         a.splice(iIndex, 1);
//         oModel.setProperty("/Substitutes", a);
//         // Clear selection and hide Delete button
//         this.byId("tblSubs").removeSelections(true);
//         this.getView().getModel("vm").setProperty("/hasSelection", false);
//         this._recalc();
//         MessageToast.show(this._i18n("deleted"));
//       }
//     },
//     // ---- Helpers ----
//     _recalc: function () {
//       const oModel = this.getView().getModel();
//       if (!oModel) { return; }
//       const a = oModel.getProperty("/Substitutes") || [];
//       const todayISO = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
//       a.forEach((obj) => {
//         if (!obj.startISO && obj.start) {
//           obj.startISO = this._parseToISO(obj.start); 
//         }
//         if (!obj.endISO && obj.end) {
//           obj.endISO = this._parseToISO(obj.end);
//         }
//         const dToStart = daysBetweenISO(todayISO, obj.startISO);
//         const dToEnd   = daysBetweenISO(todayISO, obj.endISO);
//         if (Number.isFinite(dToStart) && dToStart > 0) {
//           // Future
//           obj.status = obj.status || "Inactive";
//           obj.periodText = `Starts in ${dToStart} day${dToStart === 1 ? "" : "s"}`;
//         } else if (Number.isFinite(dToStart) && dToStart <= 0 && Number.isFinite(dToEnd) && dToEnd >= 0) {
//           // today between start and end inclusive
//           obj.status = "Active";
//           obj.periodText = `Ends in ${dToEnd} day${dToEnd === 1 ? "" : "s"}`;
//         } else if (Number.isFinite(dToEnd) && dToEnd < 0) {
//           // Past
//           obj.status = "Inactive";
//           obj.periodText = "Ended";
//         } else {
//           // Fallback
//           obj.periodText = "";
//           obj.status = obj.status || "Inactive";
//         }
//       });
//       oModel.setProperty("/Substitutes", a);
//     },

//     _parseToISO: function (shortDate) {
//       if (!shortDate) { return ""; }
//       const parts = shortDate.split("/");
//       if (parts.length !== 3) { return ""; }
//       const [dd, mm, yy] = parts.map((s) => s.replace(/[^\d]/g, ""));
//       const yyyy = (+yy < 50 ? 2000 + +yy : 1900 + +yy);
//       const pad = (n) => String(n).padStart(2, "0");
//       return `${yyyy}-${pad(mm)}-${pad(dd)}`;
//     },
//     _i18n: function (sKey) {
//       const oBundle = this.getView().getModel("i18n").getResourceBundle();
//       return oBundle.getText(sKey);
//     }
//   });
// });
//     onInit: function () {
//       // View model to control UI state (e.g., Delete visibility)
//       const oVM = new JSONModel({
//         hasSelection: false
//       });
//       this.getView().setModel(oVM, "vm");
//       // Recalculate once the default model is ready (if loaded via URI)
//       const oModel = this.getView().getModel();
//       if (oModel && typeof oModel.attachRequestCompleted === "function") {
//         oModel.attachRequestCompleted(() => this._recalc());
//       } else {
//         this._recalc();
//       }
//     },
//     onAdd: function () {
//       this.byId("dlgAdd").open();
//     },
//     onCancel: function () {
//       this.byId("dlgAdd").close();
//       this.byId("inpUser").setValue("");
//       this.byId("drs").setDateValue(null);
//       this.byId("drs").setSecondDateValue(null);
//     },
//     onSave: function () {
//       const sUser = this.byId("inpUser").getValue().trim();
//       const oDRS = this.byId("drs");
//       const dStart = oDRS.getDateValue();
//       const dEnd   = oDRS.getSecondDateValue();
//       if (!sUser || !dStart || !dEnd) {
//         MessageToast.show("Please provide user and both dates.");
//         return;
//       }
//       // Stable ISO (yyyy-MM-dd) for calculations
//       const toISO = (d) => d.toISOString().slice(0, 10);
//       // Friendly display string for the table
//       const toDisplay = (d) => d.toLocaleDateString(undefined, {
//         year: "2-digit", month: "numeric", day: "numeric"
//       });
//       const oNew = {
//         user: sUser,
//         status: "Inactive",
//         startISO: toISO(dStart),  
//         endISO:   toISO(dEnd),
//         start:    toDisplay(dStart),
//         end:      toDisplay(dEnd),
//         periodText: ""            
//       };
//       const oModel = this.getView().getModel();
//       const a = oModel.getProperty("/Substitutes") || [];
//       a.push(oNew);
//       oModel.setProperty("/Substitutes", a);
//       this._recalc();
//       this.onCancel();
//       MessageToast.show("Substitute added.");
//     },
//     // ---- Selection + Delete ----
//     onSelectionChange: function (oEvent) {
//       const bHasSelection = !!oEvent.getSource().getSelectedItem();
//       this.getView().getModel("vm").setProperty("/hasSelection", bHasSelection);
//     },
//     onDelete: function () {
//       const oTable = this.byId("tblSubs");
//       const oItem = oTable.getSelectedItem();
//       if (!oItem) {
//         MessageToast.show(this._i18n("nothingSelected"));
//         return;
//       }
//       MessageBox.confirm(
//         this._i18n("confirmDeleteMsg"),
//         {
//           title: this._i18n("confirmDeleteTitle"),
//           actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
//           emphasizedAction: MessageBox.Action.OK,
//           onClose: (sAction) => {
//             if (sAction === MessageBox.Action.OK) {
//               this._deleteSelectedItem(oItem);
//             }
//           }
//         }
//       );
//     },
//     _deleteSelectedItem: function (oItem) {
//       const oCtx = oItem.getBindingContext();
//       if (!oCtx) { return; }
//       const sPath = oCtx.getPath(); // e.g., "/Substitutes/1"
//       const oModel = oCtx.getModel();
//       const a = oModel.getProperty("/Substitutes") || [];
//       const iIndex = parseInt(sPath.split("/").pop(), 10);
//       if (Number.isInteger(iIndex) && iIndex >= 0 && iIndex < a.length) {
//         a.splice(iIndex, 1);
//         oModel.setProperty("/Substitutes", a);
//         // Clear selection and hide Delete button
//         this.byId("tblSubs").removeSelections(true);
//         this.getView().getModel("vm").setProperty("/hasSelection", false);
//         this._recalc();
//         MessageToast.show(this._i18n("deleted"));
//       }
//     },
//     // ---- Helpers ----
//     _recalc: function () {
//       const oModel = this.getView().getModel();
//       if (!oModel) { return; }
//       const a = oModel.getProperty("/Substitutes") || [];
//       const todayISO = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
//       a.forEach((obj) => {
//         if (!obj.startISO && obj.start) {
//           obj.startISO = this._parseToISO(obj.start); 
//         }
//         if (!obj.endISO && obj.end) {
//           obj.endISO = this._parseToISO(obj.end);
//         }
//         const dToStart = daysBetweenISO(todayISO, obj.startISO);
//         const dToEnd   = daysBetweenISO(todayISO, obj.endISO);
//         if (Number.isFinite(dToStart) && dToStart > 0) {
//           // Future
//           obj.status = obj.status || "Inactive";
//           obj.periodText = `Starts in ${dToStart} day${dToStart === 1 ? "" : "s"}`;
//         } else if (Number.isFinite(dToStart) && dToStart <= 0 && Number.isFinite(dToEnd) && dToEnd >= 0) {
//           // today between start and end inclusive
//           obj.status = "Active";
//           obj.periodText = `Ends in ${dToEnd} day${dToEnd === 1 ? "" : "s"}`;
//         } else if (Number.isFinite(dToEnd) && dToEnd < 0) {
//           // Past
//           obj.status = "Inactive";
//           obj.periodText = "Ended";
//         } else {
//           // Fallback
//           obj.periodText = "";
//           obj.status = obj.status || "Inactive";
//         }
//       });
//       oModel.setProperty("/Substitutes", a);
//     },

//     _parseToISO: function (shortDate) {
//       if (!shortDate) { return ""; }
//       const parts = shortDate.split("/");
//       if (parts.length !== 3) { return ""; }
//       const [dd, mm, yy] = parts.map((s) => s.replace(/[^\d]/g, ""));
//       const yyyy = (+yy < 50 ? 2000 + +yy : 1900 + +yy);
//       const pad = (n) => String(n).padStart(2, "0");
//       return `${yyyy}-${pad(mm)}-${pad(dd)}`;
//     },
//     _i18n: function (sKey) {
//       const oBundle = this.getView().getModel("i18n").getResourceBundle();
//       return oBundle.getText(sKey);
//     }
//   });
// });



// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/ui/model/json/JSONModel",
//     "sap/m/MessageToast",
//     "sap/m/MessageBox"
// ], function (Controller, JSONModel, MessageToast, MessageBox) {
//     "use strict";

//     // ---- Utility: safer date diff using ISO strings ----
//     function daysBetweenISO(fromISO, toISO) {
//         if (!fromISO || !toISO) return NaN;

//         const [fy, fm, fd] = fromISO.split("-").map(Number);
//         const [ty, tm, td] = toISO.split("-").map(Number);

//         const fromUTC = Date.UTC(fy, fm - 1, fd);
//         const toUTC = Date.UTC(ty, tm - 1, td);

//         return Math.ceil((toUTC - fromUTC) / 86400000);
//     }

//     return Controller.extend("claima.controller.ManageSub", {

//         // ============================================================
//         // INIT
//         // ============================================================
//         onInit: function () {

//             // ViewModel for selection state
//             const oVM = new JSONModel({
//                 hasSelection: false
//             });

//             this.getView().setModel(oVM, "vm");

//             // Recalculate after model load
//             const oModel = this.getView().getModel();
//             if (oModel && oModel.attachRequestCompleted) {
//                 oModel.attachRequestCompleted(() => this._recalc());
//             } else {
//                 this._recalc();
//             }
//         },

//         // ============================================================
//         // BUTTON: Open dialog
//         // ============================================================
//         onAdd: function () {
//             this.byId("dlgAdd").open();
//         },

//         // ============================================================
//         // BUTTON: Cancel dialog
//         // ============================================================
//         onCancel: function () {
//             this.byId("dlgAdd").close();

//             // clear fields
//             this.byId("inpUser").setValue("");
//             this.byId("drs").setDateValue(null);
//             this.byId("drs").setSecondDateValue(null);
//         },

//         // ============================================================
//         // BUTTON: Save new substitute
//         // ============================================================
//         onSave: function () {

//             const sUser = this.byId("inpUser").getValue().trim();
//             const oDRS = this.byId("drs");

//             const dStart = oDRS.getDateValue();
//             const dEnd = oDRS.getSecondDateValue();

//             if (!sUser || !dStart || !dEnd) {
//                 MessageToast.show(this._i18n("pleaseProvideAll"));
//                 return;
//             }

//             if (dEnd < dStart) {
//                 MessageToast.show(this._i18n("endBeforeStart"));
//                 return;
//             }

//             const toISO = (d) => d.toISOString().slice(0, 10);

//             const oNew = {
//                 UserId: sUser,
//                 Status: "Inactive",
//                 StartDate: toISO(dStart),
//                 EndDate: toISO(dEnd)
//             };

//             const oModel = this.getView().getModel();
//             const aList = oModel.getProperty("/Substitutes") || [];

//             aList.push(oNew);
//             oModel.setProperty("/Substitutes", aList);

//             this._recalc();
//             this.onCancel();

//             MessageToast.show(this._i18n("created"));
//         },

//         // ============================================================
//         // TABLE: Row selection
//         // ============================================================
//         onSelectionChange: function (oEvent) {
//             const bHasSelection = !!oEvent.getSource().getSelectedItem();
//             this.getView().getModel("vm").setProperty("/hasSelection", bHasSelection);
//         },

//         // ============================================================
//         // BUTTON: Delete selected row
//         // ============================================================
//         onDelete: function () {
//             const oTable = this.byId("tblSubs");
//             const oItem = oTable.getSelectedItem();

//             if (!oItem) {
//                 MessageToast.show(this._i18n("nothingSelected"));
//                 return;
//             }

//             MessageBox.confirm(
//                 this._i18n("confirmDeleteMsg"),
//                 {
//                     title: this._i18n("confirmDeleteTitle"),
//                     actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
//                     emphasizedAction: MessageBox.Action.OK,
//                     onClose: (sAction) => {
//                         if (sAction === MessageBox.Action.OK) {
//                             this._deleteItem(oItem);
//                         }
//                     }
//                 }
//             );
//         },

//         _deleteItem: function (oItem) {
//             const oCtx = oItem.getBindingContext();
//             const oModel = this.getView().getModel();

//             const sPath = oCtx.getPath();       // e.g. "/Substitutes/1"
//             const iIndex = sPath.split("/").pop();

//             const aList = oModel.getProperty("/Substitutes") || [];
//             aList.splice(iIndex, 1);

//             oModel.setProperty("/Substitutes", aList);

//             this.byId("tblSubs").removeSelections(true);
//             this.getView().getModel("vm").setProperty("/hasSelection", false);

//             this._recalc();
//             MessageToast.show(this._i18n("deleted"));
//         },

//         // ============================================================
//         // STATUS CALCULATION FOR TABLE
//         // ============================================================
//         _recalc: function () {

//             const oModel = this.getView().getModel();
//             const aList = oModel.getProperty("/Substitutes") || [];

//             const todayISO = new Date().toISOString().slice(0, 10);

//             aList.forEach(obj => {

//                 const dToStart = daysBetweenISO(todayISO, obj.StartDate);
//                 const dToEnd = daysBetweenISO(todayISO, obj.EndDate);

//                 if (dToStart > 0) {
//                     obj.Status = "Inactive";
//                     // formatter will produce "Starts in X days"
//                 }
//                 else if (dToStart <= 0 && dToEnd >= 0) {
//                     obj.Status = "Active";
//                     // formatter will produce "Ends in X days"
//                 }
//                 else if (dToEnd < 0) {
//                     obj.Status = "Inactive";
//                 }
//             });

//             oModel.setProperty("/Substitutes", aList);
//         },

//         // ============================================================
//         // UTIL: i18n loader
//         // ============================================================
//         _i18n: function (sKey) {
//             return this.getView()
//                        .getModel("i18n")
//                        .getResourceBundle()
//                        .getText(sKey);
//         }
//     });
// });
