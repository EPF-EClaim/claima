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
            } else {
                sLine = field + " " + [Constant.ComparisonOperators.Equals] + " " + `'${value}'`;
            }
            sConditions = sConditions + sLine;
        }
        return sConditions;
    }
};