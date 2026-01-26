sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label", 
	"sap/ui/core/Fragment"

], (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment) => {
    "use strict";

    return Controller.extend("claima.controller.RequestForm", {
        onInit() {
            
			// show header
			this._formFragments = {};
			this._showFormFragment();

			// check view for footer button
			const oViewModel = new JSONModel({
                    currentPageId: "req_item_table_view" // matches your initialPage
                });
            this.getView().setModel(oViewModel, "view");

            // // Keep model in sync when user navigates
            // const oNav = this.byId("req_form_item_container");
            // oNav.attachAfterNavigate(this._onAfterNavigate, this);

			// // Item Table
			const oModel = new JSONModel({
				control : [
					{view: "list"}
				],
				req_item_rows : [
					{claim_type: "Testing Claim Type 01", est_amount: 10100, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 02", est_amount: 100670, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 03", est_amount: 100230, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 04", est_amount: 1000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 05", est_amount: 10300, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 06", est_amount: 1000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 07", est_amount: 15000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 08", est_amount: 1000, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 09", est_amount: 500, currency_code: "MYR", est_no_of_participant: 10},
					{claim_type: "Testing Claim Type 10", est_amount: 10000, currency_code: "MYR", est_no_of_participant: 10}
				],
				participant : [
                    {
                        participant_name: "",
                        emp_cost_center: "",
                        alloc_amount: ""
                    }
                ]
			
			});
			oModel.setSizeLimit(50);
			this.getView().setModel(oModel);

			// Item Table Count
            const oVM = new sap.ui.model.json.JSONModel({
                visibleCount: 0, // number of rows currently shown (respects filters)
                totalCount: 0,   // total items in the underlying array (no filters)
                selectedCount: 0 // selected row count (if you use selection)
            });
            this.getView().setModel(oVM, "view");

        }, 

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

        _onAfterNavigate: function (oEvent) {
            const oTo = oEvent.getParameter("to");
            const test = this.getView().getLocalId(oTo.getId());
            if (oTo) {
                this.getView().getModel("view").setProperty("/currentPageId", this.getView().getLocalId(oTo.getId()));
            }
        }, 
 
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
			MessageToast.show("save item")	
		},

		// Item List Logics Section

		onPressAddItem: async function () {
			// 1) Resolve the Page
			const oPage = this.byId("request_form");
			if (!oPage) {
				sap.m.MessageToast.show("Page 'request_form' not found.");
				return;
			}

			// 2) Remove the existing list fragment if present
			//    Make sure the root control inside the fragment has id="--request_item_list_fragment"
			const oListRoot = this.byId("request_item_list_fragment");
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
				const oVBox = await this._getFormFragment("req_create_item"); // returns a control

				// Put it right after the header (index 1), or at the end if not enough content
				const iIndex = Math.min(1, oPage.getContent().length);
				oPage.insertContent(oVBox, iIndex);
			} catch (e) {
				// if _getFormFragment rejects
				sap.m.MessageToast.show("Could not open Create Item form.");
				return;
			}

			const oModel = this.getView().getModel();
			oModel.setProperty("/control/0/view", 'create');

			
		},

		// Delete table row item
		onRowDeleteReqItem: function (oEvent) {
            const oTable   = this.byId('req_item_table');
            const oBinding = oTable.getBinding("req_item_rows");
            const oModel   = this.getView().getModel();  
            const aRows    = oModel.getProperty("/req_item_rows") || [];

            let aSelectedVisIdx = oTable.getSelectedIndices() || [];
            let aModelIdxToDelete = [];

            const getCtxByVisibleIndex = function (iVis) {
                if (typeof oTable.getContextByIndex === "function") {
                return oTable.getContextByIndex(iVis) || null;
                }
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
                    const sPath = oCtx.getPath();     
                    const iIdx  = parseInt(sPath.split("/").pop(), 10);
                    return Number.isInteger(iIdx) ? iIdx : null;
                })
                .filter(function (x) { return x !== null; });
            } else {
                const oActionItem = oEvent.getSource();               
                const oRow        = oActionItem?.getParent()?.getParent(); 
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

		onSelectEdit: function () {
			var oScroll = this.getView().getParent();          // should be the ScrollContainer
			var oMaybeNav = oScroll && oScroll.getParent && oScroll.getParent(); // NavContainer

			if (oMaybeNav && typeof oMaybeNav.to === "function") {
				// Get the sibling page (req_create_item_view) **inside the same NavContainer**
				var aPages = oMaybeNav.getPages ? oMaybeNav.getPages() : oMaybeNav.getAggregation("pages");
				var oCreatePage = aPages && aPages.find(function (p) {
				return p.getId && p.getId().endsWith("req_create_item_view");
				});

				if (oCreatePage) {
				oMaybeNav.to(oCreatePage, "slide");
				return;
				}
			}

		}, 
        
        // Count Request Item
		onAfterRendering: function () {
			const oTable = this.byId("req_item_table"); // sap.ui.table.Table
			if (!oTable) return;

			// Avoid multiple attachments if onAfterRendering runs again
			if (this._countsAttached) {
				return;
			}
			this._countsAttached = true;

			const fnAttachWhenReady = () => {
				const oBinding = oTable.getBinding("rows");   // MUST be "rows" for sap.ui.table.Table
				if (!oBinding) {
				// Try again on the next tick if binding isn’t there yet
				setTimeout(fnAttachWhenReady, 0);
				return;
				}

				// Keep references so we can detach in onExit
				this._reqItem = this._reqItem || {};
				this._reqItem.table   = oTable;
				this._reqItem.binding = oBinding;
				this._reqItem.model   = oBinding.getModel();
				this._reqItem.path    = (oTable.getBindingInfo("rows") || {}).path; // e.g., "/req_item_rows"

				// --- 1) Binding-level listeners (contexts/length changes) ---
				oBinding.attachEvent("change",        this._updateTableCounts, this);
				oBinding.attachEvent("dataReceived",  this._updateTableCounts, this);
				oBinding.attachEvent("refresh",       this._updateTableCounts, this);

				// --- 2) Selection change (if you also show selected count) ---
				if (typeof oTable.attachRowSelectionChange === "function") {
				oTable.attachRowSelectionChange(this._updateSelectedCount, this);
				}

				// --- 3) Model-level listeners (data/content changes) ---
				const oModel = this._reqItem.model;

				// JSONModel: propertyChange is emitted for setProperty
				if (oModel && typeof oModel.attachPropertyChange === "function") {
				this._reqItem._onPropChange = (oEvt) => {
					// Only react when the changed path is the collection or a child of it
					const sPath = oEvt.getParameter("path");
					if (!sPath) return;
					if (this._isPathWithinCollection(sPath, this._reqItem.path)) {
					this._updateTableCounts();
					}
				};
				oModel.attachPropertyChange(this._reqItem._onPropChange, this);
				} else if (oModel && typeof oModel.attachEvent === "function") {
				// Fallback for older runtimes: generic event attach
				this._reqItem._onPropChange = (oEvt) => {
					const sPath = oEvt.getParameter && oEvt.getParameter("path");
					if (sPath && this._isPathWithinCollection(sPath, this._reqItem.path)) {
					this._updateTableCounts();
					}
				};
				oModel.attachEvent("propertyChange", this._reqItem._onPropChange, this);
				}

				// ODataModel (V2/V4) – request lifecycle hooks
				if (oModel && typeof oModel.attachRequestCompleted === "function") {
				this._reqItem._onReqCompleted = () => this._updateTableCounts();
				oModel.attachRequestCompleted(this._reqItem._onReqCompleted, this);
				}
				if (oModel && typeof oModel.attachRequestSent === "function") {
				this._reqItem._onReqSent = () => {/* optional: show busy, etc. */};
				oModel.attachRequestSent(this._reqItem._onReqSent, this);
				}

				// Initial compute (once everything is wired)
				this._updateTableCounts();
			};

			fnAttachWhenReady();
		},

		/**
		 * Helper to check if a changed path affects the collection bound to the table.
		 * Examples:
		 *   collection = "/req_item_rows"
		 *   changed path "/req_item_rows" or "/req_item_rows/3" or "/req_item_rows/3/est_amount" -> true
		 */
		_isPathWithinCollection: function (sChangedPath, sCollectionPath) {
			if (!sChangedPath || !sCollectionPath) return false;
			if (sChangedPath === sCollectionPath) return true;
			return sChangedPath.indexOf(sCollectionPath + "/") === 0;
		},

		/**
		 * Your existing counter updater (make sure it reads from binding/model)
		 * Example: recompute total items, selected items, totals, etc.
		 */
		_updateTableCounts: function () {
			const oRef = this._reqItem;
			if (!oRef || !oRef.table || !oRef.binding) return;

			const iLength = oRef.binding.getLength ? oRef.binding.getLength() : 0;
			// ... your logic to update counts/badges/texts based on iLength ...
			// Example:
			// this.byId("txtReqItemCount").setText(iLength + " item(s)");
		},

		_updateSelectedCount: function () {
			const oRef = this._reqItem;
			if (!oRef || !oRef.table) return;
			const aSel = oRef.table.getSelectedIndices ? oRef.table.getSelectedIndices() : [];
			// ... update selected count UI ...
			// Example:
			// this.byId("txtReqItemSelected").setText(aSel.length + " selected");
		},

		/**
		 * Always detach to avoid leaks (recommended)
		 */
		onExit: function () {
			const oRef = this._reqItem;
			if (!oRef) return;

			// Detach binding events
			if (oRef.binding) {
				oRef.binding.detachEvent("change",       this._updateTableCounts, this);
				oRef.binding.detachEvent("dataReceived", this._updateTableCounts, this);
				oRef.binding.detachEvent("refresh",      this._updateTableCounts, this);
			}

			// Detach selection change
			if (oRef.table && typeof oRef.table.detachRowSelectionChange === "function") {
				oRef.table.detachRowSelectionChange(this._updateSelectedCount, this);
			}

			// Detach model events
			if (oRef.model) {
				if (oRef._onPropChange && typeof oRef.model.detachPropertyChange === "function") {
				oRef.model.detachPropertyChange(oRef._onPropChange, this);
				} else if (oRef._onPropChange && typeof oRef.model.detachEvent === "function") {
				oRef.model.detachEvent("propertyChange", oRef._onPropChange, this);
				}
				if (oRef._onReqCompleted && typeof oRef.model.detachRequestCompleted === "function") {
				oRef.model.detachRequestCompleted(oRef._onReqCompleted, this);
				}
				if (oRef._onReqSent && typeof oRef.model.detachRequestSent === "function") {
				oRef.model.detachRequestSent(oRef._onReqSent, this);
				}
			}

			this._reqItem = null;
			this._countsAttached = false;
		},


        _updateTableCounts: function () {
            const oTable   = this.byId("req_item_table");
            const oBinding = oTable.getBinding("rows"); // <-- FIXED: use "rows"
            const oVM      = this.getView().getModel("view"); // holds /visibleCount, /totalCount

            // visibleCount = number of rows currently shown (respects filters)
            let visibleCount = 0;
            if (oBinding) {
                visibleCount = oBinding.getLength();
            }

            // totalCount = total items in your backing array (no filters)
            const oJSON = this.getView().getModel();  // default JSONModel
            const aAll  = oJSON ? (oJSON.getProperty("/req_item_rows") || []) : [];
            const totalCount = aAll.length;

            // write both values; useful if you show both in UI
            oVM.setProperty("/visibleCount", visibleCount);
            oVM.setProperty("/totalCount", totalCount);

            // Optional: keep selectedCount in sync if you display it
            if (typeof this._updateSelectedCount === "function") {
                this._updateSelectedCount();
            }
        },

        _updateSelectedCount: function () {
            const oTable = this.byId("req_item_table");
            const oVM    = this.getView().getModel("view");
            const aSel   = oTable.getSelectedIndices ? oTable.getSelectedIndices() : [];
            oVM.setProperty("/selectedCount", aSel.length);
        },

        // (Optional) Clean up if the view is destroyed
        onExit: function () {
            const oTable = this.byId && this.byId("req_item_table");
            if (oTable && this._countsAttached) {
                const oBinding = oTable.getBinding("rows");
                if (oBinding) {
                oBinding.detachEvent("change", this._updateTableCounts, this);
                oBinding.detachEvent("dataReceived", this._updateTableCounts, this);
                oBinding.detachEvent("refresh", this._updateTableCounts, this);
                }
                oTable.detachRowSelectionChange(this._updateSelectedCount, this);
            }
            this._countsAttached = false;
        },

		//  Create Item Logic Section

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
                aRows.push({ participant_name: "", emp_cost_center: "", alloc_amount: "" });
            }
        },

        
        _isEmptyRow: function (oRow) {
            if (!oRow) return true;
            const nameEmpty  = !oRow.participant_name || String(oRow.participant_name).trim() === "";
            const costEmpty  = !oRow.emp_cost_center || String(oRow.emp_cost_center).trim() === "";
            const allocEmpty = !oRow.alloc_amount || String(oRow.alloc_amount).trim() === "";
            return nameEmpty && costEmpty && allocEmpty;
        },

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

			const oModel = this.getView().getModel();
			oModel.setProperty("/control/0/view", 'list');
        },

        onSave: function () {
            // ... validate & persist your item ...
            // Then navigate back:

			const oModel = this.getView().getModel(); // JSONModel
			const aRows  = oModel.getProperty("/req_item_rows") || [];

			aRows.push({
				claim_type: "Testing Claim Type",
				est_amount: 100,
				currency_code: "MYR",
				est_no_of_participant: 100
			});

			oModel.setProperty("/req_item_rows", aRows);

            this.onCancel();
        },

        onSaveAddAnother: function () {
            // Logic to create new item in request item list
           
        },
    });

});