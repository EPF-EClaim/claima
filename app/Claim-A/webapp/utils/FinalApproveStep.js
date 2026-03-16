const cds = require('@sap/cds');
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

sap.ui.define([
    "./Utility",
    "./budgetCheck"
],
    function (Utility, budgetCheck) {
        "use strict";

        return {
            onFinalApprove: function (oModel, ClaimID, Status) {
                // Call Update Status
                Utility._updateStatus(oModel, ClaimID, Status);

                // Read table for Budget Data
                const submission_type = req.claimid.substring(0, 3);  // split front 3 letters to determine if claim or request
                // if (submission_type == 'CLM') // retrieve Claim Data
                // {
                //     // const ClaimData = SELECT.one.from(ZCLAIM_HEADER).columns();
                //     const BudgetData = SELECT.one.from(ZEMP_CLAIM_BUDGET_CHECK).columns(YEAR, FUND_CENTER, COMMITMENT_ITEM, MATERIAL_GROUP, PROJECT_CODE);
                // } else {
                //     // const ClaimData = SELECT.one.from(ZREQUEST_HEADER).columns();
                //     const BudgetData = SELECT.one.from(ZEMP_REQUEST_BUDGET_CHECK).columns(YEAR, FUND_CENTER, COMMITMENT_ITEM, MATERIAL_GROUP, PROJECT_CODE);
                // }

                // Set Const Variables for Budget Processing
                const BudgetApprove = 'approve';
                // Call Budget Processing
                budgetCheck.budgetProcessing(oModel, BudgetData, submission_type, BudgetApprove);

                // Call Farisha email Function

                // Call Pass Approval Claims to SAP IS


            }

        };

    });