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

			for (const row of rows) {
				const sGLAccount = await this._getGLAccount(oModel, claim_type);
				const sMaterialCode = await this._getMaterialCode(oModel, row.claim_type_item);

				const oListBinding = oModel.bindList("/ZELIGIBILITY_RULE", null, null, [
					new Filter("CLAIM_TYPE_ID", "EQ", sYYYY),
					new Filter("CLAIM_TYPE_ITEM_ID", "EQ", sInternalOrder),
					new Filter("PERSONAL_GRADE", "EQ", sInternalOrder),
					new Filter("ROLE_ID", "EQ", sInternalOrder)
				]);

				try {
					const aContexts = await oListBinding.requestContexts(0, Infinity);

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

			return {
				passed: aErrors.length === 0,
				messages: aErrors.join(',')
			};
		},

		_checkEligibleAmount() {

		},

		_loadEligibleFlightClass() {
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZINDIV_GROUP", null, null, [
				new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });
				this.getView().setModel(oTypeModel, "indiv_list");
			}).catch(err => console.error("GroupType Load Failed", err));
		},

		_loadEligibleFlightClass() {
			const oMainModel = this.getOwnerComponent().getModel();
			const oListBinding = oMainModel.bindList("/ZINDIV_GROUP", null, null, [
				new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
			]);

			oListBinding.requestContexts().then((aContexts) => {
				const aData = aContexts.map(oCtx => oCtx.getObject());
				const oTypeModel = new JSONModel({ types: aData });
				this.getView().setModel(oTypeModel, "indiv_list");
			}).catch(err => console.error("GroupType Load Failed", err));
		},

    };
});