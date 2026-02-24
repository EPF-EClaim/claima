namespace ECLAIM;

using {managed} from '@sap/cds/common';

entity ZEMP_MASTER : managed {
    key EEID                          : String @mandatory;
        NAME                          : String;
        GRADE                         : String;
        CC                            : String;
        POS                           : String;
        DEP                           : String;
        UNIT_SECTION                  : String;
        B_PLACE                       : String;
        MARITAL                       : String;
        JOB_GROUP                     : String;
        OFFICE_LOCATION               : String;
        ADDRESS_LINE1                 : String;
        ADDRESS_LINE2                 : String;
        ADDRESS_LINE3                 : String;
        POSTCODE                      : String;
        STATE                         : String;
        COUNTRY                       : String;
        CONTACT_NO                    : String;
        EMAIL                         : String;
        DIRECT_SUPPERIOR              : String;
        ROLE                          : String;
        USER_TYPE                     : String;
        MEDICAL_INSURANCE_ENTITLEMENT : Decimal(7, 2);
        MOBILE_BILL_ELIGIBILITY       : String;
        MOBILE_BILL_ELIG_AMOUNT       : Decimal(7, 2);
        EMPLOYEE_TYPE                 : String;
        POSITION_NAME                 : String;
        POSITION_START_DATE           : Date;
        POSITION_EVENT_REASON         : String;
        CONFIRMATION_DATE             : Date;
        EFFECTIVE_DATE                : Date;
        UPDATED_DATE                  : Date;
        INSERTED_DATE                 : Date;
        ZREQUEST_HEADER               : Association to one ZREQUEST_HEADER
                                            on ZREQUEST_HEADER.EMP_ID = EEID;
        ZCOST_CENTER                  : Association to ZCOST_CENTER
                                            on ZCOST_CENTER.COST_CENTER_ID = CC;
        ZMARITAL_STAT                 : Association to ZMARITAL_STAT
                                            on ZMARITAL_STAT.MARRIAGE_CATEGORY_ID = MARITAL;
        ZDEPARTMENT                   : Association to ZDEPARTMENT
                                            on ZDEPARTMENT.DEPARTMENT_ID = DEP;
        ZJOB_GROUP                    : Association to ZJOB_GROUP
                                            on ZJOB_GROUP.JOB_GROUP_ID = JOB_GROUP;
        ZROLE                         : Association to ZROLE
                                            on ZROLE.ROLE_ID = ROLE;
        ZUSER_TYPE                    : Association to ZUSER_TYPE
                                            on ZUSER_TYPE.USER_TYPE_ID = USER_TYPE;
        ZCOUNTRY                      : Association to ZCOUNTRY
                                            on ZCOUNTRY.COUNTRY_ID = COUNTRY;
        ZSTATE                        : Association to ZSTATE
                                            on  ZSTATE.COUNTRY_ID = COUNTRY
                                            and ZSTATE.STATE_ID   = STATE;
        ZEMP_TYPE                     : Association to ZEMP_TYPE
                                            on ZEMP_TYPE.EMP_TYPE_ID = EMPLOYEE_TYPE;
        ZOFFICE_LOCATION              : Association to ZOFFICE_LOCATION
                                            on  ZOFFICE_LOCATION.LOCATION_ID = OFFICE_LOCATION
                                            and ZOFFICE_LOCATION.STATE_ID = STATE;
        ZBRANCH                       : Association to ZBRANCH
                                            on ZBRANCH.BRANCH_ID = UNIT_SECTION;
}

entity ZREQUEST_HEADER : managed {
    key REQUEST_ID              : String @mandatory;
        EMP_ID                  : String;
        REQUEST_TYPE_ID         : String;
        CLAIM_TYPE_ID           : String;
        OBJECTIVE_PURPOSE       : String;
        TRIP_START_DATE         : Date;
        TRIP_END_DATE           : Date;
        EVENT_START_DATE        : Date;
        EVENT_END_DATE          : Date;
        APPROVED_DATE           : Date;
        REQUEST_DATE            : Date;
        IND_OR_GROUP            : String;
        REMARK                  : String;
        ALTERNATE_COST_CENTER   : String;
        PREAPPROVAL_AMOUNT      : Decimal(16, 2);
        TOTAL_AMOUNT            : Decimal(16, 2);
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
        CASH_ADVANCE            : Decimal(16, 2);
        CASH_ADVANCE_DATE       : Date;
        LAST_APPROVED_DATE      : Date;
        LAST_APPROVED_TIME      : Time;
        TRAVEL_ALONE_FAMILY     : String(1);
        TRAVEL_FAMILY_NOW_LATER : String(1);
        LAST_SEND_BACK_DATE     : Date;
        REJECT_REASON_ID        : String;
        SEND_BACK_REASON_ID     : String;
        APPROVER1               : String(6);
        APPROVER2               : String(6);
        APPROVER3               : String(6);
        APPROVER4               : String(6);
        APPROVER5               : String(6);
        LAST_MODIFIED_DATE      : Date;
        SUBMITTED_DATE          : Date;
        ZREQUEST_ITEM           : Composition of many ZREQUEST_ITEM
                                      on ZREQUEST_ITEM.REQUEST_ID = REQUEST_ID;
        ZREQUEST_TYPE           : Association to one ZREQUEST_TYPE
                                      on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZSTATUS                 : Association to one ZSTATUS
                                      on ZSTATUS.STATUS_ID = STATUS;
        ZCOST_CENTER            : Association to one ZCOST_CENTER
                                      on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZEMP_MASTER             : Association to one ZEMP_MASTER
                                      on ZEMP_MASTER.EEID = EMP_ID;
        ZINDIV_GROUP            : Association to ZINDIV_GROUP
                                      on ZINDIV_GROUP.IND_OR_GROUP_ID = IND_OR_GROUP;
        COSTCENTER              : Association to ZCOST_CENTER
                                      on COSTCENTER.COST_CENTER_ID = ALTERNATE_COST_CENTER;
        ZCLAIM_HEADER           : Association to ZCLAIM_HEADER
                                      on ZCLAIM_HEADER.REQUEST_ID = REQUEST_ID;
        ZREJECT_REASON          : Association to ZREJECT_REASON
                                      on ZREJECT_REASON.REASON_ID = REJECT_REASON_ID;
        ZSENDBACK_REASON        : Association to ZREJECT_REASON
                                      on ZSENDBACK_REASON.REASON_ID = SEND_BACK_REASON_ID;
        ZCLAIM_TYPE             : Association to one ZCLAIM_TYPE
                                      on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
}

