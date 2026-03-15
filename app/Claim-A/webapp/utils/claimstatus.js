sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (MessageToast, Filter, FilterOperator, Sorter) {
  "use strict";

  // ---- Pure helpers (no UI) ----
  function _mapHeader(oData) {
    return {
      purpose        : oData.OBJECTIVE_PURPOSE      || "",
      reqtype        : oData.REQUEST_TYPE_DESC      || "",
      tripstartdate  : oData.TRIP_START_DATE        || "",
      tripenddate    : oData.TRIP_END_DATE          || "",
      eventstartdate : oData.EVENT_START_DATE       || "",
      eventenddate   : oData.EVENT_END_DATE         || "",
      grptype        : oData.IND_OR_GROUP_DESC      || "",
      location       : oData.LOCATION               || "",
      transport      : oData.TYPE_OF_TRANSPORTATION || "",
      altcostcenter  : oData.ALTERNATE_COST_CENTER  || "",
      doc1           : oData.ATTACHMENT1            || "",
      doc2           : oData.ATTACHMENT2            || "",
      comment        : oData.REMARK                 || "",
      eventdetail1   : oData.EVENT_FIELD1           || "",
      eventdetail2   : oData.EVENT_FIELD2           || "",
      eventdetail3   : oData.EVENT_FIELD3           || "",
      eventdetail4   : oData.EVENT_FIELD4           || "",
      reqid          : oData.REQUEST_ID             || "",
      reqstatus      : oData.STATUS_DESC            || "",
      reqstatus_id   : oData.STATUS_ID              || "",
      costcenter     : oData.COST_CENTER            || "",
      cashadvamt     : oData.CASH_ADVANCE           || 0,
      reqamt         : oData.PREAPPROVAL_AMOUNT     || 0,
      claimtype      : oData.CLAIM_TYPE_ID          || "",
      claimtypedesc  : oData.CLAIM_TYPE_DESC        || "",
      reqdate        : oData.REQUEST_DATE
    };
  }

  async function fetchRequestHeaderById(oV4Model, sReqId) {
    const oListBinding = oV4Model.bindList(
      "/ZEMP_REQUEST_VIEW",
      null,
      null,
      [ new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: sReqId }) ],
      { $$ownRequest: true, $$groupId: "$auto" }
    );
    const aCtx = await oListBinding.requestContexts(0, 1);
    return aCtx[0]?.getObject() || null;
  }

  async function fetchRequestItemsById(oV4Model, sReqId) {
    const oListBinding = oV4Model.bindList(
      "/ZEMP_REQUEST_ITEM_VIEW",
      null,
      [ new Sorter("REQUEST_SUB_ID", false) ],
      [ new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: String(sReqId) }) ],
      { $$ownRequest: true, $$groupId: "$auto", $count: true }
    );
    const aCtx = await oListBinding.requestContexts(0, Infinity);
    const a = aCtx.map(ctx => ctx.getObject());
    a.forEach(it => {
      if (it.EST_AMOUNT != null) it.EST_AMOUNT = parseFloat(it.EST_AMOUNT);
      if (it.EST_NO_PARTICIPANT != null) it.EST_NO_PARTICIPANT = parseInt(it.EST_NO_PARTICIPANT, 10);
    });
    return a;
  }

  // ---- Former controller methods, now util functions ----
  async function openItemFromList({ controller, event, listId, reqModel, reqStatusModel, empViewModel }) {
    const view = controller.getView();
    try {
      view.setBusy(true);

      const oTable = listId ? controller.byId(listId) : null;
      // Prefer event context (model "request")
      let oCtx = event?.getParameter?.("listItem")?.getBindingContext?.("request");
      // Fallback: selected item context (model "request_status")
      if (!oCtx && oTable) {
        const oSelected = oTable.getSelectedItem?.();
        if (oSelected) oCtx = oSelected.getBindingContext?.("request_status");
      }

      if (!oCtx) { MessageToast.show("Select an item to open"); return; }

      const row = oCtx.getObject();
      const sReqId = row?.REQUEST_ID;
      if (!sReqId) { MessageToast.show("Missing REQUEST_ID"); return; }

      const oHeader = await fetchRequestHeaderById(empViewModel, sReqId);
      if (!oHeader) {
        MessageToast.show("No data found for request " + sReqId);
        reqModel.setProperty("/req_header", {});
        return;
      }
      reqModel.setProperty("/req_header", _mapHeader(oHeader));

      const items = await fetchRequestItemsById(empViewModel, sReqId);
      const cashadv_amt = items.reduce((sum, it) => it.CASH_ADVANCE === "YES" ? sum + (Number(it.EST_AMOUNT) || 0) : sum, 0);
      const req_amt     = items.reduce((sum, it) => it.CASH_ADVANCE == null ? sum + (Number(it.EST_AMOUNT) || 0) : sum, 0);

      reqModel.setProperty("/req_item_rows", items);
      reqModel.setProperty("/list_count", items.length);
      reqModel.setProperty("/req_header/cashadvamt", cashadv_amt);
      reqModel.setProperty("/req_header/reqamt", req_amt);

      if (row?.STATUS === "CREATED") reqModel.setProperty("/view", "list");

      controller.getOwnerComponent().getRouter().navTo("RequestForm", { request_id: encodeURIComponent(String(sReqId)) });

    } catch (e) {
      jQuery.sap.log.error("openItemFromList failed: " + e);
      MessageToast.show("Failed to open the selected item.");
      reqModel.setProperty("/req_item_rows", []);
      reqModel.setProperty("/list_count", 0);
    } finally {
      view.setBusy(false);
    }
  }

  // Example: generic row press → navigate using key
  function onRowPress({ controller, event, keyProp, routeName, modelName, paramName }) {
    const item = event.getParameter("listItem");
    const ctx = modelName ? item.getBindingContext(modelName) : item.getBindingContext();
    if (!ctx) { sap.m.MessageToast.show("No context to open"); return; }
    const data = ctx.getObject();
    const key  = data?.[keyProp];
    if (!key) { sap.m.MessageToast.show(`Missing ${keyProp}`); return; }

    const params = {};
    params[paramName || "id"] = encodeURIComponent(String(key));
    controller.getOwnerComponent().getRouter().navTo(routeName, params);
  }

  // Example: search/filter/sort functions you might have had
  function onSearch({ table, query }) {
    const binding = table.getBinding("items");
    if (!binding) return;
    const aFilters = [];
    if (query) {
      aFilters.push(
        new Filter({
          filters: [
            new Filter({ path: "OBJECTIVE_PURPOSE", operator: FilterOperator.Contains, value1: query }),
            new Filter({ path: "STATUS", operator: FilterOperator.Contains, value1: query })
          ],
          and: false
        })
      );
    }
    binding.filter(aFilters);
  }

  function onSort({ table, path, descending }) {
    const binding = table.getBinding("items");
    if (!binding) return;
    binding.sort([ new Sorter(path, !!descending) ]);
  }

  function exportToSpreadsheet({ columns, data, fileName }) {
    return new Promise(function (resolve, reject) {
      sap.ui.require(["sap/ui/export/Spreadsheet"], function (Spreadsheet) {
        const oSheet = new Spreadsheet({
          workbook: { columns },
          dataSource: data,
          fileName: fileName || "export.xlsx"
        });
        oSheet.build().then(function () {
          oSheet.destroy(); resolve();
        }).catch(function (e) {
          oSheet.destroy(); reject(e);
        });
      });
    });
  }

  return {
    // expose everything you need
    openItemFromList,
    onRowPress,
    onSearch,
    onSort,
    exportToSpreadsheet,
    fetchRequestHeaderById,
    fetchRequestItemsById
  };
});