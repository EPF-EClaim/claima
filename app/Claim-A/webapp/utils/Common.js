sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "claima/utils/Constants",
    "claima/utils/DateUtility",
    "claima/utils/ClaimUtility",
    "claima/utils/RequestUtility",
    "claima/utils/CustomValidator",
    "claima/utils/Utility"
], function (Filter, FilterOperator, Sorter, JSONModel, MessageToast, BusyIndicator, Fragment, Constants, DateUtility, ClaimUtility, RequestUtility, CustomValidator, Utility) {
	"use strict";

	return {

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
                                break;
                            }

                            // Bind to existing claim header
                            const oContext = await RequestUtility.getReqHeader(oODataModel, sReqID);

                            const lastModifiedDate = DateUtility.getHanaDate(new Date());

                            oContext.setProperty("LAST_MODIFIED_DATE", lastModifiedDate);
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
                                Utility.getText("msg_claimsubmission_failed", [e.message])
                            );
                            console.error(e);
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
                                break;
                            }

                            // Bind to existing claim header 
                            const oContext = await ClaimUtility.getClaimHeader(oODataModel, sClaimId);

                            const lastModifiedDate = DateUtility.getHanaDate(new Date());
                            oInputModel.setProperty(
                                "/claim_header/last_modified_date",
                                lastModifiedDate
                            );

                            oContext.setProperty("LAST_MODIFIED_DATE", lastModifiedDate);
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
                                Utility.getText("msg_claimsubmission_failed", [e.message])
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
	}
});