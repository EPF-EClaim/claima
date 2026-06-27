/**
         * Compares sVal1 against sVal2. If true, return true. If false, return false
         * @public
         * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @returns {String} Comparison Output
         */
export function EqualsTo(sVal1, sVal2) {
    return sVal1 === sVal2;
}

/**
         * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 value
         * @public
         * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @returns {String} Comparison Output
         */
export function GreaterEquals(sVal1, sVal2) {
    if (parseFloat(sVal1) >= parseFloat(sVal2)) {
        return true;
    } else {
        return sVal2;
    }
}

/**
         * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 value
         * @public
         * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @returns {String} Comparison Output
         */
export function LesserEquals(sVal1, sVal2) {
    if (parseFloat(sVal1) <= parseFloat(sVal2)) {
        return true;
    } else {
        return sVal2;
    }
}

/**
         * Specifically for Post Education Assistance Claim, this function will check if the dependent's total claimed amount is less than or equal to the maximum limit allowed. If true, return true. If false, return false
         * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 - sVal1 value
         * @public
         * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @param {Integer/String} sVal3 - Current Record Item Total Amount;
         * @returns {String} Comparison Output
         */
export function LesserEqualsReturnSpecial(sVal1, sVal2, sVal3) {
    if (parseFloat(sVal1) <= parseFloat(sVal2)) {
        return true;
    } else {
        return sVal2 - sVal3;
    }
}