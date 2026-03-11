sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {

		/* =========================================================
		* Eligibility General Check
		* ======================================================= */

		async _eligibilityCheck(oModel, submission_type, date, proj_code, cost_center, claim_type, rows) {
			
			const sDate = new Date(date);
			const sYYYY = String(sDate.getFullYear());
			const sInternalOrder = String(proj_code);
			const sFundCenter = String(cost_center);

			const aErrors = []; 
			const dataset = [];

			for (const row of rows) {
				const sGLAccount = await this._getGLAccount(oModel, claim_type);
				const sMaterialCode = await this._getMaterialCode(oModel, row.claim_type_item);

				const oListBinding = oModel.bindList("/ZBUDGET", null, null, [
					new Filter("YEAR", "EQ", sYYYY),
					new Filter("INTERNAL_ORDER", "EQ", sInternalOrder),	// Project Code
					new Filter("FUND_CENTER", "EQ", sFundCenter),			// Cost Center
					new Filter("COMMITMENT_ITEM", "EQ", sGLAccount),		// GL Accont
					new Filter("MATERIAL_GROUP", "EQ", sMaterialCode)		// Material Code
				]);

				try {
					const aContexts = await oListBinding.requestContexts(0, 1);

					if (aContexts.length === 0) {
						aErrors.push(
							`Budget record not found for Claim Item ${row.claim_type_item}`
						);
						continue;
					}

					const oData = aContexts[0].getObject();

					if (oData.BUDGET_BALANCE < row.amount) {
						aErrors.push(row.claim_type_item);
					} else {
						if (aErrors.length == 0) {
							if (submission_type == 'CLM') {
								dataset.push({
									yyyy			: sYYYY,
									fund_center		: sFundCenter,
									commitment_item	: sGLAccount,
									material_code	: sMaterialCode,
									project_code	: sInternalOrder,
									amount			: row.EST_AMOUNT
								})
							}
						}
					}

				} catch (err) {
					console.error("Budget check error:", err);
					aErrors.push(
						`System error while checking Claim Item ${row.CLAIM_TYPE_ITEM_ID}`
					);
				}
			}

			// budget lock if no error found
			if (aErrors.length == 0 && dataset.length != 0) {
				// this.budgetLocking(oModel, dataset, submission_type, 'lock');
				MessageToast.show('no issue, proceed to lock budget')
			}

			return {
				passed: aErrors.length === 0,
				messages: aErrors.join(',')
			};
		},

    };
});