entity ZREQUEST_ITEM : managed {
    key REQUEST_ID                 : String @mandatory;
    key REQUEST_SUB_ID             : String @mandatory;
        CLAIM_TYPE_ITEM_ID         : String;
        CLAIM_TYPE_ID              : String;
        EST_AMOUNT                 : Decimal(16, 2);
        EST_NO_PARTICIPANT         : Integer;
        CASH_ADVANCE               : Boolean;
        START_DATE                 : Date;
        END_DATE                   : Date;
        REMARK                     : String;
        SEND_TO_SF                 : Boolean;
        LOCATION                   : String;
        DECLARE_CLUB_MEMBERSHIP    : Boolean;
        KWSP_SPORTS_REPRESENTATION : String;
        SPORTS_CLAIM_DISCLAIMER    : Boolean;
        VEHICLE_OWNERSHIP_ID       : String;
        MODE_OF_TRANSFER           : String;
        TRANSFER_DATE              : Date;
        NO_OF_DAYS                 : Integer;
        MARRIAGE_CATEGORY          : String;
        FAMILY_COUNT               : Integer;
        COST_CENTER                : String;
        GL_ACCOUNT                 : String;
        MATERIAL_CODE              : String;
        ZMARITAL_CAT               : Association to one ZMARITAL_CAT
                                         on ZMARITAL_CAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZVEHICLE_OWNERSHIP         : Association to one ZVEHICLE_OWNERSHIP
                                         on ZVEHICLE_OWNERSHIP.VEHICLE_OWNERSHIP_ID = VEHICLE_OWNERSHIP_ID;
        ZREQ_ITEM_PART             : Composition of many ZREQ_ITEM_PART
                                         on  ZREQ_ITEM_PART.REQUEST_ID     = REQUEST_ID
                                         and ZREQ_ITEM_PART.REQUEST_SUB_ID = REQUEST_SUB_ID;
        ZCLAIM_TYPE                : Association to one ZCLAIM_TYPE
                                         on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZCLAIM_TYPE_ITEM           : Association to one ZCLAIM_TYPE_ITEM
                                         on  ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID
                                         and ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID      = CLAIM_TYPE_ID
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
        CLAIM_TYPE_DESC  : String  @Common.Label    : 'Claim Type Description';
        GL_ACCOUNT       : String  @Common.Label    : 'GL Account';
        CATEGORY_ID      : String  @Common.Label    : 'Category ID';
        END_DATE         : Date    @Common.Label    : 'End Date';
        START_DATE       : Date    @Common.Label    : 'Start Date';
        STATUS           : String  @Common.Label    : 'Status';
        ZCLAIM_TYPE_ITEM : Composition of many ZCLAIM_TYPE_ITEM
                               on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID = CLAIM_TYPE_ID
                                   @assert.integrity: false;
        ZCLAIM_CATEGORY  : Association to ZCLAIM_CATEGORY
                               on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CATEGORY_ID;
}

entity ZNUM_RANGE : managed {
    key RANGE_ID   : String  @mandatory  @Common.Label: 'RANGE_ID';
        RANGE_DESC : String  @Common.Label: 'RANGE_DESC';
        ![FROM]    : String  @Common.Label: 'FROM';
        TO         : String  @Common.Label: 'TO';
        CURRENT    : String  @Common.Label: 'CURRENT';
}

