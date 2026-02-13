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
        ZOFFICE_LOCATION        : Association to ZOFFICE_LOCATION   
                                    on ZOFFICE_LOCATION.LOCATION_ID = OFFICE_LOCATION; 
}

entity ZREQUEST_HEADER : managed {
    key EMP_ID                  : String @mandatory;   
    key REQUEST_ID              : String @mandatory;     
        REQUEST_TYPE_ID         : String;
        REFERENCE_NUMBER        : String;
        OBJECTIVE_PURPOSE       : String;
        TRIP_START_DATE         : Date;
        TRIP_END_DATE           : Date;
        EVENT_START_DATE        : Date;
        EVENT_END_DATE          : Date;
        APPROVED_DATE           : Date;
        REQUEST_DATE            : Date;        
        IND_OR_GROUP            : String;
        REMARK                  : String;
        ALTERNATE_COST_CENTRE   : String;
        REQUEST_AMOUNT          : Decimal(16,2);
        TOTAL_AMOUNT            : Decimal(16,2);
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
        CASH_ADVANCE            : Decimal(16,2);
        CASH_ADVANCE_DATE       : Date;
        TRAVEL_ALONE_FAMILY     : String(1);
        TRAVEL_FAMILY_NOW_LATER : String(1);
        ZREQUEST_ITEM           : Composition of many ZREQUEST_ITEM
                                      on ZREQUEST_ITEM.REQUEST_ID = REQUEST_ID;
        ZREQUEST_TYPE           : Association to one ZREQUEST_TYPE
                                      on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZSTATUS                : Association to one ZSTATUS
                                     on ZSTATUS.STATUS_ID = STATUS;  
        ZCOST_CENTER           : Association to one ZCOST_CENTER
                                     on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZEMP_MASTER            : Association to one ZEMP_MASTER
                                    on ZEMP_MASTER.EEID = EMP_ID;
        ZINDIV_GROUP           : Association to ZINDIV_GROUP
                                    on ZINDIV_GROUP.IND_OR_GROUP_ID = IND_OR_GROUP;
}

entity ZREQUEST_ITEM : managed {
    key REQUEST_ID             : String @mandatory;    
    key REQUEST_SUB_ID         : String @mandatory;    
        CLAIM_TYPE_ITEM_ID     : String;    
        CLAIM_TYPE_ID          : String;
        EST_AMOUNT             : Decimal(16,2);
        EST_NO_PARTICIPANT     : Integer;
        CASH_ADVANCE           : Boolean;
        START_DATE             : Date;
        END_DATE               : Date;
        REMARK                 : String;
        SEND_TO_SF             : Boolean;   
        LOCATION               : String;  
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
    key PARTICIPANTS_ID      : String @mandatory;      
        ALLOCATED_AMOUNT     : Decimal;
        ZEMP_MASTER          : Association to one ZEMP_MASTER
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
        END_DATE         : Date    @Common.Label: 'End Date';
        START_DATE       : Date    @Common.Label: 'Start Date';
        STATUS           : String  @Common.Label: 'Status';        
        ZCLAIM_TYPE_ITEM : Composition of many ZCLAIM_TYPE_ITEM
                               on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
}

entity ZNUM_RANGE : managed {
    key RANGE_ID    : String  @mandatory  @Common.Label: 'RANGE_ID';
        RANGE_DESC  : String  @Common.Label: 'RANGE_DESC';
        ![FROM]     : String  @Common.Label: 'FROM';
        TO          : String  @Common.Label: 'TO';
        CURRENT     : String  @Common.Label: 'CURRENT';
}

