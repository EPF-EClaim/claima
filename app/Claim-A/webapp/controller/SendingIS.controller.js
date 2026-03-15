sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
  "use strict";
  return Controller.extend("claima.controller.SendingIS", {
    onSendToIS: async function () {
      const table = this.byId("idClaimTable");
      const item = table.getSelectedItem();
      if (!item) {
        MessageToast.show("Please select a row first.");
        return;
      }
      const row = item.getBindingContext().getObject();
      const payload = { row }; // matches action signature: sendClaimView(row: ClaimViewRow)
      try {
        const res = await fetch("/odata/v4/eclaim-view-srv/ApprovedClaims_SF_DEV", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          const msg = data?.message || (await res.text());
          MessageBox.error(`Send failed (${res.status}): ${msg}`);
          return;
        }
        MessageToast.show("Row sent to Integration Suite!");
      } catch (e) {
        MessageBox.error(`Unexpected error: ${e.message}`);
      }
    }
  });
});
