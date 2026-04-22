const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators');
const GetDependentData = require("../GetDependentData");
const GetHistoricalData = require('../GetHistoricalData');
const BuildSelectWhereConditions = require("../BuildSelectWhereConditions");
module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Array} aRules - list of eligibility rule from backend
         * @param {Object} oEmp - Employee Data
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: async function (oPayload, aRules, oEmp, tx) {
        var oRule, aFilteredRules;
        // to extract the key values from oPayload
        var aPayload = this._parsePayload(oPayload);
        var iHistFreq = 0;
        var iAllowedFreq = 0;
        var fTotalAmount = 0;

        //to find the matching eligibility rule for PINDAH as this may return more than 1 eligible rule value
        if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.PINDAH) {
            var sMarriageCategory = await GetDependentData.getMarriageCategory(oPayload.EmpId);

            aFilteredRules = aRules.filter(function (rule) {
                return (rule.REGION_ID == aPayload.sRegionId &&
                    rule.MARITAL_STATUS == oEmp.MARITAL &&
                    rule.MARRIAGE_CATEGORY == sMarriageCategory);
            });
            oRule = aFilteredRules[0];

            var oDateRange = await this._getDateRange(oPayload, tx);
            iAllowedFreq = oDateRange.iItemFreq;

            iHistFreq = await this._getHistoricalData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
            var oCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
            fTotalAmount = oCurrentRecordItemData.fTotalAmount;
        }
        else {
            oRule = aRules[0];
        }

        if (!oRule) {
            throw new Error("No Eligibility Rules Found");
        };

        this._validateClaimItem(aPayload, oRule, oPayload, iHistFreq, iAllowedFreq, fTotalAmount);
        return oPayload;

    },

    /**
    * To parse oPayload.CheckFields array into a key value object. To avoid repeated array searching when accessing field values
    * @private
    * @param {Object} oPayload - payload contains user input passed from frontend
    * @returns {Object} aPayload - return key user input value in the form of object based on selected claim type item
    */
    _parsePayload: function (oPayload) {
        var sRegionId;

        for (let i = 0; i < oPayload.CheckFields.length; i++) {
            //Convert the Payload values
            try {
                oPayload.CheckFields[i].value = JSON.parse(oPayload.CheckFields[i].value);
            } catch (error) {
                // no handler, remain as string
            }

            switch (oPayload.CheckFields[i].fieldName) {
                case Constant.EntitiesFields.REGION_ID:
                    sRegionId = oPayload.CheckFields[i].value;
                    break;
                case Constant.EntitiesFields.TOTAL_TRAVELLER:
                    iTotalTraveler = oPayload.CheckFields[i].value ? oPayload.CheckFields[i].value : 1;  // if null then default to 1
                    break;
                case Constant.EntitiesFields.TRAVEL_DAYS_ID:
                    sTravelDaysId = oPayload.CheckFields[i].value;
                    break;

            }
        }

        return { sRegionId, iTotalTraveler, sTravelDaysId };
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
            0,
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

        return oCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
            sCurrentItemcondition,
            tx);
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Array} aPayload - key user input value in the form of object based on selected claim type item
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    */
    _validateClaimItem: function (aPayload, oRule, oPayload, iExistingFreq, iAllowedFreq, fTotalAmount) {
        var iIndex;

        switch (oPayload.ClaimTypeItem) {
            // PINDAH - return true if claim amount is less than eligible amount
            case Constant.ClaimTypeItem.PINDAH:
                // PINDAH - reject if there is historical claims within same Period based on frequency
                if (iExistingFreq >= iAllowedFreq) {
                    throw new Error("Claim Type has already been submitted previously.");
                }

                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {
                        // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        // current payload amount + total amount from all items
                        var fCurrentTotal = parseFloat(oPayload.CheckFields[iIndex].value) + parseFloat(fTotalAmount);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            fCurrentTotal,
                            parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;

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
            
            // HOTEL - return true if claim amount is less than eligible amount * travel days
            case Constant.ClaimTypeItem.HOTEL_L:
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
                            parseFloat(oRule.ELIGIBLE_AMOUNT) * parseFloat(aPayload.sTravelDaysId) * parseFloat(aPayload.iTotalTraveler)
                        );
                    }
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
        }
    }
};