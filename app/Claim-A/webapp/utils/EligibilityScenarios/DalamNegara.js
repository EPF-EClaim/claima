sap.ui.define([
    "./ComparisonOperators"
], function (ComparisonOperators) {
    "use strict";

    return {
        onEligibleCheck(oConstant, oPayload, aRules) {

            var oRule, aFilteredRules;

            var aPayload = this._parsePayload(oPayload, oConstant);

            if (aPayload.CLAIM_TYPE_ITEM_ID === oConstant.ClaimTypeItem.FLIGHT_L) {
                aFilteredRules = aRules.filter(function (rule) {
                    return rule.FLIGHT_CLASS_ID === aPayload[oConstant.FIELDNAME.FLIGHT_CLASS_ID];
                })

                oRule = aFilteredRules[0];
            }
            else if (aPayload.CLAIM_TYPE_ITEM_ID === oConstant.ClaimTypeItem.TAMBANG) {
                aFilteredRules = aRules.filter(function (rule) {
                    return rule.TRANSPORT_CLASS === aPayload[oConstant.FIELDNAME.FARE_TYPE_ID];
                })

                oRule = aFilteredRules[0];
            }
            else {
                oRule = aRules[0];
            }

            this._validateClaimItem(aPayload, oConstant, oRule, oPayload);
            return oPayload;

        },

        _parsePayload(oPayload, oConstant) {
            var CLAIM_TYPE_ITEM_ID, TRAVEL_DAYS_ID, ELIGIBLE_AMOUNT, FLIGHT_CLASS_ID, FARE_TYPE_ID;

            CLAIM_TYPE_ITEM_ID = oPayload.ClaimTypeItem;

            for (let index = 0; index < oPayload.CheckFields.length; index++) {
                if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.TRAVEL_DAYS_ID) {
                    TRAVEL_DAYS_ID = oPayload.CheckFields[index].value;
                } else if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.ELIGIBLE_AMOUNT) {
                    ELIGIBLE_AMOUNT = oPayload.CheckFields[index].value;
                } else if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.FLIGHT_CLASS_ID) {
                    FLIGHT_CLASS_ID = oPayload.CheckFields[index].value;
                } else if (oPayload.CheckFields[index].fieldName === oConstant.FIELDNAME.FARE_TYPE_ID) {
                    FARE_TYPE_ID = oPayload.CheckFields[index].value;
                }
            }

            return { CLAIM_TYPE_ITEM_ID, TRAVEL_DAYS_ID, ELIGIBLE_AMOUNT, FLIGHT_CLASS_ID, FARE_TYPE_ID };
        },
        _validateClaimItem(aPayload, oConstant, oRule, oPayload) {
            var iIndex;

            switch (aPayload.CLAIM_TYPE_ITEM_ID) {
                case oConstant.ClaimTypeItem.DOBI:
                    iIndex = oPayload.CheckFields.findIndex((field) =>
                        field.fieldName === oConstant.FIELDNAME.TRAVEL_DAYS_ID);
                    if (!oRule) {
                        oPayload.CheckFields[iIndex].result = false;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(
                            oPayload.CheckFields[iIndex].value,
                            oRule.TRAVEL_DAYS_ID
                        );
                    }
                    break;

                case oConstant.ClaimTypeItem.FLIGHT_L:
                    iIndex = oPayload.CheckFields.findIndex((field) =>
                        field.fieldName === oConstant.FIELDNAME.FLIGHT_CLASS_ID);
                    if (!oRule) {
                        oPayload.CheckFields[iIndex].result = false;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                            oPayload.CheckFields[iIndex].value,
                            oRule.FLIGHT_CLASS_ID
                        );
                    }
                    break;

                case oConstant.ClaimTypeItem.HOTEL_L:
                case oConstant.ClaimTypeItem.LODGING_L:
                    iIndex = oPayload.CheckFields.findIndex((field) =>
                        field.fieldName === oConstant.FIELDNAME.ELIGIBLE_AMOUNT);
                    if (!oRule) {
                        oPayload.CheckFields[iIndex].result = false;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            parseFloat(oPayload.CheckFields[iIndex].value),
                            parseFloat(oRule.ELIGIBLE_AMOUNT) * parseFloat(aPayload.TRAVEL_DAYS_ID)
                        );
                    }
                    break;

                case oConstant.ClaimTypeItem.TAMBANG:
                    iIndex = oPayload.CheckFields.findIndex((field) =>
                        field.fieldName === oConstant.FIELDNAME.FARE_TYPE_ID);
                    if (!oRule) {
                        oPayload.CheckFields[iIndex].result = false;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                            oPayload.CheckFields[iIndex].value,
                            oRule.TRANSPORT_CLASS
                        );
                    }
                    break;  
            }
        }
    };
});
