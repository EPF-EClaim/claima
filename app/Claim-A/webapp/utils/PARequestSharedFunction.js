sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/format/DateFormat",
	"claima/utils/ApprovalLog"
], function (Filter,
	FilterOperator,
	Sorter,
	DateFormat,
	ApprovalLog) {
	"use strict";

	return {

		/* =========================================================
		* JSONModel Reset
		* ======================================================= */

		_ensureRequestModelDefaults (oReq) {
			const data = oReq.getData() || {};
			data.req_header = data.req_header;
			data.req_item_rows = [];
			data.req_item = data.req_item || {
				est_amount: 0,
				rate_per_kilometer: 0,
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
				return;
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
					tripstartdate:  oData.TRIP_START_DATE || "",
					tripenddate:    oData.TRIP_END_DATE || "",
					eventstartdate: oData.EVENT_START_DATE || "",
					eventenddate:   oData.EVENT_END_DATE || "",
					location:       oData.LOCATION || "",
					grptype:        oData.IND_OR_GROUP_DESC || "",
					transport:      oData.TYPE_OF_TRANSPORTATION || "",
					reqstatus:      oData.STATUS_DESC || "",
					costcenter:     oData.COST_CENTER && oData.COST_CENTER_DESC ? `${oData.COST_CENTER} - ${oData.COST_CENTER_DESC}` : "",
					altcostcenter: 	oData.ALTERNATE_COST_CENTER || "",
					altcostcenterdesc:	oData.ALT_COST_CENTER_DESC || "",
					cashadvamt:     parseFloat(oData.CASH_ADVANCE) || 0,
					reqamt:         parseFloat(oData.PREAPPROVAL_AMOUNT) || 0,
					reqtypeid:      oData.REQUEST_TYPE_ID || "",
					reqtype:        oData.REQUEST_TYPE_DESC || "",
					comment:        oData.REMARK || "",
					doc1:           oData.ATTACHMENT1 || "",
					doc2:           oData.ATTACHMENT2 || "",
					claimtype:      oData.CLAIM_TYPE_ID || "",
					claimtypedesc:  oData.CLAIM_TYPE_DESC || "",
					reqdate:        oData.REQUEST_DATE,
					transfermode: 	oData.TRANSFER_MODE_ID || "",
					transfermodedesc:	oData.TRANSFER_MODE_DESC || "",
					transferalonefamily: oData.TRAVEL_ALONE_FAMILY || "",
					transferalonefamilydesc: 	oData.TRAVEL_TYPE_DESC || "",
					transferfamilynowlater: 	oData.TRAVEL_FAMILY_NOW_LATER || "",
					transferfamilynowlaterdesc: oData.FAMILY_TIMING_DESC || ""
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
				return [];
			}

			const oModel = oController.getOwnerComponent().getModel('employee_view');
			const sReqId = String(req_id);

			const oListBinding = oModel.bindList(
				"/ZEMP_REQUEST_ITEM_VIEW",
				null,
				[new Sorter("REQUEST_SUB_ID", false)],
				[new Filter("REQUEST_ID", FilterOperator.EQ, sReqId)],
				{ $$ownRequest: true, $count: true }
			);

			const oDateTimeFormatter = DateFormat.getDateTimeInstance({
				pattern: "dd MMM yyyy HH:mm"
			});

			const formatSafeDateTime = (sDate) => {
				if (!sDate) return null;
				const dParsed = new Date(sDate);
				return isNaN(dParsed.getTime()) ? sDate : oDateTimeFormatter.format(dParsed);
			};

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				
				const aItems = aCtx.map((ctx) => {
					const oItem = ctx.getObject();
					return {
						...oItem,
						EST_AMOUNT: parseFloat(oItem.EST_AMOUNT) || 0,
						EST_NO_PARTICIPANT: parseInt(oItem.EST_NO_PARTICIPANT, 10) || 1,
						DEPARTURE_TIME: formatSafeDateTime(oItem.DEPARTURE_TIME),
                		ARRIVAL_TIME:   formatSafeDateTime(oItem.ARRIVAL_TIME),
						DEPENDENT: 		JSON.parse(oItem.DEPENDENT) || []
					};
				});
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

		determineFooterButton(oController) {
			const sState = oController._oReqModel.getProperty('/view');
			const sReqStatus = oController._oReqModel.getProperty('/req_header/reqstatus');

			const oBtnBackScr 	= oController.byId('req_back_scr');
			const oBtnBack    	= oController.byId("req_back");
			const oBtnDelete  	= oController.byId("req_delete");
			const oBtnSubmit  	= oController.byId("req_submit");
			const oBtnReject  	= oController.byId("req_reject");
			const oBtnSendBack	= oController.byId("req_send_back");
			const oBtnApprove  	= oController.byId("req_approve");
			const oBtnCancel  	= oController.byId("req_item_cancel");
			const oBtnSave  	= oController.byId("req_item_save");
			
			let bShowBackScr	= false;
			let bShowBack   	= false;
			let bShowDelete 	= false;
			let bShowSubmit 	= false;
			let bShowReject 	= false;
			let bShowSendBack	= false;
			let bShowApprove	= false;
			let bShowCancel		= false;
			let bShowSave		= false;

			switch(sState) {
				case oController._oConstant.PARMode.APPROVER:	// approver
					bShowBackScr	= true;
					bShowReject 	= true;
					bShowSendBack	= true;
					bShowApprove	= true;
					break;
				
				case oController._oConstant.PARMode.CREATE:		// create
				case oController._oConstant.PARMode.EDIT:		// i_edit
					bShowCancel		= true;
					bShowSave		= true;
					break;

				case oController._oConstant.PARMode.LIST:		// list
					switch (sReqStatus) {
						case oController._oConstant.RequestStatus.DRAFT:			// draft
						case oController._oConstant.RequestStatus.SEND_BACK:		// send back
							bShowBack   	= true;
							bShowDelete 	= true;
							bShowSubmit 	= true;
							break;
							
							
						case oController._oConstant.RequestStatus.PENDING_APPROVAL:	// pending approval
						case oController._oConstant.RequestStatus.REJECTED:			// rejected
						case oController._oConstant.RequestStatus.CANCELLED:		// cancelled
							bShowBack   	= true;
							break;
					
						case oController._oConstant.RequestStatus.APPROVED:			// approved
							bShowBack   	= true;
							bShowSubmit 	= true;
							break;					}
					break;

				case oController._oConstant.PARMode.VIEW:		// view
					switch (sReqStatus) {
						case oController._oConstant.RequestStatus.PENDING_APPROVAL:	// pending approval
						case oController._oConstant.RequestStatus.REJECTED:			// rejected
						case oController._oConstant.RequestStatus.CANCELLED:		// cancelled
						case oController._oConstant.RequestStatus.APPROVED:			// approved
							bShowBackScr	= true;
							break;

						case oController._oConstant.RequestStatus.SEND_BACK:		// send back
							bShowBack   	= true;
							bShowDelete 	= true;
							bShowSubmit 	= true;
							oController._oReqModel.setProperty("/view", oController._oConstant.PARMode.LIST);
							break;

						default:
							bShowBackScr	= true;
							break;
					}
					break;
				
				case oController._oConstant.PARMode.VIEWAPPR:		// i_edit
					bShowBackScr	= true;
					oController._oReqModel.setProperty("/view", oController._oConstant.PARMode.VIEW);
					break;
				
				default:
					break;
			}


			if (oBtnBackScr) oBtnBackScr.setVisible(bShowBackScr);
			if (oBtnBack) oBtnBack.setVisible(bShowBack);
			if (oBtnDelete) oBtnDelete.setVisible(bShowDelete);
			if (oBtnSubmit) oBtnSubmit.setVisible(bShowSubmit);
			if (oBtnReject) oBtnReject.setVisible(bShowReject);
			if (oBtnSendBack) oBtnSendBack.setVisible(bShowSendBack);
			if (oBtnApprove) oBtnApprove.setVisible(bShowApprove);
			if (oBtnCancel) oBtnCancel.setVisible(bShowCancel);
			if (oBtnSave) oBtnSave.setVisible(bShowSave);
		},

		getCurrentState(oController) {
			const sReqStatus = oController._oReqModel.getProperty('/req_header/reqstatus');
			let sState;

			switch (sReqStatus) {
				case oController._oConstant.RequestStatus.DRAFT:
				case oController._oConstant.RequestStatus.SEND_BACK:
					sState = "list";
					break;
			
				default:
					sState = "view";
					break;
			}

			oController._oReqModel.setProperty("/view", sState);
		}

	};
});