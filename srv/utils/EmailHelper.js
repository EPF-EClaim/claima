module.exports = {

    sendEmailInternal: async function (emailData) {
        try {
            const ISservice = await cds.connect.to('IS_Conn');

            const oPayload = {
                TripStartDate: null,
                TripEndDate: null,
                CardAdvanceAmt: 0,
                ...emailData
            };
            console.log("sendEmailInternal", oPayload)

            const response = await ISservice.send({
                method: 'POST',
                path: "/http/SendEmailNotification_eClaim",
                data: oPayload
            });

            return response;
        } catch (error) {
            throw new Error(`Fail sending email: ${error.message}`);
        }
    }
};