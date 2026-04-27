sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"claima/utils/Utility",
	"sap/ui/core/BusyIndicator",
    "claima/utils/Constants"
], function (Filter, FilterOperator, MessageToast, Utility, BusyIndicator, Constant) {
    "use strict";

    return {

		/* =========================================================
		* Budget Checking Helper Functions
		* ======================================================= */

		async _getGLAccount(oModel, sClaimType) {

			const oListBinding = oModel.bindList("/ZCLAIM_TYPE", null, null, [
				new sap.ui.model.Filter("CLAIM_TYPE_ID", "EQ", sClaimType)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData.GL_ACCOUNT;
				} else {
					console.warn(Utility.getText("budget_w_claim_type_not_found"));
					return "";
				}
			} catch (oError) {
				console.error("Error fetching Claim Type detail", oError);
			}
			
		},

		async _getMaterialCode(oModel, sClaimType, sClaimTypeItem) {

			const oListBinding = oModel.bindList("/ZCLAIM_TYPE_ITEM", null, null, [
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimType),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaimTypeItem)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData.MATERIAL_CODE;
				} else {
					console.warn(Utility.getText("budget_w_claim_type_item_not_found"));
					return "";
				}
			} catch (oError) {
				console.error("Error fetching Claim Type Item detail", oError);
			}
			
		},

		/* =========================================================
		* Budget Checking payload generation
		* ======================================================= */

		async backendBudgetChecking (oController, sSubmissionType, sAction = "SUBMIT") {

			switch (sSubmissionType) {
				case Constant.SubmissionTypePrefix.REQUEST:
					var oReqModel	= oController._oReqModel;
					var oHeader		= oReqModel.getProperty('/req_header');
					var aItemRows	= oReqModel.getProperty('/req_item_rows');

					var sDate			= new Date(oHeader.reqdate);
					var sYear			= String(sDate.getFullYear());
					var sFundCenter = (oHeader.altcostcenter && oHeader.altcostcenter !== "-") 
										? oHeader.altcostcenter.split(" - ")[0]
										: oHeader.costcenter.split(" - ")[0];
					var sInternalCode	= oHeader.projectcode || Constant.Default.PROJECT_CODE;	// todo change to NA after flush db

					var aPayload = aItemRows.map(row => {
						return {
							"YEAR": sYear,
							"INTERNAL_ORDER": sInternalCode,
							"FUND_CENTER": sFundCenter,
							"MATERIAL_GROUP": row.MATERIAL_CODE,
							"COMMITMENT_ITEM": row.GL_ACCOUNT,
							"AMOUNT": parseFloat(row.EST_AMOUNT),
							"CLAIM_TYPE_ITEM": row.CLAIM_TYPE_ITEM_DESC, // to display description 
							"INDICATOR": sSubmissionType,
							"ACTION": sAction
						};
					});
					var oAction	= oController._oDataModel.bindContext("/budgetchecking(...)");
					break;

				case Constant.SubmissionTypePrefix.CLAIM:
					var oClaimModel	= oController.getView().getModel("claimsubmission_input");
					var oHeader		= oClaimModel.getProperty('/claim_header');
					var aItemRows	= oClaimModel.getProperty('/claim_items');

					var sDate			= new Date();
					var sYear			= String(sDate.getFullYear());
					var sFundCenter		= oHeader.alternate_cost_center || oHeader.cost_center;
					var sInternalCode	= oHeader.project_code || "1";	// todo change to NA after flush db
					var sCommitmentItem	= await this._getGLAccount(oController._oModel, oHeader.claim_type_id);

					var aReturn = aItemRows
					.filter(row => row.claim_type_item_id !== oController._oConstant.ClaimTypeItem.CASH_REPAY) 
					.map(async row => {
						return {
							"YEAR": sYear,
							"INTERNAL_ORDER": sInternalCode,
							"FUND_CENTER": sFundCenter,
							"MATERIAL_GROUP": await this._getMaterialCode(oController._oModel, oHeader.claim_type_id, row.claim_type_item_id),
							"COMMITMENT_ITEM": sCommitmentItem,
							"AMOUNT": parseFloat(row.amount),
							"CLAIM_TYPE_ITEM": row.descr.claim_type_item_id, // to display description 
							"INDICATOR": sSubmissionType,
							"ACTION": sAction
						};
					});

					var aPayload = await Promise.all(aReturn);
					var oAction	= oController._oModel.bindContext("/budgetchecking(...)");
					break;
			
				default:
					break;
			}

			// const aPayload = await this._generateBudgetCheckPayload(oController, oHeader, aItemRows, sSubmissionType, sAction);

			oAction.setParameter("budget", aPayload);

			try {
				BusyIndicator.show(0); 
				await oAction.execute();
				const oResponse = oAction.getBoundContext().getObject();
				const aResults = oResponse.value[0].results;
				return aResults;
			} catch (err) {
				console.error("Budget check failed", err);
				return false;
			}
		},

		budgetCheckHandling (aResult) {
			const aItems = aResult || [];
			const aFailedClaimTypes = [];

			aItems.forEach((oRequestItem) => {
				if (
					oRequestItem.STATUS !== Constant.BudgetCheckStatus.SUFFICIENT && 
					oRequestItem.STATUS !== Constant.BudgetCheckStatus.UPDATED
				) {
					aFailedClaimTypes.push(oRequestItem.CLAIM_TYPE_ITEM);
				}
			});

			return {
				bCanProceed: aFailedClaimTypes.length === 0,
				aClaimTypeItem: aFailedClaimTypes 
			};
		}

    };
});