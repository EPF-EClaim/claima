namespace ECLAIM;

entity ZEMP_MASTER {
    key EEID            : String;
        NAME            : String;
        GRADE           : String;
        CC              : String;
        POS             : String;
        DEP             : String;
        JOB_CODE        : String;
        LOC             : String;
        MGR             : String;
        CXO             : String;
        TYPE_E          : String;
        TYPE_A          : String;
        TYPE_AD         : String;
        B_PLACE         : String;
        MARITAL         : String;
        CEO             : String;
        HOD             : String;
        HOS             : String;
        ZREQUEST_HEADER : Association to one ZREQUEST_HEADER
                              on ZREQUEST_HEADER.EMP_ID = EEID;
}

entity ZREQUEST_HEADER {
    key EMP_ID                 : String;
    key REQUEST_ID             : UUID;
        REQUEST_TYPE_ID        : UUID;
        REFERENCE_NUMBER       : String;
        OBJECTIVE_PURPOSE      : String;
        START_DATE             : String;
        END_DATE               : String;
        REMARK                 : String;
        CLAIM_TYPE_ID          : String;
        REQUEST_GROUP_ID       : UUID;
        ALTERNATE_COST_CENTRE  : String;
        AMOUNT                 : String;
        ATTACHMENT1            : String;
        ATTACHMENT2            : String;
        LOCATION               : String;
        TYPE_OF_TRANSPORTATION : String;
        ZCLAIM_TYPE            : Association to one ZCLAIM_TYPE
                                     on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZREQUEST_ITEM          : Association to one ZREQUEST_ITEM
                                     on ZREQUEST_ITEM.REQUEST_ID = REQUEST_ID;
        ZREQUEST_TYPE          : Association to one ZREQUEST_TYPE
                                     on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZREQUEST_GRP           : Association to one ZREQUEST_GRP
                                     on ZREQUEST_GRP.REQUEST_GROUP_ID = REQUEST_GROUP_ID;
        ZCLAIM_HEADER          : Association to one ZCLAIM_HEADER
                                     on ZCLAIM_HEADER.CLAIM_ID = CLAIM_TYPE_ID;
}

entity ZREQUEST_ITEM {
    key REQUEST_ID             : String;
    key REQUEST_SUB_ID         : String;
        CLAIM_TYPE_ITEM_ID     : String;
        EST_AMOUNT             : Decimal;
        EST_NO_PARTICIPANT     : Integer;
        CLAIM_TYPE_ID          : String;
        ZREQ_ITEM_PART         : Composition of many ZREQ_ITEM_PART
                                     on  ZREQ_ITEM_PART.REQUEST_ID         = REQUEST_ID
                                     and ZREQ_ITEM_PART.REQUEST_SUB_ID     = REQUEST_SUB_ID;
}

entity ZREQ_ITEM_PART {
    key REQUEST_ID           : String;
    key REQUEST_SUB_ID       : String;
    key PARTICIPANTS_ID      : String;
        ALLOCATED_AMOUNT     : Decimal;
}

entity ZREQUEST_TYPE {
    key REQUEST_TYPE_ID   : String;
        REQUEST_TYPE_DESC : String;
        END_DATE          : Date;
        START_DATE        : Date;
        STATUS            : String;
}

entity ZCLAIM_TYPE {
    key CLAIM_TYPE_ID   : String;
        CLAIM_TYPE_DESC : String;
}

entity ZREQUEST_GRP {
    key REQUEST_GROUP_ID   : String;
        REQUEST_GROUP_DESC : String;
        END_DATE           : Date;
        START_DATE         : Date;
        STATUS             : String;
}

entity ZNUM_RANGE {
    key RANGE_ID : String;
        ![FROM]  : String;
        TO       : String;
        CURRENT  : String;
}

entity ZCLAIM_HEADER {
    key CLAIM_ID              : String;
        CLAIM_MAIN_CAT_ID     : String;
        EMP_ID                : String;
        CLAIM_DATE            : Date;
        CATEGORY              : String;
        ALTERNATE_COST_CENTER : String;
        CLAIM_TYPE_ID         : String;
        TOTAL                 : Decimal;
        STATUS_ID             : String;
        DEPARTMENT            : String;
        EMP_NAME              : String;
        JOB_POSITION          : String;
        PERSONAL_GRADE        : String;
        POSITION_NO           : String;
        ZCLAIM_ITEM           : Composition of many ZCLAIM_ITEM
                                    on ZCLAIM_ITEM.CLAIM_ID = CLAIM_ID;
}

entity ZCLAIM_ITEM {
    key CLAIM_ID          : String;
    key CLAIM_ITEM_ID     : String;
        CLAIM_TYPE_ITEM   : String;
        AMOUNT            : Decimal;
        REMARK            : String;
        ATTACHMENT_FILE_1 : String;
        ATTACHMENT_FILE_2 : String;
        CLAIM_PURPOSE     : String;
        CLAIM_DISCLAIMER  : String;
        START_DATE        : Date;
        END_DATE          : Date;
        START_TIME        : Time;
        END_TIME          : Time;
        VEHICLE_TYPE      : String;
        KM                : Decimal;
        RATE_PER_KM       : Decimal;
        BILL_NO           : String;
        ACCOUNT_NO        : String;
        BILL_DATE         : Date;
        TOLL              : Decimal;
        PARKING           : Decimal;
        TRANSPORT_FARE    : Decimal;
        LODGING_CATEGORY  : String;
        LODGING_ADDRESS   : String;
        ROOM_TYPE         : String;
        FLIGHT_CLASS      : String;
        COUNTRY           : String;
        REGION            : String;
        AREA              : String;
        LOCATION          : String;
        FROM_LOCATION     : String;
        TO_LOCATION       : String;
        PHONE_NO          : String;
        NUM_OF_DAY        : String;
        MORE_THAN_4_WDAYS : String;
        FROM_ELC          : String;
        TO_ELC            : String;
        TOTAL_EXP_AMOUNT  : Decimal;
        COMPENSATION_PCT  : Decimal;
        CURRENCY          : String;
        CURRENCY_RATE     : Decimal;
        CURRENCY_AMOUNT   : Decimal;
        FAMILY_COUNT      : String;
        STAFF_CATEGORY    : String;
        MARRIAGE_CATEGORY : String;
        LOCATION_TYPE     : String;
        STATE1            : String;
        STATE2            : String;
        RECEIPT_DATE      : String;
        RECEIPT_NUMBER    : String;
        ZCLAIM_PURPOSE    : Association to one ZCLAIM_PURPOSE
                                on ZCLAIM_PURPOSE.CLAIM_PURPOSE_ID = CLAIM_PURPOSE;
        ZLODGING_CAT      : Association to one ZLODGING_CAT
                                on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY;
}

entity ZCLAIM_PURPOSE {
    key CLAIM_PURPOSE_ID   : String;
        CLAIM_PURPOSE_DESC : String;
}

entity ZCLAIM_DISCLAIMER {
    key CLAIM_DISCLAIMER_ID   : String;
        CLAIM_DISCLAIMER_DESC : String;
}

entity ZLODGING_CAT {
    key LODGING_CATEGORY_ID   : String;
        LODGING_CATEGORY_DESC : String;
}

entity Entity1 {
    key ID : UUID;
}

entity ZRISK{
    key RISK_ID : String;
        RISK_DESCRIPTION: String;
}
