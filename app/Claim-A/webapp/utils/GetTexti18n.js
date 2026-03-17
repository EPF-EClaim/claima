sap.ui.define([], function () {
	"use strict";

	return {

		getText: function (self, i18nKey, array_i18nParameters) {
			if (array_i18nParameters) {
				return self.getView().getModel("i18n").getResourceBundle().getText(i18nKey, array_i18nParameters);
			}
			else {
				return self.getView().getModel("i18n").getResourceBundle().getText(i18nKey);
			}
		},

	};
});