sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Element",
    "claima/utils/ReassignUtility",
    "claima/utils/Utility",
    "sap/ui/core/BusyIndicator",
    "claima/utils/Constants",
], function (Fragment, Filter, FilterOperator, MessageToast, MessageBox, Element, ReassignUtility, Utility, BusyIndicator, Constants) {
    "use strict";
    var oApproverFragment = null;
    var oApproverPopupModule = {
        onClickChangeApprover: function (oBindingContext, aSelectedContexts) {
            var aContexts = Array.isArray(oBindingContext) ? oBindingContext : aSelectedContexts;
            if (!aContexts || aContexts.length === 0) return;
            var oSelectedContext = aContexts[0];
            var sId = oSelectedContext.getProperty("ID");
            var oView = Element.registry.filter(function (oElement) {
                return oElement.isA("sap.ui.core.mvc.View");
            })[0];
            if (!oView) return;
            var oControllerMapping = {
                onSaveApprovers: oApproverPopupModule.onSaveApprovers,
                onCloseDialog: oApproverPopupModule.onCloseDialog,
                onApproverValueHelpRequest: oApproverPopupModule.onApproverValueHelpRequest
            };
            var fnApplyTableFilter = function () {
                var oTable = Fragment.byId(oView.getId(), "popupTable");
                if (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        var oFilter = new Filter("ID", FilterOperator.EQ, sId);
                        oBinding.filter([oFilter]);
                    }
                }
            };
            if (!oApproverFragment) {
                Fragment.load({
                    id: oView.getId(),
                    name: "claima.ext.fragment.ApproverChange",
                    controller: oControllerMapping
                }).then(function (oDialog) {
                    oApproverFragment = oDialog;
                    oView.addDependent(oDialog);
                    fnApplyTableFilter();
                    oApproverFragment.open();
                });
            } else {
                fnApplyTableFilter();
                oApproverFragment.open();
            }
        },
        onSaveApprovers: function (oEvent) {
            var oSource = oEvent.getSource();
            var oModel = oSource.getModel();
            var oView = Element.registry.filter(function (oEl) {
                return oEl.isA("sap.ui.core.mvc.View");
            })[0];
            if (!oView) return;
            var oTable = Fragment.byId(oView.getId(), "popupTable");
            if (!oTable) return;
            var aItems = oTable.getItems();
            if (aItems.length === 0) {
                if (oApproverFragment) { oApproverFragment.close(); }
                return;
            }
            BusyIndicator.show(0);
            ReassignUtility.saveApproverData(aItems, oModel).then(function () {
                if (oModel && oModel.hasPendingChanges("manualGroup")) {
                    var oResetPromise = oModel.resetChanges("manualGroup");
                    if (oResetPromise && typeof oResetPromise.catch === "function") {
                        oResetPromise.catch(function () { });
                    }
                }

                if (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        oBinding.refresh();
                    }
                }
                BusyIndicator.hide();
                MessageToast.show(Utility.getText("msg_approver_save_success"));
                if (oApproverFragment) { oApproverFragment.close(); }
            }).catch(function (oError) {
                BusyIndicator.hide();
                MessageBox.error(Utility.getText("msg_approver_save_fail"));

            });
        },
        onCloseDialog: function (oEvent) {
            var oSource = oEvent.getSource();
            var oModel = oSource.getModel();
            if (oModel && oModel.hasPendingChanges("manualGroup")) {
                var oResetPromise = oModel.resetChanges("manualGroup");
                if (oResetPromise && typeof oResetPromise.catch === "function") {
                    oResetPromise.catch(function () { });
                }
            }
            if (oApproverFragment) {
                oApproverFragment.close();
            }
        },
        onApproverValueHelpRequest: function (oEvent) {
            var oInput = oEvent.getSource();
            var oBindingContext = oInput.getBindingContext();
            var sDept = "";
            var iCurrentSeq = null;
            if (oBindingContext) {
                var sStatus = oBindingContext.getProperty("STATUS");
                var sNormalizedStatus = sStatus ? sStatus.trim() : "";
                if (sNormalizedStatus !== Constants.ClaimStatus.PENDING_APPROVAL && sNormalizedStatus !== "") {
                    MessageToast.show(Utility.getText("msg_disable_edit"));
                    return;
                }

                sDept = oBindingContext.getProperty("APPROVER_DEP");
                var sSeqRaw = oBindingContext.getProperty("GRADE_SEQUENCE");
                if (sSeqRaw) {
                    iCurrentSeq = parseInt(sSeqRaw, 10);
                }
            }
            var oModel = oInput.getModel();
            if (oApproverPopupModule._oApproverVHDialog) {
                oApproverPopupModule._oApproverVHDialog.destroy();
                oApproverPopupModule._oApproverVHDialog = null;
            }

            var aInitialFilters = [];
            if (sDept) {
                aInitialFilters.push(new Filter("DEP", FilterOperator.EQ, sDept));
            }
            if (iCurrentSeq !== null) {
            aInitialFilters.push(new sap.ui.model.Filter("GRADE_SEQUENCE", sap.ui.model.FilterOperator.GE, iCurrentSeq));
            }

            oApproverPopupModule._oApproverVHDialog = new sap.m.TableSelectDialog({
                title: "Select Approver",
                contentWidth: "35rem",
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Label({ text: "Name" })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Label({ text: "Employee ID" })
                    })
                ],

                items: {
                    path: "/ZEMP_APPROVER_LIST_VH",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: "{NAME}" }),
                            new sap.m.Text({ text: "{EEID}" })
                        ]
                    }),
                    filters: aInitialFilters
                },

                confirm: function (oConfirmEvent) {
                    var oSelectedItem = oConfirmEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        // Grab the context data straight from the selected table row cells
                        var aCells = oSelectedItem.getCells();
                        var sNewApproverId = aCells[1].getText(); // Index 1 is Employee ID
                        var oInputContext = oInput.getBindingContext();
                        if (oInputContext) {
                            oInputContext.setProperty("NEW_APPROVER_ID", sNewApproverId);
                        }
                    }
                },
                search: function (oSearchEvent) {
                    var sValue = oSearchEvent.getParameter("value");
                    var oFilter = new Filter("NAME", FilterOperator.Contains, sValue);
                    oSearchEvent.getSource().getBinding("items").filter([oFilter]);
                }
            });
            if (oModel) {
                oApproverPopupModule._oApproverVHDialog.setModel(oModel);
            }
            oApproverPopupModule._oApproverVHDialog.open();
        }
    };
    return oApproverPopupModule;
});