entity ZCLAIM_HEADER : managed {
    key CLAIM_ID                        : String @mandatory;
        EMP_ID                          : String;
        PURPOSE                         : String;
        TRIP_START_DATE                 : Date;
        TRIP_END_DATE                   : Date;
        EVENT_START_DATE                : Date;
        EVENT_END_DATE                  : Date;
        SUBMISSION_TYPE                 : String;
        COMMENT                         : String;
        ALTERNATE_COST_CENTER           : String;
        COST_CENTER                     : String;
        REQUEST_ID                      : String;
        ATTACHMENT_EMAIL_APPROVER       : String;
        STATUS_ID                       : String;
        CLAIM_TYPE_ID                   : String;
        CLAIM_TYPE_ITEM_ID              : String;
        TOTAL_CLAIM_AMOUNT              : Decimal(16,2);
        APPROVED_AMOUNT                 : Decimal(16,2);
        CASH_ADVANCE_AMOUT              : Decimal(16,2);
        FINAL_AMOUNT_TO_RECEIVE         : Decimal(16,2);
        LAST_MODIFIED_DATE              : Date;
        SUBMITTED_DATE                  : Date;
        LAST_APPROVED_DATE              : Date;
        LAST_APPROVED_TIME              : Date;
        PAYMENT_DATE                    : Date;
        LOCATION                        : String;
        SPOUSE_OFFICE_ADDRESS           : String;
        HOUSE_COMPLETION_DATE           : Date;
        MOVE_IN_DATE                    : Date;
        HOUSING_LOAN_SCHEME             : String;
        LENDER_NAME                     : String;
        SPECIFY_DETAILS                 : String;
        NEW_HOUSE_ADDRESS               : String;
        DIST_OLD_HOUSE_TO_OFFICE_KM     : Decimal;
        DIST_OLD_HOUSE_TO_NEW_HOUSE_KM  : Decimal;
        APPROVER1                       : String(6);
        APPROVER2                       : String(6);
        APPROVER3                       : String(6);
        APPROVER4                       : String(6);
        APPROVER5                       : String(6);
        ZCLAIM_ITEM                     : Composition of many ZCLAIM_ITEM
                                            on ZCLAIM_ITEM.CLAIM_ID = CLAIM_ID;
        ZEMP_MASTER                     : Association to one ZEMP_MASTER
                                            on ZEMP_MASTER.EEID = EMP_ID;  
        ZCLAIM_TYPE                     : Association to one ZCLAIM_TYPE
                                            on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZCOST_CENTER                    : Association to one ZCOST_CENTER
                                            on ZCOST_CENTER.COST_CENTER_ID = ALTERNATE_COST_CENTER;              
        ZSTATUS                         : Association to one ZSTATUS
                                            on ZSTATUS.STATUS_ID = STATUS_ID;
        ZSUBMISSION_TYPE                : Association to ZSUBMISSION_TYPE
                                            on ZSUBMISSION_TYPE.SUBMISSION_TYPE_ID = SUBMISSION_TYPE;
        ZREQUEST_HEADER                 : Association to ZREQUEST_HEADER
                                            on ZREQUEST_HEADER.REQUEST_ID = REQUEST_ID;
        ZCLAIM_TYPE_ITEM                : Association to one ZCLAIM_TYPE_ITEM
                                            on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;  
        COSTCENTER                      : Association to ZCOST_CENTER
                                            on COSTCENTER.COST_CENTER_ID = COST_CENTER;                                                                                      
}

