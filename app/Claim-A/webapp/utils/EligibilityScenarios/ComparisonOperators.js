sap.ui.define([
], function () {
    "use strict";
    return{
        /**
		 * Compares sVal1 against sVal2. If true, return true. If false, return false
		 * @public
		 * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @returns {Boolean} Comparison Output
		 */
        EqualsTo(sVal1, sVal2){
            return sVal1 === sVal2;
        },

        /**
		 * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 value
		 * @public
		 * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @returns {Boolean/Integer/String} Comparison Output
		 */
        GreaterEquals(sVal1, sVal2){
            if( sVal1 >= sVal2 ){
                return true;
            }else{
                return sVal2;
            }
        },

        /**
		 * Compares sVal1 against sVal2. If true, return true. If false, return sVal2 value
		 * @public
		 * @param {Integer/String} sVal1 - Value Input to be checked;
         * @param {Integer/String} sVal2 - Value Input to be checked against;
         * @returns {Boolean/Integer/String} Comparison Output
		 */
        LesserEquals(sVal1, sVal2){
            if( sVal1 <= sVal2 ){
                return true;
            }else{
                return sVal2;
            }
        }
    };
});