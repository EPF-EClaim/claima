sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Messaging",
    "sap/base/i18n/Formatting",
    "sap/m/MessageBox",
    "claima/model/models",
    "claima/utils/Utility",
    "claima/utils/PARequestSharedFunction",
    "claima/utils/Validator",
    "claima/utils/CustomValidator",
    "claima/utils/RequestUtility",
    "claima/utils/SessionManager"
], (AppComponent,
    JSONModel,
    Messaging,
    Formatting,
    MessageBox,
    models,
    Utility,
    PARequestSharedFunction,
    Validator,
    CustomValidator,
    RequestUtility,
    SessionManager) => {
    "use strict";

    // ---- Constants ----
    const DEFAULT_NAV_KEY = "dashboard";
    const DATE_PATTERN    = "dd MMM yyyy";
    const EXTERNAL_LIBS = [
        sap.ui.require.toUrl("claima/libs/xlsx.full.min.js"),
        sap.ui.require.toUrl("claima/libs/jszip.js")
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
        init: function () {
            AppComponent.prototype.init.apply(this, arguments);
            this.loadExternalLibraries().catch(() => {});

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

            // UI state for the shell (side navigation selection)
            this.setModel(new JSONModel({ selectedNavKey: DEFAULT_NAV_KEY }), "app");

            // Global date format
            Formatting.setDatePattern("medium", DATE_PATTERN);
            Formatting.setDatePattern("short", DATE_PATTERN);

            PARequestSharedFunction._ensureRequestModelDefaults(this._oReqModel);

            // Resolved once roles are known; route guards wait for this
            this._oRolesLoadedPromise = new Promise((resolve) => {
                this._fnRolesLoaded = resolve;
            });

            // Created before the user session call, because its error handling uses it
            this._oSessionManager = new SessionManager(this);

            this._initializeUserSession();

            // Idle tracking
            this._oSessionManager.start();

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
            let oUserData;

            try {
                await oUserTypeContext.execute();
                oUserData = oUserTypeContext.getBoundContext().getObject();
            } catch (oError) {
                this._fnRolesLoaded();
                this._oSessionManager.handleSessionError(oError);
                return;
            } finally {
                oUserTypeContext.destroy();
            }

            this._oSessionManager.clearReauthFlag();

            const oRoles = oUserData.roles || {};
            const sName = oUserData.name || "";

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

            this.getModel().refresh();

            if (this._isEmptyHash()) {
                this.getRouter().navTo("Dashboard", {}, true);
            }
        },

        /**
         * Checks whether the URL has no route (e.g. "", "#", "#/").
         * @private
         * @returns {boolean} true if no route is in the URL
         */
        _isEmptyHash: function () {
            const sHash = (window.location.hash || "").split("?")[0].replace(/\/+$/, "");
            return !sHash || sHash === "#" || sHash === "#/";
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

        // ================================================================
        // External libraries
        // ================================================================

        /**
         * Loads the Excel libraries (jszip, xlsx) once. Started at app start in init().
         * @public
         */
        loadExternalLibraries: function () {
            if (!this._oLibsPromise) {
                this._oLibsPromise = EXTERNAL_LIBS
                    .reduce((p, sSrc) => p.then(() => this._loadScript(sSrc)), Promise.resolve())
                    .catch((oError) => {
                        this._oLibsPromise = null; // allow retry
                        throw oError;
                    });
            }
            return this._oLibsPromise;
        },

        /**
         * Loads one script and resolves when it has executed.
         * Re-uses an existing <script> tag instead of adding a duplicate.
         * @private
         * @param {string} sSrc - Script URL
         * @returns {Promise<void>} Resolves on load, rejects on error
         */
        _loadScript: function (sSrc) {
            return new Promise((resolve, reject) => {
                const oExisting = document.querySelector(`script[src="${sSrc}"]`);

                if (oExisting) {
                    // Already finished loading
                    if (oExisting.dataset.loaded === "true") {
                        resolve();
                        return;
                    }
                    // Still loading: wait for it
                    oExisting.addEventListener("load", () => resolve(), { once: true });
                    oExisting.addEventListener("error", () => reject(new Error(`Failed to load ${sSrc}`)), { once: true });
                    return;
                }

                const oScript = document.createElement("script");
                oScript.src = sSrc;
                oScript.async = false; // keep execution order
                oScript.onload = () => {
                    oScript.dataset.loaded = "true";
                    resolve();
                };
                oScript.onerror = () => {
                    oScript.remove(); // so a retry can add it again
                    reject(new Error(`Failed to load ${sSrc}`));
                };
                document.head.appendChild(oScript);
            });
        },

        // ================================================================
        // Shared helpers
        // ================================================================

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
         * Cleans up the session manager when the component is destroyed.
         * @public
         */
        destroy: function () {
            if (this._oSessionManager) {
                this._oSessionManager.destroy();
                this._oSessionManager = null;
            }
            AppComponent.prototype.destroy.apply(this, arguments);
        },

        // ================================================================
        // Routing
        // ================================================================

        /**
         * Syncs the side navigation selection with the current route and clears old messages.
         * @private
         * @param {sap.ui.base.Event} oEvent - routeMatched event
         */
        _onRouteMatched: function (oEvent) {
            const sKey = ROUTE_TO_NAV_KEY[oEvent.getParameter("name")];

            if (sKey) {
                this.getModel("app").setProperty("/selectedNavKey", sKey);
            }

            Messaging.removeAllMessages();
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