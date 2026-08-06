sap.ui.define([
	'sap/ui/core/mvc/ControllerExtension',
	'sap/m/MessageBox',
	'sap/m/MessageToast'
], function (ControllerExtension, MessageBox, MessageToast) {
	'use strict';

	return ControllerExtension.extend('claima.ext.controller.Common', {

		_navToken: 0,
		_reportTimer: null,
		_detailTimer: null,
		_searchTimer: null,
		_sCurrentRouteName: null,
		_oAttachedTable: null,
		_fnAttachedItemPress: null,
		_fnAttachedCellClick: null,

		override: {

			onInit: function () {
				const oRouter = this.base.getAppComponent().getRouter();
				oRouter.attachRouteMatched(this._onRouteMatched, this);
			},

			editFlow: {
				onBeforeCreate: function (mParameters) {
					const aData = mParameters.createParameters;

					const START_DATE = aData.find(i => i.START_DATE)?.START_DATE;
					const END_DATE = aData.find(i => i.END_DATE)?.END_DATE;

					if (START_DATE && END_DATE) {
						const dStart = new Date(START_DATE);
						const dEnd = new Date(END_DATE);

						if (dEnd < dStart) {
							MessageToast.show("End date cannot be earlier than start date");
							return Promise.reject();
						}
					}

					return Promise.resolve();
				}
			}
		},

		/* ==============================
		 * ROUTE HANDLING
		 * ============================== */
		_onRouteMatched: function (oEvent) {

			const sRouteName = oEvent.getParameter("name");
			this._sCurrentRouteName = sRouteName;

			if (
				this._oPendingTable &&
				this._fnPendingCellClick &&
				this._oPendingTable.detachCellClick
			) {
				this._oPendingTable.detachCellClick(
					this._fnPendingCellClick
				);
				this._oPendingTable = null;
				this._fnPendingCellClick = null;
			}

			this._navToken = (this._navToken || 0) + 1;
			const currentToken = this._navToken;

			clearTimeout(this._reportTimer);
			clearTimeout(this._detailTimer);
			clearTimeout(this._searchTimer);

			const oView = this.base.getView();

			const fnGetInnerTable = () => {
				const aTables = oView.findAggregatedObjects(true, oControl =>
					oControl.isA("sap.ui.mdc.Table")
				);

				if (!aTables.length) return null;

				const oMdcTable = aTables[0];
				return oMdcTable.getTable?.() || oMdcTable._oTable || null;
			};

			/* =========================
			 * LIST REPORT
			 * ========================= */
			if (sRouteName === "ZEMP_CC_BUDGET_REPORT") {

				this._reportTimer = setTimeout(() => {
					if (currentToken !== this._navToken) return;

					const oTable = fnGetInnerTable();
					if (!oTable) return;

					this._attachItemPressOnce(oTable, this._onRowPress);
				}, 800);
			}

			if (sRouteName === "ZSUBSTITUTION_RULES_CONFIG") {

				console.log("Entered ZSUBSTITUTION_RULES_CONFIG");

				setTimeout(() => {

					const oView = this.base && this.base.getView && this.base.getView();

					if (!oView) {
						return;
					}

					const aTables = oView.findAggregatedObjects(true, function (oControl) {
						return oControl &&
							oControl.isA &&
							oControl.isA("sap.ui.table.Table");
					});

					const oTable = aTables[0];

					if (!oTable) {
						return;
					}

					if (oTable._bEditOnCellClickAttachedV6) {
						console.log("attachCellClick handler already attached V6");
						return;
					}

					oTable._bEditOnCellClickAttachedV6 = true;

					const fnWait = function (iMilliseconds) {
						return new Promise(function (resolve) {
							setTimeout(resolve, iMilliseconds);
						});
					};

					const fnFindEditButton = function () {
						const aButtons = oView.findAggregatedObjects(true, function (oControl) {
							return oControl &&
								oControl.isA &&
								oControl.isA("sap.m.Button");
						});

						return aButtons.find(function (oButton) {
							const sId = oButton.getId && oButton.getId();
							const sText = oButton.getText && oButton.getText();

							return oButton.getVisible &&
								oButton.getVisible() &&
								oButton.getEnabled &&
								oButton.getEnabled() &&
								(
									(sText && sText === "Edit") ||
									(sId && sId.includes("StandardAction::MassEdit")) ||
									(sId && sId.includes("MassEdit")) ||
									(sId && sId.includes("Edit"))
								);
						});
					};

					const fnClearAllSelections = async function () {

						console.log("ENTER fnClearAllSelections");

						const oBinding = oTable.getBinding("rows");

						if (!oBinding) {
							console.log("Rows binding not found");
							return;
						}

						/*
						 * Best way for OData V4:
						 * Clear selection from header context.
						 * This clears the binding-level selection state, including old selected contexts
						 * that may not be visible anymore.
						 */
						const oHeaderContext = oBinding.getHeaderContext && oBinding.getHeaderContext();

						if (oHeaderContext && oHeaderContext.setSelected) {
							await Promise.resolve(oHeaderContext.setSelected(false));
							console.log("Header context selection cleared");
						} else {
							console.log("Header context setSelected not available");
						}

						/*
						 * Extra fallback:
						 * Also clear currently visible contexts.
						 */
						let aContexts = [];

						if (oBinding.getCurrentContexts) {
							aContexts = oBinding.getCurrentContexts();
						} else if (oBinding.getContexts) {
							aContexts = oBinding.getContexts(0, oTable.getVisibleRowCount && oTable.getVisibleRowCount());
						}

						console.log("Visible contexts found for fallback clear:", aContexts.length);

						for (let i = 0; i < aContexts.length; i++) {
							const oContext = aContexts[i];

							if (oContext && oContext.setSelected) {
								await Promise.resolve(oContext.setSelected(false));
								console.log("Visible context deselected:", oContext.getPath && oContext.getPath());
							}
						}
					};

					const fnOpenStandardEditPopup = async function (oContext) {

						console.log("ENTER fnOpenStandardEditPopup V6");

						if (oTable._bOpeningStandardEditPopup) {
							console.log("Edit popup already opening, skip duplicate click");
							return;
						}

						oTable._bOpeningStandardEditPopup = true;

						try {
							if (!oContext) {
								console.log("No context passed");
								return;
							}

							console.log("Target context path:", oContext.getPath && oContext.getPath());

							/*
							 * Clear all old selections first.
							 * This prevents "Multiple contexts selected".
							 */
							await fnClearAllSelections();

							await fnWait(500);

							/*
							 * Select only clicked row.
							 * Do NOT use oTable.setSelectedIndex().
							 */
							if (oContext.setSelected) {
								await Promise.resolve(oContext.setSelected(true));
								console.log("Target row selected");
							} else {
								console.log("oContext.setSelected is not available");
								return;
							}

							await fnWait(700);

							const oEditButton = fnFindEditButton();

							if (!oEditButton) {
								console.log("No enabled Edit button found");
								return;
							}

							console.log("Firing Edit button:", oEditButton.getId && oEditButton.getId());

							oEditButton.firePress();

							console.log("Edit button fired");

						} catch (oError) {
							console.error("Error opening standard edit popup:", oError);
						} finally {
							setTimeout(function () {
								oTable._bOpeningStandardEditPopup = false;
								console.log("Edit popup opening lock released");
							}, 1000);
						}
					};

					oTable.attachCellClick(async (oEvent) => {
						try {
							const iRowIndex = oEvent.getParameter("rowIndex");

							if (iRowIndex === undefined || iRowIndex === null || iRowIndex < 0) {
								return;
							}

							const oContext = oTable.getContextByIndex(iRowIndex);

							if (!oContext) {
								return;
							}

							await fnOpenStandardEditPopup(oContext);

						} catch (oError) {
							console.error("Error opening standard edit popup:", oError);
						}

					});
				}, 1500);
			}

			/* =========================
			 * DETAIL PAGE
			 * ========================= */
			if (sRouteName === "ZEMP_CC_BUDGET_DETAIL") {

				this._detailTimer = setTimeout(() => {
					if (currentToken !== this._navToken) return;

					const oTable = fnGetInnerTable();
					if (!oTable) return;

					this._attachItemPressOnce(oTable, this._onRowPressClaimDetails);

					// Apply filters
					const oFilterBar = oView.byId("fe::FilterBar::ZEMP_CC_BUDGET_DETAIL");
					if (!oFilterBar) return;

					const oArgs = oEvent.getParameter("arguments");
					if (!oArgs) return;

					const oConditions = {
						FUND_CENTER: [{ operator: "EQ", values: [decodeURIComponent(oArgs.FUND_CENTER || "")] }],
						COMMITMENT_ITEM: [{ operator: "EQ", values: [decodeURIComponent(oArgs.COMMITMENT_ITEM || "")] }],
						MATERIAL_GROUP: [{ operator: "EQ", values: [decodeURIComponent(oArgs.MATERIAL_GROUP || "")] }],
						PROJECT_CODE: [{ operator: "EQ", values: [decodeURIComponent(oArgs.PROJECT_CODE || "")] }]
					};

					oFilterBar.setFilterConditions(oConditions);

					this._searchTimer = setTimeout(() => {
						if (currentToken !== this._navToken) return;
						oFilterBar.fireSearch();
					}, 400);
				}, 800);
			}

			if (sRouteName === "ZEMP_PENDING_LIST") {

				this._reportTimer = setTimeout(() => {
					if (currentToken !== this._navToken) return;

					const oTable = fnGetInnerTable();
					if (!oTable) return;

					// Detach previous pending list cell click handler first
					if (this._oPendingTable && this._fnPendingCellClick && this._oPendingTable.detachCellClick) {
						this._oPendingTable.detachCellClick(this._fnPendingCellClick);
					}

					this._oPendingTable = oTable;

					this._fnPendingCellClick = (oEvent) => {

						// Extra safety: only allow popup in ZEMP_PENDING_LIST
						if (this._sCurrentRouteName !== "ZEMP_PENDING_LIST") {
							return;
						}

						const iRowIndex = oEvent.getParameter("rowIndex");

						// Ignore header click / invalid row
						if (iRowIndex < 0) {
							return;
						}

						const oContext = oTable.getContextByIndex(iRowIndex);

						if (!oContext) {
							return;
						}

						this._onPendingListRowPress({
							getParameter: function (sName) {
								if (sName === "listItem") {
									return {
										getBindingContext: function () {
											return oContext;
										}
									};
								}
								return null;
							}
						});
					};
					oTable.attachCellClick(this._fnPendingCellClick);
				}, 800);
			}
		},

		/* ==============================
		 * SAFE ATTACH HELPER
		 * ============================== */
		_attachItemPressOnce: function (oTable, fnHandler) {

			if (!oTable) return;

			if (oTable.attachItemPress) {
				this._oAttachedTable = oTable;
				this._fnAttachedItemPress = fnHandler;
				oTable.attachItemPress(fnHandler, this);
				return;
			}

			if (oTable.attachCellClick) {

				if (!oTable.__cellClickAttached) {

					oTable.attachCellClick((oEvent) => {

						const iRowIndex = oEvent.getParameter("rowIndex");
						const oContext = oTable.getContextByIndex(iRowIndex);

						if (!oContext) return;

						fnHandler.call(this, {
							getParameter: (sName) => {
								if (sName === "listItem") {
									return {
										getBindingContext: () => oContext
									};
								}
								return null;
							}
						});

					});

					oTable.__cellClickAttached = true;
				}
			}
		},

		/* ==============================
		 * LIST NAVIGATION
		 * ============================== */
		_onRowPress: function (oEvent) {

			const oItem = oEvent.getParameter("listItem");
			if (!oItem) return;

			const oData = oItem.getBindingContext()?.getObject();
			if (!oData) return;

			this.base.getAppComponent().getRouter().navTo("ZEMP_CC_BUDGET_DETAIL", {
				FUND_CENTER: encodeURIComponent(oData.FUND_CENTER),
				COMMITMENT_ITEM: encodeURIComponent(oData.COMMITMENT_ITEM),
				MATERIAL_GROUP: encodeURIComponent(oData.MATERIAL_GROUP || "DEFAULT"),
				PROJECT_CODE: encodeURIComponent(oData.PROJECT_CODE || "")
			});
		},

		/* ==============================
		 * DETAIL NAVIGATION
		 * ============================== */
		_onRowPressClaimDetails: function (oEvent) {

			const oItem = oEvent.getParameter("listItem");
			if (!oItem) return;

			const oData = oItem.getBindingContext()?.getObject();
			if (!oData) return;

			this.base.getAppComponent().getRouter().navTo("ClaimSubmission", {
				claim_id: encodeURIComponent(String(oData.CLAIM_ID))
			});
		},

		_detachRowPress: function () {
			if (!this._oAttachedTable) {
				return;
			}

			if (this._fnAttachedItemPress && this._oAttachedTable.detachItemPress) {
				this._oAttachedTable.detachItemPress(this._fnAttachedItemPress, this);
			}

			if (this._fnAttachedCellClick && this._oAttachedTable.detachCellClick) {
				this._oAttachedTable.detachCellClick(this._fnAttachedCellClick, this);
			}

			this._oAttachedTable = null;
			this._fnAttachedItemPress = null;
			this._fnAttachedCellClick = null;
		},

		_onPendingListRowPress: function (oEvent) {

			if (this._sCurrentRouteName !== "ZEMP_PENDING_LIST") {
				return;
			}

			const oItem = oEvent.getParameter("listItem");
			if (!oItem) return;

			const oContext = oItem.getBindingContext();
			if (!oContext) return;

			sap.ui.require([
				"claima/ext/controller/ApproverPopup"
			], function (ApproverPopup) {

				ApproverPopup.onClickChangeApprover([oContext]);

			});
		}

	});
});