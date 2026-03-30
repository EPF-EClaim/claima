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
        
        /**
         * Get Hana Date format for binding calls
         */
		getHanaDate: function (dDateInput) {
			if (dDateInput) {
				var dDate = new Date(dDateInput);
				var sDateString = dDate.getFullYear() + '-' + ('0' + (dDate.getMonth() + 1)).slice(-2) + '-' + ('0' + dDate.getDate()).slice(-2);
				return sDateString;
			} else {
				return null;
			}
		},

        /**
         * Merge Date and Time
         */
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
        },

        calculateNumberOfDays: function(oHeader, oItem) {
			const dHeaderStart = oHeader.tripstartdate ? new Date(oHeader.tripstartdate) : null;
			const dHeaderEnd = oHeader.tripenddate ? new Date(oHeader.tripenddate) : null;

			const dItemStart = oItem.start_date ? new Date(oItem.start_date) : null;
			const dItemEnd = oItem.end_date ? new Date(oItem.end_date) : null;

			const dFinalStart = dItemStart || dHeaderStart;
			const dFinalEnd = dItemEnd || dHeaderEnd;

			if (!dFinalStart || !dFinalEnd || isNaN(dFinalStart.getTime()) || isNaN(dFinalEnd.getTime())) {
				return 0;
			}

			const iStartMidnight = new Date(dFinalStart).setHours(0, 0, 0, 0);
			const iEndMidnight = new Date(dFinalEnd).setHours(0, 0, 0, 0);

			let iDiffDays = 0;

			if (iEndMidnight >= iStartMidnight) {
				const iMsPerDay = 1000 * 60 * 60 * 24;
				iDiffDays = Math.floor((iEndMidnight - iStartMidnight) / iMsPerDay) + 1;
			}

			return iDiffDays;
		}
    };
});