entity ZCLAIM_HEADER : managed {
    key CLAIM_ID                       : String @mandatory;
        EMP_ID                         : String;
        PURPOSE                        : String;
        TRIP_START_DATE                : Date;
        TRIP_END_DATE                  : Date;
        EVENT_START_DATE               : Date;
        EVENT_END_DATE                 : Date;
        SUBMISSION_TYPE                : String;
        COMMENT                        : String;
        ALTERNATE_COST_CENTER          : String;
        COST_CENTER                    : String;
        REQUEST_ID                     : String;
        ATTACHMENT_EMAIL_APPROVER      : String;
        STATUS_ID                      : String;
        CLAIM_TYPE_ID                  : String;
        TOTAL_CLAIM_AMOUNT             : Decimal(16, 2);
        PREAPPROVED_AMOUNT             : Decimal(16, 2);
        CASH_ADVANCE_AMOUNT            : Decimal(16, 2);
        FINAL_AMOUNT_TO_RECEIVE        : Decimal(16, 2);
        LAST_MODIFIED_DATE             : Date;
        SUBMITTED_DATE                 : Date;
        LAST_APPROVED_DATE             : Date;
        LAST_APPROVED_TIME             : Time;
        LAST_SEND_BACK_DATE            : Date;
        REJECT_REASON_ID               : String;
        SEND_BACK_REASON_ID            : String;
        PAYMENT_DATE                   : Date;
        LOCATION                       : String;
        SPOUSE_OFFICE_ADDRESS          : String;
        HOUSE_COMPLETION_DATE          : Date;
        MOVE_IN_DATE                   : Date;
        HOUSING_LOAN_SCHEME            : String;
        LENDER_NAME                    : String;
        SPECIFY_DETAILS                : String;
        NEW_HOUSE_ADDRESS              : String;
        DIST_OLD_HOUSE_TO_OFFICE_KM    : Decimal;
        DIST_OLD_HOUSE_TO_NEW_HOUSE_KM : Decimal;
        PROJECT_CODE                   : String;
        COURSE_CODE                    : String;
        APPROVER1                      : String(6);
        APPROVER2                      : String(6);
        APPROVER3                      : String(6);
        APPROVER4                      : String(6);
        APPROVER5                      : String(6);
        ZCLAIM_ITEM                    : Composition of many ZCLAIM_ITEM
                                             on ZCLAIM_ITEM.CLAIM_ID = CLAIM_ID;
        ZEMP_MASTER                    : Association to one ZEMP_MASTER
                                             on ZEMP_MASTER.EEID = EMP_ID;
        ZCLAIM_TYPE                    : Association to one ZCLAIM_TYPE
                                             on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZCOST_CENTER                   : Association to one ZCOST_CENTER
                                             on ZCOST_CENTER.COST_CENTER_ID = ALTERNATE_COST_CENTER;
        ZSTATUS                        : Association to one ZSTATUS
                                             on ZSTATUS.STATUS_ID = STATUS_ID;
        ZSUBMISSION_TYPE               : Association to ZSUBMISSION_TYPE
                                             on ZSUBMISSION_TYPE.SUBMISSION_TYPE_ID = SUBMISSION_TYPE;
        ZREQUEST_HEADER                : Association to ZREQUEST_HEADER
                                             on ZREQUEST_HEADER.REQUEST_ID = REQUEST_ID;
        COSTCENTER                     : Association to ZCOST_CENTER
                                             on COSTCENTER.COST_CENTER_ID = COST_CENTER;
        ZLENDER_NAME                   : Association to ZLENDER_NAME
                                             on ZLENDER_NAME.LENDER_ID = LENDER_NAME;
        ZPROJECT_HDR                   : Association to ZPROJECT_HDR
                                             on ZPROJECT_HDR.PROJECT_CODE_IO = PROJECT_CODE;
        ZTRAIN_COURSE_PART             : Association to ZTRAIN_COURSE_PART
                                             on  ZTRAIN_COURSE_PART.PARTICIPANT_ID = EMP_ID
                                             and ZTRAIN_COURSE_PART.COURSE_ID      = COURSE_CODE
                                             and ZTRAIN_COURSE_PART.CLAIM_ID       = CLAIM_ID;
        ZREJECT_REASON                 : Association to ZREJECT_REASON
                                             on ZREJECT_REASON.REASON_ID = REJECT_REASON_ID;
        ZSENDBACK_REASON               : Association to ZREJECT_REASON
                                             on ZSENDBACK_REASON.REASON_ID = SEND_BACK_REASON_ID;
}

