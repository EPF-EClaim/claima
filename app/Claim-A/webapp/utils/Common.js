sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator",
    "claima/model/models",
    "claima/utils/ClaimUtility",
    "claima/utils/Constants",
    "claima/utils/CustomValidator",
    "claima/utils/DateUtility",
    "claima/utils/RequestUtility",
    "claima/utils/Utility"
], function (MessageBox, MessageToast, Fragment, BusyIndicator, Models, ClaimUtility, Constants, CustomValidator, DateUtility, RequestUtility, Utility) {
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
                                return;
                            }

                            CustomValidator.init(this._oOwnerComponent, this._oView);
                            if ( !await CustomValidator.validate(Constants.SubmissionTypePrefix.REQUESTHEADER) ) {
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

                        } catch (oError) {
                            MessageToast.show(
                                Utility.getText("msg_claimsubmission_failed")
                            );
                        } finally {
                            BusyIndicator.hide();
                        }
                    }	
                    else {
                        BusyIndicator.hide();
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
                                return;
                            }

                            CustomValidator.init(this._oOwnerComponent, this._oView);
                            if ( !await CustomValidator.validate(Constants.SubmissionTypePrefix.CLAIMHEADER) ) {
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

                        } catch (oError) {
                            MessageToast.show(
                                Utility.getText("msg_claimsubmission_failed")
                            );
                        } finally {
                            BusyIndicator.hide();
                        }
                    }	
                    else {
                        BusyIndicator.hide();
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
                        oEditableFields.setProperty("/startEvent", !bEdit);
                        oEditableFields.setProperty("/endEvent", !bEdit);
                        oEditableFields.setProperty("/location", !bEdit);
                        oEditableFields.setProperty("/comment", !bEdit);
                        oEditableFields.setProperty("/saveHeader", !bEdit);

                        if(oClaimModel.getProperty("/claim_header/request_id")){
                            RequestUtility.init(this._oOwnerComponent, this._oView);
                            const oRequestData = await RequestUtility.getPARHeaderInfo(oClaimModel.getProperty("/claim_header/request_id"));
                            if (!oRequestData.tripStart) {
                                oEditableFields.setProperty("/startTrip", bEdit);
                            }
                            if (!oRequestData.tripEnd) {
                                oEditableFields.setProperty("/endTrip", bEdit);
                            }
                            if (!oRequestData.eventStart) {
                                oEditableFields.setProperty("/startEvent", bEdit);
                            }
                            if (!oRequestData.eventEnd) {
                                oEditableFields.setProperty("/endEvent", bEdit);
                            }
                            if (!oRequestData.altcc) {
                                const sDefaultCostCenter = await ClaimUtility.determineDefaultCostCenter(oClaimModel.getProperty("/claim_header/claim_type_id"))
                                if ( !sDefaultCostCenter && sDefaultCostCenter != null ){
                                    oEditableFields.setProperty("/altCostCenter", bEdit);
                                }
                            }
                        } else {
                            oEditableFields.setProperty("/startTrip", bEdit);
                            oEditableFields.setProperty("/endTrip", bEdit);
                            oEditableFields.setProperty("/startEvent", bEdit);
                            oEditableFields.setProperty("/endEvent", bEdit);
                            const sDefaultCostCenter = await ClaimUtility.determineDefaultCostCenter(oClaimModel.getProperty("/claim_header/claim_type_id"))
                            if ( !sDefaultCostCenter && sDefaultCostCenter != null ){
                                oEditableFields.setProperty("/altCostCenter", bEdit);
                            }
                        }

                        oEditableFields.setProperty("/location", bEdit);
                        oEditableFields.setProperty("/comment", bEdit);
                        oEditableFields.setProperty("/saveHeader", bEdit);
                    }
                    else {	
                        oEditableFields.setData(Models.createClaimHeaderEditableModel().getData(), bEdit);
                    }
                    break;
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    const oReqModel = this._oView.getModel("request");
                    var oEditableFields = this._oView.getModel("reqHeaderEditableModel");
                    const sReqTypeID = oReqModel.getProperty("/req_header/reqtypeid");
                    if (bEdit) {
                        oEditableFields.setProperty("/startEvent", !bEdit);
                        oEditableFields.setProperty("/endEvent", !bEdit);
                        oEditableFields.setProperty("/startEventRequired", !bEdit);
                        oEditableFields.setProperty("/endEventRequired", !bEdit);
                        oEditableFields.setProperty("/startTrip", !bEdit);
                        oEditableFields.setProperty("/endTrip", !bEdit);
                        oEditableFields.setProperty("/location", !bEdit);
                        oEditableFields.setProperty("/altCostCenter", !bEdit);
                        oEditableFields.setProperty("/comment", !bEdit);
                        oEditableFields.setProperty("/saveHeader", !bEdit);

                        if ( sReqTypeID == Constants.RequestType.TRAVEL ) {
                            oEditableFields.setProperty("/startEvent", bEdit);
                            oEditableFields.setProperty("/endEvent", bEdit);
                            RequestUtility.init(this._oOwnerComponent, this._oView);
                            if (await RequestUtility.getEventDateRequired(sReqTypeID)) {
                                oEditableFields.setProperty("/startEventRequired", bEdit);
                                oEditableFields.setProperty("/endEventRequired", bEdit);
                            }
                        }
                        if ( sReqTypeID == Constants.RequestType.TRAVEL || sReqTypeID == Constants.RequestType.REIMBURSEMENT ) {
                            oEditableFields.setProperty("/startTrip", bEdit);
                            oEditableFields.setProperty("/endTrip", bEdit);
                            oEditableFields.setProperty("/location", bEdit);
                            const sDefaultCostCenter = await ClaimUtility.determineDefaultCostCenter(oReqModel.getProperty("/req_header/claimtype"))
                            if ( !sDefaultCostCenter && sDefaultCostCenter != null ){
                                oEditableFields.setProperty("/altCostCenter", bEdit);
                            }
                        }
                        oEditableFields.setProperty("/comment", bEdit);
                        oEditableFields.setProperty("/saveHeader", bEdit);
                    }
                    else {
                        oEditableFields.setData(Models.createClaimHeaderEditableModel().getData(), bEdit);
                    }
                    break;
            }
		},

        /**
		 * Function for Edit button press
		 * 1. Swaps button state
		 * 2. Display fragment based on toggle
		 * 3. Enable or disable header fields to be editable
         * @public
         * @param {string} sClaimType claim type PAR or claim submission
		 * @param {boolean} bToggle toggle for edit or display
         * @param {object} oController parent controller
		 */
		editHeaderChange: async function (sClaimType, bToggle, oController) {		
			await this._showHeaderFormFragment(sClaimType, bToggle, oController);
			await this.setHeaderEditable(sClaimType, bToggle);
		},

        /**
		 * Show Input or Display header fragment based on button toggle
		 * @private
         * @param {string} sClaimType claim type PAR or claim submission
		 * @param {boolean} bEdit toggle for edit or display
         * @param {object} oController parent controller
		 */
		_showHeaderFormFragment: async function (sClaimType, bEdit, oController) {
            switch(sClaimType) {
                case Constants.SubmissionTypePrefix.CLAIMHEADER:
                    var oPage = this._oView.byId("page_claimsubmission");

                    if( bEdit ) {	
                        await this._destroyFragment(sClaimType, "claimsubmission_summary_claimheader", oController);
                        await this._getFormFragment(sClaimType, "claimsubmission_summary_claimheader_edit", oController).then(function (oVBox) {
                            oPage.insertContent(oVBox, 0);
                        });
                    }
                    else {
                        await this._destroyFragment(sClaimType, "claimsubmission_summary_claimheader_edit", oController);
                        await this._getFormFragment(sClaimType, "claimsubmission_summary_claimheader", oController).then(function (oVBox) {
                            oPage.insertContent(oVBox, 0);
                        });
                    }
                    break;
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    var oPage = this._oView.byId("request_form");

                    if( bEdit ) {	
                        await this._destroyFragment(sClaimType, "request_header", oController);
                        await this._getFormFragment(sClaimType, "request_header_edit", oController).then(function (oVBox) {
                            oPage.insertContent(oVBox, 0);
                        });
                        
                    }
                    else {
                        await this._destroyFragment(sClaimType, "request_header_edit", oController);
                        await this._getFormFragment(sClaimType, "request_header", oController).then(function (oVBox) {
                            oPage.insertContent(oVBox, 0);
                        });
                    }
                    break;
            }
		},

        /**
         * Destroy selected fragment
         * @private
         * @param {string} sClaimType claim type PAR or claim submission
         * @param {string} sFrag fragment name to be deleted
         * @param {object} oController parent controller
         */
		_destroyFragment: async function (sClaimType, sFrag, oController) {
            switch(sClaimType){
                case Constants.SubmissionTypePrefix.CLAIMHEADER:
                    var oPage = this._oView.byId("page_claimsubmission");
                    var oFragment = await oController._fragments[sFrag];
                    oPage.removeContent(oFragment);
                    oFragment.destroy(true);

                    delete oController._fragments[sFrag];
                break;
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    var oPage = this._oView.byId("request_form");
                    var oFragment = await oController._oFragments[sFrag];
                    oPage.removeContent(oFragment);
                    oFragment.destroy(true);

                    delete oController._oFragments[sFrag];
                break;
            }
		},

        /**
         * Display fragment with name
         * @private
         * @param {string} sClaimType claim type PAR or claim submission
         * @param {string} sName fragment name to be displayed
         * @param {object} oController parent controller
         * @returns 
         */
        async _getFormFragment(sClaimType, sName, oController) {
            const oView = this._oView;
            switch(sClaimType){
                case Constants.SubmissionTypePrefix.CLAIMHEADER:
                    if (oController._fragments[sName]) {
                        return oController._fragments[sName];
                    }
                    else {
                        oController._fragments[sName] = Fragment.load({
                            id: oView.getId(),
                            name: "claima.fragment." + sName,
                            type: "XML",
                            controller: oController
                        }).then((oFrag) => {
                            oView.addDependent(oFrag);
                            return oFrag;
                        });
                        return oController._fragments[sName];
                    }
                    break;
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    if (!oController._oFragments[sName]) {
                        oController._oFragments[sName] = Fragment.load({
                            id: oView.getId(),
                            name: "claima.fragment." + sName,
                            type: "XML",
                            controller: oController
                        }).then((oFrag) => {
                            oView.addDependent(oFrag);
                            return oFrag;
                        });
                    }
                    return oController._oFragments[sName];
                    break;
            }
		},

	}
});