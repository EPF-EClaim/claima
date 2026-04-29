const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators')
const GetHistoricalData = require('../GetHistoricalData')
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
        var oRule = aRules[0];
        var oDateRange = await this._getDateRange(oPayload, tx);
        var iHistoricalData = await this._getHistoricalData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
        var oCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
        this._validateClaimItem(oRule, oPayload, iHistoricalData, oDateRange.iItemFreq, oCurrentRecordItemData.fTotalAmount);
        return oPayload;
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
        sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
        sItemTable = Constant.Entities.ZCLAIM_ITEM;

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
        var sHeaderField, sItemField, sItemTable, sDateField;
        // get Current Items Data
        // Map Headers and ClaimID or RequestID based on which ItemTable to use
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sItemField = Constant.EntitiesFields.CLAIM_SUB_ID;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
            sDateField = Constant.EntitiesFields.RECEIPT_DATE;
        } else {
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sItemField = Constant.EntitiesFields.REQUEST_SUB_ID;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
            sDateField = Constant.EntitiesFields.TRIP_START_DATE;
        }

        const aCurrentItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [sHeaderField]: oPayload.RecordId,
            [sItemField]: { [Constant.ComparisonOperators.NotEquals]: oPayload.RecordSubId },
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            [sDateField]: { between: [dDateFrom, dDateTo] }
        };
        const sCurrentItemcondition = BuildSelectWhereConditions.buildWhereCondition(aCurrentItemcondition);

        return oCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
            sCurrentItemcondition,
            tx);
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    * @param {Integer} iExistingFreq - Date frequency count
    * @param {Integer} iAllowedFreq - Rules Frequency Count
    */
    _validateClaimItem: function (oRule, oPayload, iExistingFreq, iAllowedFreq, fTotalAmount) {
        var iIndex;

        // ISTIADAT - reject if there is historical claims within same Period based on frequency
        if (iExistingFreq >= iAllowedFreq) {
            throw new Error("Claim Type has exceeded allowed eligibility frequency.");
        }

        switch (oPayload.ClaimTypeItem) {
            case Constant.ClaimTypeItem.ISTIADAT:
                // ISTIADAT - return true if claim amount is less than eligible amount
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
                        // current payload amount + total amount from all items
                        var fCurrentTotal = parseFloat(oPayload.CheckFields[iIndex].value) + parseFloat(fTotalAmount);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            fCurrentTotal,
                            parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;
        }
    }
};