sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "claima/utils/Constants"
], 
function (JSONModel, Device, Constants) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createConstantModel: function(){
            var oModel = new JSONModel(Constants);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        }
    };

});