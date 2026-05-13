const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");

async function sendEmailViaSAPIS(oEmailPayload) {
    const oISService = await cds.connect.to('IS_Conn'); 
    return await oISService.post("/http/SendEmailNotification_eClaim", oEmailPayload);
}   

function generateEmailPayload(sApproverName, sSubmissionDate, sClaimmantName, sClaimType, sClaimId, sRecipientName, sAction, sReceiverEmail) {

    return {
        ApproverName    : sApproverName,
        SubmissionDate  : sSubmissionDate,
        ClaimantName    : sClaimmantName,
        ClaimType       : sClaimType,
        ClaimID         : sClaimId,
        RecipientName   : sRecipientName,
        Action          : sAction,
        ReceiverEmail   : sReceiverEmail
    };
}

module.exports = {
    generateEmailPayload,
    sendEmailViaSAPIS,
    resolveNotificationTarget
}