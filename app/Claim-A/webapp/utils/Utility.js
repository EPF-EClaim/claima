
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

        //New logic for Duplication check;

        async CheckDuplicateClaimItem(oController, oItem) {

            const oModel = oController.getOwnerComponent().getModel(); // OData V4
            const empId = oItem.emp_id;

            if (!empId) return false;

            const filters = [];


            const rawDate = oItem.receipt_date || oItem.bill_date;
            if (!rawDate) return false;

            const d = new Date(rawDate);
            if (isNaN(d)) return false;   // skip bad dates

            const currentYear = d.getFullYear();
            const startDate = `${currentYear - 1}-01-01`;
            const endDate = `${currentYear}-12-31`;
            if (oItem.receipt_number && oItem.receipt_date) {
                filters.push(new sap.ui.model.Filter({
                    and: true,
                    filters: [
                        new sap.ui.model.Filter("EMP_ID", sap.ui.model.FilterOperator.EQ, empId),
                        new sap.ui.model.Filter("RECEIPT_NUMBER", sap.ui.model.FilterOperator.EQ, oItem.receipt_number),
                        new sap.ui.model.Filter("RECEIPT_DATE", FilterOperator.EQ, oItem.receipt_date),
                        new sap.ui.model.Filter("RECEIPT_DATE", sap.ui.model.FilterOperator.BT, startDate, endDate)
                    ]
                }));
            }

            if (oItem.bill_no && oItem.bill_date) {
                filters.push(new sap.ui.model.Filter({
                    and: true,
                    filters: [
                        new sap.ui.model.Filter("EMP_ID", sap.ui.model.FilterOperator.EQ, empId),
                        new sap.ui.model.Filter("BILL_NO", sap.ui.model.FilterOperator.EQ, oItem.bill_no),
                        new sap.ui.model.Filter("BILL_DATE", FilterOperator.EQ, oItem.bill_date),
                        new sap.ui.model.Filter("BILL_DATE", sap.ui.model.FilterOperator.BT, startDate, endDate)
                    ]
                }));
            }

            if (filters.length === 0) return false;

            const oListBinding = oModel.bindList("/ZCLAIM_ITEM", null, null, filters, {
                $$ownRequest: true
            });

            const aCtx = await oListBinding.requestContexts(0, Infinity);
            const aResults = aCtx.map(ctx => ctx.getObject());

            if (aResults.length > 0) {
                if (oItem.receipt_number && oItem.receipt_date) {
                    throw new Error("Duplicate record identified: The receipt number and receipt date match an existing entry.");
                }
                if (oItem.bill_no && oItem.bill_date) {
                    throw new Error("Duplicate record identified: The bill number and bill date match an existing entry.");
                }
            }

            return false;
        }
    };
});