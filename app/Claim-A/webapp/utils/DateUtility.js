sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    const fnPad = function (nNumber, iWidth = 2) {
        return String(nNumber).padStart(iWidth, "0");
    };

    const DateUtility = {

        formatDate: function (vDate, sPattern) {
            if (!vDate) return "";

            const oDate = new Date(vDate);
            if (isNaN(oDate)) return "";

            const oFormatter = DateFormat.getDateInstance({
                pattern: sPattern || "yyyy.MM.dd"
            });

            return oFormatter.format(oDate);
        },

        toYMD: function (vDate) {
            if (!vDate) return "";

            const oDate = new Date(vDate);
            if (isNaN(oDate)) return "";

            const sYear = oDate.getFullYear();
            const sMonth = fnPad(oDate.getMonth() + 1);
            const sDay = fnPad(oDate.getDate());

            return `${sYear}-${sMonth}-${sDay}`;
        },

        formatTimestamp9: function (vDate, oOptions = { utc: true }) {
            const oDate = vDate ? new Date(vDate) : new Date();
            if (isNaN(oDate)) return "";

            const bUTC = oOptions.utc;

            const iYear = bUTC ? oDate.getUTCFullYear() : oDate.getFullYear();
            const iMonth = bUTC ? oDate.getUTCMonth() + 1 : oDate.getMonth() + 1;
            const iDay = bUTC ? oDate.getUTCDate() : oDate.getDate();
            const iHours = bUTC ? oDate.getUTCHours() : oDate.getHours();
            const iMinutes = bUTC ? oDate.getUTCMinutes() : oDate.getMinutes();
            const iSeconds = bUTC ? oDate.getUTCSeconds() : oDate.getSeconds();
            const iMillis = bUTC ? oDate.getUTCMilliseconds() : oDate.getMilliseconds();

            const sFractional = fnPad(iMillis, 3) + "000000";

            return `${fnPad(iYear, 4)}-${fnPad(iMonth)}-${fnPad(iDay)} `
                + `${fnPad(iHours)}:${fnPad(iMinutes)}:${fnPad(iSeconds)}.${sFractional}`;
        },

        today: function () {
            return new Date();
        }
    };

    return DateUtility;
});