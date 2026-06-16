const { Constant } = require("./constant");

module.exports = {
    /**
        * Update Used Entitlement Amount for each dependent
        * @public
        * @param {String} sRecordId - Claims / Request Record ID
        * @param {String} sStatus - Status to be updated into header tables
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} result number of records updated in header tables
        */
    updateUsedEntitlementAmount: async function (sRecordId, sStatus, tx) {

        if (!sRecordId || !sStatus) {
            throw new Error("Missing required parameters: sRecordId and sStatus are mandatory.");
        }

        let sHeaderField, sItemTable;
        if (sRecordId.substring(0, 3) === Constant.WorkflowType.CLAIM) {
            sHeaderField = Constant.EntitiesFields.CLAIMID;
            sItemTable = Constant.Entities.ZCLAIM_ITEM;
        } else {
            sHeaderField = Constant.EntitiesFields.REQUESTID;
            sItemTable = Constant.Entities.ZREQUEST_ITEM;
        }

        const aSubmittedItems = await tx.run(
            SELECT.from(sItemTable).where({ [sHeaderField]: sRecordId }));

        if (!aSubmittedItems || aSubmittedItems.length === 0) return;

        const sEmpId = aSubmittedItems[0].EMP_ID;

        //Aggregate total claim amounts by unique Dependent ID
        const oDependentTotals = {};
        aSubmittedItems.forEach(item => {
            if (item.DEPENDENT) {
                const sCleanDepId = String(item.DEPENDENT).replace(/[^0-9]/g, '');
                const iAmount = parseFloat(item.AMOUNT || 0);
                if (sCleanDepId) {
                    oDependentTotals[sCleanDepId] = (oDependentTotals[sCleanDepId] || 0) + iAmount;
                }
            }
        });

        const todayStr = new Date().toISOString().split('T')[0];

        //Process each unique dependent balance transformation loop
        for (const [sDepId, iTotalFormAmount] of Object.entries(oDependentTotals)) {

            const oDependentMaster = await tx.run(
                SELECT.one.from(Constant.Entities.ZEMP_DEPENDENT).where({
                    EMP_ID: sEmpId,
                    DEPENDENT_NO: sDepId
                })
            );

            if (!oDependentMaster) continue;

            // Current state values running in history profile
            let iCurrentUtilizedAmount = parseFloat(oDependentMaster.POST_EDU_ASSISTANT_ENTITLE_AMOUNT || 0);
            let sFinalClaimDate = oDependentMaster.POST_EDU_ASSISTANT_CLAIM_DATE;
            let iNewBalance = iCurrentUtilizedAmount;

            if (sStatus === Constant.Status.PENDING_APPROVAL) {

                iNewBalance = iCurrentUtilizedAmount + iTotalFormAmount;

                if (!sFinalClaimDate) {
                    sFinalClaimDate = todayStr;
                }
            } else if (sStatus === Constant.Status.REJECTED || sStatus === Constant.Status.CANCELLED) {

                iNewBalance = iCurrentUtilizedAmount - iTotalFormAmount;

                // If balance drops back to zero, erase the stamped baseline eligibility window date
                if (iNewBalance === 0) {
                    sFinalClaimDate = null;
                }
            } else {
                continue;
            }
            await tx.run(
                UPDATE(Constant.Entities.ZEMP_DEPENDENT)
                    .set({
                        POST_EDU_ASSISTANT_ENTITLE_AMOUNT: iNewBalance,
                        POST_EDU_ASSISTANT_CLAIM_DATE: sFinalClaimDate
                    })
                    .where({
                        EMP_ID: sEmpId,
                        DEPENDENT_NO: sDepId
                    })
            );
        }
    }
}

