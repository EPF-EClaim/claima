sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {

		/* =========================================================
		* Approval Log Fragment
		* ======================================================= */

		async _showApprovalLog(that) {
			const oPage = that.byId("request_form");
			if (!oPage) return;

			const oCreate = await that._getFormFragment("approval_log");
			await that._replaceContentAt(oPage, 2, oCreate);
		},
		
		/* =========================================================
		* Get List from Backend
		* ======================================================= */

		async getApproverList(oReq, oModel, id) {

            let submission_type = id.substring(0,3);
            let oListBinding;

            if (submission_type == "REQ") {
                oListBinding = oModel.bindList("/ZEMP_APPROVER_REQUEST_DETAILS", undefined,
                    null,[new Filter("PREAPPROVAL_ID", "EQ", id)],
                    {
                        $$ownRequest: true,
                        $$groupId: "$auto",
                        $$updateGroupId: "$auto"
                    }
                );
            } else if (submission_type == "CLM") {
                oListBinding = oModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
                    null,[new Filter("CLAIM_ID", "EQ", id)],
                    {
                        $$ownRequest: true,
                        $$groupId: "$auto",
                        $$updateGroupId: "$auto"
                    }
                );
            }

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());
                
				oReq.setProperty("/approval", a);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/approval", []);
				return [];
			}
		}
	}
});