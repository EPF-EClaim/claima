"use strict";
const Constant = {

    UserType: {
        GA_ADMIN: "GA Admin",
        DTD_ADMIN: "DTD Admin",
        JKEW_ADMIN: "JKEW Admin",
        APPROVER: "Approver",
        SUPER_ADMIN: "Super Admin"
    },
    BudgetSubmissionType: {
        CLAIM: "CLM",
        REQUEST: "REQ"
    },
    BudgetProcessingAction: {
        SUBMIT: "SUBMIT",
        REJECT: "REJECT",
        APPROVE: "APPROVE"
    },
    BudgetCheckStatus: {
        NOT_FOUND: "RECORD NOT FOUND",
        INSUFFICIENT: "INSUFFICIENT BALANCE",
        SUFFICIENT: "OK",
        UPDATED: "RECORD UPDATED"
    },
    NumberRange: {
        REQUEST: "NR01",
        CLAIM: "NR02"
    },
    DisbursementStatus: {
        BYPASS: "02",
        DISBURSED: "03"
    },

    BudgetUpload: {
        EXCLUDE_FIELDS: [
            "COMMITMENT",
            "ACTUAL",
            "CONSUMED",
            "BUDGET_BALANCE"
        ]
    }, 
    Admin: {
        Admin_System: "Admin_System",
        DTD_Admin: "DTD_Admin",
        Admin_CC: "Admin_CC"
    },

    WorkflowType: {
            "CLAIM": "CLM",
            "REQUEST": "REQ"
        },

    ApproverDetailsTable: {
        "CLAIM": "ZAPPROVER_DETAILS_CLAIMS",
        "REQUEST": "ZAPPROVER_DETAILS_PREAPPROVAL",
        "CLAIM_ID": "CLAIM_ID",
        "PREAPPROVAL_ID": "PREAPPROVAL_ID"
    }

};

module.exports = { Constant };