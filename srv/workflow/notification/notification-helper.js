const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");

async function sendEmailViaSAPIS(oEmailPayload) {
    const oISService = await cds.connect.to('IS_Conn'); 
    return await oISService.post("/http/SendEmailNotification_eClaim", oEmailPayload);
}   

function formatDate(sDate) {
    const oDate = new Date(sDate);

    return oDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).replace(/,/g, ""); 
}

function generateEmailPayload(
    sApproverName,
    sSubmissionDate,
    sClaimmantName,
    sClaimType,
    sClaimId,
    sRecipientName,
    sAction,
    sReceiverEmail,
    sComments = null,
    sRejectionReason = null
) {
    return {
        ApproverName     : sApproverName,
        SubmissionDate   : formatDate(sSubmissionDate),
        ClaimantName     : sClaimmantName,
        ClaimType        : sClaimType,
        ClaimID          : sClaimId,
        RecipientName    : sRecipientName,
        Action           : sAction,
        ReceiverEmail    : sReceiverEmail,
        RejectReason     : sRejectionReason,
        ApproverComments : sComments
    };
}

module.exports = {
    generateEmailPayload,
    sendEmailViaSAPIS
}