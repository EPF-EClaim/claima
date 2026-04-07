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
                                return false; 
                            } else if (fEnteredAmount < 0.00) {
                                MessageBox.error(Utility.getText("req_d_e_neg_amount"));
                                return false; 
                            }
                        }
                    }
                    break;
                case Constants.SubmissionTypePrefix.CLAIM:   
                    var oClaimSubmissionModel = this._oView.getModel("claimsubmission_input");
                    var oInputModel = this._oView.getModel("claimitem_input");
                    
                    if (!!oInputModel?.getProperty("/claim_item/claim_type_item_id")) {
                        switch (oInputModel.getProperty("/claim_item/claim_type_item_id")) {
                            case Constants.ClaimTypeItem.TELEFON_B:
                                if(!oInputModel.getProperty("/claim_item/disclaimer")) {
                                    MessageBox.error(Utility.getText("msg_claimdetails_no_check_disclaimer"));
                                    return false;
                                }
                                break;
                            
                            case Constants.ClaimTypeItem.GALAKAN:
                                if(!oInputModel.getProperty("/claim_item/disclaimer_galakan")) {
                                    MessageBox.error(Utility.getText("msg_claimdetails_no_check_disclaimer"));
                                    return false;
                                }
                                break;

                            default:
                                break;
                        }
                    }

                    if(oInputModel.getProperty("/claim_item/receipt_date") < oClaimSubmissionModel.getProperty("/claim_header/trip_start_date") ){
                    	const bProceed = await this.onDateValidation();

                        if (!bProceed) {
                            return false;
                        }
                    }
                    

                    if (!!oClaimSubmissionModel) {
                        // course code pre-check
                        if (Object.values(Constants.ClaimTypeKursus).includes(oClaimSubmissionModel.getProperty("/claimtype/type"))) {
                            var bCourseAlreadyApproved = await ClaimUtility.checkExistingCourseCode(oClaimSubmissionModel.getProperty("/claimtype/course_code"), oClaimSubmissionModel.getProperty("/emp_master/eeid"));
                            if (bCourseAlreadyApproved) {
                                MessageBox.error(Utility.getText("error_msg_course_already_approved", [oClaimSubmissionModel.getProperty("/claimtype/course_code"), oClaimSubmissionModel.getProperty("/claimtype/descr/course_code")]));
                                return false;
                            }
                        }
                    }

                    if (!!oClaimSubmissionModel?.getProperty("/claim_items")) {
                        var aItems = oClaimSubmissionModel.getProperty("/claim_items") || [];
                        for(var i = 0; i < aItems.length; i++){
                            if(aItems[i].amount == 0){
                                MessageBox.error(Utility.getText("msg_claimsubmission_invalid_amount_in_claim_item"));
                                return false;
                            }
                        }
                    }

                    
            }
            return true;
        },

        _onReceiptCheck: function(){
			return new Promise(function(resolve){
				MessageBox.warning(Utility.getText("msg_claimdeatils_receipt_date_before_trip_start_date"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: resolve
				});
			});
		},

        
        onDateValidation: function() {
                return new Promise((oResolve) => {
                    MessageBox.warning(
                        Utility.getText("msg_claimdeatils_receipt_date_before_trip_start_date"),
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