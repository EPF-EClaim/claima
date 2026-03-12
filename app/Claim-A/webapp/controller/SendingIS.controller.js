sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
  "use strict";

function asStr(v) { return (v === null || v === undefined) ? "" : String(v); }

  return Controller.extend("claima.controller.SendingIS", {
   onSendToIS: async function () {
  const table = this.byId("idClaimTable");
  const item = table.getSelectedItem();
  if (!item) {
    sap.m.MessageToast.show("Please select a row first.");
    return;
  }

  const row = item.getBindingContext("employee_view").getObject();
  const oModel = this.getView().getModel("employee_view");

  // Bind action (unbound)
  let oCtx = oModel.bindContext("/sendClaim(...)");

  // Set flat parameters
  oCtx.setParameter("CLAIM_ID", row.CLAIM_ID);
  oCtx.setParameter("CLAIM_SUB_ID", row.CLAIM_SUB_ID);
  oCtx.setParameter("EMP_ID", row.EMP_ID);
  oCtx.setParameter("SUBMITTED_DATE", row.SUBMITTED_DATE);
  oCtx.setParameter("SUBMISSION_TYPE", row.SUBMISSION_TYPE);
  oCtx.setParameter("CASH_ADVANCE_AMOUNT", row.CASH_ADVANCE_AMOUNT);
  oCtx.setParameter("FINAL_AMOUNT_TO_RECEIVE", row.FINAL_AMOUNT_TO_RECEIVE);
  oCtx.setParameter("LAST_MODIFIED_DATE", row.LAST_MODIFIED_DATE);
  oCtx.setParameter("AMOUNT", row.AMOUNT);
  oCtx.setParameter("RECEIPT_DATE", row.RECEIPT_DATE);
  oCtx.setParameter("COST_CENTER", row.COST_CENTER);
  oCtx.setParameter("GL_ACCOUNT", row.GL_ACCOUNT);
  oCtx.setParameter("MATERIAL_CODE", row.MATERIAL_CODE);
  oCtx.setParameter("TRIP_START_DATE", row.TRIP_START_DATE);

  try {
    await oCtx.invoke();  
    sap.m.MessageToast.show("Claim sent to IS.");
  } catch (err) {
    sap.m.MessageBox.error("Send failed: " + err.message);
  }
}
  });
});