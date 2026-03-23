sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter"
], function (Filter, FilterOperator, Sorter) {
	"use strict";

	return {

		/* =========================================================
		* JSONModel Reset
		* ======================================================= */

		_ensureRequestModelDefaults (oReq) {
			const data = oReq.getData() || {};
			data.req_header = data.req_header;
			data.req_item_rows = data.req_item_rows || [];
			data.req_item = data.req_item || {
				cash_advance: false
			};
			data.participant = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view = data.view || "view";
			data.list_count = 0;
			oReq.setData(data);
		},
		
		/* =========================================================
		* Get My Pre-Approval Request Details
		* ======================================================= */

		async _getHeader(oController, sReqId) {
			const oReqModel = oController._oReqModel;

			if (!sReqId) {
				oReqModel.setProperty("/req_item_rows", []);
				oReqModel.setProperty("/list_count", 0);
				return [];
			}

			const oListBinding = oController._oViewModel.bindList("/ZEMP_REQUEST_VIEW", null, null, [
				new Filter("REQUEST_ID", FilterOperator.EQ, sReqId)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, 1);
				if (aCtx.length === 0) {
					console.warn(`Request ID ${sReqId} not found`);
					return [];
				}

				const oData = aCtx[0].getObject();
				
				const oHeaderMap = {
					purpose:        oData.OBJECTIVE_PURPOSE || "",
					reqid:          oData.REQUEST_ID || "",
					tripstartdate:  oData.TRIP_START_DATE || "-",
					tripenddate:    oData.TRIP_END_DATE || "-",
					eventstartdate: oData.EVENT_START_DATE || "-",
					eventenddate:   oData.EVENT_END_DATE || "-",
					location:       oData.LOCATION || "-",
					grptype:        oData.IND_OR_GROUP_DESC || "-",
					transport:      oData.TYPE_OF_TRANSPORTATION || "-",
					reqstatus:      oData.STATUS_DESC || "-",
					costcenter:     oData.COST_CENTER || "-",
					altcostcenter:  oData.ALTERNATE_COST_CENTER || "-",
					cashadvamt:     parseFloat(oData.CASH_ADVANCE) || 0,
					reqamt:         parseFloat(oData.PREAPPROVAL_AMOUNT) || 0,
					reqtype:        oData.REQUEST_TYPE_DESC || "-",
					comment:        oData.REMARK || "-",
					doc1:           oData.ATTACHMENT1 || "-",
					doc2:           oData.ATTACHMENT2 || "-",
					claimtype:      oData.CLAIM_TYPE_ID || "-",
					claimtypedesc:  oData.CLAIM_TYPE_DESC || "-",
					reqdate:        oData.REQUEST_DATE
				};

				oReqModel.setProperty("/req_header", oHeaderMap);

			} catch (err) {
				console.error("Header fetch failed:", err);
				oReqModel.setProperty("/req_header", {});
			}
		},

		async _getItemList(oController, req_id) {
			const oReq = oController._oReqModel;

			if (!req_id) {
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
			}

			const oModel = oController.getOwnerComponent().getModel('employee_view');
			const sReqId = String(req_id);

			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_ITEM_VIEW",
				null,
				[new sap.ui.model.Sorter("REQUEST_SUB_ID", false)],
				[new sap.ui.model.Filter("REQUEST_ID", sap.ui.model.FilterOperator.EQ, sReqId)],
				{ $$ownRequest: true, $count: true }
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				
				const aItems = aCtx.map((ctx) => {
					const oItem = ctx.getObject();
					return {
						...oItem,
						EST_AMOUNT: parseFloat(oItem.EST_AMOUNT) || 0,
						EST_NO_PARTICIPANT: parseInt(oItem.EST_NO_PARTICIPANT, 10) || 1
					};
				});

				const fCashAdvTotal = aItems.reduce((sum, it) => 
					it.CASH_ADVANCE === "YES" ? sum + it.EST_AMOUNT : sum, 0);

				const fReqAmtTotal = aItems.reduce((sum, it) => 
					it.CASH_ADVANCE !== "YES" ? sum + it.EST_AMOUNT : sum, 0);

				oReq.setProperty("/req_header/cashadvamt", fCashAdvTotal);
				oReq.setProperty("/req_header/reqamt", fReqAmtTotal);
				oReq.setProperty("/req_item_rows", aItems);
				oReq.setProperty("/list_count", aItems.length);

			} catch (err) {
				console.error("Item list fetch failed:", err);
				oReq.setProperty("/req_item_rows", []);
				oReq.setProperty("/list_count", 0);
			}
		},

		/* =========================================================
		* Determine Footer Buttons
		* ======================================================= */

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
					case 'CANCELLED':
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

	};
});