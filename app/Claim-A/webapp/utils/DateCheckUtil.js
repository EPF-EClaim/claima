sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    const DateUtil = {

        fnFormatDate: function (iDate, sPattern) {

            // Use default if pattern not provided
            const oDateFormat = DateFormat.getDateInstance({
                pattern: sPattern || "yyyy.MM.dd"
            });

            if (!iDate) return "";

            const oDate = new Date(iDate);
            if (isNaN(oDate)) return "";

            return oDateFormat.format(oDate);
        }

    };

    return DateUtil;
});