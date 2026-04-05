const cds = require('@sap/cds');
const { SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("./constant");
const { _parsePayload } = require('./EligibilityScenarios/DalamNegara');

module.exports = {
     /**
         * Drill down of eligibility scenarios for each claim type after retrieving employee and eligibility rules data
         * @public
         * @param {String} sHeaderTable - Header Table Name
         * @param {String} sItemTable - Item Table Name
         * @param {Array} aItemcondition - Item Selection Where Conditions
         * @param {Object} tx - CDS Transaction
         * @returns {Array} Array of data selected from header table that are Approved or Pending Approval
         */
    getHistoricalData: async function (ClaimID, sHeaderTable, sItemTable, aItemcondition, tx) {
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
        // Also check if there is any other items with same period within current claim that is in draft 
        aHeaders.push(ClaimID);
        
        // Map Claim Status for Approved and Pending Approval
        aStatus.push(Constant.Status.APPROVED);
        aStatus.push(Constant.Status.PENDING_APPROVAL);
        aStatus.push(Constant.Status.DRAFT);

        // Check if items within frequency are either Approved or Pending Approval
        const aHeaderCondition = {
            [sHeaderField]: { in: aHeaders },
            [Constant.EntitiesFields.CLAIM_STATUS]: { in: aStatus }
        };

        // Get Header Data
        const aHeaderData = await tx.run(
            SELECT`count(*)`
            .from(sHeaderTable).where(aHeaderCondition)
        );
        console.log(aHeaderData, aHeaders);
        return aHeaderData[0].count;
    }
};