entity ZCLAIM_ITEM : managed {
    key CLAIM_ID                    : String @mandatory;
    key CLAIM_SUB_ID                : String @mandatory;
        CLAIM_TYPE_ID               : String;
        CLAIM_TYPE_ITEM_ID          : String;
        PERCENTAGE_COMPENSATION     : Decimal(5,2);
        ACCOUNT_NO                  : String;      
        AMOUNT                      : Decimal(16,2);
        ATTACHMENT_FILE_1           : String;
        ATTACHMENT_FILE_2           : String;
        BILL_NO                     : String;        
        BILL_DATE                   : Date;
        CLAIM_CATEGORY              : String;
        COUNTRY                     : String;
        DISCLAIMER                  : Boolean;
        START_DATE                  : Date;
        END_DATE                    : Date;
        START_TIME                  : Time;
        END_TIME                    : Time;
        FLIGHT_CLASS                : String;
        FROM_ELC                    : Boolean;
        TO_ELC                      : Boolean;
        FROM_LOCATION               : String;
        FROM_LOCATION_OFFICE        : String;
        KM                          : Decimal(6,2);
        LOCATION                    : String;
        LOCATION_TYPE               : String;
        LODGING_CATEGORY            : String;
        LODGING_ADDRESS             : String;
        MARRIAGE_CATEGORY           : String;
        MORE_THAN_14_WORK_DAYS      : Boolean;
        AREA                        : String;
        NO_OF_FAMILY_MEMBER         : Integer;
        PARKING                     : Decimal;
        PHONE_NO                    : String;
        RATE_PER_KM                 : String(2);
        RECEIPT_DATE                : Date;
        RECEIPT_NUMBER              : String;
		REMARK            		    : String;
		ROOM_TYPE         		    : String;
        REGION                      : String;
        STAFF_CATEGORY              : String;
        FROM_STATE_ID               : String;
        TO_STATE_ID                 : String;
        TO_LOCATION                 : String;
        TO_LOCATION_OFFICE          : String;
        TOLL                        : Decimal(16,2);
        TOTAL_EXP_AMOUNT            : Decimal(16,2);
        VEHICLE_TYPE                : String;
        VEHICLE_FARE                : Boolean;
        TRIP_START_DATE             : Date;
        TRIP_END_DATE               : Date;
        EVENT_START_DATE            : Date;
        EVENT_END_DATE              : Date; 
        TRAVEL_DURATION_DAY         : Decimal(3,1);
        TRAVEL_DURATION_HOUR        : Decimal(4,1);
        PROVIDED_BREAKFAST          : String;
        PROVIDED_LUNCH              : String;
        PROVIDED_DINNER             : String;
        ENTITLED_BREAKFAST          : String;
        ENTITLED_LUNCH              : String;
        ENTITLED_DINNER             : String;   
        ANGGOTA_ID                  : String;
        ANGGOTA_NAME                : String;
        DEPENDENT_NAME              : String;
        TYPE_OF_PROFESSIONAL_BODY   : String;
        DISCLAIMER_GALAKAN          : String;    
        VEHICLE_OWN_OFFICE          : String;
        MODE_OF_TRANSFER            : String;
        TRANSFER_DATE               : Date;
        NO_OF_DAYS                  : Integer;
        FAMILY_COUNT                : Integer;
        FUNERAL_TRANSPORTATION      : String;        
        ZCLAIM_CATEGORY             : Association to ZCLAIM_CATEGORY
                                        on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CLAIM_CATEGORY;
        ZLODGING_CAT                : Association to ZLODGING_CAT
                                        on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY;
        ZCLAIM_TYPE_ITEM            : Association to one ZCLAIM_TYPE_ITEM
                                        on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;
        ZVEHICLE_TYPE               : Association to one ZVEHICLE_TYPE
                                        on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE;
        ZROOM_TYPE                  : Association to one ZROOM_TYPE
                                        on ZROOM_TYPE.ROOM_TYPE_ID = ROOM_TYPE;
        ZFLIGHT_CLASS               : Association to one ZFLIGHT_CLASS
                                        on ZFLIGHT_CLASS.FLIGHT_CLASS_ID = FLIGHT_CLASS;
        ZREGION                     : Association to one ZREGION
                                        on ZREGION.REGION_ID = REGION;
        ZAREA                       : Association to one ZAREA
                                        on ZAREA.AREA_ID = AREA;
        ZSTAFF_CAT                  : Association to ZSTAFF_CAT
                                        on ZSTAFF_CAT.STAFF_CATEGORY_ID = STAFF_CATEGORY;
        ZMARITAL_STAT               : Association to one ZMARITAL_STAT
                                        on ZMARITAL_STAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZLOC_TYPE                   : Association to one ZLOC_TYPE
                                        on ZLOC_TYPE.LOC_TYPE_ID = LOCATION_TYPE;
        ZRATE_KM                    : Association to ZRATE_KM
                                        on ZRATE_KM.RATE_KM_ID = RATE_PER_KM;
}

