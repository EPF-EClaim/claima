using { managed } from '@sap/cds/common';

namespace ECLAIM;

entity ZEMP_MASTER : managed {
    key EEID            : String @mandatory;   
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

entity ZREQUEST_HEADER : managed {
    key EMP_ID                 : String @mandatory;   
    key REQUEST_ID             : UUID @mandatory;     
        REQUEST_TYPE_ID        : UUID;
        REFERENCE_NUMBER       : String;
        OBJECTIVE_PURPOSE      : String;
        TRIP_START_DATE        : String;
        TRIP_END_DATE          : String;
        EVENT_START_DATE       : String;
        EVENT_END_DATE         : String;
        REMARK                 : String;
        //CLAIM_TYPE_ID          : String;
        REQUEST_GROUP_ID       : String;
        ALTERNATE_COST_CENTRE  : String;
        REQUEST_AMOUNT         : String;
        TOTAL_AMOUNT           : String;
        ATTACHMENT1            : String;
        ATTACHMENT2            : String;
        LOCATION               : String;
        TYPE_OF_TRANSPORTATION : String;
        EVENT_FIELD1           : String;
        EVENT_FIELD2           : String;
        EVENT_FIELD3           : String;
        EVENT_FIELD4           : String;
        EVENT_FIELD5           : String;
        STATUS                 : String;
        COST_CENTER            : String;
        CASH_ADVANCE           : Decimal;
        CASH_ADVANCE_DATE      : Date;
        TRAVEL_ALONE_FAMILY    : String(1);
        TRAVEL_FAMILY_NOW_LATER: String(1);
        /*ZCLAIM_TYPE            : Association to one ZCLAIM_TYPE
                                     on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;*/
        ZREQUEST_ITEM          : Composition of many ZREQUEST_ITEM  /*change to composition 6/2/2026*/
                                     on ZREQUEST_ITEM.REQUEST_ID = REQUEST_ID;
        ZREQUEST_TYPE          : Association to one ZREQUEST_TYPE
                                     on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZREQUEST_GRP           : Association to one ZREQUEST_GRP
                                     on ZREQUEST_GRP.REQUEST_GROUP_ID = REQUEST_GROUP_ID;
        /*ZCLAIM_HEADER          : Association to one ZCLAIM_HEADER
                                     on ZCLAIM_HEADER.CLAIM_ID = CLAIM_TYPE_ID;*/
        ZSTATUS                : Association to one ZSTATUS
                                     on ZSTATUS.STATUS_ID = STATUS;  
        ZCOST_CENTER           : Association to one ZCOST_CENTER
                                     on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZEMP_MASTER            : Association to one ZEMP_MASTER
                                    on ZEMP_MASTER.EEID = EMP_ID;
}

entity ZREQUEST_ITEM : managed {
    key REQUEST_ID             : String @mandatory;    
    key REQUEST_SUB_ID         : String @mandatory;    
        CLAIM_TYPE_ITEM_ID     : String;    
        CLAIM_TYPE_ID          : String;
        EST_AMOUNT             : Decimal;
        EST_NO_PARTICIPANT     : Integer;
        CASH_ADVANCE           : Boolean;
        START_DATE             : Date;
        END_DATE               : Date;
        REMARK                 : String;
        SEND_TO_SF             : Boolean;   
        LOCATION               : String;  
        //TYPE_OF_TRANSPORTATION : String;
        //ATTACHMENT             : String;
        ZREQ_ITEM_PART         : Composition of many ZREQ_ITEM_PART
                                     on  ZREQ_ITEM_PART.REQUEST_ID         = REQUEST_ID
                                     and ZREQ_ITEM_PART.REQUEST_SUB_ID     = REQUEST_SUB_ID;
        ZCLAIM_TYPE            : Association to one ZCLAIM_TYPE
                                     on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;   
        ZCLAIM_TYPE_ITEM       : Association to one ZCLAIM_TYPE_ITEM
                                     on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;                                      
}

entity ZREQ_ITEM_PART: managed  {
    key REQUEST_ID           : String @mandatory;  
    key REQUEST_SUB_ID       : String @mandatory;  
        PARTICIPANTS_ID      : String;      
        ALLOCATED_AMOUNT     : Decimal;
        ZEMP_MASTER          : Association to one ZEMP_MASTER
                                    on ZEMP_MASTER.EEID = PARTICIPANTS_ID;
}

entity ZREQUEST_TYPE : managed {
    key REQUEST_TYPE_ID   : String @mandatory; 
        REQUEST_TYPE_DESC : String;
        END_DATE          : Date;
        START_DATE        : Date;
        STATUS            : String;
}

entity ZCLAIM_TYPE: managed  {
    key CLAIM_TYPE_ID   : String @mandatory;   
        CLAIM_TYPE_DESC : String;
}

entity ZREQUEST_GRP: managed  {
    key REQUEST_GROUP_ID   : String @mandatory;    
        REQUEST_GROUP_DESC : String;
        END_DATE           : Date;
        START_DATE         : Date;
        STATUS             : String;
}

entity ZNUM_RANGE: managed  {
    key RANGE_ID : String @mandatory;  
        ![FROM]  : String;
        TO       : String;
        CURRENT  : String;
}

entity ZCLAIM_HEADER: managed  {
    key CLAIM_ID              : String @mandatory;     
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
        ZEMP_MASTER           : Association to one ZEMP_MASTER
                                    on ZEMP_MASTER.EEID = EMP_ID;  
        ZCLAIM_MAIN_CAT       : Association to one ZCLAIM_MAIN_CAT
                                    on ZCLAIM_MAIN_CAT.CLAIM_MAIN_CAT_ID = CLAIM_MAIN_CAT_ID;
        ZCLAIM_CATEGORY       : Association to one ZCLAIM_CATEGORY
                                    on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CATEGORY;
        ZCLAIM_TYPE           : Association to one ZCLAIM_TYPE
                                    on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZCOST_CENTER          : Association to one ZCOST_CENTER
                                    on ZCOST_CENTER.COST_CENTER_ID = ALTERNATE_COST_CENTER;
        ZSTATUS               : Association to one ZSTATUS
                                    on ZSTATUS.STATUS_ID = STATUS_ID;

}

entity ZCLAIM_ITEM : managed {
    key CLAIM_ID          : String @mandatory;     
    key CLAIM_ITEM_ID     : String @mandatory;     
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
        ZCLAIM_TYPE_ITEM  : Association to one ZCLAIM_TYPE_ITEM
                                on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM;
        ZCLAIM_DISCLAIMER : Association to one ZCLAIM_DISCLAIMER
                                on ZCLAIM_DISCLAIMER.CLAIM_DISCLAIMER_ID = CLAIM_DISCLAIMER;
        ZVEHICLE_TYPE     : Association to one ZVEHICLE_TYPE
                                on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE;
        ZROOM_TYPE        : Association to one ZROOM_TYPE
                                on ZROOM_TYPE.ROOM_TYPE_ID = ROOM_TYPE;
        ZFLIGHT_CLASS     : Association to one ZFLIGHT_CLASS
                                on ZFLIGHT_CLASS.FLIGHT_CLASS_ID = FLIGHT_CLASS;
        ZREGION           : Association to one ZREGION
                                on ZREGION.REGION_ID = REGION;
        ZAREA             : Association to one ZAREA
                                on ZAREA.AREA_ID = AREA;
        ZSTAFF_CAT        : Association to ZSTAFF_CAT
                                on ZSTAFF_CAT.STAFF_CATEGORY_ID = STAFF_CATEGORY;
        ZMARITAL_STAT     : Association to one ZMARITAL_STAT
                                on ZMARITAL_STAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZLOC_TYPE         : Association to one ZLOC_TYPE
                                on ZLOC_TYPE.LOC_TYPE_ID = LOCATION_TYPE;
}

entity ZCLAIM_PURPOSE: managed  {
    key CLAIM_PURPOSE_ID   : String @mandatory;
        CLAIM_PURPOSE_DESC : String;
}

entity ZCLAIM_DISCLAIMER: managed  {
    key CLAIM_DISCLAIMER_ID   : String @mandatory;
        CLAIM_DISCLAIMER_DESC : String;
}

entity ZLODGING_CAT: managed  {
    key LODGING_CATEGORY_ID   : String @mandatory;
        LODGING_CATEGORY_DESC : String;
}

entity ZCOST_CENTER: managed {
    key COST_CENTER_ID   : String @mandatory;
        COST_CENTER_DESC : String;
        START_DATE       : Date;
        END_DATE         : Date;
        STATUS           : String;
}

entity ZCLAIM_TYPE_INFO: managed {
    key CLAIM_TYPE_ID       : String @mandatory;
    key CLAIM_TYPE_ITEM_ID  : String @mandatory;
        START_DATE          : Date;
        END_DATE            : Date;
        STATUS              : String;   
        TYPE                : String;
        RISK_ID             : String;
        GL_ACCOUNT          : String;
        CATEGORY            : String;
        TAXABLE             : Boolean;
}

entity ZRISK: managed {
    key RISK_ID   : String @mandatory;
        RISK_DESC : String;
}

entity ZCLAIM_TYPE_ITEM: managed {
    key CLAIM_TYPE_ITEM_ID      : String @mandatory;
        CLAIM_TYPE_ITEM_DESC    : String;
}

entity ZAPP_FIELD_CTRL: managed {
    key CLAIM_TYPE_ID       : String @mandatory;
    key CLAIM_TYPE_ITEM_ID  : String @mandatory;
        FIELD01             : Boolean;
        FIELD02             : Boolean;
        FIELD03             : Boolean;
        FIELD04             : Boolean;
        FIELD05             : Boolean;
        FIELD06             : Boolean;
        FIELD07             : Boolean;
        FIELD08             : Boolean;
        FIELD09             : Boolean;
        FIELD10             : Boolean;
        FIELD11             : Boolean;
        FIELD12             : Boolean;
        FIELD13             : Boolean;
        FIELD14             : Boolean;
        FIELD15             : Boolean;
        FIELD16             : Boolean;
        FIELD17             : Boolean;
        FIELD18             : Boolean;
        FIELD19             : Boolean;
        FIELD20             : Boolean;
}

entity ZBUDGET: managed {
    key YEAR : Date @mandatory;
    key COMMITMENT_ITEM : String @mandatory;
    key FUND_CENTER     : Integer @mandatory;
    key MATERIAL_GROUP  : Integer @mandatory;
        ORIGINAL_BUDGET : Decimal;
        VIREMENT_IN     : Decimal;
        VIREMENT_OUT    : Decimal;
        SUPPLEMENT      : Decimal;
        RETURN          : Decimal;
        CURR_BUDGET     : Decimal;
        COMMITMENT      : Decimal;
        ACTUAL          : Decimal;
        CONSUMED        : Decimal;
        BUDGET_BALANCE  : Decimal;
        BUDGET_OWNER_ID : String;
}

entity ZARITH_OPT: managed {
    key OPERATOR_ID     : String @mandatory;
        OPERATOR_DESC   : String;
}

entity ZAPPROVAL_RULES: managed {
    key ZSCENARIO       : String @mandatory;
    key ZSEQNO          : String(1) @mandatory;
    key ZAPPR_LVL       : String(1) @mandatory;
        ZAMT            : Decimal;
        ZAMT_OP         : String(2);
        ZDAYS           : Integer;
        ZDAYS_OP        : String(2);
        ZCOSTCTR        : String;
        ZCOSTCTR_OP     : String(2);
        ZRISK           : String;
        ZRISK_OP        : String;
        ZAPPROVER_ID    : String;
} 

entity ZCLAIM_MAIN_CAT: managed {
    key CLAIM_MAIN_CAT_ID   : String @mandatory;
        CLAIM_MAIN_CAT_DESC : String;
}

entity ZCLAIM_CATEGORY: managed {
    key CLAIM_CAT_ID        : String @mandatory;
        CLAIM_CATEGORY_DESC : String;
}

entity ZSTATUS: managed {
    key STATUS_ID   : String @mandatory;
        STATUS_DESC : String;
}

entity ZROOM_TYPE: managed {
    key ROOM_TYPE_ID    : String @mandatory;
        ROOM_TYPE_DESC  : String;
}

entity ZFLIGHT_CLASS: managed {
    key FLIGHT_CLASS_ID     : String @mandatory;
        FLIGHT_CLASS_DESC   : String;
}

entity ZCOUNTRY: managed {
    key COUNTRY_ID      : String @mandatory;
        COUNTRY_DESC    : String
}

entity ZAREA: managed {
    key AREA_ID     : String(6) @mandatory;
        AREA_DESC   : String; 
}

entity ZLOC_TYPE: managed {
    key LOC_TYPE_ID     : String(6) @mandatory;
        LOC_TYPE_DESC   : String;
        STATE1          : String;
        STATE2          : String;
        FROM_LOCATION   : String;
        TO_LOCATION     : String;
}

entity ZCURRENCY: managed {
    key CURRENCY_ID     : String(3) @mandatory;
        CURRENCY_DESC   : String;
}

entity ZSTAFF_CAT: managed {
    key STAFF_CATEGORY_ID   : String @mandatory;
        STAFF_CATEGORY_DESC : String;
}

entity ZMARITAL_STAT: managed {
    key MARRIAGE_CATEGORY_ID    : String @mandatory;
        MARRIAGE_CATEGORY_DESC  : String
}

entity ZVEHICLE_TYPE: managed {
    key VEHICLE_TYPE_ID     : String @mandatory;
        VEHICLE_TYPE_DESC   : String;
}

entity ZRATE_KM: managed {
    key RATE_KM_ID  : String @mandatory;
        RATE_PER_KM : Decimal;
}

entity ZREGION: managed {
    key REGION_ID   : String @mandatory;
        REGION_DESC : String;
}

entity ZTRANSFER_MODE: managed {
    key MODE_ID     : String @mandatory;
        MODE_DESC   : String;
}

entity ZKWSP_BRANCH: managed {
    key BRANCH_ID   : String @mandatory;
        BRANCH_DESC : String;
}

entity ZSTATE: managed {
    key COUNTRY_ID  : String @mandatory;
        STATE_ID    : String;
        STATE_DESC  : String;
}

entity ZKWSP_MILEAGE: managed {
    key FROM_STATE_ID   : String @mandatory;
    key FROM_BRANCH_ID  : String @mandatory;
    key TO_STATE_ID     : String @mandatory;
    key TO_BRANCH_ID    : String @mandatory;
        MILEAGE         : Integer;
        MAX_MILEAGE     : Integer;
}










