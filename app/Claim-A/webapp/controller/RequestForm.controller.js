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
            
			// show header
			this._formFragments = {};
			this._showFormFragment();
        }, 

		// ==================================================
		// Initiate Fragment in the view

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

			const oModel = this.getOwnerComponent().getModel('request');
			oModel.setProperty("/view", 'list');
        },

        onSave: function () {

			const oModel = this.getOwnerComponent().getModel('request');
			const aRows  = oModel.getProperty("/req_item_rows") || [];

			aRows.push({
				REQUEST_ID: "REQ26000000339",
				CLAIM_TYPE_ITEM_ID: "003",
				AMOUNT: 1000.00,
				TYPE_OF_TRANSPORTATION: "Testings"
			});

			oModel.setProperty("/req_item_rows", aRows);

            this.onCancel();
        },

        onSaveAddAnother: function () {
			this.onSave();
        },

		// ==================================================
		//  Append new row for participant list

		appendNewRow: function (oEvent) {
            const sVal = (oEvent.getParameter("value") || "").trim();
            const oCtx = oEvent.getSource().getBindingContext(); 
            if (!oCtx) { return; }

            const sPath  = oCtx.getPath(); 
            const iIndex = parseInt(sPath.split("/").pop(), 10);

            const oModel = oCtx.getModel(); 
            const aRows  = oModel.getProperty("/participant") || [];

            if (aRows[iIndex]) {
                aRows[iIndex].participant_name = sVal;
            }

            this._normalizeTrailingEmptyRow(aRows);

            const bIsLast = iIndex === aRows.length - 1;
            if (bIsLast && sVal) {
                aRows.push({
					req_item_row: 0,
                    participant_name: "",
                    emp_cost_center: "",
                    alloc_amount: "" 
                });
            }

            oModel.setProperty("/participant", aRows);
            // If table uses growing, you might need a .refresh(true) in some setups
            // oModel.refresh(true);

        },

		_normalizeTrailingEmptyRow: function (aRows) {
            // Remove extra trailing empties if any
            while (aRows.length > 1 && this._isEmptyRow(aRows[aRows.length - 1]) && this._isEmptyRow(aRows[aRows.length - 2])) {
                aRows.pop();
            }
            // If list became empty (shouldn't happen), ensure at least one blank row
            if (aRows.length === 0) {
                aRows.push({ req_item_row: 0, participant_name: "", emp_cost_center: "", alloc_amount: "" });
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

		onRowDeleteParticipant: function (oEvent) {
            const oTable   = this.byId("req_participant_table");
            const oBinding = oTable.getBinding("participant");  // ListBinding/RowBinding
            const oModel   = this.getView().getModel();  // JSONModel expected
            const aRows    = oModel.getProperty("/participant") || [];

            // collect visible selected indices (e.g., [0, 2, 5])
            let aSelectedVisIdx = oTable.getSelectedIndices() || [];
            let aModelIdxToDelete = [];

            // Helper to get a context for a visible index in a version-safe way
            const getCtxByVisibleIndex = function (iVis) {
                // Preferred: table API (exists on sap.ui.table.Table)
                if (typeof oTable.getContextByIndex === "function") {
                return oTable.getContextByIndex(iVis) || null;
                }
                // Fallback: binding API
                if (oBinding && typeof oBinding.getContexts === "function") {
                const aCtx = oBinding.getContexts(iVis, 1);
                return aCtx && aCtx[0] ? aCtx[0] : null;
                }
                return null;
            };

            if (aSelectedVisIdx.length > 0) {
                aModelIdxToDelete = aSelectedVisIdx
                .map(function (iVis) {
                    const oCtx = getCtxByVisibleIndex(iVis);
                    if (!oCtx) return null;
                    const sPath = oCtx.getPath();      // e.g., "/rows/3"
                    const iIdx  = parseInt(sPath.split("/").pop(), 10);
                    return Number.isInteger(iIdx) ? iIdx : null;
                })
                .filter(function (x) { return x !== null; });
            } else {
                // Nothing selected → delete row where the action was pressed
                const oActionItem = oEvent.getSource();                // RowActionItem
                const oRow        = oActionItem?.getParent()?.getParent(); // RowAction -> Row
                const oCtx        = oRow?.getBindingContext();
                if (oCtx) {
                const sPath = oCtx.getPath();
                const iIdx  = parseInt(sPath.split("/").pop(), 10);
                if (Number.isInteger(iIdx)) {
                    aModelIdxToDelete = [iIdx];
                }
                }
            }

            if (aModelIdxToDelete.length === 0) {
                MessageToast.show("Select row to delete");
            }

            // De-dup and sort desc so splice doesn’t shift later indices
            aModelIdxToDelete = Array.from(new Set(aModelIdxToDelete))
                .sort(function (a, b) { return b - a; });

            aModelIdxToDelete.forEach(function (iIdx) {
                if (iIdx >= 0 && iIdx < aRows.length) {
                aRows.splice(iIdx, 1);
                }
            });

            // Optional: keep one empty row to support your auto-append UX
            if (aRows.length === 0) {
                aRows.push({
					participant_name: "",
					emp_cost_center: "",
					alloc_amount: ""
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
					label: "Participant",
					property: "Participant",
					type: "string"
				},
				{
					label: "Cost Center",
					property: "CostCenter",
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
		// Get Data
		// ==================================================

		_getItemList: async function (req_id) {
			// Guard
			if (req_id == null || req_id === "") {
				console.warn("No REQUEST_ID provided");
				// Clear current data to reflect no selection
				this.getView().getModel().setProperty("/req_item_rows", []);
				return [];
			}

			// Base URL from manifest
			const sBaseUri = this.getOwnerComponent().getManifestEntry("sap.app")?.dataSources?.mainService?.uri
							|| "/odata/v4/EmployeeSrv/";
			const sServiceUrl = sBaseUri.replace(/\/$/, "") + "/ZREQUEST_ITEM";

			// Build URL with $filter
			const url = new URL(sServiceUrl, window.location.origin);
			const qs  = new URLSearchParams();

			// Decide how to format the literal based on your metadata:
			// - Numeric (Edm.Int32/Int64): no quotes
			// - GUID (Edm.Guid): guid'...'
			// - Otherwise (Edm.String): quoted
			const sReq = String(req_id);
			const isNumeric = typeof req_id === "number" || /^\d+$/.test(sReq);
			const isGuid    = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sReq);

			let sLiteral;
			if (isNumeric) {
				sLiteral = sReq; // no quotes
			} else if (isGuid) {
				sLiteral = `guid'${sReq}'`;
			} else {
				// Escape single quotes by doubling them per OData literal rules
				const escaped = sReq.replace(/'/g, "''");
				sLiteral = `'${escaped}'`;
			}

			qs.set("$filter", `REQUEST_ID eq ${sLiteral}`);
			qs.set("$count", "true"); // optional, handy when you need server count
			// qs.set("$select", "REQUEST_ID,Field1,Field2"); // optional
			// qs.set("$orderby", "REQUEST_ID desc"); // optional
			url.search = qs.toString();

			try {
				const response = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
				if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

				const data = await response.json();
				const aItems = Array.isArray(data.value) ? data.value : [];

				// ✅ Set the collection to the default model path your table binds to
				this.getView().getModel().setProperty("/req_item_rows", aItems);

				// (Optional) If you maintain counts manually, call your updater:
				// this._updateTableCounts();

				return aItems; // return the array for further use if needed
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Error fetching ZREQUEST_ITEM by REQUEST_ID:", err);
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
			var view = oModel.getProperty("/view");

			if(oModel.getProperty("/view") != 'view') {
				oModel.setProperty("/view", 'create');
			}
		}
    });
});