entity ZLODGING_CAT : managed {
    key LODGING_CATEGORY_ID   : String  @mandatory  @Common.Label: 'Lodging Category ID';
        LODGING_CATEGORY_DESC : String  @Common.Label: 'Lodging Category Description';
        START_DATE            : Date @Common.Label: 'Start Date';
        END_DATE              : Date @Common.Label: 'End Date';
        STATUS                : String @Common.Label: 'Status';
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
    key RISK_ID     : String  @mandatory  @Common.Label: 'Risk Id';
        RISK_DESC   : String  @Common.Label: 'Risk Description';
        START_DATE  : Date  @Common.Label: 'Start Date';
        END_DATE    : Date  @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';
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
        GL_ACCOUNT           : String  @Common.Label: 'GL Account';
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
        START_DATE          : Date  @Common.Label: 'Start Date';
        END_DATE            : Date  @Common.Label: 'End Date';
        STATUS              : String  @Common.Label: 'Status';         
}

entity ZSTATUS : managed {
    key STATUS_ID   : String  @mandatory  @Common.Label: 'Status ID';
        STATUS_DESC : String  @Common.Label: 'Status Description';
        START_DATE  : Date  @Common.Label: 'Start Date';
        END_DATE    : Date  @Common.Label: 'End Date';
        STATUS      : String  @Common.Label: 'Status';         
}

entity ZROOM_TYPE : managed {
    key ROOM_TYPE_ID   : String  @mandatory  @Common.Label: 'Room Type ID';
        ROOM_TYPE_DESC : String  @Common.Label: 'Room Type Description';
        START_DATE     : Date  @Common.Label: 'Start Date';
        END_DATE       : Date  @Common.Label: 'End Date';
        STATUS         : String  @Common.Label: 'Status';
}

entity ZFLIGHT_CLASS : managed {
    key FLIGHT_CLASS_ID     : String  @mandatory  @Common.Label: 'Flight Class ID';
        FLIGHT_CLASS_DESC   : String  @Common.Label: 'Flight Class Description';
        START_DATE          : Date  @Common.Label: 'Start Date';
        END_DATE            : Date  @Common.Label: 'End Date';
        STATUS              : String  @Common.Label: 'Status';        
}

entity ZCOUNTRY : managed {
    key COUNTRY_ID   : String  @mandatory  @Common.Label: 'Country ID';
        COUNTRY_DESC : String  @Common.Label: 'Country Description';
        START_DATE   : Date  @Common.Label: 'Start Date';
        END_DATE     : Date  @Common.Label: 'End Date';
        STATUS       : String  @Common.Label: 'Status';        
}

entity ZAREA : managed {
    key AREA_ID     : String(6)  @mandatory  @Common.Label: 'Area ID';
        AREA_DESC   : String     @Common.Label: 'Area Description';
        START_DATE  : Date       @Common.Label: 'Start Date';
        END_DATE    : Date       @Common.Label: 'End Date';
        STATUS      : String     @Common.Label: 'Status';           
}

entity ZLOC_TYPE : managed {
    key LOC_TYPE_ID   : String(6)  @mandatory  @Common.Label: 'LOC_TYPE_ID';
        LOC_TYPE_DESC : String     @Common.Label: 'LOC_TYPE_DESC';
        START_DATE    : Date       @Common.Label: 'Start Date';
        END_DATE      : Date       @Common.Label: 'End Date';
        STATUS        : String     @Common.Label: 'Status';  
}

entity ZSTAFF_CAT : managed {
    key STAFF_CATEGORY_ID   : String  @mandatory  @Common.Label: 'Staff Category ID';
        STAFF_CATEGORY_DESC : String  @Common.Label: 'Staff Category Description';
        START_DATE          : Date    @Common.Label: 'Start Date';
        END_DATE            : Date    @Common.Label: 'End Date';
        STATUS              : String  @Common.Label: 'Status';
}

entity ZMARITAL_STAT : managed {
    key MARRIAGE_CATEGORY_ID    : String  @mandatory  @Common.Label: 'Marriage Category ID';
        MARRIAGE_CATEGORY_DESC  : String  @Common.Label: 'Marriage Category Description';
        START_DATE              : Date    @Common.Label: 'Start Date';
        END_DATE                : Date    @Common.Label: 'End Date';
        STATUS                  : String  @Common.Label: 'Status';
}

entity ZVEHICLE_TYPE : managed {
    key VEHICLE_TYPE_ID   : String  @mandatory  @Common.Label: 'Vehicle Type ID';
        VEHICLE_TYPE_DESC : String  @Common.Label: 'Vehicle Type Description';
        START_DATE        : Date    @Common.Label: 'Start Date';
        END_DATE          : Date    @Common.Label: 'End Date';
        STATUS            : String  @Common.Label: 'Status';
}

