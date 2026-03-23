sap.ui.define([
    "sap/fe/core/AppComponent",
    "claima/model/models",
    "sap/ui/core/routing/HashChanger",
    "claima/utils/Utility"
],
    (AppComponent, models, HashChanger, Utility) => {
        "use strict";

        return AppComponent.extend("claima.Component", {
            metadata: {
                manifest: "json"
            },

            countdown: 840000,
            resetCountdown: 840000,

            init() {
                AppComponent.prototype.init.apply(this, arguments);

                // Initialize the utility 
			    Utility.init(this);

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
 
                const fmt = sap.ui.getCore().getConfiguration().getFormatSettings();
                fmt.setDatePattern("medium", "dd MMM yyyy");
                fmt.setDatePattern("short", "dd MMM yyyy");

                // enable routing
                this.getRouter().initialize();

                const sHash = HashChanger.getInstance().getHash();
                if (sHash === "") this.getRouter().navTo("Dashboard", {}, true);

                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/jszip.js');
                document.head.appendChild(jQueryScript);

                jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/xlsx.js');
                document.head.appendChild(jQueryScript);

                this.setModel(models.createConstantModel(), "constant");

                this.setInactivityTimeout(118 * 60 * 1000);
                this._initActivityTracking(); 
                this.startInactivityTimer();
            },

            _initActivityTracking: function () {
                this._fnResetActivity = () => {
                    this.resetInactivityTimeout();
                };

                ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(sEvent => {
                    document.addEventListener(sEvent, this._fnResetActivity, true);
                });

                const oModel = this.getModel();
                if (oModel && oModel.attachEventOnce) {
                    oModel.attachPropertyChange(this._fnResetActivity, this);
                }

                sap.ui.getCore().getEventBus().subscribe(
                    "sap.ui",
                    "interaction",
                    this._fnResetActivity,
                    this
                );
            },

            getInactivityTimeout: function () {
                return this.countdown;
            },

            setInactivityTimeout: function (timeout_millisec) {
                this.countdown = timeout_millisec;
                this.resetCountdown = this.countdown;
            },

            resetInactivityTimeout: function () {
                this.countdown = this.resetCountdown;
            },

            startInactivityTimer: function () {
                var self = this;
                this.intervalHandle = setInterval(function () {
                    self._inactivityCountdown();
                }, 10000);
            },

            stopInactivityTimer: function () {
                if (this.intervalHandle != null) {
                    clearInterval(this.intervalHandle);
                    this.intervalHandle = null;
                }
            },

            _inactivityCountdown: function () {
                this.countdown -= 10000;

                const iFiveMinMs = 5 * 60 * 1000;
                if (this.countdown === iFiveMinMs) {
                    this._showSessionWarning();
                }

                if (this.countdown <= 0) {
                    this.stopInactivityTimer();
                    this.resetInactivityTimeout();
                    this._doLogout();
                }
            },

            _showSessionWarning: function () {
                sap.m.MessageBox.warning(
                    "Session will expire. Click OK to stay logged in.",
                    {
                        title: "Session Expiring Soon",
                        actions: [
                            sap.m.MessageBox.Action.OK,
                            "Logout"
                        ],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: (sAction) => {
                            if (sAction === "Logout") {
                                this._doLogout();
                            } else {
                                this.resetInactivityTimeout();
                            }
                        }
                    }
                );
            },

            _doLogout: function () {
                this.stopInactivityTimer();

                ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(sEvent => {
                    document.removeEventListener(sEvent, this._fnResetActivity, true);
                });

                sap.ui.getCore().getEventBus().unsubscribe(
                    "sap.ui",
                    "interaction",
                    this._fnResetActivity,
                    this
                );

                window.location.href = "/claima/do/logout";
            },

            destroy: function () {
                this.stopInactivityTimer();
                UIComponent.prototype.destroy.apply(this, arguments);
            }
        });
    });