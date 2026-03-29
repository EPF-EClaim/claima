sap.ui.define([
    "sap/fe/core/AppComponent",
    "claima/model/models",
    "sap/ui/core/routing/HashChanger",
    "claima/utils/Utility",
    "sap/ui/model/json/JSONModel",
    "claima/utils/PARequestSharedFunction",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "claima/utils/Validator"
],
    (AppComponent, models, HashChanger, Utility, JSONModel, PARequestSharedFunction, Filter, FilterOperator, MessageToast, Validator) => {
        "use strict";

        return AppComponent.extend("claima.Component", {
            metadata: {
                manifest: "json"
            },

            countdown: 840000,
            resetCountdown: 840000,

            init() {
                AppComponent.prototype.init.apply(this, arguments);

                this._oReqModel = this.getModel("request");

                // Initialize the utility 
                Utility.init(this);

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                this.setModel(models.createSessionModel(), "session");
                this.setModel(models.createUserIdModel(), "userId");
                this.setModel(models.createImageModel(), "imageModel");
                this.setModel(models.createRoleModel(), "roleModel");

                const fmt = sap.ui.getCore().getConfiguration().getFormatSettings();
                fmt.setDatePattern("medium", "dd MMM yyyy");
                fmt.setDatePattern("short", "dd MMM yyyy");

                // enable routing
                this.getRouter().initialize();

                const sHash = HashChanger.getInstance().getHash();
                if (sHash === "") this.getRouter().navTo("Dashboard", {}, true);

                PARequestSharedFunction._ensureRequestModelDefaults(this._oReqModel);
                this._loadCurrentUser();

                const oModel = this.getModel();
                const oUserTypeContext = oModel.bindContext("/getUserType()");
                oUserTypeContext.requestObject().then(oData => {
                    var oSessionModel = this.getModel("session");
                    const sName = oData.name || "";
                    const sPosition = oData.position;
                    const sInitials = sName.substring(0, 2).toUpperCase();
                    oSessionModel.setProperty("/userId", oData.userId || "UNKNOWN");
                    oSessionModel.setProperty("/email", oData.id);
                    oSessionModel.setProperty("/initials", sInitials);
                    oSessionModel.setProperty("/userName", sName);
                    oSessionModel.setProperty("/position", sPosition);
                    oSessionModel.setProperty("/grade", oData.grade || "UNKNOWN");
                    oSessionModel.setProperty("/department", oData.department || "UNKNOWN");
                    oSessionModel.setProperty("/origin", oData.origin);
                    oSessionModel.setProperty("/costCenters", oData.costcenters || "UNKNOWN");
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

                this.setInactivityTimeout(600000);
                this._initActivityTracking();
                this.startInactivityTimer();

                this.getRouter().attachRouteMatched(this._onRouteMatched, this);
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
                            this.setModel(oUserModel, 'user');

                            const oEmpData = await this._getEmpIdDetail(email);
                            this._oReqModel.setProperty("/user", {
                                emp_id: oEmpData.eeid,
                                name: oEmpData.name,
                                cost_center: oEmpData.cc
                            });

                            var oRoleModel = this.getModel("roleModel");
                            var oSessionModel = this.getModel("session");

                            resultData.scopes.forEach(function (scope) {
                                if (scope.includes("Claimant")) {
                                    oRoleModel.setProperty("/isClaimant", true);
                                }
                                if (scope.includes("Approver")) {
                                    oRoleModel.setProperty("/isApprover", true);
                                }
                                if (scope.includes("DTD_Admin")) {
                                    oRoleModel.setProperty("/isDTDAdmin", true);
                                    oSessionModel.setProperty("/userType", "DTD Admin");
                                }
                                if (scope.includes("Admin_System")) {
                                    oRoleModel.setProperty("/isAdminSystem", true);
                                    oSessionModel.setProperty("/userType", "JKEW Admin"); 
                                }
                                if (scope.includes("Admin_CC")) {
                                    oRoleModel.setProperty("/isAdminCC", true);
                                    oSessionModel.setProperty("/userType", "GA Admin"); 
                                }
                            })

                            sap.m.MessageToast.show('Email: ' + email);
                        } else {
                            sap.m.MessageToast.show('Email is empty or not provided for this user.');
                        }
                    }.bind(this),
                    error: function (xhr) {
                        // If you’re still getting 404 here, your approuter may not expose /user-api
                        console.error('currentUser failed:', xhr.status, xhr.responseText);
                        sap.m.MessageToast.show('Failed to load user info (currentUser).');
                    }.bind(this)
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

            /**
             * Returns the validator
             * @public
             * @return {Validator} returns the validator
             */
            getValidator: function () {
                if (!this._oValidator) {
                    this._oValidator = new Validator();
                }
                return this._oValidator;
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
                //countdown another 5 mins if no response to the prompt message
                //direct force user to logout
                this.stopInactivityTimer();
                this._promptExpireHandle = setTimeout(() => {
                    this._doLogout();
                }, 5 * 60 * 1000);

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
                            clearTimeout(this._promptExpireHandle);
                            this._promptExpireHandle = null;
                            if (sAction === "Logout") {
                                this._doLogout();
                            } else {
                                this._resumeSession();
                            }
                        }
                    }
                );
            },

            _resumeSession: function () {
                $.ajax({
                    type: "GET",
                    url: "/user-api/currentUser",
                    success: () => {
                        this.resetInactivityTimeout();
                        this.startInactivityTimer();
                    },
                    error: () => {
                        MessageToast.show("Session logout due to inactivity");
                        this._doLogout();
                    }
                })
            },

            _doLogout: function () {
                this.stopInactivityTimer();

                ["keydown", "click", "scroll", "touchstart"].forEach(sEvent => {
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

            // get backend data
            async _getEmpIdDetail(sEMAIL) {
                const oListBinding = this.getModel().bindList("/ZEMP_MASTER", null, null, [
                    new Filter({
                        path: "EMAIL",
                        operator: FilterOperator.EQ,
                        value1: sEMAIL,
                        caseSensitive: false
                    }) // non case-sensitive search
                ]);

                try {
                    const aContexts = await oListBinding.requestContexts(0, 1);

                    if (aContexts.length > 0) {
                        const oData = aContexts[0].getObject();
                        return {
                            eeid: oData.EEID,
                            name: oData.NAME,
                            grade: oData.GRADE,
                            cc: oData.CC,
                            pos: oData.POS,
                            dep: oData.DEP,
                            unit_section: oData.UNIT_SECTION,
                            b_place: oData.B_PLACE,
                            marital: oData.MARITAL,
                            job_group: oData.JOB_GROUP,
                            office_location: oData.OFFICE_LOCATION,
                            address_line1: oData.ADDRESS_LINE1,
                            address_line2: oData.ADDRESS_LINE2,
                            address_line3: oData.ADDRESS_LINE3,
                            postcode: oData.POSTCODE,
                            state: oData.STATE,
                            country: oData.COUNTRY,
                            contact_no: oData.CONTACT_NO,
                            email: oData.EMAIL,
                            direct_supperior: oData.DIRECT_SUPPERIOR,
                            role: oData.ROLE,
                            user_type: oData.USER_TYPE,
                            mobile_bill_eligibility: oData.MOBILE_BILL_ELIGIBILITY,
                            mobile_bill_elig_amount: oData.MOBILE_BILL_ELIG_AMOUNT,
                            employee_type: oData.EMPLOYEE_TYPE,
                            position_name: oData.POSITION_NAME,
                            position_start_date: oData.POSITION_START_DATE,
                            position_event_reason: oData.POSITION_EVENT_REASON,
                            confirmation_date: oData.CONFIRMATION_DATE,
                            effective_date: oData.EFFECTIVE_DATE,
                            updated_date: oData.UPDATED_DATE,
                            inserted_date: oData.INSERTED_DATE,
                            medical_insurance_entitlement: oData.MEDICAL_INSURANCE_ENTITLEMENT,
                            descr: {
                                cc: null,
                                dep: null,
                                unit_section: null,
                                marital: null,
                                job_group: null,
                                state: null,
                                country: null,
                                direct_supperior: null,
                                role: null,
                                user_type: null,
                                employee_type: null
                            }
                        };
                    } else {
                        console.warn("No employee found with email: " + sEMAIL);
                        return null;
                    }
                } catch (oError) {
                    console.error("Error fetching employee detail", oError);
                    return null; // Return null so the app doesn't crash
                }
            },

            destroy: function () {
                this.stopInactivityTimer();
                // UIComponent.prototype.destroy.apply(this, arguments);
                clearTimeout(this._promptExpireHandle);
                AppComponent.prototype.destroy.apply(this, arguments);
            },

            _onRouteMatched: function (oEvent) {
                // To set current key of Side Navigation
                var _sRoute = oEvent.getParameter("name");
                var _oSideNavigation = this.getRootControl().byId("sideNavigation");
                var _oRouteKeyMapping = {
                    "Dashboard": "dashboard",
                    "RequestFormStatus": "myrequest",
                    "ClaimStatus": "myreport",
                    "MyApproval": "approval",
                    "ManageSub": "mysubstitution",
                    "Analytics": "analytics",
                    "Configuration": "config"
                };

                var _sKey = _oRouteKeyMapping[_sRoute];

                if (_oSideNavigation && _sKey) {
                    _oSideNavigation.setSelectedKey(_sKey);
                }
            }

        });
    });