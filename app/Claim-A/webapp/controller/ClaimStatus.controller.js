sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("claima.controller.ClaimStatus", {

    onInit: function () {

      // set employee model alias
      if (!this.getView().getModel("employee")) {
        const oDefault = this.getOwnerComponent().getModel();
        if (oDefault) {
          this.getView().setModel(oDefault, "employee");
        }
      }

      const oComp = this.getOwnerComponent();

      // ensure models exist at component level
      if (!oComp.getModel("claimsubmission_input")) {
        oComp.setModel(new JSONModel(), "claimsubmission_input");
      }
    },

    //---------------------------------------------------------------------
    // Build key path for OData read
    //---------------------------------------------------------------------
    _getClaimHeaderKeyPath: function (sClaimId) {
      if (!sClaimId) throw new Error("Missing Claim ID");
      return `/ZCLAIM_HEADER('${encodeURIComponent(String(sClaimId))}')`;
    },

    //---------------------------------------------------------------------
    // Main Row Press Handler
    //---------------------------------------------------------------------
    onRowPress: async function (oEvent) {

      const oItem = oEvent.getParameter("listItem");
      const oCtx = oItem && oItem.getBindingContext("employee");
      if (!oCtx) {
        MessageToast.show("No context found.");
        return;
      }

      const oModel = this.getView().getModel("employee");
      const oComp = this.getOwnerComponent();

      try {
        this.getView().setBusy(true);

        const oRow = await oCtx.requestObject();
        const sClaimId = String(oRow.CLAIM_ID || "").trim();
        if (!sClaimId) {
          MessageToast.show("Selected row has no CLAIM_ID.");
          return;
        }

        // Read full header + items
        const sKey = this._getClaimHeaderKeyPath(sClaimId);

        const oCtxHeader = oModel.bindContext(sKey, null, {
          $select:
            "CLAIM_ID,PURPOSE,LOCATION,STATUS_ID,TOTAL_CLAIM_AMOUNT," +
            "COST_CENTER,ALTERNATE_COST_CENTER,EVENT_START_DATE,EVENT_END_DATE," +
            "TRIP_START_DATE,TRIP_END_DATE,CASH_ADVANCE_AMOUNT,COMMENT",

          $expand: {
            ZCLAIM_ITEM: {
              $select:
                "TRIP_START_DATE,RECEIPT_NUMBER,CLAIM_TYPE_ITEM_ID,AMOUNT," +
                "CLAIM_CATEGORY"
            }
          }
        }).getBoundContext();

        const oHeaderFull = await oCtxHeader.requestObject();
        const oHeaderData = {
          claim_id: oHeaderFull.CLAIM_ID,
          purpose: oHeaderFull.PURPOSE || "",
          trip_start_date: oHeaderFull.TRIP_START_DATE || null,
          trip_end_date: oHeaderFull.TRIP_END_DATE || null,
          event_start_date: oHeaderFull.EVENT_START_DATE || null,
          event_end_date: oHeaderFull.EVENT_END_DATE || null,
          comment: oHeaderFull.COMMENT || "",
          location: oHeaderFull.LOCATION || "",
          cost_center: oHeaderFull.COST_CENTER || "",
          alternate_cost_center: oHeaderFull.ALTERNATE_COST_CENTER || "",
          total_claim_amount: oHeaderFull.TOTAL_CLAIM_AMOUNT || 0,
          cash_advance_amount: oHeaderFull.CASH_ADVANCE_AMOUNT || 0,
          final_amount_to_receive: oHeaderFull.FINAL_AMOUNT_RECEIVE || 0,

          descr: {
            purpose: oHeaderFull.PURPOSE || "",
            cost_center: "",
            alternate_cost_center: "",
            status_id: oHeaderFull.STATUS_ID || ""
          }
        };

        const aItems = (oHeaderFull.ZCLAIM_ITEM || []).map((x, i) => ({
          claim_sub_id: String(i + 1).padStart(3, "0"),
          start_date: x.TRIP_START_DATE || null,
          receipt_number: x.RECEIPT_NUMBER || "",
          amount: Number(x.AMOUNT || 0),
          currency: "MYR",
          claim_type_item_id: x.CLAIM_TYPE_ITEM_ID || "",
          staff_category: x.CLAIM_CATEGORY || "",

          descr: {
            claim_type_item_id: x.CLAIM_TYPE_ITEM_ID || "",
            claim_category: x.CLAIM_CATEGORY || ""
          }
        }));

        //-----------------------------------------------------------------
        //  — Build Final claimsubmission_input Model
        //-----------------------------------------------------------------
        const oClaimSubmissionInput = {
          claim_header: oHeaderData,
          claim_items: aItems,
          claim_items_count: aItems.length
        };

        oComp.getModel("claimsubmission_input").setData(oClaimSubmissionInput);

        //-----------------------------------------------------------------
        //  — Navigate to Claim Submission Page
        //-----------------------------------------------------------------

        // === NAVIGATION (inside onRowPress) ===
        var oRootView = this.getOwnerComponent().getRootControl();
        if (!oRootView) {
          console.error("Root view not available");
          return;
        }

        var oPageContainer = oRootView.byId("pageContainer");
        var oClaimSubmission = oRootView.byId("navcontainer_claimsubmission");

        if (!oPageContainer) {
          console.error("Cannot find pageContainer in App.view");
          MessageToast.show("Navigation container not found.");
          return;
        }

        if (!oClaimSubmission) {
          console.error("Cannot find navcontainer_claimsubmission in App.view");
          MessageToast.show("Claim Submission page not found.");
          return;
        }

        oPageContainer.to(oClaimSubmission);


      } catch (err) {
        console.error("onRowPress error:", err);
        MessageToast.show("Failed to load claim header/items.");
      } finally {
        this.getView().setBusy(false);
      }
    }
  });
});