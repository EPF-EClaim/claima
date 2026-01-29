
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
				doc1: "",
				doc2: ""
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
					this.onClickMyRequest();
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

		// CLICK CONFIGURATION TABLE CARD
		onOpenConfigTable: async function (oEvent) {

			let tableId = oEvent.getSource().getCustomData()[0].getValue();
			let m = this.getView().getModel("configModel");

			m.setProperty("/active/title", tableId);
			m.setProperty("/active/data",
				JSON.parse(JSON.stringify(m.getProperty("/" + tableId)))
			);

			this.loadConfigPage();
		},

		// LOAD CONFIG DETAIL PAGE
		loadConfigPage: async function () {

			if (!this.oConfigDetailPage) {

				const oFragment = await Fragment.load({
					id: this.createId("ConfigFrag"),
					name: "claima.fragment.configuration",
					controller: this
				});
				this.getView().addDependent(oFragment);

				this.oConfigDetailPage = new sap.m.Page(
					this.createId("configDetailPage"),
					{
						title: "eClaim Configuration",
						content: [oFragment],
						showNavButton: true,
						navButtonPress: this.onBackFromConfigTable.bind(this)
					}
				);
				this.byId("pageContainer").addPage(this.oConfigDetailPage);
			}
			this.byId("pageContainer").to(this.byId("configDetailPage"));
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
		// Request Form Controller
		onClickMyRequest: async function () {
			this.getView().getModel("request").setData({
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
				doc1: "",
				doc2: ""
			});
			this._loadReqTypeSelectionData();
			

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
			var oReqModel = this.getView().getModel("request");
			var oInputData = oReqModel.getData();
			var okcode = true;
			var message = '';

			// Check mandatory field based on Request Type
			switch (oInputData.type) {
				case 'RT0001 Travel':
					if (oInputData.purpose == '' || oInputData.type == '' || 
						oInputData.startdate == '' || oInputData.enddate == '' ||
						oInputData.grptype == '' || oInputData.location == '' ||
						oInputData.transport == '') {
						okcode = false;
						message = 'Please enter all mandatory details';
					};
					break;
				case 'RT0002 Mobile Phone Bill':
					if (oInputData.purpose == '' || oInputData.type == '' || 
						oInputData.grptype == '' || oInputData.doc1 == '') {
						okcode = false;
						message = 'Please enter all mandatory details';
						break;
					};
					break;
				case 'RT0003 Event':
					if (oInputData.purpose == '' || oInputData.type == '' || 
						oInputData.startdate == '' || oInputData.enddate == '' ||
						oInputData.grptype == '' || oInputData.location == '' ||
						oInputData.transport == ''|| oInputData.detail == '' || 
						oInputData.policy == '') {
						okcode = false;
						message = 'Please enter all mandatory details';
						break;
					};
					break;
				case 'RT0004 Reimbursement':
					if (oInputData.purpose == '' || oInputData.type == '' || 
						oInputData.grptype == '') {
						okcode = false;
						message = 'Please enter all mandatory details';
					};
					break;
				case 'RT0005 Cash Advance':
					if (oInputData.purpose == '' || oInputData.type == '' || 
						oInputData.cashadvtype == '' || oInputData.startdate == '' || 
						oInputData.enddate == '' || oInputData.grptype == '' || 
						oInputData.location == '' || oInputData.transport == '') {
						okcode = false;
						message = 'Please enter all mandatory details';
					};
					if (oInputData.type == 'Event' && ( oInputData.detail == '' || 
						oInputData.policy == '' )) {
						okcode = false;
						message = 'Please enter all mandatory details';
					};
					break;
				default:
					if (oInputData.purpose == '' || 
						oInputData.type == '') {
						okcode = false;
						message = 'Please enter all mandatory details';
					} 
			}

			// Check attachment 1 (mandatory)
			if (okcode == true && oInputData.doc1 == '') {
				okcode = false;
				message = 'Please upload Attachment 1';
			};

			if (okcode == true && oInputData.enddate < oInputData.startdate) {
				okcode = false;
				message = "End Date cannot be earlier than begin date";
			}

			
			// value validation
			if (okcode === false) {
				MessageToast.show(message);} 
			else {
				this.createRequestHeader(oInputData, oReqModel);
			};
		},

		// load request type data
		_loadReqTypeSelectionData: function () {
            var oView = this.getView();
            var oJSONModel = new JSONModel();
			
			// Safely get the base service URL from manifest
			var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
            var sServiceUrl = sBaseUri + "/ZREQUEST_TYPE"; 

            // Fetch data from CAP OData service
            fetch(sServiceUrl)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(function (data) {
					const aTypes = data.value || data;
					const aFiltered = aTypes.filter(item => item.STATUS === "ACTIVE");
					oJSONModel.setData({ types: aFiltered });
                    oView.setModel(oJSONModel, "req_type_list");
                    // MessageToast.show("Data loaded successfully");
                })
                .catch(function (error) {
                    console.error("Error fetching CDS data:", error);
                    // MessageToast.show("Failed to load data", error);
                });
        },

		createRequestHeader:  function (oInputData, oReqModel) {
			this.getCurrentReqNumber().then((result) => {
				if (result) {
					oReqModel.setProperty("/reqid", result.reqNo);
					oReqModel.setProperty("/reqstatus", "Draft")

					// Write to Database Table ZREQUEST_HEADER
					var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
					var sServiceUrl = sBaseUri + "/ZREQUEST_HEADER"; 

					fetch(sServiceUrl, 
						{method: "POST", headers: {"Content-Type": "application/json"},
						body: JSON.stringify({
							EMP_ID                 : "000001",
							REQUEST_ID             : oInputData.reqid,
							REQUEST_TYPE_ID        : oInputData.type,
							REFERENCE_NUMBER       : "100236",
							OBJECTIVE_PURPOSE      : oInputData.purpose,
							START_DATE             : oInputData.startdate,
							END_DATE               : oInputData.enddate,
							REMARK                 : oInputData.comment,
							CLAIM_TYPE_ID          : "",
							REQUEST_GROUP_ID       : oInputData.grptype,
							ALTERNATE_COST_CENTRE  : oInputData.altcostcenter,
							AMOUNT                 : "10000",
							ATTACHMENT             : oInputData.doc1,
							LOCATION               : oInputData.location,
							TYPE_OF_TRANSPORTATION : oInputData.transport,
							ZCLAIM_TYPE   		   : "",
							ZREQUEST_ITEM 		   : "",
							ZREQUEST_TYPE 		   : "",
							ZREQUEST_GRP  		   : "",
							ZCLAIM_HEADER 		   : ""
						}) 
					})
					.then(r => r.json())
					.then((res) => {
						if (!res.error) {
							this.oDialogFragment.close();
							this.byId("pageContainer").to(this.getView().byId('new_request'));
							this.updateCurrentReqNumber(result.current);
						} else {
							MessageToast.show(res.error.code, res.error.message);
						};
					});
				};
			});
		},

		getCurrentReqNumber: async function () {
			const sBaseUri = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri || "/odata/v4/EmployeeSrv/";
			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZNUM_RANGE";

			try {
				const response = await fetch(sServiceUrl);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				const nr01 = (data.value || data).find(x => x.RANGE_ID === "NR01");
				if (!nr01 || nr01.CURRENT == null) {
					throw new Error("NR01 not found or CURRENT is missing");
				}

				const current = Number(nr01.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const reqNo = `REQ${yy}${String(current).padStart(9, "0")}`;

				return { reqNo, current };

			} catch (err) {
				console.error("Error fetching CDS data:", err);
				return null; // or: throw err;
			}
		},


		updateCurrentReqNumber: async function (currentNumber) {
			const sId = "NR01";
			const sBaseUri =
				this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri
				|| "/odata/v4/EmployeeSrv/";

			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZNUM_RANGE('" + encodeURIComponent(sId) + "')";
			const nextNumber = currentNumber + 1;

			try {
				const res = await fetch(sServiceUrl, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ CURRENT: String(nextNumber) })
				});

				if (!res.ok) {
				const errText = await res.text().catch(() => "");
				throw new Error(`PATCH failed ${res.status} ${res.statusText}: ${errText}`);
				}

				// PATCH often returns 204
				if (res.status === 204) return { CURRENT: nextNumber };

				// If the server returns JSON entity
				const contentType = res.headers.get("content-type") || "";
				if (contentType.includes("application/json")) {
				return await res.json();
				}
				return await res.text(); // fallback
			} catch (e) {
				console.error("Error updating number range:", e);
				return null;
			}
		},

		// End added by Jefry Yap 15-01-2026

		onPressSave: function () {
			var oModel = this.getView().getModel("employee");
			const oListBinding = oModel.bindList("/ZNUM_RANGE");

			//dummy testing
			const oContext = oListBinding.create({
				RANGE_ID: "E0010",
				FROM: "AIN"
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

	});
});
