
sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "claima/utils/Constants"
], function (Filter, FilterOperator, Sorter, JSONModel, Fragment, Constants) {
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
		 * Return marriage category ID based on marital status
		 * @private
         * @param {String} sEmpId - Employee ID
         * @param {String} sMarital - marital status of employee
         * 
         * @param {Integer} iDependents - number of depents under given employee
         * @return {String} - return marriage category ID based on number of dependents
		 */
		_getMarriageCategory: async function (sEmpId, sMarital) {
            // determine marriage category Id
            var sCategoryId = null;
            if (sMarital === Constants.MaritalStatus.SINGLE) {
                sCategoryId = Constants.MarriageCategory.SINGLE;
            }
            else {
                // get number of dependents for non-single employees
                try {
                    // get number of dependents 
                    const oFunctionCount = this._oOwnerComponent.getModel().bindContext("/getEmpDependentCount(...)");

                    oFunctionCount.setParameter("sEmpId", sEmpId);
                    oFunctionCount.setParameter("sRelationship", Constants.DependentType.DEPENDENT);

                    await oFunctionCount.execute();

                    const oContextCount = oFunctionCount.getBoundContext();
                    const iResultCount = oContextCount.getObject("value");

                    // determine marriage category by number of dependents
                    switch (true) {
                        case (iResultCount >= 4):
                            sCategoryId = Constants.MarriageCategory.MARRIED_4_OR_MORE_CHILDREN;
                            break;
                        case (iResultCount >= 1 && iResultCount <= 3):
                            sCategoryId = Constants.MarriageCategory.MARRIED_1_TO_3_CHILDREN;
                            break;
                        case (iResultCount == 0):
                        default:
                            sCategoryId = Constants.MarriageCategory.MARRIED_NO_CHILDREN;
                            break;
                    }
                } catch (oError) {
                    sCategoryId = null;
                }
            }
            return sCategoryId;
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

        openClaimTypeFilterDialog: async function (oController, sModelName, sListPath) {
            var oModel = oController.getView().getModel(sModelName);
            var aList = oModel.getProperty(sListPath) || [];
            var aTypes = [...new Set(aList.map(item => item.CLAIM_TYPE_DESC).filter(Boolean))];

            if (!oController._oFilterDialog) {
                oController._oFilterDialog = await Fragment.load({
                    id: oController.getView().getId(),
                    name: 'claima.fragment.claimtypefilterdialog',
                    controller: oController
                });
                oController.getView().addDependent(oController._oFilterDialog);

                var oFilterModel = new JSONModel({ items: [] });
                oController._oFilterDialog.setModel(oFilterModel, 'filterModel');
            }

            oController._oFilterDialog.getModel('filterModel').setProperty('/items',
                aTypes.map(sType => ({ title: sType }))
            );

            var aSelectedTypes = oController._aActiveClaimTypeFilters || [];
            oController._oFilterDialog.getItems().forEach(oItem => {
                if (aSelectedTypes.includes(oItem.getTitle())) {
                    oItem.setSelected(true);
                }
            });

            oController._oFilterDialog.open();
        },

        confirmClaimTypeFilter: function (oController, sModelName, sListPath, sCountPath, oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var aSelectedTypes = aSelectedItems.map(item => item.getTitle());
            oController._aActiveClaimTypeFilters = aSelectedTypes;

            var oModel = oController.getView().getModel(sModelName);
            var sFullListPath = sListPath + '_full';

            if (!oModel.getProperty(sFullListPath)) {
                oModel.setProperty(sFullListPath, [...oModel.getProperty(sListPath)]);
            }

            var aFullList = oModel.getProperty(sFullListPath);

            var aFiltered = aSelectedTypes.length
                ? aFullList.filter(item => aSelectedTypes.includes(item.CLAIM_TYPE_DESC))
                : aFullList;

            oModel.setProperty(sListPath, aFiltered);
            oModel.setProperty(sCountPath, aFiltered.length);
        },



        /**
         * @public
         * Updates footer buttons based on view mode and claim status.
         *
         * @param {sap.ui.core.mvc.View} oView - The view containing footer buttons.
         * @param {sap.ui.model.Model} oClaimModel - Model providing claim status data.
         * @param {object} oConstants - Constants for claim statuses and footer modes.
         * @param {string} sMode - Footer mode (SUMMARY, DETAILS, APPROVER, VIEW_ONLY).
         * @returns {void} - No return value.
         */

        updateFooterState: function (oView, oClaimModel, oConstants, sMode) {
            if (!oView || !oClaimModel || !oConstants) return;

            const sStatusId = oClaimModel.getProperty("/claim_header/status_id");

            const oButtons = {
                oBtnReject: oView.byId("button_claimapprover_reject"),
                oBtnSendBack: oView.byId("button_claimapprover_pushback"),
                oBtnApprove: oView.byId("button_claimapprover_approve"),

                oBtnSaveDraft: oView.byId("button_claimsubmission_savedraft"),
                oBtnDelete: oView.byId("button_claimsubmission_deletereport"),
                oBtnSubmit: oView.byId("button_claimsubmission_submitreport"),
                oBtnBack: oView.byId("button_claimsubmission_back"),

                oBtnDetailSave: oView.byId("button_claimdetails_input_save"),
                oBtnCancel: oView.byId("button_claimdetails_input_cancel")
            };

            Object.values(oButtons).forEach(oButton => oButton?.setVisible(false));

            const oModeButtons = {
                SUMMARY: ["oBtnSaveDraft", "oBtnDelete", "oBtnSubmit", "oBtnBack"],
                DETAILS: ["oBtnDetailSave", "oBtnCancel"],
                APPROVER: ["oBtnReject", "oBtnSendBack", "oBtnApprove", "oBtnBack"],
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
                if (sMode === oConstants.ClaimFooterMode.APPROVER && sStatusId === oConstants.ClaimStatus.APPROVED) {
                    oButtons.oBtnReject?.setVisible(false);
                    oButtons.oBtnSendBack?.setVisible(false);
                    oButtons.oBtnApprove?.setVisible(false);
                }

                oButtons.oBtnSaveDraft?.setEnabled(false);
                oButtons.oBtnDelete?.setEnabled(false);
                oButtons.oBtnSubmit?.setEnabled(false);

            } else {

                oButtons.oBtnSaveDraft?.setEnabled(true);
                oButtons.oBtnDelete?.setEnabled(true);

                const bAllowSubmit =
                    sStatusId === oConstants.ClaimStatus.DRAFT ||
                    sStatusId === oConstants.ClaimStatus.SEND_BACK;

                oButtons.oBtnSubmit?.setEnabled(bAllowSubmit);
            }
        },
    };
    });