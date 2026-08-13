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

        // Skip eligibility check for Cash Repay
        if (oPayload.ClaimTypeItem === Constant.ClaimTypeItem.CASH_REPAY) {
            return oPayload;
        }

        //Filter rules based on claimant's employee type
        const bHasSpecificRole = aRules.some(
            rule => rule.ROLE_ID === oEmp.ROLE
        );

        aRules = aRules.filter(rule =>
            bHasSpecificRole
                ? rule.ROLE_ID === oEmp.ROLE
                : rule.ROLE_ID === Constant.Wildcard.All
        );

        oRule = aRules[0];

        //If no rule found for claimant's employee type, throw error
        if (!oRule) {
            throw new Error("You are not eligible for this claim.");
        };

        //Get all record under the same claim/request
        var oCurrentRecordItemData = await this._getCurrentRecordItemData(oPayload, tx);

        await this._validateClaimItem(oRule, oPayload, oEmp, tx, oCurrentRecordItemData);

        return oPayload;
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    * @param {Object} oEmp - Employee Data
    * @param {Object} tx - CDS Transaction
    * @param {Object} oCurrentRecordItemData - Data for the current record item
    */
    _validateClaimItem: async function (oRule, oPayload, oEmp, tx, oCurrentRecordItemData) {
        var iIndex, iIndexNationalID, sHeaderTable, sHeaderField, sStatusField, sItemField, sItemTable, sPolicyField;
        var iClaimPolicyYear, iRequestPolicyYear, iPolicyYear;
        var aSamePolicyYearItems;

        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            // this checks specific for Claim Submission only
            // Check if the policy is in Previous, Current or Next Year
            iIndex = oPayload.CheckFields.findIndex(field => field.fieldName === Constant.EntitiesFields.POLICY_YEAR);
            if (iIndex === -1) { return; }

            //Valid to claim for policy year before current year, current year, and next year
            iClaimPolicyYear = Number(oPayload.CheckFields[iIndex].value);
            iPolicyYear = iClaimPolicyYear;

            const iCurrentYear = new Date().getFullYear();
            const aAllowedYears = [iCurrentYear - 1, iCurrentYear, iCurrentYear + 1];

            if (!aAllowedYears.includes(Number(iClaimPolicyYear))) {
                throw new Error(`Policy Start Date must be within ${iCurrentYear - 1}, ${iCurrentYear}, or ${iCurrentYear + 1}.`);
            }

        } else {
            //this checks specific for Pre Approval Request
            //check if the year chosen is current year
            iIndex = oPayload.CheckFields.findIndex(field => field.fieldName === Constant.EntitiesFields.POLICY_YEAR);

            if (iIndex === -1) {
                return;
            }

            const iCurrentYear = new Date().getFullYear();
            iRequestPolicyYear = Number(oPayload.CheckFields[iIndex].value);
            iPolicyYear = iRequestPolicyYear;
            if (iRequestPolicyYear !== iCurrentYear) {
                throw new Error(`Policy Year must be the current year (${iCurrentYear}).`);
            }
        }

        //Check if this dependent already claim for the choosen year (policy start date) - check in the submitted item and also current claim
        //1 dependent, 1 policy per year  
        iIndexNationalID = oPayload.CheckFields.findIndex(field => field.fieldName === Constant.EntitiesFields.DEPENDENT_NATIONAL_ID);

        if (iIndexNationalID === -1) {
            return;
        }

        if (oPayload.RecordId.substring(0, 3) == Constant.WorkflowType.CLAIM) {
            sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sStatusField = Constant.EntitiesFields.CLAIM_STATUS;
            sItemField = Constant.EntitiesFields.CLAIM_SUB_ID;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
            sPolicyField = Constant.EntitiesFields.POLICY_YEAR
        } else {
            sHeaderTable = Constant.Entities.ZREQUEST_HEADER;
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sStatusField = Constant.EntitiesFields.STATUS;
            sItemField = Constant.EntitiesFields.REQUEST_SUB_ID;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
            sPolicyField = Constant.EntitiesFields.POLICY_YEAR;
        }

        const sDependentNationalId = oPayload.CheckFields[iIndexNationalID].value;

        const aItemConditions = {
            [Constant.EntitiesFields.DEPENDENT_NATIONAL_ID]: sDependentNationalId,
            [sItemField]: { [Constant.ComparisonOperators.NotEquals]: oPayload.RecordSubId }
        };

        const sItemWhereClause = BuildSelectWhereConditions.buildWhereCondition(aItemConditions);

        const aExistingItems = await tx.run(
            SELECT.from(sItemTable)
                .columns(
                    sHeaderField,
                    sItemField,
                    sPolicyField
                )
                .where(`${sItemWhereClause}`)
        );

        aSamePolicyYearItems = aExistingItems.filter(oItem => {
            const vExistingPolicyValue = oItem[sPolicyField];
            if (!vExistingPolicyValue) {
                return false;
            }
            let iExistingPolicyYear;
            iExistingPolicyYear = Number(vExistingPolicyValue);

            return iExistingPolicyYear === iPolicyYear;
        });

        if (aSamePolicyYearItems.length > 0) {
            const bDuplicateInCurrentRecord = aSamePolicyYearItems.some(
                oItem => oItem[sHeaderField] === oPayload.RecordId
            );

            if (bDuplicateInCurrentRecord) {
                throw new Error("A policy with same policy year has already been added in this Claim/Request for this dependent");
            }

            const aOtherRecordIds = [
                ...new Set(
                    aSamePolicyYearItems
                        .map(oItem => oItem[sHeaderField])
                        .filter(sRecordId => sRecordId !== oPayload.RecordId)
                )
            ];

            if (aOtherRecordIds.length > 0) {
                const aStatus = [
                    Constant.Status.APPROVED,
                    Constant.Status.PENDING_APPROVAL,
                    Constant.Status.PUSH_BACK,
                    Constant.Status.COMPLETED_DISBURSEMENT
                ];

                const aHeaderConditions = {
                    [sHeaderField]: { in: aOtherRecordIds },
                    [sStatusField]: { in: aStatus }
                };

                const sHeaderWhereClause =
                    BuildSelectWhereConditions.buildWhereCondition(aHeaderConditions);

                const aExistingHeaders = await tx.run(
                    SELECT.from(sHeaderTable)
                        .columns(sHeaderField, sStatusField)
                        .where(`${sHeaderWhereClause}`)
                );

                if (aExistingHeaders.length > 0) {
                    throw new Error("There is already an approved or pending claim for this dependent with same policy year.");
                }
            }
        }

        // For Pre Approval Request:
        // Also check if same dependent already has same policy year in Claim Submission with Approved or Pending Approval status.
        // This prevents employee from creating PAR/Cash Advance when policy already exists in CLM.
        const bIsClaimSubmission = oPayload.RecordId.substring(0, 3) === Constant.WorkflowType.CLAIM;

        if (!bIsClaimSubmission) {
            const aClaimItemConditions = {
                [Constant.EntitiesFields.DEPENDENT_NATIONAL_ID]: sDependentNationalId
            };

            const sClaimItemWhereClause =
                BuildSelectWhereConditions.buildWhereCondition(aClaimItemConditions);

            const aExistingClaimItems = await tx.run(
                SELECT.from(Constant.Entities.ZCLAIM_ITEM)
                    .columns(
                        Constant.EntitiesFields.CLAIMID,
                        Constant.EntitiesFields.CLAIM_SUB_ID,
                        Constant.EntitiesFields.POLICY_YEAR
                    )
                    .where(`${sClaimItemWhereClause}`)
            );

            const aSamePolicyYearClaimItems = aExistingClaimItems.filter(oItem => {
                const vExistingPolicyValue =
                    oItem[Constant.EntitiesFields.POLICY_YEAR];

                if (!vExistingPolicyValue) {
                    return false;
                }

                const iExistingPolicyYear = Number(vExistingPolicyValue);

                return iExistingPolicyYear === iPolicyYear;
            });

            if (aSamePolicyYearClaimItems.length > 0) {
                const aClaimIds = [
                    ...new Set(
                        aSamePolicyYearClaimItems
                            .map(oItem => oItem[Constant.EntitiesFields.CLAIMID])
                            .filter(Boolean)
                    )
                ];

                if (aClaimIds.length > 0) {
                    const aClaimStatus = [
                        Constant.Status.APPROVED,
                        Constant.Status.PENDING_APPROVAL,
                        Constant.Status.PUSH_BACK,
                        Constant.Status.COMPLETED_DISBURSEMENT
                    ];

                    const aClaimHeaderConditions = {
                        [Constant.EntitiesFields.CLAIMID]: { in: aClaimIds },
                        [Constant.EntitiesFields.CLAIM_STATUS]: { in: aClaimStatus }
                    };

                    const sClaimHeaderWhereClause =
                        BuildSelectWhereConditions.buildWhereCondition(aClaimHeaderConditions);

                    const aExistingClaimHeaders = await tx.run(
                        SELECT.from(Constant.Entities.ZCLAIM_HEADER)
                            .columns(
                                Constant.EntitiesFields.CLAIMID,
                                Constant.EntitiesFields.CLAIM_STATUS
                            )
                            .where(`${sClaimHeaderWhereClause}`)
                    );

                    if (aExistingClaimHeaders.length > 0) {
                        throw new Error(
                            "This dependent already has an approved or pending claim with the same policy year. You cannot create a Pre Approval Request for the same dependent and policy year."
                        );
                    }
                }
            }
        }

        //Check if the total claim + used is more than the Eligible Amount
        iIndex = oPayload.CheckFields.findIndex(
            field => field.fieldName === Constant.EntitiesFields.ELIGIBLE_AMOUNT
        );

        if (iIndex === -1) {
            return;
        }

        const iCurrentClaimItemAmount = Number(oPayload.CheckFields[iIndex].value || 0);
        const iTotalClaimAmount =
            Number(oCurrentRecordItemData.fTotalAmount || 0) +
            iCurrentClaimItemAmount;

        const iNetClaimAmount = await this._getNetClaimAmountForEntitlement(
            oPayload,
            iTotalClaimAmount,
            tx
        );

        const oEntitlementUsed = await tx.run(
            SELECT.one
                .from(Constant.Entities.ZEMP_MASTER)
                .columns(Constant.EntitiesFields.MEDICAL_INSURANCE_ENTITLEMENT)
                .where({ EEID: oEmp.EEID })
        );

        const iTotalClaimedAmount =
            Number(oEntitlementUsed?.MEDICAL_INSURANCE_ENTITLEMENT || 0) +
            iNetClaimAmount;

        let bResult = false;

        if (oRule) {
            bResult =
                oRule.ELIGIBLE_AMOUNT === Constant.UnlimitedAmount ||
                ComparisonOperators.LesserEquals(
                    iTotalClaimedAmount,
                    parseFloat(oRule.ELIGIBLE_AMOUNT)
                );
        }

        oPayload.CheckFields[iIndex].result = bResult;
    },

    _getCurrentRecordItemData: async function (oPayload, tx) {
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

        const aCurrentItemcondition = {
            [Constant.EntitiesFields.EMP_ID]: oPayload.EmpId,
            [sHeaderField]: oPayload.RecordId,
            [sItemField]: { [Constant.ComparisonOperators.NotEquals]: oPayload.RecordSubId },
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: oPayload.ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: oPayload.ClaimTypeItem
        };

        const sCurrentItemcondition = BuildSelectWhereConditions.buildWhereCondition(aCurrentItemcondition);

        const oCurrentData = await GetHistoricalData.getCurrentItemData(
            sItemTable,
            sCurrentItemcondition,
            tx
        );

        return oCurrentData;
    },

    _getLinkedCashAdvanceAmount: async function (oPayload, tx) {

        const bIsClaimSubmission =
            oPayload.RecordId.substring(0, 3) === Constant.WorkflowType.CLAIM;

        if (!bIsClaimSubmission) {
            return 0;
        }

        const oClaimHeader = await tx.run(
            SELECT.one
                .from(Constant.Entities.ZCLAIM_HEADER)
                .columns(Constant.EntitiesFields.CASH_ADVANCE_AMOUNT)
                .where({
                    [Constant.EntitiesFields.CLAIMID]: oPayload.RecordId
                })
        );

        return Number(
            oClaimHeader?.[Constant.EntitiesFields.CASH_ADVANCE_AMOUNT] || 0
        );
    },

    _getNetClaimAmountForEntitlement: async function (oPayload, iTotalClaimAmount, tx) {
        const bIsClaimSubmission = oPayload.RecordId.substring(0, 3) === Constant.WorkflowType.CLAIM;

        if (!bIsClaimSubmission) {
            return iTotalClaimAmount;
        }

        const iLinkedCashAdvanceAmount =
            await this._getLinkedCashAdvanceAmount(oPayload, tx);

        if (iLinkedCashAdvanceAmount <= 0) {
            return iTotalClaimAmount;
        }

        const iNetClaimAmount = Math.max(
            iTotalClaimAmount - iLinkedCashAdvanceAmount,
            0
        );

        return iNetClaimAmount;
    }
};