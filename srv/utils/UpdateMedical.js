const { Constant } = require("./constant");

module.exports = {
    /**
        * Update Used Entitlement Amount for the Employee
        * @public
        * @param {String} sRecordId - Claims / Request Record ID
        * @param {String} sStatus - Status to be updated into header tables
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} result number of records updated in header tables
        */
    updateUsedMedicalAmount: async function (sRecordId, sStatus, tx) {
        let bIsClaim;
        let sHeaderField;
        let sHeaderTable;
        let sAmountField;
        let sItemTable;

        bIsClaim = false;

        if (!sRecordId || !sStatus) {
            throw new Error(
                "Missing required parameters: sRecordId and sStatus are mandatory."
            );
        }

        if (sRecordId.substring(0, 3) === Constant.WorkflowType.CLAIM) {
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
            sAmountField = Constant.EntitiesFields.TOTAL_CLAIM_AMOUNT;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
            bIsClaim = true;
        } else {
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sHeaderTable = Constant.Entities.ZREQUEST_HEADER;
            sAmountField = Constant.EntitiesFields.CASH_ADVANCE;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
            bIsClaim = false;
        }

        const oHeader = await tx.run(
            SELECT.one
                .from(sHeaderTable)
                .where({ [sHeaderField]: sRecordId }));

        if (!oHeader || (oHeader.CLAIM_TYPE_ID !== Constant.ClaimType.MEDICAL && oHeader.CLAIM_TYPE_ID !== Constant.ClaimType.MEDICAL_ADVANCE)) {
            return;
        }

        const aSubmittedItems = await tx.run(
            SELECT.from(sItemTable).where({ [sHeaderField]: sRecordId }));
        const iTotalCashRepayment = aSubmittedItems.reduce(
            (iTotal, oItem) =>
                oItem.CLAIM_TYPE_ITEM_ID === Constant.ClaimTypeItem.CASH_REPAY
                    ? iTotal + Number(oItem.AMOUNT || 0)
                    : iTotal,
            0
        );

        const sEmpId = oHeader.EMP_ID;
        let iAdjustmentAmount = parseFloat(oHeader[sAmountField] || 0);

        if (bIsClaim) {
            const iCashAdvanceAmount = Number(oHeader?.[Constant.EntitiesFields.CASH_ADVANCE_AMOUNT] || 0);
            let iTotalClaimAmount = Number(oHeader?.[Constant.EntitiesFields.TOTAL_CLAIM_AMOUNT] || 0);

            //if there is repayment, minus from the total claim
            if (iTotalCashRepayment !== 0) {
                iTotalClaimAmount -= iTotalCashRepayment;
            }

            if (iCashAdvanceAmount < iTotalClaimAmount) {
                iAdjustmentAmount = iTotalClaimAmount - iCashAdvanceAmount;
            } else if (iCashAdvanceAmount > iTotalClaimAmount) {
                iAdjustmentAmount = -iTotalCashRepayment;
            } else {
                iAdjustmentAmount = 0;
            }
        }

        const oEmpMaster = await tx.run(
            SELECT.one
                .from(Constant.Entities.ZEMP_MASTER)
                .where({ EEID: sEmpId })
        );

        if (!oEmpMaster) {
            return;
        }

        const iCurrentUtilizedAmount = parseFloat(oEmpMaster.MEDICAL_INSURANCE_ENTITLEMENT || 0);
        let iNewAmount = iCurrentUtilizedAmount;

        if (sStatus === Constant.Status.PENDING_APPROVAL) {
            iNewAmount = Math.max(0, iCurrentUtilizedAmount + iAdjustmentAmount);
        } else if (sStatus === Constant.Status.REJECTED || sStatus === Constant.Status.PUSH_BACK) {
            iNewAmount = Math.max(0, iCurrentUtilizedAmount - iAdjustmentAmount);
        } else {
            return;
        }

        await tx.run(
            UPDATE(Constant.Entities.ZEMP_MASTER)
                .set({
                    [Constant.EntitiesFields.MEDICAL_INSURANCE_ENTITLEMENT]: iNewAmount
                })
                .where({
                    [Constant.EntitiesFields.EEID]: sEmpId
                })
        );

    }

}