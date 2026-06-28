const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators');
const BuildSelectWhereConditions = require("../BuildSelectWhereConditions");
const GetHistoricalData = require("../GetHistoricalData");
module.exports = {
    /**
     * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
     * @public
     * @param {Object} oPayload - payload contains user input passed from frontend
     * @param {Object} oEmp - Employee Data
     * @param {Object} tx - CDS Transaction
     * @returns {Object} oPayload - return original payload but with result field filled
     */
    onEligibleCheck: async function (oPayload, tx) {
        const oDependentData = await this._getAndValidateDependent(oPayload, tx);
        //if empty then consider as first claim for this dependent
        //if date present, then it means that claimant has made claim for this dependent
        if (oDependentData.POST_EDU_ASSISTANT_CLAIM_DATE) {
            await this._checkClaimWindow(oPayload, oDependentData.POST_EDU_ASSISTANT_CLAIM_DATE, tx);
        }
        await this._validateMaxDependentLimit(oPayload, oDependentData, tx);
        var oCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, oDependentData, tx);
        await this._validateClaimItem(oPayload, oDependentData, oCurrentRecordItemData, tx);
        return oPayload;
    },

    _validateMaxDependentLimit: async function (oPayload, oDependentData, tx) {
        const aHistoricalClaimedDeps = await tx.run(
            SELECT.from(Constant.Entities.ZEMP_DEPENDENT)
                .where({
                    EMP_ID: oPayload.EmpId,
                    POST_EDU_ASSISTANT_CLAIM_DATE: { '!=': null }
                })
        );

        // Collect unique dependent numbers from history
        const sClaimedDepIds = new Set(aHistoricalClaimedDeps.map(dep => String(dep.DEPENDENT_NO)));

        // Check in same claim if there is multiple lines with different dependent 
        let sHeaderField, sItemTable;
        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
        } else {
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
        }
        const aDraftItems = await tx.run(
            SELECT.from(sItemTable).where({
                [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
                [sHeaderField]: oPayload.RecordId
            })
        );
        aDraftItems.forEach(item => {
            if (item.DEPENDENT) {
                const sCleaned = String(item.DEPENDENT).replace(/[^0-9,]/g, '');
                sCleaned.split(',').forEach(id => {
                    if (id.trim()) sClaimedDepIds.add(id.trim());
                });
            }
        });

        sClaimedDepIds.add(oDependentData.DEPENDENT_NO);
        if (sClaimedDepIds.size > 3) {
            throw new Error(`Claim rejected. The employee has already hit the maximum limit of 3 unique dependent for this claim type.`);
        }
    },

    _getAndValidateDependent: async function (oPayload, tx) {
        const iDepIndex = oPayload.CheckFields.findIndex((field) => field.fieldName === Constant.EntitiesFields.DEPENDENT);
        if (iDepIndex === -1 || !oPayload.CheckFields[iDepIndex].value) {
            throw new Error("Dependent ID is required.");
        }
        const oDependentData = await tx.run(
            SELECT.one
                .from(Constant.Entities.ZEMP_DEPENDENT)
                .where({
                    EMP_ID: oPayload.EmpId,
                    DEPENDENT_NO: String(oPayload.CheckFields[iDepIndex].value).replace(/[^0-9]/g, '')
                })
        );
        if (!oDependentData) {
            throw new Error("Dependent record not found in system.");
        }
        return oDependentData;
    },

    _checkClaimWindow: async function (oPayload, sFirstClaimDateStr, tx) {
        var iIndex;
        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE);
        if (iIndex == -1) return;
        const dCurrentReceiptDate = new Date(oPayload.CheckFields[iIndex].value);
        const dFirstClaimDate = new Date(sFirstClaimDateStr);
        const dDeadlineDate = new Date(dFirstClaimDate);

        const oConstantRecord = await tx.run(
            SELECT.one.from(Constant.Entities.ZCONSTANTS)
                .columns(Constant.EntitiesFields.VALUE)
                .where({ ID: Constant.ConstantId.DEFAULT_EDU_ELIGIBLE_YEAR })
        );

        if (!oConstantRecord || isNaN(Number(oConstantRecord.VALUE))) {
            throw new Error("Configuration Error: 'DEFAULT_EDU_ELIGIBLE_YEAR' could not be found or is invalid in ZCONSTANTS table.");
        }

        const iEligibleYears = Number(oConstantRecord.VALUE);
        dDeadlineDate.setFullYear(dDeadlineDate.getFullYear() + iEligibleYears);

        if (dCurrentReceiptDate > dDeadlineDate) {
            throw new Error(`Claim Type has exceeded this dependent's ${iEligibleYears}-year eligibility window.`);
        }
    },

    _validateClaimItem: async function (oPayload, oDependentData, oCurrentRecordItemData, tx) {
        var iIndex;
        iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
        if (iIndex == -1) return;

        const oEntitlementConstant = await tx.run(
            SELECT.one.from(Constant.Entities.ZCONSTANTS)
                .columns(Constant.EntitiesFields.VALUE)
                .where({ ID: Constant.ConstantId.DEFAULT_EDU_ENTITLEMENT_AMOUNT })
        );

        // Validate that the constant configuration exists
        if (!oEntitlementConstant || isNaN(parseFloat(oEntitlementConstant.VALUE))) {
            throw new Error("Configuration Error: 'DEFAULT_EDU_ENTITLEMENT_AMOUNT' could not be found or is invalid in ZCONSTANTS table.");
        }

        const iDefaultEntitlementAmount = parseFloat(oEntitlementConstant.VALUE);
        let iMaxLimitAllowed = 0;

        if (!oDependentData.POST_EDU_ASSISTANT_CLAIM_DATE) {
            // First-time claim: Max limit is exactly the value from ZCONSTANTS
            iMaxLimitAllowed = iDefaultEntitlementAmount;
        } else {
            // Subsequent claim: Max limit is ZCONSTANTS value minus total historical utilized amount
            const iUtilizedAmount = parseFloat(oDependentData.POST_EDU_ASSISTANT_ENTITLE_AMOUNT || 0);
            iMaxLimitAllowed = iDefaultEntitlementAmount - iUtilizedAmount;
        }
        
        const iTotalClaimAmount = parseFloat(oCurrentRecordItemData.fTotalAmount || 0) + parseFloat(oPayload.CheckFields[iIndex].value);

        if (iMaxLimitAllowed === 0) {
            oPayload.CheckFields[iIndex].result = { limit: iMaxLimitAllowed, defaultLimit: iDefaultEntitlementAmount };
        } else {
            oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEqualsReturnSpecial(
                iTotalClaimAmount,
                iMaxLimitAllowed,
                oCurrentRecordItemData.fTotalAmount,
                iDefaultEntitlementAmount
            );
        }
    },

    //get all line item of the same claim (for this dependent) - need to check the total amount of the claim with remaining eligible amount
    _getCurrentRecordItemData: async function (oPayload, oDependentData, tx) {
        var sHeaderField, sItemTable, sItemField;
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

        const sCleanDepId = String(oDependentData.DEPENDENT_NO).replace(/[^0-9]/g, '');

        const aCurrentItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [sHeaderField]: oPayload.RecordId,
            [sItemField]: { [Constant.ComparisonOperators.NotEquals]: oPayload.RecordSubId },
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem,
            // Dependent is stringified arrays
            DEPENDENT: { like: `%${sCleanDepId}%` }
        };

        const sCurrentItemcondition = BuildSelectWhereConditions.buildWhereCondition(aCurrentItemcondition);

        return oCurrentData = await GetHistoricalData.getCurrentItemData(sItemTable,
            sCurrentItemcondition,
            tx);
    }
};