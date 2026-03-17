sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./Utility",
    "claima/utils/budgetCheck",
    "claima/utils/NotifyandPost"

],
    function (Filter, FilterOperator, Utility, budgetCheck, NotifyandPost) {
        "use strict";

        return {
            onFinalApprove: async function (oModel, sClaimID, sStatus, oModel2, oEmailPayload) {
        try{
                // Call Update Status
                Utility._updateStatus(oModel, sClaimID, sStatus);

                // Read table for Budget Data
                const sSubmissionType = sClaimID.substring(0, 3);  // split front 3 letters to determine if claim or request

                // Set Const Variables for Budget Processing
                const bIsPre = sSubmissionType === "REQ";
                const sBudgetApprove = 'approve';
                const sField_header = bIsPreRequest ? "REQUEST_ID" : "CLAIM_ID";
                const sTable = bIsPreRequest ? "/ZEMP_REQUEST_BUDGET_CHECK" : "/ZEMP_CLAIM_BUDGET_CHECK";
                const aFilters = [new Filter(sField_header, FilterOperator.EQ, iClaimID)];
                
                const oBudgetBinding2 = oModel.bindList(
                    sTable,
                    null,
                    null,
                    aFilters,
                    { $$ownRequest: true }
                );
                const aCtxBudget = await oBudgetBinding2.requestContexts(0, Infinity);
                const aBudgetRows = aCtxBudget.map(ctx => ctx.getObject());
                // Map rows
                const aDataset = aBudgetRows.map(oRow => {

                    const sYear = bIsPre
                        ? (oRow.REQUEST_DATE ? String(oRow.REQUEST_DATE).substring(0, 4) : null)
                        : (oRow.SUBMITTED_DATE ? String(oRow.SUBMITTED_DATE).substring(0, 4) : null);


                    const bUseAlt = oRow.USE_ALT_COST_CENTER === "X" || oRow.ALT_SELECTED === "X";
                    const sFund_center = bUseAlt
                        ? (oRow.ALTERNATE_COST_CENTER)
                        : (oRow.COST_CENTER);


                    const iAmount = bIsPre
                        ? Number(oRow.EST_AMOUNT || 0)
                        : Number(oRow.AMOUNT || 0);
                    return {
                        yyyy:sYear,
                        fund_center:sFund_center,
                        commitment_item: oRow.GL_ACCOUNT,
                        material_code: oRow.MATERIAL_CODE,
                        project_code: "1",
                        amount:iAmount
                    };
                });
                // Call Budget Processing
                budgetCheck.budgetProcessingTest(oModel2, aDataset, sSubmissionType, sBudgetApprove);

                // Call Farisha email Function
                if (oEmailPayload) {
                    await NotifyandPost.sendEmailClaimant(oModel, oEmailPayload);
                }

                // SEND CONSOLIDATED IS PAYLOAD (CLM only)
                        if (sSubmissionType === "CLM") {
                        await this.onSendClaimBatch(oModel2, sClaimID);
                        }

                        return true;

                    } catch (err) {
                        throw err;
                    }
                    },

                    /**
                     * Single-call consolidated IS posting for final approval
                     */
                    onSendClaimBatch: async function (oModelView, sClaimID) {

                    // Read all claim items
                    const oList = oModelView.bindList(
                        "/ZEMP_CLAIM_DETAILS",
                        null,
                        null,
                        [new Filter("CLAIM_ID", FilterOperator.EQ, sClaimID)],
                        { $$ownRequest: true }
                    );

                    const aCtxs = await oList.requestContexts(0, Infinity);
                    const aClaimRows = aCtxs.map(c => c.getObject());

                    if (!aClaimRows.length) {
                        return true;
                    }

                    // Map to CDS ApprovedClaimItem
                    const aClaimItems = aClaimRows.map(oRow => ({
                        ClaimSubID:           oRow.CLAIM_SUB_ID,
                        EmpID:                oRow.EMP_ID,
                        SubmissionDate:       oRow.SUBMITTED_DATE,
                        FinalAmounttoReceive: oRow.FINAL_AMOUNT_TO_RECEIVE,
                        LastModifiedDate:     oRow.LAST_MODIFIED_DATE,
                        Amount:               oRow.AMOUNT,
                        ReceiptDate:          oRow.RECEIPT_DATE,
                        CostCenter:           oRow.COST_CENTER,
                        GLAccount:            oRow.GL_ACCOUNT,
                        MaterialCode:         oRow.MATERIAL_CODE
                    }));

                    //Call CDS batch action ONCE
                    const oAction = oModelView.bindContext("/sendApprovedClaimBatch(...)");
                    oAction.setParameter("batch", {
                        ClaimID: sClaimID,
                        Items: aClaimItems
                    });

                   try {
                        await oAction.execute();
                        return true;
                    } catch (err) {
                        throw err;
                    }
                }

            };
        });
