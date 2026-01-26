
sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/ui/core/Fragment",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/library",
	"sap/tnt/library"
], function (
	Device,
	Controller,
	JSONModel,
	Popover,
	Fragment,
	Button,
	Dialog,
	MessageToast,
	Text,
	library,
	tntLibrary
) {
	"use strict";

	return Controller.extend("claima.controller.App", {
		onInit: function () {

			// oViewModel
			const oViewModel = new sap.ui.model.json.JSONModel({
				rtype: "" // current selected request type
			});
			this.getView().setModel(oViewModel, "view");

			// oRequestModel
			const oRequestModel = new JSONModel({
				purpose: "",
				reqid: "",
				type: "",
				reqstatus: "",
				startdate: "",
				enddate: "",
				grptype: "",
				location: "",
				transport: "",
				detail: "",
				policy: "",
				costcenter: "",
				altcostcenter: "",
				cashadvtype: "",
				comment: "", 
				saved: ""
			});
			this.getView().setModel(oRequestModel, "request");


			// oReportModel
			var oReportModel = new JSONModel({
				"purpose": "",
				"startdate": "",
				"enddate": "",
				"category": "",
				"amt_approved": "",
				"comment": ""
			});
			this.getView().setModel(oReportModel, "report");

			// CONFIG MODEL for all 4 table
			var oConfigModel = new JSONModel({
				ZCLAIM_PURPOSE: [],
				ConfigurationTable2: [],
				ConfigurationTable3: [],
				ConfigurationTable4: [],
				active: {
					data: []
				}
			});
			this.getView().setModel(oConfigModel, "configModel");
      
			//Start insert Aiman Salim - 21/1/2026
			const oMyRequestModel = new JSONModel({
				requests: [
					{
						reportpurpose: "Travel Claim",
						reportid: "REQ001",
						startdate: "2026-01-01",
						status: "Approved",
						amount: "1200"
					},
					{
						reportpurpose: "Training Expense",
						reportid: "REQ002",
						startdate: "2026-01-10",
						status: "Pending",
						amount: "850"
					}
				]
			});

			this.getView().setModel(oMyRequestModel, "myRequest");

			const oMyRequestModel2 = new JSONModel({
				requestsform: [
					{
						reportpurpose: "Test for my report form 1",
						reportid: "TTQ001",
						startdate: "2026-01-01",
						status: "Approved",
						amount: "1200"
					},
					{
						reportpurpose: "Test for my report form",
						reportid: "TTQ002",
						startdate: "2026-01-10",
						status: "Pending",
						amount: "850"
					}
				]
			});
			this.getView().setModel(oMyRequestModel2, "myRequestform");
		},

		//End insert Aiman Salim - 21/1/2026

		// BACK BUTTON CONFIGURATION
		onBackFromConfigTable: function () {
			this.byId("pageContainer").to(this.byId("configuration"));
		},

		// SAVE CONFIGURATION
		onSaveConfigTable: function () {
			let m = this.getView().getModel("configModel");
			let tableId = m.getProperty("/active/title");
			let activeData = m.getProperty("/active/data");

			activeData.forEach(r => r.edit = false);
			m.setProperty("/" + tableId, activeData);

			MessageToast.show("Saved");
		},

		// ADD NEW ROW CONFIGURATION
		onAddEntry: function () {
			let data = this.getView().getModel("configModel").getProperty("/active/data");

			data.push({
				Claim_Purpose_ID: "",
				Claim_Purpose_Desc: "",

				edit: true,
				selected: false
			});
			let m = this.getView().getModel("configModel");
			m.refresh(true);

		},

		// EDIT ROW CONFIGURATION
		onEditEntry: function () {
			let oTable = this.byId("ConfigFrag--configTable");
			let sel = oTable.getSelectedItems();
			if (!sel.length) return MessageToast.show("Select a row.");

			let ctx = sel[0].getBindingContext("configModel");
			ctx.setProperty("edit", true);
		},

		// COPY ROW CONFIGURATION
		onCopyEntry: function () {
			let oTable = this.byId("ConfigFrag--configTable");
			let sel = oTable.getSelectedItem();
			if (!sel) return MessageToast.show("Select a row.");

			let m = this.getView().getModel("configModel");
			let data = m.getProperty("/active/data");
			let obj = sel.getBindingContext("configModel").getObject();

			data.push({ ...obj, edit: true });
			m.refresh(true);
		},

		// DELETE ROW CONFIGURATION
		onDeleteEntry: function () {
			let oTable = this.byId("ConfigFrag--configTable");
			let sel = oTable.getSelectedItems();
			if (!sel.length) return MessageToast.show("Nothing selected.");

			let m = this.getView().getModel("configModel");
			let data = m.getProperty("/active/data");

			sel.reverse().forEach(item => {
				let index = item.getBindingContext("configModel").getPath().split("/").pop();
				data.splice(index, 1);
			});

			m.refresh(true);

		},
		onCollapseExpandPress: function () {
			var oModel = this.getView().getModel();
			var oNavigationList = this.byId("navigationList");
			var bExpanded = oNavigationList.getExpanded();

			oNavigationList.setExpanded(!bExpanded);
		},

		onNavItemPress: function (oEvent) {
			const oItem = oEvent.getParameter("item"),
				sText = oItem.getText();
		},
		onNavItemSelect: function (oEvent) {
			var oItem = oEvent.getParameter("item");
			var oKey = oItem.getKey();

			switch (oKey) {
				case "nav_createreport":
					this.onNavCreateReport();
					break;
				// Start added by Jefry 15-01-2026
				case "createrequest":
					this.onNavMyRequest();
					break;
				// End added by Jefry 15-01-2026
				case "config": // your configuration menu
					this.onClickConfiguration();
					break;
				default:
					// navigate to page with ID same as the key
					var oPage = this.byId(oKey); // make sure your NavContainer has a page with this ID
					if (oPage) {
						this.byId("pageContainer").to(oPage);
					}
					break;
			}

		},
		// Configuration
		onClickConfiguration: async function () {
			// if (!this.oConfigPage) {
			// 	this.oConfigPage = Fragment.load({
			// 		name: "claima.fragment.configuration",
			// 		type: "XML",
			// 		controller: this
			// 	});
			// 	this.getView().addDependent(this.oConfigPage);
			// }

			// Navigate to configuration page
			var oPageContainer = this.byId("pageContainer");
			if (!this.byId("configurationPage")) {
				var oPage = new sap.m.Page(this.createId("configurationPage"), {
				});
			}
			oPageContainer.to(this.byId("configurationPage"));

		},
    onNavCreateReport: async function () {
			if (!this.oDialogFragment) {
				this.oDialogFragment = await Fragment.load({
					name: "claima.fragment.createreport",
					type: "XML",
					controller: this,
				});
				this.getView().addDependent(this.oDialogFragment);

				// Start added by Jefry Yap
				this.oDialogFragment.attachAfterClose(() => {
					this.oDialogFragment.destroy();
					this.oDialogFragment = null;
				});
				// End added by Jefry Yap
			}
			this.oDialogFragment.open();

		},

		onMenuButtonPress: function () {
			var toolPage = this.byId("toolPage");
			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		onSideNavButtonPress: function () {
			var oToolPage = this.byId("toolPage");
			var bSideExpanded = oToolPage.getSideExpanded();

			this._setToggleButtonTooltip(bSideExpanded);

			oToolPage.setSideExpanded(!bSideExpanded);
		},

		_setToggleButtonTooltip: function (bLarge) {
			var oToggleButton = this.byId('sideNavigationToggleButton');
			if (bLarge) {
				oToggleButton.setTooltip('Large Size Navigation');
			} else {
				oToggleButton.setTooltip('Small Size Navigation');
			}
		},

		onCancelFragment: function () {
			this.oDialogFragment.close();
		},

		onCreateReport: function () {
			// validate input data
			var oInputModel = this.getView().getModel("input");
			var oInputData = oInputModel.getData();

			if (oInputData.report.purpose == '' || oInputData.report.startdate == ''
				|| oInputData.report.enddate == '' || oInputData.report.category == '') {
				var message = 'Please enter all mandatory details';
				MessageToast.show(message);
			} else {

				// set as current data
				var oCurrentModel = this.getView().getModel("current");
				oCurrentModel.setData(oInputData);

				var view = "expensereport";
				this.oDialogFragment.close();
				this.byId("pageContainer").to(this.getView().createId(view));
				this.getView().byId("expensetypescr").setVisible(true);
				this.getView().byId("claimscr").setVisible(false);
				this.createreportButtons("expensetypescr");
			}
		},

		onPressBack: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("dashboard"));
		},

		onPressClaimDetails: function () {
			this.getView().byId("expensetypescr").setVisible(false);
			this.getView().byId("claimscr").setVisible(true);
			this.createreportButtons("claimscr");
		},

		createreportButtons: function (oId) {
			var button = ["cancelbtn", "savebtn", "backbtn", "draft", "delete", "submit"];
			var button_exp = ["backbtn", "draft", "delete", "submit"];
			var button_cd = ["cancelbtn", "savebtn"];

			// select visible buttons based on visible fragment
			var button_set;
			switch (oId) {
				case "expensetypescr":
					button_set = button_exp;
					break;
				case "claimscr":
					button_set = button_cd;
					break;
			}

			var i = 0;
			for (i; i < button.length; i++) {
				var btnid = button[i];
				if (button_set.includes(btnid)) {
					this.getView().byId(btnid).setVisible(true);
				} else {
					this.getView().byId(btnid).setVisible(false);
				}
			}

		},
		// Start added by Aiman Salim - To show or hide fields based on Claim Item
		onClaimItemChange: function (oEvent) {
			const sKey = oEvent.getSource().getSelectedKey();
			//set ids 
			const oFe = this.byId("claimFrag--trDateFE") || this.byId("trDateFE");
			const oAltCost = this.byId("claimFrag--altcc") || this.byId("altcc");
			const oStartDate = this.byId("claimFrag--startdate") || this.byId("startdate");
			const oEndDate = this.byId("claimFrag--enddate") || this.byId("enddate");
			const oRecptnum = this.byId("claimFrag--receiptnum") || this.byId("receiptnum");
			const oVehicle = this.byId("claimFrag--vetype") || this.byId("vetype");

			const claimShow = (sKey !== "claim2");

			oFe.setVisible(claimShow);
			oAltCost.setVisible(claimShow);
			oStartDate.setVisible(claimShow);
			oEndDate.setVisible(claimShow);
			oRecptnum.setVisible(claimShow);
			oVehicle.setVisible(claimShow);

		},

		onPressNavToDetail: function (oEvent) {
			var oItem = oEvent.getParameter("item");
			this.byId("pageContainer").to(this.getView().byId('new_request'));
		},

		onPressNavToDetail2: function (oEvent) {
			var oItem = oEvent.getParameter("item");
			this.byId("pageContainer").to(this.getView().byId('expensereport'));
		},

		onRowPress: function (oEvent) {
			const oItem = oEvent.getParameter("listItem");
			const oData = oItem.getBindingContext("myRequest").getObject();

			//Optional: pass data to the next page via a model
			const oNextPageModel = new JSONModel(oData);
			const oNextPage = this.byId("new_request");
			oNextPage.setModel(oNextPageModel, "selectedRequest");

			//Navigate to next page
			this.byId("pageContainer").to(oNextPage);
		},

		onRowPressForm: function (oEvent) {
			// 1) Read the selected row data from the "myRequest" named model
			const oListItem = oEvent.getParameter("listItem");
			const oSelectedData = oListItem.getBindingContext("myRequestform").getObject();

			// 2) Put the selected data into a model that the target page can read
			//    Option A (recommended): set it on the target page under a named model
			const oTargetPage = this.byId("expensereport");   // assumes expensereport is a Page/View in the same view
			if (oTargetPage) {
				oTargetPage.setModel(new sap.ui.model.json.JSONModel(oSelectedData), "selectedRequest");
			} else {
				// Fallback: set on the *view*, which the target page can also inherit if bound
				this.getView().setModel(new sap.ui.model.json.JSONModel(oSelectedData), "selectedRequest");
			}

			// 3) Navigate NavContainer to the expensereport page
			const oNav = this.byId("pageContainer");
			const sTargetId = this.getView().createId("expensereport");
			oNav.to(sTargetId);

			// 4) (Optional) If your expensereport page has step sections, toggle as needed
			const oExpenseTypeScr = this.byId("expensetypescr");
			const oClaimScr = this.byId("claimscr");
			if (oExpenseTypeScr) { oExpenseTypeScr.setVisible(true); }
			if (oClaimScr) { oClaimScr.setVisible(false); }
			if (this.createreportButtons) {
				this.createreportButtons("expensetypescr");
			}
		},

		/* =========================================================
		 * Mileage dialog (Fragment) — use a dedicated controller
		 * ========================================================= */

		// <<< CHANGED: use the new lazy loader instead of openHelloDialog()
		onValueHelpRequest: function () {
			this._openMileageFrag(); // <<< CHANGED
		},

		// <<< ADDED: lazy-load the fragment + its own controller
		_openMileageFrag: function () {
			var oView = this.getView();

			if (!this._pMileageFrag) {
				this._pMileageFrag = new Promise((resolve, reject) => {

					// Load the fragment controller class dynamically
					sap.ui.require(["claima/controller/mileagecalculator.controller"], (MileageFragController) => {
						try {
							var oFragController = new MileageFragController();

							// Pass host + fragment id prefix so Fragment.byId works inside the controller
							oFragController.setHost(this, oView.getId());

							// Load the fragment with id prefix
							Fragment.load({
								id: oView.getId(), // critical for byId() to resolve fragment controls
								name: "claima.fragment.mileagecalculator",
								controller: oFragController
							}).then((oDialog) => {
								// models + lifecycle
								oView.addDependent(oDialog);

								// Submit handler: push values back to your form inputs
								oFragController.setSubmitHandler(function (res) {
									// res = { from, to, km }

									// Put into From input
									var oFrom = this.byId("fromloc_id");
									if (oFrom) {
										oFrom.setValue(res.from);
										var b = oFrom.getBinding("value");
										if (b) {
											var m = b.getModel(), p = b.getPath();
											m.setProperty(p.charAt(0) === "/" ? p : "/" + p, res.from);
										}
									}

									// Put into To input
									var oTo = this.byId("toloc_id");
									if (oTo) {
										oTo.setValue(res.to);
										var b2 = oTo.getBinding("value");
										if (b2) {
											var m2 = b2.getModel(), p2 = b2.getPath();
											m2.setProperty(p2.charAt(0) === "/" ? p2 : "/" + p2, res.to);
										}
									}

									// Optional: push km to your model/input if you want
									 var oKm = this.byId("km_input_id");
									 if (oKm) { oKm.setValue(res.km); }

								}.bind(this));

								// Cache references
								this._mileageFrag = { controller: oFragController, dialog: oDialog };
								resolve(this._mileageFrag);
							}).catch(reject);

						} catch (e) {
							reject(e);
						}
					}, reject);
				});
			}

			// Open the dialog and prefill
			this._pMileageFrag.then(function (ctx) {
				var sFrom = (this.byId("fromloc_id") && this.byId("fromloc_id").getValue()) || "";
				var sTo = (this.byId("toloc_id") && this.byId("toloc_id").getValue()) || "";
				ctx.controller.prefill({ from: sFrom, to: sTo });
				ctx.controller.open();
			}.bind(this));
		},

		// --- (Deprecated in this flow) ---
		// Keeping these for backward-compatibility. Not used anymore.
		openHelloDialog: function () {
			// NO-OP: legacy method kept to avoid breaking any existing reference.
			// Use this._openMileageFrag() instead.
		},
		onAddMileage: function () {
			// NO-OP — handled by MileageFrag.controller via submit handler
		},
		onCancelMileage: function () {
			var oDialog = this.byId("helloDialog");
			if (oDialog) {
				oDialog.close();
			}
		},
		// --- end of mileage integration ---

		// Start added by Jefry Yap 15-01-2026
		onClickMyRequest: async function () {
			if (!this.oDialogFragment) {
				this.oDialogFragment = await Fragment.load({
					id: "request",
					name: "claima.fragment.request",
					type: "XML",
					controller: this,
				});
				this.getView().addDependent(this.oDialogFragment);

				this.oDialogFragment.attachAfterClose(() => {
					this.oDialogFragment.destroy();
					this.oDialogFragment = null;
				});
			}
			this.oDialogFragment.open();
			this.oDialogFragment.addStyleClass('requestDialog')
		},

		onClickCreateRequest: function () {
			
			// value validation
			// const oReq = this.getOwnerComponent().getModel("request");
			// const sType = oReq.getProperty("/type");
			// if (!sType) {
			// 	sap.m.MessageToast.show("Please choose a request type.");
			// 	return;
			// }

			// backend get value
			const oReqModel = this.getView().getModel("request");
			oReqModel.setProperty("/reqid", "Testing ID");
			oReqModel.setProperty("/reqstatus", "Draft")

			// Close Fragment and navigate to Request Form
			this.oDialogFragment.close();
			this.byId("pageContainer").to(this.getView().byId('new_request'));
		},

		onDialogCancel: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		onDialogAfterClose: function () {
			// cleanup if needed
		},

		onPurposeChange: function () {
			this._rebuildDynamicForm();
		},

		onTypeChange: function () {
			this._rebuildDynamicForm();
		},

		// Build/refresh fields every time purpose/type changes
		_rebuildDynamicForm: function () {
			const oView = this.getView();
			const oConfig = oView.getModel("config");
			const oSF = oView.byId("dynForm");

			// Clear previous content
			oSF.destroyContent();

			const sPurpose = oConfig.getProperty("/selection/purpose");
			const sType = oConfig.getProperty("/selection/type");

			const aPurposeFields = (sPurpose && oConfig.getProperty("/fieldSets/purpose/" + sPurpose)) || [];
			const aTypeFields    = (sType && oConfig.getProperty("/fieldSets/type/" + sType)) || [];

			// Merge fields; you can also dedupe by id if overlaps possible
			const aFields = aPurposeFields.concat(aTypeFields);

			// Early return if nothing selected
			if (!aFields.length) {
				return;
			}

			// Generate form elements
			aFields.forEach(function (fdef) {
				// Label
				oSF.addContent(new sap.m.Label({
				text: fdef.label,
				required: !!fdef.required,
				labelFor: fdef.id
				}));

				// Control factory
				let oCtrl = null;
				switch (fdef.control) {
				case "Input":
					oCtrl = new Input(fdef.id, {
					type: fdef.type === "Number" ? "Number" : "Text",
					value: "{config>" + fdef.path + "}"
					});
					break;

				case "TextArea":
					oCtrl = new TextArea(fdef.id, {
					value: "{config>" + fdef.path + "}",
					rows: 3,
					growing: true
					});
					break;

				case "DatePicker":
					oCtrl = new DatePicker(fdef.id, {
					value: "{config>" + fdef.path + "}",
					valueFormat: "yyyy-MM-dd",
					displayFormat: "medium"
					});
					break;

				case "Select":
					oCtrl = new Select(fdef.id, {
					selectedKey: "{config>" + fdef.path + "}"
					});
					// local items
					if (Array.isArray(fdef.items)) {
					fdef.items.forEach(function (it) {
						oCtrl.addItem(new Item({ key: it.key, text: it.text }));
					});
					} else if (fdef.itemsPath) {
					// dynamic items binding example
					oCtrl.bindItems({
						path: "config>" + fdef.itemsPath,
						template: new Item({ key: "{config>key}", text: "{config>text}" })
					});
					}
					break;

				case "FileUploader":
					oCtrl = new FileUploader(fdef.id, {
					fileType: ["pdf", "png", "jpg"],
					maximumFileSize: 10, // MB
					change: this._onFileSelected.bind(this, fdef.path)
					});
					break;

				default:
					oCtrl = new Input(fdef.id, {
					value: "{config>" + fdef.path + "}"
					});
				}

				// Simple required check on change (optional)
				if (fdef.required && oCtrl.setValueState) {
				const fnValidate = () => {
					const v = oConfig.getProperty(fdef.path);
					const empty = v === undefined || v === null || v === "";
					oCtrl.setValueState(empty ? ValueState.Error : ValueState.None);
				};
				oCtrl.attachChange(fnValidate);
				// run once
				setTimeout(fnValidate, 0);
				}

				oSF.addContent(oCtrl);
			}, this);
		},

		_onFileSelected: function (sPath, oEvent) {
			// You can store the File name only, or upload immediately
			const oFile = oEvent.getParameter("files")?.[0];
			if (oFile) {
				const oModel = this.getView().getModel("config");
				oModel.setProperty(sPath, oFile.name);
			}
		},

		onSubmit: function (oEvent) {
			const oModel = this.getView().getModel("config");
			const sPurpose = oModel.getProperty("/selection/purpose");
			const sType = oModel.getProperty("/selection/type");

			// Basic validation
			const aPurposeFields = (sPurpose && oModel.getProperty("/fieldSets/purpose/" + sPurpose)) || [];
			const aTypeFields    = (sType && oModel.getProperty("/fieldSets/type/" + sType)) || [];
			const aFields = aPurposeFields.concat(aTypeFields);

			const missing = aFields.filter(f => f.required).filter(f => {
				const v = oModel.getProperty(f.path);
				return v === undefined || v === null || v === "";
			});

			if (missing.length) {
				sap.m.MessageToast.show("Please fill all required fields.");
				return;
			}

			// Collect payload
			const oPayload = {
				purpose: sPurpose,
				type: sType,
				data: oModel.getProperty("/form")
			};

			// TODO: call backend or proceed
			console.log("Submitting:", oPayload);
			// Close dialog
			oEvent.getSource().getParent().close();
		},

		// End added by Jefry Yap 15-01-2026

		onPressSave: function () {
			// var oModel = this.getView().getModel();
			var oModel = this.getView().getModel("employee");
			// var oModel = new sap.ui.model.odata.v4.ODataModel("sap/odata/v4/EmployeeSrv/");
			// sap.ui.getCore().setModel(oModel);
			const oListBinding = oModel.bindList("/ZREQUEST_TYPE1");

			//dummy testing
			const oContext = oListBinding.create({
				REQUEST_TYPE_ID: "E0001",
				REQUEST_TYPE_DESC: "AIN"
				//REQUEST_ID: crypto.randomUUID()
			});
			oContext.created()
				.then(() => {
					sap.m.MessageToast.show("Record created");
				})
				.catch((oError) => {
					console.error(oError);
					sap.m.MessageBox.error("Create failed");
				});

		},

		onClickCancel: function () {
			this.oDialogFragment.close();
		},
		// ++Jefry_Changes

	});
});
