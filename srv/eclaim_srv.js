const cds = require('@sap/cds');
const { UPDATE } = require('@sap/cds/lib/ql/cds-ql');

module.exports = cds.service.impl(async function() {
    // this.on('UPDATE', '*', async (req)=> {
    //     if (req._.req.method === 'PATCH') {
    //         return UPDATE(req.data).into(req.target);
    //     }
    // });

    this.on('getDefaultsForCopy', async (req) => {
        const { ID } = req.data
        if (!ID) return {}
        const source = await SELECT.one.from(req.target).where({ [keys]:ID });
        
        return source;
    });

    this.on('Copy', async (req) => {
        const entity = req.target;
        const keyName = Object.keys(entity.keys)[0];
        const sourceID = req.params[keyName] || req.params.ID;

        const sourceData = await SELECT.one.from(entity).where({ [keyName]: sourceID });
        if (!sourceData) return req.error(404, 'Source not found');

        const newRecord = { ...sourceData, ...req.data };
        if (newRecord.ID) delete newRecord.ID;  //to prevent duplicate key during copy
        try {
            await INSERT.into(entity).entries(newRecord);
            req.notify(201, `Created successfully`);
            return newRecord;
        } catch (err) {
            return req.error(400, `Copy failed: ${err.message}`);
        }
    })
})