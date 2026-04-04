sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "claima/utils/Constants",
], function (DateFormat, Constants) {
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
         * Get Hana Date format for binding calls, used for passing dates when upserting records
         * @public
         * @param {date} dDateInput - date value to be transformed
         * @return {string} sDateString - readable value when submitting data to backend
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
        mergeDateTime(oDate, sTime) {
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

        calculateNumberOfDays: function (oHeader, oItem) {
            const dHeaderStart = oHeader.tripstartdate ? new Date(oHeader.tripstartdate) : null;
            const dHeaderEnd = oHeader.tripenddate ? new Date(oHeader.tripenddate) : null;

            switch (oItem.claim_type_item_id) {
                case Constants.ClaimTypeItem.TRAVEL_INSURANCE:
                    var dItemStart = oItem.insurance_cert_start_date ? new Date(oItem.insurance_cert_start_date) : null;
                    var dItemEnd = oItem.insurance_cert_end_date ? new Date(oItem.insurance_cert_end_date) : null;
                    break;
                default:
                    dItemStart = oItem.start_date ? new Date(oItem.start_date) : null;
                    dItemEnd = oItem.end_date ? new Date(oItem.end_date) : null;
                    break;
            }

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
        },

        /**
         * Used to return date for Excel download functionality, based on object passed into method
         * @public
         * @param {object} oValue object to be converted into date value
         * @returns {date} returns date
         */
        toDate: function (oValue) {

            if (!oValue) return null;

            // ISO 8601 with or without milliseconds
            if (typeof oValue === "string" && /^\d{4}-\d{2}-\d{2}T/i.test(oValue)) {
                const oDate = new Date(oValue);
                if (!isNaN(oDate.getTime())) {
                    return new Date(Date.UTC(oDate.getUTCFullYear(), oDate.getUTCMonth(), oDate.getUTCDate()));
                }
                return null;
            }

            // YYYY-MM-DD
            if (typeof oValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(oValue)) {
                const [sYear, sMonth, sDay] = oValue.split("-").map(Number);
                return new Date(Date.UTC(sYear, sMonth - 1, sDay));
            }

            // JS Date
            if (oValue instanceof Date && !isNaN(oValue.getTime())) {
                return new Date(Date.UTC(oValue.getFullYear(), oValue.getMonth(), oValue.getDate()));
            }

            // SAP Edm.Date { year, month, day }
            if (typeof oValue === "object" && oValue.year && oValue.month && oValue.day) {
                return new Date(Date.UTC(oValue.year, oValue.month - 1, oValue.day));
            }

            return null;
        },

        /**
         * Used to return time for Excel download functionality, based on object passed into method
         * @public
         * @param {object} oValue object to be converted into date value
         * @returns {date} returns date variable with hours, minutes, seconds populated
         */
        toTime: function (oValue) {

            if (!oValue) return null;

            // ISO 8601 with or without milliseconds
            if (typeof oValue === "string" && /^\d{2}:\d{2}:\d{2}Z/i.test(oValue)) {
                const oDate = new Date(oValue);
                if (!isNaN(oDate.getTime())) {
                    return new Date(Date.UTC(0, 0, 0, oDate.getUTCHours(), oDate.getUTCMinutes(), oDate.getUTCSeconds()));
                }
                return null;
            }

            // HH:MM:SS
            if (typeof oValue === "string" && /^\d{2}:\d{2}:\d{2}$/.test(oValue)) {
                const [sHour, sMinute, sSecond] = oValue.split(":").map(Number);
                return new Date(Date.UTC(0, 0, 0, sHour, sMinute, sSecond));
            }

            // JS Date
            if (oValue instanceof Date && !isNaN(oValue.getTime())) {
                return new Date(Date.UTC(0, 0, 0, oValue.getHours(), oValue.getMinutes(), oValue.getSeconds()));
            }

            return null;
        },


        /**
         * Used for date validation when submitting a Claim Report.  
         * This method checks whether the provided date value represents
         * a future date when compared against the current system date.
         *
         * @public
         * @param {Date} sDate date value to be validated
         * @returns {boolean} returns true if the given date is greater than today's date;
         *                    otherwise returns false
         */

        isFutureDate: function (sDate) {
            const dDate = new Date(sDate);
            if (!sDate || isNaN(dDate)) return false;

            return dDate.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);
        },

        /**
         * Determines the minimum allowable date for specific date fields
         * based on submission type (REQUEST/CLAIM) & the following parameters.
         *
         * @param {string} sFieldName - The field name (e.g., RECEIPT_DATE, BILL_DATE).
         * @param {string} sId - Submission ID; first 3 chars determine submission type.
         * @param {string} sType - Claim Type.
         * @param {string} sItemType - Claim Item Type.
         * @param {object} oHeader - Header data.
         * @param {object} oItem - Item data.
         * @returns {Date|null} Minimum allowed date or null if invalid input.
         *
        **/
        determineMinDate: function (sFieldName, sId, sType, sItemType, oHeader, oItem) {
            if (!sId || !sType || !sItemType) return null;

            var _oAppModel = this.getOwnerComponent().getModel("appModel");
            var _oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            const _sSubmissionType = sId.substring(0, 3);
            var _dMinDate = new Date();

            switch (sFieldName) {
                case Constants.EntitiesFields.RECEIPT_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // Specific Claim Type
                            if (sItemType === Constants.ClaimTypeItem.VISA) {
                                // VISA related logic 
                                _dMinDate = null;
                            } else {
                                // Other Claim Type
                                _dMinDate = null;
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_receiptdate_mindate"));
                            }
                            break;
                    }
                    break;
                case Constants.EntitiesFields.END_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // set min date based on start date
                            if (Object.values(Constants.ClaimTypeKursus).includes(sItemType)) {
                                if (!!new Date(oItem["start_date"]).getTime()) {
                                    _dMinDate = new Date(oItem["start_date"]);
                                    // minus 1 day for course code claims
                                    _dMinDate.setDate(_dMinDate.getDate() - 1);
                                }
                                else {
                                    _dMinDate = null;
                                    oItem["start_date"] = null;
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_end_date_mindate"));
                                break;
                            }
                    }
                    break;
                case Constants.EntitiesFields.INSURANCE_CERT_END_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // set min date based on insurance cert start date
                            if (sItemType === Constants.ClaimTypeItem.TRAVEL_INSURANCE) {
                                if (!!new Date(oItem["insurance_cert_start_date"]).getTime()) {
                                    _dMinDate = new Date(oItem["insurance_cert_start_date"]);
                                }
                                else {
                                    _dMinDate = null;
                                    oItem["insurance_cert_start_date"] = null;
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_insurance_cert_end_date_mindate"));
                            }
                            break;
                    }
                    break;
            }
            if (_dMinDate !== null) {
                _dMinDate.setHours(0, 0, 0, 0);
            }
            return _dMinDate;
        },

        /**
         * Determines the maximum allowable date for specific date fields
         * based on submission type (REQUEST/CLAIM) & the following parameters.
         *
         * @param {string} sFieldName - The field name (e.g., RECEIPT_DATE, BILL_DATE).
         * @param {string} sId - Submission ID; first 3 chars determine submission type.
         * @param {string} sType - Claim Type.
         * @param {string} sItemType - Claim Item Type.
         * @param {object} oHeader - Header data.
         * @param {object} oItem - Item data.
         * @returns {Date|null} Maximum allowed date or null if invalid input.
         *
        **/
        determineMaxDate: function (sFieldName, sId, sType, sItemType, oHeader, oItem) {
            if (!sId || !sType || !sItemType) return null;

            var _oAppModel = this.getOwnerComponent().getModel("appModel");
            var _oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            const _sSubmissionType = sId.substring(0, 3);
            var _dMaxDate = new Date();

            switch (sFieldName) {
                case Constants.EntitiesFields.RECEIPT_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // Specific Claim Type
                            if (sItemType === Constants.ClaimTypeItem.VISA) {
                                // VISA related logic 
                                _dMaxDate = new Date(oHeader.trip_start_date);
                                const dPastDate = new Date(_dMaxDate);
                                dPastDate.setDate(dPastDate.getDate() - 90);
                                _dMaxDate = dPastDate;
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("msg_claimsubmission_invalid_visa_date"));

                            } else {
                                // Other Claim Type
                                _dMaxDate = new Date(oHeader.trip_end_date);
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError",
                                    _oResourceBundle.getText("error_receiptdate_maxdate"));
                            }
                            break;
                    }
                    break;
                case Constants.EntitiesFields.BILL_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            _dMaxDate = new Date(oHeader.trip_end_date); // default
                            _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError",
                                _oResourceBundle.getText("error_billdate_maxdate"));
                            break;
                    }
                    break;
                case Constants.EntitiesFields.START_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // set max date based on end date
                            if (Object.values(Constants.ClaimTypeKursus).includes(sItemType)) {
                                if (!!new Date(oItem["end_date"]).getTime()) {
                                    _dMaxDate = new Date(oItem["end_date"]);
                                    // add 1 day for course code claims
                                    _dMaxDate.setDate(_dMaxDate.getDate() + 1);
                                }
                                else {
                                    _dMaxDate = null;
                                    oItem["end_date"] = null;
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_start_date_maxdate"));
                            }
                            break;
                case Constants.EntitiesFields.INSURANCE_CERT_START_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // set max date based on insurance cert end date
                            if (sItemType === Constants.ClaimTypeItem.TRAVEL_INSURANCE) {
                                if (!!new Date(oItem["insurance_cert_end_date"]).getTime()) {
                                    _dMaxDate = new Date(oItem["insurance_cert_end_date"]);
                                }
                                else {
                                    _dMaxDate = null;
                                    oItem["insurance_cert_end_date"] = null;
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_insurance_cert_start_date_maxdate"));
                            }
                            break;
                    }
            }

            if (_dMaxDate !== null) {
                _dMaxDate.setHours(0, 0, 0, 0);
            }
            return _dMaxDate;
        },

        /**
        * Convert various time formats to HANA-compatible HH:mm:ss
        * @public
        * @param {string|number|Date} iTime - time input
        * @returns {string|null} HH:mm:ss or null if invalid
        */
        getHanaTime: function (iTime) {
            if (!iTime) return null;

            var sTime = String(iTime).trim();

            // HH:mm:ss (e.g. "22:52:00")
            if (/^\d{2}:\d{2}:\d{2}$/.test(sTime)) {
                return sTime;
            }

            // HH:mm (e.g. "22:52")
            if (/^\d{2}:\d{2}$/.test(sTime)) {
                return sTime + ":00";
            }

            // 12-hour format (e.g. "10:52 PM" or "10:52:00 PM")
            var oTimeMatch = sTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
            if (oTimeMatch) {
                var nHours = parseInt(oTimeMatch[1], 10);
                var nMinutes = parseInt(oTimeMatch[2], 10);
                var nSeconds = parseInt(oTimeMatch[3] || 0, 10);
                var sMeridiem = oTimeMatch[4].toUpperCase();

                if (sMeridiem === "PM" && nHours !== 12) {
                    nHours += 12;
                }
                if (sMeridiem === "AM" && nHours === 12) {
                    nHours = 0;
                }

                return this.pad(nHours) + ":" + this.pad(nMinutes) + ":" + this.pad(nSeconds);
            }

            // Timestamp / Date fallback
            var oDate = new Date(iTime);
            if (!isNaN(oDate.getTime())) {
                return this.pad(oDate.getHours()) + ":"
                    + this.pad(oDate.getMinutes()) + ":"
                    + this.pad(oDate.getSeconds());
            }

            return null;
        }

    };
});