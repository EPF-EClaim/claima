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
        saveApproverData: function (aTableItems, oModel, sComment) {
            var aPayloadItems = aTableItems.map(function (oItem) {
                var oContext = oItem.getBindingContext(); if (!oContext) { return null; }
                var sNewApproverId = "";
                try {
                    sNewApproverId = oContext.getProperty("NEW_APPROVER_ID") || "";
                } catch (e) {
                    sNewApproverId = "";
                }
                return {
                    ID: oContext.getProperty("ID"),
                    LEVEL: parseInt(oContext.getProperty("LEVEL"), 10),
                    APPROVER_ID: oContext.getProperty("APPROVER_ID"),
                    APPROVER_NAME: oContext.getProperty("APPROVER_NAME"),
                    NEW_APPROVER_ID: sNewApproverId,
                    STATUS: oContext.getProperty("STATUS"),
                    REQUEST_DATE: oContext.getProperty("REQUEST_DATE")
                };
            }).filter(Boolean);
            if (aPayloadItems.length === 0) {
                return Promise.resolve("No records to save");
            }
            var oOperation = oModel.bindContext("/reassignApprover(...)");
            oOperation.setParameter("payload", aPayloadItems);
            oOperation.setParameter("comment", sComment || "");
            return oOperation.execute().then(function () {
                return "Success";
            });
        }
    };
});