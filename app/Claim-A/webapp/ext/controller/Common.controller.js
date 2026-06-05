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
				const oExtensionAPI = this.getExtensionAPI();

				oExtensionAPI.attachTableInitialized((oEvent) => {

					const oTable = oEvent.getParameter("table");

					if (oTable && !oTable._rowPressAttached) {

						oTable.attachItemPress(this.onItemPress.bind(this));
						oTable._rowPressAttached = true;

						console.log("✅ FE table event attached");
					}
				});
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
			}
		},
		onItemPress: function (oEvent) {
			const oItem = oEvent.getParameter("listItem");
			const oData = oItem.getBindingContext().getObject();

			const fundCenter = oData.FUND_CENTER;
			const glCode = oData.COMMITMENT_ITEM;
			const material = oData.MATERIAL_GROUP;

			this.getExtensionAPI().routing.navigateToRoute("ZEMP_CC_BUDGET_DETAIL", {
				fundCenter,
				glCode,
				material
			});
		}
	});
});
