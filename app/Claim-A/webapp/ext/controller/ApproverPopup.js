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
           var fnApplyTableFilter = function() {
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
                       oResetPromise.catch(function() { });
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
                   oResetPromise.catch(function() { });
               }
           }
           if (oApproverFragment) {
               oApproverFragment.close();
           }
       },
       onApproverValueHelpRequest: function (oEvent) {
           var oInput = oEvent.getSource();
           var oBindingContext = oInput.getBindingContext();
           if (oBindingContext) {
               var sStatus = oBindingContext.getProperty("STATUS");
               var sNormalizedStatus = sStatus ? sStatus.trim() : "";
               if (sNormalizedStatus !== Constants.ClaimStatus.PENDING_APPROVAL && sNormalizedStatus !== "") {
                   MessageToast.show(Utility.getText("msg_disable_edit"));
                   return;
               }
           }
           var oModel = oInput.getModel();
           if (oApproverPopupModule._oApproverVHDialog) {
               oApproverPopupModule._oApproverVHDialog.destroy();
               oApproverPopupModule._oApproverVHDialog = null;
           }
           oApproverPopupModule._oApproverVHDialog = new sap.m.SelectDialog({
               title: "Select Valid Approver",
               items: {
                   path: "/ZEMP_APPROVER_LIST_VH",
                   template: new sap.m.StandardListItem({
                       title: "{NAME}",
                       description: "{EEID}"
                   })
               },
               confirm: function (oConfirmEvent) {
                   var oSelectedItem = oConfirmEvent.getParameter("selectedItem");
                   if (oSelectedItem) {
                       var sNewApproverId = oSelectedItem.getDescription();
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