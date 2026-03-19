// claima/utils/ApprovalFlow.js
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "claima/utils/FinalApproveStep",
    "claima/utils/Constants",
    "claima/utils/Utility",
    "claima/utils/DateUtility",
], function (Filter, FilterOperator, FinalApproveStep, Constants, Utility, DateUtility) {
    "use strict";

    async function _approveMultiLevel(oModel, sId, sUserId, sComment, oModelView) {

        const sSubmissionType = sId.substring(0, 3);

        const sTable = sSubmissionType === Constants.ApprovalProcess.REQUEST
            ? Constants.ApprovalProcess.DETAILS_PREAPPROVAL
            : Constants.ApprovalProcess.DETAILS_CLAIMS

        const sField = sSubmissionType === Constants.ApprovalProcess.REQUEST ? Constants.ApprovalProcess.PREAPPROVALID : Constants.ApprovalProcess.CLAIMID;
        const sType = sSubmissionType === Constants.ApprovalProcess.REQUEST ? Constants.ApprovalProcess.REQUESTTYPE : Constants.ApprovalProcess.CLAIMTYPE;

        const sTable2 = sSubmissionType === Constants.ApprovalProcess.REQUEST
            ? Constants.ApprovalProcess.VIEW_PREAPPROVAL
            : Constants.ApprovalProcess.VIEW_CLAIMS;

        let aPayloads = [];
        let sCurrentEmail = null;
        let sCurrentName = null;
        let sMessageKey = null;

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
            oRow.STATUS === Constants.ClaimStatus.PENDING_APPROVAL
        );


        if (!oCurrentRow) {
            throw { sCode: Constants.ApprovalProcess.ECODE1 };
        }

        let sMatchedType = null;
        let sMatchedId = null;

        if (oCurrentRow.APPROVER_ID === sUserId) {
            sMatchedType = Constants.ApprovalProcess.APPROVER_ID;
            sMatchedId = oCurrentRow.APPROVER_ID;
        } else {
            sMatchedType = Constants.ApprovalProcess.SUBAPPROVER_ID;
            sMatchedId = oCurrentRow.SUBSTITUTE_APPROVER_ID;
        }

        const iCurrentLevel = oCurrentRow.LEVEL;

        // STEP 3: Approve current level
        const oCtxCurrent = aContextList.find(oCtx => oCtx.getObject().LEVEL === iCurrentLevel);

        if (sComment) {
            oCtxCurrent.setProperty(Constants.ApprovalProcess.COMMENTAPPOVAL, sComment);
        }

        const sTimestamp = DateUtility.formatTimestamp9(new Date(), { utc: false });

        oCtxCurrent.setProperty(Constants.ApprovalProcess.TIMESTAMP, sTimestamp);
        oCtxCurrent.setProperty(Constants.ApprovalProcess.STATUS, Constants.ClaimStatus.APPROVED); // APPROVED

        // STEP 4: Activate next level
        const iNextLevel = iCurrentLevel + 1;
        const oCtxNext = aContextList.find(oCtx => oCtx.getObject().LEVEL === iNextLevel);

        if (oCtxNext) {

            oCtxNext.setProperty(Constants.ApprovalProcess.STATUS, Constants.ClaimStatus.PENDING_APPROVAL);

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
            const bMatchedAsApprover = (sMatchedType === Constants.ApprovalProcess.APPROVER_ID);

            sCurrentEmail = bMatchedAsApprover ? oCurrentRowView.APPROVER_EMAIL : oCurrentRowView.SUBSTITUTE_EMAIL;
            sCurrentName = bMatchedAsApprover ? oCurrentRowView.APPROVER_NAME : oCurrentRowView.SUBSTITUTE_NAME;

            const oNextRowView = aRowView.find(oRow => Number(oRow.LEVEL) === Number(iNextLevel));

            const sNextApproverName = oNextRowView?.APPROVER_NAME ?? null;
            const sNextApproverEmail = oNextRowView?.APPROVER_EMAIL ?? null;
            const sNextSubName = oNextRowView?.SUBSTITUTE_NAME ?? null;
            const sNextSubEmail = oNextRowView?.SUBSTITUTE_EMAIL ?? null;

            const sCheckFormDate = (sSubmissionType === Constants.ApprovalProcess.REQUEST);

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
                    Action: Constants.ApprovalProcess.ACTION_NOTIFY,
                    ReceiverEmail: sNextApproverEmail,
                    NextApproverName: sNextApproverName,
                    RejectReason: Constants.ApprovalProcess.NOTAVAILABLE,
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
                        Action: Constants.ApprovalProcess.ACTION_NOTIFY,
                        ReceiverEmail: sNextSubEmail,
                        NextApproverName: sNextSubName,
                        RejectReason: Constants.ApprovalProcess.NOTAVAILABLE,
                        ApproverComments: sComment
                    });
                }
            }

            // Email: Claimant
            aPayloads.push({
                ApproverName: sCurrentName,
                SubmissionDate: DateUtility.toYMD(new Date()),
                ClaimantName: sClaimantName,
                ClaimType: sType,
                ClaimID: sId,
                RecipientName: sClaimantName,
                Action: Constants.ApprovalProcess.ACTION_APPROVE,
                ReceiverEmail: sClaimantEmail,
                NextApproverName: sNextApproverDisplayName,
                RejectReason: Constants.ApprovalProcess.NOTAVAILABLE,
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

            sCurrentEmail = (sMatchedType === Constants.ApprovalProcess.APPROVER_ID)
                ? oCurrentRowView.APPROVER_EMAIL
                : oCurrentRowView.SUBSTITUTE_EMAIL;

            sCurrentName = (sMatchedType === Constants.ApprovalProcess.APPROVER_ID)
                ? oCurrentRowView.APPROVER_NAME
                : oCurrentRowView.SUBSTITUTE_NAME;

            const sClaimantName = oCurrentRowView?.EMPLOYEE_NAME ?? null;
            const sClaimantEmail = oCurrentRowView?.EMPLOYEE_EMAIL ?? null;

            const oFinalPayload = {
                ApproverName: sCurrentName,
                SubmissionDate: DateUtility.toYMD(new Date()),
                ClaimantName: sClaimantName,
                ClaimType: sType,
                ClaimID: sId,
                RecipientName: sClaimantName,
                Action: Constants.ApprovalProcess.ACTION_APPROVE,
                ReceiverEmail: sClaimantEmail
            };

            FinalApproveStep.onFinalApprove(oModelView, sId, Constants.ClaimStatus.APPROVED, oModel, oFinalPayload);
        }

        await oModel.submitBatch("$auto");

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

            },
            sMessageKey: Constants.ApprovalProcess.APPROVE_SUCCESS
        };
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
        const bIsPre = sSubmissionType === Constants.ApprovalProcess.REQUEST;

        const sDetailsSet = bIsPre ? Constants.ApprovalProcess.DETAILS_PREAPPROVAL : Constants.ApprovalProcess.DETAILS_CLAIMS;
        const sHeaderSet = bIsPre ? Constants.ApprovalProcess.REQUEST_HEADER : Constants.ApprovalProcess.CLAIM_HEADER;
        const sDetailsIdField = bIsPre ? Constants.ApprovalProcess.PREAPPROVALID : Constants.ApprovalProcess.CLAIMID;
        const sHeaderIdField = bIsPre ? Constants.ApprovalProcess.REQUESTID : Constants.ApprovalProcess.CLAIMID;

        const sActionText = sActionStatus === Constants.ClaimStatus.REJECTED ? Constants.ApprovalProcess.STATUS_REJECT : Constants.ApprovalProcess.STATUS_SENDBACK;
        const sType = bIsPre ? Constants.ApprovalProcess.REQUESTTYPE : Constants.ApprovalProcess.CLAIMTYPE;

        const sApproverViewTbl = bIsPre
            ? Constants.ApprovalProcess.VIEW_PREAPPROVAL
            : Constants.ApprovalProcess.VIEW_CLAIMS;

        const sBudgetViewTbl = bIsPre
            ? Constants.ApprovalProcess.VIEW_BUDGET_REQUEST
            : Constants.ApprovalProcess.VIEW_BUDGET_CLAIM;

        const sUpdateGroupId = Constants.ApprovalProcess.SET_GROUP;

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
            oRow.STATUS === Constants.ClaimStatus.PENDING_APPROVAL
        );

        if (!oCurrentRow) {
            throw { sCode: Constants.ApprovalProcess.ECODE1 };
        }

        let sMatchedType = null;
        let sMatchedApproverId = null;

        if (oCurrentRow.APPROVER_ID === sUserId) {
            sMatchedType = Constants.ApprovalProcess.APPROVER_ID;
            sMatchedApproverId = oCurrentRow.APPROVER_ID;
        } else {
            sMatchedType = Constants.ApprovalProcess.SUBAPPROVER_ID;
            sMatchedApproverId = oCurrentRow.SUBSTITUTE_APPROVER_ID;
        }

        const iCurrentLevel = oCurrentRow.LEVEL;

        const oCtxCurrent = aCtxApprovers.find(
            oCtx => oCtx.getObject().LEVEL === iCurrentLevel
        );

        if (sComment) oCtxCurrent.setProperty(Constants.ApprovalProcess.COMMENTAPPOVAL, sComment);

        const sTimestamp = DateUtility.formatTimestamp9(new Date(), { utc: false });

        oCtxCurrent.setProperty(Constants.ApprovalProcess.TIMESTAMP, sTimestamp);
        if (sReason) oCtxCurrent.setProperty(Constants.ApprovalProcess.REJECT_REASON_ID, sReason);
        oCtxCurrent.setProperty(Constants.ApprovalProcess.STATUS, sActionStatus);

        aCtxApprovers.forEach(oCtx => {
            const oRow = oCtx.getObject();
            if (oRow.LEVEL > iCurrentLevel) {
                oCtx.setProperty(Constants.ApprovalProcess.STATUS, Constants.ClaimStatus.COMPLETED_DISBURSEMENT);
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
            const sHeaderStatusField = bIsPre ? Constants.ApprovalProcess.STATUS : Constants.ApprovalProcess.CLAIM_STATUS;
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
                project_code: Constants.ApprovalProcess.PROJ_CODE1,
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

        if (sMatchedType === Constants.ApprovalProcess.APPROVER_ID) {
            sCurrentEmail = oCurrentRowView.APPROVER_EMAIL;
            sCurrentName = oCurrentRowView.APPROVER_NAME;
        } else {
            sCurrentEmail = oCurrentRowView.SUBSTITUTE_EMAIL;
            sCurrentName = oCurrentRowView.SUBSTITUTE_NAME;
        }

        const sClaimantName = oCurrentRowView?.EMPLOYEE_NAME ?? null;
        const sClaimantEmail = oCurrentRowView?.EMPLOYEE_EMAIL ?? null;

        const aPayloads = [];
        const sMessageKey = null;

        aPayloads.push({
            ApproverName: sCurrentName,
            SubmissionDate: DateUtility.toYMD(new Date()),
            ClaimantName: sClaimantName,
            ClaimType: sType,
            ClaimID: sId,
            RecipientName: sClaimantName,
            Action: sActionText,
            ReceiverEmail: sClaimantEmail,
            NextApproverName: Constants.ApprovalProcess.NOTAVAILABLE,
            RejectReason: sReason,
            ApproverComments: sComment
        });
        try {
            await oModel.submitBatch(sUpdateGroupId);

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
                },
                sMessageKey:
                    sActionStatus === Constants.ClaimStatus.REJECTED
                        ? Constants.ApprovalProcess.REJECT_FINAL
                        : Constants.ApprovalProcess.RESEND_FINAL

            };

        } catch (oError) {
            throw oError;
        }
    }

    return {
        approveMultiLevel: _approveMultiLevel,
        rejectOrSendBackMultiLevel: _rejectOrSendBackMultiLevel
    };

});