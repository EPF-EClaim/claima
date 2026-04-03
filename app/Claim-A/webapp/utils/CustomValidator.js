sap.ui.define([
    "claima/utils/Constants"
], function (Constants) {
    "use strict";

    return {
        /**
		 * Initialize the Utility 
		 * @public
		 */
        init: function(oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
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
                    var oInputModel = this._oOwnerComponent.getView().getModel("claimitem_input");
                    
                    
                    if (oInputModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.TELEFON_B) {
                        if(!oInputModel.getProperty("/claim_item/disclaimer")) {
                            return false;
                        }
                    }

                    if (oInputModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.GALAKAN) {
                        if(!oInputModel.getProperty("/claim_item/disclaimer_galakan")) {
                            return false;
                        }
                    }
                    break;
            }
            return true;
        }
    };
});