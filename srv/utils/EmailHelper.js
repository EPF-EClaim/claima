module.exports = {

    sendEmailInternal: async function (emailData) {
        try {
            const ISservice = await cds.connect.to('IS_Conn');

            const response = await ISservice.send({
                method: 'POST',
                path: "/http/SendEmailNotification_eClaim",
                data: emailData
            });

            return response;
        } catch (error) {
            // Throw a standard JavaScript error so the calling function can handle it
            throw new Error(`Fail sending email: ${error.message}`);
        }
    }
};