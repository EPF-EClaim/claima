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
		override: {
			/**
				  * Called when a controller is instantiated and its View controls (if available) are already created.
				  * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
				  * @memberOf claima.ext.controller.Common
				  */
			onInit: function () {

				// Attach a router listener that runs evry time the page view changes
				const oRouter = this.base.getAppComponent().getRouter();
				oRouter.attachRouteMatched(this._onRouteMatched, this);
			},

			editFlow: {
				onBeforeCreate(mParameters) {
					var aData = mParameters.createParameters;
					const START_DATE = aData.find(item => item.START_DATE)?.START_DATE;
					const END_DATE = aData.find(item => item.END_DATE)?.END_DATE;
					const dStart = new Date(START_DATE);
					const dEnd = new Date(END_DATE);
					if (START_DATE && END_DATE && dEnd < dStart) {
						MessageToast.show("End date cannot be earlier than start date");
						return Promise.reject();
					}
					return Promise.resolve();
				}
			}
		},

		/**
		 * Triggers dynamically every time the user navigates back .
		 */
		_onRouteMatched: function (oEvent) {
			const sRouteName = oEvent.getParameter("name");

			this._navToken = (this._navToken || 0) + 1;
			const currentToken = this._navToken;

			// clear timeouts
			if (this._reportTimer) { clearTimeout(this._reportTimer); }
			if (this._detailTimer) { clearTimeout(this._detailTimer); }
			if (this._searchTimer) { clearTimeout(this._searchTimer); }

			//budget report
			if (sRouteName === "ZEMP_CC_BUDGET_REPORT") {
				this._reportTimer = setTimeout(() => {
					if (currentToken !== this._navToken) return;

					const oView = this.base.getView();
					const aTables = oView.findAggregatedObjects(true, function (oControl) {
						return oControl.isA("sap.ui.mdc.Table");
					});
					if (!aTables.length) return;
					const oMdcTable = aTables[0];

					let oInnerTable = oMdcTable.getTable ? oMdcTable.getTable() : null;
					if (!oInnerTable && oMdcTable._oTable) { oInnerTable = oMdcTable._oTable; }
					if (!oInnerTable) return;

					if (oInnerTable.setMode) { oInnerTable.setMode("SingleSelectMaster"); }
					if (oInnerTable.detachSelectionChange) { oInnerTable.detachSelectionChange(this.onRowPress, this); }
					if (oInnerTable.attachSelectionChange) {
						oInnerTable.attachSelectionChange(this.onRowPress, this);
					}
				}, 1000);
			}

			//route to budget detail
			if (sRouteName === "ZEMP_CC_BUDGET_DETAIL") {
				this._detailTimer = setTimeout(() => {
					if (currentToken !== this._navToken) return;

					const oView = this.base.getView();
					const oFilterBar = oView.byId("fe::FilterBar::ZEMP_CC_BUDGET_DETAIL");
					if (!oFilterBar) return;

					const oArgs = oEvent.getParameter("arguments");
					if (!oArgs || !oArgs.FUND_CENTER) return;
					const oConditions = {
						FUND_CENTER: [{ operator: "EQ", values: [decodeURIComponent(oArgs.FUND_CENTER)] }],
						COMMITMENT_ITEM: [{ operator: "EQ", values: [decodeURIComponent(oArgs.COMMITMENT_ITEM)] }],
						MATERIAL_GROUP: [{ operator: "EQ", values: [decodeURIComponent(oArgs.MATERIAL_GROUP)] }]
					};

					// Clean previous filtering 
					oFilterBar.setFilterConditions({});
					oFilterBar.setFilterConditions(oConditions);

					this._searchTimer = setTimeout(() => {
						if (currentToken !== this._navToken) return;
						oFilterBar.fireSearch();
						console.log("Filtered detail page with current keys:", oConditions);
					}, 500);
				}, 1000);
			}
		},

		onRowPress: function (oEvent) {
			const bSelected = oEvent.getParameter("selected");
			// Only navigate on selection, not deselection
			if (bSelected === false) {
				return;
			}

			const oItem = oEvent.getParameter("listItem");
			if (!oItem) return;

			const oContext = oItem.getBindingContext();
			if (!oContext) return;

			const oData = oContext.getObject();
			const oRouter = this.base.getAppComponent().getRouter();

			const oTable = oEvent.getSource();
			if (oTable && oTable.removeSelections) {
				oTable.removeSelections(true); // Ensure the clicked item is selected
			}
			oRouter.navTo("ZEMP_CC_BUDGET_DETAIL", {
				FUND_CENTER: encodeURIComponent(oData.FUND_CENTER),
				COMMITMENT_ITEM: encodeURIComponent(oData.COMMITMENT_ITEM),
				MATERIAL_GROUP: encodeURIComponent(oData.MATERIAL_GROUP || "DEFAULT")
			});
		},


	});
});