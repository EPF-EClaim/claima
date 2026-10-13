const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const budgetSrv = await cds.connect.to(
        'sap_s4_OP_API_EARMARKEDFUNDS_SRV_0001_v1'
    );

    this.on('READ', 'EarmarkedFundsDocument', async (req) => {
        try {
            console.log(budgetSrv.options);
            const response = await budgetSrv.send({
                method: 'GET',
                path: '/EarmarkedFundsDocument'
            });

            return response;
        } catch (error) {
            console.error("FULL ERROR:");
            console.error(JSON.stringify(error, null, 2));

            throw error;
        }
    });

    this.on('READ', 'EarmarkedFundsDocumentItem', async (req) => {
            console.log(budgetSrv.options);
            const response = await budgetSrv.send({
                method: 'GET',
                path: '/EarmarkedFundsDocumentItem'
            });

            return response;
    });
});


