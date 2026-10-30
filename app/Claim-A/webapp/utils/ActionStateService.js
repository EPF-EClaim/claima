sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "claima/utils/ActionStateResolver",
], function (JSONModel, Log, Resolver) {
  "use strict";

  /**
   * ActionStateService — publishes footer state into a named model.
   *
   * REPLACES Utility.updateFooterState() and the 21 setVisible/setEnabled
   * calls on footer buttons.
   *
   * AFTER, in the view — no `visible="false"`, no expression bindings:
   *
   *   <Button id="button_claimsubmission_submitreport"
   *           text="{i18n>button_claimsubmission_submitreport}"
   *           type="Emphasized"
   *           press="onAction_ClaimSubmission_Toolbar('Submit Report')"
   *           visible="{actionState>/button_claimsubmission_submitreport/visible}"
   *           enabled="{actionState>/button_claimsubmission_submitreport/enabled}"
   *           tooltip="{actionState>/button_claimsubmission_submitreport/reason}" />
   *
   * One owner for the property. The XML expression bindings currently on
   * savedraft / deletereport / submitreport MUST be removed — they are the
   * second writer that overwrites updateFooterState().
   */
  return {
    _oComponent: null,

    init: function (oComponent) {
      this._oComponent = oComponent;
      if (!oComponent.getModel("actionState")) {
        oComponent.setModel(new JSONModel({
          button_claimsubmission_back: {
            visible: false
          },
          button_claimapprover_reject: {
            visible: false
          },
          button_claimapprover_pushback: {
            visible: false
          },
          button_claimapprover_approve: {
            visible: false
          },
          button_claimsubmission_savedraft: {
            visible: false
          },
          button_claimsubmission_deletereport: {
            visible: false
          },
          button_claimsubmission_submitreport: {
            visible: false
          },
          button_claimdetails_input_save: {
            visible: false
          },
          button_claimdetails_input_cancel: {
            visible: false
          }
        }), "actionState");
      }
      return this;
    },

    /**
     * Recompute and publish. Call from ONE place (_refreshActionState in the
     * controller) after any change to status, role, item count or validation.
     *
     * @param {object} oContext see ActionStateResolver.resolve
     * @returns {object} resolver result
     */
    apply: function (oContext) {
      var oResult = Resolver.resolve(oContext);

      if (oResult.problems.length) {
        // LOUD. The old code hid everything and said nothing; this is the
        // single most important behavioural change.
        Log.error(
          "Footer state could not be resolved: " + oResult.problems.join("; "),
          JSON.stringify(oResult.context),
          "claima.ActionStateService"
        );
      }

      this._oComponent.getModel("actionState").setData(oResult.states);
      return oResult;
    },

    /**
     * Build the context from the models, so callers cannot forget a field.
     * Centralising this removes the 9 scattered `sFooterMode = ...` sites.
     */
    buildContext: function (oOpts) {
      var oHeader = oOpts.header || {};
      var aItems = oOpts.items || [];
      return {
        screen: oOpts.screen,
        status: oHeader.status_id,
        role: Resolver.deriveRole(
          oOpts.currentUserId, oHeader.emp_id,
          oOpts.approvalList
        ),
        itemCount: oOpts.itemCount,
        totalAmount: Number(oHeader.total_amount) || 0,
        hasValidationErrors: !!oOpts.hasValidationErrors,
        isCurrentApprovalStep: oOpts.isCurrentApprovalStep !== false,
        isLocked: !!oOpts.isLocked,
      };
    },

    getState: function () {
      return this._oComponent.getModel("actionState").getData() || {};
    },

    /** Guard an action handler against a disabled/hidden action. */
    canExecute: function (sActionId) {
      var s = this.getState()[sActionId];
      return !!(s && s.visible && s.enabled);
    },
  };
});
