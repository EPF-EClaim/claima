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

  srv.on('budgetchecking', async (req) => {
    const { ZBUDGET } = srv.entities;
    const { budget } = req.data;

    const tx = cds.tx(req);
    const results = [];

    try {
      for (const entry of budget) {
        var condition = {};

        if (entry.YEAR) condition.YEAR = entry.YEAR;
        if (entry.INTERNAL_ORDER) condition.INTERNAL_ORDER = entry.INTERNAL_ORDER;
        if (entry.FUND_CENTER) condition.FUND_CENTER = entry.FUND_CENTER;
        if (entry.MATERIAL_GROUP) condition.MATERIAL_GROUP = entry.MATERIAL_GROUP;

        const budgetRecord = await tx.run(
          SELECT.one.from(ZBUDGET)
            .where(condition)
            .forUpdate()
        );

        if (!budgetRecord) {
          results.push({
            YEAR: entry.YEAR,
            INTERNAL_ORDER: entry.INTERNAL_ORDER,
            FUND_CENTER: entry.FUND_CENTER,
            MATERIAL_GROUP: entry.MATERIAL_GROUP,
            AMOUNT: entry.AMOUNT,
            PREV_CONSUMED: null,
            NEW_CONSUMED: null,
            PREV_ACTUAL: null,
            NEW_ACTUAL: null,
            PREV_COMMITMENT: null,
            NEW_COMMITMENT: null,
            STATUS: 'RECORD NOT FOUND'
          });
          continue;
        }

        const bSufficient = entry.AMOUNT <= budgetRecord.BUDGET_BALANCE;

        if (bSufficient) {
          let newCommitment = parseFloat((budgetRecord.COMMITMENT - entry.AMOUNT).toFixed(2));
          let newConsumed = parseFloat((budgetRecord.CONSUMED - entry.AMOUNT).toFixed(2));
          let newActual = parseFloat((budgetRecord.ACTUAL - entry.AMOUNT).toFixed(2));
          let newBudgetBalance = parseFloat((budgetRecord.BUDGET_BALANCE - entry.AMOUNT).toFixed(2));

          await tx.run(
            UPDATE(ZBUDGET)
              .set({ CONSUMED: newConsumed, COMMITMENT: newCommitment, ACTUAL: newActual, BUDGET_BALANCE: newBudgetBalance })
              .where(condition)
          );
          results.push({
            YEAR: entry.YEAR,
            INTERNAL_ORDER: entry.INTERNAL_ORDER,
            FUND_CENTER: entry.FUND_CENTER,
            MATERIAL_GROUP: entry.MATERIAL_GROUP,
            AMOUNT: entry.AMOUNT,
            PREV_CONSUMED: budgetRecord.CONSUMED,
            NEW_CONSUMED: newConsumed,
            PREV_ACTUAL: budgetRecord.ACTUAL,
            NEW_ACTUAL: newActual,
            PREV_COMMITMENT: budgetRecord.COMMITMENT,
            NEW_COMMITMENT: newCommitment,
            PREV_BUDGETBALANCE: budgetRecord.BUDGET_BALANCE,
            NEW_BUDGETBALANCE: newBudgetBalance,
            STATUS: 'Success'
          });
        } else {
          results.push({
            YEAR: entry.YEAR,
            INTERNAL_ORDER: entry.INTERNAL_ORDER,
            FUND_CENTER: entry.FUND_CENTER,
            MATERIAL_GROUP: entry.MATERIAL_GROUP,
            AMOUNT: entry.AMOUNT,
            PREV_CONSUMED: budgetRecord.CONSUMED,
            NEW_CONSUMED: budgetRecord.CONSUMED,
            PREV_ACTUAL: budgetRecord.ACTUAL,
            NEW_ACTUAL: budgetRecord.ACTUAL,
            PREV_COMMITMENT: budgetRecord.COMMITMENT,
            NEW_COMMITMENT: budgetRecord.COMMITMENT,
            STATUS: 'Failed to update. Insufficient balance'
          });
        }
      }

      return { message: JSON.stringify(results) };
    } catch (error) {
      req.error(400, `Budget checking failed: ${error.message}`);
    }
  });



  /* const port = process.env.PORT || 5000;

  app.listen(port, function () {
    console.log('listening');
  })
 */

  srv.on('sendEmail' , async(req) => {
    const ISserivce = await cds.connect.to('IS_NonProd_Conn');
    var path = "/http/EmailNotification_BTP_DEV";
    var test; 
    ISserivce.send({
      method: 'POST',
      path: path,
      data: {
        "ApproverName":req.data.ApproverName,
        "SubmissionDate":req.data.SubmissionDate,
        "ClaimantName":req.data.ClaimantName,
        "InstanceID":req.data.InstanceID,
        "ClaimType":req.data.ClaimType,
        "ClaimID":req.data.ClaimID,
        "RecipientName":req.data.RecipientName,
        "Action":req.data.Action,
        "ReceiverEmail":req.data.ReceiverEmail,
        "CCEmail":req.data.CCEmail,
        "EmailTitle":req.data.EmailTitle,
        "EmailBody":req.data.EmailBody,
        "NextApproverName" : req.data.NextApproverName
      }
    });
  });

}