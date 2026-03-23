
sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"claima/utils/Constants"
], function (Filter, FilterOperator, Sorter, Constants) {
    "use strict";

    return {

		/* =========================================================
		* Update Status
		* ======================================================= */

		async _updateStatus(oModel, sID, sStatus) {
            let sSubmission_type = sID.substring(0,3);
            
            let sTable = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.Entities.ZREQUEST_HEADER : Constants.EntitiesZCLAIM_HEADER;
            let sField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

            // Declare field for status
            // REQ uses STATUS field while CLM uses STATUS_ID field
            let sStatusField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.STATUS : Constants.EntitiesFields.CLAIM_STATUS;
        
            const oListBinding = oModel.bindList(sTable, null,null,
                [
                    // new sap.ui.model.Filter({ path: "EMP_ID", operator: sap.ui.model.FilterOperator.EQ, value1: empId }),
                    new sap.ui.model.Filter({ path: sField, operator: sap.ui.model.FilterOperator.EQ, value1: sID })
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
            
            sap.m.MessageToast.show("Request submitted successfully");
        },

        getResourceBundle: function (oController) {
            return oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        getText: function (oController, sKey, aArgs) {
            return this.getResourceBundle(oController).getText(sKey, aArgs);
        }

    };
});