entity ZRATE_KM : managed {
    key RATE_KM_ID          : String(2) @mandatory  @Common.Label: 'Rate KM ID';
        RATE_PER_KM         : Decimal   @Common.Label: 'Rate Per KM';
        VEHICLE_TYPE_ID     : String  @Common.Label: 'Vehicle ID';
        CLAIM_TYPE_ITEM_ID  : String  @Common.Label: 'Claim Type Item ID';
        RATE                : Decimal @Common.Label: 'Rate';
        START_DATE          : Date    @Common.Label: 'Start Date';
        END_DATE            : Date    @Common.Label: 'End Date';
        STATUS              : String  @Common.Label: 'Status';
        ZVEHICLE_TYPE       : Association to ZVEHICLE_TYPE
                                on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE_ID;
        ZCLAIM_TYPE_ITEM    : Association to one ZCLAIM_TYPE_ITEM
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
        START_DATE : Date   @Common.Label: 'Start Date';
        END_DATE   : Date   @Common.Label: 'End Date';
        STATUS     : String @Common.Label: 'Status';        
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
    key ROLE_ID     : String @mandatory @Common.Label: 'Role ID';
        ROLE_DESC   : String @Common.Label: 'Role Description';
        START_DATE  : Date   @Common.Label: 'Start Date';
        END_DATE    : Date   @Common.Label: 'End Date';
        STATUS      : String @Common.Label: 'Status';
}

entity ZUSER_TYPE: managed {
    key USER_TYPE_ID    : String @mandatory @Common.Label: 'User Type ID';
        USER_TYPE_DESC  : String @Common.Label: 'User Type Description';
        START_DATE      : Date   @Common.Label: 'Start Date';
        END_DATE        : Date   @Common.Label: 'End Date';
        STATUS          : String @Common.Label: 'Status';
}     

entity ZEMP_TYPE: managed {
    key EMP_TYPE_ID    : String @mandatory @Common.Label: 'Employee Type ID';
        EMP_TYPE_DESC  : String @Common.Label: 'Employee Type Description';
        START_DATE     : Date   @Common.Label: 'Start Date';
        END_DATE       : Date   @Common.Label: 'End Date';
        STATUS         : String @Common.Label: 'Status';
} 

entity ZSUBMISSION_TYPE: managed {
    key SUBMISSION_TYPE_ID      : String @mandatory @Common.Label: 'Submission Type ID';
        SUBMISSION_TYPE_DESC    : String @Common.Label: 'Submission Type Description';
        START_DATE              : Date   @Common.Label: 'Start Date';
        END_DATE                : Date   @Common.Label: 'End Date';
        STATUS                  : String @Common.Label: 'Status'; 
}

entity ZOFFICE_LOCATION: managed {
    key LOCATION_ID     : String @mandatory @Common.Label: 'Location ID';
    key STATE_ID        : String @mandatory @Common.Label: 'State ID';
        LOCATION_DESC   : String @Common.Label: 'Location Description';
        LOCATION_GROUP  : String @Common.Label: 'Location Group';
        LEGAL_ENTITY    : String @Common.Label: 'Legal Entity';
        START_DATE      : Date   @Common.Label: 'Start Date';
        END_DATE        : Date   @Common.Label: 'End Date';
        STATUS          : String @Common.Label: 'Status';         

}

entity ZOFFICE_DISTANCE: managed {
    key FROM_STATE_ID       : String @mandatory @Common.Label: 'From State ID';
    key FROM_LOCATION_ID    : String @mandatory @Common.Label: 'From Location ID';
    key TO_STATE_ID         : String @mandatory @Common.Label: 'To State ID';
    key TO_LOCATION_ID      : String @mandatory @Common.Label: 'To Location ID';
        MILEAGE             : String @Common.Label: 'Mileage';
        START_DATE          : Date   @Common.Label: 'Start Date';
        END_DATE            : Date   @Common.Label: 'End Date';
        STATUS              : String @Common.Label: 'Status';         
}

