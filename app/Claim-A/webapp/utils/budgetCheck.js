sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"claima/utils/Utility"
], function (Filter, FilterOperator, MessageToast, Utility) {
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

				// set filters
				var oFilter = [
					new Filter("YEAR", FilterOperator.EQ, sYYYY),
					new Filter("FUND_CENTER", FilterOperator.EQ, sFundCenter),			// Cost Center
					new Filter("COMMITMENT_ITEM", FilterOperator.EQ, sGLAccount),		// GL Accont
					new Filter("MATERIAL_GROUP", FilterOperator.EQ, sMaterialCode)		// Material Code
				];
				if (proj_code) { // proj_code is not null
					oFilter.push(new Filter("INTERNAL_ORDER", FilterOperator.EQ, sInternalOrder));	// Project Code
				}

				const oListBinding = oModel.bindList("/ZBUDGET", null, null, oFilter);

				try {
					const aContexts = await oListBinding.requestContexts(0, 1);

					if (aContexts.length === 0) {
						aErrors.push(Utility.getText(this, "budget_w_not_found", [row.claim_type_item]));
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
					aErrors.push(Utility.getText(this, "budget_w_system_error", [row.CLAIM_TYPE_ITEM_ID]));
				}
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
			const sGroupId = 'budgetUpdateGroup';
			for (const row of dataset) {
				let oListBinding;

				oListBinding = oModel.bindList("/ZBUDGET", null, null, [
					new Filter("YEAR", "EQ", row.yyyy),
					new Filter("INTERNAL_ORDER", "EQ", row.project_code),		// Project Code
					new Filter("FUND_CENTER", "EQ", row.fund_center),			// Cost Center
					new Filter("COMMITMENT_ITEM", "EQ", row.commitment_item),	// GL Accont
					new Filter("MATERIAL_GROUP", "EQ", row.material_code)		// Material Code
				], {
					$$updateGroupId: sGroupId
				});

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
							fNewCommitment 	= 	(parseFloat(oCurrentData.COMMITMENT) || 0) 		+ fAmount;
							fNewActual 		= 	(parseFloat(oCurrentData.ACTUAL) || 0);
							fNewConsumed 	= 	(parseFloat(oCurrentData.CONSUMED) || 0) 		+ fAmount;
							fNewBalance 	= 	(parseFloat(oCurrentData.BUDGET_BALANCE) || 0) 	+ fAmount;
							break;
						case 'approve':
							fNewCommitment 	= 	(parseFloat(oCurrentData.COMMITMENT) || 0) 		+ fAmount;
							fNewActual 		= 	(parseFloat(oCurrentData.ACTUAL) || 0) 			- fAmount;
							fNewConsumed 	= 	(parseFloat(oCurrentData.CONSUMED) || 0)
							fNewBalance 	= 	(parseFloat(oCurrentData.BUDGET_BALANCE) || 0)
							break;
					}

					oCtx.setProperty("COMMITMENT", fNewCommitment);
					oCtx.setProperty("ACTUAL", fNewActual);
					oCtx.setProperty("CONSUMED", fNewConsumed);
					oCtx.setProperty("BUDGET_BALANCE", fNewBalance);
					
				} catch (err) {
					console.error("Error updating budget for row:", row, err);
				}
			}

			try {
				await oModel.submitBatch("budgetUpdateGroup");
				MessageToast.show(Utility.getText(this, "budget_s_update"));
			} catch (err) {
				console.error('Final Budget Batch failed', e);
				throw e;
			}
			
		},
		//For testing only
		async budgetProcessingTest(oModel, dataset, submission_type, process) {
			for (const row of dataset) {
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
						throw new Error(Utility.getText(this, "budget_e_batch_update"));
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
					console.warn(Utility.getText(this, "budget_w_claim_type_not_found"));
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
					console.warn(Utility.getText(this, "budget_w_claim_type_item_not_found"));
					return "";
				}
			} catch (oError) {
				console.error("Error fetching Claim Type Item detail", oError);
			}
			
		},

		/* =========================================================
		* Budget Checking payload generation
		* ======================================================= */

		generateBudgetCheckPayload (oController) {
			var oReqModel	= oController._getReqModel();
			var oHeader		= oReqModel.getProperty('/req_header');
			var aRows		= oReqModel.getProperty('/req_item_rows');
			
			var sDate			= new Date(oHeader.reqdate);
			var sYear			= String(sDate.getFullYear());
			var sFundCenter		= oHeader.costcenter;
			var sInternalCode	= oHeader.projectcode || "-";

			return aRows.map(row => {
				return {
					"YEAR": sYear,
					"INTERNAL_ORDER": sInternalCode,
					"FUND_CENTER": sFundCenter,
					"MATERIAL_GROUP": row.MATERIAL_CODE,
					"COMMITMENT_ITEM": row.GL_ACCOUNT,
					"AMOUNT": parseFloat(row.EST_AMOUNT),
					"INDICATOR": "REQ",
					"ACTION": "SUBMIT"
				};
			});
		},

		async backendBudgetChecking (oController) {
			const aPayload = await this.generateBudgetCheckPayload(oController);
			const oDataModel = oController.getOwnerComponent().getModel();

			const oAction	= oDataModel.bindContext("/budgetchecking(...)");
			oAction.setParameter("budget", aPayload);

			try {
				await oAction.execute();
				const oResponse = oAction.getBoundContext().getObject();
				const aResults = oResponse.results || oResponse.value || oResponse;
				return aResults;
			} catch (err) {
				console.error("Budget check failed", err);
				return false;
			}
		},

    };
});