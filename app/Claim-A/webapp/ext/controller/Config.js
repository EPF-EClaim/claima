sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/ListItem",
    "sap/m/DatePicker",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/VBox",
    "sap/m/Select",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Dialog",
    "sap/m/Button",
    "claima/utils/Utility", 
    "claima/utils/Validator"
], function (ControllerExtension,
    ListItem,
    DatePicker,
    MessageBox,
    MessageToast,
    VBox,
    Select,
    Label,
    Input,
    Dialog,
    Button,
    Utility,
    Validator) {
    'use strict';

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

    const sDisabledField = "RANGE_ID";

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
            MessageToast.show(Utility.getText("endBeforeStart"));
            return false;
        }

        return true;
    }
    const _validateInputs = function (oVBox, oDataType, isZempMaster) {
        let bValid = true;
        const oInputs = oVBox.getItems();

        for (let i = 1; i < oInputs.length; i += 2) {
            const oControl = oInputs[i];
            const sFieldName = oControl.getName();

            if (isZempMaster && !allowedOnZemp.has(sFieldName)) continue;
            if (oControl.isA("sap.m.Select")) continue;

            const sValue = oControl.getValue();
            const oMeta = oDataType?.[sFieldName];
            const bRequired = oMeta?.$Nullable === false;
            const nMaxLength = oMeta?.$MaxLength;

            const bIsNumeric = oMeta?.$Type === "Edm.Decimal" ||
                oMeta?.$Type === "Edm.Int32" ||
                oMeta?.$Type === "Edm.Int64" ||
                oMeta?.$Type === "Edm.Double";

            if (bRequired && (!sValue || sValue.trim() === '')) {
                oControl.setValueState("Error");
                oControl.setValueStateText(Utility.getText("msg_requiredfield"));
                bValid = false;
            } else if (nMaxLength && sValue && sValue.length > nMaxLength) {
                oControl.setValueState("Error");
                oControl.setValueStateText(`Maximum ${nMaxLength} characters allowed`);
                bValid = false;
            } else if (bIsNumeric && sValue && isNaN(Number(sValue))) {
                oControl.setValueState("Error");
                oControl.setValueStateText(Utility.getText("msg_valid_number"));
                bValid = false;
            } else {
                oControl.setValueState("None");
            }
        }
        return bValid;
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

        const isZempMaster = sPath?.startsWith("/ZEMP_MASTER") || sPath === "/ZEMP_DEPENDENT";

        const oVBox = new VBox({
            width: "70%",
            fitContainer: true,
        });
        oVBox.addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")

        oLineItems.forEach(function (item) {
            const fieldName = item.Value.$Path;
            const oFieldMeta = oDataType[fieldName];
            const fieldType = oFieldMeta?.$Type;
            const sDisable = isZempMaster && !allowedOnZemp.has(fieldName);

            oVBox.addItem(new Label({
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
                    new Select({
                        name: fieldName,
                        width: "130%",
                        forceSelection: false,
                        selectedKey: oData[fieldName] || null,
                        items: [
                            new ListItem({
                                key: null,
                                text: "None"
                            }),
                            new ListItem({
                                key: false,
                                text: "No"
                            }),
                            new ListItem({
                                key: true,
                                text: "Yes"
                            })
                        ]
                    }) :
                    new Input({
                        value: oData[fieldName]?.toString() || "",
                        name: fieldName,
                        width: "130%",
                        enabled: !sDisable
                    });

            oVBox.addItem(oInput);
        });
        return { oVBox, sPath, oModel, oSelectedContext, oKeys, oDataType, isZempMaster };
    }

    return {
        /**
         * Generated event handler.
         *
         * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
         * @param aSelectedContexts the selected contexts of the table rows.
         */

        onclickcopy: function (oContext, aSelectedContexts) {
            if (aSelectedContexts.length !== 1) {
                MessageBox.warning(Utility.getText("msg_select_one"));
                return;
            }
            const oNewEntry = {};
            const oView = this.getRouting().getView();
            const { oVBox, sPath, oModel, oSelectedContext, oKeys, oDataType } = _getDetails(oView, aSelectedContexts);
            const oValidator = new Validator();

            const oDialog = new Dialog({
                title: Utility.getText("title_copy_record"),
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new Button({
                    text: Utility.getText("copy"),
                    press: function () {
                        var oInputs = oVBox.getItems();

                        // if (!_validateInputs(oVBox, oDataType, false))
                            if (!oValidator.validate(oVBox)) {
                            MessageToast.show(Utility.getText("msg_fix_input"));
                            return;
                        }

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
                endButton: new Button({
                    text: Utility.getText("req_b_cancel"),
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });
            oDialog.addContent(oVBox);
            oDialog.open();

        },

        onClickEdit: function (oContext, aSelectedContexts) {
            if (aSelectedContexts.length !== 1) {
                MessageBox.warning(Utility.getText("msg_select_one"));
                return;
            }
            const oView = this.getRouting().getView();
            const { oVBox, sPath, oModel, oSelectedContext, oKeys, oDataType, isZempMaster } = _getDetails(oView, aSelectedContexts);

            if (sPath.includes("/ZNUM_RANGE")) {
                const oItems = oVBox.getItems();
                for (let i = 1; i < oItems.length; i += 2) {
                    const oControl = oItems[i];
                    if (oControl.getName() === sDisabledField) {
                        oControl.setEnabled(false);
                        break;
                    }
                }
            }

            const oDialog = new Dialog({
                title: Utility.getText("title_edit_record"),
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new Button({
                    text: Utility.getText("req_b_edit"),
                    press: async function () {
                        var oInputs = oVBox.getItems();
                        const oEdited = {};
                        const oOld = oSelectedContext.getObject();

                        if (!_validateInputs(oVBox, oDataType, false)) {
                            MessageToast.show(Utility.getText("msg_fix_input"));
                            return;
                        }

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];

                            var sFieldName = oControl.getName();
                            var sNewInput;
                            if (isZempMaster && !allowedOnZemp.has(sFieldName)) continue;

                            if (oControl.isA("sap.m.Select")) {
                                sNewInput = oControl.getSelectedKey() === '' ? null :
                                    oControl.getSelectedKey() === 'false' ? false :
                                        oControl.getSelectedKey() === 'true' ? true :
                                            oControl.getSelectedKey() === 'none' ? null :
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
                            MessageToast.show(Utility.getText("msg_record_updated"));
                            oDialog.close();
                            return;
                        }

                        const oNewEntity = { ...oOld, ...oEdited };
                        const oListBinding = oModel.bindList(sPath);

                        try {
                            const oCreateCtx = oListBinding.create(oNewEntity);
                            await oCreateCtx.created();
                            await oSelectedContext.delete();
                            MessageToast.show(Utility.getText("msg_record_updated"));
                            oModel.refresh();
                            oDialog.close();
                        } catch (e) {
                            MessageBox.error(Utility.getText("msg_failed_key") + (e?.message || e));
                        }
                    }.bind(this)
                }),
                endButton: new Button({
                    text: Utility.getText("button_claimprocess_cancel"),
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });

            oDialog.addContent(oVBox);
            oDialog.open();
        }
    }
});