entity ZGL_ACCOUNT: managed {
    key GL_ACCOUNT_ID   : String @mandatory @Common.Label: 'GL Account ID';
        GL_ACCOUNT_DESC : String @Common.Label: 'GL Account Description';
        START_DATE      : Date   @Common.Label: 'Start Date';
        END_DATE        : Date   @Common.Label: 'End Date';
        STATUS          : String @Common.Label: 'Status';  
}

entity ZMATERIAL_GROUP: managed {
    key MATERIAL_CODE_ID    : String @mandatory @Common.Label: 'Material Code ID';
        MATERIAL_CODE_DESC  : String @Common.Label: 'Material Code Description';
        START_DATE          : Date   @Common.Label: 'Start Date';
        END_DATE            : Date   @Common.Label: 'End Date';
        STATUS              : String @Common.Label: 'Status';         

}

entity ZINDIV_GROUP: managed {
    key IND_OR_GROUP_ID     : String @mandatory @Common.Label: 'Individual/Group ID';
    IND_OR_GROUP_DESC       : String @Common.Label: 'Individual/Group ID Description';
    START_DATE              : Date   @Common.Label: 'Start Date';
    END_DATE                : Date   @Common.Label: 'End Date';
    STATUS                  : String @Common.Label: 'Status';      
}

entity ZTRAIN_COURSE_PART: managed {
    key COURSE_ID           : String        @mandatory @Common.Label: 'Course ID';
        COURSE_DESC         : String        @Common.Label: 'Course Description';
        SESSION_NUMBER      : String(15)    @Common.Label: 'Session Number';
        COURSE_SESSION_STAT : Boolean       @Common.Label: 'Course Session Status';
        ATT_STATE           : Boolean       @Common.Label: 'Attendence Status';
        PARTICIPANT_ID      : String        @Common.Label: 'Participants';
        START_DATE          : Date          @Common.Label: 'Start Date';
        END_DATE            : Date          @Common.Label: 'End Date';
        CLAIM_STATUS        : String        @Common.Label: 'Claim Status';
        CLAIM_ID            : String        @Common.Label: 'Claim ID';      
        ZSTATUS             : Association to ZSTATUS
                                on ZSTATUS.STATUS_ID = CLAIM_STATUS;  
        ZCLAIM_HEADER       : Association to ZCLAIM_HEADER
                                on ZCLAIM_HEADER.CLAIM_ID = CLAIM_ID;
}

entity ZPREAPPROVAL_STATUS: managed {
    key PREAPPROVAL_STATUS_ID   : String @mandatory @Common.Label: 'Pre-Approval Status ID';
        PREAPPROVAL_STATUS_DESC : String @Common.Label: 'Pre-Approval Status Description';
        START_DATE              : Date @Common.Label: 'Start Date';
        END_DATE                : Date @Common.Label: 'End Date';
        STATUS                  : String @Common.Label: 'Status';      
}

entity ZMARITAL_CAT: managed {
    key MARRIAGE_CATEGORY_ID    : String @mandatory @Common.Label: 'Marriage Category ID';
        MARRIAGE_CATEGORY_DESC  : String @Common.Label: 'Marriage Category Description';
        START_DATE              : Date @Common.Label: 'Start Date';
        END_DATE                : Date @Common.Label: 'End Date';
        STATUS                  : String @Common.Label: 'Status';      
}

entity ZLOOKUP_FIELD: managed {
    key LOOKUP_ID               : String @mandatory @Common.Label: 'Lookup ID';
        LOOKUP_DESC             : String @Common.Label: 'Lookup Description';
        START_DATE              : Date @Common.Label: 'Start Date';
        END_DATE                : Date @Common.Label: 'End Date';
        STATUS                  : String @Common.Label: 'Status';         
}

entity ZINTERNAL_ORDER: managed {
    key IO_ID       : String @mandatory @Common.Label: 'IO ID';
        IO_DESC     : String @Common.Label: 'IO Description';
        START_DATE  : Date @Common.Label: 'Start Date';
        END_DATE    : Date @Common.Label: 'End Date';
        STATUS      : String @Common.Label: 'Status';        
}

