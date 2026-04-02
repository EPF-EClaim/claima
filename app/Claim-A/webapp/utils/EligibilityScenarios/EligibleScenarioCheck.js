sap.ui.define([

], function () {
    "use strict";
    return {
        /**
         * Drill down of eligibility scenarios for each claim type after retrieving employee and eligibility rules data
         * @public
         * @param {Object} oModel - Object Model from Controller;
         * @param {Array} aPayload - Array of Payload data with ClaimType, ClaimItmType, List Array of fields to be checked;
         * @returns {Object} Object Payload with results field in CheckFields List Array populated
         */
        onEligibilityCheck: async function (oModel, aPayload) {
            //Call CAP action 
            const oAction = oModel.bindContext("/EligibilityCheck(...)");
            let oReturnPayload = aPayload;
            oAction.setParameter("aPayload", oReturnPayload);
            
            try {
                await oAction.execute();
				const oResponse = oAction.getBoundContext().getObject();
				const oReturnPayload = oResponse.value;
            } catch (oError) {
                MessageBox.error(Utility.getText("msg_failed_generic_error", [oError]))
            }

            // Return Payload with Result Populated for front end validation
            return oReturnPayload;
        }

    };

});
