const cds = require('@sap/cds');

/* ==================================================================== */
/*  MAPPINGS: eClaims column → SF path                                  */
/*  '*'  = collection (takes the first record)                          */
/*  null = no SF source yet (returned as null)                          */
/* ==================================================================== */

const EMPJOB_MAP = {
    EEID:                  'userId',
    NAME:                  'userNav/custom01',
    GRADE:                 'customString8',
    POS:                   'position',
    ROLE:                  'positionNav/externalName_defaultValue',
    POSITION_START_DATE:   'positionEntryDate',
    POSITION_EVENT_REASON: 'eventReasonNav/externalCode',
    JOB_GROUP:             'jobCode',
    CC:                    'costCenterNav/externalCode',
    DEP:                   'division',
    UNIT_SECTION:          'customString2',
    OFFICE_LOCATION:       'location',
    ADDRESS_LINE1:         'userNav/empInfo/personNav/homeAddressNavDEFLT/*/address1',
    ADDRESS_LINE2:         'userNav/empInfo/personNav/homeAddressNavDEFLT/*/address2',
    ADDRESS_LINE3:         'userNav/empInfo/personNav/homeAddressNavDEFLT/*/address3',
    POSTCODE:              'userNav/empInfo/personNav/homeAddressNavDEFLT/*/zipCode',
    STATE:                 'userNav/empInfo/personNav/homeAddressNavDEFLT/*/stateNav/externalCode',
    COUNTRY:               'businessUnitNav/cust_LegalEntity/*/countryOfRegistrationNav/code',
    CONTACT_NO:            'userNav/cellPhone',
    EMAIL:                 'userNav/username',
    DIRECT_SUPPERIOR:      'managerUserNav/userId',
    MARITAL:               'userNav/empInfo/personNav/personalInfoNav/*/maritalStatusNav/externalCode',
    EMPLOYEE_TYPE:         'employeeClassNav/externalCode',
    CONFIRMATION_DATE:     'userNav/empInfo/customDate2',
    EFFECTIVE_DATE:        'startDate',
    JOB_GRADE:             'payGrade',
    DIVISION:              'businessUnit',
    SECTION_REGION:        'department',
    UNIT_BRANCH:           'customString2',
    SUB_UNIT_BRANCH:       'customString3',
    HIRE_DATE:             'employmentNav/startDate',
    RETIREMENT_DATE:       'employmentNav/customDate1',
    STATE_OF_ORIGIN:       'employmentNav/personNav/customString3Nav/externalCode'
};

const COSTCENTER_MAP = {
    COST_CENTER:           'externalCode',
    NAME:                  'name',
    DESCRIPTION:           'description',
    STATUS:                'status',
    START_DATE:            'startDate',
    END_DATE:              'endDate',
    BUDGET_OWNER_POSITION: 'cust_CostCenter_Owner'
};

/** COSTCENTER_MAP column that holds the position ID (used to look up EmpJob by position) */
const CC_POSITION_COLUMN = 'BUDGET_OWNER_POSITION';

/** EMPJOB_MAP columns returned in a cost center's EMPLOYEE object */
const CC_EMPLOYEE_COLUMNS = ['EEID', 'NAME', 'EMAIL'];

/** EmpJob filters per call when looking up many keys (keeps the URL short) */
const BATCH_SIZE = 20;

/** Malaysia time offset for UTC timestamps */
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;

/* ==================================================================== */
/*  ENTITY CONFIG: one entry per SF entity                              */
/* ==================================================================== */

const SF_ENTITIES = {
    EmpJob: {
        map: EMPJOB_MAP,
        systemFields: ['userId', 'seqNumber', 'startDate'],
        orderby: 'startDate desc,seqNumber desc',
        searchKeys: {
            userId:   { sfPath: 'userId',           column: 'EEID'  },
            email:    { sfPath: 'userNav/username', column: 'EMAIL' },
            position: { sfPath: 'position',         column: 'POS'   }
        }
    },
    FOCostCenter: {
        map: COSTCENTER_MAP,
        systemFields: ['externalCode', 'startDate'],
        orderby: 'externalCode asc,startDate desc',
        searchKeys: {
            costCenter: { sfPath: 'externalCode', column: 'COST_CENTER' },
            status:     { sfPath: 'status',       column: 'STATUS'      }
        }
    }
};

