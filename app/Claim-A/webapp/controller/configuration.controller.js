sap.ui.define([
	'sap/fe/core/PageController'

], (PageController
) => {
	"use strict";

	return PageController.extend('claima.controller.configuration', {

		onInit() {
			PageController.prototype.onInit.apply(this);
		},

		// ADD NEW ROW CONFIGURATION
		onAddEntry: function () {
			let data = this.getView().getModel("configModel").getProperty("/active/data");

			data.push({
				Claim_Purpose_ID: "",
				Claim_Purpose_Desc: "",

				edit: true,
				selected: false
			});
			let m = this.getView().getModel("configModel");
			m.refresh(true);

		},
	});
});
