// const cds = require('@sap/cds');
// const { UPDATE } = require('@sap/cds/lib/ql/cds-ql');

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
const { SELECT, INSERT } = cds.ql;

/** Get list of key names from an entity definition */
function getKeyNames(entity) {
  return Object.keys(entity.keys || {});
}

/** Build key predicate from the bound instance in the request */
function getKeyPredicateFromReq(entity, req) {
  const paramsObj = req.params?.[0] || {};
  const keyNames = getKeyNames(entity);
  const where = {};
  
  for (const k of keyNames) {
    if (paramsObj[k] !== undefined) {
      where[k] = paramsObj[k];
    }
  }
  
  // Always include IsActiveEntity for draft-enabled entities
  if (paramsObj.IsActiveEntity !== undefined) {
    where.IsActiveEntity = paramsObj.IsActiveEntity;
  } else {
    where.IsActiveEntity = true; // Default to active
  }
  
  return where;
}

/** Get only database columns (exclude virtual fields) */
function getDatabaseColumns(entity) {
  const columns = [];
  
  for (const [name, element] of Object.entries(entity.elements || {})) {
    // Include if it's NOT virtual and NOT an association/composition
    if (!element.virtual && !element.isAssociation && !element.isComposition) {
      columns.push(name);
    }
  }
  
  return columns;
}

/** Remove keys and draft-specific fields before insert */
function stripDraftAndKeys(entity, row) {
  const cleaned = { ...row };

  // Remove original keys
  for (const k of getKeyNames(entity)) {
    delete cleaned[k];
  }

  // Remove all draft-related fields
  const draftFields = [
    'IsActiveEntity',
    'HasActiveEntity',
    'HasDraftEntity',
    'DraftAdministrativeData_DraftUUID',
    'DraftAdministrativeData',
    'DraftUUID',
    'SAP_Client',
    'createdAt',
    'createdBy',
    'modifiedAt',
    'modifiedBy'
  ];
  
  draftFields.forEach(k => delete cleaned[k]);

  return cleaned;
}

module.exports = cds.service.impl(async function () {
  
  /**
   * Get defaults for copy dialog
   * Explicitly selects only database columns, excluding virtual fields
   */
  this.on('getDefaultsForCopy', async (req) => {
    const entity = req.target;
    
    if (!entity?.name) {
      return req.error(400, 'Invalid entity');
    }

    // Get the selected record's key(s)
    const where = getKeyPredicateFromReq(entity, req);
    if (!Object.keys(where).length) {
      return req.error(400, 'No record selected');
    }

    console.log('getDefaultsForCopy - Entity:', entity.name);
    console.log('getDefaultsForCopy - Where:', where);

    const tx = cds.transaction(req);
    
    try {
      // IMPORTANT: Select ONLY database columns, exclude virtual fields
      const dbColumns = getDatabaseColumns(entity);
      
      console.log('Database columns to select:', dbColumns);

      // Build query with explicit columns to avoid virtual fields
      let query = SELECT.one.from(entity);
      
      if (dbColumns.length > 0) {
        query = query.columns(dbColumns);
      }
      
      query = query.where(where);
      
      const source = await tx.run(query);
      
      if (!source) {
        return req.error(404, 'Selected record not found');
      }

      console.log('Source record found:', source);

      // Strip keys and draft fields for the popup
      const defaults = stripDraftAndKeys(entity, source);
      
      // For key fields, set them to empty string in the defaults
      const keyNames = getKeyNames(entity);
      for (const k of keyNames) {
        defaults[k] = ''; // Empty string for user to fill
      }
      
      console.log('Defaults for popup:', defaults);
      
      return defaults;
      
    } catch (err) {
      console.error('Error in getDefaultsForCopy:', err);
      return req.error(500, `Failed to get defaults: ${err.message}`);
    }
  });

  /**
   * Copy action
   * Creates a new record based on the selected one
   */
  this.on('Copy', async (req) => {
    const entity = req.target;
    
    console.log('Copy called with data:', req.data);
    console.log('Copy params:', req.params);

    if (!entity?.name) {
      return req.error(400, 'Copy must be bound to an entity');
    }

    // Get source record key
    const sourceWhere = getKeyPredicateFromReq(entity, req);
    
    if (!Object.keys(sourceWhere).length) {
      return req.error(400, 'No source record selected');
    }

    const tx = cds.transaction(req);
    
    try {
      // IMPORTANT: Select ONLY database columns for source record
      const dbColumns = getDatabaseColumns(entity);
      
      let query = SELECT.one.from(entity);
      if (dbColumns.length > 0) {
        query = query.columns(dbColumns);
      }
      query = query.where(sourceWhere);
      
      const source = await tx.run(query);
      
      if (!source) {
        return req.error(404, 'Source record not found');
      }

      console.log('Source record:', source);

      // Validate new keys from user input
      const keyNames = getKeyNames(entity);
      const newKeys = {};
      const missingKeys = [];
      
      for (const k of keyNames) {
        const v = req.data?.[k];
        if (v === undefined || v === null || v === '') {
          missingKeys.push(k);
        } else {
          newKeys[k] = v;
        }
      }

      if (missingKeys.length > 0) {
        return req.error(400, `Please provide new values for: ${missingKeys.join(', ')}`);
      }

      // Build new record - only include database columns
      const newRecord = {};
      
      // Copy only database columns from source
      for (const col of dbColumns) {
        if (source[col] !== undefined && !keyNames.includes(col)) {
          newRecord[col] = source[col];
        }
      }
      
      // Override with user input (only for database columns)
      for (const [key, value] of Object.entries(req.data || {})) {
        // Only include if it's a database column (not virtual)
        if (dbColumns.includes(key) || keyNames.includes(key)) {
          newRecord[key] = value;
        }
      }
      
      // Add new keys
      for (const [k, v] of Object.entries(newKeys)) {
        newRecord[k] = v;
      }
      
      // Ensure IsActiveEntity is set
      newRecord.IsActiveEntity = true;

      console.log('New record to insert:', newRecord);

      // Insert the new record
      await tx.run(INSERT.into(entity).entries(newRecord));

      // Read back the created record (still excluding virtual fields)
      const readWhere = { ...newKeys, IsActiveEntity: true };
      const readQuery = SELECT.one.from(entity);
      
      if (dbColumns.length > 0) {
        readQuery.columns(dbColumns);
      }
      
      const created = await tx.run(readQuery.where(readWhere));
      
      console.log('Created record:', created);
      
      req.info(201, 'Record copied successfully');
      
      // The response will NOT include virtual fields - they'll be added
      // by any after-read handlers automatically
      return created || newRecord;
      
    } catch (err) {
      console.error('Copy failed:', err);
      
      if (err.message?.includes('unique constraint') || err.message?.includes('duplicate')) {
        return req.error(400, 'A record with this ID already exists');
      }
      if (err.message?.includes('not null')) {
        return req.error(400, 'Please fill in all required fields');
      }
      
      return req.error(500, `Copy failed: ${err.message}`);
    }
  });

  /**
   * If you need to populate virtual fields in the response,
   * you can add after-read handlers
   */
  this.after('READ', 'ZRISK', (each, req) => {
    // Populate virtual fields here
    // each.VirtualFieldName = some calculation;
    return each;
  });
});