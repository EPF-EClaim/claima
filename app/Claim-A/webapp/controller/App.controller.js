
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
	"sap/tnt/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
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
	tntLibrary,
	Filter,
	FilterOperator
) {
	"use strict";


	return Controller.extend("claima.controller.App", {
		onInit: function () {
			
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


			const oItemsModel = new JSONModel({ results: [] });
			this.getView().setModel(oItemsModel, "items");


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
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteMain"); //dummy routing

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
		// Configuration App
		onClickConfiguration: async function () {
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

		onCreateReport_Create: async function () {
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

				// get current claim number
				var currentReportNumber = await this.getCurrentReportNumber();

				// use default value for category if no value detected
				if (oInputData.report.category == '') {
					oInputData.report.category = 'expcat_direct';
				}
				//// Claim Date (get current date)
				var currentDate = new Date().toJSON().substring(0,10);
				//// Amount Approved (Total)
				var amtApproved = Number.parseFloat(oInputData.report.amt_approved).toFixed(2);
				if (amtApproved == 'NaN') {
					amtApproved = 0.00;
				}
				//// Claim Main Category ID
				switch (oInputData.report.category) {
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

				//// set as current data
				// var oCurrentModel = this.getView().getModel("current");
				// oCurrentModel.setData(oInputData);
				
				// set context
				var currentEntity = {
					"CLAIM_ID": currentReportNumber.reportNo,
					"CLAIM_MAIN_CAT_ID": claimMainCatID,
					"EMP_ID": "000001",
					"CLAIM_DATE": currentDate,
					"CATEGORY": oInputData.report.purpose,
					"ALTERNATE_COST_CENTER": null,
					"CLAIM_TYPE_ID": "001",
					"TOTAL": amtApproved,
					"STATUS_ID": "Draft",
					"DEPARTMENT": "IT Dept 2",
					"EMP_NAME": "Ahmad Anthony",
					"JOB_POSITION": "Junior Analyst",
					"PERSONAL_GRADE": "22",
					"POSITION_NO": "000003",
					"ZCLAIM_ITEM": null
				}

				// map header → current schema used by report.fragment
				// const mapped = this._mapHeaderToCurrent(row);
				const mapped = this._mapHeaderToCurrent(currentEntity);


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
				
				//// go to expense report screen
				// var view = "expensereport";
				this.oDialog.close();
				// this.byId("pageContainer").to(this.getView().createId(view));
				// this.getView().byId("expensetypescr").setVisible(true);
				// this.getView().byId("claimscr").setVisible(false);
				// this.createreportButtons("expensetypescr");
			}
		},

		onCreateReport_Cancel: function () {
			this.oDialog.close();
		},
		// end Create Report - Functions

		onPressBack: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("dashboard"));
		},

		onPressSaveDraft: async function (oEvent) {
			var currentReportNumber = await this.getCurrentReportNumber();

			// Set data for ZCLAIM_HEADER
			var oCurrentModel = this.getView().getModel("current");
			//// Claim Type ID
			oCurrentModel.setProperty("/report/claim_type", "001")
			//// Status ID
			oCurrentModel.setProperty("/report/status_id", "Draft")
			//// get data from current claim header shown
			var oCurrentData = oCurrentModel.getData();

			////// Claim Main Category ID
			// switch (oCurrentData.report.category) {
				// case "expcat_direct":
					// var claimMainCatID = "0000000001";
					// break;
				// case "expcat_auto":
					// claimMainCatID = "0000000002";
					// break;
				// case "expcat_withoutrequest":
					// claimMainCatID = "0000000003";
					// break;
			// }

			//// Alternate Cost Center
			var altCC = oCurrentData.altcc;
			if (altCC == '') {
				altCC = null;
			}

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
					CLAIM_ID               : oCurrentData.report.id,
					// CLAIM_MAIN_CAT_ID      : claimMainCatID,
					CLAIM_MAIN_CAT_ID      : oCurrentData.costcenter,
					EMP_ID                 : "000001",
					CLAIM_DATE             : oCurrentData.report.startdate,
					CATEGORY               : oCurrentData.report.purpose,
					ALTERNATE_COST_CENTER  : altCC,
					CLAIM_TYPE_ID          : oCurrentData.report.claim_type,
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
					this.updateCurrentReportNumber(currentReportNumber.current);
					this.byId("pageContainer").to(this.getView().createId("dashboard"));
				} else {
					MessageToast.show(res.error.code, res.error.message);
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
		// Start added by Aiman Salim 22/1/2026 - For Create Expense Report.To show or hide fields based on Claim Item
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

		//Testing for User ID fetch based on user login
		_getUserIdFromFLP: function () {
			try {
				if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser) {
					return sap.ushell.Container.getUser().getId(); // e.g. AIMAN.SALIM
				}
			} catch (e) { }
			return null;
		},
		//For MyClaimStatus(myexpensereport) on item click. This will fetch data based on row selected and push to detail page

		onRowPress: async function (oEvent) {
			const oItem = oEvent.getParameter("listItem");
			const oCtx = oItem && oItem.getBindingContext("employee");

			if (!oCtx) {
				sap.m.MessageToast.show("No context found on the selected row.");
				return;
			}

			// optional: clear the selection (nice UX)
			const oSrcTable = oEvent.getSource();
			if (oSrcTable && oSrcTable.removeSelections) {
				oSrcTable.removeSelections(true);
			}

			const oModel = oCtx.getModel();        // OData V4 model "employee"
			const oPage = this.byId("expensereport");

			try {
				oPage.setBusy(true);

				// 2) Full header (gets anything not in $select)
				const oHeader = await oCtx.requestObject();
				const sClaimId = String(oHeader.CLAIM_ID || "").trim();

				if (!sClaimId) {
					sap.m.MessageToast.show("Selected row does not have a valid CLAIM_ID.");
					return;
				}

				// 3) Map header → "current" (report.fragment)
				let oCurrent = this.getView().getModel("current");
				if (!oCurrent) {
					oCurrent = new sap.ui.model.json.JSONModel();
					this.getView().setModel(oCurrent, "current");
				}
				oCurrent.setData(this._mapHeaderToCurrent(oHeader));

				// 4) Fetch items → "items" model (expensetype.fragment)
				const oItemsBinding = oModel.bindList(
					"/ZCLAIM_ITEM",
      /* oContext  */ undefined,
      /* aSorters  */[],
      /* aFilters  */[new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId)],
      /* mParams   */ {
						$select: "CLAIM_ID,START_DATE,CLAIM_TYPE_ITEM,CLAIM_ITEM_ID,AMOUNT,CURRENCY,STAFF_CATEGORY"
					}
				);

				const aItemCtxs = await oItemsBinding.requestContexts(0, Infinity);
				const aItems = await Promise.all(aItemCtxs.map(c => c.requestObject()));

				let oItemsModel = this.getView().getModel("items");
				if (!oItemsModel) {
					oItemsModel = new sap.ui.model.json.JSONModel({ results: [] });
					this.getView().setModel(oItemsModel, "items");
				}
				oItemsModel.setData({ results: aItems || [] });

				// 5) Navigate
				const oPageContainer = this.byId("pageContainer");
				oPageContainer.to(oPage);

				// Show expensetype first (your current UX)
				this.getView().byId("expensetypescr").setVisible(true);
				this.getView().byId("claimscr").setVisible(false);
				this.createreportButtons("expensetypescr");

			} catch (e) {
				jQuery.sap.log.error("onRowPress error: " + e);
				sap.m.MessageToast.show("Failed to load claim header/items.");
			} finally {
				oPage.setBusy(false);
			}
		},

		_mapHeaderToCurrent: function (row) {
			// Helper: convert to yyyy-MM-dd (adjust to your locale if needed)
			const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
			const toYMD = (d) => {
				if (d instanceof Date) return fmt.format(d);
				// handle ISO string "2026-01-26" or similar -> keep
				if (typeof d === "string") return d;
				return d || "";
			};

			return {
				id: row.CLAIM_ID,
				location: row.CLAIM_MAIN_CAT_ID || "",
				costcenter: row.CLAIM_MAIN_CAT_ID || "",
				altcc: row.ALTERNATE_COST_CENTRE || "",
				total: row.TOTAL,          // you use TOTAL in the table
				cashadv: row.CLAIM_ID || "",
				finalamt: row.CLAIM_ID || "",
				report: {
					id: row.CLAIM_ID,
					purpose: row.CATEGORY || "",
					startdate: toYMD(row.CLAIM_DATE),
					enddate: toYMD(row.CLAIM_DATE),
					location: row.LOCATION || "",
					category: row.CATEGORY || "",
					comment: row.CLAIM_ID || "",
					amt_approved: row.TOTAL || ""
				}
			};
		},

		//For My Pre-Approval (MyRequestForm) view - Upon click, it will move to MyRequestForm detail page. 
		onRowPressForm: async function (oEvent) {
			// row context from named model "employee"
			const oItem = oEvent.getParameter("listItem");
			const oCtx = oItem && oItem.getBindingContext("employee");

			if (!oCtx) {
				sap.m.MessageToast.show("No context found on the selected row.");
				return;
			}

			try {
				this.getView().setBusy(true);

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


				const oModel = this.getOwnerComponent().getModel("request")
					|| this.getView().getModel("request");
				if (oModel) {
					oModel.setProperty("/view", "list");   // your custom flag
				}

				const sReqId = String(fullEntity.REQUEST_ID || "").trim();

				// Navigate to detail page that consumes the "request" model
				const oPageContainer = this.byId("pageContainer");
				const oDetailPage = this.byId("new_request");
				if (!oDetailPage) {
					sap.m.MessageToast.show("Detail page 'new_request' not found.");
					return;
				}
				oPageContainer.to(oDetailPage);

				this._callRequestFormLoad(oDetailPage, sReqId);

			} catch (e) {
				jQuery.sap.log.error("onRowPressForm failed: " + e);
				sap.m.MessageToast.show("Failed to load request data.");
			} finally {
				this.getView().setBusy(false);
			}
		},

		_mapHeaderToCurrentRequest: function (row) {
			// Helper: format date (if row.CLAIM_DATE is Date or /Date(...)/)
			const fmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd MMM yyyy" });
			const toYMD = (d) => {
				try {
					if (d instanceof Date) {
						return fmt.format(d);
					}
					if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
						return fmt.format(new Date(d));
					}
				} catch (e) {/* ignore */ }
				return d || "";
			};

			return {
				purpose: row.OBJECTIVE_PURPOSE || "",
				reqid: row.REQUEST_ID || "",
				tripstartdate: toYMD(row.TRIP_START_DATE),
				tripenddate: toYMD(row.TRIP_END_DATE),
				eventstartdate: toYMD(row.EVENT_START_DATE),
				eventenddate: toYMD(row.EVENT_END_DATE),
				costcenter: row.COST_CENTER || "",
				altcostcenter: row.ALTERNATE_COST_CENTRE || "",
				location: row.LOCATION || "",
				detail: row.REMARK || "",
				grptype: row.REQUEST_GROUP_ID || "",
				transport: row.TYPE_OF_TRANSPORTATION || "",
				reqstatus: row.STATUS || "",
				reqtype: row.REQUEST_TYPE_ID || "",
				comment: row.REMARK || "",
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

		/**
		 * Call RequestForm.loadItemsForRequest by scanning descendants of the page.
		 * No changes needed in RequestForm.controller.
		 */
		_callRequestFormLoad: function (oDetailPage, sReqId) {
			// Defer to allow NavContainer to render the page content
			setTimeout(function () {
				// find the first descendant that exposes getController() (typically the inner XMLView)
				var aViews = (typeof oDetailPage.findAggregatedObjects === "function")
					? oDetailPage.findAggregatedObjects(true, function (c) {
						return typeof c.getController === "function";
					})
					: [];

				var oCtrl = (aViews && aViews.length) ? aViews[0].getController() : null;

				if (oCtrl && typeof oCtrl.loadItemsForRequest === "function") {
					oCtrl.loadItemsForRequest(sReqId);
				} else {
					jQuery.sap.log.warning("RequestForm controller API 'loadItemsForRequest' not found.");
				}
			}, 0);
		},
		// End added by Aiman Salim 22/1/2026 - 05/02/2026


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
		 * Mileage dialog (Fragment) — use a dedicated controller - For Google Maps
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

		// ==================================================
		// Request Form Controller
		// ==================================================

		onClickMyRequest: async function () {
            // Reset JSON Model for the Form
            const oRequestModel = this.getOwnerComponent().getModel("request");
            oRequestModel.setData({
                list_count: 0,
                view: "view",
                req_header: {
                    purpose: "",
                    reqtype: "travel",
                    tripstartdate: null,
                    tripenddate: null,
                    eventstartdate: null,
                    eventenddate: null,
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
                    reqamt: 0
                }
            });

            this._loadReqTypeSelectionData();

            if (!this.oDialogFragment) {
                this.oDialogFragment = await Fragment.load({
                    id: "request",
                    name: "claima.fragment.request",
                    controller: this
                });
                this.getView().addDependent(this.oDialogFragment);
                
                this.oDialogFragment.attachAfterClose(() => {
                    // Note: In many V4 apps, we keep the fragment and just reset the data
                    // But staying true to your logic of destroying it:
                    this.oDialogFragment.destroy();
                    this.oDialogFragment = null;
                });
            }
            this.oDialogFragment.open();
            this.oDialogFragment.addStyleClass('requestDialog');
        },

        _loadReqTypeSelectionData: function () {
            const oMainModel = this.getOwnerComponent().getModel(); // OData V4 Model
            const oListBinding = oMainModel.bindList("/ZREQUEST_TYPE", null, null, [
                new Filter("STATUS", FilterOperator.EQ, "ACTIVE")
            ]);

            oListBinding.requestContexts().then((aContexts) => {
                const aData = aContexts.map(oCtx => oCtx.getObject());
                const oTypeModel = new JSONModel({ types: aData });
                this.getView().setModel(oTypeModel, "req_type_list");
            }).catch(err => console.error("Type Load Failed", err));
        },

        onClickCreateRequest: function () {
            const oReqModel = this.getView().getModel("request");
            const oData = oReqModel.getProperty("/req_header");
            let okcode = true;
            let message = '';

            // Simplified Validation Logic
            const mandatoryFields = {
                'RT0001': ['purpose', 'reqtype', 'tripstartdate', 'tripenddate', 'eventstartdate', 'eventenddate', 'grptype', 'location', 'transport', 'comment'],
                'RT0002': ['purpose', 'reqtype', 'grptype', 'comment'],
                'RT0003': ['purpose', 'reqtype', 'eventstartdate', 'eventenddate', 'grptype', 'location', 'comment', 'eventdetail1', 'eventdetail2', 'eventdetail3', 'eventdetail4'],
                'RT0004': ['purpose', 'reqtype', 'tripstartdate', 'tripenddate', 'grptype', 'comment']
            };

            const fieldsToCheck = mandatoryFields[oData.reqtype] || ['purpose'];
            const isMissing = fieldsToCheck.some(field => !oData[field] || oData[field] === "");

            if (isMissing || (oData.reqtype === 'RT0000')) {
                okcode = false;
                message = 'Please enter all mandatory details';
            } else if (!oData.doc1) {
                okcode = false;
                message = 'Please upload Attachment 1 (Mandatory)';
            } else if (oData.tripenddate < oData.tripstartdate) {
                okcode = false;
                message = "End Date cannot be earlier than begin date";
            }

            if (!okcode) {
                MessageToast.show(message);
            } else {
                this.createRequestHeader(oData, oReqModel);
            }
        },

        createRequestHeader: async function (oInputData, oReqModel) {
			const oMainModel = this.getOwnerComponent().getModel();
			const oResult = await this.getCurrentReqNumber('NR01');

			if (oResult) {
				const sUserId = sap.ushell.Container.getUser().getId();
				const oListBinding = oMainModel.bindList("/ZREQUEST_HEADER");

				// FIX 1: Use 'await' to wait for the employee details
				const emp_data = await this._getEmpIdDetail(sUserId);
				
				// Safety check in case employee data isn't found
				const sCostCenter = emp_data ? emp_data.cc : "";

				const oPayload = {
					EMP_ID: sUserId,
					REQUEST_ID: oResult.reqNo,
					REQUEST_TYPE_ID: oInputData.reqtype,
					OBJECTIVE_PURPOSE: oInputData.purpose,
					REMARK: oInputData.comment,
					IND_OR_GROUP: oInputData.grptype,
					ALTERNATE_COST_CENTRE: oInputData.altcostcenter,
					LOCATION: oInputData.location,
					TYPE_OF_TRANSPORTATION: oInputData.transport,
					ATTACHMENT1: oInputData.doc1,
					ATTACHMENT2: oInputData.doc2,
					CASH_ADVANCE: parseFloat(oInputData.cashadvamt).toFixed(2),
					COST_CENTER: sCostCenter, // Now correctly populated
					EVENT_START_DATE: oInputData.eventstartdate,
					EVENT_END_DATE: oInputData.eventenddate,
					TRIP_START_DATE: oInputData.tripstartdate,
					TRIP_END_DATE: oInputData.tripenddate,
					REQUEST_AMOUNT: String(oInputData.reqamt),
					STATUS: "DRAFT"
				};

				const oContext = oListBinding.create(oPayload);

				oContext.created().then(() => {
					this.updateCurrentReqNumber(oResult.current);
					this.oDialogFragment.close();
					
					oReqModel.setProperty("/view", 'list');
					oReqModel.setProperty("/req_header/reqid", oResult.reqNo);
					oReqModel.setProperty("/req_header/reqstatus", 'DRAFT');
					oReqModel.setProperty("/req_header/costcenter", sCostCenter);
					this._getItemList(oResult.reqNo);
					
					this.byId("pageContainer").to(this.getView().byId('new_request'));
				}).catch(err => {
					sap.m.MessageToast.show("Creation failed: " + err.message);
				});
			}
		},

		async _getEmpIdDetail(sEEID) {
			const oModel = this.getView().getModel(); 
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
				new sap.ui.model.Filter("EEID", "EQ", sEEID)
			]);

			try {
				// FIX: You MUST await the requestContexts call
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return { 
						name: oData.NAME, 
						cc: oData.CC 
					};
				} else {
					console.warn("No employee found with ID: " + sEEID);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; // Return null so the app doesn't crash
			}
		},

        getCurrentReqNumber: async function (range_id) {
            const oMainModel = this.getOwnerComponent().getModel();
            const oListBinding = oMainModel.bindList("/ZNUM_RANGE", null, null, [
                new Filter("RANGE_ID", FilterOperator.EQ, range_id)
            ]);

            try {
                const aContexts = await oListBinding.requestContexts(0, 1);
                if (aContexts.length === 0) throw new Error("Range ID not found");

                const oData = aContexts[0].getObject();
                const current = Number(oData.CURRENT);
                const yy = String(new Date().getFullYear()).slice(-2);
                const reqNo = `REQ${yy}${String(current).padStart(9, "0")}`;

                return { reqNo, current };
            } catch (err) {
                console.error("Number Range Error:", err);
                return null;
            }
        },

        updateCurrentReqNumber: async function (currentNumber) {
            const oMainModel = this.getOwnerComponent().getModel();
            // In V4, we address a single entity by binding a context to its path
            const oContext = oMainModel.bindContext(`/ZNUM_RANGE('${encodeURIComponent('NR01')}')`).getBoundContext();
            
            try {
                await oContext.setProperty("CURRENT", String(currentNumber + 1));
                // V4 automatically queues changes; if using SubmitMode.Auto, it sends immediately.
                // If using Manual, you'd call oMainModel.submitBatch("groupName");
                return true;
            } catch (e) {
                console.error("Update Failed", e);
                return false;
            }
        },

        _getItemList: async function (req_id) {
            const oMainModel = this.getOwnerComponent().getModel();
            const oRequestModel = this.getOwnerComponent().getModel('request');

            const oListBinding = oMainModel.bindList("/ZREQUEST_ITEM", null, [
                new Sorter("REQUEST_SUB_ID", false)
            ], [
                new Filter("REQUEST_ID", FilterOperator.EQ, req_id)
            ]);

            try {
                const aContexts = await oListBinding.requestContexts();
                const aItems = aContexts.map(oCtx => {
                    const obj = oCtx.getObject();
                    // Type conversion as per original logic
                    if (obj.EST_AMOUNT) obj.EST_AMOUNT = parseFloat(obj.EST_AMOUNT);
                    if (obj.EST_NO_PARTICIPANT) obj.EST_NO_PARTICIPANT = parseInt(obj.EST_NO_PARTICIPANT);
                    return obj;
                });

                oRequestModel.setProperty("/req_item_rows", aItems);
                oRequestModel.setProperty('/list_count', aItems.length);
            } catch (err) {
                console.error("Fetch Items failed:", err);
                oRequestModel.setProperty("/req_item_rows", []);
            }
        },

		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
		// End of Request Form Controller
		// ==================================================

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

		onClickNavigate: function (oEvent) {
			let id = oEvent.getParameters().id;
			if (id === "container-claima---App--dashboard-claim" || id === "application-app-preview-component---App--dashboard-claim") {
				this.byId("pageContainer").to(this.getView().createId("myrequest")); //Aiman Salim Start Add 10/02/2026 - Change myreport to myrequest
			} else if (id === "container-claima---App--dashboard-request" || id === "application-app-preview-component---App--dashboard-request") {
				this.byId("pageContainer").to(this.getView().createId("myreport")); //Aiman Salim Start Add 10/02/2026 - Change myreport to myrequest
			}

		}
	});
});
