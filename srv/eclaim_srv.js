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
      const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });  // <— use your real column name here
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
    const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });
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
    const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });
    const user_type = result?.USER_TYPE;

    let operationHidden = true;

    if (user_type === "JKEW Admin") {
      operationHidden = true;
    } else if (user_type === "DTD Admin" || user_type === "Super Admin") {
      operationHidden = false;
    } else if (user_type === "Super Admin") {
      operationHidden = false;
    }

    return {
      operationHidden: operationHidden,
      operationEnabled: !operationHidden,
    }
  });

  srv.on('budgetchecking', async (req) => {
    const { ZBUDGET } = srv.entities;
    const { budget } = req.data;

    const tx = cds.tx(req);
    const results = [];
    let error = false;
    var newCommitment,
      newConsumed,
      newBudgetBalance,
      newActual;

    try {
      for (var entry of budget) {
        var condition = {};

        if (entry.YEAR) condition.YEAR = entry.YEAR;
        if (entry.INTERNAL_ORDER) condition.INTERNAL_ORDER = entry.INTERNAL_ORDER;
        if (entry.FUND_CENTER) condition.FUND_CENTER = entry.FUND_CENTER;
        if (entry.MATERIAL_GROUP) condition.MATERIAL_GROUP = entry.MATERIAL_GROUP;
        if (entry.COMMITMENT_ITEM) condition.COMMITMENT_ITEM = entry.COMMITMENT_ITEM;

        let budgetRecord = entry.INDICATOR === "CLM" ? await tx.run(
          SELECT.one.from(ZBUDGET)
            .where(condition)
            .forShareLock()
        ) : await tx.run(SELECT.one.from(ZBUDGET)
          .where(condition));

        if (!budgetRecord) {
          if (entry.INDICATOR === "CLM") {
            await tx.rollback();
          }

          results.push({
            YEAR: entry.YEAR,
            INTERNAL_ORDER: entry.INTERNAL_ORDER,
            FUND_CENTER: entry.FUND_CENTER,
            MATERIAL_GROUP: entry.MATERIAL_GROUP,
            COMMITMENT_ITEM: entry.COMMITMENT_ITEM,
            AMOUNT: entry.AMOUNT,
            PREV_CONSUMED: null,
            NEW_CONSUMED: null,
            PREV_ACTUAL: null,
            NEW_ACTUAL: null,
            PREV_COMMITMENT: null,
            NEW_COMMITMENT: null,
            STATUS: 'RECORD NOT FOUND'
          });

          error = true;
          continue;
        }

        const bSufficient = entry.AMOUNT <= budgetRecord.BUDGET_BALANCE;

        if (bSufficient) {
          continue; //proceed with all checking and update once all satisfy condition
        } else {
          error = true;

          results.push({
            YEAR: entry.YEAR,
            INTERNAL_ORDER: entry.INTERNAL_ORDER,
            FUND_CENTER: entry.FUND_CENTER,
            MATERIAL_GROUP: entry.MATERIAL_GROUP,
            COMMITMENT_ITEM: entry.COMMITMENT_ITEM,
            AMOUNT: entry.AMOUNT,
            PREV_CONSUMED: null,
            NEW_CONSUMED: null,
            PREV_ACTUAL: null,
            NEW_ACTUAL: null,
            PREV_COMMITMENT: null,
            NEW_COMMITMENT: null,
            STATUS: 'Insufficient balance'
          });
        }
      }

      if (error === false) {  //all records having sufficient balance
        for (var entry of budget) {
          condition = {};

          if (entry.YEAR) condition.YEAR = entry.YEAR;
          if (entry.INTERNAL_ORDER) condition.INTERNAL_ORDER = entry.INTERNAL_ORDER;
          if (entry.FUND_CENTER) condition.FUND_CENTER = entry.FUND_CENTER;
          if (entry.MATERIAL_GROUP) condition.MATERIAL_GROUP = entry.MATERIAL_GROUP;
          if (entry.COMMITMENT_ITEM) condition.COMMITMENT_ITEM = entry.COMMITMENT_ITEM;

          var newBudget = await tx.run(SELECT.one.from(ZBUDGET).where(condition));

          if (entry.ACTION === "SUBMIT") {
            newCommitment = parseFloat(newBudget.COMMITMENT).toFixed(2) + parseFloat(entry.AMOUNT).toFixed(2);
            newConsumed = parseFloat(newBudget.COMMITMENT).toFixed(2) + parseFloat(newBudget.ACTUAL).toFixed(2);
            newBudgetBalance = parseFloat(newBudget.CURRENT_BUDGET).toFixed(2) - parseFloat(newBudget.CONSUMED).toFixed(2);
            newActual = parseFloat(newBudget.ACTUAL).toFixed(2);
          }
          // else if (entry.ACTION === "REJECT" || entry.ACTION === "APPROVE") {
          //   newCommitment = parseFloat(( newBudget.COMMITMENT - entry.AMOUNT ).toFixed(2));
          //   newConsumed = parseFloat((newBudget.COMMITMENT + newBudget.ACTUAL).toFixed(2));
          //   newBudgetBalance = parseFloat((newBudget.CURRENT_BUDGET - newBudget.CONSUMED).toFixed(2));
          //   newActual = entry.ACTION === "APPROVE" ? parseFloat((newBudget.ACTUAL + entry.AMOUNT).toFixed(2)) : parseFloat((newBudget.ACTUAL).toFixed(2));
          // }

          await tx.run(
            UPDATE(ZBUDGET)
              .set({
                CONSUMED: parseFloat(newConsumed).toFixed(2),
                COMMITMENT: parseFloat(newCommitment).toFixed(2),
                BUDGET_BALANCE: parseFloat(newBudgetBalance).toFixed(2),
                ACTUAL: parseFloat(newActual).toFixed(2)
              })
              .where(condition)
          );



          results.push({
            YEAR: entry.YEAR,
            INTERNAL_ORDER: entry.INTERNAL_ORDER,
            FUND_CENTER: entry.FUND_CENTER,
            MATERIAL_GROUP: entry.MATERIAL_GROUP,
            COMMITMENT_ITEM: entry.COMMITMENT_ITEM,
            AMOUNT: entry.AMOUNT,
            PREV_CONSUMED: newBudget.CONSUMED,
            NEW_CONSUMED: newConsumed,
            PREV_ACTUAL: newBudget.ACTUAL,
            NEW_ACTUAL: newActual,
            PREV_COMMITMENT: newBudget.COMMITMENT,
            NEW_COMMITMENT: newCommitment,
            PREV_BUDGETBALANCE: newBudget.BUDGET_BALANCE,
            NEW_BUDGETBALANCE: newBudgetBalance,
            STATUS: 'Record updated'
          });
        }
        await tx.commit();
      } else {
        await tx.rollback();
      }

      return { message: JSON.stringify(results) };
    } catch (error) {
      await tx.rollback();
      req.error(400, `Budget checking failed: ${error.message}`);
    }
  });




  /* const port = process.env.PORT || 5000;

  app.listen(port, function () {
    console.log('listening');
  })
 */
}