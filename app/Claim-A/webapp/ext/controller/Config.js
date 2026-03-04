sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/DatePicker",
], function (ControllerExtension,
    DatePicker) {
    'use strict';

    const _validateDate = function (oPayload, oDataType) {
        if (!oPayload || !oDataType) return true;
        let startField = null;
        let endField = null;

        for (const prop in oPayload) {
            const meta = oDataType[prop];

            if (!meta || meta.$Type !== "Edm.Date") continue;

            const name = prop.toLowerCase();

            if (name.includes("start")) startField = prop;
            if (name.includes("end")) endField = prop;
        }

        if (!startField || !endField) return true;

        const start = oPayload[startField];
        const end = oPayload[endField];

        if (!start || !end) return true;

        if (end < start) {
            sap.m.MessageToast.show("End date cannot be earlier than start date");
            return false;
        }

        return true;
    }

    const _getDetails = function (oView, aSelectedContexts) {
        const oSelectedContext = aSelectedContexts[0];
        const oData = oSelectedContext.getObject();
        const sPath = oSelectedContext.getBinding().sPath;
        const oModel = oView.getModel();
        const oEntityType = oModel.getMetaModel().getContext(sPath).getObject();
        const sEntityType = oEntityType.$Type;
        const oDataType = oModel.getMetaModel().getContext(`/${sEntityType}`).getObject();
        const oLineItems = oModel.getMetaModel().getContext(`/${sEntityType}/@com.sap.vocabularies.UI.v1.LineItem`).getObject();
        const oKeys = oDataType.$Key || [];

        const allowedOnZemp = new Set([
            "USER_TYPE",
            "B_PLACE",
            "MOBILE_BILL_ELIGIBILITY",
            "ROLE",
            "MOBILE_BILL_ELIG_AMOUNT",
            "MEDICAL_INSURANCE_ENTITLEMENT",
            "POST_EDU_ASSISTANT_CLAIM_DATE",
            "POST_EDU_ASSISTANT_ENTITLE_AMOUNT",
            "MEDICAL_INSURANCE"
        ]);

        const isZempMaster = sPath?.startsWith("/ZEMP_MASTER") || sPath?.startsWith("/ZEMP_DEPENDENT");

        const oVBox = new sap.m.VBox({
            width: "70%",
            fitContainer: true,
        });
        oVBox.addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")

        oLineItems.forEach(function (item) {
            const fieldName = item.Value.$Path;
            const oFieldMeta = oDataType[fieldName];
            const fieldType = oFieldMeta?.$Type;
            const sDisable = isZempMaster && !allowedOnZemp.has(fieldName);

            oVBox.addItem(new sap.m.Label({
                text: item.Label,
                width: "100%",
                labelFor: fieldName,
                required: !!(oDataType[fieldName] && oDataType[fieldName].$Nullable === false)
            }));
            oVBox.addStyleClass("sapUiSmallMarginTopBottom")

            const oInput = fieldType?.includes('Edm.Date') ?
                new DatePicker({
                    value: oData[fieldName] || null,
                    name: fieldName,
                    width: "130%",
                    displayFormat: "dd MMM yyyy",
                    valueFormat: "yyyy-MM-dd",
                    enabled: `${sPath}` === '/ZEMP_MASTER' ? false : true
                }) :
                fieldType?.includes('Edm.Boolean') ?
                    new sap.m.Select({
                        name: fieldName,
                        width: "130%",
                        forceSelection: false,
                        selectedKey: oData[fieldName] || null,
                        items: [
                            new sap.ui.core.ListItem({
                                key: null,
                                text: "None"
                            }),
                            new sap.ui.core.ListItem({
                                key: false,
                                text: "No"
                            }),
                            new sap.ui.core.ListItem({
                                key: true,
                                text: "Yes"
                            })
                        ]
                    }) :
                    new sap.m.Input({
                        value: oData[fieldName]?.toString() || "",
                        name: fieldName,
                        width: "130%",
                        enabled: !sDisable
                    });

            oVBox.addItem(oInput);
        });
        return { oVBox, sPath, oModel, oSelectedContext, oKeys, oDataType };
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
            const { oVBox, sPath, oModel, oSelectedContext, oKeys, oDataType } = _getDetails(oView, aSelectedContexts);

            const oDialog = new sap.m.Dialog({
                title: `Copy Record`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Copy",
                    press: function () {
                        var oInputs = oVBox.getItems();

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];

                            var sFieldName = oControl.getName();
                            var sNewInput;
                            if (oControl.isA("sap.m.Select")) {
                                sNewInput = oControl.getSelectedKey() === '' ? null : oControl.getSelectedKey();
                            } else {
                                sNewInput = oControl.getValue() === '' ? null : oControl.getValue();
                            }

                            oNewEntry[sFieldName] = sNewInput;
                        }
                        if (!_validateDate(oNewEntry, oDataType)) {
                            return;
                        }
                        oNewEntry["IsActiveEntity"] = true;
                        oNewEntry["HasDraftEntity"] = false;


                        var oListBinding = oModel.bindList(sPath),
                            oContext = oListBinding.create(oNewEntry);

                        oModel.refresh();
                        oDialog.close();
                        oListBinding.refresh(true);
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
            const { oVBox, sPath, oModel, oSelectedContext, oKeys, oDataType } = _getDetails(oView, aSelectedContexts);

            const oDialog = new sap.m.Dialog({
                title: `Edit Record`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Edit",
                    press: async function () {
                        var oInputs = oVBox.getItems();
                        const oEdited = {};
                        const oOld = oSelectedContext.getObject()

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];

                            var sFieldName = oControl.getName();
                            var sNewInput;
                            if (oControl.isA("sap.m.Select")) {
                                sNewInput = oControl.getSelectedKey() === '' ? null : 
                                            oControl.getSelectedKey() === 'false'? false:
                                            oControl.getSelectedKey() === 'true'? true :
                                            oControl.getSelectedKey() === 'none'? null:
                                            oControl.getSelectedKey();
                            } else {
                                sNewInput = oControl.getValue() === '' ? null : oControl.getValue();
                            }
                            oEdited[sFieldName] = sNewInput;
                        }
                        
                        if (!_validateDate(oEdited, oDataType)) {
                            return;
                        }

                        (oKeys || []).forEach(function (k) {
                            if (!(k in oEdited)) {
                                oEdited[k] = oOld[k];
                            }
                        });
                        const norm = (v) => v == null ? "" : String(v).trim();
                        const keyChanged = (oKeys || []).some(function (k) {
                            return norm(oOld[k]) !== norm(oEdited[k]);
                        });

                        if (!keyChanged) {

                            for (const field in oEdited) {
                                oSelectedContext.setProperty(field, oEdited[field]);
                            }
                            sap.m.MessageToast.show("Record updated");
                            oDialog.close();
                            return;
                        }

                        const oNewEntity = { ...oOld, ...oEdited };
                        const oListBinding = oModel.bindList(sPath);

                        try {
                            const oCreateCtx = oListBinding.create(oNewEntity);
                            await oCreateCtx.created();
                            await oSelectedContext.delete();
                            sap.m.MessageToast.show("Record updated");
                            oModel.refresh();
                            oDialog.close();
                        } catch (e) {
                            sap.m.MessageBox.error("Failed to change key: " + (e?.message || e));
                        }
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
