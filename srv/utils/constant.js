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
        TO_BE_DISBURSED: "01",
        BYPASS: "02",
        DISBURSED: "03"
    },

    BudgetUpload: {
        EXCLUDE_FIELDS: [
            "COMMITMENT",
            "ACTUAL",
            "CONSUMED"
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
    },
    Entities: {
        "ZEMP_MASTER": "ZEMP_MASTER",
        "ZELIGIBILITY_RULE": "ZELIGIBILITY_RULE",
        "ZCLAIM_HEADER": "ZCLAIM_HEADER",
        "ZCLAIM_ITEM": "ZCLAIM_ITEM",
        "ZREQUEST_HEADER": "ZREQUEST_HEADER",
        "ZREQUEST_ITEM": "ZREQUEST_ITEM"
    },
    ClaimType: {
        "KURSUS_DLM_NEGARA": "KURSUS_DLM_NEGARA",
        "KURSUS_LUAR_NEGARA": "KURSUS_LUAR_NEGARA",
        "DLM_NEGARA": "DLM_NEGARA",
        "LUAR_NEGARA": "LUAR_NEGARA",
        "PELBAGAI": "PELBAGAI",
        "ELAUN_TUKAR": "ELAUN_TUKAR",
        "ELAUN_PINDAH": "ELAUN_PINDAH",
        "HANDPHONE": "HANDPHONE",
        "I_PAD": "I-PAD"
    },
    ClaimTypeItem: {
        "BAGAI": "BAGAI",
        "BYR_YURAN": "BYR_YURAN",
        "CERAMAH": "CERAMAH",
        "DAFTAR_KEN": "DAFTAR_KEN",
        "DARAT": "DARAT",
        "DOBI": "DOBI",
        "E_PENGAKUT": "E_PENGAKUT",
        "EXCESS": "EXCESS",
        "EXT_ENGAGE": "EXT_ENGAGE",
        "FLIGHT_L": "FLIGHT_L",
        "FLIGHT_O": "FLIGHT_O",
        "FLIGHT_WIL": "FLIGHT_WIL",
        "HOTEL_L": "HOTEL_L",
        "HOTEL_O": "HOTEL_O",
        "Jamuan Ringan Program Outreach": "Jamuan Ringan Program Outreach",
        "KATERER": "KATERER",
        "KECERIAAN": "KECERIAAN",
        "KESIHATAN": "KESIHATAN",
        "KILOMETER": "KILOMETER",
        "KM": "KM",
        "LAUT": "LAUT",
        "LEARN": "LEARN",
        "LOD_TUKAR": "LOD_TUKAR",
        "LODG_O": "LODG_O",
        "LODGING_L": "LODGING_L",
        "MAKAN_L": "MAKAN_L",
        "MAKAN_O": "MAKAN_O",
        "MATAWANG": "MATAWANG",
        "MISC": "MISC",
        "MKN_LOAN": "MKN_LOAN",
        "MKN_TUKAR": "MKN_TUKAR",
        "ONLINE_CRT": "ONLINE_CRT",
        "ONLINE_L": "ONLINE_L",
        "PARKING": "PARKING",
        "PELANGGAN": "PELANGGAN",
        "PELBAGAI": "PELBAGAI",
        "PEM_PINDAH": "PEM_PINDAH",
        "Pembelian Beg Bimbit": "Pembelian Beg Bimbit",
        "P'HARGAAN": "P'HARGAAN",
        "PINDAH": "PINDAH",
        "PKN_PANAS": "PKN_PANAS",
        "PUNSIAN_BG": "PUNSIAN_BG",
        "SERVICES": "SERVICES",
        "SEWA": "SEWA",
        "SUMPAH": "SUMPAH",
        "TGANTIAN": "T.GANTIAN",
        "TAKLIMAT": "TAKLIMAT",
        "TAMBANG": "TAMBANG",
        "TELEFON": "TELEFON",
        "TIPS": "TIPS",
        "TOLL": "TOLL",
        "VISA": "VISA",
        "YURAN": "YURAN",
        "YURAN_KLJ": "YURAN_KLJ",
        "I_PAD": "I-PAD"
    },
    EntitiesFields: {
        "FLIGHT_CLASS_ID": "FLIGHT_CLASS_ID",
        "TRAVEL_HOURS": "TRAVEL_HOURS",
        "TRAVEL_DAYS_ID": "TRAVEL_DAYS_ID",
        "ELIGIBLE_AMOUNT": "ELIGIBLE_AMOUNT",
        "ROOM_TYPE_ID": "ROOM_TYPE_ID",
        "FARE_TYPE_ID": "FARE_TYPE_ID",
        "ROLE": "ROLE",
        "CLAIMID": "CLAIM_ID",
        "CLAIM_STATUS": "STATUS_ID",
        "CLAIM_TYPE_ID": "CLAIM_TYPE_ID",
        "CLAIM_TYPE_ITEM_ID": "CLAIM_TYPE_ITEM_ID",
        "EEID": "EEID",
        "EMP_ID": "EMP_ID",
        "BILL_DATE": "BILL_DATE",
        "RECEIPT_DATE": "RECEIPT_DATE"
    },
    Wildcard: {
        "All": "*",
        "LIKE_PATTERN": "%",
        "DASH": "-",
        "ZERO": "0"
    }, 
    Role: {
        "CEO": "CEO", 
        "CEO_FI": "CEO_FI", 
        "HOD": "HOD"
    }, 
    Status: {
        DRAFT : "STAT01", 
        PENDING_APPROVAL: "STAT02",
        SEND_BACK: "STAT03",
        REJECTED: "STAT04",
        APPROVED : "STAT05",
        COMPLETED_DISBURSEMENT: "STAT06",
        CANCELLED: "STAT07"
    },
    ReminderScenario: {
        NO_CASH_ADVANCE: "1",
        WITH_CASH_ADVANCE: "2"
    }, 
    RequestType: {
        Travel : "RT0001", 
        Reimbursement : "RT0004"
    }, 
    ReminderMilestone: {
        AgingMilestone: { 1: '1', 30: '30', 60: '60', 85: '85' }
    },
    FrequencyPeriod: {
        "MONTH": "Month",
        "YEAR": "Year",
        "THREE_YEARS": "3 years"
    }

};

module.exports = { Constant };