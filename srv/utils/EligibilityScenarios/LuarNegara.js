const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators');
const GetHistoricalData = require('../GetHistoricalData');
const BuildSelectWhereConditions = require("../BuildSelectWhereConditions");
module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Array} aRules - list of eligibility rule from backend
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: async function (oPayload, aRules, tx) {
        var oRule, aFilteredRules;
        var iHistFreq = 0;
        var iAllowedFreq = 0;

        // to extract the key values from oPayload
        var aPayload = this._parsePayload(oPayload);

        //to find the matching eligibility rule for FLIGHT & HOTEL_O as these 3 may return more than 1 eligible rule value
        if ((oPayload.ClaimTypeItem === Constant.ClaimTypeItem.FLIGHT_L) || (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.FLIGHT_O)) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.FLIGHT_CLASS_ID === aPayload.sFlightClassId;//[Constant.EntitiesFields.FLIGHT_CLASS_ID];
            })

            oRule = aFilteredRules[0];
        } else if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.HOTEL_O) {
            aFilteredRules = aRules.filter(function (rule) {
                return rule.ROOM_TYPE_ID === aPayload.sRoomTypeId;//[Constant.EntitiesFields.ROOM_TYPE_ID];
            })

            oRule = aFilteredRules[0];
        }
        else {
            // DOBI, HOTEL_L, LODG_O, LODGING_L, PARKING, PKN_PANAS will only return single eligible rule value based on user's personal grade
            oRule = aRules[0];
        }

        //  only PKN_PANAS require frequency checking
        if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.PKN_PANAS) {
            var oDateRange = await this._getDateRange(oPayload, tx);
            iAllowedFreq = oDateRange.iItemFreq;

            var iHistoricalData = await this._getHistoricalData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
            var iCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
            iHistFreq = iHistoricalData + iCurrentRecordItemData;
        }

        console.log(iHistoricalData, iCurrentRecordItemData, iAllowedFreq);

        this._validateClaimItem(aPayload, oRule, oPayload, iHistFreq, iAllowedFreq);
        return oPayload;

    },

    /**
    * To parse oPayload.CheckFields array into a key value object. To avoid repeated array searching when accessing field values
    * @private
    * @param {Object} oPayload - payload contains user input passed from frontend
    * @returns {Object} aPayload - return key user input value in the form of object based on selected claim type item
    */
    _parsePayload: function (oPayload) {
        var sTravelDaysId, sFlightClassId, sRoomTypeId;

        for (let i = 0; i < oPayload.CheckFields.length; i++) {
            //Convert the Payload values
            try {
                oPayload.CheckFields[i].value = JSON.parse(oPayload.CheckFields[i].value);
            } catch (error) {
                // no handler, remain as string
            }

            switch (oPayload.CheckFields[i].fieldName) {
                case Constant.EntitiesFields.TRAVEL_DAYS_ID:
                    sTravelDaysId = oPayload.CheckFields[i].value;
                    break;
                case Constant.EntitiesFields.FLIGHT_CLASS_ID:
                    sFlightClassId = oPayload.CheckFields[i].value;
                    break;
                case Constant.EntitiesFields.ROOM_TYPE_ID:
                    sRoomTypeId = oPayload.CheckFields[i].value;
                    break;
            }
        }

        return { sTravelDaysId, sFlightClassId, sRoomTypeId };
    },

    /**
             * Get Data Range based on RECEIPT_DATE in Payload Checkfields
             * @private
             * @param {Object} oPayload - payload contains user input passed from frontend
             * @param {Object} tx - CDS Transaction
             * @returns {Array} aDatetoFrom - Array filled with Date From and Date To
             */
    _getDateRange: async function (oPayload, tx) {
        // get Date Range
        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE);
        if (iIndex == -1) return;
        return aDatetoFrom = await GetHistoricalData.getDateRange(
            oPayload.ClaimType,
            oPayload.ClaimTypeItem,
            oPayload.CheckFields[iIndex].value,
            tx);
    },

    /**
         * Get Historical Claims Data by building querying conditions and using GetHistoricalData for data retrieval
         * @private
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Object} dDateTo - Date To Range
         * @param {Object} dDateFrom - Date From Range
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    _getHistoricalData: async function (oPayload, dDateTo, dDateFrom, tx) {
        var sHeaderTable = "";
        var sItemTable = "";
        // get Historical Claims Data
        // Map ClaimID or RequestID based on which HeaderTable to use
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
        } else {
            sHeaderTable = Constant.Entities.ZREQUEST_HEADER
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
        }

        const aItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            [Constant.EntitiesFields.RECEIPT_DATE]: { between: [dDateFrom, dDateTo] }
        };
        const sItemcondition = BuildSelectWhereConditions.buildWhereCondition(aItemcondition);
        const iHistoricalData = await GetHistoricalData.getHistoricalData(sHeaderTable,
            sItemTable,
            sItemcondition,
            tx);

        return iHistoricalData;
    },

    /**
         * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
         * @private
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Object} dDateTo - Date To Range
         * @param {Object} dDateFrom - Date From Range
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    _getCurrentRecordItemData: async function (oPayload, dDateTo, dDateFrom, tx) {
        var sHeaderField = "";
        var sItemField = "";
        var sItemTable = "";
        // get Current Items Data
        // Map Headers and ClaimID or RequestID based on which ItemTable to use
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sItemField = Constant.EntitiesFields.CLAIM_SUB_ID;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
        } else {
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sItemField = Constant.EntitiesFields.REQUEST_SUB_ID;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
        }

        const aCurrentItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [sHeaderField]: oPayload.RecordId,
            [sItemField]: { [Constant.ComparisonOperators.NotEquals]: oPayload.RecordSubId },
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            [Constant.EntitiesFields.RECEIPT_DATE]: { between: [dDateFrom, dDateTo] }
        };
        const sCurrentItemcondition = BuildSelectWhereConditions.buildWhereCondition(aCurrentItemcondition);

        return iCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
            sCurrentItemcondition,
            tx);
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Array} aPayload - flat parsed payload from _parsePayload
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    */
    _validateClaimItem: function (aPayload, oRule, oPayload, iExistingFreq, iAllowedFreq) {
        var iIndex;

        switch (oPayload.ClaimTypeItem) {
            // DOBI - return true if user's traveling days >= eligible min days
            case Constant.ClaimTypeItem.DOBI:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.TRAVEL_DAYS_ID);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                // calculate min days of traveling days required
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(
                        oPayload.CheckFields[iIndex].value,
                        oRule.TRAVEL_DAYS_ID
                    );
                }
                break;

            // FLIGHT_L - return true if selected flight class matches user's personal grade
            case Constant.ClaimTypeItem.FLIGHT_L:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.FLIGHT_CLASS_ID);
                if (iIndex == -1) return;
                // if no rule matches the selected flight class, return false
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                        oPayload.CheckFields[iIndex].value,
                        oRule.FLIGHT_CLASS_ID
                    );
                }
                break;

            // FLIGHT_O - return true if selected flight class matches user's personal grade
            case Constant.ClaimTypeItem.FLIGHT_O:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.FLIGHT_CLASS_ID);
                if (iIndex == -1) return;
                // if no rule matches the selected flight class, return false
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                        oPayload.CheckFields[iIndex].value,
                        oRule.FLIGHT_CLASS_ID
                    );
                    // Reset the index variable
                    iIndex = null;
                    // if travel hours is restricted, check if rule table has value
                    // return true if travel hours is greater than rule table data
                    if (oRule.TRAVEL_HOURS != undefined || oRule.TRAVEL_HOURS != null) {
                        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.TRAVEL_HOURS);
                        if (iIndex == -1) return;
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.GreaterEquals(
                            oPayload.CheckFields[iIndex].value,
                            oRule.TRAVEL_HOURS);
                    }
                }

                break;

            // HOTEL_L & LODGING - return true if claim amount is less than eligible amount * travel days
            case Constant.ClaimTypeItem.HOTEL_L:
            case Constant.ClaimTypeItem.LODG_O:
            case Constant.ClaimTypeItem.LODGING_L:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                // calculate max claim amount allowed
                else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            parseFloat(oPayload.CheckFields[iIndex].value),
                            parseFloat(oRule.ELIGIBLE_AMOUNT) * parseFloat(aPayload.sTravelDaysId)
                        );
                    }
                }
                break;

            // HOTEL_O - return true if Room Type matches user's personal grade
            //         - return true if claim amount is less than eligible amount * travel days
            case Constant.ClaimTypeItem.HOTEL_O:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ROOM_TYPE_ID);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                // if user input and rules table room type are same values, return true
                // if user input and rules table room type are NOT same values, return false
                else {
                    oPayload.CheckFields[iIndex].result = ComparisonOperators.EqualsTo(
                        oPayload.CheckFields[iIndex].value,
                        oRule.ROOM_TYPE_ID);
                }

                // Reset the index variable
                iIndex = null;

                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                }
                // calculate max claim amount allowed
                else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            parseFloat(oPayload.CheckFields[iIndex].value),
                            parseFloat(oRule.ELIGIBLE_AMOUNT) * parseFloat(aPayload.sTravelDaysId)
                        );
                    }
                }
                break;
            // PARKING & PKN_PANAS - return true if claim amount is less than eligible amount
            case Constant.ClaimTypeItem.PARKING:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {// if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;

            case Constant.ClaimTypeItem.PKN_PANAS:
                // PKN_PANAS - return true if there is no historical claims within same Year/Month based on frequency and period
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE);
                if (iIndex == -1) return;
                if ((!!oRule) && (iExistingFreq < iAllowedFreq)) {
                    oPayload.CheckFields[iIndex].result = true;
                } else {
                    oPayload.CheckFields[iIndex].result = false;
                }

                iIndex = null;
                // PKN_PANAS - return true if claim amount is less than eligible amount
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                    // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            oPayload.CheckFields[iIndex].value,
                            parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;
        }
    }
};