namespace ECLAIM;
using { managed } from '@sap/cds/common';

entity ZEMP_MASTER : managed {
    key EEID                    : String @mandatory;
        NAME                    : String;
        GRADE                   : String;
        CC                      : String;
        POS                     : String;
        DEP                     : String;
        B_PLACE                 : String;
        MARITAL                 : String;
        JOB_GROUP               : String;
        OFFICE_LOCATION         : String;
        ADDRESS_LINE1           : String;
        ADDRESS_LINE2           : String;
        ADDRESS_LINE3           : String;
        POSTCODE                : String;
        STATE                   : String;
        COUNTRY                 : String;
        CONTACT_NO              : String;
        EMAIL                   : String;
        DIRECT_SUPPERIOR        : String;
        ROLE                    : String;
        USER_TYPE               : String;
        MOBILE_BILL_ELIGIBILITY : String;
        EMPLOYEE_TYPE           : String;
        POSITION_NAME           : String;
        POSITION_START_DATE     : Date;
        POSITION_EVENT_REASON   : String;
        CONFIRMATION_DATE       : Date;
        EFFECTIVE_DATE          : Date;
        UPDATED_DATE            : Date;
        INSERTED_DATE           : Date;
        ZREQUEST_HEADER         : Association to one ZREQUEST_HEADER
                                      on ZREQUEST_HEADER.EMP_ID = EEID;
        ZCOST_CENTER            : Association to ZCOST_CENTER
                                      on ZCOST_CENTER.COST_CENTER_ID = CC;
        ZMARITAL_STAT           : Association to ZMARITAL_STAT
                                      on ZMARITAL_STAT.MARRIAGE_CATEGORY_ID = MARITAL;
        ZDEPARTMENT             : Association to ZDEPARTMENT
                                      on ZDEPARTMENT.DEPARTMENT_ID = DEP;
        ZJOB_GROUP              : Association to ZJOB_GROUP
                                      on ZJOB_GROUP.JOB_GROUP_ID = JOB_GROUP;
        ZROLE                   : Association to ZROLE
                                      on ZROLE.ROLE_ID = ROLE;
        ZUSER_TYPE              : Association to ZUSER_TYPE
                                      on ZUSER_TYPE.USER_TYPE_ID = USER_TYPE;
        ZCOUNTRY                : Association to ZCOUNTRY
                                      on ZCOUNTRY.COUNTRY_ID = COUNTRY;
        ZSTATE                  : Association to ZSTATE
                                    on  ZSTATE.COUNTRY_ID = COUNTRY
                                    and ZSTATE.STATE_ID = STATE;  
        ZEMP_TYPE               : Association to ZEMP_TYPE
                                    on  ZEMP_TYPE.EMP_TYPE_ID = EMPLOYEE_TYPE;   
}

entity ZREQUEST_HEADER : managed {
    key EMP_ID                  : String
        @mandatory;
    key REQUEST_ID              : String
        @mandatory;
        REQUEST_TYPE_ID         : String;
        REFERENCE_NUMBER        : String;
        OBJECTIVE_PURPOSE       : String;
        TRIP_START_DATE         : String;
        TRIP_END_DATE           : String;
        EVENT_START_DATE        : String;
        EVENT_END_DATE          : String;
        REMARK                  : String;
        REQUEST_GROUP_ID        : String;
        ALTERNATE_COST_CENTRE   : String;
        REQUEST_AMOUNT          : String;
        TOTAL_AMOUNT            : String;
        ATTACHMENT1             : String;
        ATTACHMENT2             : String;
        LOCATION                : String;
        TYPE_OF_TRANSPORTATION  : String;
        EVENT_FIELD1            : String;
        EVENT_FIELD2            : String;
        EVENT_FIELD3            : String;
        EVENT_FIELD4            : String;
        EVENT_FIELD5            : String;
        STATUS                  : String;
        COST_CENTER             : String;
        CASH_ADVANCE            : Decimal;
        CASH_ADVANCE_DATE       : Date;
        TRAVEL_ALONE_FAMILY     : String(1);
        TRAVEL_FAMILY_NOW_LATER : String(1);
        ZREQUEST_ITEM           : Composition of many ZREQUEST_ITEM
                                      on ZREQUEST_ITEM.REQUEST_ID = REQUEST_ID;
        ZREQUEST_TYPE           : Association to one ZREQUEST_TYPE
                                      on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZREQUEST_GRP            : Association to one ZREQUEST_GRP
                                      on ZREQUEST_GRP.REQUEST_GROUP_ID = REQUEST_GROUP_ID;
        ZSTATUS                 : Association to one ZSTATUS
                                      on ZSTATUS.STATUS_ID = STATUS;
        ZCOST_CENTER            : Association to one ZCOST_CENTER
                                      on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZEMP_MASTER             : Association to one ZEMP_MASTER
                                      on ZEMP_MASTER.EEID = EMP_ID;
}

