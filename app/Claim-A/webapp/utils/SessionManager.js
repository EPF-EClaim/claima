sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/library",
    "claima/utils/Utility"
], (BaseObject,
    MessageBox,
    Fragment,
    JSONModel,
    coreLibrary,
    Utility) => {
    "use strict";

    const ValueState = coreLibrary.ValueState;

    // ---- Constants ----
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;  // Total idle time before logout
    const WARNING_BEFORE_MS     = 5 * 60 * 1000;   // Show warning when this much time is left
    const CHECK_INTERVAL_MS     = 10 * 1000;       // How often the idle timer is checked
    const COUNTDOWN_INTERVAL_MS = 1000;            // How often the dialog countdown updates
    const LOGOUT_URL            = "/claima/do/logout";
    const REAUTH_FLAG           = "claima_reauth";
    const CURRENT_USER_URL      = "/user-api/currentUser";
    const ACTIVITY_EVENTS       = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const DIALOG_FRAGMENT       = "claima.fragment.SessionWarningDialog";
    const DIALOG_FRAGMENT_ID    = "sessionWarning";

    /**
     * Handles the user session: idle tracking, the timeout warning dialog,
     * session checks, session errors and logout.
     * @class
     * @alias claima.utils.SessionManager
     */
    return BaseObject.extend("claima.utils.SessionManager", {

        /**
         * @param {sap.ui.core.UIComponent} oComponent - Owner component (provides the i18n model)
         */
        constructor: function (oComponent) {
            BaseObject.apply(this);
            this._oComponent = oComponent;
        },

        /**
         * Starts idle tracking and the inactivity timer.
         * @public
         */
        start: function () {
            this._iLastActivity = Date.now();
            this._initActivityTracking();
            this.startInactivityTimer();
        },

        // ================================================================
        // Session errors
        // ================================================================

        /**
         * Clears the re-login flag after the user is loaded successfully.
         * @public
         */
        clearReauthFlag: function () {
            sessionStorage.removeItem(REAUTH_FLAG);
        },

        /**
         * Shows the right message for a failed getUserType call.
         * - 404: employee not found
         * - Session expired: reload once so the approuter shows the login page
         * - Anything else: general error
         * @public
         * @param {Error} oError - Error from the OData call
         */
        handleSessionError: function (oError) {
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
        // Activity tracking
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
            const iRemaining = INACTIVITY_TIMEOUT_MS - (Date.now() - this._iLastActivity);

            if (iRemaining <= 0) {
                this.logout();
            } else if (iRemaining <= WARNING_BEFORE_MS) {
                this._showSessionWarning();
            }
        },

        // ================================================================
        // Session warning dialog
        // ================================================================

        /**
         * Shows the session warning dialog with a live countdown.
         * Logs out automatically when the countdown reaches zero.
         * @private
         */
        _showSessionWarning: async function () {
            this.stopInactivityTimer();

            // Idle limit already passed (e.g. tab was in the background): end the session now
            if (this._iLastActivity + INACTIVITY_TIMEOUT_MS <= Date.now()) {
                this._showSessionExpiredMessage();
                return;
            }

            // Full 5-minute countdown from when the warning opens
            this._iWarningDeadline = Date.now() + WARNING_BEFORE_MS;

            let oDialog;
            try {
                oDialog = await this._getSessionDialog();
            } catch (oError) {
                console.error("Session warning dialog failed to load:", oError);
                this._showSessionExpiredMessage();
                return;
            }
            if (this._bDestroyed) {
                return;
            }

            this._updateSessionCountdown();
            this._clearCountdown();
            this._iCountdownHandle = setInterval(() => this._updateSessionCountdown(), COUNTDOWN_INTERVAL_MS);
            oDialog.open();
        },

        /**
         * Loads the warning dialog fragment once and reuses it.
         * @private
         * @returns {Promise<sap.m.Dialog>} The dialog
         */
        _getSessionDialog: function () {
            if (!this._pSessionDialog) {
                this._oCountdownModel = new JSONModel({
                    message: "",
                    time: "",
                    percent: 100,
                    state: ValueState.Success
                });

                this._pSessionDialog = Fragment.load({
                    id: DIALOG_FRAGMENT_ID,
                    name: DIALOG_FRAGMENT,
                    controller: {
                        onStay: () => this._closeSessionDialog(true),
                        onLogout: () => this._closeSessionDialog(false),
                        onAfterClose: () => this._clearCountdown()
                    }
                }).then((oDialog) => {
                    if (this._bDestroyed) {
                        oDialog.destroy();
                        return oDialog;
                    }
                    oDialog.setModel(this._oComponent.getModel("i18n"), "i18n");
                    oDialog.setModel(this._oCountdownModel, "timeout");

                    // Esc = "Stay Logged In"; we close the dialog ourselves, so cancel the default close
                    oDialog.setEscapeHandler((oPromise) => {
                        this._closeSessionDialog(true);
                        oPromise.reject();
                    });

                    this._oSessionDialog = oDialog;
                    return oDialog;
                }).catch((oError) => {
                    this._pSessionDialog = null; // Allow a retry next time
                    throw oError;
                });
            }
            return this._pSessionDialog;
        },

        /**
         * Updates the countdown text and progress bar. Ends the session when time is up.
         * @private
         */
        _updateSessionCountdown: function () {
            const iRemaining = Math.max(0, this._iWarningDeadline - Date.now());

            if (iRemaining === 0) {
                this._closeSessionDialog(false, true);
                return;
            }

            const iSeconds = Math.ceil(iRemaining / 1000);
            const sTime = Math.floor(iSeconds / 60) + ":" + String(iSeconds % 60).padStart(2, "0");
            const fPercent = (iRemaining / WARNING_BEFORE_MS) * 100;

            this._oCountdownModel.setData({
                message: Utility.getText("session_warning_msg", [sTime]),
                time: sTime,
                percent: fPercent,
                state: fPercent > 50 ? ValueState.Success
                     : fPercent > 20 ? ValueState.Warning
                     : ValueState.Error
            });
        },

        /**
         * Stops the countdown interval of the warning dialog.
         * @private
         */
        _clearCountdown: function () {
            clearInterval(this._iCountdownHandle);
            this._iCountdownHandle = null;
        },

        /**
         * Closes the dialog and resumes the session, ends it with a message, or logs out.
         * @private
         * @param {boolean} bStay - true = stay logged in
         * @param {boolean} [bTimedOut] - true = countdown reached zero (show the expired message)
         */
        _closeSessionDialog: function (bStay, bTimedOut) {
            this._clearCountdown();

            if (this._oSessionDialog && this._oSessionDialog.isOpen()) {
                this._oSessionDialog.close();
            }

            if (bStay) {
                this._resumeSession();
            } else if (bTimedOut) {
                this._showSessionExpiredMessage();
            } else {
                this.logout();
            }
        },

        /**
         * Checks that the server session is still valid, then restarts the idle timer.
         * If the session has expired, shows a message and logs out when it is closed.
         * @private
         */
        _resumeSession: async function () {
            try {
                const oResponse = await fetch(CURRENT_USER_URL, { credentials: "same-origin" });
                const sType = oResponse.headers.get("content-type") || "";

                // The approuter may return its HTML login page with status 200, so check for JSON too
                if (!oResponse.ok || !sType.includes("application/json")) {
                    throw new Error("Session expired");
                }

                this._iLastActivity = Date.now();
                this.startInactivityTimer();
            } catch (oError) {
                this._showSessionExpiredMessage();
            }
        },

        /**
         * Tells the user the session has ended, then logs out when the message is closed.
         * @private
         */
        _showSessionExpiredMessage: function () {
            MessageBox.warning(Utility.getText("session_logout_msg"), {
                title: Utility.getText("session_expired_title"),
                actions: [MessageBox.Action.OK],
                emphasizedAction: MessageBox.Action.OK,
                onClose: () => this.logout()
            });
        },

        // ================================================================
        // Logout & cleanup
        // ================================================================

        /**
         * Stops all timers and listeners and destroys the warning dialog.
         * @private
         */
        _releaseResources: function () {
            this.stopInactivityTimer();
            this._clearCountdown();
            this._removeActivityTracking();
            if (this._oSessionDialog) {
                this._oSessionDialog.destroy();
                this._oSessionDialog = null;
            }
            this._pSessionDialog = null;
            if (this._oCountdownModel) {
                this._oCountdownModel.destroy();
                this._oCountdownModel = null;
            }
        },

        /**
         * Stops all timers and listeners, then logs out through the approuter.
         * @public
         */
        logout: function () {
            this._releaseResources();
            window.location.href = LOGOUT_URL;
        },

        /**
         * Cleans up timers, listeners and the dialog.
         * @public
         */
        destroy: function () {
            this._bDestroyed = true;
            this._releaseResources();
            this._oComponent = null;
            BaseObject.prototype.destroy.apply(this, arguments);
        }
    });
});