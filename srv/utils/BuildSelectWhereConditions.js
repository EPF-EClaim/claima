const { Constant } = require("./constant");

module.exports = {
    /**
         * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
         * @public
         * @param {Object} oConditions - Object containing where conditions to be stringified
         * @returns {String} sConditions - return original Conditions but modified into Select Where clause String 
         */
    buildWhereCondition: function (oConditions) {
        var sConditions = "";
        var sLine = "";
        var i = 0;
        var sInValues;
        for (const [sField, sValue] of Object.entries(oConditions)) {
            if (i > 0) {
                sConditions = sConditions + " " + [Constant.WhereCondition.AND] + " ";
            }
            i = i + 1;

            // Handle BETWEEN
            if (sValue && sValue.between) {
                sLine = sField + " " + [Constant.ComparisonOperators.GreaterEquals] + " " + `'${sValue.between[0]}'`
                    + " " + [Constant.WhereCondition.AND] + " " +
                    sField + " " + [Constant.ComparisonOperators.LesserEquals] + " " + `'${sValue.between[1]}'`;

            }
            //Handle In list
            else if (sValue && sValue.in && Array.isArray(sValue.in)) {
                sInValues = sValue.in
                    .map(v => `'${v}'`)
                    .join(', ');

                sLine = sField + " " + Constant.WhereCondition.IN + " " + `(${sInValues})`;
                //  `${sField} IN (${sInValues})`;
            }
            //Handle Greater or Equals
            else if (sValue && sValue[Constant.ComparisonOperators.GreaterEquals] !== undefined) {
                sLine = sField + " " + [Constant.ComparisonOperators.GreaterEquals] + " " + `'${sValue[Constant.ComparisonOperators.GreaterEquals]}'`;

            }
            //Handle Lesser or Equals
            else if (sValue && sValue[Constant.ComparisonOperators.LesserEquals] !== undefined) {
                sLine = sField + " " + [Constant.ComparisonOperators.LesserEquals] + " " + `'${sValue[Constant.ComparisonOperators.LesserEquals]}'`;

            }
            //Handle Not Equals
            else if (sValue && sValue[Constant.ComparisonOperators.NotEquals] !== undefined) {
                sLine = sField + " " + [Constant.ComparisonOperators.NotEquals] + " " + `'${sValue[Constant.ComparisonOperators.NotEquals]}'`;

            }
            else {
                sLine = sField + " " + [Constant.ComparisonOperators.Equals] + " " + `'${sValue}'`;
            }
            sConditions += sLine;
        }
        return sConditions;
    },
    /**
      * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
      * @public
      * @param {String} sDate - Input Date
      * @param {Integer} iInputYear - Frequency * Period iYear 
      * @param {Integer} iInputMonth - Frequency * Period iMonth 
      * @param {Integer} iInputDays - Frequency * Period Days 
      * @returns {Object} Contains both Date from and Date to Ranges
      */
    subtractDateDelta: function (sDate, iInputYear, iInputMonth, iInputDays) {

        if (!/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
            throw new Error("Date must be in YYYY-MM-DD format");
        }

        const [iCurrentYear] = sDate.split("-").map(Number);

        // Adjust for when Year input, do full multi-year range
        if (iInputYear > 0) {

            const iStartYear = iCurrentYear - (iInputYear - 1);
            const iEndYear   = iCurrentYear + (iInputYear - 1);

            return {
                dDateFrom: `${iStartYear}-01-01`,
                dDateTo: `${iEndYear}-12-31`
            };
        }

        // Adjust each non-zero parameter by subtracting 1
        const iAdjYears = iInputYear > 0 ? iInputYear - 1 : 0;
        const iAdjMonths = iInputMonth > 0 ? iInputMonth - 1 : 0;
        const iAdjDays = iInputDays > 0 ? iInputDays - 1 : 0;

        const [sInputYear, sInputMonth, sInputDay] = sDate.split("-").map(Number);

        function daysInMonth(iYear, iMonth) {
            return new Date(Date.UTC(iYear, iMonth, 0)).getUTCDate();
        }

        function formatDate(date) {
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
        }

        let iYear = sInputYear - iAdjYears;
        let iMonth = sInputMonth - iAdjMonths;

        while (iMonth <= 0) {
            iMonth += 12;
            iYear--;
        }

        const dClampedDay = Math.min(sInputDay, daysInMonth(iYear, iMonth));
        const dAdjustedDate = new Date(Date.UTC(iYear, iMonth - 1, dClampedDay));
        dAdjustedDate.setUTCDate(dAdjustedDate.getUTCDate() - iAdjDays);

        const dResultYear = dAdjustedDate.getUTCFullYear();
        const dResultMonth = dAdjustedDate.getUTCMonth() + 1;

        const dFirstDay = new Date(Date.UTC(dResultYear, dResultMonth - 1, 1));
        const dLastDay = new Date(Date.UTC(dResultYear, dResultMonth, 0));

        return {
            dDateFrom: formatDate(dFirstDay),
            dDateTo: formatDate(dLastDay)
        };
    }

};