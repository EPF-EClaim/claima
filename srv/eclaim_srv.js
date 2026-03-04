const cds = require('@sap/cds');
const { message } = require('@sap/cds/lib/log/cds-error');
const { UPSERT } = require('@sap/cds/lib/ql/cds-ql');
const { target } = require('@sap/cds/lib/ql/cds.ql-infer');

// const _insert = async function (entities, req) {
//   try {
//     var reqdata = req;
//     if (!reqdata || reqdata.length === 0) {
//       throw new Error('No Data Sent')
//     }
//     const tx = cds.tx(req);
//     const results = await tx.run(
//       UPSERT(reqdata).into(entities)
//     );
//     return 'Records updated';
//   } catch (error) {
//     req.error(400, `Fail creating record: ${error.message}`);
//   }
// }
const { ZRISK, ZRATE_KM } = srv.entities;
this.before('NEW', ZRATE_KM, async(req) => {
    const { START_DATE, END_DATE } = req.data;
    if (END_DATE && START_DATE && new Date(END_DATE) < new Date(START_DATE)) {
      req.error(400,'End date should not be earlier than start date', 'END_DATE');
    }
  });

module.exports = (srv) => {

  const { ZRISK, ZRATE_KM } = srv.entities;

  srv.before('CREATE', ZRISK, (req) => {
    const { START_DATE, END_DATE } = req.data || {}
    if (START_DATE != null && END_DATE != null && new Date(END_DATE) < new Date(START_DATE)) {
      req.error(400, 'End Date must be greater than or equal to Start Date.', { target: 'END_DATE' })
    }
  });

  srv.on('NEW', ZRATE_KM, async(req) => {
    const { START_DATE, END_DATE } = req.data;
    if (END_DATE && START_DATE && new Date(END_DATE) < new Date(START_DATE)) {
      req.error(400,'End date should not be earlier than start date', 'END_DATE');
    }
  });

  srv.before('SAVE', ZRATE_KM.drafts, async(req) => {
    const { START_DATE, END_DATE } = req.data;
    if (END_DATE && START_DATE && new Date(END_DATE) < new Date(START_DATE)) {
      req.error(400,'End date should not be earlier than start date', 'END_DATE');
    }
  });

  srv.on('batchCreateEmployee', async (req) => {
    const { ZEMP_MASTER } = srv.entities;
    // _insert(ZEMP_MASTER, req);
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
  });

    srv.on('batchCreateCostCenter', async (req) => {
      const { ZCOST_CENTER } = srv.entities;
      // _insert(ZCOST_CENTER, req);
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
      // _insert(ZEMP_DEPENDENT, req);
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
      console.log("Result", result);
      return {
        id: email,
        userType: result?.USER_TYPE || "UNKNOWN"
      };
    });

}