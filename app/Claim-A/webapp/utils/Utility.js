sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {

		/* =========================================================
		* Update Status
		* ======================================================= */

		async _updateStatus(oModel, sId, sStatus) {
            let sSubmission_type = sId.substring(0,3);
            
            let sTable = sSubmission_type === 'REQ' ? '/ZREQUEST_HEADER' : "/ZCLAIM_HEADER";
            let sField = sSubmission_type === 'REQ' ? 'REQUEST_ID' : 'CLAIM_ID';


            const oListBinding = oModel.bindList(sTable, null,null,
                [
                    new Filter({ path: sField, operator: sap.ui.model.FilterOperator.EQ, value1: sId })
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

            oCtx.setProperty("STATUS", sStatus);

            await oModel.submitBatch("$auto");
        },

        getResourceBundle: function (oController) {
            return oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        getText: function (oController, sKey, aArgs) {
            return this.getResourceBundle(oController).getText(sKey, aArgs);
        }

    };
});