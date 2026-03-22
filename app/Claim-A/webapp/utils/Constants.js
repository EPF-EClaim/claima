sap.ui.define([
], function () {
    "use strict";
    return {
        "ClaimType": {
            "KURSUS_DLM_NEGARA": "KURSUS_DLM_NEGARA",
            "KURSUS_LUAR_NEGARA": "KURSUS_LUAR_NEGARA",
            "DLM_NEGARA": "DLM_NEGARA",
            "LUAR_NEGARA": "LUAR_NEGARA",
            "PELBAGAI": "PELBAGAI",
            "ELAUN_TUKAR": "ELAUN_TUKAR",
            "ELAUN_PINDAH": "ELAUN_PINDAH"
        },
        "KURSUS_DLM_NEGARA_TypeItem": {
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
            "YURAN_KLJ": "YURAN_KLJ"
        },
        "STATUS": {
            "SUCCESS": "TRUE",
            "FAIL": "FAIL",
            "ALL": "*"
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
        "FLIGHT_CLASS_ID": {
            "01": "01",
            "02": "02",
            "03": "03"
        },
        "RequestStatus": {
            "DRAFT": "DRAFT",
            "PENDING_APPROVAL": "PENDING_APPROVAL",
            "SEND_BACK": "SEND_BACK",
            "REJECTED": "REJECTED",
            "APPROVED": "APPROVED",
            "CANCELLED": "CANCELLED"
        },
        "WorkflowType": {
            "CLAIM": "CLM",
            "PRE_APPROVAL": "PRE"
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
        "Entities": {
            "ZAPPROVER_DETAILS_PREAPPROVAL": "/ZAPPROVER_DETAILS_PREAPPROVAL",
            "ZAPPROVER_DETAILS_CLAIMS": "/ZAPPROVER_DETAILS_CLAIMS",
            "ZEMP_APPROVER_REQUEST_DETAILS": "/ZEMP_APPROVER_REQUEST_DETAILS",
            "ZEMP_APPROVER_CLAIM_DETAILS": "/ZEMP_APPROVER_CLAIM_DETAILS",
            "ZEMP_REQUEST_BUDGET_CHECK": "/ZEMP_REQUEST_BUDGET_CHECK",
            "ZEMP_CLAIM_BUDGET_CHECK": "/ZEMP_CLAIM_BUDGET_CHECK",
            "ZREQUEST_HEADER": "/ZREQUEST_HEADER",
            "ZCLAIM_HEADER": "/ZCLAIM_HEADER",
        },
        "EntitiesFields": {
            "APPROVER_ID": "APPROVER_ID",
            "SUBAPPROVER_ID": "SUBSTITUTE_APPROVER_ID",
            "STATUS": "STATUS",
            "TIMESTAMP": "PROCESS_TIMESTAMP",
            "REJECT_REASON_ID": "REJECT_REASON_ID",
            "CLAIM_STATUS": "STATUS_ID",
            "COMMENTAPPOVAL": "COMMENT",
            "PREAPPROVALID": "PREAPPROVAL_ID",
            "REQUESTID": "REQUEST_ID",
            "CLAIMID": "CLAIM_ID",
        },
        "Role": {
            "GA_ADMIN": "GA Admin",
            "JKEW_ADMIN": "JKEW Admin",
            "DTD_ADMIN": "DTD Admin",
            "APPROVER": "Approver",
            "SUPER_ADMIN": "Super Admin"
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
            "SUFFICIENT_BALANCE": "Record updated",
            "INSUFFICIENT_BALANCE": "Insufficient balance"
        },
        "GroupType": {
            "GROUP": "Group",
            "INDIVIDUAL": "Individual"
        }

    }
});