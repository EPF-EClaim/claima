sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"claima/utils/Constants"
], function(
	DateFormat,
	Filter,
	FilterOperator,
	Sorter,
	Constants
) {
	"use strict";

	return {

        /**
		 * Initialize the ClaimUtility
		 * @public
		 */
		init: function (oOwnerComponent, oView) {
			this._oOwnerComponent = oOwnerComponent;
			this._oView = oView;

			// initialize local model
			this._oClaimModel = this._oOwnerComponent.getModel("claim");
			this._oDataModel = this._oOwnerComponent.getModel();
			this._oViewModel = this._oOwnerComponent.getModel("employee_view");
		},

        /* =========================================================
		* Get Claim Details
		* ======================================================= */

        /**
         * Get Claim Header information from backend
         * @public
         * @param {String} sClaimId
         */
		async getHeader(sClaimId) {

			if (!sClaimId) {
				return;
			}

			const oListBinding = this._oViewModel.bindList("/ZEMP_CLAIM_HEADER_VIEW", null, null, [
				new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId)
			]);

			try {
				const aCtx = await oListBinding.requestContexts(0, 1);
				if (aCtx.length === 0) {
					console.warn(`Claim ID ${sClaimId} not found`);
					return [];
				}

				const oData = aCtx[0].getObject();
				
				const oHeaderMap = {
					claim_id						: oData.CLAIM_ID,
					emp_id							: oData.EMP_ID,
					purpose							: oData.PURPOSE,
					trip_start_date					: oData.TRIP_START_DATE,
					trip_end_date					: oData.TRIP_END_DATE,
					event_start_date				: oData.EVENT_START_DATE,
					event_end_date					: oData.EVENT_END_DATE,
					comment							: oData.COMMENT,
					alternate_cost_center			: oData.ALTERNATE_COST_CENTER,
					cost_center						: oData.COST_CENTER,
					request_id						: oData.REQUEST_ID,
					attachment_email_approver		: oData.ATTACHMENT_EMAIL_APPROVER,
					status_id						: oData.STATUS_ID,
					claim_type_id					: oData.CLAIM_TYPE_ID,
					total_claim_amount				: oData.TOTAL_CLAIM_AMOUNT,
					final_amount_to_receive			: oData.FINAL_AMOUNT_TO_RECEIVE,
					payment_date					: oData.PAYMENT_DATE,
					location						: oData.LOCATION,
					spouse_office_address			: oData.SPOUSE_OFFICE_ADDRESS,
					house_completion_date			: oData.HOUSE_COMPLETION_DATE,
					move_in_date					: oData.MOVE_IN_DATE,
					housing_loan_scheme				: oData.HOUSING_LOAN_SCHEME,
					lender_name						: oData.LENDER_NAME,
					specify_details					: oData.SPECIFY_DETAILS,
					new_house_address				: oData.NEW_HOUSE_ADDRESS,
					dist_old_house_to_office_km		: oData.DIST_OLD_HOUSE_TO_OFFICE_KM,
					dist_old_house_to_new_house_km	: oData.DIST_OLD_HOUSE_TO_NEW_HOUSE_KM,
					course_code						: oData.COURSE_CODE,
					session_number					: oData.SESSION_NUMBER,
					cash_advance_amount				: oData.CASH_ADVANCE_AMOUNT,
					preapproved_amount				: oData.PREAPPROVED_AMOUNT,
					mode_of_transfer				: oData.TRANSFER_MODE_DESC,
					travel_alone_family				: oData.TRAVEL_TYPE_DESC,
					travel_family_now_later			: oData.FAMILY_TIMING_DESC,
					descr: {
						alternate_cost_center		: oData.ALT_COST_CENTER_DESC,
						cost_center					: oData.COST_CENTER_DESC,
						status_id					: oData.STATUS_DESC,
						claim_type_id				: oData.CLAIM_TYPE_DESC,
						housing_loan_scheme			: oData.HOUSING_LOAN_SCHEME_DESC,
						lender_name					: oData.LENDER_DESC,
						course_code					: oData.COURSE_CODE_DESC,
						mode_of_transfer			: oData.TRANSFER_MODE_DESC,
						travel_alone_family			: oData.TRAVEL_TYPE_DESC,
						travel_family_now_later		: oData.FAMILY_TIMING_DESC,
					}
				};

				this._oClaimModel.setProperty("/claim_header", oHeaderMap);

			} catch (err) {
				this._oClaimModel.setProperty("/claim_header", {});
			}
		},

		async getItemList(sClaimId) {

			if (!sClaimId) {
				this._oClaimModel.setProperty("/claim_items", []);
				this._oClaimModel.setProperty("/claim_items_count", 0);
				return [];
			}

			const oListBinding = this._oViewModel.bindList(
				"/ZEMP_CLAIM_ITEM_VIEW",
				null,
				[new Sorter("CLAIM_SUB_ID", false)],
				[new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId)],
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
						DEPARTURE_TIME: formatSafeDateTime(oItem.DEPARTURE_TIME),
                		ARRIVAL_TIME:   formatSafeDateTime(oItem.ARRIVAL_TIME),
						DEPENDENT: 		JSON.parse(oItem.DEPENDENT) || [],
						DEPENDENT_TYPE: oItem.ANGGOTA_ID ? Constants.DependentType.ANGGOTA : oItem.DEPENDENT !== "null" ? Constants.DependentType.DEPENDENT : null,
					};
				});
				this._oClaimModel.setProperty("/claim_items", aItems);
				this._oClaimModel.setProperty("/claim_items_count", aItems.length);

			} catch (err) {
				console.error("Item list fetch failed:", err);
				this._oClaimModel.setProperty("/claim_items", []);
				this._oClaimModel.setProperty("/claim_items_count", 0);
			}
		},

		/* =========================================================
		* Determine Footer Buttons
		* ======================================================= */

		determineFooterButton(oController) {
			const sState = oController._oClaimModel.getProperty('/view');
			const sClaimStatus = oController._oClaimModel.getProperty('/claim_header/status_id');

			const oBtnBack    	= oController.byId("button_claimsubmission_back");
			const oBtnSaveDraft	= oController.byId("button_claimsubmission_savedraft");
			const oBtnDelete  	= oController.byId("button_claimsubmission_deletereport");
			const oBtnSubmit  	= oController.byId("button_claimsubmission_submitreport");
			const oBtnReject  	= oController.byId("button_claimapprover_reject");
			const oBtnSendBack	= oController.byId("button_claimapprover_pushback");
			const oBtnApprove  	= oController.byId("button_claimapprover_approve");
			const oBtnCancel  	= oController.byId("button_claimdetails_input_cancel");
			const oBtnSave  	= oController.byId("button_claimdetails_input_save");
			
			let bShowBack   	= false;
			let bShowSaveDraft	= false;
			let bShowDelete 	= false;
			let bShowSubmit 	= false;
			let bShowReject 	= false;
			let bShowSendBack	= false;
			let bShowApprove	= false;
			let bShowCancel		= false;
			let bShowSave		= false;

			switch(sState) {
				case Constants.AccessMode.APPROVER:	// approver
					bShowBack		= true;
					bShowReject 	= true;
					bShowSendBack	= true;
					bShowApprove	= true;
					break;
				
				case Constants.AccessMode.CREATE:		// create
				case Constants.AccessMode.EDIT:		// i_edit
					bShowCancel		= true;
					bShowSave		= true;
					break;

				case Constants.AccessMode.LIST:		// list
					switch (sClaimStatus) {
						case Constants.ClaimStatus.DRAFT:			// draft
						case Constants.ClaimStatus.SEND_BACK:		// send back
							bShowBack   	= true;
							bShowSaveDraft	= true;
							bShowDelete 	= true;
							bShowSubmit 	= true;
							break;
							
							
						case Constants.ClaimStatus.PENDING_APPROVAL:	// pending approval
						case Constants.ClaimStatus.REJECTED:			// rejected
						case Constants.ClaimStatus.CANCELLED:		// cancelled
							bShowBack   	= true;
							break;
					
						case Constants.ClaimStatus.APPROVED:			// approved
							bShowBack   	= true;
							bShowSubmit 	= true;
							break;					}
					break;

				case Constants.AccessMode.VIEW:		// view
					switch (sClaimStatus) {
						case Constants.ClaimStatus.DRAFT:			// draft
						case Constants.ClaimStatus.SEND_BACK:		// send back
							bShowBack   	= true;
							bShowSaveDraft	= true;
							bShowDelete 	= true;
							bShowSubmit 	= true;
							break;

						case Constants.ClaimStatus.PENDING_APPROVAL:	// pending approval
						case Constants.ClaimStatus.REJECTED:			// rejected
						case Constants.ClaimStatus.CANCELLED:		// cancelled
						case Constants.ClaimStatus.APPROVED:			// approved
							bShowBack	= true;
							break;

						case Constants.ClaimStatus.SEND_BACK:		// send back
							bShowBack   	= true;
							bShowDelete 	= true;
							bShowSubmit 	= true;
							oController._oClaimModel.setProperty("/view", Constants.AccessMode.LIST);
							break;

						default:
							bShowBack	= true;
							break;
					}
					break;
				
				case Constants.AccessMode.VIEWAPPR:		// view
					bShowBack		= true;
					oController._oClaimModel.setProperty("/view", Constants.AccessMode.VIEW);
					break;
				
				default:
					break;
			}

			if (oBtnBack) oBtnBack.setVisible(bShowBack);
			if (oBtnSaveDraft) oBtnSaveDraft.setVisible(bShowSaveDraft);
			if (oBtnDelete) oBtnDelete.setVisible(bShowDelete);
			if (oBtnSubmit) oBtnSubmit.setVisible(bShowSubmit);
			if (oBtnReject) oBtnReject.setVisible(bShowReject);
			if (oBtnSendBack) oBtnSendBack.setVisible(bShowSendBack);
			if (oBtnApprove) oBtnApprove.setVisible(bShowApprove);
			if (oBtnCancel) oBtnCancel.setVisible(bShowCancel);
			if (oBtnSave) oBtnSave.setVisible(bShowSave);
		},

		getCurrentState(oController) {
			const sClaimStatus = oController._oClaimModel.getProperty('/claim_header/status_id');
			let sState;

			switch (sClaimStatus) {
				case Constants.ClaimStatus.DRAFT:
				case Constants.ClaimStatus.SEND_BACK:
					sState = Constants.AccessMode.LIST;
					break;
			
				default:
					sState = Constants.AccessMode.VIEW;
					break;
			}

			oController._oClaimModel.setProperty("/view", sState);
		}
	}
});