sap.ui.define([
    "sap/m/MessageBox",
    "claima/utils/Constants",
    "claima/utils/Utility",
    "claima/utils/ClaimUtility"
], function (
    MessageBox,
    Constants,
    Utility,
    ClaimUtility
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
                    
                    if (!!oInputModel && sClaimTypeItem === Constants.ClaimTypeItem.E_PENGAKUT) {
                        // check if previous claim with elaun pengangkutan has already been approved
                        var bClaimExists = await ClaimUtility.fetchClaimElaunPengangkutan();
                        if (bClaimExists) {
                            MessageBox.error(Utility.getText("error_msg_epengakut_already_approved"));
                            bCanProceed = false;
                        }
                    }
                    
                    if (!!oClaimSubmissionModel) {
                        // course code pre-check
                        var sClaimType = oClaimSubmissionModel.getProperty("/claim_header/claim_type_id") || oClaimSubmissionModel.getProperty("/claimtype/type");
                        var sCourseCode = oClaimSubmissionModel.getProperty("/claim_header/course_code") || oClaimSubmissionModel.getProperty("/claimtype/course_code/course_id");
                        var sCourseCodeDesc = oClaimSubmissionModel.getProperty("/claim_header/descr/course_code") || oClaimSubmissionModel.getProperty("/claimtype/course_code/course_desc");
                        var sSessionNumber = oClaimSubmissionModel.getProperty("/claim_header/session_number") || oClaimSubmissionModel.getProperty("/claimtype/course_code/session_number");
                        if (Object.values(Constants.ClaimTypeKursus).includes(sClaimType)) {
                            var bCourseAlreadyApproved = await ClaimUtility.checkExistingCourseCode(sCourseCode, sSessionNumber, this._oOwnerComponent.getModel("session").getProperty("/userId"));
                            if (bCourseAlreadyApproved) {
                                MessageBox.error(Utility.getText("error_msg_course_already_approved", [sCourseCode, sCourseCodeDesc]));
                                bCanProceed = false;
                            }
                        }
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
        }
 
    };
});