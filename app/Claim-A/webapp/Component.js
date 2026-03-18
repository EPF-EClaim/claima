sap.ui.define([
    "sap/fe/core/AppComponent",
    "claima/model/models"
],
    (AppComponent,
        models) => {
        "use strict";

        return AppComponent.extend("claima.Component", {
            metadata: {
                manifest: "json"
            },

            init() {
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

                jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/xlsx.js');
                document.head.appendChild(jQueryScript);
            }
        });
    });