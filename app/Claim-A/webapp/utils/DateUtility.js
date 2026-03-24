sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    return {

        /**
         * Pad numbers with leading zeros
         */
        pad: function (nNumber, iWidth = 2) {
            return String(nNumber).padStart(iWidth, "0");
        },

        /**
         * Format date using a custom or default pattern
         */
        formatDate: function (vDate, sPattern) {
            if (!vDate) return "";

            const oDate = new Date(vDate);
            if (isNaN(oDate)) return "";

            const oFormatter = DateFormat.getDateInstance({
                pattern: sPattern || "yyyy.MM.dd"
            });

            return oFormatter.format(oDate);
        },

        /**
         * Convert date into YYYY-MM-DD format
         */
        toYMD: function (vDate) {
            if (!vDate) return "";

            const oDate = new Date(vDate);
            if (isNaN(oDate)) return "";

            const sYear = oDate.getFullYear();
            const sMonth = this.pad(oDate.getMonth() + 1);
            const sDay = this.pad(oDate.getDate());

            return `${sYear}-${sMonth}-${sDay}`;
        },

        /**
         * Format date into Timestamp(9) format: YYYY-MM-DD HH:MM:SS.FFFFFF
         */
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

            const sFractional = this.pad(iMillis, 3) + "000000";

            return `${this.pad(iYear, 4)}-${this.pad(iMonth)}-${this.pad(iDay)} `
                + `${this.pad(iHours)}:${this.pad(iMinutes)}:${this.pad(iSeconds)}.${sFractional}`;
        },

        /**
         * Get today's date
         */
        today: function () {
            return new Date();
        },
        
        mergeDateTime (oDate, sTime) {
            const dMergedDate = new Date(oDate.getTime()); 
            
            if (sTime && typeof sTime === "string") {
                const aParts = sTime.split(":");
                if (aParts.length >= 2) {
                    dMergedDate.setHours(parseInt(aParts[0], 10), parseInt(aParts[1], 10), 0, 0);
                }
            } else {
                dMergedDate.setHours(0, 0, 0, 0);
            }
            return dMergedDate;
        }
    };
});