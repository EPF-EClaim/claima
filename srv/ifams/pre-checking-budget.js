const cds = require('@sap/cds');
const { Constant } = require("../utils/constant");

let _sfConnection;
async function getSFConnection() {
    if (!_sfConnection) {
        _sfConnection = await cds.connect.to('Conn_SF_API');
    }
    return _sfConnection;
}

/**
 * Retrieve Claim Flexi Posting from SF API to decide the budget year
 * 
 * @returns {Promise<{error: boolean, message: string, oFlexiPostingRecord: object}>} 
 */
async function retrieveClaimFlexiPosting() {
    var oFlexiPostingRecord;
    try {
        const SFConnection = await getSFConnection();
        const dCurrentDate = new Date();

        var aFlexiPostingRecords = await SFConnection.send({
            method: Constant.API_REQUEST_METHOD.GET,
            path: Constant.SF_API_PATH.FLEXI_POSTING_CONFIG
        });

        if (Array.isArray(aFlexiPostingRecords) && aFlexiPostingRecords.length > 0) {
            const aRecords = aFlexiPostingRecords.map(oRecord => ({
                ...oRecord,
                effectiveStartDate: parseODataDate(oRecord.effectiveStartDate),
                cust_Validity_Start: parseODataDate(oRecord.cust_Validity_Start),
                cust_Validity_End: parseODataDate(oRecord.cust_Validity_End),
                cust_Flexi_Posting_Date: parseODataDate(oRecord.cust_Flexi_Posting_Date)
            }));

            // further filter the record incase there are multiple records created in SF
            oFlexiPostingRecord = aRecords.filter(oRecord => oRecord.effectiveStartDate && oRecord.effectiveStartDate <= dCurrentDate)
                .sort((a, b) => b.effectiveStartDate - a.effectiveStartDate)[0];
            
            if (!oFlexiPostingRecord) {
                return { error: true, message: 'No valid Flexi Posting Record found', oFlexiPostingRecord: null };
            }
        } else {
            throw new Error('Budget Data Not Found');
        }

    } catch (oError) {
        return { error: true, message: oError.message, oFlexiPostingRecord };
    }
    return { error: false, message: 'Successfully retrieved Flexi Posting Record', oFlexiPostingRecord };
}

/**
 * Determine Budget Year based on Receipt Date and Claim Flexi Posting range date
 * Claim Flexi Posting Range Date (cust_Validity_Start and cust_Validity_End) 
 * is configured in SF and the fields are made as mandatory
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
        iYear = dCurrentDate.getFullYear();
    }
    return iYear;
}

/**
 * Determine the Posting Date for cross year budget checking
 * This will be used to determine the year of the budget for the claim
 * The posting date will then being passed to EarmarkedFund API for processing
 * Claim Flexi Posting Range Date (cust_Validity_Start and cust_Validity_End) 
 * is configured in SF and the fields are made as mandatory
 * The posting date will be determined based on the latest receipt date from the 
 * budget context and the Flexi Posting range date. If the latest receipt date falls within the range,
 * the posting date will be the latest receipt date. If not, the posting date will be the Flexible Posting Date
 * from the Flexi Posting Configuration (Cut off Date)
 *  
 * @param {Array<object>} aBudgetContext - Budget context
 * @param {object} oClaimFlexiPosting - Claim Flexi Posting
 * @returns {String} Posting Date (YYYY-MM-DD)
 */
function determineClaimPostingDate(aBudgetContext, oClaimFlexiPosting) {
    let dPostingDate;

    // 1. Determine latest receipt date from the budget context
    const dLatestReceiptDate = aBudgetContext.reduce((dLatest, oBudgetContext) => {
        const dReceipt = new Date(oBudgetContext.RECEIPT_DATE);
        return dReceipt > dLatest ? dReceipt : dLatest;
    }, new Date(aBudgetContext[0].RECEIPT_DATE));

    // 2. Check if the latest receipt date falls within the Flexi Posting range date
    if (dLatestReceiptDate >= oClaimFlexiPosting.cust_Validity_Start && dLatestReceiptDate <= oClaimFlexiPosting.cust_Validity_End) {
        dPostingDate = dLatestReceiptDate;
    } else {
        // 3. If not, use Flexible Posting Date from Flexi Posting Configuration (Cut off Date)
        dPostingDate = oClaimFlexiPosting.cust_Flexi_Posting_Date;
    }

    return dPostingDate.toLocaleDateString('en-CA');
}

/**
 * Convert the date returned from API into readable format
 * 
 * @param {String} sDate - Date
 * @returns {Date}
 */
function parseODataDate(sDate) {
    if (!sDate) return null;

    const aMatch = sDate.match(/\/Date\(([+-]?\d+)(?:[+-]\d+)?\)\//);

    return aMatch ? new Date(Number(aMatch[1])) : null;
}

module.exports = {
    getSFConnection,
    retrieveClaimFlexiPosting,
    determineBudgetYear,
    determineClaimPostingDate,
    parseODataDate
}