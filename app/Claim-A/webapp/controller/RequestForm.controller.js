sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label", 
	"sap/ui/core/Fragment",
  	"sap/ui/export/Spreadsheet",

], (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment, Spreadsheet) => {
    "use strict";

    return Controller.extend("claima.controller.RequestForm", {
        async onInit() {
			const sUserId = sap.ushell.Container.getUser().getId();
			
			// show header
			this._formFragments = {};
			this._showFormFragment();
        }, 

		// ==================================================
		// Initiate Fragment in the view
		// ==================================================

		_getFormFragment: function (sFragmentName) {
			var pFormFragment = this._formFragments[sFragmentName],
				oView = this.getView();

				pFormFragment = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sFragmentName,
					type: "XML",
					controller: this,
					
				});
				this._formFragments[sFragmentName] = pFormFragment;

			return pFormFragment;
		},

		_showFormFragment : function () {
			var oPage = this.byId("request_form");

			oPage.removeAllContent();
			this._getFormFragment("req_header").then(function(oVBox){
				oPage.insertContent(oVBox, 0);
			});
			this._getFormFragment("req_item_list").then(function(oVBox){
				oPage.insertContent(oVBox, 1);
			});
		},
		
		// ==================================================
		// Footer Button logic
 
        onBack: function () {
			if (!this.oBackDialog) {
				this.oBackDialog = new Dialog({
					title: "Warning",
					type: "Message",
					content: [
						new Label({
							text: "You haven't save, do you confirm to go back?",
							labelFor: "rejectionNote"
						})
					],
					beginButton: new Button({
						type: "Emphasized",
						text: "Confirm",
						press: function () {
							this.oBackDialog.close();
                            // nav to dashboard
							var oScroll = this.getView().getParent();          // ScrollContainer
							var oMaybeNav = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer

							var aPages = oMaybeNav.getPages ? oMaybeNav.getPages() : oMaybeNav.getAggregation("pages");
							var oMainPage = aPages && aPages.find(function (p) {
								return p.getId && p.getId().endsWith("dashboard");
							});

							if (oMainPage) {
							oMaybeNav.to(oMainPage, "slide");
							}


						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oBackDialog.close();
						}.bind(this)
					})
				});
			}

			this.oBackDialog.open();
        }, 

		onSaveRequestDraft: function () {
			MessageToast.show("save draft")	
			// write database
			var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
            var sServiceUrl = sBaseUri + "/ZREQUEST_TYPE"; 

			fetch(sServiceUrl, 
				{method: "POST", headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					REQUEST_TYPE_ID: "RT0006",
					REQUEST_TYPE_DESC: "Testing Create Data",
					END_DATE: "9999-12-31",
					START_DATE: "2026-01-01",
					STATUS: "INACTIVE"
				})
			})
			.then(r => r.json());
			// .then(console.log);
		},

        onDeleteRequest: function () {
			if (!this.oDeleteDialog) {
				this.oDeleteDialog = new Dialog({
					title: "Delete Request",
					type: "Message",
					content: [
						new Label({
							text: "Do you want to delete this request?",
							labelFor: "rejectionNote"
						})
					],
					beginButton: new Button({
						type: "Emphasized",
						text: "Delete",
						press: function () {
							this.oDeleteDialog.close();
                            // nav to dashboard
							var oScroll = this.getView().getParent();          // ScrollContainer
							var oMaybeNav = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer

							var aPages = oMaybeNav.getPages ? oMaybeNav.getPages() : oMaybeNav.getAggregation("pages");
							var oMainPage = aPages && aPages.find(function (p) {
								return p.getId && p.getId().endsWith("dashboard");
							});

							if (oMainPage) {
							oMaybeNav.to(oMainPage, "slide");
							}


						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oDeleteDialog.close();
						}.bind(this)
					})
				});
			}

			this.oDeleteDialog.open();
		},

		onSubmitRequest: function () {
			MessageToast.show("submit request")	
		},

		onCancelItem: function () {
			MessageToast.show("cancel item")	
		},
		
		onSaveItem: function () {
			this.onSave();
		},

		onBackView: async function () {
			const oPage = this.byId("request_form");
			const oListRoot = this.byId("request_create_item_fragment");
			if (oListRoot) {
				const oParent = oListRoot.getParent();
				if (oParent && typeof oParent.removeContent === "function") {
				oParent.removeContent(oListRoot);
				} else if (oParent && typeof oParent.removeItem === "function") {
				oParent.removeItem(oListRoot);
				}
				oListRoot.destroy();

				try {
					const oVBox = await this._getFormFragment("req_item_list"); 

					const iIndex = Math.min(1, oPage.getContent().length);
					oPage.insertContent(oVBox, iIndex);
				} catch (e) {
					sap.m.MessageToast.show("Could not open Create Item form.");
					return;
				}
			} else {
				var oScroll = this.getView().getParent();          // ScrollContainer
				var oMaybeNav = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer

				var aPages = oMaybeNav.getPages ? oMaybeNav.getPages() : oMaybeNav.getAggregation("pages");
				var oMainPage = aPages && aPages.find(function (p) {
					return p.getId && p.getId().endsWith("dashboard");
				});

				if (oMainPage) {
				oMaybeNav.to(oMainPage, "slide");
				}

			}

			
		},

		// ==================================================
		// Item List Button Logic
		// ==================================================

		onPressAddItem: async function () {
			
			const oPage = this.byId("request_form");
			if (!oPage) {
				sap.m.MessageToast.show("Page 'request_form' not found.");
				return;
			}

			const oListRoot = this.byId("request_item_list_fragment");
			if (oListRoot) {
				
				const oParent = oListRoot.getParent();
				if (oParent && typeof oParent.removeContent === "function") {
				oParent.removeContent(oListRoot);
				} else if (oParent && typeof oParent.removeItem === "function") {
				oParent.removeItem(oListRoot);
				}
				oListRoot.destroy(); 
			}

			try {
				const oVBox = await this._getFormFragment("req_create_item"); 

				const iIndex = Math.min(1, oPage.getContent().length);
				oPage.insertContent(oVBox, iIndex);
			} catch (e) {
				sap.m.MessageToast.show("Could not open Create Item form.");
				return;
			}

			const oModel = this.getOwnerComponent().getModel('request');
			oModel.setProperty("/view", 'create');
			var oCurrent = oModel.getData();
			var oNew = {
				req_item: {
					req_id				: "",
					req_subid			: "",
					claim_type			: "CT1",
					claim_type_item		: "CTI1",
					est_amount			: "",
					est_no_participant	: "",
					cash_advance		: "no_cashadv",
					start_date			: "",
					end_date			: "",
					location			: "",
					remarks				: ""
				},participant : [
					{
						PARTICIPANT_ID: "",
						ALLOCATED_AMOUNT: ""
					}
				]
			};
			var oCombined = Object.assign(oCurrent, oNew);
			oModel.setData(oCombined);
		},

		onRowDeleteReqItem: function (oEvent) {
			const oTable   = this.byId("req_item_table");
			const oModel   = this.getOwnerComponent().getModel("request");  // named JSONModel
			const aRows    = oModel.getProperty("/req_item_rows") || [];

			// Try SAPUI5-provided event parameters first (preferred)
			let iModelIndexFromAction = null;
			const oRowParam     = oEvent.getParameter && oEvent.getParameter("row");
			const iRowIndexParam= oEvent.getParameter && oEvent.getParameter("rowIndex");

			if (oRowParam) {
				// IMPORTANT: pass the named model to getBindingContext
				const oCtx = oRowParam.getBindingContext("request");
				if (oCtx) {
				const sPath = oCtx.getPath();                // e.g. "/req_item_rows/3"
				const iIdx  = parseInt(sPath.split("/").pop(), 10);
				if (Number.isInteger(iIdx)) {
					iModelIndexFromAction = iIdx;
				}
				}
			} else if (Number.isInteger(iRowIndexParam)) {
				// Fallback: derive from visible row index
				const oCtx = oTable.getContextByIndex(iRowIndexParam); // bound to 'rows' → right model
				if (oCtx) {
				const sPath = oCtx.getPath();
				const iIdx  = parseInt(sPath.split("/").pop(), 10);
				if (Number.isInteger(iIdx)) {
					iModelIndexFromAction = iIdx;
				}
				}
			}

			// Now support both flows:
			// 1) Toolbar Delete → uses selection
			// 2) RowAction Delete → uses iModelIndexFromAction
			let aModelIdxToDelete = [];

			// Case 1: User selected rows (e.g., Delete button on toolbar)
			const aSelectedVisIdx = oTable.getSelectedIndices() || [];
			if (aSelectedVisIdx.length > 0) {
				const oBinding = oTable.getBinding("rows");
				aModelIdxToDelete = aSelectedVisIdx
				.map(function (iVis) {
					// getContextByIndex works on 'rows' binding, returns named context
					const oCtx = oTable.getContextByIndex(iVis);
					if (!oCtx) return null;
					const sPath = oCtx.getPath();
					const iIdx  = parseInt(sPath.split("/").pop(), 10);
					return Number.isInteger(iIdx) ? iIdx : null;
				})
				.filter(function (x) { return x !== null; });
			} else if (Number.isInteger(iModelIndexFromAction)) {
				// Case 2: RowAction press (no selection)
				aModelIdxToDelete = [iModelIndexFromAction];
			}

			if (aModelIdxToDelete.length === 0) {
				sap.m.MessageToast.show("Select row to delete");
				return;
			}

			// Deduplicate and delete from the end
			aModelIdxToDelete = Array.from(new Set(aModelIdxToDelete))
				.sort(function (a, b) { return b - a; });

			aModelIdxToDelete.forEach(function (iIdx) {
				if (iIdx >= 0 && iIdx < aRows.length) {
				aRows.splice(iIdx, 1);
				}
			});

			oModel.setProperty("/req_item_rows", aRows);
			oTable.clearSelection();
		},

        onDeleteSelectedReqItem: function () {
            this.onRowDelete({ getSource: function () { return null; } });
        }, 

		onCancel: async function () {
			
			const oPage = this.byId("request_form");
			
            // 2) Remove the existing list fragment if present
			//    Make sure the root control inside the fragment has id="--request_item_list_fragment"
			const oListRoot = this.byId("request_create_item_fragment");
			if (oListRoot) {
				// Remove from its immediate parent aggregation
				const oParent = oListRoot.getParent();
				if (oParent && typeof oParent.removeContent === "function") {
				oParent.removeContent(oListRoot);
				} else if (oParent && typeof oParent.removeItem === "function") {
				oParent.removeItem(oListRoot);
				}
				oListRoot.destroy(); // free resources
			}

			// 3) Insert the create-item fragment deterministically
			try {
				const oVBox = await this._getFormFragment("req_item_list"); // returns a control

				// Put it right after the header (index 1), or at the end if not enough content
				const iIndex = Math.min(1, oPage.getContent().length);
				oPage.insertContent(oVBox, iIndex);
			} catch (e) {
				// if _getFormFragment rejects
				sap.m.MessageToast.show("Could not open Create Item form.");
				return;
			}

			var req_header = this.getOwnerComponent().getModel('request').getProperty('/req_header');
			this._getItemList(req_header.reqid);
			const oModel = this.getOwnerComponent().getModel('request');
			oModel.setProperty("/view", 'list');
			oModel.refresh(true);
        },

        onSave: function () {

			const oModel = this.getOwnerComponent().getModel('request').getData();
			this.saveItem(oModel);
            this.onCancel();
        },

        onSaveAddAnother: function () {
			this.onSave();
        },

		// ==================================================
		//  Append new row for participant list
		// ==================================================

		appendNewRow: function (oEvent) {
			const oModel = this.getOwnerComponent().getModel("request");
			const sVal = (oEvent.getParameter && oEvent.getParameter("value")) 
							?? (oEvent.getSource && oEvent.getSource().getValue && oEvent.getSource().getValue()) 
							?? "";
			const sTrimmed = String(sVal).trim();
			const oCtx = oEvent.getSource().getBindingContext("request");
			if (!oCtx) {
				return;
			}

			const sPath = oCtx.getPath(); 
			const aSegments = sPath.split("/");
			const iIndex = parseInt(aSegments[aSegments.length - 1], 10);
			if (!Number.isInteger(iIndex)) {
				return;
			}

			let aRows = oModel.getProperty("/participant");
			if (!Array.isArray(aRows)) {
				aRows = [];
				oModel.setProperty("/participant", aRows);
			}

			oModel.setProperty(`/participant/${iIndex}/PARTICIPANT_ID`, sTrimmed);

			if (typeof this._normalizeTrailingEmptyRow === "function") {
				this._normalizeTrailingEmptyRow(aRows);
			}

			const bIsLast = iIndex === aRows.length - 1;
			if (bIsLast && sTrimmed) {
				const oNewRow = {
				PARTICIPANT_ID: "",
				ALLOCATED_AMOUNT: ""
				};
				oModel.setProperty(`/participant/${aRows.length}`, oNewRow);
			}

			// 8) In some setups (rare), you might need a refresh to re-render table rows
			// oModel.refresh(true);
		},

		_normalizeTrailingEmptyRow: function (aRows) {
			let lastNonEmpty = -1;
			for (let i = 0; i < aRows.length; i++) {
				const r = aRows[i] || {};
				const isEmpty = !String(r.PARTICIPANT_ID || "").trim() && !String(r.ALLOCATED_AMOUNT || "").trim();
				if (!isEmpty) lastNonEmpty = i;
			}
			const desiredLength = Math.max(lastNonEmpty + 2, 1); 
			if (aRows.length > desiredLength) {
				aRows.splice(desiredLength);
				this.getOwnerComponent().getModel("request").setProperty("/participant", aRows.slice());
			} else if (aRows.length === 0) {
				aRows.push({ PARTICIPANT_ID: "", ALLOCATED_AMOUNT: "" });
				this.getOwnerComponent().getModel("request").setProperty("/participant", aRows);
			}
		},
        
        _isEmptyRow: function (oRow) {
            if (!oRow) return true;
            const nameEmpty  = !oRow.participant_name || String(oRow.participant_name).trim() === "";
            const costEmpty  = !oRow.emp_cost_center || String(oRow.emp_cost_center).trim() === "";
            const allocEmpty = !oRow.alloc_amount || String(oRow.alloc_amount).trim() === "";
            return nameEmpty && costEmpty && allocEmpty;
        },

		// ==================================================
		// Delete Participant Row Logic
		// ==================================================

		onRowDeleteParticipant: function (oEvent) {
            const oTable   = this.byId("req_participant_table");
			const oModel   = this.getOwnerComponent().getModel("request");  // named JSONModel
			const aRows    = oModel.getProperty("/participant") || [];

			// Try SAPUI5-provided event parameters first (preferred)
			let iModelIndexFromAction = null;
			const oRowParam     = oEvent.getParameter && oEvent.getParameter("row");
			const iRowIndexParam= oEvent.getParameter && oEvent.getParameter("rowIndex");

			if (oRowParam) {
				// IMPORTANT: pass the named model to getBindingContext
				const oCtx = oRowParam.getBindingContext("request");
				if (oCtx) {
				const sPath = oCtx.getPath();                // e.g. "/req_item_rows/3"
				const iIdx  = parseInt(sPath.split("/").pop(), 10);
				if (Number.isInteger(iIdx)) {
					iModelIndexFromAction = iIdx;
				}
				}
			} else if (Number.isInteger(iRowIndexParam)) {
				// Fallback: derive from visible row index
				const oCtx = oTable.getContextByIndex(iRowIndexParam); // bound to 'rows' → right model
				if (oCtx) {
				const sPath = oCtx.getPath();
				const iIdx  = parseInt(sPath.split("/").pop(), 10);
				if (Number.isInteger(iIdx)) {
					iModelIndexFromAction = iIdx;
				}
				}
			}

			// Now support both flows:
			// 1) Toolbar Delete → uses selection
			// 2) RowAction Delete → uses iModelIndexFromAction
			let aModelIdxToDelete = [];

			// Case 1: User selected rows (e.g., Delete button on toolbar)
			const aSelectedVisIdx = oTable.getSelectedIndices() || [];
			if (aSelectedVisIdx.length > 0) {
				const oBinding = oTable.getBinding("rows");
				aModelIdxToDelete = aSelectedVisIdx
				.map(function (iVis) {
					// getContextByIndex works on 'rows' binding, returns named context
					const oCtx = oTable.getContextByIndex(iVis);
					if (!oCtx) return null;
					const sPath = oCtx.getPath();
					const iIdx  = parseInt(sPath.split("/").pop(), 10);
					return Number.isInteger(iIdx) ? iIdx : null;
				})
				.filter(function (x) { return x !== null; });
			} else if (Number.isInteger(iModelIndexFromAction)) {
				// Case 2: RowAction press (no selection)
				aModelIdxToDelete = [iModelIndexFromAction];
			}

			if (aModelIdxToDelete.length === 0) {
				sap.m.MessageToast.show("Select row to delete");
				return;
			}

			// Deduplicate and delete from the end
			aModelIdxToDelete = Array.from(new Set(aModelIdxToDelete))
				.sort(function (a, b) { return b - a; });

			aModelIdxToDelete.forEach(function (iIdx) {
				if (iIdx >= 0 && iIdx < aRows.length) {
				aRows.splice(iIdx, 1);
				}
			});

			if (aRows.length === 0) {
                aRows.push({
					PARTICIPANT_ID: "",
					ALLOCATED_AMOUNT: ""
                });
            }

			oModel.setProperty("/participant", aRows);
			oTable.clearSelection();
        },

		// ==================================================
		// Excel Template Logic
		// ==================================================

		onDownloadTemplate: function () {
			// Define 3 columns
			const aColumns = [
				{
					label: "Participant_ID",
					property: "Participant",
					type: "string"
				},
				{
					label: "Allocated Amount (MYR)",
					property: "Amount",
					type: "number", 
					scale: 2,
					delimiter: true
				}
			];

			// Create an empty data set (just headers). If you want N empty rows, provide empty objects.
			const iEmptyRows = 10; // change to e.g., 10 for 10 blank rows
			const aData = Array.from({ length: iEmptyRows }, () => ({
				Participant: "",
				CostCenter: "",
				Amount: null
			}));

			const oModel = new JSONModel(aData);

			const oSettings = {
				workbook: {
				columns: aColumns,
				context: {
					sheetName: "Template"
				}
				},
				dataSource: oModel.getData(),
				fileName: "ClaimTemplate.xlsx",
				worker: true // use a Web Worker for large exports
			};

			const oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(() => oSheet.destroy())
				.catch((err) => {
				// Optional: handle errors
				sap.m.MessageBox.error("Export failed: " + err);
			});
		},
		
		// ==================================================
		// Get List Data
		// ==================================================

		_getItemList: async function (req_id) {
			if (!req_id) {
				console.warn("No REQUEST_ID provided");
				this.getView().getModel().setProperty("/req_item_rows", []);
				return [];
			}

			const sBaseUri =
				this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri
				|| "/odata/v4/EmployeeSrv/";
			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZREQUEST_ITEM";

			const sReq = String(req_id);
			const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sReq);
			const isNumeric = /^\d+$/.test(sReq);

			let sLiteral;
			if (isNumeric) {
				sLiteral = sReq; 
			} else if (isGuid) {
				sLiteral = `guid'${sReq}'`;
			} else {
				const escaped = sReq.replace(/'/g, "''");
				sLiteral = `'${escaped}'`;
			}

			// Build the full URL, encode ONLY the filter expression
			const base = new URL(sServiceUrl, window.location.origin).toString();
			const filterExpr = `REQUEST_ID eq ${sLiteral}`;
			const orderbyExpr = "REQUEST_SUB_ID asc";
			const query = [
				`$filter=${encodeURIComponent(filterExpr)}`,
				`$orderby=${encodeURIComponent(orderbyExpr)}`,
				`$count=true`,
				`$format=json`
			].join("&");

			const fullUrl = `${base}?${query}`;

			try {
				const response = await fetch(fullUrl, {
				headers: { "Accept": "application/json" }
				});
				if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

				const data = await response.json();
				const aItems = Array.isArray(data.value) ? data.value : [];
				this.getOwnerComponent().getModel('request').setProperty("/req_item_rows", aItems);
				var aRows = this.getOwnerComponent().getModel('request').getProperty('/req_item_rows');
				// parse back the data type if it is not string
				aRows.forEach(function(oItem) {
					if(oItem.EST_AMOUNT) {
						oItem.EST_AMOUNT = parseFloat(oItem.EST_AMOUNT);
					}
					if (oItem.EST_NO_PARTICIPANT) {
						oItem.EST_NO_PARTICIPANT = parseInt(oItem.EST_NO_PARTICIPANT);
					}
				});
				this.getOwnerComponent().getModel('request').setProperty("/req_item_rows", aRows).refresh(true);
				// return aItems;
			} catch (err) {
				console.error("Fetch failed:", err, { url: fullUrl });
				this.getView().getModel().setProperty("/req_item_rows", []);
				return [];
			}
		},
		
		navToItemDetail: async function () {
			const oPage = this.byId("request_form");
			if (!oPage) {
				sap.m.MessageToast.show("Page 'request_form' not found.");
				return;
			}

			const oListRoot = this.byId("request_item_list_fragment");
			if (oListRoot) {
				
				const oParent = oListRoot.getParent();
				if (oParent && typeof oParent.removeContent === "function") {
				oParent.removeContent(oListRoot);
				} else if (oParent && typeof oParent.removeItem === "function") {
				oParent.removeItem(oListRoot);
				}
				oListRoot.destroy(); 
			}

			try {
				const oVBox = await this._getFormFragment("req_create_item"); 

				const iIndex = Math.min(1, oPage.getContent().length);
				oPage.insertContent(oVBox, iIndex);
			} catch (e) {
				sap.m.MessageToast.show("Could not open Create Item form.");
				return;
			}
			
			const oModel = this.getOwnerComponent().getModel('request');

			if(oModel.getProperty("/view") != 'view') {
				oModel.setProperty("/view", 'create');
			}
		},

		// ==================================================
		// Save to Backend Logic
		// ==================================================

		saveItem: function (oReqModel) {
			this.getCurrentReqNumber('NR03').then((result) => {
				if (!result) return;
				// 1. Safe URL Construction
				var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
				// Ensure base doesn't end with / and entity starts with /
				var sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZREQUEST_ITEM";
				// 2. Data Cleaning - Ensure numbers are actually numbers
				var oPayload = {
					"REQUEST_ID": String(oReqModel.req_header.reqid),
					"REQUEST_SUB_ID": String(result.result), // If this is a number like 001, ensure it's a string
					"CLAIM_TYPE_ID": oReqModel.req_item.claim_type,
					"CLAIM_TYPE_ITEM_ID": oReqModel.req_item.claim_type_item,
					"EST_AMOUNT": parseFloat(oReqModel.req_item.est_amount || 0),
					"EST_NO_PARTICIPANT": parseInt(oReqModel.req_item.est_no_participant || 0),
					// "CASH_ADVANCE": parseFloat(oReqModel.req_item.cash_advance || 0),
					// "START_DATE": oReqModel.req_item.start_date,
					// "END_DATE": oReqModel.req_item.end_date,
					// "LOCATION": oReqModel.req_item.location,
					// "REMARK": oReqModel.req_item.remark
				};
				fetch(sServiceUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json"
					},
					body: JSON.stringify(oPayload)
				})
				.then(async (response) => {
					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error ? errorData.error.message : "Save failed");
					}
					return response.json();
				})
				.then(async (res) => {
					// Success Logic
					const oModel = this.getOwnerComponent().getModel('request');
					oModel.setProperty("/view", 'list');
					this.updateCurrentReqNumber('NR03', result.current);
					
					var participant_list = oModel.getProperty("/participant");
					var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
					var sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZREQ_ITEM_PART";
					
					for (const row of participant_list) {
						const res = await fetch(sServiceUrl, {
							method: "POST",
							headers: { "Content-Type": "application/json", "Accept": "application/json" },
							body: JSON.stringify({
								REQUEST_ID 			: String(oReqModel.req_header.reqid),
								REQUEST_SUB_ID		: String(result.result),
								PARTICIPANTS_ID		: row.PARTICIPANTS_ID,
								ALLOCATED_AMOUNT	: row.ALLOCATED_AMOUNT
							})
						});
						if (!res.ok) {
							const text = await res.text();
							throw new Error(`Failed to create: HTTP ${res.status} - ${text}`);
						}
					}

					sap.m.MessageToast.show("Saved Successfully");
				})
				.catch(err => {
					sap.m.MessageToast.show(err.message);
				});
			});
		},

		appendNewParticipant: function (oReqModel) {
			var sBaseUri = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/EmployeeSrv/";
			var sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZREQ_ITEM_PART";
			var oPayload = {
				"REQUEST_ID": String(oReqModel.req_id),
				"REQUEST_SUB_ID": String(oReqModel.req_subid),
				"PARTICIPANTS_ID": oReqModel.participant_id,
				"ALLOCATED_AMOUNT": parseFloat(oReqModel.alloc_amount || 0),
			};
			fetch(sServiceUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				body: JSON.stringify(oPayload)
			})
			.then(async (response) => {
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error ? errorData.error.message : "Save failed");
				}
				return response.json();
			})
			.then((res) => {
				const oModel = this.getOwnerComponent().getModel('request');
				oModel.setProperty("/view", 'list');
				// sap.m.MessageToast.show("Saved Successfully");
			})
			.catch(err => {
				sap.m.MessageToast.show(err.message);
			});
		},

		// ==================================================
		// Backend Updating Logic
		// ==================================================

		getCurrentReqNumber: async function (range_id) {
			const sBaseUri = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri || "/odata/v4/EmployeeSrv/";
			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZNUM_RANGE";

			try {
				const response = await fetch(sServiceUrl);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				const nr01 = (data.value || data).find(x => x.RANGE_ID === range_id);
				if (!nr01 || nr01.CURRENT == null) {
					throw new Error("NR01 not found or CURRENT is missing");
				}

				const current = Number(nr01.CURRENT);
				const yy = String(new Date().getFullYear()).slice(-2);
				const result = `REQ${yy}${String(current).padStart(9, "0")}`;

				return { result, current };

			} catch (err) {
				console.error("Error fetching CDS data:", err);
				return null; // or: throw err;
			}
		},

		updateCurrentReqNumber: async function (nr, currentNumber) {
			const sId = nr;
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
				
				if (res.status === 204) return { CURRENT: nextNumber };

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
    });
});
