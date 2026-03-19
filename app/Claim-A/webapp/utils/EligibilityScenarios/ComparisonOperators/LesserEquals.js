sap.ui.define([
], function () {
    "use strict";
    return{
        CheckComparison(oConstant, sVal1, sVal2){
            if( sVal1 <= sVal2 ){
                return oConstant.STATUS.SUCCESS;
            }else{
                return sVal2;
            }
        }
    };
});