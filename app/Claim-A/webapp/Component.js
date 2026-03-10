sap.ui.define([
    "sap/fe/core/AppComponent",
    "claima/model/models",
    "sap/ui/model/odata/v4/ODataModel"
],
    // (UIComponent, 
    (AppComponent,
        models,
        ODataModel) => {
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

                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/jszip.js');
                document.head.appendChild(jQueryScript);


                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/xlsx.js');
                document.head.appendChild(jQueryScript);

                const fcModel = new ODataModel({
                    serviceUrl: "/odata/v4/EmployeeSrv/",
                    operationMode: "Server",
                });
                this.setModel(fcModel, "fc");

                fcModel.getMetaModel().requestObject("/").then(() => {
                    return fcModel.bindContext("/FeatureControl").requestObject();
                }).catch(() => {
                });

            }
        });
    });
