sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./Utility",
    "claima/utils/budgetCheck"

],
    function (Filter, FilterOperator, Utility, budgetCheck) {
        "use strict";

        return {
            onFinalApprove: async function (oModel, ClaimID, Status, oModel2) {

                // Call Update Status
                Utility._updateStatus(oModel, ClaimID, Status);

                // Read table for Budget Data
                const submissionType = ClaimID.substring(0, 3);  // split front 3 letters to determine if claim or request
                // if (submission_type == 'CLM') // retrieve Claim Data
                // {
                //     // const ClaimData = SELECT.one.from(ZCLAIM_HEADER).columns();
                //     const BudgetData = SELECT.one.from(ZEMP_CLAIM_BUDGET_CHECK).columns(YEAR, FUND_CENTER, COMMITMENT_ITEM, MATERIAL_GROUP, PROJECT_CODE);
                // } else {
                //     // const ClaimData = SELECT.one.from(ZREQUEST_HEADER).columns();
                //     const BudgetData = SELECT.one.from(ZEMP_REQUEST_BUDGET_CHECK).columns(YEAR, FUND_CENTER, COMMITMENT_ITEM, MATERIAL_GROUP, PROJECT_CODE);
                // }

                // Set Const Variables for Budget Processing
                const isPre = submissionType === "REQ";
                const BudgetApprove = 'approve';
                const sField_header = submissionType === "REQ" ? "REQUEST_ID" : "CLAIM_ID";
                const sTable = submissionType === "REQ" ? "/ZEMP_REQUEST_BUDGET_CHECK" : "/ZEMP_CLAIM_BUDGET_CHECK";
                const aFilters = [new Filter(sField_header, FilterOperator.EQ, ClaimID)];
                
                const budgetBinding2 = oModel.bindList(
                    sTable,
                    null,
                    null,
                    aFilters,
                    { $$ownRequest: true }
                );
                const aCtxBudget = await budgetBinding2.requestContexts(0, Infinity);
                const budgetRows = aCtxBudget.map(ctx => ctx.getObject());
                // Map rows
                const dataset = budgetRows.map(r => {

                    const yyyy = isPre
                        ? (r.REQUEST_DATE ? String(r.REQUEST_DATE).substring(0, 4) : null)
                        : (r.SUBMITTED_DATE ? String(r.SUBMITTED_DATE).substring(0, 4) : null);


                    const useAlt = r.USE_ALT_COST_CENTER === "X" || r.ALT_SELECTED === "X";
                    const fund_center = useAlt
                        ? (r.ALTERNATE_COST_CENTER)
                        : (r.COST_CENTER);


                    const amount = isPre
                        ? Number(r.EST_AMOUNT || 0)
                        : Number(r.AMOUNT || 0);
                    return {
                        yyyy,
                        fund_center,
                        commitment_item: r.GL_ACCOUNT,
                        material_code: r.MATERIAL_CODE,
                        project_code: "1",
                        amount
                    };
                });
                // Call Budget Processing
                budgetCheck.budgetProcessingTest(oModel2, dataset, submissionType, BudgetApprove);

                // Call Farisha email Function

                // Call Pass Approval Claims to SAP IS


            }

        };

    });