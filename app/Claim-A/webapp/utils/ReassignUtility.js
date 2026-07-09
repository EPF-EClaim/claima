sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (MessageBox, MessageToast) {
    "use strict";
    return {
        /**
         * Iterates through rows and calls a custom backend action to save directly to the table
         * @param {array} aTableItems - Array of sap.m.ColumnListItem elements from the popup table
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - The active OData V4 Model instance
         * @returns {Promise} Resolves when all updates complete successfully
         */
        saveApproverData: function (aTableItems, oModel) {
            var aPayloadItems = aTableItems.map(function (oItem) {
                var oContext = oItem.getBindingContext(); 
                if (!oContext) { return null; }
                return oContext.getObject();
            }).filter(Boolean);

            if (aPayloadItems.length === 0) {
                return Promise.resolve("No records to save");
            }
            var oOperation = oModel.bindContext("/saveApproverData(...)");
            oOperation.setParameter("items", aPayloadItems);
            return oOperation.execute().then(function () {
                return "Success";
            });
        }
    };
});