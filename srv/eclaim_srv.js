const cds = require('@sap/cds');
const { INSERT, UPDATE, UPSERT, SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const express = require('express');
const app = express();

module.exports = (srv) => {

  const { ZRISK } = srv.entities;

  srv.before('CREATE', ZRISK, (req) => {
    const { START_DATE, END_DATE } = req.data || {}
    if (START_DATE != null && END_DATE != null && new Date(END_DATE) < new Date(START_DATE)) {
      req.error(400, 'End Date must be greater than or equal to Start Date.', { target: 'END_DATE' })
    }
  })

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
  }),

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
        userType: result?.USER_TYPE || "UNKNOWN",
        costcenters: result?.CC || "UNKNOWN",
        userId: result?.EEID || "UNKNOWN",
        name: result?.NAME || "UNKNOWN", 
        position: result?.POSITION_NAME || "UNKNOWN"
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
    } else if (user_type === "Super Admin") {
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

    const toNum = (v) => Number(v) || 0;
    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

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
            .forShareLock() //lock the record, others may still have access to read the selected record
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
      //all records having sufficient balance
      //do not proceed if any of the record doesnt have sufficient amount
      if (error === false) {  

        for (var entry of budget) {       
          condition = {};

          if (entry.YEAR) condition.YEAR = entry.YEAR;
          if (entry.INTERNAL_ORDER) condition.INTERNAL_ORDER = entry.INTERNAL_ORDER;
          if (entry.FUND_CENTER) condition.FUND_CENTER = entry.FUND_CENTER;
          if (entry.MATERIAL_GROUP) condition.MATERIAL_GROUP = entry.MATERIAL_GROUP;
          if (entry.COMMITMENT_ITEM) condition.COMMITMENT_ITEM = entry.COMMITMENT_ITEM;

          var newBudget = await tx.run(SELECT.one.from(ZBUDGET).where(condition));

          if (entry.ACTION === "SUBMIT") {
            newCommitment = round2(toNum(newBudget.COMMITMENT) + toNum(entry.AMOUNT));
            newConsumed = round2(toNum(newBudget.COMMITMENT) + toNum(newBudget.ACTUAL));
            newBudgetBalance = round2(toNum(newBudget.CURRENT_BUDGET) - toNum(newBudget.CONSUMED));
            newActual = round2(toNum(newBudget.ACTUAL));
          } else if (entry.ACTION === "REJECT" || entry.ACTION === "APPROVE") {
            newCommitment =  round2(toNum(newBudget.COMMITMENT) - toNum(entry.AMOUNT ));
            newConsumed = round2(toNum(newBudget.COMMITMENT) + toNum(newBudget.ACTUAL));
            newBudgetBalance = round2(toNum(newBudget.CURRENT_BUDGET) - toNum(newBudget.CONSUMED));
            newActual = entry.ACTION === "APPROVE" ? round2(toNum(newBudget.ACTUAL) + toNum(entry.AMOUNT)) : round2(toNum(newBudget.ACTUAL));
          }

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
            AMOUNT: round2(toNum(entry.AMOUNT)),
            PREV_CONSUMED: round2(toNum(newBudget.CONSUMED)),
            NEW_CONSUMED: newConsumed,
            PREV_ACTUAL: round2(toNum(newBudget.ACTUAL)),
            NEW_ACTUAL: newActual,
            PREV_COMMITMENT: round2(toNum(newBudget.COMMITMENT)),
            NEW_COMMITMENT: newCommitment,
            PREV_BUDGETBALANCE: round2(toNum(newBudget.BUDGET_BALANCE)),
            NEW_BUDGETBALANCE: newBudgetBalance,
            STATUS: 'Record updated'
          });

        }  

        await tx.commit();

      } else {
        await tx.rollback();
      }

      return { results };
    } catch (error) {
      await tx.rollback();
      req.error(400, `Budget checking failed: ${error.message}`);
    }
});

  srv.on('batchUpdatePreApproved', async (req) => {
    const { ZREQUEST_ITEM } = srv.entities;
    // check request if empty
    try {
      const { PreApprove } = req.data;
      if (!PreApprove) {
        throw new Error('No Data Sent')
      }
      const tx = cds.tx(req);

      for (var entry of PreApprove) {

        const results = await tx.run(
          UPDATE(ZREQUEST_ITEM).set({ SEND_TO_SF: 1 }).where({ REQUEST_ID: entry.REQUEST_ID, REQUEST_SUB_ID: entry.REQUEST_SUB_ID })
        );
        
      }
      await tx.commit();

      const response = {
        success: true,
        req: PreApprove,
      };

      req.notify(200, `Successfully updated "SEND_TO_SF" for`)
      return response;

    } catch (error) {
      req.error(400, `Fail updating record: ${error.message}`);
    }
  });

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
        "NextApproverName" : req.data.NextApproverName,
        "RejectReason" : req.data.RejectReason,
        "ApproverComments" : req.data.ApproverComments
      }
    });
  });
  srv.on('sendEmailApprover' , async(req) => {
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
        "NextApproverName" : req.data.NextApproverName,
        "RejectReason" : req.data.RejectReason,
        "ApproverComments" : req.data.ApproverComments
      }
    });
  });

}