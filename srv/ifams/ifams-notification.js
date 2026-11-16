const { sendEmailInternal } = require('../utils/EmailHelper');
const { Constant } = require('../utils/constant');

/**
 * Send email notification to support team when IFAMS returns empty budget response.
 * Recipients are maintained in ZCONSTANTS (ID = IFAMS_ERROR_EMAIL).
 * Failure to send email will not interrupt the main flow.
 * @param {string} sId - Claim / Request ID
 */
async function notifyIFAMSEmptyResponse(sId) {
    try {
        const aResult = await SELECT.from('ZCONSTANTS')   // confirm entity name
            .columns('VALUE')
            .where({ ID: Constant.ConstantId.IFAMS_ERROR_EMAIL });

        const aRecipients = aResult
            .map(o => o.VALUE?.trim())
            .filter(Boolean);

        if (aRecipients.length === 0) {
            console.warn(`No recipients configured for IFAMS empty response notification (${sId})`);
            return;
        }

        await sendEmailInternal({
            ClaimID: sId,
            Action: Constant.EmailAction.IFAMS_EMPTY_RESPONSE,
            EmailTitle: `API Error: Empty IFAMS Budget Response - ${sId}`,
            ReceiverEmail: aRecipients.join(',')
        });
        
    } catch (oEmailError) {
        console.error(
            `Failed to send IFAMS empty response notification for ${sId}:`,
            oEmailError.message
        );
    }
}

module.exports = { notifyIFAMSEmptyResponse };