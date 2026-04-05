
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
        init: function(oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
        },

        /* =========================================================
        * Update Status
        * ======================================================= */

        async _updateStatus(oModel, sID, sStatus) {
            let sSubmission_type = sID.substring(0,3);

            let sHeaderTablePath = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.Entities.ZREQUEST_HEADER : Constants.Entities.ZCLAIM_HEADER;
            let sField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

            // Declare field for status
            // REQ uses STATUS field while CLM uses STATUS_ID field
            let sStatusField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.STATUS : Constants.EntitiesFields.CLAIM_STATUS;

            const oListBinding = oModel.bindList(sHeaderTablePath, null,null,
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

            const oListBinding = oModel.bindList(sHeaderTablePath, null,null,
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

    };
});