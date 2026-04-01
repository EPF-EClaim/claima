
// claima/utils/SendBackDialog.js
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

  /**
   * Ensure the two view-scoped models exist BEFORE creating bound controls:
   *  - "Reject" holds form data: sendBackReasonKey, approvalComment
   *  - "Type"   holds UI state:  mode = SENDBACK_REQ | SENDBACK_CLAIM
   */
  function ensureModels(oController) {
    const oView = oController.getView();

    // Reject (form data)
    let oReject = oView.getModel("Reject");
    if (!oReject) {
      oReject = new JSONModel({
        sendBackReasonKey: "",
        approvalComment: ""
      });
      oView.setModel(oReject, "Reject");
    } else if (!oReject.getData()) {
      oReject.setData({ sendBackReasonKey: "", approvalComment: "" });
    }

    // Type (dialog UI state)
    let oType = oView.getModel("Type");
    if (!oType) {
      oType = new JSONModel({ mode: "" }); // SENDBACK_REQ | SENDBACK_CLAIM
      oView.setModel(oType, "Type");
    } else if (!oType.getData()) {
      oType.setData({ mode: "" });
    }
  }

  function applySendBackFilters(oController) {
    // Filter dropdown items to SENDBACK + ACTIVE
    const oSelect = oController.byId("sendBackReasonSelect");
    const oBinding = oSelect && oSelect.getBinding("items");
    if (oBinding) {
      oBinding.filter([
        new Filter("REASON_TYPE", FilterOperator.EQ, "SENDBACK"),
        new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
      ]);
    } else {
      // eslint-disable-next-line no-console
      console.warn("[SendBackDialog] items binding not found on sendBackReasonSelect.");
    }
  }

  function createSendBackDialog(oController) {
    const oView = oController.getView();

    const oForm = new SimpleForm(oView.createId("approver_sendback_form"), {
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
          visible: "{= ${Type>/mode} === 'SENDBACK_REQ' }"
        }),
        new Text({
          text: "{request>/req_header/purpose}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'SENDBACK_REQ' }"
        }),
        new Label({
          text: "{i18n>preappreq_id}",
          visible: "{= ${Type>/mode} === 'SENDBACK_REQ' }"
        }),
        new Text({
          text: "{request>/req_header/reqid}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'SENDBACK_REQ' }"
        }),

        // ----- Claim fields -----
        new Label({
          text: "{i18n>purpose}",
          visible: "{= ${Type>/mode} === 'SENDBACK_CLAIM' }"
        }),
        new Text({
          text: "{claimsubmission_input>/claim_header/purpose}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'SENDBACK_CLAIM' }"
        }),
        new Label({
          text: "{i18n>label_claimsummary_claimheader_claimid}",
          visible: "{= ${Type>/mode} === 'SENDBACK_CLAIM' }"
        }),
        new Text({
          text: "{claimsubmission_input>/claim_header/claim_id}",
          wrapping: false,
          visible: "{= ${Type>/mode} === 'SENDBACK_CLAIM' }"
        }),

        // Push Back Reason (required)
        new Label({ text: "{i18n>pushback_reason}", required: true }),
        new Select(oView.createId("sendBackReasonSelect"), {
          width: "100%",
          selectedKey: "{Reject>/sendBackReasonKey}",
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

        // Comment (required)
        new Label({ text: "{i18n>approval_remarks}", required: true }),
        new TextArea(oView.createId("sendBackApprovalCommentArea"), {
          value: "{Reject>/approvalComment}",
          width: "100%",
          growing: true,
          growingMaxLines: 5,
          placeholder: "{i18n>push_comment_placeholder}"
        })
      ]
    });

    // Robust handler resolution to support both controllers
    const cancelHandler =
      oController.onClickCancel_app ||
      oController.onSendBackCancel ||
      function () { this._sendBackDialog && this._sendBackDialog.close(); };

    const submitHandler =
      oController.onSendBack_app ||               // RequestForm
      oController.onSendBack_ClaimSubmission ||   // ClaimSubmission
      function () { sap.m.MessageToast.show("No Push Back handler implemented."); };

    const oDialog = new Dialog({
      // Will set dynamically in open()
      title: "{i18n>pushback_claim}",
      contentWidth: "50%",
      content: [oForm],
      beginButton: new Button(oView.createId("sendback_placeholder_cancel"), {
        text: "{i18n>req_b_cancel}",
        press: cancelHandler.bind(oController)
      }),
      endButton: new Button(oView.createId("sendback_placeholder_submit"), {
        text: "{i18n>pushback_btn}",
        type: sap.m.ButtonType.Emphasized,
        enabled: "{= !!${Reject>/sendBackReasonKey} && !!${Reject>/approvalComment} }",
        press: submitHandler.bind(oController)
      })
    });

    oDialog.attachAfterOpen(function () {
      applySendBackFilters(oController);
    });

    oDialog.addStyleClass("requestDialog");
    oView.addDependent(oDialog);
    return oDialog;
  }

  // View-scoped singleton
  function getOrCreate(oController) {
    // Ensure models BEFORE creating bound controls
    ensureModels(oController);

    if (!oController._sendBackDialog) {
      oController._sendBackDialog = createSendBackDialog(oController);
    }
    return oController._sendBackDialog;
  }

  return {
    open: function (oController) {
      const oDlg = getOrCreate(oController);

      // Dynamic title per mode (safer than cross-model expressions)
      try {
        const rb = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        const mode = oController.getView().getModel("Type").getProperty("/mode");
        const title = mode === "SENDBACK_REQ"
          ? (rb.getText("pushback_request") || rb.getText("pushback_claim"))
          : rb.getText("pushback_claim");
        oDlg.setTitle(title);
      } catch (e) { /* ignore if i18n unavailable */ }

      const oRejectModel = oController.getView().getModel("Reject");
      oRejectModel.setProperty("/sendBackReasonKey", "");

      oDlg.open();
      return oDlg;
    },

    destroy: function (oController) {
      if (oController._sendBackDialog) {
        oController._sendBackDialog.destroy();
        oController._sendBackDialog = null;
      }
    }
  };
});
