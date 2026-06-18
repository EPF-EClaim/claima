sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"claima/utils/Constants",
], function (Filter, FilterOperator, Sorter, Constants) {
    "use strict";

    return {

		/* =========================================================
		* Approval Log Fragment
		* ======================================================= */

		async _showApprovalLog(oController) {
			const oPage = oController.byId("request_form");
			if (!oPage) return;

			const oCreate = await oController._getFormFragment("approval_log");
			await oController._replaceContentAt(oPage, 2, oCreate);
		},
		
		/* =========================================================
		* Get List from Backend
		* ======================================================= */

		async getApproverList(oApprovalLogModel, oViewModel, sId, sClaimTypeID) {

            let submission_type = sId.substring(0,3);
            let oListBinding;

            if (submission_type == "REQ") {
                oListBinding = oViewModel.bindList("/ZEMP_APPROVER_REQUEST_DETAILS", undefined,
                    null,[new Filter("PREAPPROVAL_ID", "EQ", sId)],
                    {
                        $$ownRequest: true,
                        $$groupId: "$auto",
                        $$updateGroupId: "$auto"
                    }
                );
            } else if (submission_type == "CLM") {
                oListBinding = oViewModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
                    null,[new Filter("CLAIM_ID", "EQ", sId)],
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
				if(submission_type == Constants.WorkflowType.CLAIM){
					if(sClaimTypeID == Constants.ClaimType.ELAUN_PINDAH || sClaimTypeID == Constants.ClaimType.WILAYAH_ASAL){
						a[0].LEVEL = Constants.SpecialApprover.VERIFIER
					}
				}

				oApprovalLogModel.setProperty("/approval", a);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oApprovalLogModel.setProperty("/approval", []);
				return [];
			}
		}
	}
});