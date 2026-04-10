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
      * @returns {Object} Contains both Date from and Date to Ranges
      */
    getDateMonthRange: function (sDate) {
        const sYearMonth = sDate.substring(0, 7);
        // Derive first and last day of the month
        const [year, month] = sYearMonth.split('-').map(Number);
        const dDateFrom = `${sYearMonth}-01`;
        const dDateTo = new Date(year, month, 0)  // last day of month
            .toISOString().split('T')[0]; // 'YYYY-MM-DD'

        return { dDateFrom, dDateTo };
    }
};