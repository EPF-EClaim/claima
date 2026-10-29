module.exports = {

    /**
     * Get EmpJob records from SuccessFactors for one employee,
     * including the employee status from emplStatusNav.
     *
     * @param {string} userId - Employee ID, e.g. '903411'
     * @param {object} [options]
     * @param {string} [options.asOfDate] - Return the record active on this date (yyyy-MM-dd)
     * @param {boolean} [options.history] - Return all job records instead of only the current one
     * @param {string[]} [options.fields] - Fields to return (leave empty for all fields)
     * @returns {Promise<object[]>} Cleaned EmpJob records with employee status
     */
    getSFEmpJob: async function (userId, options = {}) {
        try {
            const Conn_SF_API = await cds.connect.to('Conn_SF_API');

            const params = new URLSearchParams();
            params.set('$filter', `userId eq '${String(userId).replace(/'/g, "''")}'`);
            params.set('$format', 'json');params.set('$expand', 'emplStatusNav');

            if (options.fields?.length) {
                const fields = new Set([
                    ...options.fields,
                    'emplStatus',
                    'emplStatusNav/externalCode',
                    'emplStatusNav/localeLabel'
                ]);
                params.set('$select', [...fields].join(','));
            }
            if (options.history) {
                params.set('fromDate', '1900-01-01');
                params.set('$orderby', 'startDate desc,seqNumber desc');
            } else if (options.asOfDate) {
                params.set('asOfDate', options.asOfDate);
            }

            const response = await Conn_SF_API.send({
                method: 'GET',
                path: `/EmpJob?${params.toString()}`
            });

            const d = response?.d ?? response;
            const rawRecords = (d?.results ?? (Array.isArray(d) ? d : [d])).filter(Boolean);

            return rawRecords.map(({ emplStatusNav, ...raw }) => ({
                ...this._cleanSFRecord(raw),
                emplStatusCode: emplStatusNav?.externalCode ?? null,
                emplStatusLabel: emplStatusNav?.localeLabel ?? null
            }));
        } catch (error) {
            throw new Error(`Fail getting EmpJob for ${userId}: ${error.message}`);
        }
    },

    /**
     * Remove metadata and navigation links, and convert SF dates.
     */
    _cleanSFRecord: function (record) {
        const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;

        const toDate = (value) => {
            const m = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/.exec(value);
            if (!m) return value;

            const ms = Number(m[1]);
            if (!m[2]) return new Date(ms).toISOString().substring(0, 10);

            return new Date(ms + MYT_OFFSET_MS).toISOString().replace('T', ' ').substring(0, 19);
        };

        const out = {};
        for (const [key, value] of Object.entries(record)) {
            if (key === '__metadata') continue;
            if (value && typeof value === 'object' && value.__deferred) continue;
            out[key] = typeof value === 'string' ? toDate(value) : value;
            if (key.endsWith('Nav')) continue;
            if (key === '__metadata' || key.endsWith('Nav')) continue;
        }
        return out;
    }

};