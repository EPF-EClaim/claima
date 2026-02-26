const cds = require('@sap/cds');
const { INSERT, UPDATE, UPSERT } = require('@sap/cds/lib/ql/cds-ql');

module.exports = (srv) => {

  srv.on('batchCreateEmployee', async (req) => {
    const { ZEMP_MASTER } = srv.entities;
    try {
      const { employees } = req.data;
      if (!employees || employees.length === 0) {
        throw new Error('No Data Sent')
      }
      const tx = cds.tx(req);

      const results = await tx.run(
        UPSERT(employees).into(ZEMP_MASTER)
      );
      return 'Records updated';
    } catch (error) {
      req.error(400, `Fail creating record: ${error.message}`);
    }
  }),

    srv.on('batchCreateCostCenter', async (req) => {
      const { ZCOST_CENTER } = srv.entities;
      try {
        const { costcenters } = req.data;
        if (!costcenters || costcenters.length === 0) {
          throw new Error('No Data Sent')
        }
        const tx = cds.tx(req);

        const results = await tx.run(
          UPSERT(costcenters).into(ZCOST_CENTER)
        );
        return 'Records updated';
      } catch (error) {
        req.error(400, `Fail creating record: ${error.message}`);
      }
    }),

    srv.on('batchCreateDependent', async (req) => {
      const { ZEMP_DEPENDENT } = srv.entities;
      try {
        const { dependents } = req.data;
        if (!dependents || dependents.length === 0) {
          throw new Error('No Data Sent')
        }
        const tx = cds.tx(req);

        const results = await tx.run(
          UPSERT(dependents).into(ZEMP_DEPENDENT)
        );
        return 'Records updated';
      } catch (error) {
        req.error(400, `Fail creating record: ${error.message}`);
      }
    }),

    srv.on('getUserType', async (req) => {
      const { ZEMP_MASTER } = srv.entities;

      const login = req.user?.attr?.login_name || req.user?.id;

      const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: login });

      if (!result) {
        return {
          id: login,
          userType: "UNKNOWN"
        };
      }

      return {
        id: login,
        userType: result.USER_TYPE
      };

    })

}