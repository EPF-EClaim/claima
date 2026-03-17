sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./Utility",
    "claima/utils/budgetCheck",
    "claima/utils/NotifyandPost"

],
    function (Filter, FilterOperator, Utility, budgetCheck, NotifyandPost) {
        "use strict";

        return {
            onFinalApprove: async function (oModel, ClaimID, Status, oModel2, emailPayload) {
        try{
                // Call Update Status
                Utility._updateStatus(oModel, ClaimID, Status);

                // Read table for Budget Data
                const submissionType = ClaimID.substring(0, 3);  // split front 3 letters to determine if claim or request

                // Set Const Variables for Budget Processing
                const bIsPre = submissionType === "REQ";
                const BudgetApprove = 'approve';
                const sField_header = submissionType === "REQ" ? "REQUEST_ID" : "CLAIM_ID";
                const sTable = submissionType === "REQ" ? "/ZEMP_REQUEST_BUDGET_CHECK" : "/ZEMP_CLAIM_BUDGET_CHECK";
                const aFilters = [new Filter(sField_header, FilterOperator.EQ, ClaimID)];
                
                const oBudgetBinding2 = oModel.bindList(
                    sTable,
                    null,
                    null,
                    aFilters,
                    { $$ownRequest: true }
                );
                const aCtxBudget = await oBudgetBinding2.requestContexts(0, Infinity);
                const budgetRows = aCtxBudget.map(ctx => ctx.getObject());
                // Map rows
                const dataset = budgetRows.map(r => {

                    const yyyy = bIsPre
                        ? (r.REQUEST_DATE ? String(r.REQUEST_DATE).substring(0, 4) : null)
                        : (r.SUBMITTED_DATE ? String(r.SUBMITTED_DATE).substring(0, 4) : null);


                    const useAlt = r.USE_ALT_COST_CENTER === "X" || r.ALT_SELECTED === "X";
                    const fund_center = useAlt
                        ? (r.ALTERNATE_COST_CENTER)
                        : (r.COST_CENTER);


                    const amount = bIsPre
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
                if (emailPayload) {
                    await NotifyandPost.sendEmailClaimant(oModel, emailPayload);
                }

                // SEND CONSOLIDATED IS PAYLOAD (CLM only)
                        if (submissionType === "CLM") {
                        await this.onSendClaimBatch(oModel2, ClaimID);
                        }

                        return true;

                    } catch (err) {
                        console.error("[FinalApproveStep] ERROR:", err);
                        throw err;
                    }
                    },

                    /**
                     * Single-call consolidated IS posting for final approval
                     */
                    onSendClaimBatch: async function (oModelView, ClaimID) {

                    // Read all claim items
                    const list = oModelView.bindList(
                        "/ZEMP_CLAIM_DETAILS",
                        null,
                        null,
                        [new Filter("CLAIM_ID", FilterOperator.EQ, ClaimID)],
                        { $$ownRequest: true }
                    );

                    const ctxs = await list.requestContexts(0, Infinity);
                    const rows = ctxs.map(c => c.getObject());

                    if (!rows.length) {
                        console.warn("[FinalApproveStep] No claim items for:", ClaimID);
                        return true;
                    }

                    // Map to CDS ApprovedClaimItem
                    const items = rows.map(r => ({
                        ClaimSubID:           r.CLAIM_SUB_ID,
                        EmpID:                r.EMP_ID,
                        SubmissionDate:       r.SUBMITTED_DATE,
                        FinalAmounttoReceive: r.FINAL_AMOUNT_TO_RECEIVE,
                        LastModifiedDate:     r.LAST_MODIFIED_DATE,
                        Amount:               r.AMOUNT,
                        ReceiptDate:          r.RECEIPT_DATE,
                        CostCenter:           r.COST_CENTER,
                        GLAccount:            r.GL_ACCOUNT,
                        MaterialCode:         r.MATERIAL_CODE
                    }));

                    //Call CDS batch action ONCE
                    const oAction = oModelView.bindContext("/sendApprovedClaimBatch(...)");
                    oAction.setParameter("batch", {
                        ClaimID,
                        Items: items
                    });

                    try {
                        await oAction.execute();
                        console.log("[FinalApproveStep] IS batch sent:", ClaimID);
                        return true;
                    } catch (err) {
                        console.error("[FinalApproveStep] IS batch FAILED:", err);
                        throw err;
                    }
                }

            };
        });
