sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("claima.controller.controller", {
        onInit() {
        }, 

		onOpenConfigTable: function (oEvent) {
			var oNavigation = oEvent.getSource().getId().split("--").pop();
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo(oNavigation);
		},
		
    });
});
