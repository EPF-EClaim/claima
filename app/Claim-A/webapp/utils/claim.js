sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (MessageToast, Filter, FilterOperator, Sorter) {
  "use strict";

  // ------------------------------ helpers ------------------------------

  function parseKeyFromV4Path(path, keyProp) {
    // e.g. "/ZEMP_CLAIM_HEADER_VIEW(CLAIM_ID='12345')"
    const re = new RegExp("\\(.*" + keyProp + "='([^']+)'.*\\)");
    const m = re.exec(path || "");
    return m ? m[1] : null;
  }

  function getClaimInputModel(controller) {
    let oModel = controller.getView()?.getModel("claimsubmission_input");
    if (oModel) return oModel;

    oModel = controller.getOwnerComponent().getModel("claimsubmission_input");
    if (oModel) return oModel;

    oModel = new sap.ui.model.json.JSONModel({
      claim_header: {},
      claim_items: [],
      claim_items_count: 0
    });
    controller.getOwnerComponent().setModel(oModel, "claimsubmission_input");
    return oModel;
  }

  function mapClaimHeaderToForm(o) {
    return {
      purpose: o.PURPOSE || "",
      claim_id: o.CLAIM_ID || "",
      trip_start_date: o.TRIP_START_DATE || "",
      trip_end_date: o.TRIP_END_DATE || "",
      event_start_date: o.EVENT_START_DATE || "",
      event_end_date: o.EVENT_END_DATE || "",
      comment: o.COMMENT || "",
      location: o.LOCATION || "",
      cost_center: o.COST_CENTER || "",
      alternate_cost_center: o.ALTERNATE_COST_CENTER || "",
      status_id: o.STATUS || "",
      total_claim_amount: o.TOTAL_CLAIM_AMOUNT || 0,
      cash_advance_amount: o.CASH_ADVANCE_AMOUNT || 0,
      final_amount_to_receive: o.FINAL_AMOUNT_TO_RECEIVE || 0
    };
  }

  function waitForModel(controller, name) {
    return new Promise((resolve) => {
      const check = () => {
        const m = controller.getOwnerComponent().getModel(name);
        if (m) { resolve(m); } else { setTimeout(check, 40); }
      };
      check();
    });
  }

  async function ensureModelReady(controller, name) {
    const oModel = await waitForModel(controller, name);
    // V4
    if (oModel?.getMetaModel?.()?.requestObject) {
      try {
        await oModel.getMetaModel().requestObject("/$EntityContainer");
      } catch (e) {
        await oModel.getMetaModel().requestObject("/");
      }
      return oModel;
    }
    // V2
    if (oModel?.metadataLoaded) {
      await oModel.metadataLoaded();
    }
    return oModel;
  }

  // ------------------------------ data loading ------------------------------

  async function loadClaimById({ controller, claimId }) {
    const oClaimInput = getClaimInputModel(controller);
    const oModel = await ensureModelReady(controller, "employee_view");
    const aFilters = [ new Filter("CLAIM_ID", FilterOperator.EQ, String(claimId)) ];

    const oHeaderBinding = oModel.bindList(
      "/ZEMP_CLAIM_HEADER_VIEW",
      null, null, aFilters,
      {
        $$ownRequest: true, $count: true,
        $select: [
          "CLAIM_ID", "REQUEST_ID", "PURPOSE", "TRIP_START_DATE", "TRIP_END_DATE",
          "EVENT_START_DATE", "EVENT_END_DATE", "COMMENT", "LOCATION", "COST_CENTER",
          "ALTERNATE_COST_CENTER", "STATUS_ID", "STATUS_DESC",
          "TOTAL_CLAIM_AMOUNT", "PREAPPROVED_AMOUNT", "CASH_ADVANCE_AMOUNT", "FINAL_AMOUNT_TO_RECEIVE"
        ]
      }
    );

    const oItemBinding = oModel.bindList(
      "/ZEMP_CLAIM_ITEM_VIEW",
      null, [ new Sorter("CLAIM_SUB_ID", false) ], aFilters,
      {
        $$ownRequest: true, $count: true,
        $select: [
          "CLAIM_ID", "CLAIM_SUB_ID", "START_DATE", "RECEIPT_NUMBER",
          "CLAIM_TYPE_ID", "CLAIM_TYPE_ITEM_ID", "AMOUNT", "CLAIM_CATEGORY"
        ]
      }
    );

    try {
      const [aHeaderCtx, aItemCtx] = await Promise.all([
        oHeaderBinding.requestContexts(0, 1),
        oItemBinding.requestContexts(0, Infinity)
      ]);

      const oHeaderRaw = aHeaderCtx[0]?.getObject();
      if (!oHeaderRaw) {
        MessageToast.show("No claim header found for the selected item.");
        oClaimInput.setProperty("/claim_header", {});
        oClaimInput.setProperty("/claim_items", []);
        oClaimInput.setProperty("/claim_items_count", 0);
        return { header: null, items: [] };
      }

      const oHeader = mapClaimHeaderToForm(oHeaderRaw);
      oClaimInput.setProperty("/claim_header", oHeader);

      const aItems = aItemCtx
        .map(ctx => ctx.getObject())
        .map(it => ({
          claim_sub_id: it.CLAIM_SUB_ID,
          start_date: it.START_DATE,
          receipt_number: it.RECEIPT_NUMBER,
          amount: it.AMOUNT != null ? parseFloat(it.AMOUNT) : 0,
          descr: {
            claim_type_id: it.CLAIM_TYPE_ID || "",
            claim_type_item_id: it.CLAIM_TYPE_ITEM_ID || "",
            claim_category: it.CLAIM_CATEGORY || ""
          }
        }));

      const nTotal = aItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      if (!oHeader.total_claim_amount) {
        oClaimInput.setProperty("/claim_header/total_claim_amount", nTotal);
      }

      oClaimInput.setProperty("/claim_items", aItems);
      oClaimInput.setProperty("/claim_items_count", aItems.length);

      return { header: oHeaderRaw, items: aItems };
    } catch (err) {
      // log & reset
      console.error("Failed to load claim header/items:", err);
      oClaimInput.setProperty("/claim_header", {});
      oClaimInput.setProperty("/claim_items", []);
      oClaimInput.setProperty("/claim_items_count", 0);
      return { header: null, items: [] };
    }
  }

  // ------------------------------ navigation (fragment) ------------------------------

  async function openClaimDialog({ controller, fragmentName, fragmentId }) {
    if (!controller._claimSubmissionDialog) {
      controller._claimSubmissionDialog = await controller.loadFragment({ name: fragmentName, id: fragmentId });
      controller.getView().addDependent(controller._claimSubmissionDialog);
    }
    controller._claimSubmissionDialog.open();
  }

  async function navToClaimPage({
    controller,
    navContainerId = "pageContainer",
    pageId = "navcontainer_claimsubmission",
    fragmentNameIfMissing // if page not found, load a fragment that returns a sap.m.Page
  }) {
    const oRootView = controller.getOwnerComponent().getRootControl();
    if (!oRootView) throw new Error("Root view not available");

    const oPageContainer = oRootView.byId(navContainerId);
    if (!oPageContainer) throw new Error(`NavContainer '${navContainerId}' not found`);

    let page = oRootView.byId(pageId);

    if (!page && fragmentNameIfMissing) {
      page = await controller.loadFragment({ name: fragmentNameIfMissing });
      oPageContainer.addPage(page);
    }

    if (!page) {
      MessageToast.show("Claim Submission page not found.");
      return;
    }

    oPageContainer.to(page);
  }

  // ------------------------------ main entry: onRowPress ------------------------------

  async function onRowPress({
    controller,
    event,
    modelName = "employee_view",
    keyProp = "CLAIM_ID",
    listId, 

    fragmentDialogName, fragmentDialogId,               
    navContainerId, pageId, fragmentNameIfMissing       
  }) {
    const view = controller.getView();
    try {
      view?.setBusy(true);

      const item = event?.getParameter?.("listItem");
      let ctx =
        item?.getBindingContext(modelName) ||
        item?.getBindingContext("claim_status2") ||
        item?.getBindingContext("request_status") ||
        item?.getBindingContext() || null;

      if (!ctx && listId) {
        const oTable = controller.byId(listId);
        const oSelected = oTable?.getSelectedItem?.();
        if (oSelected) {
          ctx =
            oSelected.getBindingContext(modelName) ||
            oSelected.getBindingContext("claim_status2") ||
            oSelected.getBindingContext("request_status") ||
            oSelected.getBindingContext();
        }
      }

      if (!ctx) { MessageToast.show("Select a claim to open"); return; }

      let id = ctx.getProperty(keyProp) || parseKeyFromV4Path(ctx.getPath?.(), keyProp);
      if (!id) { MessageToast.show(`${keyProp} is missing on the selected row.`); return; }

      // 1) Load data
      await loadClaimById({ controller, claimId: String(id) });

      // 2) Navigate: Dialog or Page
      if (fragmentDialogName) {
        await openClaimDialog({ controller, fragmentName: fragmentDialogName, fragmentId: fragmentDialogId });
        return;
      }

      if (navContainerId && pageId) {
        await navToClaimPage({ controller, navContainerId, pageId, fragmentNameIfMissing });
        return;
      }

      MessageToast.show("No navigation mode provided.");
    } catch (e) {
      console.error("onRowPress failed:", e);
      MessageToast.show("Failed to open the selected claim.");
    } finally {
      view?.setBusy(false);
    }
  }

  // ------------------------------ public API ------------------------------

  return {
    onRowPress,
    loadClaimById,
    navToClaimPage,
    openClaimDialog,
    ensureModelReady // exported in case you need it elsewhere
  };
});