entity ZREQUEST_ITEM : managed {
    key REQUEST_ID         : String
        @mandatory;
    key REQUEST_SUB_ID     : String
        @mandatory;
        CLAIM_TYPE_ITEM_ID : String;
        CLAIM_TYPE_ID      : String;
        EST_AMOUNT         : Decimal;
        EST_NO_PARTICIPANT : Integer;
        CASH_ADVANCE       : Boolean;
        START_DATE         : Date;
        END_DATE           : Date;
        REMARK             : String;
        SEND_TO_SF         : Boolean;
        LOCATION           : String;
        ZREQ_ITEM_PART     : Composition of many ZREQ_ITEM_PART
                                 on  ZREQ_ITEM_PART.REQUEST_ID     = REQUEST_ID
                                 and ZREQ_ITEM_PART.REQUEST_SUB_ID = REQUEST_SUB_ID;
        ZCLAIM_TYPE        : Association to one ZCLAIM_TYPE
                                 on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZCLAIM_TYPE_ITEM   : Association to one ZCLAIM_TYPE_ITEM
                                 on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;
}

entity ZREQ_ITEM_PART : managed {
    key REQUEST_ID       : String @mandatory;
    key REQUEST_SUB_ID   : String @mandatory;
    key PARTICIPANTS_ID  : String @mandatory;
        ALLOCATED_AMOUNT : Decimal;
        ZEMP_MASTER      : Association to one ZEMP_MASTER
                               on ZEMP_MASTER.EEID = PARTICIPANTS_ID;
}

entity ZREQUEST_TYPE : managed {
    key REQUEST_TYPE_ID   : String
        @mandatory
        @Common.Label: 'Request Type ID';
        REQUEST_TYPE_DESC : String
        @Common.Label: 'Request Type Description';
        END_DATE          : Date
        @Common.Label: 'End Date';
        START_DATE        : Date
        @Common.Label: 'Start Date';
        STATUS            : String
        @Common.Label: 'Status';
}

entity ZCLAIM_TYPE : managed {
    key CLAIM_TYPE_ID    : String  @mandatory  @Common.Label: 'Claim Type ID';
        CLAIM_TYPE_DESC  : String  @Common.Label: 'Claim Type Description';
        END_DATE          : Date    @Common.Label: 'End Date';
        START_DATE        : Date    @Common.Label: 'Start Date';
        STATUS            : String  @Common.Label: 'Status';        
        ZCLAIM_TYPE_ITEM : Composition of many ZCLAIM_TYPE_ITEM
                               on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
}

entity ZREQUEST_GRP : managed {
    key REQUEST_GROUP_ID   : String
        @mandatory
        @Common.Label: 'REQUEST_GROUP_ID';
        REQUEST_GROUP_DESC : String
        @Common.Label: 'REQUEST_GROUP_DESC';
        END_DATE           : Date
        @Common.Label: 'END_DATE';
        START_DATE         : Date
        @Common.Label: 'START_DATE';
        STATUS             : String
        @Common.Label: 'STATUS';
}

entity ZNUM_RANGE : managed {
    key RANGE_ID : String
        @mandatory
        @Common.Label: 'RANGE_ID';
        ![FROM]  : String
        @Common.Label: 'FROM';
        TO       : String
        @Common.Label: 'TO';
        CURRENT  : String
        @Common.Label: 'CURRENT';
}

entity ZCLAIM_HEADER : managed {
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
        ZSTAFF_CAT        : Association to one ZSTAFF_CAT
                                on ZSTAFF_CAT.STAFF_CATEGORY_ID = STAFF_CATEGORY;
        ZMARITAL_STAT     : Association to one ZMARITAL_STAT
                                on ZMARITAL_STAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZLOC_TYPE         : Association to one ZLOC_TYPE
                                on ZLOC_TYPE.LOC_TYPE_ID = LOCATION_TYPE;
}

