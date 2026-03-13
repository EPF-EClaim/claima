// claima/utils/RejectDialog.js
sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Label",
  "sap/m/Text",
  "sap/m/TextArea",
  "sap/m/Select",
  "sap/ui/core/Item",
  "sap/ui/layout/form/SimpleForm",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (
  JSONModel,
  Dialog,
  Button,
  Label,
  Text,
  TextArea,
  Select,
  Item,
  SimpleForm,
  Filter,
  FilterOperator
) {
  "use strict";

  function ensureRejectModel(oController) {
    const oView = oController.getView();
    let oReject = oView.getModel("Reject");
    if (!oReject) {
      oReject = new JSONModel();
      oView.setModel(oReject, "Reject");
    }
    // Defaults for REJECT flow
    oReject.setData(Object.assign({
      mode: "REJECT",
      rejectReasonKey: "",
      approvalComment: ""
    }, oReject.getData() || {}), true);
  }

  function applyRejectFilters(oController) {
    // Filter dropdown items to REJECT + ACTIVE
    const oRejectSelect = oController.byId("rejectReasonSelect");
    const oBinding = oRejectSelect && oRejectSelect.getBinding("items");
    if (oBinding) {
      oBinding.filter([
        new Filter("REASON_TYPE", FilterOperator.EQ, "REJECT"),
        new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
      ]);
    }
  }

  function createRejectDialog(oController) {
    const oView = oController.getView();

    const oForm = new SimpleForm(oView.createId("approver_reject_form"), {
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

        // Pre-Approval ID
        new Label({ text: "{i18n>preappreq_id}" }),
        new Text({ text: "{request>/req_header/reqid}", wrapping: false }),

        // Reject Reason (required)
        new Label({ text: "Reject Reason", required: true }),
        new Select(oView.createId("rejectReasonSelect"), {
          width: "100%",
          selectedKey: "{Reject>/rejectReasonKey}",
          // Optional: wire to a controller handler if you want
          // change: oController.onRejectReasonChange?.bind(oController),
          items: {
            path: "employee>/ZREJECT_REASON",   // <-- use your named model alias
            template: new Item({
              key: "{employee>REASON_ID}",
              text: "{employee>REASON_DESC}"
            })
          }
        }),

        // Approval Comment (required)
        new Label({ text: "{i18n>approval_comment}", required: true }),
        new TextArea(oView.createId("rejectApprovalCommentArea"), {
          value: "{Reject>/approvalComment}",
          width: "100%",
          growing: true,
          growingMaxLines: 5,
          placeholder: "{i18n>reject_comment_placeholder}"
          // liveChange: oController.onApprovalCommentLiveChange?.bind(oController)
        })
      ]
    });

    const oDialog = new Dialog({
      title: "{i18n>reject_claim}", // or "Reject Claim" if you don't have the key
      contentWidth: "50%",
      content: [oForm],
      beginButton: new Button(oView.createId("reject_placeholder_cancel"), {
        text: "{i18n>req_b_cancel}",
        press: oController.onClickCancel_app.bind(oController)
      }),
      endButton: new Button(oView.createId("reject_placeholder_submit"), {
        text: "{i18n>reject_btn}",    // or "Reject"
        type: "Emphasized",
        press: oController.onReject_app.bind(oController),

/*         enabled: {
          parts: ["Reject>/rejectReasonKey", "Reject>/approvalComment"],
          formatter: function (reason, comment) {
            const hasReason = !!reason;
            const hasComment = !!(comment && comment.trim().length > 0);
            return hasReason && hasComment;
          }
        } */

        // Optional UX: enable only when reason+comment are provided
        // enabled: "{= !!${Reject>/rejectReasonKey} && !!${Reject>/approvalComment} }"
      })
    });

    // Filter items after dialog opens to ensure binding is established
    oDialog.attachAfterOpen(function () {
      applyRejectFilters(oController);
    });

    oDialog.addStyleClass("requestDialog"); // keep your CSS class if used
    oView.addDependent(oDialog);
    return oDialog;
  }

  // Singleton per controller instance (view-scoped)
  function getOrCreate(oController) {
    if (!oController.__rejectDialog) {
      oController.__rejectDialog = createRejectDialog(oController);
    }
    return oController.__rejectDialog;
  }

  return {
    /**
     * Public API: Open Reject dialog
     * @param {sap.ui.core.mvc.Controller} oController
     */
    open: function (oController) {
      ensureRejectModel(oController);
      const oDlg = getOrCreate(oController);
      oDlg.open();
      return oDlg;
    },

    /**
     * Optional cleanup
     */
    destroy: function (oController) {
      if (oController.__rejectDialog) {
        oController.__rejectDialog.destroy();
        oController.__rejectDialog = null;
      }
    }
  };
});