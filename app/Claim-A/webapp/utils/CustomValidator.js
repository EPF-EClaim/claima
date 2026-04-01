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
        
        validate: function (sSubmissionType) {
            // Retrieve the model for checking from this._oOwnerComponent
            // Common validations (Applicable for both scenarios)

            // Type and Item Type checking (Applicable for both scenarios)

            // Scenario-based checking (Only limited to certain submission type)
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    break;
                case Constants.SubmissionTypePrefix.CLAIM:
                    break;
            }
        }
    };
});