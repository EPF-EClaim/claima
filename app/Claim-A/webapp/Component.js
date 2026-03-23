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
                this.setModel(models.createSessionModel(), "session");
                this.setModel(models.createUserIdModel(), "userId");
                this.setModel(models.createImageModel(), "imageModel");
 
                const fmt = sap.ui.getCore().getConfiguration().getFormatSettings();
                fmt.setDatePattern("medium", "dd MMM yyyy");
                fmt.setDatePattern("short", "dd MMM yyyy");

                // enable routing
                this.getRouter().initialize();

                const sHash = HashChanger.getInstance().getHash();
                if (sHash === "") this.getRouter().navTo("Dashboard", {}, true);

                this._loadCurrentUser();

                const oModel = this.getModel();
                const ctx = oModel.bindContext("/getUserType()");
                ctx.requestObject().then(oData => {
                    var oSessionModel = this.getModel("session");
                    const sName = oData.name || "";
                    const sPosition = oData.position;
                    const sInitials = sName.substring(0, 2).toUpperCase();
                    oSessionModel.setProperty("/userId", oData.userId || "UNKNOWN");
                    oSessionModel.setProperty("/initials", sInitials);
                    oSessionModel.setProperty("/userName", sName);
                    oSessionModel.setProperty("/position", sPosition);
                    oSessionModel.setProperty("/grade", oData.grade || "UNKNOWN");
                    oSessionModel.setProperty("/department", oData.department || "UNKNOWN");
                    oSessionModel.setProperty("/origin", oData.origin);
                    oSessionModel.setProperty("/userType", oData.userType || "UNKNOWN");
                    oSessionModel.setProperty("/costCenters", oData.costcenters || "UNKNOWN");

                    // save userId to model
                    this.getModel("userId").setData({
                        "userId": oData.userId,
                        "email": oData.id
                    });

                    // Redundant user access model, to be deleted after references have been moved
                    const _oUserAccessModel = new sap.ui.model.json.JSONModel({
                        userType: oData.userType || "UNKNOWN",
                        costcenters: oData.costcenters || "UNKNOWN",
                        userId: oData.userId || "UNKNOWN", // 08/03/2026 - Added to fetch emp id
                    });
                    this.setModel(_oUserAccessModel, "access");
                }).catch(err => {
                    console.error("getUserType failed:", err);
                });
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

            _loadCurrentUser: function () {
                $.ajax({
                    type: "GET",
                    url: "/user-api/currentUser",
                    success: async function (resultData) {
                        // Extract email safely with fallbacks (covers common IdP shapes)
                        var email =
                            resultData.email ||
                            (Array.isArray(resultData.emails) && resultData.emails[0] && resultData.emails[0].value) ||
                            resultData.userPrincipalName ||
                            null;

                        if (email && typeof email === 'string' && email.trim() !== '') {
                            // (Optional) set a model if your view needs it
                            var oUserModel = new JSONModel({ email: email });
                            that.getView().setModel(oUserModel, 'user');

                            const emp_data = await that._getEmpIdDetail(email);
                            that._oReqModel.setProperty("/user", { 
                                emp_id		: emp_data.eeid, 
                                name		: emp_data.name,
                                cost_center	: emp_data.cc 
                            });

                            sap.m.MessageToast.show('Email: ' + email);
                        } else {
                            sap.m.MessageToast.show('Email is empty or not provided for this user.');
                        }
                    }.bind(this),
                    error: function (xhr) {
                        // If you’re still getting 404 here, your approuter may not expose /user-api
                        console.error('currentUser failed:', xhr.status, xhr.responseText);
                        sap.m.MessageToast.show('Failed to load user info (currentUser).');
                    }
                });
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