sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("claima.controller.ClaimStatus", {

    onInit: function () {
      // Ensure the named 'employee' model is available on the view.
      // If your Component sets only a default model, alias it here.
      if (!this.getView().getModel("employee")) {
        const oDefault = this.getOwnerComponent().getModel(); // default OData V4
        if (oDefault) {
          this.getView().setModel(oDefault, "employee");
        }
      }

      // Ensure 'current' and 'items' JSON models exist at component-level
      // so the detail view (route target) can read them after navigation.
      const oComp = this.getOwnerComponent();
      if (!oComp.getModel("current")) {
        oComp.setModel(new JSONModel(), "current");
      }
      if (!oComp.getModel("items")) {
        oComp.setModel(new JSONModel({ results: [] }), "items");
      }
    },

    // Reused from your App controller with minimal adjustments:
    _getClaimHeaderKeyPath: function (sClaimId, bIsNumericKey = false) {
      if (!sClaimId) throw new Error("Missing Claim ID");
      return bIsNumericKey
        ? `/ZCLAIM_HEADER(${Number(sClaimId)})`
        : `/ZCLAIM_HEADER('${encodeURIComponent(String(sClaimId))}')`;
    },

    _mapHeaderToCurrent: function (row) {
      const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
      const toYMD = (d) => {
        if (!d) return "";
        if (d instanceof Date) return fmt.format(d);
        if (typeof d === "string") return d;
        return "";
      };

      return {
        id: row.CLAIM_ID,
        location: row.LOCATION || "",
        costcenter: row.COST_CENTER || "",
        altcc: row.ALTERNATE_COST_CENTER || row.ALTERNATE_COST_CENTRE || "",
        total: row.TOTAL_CLAIM_AMOUNT ?? row.TOTAL ?? "",
        cashadv: row.CASH_ADVANCE_AMOUNT ?? row.CASH_ADVANCE ?? "",
        finalamt: row.FINAL_AMOUNT_RECEIVE ?? "",
        report: {
          id: row.CLAIM_ID,
          purpose: row.PURPOSE || row.CATEGORY || "",
          receipt_no: row.RECEIPT_NUMBER || "",
          startdate: toYMD(row.TRIP_START_DATE),
          enddate: toYMD(row.TRIP_END_DATE),
          location: row.LOCATION || "",
          comment: row.COMMENT || "",
          amt_approved: row.AMOUNT || "",
          claim_type_item: row.CLAIM_TYPE_ITEM_ID || ""
        }
      };
    },

    onRowPress: async function (oEvent) {
      const oItem = oEvent.getParameter("listItem");
      const oListCtx = oItem && oItem.getBindingContext("employee");
      if (!oListCtx) { sap.m.MessageToast.show("No context found."); return; }

      const oModel = this.getView().getModel("employee"); // OData V4 model
      const oRouter = this.getOwnerComponent().getRouter();

      try {
        this.getView().setBusy(true);

        const oRow = await oListCtx.requestObject();
        const sClaimId = String(oRow.CLAIM_ID || "").trim();
        if (!sClaimId) { sap.m.MessageToast.show("Selected row has no CLAIM_ID."); return; }

        // Read full header + items with $select / $expand
        const sKeyPath = this._getClaimHeaderKeyPath(sClaimId);
        const oCtxHeader = oModel.bindContext(sKeyPath, null, {
          $select: `CLAIM_ID,PURPOSE,LOCATION,STATUS_ID,TOTAL_CLAIM_AMOUNT,COST_CENTER,ALTERNATE_COST_CENTER,EVENT_START_DATE,EVENT_END_DATE,TRIP_START_DATE,TRIP_END_DATE,CASH_ADVANCE_AMOUNT,COMMENT`,
          $expand: {
            ZCLAIM_ITEM: {
              $select: `TRIP_START_DATE,RECEIPT_NUMBER,CLAIM_TYPE_ITEM_ID,AMOUNT,CLAIM_CATEGORY`
            }
          }
        }).getBoundContext();

        const oHeaderFull = await oCtxHeader.requestObject();

        // Map to shared models (component-level)
        const oComp = this.getOwnerComponent();
        const oCurrent = oComp.getModel("current");
        const oItems = oComp.getModel("items");

        oCurrent.setData(this._mapHeaderToCurrent(oHeaderFull));

        const aItems = (oHeaderFull.ZCLAIM_ITEM || []).map(x => ({
          START_DATE: x.TRIP_START_DATE || null,
          RECEIPT_NO: x.RECEIPT_NUMBER || "",
          CLAIM_TYPE_ITEM: x.CLAIM_TYPE_ITEM_DESC || x.CLAIM_TYPE_ITEM || x.CLAIM_TYPE_ITEM_ID || "",
          CLAIM_ITEM_ID: x.CLAIM_TYPE_ITEM_ID || "",
          AMOUNT: Number(x.AMOUNT || 0),
          CURRENCY: x.CURRENCY || "MYR",
          STAFF_CATEGORY: x.CLAIM_CATEGORY || ""
        }));
        oItems.setData({ results: aItems });

        // Navigate to your detail target (adjust the route name to your app)
        // Option A: pass ID via route and let the detail view fetch (clean)
        // oRouter.navTo("ClaimDetail", { claimId: encodeURIComponent(sClaimId) });

        // Option B: since we already set 'current' & 'items', just route without params
        oRouter.navTo("ClaimStatusDetail");

      } catch (e) {
        jQuery.sap.log.error("onRowPress error: " + e);
        sap.m.MessageToast.show("Failed to load claim header/items.");
      } finally {
        this.getView().setBusy(false);
      }
    }
  });
});