const cds = require('@sap/cds');

/**
 * eClaims column → SF EmpJob path.
 * '*'  = collection (takes the first record)
 * null = no SF source yet (returned as null)
 */
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

/** Always requested: needed for filtering, but not mapped */
const SF_SYSTEM_FIELDS = ['userId', 'seqNumber', 'startDate'];

/**
 * Search keys: SF filter path + eClaims column used to double-check the result.
 * To add another key, add one line here.
 */
const SF_SEARCH_KEYS = {
    userId: { sfPath: 'userId',           column: 'EEID'  },
    email:  { sfPath: 'userNav/username', column: 'EMAIL' }
};

module.exports = {

    /**
     * Get the employee's EmpJob from SF, mapped to eClaims columns.
     *
     * @param {string} key - userId or email (a value with '@' is treated as email)
     * @param {object} [options]
     * @param {'userId'|'email'} [options.by] - Force the search key (otherwise detected)
     * @param {string} [options.asOfDate] - Record active on this date (yyyy-MM-dd)
     * @param {boolean} [options.history] - All job records, newest first
     * @returns {Promise<object|object[]|null>} One object; an array when history = true
     */
    getSFEmpJob: async function (key, options = {}) {
        const by = options.by ?? (String(key).includes('@') ? 'email' : 'userId');
        const searchKey = SF_SEARCH_KEYS[by];
        if (!searchKey) throw new Error(`Unsupported search key: ${by}`);

        const value = String(key).trim();

        try {
            const Conn_SF_API = await cds.connect.to('Conn_SF_API');
            const { select, expand } = this._buildSFQuery(EMPJOB_MAP);

            const query = {
                '$filter': `${searchKey.sfPath} eq '${value.replace(/'/g, "''")}'`,
                '$select': [...new Set([...SF_SYSTEM_FIELDS, ...select])].join(','),
                '$expand': expand.join(','),
                '$format': 'json'
            };
            if (options.history) {
                query.fromDate = '1900-01-01';
                query.$orderby = 'startDate desc,seqNumber desc';
            } else if (options.asOfDate) {
                query.asOfDate = options.asOfDate;
            }

            const queryString = Object.entries(query)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join('&');

            const response = await Conn_SF_API.send({ method: 'GET', path: `/EmpJob?${queryString}` });

            const d = response?.d ?? response;
            const records = (d?.results ?? (Array.isArray(d) ? d : [d]))
                .filter(Boolean)
                .map(r => this._mapRecord(r, EMPJOB_MAP))
                // Safety check: keep only records that match the search value
                .filter(r => String(r[searchKey.column] ?? '').toLowerCase() === value.toLowerCase());

            return options.history ? records : (records[0] ?? null);
        } catch (error) {
            throw new Error(`Fail getting EmpJob for ${by} '${value}': ${error.message}`);
        }
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

        const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
        return new Date(ms + MYT_OFFSET_MS).toISOString().replace('T', ' ').substring(0, 19);
    }
};