module.exports = {

    /* ================================================================ */
    /*  PUBLIC METHODS                                                  */
    /* ================================================================ */

    /**
     * Get one employee's EmpJob, mapped to eClaims columns.
     *
     * @param {string} key - userId, email or position ID
     * @param {object} [options]
     * @param {'userId'|'email'|'position'} [options.by] - Default: email if key has '@', otherwise userId
     * @param {string} [options.asOfDate] - Record active on this date (yyyy-MM-dd)
     * @param {boolean} [options.history] - All job records, newest first
     * @returns {Promise<object|object[]|null>} One object; an array when history = true
     */
    getSFEmpJob: async function (key, options = {}) {
        const by = options.by ?? (String(key).includes('@') ? 'email' : 'userId');

        const criteria = {};
        criteria[by] = key;   // e.g. { position: '00004623' }

        const records = await this._searchSF('EmpJob', criteria, options);
        return options.history ? records : (records[0] ?? null);
    },

    /**
     * Get EmpJob for many keys in batched calls.
     *
     * @param {string[]} keys - userIds, emails or position IDs
     * @param {object} [options]
     * @param {'userId'|'email'|'position'} [options.by] - Default: userId
     * @param {string} [options.asOfDate] - Record active on this date (yyyy-MM-dd)
     * @param {string[]} [options.columns] - EMPJOB_MAP columns to return (default: all)
     * @returns {Promise<Map<string, object>>} key → first matching EmpJob record
     */
    getSFEmpJobs: async function (keys = [], options = {}) {
        const by = options.by ?? 'userId';
        const searchKey = SF_ENTITIES.EmpJob.searchKeys[by];
        if (!searchKey) throw new Error(`Unsupported search key for EmpJob: ${by}`);

        const unique = [...new Set(keys.filter(Boolean).map(k => String(k).trim()))];
        const result = new Map();

        // The search key column is always read so results can be matched back to the key
        const columns = options.columns?.length
            ? [...new Set([...options.columns, searchKey.column])]
            : null;

        for (let i = 0; i < unique.length; i += BATCH_SIZE) {
            const batch = unique.slice(i, i + BATCH_SIZE);
            const filter = batch.map(k => this._eq(searchKey.sfPath, k)).join(' or ');

            try {
                const rows = await this._querySF('EmpJob', filter, { asOfDate: options.asOfDate, columns });
                for (const row of rows) {
                    const k = String(row[searchKey.column] ?? '');
                    if (!batch.includes(k) || result.has(k)) continue;

                    // Return only the requested columns
                    result.set(k, options.columns?.length
                        ? Object.fromEntries(options.columns.map(c => [c, row[c] ?? null]))
                        : row);
                }
            } catch (error) {
                throw new Error(`Fail getting EmpJob by ${by}: ${error.message}`);
            }
        }
        return result;
    },

    /**
     * Get cost centers from SF (FOCostCenter) with the employee assigned to
     * each cost center's owner position.
     *
     * @param {object} [criteria] - { costCenter, status }; omit both to read all
     * @param {object} [options] - { asOfDate }
     * @returns {Promise<object[]>} Cost centers, each with BUDGET_OWNER { EEID, NAME, EMAIL } (null if vacant)
     */
    getSFCostCenter: async function (criteria = {}, options = {}) {
        const costCenters = await this._searchSF('FOCostCenter', criteria, options);

        const employees = await this.getSFEmpJobs(
            costCenters.map(cc => cc[CC_POSITION_COLUMN]),
            { by: 'position', asOfDate: options.asOfDate, columns: CC_EMPLOYEE_COLUMNS }
        );

        return costCenters.map(cc => ({
            ...cc,
            BUDGET_OWNER: employees.get(String(cc[CC_POSITION_COLUMN] ?? '').trim()) ?? null
        }));
    },

    /* ================================================================ */
    /*  SHARED LOGIC                                                    */
    /* ================================================================ */

    /**
     * Search an SF entity using its configured search keys.
     * Empty criteria values are ignored; the rest are combined with 'and'.
     */
    _searchSF: async function (entityName, criteria = {}, options = {}) {
        const entity = SF_ENTITIES[entityName];
        const used = Object.entries(criteria)
            .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');

        const filters = used.map(([by, value]) => {
            const searchKey = entity.searchKeys[by];
            if (!searchKey) throw new Error(`Unsupported search key for ${entityName}: ${by}`);
            return this._eq(searchKey.sfPath, value);
        });

        let records;
        try {
            records = await this._querySF(entityName, filters.join(' and ') || null, options);
        } catch (error) {
            const desc = used.map(([k, v]) => `${k} '${v}'`).join(', ') || 'all';
            throw new Error(`Fail getting ${entityName} for ${desc}: ${error.message}`);
        }

        // Safety check: keep only records matching every search value
        return records.filter(r => used.every(([by, value]) =>
            String(r[entity.searchKeys[by].column] ?? '').toLowerCase() ===
            String(value).trim().toLowerCase()
        ));
    },

    /**
     * Read an SF entity with $select/$expand built from its map.
     * options.columns limits the map, so only those fields are selected/expanded.
     * Follows __next links so large results are not cut off.
     */
    _querySF: async function (entityName, filter, options = {}) {
        const entity = SF_ENTITIES[entityName];
        const map = options.columns?.length
            ? Object.fromEntries(options.columns.map(c => [c, entity.map[c] ?? null]))
            : entity.map;

        const Conn_SF_API = await cds.connect.to('Conn_SF_API');
        const { select, expand } = this._buildSFQuery(map);

        const query = {
            '$select': [...new Set([...entity.systemFields, ...select])].join(','),
            '$format': 'json'
        };
        if (filter) query.$filter = filter;
        if (expand.length) query.$expand = expand.join(',');

        if (options.history) {
            query.fromDate = '1900-01-01';
            if (entity.orderby) query.$orderby = entity.orderby;
        } else if (options.asOfDate) {
            query.asOfDate = options.asOfDate;
        }

        const queryString = Object.entries(query)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');

        const rows = [];
        let path = `/${entityName}?${queryString}`;

        while (path) {
            const response = await Conn_SF_API.send({ method: 'GET', path });
            const d = response?.d ?? response;
            rows.push(...(d?.results ?? (Array.isArray(d) ? d : [d])).filter(Boolean));

            // __next is absolute: keep only the part after /odata/v2
            const next = d?.__next;
            path = next ? next.substring(next.indexOf('/odata/v2') + '/odata/v2'.length) : null;
        }

        return rows.map(r => this._mapRecord(r, map));
    },

    /** Build an OData eq filter with quotes escaped. */
    _eq: function (sfPath, value) {
        return `${sfPath} eq '${String(value).trim().replace(/'/g, "''")}'`;
    },

    /**
     * Build $select / $expand from a mapping.
     * 'a/b/* /c/d' → select 'a/b/c/d', expand 'a', 'a/b', 'a/b/c'
     */
    _buildSFQuery: function (map) {
        const select = new Set();
        const expand = new Set();

        for (const path of Object.values(map)) {
            if (!path) continue;
            const segments = path.split('/').filter(s => s !== '*');
            select.add(segments.join('/'));

            for (let i = 1; i < segments.length; i++) {
                expand.add(segments.slice(0, i).join('/'));
            }
        }
        return { select: [...select], expand: [...expand] };
    },

    /** Map one raw SF record to eClaims columns. */
    _mapRecord: function (raw, map) {
        const out = {};
        for (const [column, path] of Object.entries(map)) {
            out[column] = path ? this._toSFValue(this._resolvePath(raw, path)) : null;
        }
        return out;
    },

    /** Walk an SF path; collections ({ results: [] }) resolve to the first record. */
    _resolvePath: function (obj, path) {
        let current = obj;
        for (const segment of path.split('/')) {
            if (current == null) return null;
            if (Array.isArray(current.results)) current = current.results[0];
            if (segment === '*') continue;
            current = current?.[segment];
        }
        if (current && Array.isArray(current.results)) current = current.results[0];
        return current ?? null;
    },

    /** Convert SF /Date(...)/ values: dates → yyyy-MM-dd, UTC timestamps → MYT. */
    _toSFValue: function (value) {
        if (typeof value !== 'string') return value;

        const m = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/.exec(value);
        if (!m) return value;

        const ms = Number(m[1]);
        if (!m[2]) return new Date(ms).toISOString().substring(0, 10);

        return new Date(ms + MYT_OFFSET_MS).toISOString().replace('T', ' ').substring(0, 19);
    }
};