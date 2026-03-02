sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/DatePicker",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label"
], (Controller, Dialog, VBox, DatePicker, Button, Input, Label) => {
    "use strict";

    return Controller.extend("claima.controller.configuration", {
        onInit() {

            this._oAppModel = new sap.ui.model.json.JSONModel({
                mode: "list",
                selectedHeader: null
            });
            this.getView().setModel(this._oAppModel, "config");


            var oViewModel = new sap.ui.model.json.JSONModel({
                hasSelection: false,
                selectedContextPath: null
            });
            this.getView().setModel(oViewModel, "view");

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ZCLAIM_TYPE").attachPatternMatched(this._onListRouteMatched, this);
        },

        onOpenConfigTable: function (oEvent) {
            var oNavigation = oEvent.getSource().getId().split("--").pop();
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo(oNavigation);
        },

        //navigation to object page is not working when cofigure from manifest, alternative manual table config
        //only for ZCLAIM_TYPE
        onNavigate: async function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();

            const oConfigModel = this.getView().getModel("config");
            oConfigModel.setProperty("/selectedHeader", oData);
            oConfigModel.setProperty("/mode", "object");
            this.getView().getModel("view").setData({
                hasSelection: false
            });

            if (!this._oItemsFragment) {
                this._oItemsFragment = await sap.ui.core.Fragment.load({
                    id: this.createId("ClaimItems"),
                    name: "claima.fragment.configtableitem",
                    controller: this
                });
                this._oItemsFragment.setModel(this.getView().getModel());
            }

            const oContainer = this.byId("objectContainer");
            if (oContainer.indexOfItem(this._oItemsFragment) === -1) {
                oContainer.removeAllItems();
                oContainer.addItem(this._oItemsFragment);
            }
            this._oItemsFragment.setBindingContext(oContext);
        },

        _onListRouteMatched: function () {
            const oConfig = this.getView().getModel("config");
            oConfig.setProperty("/mode", "list");
            oConfig.setProperty("/selectedHeader", null);

            const oObjectContainer = this.byId("objectContainer");
            if (oObjectContainer) {
                oObjectContainer.removeAllItems();
            }
        },

        onSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var oSelected = oTable.getSelectedItem();

            var bHasSelection = !!oSelected;
            var sPath = bHasSelection ? oSelected.getBindingContext().getPath() : null;

            this.getView().getModel("view").setData({
                hasSelection: bHasSelection,
                selectedContextPath: sPath
            }, true);
        },

        onCreate: function (oEvent) {
            const oNewEntry = {};
            const { oVBox, sPath, oSelected, oModel } = this._getDetails(oEvent);
            var sNewPath = sPath.includes('Items') ? this._oItemsFragment?.getBindingContext().getPath() + "/Items" : sPath;

            var oDialog = new sap.m.Dialog({
                title: `New Object`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Create",
                    press: function () {
                        var oInputs = oVBox.getItems();

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];

                            var sFieldName = oControl.getName();
                            var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();
                            oNewEntry[sFieldName] = sNewInput;
                        }
                        oNewEntry["IsActiveEntity"] = true;

                        var oListBinding = oModel.bindList(sNewPath),
                            oContext = oListBinding.create(oNewEntry);

                        sap.m.MessageToast.show("Record created");
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

        onDelete: function (oEvent) {
            const sSource = oEvent.getSource().getId(),
                sTableId = sSource?.includes("Header") ? "claimTable" : "ClaimItems--claimitemTable",
                oTable = this.byId(sTableId),
                oContext = oTable.getSelectedItem().getBindingContext(),
                oObject = oContext.getObject();

            var sObjectId = sSource?.includes("Header") ? oObject.CLAIM_TYPE_ID : oObject.CLAIM_TYPE_ITEM_ID;

            sap.m.MessageBox.confirm(`Delete object ${sObjectId}?`, {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: "Delete",
                actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.DELETE,
                onClose: async (sAction) => {
                    if (sAction !== sap.m.MessageBox.Action.DELETE) return;
                    try {
                        oContext.delete();
                        sap.m.MessageToast.show("Object deleted");
                        this.getView().getModel("view").setData({
                            hasSelection: false
                        });
                    } catch (e) {
                        sap.m.MessageBox.error(e?.message || "Delete failed");
                    }
                }
            })
        },

        onCopy: function (oEvent) {
            const oNewEntry = {};
            var { oVBox, sPath, oSelected, oModel } = this._getDetails(oEvent);
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
                            var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();

                            oNewEntry[sFieldName] = sNewInput;
                        }

                        oNewEntry["IsActiveEntity"] = true;
                        oNewEntry["HasDraftEntity"] = false;

                        if (sPath.includes('Items')) {
                            var oHeader = this._oItemsFragment?.getBindingContext();
                            const sItemsPath = oHeader.getPath() + "/Items";
                            sPath = sItemsPath;
                        }

                        var oListBinding = oModel.bindList(sPath),
                            oContext = oListBinding.create(oNewEntry);

                        oModel.refresh();
                        sap.m.MessageToast.show("Record created");
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

        onEdit: function (oEvent) {
            const { oVBox, sPath, oSelected, oModel } = this._getDetails(oEvent);
            const oContext = oSelected.getBindingContext();
            const oDialog = new sap.m.Dialog({
                title: `Edit Record`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Edit",
                    press: function () {
                        var oInputs = oVBox.getItems();

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];

                            var sFieldName = oControl.getName();
                            var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();

                            oContext.setProperty(sFieldName, sNewInput);
                        }

                        sap.m.MessageToast.show("Record updated");
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

        _getDetails: function (oEvent) {
            const sSource = oEvent.getSource().getId(),
                sTableId = sSource?.includes("Header") ? "claimTable" : "ClaimItems--claimitemTable",
                oTable = this.byId(sTableId),
                oModel = this.getView().getModel();

            if (sSource.includes('Create')) {
                var sPath = sSource.includes('Header') ? "/ZCLAIM_TYPE" : '/ZCLAIM_TYPE/Items',
                    oData = {},
                    oSelected = null;
            } else {
                oSelected = oTable.getSelectedItem();
                sPath = oSelected.getBindingContext().getBinding().sPath === 'Items' ? '/ZCLAIM_TYPE/Items' : oSelected.getBindingContext().getBinding().sPath;
                oData = oSelected.getBindingContext().getObject();
            }

            const oEntityType = oModel.getMetaModel().getContext(sPath).getObject(),
                sEntityType = oEntityType.$Type,
                oDataType = oModel.getMetaModel().getContext(`/${sEntityType}`).getObject(),
                oLineItems = oModel.getMetaModel().getContext(`/${sEntityType}/@com.sap.vocabularies.UI.v1.LineItem`).getObject();

            const oVBox = new sap.m.VBox({
                width: "70%",
                fitContainer: true,
            });
            oVBox.addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom");

            oLineItems.forEach(function (item) {
                const fieldName = item.Value.$Path;
                const oFieldMeta = oDataType[fieldName];
                const fieldType = oFieldMeta?.$Type;

                oVBox.addItem(new sap.m.Label({
                    text: item.Label,
                    width: "100%",
                    labelFor: fieldName,
                    required: !!(oDataType[fieldName] && oDataType[fieldName].$Nullable === false)
                }));
                oVBox.addStyleClass("sapUiSmallMarginTopBottom");
                const oInput = fieldType?.includes('Edm.Date') ?
                    new DatePicker({
                        value: oData[fieldName] || null,
                        name: fieldName,
                        width: "130%",
                        displayFormat: "dd MMM yyyy",
                        valueFormat: "yyyy-MM-dd",
                        enabled: true
                    }) :
                    new sap.m.Input({
                        value: oData[fieldName]?.toString() || "",
                        name: fieldName,
                        width: "130%",
                        enabled: true
                    });

                oVBox.addItem(oInput);
            });
            return { oVBox, sPath, oSelected, oModel };
        }
    });
});
 