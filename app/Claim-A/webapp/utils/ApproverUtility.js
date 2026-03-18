// claima/utils/ApprovalFlow.js
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./FinalApproveStep",
    "claima/utils/FinalApproveStep"
], function (Filter, FilterOperator, FinalApproveStep) {
    "use strict";

    async function _approveMultiLevel(oModel, id, userID, comment, oModel2) {


        const submissionType = id.substring(0, 3);
        const sTable = submissionType === "REQ"
            ? "/ZAPPROVER_DETAILS_PREAPPROVAL"
            : "/ZAPPROVER_DETAILS_CLAIMS";
        const sField = submissionType === "REQ" ? "PREAPPROVAL_ID" : "CLAIM_ID";
        const sType = submissionType === "REQ" ? "Pre-Approval" : "Claim";

        //Added for view;
        const sTable2 = submissionType === "REQ"
            ? "/ZEMP_APPROVER_REQUEST_DETAILS"
            : "/ZEMP_APPROVER_CLAIM_DETAILS";

        let payloads = [];
        let currentEmail = null;
        let currentName = null;

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


        let matchedType = null;
        let matchedID = null;

        if (currentRow.APPROVER_ID === userID) {
            matchedType = "APPROVER_ID";
            matchedID = currentRow.APPROVER_ID;
        } else if (currentRow.SUBSTITUTE_APPROVER_ID === userID) {
            matchedType = "SUBSTITUTE_APPROVER_ID";
            matchedID = currentRow.SUBSTITUTE_APPROVER_ID;
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
            // STEP 5: Fetch data for Email
            const bindingView = oModel2.bindList(
                sTable2,
                null,
                null,
                [new Filter(sField, FilterOperator.EQ, id)],
                {
                    $$ownRequest: true
                }
            );

            const aCtx_binding = await bindingView.requestContexts(0, Infinity);
            const rows_binding = aCtx_binding.map(ctx => ctx.getObject());

            const currentRow_level = rows_binding.find(r =>
                Number(r.LEVEL) === Number(currentLevel)
            );

            if (matchedType === "APPROVER_ID") {
                currentEmail = currentRow_level.APPROVER_EMAIL;
                currentName = currentRow_level.APPROVER_NAME;
            } else {
                currentEmail = currentRow_level.SUBSTITUTE_EMAIL;
                currentName = currentRow_level.SUBSTITUTE_NAME;
            }

            const nextRow_level = rows_binding.find(r =>
                Number(r.LEVEL) === Number(nextLevel)
            );

            let nextApproverName = nextRow_level?.APPROVER_NAME || null;
            let nextApproverEmail = nextRow_level?.APPROVER_EMAIL || null;
            let nextSubName = nextRow_level?.SUBSTITUTE_NAME || null;
            let nextSubEmail = nextRow_level?.SUBSTITUTE_EMAIL || null;

            const isPre = submissionType === "REQ";

            const submissionDate =
                isPre
                    ? (currentRow_level?.REQUEST_DATE ?? null)      // Pre‑Approval tables
                    : (currentRow_level?.SUBMITTED_DATE ?? null);   // Claim tables

            //const submissionDate = currentRow_level?.REQUEST_DATE ?? null;
            const claimantName = currentRow_level?.EMPLOYEE_NAME ?? null;
            const claimantEmail = currentRow_level?.EMPLOYEE_EMAIL ?? null;


            const isPresent = v => typeof v === "string" ? v.trim().length > 0 : !!v;
            const nextApproverDisplayName = nextApproverName || nextSubName;

            //Email to Next Approver

            if (ctxNext && isPresent(nextApproverName) && isPresent(nextApproverEmail)) {
                payloads.push({
                    ApproverName: currentName,
                    SubmissionDate: submissionDate,
                    ClaimantName: claimantName,
                    ClaimType: sType,
                    ClaimID: id,
                    RecipientName: nextApproverName,
                    Action: "Notify",
                    ReceiverEmail: nextApproverEmail,
                    NextApproverName: nextApproverName,
                    RejectReason: "N/A",
                    ApproverComments: comment
                });

                if (isPresent(nextSubName) && isPresent(nextSubEmail)) {
                    payloads.push({
                        ApproverName: currentName,
                        SubmissionDate: submissionDate,
                        ClaimantName: claimantName,
                        ClaimType: sType,
                        ClaimID: id,
                        RecipientName: nextSubName,
                        Action: "Notify",
                        ReceiverEmail: nextSubEmail,
                        NextApproverName: nextSubName,
                        RejectReason: "N/A",
                        ApproverComments: comment
                    });
                }
            }

            //Email to Claimant
            payloads.push({
                ApproverName: currentName,
                SubmissionDate: todayYMD(),
                ClaimantName: claimantName,
                ClaimType: sType,
                ClaimID: id,
                RecipientName: claimantName,
                Action: "APPROVE",
                ReceiverEmail: claimantEmail,
                NextApproverName: nextApproverDisplayName,
                RejectReason: "N/A",
                ApproverComments: comment
            });

        } else {
            //Farisha's part start 
            // Get Approver Details
            /*            const oApprList = oModel.bindList(
                           "/ZEMP_MASTER",
                           null,
                           null,
                           [new Filter("EEID", FilterOperator.EQ, aApprEmpID[0])],
                           { $$ownRequest: true }
                       );
           
                       const aApprContexts = await oApprList.requestContexts();
                       const aApprData = aApprContexts.map(oCtx => oCtx.getObject());
           
                       // Get Claimant Details
                       const oClaimantList = oModel.bindList(
                           "/ZEMP_MASTER",
                           null,
                           null,
                           [new Filter("EEID", FilterOperator.EQ, sEmpID)],
                           { $$ownRequest: true }
                       );
           
                       const aClaimantContexts = await oClaimantList.requestContexts();
                       const aClaimantData = aClaimantContexts.map(oCtx => oCtx.getObject());
           
                       const sApproverName = aApprData[0].NAME;
                       const sClaimsSubmissionDate = todayYMD();
                       const sClaimantName = aClaimantData[0].NAME;
                       const sClaimType = aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC;
                       const sClaimID = sClaimID;
                       const sRecipientName = sClaimantName;
                       const sClaimantEmail = aClaimantData[0].EMAIL; */

            const bindingView = oModel2.bindList(
                sTable2,
                null,
                null,
                [new Filter(sField, FilterOperator.EQ, id)],
                {
                    $$ownRequest: true
                }
            );

            const aCtx_binding = await bindingView.requestContexts(0, Infinity);
            const rows_binding = aCtx_binding.map(ctx => ctx.getObject());

            const currentRow_level = rows_binding.find(r =>
                Number(r.LEVEL) === Number(currentLevel)
            );

            if (matchedType === "APPROVER_ID") {
                currentEmail = currentRow_level.APPROVER_EMAIL;
                currentName = currentRow_level.APPROVER_NAME;
            } else {
                currentEmail = currentRow_level.SUBSTITUTE_EMAIL;
                currentName = currentRow_level.SUBSTITUTE_NAME;
            }

            const nextRow_level = rows_binding.find(r =>
                Number(r.LEVEL) === Number(nextLevel)
            );

            let nextApproverName = nextRow_level?.APPROVER_NAME || null;
            let nextApproverEmail = nextRow_level?.APPROVER_EMAIL || null;
            let nextSubName = nextRow_level?.SUBSTITUTE_NAME || null;
            let nextSubEmail = nextRow_level?.SUBSTITUTE_EMAIL || null;

            const isPre = submissionType === "REQ";

            const submissionDate =
                isPre
                    ? (currentRow_level?.REQUEST_DATE ?? null)      // Pre‑Approval tables
                    : (currentRow_level?.SUBMITTED_DATE ?? null);   // Claim tables

            //const submissionDate = currentRow_level?.REQUEST_DATE ?? null;
            const claimantName = currentRow_level?.EMPLOYEE_NAME ?? null;
            const claimantEmail = currentRow_level?.EMPLOYEE_EMAIL ?? null;


            const isPresent = v => typeof v === "string" ? v.trim().length > 0 : !!v;
            const nextApproverDisplayName = nextApproverName || nextSubName;

        
            const oEmailPayload = {
                ApproverName: currentName,
                SubmissionDate: todayYMD(),
                ClaimantName: claimantName,
                ClaimType: sType,
                ClaimID: id,
                RecipientName: claimantName,
                Action: "APPROVE",
                ReceiverEmail: claimantEmail
            };
            //Farisha's part end

            FinalApproveStep.onFinalApprove(oModel2, id, 'STAT05', oModel, oEmailPayload);
        }

        //pending fix for payload creation causing server crash - Vincent


        // STEP 6: Submit batch update
        await oModel.submitBatch("$auto");
        sap.m.MessageToast.show("Approval successful.");

        return {
            payloads,
            info: {
                currentLevel: Number(currentLevel),
                nextLevel: Number(nextLevel),
                type: sType,
                id,
                currentProcessor: { name: currentName, email: currentEmail, matchedType }
            }
        };
    }

    function todayYMD() {
        const d = new Date();
        const pad = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    //For Reject and SendBack resend
    async function _rejectOrSendBackMultiLevel(oModel, id, userID, actionStatus, reason, comment, oModel2) {
        // actionStatus e.g., "STAT04" (rejected) or "STAT03" (send back)
        const updateGroupId = "approvalGroup";
        const submissionType = id.substring(0, 3);
        const isPre = submissionType === "REQ";
        const detailsSet = isPre ? "/ZAPPROVER_DETAILS_PREAPPROVAL" : "/ZAPPROVER_DETAILS_CLAIMS";
        const headerSet = isPre ? "/ZREQUEST_HEADER" : "/ZCLAIM_HEADER";
        const idField = isPre ? "PREAPPROVAL_ID" : "CLAIM_ID";
        const sField_header = submissionType === "REQ" ? "REQUEST_ID" : "CLAIM_ID";
        const sAction = actionStatus === "STAT04" ? "REJECT" : "SEND BACK";
        const sType = submissionType === "REQ" ? "Pre-Approval" : "Claim";
        //Added for view;
        const sTable2 = submissionType === "REQ" ? "/ZEMP_APPROVER_REQUEST_DETAILS" : "/ZEMP_APPROVER_CLAIM_DETAILS";
        const sTable3 = submissionType === "REQ" ? "/ZEMP_REQUEST_BUDGET_CHECK" : "/ZEMP_CLAIM_BUDGET_CHECK";

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

        //Identify approver from 
        let matchedType = null;
        let matchedID = null;

        if (currentRow.APPROVER_ID === userID) {
            matchedType = "APPROVER_ID";
            matchedID = currentRow.APPROVER_ID;
        } else if (currentRow.SUBSTITUTE_APPROVER_ID === userID) {
            matchedType = "SUBSTITUTE_APPROVER_ID";
            matchedID = currentRow.SUBSTITUTE_APPROVER_ID;
        }

        const currentLevel = currentRow.LEVEL;
        const ctxCurrent = aCtx.find(ctx => ctx.getObject().LEVEL === currentLevel);

        // 3) Set action on current row
        if (comment) ctxCurrent.setProperty("COMMENT", comment);

        const now = new Date();
        const tsLocal = formatTimestamp9(now, { utc: false, fractionalDigits: 7 });

        ctxCurrent.setProperty("PROCESS_TIMESTAMP", tsLocal);
        if (reason) ctxCurrent.setProperty("REJECT_REASON_ID", reason);
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

            const headerStatusField = isPre ? "STATUS" : "STATUS_ID";
            hctx.setProperty(headerStatusField, actionStatus); // STAT04/STAT03

        }

        // 6) Release Budget Lock
        const budgetBinding = oModel2.bindList(
            sTable3,
            null,
            null,
            [new sap.ui.model.Filter(sField_header, sap.ui.model.FilterOperator.EQ, id)],
            { $$ownRequest: true }
        );

        const aCtxBudget = await budgetBinding.requestContexts(0, Infinity);
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

        // 7) Get Claimant email details;

        const bindingView = oModel2.bindList(
            sTable2,
            null,
            null,
            [new Filter(idField, FilterOperator.EQ, id)],
            {
                $$ownRequest: true
            }
        );

        const aCtx_binding = await bindingView.requestContexts(0, Infinity);
        const rows_binding = aCtx_binding.map(ctx => ctx.getObject());

        const currentRow_level = rows_binding.find(r =>
            Number(r.LEVEL) === Number(currentLevel)
        );

        let currentEmail = null;
        let currentName = null;

        if (matchedType === "APPROVER_ID") {
            currentEmail = currentRow_level.APPROVER_EMAIL;
            currentName = currentRow_level.APPROVER_NAME;
        } else {
            currentEmail = currentRow_level.SUBSTITUTE_EMAIL;
            currentName = currentRow_level.SUBSTITUTE_NAME;
        }

        const claimantName = currentRow_level?.EMPLOYEE_NAME ?? null;
        const claimantEmail = currentRow_level?.EMPLOYEE_EMAIL ?? null;

        const payloads = [];



        //Email to Next Approver
        payloads.push({
            ApproverName: currentName,
            SubmissionDate: todayYMD(),
            ClaimantName: claimantName,
            ClaimType: sType,
            ClaimID: id,
            RecipientName: claimantName,
            Action: sAction,
            ReceiverEmail: claimantEmail,
            NextApproverName: "N/A",
            RejectReason: reason,
            ApproverComments: comment
        });

        // 8) Submit this group
        // 8) Submit this group
        try {
            await oModel.submitBatch(updateGroupId);

            sap.m.MessageToast.show(
                actionStatus === "STAT04" ? "Request rejected successfully" : "Request sent back successfully"
            );
            return {
                payloads,
                dataset,
                submissionType,
                info: {
                    currentLevel: Number(currentLevel),
                    type: sType,
                    id,
                    currentProcessor: { name: currentName, email: currentEmail, matchedType }
                }
            };

        } catch (err) {
            console.error("Approval batch failed, skipping budget processing", err);
            throw err;   // Optionally rethrow to stop further logic
        }
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