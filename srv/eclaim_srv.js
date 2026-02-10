// const cds = require('@sap/cds')

// module.exports = cds.service.impl(async function() {

//     this.on('getDefaultsForCopy', async (req) => {
//         const { ID } = req.data
//         if (!ID) return {}
//         const source = await SELECT.one.from(req.target).where({ [keys]:ID });
        
//         return source;
//     });

//     this.on('Copy', async (req) => {
//         const entity = req.target;
//         const keyName = Object.keys(entity.keys)[0];
//         const sourceID = req.params[keyName] || req.params.ID;

//         const sourceData = await SELECT.one.from(entity).where({ [keyName]: sourceID });
//         if (!sourceData) return req.error(404, 'Source not found');

//         const newRecord = { ...sourceData, ...req.data };
//         if (newRecord.ID) delete newRecord.ID;  //to prevent duplicate key during copy
//         try {
//             await INSERT.into(entity).entries(newRecord);
//             req.notify(201, `Created successfully`);
//             return newRecord;
//         } catch (err) {
//             return req.error(400, `Copy failed: ${err.message}`);
//         }
//     })
// })
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

  // Handler for popup prefill (called on Copy button click, with selected ID in req.data)
  this.on('getDefaultsForCopy', async (req) => {
    const tx = req.tx(req.data);
    const entity = req.target;
    const keyName = Object.keys(entity.keys)[0];  // e.g., 'CLAIMTYPEID'
    const sourceID = req.data?.[keyName];
    if (!sourceID) return req.error(400, 'Source ID missing');

    const source = await tx.read(entity).where({ [keyName]: sourceID });
    if (!source) return req.error(404, 'Source record not found');
    return source;  // Returns to popup for editing
  });

  // Handler for Copy action submit (unbound, req.data has edited values)
  this.on('Copy', async (req) => {
    const tx = req.tx(req.data);
    const entity = req.target;
    const keyName = Object.keys(entity.keys)[0];

    // Source ID from popup (prefilled/edited in req.data)
    const sourceID = req.data?.[keyName];
    if (!sourceID) return req.error(400, 'Source ID required');

    // Fetch latest source (to avoid stale data)
    const sourceData = await tx.read(entity).where({ [keyName]: sourceID });
    if (!sourceData) return req.error(404, 'Source not found');

    // Merge source with any popup changes (req.data overrides)
    const newRecord = { ...sourceData, ...req.data };
    // delete newRecord[keyName];  // Clear ID for new record (auto-generate if needed)

    try {
      const result = await tx.create(entity, newRecord);
      req.notify({ success: true, message: 'Record copied successfully' });
      return result;  // Triggers table refresh
    } catch (err) {
      req.error(400, `Copy failed: ${err.message}`);
      console.error('Copy error:', err);  // For debugging
    }
  });

});