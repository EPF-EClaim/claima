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
        "ZEMP_DEPENDENT": "ZEMP_DEPENDENT",
        "ZELIGIBILITY_RULE": "ZELIGIBILITY_RULE",
        "ZCLAIM_HEADER": "ZCLAIM_HEADER",
        "ZCLAIM_ITEM": "ZCLAIM_ITEM",
        "ZREQUEST_HEADER": "ZREQUEST_HEADER",
        "ZREQUEST_ITEM": "ZREQUEST_ITEM",
        "ZCLM_TYPE_EXCEPTION_LIST": "ZCLM_TYPE_EXCEPTION_LIST",
        "ZCLAIM_TYPE_ITEM": "ZCLAIM_TYPE_ITEM",
        "ZREQ_ITEM_PART": "ZREQ_ITEM_PART",
        "ZRATE_KM": "ZRATE_KM",
        "ZCONSTANTS": "ZCONSTANTS",
        "ZCOUNTRY": "ZCOUNTRY"
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
        "I_PAD": "I-PAD",
        "JALUR_LEB": "JALUR_LEB",
        "ISTIADAT": "ISTIADAT",
        "MAHKAMAH": "MAHKAMAH",
        "BEG_BIMBIT": "BEG_BIMBIT"
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
        "I_PAD": "I-PAD",
        "TELEFON_B": "TELEFON_B",
        "JALUR_LEB": "JALUR_LEB",
        "ISTIADAT": "ISTIADAT",
        "MAHKAMAH": "MAHKAMAH",
        "BEG_BIMBIT": "BEG_BIMBIT"
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
        "CLAIM_SUB_ID": "CLAIM_SUB_ID",
        "REQUESTID": "REQUEST_ID",
        "REQUEST_SUB_ID": "REQUEST_SUB_ID",
        "EST_AMOUNT": "EST_AMOUNT",
        "CLAIM_STATUS": "STATUS_ID",
        "CLAIM_TYPE_ID": "CLAIM_TYPE_ID",
        "CLAIM_TYPE_ITEM_ID": "CLAIM_TYPE_ITEM_ID",
        "EEID": "EEID",
        "EMP_ID": "EMP_ID",
        "ROLE_ID": "ROLE_ID",
        "BILL_DATE": "BILL_DATE",
        "RECEIPT_DATE": "RECEIPT_DATE",
        "JOB_GROUP": "JOB_GROUP",
        "MARITAL_STATUS": "MARITAL_STATUS",
        "EMPLOYEE_TYPE": "EMPLOYEE_TYPE",
        "MARRIAGE_CATEGORY": "MARRIAGE_CATEGORY",
        "PERSONAL_GRADE": "PERSONAL_GRADE",
        "START_DATE": "START_DATE",
        "END_DATE": "END_DATE",
        "MANAGED_CREATEDAT": "createdAt",
        "SUBMISSION_TYPE": "SUBMISSION_TYPE",
        "RELATIONSHIP": "RELATIONSHIP",
        "DEPENDENT_NO": "DEPENDENT_NO",
        "VEHICLE_TYPE_ID": "VEHICLE_TYPE_ID",
        "VEHICLE_TYPE_DESC": "VEHICLE_TYPE_DESC",
        "VEHICLE_TYPE_ID": "VEHICLE_TYPE_ID",
        "RATE_KM_ID": "RATE_KM_ID",
        "RATE": "RATE",
        "REGION_ID": "REGION_ID",
        "STATUS": "STATUS",
        "TRANSPORT_CLASS": "TRANSPORT_CLASS",
        "ID": "ID",
        "VALUE": "VALUE",
        "SUBSIDISED_RATE": "SUBSIDISED_RATE",
        "TOTAL_TRAVELLER": "TOTAL_TRAVELLER",
        "LODGING_CATEGORY": "LODGING_CATEGORY"
    },
    Wildcard: {
        "All": "*",
        "LIKE_PATTERN": "%",
        "DASH": "-",
        "ZERO": "0",
        "NA": "NA"
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
    ClaimTypeItemStatus: {
        ACTIVE: "ACTIVE"
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
    PeriodUnit: {
        "MONTH": "Month",
        "YEAR": "Year",
        "SERVICE": "Service"
    },
    ComparisonOperators:{
        "LesserEquals": "<=",
        "GreaterEquals": ">=",
        "Equals": "=",
        "NotEquals": "!="
    },
    WhereCondition: {
        "AND": "AND",
        "IN": "IN",
        "DESC": "DESC",
        "ASC": "ASC"
    },

    RelationshipType: {
        SPOUSE: "01",
        CHILD: "02",
        ADDITIONAL_SPOUSE: "07"
    },

    MeterCubeId: {
        EMPLOYEE: "01",
        SINGLE: "02",
        SPOUSE: "03",
        CHILD_GE_3: "04",
        CHILD_LT_3: "05",
        MARRIED: "06",
        ADDITIONAL_SPOUSE: "07"
    },

    MaritalStatus: {
        WIDOWED: "W",
        SINGLE: "S",
        MARRIED: "M",
        SEPARATED: "E",
        DIVORCED: "D"
    },

    Relationship: {
        SPOUSE : "01",
        CHILD: "02",
        FATHER: "03",
        MOTHER: "04",
        SIBLING: "05",
        RELATIVES: "06",
        ADDITIONAL_SPOUSE: "07"
    },
    
    MarriageCategory: {
        SINGLE : "01",
        MARRIED_NO_CHILDREN: "02",
        MARRIED_1_TO_3_CHILDREN: "03",
        MARRIED_4_OR_MORE_CHILDREN: "04"
    },
    
    UnlimitedAmount: -1,

    FareType: {
            "BUS": "01",
            "EHAILING": "02",
            "FERRY": "03",
            "FLIGHT": "04",
            "TRAIN": "05",
            "TAXI": "06"
        },
    
    ConfigStatus: {
        "ACTIVE": "ACTIVE"
    }, 
    Indicator: {
        Spouse_Child: "IND1"
    },
    PositionEventId: {
        TRANSFER_WITHIN_BRANCH: "ZA01", 
        TRANSFER_INTER_BRANCH: "ZA02",
        TRANSFER_WITHIN_DEPARTMENT: "ZA03",
        TRANSFER_INTER_DIVISION: "ZA04",
        TRANSFER_INTER_DEPARTMENT: "ZA05",
        TRANSFER_DEPARTMENT_TO_BRANCH: "ZA06",
        TRANSFER_BRANCH_TO_DEPARTMENT: "ZA07",
        PROMOTION_WITH_PROBATION: "Z801",
        PROMOTION_WITHOUT_PROBATION: "Z802"
    },
    ConstantId: {
        ELAUN_TUKAR_ELIGIBLE_AFTER_DAY_NUMBER: "ELAUN_TUKAR_ELIGIBLE_AFTER_DAY_NUMBER"
    },
    ElaunTukarStatus: {
        ALLOWED_CREATION: "01",
        ALLOWED_FAMILY_NOW_ONLY: "02",
        ON_GOING: "03",
        NOT_ALLOWED: "04"
    },
    TravelAloneOrWithFamily: {
        ALONE: "1",
        WITH_FAMILY: "2",
        ALONE_DESC: "Alone",
        WITH_FAMILY_DESC: "With Family"
    },
    TravelWithFamilyNowOrLater: {
        NOW: "1",
        LATER: "2",
        LATER_DESC: "Travel with Family on Later Date"
    }, 
    MarriageCategory: {
        SINGLE: "01",
        MARRIED_NO_CHILDREN: "02",
        MARRIED_1_TO_3_CHILDREN: "03",
        MARRIED_4_OR_MORE_CHILDREN: "04"
    }

};

module.exports = { Constant };