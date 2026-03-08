// webapp/model/formatter.js
sap.ui.define([], function () {
  "use strict";

  function daysBetweenISO(fromISO, toISO) {
    if (!fromISO || !toISO) { return NaN; }
    const [fy, fm, fd] = fromISO.split("-").map(Number);
    const [ty, tm, td] = toISO.split("-").map(Number);
    const fromUTC = Date.UTC(fy, fm - 1, fd);
    const toUTC   = Date.UTC(ty, tm - 1, td);
    return Math.ceil((toUTC - fromUTC) / 86400000);
  }

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10); // yyyy-MM-dd
  }

  return {
    // Show localized date from Edm.Date (yyyy-MM-dd)
    displayDate: function (sEdmDate) {
      if (!sEdmDate) { return ""; }
      const [y, m, d] = sEdmDate.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
        year: "2-digit", month: "numeric", day: "numeric"
      });
    },

    statusText: function (sStatus) {
      // If backend doesn’t supply Status, derive a default label
      return sStatus || this.getModel("i18n").getResourceBundle().getText("inactive");
    },

    periodText: function (sStartISO, sEndISO) {
      if (!sStartISO || !sEndISO) { return ""; }
      const rb = this.getModel("i18n").getResourceBundle();
      const tISO = todayISO();
      const toStart = daysBetweenISO(tISO, sStartISO);
      const toEnd   = daysBetweenISO(tISO, sEndISO);

      if (Number.isFinite(toStart) && toStart > 0) {
        // Future
        return rb.getText("startsIn", [toStart]);
      } else if (Number.isFinite(toStart) && toStart <= 0 && Number.isFinite(toEnd) && toEnd >= 0) {
        // Active now
        return rb.getText("endsIn", [toEnd]); // Add key endsIn in i18n
      } else if (Number.isFinite(toEnd) && toEnd < 0) {
        return rb.getText("ended"); // Add key ended in i18n
      }
      return "";
    }
  };
});