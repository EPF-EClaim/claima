sap.ui.define([
    // "sap/ui/core/UIComponent",
    "sap/fe/core/AppComponent",
    "claima/model/models"
    ], 
    // (UIComponent, 
    (AppComponent, 
        models) => {
    "use strict";

    // return UIComponent.extend("claima.Component", {
   return AppComponent.extend("claima.Component", {
        metadata: {
            manifest: "json"
            // ,
            // interfaces: [
            //     "sap.ui.core.IAsyncContentCreation"
            // ]
        },

        init() {
            // call the base component's init function
            // UIComponent.prototype.init.apply(this, arguments);
            AppComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

        }
    });
});
