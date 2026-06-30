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
						MATERIAL_GROUP: [{ operator: "EQ", values: [decodeURIComponent(oArgs.MATERIAL_GROUP || "")] }]
					};

					oFilterBar.setFilterConditions(oConditions);

					this._searchTimer = setTimeout(() => {
						if (currentToken !== this._navToken) return;
						oFilterBar.fireSearch();
					}, 400);
				}, 800);
			}
		},

		/* ==============================
		 * SAFE ATTACH HELPER
		 * ============================== */
		_attachItemPressOnce: function (oTable, fnHandler) {

			if (!oTable || !oTable.attachItemPress) return;

			if (!oTable.__itemPressAttached) {
				oTable.attachItemPress(fnHandler, this);
				oTable.__itemPressAttached = true;
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
				MATERIAL_GROUP: encodeURIComponent(oData.MATERIAL_GROUP || "DEFAULT")
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
		}

	});
});