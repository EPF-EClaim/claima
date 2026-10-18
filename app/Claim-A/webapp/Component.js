sap.ui.define([
    "sap/fe/core/AppComponent",
    "claima/model/models",
    "claima/utils/Utility",
    "claima/utils/PARequestSharedFunction",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/ProgressIndicator",
    "sap/m/VBox",
    "sap/ui/core/library",
    "sap/m/library",
    "claima/utils/Validator",
    "claima/utils/CustomValidator",
    "claima/utils/RequestUtility"
], (AppComponent,
    models,
    Utility,
    PARequestSharedFunction,
    MessageToast,
    MessageBox,
    Dialog, 
    Button, 
    Text, 
    ProgressIndicator, 
    VBox, 
    coreLibrary, 
    mLibrary,
    Validator,
    CustomValidator,
    RequestUtility) => {
    "use strict";

    const ValueState = coreLibrary.ValueState;
    const ButtonType = mLibrary.ButtonType;
    const DialogType = mLibrary.DialogType;

    // ---- Constants (created once, not on every call) ----
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;  // Total idle time before logout
    const WARNING_BEFORE_MS     = 5 * 60 * 1000;   // Show warning when this much time is left
    const CHECK_INTERVAL_MS     = 10 * 1000;       // How often the idle timer is checked
    const LOGOUT_URL            = "/claima/do/logout";
    const REAUTH_FLAG           = "claima_reauth";
    const ACTIVITY_EVENTS       = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const EXTERNAL_LIBS         = [
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/jszip.js",
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/xlsx.js"
    ];
    const ROUTE_TO_NAV_KEY = {
        "Dashboard": "dashboard",
        "RequestFormStatus": "myrequest",
        "ClaimStatus": "myreport",
        "MyApproval": "approval",
        "ManageSub": "mysubstitution",
        "Analytics": "analytics",
        "Configuration": "config"
    };

    return AppComponent.extend("claima.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * Sets up models, utilities, the user session, idle tracking and routing guards.
         * @public
         */
        init() {
            this.loadExternalLibraries();

            AppComponent.prototype.init.apply(this, arguments);

            this._oReqModel = this.getModel("request");

            // Initialize shared utilities
            Utility.init(this);
            CustomValidator.init(this);
            RequestUtility.init(this);

            // Global models
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createSessionModel(), "session");
            this.setModel(models.createUserIdModel(), "userId");
            this.setModel(models.createImageModel(), "imageModel");
            this.setModel(models.createRoleModel(), "roleModel");
            this.setModel(models.createConstantModel(), "constant");

            // Global date format
            const oFormat = sap.ui.getCore().getConfiguration().getFormatSettings();
            oFormat.setDatePattern("medium", "dd MMM yyyy");
            oFormat.setDatePattern("short", "dd MMM yyyy");

            PARequestSharedFunction._ensureRequestModelDefaults(this._oReqModel);

            // Resolved once roles are known; route guards wait for this
            this._oRolesLoadedPromise = new Promise((resolve) => {
                this._fnRolesLoaded = resolve;
            });

            this._initializeUserSession();

            // Idle tracking
            this.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);
            this._initActivityTracking();
            this.startInactivityTimer();

            const oRouter = this.getRouter();
            oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },

        // ================================================================
        // User session
        // ================================================================

        /**
         * Gets the logged-in user's details and roles from the backend,
         * then fills the session, request and role models.
         * @private
         */
        _initializeUserSession: async function () {
            const oUserTypeContext = this.getModel().bindContext("/getUserType(...)");

            try {
                await oUserTypeContext.execute();
                sessionStorage.removeItem(REAUTH_FLAG);

                const oUserData = oUserTypeContext.getBoundContext().getObject();
                const oRoles = oUserData.roles || {};
                const sName = oUserData.name || "";

                // Update each model once (merge), instead of one setProperty per field
                this.getModel("session").setData({
                    userId: oUserData.userId || "UNKNOWN",
                    email: oUserData.id,
                    initials: sName.substring(0, 2).toUpperCase(),
                    userName: sName,
                    position: oUserData.position,
                    grade: oUserData.grade || "UNKNOWN",
                    department: oUserData.department || "UNKNOWN",
                    origin: oUserData.origin,
                    costCenters: oUserData.costcenters || "UNKNOWN",
                    userType: this._getUserTypeLabel(oRoles)
                }, true);

                this._oReqModel.setProperty("/user", {
                    emp_id: oUserData.userId,
                    name: oUserData.name,
                    cost_center: oUserData.costcenters
                });

                this.getModel("roleModel").setData(this._buildRoleFlags(oRoles), true);

                this._fnRolesLoaded();

                // Reload data that depends on the user's roles
                this.getModel().refresh();

                // Empty hash: go to the Dashboard
                const sHash = (window.location.hash || "").split("?")[0].replace(/\/$/, "");
                if (!sHash || sHash === "#" || sHash === "#/") {
                    this.getRouter().navTo("Dashboard", {}, true);
                }
            } catch (oError) {
                console.error("User Session Initialization Failed:", oError);
                this._fnRolesLoaded();
                this._handleSessionError(oError);
            } finally {
                // Free the operation binding; it's no longer needed
                oUserTypeContext.destroy();
            }
        },

        /**
         * Returns the label shown for the user's type.
         * If the user has several roles, the first match in this order wins.
         * @private
         * @param {Object} oRoles - Roles from getUserType
         * @returns {string} User type label
         */
        _getUserTypeLabel: function (oRoles) {
            if (oRoles.isDTDAdmin)    return "DTD Admin";
            if (oRoles.isAdminSystem) return "JKEW Admin";
            if (oRoles.isAdminCC)     return "GA Admin";
            if (oRoles.isCCCAdmin)    return "CCC Admin";
            if (oRoles.isApprover)    return "Approver";
            return "Claimant";
        },

        /**
         * Builds all role flags used by the views (e.g. visible="{roleModel>/DTDAdmin_role}").
         * Only flags that are true are added, matching the original behaviour.
         * @private
         * @param {Object} oRoles - Roles from getUserType
         * @returns {Object} Role flags to merge into roleModel
         */
        _buildRoleFlags: function (oRoles) {
            const oFlags = {
                // Raw roles from the backend
                isClaimant: oRoles.isClaimant,
                isApprover: oRoles.isApprover,
                isDTDAdmin: oRoles.isDTDAdmin,
                isAdminSystem: oRoles.isAdminSystem,
                isAdminCC: oRoles.isAdminCC,
                isCCCAdmin: oRoles.isCCCAdmin
            };

            // Independent flags: a user can hold several of these
            if (oRoles.isDTDAdmin || oRoles.isAdminSystem || oRoles.isAdminCC) oFlags.Admin_role = true;
            if (oRoles.isDTDAdmin || oRoles.isAdminSystem) oFlags.DTD_JKEW_role = true;
            if (oRoles.isDTDAdmin) oFlags.DTDAdmin_role = true;
            if (oRoles.isCCCAdmin) oFlags.CCC_Admin = true;

            // Priority flags: kept the same as the original else-if chain
            if (!oRoles.isDTDAdmin && oRoles.isAdminSystem) {
                oFlags.JKEW_role = true;
            } else if (!oRoles.isDTDAdmin && !oRoles.isAdminSystem && oRoles.isAdminCC) {
                oFlags.GA_role = true;
            }

            return oFlags;
        },

        /**
         * Shows the right message for a failed getUserType call.
         * - 404: employee not found
         * - Session expired: reload once so the approuter shows the login page
         * - Anything else: general error
         * @private
         * @param {Error} oError - Error from the OData call
         */
        _handleSessionError: function (oError) {
            if (oError.status === 404) {
                MessageBox.error(Utility.getText("user_not_found_desc", []), {
                    title: Utility.getText("user_not_found_title", []),
                    actions: [MessageBox.Action.CLOSE],
                    emphasizedAction: MessageBox.Action.CLOSE,
                    onClose: () => {
                        window.location.href = LOGOUT_URL;
                    }
                });
                return;
            }

            // The flag stops an endless reload loop if the backend is down
            if (this._isSessionExpiredError(oError) && !sessionStorage.getItem(REAUTH_FLAG)) {
                sessionStorage.setItem(REAUTH_FLAG, "X");
                window.location.reload();
                return;
            }

            sessionStorage.removeItem(REAUTH_FLAG);
            MessageBox.error(Utility.getText("msg_failed_generic_error", [oError.message]));
        },

        /**
         * Checks whether an OData error was caused by an expired or missing login session.
         * The approuter returns 401, or its HTML login page (which the OData model can't read).
         * @private
         * @param {Error} oError - Error from the OData call
         * @returns {boolean} true if the user needs to log in again
         */
        _isSessionExpiredError: function (oError) {
            const iStatus = oError && oError.status;
            if (iStatus === 401) {
                return true;
            }
            return !iStatus || /<html|content-type|JSON/i.test((oError && oError.message) || "");
        },

        // ================================================================
        // External libraries
        // ================================================================

        /**
         * Loads the Excel libraries (jszip, xlsx) once. Started at app start in init().
         * Await this before using XLSX: await this.getOwnerComponent().loadExternalLibraries();
         * @public
         * @returns {Promise<void>} Resolves when loaded, rejects if loading fails
         */
        loadExternalLibraries: function () {
            const aLibs = [
                'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/jszip.js',
                'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.2/xlsx.js'
            ];
            aLibs.forEach(src => {
                const script = document.createElement('script');
                script.setAttribute('src', src);
                document.head.appendChild(script);
            });
        },

        /**
         * Adds a script tag and resolves when it has loaded.
         * @private
         * @param {string} sSrc - Script URL
         * @returns {Promise<void>}
         */
        _loadScript: function (sSrc) {
            return new Promise((resolve, reject) => {
                const oScript = document.createElement("script");
                oScript.src = sSrc;
                oScript.onload = () => resolve();
                oScript.onerror = () => reject(new Error("Unable to load " + sSrc));
                document.head.appendChild(oScript);
            });
        },

        // ================================================================
        // Inactivity timer
        // ================================================================

        /**
         * Listens for user activity. Each event only saves a timestamp,
         * so high-frequency events like mousemove and scroll cost almost nothing.
         * @private
         */
        _initActivityTracking: function () {
            this._fnResetActivity = () => {
                this._iLastActivity = Date.now();
            };

            ACTIVITY_EVENTS.forEach((sEvent) => {
                // passive: true lets the browser scroll without waiting for this handler
                document.addEventListener(sEvent, this._fnResetActivity, { capture: true, passive: true });
            });

            sap.ui.getCore().getEventBus().subscribe("sap.ui", "interaction", this._fnResetActivity, this);
        },

        /**
         * Removes all activity listeners.
         * @private
         */
        _removeActivityTracking: function () {
            if (!this._fnResetActivity) return;

            ACTIVITY_EVENTS.forEach((sEvent) => {
                document.removeEventListener(sEvent, this._fnResetActivity, { capture: true });
            });
            sap.ui.getCore().getEventBus().unsubscribe("sap.ui", "interaction", this._fnResetActivity, this);
        },

        /**
         * Returns the validator, creating it on first use.
         * @public
         * @returns {Validator} The validator
         */
        getValidator: function () {
            if (!this._oValidator) {
                this._oValidator = new Validator();
            }
            return this._oValidator;
        },

        /**
         * Returns the time left (ms) before the user is logged out for inactivity.
         * @public
         * @returns {number} Remaining time in ms
         */
        getInactivityTimeout: function () {
            return Math.max(0, this._iTimeoutMs - (Date.now() - this._iLastActivity));
        },

        /**
         * Sets the total idle time before logout and restarts the count.
         * @public
         * @param {number} iTimeoutMs - Idle time in ms
         */
        setInactivityTimeout: function (iTimeoutMs) {
            this._iTimeoutMs = iTimeoutMs;
            this._iLastActivity = Date.now();
        },

        /**
         * Restarts the idle count from now.
         * @public
         */
        resetInactivityTimeout: function () {
            this._iLastActivity = Date.now();
        },

        /**
         * Starts checking for inactivity every 10 seconds.
         * @public
         */
        startInactivityTimer: function () {
            this.stopInactivityTimer(); // Never run two timers at once
            this._iIntervalHandle = setInterval(() => this._checkInactivity(), CHECK_INTERVAL_MS);
        },

        /**
         * Stops the inactivity check.
         * @public
         */
        stopInactivityTimer: function () {
            if (this._iIntervalHandle) {
                clearInterval(this._iIntervalHandle);
                this._iIntervalHandle = null;
            }
        },

        /**
         * Shows the warning when 5 minutes are left, and logs out when time runs out.
         * @private
         */
        _checkInactivity: function () {
            const iRemaining = this.getInactivityTimeout();

            if (iRemaining <= 0) {
                this._doLogout();
            } else if (iRemaining <= WARNING_BEFORE_MS) {
                this._showSessionWarning();
            }
        },

                /**
         * Shows the session warning dialog with a live countdown.
         * Logs out automatically when the countdown reaches zero.
         * @private
         */
        _showSessionWarning: function () {
            this.stopInactivityTimer();

            // Fixed end time, so the countdown stays correct even if the tab was in the background
            this._iWarningDeadline = Date.now() + WARNING_BEFORE_MS;

            const oDialog = this._getSessionDialog();
            this._updateSessionCountdown();

            // Update the countdown every second while the dialog is open
            this._iCountdownHandle = setInterval(() => this._updateSessionCountdown(), 1000);
            oDialog.open();
        },

        /**
         * Creates the session warning dialog once and reuses it.
         * @private
         * @returns {sap.m.Dialog} The dialog
         */
        _getSessionDialog: function () {
            if (this._oSessionDialog) {
                return this._oSessionDialog;
            }

            this._oSessionText = new Text();
            this._oSessionProgress = new ProgressIndicator({
                showValue: false,
                height: "0.5rem",
                width: "100%"
            }).addStyleClass("sapUiSmallMarginTop");

            this._oSessionDialog = new Dialog({
                type: DialogType.Message,
                state: ValueState.Warning,
                title: Utility.getText("session_warning_title"),
                contentWidth: "24rem",
                content: new VBox({
                    items: [this._oSessionText, this._oSessionProgress]
                }),
                beginButton: new Button({
                    text: Utility.getText("session_btn_stay"),
                    type: ButtonType.Emphasized,
                    press: () => this._closeSessionDialog(true)
                }),
                endButton: new Button({
                    text: Utility.getText("session_btn_logout"),
                    press: () => this._closeSessionDialog(false)
                }),
                // Esc counts as "Stay Logged In"
                escapeHandler: (oPromise) => {
                    this._closeSessionDialog(true);
                    oPromise.resolve();
                }
            });

            return this._oSessionDialog;
        },

        /**
         * Updates the countdown text and progress bar. Logs out when time is up.
         * @private
         */
        _updateSessionCountdown: function () {
            const iRemaining = Math.max(0, this._iWarningDeadline - Date.now());

            if (iRemaining === 0) {
                this._closeSessionDialog(false);
                return;
            }

            const iSeconds = Math.ceil(iRemaining / 1000);
            const sTime = Math.floor(iSeconds / 60) + ":" + String(iSeconds % 60).padStart(2, "0");
            const fPercent = (iRemaining / WARNING_BEFORE_MS) * 100;

            this._oSessionText.setText(Utility.getText("session_warning_msg", [sTime]));
            this._oSessionProgress
                .setPercentValue(fPercent)
                .setState(fPercent > 50 ? ValueState.Success
                        : fPercent > 20 ? ValueState.Warning
                        : ValueState.Error);
        },

        /**
         * Closes the dialog and either resumes the session or logs out.
         * @private
         * @param {boolean} bStay - true = stay logged in, false = log out
         */
        _closeSessionDialog: function (bStay) {
            clearInterval(this._iCountdownHandle);
            this._iCountdownHandle = null;

            if (this._oSessionDialog && this._oSessionDialog.isOpen()) {
                this._oSessionDialog.close();
            }

            if (bStay) {
                this._resumeSession();
            } else {
                MessageBox.warning(Utility.getText("session_logout_msg"), {
                    title: Utility.getText("session_expired_title"),
                    actions: [MessageBox.Action.OK],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: () => this._doLogout()
                });
            }
        },

        /**
         * Checks that the server session is still valid, then restarts the idle timer.
         * If the session has expired, shows a message and logs out when it is closed.
         * @private
         */
        _resumeSession: async function () {
            try {
                const oResponse = await fetch("/user-api/currentUser", { credentials: "same-origin" });
                const sType = oResponse.headers.get("content-type") || "";

                // The approuter may return its HTML login page with status 200, so check for JSON too
                if (!oResponse.ok || !sType.includes("application/json")) {
                    throw new Error("Session expired");
                }

                this.resetInactivityTimeout();
                this.startInactivityTimer();
            } catch (oError) {
                MessageBox.warning(Utility.getText("session_logout_msg"), {
                    title: Utility.getText("session_expired_title"),
                    actions: [MessageBox.Action.OK],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: () => this._doLogout()
                });
            }
        },


        /**
         * Stops all timers and listeners, then logs out through the approuter.
         * @private
         */
        _doLogout: function () {
            this.stopInactivityTimer();
            clearInterval(this._iCountdownHandle);
            if (this._oSessionDialog) {
                this._oSessionDialog.destroy();
                this._oSessionDialog = null;
            }
            this._removeActivityTracking();
            window.location.href = LOGOUT_URL;
        },

        /**
         * Cleans up timers and listeners when the component is destroyed.
         * @public
         */
        destroy: function () {
            this.stopInactivityTimer();
            clearInterval(this._iCountdownHandle);
            if (this._oSessionDialog) {
                this._oSessionDialog.destroy();
                this._oSessionDialog = null;
            }
            this._removeActivityTracking();
            AppComponent.prototype.destroy.apply(this, arguments);
        },

        // ================================================================
        // Routing
        // ================================================================

        /**
         * Highlights the matching side navigation item and clears old messages.
         * @private
         * @param {sap.ui.base.Event} oEvent - routeMatched event
         */
        _onRouteMatched: function (oEvent) {
            const sKey = ROUTE_TO_NAV_KEY[oEvent.getParameter("name")];

            if (sKey) {
                // Look up the side navigation once, then reuse it
                if (!this._oSideNavigation) {
                    this._oSideNavigation = this.getRootControl().byId("sideNavigation");
                }
                if (this._oSideNavigation) {
                    this._oSideNavigation.setSelectedKey(sKey);
                }
            }

            sap.ui.getCore().getMessageManager().removeAllMessages();
        },

        /**
         * Stops non-admin users from opening Analytics or Configuration (Z*) pages by URL.
         * Waits until roles are loaded before checking.
         * @private
         * @param {sap.ui.base.Event} oEvent - beforeRouteMatched event
         */
        _onBeforeRouteMatched: function (oEvent) {
            const sRoute = oEvent.getParameter("name");

            // Other routes need no check
            if (!sRoute.startsWith("Z") && sRoute !== "Analytics") return;

            this._oRolesLoadedPromise.then(() => {
                const oRoleModel = this.getModel("roleModel");
                const bAdmin = oRoleModel.getProperty("/isAdminSystem") ||
                               oRoleModel.getProperty("/isDTDAdmin") ||
                               oRoleModel.getProperty("/isAdminCC") ||
                               oRoleModel.getProperty("/isCCCAdmin");

                if (!bAdmin) {
                    this.getRouter().navTo("Dashboard", {}, true);
                    MessageBox.error(Utility.getText("msg_unauthorized_role"));
                }
            });
        }
    });
});