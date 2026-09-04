sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/ui/core/Element",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/TableSelectDialog",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (
    Fragment,
    Element,
    JSONModel,
    Filter,
    FilterOperator,
    TableSelectDialog,
    Column,
    Label,
    ColumnListItem,
    Text,
    MessageToast,
    MessageBox,
    BusyIndicator
) {
    "use strict";

    var oChargingCCDialog = null;
    var oCostCenterValueHelp = null;
    var oSelectedContext = null;
    var oCurrentView = null;

    var oChargingCostCenterModule = {

        onEditChargingCostCenter: async function (
            oBindingContext,
            aSelectedContexts
        ) {
            var aContexts = Array.isArray(oBindingContext)
                ? oBindingContext
                : aSelectedContexts;

            if (!aContexts || aContexts.length === 0) {
                MessageToast.show(
                    "Please select one Claim Type Item."
                );
                return;
            }

            if (aContexts.length > 1) {
                MessageToast.show(
                    "Please select only one Claim Type Item."
                );
                return;
            }

            oSelectedContext = aContexts[0];

            var oSelectedData =
                oSelectedContext.getObject();

            oCurrentView = Element.registry
                .filter(function (oElement) {
                    return oElement.isA(
                        "sap.ui.core.mvc.View"
                    );
                })
                .find(function (oView) {
                    return !!oView.getModel();
                });

            if (!oCurrentView) {
                MessageBox.error(
                    "Unable to locate the current view."
                );
                return;
            }

            var oDialogModel = new JSONModel({
                CLAIM_TYPE_ID:
                    oSelectedData.CLAIM_TYPE_ID,

                CLAIM_TYPE_DESC:
                    oSelectedData.CLAIM_TYPE_DESC,

                CLAIM_TYPE_ITEM_ID:
                    oSelectedData.CLAIM_TYPE_ITEM_ID,

                CLAIM_TYPE_ITEM_DESC:
                    oSelectedData.CLAIM_TYPE_ITEM_DESC,

                CHARGING_COST_CENTER:
                    oSelectedData.CHARGING_COST_CENTER || "",

                CHARGING_COST_CENTER_DESC:
                    oSelectedData
                        .CHARGING_COST_CENTER_DESC || ""
            });

            if (!oChargingCCDialog) {
                oChargingCCDialog = await Fragment.load({
                    id: oCurrentView.getId(),
                    name:
                        "claima.ext.fragment." +
                        "ChargingCostCenter",
                    controller:
                        oChargingCostCenterModule
                });

                oCurrentView.addDependent(
                    oChargingCCDialog
                );
            }

            oChargingCCDialog.setModel(
                oDialogModel,
                "chargingCC"
            );

            oChargingCCDialog.open();
        },

        onChargingCostCenterValueHelp: function (oEvent) {
            var oInput = oEvent.getSource();
            var oODataModel = oInput.getModel();

            if (oCostCenterValueHelp) {
                oCostCenterValueHelp.destroy();
                oCostCenterValueHelp = null;
            }

            oCostCenterValueHelp =
                new TableSelectDialog({
                    title: "Select Cost Center",
                    contentWidth: "42rem",

                    columns: [
                        new Column({
                            header: new Label({
                                text: "Cost Center"
                            })
                        }),
                        new Column({
                            header: new Label({
                                text:
                                    "Cost Center Description"
                            })
                        })
                    ],

                    items: {
                        path: "/ZCOST_CENTER_VH",
                        template: new ColumnListItem({
                            cells: [
                                new Text({
                                    text: "{COST_CENTER_ID}"
                                }),
                                new Text({
                                    text:
                                        "{COST_CENTER_DESC}"
                                })
                            ]
                        })
                    },

                    confirm: function (oConfirmEvent) {
                        var oSelectedItem =
                            oConfirmEvent.getParameter(
                                "selectedItem"
                            );

                        if (!oSelectedItem) {
                            return;
                        }

                        var oContext =
                            oSelectedItem
                                .getBindingContext();

                        if (!oContext) {
                            return;
                        }

                        var oCostCenter =
                            oContext.getObject();

                        var oDialogModel =
                            oChargingCCDialog
                                .getModel("chargingCC");

                        oDialogModel.setProperty(
                            "/CHARGING_COST_CENTER",
                            oCostCenter.COST_CENTER_ID
                        );

                        oDialogModel.setProperty(
                            "/CHARGING_COST_CENTER_DESC",
                            oCostCenter.COST_CENTER_DESC
                        );
                    },

                    search: function (oSearchEvent) {
                        var sValue =
                            oSearchEvent.getParameter(
                                "value"
                            );

                        var aFilters = [];

                        if (sValue) {
                            aFilters.push(
                                new Filter({
                                    filters: [
                                        new Filter(
                                            "COST_CENTER_ID",
                                            FilterOperator.Contains,
                                            sValue
                                        ),
                                        new Filter(
                                            "COST_CENTER_DESC",
                                            FilterOperator.Contains,
                                            sValue
                                        )
                                    ],
                                    and: false
                                })
                            );
                        }

                        oSearchEvent
                            .getSource()
                            .getBinding("items")
                            .filter(aFilters);
                    }
                });

            oCostCenterValueHelp.setModel(
                oODataModel
            );

            oCostCenterValueHelp.open();
        },

        onSaveChargingCostCenter: async function () {
            if (!oChargingCCDialog) {
                return;
            }

            var oDialogModel =
                oChargingCCDialog.getModel(
                    "chargingCC"
                );

            var oData = oDialogModel.getData();

            if (!oData.CLAIM_TYPE_ID ||
                !oData.CLAIM_TYPE_ITEM_ID) {
                MessageBox.error(
                    "Claim Type and Claim Type Item " +
                    "are required."
                );
                return;
            }

            var oModel =
                oSelectedContext.getModel();

            var oAction = oModel.bindContext(
                "/updateDefaultChargingCostCenter(...)"
            );

            oAction.setParameter(
                "claimTypeId",
                oData.CLAIM_TYPE_ID
            );

            oAction.setParameter(
                "claimTypeItemId",
                oData.CLAIM_TYPE_ITEM_ID
            );

            oAction.setParameter(
                "chargingCostCenter",
                oData.CHARGING_COST_CENTER || ""
            );

            try {
                BusyIndicator.show(0);

                await oAction.execute();

                oChargingCCDialog.close();

                var oListBinding =
                    oSelectedContext.getBinding();

                if (
                    oListBinding &&
                    typeof oListBinding.refresh ===
                        "function"
                ) {
                    oListBinding.refresh();
                } else if (
                    oModel &&
                    typeof oModel.refresh === "function"
                ) {
                    oModel.refresh();
                }

                MessageToast.show(
                    "Charging Cost Center updated " +
                    "successfully."
                );

            } catch (oError) {
                console.error(
                    "Charging Cost Center update failed",
                    oError
                );

                var sMessage =
                    oError?.message ||
                    "Failed to update Charging " +
                    "Cost Center.";

                MessageBox.error(sMessage);

            } finally {
                BusyIndicator.hide();
            }
        },

        onCloseChargingCostCenter: function () {
            if (oChargingCCDialog) {
                oChargingCCDialog.close();
            }
        }
    };

    return oChargingCostCenterModule;
});