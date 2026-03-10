const cds = require('@sap/cds');
const { INSERT, UPDATE, UPSERT, SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const express = require('express');
const app = express();

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
      const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: 'nur.ain.mohamad@my.ey.com' });  // <— use your real column name here
      console.log("Result", result);
      return {
        id: email,
        userType: result?.USER_TYPE || "UNKNOWN",
        costcenters: result?.CC || "UNKNOWN",
        userId: result?.EEID || "UNKNOWN"
      };
    });

  srv.on('runjob', req => {
    console.log('==> [APP JOB LOG] Job is running . . .');

    return {
      responseArray: [{
        "message": "finished"
      }]
    };

  }
  );

  srv.on('READ', 'FeatureControl', async (req) => {
    const { ZEMP_MASTER } = srv.entities;

    const emailFromToken =
      req.user?.attr?.email ||
      req.user?.attr?.mail ||
      req.user?.attr?.user_name ||
      req.user?.attr?.login_name ||
      req.user?.id ||
      "";
    const email = String(emailFromToken).trim().toLowerCase();
    const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: 'nur.ain.mohamad@my.ey.com' });
    const user_type = result?.USER_TYPE;

    let operationHidden = true;

    if (user_type === "JKEW Admin") {
      operationHidden = true;
    } else if (user_type === "DTD Admin" || user_type === "Super Admin") {
      operationHidden = false;
    }

    return {
      operationHidden: operationHidden,
      operationEnabled: !operationHidden,
    }
  });

  srv.on('budgetchecking', async (req) => {
    const { ZBUDGET } = srv.entities;
    var { input } = req.data;
    const condition = {};
    let message;

//  if (entry.YEAR != null) {
//             condition.YEAR = entry.YEAR;
//           }
//           if (entry.INTERNAL_ORDER != null) {
//             condition.INTERNAL_ORDER = entry.INTERNAL_ORDER;
//           }
//           if (entry.COMMITMENT_ITEM != null) {
//             condition.COMMITMENT_ITEM = entry.COMMITMENT_ITEM;
//           }
//           if (entry.MATERIAL_GROUP != null) {
//             condition.MATERIAL_GROUP = entry.MATERIAL_GROUP;
//           }
//           if (entry.FUND_CENTER != null) {
//             condition.FUND_CENTER = entry.FUND_CENTER;
//           }
    //   return await cds.tx(async (tx) => {
    //     try {
    //       input.forEach(entry => {
    //       } )
    //     })
    //   }
    // )
  })

  // let budget = await tx.run(SELECT.one.from(ZBUDGET).where(condition).forUpdate());
  // let check = entry.AMOUNT < budget?.BUDGET_BALANCE ? true : false;
  // })
  //     }
  // }))



  /* const port = process.env.PORT || 5000;

  app.listen(port, function () {
    console.log('listening');
  })
 */
}