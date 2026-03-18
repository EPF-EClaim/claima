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

		async _updateStatus(oModel, id, status) {
            let submission_type = id.substring(0,3);
            
            let sTable = submission_type === 'REQ' ? '/ZREQUEST_HEADER' : "/ZCLAIM_HEADER";
            let sField = submission_type === 'REQ' ? 'REQUEST_ID' : 'CLAIM_ID';


            const oListBinding = oModel.bindList(sTable, null,null,
                [
                    // new sap.ui.model.Filter({ path: "EMP_ID", operator: sap.ui.model.FilterOperator.EQ, value1: empId }),
                    new sap.ui.model.Filter({ path: sField, operator: sap.ui.model.FilterOperator.EQ, value1: id })
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

            oCtx.setProperty("STATUS", status);

            await oModel.submitBatch("$auto");
            
            sap.m.MessageToast.show("Request submitted successfully");
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        getText: function (sKey, aArgs) {
            return this.getResourceBundle().getText(sKey, aArgs);
        }

    };
});