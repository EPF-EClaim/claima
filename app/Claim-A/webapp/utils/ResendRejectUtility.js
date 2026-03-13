// claima/utils/ApprovalFlow.js
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    async function _rejectOrSendBackMultiLevel(oModel, id, userID, actionStatus, sendbackreason, comment) {
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
            [new Filter(sField, FilterOperator.EQ, id)],
            { $$ownRequest: true }
        );

        const aCtx = await binding.requestContexts(0, Infinity);
        const rows = aCtx.map(ctx => ctx.getObject());

        // 2) Identify the CURRENT approver row
        const currentRow = rows.find(r =>
            (r.APPROVER_ID === userID || r.SUBSTITUTE_APPROVER_ID === userID) &&
            r.STATUS === "PENDING APPROVAL"
        );

        if (!currentRow) {
            throw new Error("No pending approval found for this user.");
        }

        const currentLevel = currentRow.LEVEL;

        // 3) Mark current level as REJECTED / SEND BACK
        const ctxCurrent = aCtx.find(ctx => ctx.getObject().LEVEL === currentLevel);

        if (comment) {
            // Common field names you might have: "APPROVAL_COMMENT", "APPROVER_COMMENT", "REMARKS"
            ctxCurrent.setProperty("COMMENT", comment);
        }


        ctxCurrent.setProperty("REJECT_REASON_ID", sendbackreason);
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
        rejectOrSendBackMultiLevel: _rejectOrSendBackMultiLevel
    };

});