entity ZEMP_RELATIONSHIP: managed {
    key RELATIONSHIP_TYPE_ID    : String @mandatory @Common.Label: 'Relationship Type ID';
        RELATIONSHIP_TYPE_DESC  : String @Common.Label: 'Relationship Type Description'; 
        START_DATE              : Date @Common.Label: 'Start Date';
        END_DATE                : Date @Common.Label: 'End Date';
        STATUS                  : String @Common.Label: 'Status';         
}

entity ZEMP_VEHICLE: managed {
    key EMP_ID      : String @mandatory @Common.Label: 'Employee ID';
    key VEHICLE_NO  : String @Common.Label: 'Vehicle Number';
        START_DATE  : Date @Common.Label: 'Start Date';
        END_DATE    : Date @Common.Label: 'End Date';
        STATUS      : String @Common.Label: 'Status';    
}

entity ZAPPROVAL_3: managed {
    key WORKFLOW_SCENARIO   : String @mandatory @Common.Label: 'Workflow Scenario';
    key LEVEL_OF_APPROVER   : String @mandatory @Common.Label: 'Level of Approver';
        DEPARTMENT              : String @Common.Label: 'Department';  
        APPROVER_POSITION_NO    : String @Common.Label: 'Position Number (Approver)';
        EMPLOYEE_POSITION       : String @Common.Label: 'Employee Position';
        ROLE                    : String @Common.Label: 'Role';
        COST_CENTER             : String @Common.Label: 'Cost Center';
        BUDGET_OWNER_ID         : String @Common.Label: 'Budget Owner ID';
        START_DATE_INITIAL      : Date @Common.Label: 'Start Date Initial';
        END_DATE_INITIAL        : Date @Common.Label: 'End Date Initial';
        SUBTITUTE               : String @Common.Label: 'Subtitute';
        START_DATE_SUBTITUTE    : Date @Common.Label: 'Start Date Subtitute';
        END_DATE_SUBTITUTE      : Date @Common.Label: 'End Date Subtitute';        
}

entity ZAPPROVAL_2: managed {
    key WORKFLOW_SCENARIO       : String @mandatory @Common.Label: 'Workflow Scenario';
        LEVEL_OF_APPROVER       : String @Common.Label: 'Level of Approver';
        APPROVER_WORKFLOW       : String @Common.Label: 'Department';  
        START_DATE              : Date   @Common.Label: 'Start Date';
        END_DATE                : Date   @Common.Label: 'End Date';
        STATUS                  : String @Common.Label: 'Status';
}

entity ZAPPROVAL_1: managed {
    key CLAIM_METHOD            : String @mandatory @Common.Label: 'Claim Method';
    key SCENARIO                : String @mandatory @Common.Label: 'Scenario';
        RISK                    : String @Common.Label: 'Risk';  
        EMPLOYEE_CLAIM_AMOUNT   : String @Common.Label: 'Employee Claim Amount';
        EQUATION_SYMBOL1        : String @Common.Label: 'Equation Symbol 1';
        REQUESTED_AMOUNT        : String @Common.Label: 'Requested Amount';
        EQUATION_SYMBOL2        : String @Common.Label: 'Equation Symbol 2';
        THRESHOLD_AMOUNT        : String @Common.Label: 'Threshold Amount';
        RECEIPT_DATE            : String @Common.Label: 'Receipt Date';
        EQUATION_SYMBOL3        : String @Common.Label: 'Equation Symbol 3';
        DAYS                    : String @Common.Label: 'Days';
        EMPLOYEE_COST_CENTER    : String @Common.Label: 'Employee Cost Center';
        EQUATION_SYMBOL4        : String @Common.Label: 'Equation Symbol 4';
        INPUT_COST_CENTER       : String @Common.Label: 'Input Cost Center';
        CASH_ADVANCE            : String @Common.Label: 'Cash Advance';
        START_DATE              : Date   @Common.Label: 'Start Date';
        EQUATION_SYMBOL5        : String @Common.Label: 'Equation Symbol 5';
        CURRENT_DATE            : Date   @Common.Label: 'Current Date';
        WORKFLOW_SCENARIO       : String @Common.Label: 'Workflow Scenario';
}