entity ZCLAIM_PURPOSE : managed {
    key CLAIM_PURPOSE_ID   : String
        @mandatory
        @Common.Label: 'Claim Purpose ID';
        CLAIM_PURPOSE_DESC : String
        @Common.Label: 'Claim Purpose Description';
}

entity ZCLAIM_DISCLAIMER : managed {
    key CLAIM_DISCLAIMER_ID   : String
        @mandatory
        @Common.Label: 'Claim Disclaimer ID';
        CLAIM_DISCLAIMER_DESC : String
        @Common.Label: 'Claim Disclaimer Description';
}

entity ZLODGING_CAT : managed {
    key LODGING_CATEGORY_ID   : String
        @mandatory
        @Common.Label: 'Lodging Category ID';
        LODGING_CATEGORY_DESC : String
        @Common.Label: 'Lodging Category Description';
}

entity ZCOST_CENTER : managed {
    key COST_CENTER_ID   : String;
        COST_CENTER_DESC : String;
        START_DATE       : Date;
        END_DATE         : Date;
        STATUS           : String;
}

entity ZCLAIM_TYPE_INFO : managed {
    key CLAIM_TYPE_ID      : String;
    key CLAIM_TYPE_ITEM_ID : String;
        START_DATE         : Date;
        END_DATE           : Date;
        STATUS             : String;
        TYPE               : String;
        RISK_ID            : String;
        GL_ACCOUNT         : String;
        CATEGORY           : String;
        TAXABLE            : Boolean;
}

entity ZRISK : managed {
    key RISK_ID   : String
        @mandatory
        @Common.Label: 'Risk Id';
        RISK_DESC : String
        @Common.Label: 'Risk Description';
}

entity ZCLAIM_TYPE_ITEM : managed {
    key CLAIM_TYPE_ID        : String  @mandatory  @Common.Label: 'Claim Type ID';
    key CLAIM_TYPE_ITEM_ID   : String  @mandatory  @Common.Label: 'Claim Type Item Id';
        CLAIM_TYPE_ITEM_DESC : String  @Common.Label: 'Claim Type Item Description';
        END_DATE             : Date    @Common.Label: 'End Date';
        START_DATE           : Date    @Common.Label: 'Start Date';
        STATUS               : String  @Common.Label: 'Status';
        CATEGORY_ID          : String  @Common.Label: 'Category ID';
        COST_CENTER          : String  @Common.Label: 'Cost Center';
        ZCLAIM_CATEGORY      : Association to ZCLAIM_CATEGORY
                                on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CATEGORY_ID;
        ZCOST_CENTER         : Association to ZCOST_CENTER
                                on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
}

entity ZAPP_FIELD_CTRL : managed {
    key CLAIM_TYPE_ID      : String
        @mandatory
        @Common.Label: 'Claim Type Id';
    key CLAIM_TYPE_ITEM_ID : String
        @mandatory
        @Common.Label: 'Claim Type Item Id';
        FIELD01            : Boolean
        @Common.Label: 'Field01';
        FIELD02            : Boolean
        @Common.Label: 'Field02';
        FIELD03            : Boolean
        @Common.Label: 'Field03';
        FIELD04            : Boolean
        @Common.Label: 'Field04';
        FIELD05            : Boolean
        @Common.Label: 'Field05';
        FIELD06            : Boolean
        @Common.Label: 'Field06';
        FIELD07            : Boolean
        @Common.Label: 'Field07';
        FIELD08            : Boolean
        @Common.Label: 'Field08';
        FIELD09            : Boolean
        @Common.Label: 'Field09';
        FIELD10            : Boolean
        @Common.Label: 'Field10';
        FIELD11            : Boolean
        @Common.Label: 'Field11';
        FIELD12            : Boolean
        @Common.Label: 'Field12';
        FIELD13            : Boolean
        @Common.Label: 'Field13';
        FIELD14            : Boolean
        @Common.Label: 'Field14';
        FIELD15            : Boolean
        @Common.Label: 'Field15';
        FIELD16            : Boolean
        @Common.Label: 'Field16';
        FIELD17            : Boolean
        @Common.Label: 'Field17';
        FIELD18            : Boolean
        @Common.Label: 'Field18';
        FIELD19            : Boolean
        @Common.Label: 'Field19';
        FIELD20            : Boolean
        @Common.Label: 'Field20';
}

