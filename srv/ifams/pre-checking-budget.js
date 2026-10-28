const cds = require('@sap/cds');
const { Constant } = require("../utils/constant");

async function retrieveClaimFlexiPosting() {
    try {
        const SFConnection = await cds.connect.to('Conn_SF_API');
        const dCurrentDate = new Date();

        var aFlexiPostingRecords = await SFConnection.send({
            method: Constant.API_REQUEST_METHOD.GET,
            path: Constant.SF_API_PATH.FLEXI_POSTING_CONFIG
        });

        if (aFlexiPostingRecords.length > 0) {
            const oFlexiPostingRecord = aFlexiPostingRecords
                .filter(oRecord => {
                    const dEffectiveStartDate =
                        parseODataDate(oRecord.effectiveStartDate);

                    return dEffectiveStartDate &&
                        dEffectiveStartDate <= dCurrentDate;
                })
                .sort((a, b) =>
                    parseODataDate(b.effectiveStartDate) -
                    parseODataDate(a.effectiveStartDate)
                )[0];

            return oFlexiPostingRecord ?? {};
        }

        return {};

    } catch (oError) {

    }


}

function parseODataDate(sDate) {
    if (!sDate) return null;

    const aMatch = sDate.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);

    return aMatch ? new Date(Number(aMatch[1])) : null;
}

module.exports = {
    retrieveClaimFlexiPosting
}