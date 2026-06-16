sap.ui.define(['sap/ui/core/mvc/ControllerExtension',
	'sap/m/MessageBox',
], function (ControllerExtension, MessageBox, OverflowToolbar) {
	'use strict';

	return ControllerExtension.extend('claima.ext.controller.Common', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 * @memberOf claima.ext.controller.Common
			 */
			onInit: function () {

				console.log("COMMON EXTENSION LOADED");

				// wait for FE table to render

				this._navToken = (this._navToken || 0) + 1;
				const currentToken = this._navToken;
				const targetHash = window.location.hash;

				setTimeout(() => {
					if (currentToken !== this._navToken) {
						console.log("⏭️ Skip stale detail filter timer");
						return;
					}

					if (!targetHash.includes("ZEMP_CC_BUDGET_DETAIL")) {
						return;
					}

					const oView = this.base.getView();
					console.log("Searching for MDC table...");

					// find sap.ui.mdc.Table
					const aTables = oView.findAggregatedObjects(true, function (oControl) {
						return oControl.isA("sap.ui.mdc.Table");
					});

					if (!aTables.length) {
						console.log("No MDC table found");
						return;
					}

					const oMdcTable = aTables[0];
					console.log("MDC table found");

					let oInnerTable = null;

					// try standard method
					if (oMdcTable.getTable) {
						oInnerTable = oMdcTable.getTable();
					}

					// fallback method
					if (!oInnerTable && oMdcTable._oTable) {
						oInnerTable = oMdcTable._oTable;
					}

					if (!oInnerTable) {
						console.log("Inner table not available");
						return;
					}

					console.log("Inner table ready");


					// FINAL FIX — use selection instead of click
					if (oInnerTable.setMode) {
						oInnerTable.setMode("SingleSelectMaster");
					}

					if (oInnerTable.attachSelectionChange) {
						oInnerTable.attachSelectionChange(this.onRowPress, this);
						console.log("SelectionChange attached");
					} else {
						console.log("SelectionChange not supported");
					}

				}, 1500);


				// DETAIL PAGE AUTO FILTER + LOAD (FINAL FIXED)
				// DETAIL PAGE AUTO FILTER + LOAD (CLEAN WORKING VERSION)
				setTimeout(() => {

					const oView = this.base.getView();
					const sHash = window.location.hash;

					// only run on detail page
					if (!sHash.includes("ZEMP_CC_BUDGET_DETAIL")) {
						return;
					}

					console.log("Inside DETAIL page");

					const oFilterBar = oView.byId("fe::FilterBar::ZEMP_CC_BUDGET_DETAIL");

					if (!oFilterBar) {
						console.log("FilterBar not found");
						return;
					}

					console.log("FilterBar found");

					// extract values from URL
					const fundMatch = sHash.match(/FUND_CENTER=([^,)\s]+)/);
					const commitMatch = sHash.match(/COMMITMENT_ITEM=([^,)\s]+)/);
					const matMatch = sHash.match(/MATERIAL_GROUP=([^,)\s]+)/);

					if (!fundMatch || !commitMatch || !matMatch) {
						console.log(" Missing parameters");
						return;
					}

					const oConditions = {
						FUND_CENTER: [{
							operator: "EQ",
							values: [fundMatch[1]]
						}],
						COMMITMENT_ITEM: [{
							operator: "EQ",
							values: [commitMatch[1]]
						}],
						MATERIAL_GROUP: [{
							operator: "EQ",
							values: [matMatch[1]]
						}]
					};

					// apply filter conditions
					// ✅ CLEAR old filters before applying new
					oFilterBar.setFilterConditions({});
					oFilterBar.setFilterConditions(oConditions);
					console.log("Filters applied");

					// IMPORTANT: give FE enough time then trigger search
					setTimeout(() => {
						oFilterBar.fireSearch();
						console.log("Search fired FINAL ");
					}, 800);

				}, 3000);


			},

			editFlow: {
				onBeforeCreate(mParameters) {
					var aData = mParameters.createParameters;
					const START_DATE = aData.find(item => item.START_DATE)?.START_DATE;
					const END_DATE = aData.find(item => item.END_DATE)?.END_DATE;
					const dStart = new Date(START_DATE);
					const dEnd = new Date(END_DATE);

					if (START_DATE && END_DATE && dEnd < dStart) {
						sap.m.MessageToast.show("End date cannot be earlier than start date");
						return Promise.reject();
					}
					return Promise.resolve();
				}
			},

		},


		onRowPress: function (oEvent) {

			const oItem = oEvent.getParameter("listItem");

			if (!oItem) {
				console.log("No listItem");
				return;
			}

			const oContext = oItem.getBindingContext();

			if (!oContext) {
				console.log("No binding context");
				return;
			}

			const oData = oContext.getObject();

			// dEBUG ALL DATA
			console.log("FULL ROW DATA:", oData);

			// check specific fields
			console.log("FUND_CENTER:", oData.FUND_CENTER);
			console.log("COMMITMENT_ITEM:", oData.COMMITMENT_ITEM);
			console.log("MATERIAL_GROUP:", oData.MATERIAL_GROUP);


			const oRouter = this.base.getAppComponent().getRouter();

			oRouter.navTo("ZEMP_CC_BUDGET_DETAIL", {
				FUND_CENTER: oData.FUND_CENTER,
				COMMITMENT_ITEM: oData.COMMITMENT_ITEM,
				MATERIAL_GROUP: oData.MATERIAL_GROUP
			});

		}

	});
});
