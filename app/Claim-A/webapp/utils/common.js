sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {
        
		/* =========================================================
		* JSONModel Reset
		* ======================================================= */

        _ensureRequestModelDefaults: function (oReq) {
			const data = oReq.getData() || {};
			data.req_header        = { reqid: "", grptype: "IND" };
			data.req_item_rows     = [];
			data.req_item          = data.req_item || {
				cash_advance: "no_cashadv"
			};
			data.participant       = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view              = "view";
			data.list_count        = 0;
			oReq.setData(data);
		},

		/* =========================================================
		* Get List from Backend
		* ======================================================= */

		getPARHeaderList: async function (oReq, oModel) {

			const oListBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", undefined,
				[new Sorter("REQUEST_ID", true)],null,
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$updateGroupId: "$auto",
					$count: true
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				a.forEach((it) => {
				    if (it.PREAPPROVAL_AMOUNT == null) it.PREAPPROVAL_AMOUNT = 0.0;
				});

				oReq.setProperty("/req_header_list", a);
				oReq.setProperty("/req_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/req_header_list", []);
				oReq.setProperty("/req_header_count", 0);
				return [];
			}
		},

		/* =========================================================
		* Budget Checking Functions
		* ======================================================= */

		async budgetChecking(oModel, date, proj_code, cost_center, claim_type, rows) {
			const sDate = new Date(date);
			const sYYYY = String(sDate.getFullYear());
			const sInternalOrder = String(proj_code);
			const sFundCenter = String(cost_center);

			const aErrors = []; 

			for (const row of rows) {
				const sGLAccount = await this._getGLAccount(oModel, claim_type);
				const sMaterialCode = await this._getMaterialCode(oModel, row.CLAIM_TYPE_ITEM_ID);

				const oListBinding = oModel.bindList("/ZBUDGET", null, null, [
					new sap.ui.model.Filter("YEAR", "EQ", sYYYY),
					new sap.ui.model.Filter("INTERNAL_ORDER", "EQ", sInternalOrder),		// Project Code
					new sap.ui.model.Filter("FUND_CENTER", "EQ", sFundCenter),			// Cost Center
					new sap.ui.model.Filter("COMMITMENT_ITEM", "EQ", sGLAccount),		// GL Accont
					new sap.ui.model.Filter("MATERIAL_GROUP", "EQ", sMaterialCode)		// Material Code
				]);

				try {
					const aContexts = await oListBinding.requestContexts(0, 1);

					if (aContexts.length === 0) {
						aErrors.push(
							`Budget record not found for Claim Item ${row.CLAIM_TYPE_ITEM_ID}`
						);
						continue;
					}

					const oData = aContexts[0].getObject();

					if (oData.BUDGET_BALANCE < row.EST_AMOUNT) {
						aErrors.push(row.CLAIM_TYPE_ITEM_ID);
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

		// function helpers for budget checking
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