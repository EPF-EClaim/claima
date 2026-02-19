sap.ui.define([
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

                const fmt = sap.ui.getCore().getConfiguration().getFormatSettings();
                fmt.setDatePattern("medium", "dd MMM yyyy"); 
                fmt.setDatePattern("short", "dd MMM yyyy"); 

                // enable routing
                this.getRouter().initialize();
            }
        });
    });
