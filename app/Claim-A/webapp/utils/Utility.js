
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "claima/utils/Constants"
], function (Filter, FilterOperator, Sorter, Constants) {
    "use strict";

    return {
        /**
         * Initialize the Utility 
         * @public
         */
        init: function (oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
        },

        /* =========================================================
        * Update Status
        * ======================================================= */

        async _updateStatus(oModel, sID, sStatus) {
            let sSubmission_type = sID.substring(0, 3);

            let sHeaderTablePath = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.Entities.ZREQUEST_HEADER : Constants.Entities.ZCLAIM_HEADER;
            let sField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

            // Declare field for status
            // REQ uses STATUS field while CLM uses STATUS_ID field
            let sStatusField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.STATUS : Constants.EntitiesFields.CLAIM_STATUS;

            const oListBinding = oModel.bindList(sHeaderTablePath, null, null,
                [
                    // new sap.ui.model.Filter({ path: "EMP_ID", operator: sap.ui.model.FilterOperator.EQ, value1: empId }),
                    new Filter({ path: sField, operator: sap.ui.model.FilterOperator.EQ, value1: sID })
                ],
                {
                    $$ownRequest: true,
                    $$groupId: "$auto",
                    $$updateGroupId: "$auto"
                }
            );

            const aCtx = await oListBinding.requestContexts(0, 1);
            const oCtx = aCtx[0];

            if (!oCtx) {
                throw new Error("Record not found.");
            }
            oCtx.setProperty(sStatusField, sStatus);

            await oModel.submitBatch("$auto");
        },
        /**
         * Gets text from the resource bundle.
         * @public
         * @param {string} sKey name of the resource
         * @param {string[]} aArgs Array of strings, variables for dynamic content
         * @returns {string} the text
         */
        getText: function (sKey, aArgs) {
            return this._oOwnerComponent.getModel("i18n").getResourceBundle().getText(sKey, aArgs);
        },

        async _updateSubmittedDate(oModel, sID) {
            let sSubmission_type = sID.substring(0, 3);

            let sHeaderTablePath = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.Entities.ZREQUEST_HEADER : Constants.Entities.ZCLAIM_HEADER;
            let sField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

            const oListBinding = oModel.bindList(sHeaderTablePath, null, null,
                [
                    new Filter({ path: sField, operator: sap.ui.model.FilterOperator.EQ, value1: sID })
                ],
                {
                    $$ownRequest: true,
                    $$groupId: "$auto",
                    $$updateGroupId: "$auto"
                }
            );

            const aCtx = await oListBinding.requestContexts(0, 1);
            const oCtx = aCtx[0];

            if (!oCtx) {
                throw new Error("Record not found.");
            }
            oCtx.setProperty(Constants.EntitiesFields.SUBMITTED_DATE, new Date().toISOString().slice(0, 10));

            await oModel.submitBatch("$auto");
        },

        updateFooterState: function ({
            oView,
            oClaimModel,
            oConstants,
            sMode
        }) {
            if (!oView || !oClaimModel || !oConstants) return;

            const sStatusId = oClaimModel.getProperty("/claim_header/status_id");

            const oButtons = {
                oBtnReject: oView.byId("button_claimapprover_reject"),
                oBtnBackToEmp: oView.byId("button_claimapprover_pushback"),
                oBtnApprove: oView.byId("button_claimapprover_approve"),

                oBtnSaveDraft: oView.byId("button_claimsubmission_savedraft"),
                oBtnDeleteReport: oView.byId("button_claimsubmission_deletereport"),
                oBtnSubmitReport: oView.byId("button_claimsubmission_submitreport"),
                oBtnBack: oView.byId("button_claimsubmission_back"),

                oBtnDetailSave: oView.byId("button_claimdetails_input_save"),
                oBtnDetailCancel: oView.byId("button_claimdetails_input_cancel")
            };

            Object.values(oButtons).forEach(oButton => oButton?.setVisible(false));

            const oModeButtons = {
                SUMMARY: ["oBtnSaveDraft", "oBtnDeleteReport", "oBtnSubmitReport", "oBtnBack"],
                DETAILS: ["oBtnDetailSave", "oBtnDetailCancel"],
                APPROVER: ["oBtnReject", "oBtnBackToEmp", "oBtnApprove", "oBtnBack"],
                VIEW_ONLY: ["oBtnBack"]
            };

            const aVisibleKeys = oModeButtons[sMode] || [];
            aVisibleKeys.forEach(sButtonKey => {
                oButtons[sButtonKey]?.setVisible(true);
            });

            const bIsFinalStatus =
                sStatusId === oConstants.ClaimStatus.CANCELLED ||
                sStatusId === oConstants.ClaimStatus.PENDING_APPROVAL ||
                sStatusId === oConstants.ClaimStatus.APPROVED ||
                sStatusId === oConstants.ClaimStatus.COMPLETED_DISBURSEMENT;

            if (bIsFinalStatus) {
                if (sMode === "APPROVER" && sStatusId === oConstants.ClaimStatus.APPROVED) {
                    oButtons.oBtnReject?.setVisible(false);
                    oButtons.oBtnBackToEmp?.setVisible(false);
                    oButtons.oBtnApprove?.setVisible(false);
                }

                oButtons.oBtnSaveDraft?.setEnabled(false);
                oButtons.oBtnDeleteReport?.setEnabled(false);
                oButtons.oBtnSubmitReport?.setEnabled(false);

            } else {

                oButtons.oBtnSaveDraft?.setEnabled(true);
                oButtons.oBtnDeleteReport?.setEnabled(true);

                const bAllowSubmit =
                    sStatusId === oConstants.ClaimStatus.DRAFT ||
                    sStatusId === oConstants.ClaimStatus.SEND_BACK;

                oButtons.oBtnSubmitReport?.setEnabled(bAllowSubmit);
            }
        }

    };
});