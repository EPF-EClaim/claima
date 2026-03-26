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

    async function _approveMultiLevel(oModel, sId, sUserId, sComment, oModelView, oController) {

        const sSubmissionType = sId.substring(0, 3);

        const sTable = sSubmissionType === Constants.ApprovalProcess.REQUEST
            ? Constants.Entities.ZAPPROVER_DETAILS_PREAPPROVAL
            : Constants.Entities.ZAPPROVER_DETAILS_CLAIMS

        const sField = sSubmissionType === Constants.ApprovalProcess.REQUEST ? Constants.EntitiesFields.PREAPPROVALID : Constants.EntitiesFields.CLAIMID;
        const sType = sSubmissionType === Constants.ApprovalProcess.REQUEST ? Constants.ApprovalProcess.REQUESTTYPE : Constants.ApprovalProcess.CLAIMTYPE;

        const sTable2 = sSubmissionType === Constants.ApprovalProcess.REQUEST
            ? Constants.Entities.ZEMP_APPROVER_REQUEST_DETAILS
            : Constants.Entities.ZEMP_APPROVER_CLAIM_DETAILS;

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
            throw { sCode: Utility.getText(oController, "error_not_current_processor") };
        }

        let sMatchedType = null;
        let sMatchedId = null;

        if (oCurrentRow.APPROVER_ID === sUserId) {
            sMatchedType = Constants.EntitiesFields.APPROVER_ID;
            sMatchedId = oCurrentRow.APPROVER_ID;
        } else {
            sMatchedType = Constants.EntitiesFields.SUBAPPROVER_ID;
            sMatchedId = oCurrentRow.SUBSTITUTE_APPROVER_ID;
        }

        const iCurrentLevel = oCurrentRow.LEVEL;

        // STEP 3: Approve current level
        const oCtxCurrent = aContextList.find(oCtx => oCtx.getObject().LEVEL === iCurrentLevel);

        if (sComment) {
            oCtxCurrent.setProperty(Constants.EntitiesFields.COMMENTAPPOVAL, sComment);
        }

        const sTimestamp = DateUtility.formatTimestamp9(new Date(), { utc: false });

        oCtxCurrent.setProperty(Constants.EntitiesFields.TIMESTAMP, sTimestamp);
        oCtxCurrent.setProperty(Constants.EntitiesFields.STATUS, Constants.ClaimStatus.APPROVED); // APPROVED

        // STEP 4: Activate next level
        const iNextLevel = iCurrentLevel + 1;
        const oCtxNext = aContextList.find(oCtx => oCtx.getObject().LEVEL === iNextLevel);

        if (oCtxNext) {

            oCtxNext.setProperty(Constants.EntitiesFields.STATUS, Constants.ClaimStatus.PENDING_APPROVAL);

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
            const bMatchedAsApprover = (sMatchedType === Constants.EntitiesFields.APPROVER_ID);

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
                    Action: Constants.ApprovalProcessAction.ACTION_NOTIFY,
                    ReceiverEmail: sNextApproverEmail,
                    NextApproverName: sNextApproverName,
                    RejectReason: Constants.ApprovalProcessAction.NOTAVAILABLE,
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
                        Action: Constants.ApprovalProcessAction.ACTION_NOTIFY,
                        ReceiverEmail: sNextSubEmail,
                        NextApproverName: sNextSubName,
                        RejectReason: Constants.ApprovalProcessAction.NOTAVAILABLE,
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
                Action: Constants.ApprovalProcessAction.ACTION_APPROVE,
                ReceiverEmail: sClaimantEmail,
                NextApproverName: sNextApproverDisplayName,
                RejectReason: Constants.ApprovalProcessAction.NOTAVAILABLE,
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

            sCurrentEmail = (sMatchedType === Constants.EntitiesFields.APPROVER_ID)
                ? oCurrentRowView.APPROVER_EMAIL
                : oCurrentRowView.SUBSTITUTE_EMAIL;

            sCurrentName = (sMatchedType === Constants.EntitiesFields.APPROVER_ID)
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
                Action: Constants.ApprovalProcessAction.ACTION_APPROVE,
                ReceiverEmail: sClaimantEmail
            };

            FinalApproveStep.onFinalApprove(oController, oModel, sId, Constants.ClaimStatus.APPROVED, oModelView, oFinalPayload);
        }

        await oModel.submitBatch("$auto");
        var sMessage = Utility.getText(oController, "approval_successful")

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
            sMessageKey: sMessage
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
        oModelView,
        oController
    ) {
        const sSubmissionType = sId.substring(0, 3);
        const bIsPre = sSubmissionType === Constants.ApprovalProcess.REQUEST;

        const sDetailsSet = bIsPre ? Constants.Entities.ZAPPROVER_DETAILS_PREAPPROVAL : Constants.Entities.ZAPPROVER_DETAILS_CLAIMS;
        const sHeaderSet = bIsPre ? Constants.Entities.ZREQUEST_HEADER : Constants.Entities.ZCLAIM_HEADER;
        const sDetailsIdField = bIsPre ? Constants.EntitiesFields.PREAPPROVALID : Constants.EntitiesFields.CLAIMID;
        const sHeaderIdField = bIsPre ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

        const sActionText = sActionStatus === Constants.ClaimStatus.REJECTED ? Constants.ApprovalProcessStatus.STATUS_REJECT : Constants.ApprovalProcessStatus.STATUS_SENDBACK;
        const sType = bIsPre ? Constants.ApprovalProcess.REQUESTTYPE : Constants.ApprovalProcess.CLAIMTYPE;

        const sApproverViewTbl = bIsPre
            ? Constants.Entities.ZEMP_APPROVER_REQUEST_DETAILS
            : Constants.Entities.ZEMP_APPROVER_CLAIM_DETAILS;

        const sBudgetViewTbl = bIsPre
            ? Constants.Entities.ZEMP_REQUEST_BUDGET_CHECK
            : Constants.Entities.ZEMP_CLAIM_BUDGET_CHECK;

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
            throw { sCode: Utility.getText(oController, "error_not_current_processor") };
        }

        let sMatchedType = null;
        let sMatchedApproverId = null;

        if (oCurrentRow.APPROVER_ID === sUserId) {
            sMatchedType = Constants.EntitiesFields.APPROVER_ID;
            sMatchedApproverId = oCurrentRow.APPROVER_ID;
        } else {
            sMatchedType = Constants.EntitiesFields.SUBAPPROVER_ID;
            sMatchedApproverId = oCurrentRow.SUBSTITUTE_APPROVER_ID;
        }

        const iCurrentLevel = oCurrentRow.LEVEL;

        const oCtxCurrent = aCtxApprovers.find(
            oCtx => oCtx.getObject().LEVEL === iCurrentLevel
        );

        if (sComment) oCtxCurrent.setProperty(Constants.EntitiesFields.COMMENTAPPOVAL, sComment);

        const sTimestamp = DateUtility.formatTimestamp9(new Date(), { utc: false });

        oCtxCurrent.setProperty(Constants.EntitiesFields.TIMESTAMP, sTimestamp);
        if (sReason) oCtxCurrent.setProperty(Constants.EntitiesFields.REJECT_REASON_ID, sReason);
        oCtxCurrent.setProperty(Constants.EntitiesFields.STATUS, sActionStatus);

        // Sean confirmed that after REJECTED and SEND BACK status, Higher level approvers will have blank status

        const oBindingHeader = oModel.bindList(
            sHeaderSet,
            null,
            null,
            [new sap.ui.model.Filter(sHeaderIdField, sap.ui.model.FilterOperator.EQ, sId)],
            { $$ownRequest: true, $$updateGroupId: sUpdateGroupId }
        );

        const [oCtxHeader] = await oBindingHeader.requestContexts(0, 1);

        if (oCtxHeader) {
            const sHeaderStatusField = bIsPre ? Constants.EntitiesFields.STATUS : Constants.EntitiesFields.CLAIM_STATUS;
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
                project_code: Constants.ApprovalProcessProjectCode.PROJ_CODE1,
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

        if (sMatchedType === Constants.EntitiesFields.APPROVER_ID) {
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
            NextApproverName: Constants.ApprovalProcessAction.NOTAVAILABLE,
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
                        ? Utility.getText(oController, "request_rejected")
                        : Utility.getText(oController, "request_sent_back")

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