entity ZCLAIM_ITEM : managed {
    key CLAIM_ID                  : String @mandatory;
    key CLAIM_SUB_ID              : String @mandatory;
        CLAIM_TYPE_ITEM_ID        : String;
        PERCENTAGE_COMPENSATION   : Decimal(5, 2);
        ACCOUNT_NO                : String;
        AMOUNT                    : Decimal(16, 2);
        ATTACHMENT_FILE_1         : String;
        ATTACHMENT_FILE_2         : String;
        BILL_NO                   : String;
        BILL_DATE                 : Date;
        CLAIM_CATEGORY            : String;
        COUNTRY                   : String;
        DISCLAIMER                : Boolean;
        START_DATE                : Date;
        END_DATE                  : Date;
        START_TIME                : Time;
        END_TIME                  : Time;
        FLIGHT_CLASS              : String;
        FROM_LOCATION             : String; //free text
        FROM_LOCATION_OFFICE      : String; //office distance
        KM                        : Decimal(6, 2);
        LOCATION                  : String;
        LOCATION_TYPE             : String;
        ROUND_TRIP                : Boolean;
        LODGING_CATEGORY          : String;
        LODGING_ADDRESS           : String;
        MARRIAGE_CATEGORY         : String;
        AREA                      : String;
        NO_OF_FAMILY_MEMBER       : Integer;
        PARKING                   : Decimal;
        PHONE_NO                  : String;
        RATE_PER_KM               : String(2);
        RECEIPT_DATE              : Date;
        RECEIPT_NUMBER            : String;
        REMARK                    : String;
        ROOM_TYPE                 : String;
        REGION                    : String;
        FROM_STATE_ID             : String; //office distance
        TO_STATE_ID               : String; //office distance
        TO_LOCATION               : String; //free text
        TO_LOCATION_OFFICE        : String; //office distance
        TOLL                      : Decimal(16, 2);
        TOTAL_EXP_AMOUNT          : Decimal(16, 2);
        VEHICLE_TYPE              : String;
        VEHICLE_FARE              : Boolean;
        TRIP_START_DATE           : Date;
        TRIP_START_TIME           : Time;
        TRIP_END_DATE             : Date;
        TRIP_END_TIME             : Time;
        EVENT_START_DATE          : Date;
        EVENT_END_DATE            : Date;
        TRAVEL_DURATION_DAY       : Decimal(3, 1);
        TRAVEL_DURATION_HOUR      : Decimal(4, 1);
        PROVIDED_BREAKFAST        : String;
        PROVIDED_LUNCH            : String;
        PROVIDED_DINNER           : String;
        ENTITLED_BREAKFAST        : String;
        ENTITLED_LUNCH            : String;
        ENTITLED_DINNER           : String;
        ANGGOTA_ID                : String;
        ANGGOTA_NAME              : String;
        DEPENDENT_NAME            : String;
        TYPE_OF_PROFESSIONAL_BODY : String;
        DISCLAIMER_GALAKAN        : String;
        VEHICLE_OWNERSHIP_ID      : String;
        MODE_OF_TRANSFER          : String;
        TRANSFER_DATE             : Date;
        NO_OF_DAYS                : Integer;
        FAMILY_COUNT              : Integer;
        FUNERAL_TRANSPORTATION    : String;
        COST_CENTER               : String;
        GL_ACCOUNT                : String;
        MATERIAL_CODE             : String;
        ZCLAIM_CATEGORY           : Association to ZCLAIM_CATEGORY
                                        on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CLAIM_CATEGORY;
        ZLODGING_CAT              : Association to ZLODGING_CAT
                                        on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY;
        ZCLAIM_TYPE_ITEM          : Association to one ZCLAIM_TYPE_ITEM
                                        on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;
        ZVEHICLE_TYPE             : Association to one ZVEHICLE_TYPE
                                        on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE;
        ZROOM_TYPE                : Association to one ZROOM_TYPE
                                        on ZROOM_TYPE.ROOM_TYPE_ID = ROOM_TYPE;
        ZFLIGHT_CLASS             : Association to one ZFLIGHT_CLASS
                                        on ZFLIGHT_CLASS.FLIGHT_CLASS_ID = FLIGHT_CLASS;
        ZREGION                   : Association to one ZREGION
                                        on ZREGION.REGION_ID = REGION;
        ZAREA                     : Association to one ZAREA
                                        on ZAREA.AREA_ID = AREA;
        ZMARITAL_CAT              : Association to one ZMARITAL_CAT
                                        on ZMARITAL_CAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZLOC_TYPE                 : Association to one ZLOC_TYPE
                                        on ZLOC_TYPE.LOC_TYPE_ID = LOCATION_TYPE;
        ZRATE_KM                  : Association to ZRATE_KM
                                        on ZRATE_KM.RATE_KM_ID = RATE_PER_KM;
        ZCOUNTRY                  : Association to ZCOUNTRY
                                        on ZCOUNTRY.COUNTRY_ID = COUNTRY;
        ZOFFICE_DISTANCE          : Association to ZOFFICE_DISTANCE
                                        on  ZOFFICE_DISTANCE.FROM_LOCATION_ID = FROM_LOCATION_OFFICE
                                        and ZOFFICE_DISTANCE.FROM_STATE_ID    = FROM_STATE_ID;
        ZOFFICE_DISTANCE1         : Association to ZOFFICE_DISTANCE
                                        on  ZOFFICE_DISTANCE1.TO_LOCATION_ID = TO_LOCATION_OFFICE
                                        and ZOFFICE_DISTANCE1.TO_STATE_ID    = TO_STATE_ID;
        ZGL_ACCOUNT               : Association to ZGL_ACCOUNT
                                        on ZGL_ACCOUNT.GL_ACCOUNT_ID = ACCOUNT_NO;
        ZCOSTCENTER               : Association to ZCOST_CENTER
                                        on ZCOSTCENTER.COST_CENTER_ID = COST_CENTER;
        ZSTATE                    : Association to ZSTATE
                                        on  ZSTATE.COUNTRY_ID = COUNTRY
                                        and ZSTATE.STATE_ID   = FROM_STATE_ID;
        ZTOSTATE                  : Association to ZSTATE
                                        on  ZTOSTATE.COUNTRY_ID = COUNTRY
                                        and ZTOSTATE.STATE_ID   = TO_STATE_ID;
        ZVEHICLE_OWNERSHIP        : Association to one ZVEHICLE_OWNERSHIP
                                        on ZVEHICLE_OWNERSHIP.VEHICLE_OWNERSHIP_ID = VEHICLE_OWNERSHIP_ID;
}

entity ZLODGING_CAT : managed {
    key LODGING_CATEGORY_ID   : String  @mandatory  @Common.Label: 'Lodging Category ID';
        LODGING_CATEGORY_DESC : String  @Common.Label: 'Lodging Category Description';
        START_DATE            : Date    @Common.Label: 'Start Date';
        END_DATE              : Date    @Common.Label: 'End Date';
        STATUS                : String  @Common.Label: 'Status';
}

entity ZCOST_CENTER : managed {
    key COST_CENTER_ID   : String;
        COST_CENTER_DESC : String;
        EXTERNAL_OBJ_ID  : String;
        DEPARTMENT       : String;
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
    key RISK_ID    : String  @mandatory  @Common.Label: 'Risk Id';
        RISK_DESC  : String  @Common.Label: 'Risk Description';
        START_DATE : Date    @Common.Label: 'Start Date';
        END_DATE   : Date    @Common.Label: 'End Date';
        STATUS     : String  @Common.Label: 'Status';
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
        MATERIAL_CODE        : String  @Common.Label: 'Material Code';
        RISK                 : String  @Common.Label: 'Risk';
        SUBMISSION_TYPE      : String  @Common.Label: 'Submission Type';
        ZCLAIM_CATEGORY      : Association to ZCLAIM_CATEGORY
                                   on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CATEGORY_ID;
        ZCOST_CENTER         : Association to ZCOST_CENTER
                                   on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZRISK                : Association to ZRISK
                                   on ZRISK.RISK_ID = RISK;
        ZSUBMISSION_TYPE     : Association to ZSUBMISSION_TYPE
                                   on ZSUBMISSION_TYPE.SUBMISSION_TYPE_ID = SUBMISSION_TYPE;
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
    key YEAR            : Integer;
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
        PROJECT_CODE    : String;
        BUDGET_OWNER_ID : String;
        WBS_CODE        : Integer;
        IO              : String;
        CURRENCY        : String;
        ZCOST_CENTER    : Association to ZCOST_CENTER
                              on ZCOST_CENTER.COST_CENTER_ID = FUND_CENTER;
}

