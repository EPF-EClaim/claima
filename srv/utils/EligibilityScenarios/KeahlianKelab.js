const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators');
const GetHistoricalData = require('../GetHistoricalData');
const BuildSelectWhereConditions = require("../BuildSelectWhereConditions");

module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Object} oEmp - Employee Data* 
         * @param {Array} aRules - list of eligibility rule from backend
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: async function (oPayload, oEmp, aRules, tx) {
        var oRule;

        //Filter rules based on claimant's employee type
        aRules = aRules.filter(function (rule) {
            return (rule.EMPLOYEE_TYPE == oEmp.EMPLOYEE_TYPE);
        });

        oRule = aRules[0];

        //If no rule found for claimant's employee type, throw error
        if (!oRule) {
            throw new Error("You are not eligible for this claim.");
        };

        var oDateRange = await this._getDateRange(oPayload, tx);
        var iHistFreq = await this._getHistoricalData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);
        var oCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);

        this._validateClaimItem(oRule, oPayload, iHistFreq, oDateRange.iItemFreq, oCurrentRecordItemData.fTotalAmount);
        return oPayload;
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    * @param {Integer} iExistingFreq - Date frequency count
    * @param {Integer} iAllowedFreq - Rules Frequency Count
    * @param {Number} fTotalAmount - Total amount of other S_K.KELAB items in the same claim/request
    */
    _validateClaimItem: function (oRule, oPayload, iExistingFreq, iAllowedFreq, fTotalAmount) {
        var iIndex;

        // S_K.KELAB - reject if there is historical claims within same Period based on frequency
        if (iExistingFreq >= iAllowedFreq) {
            throw new Error("Claim Type has exceeded allowed eligibility frequency.");
        }

        switch (oPayload.ClaimTypeItem) {
            case Constant.ClaimTypeItem.KEAHLIANKELAB:
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {
                        // total = current item amount + other S_K.KELAB items in the same claim/request
                        // if total 100 while Rules table has max amount 300, return true
                        // if total 1000 while Rules table has max amount 300, return max amount (300)
                        const fCurrentTotal = parseFloat(oPayload.CheckFields[iIndex].value) + parseFloat(fTotalAmount || 0);
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(
                            fCurrentTotal,
                            parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;
        }
    },

    /**
         * Get Data Range based on RECEIPT_DATE in Payload Checkfields
         * @private
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Object} tx - CDS Transaction
         * @returns {Promise<{oDatetoFrom: {dDateFrom: string, dDateTo: string}, iItemFreq: number}>} Date range and allowed frequency
         */
    _getDateRange: async function (oPayload, tx) {
        // get Date Range
        const iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE);
        if (iIndex == -1) return;
        return await GetHistoricalData.getDateRange(
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
        var sHeaderTable, sItemTable, sDateField;
        // get Historical Claims Data
        // Map ClaimID or RequestID based on which HeaderTable to use
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
            sDateField = Constant.EntitiesFields.RECEIPT_DATE;
        } else {
            sHeaderTable = Constant.Entities.ZREQUEST_HEADER
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
            sDateField = Constant.EntitiesFields.TRIP_START_DATE;
        }

        const oItemCondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType
        };

        // for frequencies other than once per service, date range needed
        if ((!!dDateFrom) && (!!dDateTo)) {
            oItemCondition[sDateField] = { between: [dDateFrom, dDateTo] }
        }

        const sItemCondition = BuildSelectWhereConditions.buildWhereCondition(oItemCondition);
        const iHistoricalData = await GetHistoricalData.getHistoricalData(sHeaderTable,
            sItemTable,
            sItemCondition,
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
         * @returns {Promise<{iItemCount: number, fTotalAmount: number}>} Count and total amount of other items in the same claim/request
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

        const oCurrentItemCondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [sHeaderField]: oPayload.RecordId,
            [sItemField]: { [Constant.ComparisonOperators.NotEquals]: oPayload.RecordSubId },
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem
        };

        // for frequencies other than once per service, date range needed
        if ((!!dDateFrom) && (!!dDateTo)) {
            oCurrentItemCondition[sDateField] = { between: [dDateFrom, dDateTo] }
        }

        const sCurrentItemCondition = BuildSelectWhereConditions.buildWhereCondition(oCurrentItemCondition);

        return await GetHistoricalData.getCurrentItemData(sItemTable,
            sCurrentItemCondition,
            tx);
    }

};