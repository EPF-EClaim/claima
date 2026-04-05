const cds = require('@sap/cds');
const { SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("./constant");

module.exports = {
    getHistoricalData: async function (sHeaderTable, sItemTable, aItemcondition, tx) {
        let sDate = "";
        let sHeaderField = "";
        let aHeaders = [];
        let aStatus = [];

        // Get Item Data
        // Check if any Claim item is within frequency
        const aItemData = await tx.run(
            SELECT.from(sItemTable).where(aItemcondition)
        )

        //Map Headers
        // Map ClaimID or RequestID based on which HeaderTable to use
        if (sHeaderTable == Constant.Entities.ZCLAIM_HEADER) {
            aHeaders = aItemData.map(d => d.CLAIM_ID);
            sHeaderField = Constant.EntitiesFields.CLAIMID;
        } else {
            aHeaders = aItemData.map(d => d.REQUEST_ID);
            sHeaderField = Constant.EntitiesFields.REQUEST_ID;
        }
        
        // Map Claim Status for Approved and Pending Approval
        aStatus.push(Constant.Status.APPROVED);
        aStatus.push(Constant.Status.PENDING_APPROVAL);

        // Check if items within frequency are either Approved or Pending Approval
        const aHeaderCondition = {
            [sHeaderField]: { in: aHeaders },
            [Constant.EntitiesFields.CLAIM_STATUS]: { in: aStatus }
        };

        // Get Header Data
        const aHeaderData = await tx.run(
            SELECT.from(sHeaderTable).where(aHeaderCondition)
        )

        console.log(aItemData);
        console.log(aHeaderData);
        return aHeaderData;

        // const aTableData = await tx.run(
        //     SELECT.from(sTableName).where(aCondition)
        // );

        // return aTableData;
    }
};