entity ZCLAIM_CATEGORY : managed {
    key CLAIM_CAT_ID        : String  @mandatory  @Common.Label: 'Claim Category ID';
        CLAIM_CATEGORY_DESC : String  @Common.Label: 'Claim Category Description';
        START_DATE          : Date    @Common.Label: 'Start Date';
        END_DATE            : Date    @Common.Label: 'End Date';
        STATUS              : String  @Common.Label: 'Status';
}

entity ZSTATUS : managed {
    key STATUS_ID   : String  @mandatory  @Common.Label: 'Status ID';
        STATUS_DESC : String  @Common.Label: 'Status Description';
        START_DATE  : Date    @Common.Label: 'Start Date';
        END_DATE    : Date    @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';
}

entity ZROOM_TYPE : managed {
    key ROOM_TYPE_ID   : String  @mandatory  @Common.Label: 'Room Type ID';
        ROOM_TYPE_DESC : String  @Common.Label: 'Room Type Description';
        START_DATE     : Date    @Common.Label: 'Start Date';
        END_DATE       : Date    @Common.Label: 'End Date';
        STATUS         : String  @Common.Label: 'Status';
}

entity ZFLIGHT_CLASS : managed {
    key FLIGHT_CLASS_ID   : String  @mandatory  @Common.Label: 'Flight Class ID';
        FLIGHT_CLASS_DESC : String  @Common.Label: 'Flight Class Description';
        START_DATE        : Date    @Common.Label: 'Start Date';
        END_DATE          : Date    @Common.Label: 'End Date';
        STATUS            : String  @Common.Label: 'Status';
}

entity ZCOUNTRY : managed {
    key COUNTRY_ID   : String  @mandatory  @Common.Label: 'Country ID';
        COUNTRY_DESC : String  @Common.Label: 'Country Description';
        START_DATE   : Date    @Common.Label: 'Start Date';
        END_DATE     : Date    @Common.Label: 'End Date';
        STATUS       : String  @Common.Label: 'Status';
}

entity ZAREA : managed {
    key AREA_ID    : String(6)  @mandatory  @Common.Label: 'Area ID';
        AREA_DESC  : String     @Common.Label: 'Area Description';
        START_DATE : Date       @Common.Label: 'Start Date';
        END_DATE   : Date       @Common.Label: 'End Date';
        STATUS     : String     @Common.Label: 'Status';
}

entity ZLOC_TYPE : managed {
    key LOC_TYPE_ID   : String(6)  @mandatory  @Common.Label: 'LOC_TYPE_ID';
        LOC_TYPE_DESC : String     @Common.Label: 'LOC_TYPE_DESC';
        START_DATE    : Date       @Common.Label: 'Start Date';
        END_DATE      : Date       @Common.Label: 'End Date';
        STATUS        : String     @Common.Label: 'Status';
}

entity ZMARITAL_STAT : managed {
    key MARRIAGE_CATEGORY_ID   : String  @mandatory  @Common.Label: 'Marriage Category ID';
        MARRIAGE_CATEGORY_DESC : String  @Common.Label: 'Marriage Category Description';
        START_DATE             : Date    @Common.Label: 'Start Date';
        END_DATE               : Date    @Common.Label: 'End Date';
        STATUS                 : String  @Common.Label: 'Status';
}

entity ZVEHICLE_TYPE : managed {
    key VEHICLE_TYPE_ID   : String  @mandatory  @Common.Label: 'Vehicle Type ID';
        VEHICLE_TYPE_DESC : String  @Common.Label: 'Vehicle Type Description';
        START_DATE        : Date    @Common.Label: 'Start Date';
        END_DATE          : Date    @Common.Label: 'End Date';
        STATUS            : String  @Common.Label: 'Status';
}

entity ZRATE_KM : managed {
    key RATE_KM_ID         : String(2)  @mandatory  @Common.Label: 'Rate KM ID';
    key VEHICLE_TYPE_ID    : String     @mandatory  @Common.Label: 'Vehicle ID';
    key CLAIM_TYPE_ITEM_ID : String     @mandatory  @Common.Label: 'Claim Type Item ID';
        RATE               : Decimal    @Common.Label: 'Rate';
        START_DATE         : Date       @Common.Label: 'Start Date';
        END_DATE           : Date       @Common.Label: 'End Date';
        STATUS             : String     @Common.Label: 'Status';
        ZVEHICLE_TYPE      : Association to ZVEHICLE_TYPE
                                 on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE_ID;
        ZCLAIM_TYPE_ITEM   : Association to one ZCLAIM_TYPE_ITEM
                                 on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;
}

entity ZREGION : managed {
    key REGION_ID   : String  @mandatory  @Common.Label: 'Region ID';
        REGION_DESC : String  @Common.Label: 'Region Description';
        START_DATE  : Date    @Common.Label: 'Start Date';
        END_DATE    : Date    @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';
}

entity ZTRANSFER_MODE : managed {
    key MODE_ID   : String
        @mandatory
        @Common.Label: 'Mode ID';
        MODE_DESC : String
        @Common.Label: 'Mode Description';
}

entity ZSTATE : managed {
    key COUNTRY_ID : String  @mandatory  @Common.Label: 'Country ID';
    key STATE_ID   : String  @mandatory  @Common.Label: 'State ID';
        STATE_DESC : String  @Common.Label: 'State Description';
        START_DATE : Date    @Common.Label: 'Start Date';
        END_DATE   : Date    @Common.Label: 'End Date';
        STATUS     : String  @Common.Label: 'Status';
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
        START_DATE : Date    @Common.Label: 'Start Date';
        END_DATE   : Date    @Common.Label: 'End Date';
        STATUS     : String  @Common.Label: 'Status';
}

