
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
        }

    };
});