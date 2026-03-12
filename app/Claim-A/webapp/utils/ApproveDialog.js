// claima/utils/ApproveDialog.js
sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Label",
  "sap/m/Text",
  "sap/m/TextArea",
  "sap/ui/layout/form/SimpleForm"
], function (JSONModel, Dialog, Button, Label, Text, TextArea, SimpleForm) {
  "use strict";

  function ensureApproveModel(oController) {
    const oView = oController.getView();
    let oReject = oView.getModel("Reject");
    if (!oReject) {
      oReject = new JSONModel();
      oView.setModel(oReject, "Reject");
    }
    // Defaults for approve flow
    oReject.setData(Object.assign({
      mode: "APPROVE",
      approvalComment: ""
    }, oReject.getData() || {}), true);
  }

  function createApproveDialog(oController) {
    const oView = oController.getView();

    const oForm = new SimpleForm(oView.createId("approver_approve_form"), {
      editable: true,
      layout: "ResponsiveGridLayout",
      labelSpanXL: 2, labelSpanL: 2, labelSpanM: 2, labelSpanS: 12,
      adjustLabelSpan: true,
      emptySpanXL: 0, emptySpanL: 0, emptySpanM: 0, emptySpanS: 0,
      columnsXL: 2, columnsL: 2, columnsM: 2,
      content: [
        // Purpose
        new Label({ text: "{i18n>purpose}" }),
        new Text({ text: "{request>/req_header/purpose}", wrapping: false }),

        // preappreq_id ID
        new Label({ text: "{i18n>preappreq_id}" }),
        new Text({ text: "{request>/req_header/reqid}", wrapping: false }),

        // Approval Comment
        new Label({ text: "{i18n>approval_comment}", required: true }),
        new TextArea(oView.createId("approvalCommentArea"), {
          value: "{Reject>/approvalComment}",
          width: "100%",
          growing: true,
          growingMaxLines: 5,
          placeholder: "{i18n>approval_comment_placeholder}"
          // liveChange: oController.onApprovalCommentLiveChange?.bind(oController)
        })
      ]
    });

    const oDialog = new Dialog({
      title: "{i18n>approve_claim}", // or "Approve Claim"
      contentWidth: "50%",
      content: [oForm],
      beginButton: new Button(oView.createId("approver_placeholder_cancel"), {
        text: "{i18n>req_b_cancel}",
        press: oController.onClickCancel_app.bind(oController)
      }),
      endButton: new Button(oView.createId("approver_placeholder_create"), {
        text: "{i18n>approve_btn}",  // or "Approve Claim"
        type: "Emphasized",
        press: oController.onClickCreate_app.bind(oController),
        // Optional UX: enable only when comment is filled
        // enabled: "{= !!${Reject>/approvalComment} }"
      })
    });

    oDialog.addStyleClass("requestDialog"); // keep your CSS class if used
    oView.addDependent(oDialog);
    return oDialog;
  }

  // Singleton per controller instance (view-scoped)
  function getOrCreate(oController) {
    if (!oController.__approveDialog) {
      oController.__approveDialog = createApproveDialog(oController);
    }
    return oController.__approveDialog;
  }
  

  return {
    /**
     * Public API: Open Approve dialog
     * @param {sap.ui.core.mvc.Controller} oController
     */
    open: function (oController) {
      ensureApproveModel(oController);
      const oDlg = getOrCreate(oController);
      oDlg.open();
      return oDlg;
    },

  };
});