entity ZUSER_TYPE : managed {
    key USER_TYPE_ID   : String  @mandatory  @Common.Label: 'User Type ID';
        USER_TYPE_DESC : String  @Common.Label: 'User Type Description';
        START_DATE     : Date    @Common.Label: 'Start Date';
        END_DATE       : Date    @Common.Label: 'End Date';
        STATUS         : String  @Common.Label: 'Status';
}

entity ZEMP_TYPE : managed {
    key EMP_TYPE_ID   : String  @mandatory  @Common.Label: 'Employee Type ID';
        EMP_TYPE_DESC : String  @Common.Label: 'Employee Type Description';
        START_DATE    : Date    @Common.Label: 'Start Date';
        END_DATE      : Date    @Common.Label: 'End Date';
        STATUS        : String  @Common.Label: 'Status';
}

entity ZSUBMISSION_TYPE : managed {
    key SUBMISSION_TYPE_ID   : String  @mandatory  @Common.Label: 'Submission Type ID';
        SUBMISSION_TYPE_DESC : String  @Common.Label: 'Submission Type Description';
        START_DATE           : Date    @Common.Label: 'Start Date';
        END_DATE             : Date    @Common.Label: 'End Date';
        STATUS               : String  @Common.Label: 'Status';
}

entity ZOFFICE_LOCATION : managed {
    key LOCATION_ID    : String  @mandatory  @Common.Label: 'Location ID';
    key STATE_ID       : String  @mandatory  @Common.Label: 'State ID';
        LOCATION_DESC  : String  @Common.Label: 'Location Description';
        LOCATION_GROUP : String  @Common.Label: 'Location Group';
        LEGAL_ENTITY   : String  @Common.Label: 'Legal Entity';
        START_DATE     : Date    @Common.Label: 'Start Date';
        END_DATE       : Date    @Common.Label: 'End Date';
        STATUS         : String  @Common.Label: 'Status';

}

entity ZOFFICE_DISTANCE : managed {
    key FROM_STATE_ID    : String  @mandatory  @Common.Label: 'From State ID';
    key FROM_LOCATION_ID : String  @mandatory  @Common.Label: 'From Location ID';
    key TO_STATE_ID      : String  @mandatory  @Common.Label: 'To State ID';
    key TO_LOCATION_ID   : String  @mandatory  @Common.Label: 'To Location ID';
        MILEAGE          : String  @Common.Label: 'Mileage';
        START_DATE       : Date    @Common.Label: 'Start Date';
        END_DATE         : Date    @Common.Label: 'End Date';
        STATUS           : String  @Common.Label: 'Status';
}

entity ZGL_ACCOUNT : managed {
    key GL_ACCOUNT_ID   : String  @mandatory  @Common.Label: 'GL Account ID';
        GL_ACCOUNT_DESC : String  @Common.Label: 'GL Account Description';
        START_DATE      : Date    @Common.Label: 'Start Date';
        END_DATE        : Date    @Common.Label: 'End Date';
        STATUS          : String  @Common.Label: 'Status';
}

entity ZMATERIAL_GROUP : managed {
    key MATERIAL_CODE_ID   : String  @mandatory  @Common.Label: 'Material Code ID';
        MATERIAL_CODE_DESC : String  @Common.Label: 'Material Code Description';
        START_DATE         : Date    @Common.Label: 'Start Date';
        END_DATE           : Date    @Common.Label: 'End Date';
        STATUS             : String  @Common.Label: 'Status';

}

entity ZINDIV_GROUP : managed {
    key IND_OR_GROUP_ID   : String  @mandatory  @Common.Label: 'Individual/Group ID';
        IND_OR_GROUP_DESC : String  @Common.Label: 'Individual/Group ID Description';
        START_DATE        : Date    @Common.Label: 'Start Date';
        END_DATE          : Date    @Common.Label: 'End Date';
        STATUS            : String  @Common.Label: 'Status';
}

entity ZTRAIN_COURSE_PART : managed {
    key COURSE_ID           : String     @mandatory  @Common.Label: 'Course ID';
        COURSE_DESC         : String     @Common.Label: 'Course Description';
        SESSION_NUMBER      : String(15) @Common.Label: 'Session Number';
        COURSE_SESSION_STAT : Boolean    @Common.Label: 'Course Session Status';
        ATT_STATE           : Boolean    @Common.Label: 'Attendence Status';
        PARTICIPANT_ID      : String     @Common.Label: 'Participants';
        START_DATE          : Date       @Common.Label: 'Start Date';
        END_DATE            : Date       @Common.Label: 'End Date';
        CLAIM_STATUS        : String     @Common.Label: 'Claim Status';
        CLAIM_ID            : String     @Common.Label: 'Claim ID';
        ZSTATUS             : Association to ZSTATUS
                                  on ZSTATUS.STATUS_ID = CLAIM_STATUS;
        ZCLAIM_HEADER       : Association to ZCLAIM_HEADER
                                  on ZCLAIM_HEADER.CLAIM_ID = CLAIM_ID;
}

entity ZMARITAL_CAT : managed {
    key MARRIAGE_CATEGORY_ID   : String  @mandatory  @Common.Label: 'Marriage Category ID';
        MARRIAGE_CATEGORY_DESC : String  @Common.Label: 'Marriage Category Description';
        START_DATE             : Date    @Common.Label: 'Start Date';
        END_DATE               : Date    @Common.Label: 'End Date';
        STATUS                 : String  @Common.Label: 'Status';
}

entity ZLOOKUP_FIELD : managed {
    key LOOKUP_ID   : String  @mandatory  @Common.Label: 'Lookup ID';
        LOOKUP_DESC : String  @Common.Label: 'Lookup Description';
        START_DATE  : Date    @Common.Label: 'Start Date';
        END_DATE    : Date    @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';
}

