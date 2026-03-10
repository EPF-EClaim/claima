sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageToast",
], function (Filter, FilterOperator, Sorter, MessageToast) {
    "use strict";

    return {

		/* =========================================================
		* Budget Checking Functions
		* ======================================================= */

		// user manual
		// ===========
		// oModel 			= this.getOwnerComponent().getModel();
		// submission_type 	= 'CLM' / 'REQ'
		// date 			= date of claim / date of request
		// proj_code		= project code
		// cost_center		= header cost center
		// claim_type		= header claim type
		// rows				= [{claim_type_item, amount, is_cashadv}]

		async budgetChecking(oModel, submission_type, date, proj_code, cost_center, claim_type, rows) {
			
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

		// user manual
		// ===========
		// oModel 			= this.getOwnerComponent().getModel();
		// dataset 			= [{	yyyy			: sYYYY,
		// 							fund_center		: sFundCenter,
		// 							commitment_item	: sGLAccount,
		// 							material_code	: sMaterialCode,
		// 							project_code	: sInternalOrder,
		// 							amount			: row.EST_AMOUNT
		// 			  		  }]
		// submission_type 	= 'CLM' / 'REQ'
		// process 			= 'lock' / 'release' / 'approve'

		async budgetProcessing(oModel, dataset, submission_type, process) {
			for (const row in dataset) {
				let oListBinding;

				if (submission_type == 'CLM') {
					oListBinding = oModel.bindList("/ZBUDGET", null, null, [
						new Filter("YEAR", "EQ", row.yyyy),
						new Filter("INTERNAL_ORDER", "EQ", row.project_code),		// Project Code
						new Filter("FUND_CENTER", "EQ", row.fund_center),			// Cost Center
						new Filter("COMMITMENT_ITEM", "EQ", row.commitment_item),	// GL Accont
						new Filter("MATERIAL_GROUP", "EQ", row.material_code)		// Material Code
					]);
				} else if (submission_type == 'REQ') {
					// get cash advance cost center and gl account
					oListBinding = oModel.bindList("/ZBUDGET", null, null, [
						new Filter("YEAR", "EQ", row.yyyy),
						new Filter("INTERNAL_ORDER", "EQ", '-'),		// Project Code
						new Filter("FUND_CENTER", "EQ", '100000000'),	// Cost Center
						new Filter("COMMITMENT_ITEM", "EQ", '214005'),	// GL Accont
						new Filter("MATERIAL_GROUP", "EQ", '-')			// Material Code
					]);
				}
				try {
					const aCtx = await oListBinding.requestContexts(0, 1);
					if (!aCtx || aCtx.length === 0) {
						console.error("Budget record not found for row:", row);
						continue; 
					}

					const oCtx = aCtx[0];
					const oCurrentData = oCtx.getObject();
					const fAmount = parseFloat(row.amount || 0);

					let fNewCommitment, fNewActual, fNewConsumed, fNewBalance;
					switch (process) {
						case 'lock':
							fNewCommitment 	= 	(parseFloat(oCurrentData.COMMITMENT) || 0) 		- fAmount;
							fNewActual 		= 	(parseFloat(oCurrentData.ACTUAL) || 0);
							fNewConsumed 	= 	(parseFloat(oCurrentData.CONSUMED) || 0) 		- fAmount;
							fNewBalance 	= 	(parseFloat(oCurrentData.BUDGET_BALANCE) || 0) 	- fAmount;
							break;
						case 'release':
							fNewCommitment 	= 	(parseFloat(oCurrentData.COMMITMENT) || 0) 		- fAmount;
							fNewActual 		= 	(parseFloat(oCurrentData.ACTUAL) || 0);
							fNewConsumed 	= 	(parseFloat(oCurrentData.CONSUMED) || 0) 		- fAmount;
							fNewBalance 	= 	(parseFloat(oCurrentData.BUDGET_BALANCE) || 0) 	+ fAmount;
							break;
						case 'approve':
							fNewCommitment 	= 	(parseFloat(oCurrentData.COMMITMENT) || 0) 		- fAmount;
							fNewActual 		= 	(parseFloat(oCurrentData.ACTUAL) || 0) 			- fAmount;
							fNewConsumed 	= 	(parseFloat(oCurrentData.CONSUMED) || 0) 		- fAmount;
							fNewBalance 	= 	(parseFloat(oCurrentData.BUDGET_BALANCE) || 0) 	- fAmount;
							break;
					}

					oCtx.setProperty("COMMITMENT", fNewCommitment);
					oCtx.setProperty("ACTUAL", fNewActual);
					oCtx.setProperty("CONSUMED", fNewConsumed);
					oCtx.setProperty("BUDGET_BALANCE", fNewBalance);
					
					await oModel.submitBatch("budgetUpdateGroup");
					
					if (oModel.hasPendingChanges("budgetUpdateGroup")) {
						throw new Error("Batch update failed on server.");
					}
					
				} catch (err) {
					console.error("Error updating budget for row:", row, err);
				}
			}
			
		},

		/* =========================================================
		* Budget Checking Helper Functions
		* ======================================================= */

		async _getGLAccount(oModel, claim_type) {

			const oListBinding = oModel.bindList("/ZCLAIM_TYPE", null, null, [
				new sap.ui.model.Filter("CLAIM_TYPE_ID", "EQ", claim_type)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData.GL_ACCOUNT;
				} else {
					console.warn("This Claim Type is not found");
					return "";
				}
			} catch (oError) {
				console.error("Error fetching Claim Type detail", oError);
			}
			
		},

		async _getMaterialCode(oModel, claim_type_item) {

			const oListBinding = oModel.bindList("/ZCLAIM_TYPE_ITEM", null, null, [
				new sap.ui.model.Filter("CLAIM_TYPE_ITEM_ID", "EQ", claim_type_item)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData.MATERIAL_CODE;
				} else {
					console.warn("This Claim Type Item is not found");
					return "";
				}
			} catch (oError) {
				console.error("Error fetching Claim Type Item detail", oError);
			}
			
		},

    };
});