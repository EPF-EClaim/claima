const { Constant } = require("../constant");

module.exports = {
    /**
     * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
     * @public
     * @param {Object} oPayload - payload contains user input passed from frontend
     * @param {Object} oEmp - Employee Data
     * @returns {Object} oPayload - return original payload but with result field filled
     */
    onEligibleCheck: async function (oPayload, oEmp) {
        this._validateClaimItem(oPayload, oEmp);
        return oPayload;
    },
    /**
     * Validates claim item against eligibility rule
     * @private
     * @param {Object} oPayload - original payload from user input
     * @param {Object} oEmp - Employee Data
     */
    _validateClaimItem: function (oPayload, oEmp) {
        var iIndex;
        switch (oPayload.ClaimTypeItem) {
            case Constant.ClaimTypeItem.GALAKAN:
                iIndex = null;
                // GALAKAN - return true if Confirmation Date in ZEMP_MASTER is before or equal to trip start date (PAR) or receipt date (Claim)
                iIndex = oPayload.CheckFields.findIndex(
                    (field) => field.fieldName == Constant.EntitiesFields.RECEIPT_DATE,
                );

                if (oEmp.CONFIRMATION_DATE &&
                    oPayload.CheckFields[iIndex].value) {
                    if (new Date(oPayload.CheckFields[iIndex].value) >= new Date(oEmp.CONFIRMATION_DATE)) {
                        oPayload.CheckFields[iIndex].result = true;
                    }
                    else {
                        oPayload.CheckFields[iIndex].result = false;
                    }
                } else {
                    oPayload.CheckFields[iIndex].result = false;
                }

                break;
        }
    }
};