entity ZBUDGET : managed {
    key YEAR            : Date;
    key COMMITMENT_ITEM : String;
    key FUND_CENTER     : Integer;
    key MATERIAL_GROUP  : Integer;
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

entity ZARITH_OPT : managed {
    key OPERATOR_ID   : String
        @mandatory
        @Common.Label: 'Operator Id';
        OPERATOR_DESC : String
        @Common.Label: 'Operator Description';
}

entity ZAPPROVAL_RULES : managed {
    key ZSCENARIO    : String
        @mandatory
        @Common.Label: 'ZSCENARIO';
    key ZSEQNO       : String(1)
        @mandatory
        @Common.Label: 'ZSEQNO';
    key ZAPPR_LVL    : String(1)
        @mandatory
        @Common.Label: 'ZAPPR_LVL';
        ZAMT         : Decimal
        @Common.Label: 'ZAMT';
        ZAMT_OP      : String(2)
        @Common.Label: 'ZAMT_OP';
        ZDAYS        : Integer
        @Common.Label: 'ZDAYS';
        ZDAYS_OP     : String(2)
        @Common.Label: 'ZDAYS_OP';
        ZCOSTCTR     : String
        @Common.Label: 'ZCOSTCTR';
        ZCOSTCTR_OP  : String(2)
        @Common.Label: 'ZCOSTCTR_OP';
        ZRISK        : String
        @Common.Label: 'ZRISK';
        ZRISK_OP     : String
        @Common.Label: 'ZRISK_OP';
        ZAPPROVER_ID : String
        @Common.Label: 'ZAPPROVER_ID';
}

entity ZCLAIM_MAIN_CAT : managed {
    key CLAIM_MAIN_CAT_ID   : String
        @mandatory
        @Common.Label: 'CLAIM_MAIN_CAT_ID';
        CLAIM_MAIN_CAT_DESC : String
        @Common.Label: 'CLAIM_MAIN_CAT_DESC';
}

entity ZCLAIM_CATEGORY : managed {
    key CLAIM_CAT_ID        : String
        @mandatory
        @Common.Label: 'CLAIM_CAT_ID';
        CLAIM_CATEGORY_DESC : String
        @Common.Label: 'CLAIM_CATEGORY_DESC';
}

entity ZSTATUS : managed {
    key STATUS_ID   : String
        @mandatory
        @Common.Label: 'STATUS_ID';
        STATUS_DESC : String
        @Common.Label: 'STATUS_DESC';
}

entity ZROOM_TYPE : managed {
    key ROOM_TYPE_ID   : String
        @mandatory
        @Common.Label: 'Room Type ID';
        ROOM_TYPE_DESC : String
        @Common.Label: 'Room Type Description';
}

entity ZFLIGHT_CLASS : managed {
    key FLIGHT_CLASS_ID   : String
        @mandatory
        @Common.Label: 'Flight Class ID';
        FLIGHT_CLASS_DESC : String
        @Common.Label: 'Flight Class Description';
}

entity ZCOUNTRY : managed {
    key COUNTRY_ID   : String
        @mandatory
        @Common.Label: 'Country ID';
        COUNTRY_DESC : String
        @Common.Label: 'Country Description';
}

entity ZAREA : managed {
    key AREA_ID   : String(6)
        @mandatory
        @Common.Label: 'Area ID';
        AREA_DESC : String
        @Common.Label: 'Area Description';
}

entity ZLOC_TYPE : managed {
    key LOC_TYPE_ID   : String(6)
        @mandatory
        @Common.Label: 'LOC_TYPE_ID';
        LOC_TYPE_DESC : String
        @Common.Label: 'LOC_TYPE_DESC';
        STATE1        : String
        @Common.Label: 'STATE1';
        STATE2        : String
        @Common.Label: 'STATE2';
        FROM_LOCATION : String
        @Common.Label: 'FROM_LOCATION';
        TO_LOCATION   : String
        @Common.Label: 'TO_LOCATION';
}

entity ZCURRENCY : managed {
    key CURRENCY_ID   : String(3)
        @mandatory
        @Common.Label: 'Currency ID';
        CURRENCY_DESC : String
        @Common.Label: 'Currency Description';
}

entity ZSTAFF_CAT : managed {
    key STAFF_CATEGORY_ID   : String
        @mandatory
        @Common.Label: 'Staff Category ID';
        STAFF_CATEGORY_DESC : String
        @Common.Label: 'Staff Category Description';
}

entity ZMARITAL_STAT : managed {
    key MARRIAGE_CATEGORY_ID   : String
        @mandatory
        @Common.Label: 'Marriage Category ID';
        MARRIAGE_CATEGORY_DESC : String
        @Common.Label: 'Marriage Category Description';
}

entity ZVEHICLE_TYPE : managed {
    key VEHICLE_TYPE_ID   : String
        @mandatory
        @Common.Label: 'Vehicle Type ID';
        VEHICLE_TYPE_DESC : String
        @Common.Label: 'Vehicle Type Description';
}

entity ZRATE_KM : managed {
    key RATE_KM_ID  : String
        @mandatory
        @Common.Label: 'Rate KM ID';
        RATE_PER_KM : Decimal
        @Common.Label: 'Rate Per KM';
}

entity ZREGION : managed {
    key REGION_ID   : String  @mandatory  @Common.Label: 'Region ID';
        REGION_DESC : String  @Common.Label: 'Region Description';
        START_DATE  : String @Common.Label: 'Start Date';
        END_DATE    : String @Common.Label: 'End Date';
        STATUS      : String @Common.Label: 'Status';
}

entity ZTRANSFER_MODE : managed {
    key MODE_ID   : String
        @mandatory
        @Common.Label: 'Mode ID';
        MODE_DESC : String
        @Common.Label: 'Mode Description';
}

entity ZKWSP_BRANCH : managed {
    key BRANCH_ID   : String
        @mandatory
        @Common.Label: 'Branch ID';
        BRANCH_DESC : String
        @Common.Label: 'Branch Description';
}

entity ZSTATE : managed {
    key COUNTRY_ID : String
        @mandatory
        @Common.Label: 'Country ID';
        STATE_ID   : String
        @Common.Label: 'State ID';
        STATE_DESC : String
        @Common.Label: 'State Description';
}

entity ZKWSP_MILEAGE : managed {
    key FROM_STATE_ID  : String  @mandatory  @Common.Label: 'From State ID';
    key FROM_BRANCH_ID : String  @mandatory  @Common.Label: 'From Branch ID';
    key TO_STATE_ID    : String  @mandatory  @Common.Lable: 'To State ID';
    key TO_BRANCH_ID   : String  @mandatory  @Common.Label: 'To Branch ID';
        MILEAGE        : Integer @Common.Label: 'Mileage';
        MAX_MILEAGE    : Integer @Common.Label: ' Max Mileage';
}

entity ZJOB_GROUP : managed {
    key JOB_GROUP_ID   : String  @mandatory  @Common.Label: 'Job Group ID';
        JOB_GROUP_DESC : String  @Common.Label: 'Job Group ID';
        START_DATE     : Date    @Common.Label: 'Start Date';
        END_DATE       : Date    @Common.Label: 'End Date';
        STATUS         : String  @Common.Label: 'Status';
}

entity ZDEPARTMENT : managed {
    key DEPARTMENT_ID      : String  @mandatory  @Common.Label: 'Department ID';
        DEPARTMENT_DESC    : String  @Common.Label: 'Department Description';
        START_DATE         : Date    @Common.Label: 'Start Date';
        END_DATE           : Date    @Common.Label: 'End Date';
        STATUS             : String  @Common.Label: 'Status';
        HEAD_OF_DEPARTMENT : String  @Common.Label: 'Head of Department';
        SHORT_CODE         : String  @Common.Label: 'Short Code';
        COST_CENTER        : String  @Common.Label: 'Cost Center';
        DIVISION           : String  @Common.Label: 'Division';
}

entity ZROLE : managed {
    key ROLE_ID    : String  @mandatory  @Common.Label: 'Role ID';
        ROLE_DESC  : String  @Common.Label: 'Role Description';
        START_DATE : String  @Common.Label: 'Start Date';
        END_DATE   : String  @Common.Label: 'End Date';
        STATUS     : String  @Common.Label: 'Status';
}

entity ZUSER_TYPE: managed {
    key USER_TYPE_ID    : String @mandatory @Common.Label: 'User Type ID';
        USER_TYPE_DESC  : String @Common.Label: 'User Type Description';
        START_DATE      : String @Common.Label: 'Start Date';
        END_DATE        : String @Common.Label: 'End Date';
        STATUS          : String @Common.Label: 'Status';
}       

entity ZEMP_TYPE: managed {
    key EMP_TYPE_ID    : String @mandatory @Common.Label: 'Employee Type ID';
        EMP_TYPE_DESC  : String @Common.Label: 'Employee Type Description';
        START_DATE      : String @Common.Label: 'Start Date';
        END_DATE        : String @Common.Label: 'End Date';
        STATUS          : String @Common.Label: 'Status';
} 