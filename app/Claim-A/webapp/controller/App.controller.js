
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
				reqtype: "travel",
				tripstartdate: "",
				tripenddate: "",
				eventstartdate: "",
				eventenddate: "",
				grptype: "individual",
				location: "",
				transport: "",
				altcostcenter: "",
				doc1: "",
				doc2: "",
				comment: "", 
				eventdetail1: "",
				eventdetail2: "",
				eventdetail3: "",
				eventdetail4: "",
				reqid: "",
				reqstatus: "",
				costcenter: "",
				cashadvamt: 0,
				reqamt: 0,
				totalamt: 0
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
				ZRISK: [],
				ConfigurationTable3: [],
				ConfigurationTable4: [],
				active: {
					data: []
				}
			});
			this.getView().setModel(oConfigModel, "configModel");
		},


		// BACK BUTTON CONFIGURATION
		onBackFromConfigTable: function () {
			this.byId("pageContainer").to(this.getView().byId('configurationPage'));
		},

		// SAVE CONFIGURATION
		onSaveConfigTable: function () {
			let m = this.getView().getModel("configModel");
			let tableId = m.getProperty("/active/title");
			let activeData = m.getProperty("/active/data");

			activeData.forEach(r => r.edit = false);
			m.setProperty("/" + tableId, activeData);
			
			console.log(m.getProperty("/active/data/"));
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
			console.log(m.getProperty("/active/data/"));

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
				case "sidenav_createreport":
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
		// onNavCreateReport: async function () {
		// 	if (!this.oDialogFragment) {
		// 		this.oDialogFragment = await Fragment.load({
		// 			name: "claima.fragment.createreport",
		// 			type: "XML",
		// 			controller: this,
		// 		});
		// 		this.getView().addDependent(this.oDialogFragment);
		// 	}
		// 	this.oDialogFragment.open();

		// },

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

		// Create Report - Functions
        async onNavCreateReport() {
            this.oDialog ??= await this.loadFragment({
                name: "claima.fragment.createreport",
            });
            this.oDialog.open();
        },

		onCreateReport_Create: function () {
			// validate input data
			var oInputModel = this.getView().getModel("input");
			var oInputData = oInputModel.getData();

			if (
				oInputData.report.purpose == '' ||
				oInputData.report.startdate == '' ||
				oInputData.report.enddate == '' ||
				oInputData.report.comment == '') {
				// required fields without value
				var message = this.getView().getModel("i18n").getResourceBundle().getText("dialog_createreport_required");;
				MessageToast.show(message);
			} else {

				// use default value for category if no value detected
				if (oInputData.report.category == '') {
					oInputData.report.category = 'expcat_direct';
				}

				// set as current data
				var oCurrentModel = this.getView().getModel("current");
				oCurrentModel.setData(oInputData);

				// go to expense report screen
				var view = "expensereport";
				this.oDialog.close();
				this.byId("pageContainer").to(this.getView().createId(view));
				this.getView().byId("expensetypescr").setVisible(true);
				this.getView().byId("claimscr").setVisible(false);
				this.createreportButtons("expensetypescr");
			}
		},

		onCreateReport_Cancel: function () {
			this.oDialog.close();
		},
		// end Create Report - Functions

		onPressBack: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("dashboard"));
		},

		onPressSaveDraft: function (oEvent) {
			this.getCurrentReportNumber().then((result) => {
				if (result) {
					// Set data for ZCLAIM_HEADER
					var oCurrentModel = this.getView().getModel("current");
					//// Report Number
					oCurrentModel.setProperty("/report/claim_id", result.reportNo);
					//// Status ID
					oCurrentModel.setProperty("/report/status_id", "Draft")
					//// get data from current claim header shown
					var oCurrentData = oCurrentModel.getData();

					//// Claim Main Category ID
					switch (oCurrentData.report.category) {
						case "expcat_direct":
							var claimMainCatID = "0000000001";
							break;
						case "expcat_auto":
							claimMainCatID = "0000000002";
							break;
						case "expcat_withoutrequest":
							claimMainCatID = "0000000003";
							break;
					}

					//// Claim Date (get current date)
					var currentDate = new Date().toJSON().substring(0,10);

					//// Amount Approved (Total)
					var amtApproved = Number.parseFloat(oCurrentData.report.amt_approved).toFixed(2);
					if (amtApproved == 'NaN') {
						amtApproved = 0.00;
					}

					// Write to Database Table ZCLAIM_HEADER
					var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
					var sServiceUrl = sBaseUri + "/ZCLAIM_HEADER"; 

					fetch(sServiceUrl, 
						{method: "POST", headers: {"Content-Type": "application/json"},
						body: JSON.stringify({
							CLAIM_ID               : oCurrentData.report.claim_id,
							CLAIM_MAIN_CAT_ID      : claimMainCatID,
							EMP_ID                 : "000001",
							CLAIM_DATE             : currentDate,
							CATEGORY               : "Course",
							ALTERNATE_COST_CENTER  : null,
							CLAIM_TYPE_ID          : "001",
							TOTAL                  : amtApproved,
							STATUS_ID          	   : oCurrentData.report.status_id,
							DEPARTMENT             : "IT Dept 2",
							EMP_NAME               : "Ahmad Anthony",
							JOB_POSITION		   : "Junior Analyst",
							PERSONAL_GRADE		   : "22",
							POSITION_NO		       : "000003",
							ZCLAIM_ITEM            : null
						}) 
					})
					.then(r => r.json())
					.then((res) => {
						if (!res.error) {
							MessageToast.show("Record created");
							this.updateCurrentReportNumber(result.current);
							this.byId("pageContainer").to(this.getView().createId("dashboard"));
						} else {
							MessageToast.show(res.error.code, res.error.message);
						};
					});
				};
			});
		},

		getCurrentReportNumber: async function () {
			const sBaseUri = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri || "/odata/v4/EmployeeSrv/";
			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZNUM_RANGE";

			try {
				const response = await fetch(sServiceUrl);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				const nr02 = (data.value || data).find(x => x.RANGE_ID === "NR02");
				if (!nr02 || nr02.CURRENT == null) {
					throw new Error("NR02 not found or CURRENT is missing");
				}

				const current = Number(nr02.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const reportNo = `CLM${yy}${String(current).padStart(9, "0")}`;

				return { reportNo, current };

			} catch (err) {
				console.error("Error fetching CDS data:", err);
				return null; // or: throw err;
			}
		},

		updateCurrentReportNumber: async function (currentNumber) {
			const sId = "NR02";
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
		//Start Aiman Salim 22/1/2026 - Comment off

		//For MyExpenseReport view - Upon click, it will move to ExpenseReport detail page. 


		_getUserIdFromFLP: function () {
			try {
				if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser) {
					return sap.ushell.Container.getUser().getId(); // e.g. AIMAN.SALIM
				}
			} catch (e) { }
			return null;
		},

		onRowPress: async function (oEvent) {
			/* 					const oItem = oEvent.getParameter("listItem");
								const oData = oItem.getBindingContext("employee").getObject();
			
								const oNextPageModel = new JSONModel(oData);
								const oNextPage = this.byId("expensereport");
								oNextPage.setModel(oNextPageModel, "selectedRequest");
			
								//Navigate to next page
								this.byId("pageContainer").to(oNextPage); */


			// row context from named model "employee"
			const oItem = oEvent.getParameter("listItem");
			const oCtx = oItem && oItem.getBindingContext("employee")


			if (!oCtx) {
				MessageToast.show("No context found on the selected row.");
				return;
			}


			await oCtx.requestProperty([
				"EMP_ID",
				"EMP_NAME",
				"STATUS_ID",
				"DEPARTMENT",
				"ALTERNATE_COST_CENTRE",
				"AMOUNT",
				"CLAIM_MAIN_CAT_ID"
				// ... add more properties if your detail page needs them
			]); // Will fetch only what's missing from the backend

			//const row = oCtx.getObject();
			const fullEntity = await oCtx.requestObject()


			// map header → current schema used by report.fragment
			// const mapped = this._mapHeaderToCurrent(row);
			const mapped = this._mapHeaderToCurrent(fullEntity);


			// set "current" model data
			let oCurrent = this.getView().getModel("current");
			if (!oCurrent) {
				oCurrent = new sap.ui.model.json.JSONModel();
				this.getView().setModel(oCurrent, "current");
			}
			oCurrent.setData(mapped);


			// navigate to the detail page that contains report.fragment
			const oDetailPage = this.byId("expensereport");
			if (!oDetailPage) {
				sap.m.MessageToast.show("Detail page 'expensereport' not found.");
				return;
			}
			this.byId("pageContainer").to(oDetailPage);
		},

		_mapHeaderToCurrent: function (row) {
			return {
				id: row.CLAIM_ID,
				location: row.CLAIM_MAIN_CAT_ID || "",
				costcenter: row.CLAIM_MAIN_CAT_ID || "",
				altcc: row.ALTERNATE_COST_CENTRE || "",
				total: row.AMOUNT,
				cashadv: row.CLAIM_ID || "",
				finalamt: row.CLAIM_ID || "",
				report: {
					id: row.CLAIM_ID,
					purpose: row.CATEGORY || "",
					startdate: row.CLAIM_DATE || "",
					enddate: row.CLAIM_DATE || "",
					location: row.location || "",
					category: row.CATEGORY || "",
					comment: row.CLAIM_ID || "",
					amt_approved: row.TOTAL || ""
				}
			};
		},

		//For MyRequestForm view - Upon click, it will move to MyRequestForm detail page. 
		onRowPressForm: async function (oEvent) {
			// row context from named model "employee"
			const oItem = oEvent.getParameter("listItem");
			const oCtx = oItem && oItem.getBindingContext("employee");
			const row = oCtx.getObject();
			const reqid = String(row.REQUEST_ID).trim();
			console.log("reqid:", reqid);
			
			if (!oCtx) {
				sap.m.MessageToast.show("No context found on the selected row.");
				return;
			}

			try {
				this.getView().setBusy(true);

				//await oCtx.requestProperty([]);



				// Fetch the full entity (remaining props will be resolved as needed)
				const fullEntity = await oCtx.requestObject();

				// Map backend entity → MyRequestForm view model schema
				const mapped = this._mapHeaderToCurrentRequest(fullEntity);

				// Set/refresh the "request" JSON model (same pattern as onRowPress)
				let oRequest = this.getView().getModel("request");
				if (!oRequest) {
					oRequest = new sap.ui.model.json.JSONModel();
					this.getView().setModel(oRequest, "request");
				}
				oRequest.setData(mapped);

				// Navigate to detail page that consumes the "request" model
				const oPageContainer = this.byId("pageContainer");
				const oDetailPage = this.byId("new_request");
				if (!oDetailPage) {
					sap.m.MessageToast.show("Detail page 'new_request' not found.");
					return;
				}
				oPageContainer.to(oDetailPage);

			} catch (e) {
				jQuery.sap.log.error("onRowPressForm failed: " + e);
				sap.m.MessageToast.show("Failed to load request data.");
			} finally {
				this.getView().setBusy(false);
			}
		},

		_mapHeaderToCurrentRequest: function (row) {
			// Helper: format date (if row.CLAIM_DATE is Date or /Date(...)/)
			const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
			const toYMD = (d) => {
				try {
					if (d instanceof Date) {
						return fmt.format(d);
					}
					if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
						return d; // already "YYYY-MM-DD"
					}
				} catch (e) {/* ignore */ }
				return d || "";
			};

			return {
				purpose: row.OBJECTIVE_PURPOSE || "",
				reqid: row.REQUEST_ID || "",
				startdate: toYMD(row.START_DATE),
				enddate: toYMD(row.END_DATE),
				altcostcenter: "",
				location: row.LOCATION || "",
				detail: row.REMARK || "",
				grptype: row.REQUEST_GROUP_ID || "",
				// Static totals shown as "0.00" in fragment; keep if you plan to compute later
				saved: "",
				// If you later bind these, set proper numbers/strings:
				// caa / amt / total_amt not present in fragment's model; they are static "0.00" texts
				// You can add them when needed:
				// cashadvamount : "0.00",
				// amount        : "0.00",
				// totalamount   : "0.00"
			};
		},


		// CLICK CONFIGURATION TABLE CARD
		onOpenConfigTable: async function (oEvent) {

			let tableId = oEvent.getSource().getCustomData()[0].getValue();
			console.log(tableId);
			let m = this.getView().getModel("configModel");

			m.setProperty("/active/title", tableId);
			m.setProperty("/active/data",
				JSON.parse(JSON.stringify(m.getProperty("/" + tableId)))
			);
			console.log(m.getProperty("/active/data/"));
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
				reqtype: "travel",
				tripstartdate: "",
				tripenddate: "",
				eventstartdate: "",
				eventenddate: "",
				grptype: "individual",
				location: "",
				transport: "",
				altcostcenter: "",
				doc1: "",
				doc2: "",
				comment: "", 
				eventdetail1: "",
				eventdetail2: "",
				eventdetail3: "",
				eventdetail4: "",
				reqid: "",
				reqstatus: "",
				costcenter: "",
				cashadvamt: 0,
				reqamt: 0,
				totalamt: 0
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
			// switch (oInputData.type) {
			// 	case 'RT0001 Travel':
			// 		if (oInputData.purpose == '' || oInputData.reqtype == '' || 
			// 			oInputData.tripstartdate == '' || oInputData.tripenddate == '' ||
			// 			oInputData.eventstartdate == '' || oInputData.eventenddate == '' ||
			// 			oInputData.grptype == '' || oInputData.location == '' ||
			// 			oInputData.transport == '' || oInputData.comment == '' ) {
			// 			okcode = false;
			// 			message = 'Please enter all mandatory details';
			// 		};
			// 		break;
			// 	case 'RT0002 Mobile':
			// 		if (oInputData.purpose == '' || oInputData.reqtype == '' || 
			// 			oInputData.grptype == '' || oInputData.comment == '' ) {
			// 			okcode = false;
			// 			message = 'Please enter all mandatory details';
			// 			break;
			// 		};
			// 		break;
			// 	case 'RT0003 Event':
			// 		if (oInputData.purpose == '' || oInputData.reqtype == '' || 
			// 			oInputData.eventstartdate == '' || oInputData.eventenddate == '' ||
			// 			oInputData.grptype == '' || oInputData.location == '' ||
			// 			oInputData.comment == '' || oInputData.eventdetail1 == '' || 
			// 			oInputData.eventdetail2 == '' || oInputData.eventdetail3 == '' || 
			// 			oInputData.eventdetail4 == '') {
			// 			okcode = false;
			// 			message = 'Please enter all mandatory details';
			// 			break;
			// 		};
			// 		break;
			// 	case 'RT0004 Reimbursement':
			// 		if (oInputData.purpose == '' || oInputData.reqtype == '' || 
			// 			oInputData.tripstartdate == '' || oInputData.tripenddate == '' ||
			// 			oInputData.grptype == '' || oInputData.comment == '' ) {
			// 			okcode = false;
			// 			message = 'Please enter all mandatory details';
			// 		};
			// 		break;
			// 	default:
			// 		if (oInputData.purpose == '' || 
			// 			oInputData.type == '') {
			// 			okcode = false;
			// 			message = 'Please enter all mandatory details';
			// 		} 
			// }

			// // Check attachment 1 (mandatory)
			// if (okcode == true && oInputData.doc1 == '') {
			// 	okcode = false;
			// 	message = 'Please upload Attachment 1';
			// };

			// if (okcode == true && oInputData.enddate < oInputData.startdate) {
			// 	okcode = false;
			// 	message = "End Date cannot be earlier than begin date";
			// }

			
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
					// var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
					// var sServiceUrl = sBaseUri + "/ZREQUEST_HEADER"; 

					// fetch(sServiceUrl, 
					// 	{method: "POST", headers: {"Content-Type": "application/json"},
					// 	body: JSON.stringify({
					// 		EMP_ID                 : "000001",
					// 		REQUEST_ID             : oInputData.reqid,
					// 		REQUEST_TYPE_ID        : oInputData.reqtype,
					// 		REFERENCE_NUMBER       : "100236",
					// 		OBJECTIVE_PURPOSE      : oInputData.purpose,
					// 		START_DATE             : oInputData.tripstartdate,
					// 		END_DATE               : oInputData.tripenddate,
					// 		REMARK                 : oInputData.comment,
					// 		CLAIM_TYPE_ID          : "",
					// 		REQUEST_GROUP_ID       : oInputData.grptype,
					// 		ALTERNATE_COST_CENTRE  : oInputData.altcostcenter,
					// 		AMOUNT                 : String(oInputData.totalamt),
					// 		ATTACHMENT             : oInputData.doc1,
					// 		LOCATION               : oInputData.location,
					// 		TYPE_OF_TRANSPORTATION : oInputData.transport,
					// 		ZCLAIM_TYPE   		   : "",
					// 		ZREQUEST_ITEM 		   : "",
					// 		ZREQUEST_TYPE 		   : "",
					// 		ZREQUEST_GRP  		   : "",
					// 		ZCLAIM_HEADER 		   : ""
					// 	}) 
					// })
					// .then(r => r.json())
					// .then((res) => {
					// 	if (!res.error) {
					// 		this.updateCurrentReqNumber(result.current);
					// 		this.oDialogFragment.close();
					// 		this.byId("pageContainer").to(this.getView().byId('new_request'));
					// 	} else {
					// 		MessageToast.show(res.error.code, res.error.message);
					// 	};
					// });
					
					this.oDialogFragment.close();
					this.byId("pageContainer").to(this.getView().byId('new_request'));
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
				RANGE_ID: "E0012",
				FROM: "AS"
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
