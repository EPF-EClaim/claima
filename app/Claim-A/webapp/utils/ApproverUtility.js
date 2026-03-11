// claima/utils/ApprovalFlow.js
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    async function _approveMultiLevel(oModel, id, userID) {

        const submissionType = id.substring(0, 3);
        const sTable = submissionType === "REQ"
            ? "/ZAPPROVER_DETAILS_PREAPPROVAL"
            : "/ZAPPROVER_DETAILS_CLAIMS";
        const sField = submissionType === "REQ" ? "PREAPPROVAL_ID" : "CLAIM_ID";

        // STEP 1: Get all approver rows for this ID
        const bindingAll = oModel.bindList(
            sTable,
            null,
            null,
            [
                new Filter(sField, FilterOperator.EQ, id)
            ],
            { $$ownRequest: true }
        );

        const aCtx = await bindingAll.requestContexts(0, Infinity);
        const rows = aCtx.map(ctx => ctx.getObject());

        // STEP 2: Find CURRENT level belonging to this approver
        const currentRow = rows.find(r =>
            (r.APPROVER_ID === userID || r.SUBSTITUTE_APPROVER_ID === userID) &&
            r.STATUS === "PENDING APPROVER"
        );

        if (!currentRow) {
            throw new Error("You are not the current processor for this Claim/Pre-approval or Claim/Pre-approval has been processed by another Approver");
        }

        const currentLevel = currentRow.LEVEL;

        // STEP 3: Approve current level
        const ctxCurrent = aCtx.find(ctx => ctx.getObject().LEVEL === currentLevel);
        ctxCurrent.setProperty("STATUS", "APPROVED");

        // STEP 4: Activate next level
        const nextLevel = currentLevel + 1;
        const ctxNext = aCtx.find(ctx => ctx.getObject().LEVEL === nextLevel);

        if (ctxNext) {
            ctxNext.setProperty("STATUS", "PENDING APPROVER");
        } else {
            // No next level → final approval
            console.log("No further approvers found. Proceed to Final Approve Step");
        }

        // STEP 5: Submit batch update
        //await oModel.submitBatch("$auto");

        sap.m.MessageToast.show("Approval successful.");
    }

    return {
        approveMultiLevel: _approveMultiLevel
    };

    
 async function _rejectOrSendBackMultiLevel(oModel, id, userID, actionStatus) {
        // actionStatus = "REJECTED" or "SEND BACK"

        const submissionType = id.substring(0, 3);
        const sTable = submissionType === "REQ"
            ? "/ZAPPROVER_DETAILS_PREAPPROVAL"
            : "/ZAPPROVER_DETAILS_CLAIMS";

        const sField = submissionType === "REQ" ? "PREAPPROVAL_ID" : "CLAIM_ID";

        // 1) Load all rows for this ID
        const binding = oModel.bindList(
            sTable,
            null,
            null,
            [ new Filter(sField, FilterOperator.EQ, id) ],
            { $$ownRequest: true }
        );

        const aCtx = await binding.requestContexts(0, Infinity);
        const rows = aCtx.map(ctx => ctx.getObject());

        // 2) Identify the CURRENT approver row
        const currentRow = rows.find(r =>
            (r.APPROVER_ID === userID || r.SUBSTITUTE_APPROVER_ID === userID) &&
            r.STATUS === "PENDING APPROVER"
        );

        if (!currentRow) {
            throw new Error("No pending approval found for this user.");
        }

        const currentLevel = currentRow.LEVEL;

        // 3) Mark current level as REJECTED / SEND BACK
        const ctxCurrent = aCtx.find(ctx => ctx.getObject().LEVEL === currentLevel);
        ctxCurrent.setProperty("STATUS", actionStatus);

        // 4) Mark ALL higher levels as COMPLETED
        aCtx.forEach(ctx => {
            const obj = ctx.getObject();
            if (obj.LEVEL > currentLevel) {
                ctx.setProperty("STATUS", "COMPLETED");
            }
        });

        // 5) Submit to backend
        await oModel.submitBatch("$auto");

        sap.m.MessageToast.show(
            actionStatus === "REJECTED" 
                ? "Request rejected successfully"
                : "Request sent back successfully"
        );
    }
    
    return {
        rejectOrSendBack: _rejectOrSendBackMultiLevel
    };
});