entity ZINTERNAL_ORDER : managed {
    key IO_ID      : String  @mandatory  @Common.Label: 'IO ID';
        IO_DESC    : String  @Common.Label: 'IO Description';
        START_DATE : Date    @Common.Label: 'Start Date';
        END_DATE   : Date    @Common.Label: 'End Date';
        STATUS     : String  @Common.Label: 'Status';
}

entity ZEMP_RELATIONSHIP : managed {
    key RELATIONSHIP_TYPE_ID   : String  @mandatory  @Common.Label: 'Relationship Type ID';
        RELATIONSHIP_TYPE_DESC : String  @Common.Label: 'Relationship Type Description';
        START_DATE             : Date    @Common.Label: 'Start Date';
        END_DATE               : Date    @Common.Label: 'End Date';
        STATUS                 : String  @Common.Label: 'Status';
}

entity ZVEHICLE_OWNERSHIP : managed {
    key VEHICLE_OWNERSHIP_ID   : String  @mandatory  @Common.Label: 'Vehicle Ownership ID';
        VEHICLE_OWNERSHIP_DESC : String  @mandatory  @Common.Label: 'Vehicle Description';
        START_DATE             : Date    @mandatory  @Common.Label: 'Start Date';
        END_DATE               : Date    @mandatory  @Common.Label: 'End Date';
        STATUS                 : String  @Common.Label: 'Status';
}

entity ZAPPROVAL_3 : managed {
    key WORKFLOW_SCENARIO    : String  @mandatory  @Common.Label: 'Workflow Scenario';
    key LEVEL_OF_APPROVER    : String  @mandatory  @Common.Label: 'Level of Approver';
        DEPARTMENT           : String  @Common.Label: 'Department';
        APPROVER_POSITION_NO : String  @Common.Label: 'Position Number (Approver)';
        EMPLOYEE_POSITION    : String  @Common.Label: 'Employee Position';
        ROLE                 : String  @Common.Label: 'Role';
        COST_CENTER          : String  @Common.Label: 'Cost Center';
        BUDGET_OWNER_ID      : String  @Common.Label: 'Budget Owner ID';
        START_DATE_INITIAL   : Date    @Common.Label: 'Start Date Initial';
        END_DATE_INITIAL     : Date    @Common.Label: 'End Date Initial';
        SUBTITUTE            : String  @Common.Label: 'Subtitute';
        START_DATE_SUBTITUTE : Date    @Common.Label: 'Start Date Subtitute';
        END_DATE_SUBTITUTE   : Date    @Common.Label: 'End Date Subtitute';
}

entity ZAPPROVAL_2 : managed {
    key WORKFLOW_SCENARIO : String  @mandatory  @Common.Label: 'Workflow Scenario';
        LEVEL_OF_APPROVER : String  @Common.Label: 'Level of Approver';
        APPROVER_WORKFLOW : String  @Common.Label: 'Department';
        START_DATE        : Date    @Common.Label: 'Start Date';
        END_DATE          : Date    @Common.Label: 'End Date';
        STATUS            : String  @Common.Label: 'Status';
}

entity ZAPPROVAL_1 : managed {
    key CLAIM_METHOD          : String  @mandatory  @Common.Label: 'Claim Method';
    key SCENARIO              : String  @mandatory  @Common.Label: 'Scenario';
        RISK                  : String  @Common.Label: 'Risk';
        EMPLOYEE_CLAIM_AMOUNT : String  @Common.Label: 'Employee Claim Amount';
        EQUATION_SYMBOL1      : String  @Common.Label: 'Equation Symbol 1';
        REQUESTED_AMOUNT      : String  @Common.Label: 'Requested Amount';
        EQUATION_SYMBOL2      : String  @Common.Label: 'Equation Symbol 2';
        THRESHOLD_AMOUNT      : String  @Common.Label: 'Threshold Amount';
        RECEIPT_DATE          : Date    @Common.Label: 'Receipt Date';
        EQUATION_SYMBOL3      : String  @Common.Label: 'Equation Symbol 3';
        DAYS                  : String  @Common.Label: 'Days';
        EMPLOYEE_COST_CENTER  : String  @Common.Label: 'Employee Cost Center';
        EQUATION_SYMBOL4      : String  @Common.Label: 'Equation Symbol 4';
        INPUT_COST_CENTER     : String  @Common.Label: 'Input Cost Center';
        CASH_ADVANCE          : String  @Common.Label: 'Cash Advance';
        START_DATE            : Date    @Common.Label: 'Start Date';
        EQUATION_SYMBOL5      : String  @Common.Label: 'Equation Symbol 5';
        CURRENT_DATE          : Date    @Common.Label: 'Current Date';
        WORKFLOW_SCENARIO     : String  @Common.Label: 'Workflow Scenario';
}

entity ZEMP_DEPENDENT : managed {
    key EMP_ID                            : String        @mandatory  @Common.Label: 'Employee ID';
    key RELATIONSHIP                      : String        @mandatory  @Common.Label: 'Relationship';
    key DEPENDENT_NO                      : Integer       @mandatory  @Common.Label: 'Dependent Number';
        SPOUSE_EMP_ID                     : String        @Common.Label: 'Spouse Employee ID';
        LEGAL_NAME                        : String        @Common.Label: 'Legal Name';
        NATIONAL_ID                       : String        @Common.Label: 'National ID';
        DOB                               : Date          @Common.Label: 'Date Of Birth';
        STUDENT                           : Boolean       @Common.Label: 'Student';
        EMPLOYED                          : Boolean       @Common.Label: 'Employed';
        POST_EDU_ASSISTANT_CLAIM_DATE     : Date          @Common.Label: 'Post Education Assistance Claim Date';
        POST_EDU_ASSISTANT_ENTITLE_AMOUNT : Decimal(7, 2) @Common.Label: 'Post Education Assistance Entitled Amount';
        MEDICAL_INSURANCE                 : String(24)    @Common.Label: 'Medical Insurance';
        START_DATE                        : Date          @Common.Label: 'Effective Date';
        UPDATED_DATE                      : Date          @Common.Label: 'Updated Date';
        INSERTED_DATE                     : Date          @Common.Label: 'Inserted Date';
}


