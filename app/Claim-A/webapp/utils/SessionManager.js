sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/ProgressIndicator",
    "sap/m/VBox",
    "sap/ui/core/library",
    "sap/m/library",
    "claima/utils/Utility"
], (BaseObject,
    MessageBox,
    Dialog,
    Button,
    Text,
    ProgressIndicator,
    VBox,
    coreLibrary,
    mLibrary,
    Utility) => {
    "use strict";

    const ValueState = coreLibrary.ValueState;
    const ButtonType = mLibrary.ButtonType;
    const DialogType = mLibrary.DialogType;

    // ---- Constants ----
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;  // Total idle time before logout
    const WARNING_BEFORE_MS     = 5 * 60 * 1000;   // Show warning when this much time is left
    const CHECK_INTERVAL_MS     = 10 * 1000;       // How often the idle timer is checked
    const COUNTDOWN_INTERVAL_MS = 1000;            // How often the dialog countdown updates
    const LOGOUT_URL            = "/claima/do/logout";
    const REAUTH_FLAG           = "claima_reauth";
    const CURRENT_USER_URL      = "/user-api/currentUser";
    const ACTIVITY_EVENTS       = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    /**
     * Handles the user session: idle tracking, the timeout warning dialog,
     * session checks, session errors and logout.
     * @class
     * @alias claima.utils.SessionManager
     */
    return BaseObject.extend("claima.utils.SessionManager", {

        /**
         * @param {sap.ui.core.UIComponent} oComponent - The owner component (its event bus is used)
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
            this.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);
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

            this._oComponent.getEventBus().subscribe("sap.ui", "interaction", this._fnResetActivity, this);
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
            this._oComponent.getEventBus().unsubscribe("sap.ui", "interaction", this._fnResetActivity, this);
        },

        // ================================================================
        // Inactivity timer
        // ================================================================

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
        _showSessionWarning: function () {
            this.stopInactivityTimer();

            // Fixed end time, so the countdown stays correct even if the tab was in the background
            this._iWarningDeadline = Date.now() + WARNING_BEFORE_MS;

            const oDialog = this._getSessionDialog();
            this._updateSessionCountdown();

            // Update the countdown every second while the dialog is open
            this._iCountdownHandle = setInterval(() => this._updateSessionCountdown(), COUNTDOWN_INTERVAL_MS);
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
         * Stops the countdown interval of the warning dialog.
         * @private
         */
        _clearCountdown: function () {
            clearInterval(this._iCountdownHandle);
            this._iCountdownHandle = null;
        },

        /**
         * Closes the dialog and either resumes the session or logs out.
         * @private
         * @param {boolean} bStay - true = stay logged in, false = log out
         */
        _closeSessionDialog: function (bStay) {
            this._clearCountdown();

            if (this._oSessionDialog && this._oSessionDialog.isOpen()) {
                this._oSessionDialog.close();
            }

            if (bStay) {
                this._resumeSession();
            } else {
                this._showSessionExpiredMessage();
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

                this.resetInactivityTimeout();
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
            if (this._oSessionDialog) {
                this._oSessionDialog.destroy();
                this._oSessionDialog = null;
            }
            this._removeActivityTracking();
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
            this._releaseResources();
            this._oComponent = null;
            BaseObject.prototype.destroy.apply(this, arguments);
        }
    });
});