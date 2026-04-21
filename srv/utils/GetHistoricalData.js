const cds = require('@sap/cds');
const { SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const BuildSelectWhereConditions = require("./BuildSelectWhereConditions");
const { Constant } = require("./constant");

module.exports = {
    /**
        * Get Historical Count of Headers of Status Approved or Pending Approval
        * @public
        * @param {String} sHeaderTable - Header Table Name
        * @param {String} sItemTable - Item Table Name
        * @param {String} sItemcondition - Item Selection Where Conditions
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} Array of data selected from header table that are Approved or Pending Approval
        */
    getHistoricalData: async function (sHeaderTable, sItemTable, sItemcondition, tx) {
        try {
            let sHeaderField = "";
            let aHeaders = [];
            let aStatus = [];

            // Get Item Data
            // Check if any Claim item is within frequency
            const aItemData = await tx.run(
                SELECT.from(sItemTable).where(`${sItemcondition}`)
            )

            //Map Headers
            // Map ClaimID or RequestID based on which HeaderTable to use
            if (sHeaderTable == Constant.Entities.ZCLAIM_HEADER) {
                aHeaders = aItemData.map((d) => d.CLAIM_ID);
                sHeaderField = Constant.EntitiesFields.CLAIMID;
            } else {
                aHeaders = aItemData.map((d) => d.REQUEST_ID);
                sHeaderField = Constant.EntitiesFields.REQUESTID;
            }

            // Map Claim Status for Approved and Pending Approval
            aStatus.push(Constant.Status.APPROVED);
            aStatus.push(Constant.Status.PENDING_APPROVAL);
            // Check if items within frequency are either Approved or Pending Approval
            let aHeaderCondition = {
                [sHeaderField]: { in: aHeaders },
                [Constant.EntitiesFields.CLAIM_STATUS]: { in: aStatus }
            };
            const sHeaderCondition = BuildSelectWhereConditions.buildWhereCondition(aHeaderCondition);
            // Get Header Data
            const aHeaderData = await tx.run(
                SELECT`count(*)`
                    .from(sHeaderTable).where(`${sHeaderCondition}`)
            );
            if (!!aHeaderData) return aHeaderData[0].count;
            return 0;

        } catch (error) {
            return 0;
        }
    },

    /**
        * Get Current Record Sub ID Item Count
        * @public
        * @param {String} sItemTable - Item Table Name
        * @param {String} sItemcondition - Item Selection Where Conditions
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} Count of data within item table
        */
    getCurrentItemData: async function (sItemTable, sItemcondition, tx) {
        try {
            // Get Item Data
            // Check if any Claim item is within frequency
            const aItemData = await tx.run(
                SELECT`count(*)`.from(sItemTable).where(`${sItemcondition}`)
            );
            if (!!aItemData) return aItemData[0].count;
            return 0;
        } catch (error) {
            return 0;
        }
    },

    /**
        * Get Date Range based on Input Date, Frequency and Period from Claim Item Type
        * @public
        * @param {String} sClaimType - Claim Type
        * @param {String} sClaimTypeItem - Claim Type Item
        * @param {String} sInputDate - Date from input
        * @param {Object} tx - CDS Transaction
        * @returns {Object} Object containing Date From and Date To range
        */
    getDateRange: async function (sClaimType, sClaimTypeItem, sInputDate, tx) {
        var dDateFrom, dDateTo;
        var oDatetoFrom = { dDateFrom, dDateTo };
        var iMonthFreq = 0;
        var iYearFreq = 0;
        var iDateFreq = 0;
        const oClaimTypeItem = await this.getFrequency(sClaimType, sClaimTypeItem, tx);
        var iItemFreq = oClaimTypeItem.FREQUENCY

        switch (oClaimTypeItem.PERIOD_UNIT) {
            case Constant.PeriodUnit.MONTH:
                iMonthFreq = oClaimTypeItem.PERIOD;
                break;

            case Constant.PeriodUnit.YEAR:
                iYearFreq = oClaimTypeItem.PERIOD;
                break;

            case Constant.PeriodUnit.SERVICE:
                oDatetoFrom.dDateFrom = "1990-01-01";
                oDatetoFrom.dDateTo = "9999-12-31"
                return { oDatetoFrom, iItemFreq };
                break;

            default:
                throw new Error("No Period Unit found");
                break;
        }
        oDatetoFrom = BuildSelectWhereConditions.subtractDateDelta(sInputDate, iYearFreq, iMonthFreq, iDateFreq);
        // oDatetoFrom.dDateFrom = oDateDelta.dDateFrom;
        // oDatetoFrom.dDateTo = oDateDelta.dDateTo;
        return { oDatetoFrom, iItemFreq } ;
    },

    /**
        * Get Frequency, Period, Period Unit from Claim Type Item Table
        * @public
        * @param {String} sClaimType - Claim Type
        * @param {String} sClaimTypeItem - Claim Type Item
        * @param {Object} tx - CDS Transaction
        * @returns {Object} Object containing Date From and Date To range
        */
    getFrequency: async function (ClaimType, ClaimTypeItem, tx) {
        const aClaimTypeItem = {
            [Constant.EntitiesFields.CLAIM_TYPE_ID]: ClaimType,
            [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: ClaimTypeItem
        };

        const sClaimTypeItem = BuildSelectWhereConditions.buildWhereCondition(aClaimTypeItem);
        return oClaimTypeItem = await tx.run(
            SELECT.one.from(Constant.Entities.ZCLAIM_TYPE_ITEM).where(`${sClaimTypeItem}`)
        );
    },
};
