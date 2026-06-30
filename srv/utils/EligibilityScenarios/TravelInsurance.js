const { Constant } = require("../constant");
const ComparisonOperators = require('../ComparisonOperators');
const e = require("express");
module.exports = {
    /**
         * main function for eligibility check - to find the matching eligibility rule and call validateClaimItem function to validate against the rule
         * @public
         * @param {Object} oPayload - payload contains user input passed from frontend
         * @param {Array} aRules - list of eligibility rule from backend
         * @param {Object} tx - CDS Transaction
         * @returns {Object} oPayload - return original payload but with result field filled
         */
    onEligibleCheck: async function (oPayload, aRules, tx) {
        var oRule = aRules[0];
        await this._validateClaimItem(oRule, oPayload, tx);
        return oPayload;
    },

    /**
    * Validates claim item against eligibility rule
    * @private
    * @param {Object} oRule - matched eligibility rule from aRules
    * @param {Object} oPayload - original payload from user input
    * @param {Object} tx - CDS Transaction
    */
    _validateClaimItem: async function (oRule, oPayload, tx) {
        var iIndex;
        switch (oPayload.ClaimTypeItem) {
            case Constant.ClaimTypeItem.TRAVEL_INSURANCE: {
                try {
                    const oCountryNotAllowed = await tx.run(
                        SELECT.one.from(Constant.Entities.ZCONSTANTS)
                            .where({ ID: Constant.ConstantId.EXCEPTION_COUNTRY_TRAVEL_INSURANCE })                           
                    );
                    //Check if country is in the exception list
                    iIndex = oPayload.CheckFields.findIndex(
                        field => field.fieldName === Constant.EntitiesFields.COUNTRY
                    );
                    if (iIndex !== -1) {
                        if (!oRule) {
                            oPayload.CheckFields[iIndex].result = false;
                        } else if (oCountryNotAllowed && oCountryNotAllowed.VALUE) {
                            const sRawValue = oCountryNotAllowed.VALUE.trim();
                            const sCleanedValue = sRawValue.replace(/[\[\]"]/g, ''); 
                            const aCountries = sCleanedValue
                                .split(',')
                                .map(c => c.trim().toLowerCase());
                            const sCountry = oPayload.CheckFields[iIndex].value?.trim().toLowerCase();
                            oPayload.CheckFields[iIndex].result = !aCountries.includes(sCountry);
                        } else {
                            oPayload.CheckFields[iIndex].result = true;
                        }
                    }
                } catch (err) {
                    console.error('Error in validation:', err);
                }

                //Check for the claim limit based on insurance package
                iIndex = oPayload.CheckFields.findIndex((field) => field.fieldName == Constant.EntitiesFields.ELIGIBLE_AMOUNT);
                if (iIndex == -1) return;
                if (!oRule) {
                    oPayload.CheckFields[iIndex].result = false;
                } else {
                    if (oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount) {
                        oPayload.CheckFields[iIndex].result = true;
                    } else {// if user input has amount 100 while Rules table has max amount 300 (iMaxAmountEligible), return true
                        // if user input has amount 1000 while Rules table has max amount 300 (iMaxAmountEligible), return iMaxAmountEligible (300)
                        console.log(oPayload.CheckFields[iIndex].value, parseFloat(oRule.ELIGIBLE_AMOUNT));
                        oPayload.CheckFields[iIndex].result = ComparisonOperators.LesserEquals(oPayload.CheckFields[iIndex].value, parseFloat(oRule.ELIGIBLE_AMOUNT));
                    }
                }
                break;
            }
        }
    }
}
