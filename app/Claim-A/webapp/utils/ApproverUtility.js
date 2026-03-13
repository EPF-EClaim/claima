// claima/utils/ApprovalFlow.js
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    async function _approveMultiLevel(oModel, id, userID, comment) {

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
            r.STATUS === "STAT02"
        );

        if (!currentRow) {
            throw new Error("You are not the current processor for this Claim/Pre-approval or Claim/Pre-approval has been processed by another Approver");
        }

        const currentLevel = currentRow.LEVEL;

        // STEP 3: Approve current level
        const ctxCurrent = aCtx.find(ctx => ctx.getObject().LEVEL === currentLevel);


        if (comment) {
            // Common field names you might have: "APPROVAL_COMMENT", "APPROVER_COMMENT", "REMARKS"
            ctxCurrent.setProperty("COMMENT", comment);
        }


        const now = new Date();
        const tsLocal = formatTimestamp9(now, { utc: false }); // e.g., "2026-02-20 02:19:55.722000000"
        ctxCurrent.setProperty("PROCESS_TIMESTAMP", tsLocal);
        ctxCurrent.setProperty("STATUS", "STAT05"); //APPROVED



        // STEP 4: Activate next level
        const nextLevel = currentLevel + 1;
        const ctxNext = aCtx.find(ctx => ctx.getObject().LEVEL === nextLevel);

        if (ctxNext) {
            ctxNext.setProperty("STATUS", "STAT02"); //PENDING APPROVAL
        } else {
            // No next level → final approval
            console.log("No further approvers found. Proceed to Final Approve Step");
        }

        // STEP 5: Submit batch update
        await oModel.submitBatch("$auto");

        sap.m.MessageToast.show("Approval successful.");
    }

    //For Reject resend
    async function _rejectOrSendBackMultiLevel(oModel, id, userID, actionStatus, sendbackreason, comment) {
        // actionStatus e.g., "STAT04" (rejected) or "STAT03" (send back)
        const updateGroupId = "approvalGroup";

        const submissionType = id.substring(0, 3);
        const isPre = submissionType === "REQ";

        const detailsSet = isPre ? "/ZAPPROVER_DETAILS_PREAPPROVAL" : "/ZAPPROVER_DETAILS_CLAIMS";
        const headerSet = isPre ? "/ZREQUEST_HEADER" : "/ZCLAIM_HEADER";
        const idField = isPre ? "PREAPPROVAL_ID" : "CLAIM_ID";
        const sField_header = submissionType === "REQ" ? "REQUEST_ID" : "CLAIM_ID";

        // 1) Load rows
        const binding = oModel.bindList(
            detailsSet,
            null,
            null,
            [new sap.ui.model.Filter(idField, sap.ui.model.FilterOperator.EQ, id)],
            { $$ownRequest: true, $$updateGroupId: updateGroupId }
        );
        const aCtx = await binding.requestContexts(0, Infinity);
        const rows = aCtx.map(ctx => ctx.getObject());

        // 2) Current approver row (pending)
        const currentRow = rows.find(r =>
            (r.APPROVER_ID === userID || r.SUBSTITUTE_APPROVER_ID === userID) &&
            r.STATUS === "STAT02"
        );
        if (!currentRow) {
            throw new Error("No pending approval found for this user.");
        }
        const currentLevel = currentRow.LEVEL;
        const ctxCurrent = aCtx.find(ctx => ctx.getObject().LEVEL === currentLevel);

        // 3) Set action on current row
        if (comment) ctxCurrent.setProperty("COMMENT", comment);

        const now = new Date();
        const tsLocal = formatTimestamp9(now, { utc: false, fractionalDigits: 7 });

        ctxCurrent.setProperty("PROCESS_TIMESTAMP", tsLocal);
        if (sendbackreason) ctxCurrent.setProperty("REJECT_REASON_ID", sendbackreason);
        ctxCurrent.setProperty("STATUS", actionStatus);

        // 4) Mark higher levels as completed (STAT06)
        aCtx.forEach(ctx => {
            const obj = ctx.getObject();
            if (obj.LEVEL > currentLevel) {
                ctx.setProperty("STATUS", "STAT06");
            }
        });

        // 5) Update header (same group)
        const headerBinding = oModel.bindList(
            headerSet,
            null,
            null,
            [new sap.ui.model.Filter(sField_header, sap.ui.model.FilterOperator.EQ, id)],
            { $$ownRequest: true, $$updateGroupId: updateGroupId }
        );
        const [hctx] = await headerBinding.requestContexts(0, 1);
        if (hctx) {
            hctx.setProperty("STATUS", actionStatus);          // STAT04/STAT03 at header
        }

        // 6) Submit this group
        await oModel.submitBatch(updateGroupId);

        sap.m.MessageToast.show(
            actionStatus === "STAT04" ? "Request rejected successfully" : "Request sent back successfully"
        );
    }


    // Helper: pad with leading zeros
    function pad(n, width = 2) {
        return String(n).padStart(width, "0");
    }

    // Helper: format Date into "YYYY-MM-DD HH:mm:ss.fffffffff"
    // - utc=true  -> use UTC components
    // - utc=false -> use local time components (e.g., Asia/Kuala_Lumpur)
    function formatTimestamp9(date = new Date(), { utc = true } = {}) {
        const Y = utc ? date.getUTCFullYear() : date.getFullYear();
        const M = utc ? date.getUTCMonth() + 1 : date.getMonth() + 1;
        const D = utc ? date.getUTCDate() : date.getDate();
        const h = utc ? date.getUTCHours() : date.getHours();
        const m = utc ? date.getUTCMinutes() : date.getMinutes();
        const s = utc ? date.getUTCSeconds() : date.getSeconds();
        const ms = utc ? date.getUTCMilliseconds() : date.getMilliseconds();

        // JavaScript only has milliseconds (3 digits).
        // To reach 9 digits, we zero-pad the remaining 6 (micro/nano) places.
        const fractional9 = pad(ms, 3) + "000000";

        return (
            `${Y}-${pad(M)}-${pad(D)} ` +
            `${pad(h)}:${pad(m)}:${pad(s)}.` +
            `${fractional9}`
        );
    }
    return {
        approveMultiLevel: _approveMultiLevel,
        rejectOrSendBackMultiLevel: _rejectOrSendBackMultiLevel
    };

});