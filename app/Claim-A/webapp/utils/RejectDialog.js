// claima/utils/RejectDialog.js
sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Label",
  "sap/m/Text",
  "sap/m/TextArea",
  "sap/m/Select",
  "sap/m/MessageToast",
  "sap/ui/core/Item",
  "sap/ui/layout/form/SimpleForm",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "claima/utils/Utility"
], function (
  JSONModel,
  Dialog,
  Button,
  Label,
  Text,
  TextArea,
  Select,
  MessageToast,
  Item,
  SimpleForm,
  Filter,
  FilterOperator,
  Utility
) {
  "use strict";

  // Ensure models BEFORE creating bound controls
  function ensureModels(oController) {
    const oView = oController.getView();

    // Reject (form data)
    let oReject = oView.getModel("Reject");
    if (!oReject) {
      oReject = new JSONModel({ rejectReasonKey: "", approvalComment: "" });
      oView.setModel(oReject, "Reject");
    } else if (!oReject.getData()) {
      oReject.setData({ rejectReasonKey: "", approvalComment: "" });
    }

    // Type (dialog UI state)
    let oType = oView.getModel("Type");
    if (!oType) {
      oType = new JSONModel({ mode: "" }); // REJECT_REQ | REJECT_CLAIM
      oView.setModel(oType, "Type");
    } else if (!oType.getData()) {
      oType.setData({ mode: "" });
    }
  }

  function applyRejectFilters(oController) {
    const oSelect = oController.byId("rejectReasonSelect");
    const oBinding = oSelect && oSelect.getBinding("items");
    if (oBinding) {
      oBinding.filter([
        new Filter("REASON_TYPE", FilterOperator.EQ, "REJECT"),
        new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
      ]);
    } else {

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
        // ----- Pre-Approval (Request) fields -----
        new Label({
          text: "{i18n>purpose}",
          visible: "{= ${Type>/mode} === 'REJECT_REQ' }"
        }),
        new Text({
          text: "{request>/req_header/purpose}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'REJECT_REQ' }"
        }),
        new Label({
          text: "{i18n>preappreq_id}",
          visible: "{= ${Type>/mode} === 'REJECT_REQ' }"
        }),
        new Text({
          text: "{request>/req_header/reqid}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'REJECT_REQ' }"
        }),

        // ----- Claim fields -----
        new Label({
          text: "{i18n>purpose}",
          visible: "{= ${Type>/mode} === 'REJECT_CLAIM' }"
        }),
        new Text({
          text: "{claimsubmission_input>/claim_header/purpose}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'REJECT_CLAIM' }"
        }),
        new Label({
          text: "{i18n>label_claimsummary_claimheader_claimid}",
          visible: "{= ${Type>/mode} === 'REJECT_CLAIM' }"
        }),
        new Text({
          text: "{claimsubmission_input>/claim_header/claim_id}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'REJECT_CLAIM' }"
        }),

        // Reject Reason (required)
        new Label({ text: "{i18n>reject_reason}", required: true }),
        new Select(oView.createId("rejectReasonSelect"), {
          width: "100%",
          selectedKey: "{Reject>/rejectReasonKey}",
          forceSelection: false,
          items: [
            new Item({
              key: "",
            })
          ]
        })
          .bindAggregation("items", "employee>/ZREJECT_REASON", function (sId, oContext) {
            return new Item({
              key: oContext.getProperty("REASON_ID"),
              text: oContext.getProperty("REASON_DESC")
            });
          }),

        // Approval Comment (required)
        new Label({ text: "{i18n>approval_remarks}", required: true }),
        new TextArea(oView.createId("rejectApprovalCommentArea"), {
          value: "{Reject>/approvalComment}",
          width: "100%",
          growing: true,
          growingMaxLines: 5,
          valueLiveUpdate: true, // live update while typing
          placeholder: "{i18n>reject_comment_placeholder}"
        })
      ]
    });

    // Resolve handlers at creation (fallbacks)
    const fncancelHandler =
      oController.onClickCancel_app ||
      oController.onRejectCancel ||
      function () { this._rejectDialog && this._rejectDialog.close(); };

    const fnsubmitHandler =
      oController.onReject_app ||
      oController.onReject_ClaimSubmission ||
      function () { MessageToast.show(Utility.getText("no_reject_handler")) };

    const oDialog = new Dialog({
      title: "{i18n>sendback_request}",
      contentWidth: "50%",
      content: [oForm],
      beginButton: new Button(oView.createId("reject_placeholder_cancel"), {
        text: "{i18n>req_b_cancel}",
        press: fncancelHandler.bind(oController)
      }),
      endButton: new Button(oView.createId("reject_placeholder_submit"), {
        text: "{i18n>reject_btn}",
        type: sap.m.ButtonType.Emphasized,
        enabled: "{= !!${Reject>/rejectReasonKey} && !!${Reject>/approvalComment} }"
      })

    });

    oDialog.attachAfterOpen(function () {
      applyRejectFilters(oController);
    });

    oDialog.addStyleClass("requestDialog");
    oView.addDependent(oDialog);
    return oDialog;
  }

  function getOrCreate(oController) {
    ensureModels(oController);
    if (!oController._rejectDialog) {
      oController._rejectDialog = createRejectDialog(oController);
    }
    return oController._rejectDialog;
  }

  return {
    open: function (oController) {
      const oDlg = getOrCreate(oController);
      try {
        const btn = oDlg.getEndButton();
        const handler =
          oController.onReject_app ||
          oController.onReject_ClaimSubmission ||
          function () { MessageToast.show(Utility.getText("no_reject_handler")) };

        // detach previous, attach new
        if (btn.__rejHandler) btn.detachPress(btn.__rejHandler);
        btn.__rejHandler = function () {
          try {
            return handler.apply(oController, arguments);
          } catch (e) {

          }
        };
        btn.attachPress(btn.__rejHandler);
      } catch (e) {

      }

      // Title by mode
      try {
        const rb = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        const mode = oController.getView().getModel("Type").getProperty("/mode");
        const sTitle = mode === "REJECT_REQ"
          ? (rb.getText("reject_request") || rb.getText("reject_claim"))
          : rb.getText("reject_claim");
        oDlg.setTitle(sTitle);
      } catch (e) { /* ignore */ }

      const oRejectModel = oController.getView().getModel("Reject");
      oRejectModel.setProperty("/rejectReasonKey", "");
      oRejectModel.setProperty("/approvalComment", "");

      oDlg.open();
      return oDlg;
    },

    destroy: function (oController) {
      if (oController._rejectDialog) {
        oController._rejectDialog.destroy();
        oController._rejectDialog = null;
      }
    }
  };
});