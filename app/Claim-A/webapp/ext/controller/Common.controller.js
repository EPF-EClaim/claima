sap.ui.define(['sap/ui/core/mvc/ControllerExtension',
	'sap/m/MessageBox'
], function (ControllerExtension, MessageBox) {
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
		}
	});
});
