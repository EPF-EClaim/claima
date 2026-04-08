const { Constant } = require("../constant");
const ComparisonOperators = require("../ComparisonOperators");
const GetHistoricalData = require("../GetHistoricalData");
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
  onEligibleCheck: async function (oPayload, oEmp, aRules, tx) {
    var oRule = [];
    var oExceptionData = [];
    var aFilteredRules;

    oRule = await this._SequenceCheck(oPayload, oEmp, aRules);

    var iHistoricalData = await this._getHistoricalData(oPayload, oRule, tx);
    var iCurrentRecordItemData = await this._getCurrentRecordItemData(
      oPayload,
      oRule,
      tx,
    );

    // console.log(iHistoricalData, iCurrentRecordItemData);
    this._validateClaimItem(
      oRule,
      oPayload,
      iHistoricalData + iCurrentRecordItemData,
    );
    return oPayload;
  },

  _SequenceCheck: async function (oPayload, oEmp, aRules, tx) {
    //Check if there is value in aRules table
    if (!!aRules) {
      // Check for employee Role
      aFilteredRules = aRules.filter(function (rule) {
        return rule.ROLE === oEmp.ROLE;
      })

      if (!(!!aFilteredRules[0])) {
        // Check for employee Job Group
        aFilteredRules = aRules.filter(function (rule) {
          return rule.JOB_GROUP === oEmp.JOB_GROUP;
        })

        if (!(!!aFilteredRules[0])) {
          // Check for Employee Grade
          aFilteredRules = aRules.filter(function (rule) {
            return rule.PERSONAL_GRADE === oEmp.GRADE;
          })

          if (!(!!aFilteredRules[0])) {
            // Check Exception list
            oExceptionData = await this._getExceptionData(oPayload, oRule, tx);
            oRule = oExceptionData;
          } else {
            oRule = aFilteredRules[0];
          }
        } else {
          oRule = aFilteredRules[0];
        }
      } else {
        oRule = aFilteredRules[0];
      }
    } else {
      //if no Eligibility table data, check exception list
      oExceptionData = await this._getExceptionData(oPayload, oRule, tx);
      oRule = oExceptionData;
    }
    return oRule;
  },

  /**
   * Get Historical Claims Data by building querying conditions and using GetHistoricalData for data retrieval
   * @public
   * @param {Object} oPayload - payload contains user input passed from frontend
   * @param {Object} oRule - Eligibility rule from backend
   * @param {Object} tx - CDS Transaction
   * @returns {Object} oPayload - return original payload but with result field filled
   */
  _getHistoricalData: async function (oPayload, oRule, tx) {
    let aDateToFrom = [];
    // get Historical Claims Data
    // find field for date
    iIndex = oPayload.CheckFields.findIndex(
      (field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE,
    );
    aDateToFrom = BuildSelectWhereConditions.getDateMonthRange(oPayload.CheckFields[iIndex].value);
    const dDateFrom = aDateToFrom.dDateFrom;
    const dDateTo = aDateToFrom.dDateTo;

    const aItemcondition = {
      [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
      [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
      [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
      [Constant.EntitiesFields.RECEIPT_DATE]: { between: [dDateFrom, dDateTo] }
    };

    //Stringify Where Conditions
    const sConditions = BuildSelectWhereConditions.buildWhereCondition(aItemcondition);
    // Get Current Claims Item count with same Frequency Period
    return iHistoricalData = await GetHistoricalData.getHistoricalData(
      Constant.Entities.ZCLAIM_HEADER,
      Constant.Entities.ZCLAIM_ITEM,
      sConditions,
      tx,
    );
  },

  /**
   * Get Current Claims Data by building querying conditions and using GetHistoricalData for data retrieval
   * @public
   * @param {Object} oPayload - payload contains user input passed from frontend
   * @param {Object} oRule - Eligibility rule from backend
   * @param {Object} tx - CDS Transaction
   * @returns {Object} oPayload - return original payload but with result field filled
   */
  _getCurrentRecordItemData: async function (oPayload, oRule, tx) {
    let aDateToFrom = [];
    // get Historical Claims Data
    // find field for date
    iIndex = oPayload.CheckFields.findIndex(
      (field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE,
    );

    aDateToFrom = BuildSelectWhereConditions.getDateMonthRange(oPayload.CheckFields[iIndex].value);

    const dDateFrom = aDateToFrom.dDateFrom;
    const dDateTo = aDateToFrom.dDateTo;

    //Map Headers
    // Map ClaimID or RequestID based on which HeaderTable to use
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

    //Stringify Where Conditions
    const sConditions = BuildSelectWhereConditions.buildWhereCondition(aCurrentItemcondition);
    // Get Current Claims Item count with same Frequency Period
    return iCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
      sConditions,
      tx);
  },

  _getExceptionData: async function (oPayload, tx) {
    // If No data from Rules Table, refer to Exception list table
    const sExceptionTable = Constant.Entities.ZCLM_TYPE_EXCEPTION_LIST;

    iIndex = oPayload.CheckFields.findIndex(
      (field) => field.fieldName === Constant.EntitiesFields.RECEIPT_DATE,
    );
    aDateToFrom = BuildSelectWhereConditions.getDateMonthRange(oPayload.CheckFields[iIndex].value);

    const dDateFrom = aDateToFrom.dDateFrom;
    const dDateTo = aDateToFrom.dDateTo;
    const aExceptionCondition = {
      [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
      [Constant.EntitiesFields.CLAIM_TYPE_ID]: Constant.ClaimType.HANDPHONE,
      [Constant.EntitiesFields.START_DATE]: { [Constant.ComparisonOperators.LesserEquals]: dDateFrom },
      [Constant.EntitiesFields.START_DATE]: { [Constant.ComparisonOperators.GreaterEquals]: dDateTo }
    };
    const sExceptionConditions = BuildSelectWhereConditions.buildWhereCondition(aExceptionCondition);
    // Get Exception List Data
    return aExceptionData = await tx.run(
      SELECT.from(sExceptionTable).where(`${sExceptionConditions}`)
    );
  },

  /**
   * Validates claim item against eligibility rule
   * @private
   * @param {Object} oRule - matched eligibility rule from aRules
   * @param {Object} oPayload - original payload from user input
   * @param {iFrequencyCount} - Date frequency count
   */
  _validateClaimItem: function (oRule, oPayload, iFrequencyCount) {
    var iIndex;

    switch (oPayload.ClaimTypeItem) {
      case Constant.ClaimTypeItem.TELEFON_B:
        // I-PAD - return true if there is no historical claims within same Year/Month based on frequency and period
        iIndex = oPayload.CheckFields.findIndex(
          (field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE,
        );
        // Frequency + 1 to accomodate checking for current claim id that is in draft
        var iFrequency = oRule.FREQUENCY + 1;
        if (iFrequencyCount < iFrequency) {
          oPayload.CheckFields[iIndex].result = true;
        } else {
          oPayload.CheckFields[iIndex].result = false;
        }

        iIndex = null;
        // I-PAD - return true if claim amount is less than eligible amount
        iIndex = oPayload.CheckFields.findIndex(
          (field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT,
        );
        if (!oRule) {
          oPayload.CheckFields[iIndex].result = false;
        } else {
          // if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
          // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
          oPayload.CheckFields[iIndex].result =
            ComparisonOperators.LesserEquals(
              oPayload.CheckFields[iIndex].value,
              parseFloat(oRule.ELIGIBLE_AMOUNT),
            );
        }
        break;
    }
  },
};
