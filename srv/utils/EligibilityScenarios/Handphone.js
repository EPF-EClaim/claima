const { Constant } = require("../constant");
const ComparisonOperators = require("../ComparisonOperators");
const GetHistoricalData = require("../GetHistoricalData");
const BuildSelectWhereConditions = require("../BuildSelectWhereConditions");
module.exports = {
  /**
   * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
   * @public
   * @param {Object} oPayload - payload contains user input passed from frontend
   * @param {Object} oEmp - Employee Data
   * @param {Array} aRules - list of eligibility rule from backend
   * @param {Object} tx - CDS Transaction
   * @returns {Object} oPayload - return original payload but with result field filled
   */
  onEligibleCheck: async function (oPayload, oEmp, aRules, tx) {
    var oRule, oDateRange;
    var iAllowedFreq = 0;
    var iItemFreq = 0;
    try {
      if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.REQUEST) {
        oRule = aRules[0];
      } else if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
        oRule = await this._SequenceCheck(oPayload, oEmp, aRules, tx);

        oDateRange = await this._getDateRange(oPayload, tx);
        iItemFreq = oDateRange.iItemFreq;

        var iHistoricalData = await this._getHistoricalData(
          oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);

        var oCurrentRecordItemData = await this._getCurrentRecordItemData(
          oPayload, oDateRange.oDatetoFrom.dDateTo, oDateRange.oDatetoFrom.dDateFrom, tx);

        iAllowedFreq = iHistoricalData + oCurrentRecordItemData.iItemCount;
      }
    } catch (error) {
      throw new Error(`${error.message}`);
    };
    this._validateClaimItem(
      oRule, oPayload, iAllowedFreq, iItemFreq);

    return oPayload;
  },
  /**
   * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
   * @public
   * @param {Object} oPayload - payload contains user input passed from frontend
   * @param {Object} oEmp - Employee Data
   * @param {Array} aRules - list of eligibility rule from backend
   * @param {Object} tx - CDS Transaction
   * @returns {Object} oPayload - return original payload but with result field filled
   */
  _SequenceCheck: async function (oPayload, oEmp, aRules, tx) {
    var oRule;

    //Check if there is value in aRules table
    if (!!aRules) {
      // Check for employee Role
      aFilteredRules = aRules.filter(function (rule) {
        return rule.ROLE_ID === oEmp.ROLE;
      })
      if (!(!!aFilteredRules[0])) {
        // Check for employee Job Group with cost center
        aCostCenterRule = aRules.filter(function (rule) {
          return ((rule.JOB_GROUP === oEmp.JOB_GROUP) && (rule.COST_CENTER != null));
        });
        if ((!!aCostCenterRule[0]) && (oEmp.CC.includes(aCostCenterRule[0].COST_CENTER))) {
          aFilteredRules = aCostCenterRule;
        } else {
          // if employee cost center does not contain the value, means user is outside of branch
          aFilteredRules = aRules.filter(function (rule) {
            return ((rule.JOB_GROUP === oEmp.JOB_GROUP) && (rule.COST_CENTER == null));
          })
        };
        if (!(!!aFilteredRules[0])) {
          // Check for Employee Grade
          aFilteredRules = aRules.filter(function (rule) {
            return rule.PERSONAL_GRADE === oEmp.GRADE;
          })
          if (!(!!aFilteredRules[0])) {
            // Check Exception list
            oExceptionData = await this._getExceptionData(oPayload, tx);
          }
        }
      }
    } else {
      //if no Eligibility table data, check exception list
      oExceptionData = await this._getExceptionData(oPayload, tx);
    }

    if (!!aFilteredRules[0]) {
      oRule = aFilteredRules[0];
    } else if (!!oExceptionData) {
      oRule = oExceptionData;
    }
    return oRule;
  },

  /**
       * Get Data Range based on RECEIPT_DATE in Payload Checkfields
       * @private
       * @param {Object} oPayload - payload contains user input passed from frontend
       * @param {Object} tx - CDS Transaction
       * @returns {Array} oDatetoFrom - Array filled with Date From and Date To
       */
  _getDateRange: async function (oPayload, tx) {
    // get Date Range
    iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE);
    if (iIndex == -1) return;
    return oDatetoFrom = await GetHistoricalData.getDateRange(
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

    return oCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
      sCurrentItemcondition,
      tx);
  },

  /**
    * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
    * @public
    * @param {Object} oPayload - payload contains user input passed from frontend
    * @param {Object} tx - CDS Transaction
    * @returns {Object} oExceptionData - return Exception table data
    */
  _getExceptionData: async function (oPayload, tx) {
    // If No data from Rules Table, refer to Exception list table
    const sExceptionTable = Constant.Entities.ZCLM_TYPE_EXCEPTION_LIST;

    iIndex = oPayload.CheckFields.findIndex(
      (field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE,
    );
    if (iIndex == -1) return;

    const aExceptionCondition = {
      [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
      [Constant.EntitiesFields.CLAIM_TYPE_ID]: Constant.ClaimType.HANDPHONE,
      [Constant.EntitiesFields.START_DATE]: { [Constant.ComparisonOperators.LesserEquals]: oPayload.CheckFields[iIndex].value },
      [Constant.EntitiesFields.END_DATE]: { [Constant.ComparisonOperators.GreaterEquals]: oPayload.CheckFields[iIndex].value }
    };
    const sExceptionConditions = BuildSelectWhereConditions.buildWhereCondition(aExceptionCondition);
    // Get Exception List Data
    var sCreatedAtDesc = Constant.EntitiesFields.MANAGED_CREATEDAT + " " + Constant.WhereCondition.DESC;
    const oExceptionData = await tx.run(
      SELECT.one.from(sExceptionTable).where(`${sExceptionConditions}`).orderBy(`${sCreatedAtDesc}`)
    );
    return oExceptionData;
  },

  /**
   * Validates claim item against eligibility rule
   * @private
   * @param {Object} oRule - matched eligibility rule from aRules
   * @param {Object} oPayload - original payload from user input
   * @param {Integer} iExistingFreq - Date frequency count
   * @param {Integer} iAllowedFreq - Rules Frequency Count
   */
  _validateClaimItem: function (oRule, oPayload, iExistingFreq, iAllowedFreq) {
    var iIndex;

    switch (oPayload.ClaimTypeItem) {
      case Constant.ClaimTypeItem.TELEFON_B:
        // I-PAD - return true if there is no historical claims within same Year/Month based on frequency and period
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
          iIndex = oPayload.CheckFields.findIndex(
            (field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE,
          );
          if (iIndex == -1) return;
          if ((!!oRule) && (iExistingFreq < iAllowedFreq)) {
            oPayload.CheckFields[iIndex].result = true;
          } else {
            oPayload.CheckFields[iIndex].result = false;
          }
        }

        iIndex = null;
        // I-PAD - return true if claim amount is less than eligible amount
        iIndex = oPayload.CheckFields.findIndex(
          (field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT,
        );
        if (iIndex == -1) return;
        if (!oRule) {
          oPayload.CheckFields[iIndex].result = false;
        } else {
          // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
          // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
          if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
            oPayload.CheckFields[iIndex].result = true;
          } else {
            oPayload.CheckFields[iIndex].result =
              ComparisonOperators.LesserEquals(
                oPayload.CheckFields[iIndex].value,
                parseFloat(oRule.ELIGIBLE_AMOUNT),
              );
          }
        }
        break;
    }
  },
};
