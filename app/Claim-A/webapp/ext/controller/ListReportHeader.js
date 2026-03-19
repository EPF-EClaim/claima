sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], function(MessageToast, History) {
    'use strict';

    return {
        /**
         * Generated event handler.
         *
         * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
         * @param aSelectedContexts the selected contexts of the table rows.
         */
        onClickBack: function(oContext, aSelectedContexts) {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = oContext.getView()
                                     .getController()
                                     .getOwnerComponent()
                                     .getRouter();
                oRouter.navTo("Configuration", {}, true);
            }
        
        }
    };
});
