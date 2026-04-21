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
						aErrors.push(Utility.getText("budget_w_not_found", [row.claim_type_item]));
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
					aErrors.push(Utility.getText("budget_w_system_error", [row.CLAIM_TYPE_ITEM_ID]));
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
				MessageToast.show(Utility.getText("budget_s_update"));
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
						throw new Error(Utility.getText("budget_e_batch_update"));
					}
					
				} catch (err) {
					console.error("Error updating budget for row:", row, err);
				}
			}
			
		},

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

		_generateBudgetCheckPayload (oController, oHeader, aItemRows, sSubmissionType, sAction) {
			
			var sDate			= new Date(oHeader.reqdate);
			var sYear			= String(sDate.getFullYear());
			var sFundCenter		= oHeader.costcenter;
			var sInternalCode	= oHeader.projectcode || "1";

			aItemRows.map(row => {
				return {
					"YEAR": sYear,
					"INTERNAL_ORDER": sInternalCode,
					"FUND_CENTER": sFundCenter,
					"MATERIAL_GROUP": row.MATERIAL_CODE,
					"COMMITMENT_ITEM": row.GL_ACCOUNT,
					"AMOUNT": parseFloat(row.EST_AMOUNT),
					"CLAIM_TYPE_ITEM": row.CLAIM_TYPE_ITEM_ID,
					"INDICATOR": sSubmissionType,
					"ACTION": sAction
				};
			});
		},

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
					var sInternalCode	= oHeader.projectcode || "1";	// todo change to NA after flush db

					var aPayload = aItemRows.map(row => {
						return {
							"YEAR": sYear,
							"INTERNAL_ORDER": sInternalCode,
							"FUND_CENTER": sFundCenter,
							"MATERIAL_GROUP": row.MATERIAL_CODE,
							"COMMITMENT_ITEM": row.GL_ACCOUNT,
							"AMOUNT": parseFloat(row.EST_AMOUNT),
							"CLAIM_TYPE_ITEM": row.CLAIM_TYPE_ITEM_DESC,
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
							"CLAIM_TYPE_ITEM": row.descr.claim_type_item_id,
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