sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "claima/model/models",
    "claima/utils/ClaimUtility",
    "claima/utils/Constants",
    "claima/utils/CustomValidator",
    "claima/utils/DateUtility",
    "claima/utils/RequestUtility",
    "claima/utils/Utility"
], function (MessageBox, MessageToast, BusyIndicator, Models, ClaimUtility, Constants, CustomValidator, DateUtility, RequestUtility, Utility) {
	"use strict";

	return {
        /**
         * Initialize the Utility 
         * @public
         * @param {object} oOwnerComponent Caller component for accessing models
         * @param {object} oView View instance of caller
         */
        init: function (oOwnerComponent, oView) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
        },

        /**
         * Save header details for Claim Submission or Pre Approved Request
         * @public
         * @param {string} sClaimType claim type to be saved: Claim Submission or Pre Approved Request
         */
        saveHeader: async function (sClaimType) {
            const oODataModel = this._oOwnerComponent.getModel();
            var oInputModel = null;
            switch(sClaimType) {
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    oInputModel = this._oView.getModel("request");

                    if ( DateUtility.getHanaDate(oInputModel.getProperty("/req_header/tripstartdate")) && DateUtility.getHanaDate(oInputModel.getProperty("/req_header/tripenddate")) ) {
                        try {
                            BusyIndicator.show(0);

                            const sReqID = oInputModel.getProperty("/req_header/reqid");
                            if (!sReqID) {
                                MessageBox.error(Utility.getText("msg_error_missing_claim_id"));
                            }

                            CustomValidator.init(this._oOwnerComponent, this._oView);
                            const bProceed = await CustomValidator.validate(Constants.SubmissionTypePrefix.REQUESTHEADER);
                            if ( !bProceed ) {
                                return;
                            }

                            // Bind to existing claim header
                            const oContext = await RequestUtility.getReqHeader(oODataModel, sReqID);

                            const dLastModifiedDate = DateUtility.getHanaDate(new Date());

                            oContext.setProperty("LAST_MODIFIED_DATE", dLastModifiedDate);
                            oContext.setProperty("REMARK",
                                oInputModel.getProperty("/req_header/comment")
                            );
                            oContext.setProperty("LOCATION",
                                oInputModel.getProperty("/req_header/location")
                            );
                            oContext.setProperty("ALTERNATE_COST_CENTER",
                                oInputModel.getProperty("/req_header/altcostcenter")
                            );

                            oContext.setProperty("TRIP_START_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/req_header/tripstartdate"))
                            );
                            oContext.setProperty("TRIP_END_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/req_header/tripenddate"))
                            );
                            oContext.setProperty("EVENT_START_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/req_header/eventstartdate"))
                            );
                            oContext.setProperty("EVENT_END_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/req_header/eventenddate"))
                            );

                            await oODataModel.submitBatch("$auto");

                            MessageToast.show(
                                Utility.getText("msg_claimheader_updated", [sReqID])
                            );

                        } catch (e) {
                            MessageToast.show(
                                Utility.getText("msg_claimsubmission_failed")
                            );
                        } finally {
                            BusyIndicator.hide();
                        }
                    }	
                    else {
                        MessageBox.error(Utility.getText("req_d_w_mandatory_field"));
                    }
                    break;

                case Constants.SubmissionTypePrefix.CLAIMHEADER:
                    oInputModel = this._oView.getModel("claimsubmission_input");

                    if ( DateUtility.getHanaDate(oInputModel.getProperty("/claim_header/trip_start_date")) && DateUtility.getHanaDate(oInputModel.getProperty("/claim_header/trip_end_date")) ) {
                        try {
                            BusyIndicator.show(0);

                            const sClaimId = oInputModel.getProperty("/claim_header/claim_id");
                            if (!sClaimId) {
                                MessageBox.error(Utility.getText("msg_error_missing_claim_id"));
                            }

                            CustomValidator.init(this._oOwnerComponent, this._oView);
                            const bProceed = await CustomValidator.validate(Constants.SubmissionTypePrefix.CLAIMHEADER);
                            if ( !bProceed ) {
                                return;
                            }

                            // Bind to existing claim header 
                            const oContext = await ClaimUtility.getClaimHeader(oODataModel, sClaimId);

                            const dLastModifiedDate = DateUtility.getHanaDate(new Date());

                            oContext.setProperty("LAST_MODIFIED_DATE", dLastModifiedDate);
                            oContext.setProperty("COMMENT",
                                oInputModel.getProperty("/claim_header/comment")
                            );
                            oContext.setProperty("LOCATION",
                                oInputModel.getProperty("/claim_header/location")
                            );
                            oContext.setProperty("ALTERNATE_COST_CENTER",
                                oInputModel.getProperty("/claim_header/alternate_cost_center")
                            );

                            oContext.setProperty("TRIP_START_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/claim_header/trip_start_date"))
                            );
                            oContext.setProperty("TRIP_END_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/claim_header/trip_end_date"))
                            );
                            oContext.setProperty("EVENT_START_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/claim_header/event_start_date"))
                            );
                            oContext.setProperty("EVENT_END_DATE",
                                DateUtility.getHanaDate(oInputModel.getProperty("/claim_header/event_end_date"))
                            );

                            await oODataModel.submitBatch("$auto");

                            MessageToast.show(
                                Utility.getText("msg_claimheader_updated", [sClaimId])
                            );

                        } catch (e) {
                            MessageToast.show(
                                Utility.getText("msg_claimsubmission_failed")
                            );
                        } finally {
                            BusyIndicator.hide();
                        }
                    }	
                    else {
                        MessageBox.error(Utility.getText("req_d_w_mandatory_field"));
                    }
                    break;
            }
		},

		/**
		 * Set fields to be editable
		 * if there is a request tied to claim, do not allow editing for start and end trip dates
		 * if there is a default cost center tied to claim type, do not allow editing for alternate cost center
		 * @public
         * @param {string} sClaimType Claim submission or Pre Approval Request claim type
		 * @param {boolean} bEdit edit toggle
		 */
		setHeaderEditable: async function (sClaimType , bEdit) {
            ClaimUtility.init(this._oOwnerComponent, this._oView);
            switch(sClaimType) {
                case Constants.SubmissionTypePrefix.CLAIMHEADER:
                    const oClaimModel = this._oView.getModel("claimsubmission_input");
                    var oEditableFields = this._oView.getModel("claimSubmissionHeaderEditableModel");
                    if (bEdit) {
                        oEditableFields.setProperty("/startTrip", !bEdit);
                        oEditableFields.setProperty("/endTrip", !bEdit);
                        oEditableFields.setProperty("/altCostCenter", !bEdit)
                            
                        oEditableFields.setProperty("/startEvent", bEdit);
                        oEditableFields.setProperty("/endEvent", bEdit);
                        oEditableFields.setProperty("/location", bEdit);
                        oEditableFields.setProperty("/comment", bEdit);
                        if (!oClaimModel.getProperty("/claim_header/request_id")) {
                            oEditableFields.setProperty("/startTrip", bEdit);
                            oEditableFields.setProperty("/endTrip", bEdit);
                        }
                        const sDefaultCostCenter = await ClaimUtility.determineDefaultCostCenter(oClaimModel.getProperty("/claim_header/claim_type_id"))
                        if ( !sDefaultCostCenter ){
                            oEditableFields.setProperty("/altCostCenter", bEdit);
                        }
                        oEditableFields.setProperty("/saveHeader", bEdit);
                    }
                    else {	
                        oEditableFields.setData(Models.createClaimHeaderEditableModel().getData(), bEdit);
                    }
                    break;
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    const oReqModel = this._oView.getModel("request");
                    var oEditableFields = this._oView.getModel("reqHeaderEditableModel");
                    if (bEdit) {
                        oEditableFields.setProperty("/startEventRequired", !bEdit);
                        oEditableFields.setProperty("/endEventRequired", !bEdit);
                        oEditableFields.setProperty("/altCostCenter", !bEdit);

                        oEditableFields.setProperty("/startEvent", bEdit);
                        oEditableFields.setProperty("/endEvent", bEdit);
                        Utility.init(this._oOwnerComponent, this._oView);
                        if (await Utility.getEventDateRequired(oReqModel.getProperty("/req_header/reqtype"))) {
                            oEditableFields.setProperty("/startEventRequired", bEdit);
                            oEditableFields.setProperty("/endEventRequired", bEdit);
                        }
                        oEditableFields.setProperty("/location", bEdit);
                        oEditableFields.setProperty("/comment", bEdit);
                        oEditableFields.setProperty("/startTrip", bEdit);
                        oEditableFields.setProperty("/endTrip", bEdit);
                        const sDefaultCostCenter = await ClaimUtility.determineDefaultCostCenter(oReqModel.getProperty("/req_header/claimtypedesc"))
                        if ( !sDefaultCostCenter ){
                            oEditableFields.setProperty("/altCostCenter", bEdit);
                        }
                        oEditableFields.setProperty("/saveHeader", bEdit);
                    }
                    else {
                        oEditableFields.setData(Models.createClaimHeaderEditableModel().getData(), bEdit);
                    }
                    break;
            }
		},
	}
});