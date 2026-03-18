sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"claima/utils/Constants"
], function (Filter, FilterOperator, Sorter, Constants) {
	"use strict";

	return {

		/* =========================================================
		* JSONModel Reset
		* ======================================================= */

		_ensureRequestModelDefaults (oReq) {
			const data = oReq.getData() || {};
			data.req_header = { reqid: "", grptype: "IND" };
			data.req_item_rows = [];
			data.req_item = data.req_item || {
				cash_advance: "no_cashadv"
			};
			data.participant = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view = "view";
			data.list_count = 0;
			oReq.setData(data);
		},

		/* =========================================================
		* Get List from Backend
		* ======================================================= */

		async getPARHeaderList (oReq, oModel) {

			const oListBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", undefined,
				[new Sorter("modifiedAt", true)], null,
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

		async _getItemList (oController, req_id, first_load = false) {
			const oReq = oController._getReqModel();

			if (!req_id) {
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}

			const oModel = oController.getOwnerComponent().getModel('employee_view');

			const sReq = String(req_id);
			const sEmp = String(oReq.getProperty('/user'));

			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_ITEM_VIEW",
				null,
				[new sap.ui.model.Sorter("REQUEST_SUB_ID", false)],
				[new sap.ui.model.Filter({
					path: "REQUEST_ID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sReq
				})],
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$count: true
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				a.forEach((it) => {
					if (it.EST_AMOUNT != null) it.EST_AMOUNT = parseFloat(it.EST_AMOUNT);
					if (it.EST_NO_PARTICIPANT != null) it.EST_NO_PARTICIPANT = parseInt(it.EST_NO_PARTICIPANT, 10);
				});

				const cashadv_amt = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === "YES" ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				const req_amt = a.reduce((sum, it) => {
					return it.CASH_ADVANCE === null ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
				}, 0);

				oReq.setProperty("/req_header/cashadvamt", cashadv_amt);
				oReq.setProperty("/req_header/reqamt", req_amt);
				oReq.setProperty("/req_item_rows", a);
				oReq.setProperty("/list_count", a.length);
				if (first_load != true) {
					oController.updateRequestAmount(sEmp, sReq, cashadv_amt, req_amt);
				}

				return a;
			} catch (err) {
				console.error("OData V4 bindList failed:", err);
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
				return [];
			}
		},

		_determineCurrentState (oController, oReq) {
			if (oReq.getProperty('/view') != 'approver') {
				switch (oReq.getProperty('/req_header/reqstatus')) {
					case 'DRAFT' || 'SEND BACK':
						oController.byId('req_back_scr').setVisible(false);
						oController.byId("req_back").setVisible(true);
						oController.byId("req_delete").setVisible(true);
						oController.byId("req_submit").setVisible(true);
						oReq.setProperty('/view', 'list');
						break;
					case 'DELETE':
						oController.byId('req_back_scr').setVisible(true);
						oController.byId("req_back").setVisible(false);
						oController.byId("req_delete").setVisible(false);
						oController.byId("req_submit").setVisible(false);
						oReq.setProperty('/view', 'view');
						break;
					case 'APPROVED':
						oController.byId('req_back_scr').setVisible(true);
						oController.byId("req_back").setVisible(false);
						oController.byId("req_delete").setVisible(false);
						oController.byId("req_submit").setVisible(true);
						oReq.setProperty('/view', 'list');
						break;
					case 'PENDING APPROVAL':
						oController.byId('req_back_scr').setVisible(true);
						oController.byId("req_back").setVisible(false);
						oController.byId("req_delete").setVisible(true);
						oController.byId("req_submit").setVisible(false);
						oReq.setProperty('/view', 'view');
						break;
					default:
						oReq.setProperty('/view', 'view');
						break;
				}
			}
		},

		async _getEmpIdDetail (oController, sEmpId) {
			const oModel = oController.getView().getModel();
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
				new Filter("EEID", FilterOperator.EQ, sEmpId)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return {
						eeid: oData.EEID,
						name: oData.NAME,
						cc: oData.CC
					};
				} else {
					console.warn("No employee found with ID: " + sEmpId);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null;
			}
		},

		generateEligibilityCheckPayload (oController, oConstant) {
			const oReqModel = oController._getReqModel();
			const oData     = oReqModel.getProperty('/req_item');
			const oMapping  = oConstant.PAR_ELIGIBILITY_CHECK;

			const sEmpId         = oReqModel.getProperty('/user');
			const sClaimType     = oReqModel.getProperty('/req_header/claimtype');
			const sClaimTypeItem = oData.claim_type_item_id;

			const aFieldsToCheck = [
				"vehicle_ownership",
				"est_amount",
				"cat_purpose",
				"sss",
				"no_of_days",
				"rate_per_kilometer",
				"room_type",
				"flight_class",
				"marriage_cat",
				"vehicle_class",
				"travel_hours"
			];

			const aActiveFields = aFieldsToCheck.reduce((acc, sKey) => {
				const val = oData[sKey];
				
				// Check for valid, non-empty values
				if (val !== null && val !== undefined && String(val).trim() !== "") {
					// Determine the field name: Use mapped constant OR fallback to original key
					const sTargetName = oMapping[sKey] || sKey;

					acc.push({
						fieldName: sTargetName,
						value: val,
						result: null
					});
				}
				return acc;
			}, []);

			const oPayload = {
				EmpId: sEmpId,
				ClaimType: sClaimType,
				ClaimTypeItem: sClaimTypeItem,
				CheckFields: aActiveFields
			};

			return [oPayload];
		},

	};
});