const cds = require('@sap/cds');
const { sendEmailInternal } = require('./EmailHelper');
const { Constant } = require("../utils/constant");

/**
 * Write email notification failure to ZLOG in its own transaction,
 * so the entry is kept even if the caller's transaction is rolled back.
 * @param {string} sRecordId - Claim / Request ID
 * @param {string} sStatusCode - Error status code
 * @param {string} sMessage - Error message
 */
async function writeEmailFailureLog(sRecordId, sStatusCode, sMessage) {
    try {
        await cds.tx({}, (tx) => tx.run(
            INSERT.into(Constant.Entities.ZLOG).entries({
                TIMESTAMP: new Date(),
                RECORD_ID: String(sRecordId || '').slice(0, 20),
                PROGRAM: 'EMAIL_NOTIFICATION',
                MESSAGE_TYPE: 'W',
                STATUS_CODE: sStatusCode,
                MESSAGE: sMessage || 'No Message'
            })
        ));
    } catch (oLogError) {
        // Logging failure must not affect the main flow
    }
}

/**
 * Send email notification to recipients maintained in ZCONSTANTS.
 * Never throws. Failures are written to ZLOG and returned to the caller.
 * @param {object} oParams
 * @param {string} oParams.recordId - Claim / Request ID
 * @param {string} oParams.recipientConstantId - ID in ZCONSTANTS holding recipient emails
 * @param {string} oParams.action - Email action (determines email template in IS)
 * @param {string} oParams.emailTitle - Email subject
 * @returns {Promise<{error: boolean, message: string|null}>} Result of the email sending
 */
async function sendEmailNotification({ recordId, recipientConstantId, action, emailTitle }) {
    try {
        const aResult = await cds.tx({}, (tx) =>
            tx.run(
                SELECT.from(Constant.Entities.ZCONSTANTS)
                    .columns(Constant.EntitiesFields.VALUE)
                    .where({ ID: recipientConstantId })
            )
        );

        const aRecipients = (aResult || [])
            .map(o => o.VALUE?.trim())
            .filter(Boolean);

        if (aRecipients.length === 0) {
            const sMessage = `No recipients configured in ZCONSTANTS (${recipientConstantId}) for ${action}`;
            await writeEmailFailureLog(recordId, '404', sMessage);
            return { error: true, message: sMessage };
        }

        await sendEmailInternal({
            ClaimID: recordId,
            Action: action,
            EmailTitle: emailTitle,
            ReceiverEmail: aRecipients.join(',')
        });

        return { error: false, message: null };

    } catch (oEmailError) {
        const sMessage = `Failed to send ${action} email notification: ${oEmailError?.message}`;
        await writeEmailFailureLog(
            recordId,
            String(oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || '500'),
            sMessage
        );
        return { error: true, message: sMessage };
    }
}

module.exports = { sendEmailNotification };