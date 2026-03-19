// claima/utils/ApprovalFlow.js
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./FinalApproveStep",
    "claima/utils/FinalApproveStep"
], function (Filter, FilterOperator, FinalApproveStep) {
    "use strict";

    async function _approveMultiLevel(oModel, sId, sUserId, sComment, oModelView) {

        const sSubmissionType = sId.substring(0, 3);

        const sTable = sSubmissionType === "REQ"
            ? "/ZAPPROVER_DETAILS_PREAPPROVAL"
            : "/ZAPPROVER_DETAILS_CLAIMS";

        const sField = sSubmissionType === "REQ" ? "PREAPPROVAL_ID" : "CLAIM_ID";
        const sType = sSubmissionType === "REQ" ? "Pre-Approval" : "Claim";

        const sTable2 = sSubmissionType === "REQ"
            ? "/ZEMP_APPROVER_REQUEST_DETAILS"
            : "/ZEMP_APPROVER_CLAIM_DETAILS";

        let aPayloads = [];
        let sCurrentEmail = null;
        let sCurrentName = null;

        // STEP 1: Get all approver rows
        const oBindingAll = oModel.bindList(
            sTable,
            null,
            null,
            [new Filter(sField, FilterOperator.EQ, sId)],
            { $$ownRequest: true }
        );

        const aContextList = await oBindingAll.requestContexts(0, Infinity);
        const aRows = aContextList.map(oCtx => oCtx.getObject());

        // STEP 2: Find CURRENT approver row
        const oCurrentRow = aRows.find(oRow =>
            (oRow.APPROVER_ID === sUserId || oRow.SUBSTITUTE_APPROVER_ID === sUserId) &&
            oRow.STATUS === "STAT02"
        );

        if (!oCurrentRow) {
            throw new Error("You are not the current processor for this Claim/Pre-approval or it was processed by another Approver.");
        }

        let sMatchedType = null;
        let sMatchedId = null;

        if (oCurrentRow.APPROVER_ID === sUserId) {
            sMatchedType = "APPROVER_ID";
            sMatchedId = oCurrentRow.APPROVER_ID;
        } else {
            sMatchedType = "SUBSTITUTE_APPROVER_ID";
            sMatchedId = oCurrentRow.SUBSTITUTE_APPROVER_ID;
        }

        const iCurrentLevel = oCurrentRow.LEVEL;

        // STEP 3: Approve current level
        const oCtxCurrent = aContextList.find(oCtx => oCtx.getObject().LEVEL === iCurrentLevel);

        if (sComment) {
            oCtxCurrent.setProperty("COMMENT", sComment);
        }

        const oNow = new Date();
        const sTimestamp = formatTimestamp9(oNow, { utc: false });

        oCtxCurrent.setProperty("PROCESS_TIMESTAMP", sTimestamp);
        oCtxCurrent.setProperty("STATUS", "STAT05"); // APPROVED

        // STEP 4: Activate next level
        const iNextLevel = iCurrentLevel + 1;
        const oCtxNext = aContextList.find(oCtx => oCtx.getObject().LEVEL === iNextLevel);

        if (oCtxNext) {

            oCtxNext.setProperty("STATUS", "STAT02");

            // STEP 5: Email Data Model
            const oBindingView = oModelView.bindList(
                sTable2,
                null,
                null,
                [new Filter(sField, FilterOperator.EQ, sId)],
                { $$ownRequest: true }
            );

            const aContextView = await oBindingView.requestContexts(0, Infinity);
            const aRowView = aContextView.map(oCtx => oCtx.getObject());

            const oCurrentRowView = aRowView.find(oRow => Number(oRow.LEVEL) === Number(iCurrentLevel));
            const bMatchedAsApprover = (sMatchedType === "APPROVER_ID");

            sCurrentEmail = bMatchedAsApprover ? oCurrentRowView.APPROVER_EMAIL : oCurrentRowView.SUBSTITUTE_EMAIL;
            sCurrentName = bMatchedAsApprover ? oCurrentRowView.APPROVER_NAME : oCurrentRowView.SUBSTITUTE_NAME;

            const oNextRowView = aRowView.find(oRow => Number(oRow.LEVEL) === Number(iNextLevel));

            const sNextApproverName = oNextRowView?.APPROVER_NAME ?? null;
            const sNextApproverEmail = oNextRowView?.APPROVER_EMAIL ?? null;
            const sNextSubName = oNextRowView?.SUBSTITUTE_NAME ?? null;
            const sNextSubEmail = oNextRowView?.SUBSTITUTE_EMAIL ?? null;

            const sCheckFormDate = (sSubmissionType === "REQ");

            const sSubmissionDate =
                sCheckFormDate
                    ? (oCurrentRowView?.REQUEST_DATE ?? null)
                    : (oCurrentRowView?.SUBMITTED_DATE ?? null);

            const sClaimantName = oCurrentRowView?.EMPLOYEE_NAME ?? null;
            const sClaimantEmail = oCurrentRowView?.EMPLOYEE_EMAIL ?? null;

            const fnIsPresent = v => typeof v === "string" ? v.trim().length > 0 : !!v;
            const sNextApproverDisplayName = sNextApproverName || sNextSubName;

            // Email: Next Approver
            if (oCtxNext && fnIsPresent(sNextApproverName) && fnIsPresent(sNextApproverEmail)) {

                aPayloads.push({
                    ApproverName: sCurrentName,
                    SubmissionDate: sSubmissionDate,
                    ClaimantName: sClaimantName,
                    ClaimType: sType,
                    ClaimID: sId,
                    RecipientName: sNextApproverName,
                    Action: "Notify",
                    ReceiverEmail: sNextApproverEmail,
                    NextApproverName: sNextApproverName,
                    RejectReason: "N/A",
                    ApproverComments: sComment
                });

                if (fnIsPresent(sNextSubName) && fnIsPresent(sNextSubEmail)) {

                    aPayloads.push({
                        ApproverName: sCurrentName,
                        SubmissionDate: sSubmissionDate,
                        ClaimantName: sClaimantName,
                        ClaimType: sType,
                        ClaimID: sId,
                        RecipientName: sNextSubName,
                        Action: "Notify",
                        ReceiverEmail: sNextSubEmail,
                        NextApproverName: sNextSubName,
                        RejectReason: "N/A",
                        ApproverComments: sComment
                    });
                }
            }

            // Email: Claimant
            aPayloads.push({
                ApproverName: sCurrentName,
                SubmissionDate: fnTodayYMD(),
                ClaimantName: sClaimantName,
                ClaimType: sType,
                ClaimID: sId,
                RecipientName: sClaimantName,
                Action: "APPROVE",
                ReceiverEmail: sClaimantEmail,
                NextApproverName: sNextApproverDisplayName,
                RejectReason: "N/A",
                ApproverComments: sComment
            });

        } else {

            const oBindingView = oModelView.bindList(
                sTable2,
                null,
                null,
                [new Filter(sField, FilterOperator.EQ, sId)],
                { $$ownRequest: true }
            );

            const aCtxBinding = await oBindingView.requestContexts(0, Infinity);
            const aRowsBinding = aCtxBinding.map(oCtx => oCtx.getObject());

            const oCurrentRowView = aRowsBinding.find(oRow => Number(oRow.LEVEL) === Number(iCurrentLevel));

            sCurrentEmail = (sMatchedType === "APPROVER_ID")
                ? oCurrentRowView.APPROVER_EMAIL
                : oCurrentRowView.SUBSTITUTE_EMAIL;

            sCurrentName = (sMatchedType === "APPROVER_ID")
                ? oCurrentRowView.APPROVER_NAME
                : oCurrentRowView.SUBSTITUTE_NAME;

            const sClaimantName = oCurrentRowView?.EMPLOYEE_NAME ?? null;
            const sClaimantEmail = oCurrentRowView?.EMPLOYEE_EMAIL ?? null;

            const oFinalPayload = {
                ApproverName: sCurrentName,
                SubmissionDate: fnTodayYMD(),
                ClaimantName: sClaimantName,
                ClaimType: sType,
                ClaimID: sId,
                RecipientName: sClaimantName,
                Action: "APPROVE",
                ReceiverEmail: sClaimantEmail
            };

            FinalApproveStep.onFinalApprove(oModelView, sId, 'STAT05', oModel, oFinalPayload);
        }

        await oModel.submitBatch("$auto");
        sap.m.MessageToast.show("Approval successful.");

        return {
            payloads: aPayloads,
            info: {
                currentLevel: Number(iCurrentLevel),
                nextLevel: Number(iNextLevel),
                type: sType,
                id: sId,
                currentProcessor: {
                    name: sCurrentName,
                    email: sCurrentEmail,
                    matchedType: sMatchedType
                }
            }
        };
    }
    function fnTodayYMD() {
        const d = new Date();
        const pad = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    //For Reject and SendBack resend
    async function _rejectOrSendBackMultiLevel(
        oModel,
        sId,
        sUserId,
        sActionStatus,
        sReason,
        sComment,
        oModelView
    ) {
        const sSubmissionType = sId.substring(0, 3);
        const bIsPre = sSubmissionType === "REQ";

        const sDetailsSet = bIsPre ? "/ZAPPROVER_DETAILS_PREAPPROVAL" : "/ZAPPROVER_DETAILS_CLAIMS";
        const sHeaderSet = bIsPre ? "/ZREQUEST_HEADER" : "/ZCLAIM_HEADER";
        const sDetailsIdField = bIsPre ? "PREAPPROVAL_ID" : "CLAIM_ID";
        const sHeaderIdField = bIsPre ? "REQUEST_ID" : "CLAIM_ID";

        const sActionText = sActionStatus === "STAT04" ? "REJECT" : "SEND BACK";
        const sType = bIsPre ? "Pre-Approval" : "Claim";

        const sApproverViewTbl = bIsPre
            ? "/ZEMP_APPROVER_REQUEST_DETAILS"
            : "/ZEMP_APPROVER_CLAIM_DETAILS";

        const sBudgetViewTbl = bIsPre
            ? "/ZEMP_REQUEST_BUDGET_CHECK"
            : "/ZEMP_CLAIM_BUDGET_CHECK";

        const sUpdateGroupId = "approvalGroup";

        const oBindingApprovers = oModel.bindList(
            sDetailsSet,
            null,
            null,
            [new sap.ui.model.Filter(sDetailsIdField, sap.ui.model.FilterOperator.EQ, sId)],
            { $$ownRequest: true, $$updateGroupId: sUpdateGroupId }
        );

        const aCtxApprovers = await oBindingApprovers.requestContexts(0, Infinity);
        const aApproverRows = aCtxApprovers.map(oCtx => oCtx.getObject());

        const oCurrentRow = aApproverRows.find(oRow =>
            (oRow.APPROVER_ID === sUserId || oRow.SUBSTITUTE_APPROVER_ID === sUserId) &&
            oRow.STATUS === "STAT02"
        );

        if (!oCurrentRow) {
            throw new Error("No pending approval found for this user.");
        }

        let sMatchedType = null;
        let sMatchedApproverId = null;

        if (oCurrentRow.APPROVER_ID === sUserId) {
            sMatchedType = "APPROVER_ID";
            sMatchedApproverId = oCurrentRow.APPROVER_ID;
        } else {
            sMatchedType = "SUBSTITUTE_APPROVER_ID";
            sMatchedApproverId = oCurrentRow.SUBSTITUTE_APPROVER_ID;
        }

        const iCurrentLevel = oCurrentRow.LEVEL;

        const oCtxCurrent = aCtxApprovers.find(
            oCtx => oCtx.getObject().LEVEL === iCurrentLevel
        );

        if (sComment) oCtxCurrent.setProperty("COMMENT", sComment);

        const oNow = new Date();
        const sTimestamp = formatTimestamp9(oNow, { utc: false, fractionalDigits: 7 });

        oCtxCurrent.setProperty("PROCESS_TIMESTAMP", sTimestamp);
        if (sReason) oCtxCurrent.setProperty("REJECT_REASON_ID", sReason);
        oCtxCurrent.setProperty("STATUS", sActionStatus);

        aCtxApprovers.forEach(oCtx => {
            const oRow = oCtx.getObject();
            if (oRow.LEVEL > iCurrentLevel) {
                oCtx.setProperty("STATUS", "STAT06");
            }
        });

        const oBindingHeader = oModel.bindList(
            sHeaderSet,
            null,
            null,
            [new sap.ui.model.Filter(sHeaderIdField, sap.ui.model.FilterOperator.EQ, sId)],
            { $$ownRequest: true, $$updateGroupId: sUpdateGroupId }
        );

        const [oCtxHeader] = await oBindingHeader.requestContexts(0, 1);

        if (oCtxHeader) {
            const sHeaderStatusField = bIsPre ? "STATUS" : "STATUS_ID";
            oCtxHeader.setProperty(sHeaderStatusField, sActionStatus); // STAT04 / STAT03
        }

        const oBindingBudget = oModelView.bindList(
            sBudgetViewTbl,
            null,
            null,
            [new sap.ui.model.Filter(sHeaderIdField, sap.ui.model.FilterOperator.EQ, sId)],
            { $$ownRequest: true }
        );

        const aCtxBudget = await oBindingBudget.requestContexts(0, Infinity);
        const aBudgetRows = aCtxBudget.map(oCtx => oCtx.getObject());

        const aDataset = aBudgetRows.map(oRow => {

            const sYear = bIsPre
                ? (oRow.REQUEST_DATE ? String(oRow.REQUEST_DATE).substring(0, 4) : null)
                : (oRow.SUBMITTED_DATE ? String(oRow.SUBMITTED_DATE).substring(0, 4) : null);

            const bUseAltCC = (oRow.USE_ALT_COST_CENTER === "X" || oRow.ALT_SELECTED === "X");

            const sFundCenter = bUseAltCC
                ? oRow.ALTERNATE_COST_CENTER
                : oRow.COST_CENTER;

            const iAmount = bIsPre
                ? Number(oRow.EST_AMOUNT || 0)
                : Number(oRow.AMOUNT || 0);

            return {
                yyyy: sYear,
                fund_center: sFundCenter,
                commitment_item: oRow.GL_ACCOUNT,
                material_code: oRow.MATERIAL_CODE,
                project_code: "1",
                amount: iAmount
            };
        });

        const oBindingView = oModelView.bindList(
            sApproverViewTbl,
            null,
            null,
            [new sap.ui.model.Filter(sDetailsIdField, sap.ui.model.FilterOperator.EQ, sId)],
            { $$ownRequest: true }
        );

        const aCtxView = await oBindingView.requestContexts(0, Infinity);
        const aRowView = aCtxView.map(oCtx => oCtx.getObject());

        const oCurrentRowView = aRowView.find(oRow =>
            Number(oRow.LEVEL) === Number(iCurrentLevel)
        );

        let sCurrentEmail = null;
        let sCurrentName = null;

        if (sMatchedType === "APPROVER_ID") {
            sCurrentEmail = oCurrentRowView.APPROVER_EMAIL;
            sCurrentName = oCurrentRowView.APPROVER_NAME;
        } else {
            sCurrentEmail = oCurrentRowView.SUBSTITUTE_EMAIL;
            sCurrentName = oCurrentRowView.SUBSTITUTE_NAME;
        }

        const sClaimantName = oCurrentRowView?.EMPLOYEE_NAME ?? null;
        const sClaimantEmail = oCurrentRowView?.EMPLOYEE_EMAIL ?? null;
        
        const aPayloads = [];

        aPayloads.push({
            ApproverName: sCurrentName,
            SubmissionDate: fnTodayYMD(),
            ClaimantName: sClaimantName,
            ClaimType: sType,
            ClaimID: sId,
            RecipientName: sClaimantName,
            Action: sActionText,
            ReceiverEmail: sClaimantEmail,
            NextApproverName: "N/A",
            RejectReason: sReason,
            ApproverComments: sComment
        });
        try {
            await oModel.submitBatch(sUpdateGroupId);

            sap.m.MessageToast.show(
                sActionStatus === "STAT04"
                    ? "Request rejected successfully"
                    : "Request sent back successfully"
            );

            return {
                payloads: aPayloads,
                dataset: aDataset,
                submissionType: sSubmissionType,
                info: {
                    currentLevel: Number(iCurrentLevel),
                    type: sType,
                    id: sId,
                    currentProcessor: {
                        name: sCurrentName,
                        email: sCurrentEmail,
                        matchedType: sMatchedType
                    }
                }
            };

        } catch (oError) {
            throw oError;
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