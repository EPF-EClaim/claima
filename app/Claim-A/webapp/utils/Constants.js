sap.ui.define([
], function () {
    "use strict";
    return {
        "Approvers": {
            "AUTO": "AUTO",
            "AUTOASSIGN": "AA",
            "BUDGET": "Budget",
            "HEADOFSECTION": "HOS"
        },
        "BudgetCheckAction": {
            "APPROVE": "APPROVE",
            "REJECT": "REJECT",
            "SUBMIT": "SUBMIT"
        },
        "ClaimType": {
            "KURSUS_DLM_NEGARA": "KURSUS_DLM_NEGARA",
            "KURSUS_LUAR_NEGARA": "KURSUS_LUAR_NEGARA",
            "DLM_NEGARA": "DLM_NEGARA",
            "LUAR_NEGARA": "LUAR_NEGARA",
            "POST_EDUCATION_ASSISTANCE": "PEDU",
            "PELBAGAI": "PELBAGAI",
            "ELAUN_TUKAR": "ELAUN_TUKAR",
            "ELAUN_PINDAH": "ELAUN_PINDAH",
            "HANDPHONE": "HANDPHONE"
        },
        "ClaimTypeItem": {
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
            "POST_EDUCATION_ASSISTANCE": "PEDU",
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
            "TRAVEL_INSURANCE": "TRAVEL_INSURANCE",
            "VISA": "VISA",
            "YURAN": "YURAN",
            "YURAN_KLJ": "YURAN_KLJ",
            "CASH_REPAY": "CASH_REPAY",
            "GALAKAN" : "GALAKAN",
            "TELEFON_B" : "TELEFON_B"
        },
        "ClaimTypeItemStatus": {
            "ACTIVE": "ACTIVE",
        },
        "ClaimStatus": {
            "DRAFT": "STAT01",
            "PENDING_APPROVAL": "STAT02",
            "SEND_BACK": "STAT03",
            "REJECTED": "STAT04",
            "APPROVED": "STAT05",
            "COMPLETED_DISBURSEMENT": "STAT06",
            "CANCELLED": "STAT07",
        },
        "EligibilityRule": {
            "RATE_PER_KM": "RATE",
            "SUBSIDISED_RATE": "SUBSIDISED_RATE"
        },
        "Departments": {
            "FI_DEPT":"0500000000"
        },
        "RequestStatus": {
            "DRAFT": "DRAFT",
            "PENDING_APPROVAL": "PENDING APPROVAL",
            "SEND_BACK": "SEND BACK",
            "REJECTED": "REJECTED",
            "APPROVED": "APPROVED",
            "CANCELLED": "CANCELLED"
        },
        "WorkflowType": {
            "CLAIM": "CLM",
            "REQUEST": "REQ"
        },
        "Date": {
            "DATEFORMAT": "yyyy.MM.dd",
        },
        "ApprovalProcess": {
            "REQUEST": "REQ",
            "REQUESTTYPE": "Pre-Approval",
            "CLAIMTYPE": "Claim",
            "CLAIM_APPROVE": "APPROVE_CLAIM",
            "SET_GROUP": "approvalGroup",
        },
        "ApprovalProcessStatus": {
            "STATUS_REJECT": "REJECT",
            "STATUS_SENDBACK": "SEND BACK",
        },
        "ApprovalProcessAction": {
            "ACTION_NOTIFY": "Notify",
            "ACTION_APPROVE": "APPROVE",
            "RELEASE_IND": "release",
            "NOTAVAILABLE": "N/A",
        },
        "ApprovalProcessProjectCode": {
            "PROJ_CODE1": "1",
            "PROJ_CODE2": "2",
        },
        "Email_Action": {
            "NOTIFY": "Notify"
        },
        "Entities": {
            "ZAPPROVER_DETAILS_PREAPPROVAL": "/ZAPPROVER_DETAILS_PREAPPROVAL",
            "ZAPPROVER_DETAILS_CLAIMS": "/ZAPPROVER_DETAILS_CLAIMS",
            "ZBUDGET": "/ZBUDGET",
            "ZCONSTANTS": "/ZCONSTANTS",
            "ZCLAIM_HEADER": "/ZCLAIM_HEADER",
            "ZCLAIM_ITEM": "/ZCLAIM_ITEM",
            "ZCLAIM_TYPE_ITEM": "/ZCLAIM_TYPE_ITEM",
            "ZEMP_APPROVER_REQUEST_DETAILS": "/ZEMP_APPROVER_REQUEST_DETAILS",
            "ZEMP_APPROVER_CLAIM_DETAILS": "/ZEMP_APPROVER_CLAIM_DETAILS",
            "ZEMP_CLAIM_BUDGET_CHECK": "/ZEMP_CLAIM_BUDGET_CHECK",
            "ZEMP_CLAIM_DETAILS": "/ZEMP_CLAIM_DETAILS",
            "ZEMP_MASTER": "/ZEMP_MASTER",
            "ZEMP_REQUEST_BUDGET_CHECK": "/ZEMP_REQUEST_BUDGET_CHECK",
            "ZEMP_SUBSTITUTION_RULE": "/ZEMP_SUBSTITUTION_RULE",
            "ZRATE_KM": "/ZRATE_KM",
            "ZREQUEST_HEADER": "/ZREQUEST_HEADER",
            "ZREQUEST_ITEM": "/ZREQUEST_ITEM",
            "ZREQUEST_TYPE": "/ZREQUEST_TYPE",
            "ZROLEHIERARCHY": "/ZROLEHIERARCHY",
            "ZCLAIM_HEADER": "/ZCLAIM_HEADER",
            "ZSUBMISSION_TYPE": "/ZSUBMISSION_TYPE",
            "ZSUBSTITUTION_RULES": "/ZSUBSTITUTION_RULES",
            "ZWORKFLOW_RULE": "/ZWORKFLOW_RULE",
            "ZWORKFLOW_STEP": "/ZWORKFLOW_STEP",
            "ZREJECT_REASON": "/ZREJECT_REASON"
        },
        "EntitiesFields": {
            "APPROVER_ID": "APPROVER_ID",
            "CLAIMID": "CLAIM_ID",
            "CLAIM_STATUS": "STATUS_ID",
            "CLAIM_TYPE_ITEM_ID": "CLAIM_TYPE_ITEM_ID",
            "COMMENTAPPOVAL": "COMMENT",
            "DEP": "DEP",
            "EEID": "EEID",
            "EMAIL": "EMAIL",
            "FUND_CENTER": "FUND_CENTER",
            "ID": "ID",
            "LEVEL": "LEVEL",
            "PREAPPROVALID": "PREAPPROVAL_ID",
            "REJECT_REASON_ID": "REJECT_REASON_ID",
            "REASON_ID": "REASON_ID",
            "REQUESTID": "REQUEST_ID",
            "FLIGHT_CLASS_ID": "FLIGHT_CLASS_ID",
            "TRAVEL_HOURS": "TRAVEL_HOURS",
            "TRAVEL_DAYS_ID": "TRAVEL_DAYS_ID",
            "ELIGIBLE_AMOUNT": "ELIGIBLE_AMOUNT",
            "ROOM_TYPE_ID": "ROOM_TYPE_ID",
            "FARE_TYPE_ID": "FARE_TYPE_ID",
            "REQUEST_TYPE_ID": "REQUEST_TYPE_ID",
            "ROLE": "ROLE",
            "SUBAPPROVER_ID": "SUBSTITUTE_APPROVER_ID",
            "SUBMISSION_TYPE_ID": "SUBMISSION_TYPE_ID",
            "STATUS": "STATUS",
            "TIMESTAMP": "PROCESS_TIMESTAMP",
            "USER_ID": "USER_ID",
            "VALID_FROM": "VALID_FROM",
            "VALID_TO": "VALID_TO",
            "WORKFLOW_CODE": "WORKFLOW_CODE",
            "WORKFLOW_TYPE": "WORKFLOW_TYPE",
            "YEAR": "YEAR",
            "SUBMITTED_DATE": "SUBMITTED_DATE",
            "BILL_DATE": "BILL_DATE",
            "RECEIPT_DATE": "RECEIPT_DATE",
            "INSURANCE_PURCH_DATE": "INSURANCE_PURCH_DATE",
            "INSURANCE_CERT_START_DATE": "INSURANCE_CERT_START_DATE",
            "INSURANCE_CERT_END_DATE": "INSURANCE_CERT_END_DATE",
        },
        "Operators": {
            "EQUAL": "EQ",
            "GREATEREQUAL": "GE",
            "GREATERTHAN": "GT",
            "LESSEQUAL": "LE",
            "LESSTHAN": "LT",
            "NOTEQUAL": "NE"
        },
        "Risk_Category": {
            "LOW": "L",
            "HIGH": "H"
        },
        "Role": {
            "APPROVER": "Approver",
            "CEO": "CEO",
            "DTD_ADMIN": "DTD Admin",
            "GA_ADMIN": "GA Admin",
            "JKEW_ADMIN": "JKEW Admin",
            "SUPER_ADMIN": "Super Admin",
            "HEADOFDEP": "HOD"
        },
        "User_Type": {
            "CASH_FI": "CASH_FI",
            "CEO_FI": "CEO_FI",
            "FI_SETTLEMENT_A": "FI_SETTLEMENT_A",
            "FI_SETTLEMENT_B": "FI_SETTLEMENT_B",
            "HOD_JKEW": "HOD_JKEW"
        },
        "Configuration": {
            "ZEMP_MASTER": "ZEMP_MASTER",
            "ZEMP_MASTER_DTD": "ZEMP_MASTER_DTD",
            "ZEMP_DEPENDENT": "ZEMP_DEPENDENT",
            "ZEMP_DEPENDENT_DTD": "ZEMP_DEPENDENT_DTD",
            "ZNUM_RANGE": "ZNUM_RANGE",
            "ZNUM_RANGE_DTD": "ZNUM_RANGE_DTD",
            "ZBUDGET": "ZBUDGET"
        },
        "BudgetCheckStatus": {
            "NOT_FOUND": "RECORD NOT FOUND",
            "INSUFFICIENT": "INSUFFICIENT BALANCE",
            "SUFFICIENT": "OK",
            "UPDATED": "RECORD UPDATED"
        },
        "GroupType": {
            "GROUP": "Group",
            "INDIVIDUAL": "Individual"
        },
        "RequestFieldVisibilityConfig": {
            "SUBMISSION_TYPE": "PREAPPROVAL_R",
            "HEADER": "HEADER",
            "ITEM": "ITEM"
        },
        "ClaimFieldVisibilityConfig": {
            "SUBMISSION_TYPE": "CLAIM",
            "ITEM": "ITEM"
        },
        "SubmissionTypePrefix": {
            "REQUEST": "REQ",
            "CLAIM": "CLM"
        },
        "CashAdvanceInfo": {
            "COST_CENTER": "100000000",
            "GL_ACCOUNT": "214005"
        },
        "SubmissionType":{
            "DIRECT_CLAIM"  : "ST0001",
            "AUTO_APPROVE"  : "ST0002",
            "PRE_APPROVE"   : "ST0003",
            "CASH_REPAYMENT": "ST0004",
            "CURR_SUBSIDY"  : "ST0005"
        },
        "Default": {
            "PROJECT_CODE": "NA",
            "NULL": "null"
        },
        "BudgetCheckAction": {
            "SUBMIT": "SUBMIT",
            "REJECT": "REJECT",
            "APPROVE": "APPROVE"
        },
        "PARMode": {
            "VIEW": "view",
            "APPROVER": "approver",
            "EDIT": "i_edit",
            "LIST": "list",
            "CREATE": "create",
            "VIEWAPPR": "view_appr"
        },
        "RequestType": {
            "TRAVEL"        : "RT0001",
            "MOBILE"        : "RT0002",
            "EVENTS"        : "RT0003",
            "REIMBURSEMENT" : "RT0004",
            "MEDICAL"       : "RT0005",
            "PROJECT"       : "RT0006"
        },
        "LocationType" : {
            "OTHER" : "1",
            "KWSP"  : "2"
        },
        "InsuranceProvider" : {
            "OTHERS" : "4",
        },
        "Status" : {
            "ACTIVE" : "ACTIVE"
        },
        "Claim_Action" : {
            "DRAFT" : "Save Draft",
            "DELETE" : "Delete Report",
            "SUBMIT" : "Submit Report",
            "BACK" : "Back",
            "REJECT" : "Reject",
            "PUSHBACK" : "Push Back",
            "APPROVE" : "Approve"

        },
        "ConfigAccess": 
             [
                "ZRISK", "ZREQUEST_TYPE", "ZCLAIM_TYPE", "ZNUM_RANGE", "ZCLAIM_CATEGORY",
                "ZSTATUS", "ZLODGING_CAT", "ZROOM_TYPE", "ZCOUNTRY", "ZAREA",
                "ZMARITAL_STAT", "ZVEHICLE_TYPE", "ZJOB_GROUP", "ZSTATE", "ZDEPARTMENT",
                "ZROLE", "ZUSER_TYPE", "ZEMP_TYPE", "ZFLIGHT_CLASS", "ZEMP_MASTER",
                "ZREGION", "ZSUBMISSION_TYPE", "ZLENDER_NAME", "ZHOUSING_LOAN_SCHEME",
                "ZPERDIEM_ENT", "ZEMP_CA_PAYMENT", "ZBRANCH", "ZPROJECT_HDR", "ZMARITAL_CAT",
                "ZEMP_RELATIONSHIP", "ZINDIV_GROUP", "ZMATERIAL_GROUP", "ZLOC_TYPE",
                "ZOFFICE_DISTANCE", "ZOFFICE_LOCATION", "ZRATE_KM", "ZEMP_DEPENDENT",
                "ZREJECT_REASON", "ZCURRENCY", "ZVEHICLE_OWNERSHIP", "ZTRAVEL_DAYS",
                "ZMETER_CUBE", "ZFARE_TYPE", "ZHOTEL_LODGING", "ZCLAIM_BASIS",
                "ZEMP_DEPENDENT_TYPE", "ZPOSITION_EVENT_REASON", "ZSPORTS_REPRESENTATION",
                "ZFAMILY_TIMING", "ZTRAVEL_TYPE", "ZTRANSPORT_PASSING", "ZTRANSFER_MODE",
                "ZSTUDY_LEVELS", "ZPROFESIONAL_BODY", "ZINSURANCE_PACKAGE", "ZINSURANCE_PROVIDER",
                "ZVEHICLE_CLASS", "ZMOBILE_CATEGORY_PURPOSE", "ZBUDGET", "ZDB_STRUCTURE",
                "ZDISBURSEMENT_STATUS", "ZCONSTANTS", "ZROLEHIERARCHY", "ZELIGIBILITY_RULE",
                "ZWORKFLOW_STEP", "ZWORKFLOW_RULE"
            ]
    }
});