const cds = require('@sap/cds');
const { Constant } = require("../utils/constant");

/**
 * Retrieve Claim Flexi Posting from SF API to decide the budget year
 * 
 * @returns {Promise<{error: boolean, message: string, oFlexiPostingRecord: object}>} 
 */
async function retrieveClaimFlexiPosting() {
    var oFlexiPostingRecord;
    try {
        const SFConnection = await cds.connect.to('Conn_SF_API');
        const dCurrentDate = new Date();

        var aFlexiPostingRecords = await SFConnection.send({
            method: Constant.API_REQUEST_METHOD.GET,
            path: Constant.SF_API_PATH.FLEXI_POSTING_CONFIG
        });

        if (aFlexiPostingRecords.length > 0) {
            const aRecords = aFlexiPostingRecords.map(oRecord => ({
                ...oRecord,
                effectiveStartDate: parseODataDate(oRecord.effectiveStartDate),
                cust_Validity_Start: parseODataDate(oRecord.cust_Validity_Start),
                cust_Validity_End: parseODataDate(oRecord.cust_Validity_End)
            }));

            // further filter the record incase there are multiple records created in SF
            oFlexiPostingRecord = aRecords.filter(oRecord => oRecord.effectiveStartDate <= dCurrentDate)
                .sort((a, b) => b.effectiveStartDate - a.effectiveStartDate)[0];
        }

    } catch (oError) {
        return { error: true, message: oError.message, oFlexiPostingRecord };
    }
    return { error: false, message: 'Successfully retrieve Flexi Posting Record', oFlexiPostingRecord };
}

/**
 * Determine Budget Year based on Receipt Date and Claim Flexi Posting range date
 * 
 * @param {Date} dReceiptDate - Receipt date
 * @param {object} oClaimFlexiPosting - Claim Flexi Posting
 * @returns {Integer} Year
 */
function determineBudgetYear(dReceiptDate, oClaimFlexiPosting) {
    const dStartDate = oClaimFlexiPosting.cust_Validity_Start;
    const dEndDate = oClaimFlexiPosting.cust_Validity_End;
    const dReceipt = new Date(dReceiptDate);
    const dCurrentDate = new Date();
    var iYear;

    // check if the receipt date falls within the start/end date range
    // if yes, take the receipt year
    if (dReceipt >= dStartDate && dReceipt <= dEndDate) {
        iYear = oClaimFlexiPosting.cust_Receipt_Year;
    } else {
        // receipt date is out of the range
        // need to use receipt year and compare with current system date year
        // if match, use receipt date year
        // if not match, use current system date year
        if (dReceipt.getFullYear() === dCurrentDate.getFullYear()) {
            iYear = dReceipt.getFullYear();
        } else {
            iYear = dCurrentDate.getFullYear();
        }
    }
    return iYear;
}

/**
 * Convert the date returned from API into readable format
 * 
 * @param {String} sDate - Date
 * @returns {Date}
 */
function parseODataDate(sDate) {
    if (!sDate) return null;

    const aMatch = sDate.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);

    return aMatch ? new Date(Number(aMatch[1])) : null;
}

module.exports = {
    retrieveClaimFlexiPosting,
    determineBudgetYear
}