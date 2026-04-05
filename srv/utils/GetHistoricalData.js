const cds = require('@sap/cds');
const { SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("./constant");

module.exports = {
    /**
        * Drill down of eligibility scenarios for each claim type after retrieving employee and eligibility rules data
        * @public
        * @param {String} sHeaderTable - Header Table Name
        * @param {String} sItemTable - Item Table Name
        * @param {Array} aItemcondition - Item Selection Where Conditions
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} Array of data selected from header table that are Approved or Pending Approval
        */
    getHistoricalData: async function (sHeaderTable, sItemTable, aItemcondition, tx) {
        try {
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
                SELECT`count(*)`
                    .from(sHeaderTable).where(aHeaderCondition)
            );
            
            if (!!aHeaderData) return aHeaderData[0].count;
            return 0;

        } catch (error) {
            return 0;
        }
    },

    /**
        * Drill down of eligibility scenarios for each claim type after retrieving employee and eligibility rules data
        * @public
        * @param {String} sItemTable - Item Table Name
        * @param {Array} aItemcondition - Item Selection Where Conditions
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} Count of data within item table
        */
    getCurrentItemData: async function (sItemTable, aItemcondition, tx) {
        try {
            // Get Item Data
            // Check if any Claim item is within frequency
            const aItemData = await tx.run(
                SELECT`count(*)`.from(sItemTable).where(aItemcondition)
            );
            if (!!aItemData) return aItemData[0].count;
            return 0;
        } catch (error) {
            return 0;
        }
    }
};
