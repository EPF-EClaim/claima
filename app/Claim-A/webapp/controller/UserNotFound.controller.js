sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(
	Controller
) {
	"use strict";

	return Controller.extend("claima.controller.UserNotFound", {
        /**
        * Logs the user out of the application.
        */
        onSignOut: function () {
            window.location.href = "/claima/do/logout";
        }
	});
});