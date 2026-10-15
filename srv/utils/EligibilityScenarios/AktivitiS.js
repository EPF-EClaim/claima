const { Constant } = require("../constant");
const ComparisonOperators = require("../ComparisonOperators");

module.exports = {

    /**
     * Main entry point for the eligibility check.
     * Finds the rule that matches the claim item, then validates the user input against it.
     *
     * @public
     * @param {Object} oPayload - User input sent from the frontend
     * @param {Array<Object>} aRules - Eligibility rules for this claim type item (from ZELIGIBILITY_RULE)
     * @returns {Object} The same payload, with `result` set on each validated field
     */
    onEligibleCheck: function (oPayload, aRules) {
        // Turn CheckFields into a simple object so we don't search the array repeatedly
        const oParsed = this._parsePayload(oPayload);

        // Pick the rule that applies to this claim item
        const oRule = this._findRule(oPayload.ClaimTypeItem, aRules, oParsed);

        // Validate the input; results are written straight into oPayload.CheckFields
        this._validateClaimItem(oRule, oPayload);

        return oPayload;
    },

    /**
     * Finds the eligibility rule that applies to the claim item.
     * Some claim items have several rules, so a user input value is used to pick the right one.
     * Any other claim item has a single rule, so the first rule is returned.
     *
     * @private
     * @param {string} sItem - Claim type item ID
     * @param {Array<Object>} aRules - Eligibility rules for this claim type item
     * @param {Object} oParsed - Parsed user input from _parsePayload
     * @returns {Object|undefined} The matching rule, or undefined if none matches
     */
    _findRule: function (sItem, aRules, oParsed) {
        switch (sItem) {
            // JENAZAH: one rule per funeral transportation type
            case Constant.ClaimTypeItem.JENAZAH:
                return aRules.find(r => r.TRANSPORT_PASSING_ID === oParsed.sTransportPassingId);

            // KEMATIAN: one rule per dependent type
            case Constant.ClaimTypeItem.KEMATIAN:
                return aRules.find(r => r.DEPENDENT_TYPE_ID === oParsed.sDependentTypeId);

            // All other items: only one rule exists
            default:
                return aRules[0];
        }
    },

    /**
     * Reads the values needed to choose a rule from oPayload.CheckFields.
     * Returns them as a simple object so they can be used directly.
     *
     * @private
     * @param {Object} oPayload - User input sent from the frontend
     * @param {Array<{fieldName: string, value: *}>} oPayload.CheckFields - Fields entered by the user
     * @returns {{sTransportPassingId: (string|undefined), sDependentTypeId: (string|undefined)}}
     *          The selected values; undefined if the field was not sent
     */
    _parsePayload: function (oPayload) {
        var sTransportPassingId, sDependentTypeId;

        for (let i = 0; i < oPayload.CheckFields.length; i++) {
            switch (oPayload.CheckFields[i].fieldName) {
                // Used by JENAZAH to find its rule
                case Constant.EntitiesFields.FUNERAL_TRANSPORTATION:
                    sTransportPassingId = oPayload.CheckFields[i].value;
                    break;

                // Used by KEMATIAN to find its rule
                case Constant.EntitiesFields.DEPENDENT_TYPE:
                    sDependentTypeId = oPayload.CheckFields[i].value;
                    break;
            }
        }

        return { sTransportPassingId, sDependentTypeId };
    },

    /**
     * Checks the user input against the matched rule.
     * The result (true = eligible, false = not eligible) is written to the field's `result` property.
     *
     * @private
     * @param {Object|undefined} oRule - Matched eligibility rule; undefined if no rule was found
     * @param {Object} oPayload - User input sent from the frontend (updated in place)
     * @returns {void}
     */
    _validateClaimItem: function (oRule, oPayload) {
        switch (oPayload.ClaimTypeItem) {
            // KEMATIAN and JENAZAH use the same amount check
            case Constant.ClaimTypeItem.KEMATIAN:
            case Constant.ClaimTypeItem.JENAZAH: {
                const oField = oPayload.CheckFields.find(
                    f => f.fieldName === Constant.EntitiesFields.ELIGIBLE_AMOUNT
                );
                
                if (!oField) return;

                oField.result = !!oRule && (
                    oRule.ELIGIBLE_AMOUNT == Constant.UnlimitedAmount ||
                    ComparisonOperators.LesserEquals(oField.value, parseFloat(oRule.ELIGIBLE_AMOUNT))
                );
                break;
            }
        }
    }
};