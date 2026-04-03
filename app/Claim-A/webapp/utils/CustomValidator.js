sap.ui.define([
    "sap/m/MessageBox",
    "claima/utils/Constants",
    "claima/utils/Utility"
], function (
    MessageBox,
    Constants,
    Utility
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
        validate: function (sSubmissionType) {
            // Common validations (Applicable for both scenarios)

            // Type and Item Type checking (Applicable for both scenarios)

            // Scenario-based checking (Only limited to certain submission type)
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    break;
                case Constants.SubmissionTypePrefix.CLAIM:   
                    var oInputModel = this._oView.getModel("claimitem_input");
                    var oClaimSubmissionModel = this._oView.getModel("claimsubmission_input");

                    if (oInputModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.TELEFON_B) {
                        if(!oInputModel.getProperty("/claim_item/disclaimer")) {
                            MessageBox.error(Utility.getText("msg_claimdetails_no_check_disclaimer"));
                            return false;
                        }
                    }

                    if (oInputModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.GALAKAN) {
                        if(!oInputModel.getProperty("/claim_item/disclaimer_galakan")) {
                            MessageBox.error(Utility.getText("msg_claimdetails_no_check_disclaimer"));
                            return false;
                        }
                    }
                
                    var aItems = oClaimSubmissionModel.getProperty("/claim_items") || [];
                    for(var i = 0; i < aItems.length; i++){
                        if(aItems[i].amount == 0){
                            MessageBox.error(Utility.getText("msg_claimsubmission_invalid_amount_in_claim_item"));
                            return false;
                        }
                    }
                    break;
            }
            return true;
        }
    };
});