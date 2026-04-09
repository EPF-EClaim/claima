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
        for (const [field, value] of Object.entries(oConditions)) {
            if (i > 0) {
                sConditions = sConditions + " " + [Constant.WhereCondition.AND] + " ";
            }
            i = i + 1;

            // Handle BETWEEN
            if (value && value.between) {
                sLine = field + " " + [Constant.ComparisonOperators.GreaterEquals] + " " + `'${value.between[0]}'`
                    + " " + [Constant.WhereCondition.AND] + " " +
                    field + " " + [Constant.ComparisonOperators.LesserEquals] + " " + `'${value.between[1]}'`;

            }
            //Handle In list
            else if (value && value.in && Array.isArray(value.in)) {
                sInValues = value.in
                    .map(v => `'${v}'`)
                    .join(', ');

                sLine = field + " " + Constant.WhereCondition.IN + " " + `(${sInValues})`;
                //  `${field} IN (${sInValues})`;
            }
            //Handle Greater or Equals
            else if (value && value[Constant.ComparisonOperators.GreaterEquals] !== undefined) {
                sLine = field + " " + [Constant.ComparisonOperators.GreaterEquals] + " " + `'${value[Constant.ComparisonOperators.GreaterEquals]}'`;

            }
            //Handle Lesser or Equals
            else if (value && value[Constant.ComparisonOperators.LesserEquals] !== undefined) {
                sLine = field + " " + [Constant.ComparisonOperators.LesserEquals] + " " + `'${value[Constant.ComparisonOperators.LesserEquals]}'`;

            }
            //Handle Not Equals
            else if (value && value[Constant.ComparisonOperators.NotEquals] !== undefined) {
                sLine = field + " " + [Constant.ComparisonOperators.NotEquals] + " " + `'${value[Constant.ComparisonOperators.NotEquals]}'`;

            }
            else {
                sLine = field + " " + [Constant.ComparisonOperators.Equals] + " " + `'${value}'`;
            }
            sConditions += sLine;
        }
        return sConditions;
    },
    /**
      * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
      * @public
      * @param {String} sDate - Input Date
      * @param {Integer} iAdjYears - Frequency * Period Year 
      * @param {Integer} iAdjMonths - Frequency * Period Month 
      * @param {Integer} iAdjDays - Frequency * Period Days 
      * @returns {Object} Contains both Date from and Date to Ranges
      */
    subtractDateDelta: function (sDate, iYear, iMonth, iDays) {

        if (!/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
            throw new Error("Date must be in YYYY-MM-DD format");
        }

        // Adjust each non-zero parameter by subtracting 1
        const iAdjYears = iYear > 0 ? iYear - 1 : 0;
        const iAdjMonths = iMonth > 0 ? iMonth - 1 : 0;
        const iAdjDays = iDays > 0 ? iDays - 1 : 0;

        const [inputYear, inputMonth, inputDay] = sDate.split("-").map(Number);

        function daysInMonth(year, month) {
            return new Date(Date.UTC(year, month, 0)).getUTCDate();
        }

        function formatDate(date) {
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
        }

        let year = inputYear - iAdjYears;
        let month = inputMonth - iAdjMonths;

        while (month <= 0) {
            month += 12;
            year--;
        }

        const clampedDay = Math.min(inputDay, daysInMonth(year, month));
        const adjustedDate = new Date(Date.UTC(year, month - 1, clampedDay));
        adjustedDate.setUTCDate(adjustedDate.getUTCDate() - iAdjDays);

        const resultYear = adjustedDate.getUTCFullYear();
        const resultMonth = adjustedDate.getUTCMonth() + 1;

        const firstDay = new Date(Date.UTC(resultYear, resultMonth - 1, 1));
        const lastDay = new Date(Date.UTC(resultYear, resultMonth, 0));

        return {
            dDateFrom: formatDate(firstDay),
            dDateTo: formatDate(lastDay)
        };
    }

};