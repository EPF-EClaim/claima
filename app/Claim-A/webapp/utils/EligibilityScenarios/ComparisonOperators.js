sap.ui.define([
], function () {
    "use strict";
    return{
        EqualsTo(sVal1, sVal2){
            if( sVal1 == sVal2 ){
                return true;
            }else{
                return false;
            }
        },

        GreaterEquals(sVal1, sVal2){
            if( sVal1 >= sVal2 ){
                return true;
            }else{
                return sVal2;
            }
        },

        LesserEquals(sVal1, sVal2){
            if( sVal1 <= sVal2 ){
                return true;
            }else{
                return sVal2;
            }
        }
    };
});