entity ZPROJECT_HDR : managed {
    key PROJECT_CODE_IO : String  @mandatory  @Common.Label: 'Project Code(IO)';
        PROJECT_DESC    : String  @Common.Label: 'Project Description';
        GL_ACCOUNT      : String  @Common.Label: 'GL Account';
        COST_CENTER     : String  @Common.Label: 'Cost Center';
        STATUS          : String  @Common.Label: 'Status';
        BUFFER_FIELD1   : String  @Common.Label: 'Buffer Field 1';
        BUFFER_FIELD2   : String  @Common.Label: 'Buffer Field 2';
        START_DATE      : Date    @Common.Label: 'Start Date';
        END_DATE        : Date    @Common.Label: 'End Date';
        ZGL_ACCOUNT     : Association to ZGL_ACCOUNT
                              on ZGL_ACCOUNT.GL_ACCOUNT_ID = GL_ACCOUNT;
        ZCOST_CENTER    : Association to ZCOST_CENTER
                              on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
}

entity ZBRANCH : managed {
    key BRANCH_ID    : String  @mandatory  @Common.Label: 'Unit/Section (Branch) ID';
        BRANCH_DESC  : String  @Common.Label: 'Unit/Section (Branch) Description';
        HEAD_OF_UNIT : String  @Common.Label: 'Head of Unit';
        START_DATE   : Date    @Common.Label: 'Start Date';
        END_DATE     : Date    @Common.Label: 'End Date';
        STATUS       : String  @Common.Label: 'Status';
}

entity ZEMP_CA_PAYMENT : managed {
    key REQUEST_ID          : String  @mandatory  @Common.Label: 'Pre Approval Request ID';
    key EMP_ID              : String  @mandatory  @Common.Label: 'Employee ID';
    key DISBURSEMENT_DATE   : Date    @mandatory  @Common.Label: 'Disbursement Date';
        DISBURSEMENT_STATUS : String  @Common.Label: 'Disbursement Status (Y/N)';
}

entity ZPERDIEM_ENT : managed {
    key PERSONAL_GRADE_FROM  : String        @mandatory  @Common.Label: 'Personal Grade From';
    key PERSONAL_GRADE_TO    : String        @mandatory  @Common.Label: 'Personal Grade To';
    key LOCATION             : String        @mandatory  @Common.Label: 'Location';
    key EFFECTIVE_START_DATE : Date          @mandatory  @Common.Label: 'Effective Start Date';
    key EFFECTIVE_END_DATE   : Date          @mandatory  @Common.Label: 'Effective End Date';
        CURRENCY             : String        @Common.Label: 'Currency';
        AMOUNT               : Decimal(7, 2) @Common.Label: 'Amount';
}

entity ZHOUSING_LOAN_SCHEME : managed {
    key HOUSING_LOAN_SCHEME_ID   : String  @mandatory  @Common.Label: 'Housing Loan Scheme ID';
        HOUSING_LOAN_SCHEME_DESC : String  @Common.Label: 'Housing Loan Scheme Description';
        START_DATE               : Date    @Common.Label: 'Start Date';
        END_DATE                 : Date    @Common.Label: 'End Date';
        STATUS                   : String  @Common.Label: 'Status';
}

entity ZLENDER_NAME : managed {
    key LENDER_ID   : String  @mandatory  @Common.Label: 'Lender ID';
        LENDER_NAME : String  @Common.Label: 'Lender Name';
        START_DATE  : Date    @Common.Label: 'Start Date';
        END_DATE    : Date    @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';
}

entity ZREJECT_REASON : managed {
    key REASON_ID   : String  @mandatory  @Common.Label: 'Reason ID';
    key REASON_TYPE : String  @mandatory  @Common.Label: 'Reason Type';
    key START_DATE  : Date    @mandatory  @Common.Label: 'Start Date';
    key END_DATE    : Date    @mandatory  @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';
        REASON_DESC : String  @Common.Label: 'Reason Text';
}

entity ZWORKFLOW_STEP : managed {
    key WORKFLOW_CODE            : String;
    key WORKFLOW_TYPE            : String;
    key START_DATE               : String;
    key END_DATE                 : String;
        WORKFLOW_NAME            : String;
        WORKFLOW_APPROVAL_LEVELS : Integer;
        REMARK                   : String;
}

entity ZWORKFLOW_RULE : managed {
    key WORKFLOW_ID           : String;
    key WORKFLOW_TYPE         : String;
    key CLAIM_TYPE_ID         : String;
    key CLAIM_TYPE_ITEM_ID    : String;
    key START_DATE            : String;
    key END_DATE              : String;
        RISK_LEVEL            : String(1);
        THRESHOLD_AMOUNT      : Decimal(7, 2);
        THRESHOLD_VALUE       : String(2);
        RECEIPT_DAY           : Date;
        RECEIPT_AGE           : Integer;
        EMPLOYEE_COST_CENTER  : String(9);
        OUTCOME_WORKFLOW_CODE : String(3);
        REMARK                : String(255);
}

entity ZCURRENCY : managed {
    key CURRENCY_ID   : String(3)  @mandatory  @Common.Label: 'Currency ID';
        CURRENCY_DESC : String     @Common.Label: 'Currency Description';
        START_DATE    : Date       @Common.Label: 'Start Date';
        END_DATE      : Date       @Common.Label: 'End Date';
        STATUS        : String     @Common.Label: 'Status';
}
