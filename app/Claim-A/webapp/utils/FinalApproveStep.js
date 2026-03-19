sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "claima/utils/Utility",
    "claima/utils/budgetCheck",
    "claima/utils/NotifyandPost",
	"claima/utils/Constants"

],
    function (Filter, FilterOperator, Utility, budgetCheck, NotifyandPost, Constants) {
        "use strict";

        return {
            onFinalApprove: async function (oModel, sClaimID, sStatus, oEmployeeModel, oEmailPayload) {
        try{
                // Call Update Status
                Utility._updateStatus(oModel, sClaimID, sStatus);
                // Read table for Budget Data
                const sSubmissionType = sClaimID.substring(0, 3);  // split front 3 letters to determine if claim or request

                // Set Const Variables for Budget Processing
                var bIsPre = sSubmissionType === "REQ";
                const sBudgetApprove = 'approve';
                var sField_header = bIsPre ? "REQUEST_ID" : "CLAIM_ID";
                var sPARField = bIsPre ? "PREAPPROVAL_ID" : "CLAIM_ID"; 
                var sTable = bIsPre ? "/ZEMP_REQUEST_BUDGET_CHECK" : "/ZEMP_CLAIM_BUDGET_CHECK";
                var sTable2 = bIsPre ? "/ZEMP_APPROVER_REQUEST_DETAILS" : "/ZEMP_APPROVER_CLAIM_DETAILS";
                var dCurrentDate = new Date().toLocaleDateString('en-CA');

                if(oEmailPayload == null || oEmailPayload == "" || oEmailPayload.length == 0 || oEmailPayload == undefined){

                    const oClaimantList = oEmployeeModel.bindList(
                        sTable2,
                        null,
                        null,
                        [
                            new Filter(sPARField, FilterOperator.EQ, sClaimID),
                            new Filter("LEVEL", FilterOperator.EQ, "0")
                        ],
                        { $$ownRequest: true }
                    );

                    var sClaimType = bIsPre ? "Pre-Approval" : "Claim";

                    const aClaimantContexts = await oClaimantList.requestContexts();
                    const aClaimantData = aClaimantContexts.map(oCtx => oCtx.getObject());

                    const sClaimsSubmissionDate = dCurrentDate;     
                    const sClaimantName = aClaimantData[0].EMPLOYEE_NAME;
                    var sClaimType = sClaimType;
                    const sRecipientName = sClaimantName;
                    const sClaimantEmail = aClaimantData[0].EMPLOYEE_EMAIL;

                    var oEmailPayload = {
                        ApproverName: "AUTO",
                        SubmissionDate: sClaimsSubmissionDate,
                        ClaimantName: sClaimantName,
                        ClaimType: sClaimType,
                        ClaimID: sClaimID,
                        RecipientName: sRecipientName,
                        Action: "APPROVE",
                        ReceiverEmail: sClaimantEmail
                    };
                }
                    
                const aFilters = [new Filter(sField_header, FilterOperator.EQ, sClaimID)];
                
                const oBudgetBinding2 = oEmployeeModel.bindList(
                    sTable,
                    null,
                    null,
                    aFilters,
                    { $$ownRequest: true }
                );
                var aCtxBudget = await oBudgetBinding2.requestContexts(0, Infinity);
                var aBudgetRows = aCtxBudget.map(ctx => ctx.getObject());
                // Map rows
                var aDataset = aBudgetRows.map(oRow => {

                    var sYear = bIsPre
                        ? (oRow.REQUEST_DATE ? String(oRow.REQUEST_DATE).substring(0, 4) : null)
                        : (oRow.SUBMITTED_DATE ? String(oRow.SUBMITTED_DATE).substring(0, 4) : null);


                    const bUseAlt = "X";
                    var sFund_center = bUseAlt
                        ? (oRow.ALTERNATE_COST_CENTER)
                        : (oRow.COST_CENTER);


                    var iAmount = bIsPre
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
                budgetCheck.budgetProcessingTest(oModel, aDataset, sSubmissionType, sBudgetApprove);

                // Call Farisha email Function
                if (oEmailPayload) {
                    await NotifyandPost.sendEmailClaimant(oModel, oEmailPayload);
                }

                // SEND CONSOLIDATED IS PAYLOAD (CLM only)
                    if (sSubmissionType == Constants.WorkflowApproval.Claims) { 
                        
                        await this.onSendClaimBatch(oEmployeeModel, sClaimID);
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

                    var aCtxs = await oList.requestContexts(0, Infinity);
                    var aClaimRows = aCtxs.map(c => c.getObject());

                    if (!aClaimRows.length) {
                        return true;
                    }

                    // Map to CDS ApprovedClaimItem
                    var aClaimItems = aClaimRows.map(oRow => ({
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
                    } catch (err) {
                        throw err;
                    }
                }

            };
        });
