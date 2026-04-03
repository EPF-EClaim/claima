sap.ui.define([
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "claima/utils/Utility",
    "claima/utils/budgetCheck",
    "claima/utils/NotifyandPost",
    "claima/utils/Constants"

],
    function (BusyIndicator, Filter, FilterOperator, MessageBox, Utility, budgetCheck, NotifyandPost, Constants) {
        "use strict";

        return {
            onFinalApprove: async function (oController, oModel, sClaimID, sStatus, oViewModel, oEmailPayload) {
                try {
                    // Call Update Status
                    Utility._updateStatus(oModel, sClaimID, sStatus);
                    // Read table for Budget Data
                    const sSubmissionType = sClaimID.substring(0, 3);  // split front 3 letters to determine if claim or request

                    // Set Const Variables for Budget Processing
                    var bIsPre = sSubmissionType === Constants.WorkflowType.REQUEST;
                    const sBudgetApprove = Constants.BudgetCheckAction.APPROVE;
                    var sField_header = bIsPre ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;
                    var sPARField = bIsPre ? Constants.EntitiesFields.PREAPPROVALID : Constants.EntitiesFields.CLAIMID;
                    var sBudgetCheckViewPath = bIsPre ? Constants.Entities.ZEMP_REQUEST_BUDGET_CHECK : Constants.Entities.ZEMP_CLAIM_BUDGET_CHECK;
                    var sApproverDetailsViewPath = bIsPre ? Constants.Entities.ZEMP_APPROVER_REQUEST_DETAILS : Constants.Entities.ZEMP_APPROVER_CLAIM_DETAILS;
                    var dCurrentDate = new Date().toLocaleDateString('en-CA');
                    const sLevel = "0";

                    if (oEmailPayload == null || oEmailPayload == "" || oEmailPayload.length == 0 || oEmailPayload == undefined) {

                        const oClaimantList = oViewModel.bindList(
                            sApproverDetailsViewPath,
                            null,
                            null,
                            [
                                new Filter(sPARField, FilterOperator.EQ, sClaimID),
                                new Filter(Constants.EntitiesFields.LEVEL, FilterOperator.EQ, sLevel)
                            ],
                            { $$ownRequest: true }
                        );

                        var sClaimType = bIsPre ? Constants.ApprovalProcess.REQUESTTYPE : Constants.ApprovalProcess.CLAIMTYPE;

                        const aClaimantContexts = await oClaimantList.requestContexts();
                        const aClaimantData = aClaimantContexts.map(oCtx => oCtx.getObject());

                        const sClaimsSubmissionDate = dCurrentDate;
                        const sClaimantName = aClaimantData[0].EMPLOYEE_NAME;
                        var sClaimType = sClaimType;
                        const sRecipientName = sClaimantName;
                        const sClaimantEmail = aClaimantData[0].EMPLOYEE_EMAIL;

                        var oEmailPayload = {
                            ApproverName: Constants.Approvers.AUTO,
                            SubmissionDate: sClaimsSubmissionDate,
                            ClaimantName: sClaimantName,
                            ClaimType: sClaimType,
                            ClaimID: sClaimID,
                            RecipientName: sRecipientName,
                            Action: Constants.ApprovalProcessAction.ACTION_APPROVE,
                            ReceiverEmail: sClaimantEmail
                        };
                    }

                    const aFilters = [new Filter(sField_header, FilterOperator.EQ, sClaimID)];

                    const oBudgetBinding2 = oViewModel.bindList(
                        sBudgetCheckViewPath,
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


                        var sFund_center = (oRow.ALTERNATE_COST_CENTER) ?? (oRow.COST_CENTER) ?? "";


                        var iAmount = bIsPre
                            ? Number(oRow.EST_AMOUNT || 0)
                            : Number(oRow.AMOUNT || 0);
                        return {
                            yyyy: sYear,
                            fund_center: sFund_center,
                            commitment_item: oRow.GL_ACCOUNT,
                            material_code: oRow.MATERIAL_CODE,
                            project_code: "1",
                            amount: iAmount
                        };
                    });

                    // Call Budget Processing

                    /** Commenting out budgetProcessing as it will be replaced by a backend function by Jefry 
                    budgetCheck.budgetProcessing(oModel, aDataset, sSubmissionType, sBudgetApprove);
                    */
                    try {
                        const aResult = budgetCheck.backendBudgetChecking(oController, sSubmissionType, Constants.BudgetCheckAction.APPROVE);

                    } catch (oError) {

                    }

                    // Call Farisha email Function
                    if (oEmailPayload) {
                        await NotifyandPost.sendEmailClaimant(oModel, oEmailPayload);
                    }

                    // SEND CONSOLIDATED IS PAYLOAD (CLM only)
                    if (sSubmissionType == Constants.WorkflowType.CLAIM) {

                        await this.onSendClaimBatch(oViewModel, sClaimID);
                    }
                    return true;

                } catch (oError) {
                    //throw err;
                }
            },

            /**
             * Single-call consolidated IS posting for final approval
             */
            onSendClaimBatch: async function (oViewModel, sClaimID) {

                // Read all claim items
                const oList = oViewModel.bindList(
                    Constants.Entities.ZEMP_CLAIM_DETAILS,
                    null,
                    null,
                    [new Filter(Constants.EntitiesFields.CLAIMID, FilterOperator.EQ, sClaimID)],
                    { $$ownRequest: true }
                );

                var aCtxs = await oList.requestContexts(0, Infinity);
                var aClaimRows = aCtxs.map(c => c.getObject());

                if (!aClaimRows.length) {
                    return true;
                }

                // Map to CDS ApprovedClaimItem
                var aClaimItems = aClaimRows.map(oRow => ({
                    ClaimID: sClaimID,
                    ClaimSubID: oRow.CLAIM_SUB_ID,
                    EmpID: oRow.EMP_ID,
                    SubmissionDate: oRow.SUBMITTED_DATE,
                    FinalAmounttoReceive: oRow.FINAL_AMOUNT_TO_RECEIVE,
                    LastModifiedDate: oRow.LAST_MODIFIED_DATE,
                    Amount: oRow.AMOUNT,
                    ReceiptDate: oRow.RECEIPT_DATE,
                    CostCenter: oRow.COST_CENTER,
                    GLAccount: oRow.GL_ACCOUNT,
                    MaterialCode: oRow.MATERIAL_CODE
                }));

                //Call CDS batch action ONCE
                const oAction = oViewModel.bindContext("/sendApprovedClaimBatch(...)");
                oAction.setParameter("batch", {
                    ClaimID: sClaimID,
                    Items: aClaimItems
                });

                try {
                    await oAction.execute();
                } catch (oError) {
                    MessageBox.error(oError.message);
                } finally {
                    BusyIndicator.hide();
                }
            }
        };
    });
