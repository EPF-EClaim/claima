sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/BusyIndicator"
], function (Controller, MessageToast, MessageBox, BusyIndicator) {
  "use strict";

  const asStr = v => (v == null ? "" : String(v));

  return Controller.extend("claima.controller.SendingIS", {

    // Get input ID (REQ or CLM)
    _getId: function () {
      return (this.byId("claimIdField").getValue() || "").trim().toUpperCase();
    },

    // SMART SENDER: Determines automatically REQ or CLM
    onSendByIdSmart: async function () {
      try {
        const id = this._getId();
        if (!id) {
          MessageToast.show("Please enter an ID");
          return;
        }

        BusyIndicator.show(0);

        const oModel = this.getView().getModel("employee_view");

        // ================================
        // REQxxxxx → Pre-Approval Email
        // ================================
        if (id.startsWith("REQ")) {
          let ctx = oModel.bindContext("/sendPreApprovalEmailByRequestId(...)");
          // If UI5 ever throws “Unknown operation”, use namespaced:
          // ctx = oModel.bindContext("/ECLAIM_VIEW_SRV.sendPreApprovalEmailByRequestId(...)");

          ctx.setParameter("PREAPPROVAL_ID", asStr(id));

          await ctx.invoke();
          const out = ctx.getBoundContext().getObject();

          MessageToast.show(
            out?.success
              ? `Pre‑approval email sent for ${id}.`
              : out?.message || `Triggered for ${id}.`
          );

          return;
        }

        // ================================
        // CLMxxxxx → Combined email + claims
        // ================================
        if (id.startsWith("CLM")) {
          let ctx = oModel.bindContext("/sendEmailAndClaimById(...)");
          // If needed:
          // ctx = oModel.bindContext("/ECLAIM_VIEW_SRV.sendEmailAndClaimById(...)");

          ctx.setParameter("CLAIM_ID", asStr(id));

          await ctx.invoke();
          const out = ctx.getBoundContext().getObject();

          MessageToast.show(
            out?.success
              ? `Approval email & ${out.claimsCount} claim item(s) sent for ${id}.`
              : out?.message || `Triggered for ${id}.`
          );

          return;
        }

        // ================================
        // If neither REQ nor CLM
        // ================================
        MessageToast.show("Unknown ID type. Use REQ… for pre‑approval, CLM… for claim.");

      } catch (e) {
        MessageBox.error("Send failed: " + (e?.message || e));
      } finally {
        BusyIndicator.hide();
      }
    }

  });
});