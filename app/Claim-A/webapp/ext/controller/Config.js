sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/MessageToast"
], function (ControllerExtension,
    Dialog,
    Button,
    Label,
    Input,
    SimpleForm,
    MessageToast) {
    'use strict';

    return {
        /**
         * Generated event handler.
         *
         * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
         * @param aSelectedContexts the selected contexts of the table rows.
         */
        onclickcopy: function (oContext, aSelectedContexts) {
            MessageToast.show("Custom handler invoked.");
            const oSelectedContext = aSelectedContexts[0];
            const oData = oSelectedContext.getObject();

            const oVBox = new sap.m.VBox({
                width: "100%",
                fitContainer: true
            });

            Object.entries(oData).forEach(([field, value]) => {
                if (field.includes('DraftAdministrativeData') ||
                    field.includes('HasActiveEntity') ||
                    field.includes('HasDraftEntity') ||
                    field.includes('@$ui5.context.isSelected') ||
                    field.includes('IsActiveEntity')) {
                    return;
                }

                const oHBox = new sap.m.HBox({
                    alignItems: "Center",
                    width: "100%"
                });

                oHBox.addItem(new sap.m.Label({
                    text: field + ":",
                    width: "100px",
                    labelFor: field + fieldCount
                }));

                const oInput = new sap.m.Input({
                    value: value?.toString() || "",
                    name: field,
                    width: "350px",
                    valueLiveUpdate: true
                });

                oHBox.addItem(oInput);
                oVBox.addItem(oHBox);
            });

            const oDialog = new sap.m.Dialog({
                title: `Copy Record`,
                contentWidth: "700px",
                // contentHeight: "450px",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Copy",
                    press: function () {
                        // Collect input values
                        const oInputs = oVBox.findAggregatedObjects(true, sap.m.Input);
                        const oNewData = { ...oData };

                        oInputs.forEach(oInput => {
                            oNewData[oInput.getName()] = oInput.getValue();
                        });

                        // Remove ID fields
                        Object.keys(oNewData).forEach(key => {
                            if (key.toLowerCase().includes('id')) delete oNewData[key];
                        });

                        // Backend call
                        this.base.extensionAPI.fireAction("ZCLAIM_PURPOSE.Copy", oNewData);
                        oDialog.close();
                        sap.m.MessageToast.show("Record copied successfully!");
                    }.bind(this)
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });

            oDialog.addContent(oVBox);
            oDialog.open();
        }     
    };
});
