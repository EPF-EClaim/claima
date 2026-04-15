sap.ui.define([
    "sap/m/MessageBox",
    "claima/utils/Constants",
    "claima/utils/ClaimUtility",
    "claima/utils/Utility",
    "claima/utils/RequestUtility"
], function (
    MessageBox,
    Constants,
    ClaimUtility,
    Utility,
    RequestUtility
) {
    "use strict";

    return {
        /**
		 * Initialize the Utility 
		 * @public
		 */
        init: function(oOwnerComponent,oView) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
		},
        
        /**
         * Validates all common and scenario-specific rules during submission
         *
         * This method retrieves the necessary validation data from
         * `this._oOwnerComponent`, including both common fields and scenario-based
         * input values. It is to ensure data consistency before proceeding with submission or
         * further processing.
         * @public
         */
        validate: async function (sSubmissionType) {
            var bCanProceed = true;
            // Common validations (Applicable for both scenarios)

            // Type and Item Type checking (Applicable for both scenarios)

            // Scenario-based checking (Only limited to certain submission type)
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:

                    var oReqModel = this._oOwnerComponent.getModel("request");
                    var sClaimTypeItem = oReqModel.getProperty("/req_item/claim_type_item_id");
                    
                    // HANDPHONE | TELEFON_B
                    if (sClaimTypeItem === Constants.ClaimTypeItem.TELEFON_B) {
                        
                        var aParticipants = oReqModel.getProperty("/participant") || [];
                        var fMaxLimit = 100.00;

                        for (var p = 0; p < aParticipants.length; p++) {
                            var fEnteredAmount = parseFloat(aParticipants[p].ALLOCATED_AMOUNT || 0);

                            if (fEnteredAmount > fMaxLimit) {
                                MessageBox.error(Utility.getText("req_d_e_capped_amount", [fMaxLimit.toFixed(2)]));
                                bCanProceed = false; 
                            } else if (fEnteredAmount < 0.00) {
                                MessageBox.error(Utility.getText("req_d_e_neg_amount"));
                                bCanProceed = false; 
                            }
                        }
                    }
                    break;
                case Constants.SubmissionTypePrefix.CLAIM:   
                    var oClaimSubmissionModel = this._oView.getModel("claimsubmission_input");
                    var oInputModel = this._oView.getModel("claimitem_input");
                    var sClaimTypeItem = oInputModel ? oInputModel.getProperty("/claim_item/claim_type_item_id") : null;
                    
                    if (!!sClaimTypeItem) {
                        switch (sClaimTypeItem) {
                            case Constants.ClaimTypeItem.TELEFON_B:
                                if(!oInputModel.getProperty("/claim_item/disclaimer")) {
                                    MessageBox.error(Utility.getText("msg_claimdetails_no_check_disclaimer"));
                                    bCanProceed = false;
                                }
                                break;
                            case Constants.ClaimTypeItem.MATAWANG:
                                if(!oInputModel.getProperty("/claim_item/amount")) {
                                    MessageBox.error(Utility.getText("msg_claimsubmission_invalid_amount_in_claim_item"));
                                    bCanProceed = false;
                                }
                                break;
                            default:
                                break;
                        }
                    }

                    if (Object.values(Constants.ClaimTypeItemMakan).includes(sClaimTypeItem)) {
                        var nEntBfast = oInputModel.getProperty("/claim_item/travel_duration_day") - oInputModel.getProperty("/claim_item/provided_breakfast");
                        var nEntLunch = oInputModel.getProperty("/claim_item/travel_duration_day") - oInputModel.getProperty("/claim_item/provided_lunch");
                        var nEntDinner = oInputModel.getProperty("/claim_item/travel_duration_day") - oInputModel.getProperty("/claim_item/provided_dinner");
                        if (nEntBfast < 0 || nEntLunch < 0 || nEntDinner < 0) {
                            MessageBox.error(Utility.getText("msg_provided_meal_exceed"));
                            bCanProceed = false
                        }
                    }

                    if(oInputModel?.getProperty("/claim_item/receipt_date") < oClaimSubmissionModel?.getProperty("/claim_header/trip_start_date") ){
                    	const bConfirm = await this.onShowConfirmation(Utility.getText("msg_claimdeatils_receipt_date_before_trip_start_date"));
                        if (!bConfirm) {
                            bCanProceed = false;
                        }
                    }

                    if(!!oInputModel?.getProperty("/claim_item/receipt_date") && !!oClaimSubmissionModel?.getProperty("/claim_header/trip_end_date")) {
                        var dTripEndDate = new Date(oClaimSubmissionModel.getProperty("/claim_header/trip_end_date")).toLocaleDateString('en-CA');
                        var dReceiptDate = new Date(oInputModel.getProperty("/claim_item/receipt_date")).toLocaleDateString('en-CA');

                        if (dReceiptDate > dTripEndDate) {
                            MessageBox.error(Utility.getText("msg_claimsubmission_invalid_receipt_date"));
                            bCanProceed = false;
                        }
                    }

                    if(!!oInputModel?.getProperty("/claim_item/departure_time") && !!oInputModel?.getProperty("/claim_item/arrival_time")){
                        const dDepartureTime = new Date(oInputModel.getProperty("/claim_item/departure_time"));
                        const dArrivalTime = new Date(oInputModel.getProperty("/claim_item/arrival_time"));
                        const iDiffMs = dArrivalTime.getTime() - dDepartureTime.getTime();

                        if (iDiffMs < 0) {
                            MessageBox.error(Utility.getText("req_d_e_arrival_time_departure_time"));
                            bCanProceed = false;
                        }
                    }
                    
                    if (!!oInputModel && sClaimTypeItem === Constants.ClaimTypeItem.E_PENGAKUT) {
                        // check if previous claim with elaun pengangkutan has already been approved; if found, return message based on status
                        var sClaimStatus = await ClaimUtility.fetchUserClaimStatusElaunPengangkutan();
                        if (!!sClaimStatus) {
                            switch (sClaimStatus) {
                                case Constants.ClaimStatus.APPROVED:
                                    MessageBox.error(Utility.getText("error_msg_epengakut_already_approved"));
                                    bCanProceed = false;
                                    break;
                                case Constants.ClaimStatus.PENDING_APPROVAL:
                                    MessageBox.error(Utility.getText("error_msg_epengakut_already_pending"));
                                    bCanProceed = false;
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                    
                    if (!!oClaimSubmissionModel) {
                        var sClaimType = oClaimSubmissionModel ? oClaimSubmissionModel.getProperty("/claim_header/claim_type_id") || oClaimSubmissionModel.getProperty("/claimtype/type") : null;
                        if (Object.values(Constants.ClaimTypeKursus).includes(sClaimType)) {
                            // course code pre-check
                            var sCourseCode = oClaimSubmissionModel.getProperty("/claim_header/course_code") || oClaimSubmissionModel.getProperty("/claimtype/course_code/course_id");
                            var sSessionNumber = oClaimSubmissionModel.getProperty("/claim_header/session_number") || oClaimSubmissionModel.getProperty("/claimtype/course_code/session_number");
                            var bCourseAlreadyApproved = await ClaimUtility.checkExistingCourseCode(sCourseCode, sSessionNumber, this._oOwnerComponent.getModel("session").getProperty("/userId"));
                            if (bCourseAlreadyApproved) {
                                MessageBox.error(Utility.getText("error_msg_course_already_approved"));
                                bCanProceed = false;
                            }
                        }
                        // validate date range
			            //// trip start/end date
                        if (!this._isValidDateRange(oClaimSubmissionModel.getProperty("/claim_header/trip_start_date"), oClaimSubmissionModel.getProperty("/claim_header/trip_end_date"))) {
                            // stop claim submission if incomplete
                            bCanProceed = false;
                        }
                        //// event start/end date (optional)
                        if (oClaimSubmissionModel.getProperty("/claim_header/event_start_date") || oClaimSubmissionModel.getProperty("/claim_header/event_end_date")) {
                            if (!this._isValidDateRange(oClaimSubmissionModel.getProperty("/claim_header/event_start_date"), oClaimSubmissionModel.getProperty("/claim_header/event_end_date"))) {
                                // stop claim submission if incomplete
                                bCanProceed = false;
                            }
                        }
                    }

                    // // validate item date range
                    if (!!oInputModel?.getProperty("/claim_item/start_date") || !!oInputModel?.getProperty("/claim_item/end_date")) {
                        if (!this._isValidDateRange(oInputModel.getProperty("/claim_item/start_date"), oInputModel.getProperty("/claim_item/end_date"))) {
                            // stop claim details if incomplete
                            bCanProceed = false;
                        }
                    }
                    
                    if (!!oInputModel?.getProperty("/claim_item/amount") == 0) {
                        MessageBox.error(Utility.getText("msg_claimdetails_invalid_amount"));
                        bCanProceed = false;
                        break;
                    }

                    if (!!oClaimSubmissionModel?.getProperty("/claim_items")) {
                        var aItems = oClaimSubmissionModel.getProperty("/claim_items") || [];
                        for(var i = 0; i < aItems.length; i++){
                            if(aItems[i].amount == 0){
                                MessageBox.error(Utility.getText("msg_claimsubmission_invalid_amount_in_claim_item"));
                                bCanProceed = false;
                                break;
                            }
                        }
                    }
                    break;
                case Constants.SubmissionTypePrefix.REQUESTHEADER:
                    var oReqModel = this._oOwnerComponent.getModel("request");
                    if (!this._isValidDateRange(oReqModel.getProperty("/req_header/tripstartdate"), oReqModel.getProperty("/req_header/tripenddate"))) {
                        // stop claim submission if incomplete
                        bCanProceed = false;
                    }
                    RequestUtility.init(this._oOwnerComponent, this._oView)
                    const bIsEventDateRequired = RequestUtility.getEventDateRequired(oReqModel.getProperty("/req_header/reqtypeid"));
                    //// event start/end date (optional)
                    if (oReqModel.getProperty("/req_header/eventstartdate") || oReqModel.getProperty("/req_header/eventenddate") || bIsEventDateRequired) {
                        if (!this._isValidDateRange(oReqModel.getProperty("/req_header/eventstartdate"), oReqModel.getProperty("/req_header/eventenddate"))) {
                            // stop claim submission if incomplete
                            bCanProceed = false;
                        }
                    }
                    break;
                case Constants.SubmissionTypePrefix.CLAIMHEADER:   
                    var oClaimSubmissionModel = this._oView.getModel("claimsubmission_input");

                    if (!!oClaimSubmissionModel) {
                        if (!this._isValidDateRange(oClaimSubmissionModel.getProperty("/claim_header/trip_start_date"), oClaimSubmissionModel.getProperty("/claim_header/trip_end_date"))) {
                            // stop claim submission if incomplete
                            bCanProceed = false;
                        }
                        //// event start/end date (optional)
                        if (oClaimSubmissionModel.getProperty("/claim_header/event_start_date") || oClaimSubmissionModel.getProperty("/claim_header/event_end_date")) {
                            if (!this._isValidDateRange(oClaimSubmissionModel.getProperty("/claim_header/event_start_date"), oClaimSubmissionModel.getProperty("/claim_header/event_end_date"))) {
                                // stop claim submission if incomplete
                                bCanProceed = false;
                            }
                        }

                        var sClaimType = oClaimSubmissionModel ? oClaimSubmissionModel.getProperty("/claim_header/claim_type_id") || oClaimSubmissionModel.getProperty("/claimtype/type") : null;
                        if (Object.values(Constants.ClaimTypeKursus).includes(sClaimType)) {
                            // course code pre-check
                            var sCourseCode = oClaimSubmissionModel.getProperty("/claim_header/course_code") || oClaimSubmissionModel.getProperty("/claimtype/course_code/course_id");
                            var sSessionNumber = oClaimSubmissionModel.getProperty("/claim_header/session_number") || oClaimSubmissionModel.getProperty("/claimtype/course_code/session_number");
                            var bCourseAlreadyApproved = await ClaimUtility.checkExistingCourseCode(sCourseCode, sSessionNumber, this._oOwnerComponent.getModel("session").getProperty("/userId"));
                            if (bCourseAlreadyApproved) {
                                MessageBox.error(Utility.getText("error_msg_course_already_approved"));
                                bCanProceed = false;
                            }
                        }
                    }
                    break;
            }
            return bCanProceed;
            
        },        
        onShowConfirmation: function(sPromptMessage) {
                return new Promise((oResolve) => {
                    MessageBox.warning(
                        sPromptMessage,
                        {
                            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                            emphasizedAction: MessageBox.Action.OK,

                            onClose: function (sAction) {
                                if (sAction === MessageBox.Action.OK) {
                                    oResolve(true);    
                                } else {
                                    oResolve(false); 
                                }
                            }
                        }
                    );
                });
            return Promise.resolve(true);
        },

        /**
         * Check if start and end dates are empty
         * Check if start date is set before end date
         * @private
         * @param {string} sStartdate start date to be checked
         * @param {string} sEnddate end date to be checked
         * @returns {boolean} if start and end dates are valid, returns true, if dates are invalid, returns false
         */
        _isValidDateRange: function (sStartdate, sEnddate) {
			// check for missing value
			if (!sStartdate || !sEnddate) {
                MessageBox.error(Utility.getText("msg_daterange_missing"));
                return false;
            }
            else {
                // check if values can be converted to valid dates
                if (isNaN(new Date(sStartdate).getTime()) || isNaN(new Date(sEnddate).getTime())) {
                    MessageBox.error(Utility.getText("msg_daterange_missing"));
                    return false;
                }
            }

			// check if end date earlier than start date
			if (new Date(sStartdate) > new Date(sEnddate)) {
                MessageBox.error(Utility.getText("msg_daterange_order"));
                return false;
            }
			return true;
		},
 
    };
});