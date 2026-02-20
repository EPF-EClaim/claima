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


            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ZCLAIM_TYPE").attachPatternMatched(this._onListRouteMatched, this);
        },

        onOpenConfigTable: function (oEvent) {
            var oNavigation = oEvent.getSource().getId().split("--").pop();
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo(oNavigation);
        },

        //navigation to object page is not working when cofigure from manifest, alternative manual table config
        onNavigate: async function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();

            const oConfigModel = this.getView().getModel("config");
            oConfigModel.setProperty("/selectedHeader", oData);
            oConfigModel.setProperty("/mode", "object");

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
                oContainer.removeAllItems(); // optional
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

        onCopy: function (oEvent) {

        },
        onEdit: function (oEvent) {

        },
        onCreate: function () {
            var oDialog = new Dialog({
                title: 'New Object',
                type: 'Message',
                content: [
                    new VBox({
                        items: [
                            new Label({ text: 'Claim Type ID', required: true }),
                            new Input({ id: "claimtypeid" }),
                            new Label({ text: 'Claim Type Description' }),
                            new Input({ id: "claimtypedesc" }),
                            new Label({ text: 'End Date' }),
                            new DatePicker({ id: "enddate" }),
                            new Label({ text: 'Start Date' }),
                            new DatePicker({ id: "startdate" }),
                            new Label({ text: 'Status' }),
                            new Input({ id: "status" })
                        ]
                    })
                ],
                beginButton: new Button({
                    text: 'Create',
                    press: function () {
                        this._addNewEntry();
                        oDialog.close();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: 'Cancel',
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        onCreateItem: function () {
            var oDialog = new Dialog({
                title: 'New Object',
                type: 'Message',
                content: [
                    new VBox({
                        items: [
                            new Label({ text: 'Claim Type Item Id', required: true }),
                            new Input({ id: "claimtypeitemid" }),
                            new Label({ text: 'Claim Type Item Description' }),
                            new Input({ id: "claimtypeitemdesc" }),
                            new Label({ text: 'End Date' }),
                            new DatePicker({ id: "enddate" }),
                            new Label({ text: 'Start Date' }),
                            new DatePicker({ id: "startdate" }),
                            new Label({ text: 'Status' }),
                            new Input({ id: "status" }),
                            new Label({ text: 'Category ID' }),
                            new Input({ id: "categoryid" }),
                            new Label({ text: 'Cost Center' }),
                            new Input({ id: "costcenter" }),
                            new Label({ text: 'GL Account' }),
                            new Input({ id: "glaccount" }),
                            new Label({ text: 'Material Code' }),
                            new Input({ id: "materialcode" }),
                            new Label({ text: 'Risk' }),
                            new Input({ id: "risk" }),
                            new Label({ text: 'Submission Type' }),
                            new Input({ id: "submissiontype" })
                        ]
                    })
                ],
                beginButton: new Button({
                    text: 'Create',
                    press: function () {
                        var sclaimitemid = sap.ui.getCore().byId("claimtypeitemid").getValue();
                        var sdesc = sap.ui.getCore().byId("claimtypeitemdesc");
                        var sdate_e = sap.ui.getCore().byId("enddate");
                        var sdate_s = sap.ui.getCore().byId("startdate");
                        var sStatus = sap.ui.getCore().byId("status");
                        var scategory = sap.ui.getCore().byId("categoryid");
                        var scostcenter = sap.ui.getCore().byId("costcenter");
                        var sglaccount = sap.ui.getCore().byId("glaccount");
                        var smaterialcode = sap.ui.getCore().byId("materialcode");
                        var srisk = sap.ui.getCore().byId("risk");
                        var ssubmissiontype = sap.ui.getCore().byId("submissiontype");

                        var oNewItem = {
                            "CLAIM_TYPE_ITEM_ID": sclaimitemid ? sclaimitemid : null,
                            "CLAIM_TYPE_ITEM_DESC": sdesc ? sdesc : null,
                            "END_DATE": sdate_e ? sdate_e : null,
                            "START_DATE": sdate_s ? sdate_s : null,
                            "STATUS": sStatus ? sStatus : null,
                            "CATEGORY_ID": scategory ? scategory : null,
                            "COST_CENTER": scostcenter ? scostcenter : null,
                            "GL_ACCOUNT": sglaccount ? sglaccount : null,
                            "MATERIAL_CODE": smaterialcode ? smaterialcode : null,
                            "RISK": srisk ? srisk : null,
                            "SUBMISSION_TYPE": ssubmissiontype ? ssubmissiontype : null,
                            "IsActiveEntity": true
                        }

                        var oModel = this.getView().getModel();
                        oDialog.close();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: 'Cancel',
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },
        onDelete: function (oEvent) {

        },

        _addNewEntry: function (oEntry) {

        }

    });
});
