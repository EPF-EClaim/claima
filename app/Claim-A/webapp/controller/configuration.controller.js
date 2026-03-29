sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/DatePicker",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "claima/utils/Utility",
], (Controller,
    Sorter,
    Filter,
    FilterOperator,
    JSONModel,
    Dialog,
    VBox,
    DatePicker,
    Button,
    Input,
    Label,
    MessageToast,
    MessageBox,
    Utility
) => {
    "use strict";

    return Controller.extend("claima.controller.configuration", {
        onInit() {
            this._oConstant = this.getOwnerComponent().getModel("constant").getData();

            this._oAppModel = new JSONModel({
                mode: "list",
                selectedHeader: null
            });
            this.getView().setModel(this._oAppModel, "config");

            var oViewModel = new JSONModel({
                hasSelection: false,
                selectedContextPath: null
            });
            this.getView().setModel(oViewModel, "view");

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ZCLAIM_TYPE").attachPatternMatched(this._onListRouteMatched, this);
        },

        onOpenConfigTable: async function (oEvent) {
            var sNavigation = oEvent.getSource().getId().split("--").pop();
            const oModel = this.getView().getModel();
            const oCtx = oModel.bindContext("/FeatureControl");
            const sEmpMaster = this._oConstant.Configuration.ZEMP_MASTER,
                sEmpMasterDTD = this._oConstant.Configuration.ZEMP_MASTER_DTD,
                sEmpDep = this._oConstant.Configuration.ZEMP_DEPENDENT,
                sEmpDepDTD = this._oConstant.Configuration.ZEMP_DEPENDENT_DTD,
                sNumRange = this._oConstant.Configuration.ZNUM_RANGE,
                sNumRangeDTD = this._oConstant.Configuration.ZNUM_RANGE_DTD,
                sBudget = this._oConstant.Configuration.ZBUDGET;

            if (sNavigation === sEmpMaster|| sNavigation === sEmpDep || sNavigation === sNumRange) {
                try {
                    const oData = await oCtx.requestObject();
                    if (sNavigation === sEmpMaster) {
                        var sTable = oData.operationHidden === false && sNavigation === sEmpMaster ? sEmpMasterDTD : sNavigation;
                    } else if (sNavigation === sEmpDep ) {
                        sTable = oData.operationHidden === false && sNavigation === sEmpDep  ? sEmpDepDTD : sNavigation;
                    } else if (sNavigation === sNumRange) {
                        sTable = oData.operationHidden === false && sNavigation === sNumRange ? sNumRangeDTD : sNavigation;
                    }
                    sNavigation = sTable;
                } catch (e) {
                    new MessageToast.show("Error");
                }
            }
            sNavigation = sNavigation.includes(sBudget) ? sBudget : sNavigation;
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo(sNavigation);
        },

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

            const sMetaPath = sPath.includes('Items') ? '/ZCLAIM_TYPE/Items' : sPath;
            const oEntityType = oModel.getMetaModel().getContext(sMetaPath).getObject();
            const sEntityType = oEntityType.$Type;
            const oDataType = oModel.getMetaModel().getContext(`/${sEntityType}`).getObject();

            var oDialog = new Dialog({
                title: `New Object`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new Button({
                    text: "Create",
                    press: function () {
                        var oInputs = oVBox.getItems();
                        if (!this._validateInputs(oVBox, oDataType)) {
                            MessageToast.show(Utility.getText("msg_required_details"));
                            return;
                        }

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];

                            var sFieldName = oControl.getName();
                            var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();
                            oNewEntry[sFieldName] = sNewInput;
                        }
                        oNewEntry["IsActiveEntity"] = true;

                        if (oNewEntry["END_DATE"] < oNewEntry["START_DATE"]) {
                            MessageToast.show(Utility.getText("endBeforeStart"));
                        } else {

                            var oListBinding = oModel.bindList(sNewPath),
                                oContext = oListBinding.create(oNewEntry);

                            MessageToast.show(Utility.getText("msg_record_created"));
                            oModel.refresh();
                            oDialog.close();
                        }
                    }.bind(this)
                }),
                endButton: new Button({
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

            MessageBox.confirm(`Delete object ${sObjectId}?`, {
                icon: MessageBox.Icon.WARNING,
                title: "Delete",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.DELETE) return;
                    try {
                        oContext.delete();
                        MessageToast.show(Utility.getText("msg_object_deleted"));
                        this.getView().getModel("view").setData({
                            hasSelection: false
                        });
                    } catch (e) {
                        MessageBox.error(e?.message || Utility.getText("msg_delete_fail"));
                    }
                }
            })
        },

        onCopy: function (oEvent) {
            const oNewEntry = {};
            var { oVBox, sPath, oSelected, oModel } = this._getDetails(oEvent);

            const oEntityType = oModel.getMetaModel().getContext(sPath).getObject();
            const sEntityType = oEntityType.$Type;
            const oDataType = oModel.getMetaModel().getContext(`/${sEntityType}`).getObject();

            const oDialog = new Dialog({
                title: `Copy Record`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new Button({
                    text: "Copy",
                    press: function () {
                        var oInputs = oVBox.getItems();

                        if (!this._validateInputs(oVBox, oDataType)) {
                            MessageToast.show(Utility.getText("msg_required_details"));
                            return;
                        }

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
                        if (oNewEntry["END_DATE"] < oNewEntry["START_DATE"]) {
                            MessageToast.show(Utility.getText("endBeforeStart"));
                        } else {
                            var oListBinding = oModel.bindList(sPath),
                                oContext = oListBinding.create(oNewEntry);

                            oModel.refresh();
                            MessageToast.show(Utility.getText("msg_record_created"));
                            oDialog.close();
                            oListBinding.refresh(true);
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
        },

        onEdit: function (oEvent) {
            const { oVBox, sPath, oSelected, oModel } = this._getDetails(oEvent);
            const oContext = oSelected.getBindingContext();

            const oEntityType = oModel.getMetaModel().getContext(sPath).getObject();
            const sEntityType = oEntityType.$Type;
            const oDataType = oModel.getMetaModel().getContext(`/${sEntityType}`).getObject();

            const oDialog = new Dialog({
                title: `Edit Record`,
                contentWidth: "15%",
                horizontalScrolling: false,
                beginButton: new sap.m.Button({
                    text: "Edit",
                    press: function () {
                        let dStart = null;
                        let dEnd = null;
                        var oInputs = oVBox.getItems();

                        if (!this._validateInputs(oVBox, oDataType)) {
                            MessageToast.show(Utility.getText("msg_required_details"));
                            return;
                        }

                        for (let i = 1; i < oInputs.length; i += 2) {
                            const oControl = oInputs[i];
                            const sFieldName = oControl.getName();
                            const sValue = oControl.getValue() === '' ? null : oControl.getValue();

                            if (sFieldName === 'START_DATE') dStart = new Date(sValue);
                            if (sFieldName === 'END_DATE') dEnd = new Date(sValue);
                        }

                        if (dEnd < dStart) {
                            MessageToast.show(Utility.getText("endBeforeStart"));
                        } else {
                            for (let i = 1; i < oInputs.length; i += 2) {
                                const oControl = oInputs[i];

                                var sFieldName = oControl.getName();
                                var sNewInput = oControl.getValue() === '' ? null : oControl.getValue();

                                oContext.setProperty(sFieldName, sNewInput);
                            }
                            MessageToast.show(Utility.getText("msg_record_created"));
                            oModel.refresh();
                            oDialog.close();
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
        },

        _validateInputs: function (oVBox, oDataType) {
            let bValid = true;
            const oInputs = oVBox.getItems();

            for (let i = 1; i < oInputs.length; i += 2) {
                const oControl = oInputs[i];
                const sFieldName = oControl.getName();
                const sValue = oControl.getValue();
                const bRequired = oDataType?.[sFieldName]?.$Nullable === false;

                if (bRequired && (!sValue || sValue.trim() === '')) {
                    oControl.setValueState("Error");
                    oControl.setValueStateText(Utility.getText("msg_requiredfield"));
                    bValid = false;
                } else {
                    oControl.setValueState("None");
                }
            }
            return bValid;
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

                oVBox.addItem(new Label({
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
                    new Input({
                        value: oData[fieldName]?.toString() || "",
                        name: fieldName,
                        width: "130%",
                        enabled: true
                    });

                oVBox.addItem(oInput);
            });
            return { oVBox, sPath, oSelected, oModel };
        },

        onClickBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("Dashboard");
        },

        onOpenViewSettings: function () {
            this.byId("viewSettingsDialog").open();
        },

        onOpenItemViewSettings: function () {
            this.byId("itemViewSettingsDialog").open();
        },

        onConfirmViewSettings: function (oEvent) {
            var oSource = oEvent.getSource();
            var sDialogId = oSource.getId();

            var oTable;
            if (sDialogId.includes("itemViewSettingsDialog")) {
                oTable = this.byId("claimitemTable");
            } else {
                oTable = this.byId("claimTable");
            }

            var oBinding = oTable.getBinding("items");
            var mParams = oEvent.getParameters();

            var oSorter;
            if (mParams.sortItem) {
                oSorter = new Sorter(
                    mParams.sortItem.getKey(),
                    mParams.sortDescending
                );
            }

            var aFilters = [];
            if (mParams.filterItems && mParams.filterItems.length > 0) {
                mParams.filterItems.forEach(function (oItem) {
                    var sParts = oItem.getKey().split("___");
                    aFilters.push(
                        new Filter(sParts[0], FilterOperator.EQ, sParts[1])
                    );
                });
            }

            oBinding.sort(oSorter);
            oBinding.filter(aFilters, "Application");
        },

        onResetViewSettings: function (oEvent) {
            var oSource = oEvent.getSource();
            var sDialogId = oSource.getId();

            var oTable;
            if (sDialogId.includes("itemViewSettingsDialog")) {
                oTable = this.byId("claimitemTable");
            } else {
                oTable = this.byId("claimTable");
            }

            var oBinding = oTable.getBinding("items");
            oBinding.sort(null);
            oBinding.filter([], "Application");
        }
    });
});
