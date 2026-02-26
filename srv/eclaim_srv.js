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

      // 1. Derive some kind of “identity” (locally this will be 'alice' or 'anonymous')
      const emailFromToken =
        req.user?.attr?.email ||
        req.user?.attr?.mail ||
        req.user?.attr?.user_name ||
        req.user?.attr?.login_name ||
        req.user?.id ||
        "";

      const email = String(emailFromToken).trim().toLowerCase();
      console.log("Derived email (local):", email);

      // 2. Query your ZEMP_MASTER table using your Email column name
      const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });  // <— use your real column name here
      console.log("Result",result);
      return {
        id: email,
        userType: result?.USER_TYPE || "UNKNOWN"
      };
    });

}