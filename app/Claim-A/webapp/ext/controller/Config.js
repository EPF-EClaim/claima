sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/DatePicker",
], function (ControllerExtension,
    DatePicker) {
    'use strict';
    
    const _getDetails = function (oView, aSelectedContexts) {
        const oSelectedContext = aSelectedContexts[0];
        const oData = oSelectedContext.getObject();
        const sPath = oSelectedContext.getBinding().sPath;
        const oModel = oView.getModel();
        const oEntityType = oModel.getMetaModel().getContext(sPath).getObject();
        const sEntityType = oEntityType.$Type;
        const oDataType = oModel.getMetaModel().getContext(`/${sEntityType}`).getObject();

        const oLineItems = oModel.getMetaModel().getContext(`/${sEntityType}/@com.sap.vocabularies.UI.v1.LineItem`).getObject();

        const oVBox = new sap.m.VBox({
            width: "50%",
            fitContainer: true
        });

        oLineItems.forEach(function (item) {
            const fieldName = item.Value.$Path;
            const oFieldMeta = oDataType[fieldName];
            const fieldType = oFieldMeta?.$Type;

            const oHBox = new sap.m.HBox({
                alignItems: "Center",
                width: "100%"
            });

            oHBox.addItem(new sap.m.Label({
                text: item.Label,
                width: "200px",
                labelFor: fieldName
            }));

            const oInput = fieldType?.includes('Edm.Date') ?
                new DatePicker({
                    value: oData[fieldName] || null,
                    name: fieldName,
                    width: "400px",
                    displayFormat: "dd MMM yyyy",
                    valueFormat: "yyyy-MM-dd"
                }) :
                fieldType?.includes('Edm.Boolean') ?
                    new sap.m.CheckBox({
                        selected: oData[fieldName] === true || oData[fieldName] === 'true',
                        name: fieldName,
                        width: "400px"
                    }) :
                    new sap.m.Input({
                        value: oData[fieldName]?.toString() || "",
                        name: fieldName,
                        width: "400px"
                    });

            oHBox.addItem(oInput);
            oVBox.addItem(oHBox);
        });
        return { oVBox, sPath, oModel, oSelectedContext, };
    }

    return {
        /**
         * Generated event handler.
         *
         * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
         * @param aSelectedContexts the selected contexts of the table rows.
         */

        onclickcopy: function (oContext, aSelectedContexts) {
            const oNewEntry = {};
            const oView = this.getRouting().getView();
            const { oVBox, sPath, oModel, oSelectedContext } = _getDetails(oView, aSelectedContexts);

            const oDialog = new sap.m.Dialog({
                title: `Copy Record`,
                contentWidth: "35%",
                // contentHeight: "450px",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Copy",
                    press: function () {
                        var oInputs = oVBox.getItems();

                        oInputs.forEach(oHBox => {
                            var oControl = oHBox.getItems()[1];
                            if (oControl && (oControl.isA("sap.m.Input") || oControl.isA("sap.m.DatePicker"))) {
                                var sFieldName = oControl.getName();
                                var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();

                                oNewEntry[sFieldName] = sNewInput;
                            }

                        });
                        oNewEntry["IsActiveEntity"] = true;
                        oNewEntry["HasDraftEntity"] = false;


                        var oListBinding = oModel.bindList(sPath),
                            oContext = oListBinding.create(oNewEntry);
                        oModel.refresh();

                        oDialog.close();
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

        },

        onClickEdit: function (oContext, aSelectedContexts) {
            const oView = this.getRouting().getView();
            const { oVBox, sPath, oModel, oSelectedContext } = _getDetails(oView, aSelectedContexts);

            const oDialog = new sap.m.Dialog({
                title: `Edit Record`,
                contentWidth: "40%",
                // contentHeight: "450px",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Edit",
                    press: function () {
                        var oInputs = oVBox.getItems();

                        oInputs.forEach(oHBox => {
                            var oControl = oHBox.getItems()[1];
                            if (oControl && (oControl.isA("sap.m.Input") || oControl.isA("sap.m.DatePicker"))) {
                                var sFieldName = oControl.getName();
                                var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();

                                oSelectedContext.setProperty(sFieldName, sNewInput);
                            }
                        });

                        sap.m.MessageToast.show("Record updated");
                        oDialog.close();
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
    }
});
