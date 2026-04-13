sap.ui.define([
    "sap/ui/core/format/DateFormat",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"claima/utils/Constants",
	"claima/utils/Utility"
], function (
    DateFormat,
    Sorter,
	Filter,
	FilterOperator,
	BusyIndicator,
    MessageBox,
	Constants,
    Utility
) {
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
         * Convert to local datetime
         */
        convertUTCToLocal: function(dUTCDate) {
            return !!dUTCDate ? new Date(dUTCDate).toLocaleString() : dUTCDate;  //converts UTC → local timezone
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
         * Calculate number of days between given date range based on claim type item
         * @public
         * @param {string} sSubmissionType - whether data is processed based on claim or request submission type
         * @param {object} oHeader - header data retrieved
         * @param {object} oItem - item data retrieved
         * @return {integer} iDiffDays - difference in days between start/end date; if invalid, return 0
         */
        calculateNumberOfDays: function (sSubmissionType, oHeader, oItem) {
            // determine header start/end based on submission type
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    var dHeaderStart = oHeader.tripstartdate ? new Date(oHeader.tripstartdate) : null;
                    var dHeaderEnd = oHeader.tripenddate ? new Date(oHeader.tripenddate) : null;
                    break;
                case Constants.SubmissionTypePrefix.CLAIM:
                    // populate header values based on claim tyoe item
                    switch (oItem.claim_type_item_id) {
                        case Constants.ClaimTypeItem.DOBI:
                            dHeaderStart = oHeader.trip_start_date ? new Date(oHeader.trip_start_date) : null;
                            dHeaderEnd = oHeader.trip_end_date ? new Date(oHeader.trip_end_date) : null;
                            break;
                        default:
                            // no using header field for non-DOBI claim type items
                            dHeaderStart = null;
                            dHeaderEnd = null;
                            break;
                    }
                    break;
            }

            switch (oItem.claim_type_item_id) {
                case Constants.ClaimTypeItem.DOBI:
                    // no using item fields for DOBI claim type items
                    var dItemStart = null;
                    var dItemEnd = null;
                    break;
                case Constants.ClaimTypeItem.TRAVEL_INSURANCE:
                    dItemStart = oItem.insurance_cert_start_date ? new Date(oItem.insurance_cert_start_date) : null;
                    dItemEnd = oItem.insurance_cert_end_date ? new Date(oItem.insurance_cert_end_date) : null;
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
                const iBaseDiff = Math.floor((iEndMidnight - iStartMidnight) / iMsPerDay);
                const bIsNightBased = Utility.isNightBasedCalculation(oHeader,oItem);
                iDiffDays = bIsNightBased ? iBaseDiff : iBaseDiff + 1;
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
            if (!sId && !sType && !sItemType) return null;

            var _oAppModel = this.getOwnerComponent().getModel("appModel");
            var _oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            const _sSubmissionType = sId.substring(0, 3);
            var _dMinDate = null;

            switch (sFieldName) {
                case Constants.EntitiesFields.RECEIPT_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // Default Claim Type - minimum date = 90 days before header start date 
                            _dMinDate = new Date(oHeader.trip_start_date);
                            const dPastDate = new Date(_dMinDate);
                            dPastDate.setDate(dPastDate.getDate() - 90);
                            _dMinDate = dPastDate;
                            _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError",
                                _oResourceBundle.getText("error_receiptdate_mindate"));
                            break;
                    }
                    break;
                case Constants.EntitiesFields.START_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            if (Object.values(Constants.ClaimTypeKursus).includes(sType)) {
                                // Kursus Dalam Negara/Kursus Luar Negara - minimum date = 1 day before header start date
                                _dMinDate = new Date(oHeader.trip_start_date);
                                _dMinDate.setDate(_dMinDate.getDate() - 1);
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_start_date_kursus_mindate"));
                            } else if (sItemType === Constants.ClaimTypeItem.MKN_LOAN) {
                                // Elaun Makan (Perpindahan) - minimum date = move-in date
                                // if move-in date not found, use 90 days before header start date
                                _dMinDate = oHeader["move_in_date"] ? new Date(oHeader["move_in_date"]) : null;
                                if (_dMinDate === null) {
                                    _dMinDate = new Date(oHeader["trip_start_date"]);
                                    const dPastDate = new Date(_dMinDate);
                                    dPastDate.setDate(dPastDate.getDate() - 90);
                                    _dMinDate = dPastDate;
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_start_date_moveindate_mindate"));
                            }
                            break;
                    }
                    break;
                case Constants.EntitiesFields.END_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            if (Object.values(Constants.ClaimTypeKursus).includes(sType)) {
                                // Kursus Dalam Negara/Kursus Luar Negara - minimum date = item start date
                                // if item start date not set, use 1 day before header start date
                                if (!!new Date(oItem["start_date"]).getTime()) {
                                    _dMinDate = new Date(oItem["start_date"]);
                                }
                                else {
                                    _dMinDate = new Date(oHeader.trip_start_date);
                                    _dMinDate.setDate(_dMinDate.getDate() - 1);
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_end_date_kursus_mindate"));
                            } else if (sItemType === Constants.ClaimTypeItem.MKN_LOAN) {
                                // Elaun Makan (Perpindahan) - minimum date = item start date
                                // if item start date not set, use move-in date
                                // if move-in date not found, use 90 days before header start date
                                if (!!new Date(oItem["start_date"]).getTime()) {
                                    _dMinDate = new Date(oItem["start_date"]);
                                }
                                else {
                                    _dMinDate = oHeader["move_in_date"] ? new Date(oHeader["move_in_date"]) : null;
                                    if (_dMinDate === null) {
                                        _dMinDate = new Date(oHeader["trip_start_date"]);
                                        const dPastDate = new Date(_dMinDate);
                                        dPastDate.setDate(dPastDate.getDate() - 90);
                                        _dMinDate = dPastDate;
                                    }
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_end_date_moveindate_mindate"));
                            }
                            else {
                                // Other Claim Type - minimum date = item start date
                                // if start date not set, default to null (no constraint)
                                _dMinDate = !!new Date(oItem["start_date"]).getTime() ? new Date(oItem["start_date"]) : null;
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError", 
                                    _oResourceBundle.getText("error_end_date_mindate"));
                            }
                            break;
                    }
                    break;
                case Constants.EntitiesFields.INSURANCE_CERT_END_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            if (sItemType === Constants.ClaimTypeItem.TRAVEL_INSURANCE) {
                                // Travel Insurance - minimum date = insurance certificate start date
                                // if start date not set, set 90 days before header start date
                                if (!!new Date(oItem["insurance_cert_start_date"]).getTime()) {
                                    _dMinDate = new Date(oItem["insurance_cert_start_date"]);
                                }
                                else {
                                    _dMinDate = new Date(oHeader.trip_start_date);
                                    const dPastDate = new Date(_dMinDate);
                                    dPastDate.setDate(dPastDate.getDate() - 90);
                                    _dMinDate = dPastDate;
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError",
                                    _oResourceBundle.getText("error_insurance_cert_end_date_mindate"));
                            }
                            break;


                    }
                    break;
                case Constants.EntitiesFields.MOVE_IN_DATE:
                    switch(_sSubmissionType){
                        case Constants.SubmissionTypePrefix.REQUEST:
                        break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            if(sType === Constants.ClaimType.ELAUN_PINDAH){
                                const dPastDate = new Date(_dMinDate);
                                dPastDate.setDate(dPastDate.getDate() - 180);
                                _dMinDate = dPastDate;
                            }

                            _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMinDateError",
                            _oResourceBundle.getText("error_insurance_cert_end_date_mindate"));
                            break;
                    }
                    break;
            }
            if (_dMinDate !== null) {
                _dMinDate = new Date(_dMinDate);
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
            var _dMaxDate = null;

            switch (sFieldName) {
                case Constants.EntitiesFields.RECEIPT_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // Default Claim Type - maximum date = header end date 
                            _dMaxDate = new Date(oHeader.trip_end_date);
                            _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError",
                                _oResourceBundle.getText("error_receiptdate_maxdate"));
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
                            if (Object.values(Constants.ClaimTypeKursus).includes(sType)) {
                                // Kursus Dalam Negara/Kursus Luar Negara - maximum date = item end date
                                // if end date not set, use 1 day after header end date
                                if (!!new Date(oItem["end_date"]).getTime()) {
                                    _dMaxDate = new Date(oItem["end_date"]);
                                }
                                else {
                                    _dMaxDate = new Date(oHeader.trip_end_date);
                                    _dMaxDate.setDate(_dMaxDate.getDate() + 1);
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_start_date_kursus_maxdate"));
                            }
                            else if (sItemType === Constants.ClaimTypeItem.MKN_LOAN) {
                                // Elaun Makan (Perpindahan) - maximum date = item end date
                                // if end date not set, use 1 day after move-in date
                                if (!!new Date(oItem["end_date"]).getTime()) {
                                    _dMaxDate = new Date(oItem["end_date"]);
                                }
                                else {
                                    _dMaxDate = oHeader["move_in_date"] ? new Date(oHeader["move_in_date"]) : oHeader["trip_end_date"] ? new Date(oHeader["trip_end_date"]) : null;
                                    if (_dMaxDate) {
                                        _dMaxDate.setDate(_dMaxDate.getDate() + 1);
                                    }
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_start_date_moveindate_maxdate"));
                            }
                            else {
                                // Other Claim Type - maximum date = item end date
                                // if end date not set, default to null (no constraint)
                                _dMaxDate = !!new Date(oItem["end_date"]).getTime() ? new Date(oItem["end_date"]) : null;
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_start_date_maxdate"));
                            }
                            break;
                    }
                    break;
                case Constants.EntitiesFields.END_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            if (Object.values(Constants.ClaimTypeKursus).includes(sType)) {
                                // Kursus Dalam Negara/Kursus Luar Negara - maximum date = 1 day after header end date
                                _dMaxDate = new Date(oHeader.trip_end_date);
                                _dMaxDate.setDate(_dMaxDate.getDate() + 1);
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_end_date_kursus_maxdate"));
                            }
                            else if (sItemType === Constants.ClaimTypeItem.MKN_LOAN) {
                                // Elaun Makan (Perpindahan) - maximum date = 1 day after move-in date
                                // if move-in date not found, use header end date
                                if (oHeader["move_in_date"]) {
                                    _dMaxDate = new Date(oHeader["move_in_date"]);
                                    _dMaxDate.setDate(_dMaxDate.getDate() + 1);
                                }
                                else {
                                    _dMaxDate = new Date(oHeader["trip_end_date"]);
                                }
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError", 
                                    _oResourceBundle.getText("error_end_date_moveindate_maxdate"));
                            }
                           break;
                    }
                    break;
                case Constants.EntitiesFields.INSURANCE_CERT_START_DATE:
                    switch (_sSubmissionType) {
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            // Travel Insurance - maximum date = insurance certificate end date
                            // if end date not set, use header end date
                            if (sItemType === Constants.ClaimTypeItem.TRAVEL_INSURANCE) {
                                _dMaxDate = !!new Date(oItem["insurance_cert_end_date"]).getTime() ? new Date(oItem["insurance_cert_end_date"]) : new Date(oHeader["trip_end_date"]);
                                // set validator error message
                                _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError",
                                    _oResourceBundle.getText("error_insurance_cert_start_date_maxdate"));
                            }
                            break;
                    }
                    break;

                case Constants.EntitiesFields.MOVE_IN_DATE:
                    switch(_sSubmissionType){
                        case Constants.SubmissionTypePrefix.REQUEST:
                            break;

                        case Constants.SubmissionTypePrefix.CLAIM:
                            if(sType === Constants.ClaimType.ELAUN_PINDAH){
                                _dMaxDate = this.today()
                            }
                            _oAppModel.setProperty("/fieldControl/" + sFieldName + "/customMaxDateError",
                            _oResourceBundle.getText("error_insurance_cert_end_date_mindate"));
                            break;
                    }
                    break;
            }

            if (_dMaxDate !== null) {
                _dMaxDate = new Date(_dMaxDate);
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
        },


        /**
         * Checks whether a date value is valid.
         * @param {string|Date} vDate input date
         * @returns {boolean} true if valid date
         */
        isValidDate: function (vDate) {
            const oDate = new Date(vDate);
            return vDate && !isNaN(oDate.getTime());
        },

        /**
         * Returns a 2-year window (Previous Year → Current Year)
         * based on the supplied date.
         * @param {string|Date} vDate input date
         * @returns {{start: string, end: string}} date range in YYYY-MM-DD format
         */
        getPrevYearToYearEnd: function (vDate) {
            const oDate = new Date(vDate);
            if (isNaN(oDate)) return null;

            const iYear = oDate.getFullYear();

            return {
                start: `${iYear - 1}-01-01`,
                end: `${iYear}-12-31`
            };
        },

        /**
  * Converts a date into a specified format.
  * @public
  * @param {string|Date} vDate the input date
  * @param {string} sFormat output format (e.g. "YYYY-MM-DD", "DD/MM/YYYY")
  * @returns {string|null} formatted date or null if invalid
  */
        formatDateDynamic: function (vDate, sFormat = "YYYY-MM-DD") {
            if (!vDate) return null;

            const oDate = new Date(vDate);
            if (isNaN(oDate)) return null;

            const sYear = oDate.getFullYear().toString();
            const sMonth = this.pad(oDate.getMonth() + 1);
            const sDay = this.pad(oDate.getDate());


            return sFormat
                .replace("YYYY", sYear)
                .replace("MM", sMonth)
                .replace("DD", sDay);
        },

        /**
         * Parse Date and Time into DateTime format.
         * @public
         * @param {Date} Date from input
         * @param {Time} Time from input 
         * @returns {oBaseDate} 
         */
        parseDateTime: function (dDate, tTime) {
            let oBaseDate = new Date(dDate);

            if (isNaN(oBaseDate.getTime())) {
                console.error("Invalid Date format received:", dDate);
                return oBaseDate;
            }

            let iHours = 0, iMinutes = 0, iSeconds = 0;

            if (tTime instanceof Date) {
                iHours = tTime.getHours();
                iMinutes = tTime.getMinutes();
                iSeconds = tTime.getSeconds();
            } else if (tTime && tTime.ms !== undefined) {
                let dtempDate = new Date(tTime.ms);
                iHours = dtempDate.getUTCHours();
                iMinutes = dtempDate.getUTCMinutes();
                iSeconds = dtempDate.getUTCSeconds();
            } else if (typeof tTime === "string") {
                if (tTime.startsWith("PT")) {
                    iHours = parseInt((tTime.match(/(\d+)H/) || [0, 0])[1], 10);
                    iMinutes = parseInt((tTime.match(/(\d+)M/) || [0, 0])[1], 10);
                    iSeconds = parseInt((tTime.match(/(\d+)S/) || [0, 0])[1], 10);
                } else {
                    let isPM = tTime.toLowerCase().includes("pm");
                    let isAM = tTime.toLowerCase().includes("am");
                    
                    let aTimeParts = tTime.replace(/[^0-9:]/g, "").split(":");
                    
                    iHours = parseInt(aTimeParts[0] || 0, 10);
                    iMinutes = parseInt(aTimeParts[1] || 0, 10);
                    iSeconds = parseInt(aTimeParts[2] || 0, 10);

                    if (isPM && iHours < 12) iHours += 12;
                    if (isAM && iHours === 12) iHours = 0;
                }
            }

            oBaseDate.setHours(iHours, iMinutes, iSeconds, 0);
            return oBaseDate;
        },

        /**
         * Convert Timepicker value to HH:mm:ss which accepted by HANA Cloud.
         * @public
         * @param {string} sTimeStr from TimePicker value
         * @returns {string|null} formatted time
         */
        convertTo24Hour: function (sTimeStr) {
            if (!sTimeStr) return null;

            const sNormalized = sTimeStr.replace(/\s+/g, ' ').trim();

            const [sTime, sModifier] = sNormalized.split(' ');

            if (!sTime || !sModifier) return null;

            let [iHours, iMinutes, iSeconds] = sTime.split(':').map(Number);

            if (sModifier.toUpperCase() === 'AM' && iHours === 12) {
                iHours = 0;
            }
            if (sModifier.toUpperCase() === 'PM' && iHours !== 12) {
                iHours += 12;
            }

            return `${hours.toString().padStart(2, '0')}:${iMinutes
                .toString()
                .padStart(2, '0')}:${iSeconds.toString().padStart(2, '0')}`;
        },
    };
});