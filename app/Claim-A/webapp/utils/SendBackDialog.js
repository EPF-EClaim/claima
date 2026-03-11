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

    function ensureSendBackModel(oController) {
        const oView = oController.getView();
        let oReject = oView.getModel("Reject");
        if (!oReject) {
            oReject = new JSONModel();
            oView.setModel(oReject, "Reject");
        }
        // Defaults for SENDBACK flow
        oReject.setData(Object.assign({
            mode: "SENDBACK",
            sendBackReasonKey: "",
            approvalComment: ""
        }, oReject.getData() || {}), true);
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
                // Purpose
                new Label({ text: "{i18n>purpose}" }),
                new Text({ text: "{request>/req_header/purpose}", wrapping: false }),

                // Pre-Approval ID
                new Label({ text: "{i18n>preappreq_id}" }),
                new Text({ text: "{request>/req_header/reqid}", wrapping: false }),

                // Send Back Reason (required)
                new Label({ text: "Send Back Reason", required: true }),
                new Select(oView.createId("sendBackReasonSelect"), {
                    width: "100%",
                    selectedKey: "{Reject>/sendBackReasonKey}",
                    // change: oController.onSendBackReasonChange?.bind(oController),
                    items: {
                        // IMPORTANT: use your named OData model alias and correct path
                        path: "Employee>/ZREJECT",
                        template: new Item({
                            key: "{Employee>REASON_ID}",
                            text: "{Employee>REASON_DESC}"
                        }),
                        templateShareable: false
                    }
                }),

                // Comment (required)
                new Label({ text: "{i18n>approval_comment}", required: true }),
                new TextArea(oView.createId("sendBackApprovalCommentArea"), {
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
            title: "{i18n>sendback_claim}", // or "Send Back"
            contentWidth: "50%",
            content: [oForm],
            beginButton: new Button(oView.createId("sendback_placeholder_cancel"), {
                text: "{i18n>req_b_cancel}",
                press: oController.onClickCancel_app.bind(oController)
            }),
            endButton: new Button(oView.createId("sendback_placeholder_submit"), {
                text: "{i18n>submitbtn}",  // or "Send Back"
                type: "Emphasized",
                press: oController.onClickCreate_app.bind(oController),
                // Optional UX: enable only when reason+comment are provided
                // enabled: "{= !!${Reject>/sendBackReasonKey} && !!${Reject>/approvalComment} }"
            })
        });

        oDialog.attachAfterOpen(function () {
            applySendBackFilters(oController);
        });

        oDialog.addStyleClass("requestDialog");
        oView.addDependent(oDialog);
        return oDialog;
    }

    // Singleton per controller instance (view-scoped)
    function getOrCreate(oController) {
        if (!oController.__sendBackDialog) {
            oController.__sendBackDialog = createSendBackDialog(oController);
        }
        return oController.__sendBackDialog;
    }

    return {
        open: function (oController) {
            ensureSendBackModel(oController);
            const oDlg = getOrCreate(oController);
            oDlg.open();
            return oDlg;
        },
        destroy: function (oController) {
            if (oController.__sendBackDialog) {
                oController.__sendBackDialog.destroy();
                oController.__sendBackDialog = null;
            }
        }
    };
});