entity ZEMP_DEPENDENT: managed {
    key EMP_ID                              : String;
    key RELATIONSHIP                        : String;
    key DEPENDENT_NO                        : Integer;
        SPOUSE_EMP_ID                       : String;
        LEGAL_NAME                          : String;
        NATIONAL_ID                         : String; 
        DOB                                 : Date; 
        STUDENT                             : Boolean;
        EMPLOYED                            : Boolean;
        POST_EDU_ASSISTANT_CLAIM_DATE       : Date;
        POST_EDU_ASSISTANT_ENTITLE_AMOUNT   : Decimal;
        START_DATE                          : Date;
        UPDATED_DATE                        : Date;
        INSERTED_DATE                       : Date;
}


entity ZPROJECT_HDR: managed {
    key PROJECT_CODE_IO     : String @mandatory @Common.Label: 'Project Code(IO)';
        PROJECT_DESC        : String @Common.Label: 'Project Description';
        GL_ACCOUNT          : String @Common.Label: 'GL Account';
        COST_CENTER         : String @Common.Label: 'Cost Center';
        STATUS              : String @Common.Label: 'Status';
        BUFFER_FIELD1       : String @Common.Label: 'Buffer Field 1';
        BUFFER_FIELD2       : String @Common.Label: 'Buffer Field 2';
        START_DATE          : Date   @Common.Label: 'Start Date';
        END_DATE            : Date   @Common.Label: 'End Date';
        ZGL_ACCOUNT         : Association to ZGL_ACCOUNT
                                on ZGL_ACCOUNT.GL_ACCOUNT_ID = GL_ACCOUNT;
        ZCOST_CENTER        : Association to ZCOST_CENTER
                                on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER; 
}

entity ZBRANCH: managed {
    key BRANCH_ID       : String @mandatory @Common.Label: 'Unit/Section (Branch) ID';
        BRANCH_DESC     : String @Common.Label: 'Unit/Section (Branch) Description';
        HEAD_OF_UNIT    : String @Common.Label: 'Head of Unit';
        START_DATE      : Date   @Common.Label: 'Start Date';
        END_DATE        : Date   @Common.Label: 'End Date';
        STATUS          : String @Common.Label: 'Status';
}

entity ZEMP_CA_PAYMENT: managed {
    key REQUEST_ID          : String @mandatory @Common.Label: 'Pre Approval Request ID';
    key EMP_ID              : String @Common.Label: 'Employee ID';
    key DISBURSEMENT_DATE   : Date   @Common.Label: 'Disbursement Date';
        DISBURSEMENT_STATUS : Date   @Common.Label: 'Disbursement Status (Y/N)';        
}

entity ZPERDIEM_ENT: managed {
    key PERSONAL_GRADE_FROM     : String @mandatory @Common.Label: 'Personal Grade From';
    key PERSONAL_GRADE_TO       : String @mandatory @Common.Label: 'Personal Grade To';
    key LOCATION                : String @mandatory @Common.Label: 'Location';
    key EFFECTIVE_START_DATE    : Date   @Common.Label: 'Effective Start Date';
    key EFFECTIVE_END_DATE      : Date   @Common.Label: 'Effective End Date';
        CURRENCY                : String @Common.Label: 'Currency';
        AMOUNT                  : Decimal(7,2) @Common.Label: 'Amount';
}

entity ZHOUSING_LOAN_SCHEME: managed {
    key HOUSING_LOAN_SCHEME_ID      : String @mandatory @Common.Label: 'Housing Loan Scheme ID';
        HOUSING_LOAN_SCHEME_DESC    : String @Common.Label: 'Housing Loan Scheme Description';
        START_DATE                  : Date   @Common.Label: 'Start Date';
        END_DATE                    : Date   @Common.Label: 'End Date';
        STATUS                      : String @Common.Label: 'Status';        
}

entity ZLENDER_NAME: managed {
    key LENDER_ID   : String @mandatory @Common.Label: 'Lender ID';
        LENDER_NAME : String @Common.Label: 'Lender Name';
        START_DATE  : Date   @Common.Label: 'Start Date';
        END_DATE    : Date   @Common.Label: 'End Date';
        STATUS      : String @Common.Label: 'Status'; 
}


