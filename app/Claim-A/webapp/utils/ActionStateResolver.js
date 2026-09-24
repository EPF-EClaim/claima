/**
 * ActionStateResolver — declarative footer/action state.
 *
 * Pure function of (context) -> { actionId: {visible, enabled, reason} }.
 * No UI5 dependency, no byId(), no setVisible(). Runs in Node for tests and
 * in the browser for rendering.
 *
 * ---------------------------------------------------------------------------
 * WHY THE CURRENT DESIGN LOSES BUTTONS
 * ---------------------------------------------------------------------------
 * Utility.updateFooterState() is close to the right idea, but has four
 * structural faults that produce "footer button missing":
 *
 *  1. SILENT TOTAL HIDE.
 *         Object.values(oButtons).forEach(b => b?.setVisible(false));
 *         const aVisibleKeys = oModeButtons[sMode] || [];
 *     Every button is hidden FIRST, then re-shown from a lookup that falls
 *     back to an EMPTY ARRAY. Any unrecognised mode -> entire footer blank,
 *     no error, no warning. A typo or a new status yields a dead screen.
 *
 *  2. MODE DECIDED IN 9 PLACES, APPLIED IN 4.
 *     `sFooterMode = ...` appears at 9 sites; updateFooterState() is called
 *     at 4. The other 5 compute a mode that is never applied, so the footer
 *     reflects whichever path ran last.
 *
 *  3. XML EXPRESSION BINDINGS FIGHT THE IMPERATIVE PASS.
 *         visible="{= ${...>/claim_header/status_id} === 'STAT01' }"
 *     on savedraft / deletereport / submitreport. These re-evaluate whenever
 *     status changes and silently overwrite whatever updateFooterState just
 *     decided. Two owners, last writer wins, order is not deterministic.
 *
 *  4. MODE IS A SINGLE ENUM FOR A MULTI-DIMENSIONAL PROBLEM.
 *     The real inputs are role x status x screen x ownership x delegation.
 *     Collapsing that into SUMMARY|DETAILS|APPROVER|VIEW_ONLY forces the
 *     "send back to owner" case to borrow VIEW_ONLY, which is why send-back
 *     screens lose their action buttons.
 *
 * ---------------------------------------------------------------------------
 * THE MODEL HERE
 * ---------------------------------------------------------------------------
 * Each action declares the CONDITIONS under which it is available, rather
 * than each mode listing its buttons. Adding a status or a role means adding
 * predicates, not auditing every mode array.
 *
 * Crucially: UNKNOWN INPUT IS LOUD. An unrecognised screen or status yields
 * a diagnostic, not a blank toolbar.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof sap !== "undefined" && sap.ui && sap.ui.define) {
    sap.ui.define([], function () { return api; });
  }
  root.ActionStateResolver = api;
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** Screens a footer can be rendered on. */
  var SCREEN = { SUMMARY: "SUMMARY", DETAILS: "DETAILS" };

  /** Status ids, mirrored from Constants.ClaimStatus. */
  var STATUS = {
    DRAFT: "STAT01",
    PENDING_APPROVAL: "STAT02",
    APPROVED: "STAT03",
    SEND_BACK: "STAT04",
    REJECTED: "STAT05",
    CANCELLED: "STAT06",
    COMPLETED_DISBURSEMENT: "STAT07",
  };

  /** Who the current user is RELATIVE TO THIS RECORD. */
  var ROLE = {
    OWNER: "OWNER",
    APPROVER: "APPROVER",   // current pending approver (or substitute)
    VIEWER: "VIEWER",       // admin / past approver / anyone else
  };

  var EDITABLE_BY_OWNER = [STATUS.DRAFT, STATUS.SEND_BACK];
  var TERMINAL = [
    STATUS.APPROVED, STATUS.REJECTED, STATUS.CANCELLED,
    STATUS.COMPLETED_DISBURSEMENT,
  ];

  var has = function (arr, v) { return arr.indexOf(v) !== -1; };

  /**
   * ACTIONS — the single source of truth.
   *
   *   id        control id in the footer
   *   screens   which screens it can appear on
   *   visible   fn(ctx) -> boolean
   *   enabled   fn(ctx) -> true | string   (string = reason it is disabled,
   *                                         shown as a tooltip)
   *
   * Everything a reviewer needs in order to answer "when does this button
   * show?" is on one line, not spread across 9 assignment sites.
   */
  var ACTIONS = [
    {
      id: "button_claimsubmission_back",
      screens: [SCREEN.SUMMARY],
      // Always available. The current code relies on Back having no
      // `visible` attribute in XML (so it defaults true) AND on it being
      // listed in every mode array. It is missing from DETAILS, which is
      // one of the reported "missing button" cases.
      visible: function () { return true; },
      enabled: function () { return true; },
    },
    {
      id: "button_claimdetails_input_cancel",
      screens: [SCREEN.DETAILS],
      visible: function () { return true; },
      enabled: function () { return true; },
    },

    /* ----------------------------- owner, summary ----------------------- */
    {
      id: "button_claimsubmission_savedraft",
      screens: [SCREEN.SUMMARY],
      visible: function (c) {
        return c.role === ROLE.OWNER && has(EDITABLE_BY_OWNER, c.status);
      },
      enabled: function (c) {
        // if (c.isLocked) return "Record is locked by another user";
        return true;
      },
    },
    {
      id: "button_claimsubmission_deletereport",
      screens: [SCREEN.SUMMARY],
      // Only a draft may be deleted. A sent-back claim already exists in the
      // approval history, so it is withdrawn, not deleted.
      visible: function (c) {
        return c.role === ROLE.OWNER && c.status === STATUS.DRAFT;
      },
      enabled: function (c) {
        // if (c.isLocked) return "Record is locked by another user";
        return true;
      },
    },
    {
      id: "button_claimsubmission_submitreport",
      screens: [SCREEN.SUMMARY],
      visible: function (c) {
        return c.role === ROLE.OWNER && has(EDITABLE_BY_OWNER, c.status);
      },
      enabled: function (c) {
        // Reasons are surfaced to the user instead of a silently dead button.
        if (c.itemCount === 0) return "Add at least one claim item";
        // if (c.hasValidationErrors) return "Resolve validation errors first";
        // if (c.totalAmount <= 0) return "Total amount must be greater than zero";
        // if (c.isLocked) return "Record is locked by another user";
        return true;
      },
    },

    /* ----------------------------- approver ----------------------------- */
    {
      id: "button_claimapprover_approve",
      screens: [SCREEN.SUMMARY],
      visible: function (c) {
        return c.role === ROLE.APPROVER && c.status === STATUS.PENDING_APPROVAL;
      },
      enabled: function (c) {
        // if (!c.isCurrentApprovalStep) return "Awaiting an earlier approval step";
        return true;
      },
    },
    {
      id: "button_claimapprover_reject",
      screens: [SCREEN.SUMMARY],
      visible: function (c) {
        return c.role === ROLE.APPROVER && c.status === STATUS.PENDING_APPROVAL;
      },
      enabled: function (c) {
        // if (!c.isCurrentApprovalStep) return "Awaiting an earlier approval step";
        return true;
      },
    },
    {
      id: "button_claimapprover_pushback",
      screens: [SCREEN.SUMMARY],
      visible: function (c) {
        return c.role === ROLE.APPROVER && c.status === STATUS.PENDING_APPROVAL;
      },
      enabled: function (c) {
        // if (!c.isCurrentApprovalStep) return "Awaiting an earlier approval step";
        return true;
      },
    },

    /* ----------------------------- details ------------------------------ */
    {
      id: "button_claimdetails_input_save",
      screens: [SCREEN.DETAILS],
      visible: function (c) {
        return c.role === ROLE.OWNER && has(EDITABLE_BY_OWNER, c.status);
      },
      enabled: function (c) {
        // if (c.hasValidationErrors) return "Resolve validation errors first";
        return true;
      },
    },
  ];

  /** Normalise + validate the context. Missing input must be LOUD. */
  function normalise(ctx) {
    var c = ctx || {};
    var problems = [];

    if (!c.screen) problems.push("screen is missing");
    else if (!SCREEN[c.screen]) problems.push('unknown screen "' + c.screen + '"');

    if (!c.status) problems.push("status is missing");
    else if (Object.keys(STATUS).map(function (k) { return STATUS[k]; })
      .indexOf(c.status) === -1) {
      problems.push('unknown status "' + c.status + '"');
    }

    if (!c.role) problems.push("role is missing");
    else if (!ROLE[c.role]) problems.push('unknown role "' + c.role + '"');

    return {
      screen: c.screen,
      status: c.status,
      role: c.role,
      itemCount: c.itemCount || 0,
      totalAmount: c.totalAmount || 0,
      hasValidationErrors: !!c.hasValidationErrors,
      isCurrentApprovalStep: c.isCurrentApprovalStep !== false,
      isLocked: !!c.isLocked,
      isTerminal: has(TERMINAL, c.status),
      problems: problems,
    };
  }

  /**
   * Resolve state for every action.
   * @returns {{states:Object, problems:Array, visibleCount:number}}
   */
  function resolve(ctx) {
    var c = normalise(ctx);
    var states = {};

    ACTIONS.forEach(function (a) {
      var onScreen = has(a.screens, c.screen);
      // Fail CLOSED on bad input rather than showing arbitrary buttons,
      // but report it so the caller can raise it instead of silently
      // rendering an empty toolbar.
      var visible = onScreen && c.problems.length === 0 && !!a.visible(c);
      var en = visible ? a.enabled(c) : true;

      states[a.id] = {
        visible: visible,
        enabled: en === true,
        reason: typeof en === "string" ? en : null,
      };
    });

    var visibleCount = Object.keys(states).filter(function (k) {
      return states[k].visible;
    }).length;

    // An empty footer is almost always a bug, never a requirement.
    if (visibleCount === 0 && c.problems.length === 0) {
      c.problems.push(
        "no actions resolved visible for screen=" + c.screen +
        " status=" + c.status + " role=" + c.role +
        " (this yields a blank footer)"
      );
    }

    return { states: states, problems: c.problems, visibleCount: visibleCount, context: c };
  }

  /**
   * Derive ROLE from raw data, so callers stop re-deriving it inconsistently.
   * The current code computes bIsApprover inline at one site and assumes it
   * elsewhere.
   */
  function deriveRole(currentUserId, ownerId, approvalList) {
    if (currentUserId && ownerId && currentUserId === ownerId) return ROLE.OWNER;
    var list = approvalList || [];
    var isApprover = list.some(function (a) {
      return ( a.APPROVER_ID === currentUserId ||
        a.SUBSTITUTE_APPROVER_ID === currentUserId ) &&
		  a.STATUS === STATUS.PENDING_APPROVAL;
    });
    return isApprover ? ROLE.APPROVER : ROLE.VIEWER;
  }

  return {
    SCREEN: SCREEN, STATUS: STATUS, ROLE: ROLE, ACTIONS: ACTIONS,
    resolve: resolve, deriveRole: deriveRole, normalise: normalise,
  };
}));
