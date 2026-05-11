namespace ECLAIM;

using {managed} from '@sap/cds/common';

entity ZEMP_MASTER : managed {
    key EEID                          : String        @mandatory;
        NAME                          : String        @Common.Label: 'Employee Name';
        GRADE                         : String        @Common.Label: 'Personal Grade';
        CC                            : String        @Common.Label: 'Cost Center';
        POS                           : String        @Common.Label: 'Position Number';
        DEP                           : String(10)    @Common.Label: 'Department';
        UNIT_SECTION                  : String(10)    @Common.Label: 'Unit ';
        B_PLACE                       : String        @Common.Label: 'Place Of Birth';
        MARITAL                       : String(2)     @Common.Label: 'Marital Status';
        JOB_GROUP                     : String(8)     @Common.Label: 'Job Group';
        OFFICE_LOCATION               : String(10)    @Common.Label: 'Office Location';
        ADDRESS_LINE1                 : String        @Common.Label: 'Address Line 1';
        ADDRESS_LINE2                 : String        @Common.Label: 'Address Line 2';
        ADDRESS_LINE3                 : String        @Common.Label: 'Address Line 3';
        POSTCODE                      : String        @Common.Label: 'Postcode';
        STATE                         : String(4)     @Common.Label: 'State';
        COUNTRY                       : String(3)     @Common.Label: 'Country';
        CONTACT_NO                    : String        @Common.Label: 'Contact No.';
        EMAIL                         : String        @Common.Label: 'Email';
        DIRECT_SUPPERIOR              : String        @Common.Label: 'Direct Supperior';
        ROLE                          : String(3)     @Common.Label: 'Role';
        USER_TYPE                     : String        @Common.Label: 'User Type';
        MEDICAL_INSURANCE_ENTITLEMENT : Decimal(7, 2) @Common.Label: 'Medical Insurance Entitlement';
        MOBILE_BILL_ELIGIBILITY       : String        @Common.Label: 'Mobile Phone Bill Eligibility';
        MOBILE_BILL_ELIG_AMOUNT       : Decimal(7, 2) @Common.Label: 'Mobile Phone Bill Eligible Amount Per Month';
        EMPLOYEE_TYPE                 : String        @Common.Label: 'Employee Type';
        POSITION_NAME                 : String        @Common.Label: 'Position Name';
        POSITION_START_DATE           : Date          @Common.Label: 'Position Start Date';
        POSITION_EVENT_REASON         : String        @Common.Label: 'Position Event Reason';
        CONFIRMATION_DATE             : Date          @Common.Label: 'Confirmation Date';
        EFFECTIVE_DATE                : Date          @Common.Label: 'Effective Date';
        UPDATED_DATE                  : Date          @Common.Label: 'Updated Date';
        INSERTED_DATE                 : Date          @Common.Label: 'Inserted Date';
        JOB_GRADE                     : String(3)     @Common.Label: 'Job Grade';
        DIVISION                      : String(3)     @Common.Label: 'Division';
        HIGHEST_EDU_LEVEL             : String(20)    @Common.Label: 'Highest Education Level';
        HIGHEST_EDU_COURSE            : String(30)    @Common.Label: 'Highest Education Course';
        UNIVERSITY_NAME               : String(30)    @Common.Label: 'University Name';
        HIRE_DATE                     : Date          @Common.Label: 'Hire Date';
        RETIREMENT_DATE               : Date          @Common.Label: 'Retirement Date';
        CONTRACT_END_DATE             : Date          @Common.Label: 'Contract End Date';
        AGE                           : String(5)     @Common.Label: 'Age';
        YEARS_IN_EPF                  : String(5)     @Common.Label: 'Years in EPF';
        SECTION_REGION                : String(10)    @Common.Label: 'Section Region';
        UNIT_BRANCH                   : String(10)    @Common.Label: 'Unit Branch';
        SUB_UNIT_BRANCH               : String(10)    @Common.Label: 'Sub Unit Branch';
        BUSINESS_PHONE                : String(15)    @Common.Label: 'Business Phone';
        ZREQUEST_HEADER               : Association to one ZREQUEST_HEADER
                                            on ZREQUEST_HEADER.EMP_ID = EEID;
        ZCOST_CENTER                  : Association to ZCOST_CENTER
                                            on ZCOST_CENTER.COST_CENTER_ID = CC;
        ZMARITAL_STAT                 : Association to ZMARITAL_STAT
                                            on ZMARITAL_STAT.MARRIAGE_STATUS_ID = MARITAL;
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
                                            and ZOFFICE_LOCATION.STATE_ID    = STATE;
        ZBRANCH                       : Association to ZBRANCH
                                            on ZBRANCH.BRANCH_ID = UNIT_SECTION;
}

entity ZREQUEST_HEADER : managed {
    key REQUEST_ID                    : String         @mandatory  @Common.Label: 'Request ID';
        EMP_ID                        : String         @Common.Label: 'Employee ID';
        REQUEST_TYPE_ID               : String         @Common.Label: 'Request Type';
        CLAIM_TYPE_ID                 : String         @Common.Label: 'Claim Type';
        OBJECTIVE_PURPOSE             : String         @Common.Label: 'Purpose';
        TRIP_START_DATE               : Date           @Common.Label: 'Trip Start Date';
        TRIP_END_DATE                 : Date           @Common.Label: 'Trip End Date';
        EVENT_START_DATE              : Date           @Common.Label: 'Event Start Date';
        EVENT_END_DATE                : Date           @Common.Label: 'Event End Date';
        APPROVED_DATE                 : Date           @Common.Label: 'Approved Date';
        REQUEST_DATE                  : Date           @Common.Label: 'Request Date';
        IND_OR_GROUP                  : String(4)      @Common.Label: 'Individual/Group';
        REMARK                        : String         @Common.Label: 'Remark';
        ALTERNATE_COST_CENTER         : String         @Common.Label: 'Alternate Cost Center';
        PREAPPROVAL_AMOUNT            : Decimal(16, 2) @Common.Label: 'Pre-Approval Amount';
        TOTAL_AMOUNT                  : Decimal(16, 2) @Common.Label: 'Total Amount';
        ATTACHMENT1                   : String         @Common.Label: 'Attachment 1';
        ATTACHMENT2                   : String         @Common.Label: 'Attachment 2';
        LOCATION                      : String         @Common.Label: 'Location';
        TYPE_OF_TRANSPORTATION        : String         @Common.Label: 'Type of Transportation';
        EVENT_FIELD1                  : String         @Common.Label: 'Event Field 1';
        EVENT_FIELD2                  : String         @Common.Label: 'Event Field 2';
        EVENT_FIELD3                  : String         @Common.Label: 'Event Field 3';
        EVENT_FIELD4                  : String         @Common.Label: 'Event Field 4';
        EVENT_FIELD5                  : String         @Common.Label: 'Event Field 5';
        STATUS                        : String         @Common.Label: 'Status';
        COST_CENTER                   : String         @Common.Label: 'Cost Center';
        CASH_ADVANCE                  : Decimal(16, 2);
        CASH_ADVANCE_DATE             : Date;
        LAST_APPROVED_DATE            : Date           @Common.Label: 'Last Approved Date';
        LAST_APPROVED_TIME            : Time           @Common.Label: 'Last Approved Time';
        TRAVEL_ALONE_FAMILY           : String(2)      @Common.Label: 'Travel (Sendirian/With Family)';
        TRAVEL_FAMILY_NOW_LATER       : String(2)      @Common.Label: 'With Family Now or Later?';
        REJECT_REASON_ID              : String(3)      @Common.Label: 'Reject Reason ID';
        REJECT_REASON_DATE            : Date           @Common.Label: 'Reject Reason Date';
        REJECT_REASON_TIME            : Time           @Common.Label: 'Reject Reason Time';
        APPROVER1                     : String(6)      @Common.Label: 'Approver 1';
        APPROVER2                     : String(6)      @Common.Label: 'Approver 2';
        APPROVER3                     : String(6)      @Common.Label: 'Approver 3';
        APPROVER4                     : String(6)      @Common.Label: 'Approver 4';
        APPROVER5                     : String(6)      @Common.Label: 'Approver 5';
        LAST_MODIFIED_DATE            : Date           @Common.Label: 'Last Modified Date';
        SUBMITTED_DATE                : Date           @Common.Label: 'Submitted Date';
        TRANSFER_MODE_ID              : String(2)      @Common.Label: 'Transfer Mode ID';
        PROJECT_CODE                  : String         @Common.Label: 'Project Code';
        LAST_PUSH_BACK_DATE           : Date           @Common.Label: 'Last Push Back Date';
        LAST_PUSH_BACK_TIME           : Time           @Common.Label: 'Last Push Back Time';
        PUSH_BACK_REASON_ID           : String(3)      @Common.Label: 'Push Back Reason ID';
        ZREQUEST_ITEM                 : Composition of many ZREQUEST_ITEM
                                            on ZREQUEST_ITEM.REQUEST_ID = REQUEST_ID;
        ZREQUEST_TYPE                 : Association to one ZREQUEST_TYPE
                                            on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZSTATUS                       : Association to one ZSTATUS
                                            on ZSTATUS.STATUS_ID = STATUS;
        ZCOST_CENTER                  : Association to one ZCOST_CENTER
                                            on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZEMP_MASTER                   : Association to one ZEMP_MASTER
                                            on ZEMP_MASTER.EEID = EMP_ID;
        ZINDIV_GROUP                  : Association to ZINDIV_GROUP
                                            on ZINDIV_GROUP.IND_OR_GROUP_ID = IND_OR_GROUP;
        COSTCENTER                    : Association to ZCOST_CENTER
                                            on COSTCENTER.COST_CENTER_ID = ALTERNATE_COST_CENTER;
        ZCLAIM_HEADER                 : Association to ZCLAIM_HEADER
                                            on ZCLAIM_HEADER.REQUEST_ID = REQUEST_ID;
        ZREJECT_REASON                : Association to ZREJECT_REASON
                                            on ZREJECT_REASON.REASON_ID = REJECT_REASON_ID;
        ZSENDBACK_REASON              : Association to ZREJECT_REASON
                                            on ZSENDBACK_REASON.REASON_ID = PUSH_BACK_REASON_ID;
        ZCLAIM_TYPE                   : Association to one ZCLAIM_TYPE
                                            on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZAPPROVER_DETAILS_PREAPPROVAL : Composition of many ZAPPROVER_DETAILS_PREAPPROVAL
                                            on ZAPPROVER_DETAILS_PREAPPROVAL.PREAPPROVAL_ID = REQUEST_ID;
        ZTRANSFER_MODE                : Association to ZTRANSFER_MODE
                                            on ZTRANSFER_MODE.TRANSFER_MODE_ID = TRANSFER_MODE_ID;
        ZPROJECT_HDR                  : Association to ZPROJECT_HDR
                                            on ZPROJECT_HDR.PROJECT_CODE_IO = PROJECT_CODE;
        ZFAMILY_TIMING                : Association to ZFAMILY_TIMING
                                            on ZFAMILY_TIMING.FAMILY_TIMING_ID = TRAVEL_FAMILY_NOW_LATER;
        ZTRAVEL_TYPE                  : Association to ZTRAVEL_TYPE
                                            on ZTRAVEL_TYPE.TRAVEL_TYPE_ID = TRAVEL_ALONE_FAMILY
}

entity ZREQUEST_ITEM : managed {
    key REQUEST_ID                 : String         @mandatory  @Common.Label: 'Pre-Approval ID';
    key REQUEST_SUB_ID             : String         @mandatory  @Common.Label: 'Pre-Approval Sub ID';
        EMP_ID                     : String         @Common.Label: 'Employee ID';
        CLAIM_TYPE_ITEM_ID         : String         @Common.Label: 'Claim Item';
        CLAIM_TYPE_ID              : String         @Common.Label: 'Claim Type';
        EST_AMOUNT                 : Decimal(16, 2) @Common.Label: 'Estimated Amount';
        EST_NO_PARTICIPANT         : Integer        @Common.Label: 'Estimated Number of Participant';
        CASH_ADVANCE               : Boolean        @Common.Label: 'Cash Advance (Yes/No)';
        START_DATE                 : Date           @Common.Label: 'Start Date';
        END_DATE                   : Date           @Common.Label: 'End Date';
        REMARK                     : String         @Common.Label: 'Remark';
        SEND_TO_SF                 : Boolean        @Common.Label: 'Send to SF';
        LOCATION                   : String         @Common.Label: 'Location';
        DECLARE_CLUB_MEMBERSHIP    : Boolean        @Common.Label: 'Declare Club Membership';
        KWSP_SPORTS_REPRESENTATION : String(2)      @Common.Label: 'KWSP Sports Representation';
        SPORTS_CLAIM_DISCLAIMER    : Boolean        @Common.Label: 'Sports Claim Disclaimer';
        VEHICLE_OWNERSHIP_ID       : String(2)      @Common.Label: 'Vehicle Ownership ID';
        MODE_OF_TRANSFER           : String(2)      @Common.Label: 'Mode of Transfer';
        TRANSFER_DATE              : Date           @Common.Label: 'Transfer Date';
        NO_OF_DAYS                 : Integer        @Common.Label: 'Number of Days';
        MARRIAGE_CATEGORY          : String(2)      @Common.Label: 'Marriage Category';
        FAMILY_COUNT               : Integer        @Common.Label: 'Family Count';
        COST_CENTER                : String         @Common.Label: 'Cost Center';
        GL_ACCOUNT                 : String(6)      @Common.Label: 'GL Account';
        MATERIAL_CODE              : String         @Common.Label: 'Material Code';
        COURSE_TITLE               : String         @Common.Label: 'Course Title';
        ATTACHMENT1                : String         @Common.Label: 'Attachment 1';
        ATTACHMENT2                : String         @Common.Label: 'Attachment 2';
        PURPOSE                    : String         @Common.Label: 'Purpose';
        MOBILE_CATEGORY_PURPOSE_ID : String(2)      @Common.Label: 'Category/Purpose (Mobile)';
        KILOMETER                  : Decimal(6, 2)  @Common.Label: 'Kilometer';
        RATE_PER_KM                : String(10)     @Common.Label: 'Rate Per Kilometer';
        FLIGHT_CLASS               : String         @Common.Label: 'Flight Class';
        LOCATION_TYPE              : String(6)      @Common.Label: 'Location Type';
        COUNTRY                    : String(3)      @Common.Label: 'Country';
        FROM_STATE_ID              : String(4)      @Common.Label: 'From State'; //office distance
        TO_STATE_ID                : String(4)      @Common.Label: 'To State'; //office distance
        TO_LOCATION                : String         @Common.Label: 'To Location'; //free text
        TO_LOCATION_OFFICE         : String(10)     @Common.Label: 'To Location (Office)'; //office distance
        FROM_LOCATION              : String         @Common.Label: 'From Location'; //free text
        FROM_LOCATION_OFFICE       : String(10)     @Common.Label: 'From Location (Office)'; //office distance
        TOLL                       : Decimal(16, 2) @Common.Label: 'Toll';
        VEHICLE_TYPE               : String(2)      @Common.Label: 'Vehicle Type';
        DEPARTURE_TIME             : Timestamp      @Common.Label: 'Departure Time';
        ARRIVAL_TIME               : Timestamp      @Common.Label: 'Arrival Time';
        REGION                     : String(2)      @Common.Label: 'Region';
        ROOM_TYPE                  : String(2)      @Common.Label: 'Room Type';
        LODGING_CATEGORY           : String(2)      @Common.Label: 'Lodging Category';
        AREA                       : String(6)      @Common.Label: 'Area';
        START_TIME                 : Time           @Common.Label: 'Start Time';
        END_TIME                   : Time           @Common.Label: 'End Time';
        DEPENDENT                  : String         @Common.Label: 'Dependent';
        METER_CUBE_ENTITLED        : Decimal(6, 2)  @Common.Label: 'Meter Cube (Entitled)';
        METER_CUBE_ACTUAL          : Decimal(6, 2)  @Common.Label: 'Meter Cube (Actual)';
        FARE_TYPE_ID               : String(2)      @Common.Label: 'Fare Type ID';
        VEHICLE_CLASS_ID           : String(2)      @Common.Label: 'Vehicle Class ID';
        TRIP_START_DATE            : Date           @Common.Label: 'Trip Start Date';
        TRIP_END_DATE              : Date           @Common.Label: 'Trip End Date';
        TRIP_START_TIME            : Time           @Common.Label: 'Trip Start Time ';
        TRIP_END_TIME              : Time           @Common.Label: 'Trip End Time';
        TRAVEL_DURATION_DAY        : Decimal(3, 1)  @Common.Label: 'Travel Duration Day';
        TRAVEL_DURATION_HOUR       : Decimal(4, 1)  @Common.Label: 'Travel Duration Hour';
        ENTITLED_BREAKFAST         : Integer        @Common.Label: 'Entitled Breakfast';
        ENTITLED_LUNCH             : Integer        @Common.Label: 'Entitled Lunch';
        ENTITLED_DINNER            : Integer        @Common.Label: 'Entitled Dinner';
        DAILY_ALLOWANCE            : Integer        @Common.Label: 'Daily Allowance';
        CURRENCY_CODE              : String         @Common.Label: 'Currency Code';
        CURRENCY_RATE              : Decimal(6, 2)  @Common.Label: 'Currency Rate';
        TYPE_OF_PROFESSIONAL_BODY  : String(3)      @Common.Label: 'Type of Professional Body';
        TOTAL_TRAVELLER            : Integer        @Common.Label: 'Total Traveller';
        ROUND_TRIP                 : Boolean        @Common.Label: 'Round Trip';
        ZREQUEST_HEADER            : Association to one ZREQUEST_HEADER
                                         on ZREQUEST_HEADER.REQUEST_ID = REQUEST_ID;
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
                                         and ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID      = CLAIM_TYPE_ID;
        ZMOBILE_CATEGORY_PURPOSE   : Association to ZMOBILE_CATEGORY_PURPOSE
                                         on ZMOBILE_CATEGORY_PURPOSE.MOBILE_CATEGORY_PURPOSE_ID = MOBILE_CATEGORY_PURPOSE_ID;
        ZFLIGHT_CLASS              : Association to ZFLIGHT_CLASS
                                         on ZFLIGHT_CLASS.FLIGHT_CLASS_ID = FLIGHT_CLASS;
        ZLOC_TYPE                  : Association to ZLOC_TYPE
                                         on ZLOC_TYPE.LOC_TYPE_ID = LOCATION_TYPE;
        ZSTATE                     : Association to ZSTATE
                                         on  ZSTATE.COUNTRY_ID = COUNTRY
                                         and ZSTATE.STATE_ID   = FROM_STATE_ID;
        ZTOSTATE                   : Association to ZSTATE
                                         on  ZTOSTATE.COUNTRY_ID = COUNTRY
                                         and ZTOSTATE.STATE_ID   = TO_STATE_ID;
        ZCOUNTRY                   : Association to ZCOUNTRY
                                         on ZCOUNTRY.COUNTRY_ID = COUNTRY;
        ZOFFICE_DISTANCE           : Association to ZOFFICE_DISTANCE
                                         on  ZOFFICE_DISTANCE.FROM_LOCATION_ID = FROM_LOCATION_OFFICE
                                         and ZOFFICE_DISTANCE.FROM_STATE_ID    = FROM_STATE_ID
                                         and ZOFFICE_DISTANCE.TO_LOCATION_ID   = TO_LOCATION_OFFICE
                                         and ZOFFICE_DISTANCE.TO_STATE_ID      = TO_STATE_ID;
        ZVEHICLE_TYPE              : Association to one ZVEHICLE_TYPE
                                         on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE;
        ZREGION                    : Association to ZREGION
                                         on ZREGION.REGION_ID = REGION;
        ZROOM_TYPE                 : Association to ZROOM_TYPE
                                         on ZROOM_TYPE.ROOM_TYPE_ID = ROOM_TYPE;
        ZLODGING_CAT               : Association to ZLODGING_CAT
                                         on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY;
        ZAREA                      : Association to one ZAREA
                                         on ZAREA.AREA_ID = AREA;
        ZEMP_DEPENDENT             : Association to ZEMP_DEPENDENT
                                         on ZEMP_DEPENDENT.DEPENDENT_NO = DEPENDENT;
        ZSPORTS_REPRESENTATION     : Association to ZSPORTS_REPRESENTATION
                                         on ZSPORTS_REPRESENTATION.SPORTS_REPRESENTATION_ID = KWSP_SPORTS_REPRESENTATION;
        ZFARE_TYPE                 : Association to ZFARE_TYPE
                                         on ZFARE_TYPE.FARE_TYPE_ID = FARE_TYPE_ID;
        ZVEHICLE_CLASS             : Association to ZVEHICLE_CLASS
                                         on ZVEHICLE_CLASS.VEHICLE_CLASS_ID = VEHICLE_CLASS_ID;
        ZGL_ACCOUNT                : Association to ZGL_ACCOUNT
                                         on ZGL_ACCOUNT.GL_ACCOUNT_ID = GL_ACCOUNT;
        ZTRANSFER_MODE             : Association to ZTRANSFER_MODE
                                         on ZTRANSFER_MODE.TRANSFER_MODE_ID = MODE_OF_TRANSFER;
        ZCURRENCY                  : Association to ZCURRENCY
                                         on ZCURRENCY.CURRENCY_ID = CURRENCY_CODE;
        ZPROFESIONAL_BODY          : Association to ZPROFESIONAL_BODY
                                         on ZPROFESIONAL_BODY.PROFESIONAL_BODY_ID = TYPE_OF_PROFESSIONAL_BODY;
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
    key REQUEST_TYPE_ID   : String     @mandatory  @Common.Label: 'Request Type ID';
        REQUEST_TYPE_DESC : String     @Common.Label: 'Request Type Description';
        END_DATE          : Date       @Common.Label: 'End Date';
        START_DATE        : Date       @Common.Label: 'Start Date';
        STATUS            : String(10) @Common.Label: 'Status';
}

entity ZCLAIM_TYPE : managed {
    key CLAIM_TYPE_ID    : String     @mandatory  @Common.Label: 'Claim Type ID';
        CLAIM_TYPE_DESC  : String     @Common.Label    : 'Claim Type Description';
        GL_ACCOUNT       : String     @Common.Label    : 'GL Account';
        START_DATE       : Date       @Common.Label    : 'Start Date';
        END_DATE         : Date       @Common.Label    : 'End Date';
        STATUS           : String(10) @Common.Label    : 'Status';
        REQUEST_TYPE     : String     @Common.Label    : 'Request Type';
        IND_OR_GROUP     : String(4)  @Common.Label    : 'Individual/Group';
        PROJECT_CLAIM    : Boolean    @Common.Label    : 'Project Claim';
        COST_CENTER      : String(9)  @Common.Label    : 'Cost Center';
        ZCLAIM_TYPE_ITEM : Composition of many ZCLAIM_TYPE_ITEM
                               on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID = CLAIM_TYPE_ID
                                      @assert.integrity: false;
        ZREQUEST_TYPE    : Association to ZREQUEST_TYPE
                               on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE;
        ZINDIV_GROUP     : Association to ZINDIV_GROUP
                               on ZINDIV_GROUP.IND_OR_GROUP_ID = IND_OR_GROUP;
        ZCOST_CENTER     : Association to ZCOST_CENTER
                               on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZGL_ACCOUNT      : Association to ZGL_ACCOUNT
                               on ZGL_ACCOUNT.GL_ACCOUNT_ID = GL_ACCOUNT;

}

entity ZNUM_RANGE : managed {
    key RANGE_ID   : String  @mandatory  @Common.Label: 'RANGE_ID';
        PREFIX     : String  @mandatory  @Common.Label: 'PREFIX';
        RANGE_DESC : String  @Common.Label: 'RANGE_DESC';
        ![FROM]    : String  @Common.Label: 'FROM';
        TO         : String  @Common.Label: 'TO';
        CURRENT    : String  @Common.Label: 'CURRENT';
}

entity ZCLAIM_HEADER : managed {
    key CLAIM_ID                       : String         @mandatory  @Common.Label: 'Claim ID';
        EMP_ID                         : String         @Common.Label: 'Employee ID';
        PURPOSE                        : String         @Common.Label: 'Purpose';
        TRIP_START_DATE                : Date           @Common.Label: 'Trip Start Date';
        TRIP_END_DATE                  : Date           @Common.Label: 'Trip End Date';
        EVENT_START_DATE               : Date           @Common.Label: 'Event Start Date';
        EVENT_END_DATE                 : Date           @Common.Label: 'Event End Date';
        SUBMISSION_TYPE                : String         @Common.Label: 'Submission Type';
        COMMENT                        : String         @Common.Label: 'Comment';
        ALTERNATE_COST_CENTER          : String         @Common.Label: 'Alternate Cost Center';
        COST_CENTER                    : String         @Common.Label: 'Cost Center';
        REQUEST_ID                     : String         @Common.Label: 'Request ID';
        ATTACHMENT_EMAIL_APPROVER      : String         @Common.Label: 'Attachment Email Approver';
        STATUS_ID                      : String         @Common.Label: 'Status ID';
        CLAIM_TYPE_ID                  : String         @Common.Label: 'Claim Type ID';
        TOTAL_CLAIM_AMOUNT             : Decimal(16, 2) @Common.Label: 'Total Claim Amount';
        PREAPPROVED_AMOUNT             : Decimal(16, 2) @Common.Label: 'Pre-Approved Amount';
        CASH_ADVANCE_AMOUNT            : Decimal(16, 2) @Common.Label: 'Cash Advance Amount';
        FINAL_AMOUNT_TO_RECEIVE        : Decimal(16, 2) @Common.Label: 'Final Amount to Recevie';
        LAST_MODIFIED_DATE             : Date           @Common.Label: 'Last Modified Date';
        SUBMITTED_DATE                 : Date           @Common.Label: 'Submitted Date';
        LAST_APPROVED_DATE             : Date           @Common.Label: 'Last Approved Date';
        LAST_APPROVED_TIME             : Time           @Common.Label: 'Last Approved Time';
        REJECT_REASON_ID               : String(3)      @Common.Label: 'Reject Reason ID';
        REJECT_REASON_DATE             : Date           @Common.Label: 'Reject Reason Date';
        REJECT_REASON_TIME             : Time           @Common.Label: 'Reject Reason Time';
        PAYMENT_DATE                   : Date           @Common.Label: 'Payment Date';
        LOCATION                       : String         @Common.Label: 'Location';
        SPOUSE_OFFICE_ADDRESS          : String         @Common.Label: 'Spouse Office Address';
        HOUSE_COMPLETION_DATE          : Date           @Common.Label: 'House Completion Date';
        MOVE_IN_DATE                   : Date           @Common.Label: 'Move In Date';
        HOUSING_LOAN_SCHEME            : String(2)      @Common.Label: 'Housing Loan Scheme';
        LENDER_NAME                    : String(2)      @Common.Label: 'Lender Name';
        SPECIFY_DETAILS                : String         @Common.Label: 'Specify Details';
        NEW_HOUSE_ADDRESS              : String         @Common.Label: 'New House Address';
        DIST_OLD_HOUSE_TO_OFFICE_KM    : Decimal        @Common.Label: 'Distance Old House to Office (KM)';
        DIST_OLD_HOUSE_TO_NEW_HOUSE_KM : Decimal        @Common.Label: 'Distance Old House to New House (KM)';
        PROJECT_CODE                   : String         @Common.Label: 'Project Code';
        COURSE_CODE                    : String         @Common.Label: 'Course Code';
        APPROVER1                      : String(6)      @Common.Label: 'Approver 1';
        APPROVER2                      : String(6)      @Common.Label: 'Approver 2';
        APPROVER3                      : String(6)      @Common.Label: 'Approver 3';
        APPROVER4                      : String(6)      @Common.Label: 'Approver 4';
        APPROVER5                      : String(6)      @Common.Label: 'Approver 5';
        SESSION_NUMBER                 : String(15)     @Common.Label: 'Session Number';
        MODE_OF_TRANSFER               : String(2)      @Common.Label: 'Mode of Transfer';
        TRAVEL_ALONE_FAMILY            : String(1)      @Common.Label: 'Travel (Alone/With Family) ';
        TRAVEL_FAMILY_NOW_LATER        : String(2)      @Common.Label: 'With Family Now or Later?';
        LAST_PUSH_BACK_DATE            : Date           @Common.Label: 'Last Push Back Date';
        LAST_PUSH_BACK_TIME            : Time           @Common.Label: 'Last Push Back Time';
        PUSH_BACK_REASON_ID            : String(3)      @Common.Label: 'Push Back Reason ID';
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
                                             and ZTRAIN_COURSE_PART.SESSION_NUMBER = SESSION_NUMBER;
        ZREJECT_REASON                 : Association to ZREJECT_REASON
                                             on ZREJECT_REASON.REASON_ID = REJECT_REASON_ID;
        ZSENDBACK_REASON               : Association to ZREJECT_REASON
                                             on ZSENDBACK_REASON.REASON_ID = PUSH_BACK_REASON_ID;
        ZAPPROVER_DETAILS_CLAIMS       : Composition of many ZAPPROVER_DETAILS_CLAIMS
                                             on ZAPPROVER_DETAILS_CLAIMS.CLAIM_ID = CLAIM_ID;
        ZHOUSING_LOAN_SCHEME           : Association to ZHOUSING_LOAN_SCHEME
                                             on ZHOUSING_LOAN_SCHEME.HOUSING_LOAN_SCHEME_ID = HOUSING_LOAN_SCHEME;
        ZTRANSFER_MODE                 : Association to ZTRANSFER_MODE
                                             on ZTRANSFER_MODE.TRANSFER_MODE_ID = MODE_OF_TRANSFER;
        ZTRAVEL_TYPE                   : Association to ZTRAVEL_TYPE
                                             on ZTRAVEL_TYPE.TRAVEL_TYPE_ID = TRAVEL_ALONE_FAMILY;
        ZFAMILY_TIMING                 : Association to ZFAMILY_TIMING
                                             on ZFAMILY_TIMING.FAMILY_TIMING_ID = TRAVEL_FAMILY_NOW_LATER;
}

entity ZCLAIM_ITEM : managed {
    key CLAIM_ID                   : String         @mandatory  @Common.Label: 'Claim ID';
    key CLAIM_SUB_ID               : String         @mandatory  @Common.Label: 'Claim Sub ID';
        EMP_ID                     : String         @Common.Label: 'Employee ID';
        CLAIM_TYPE_ID              : String         @Common.Label: 'Claim Type ID';
        CLAIM_TYPE_ITEM_ID         : String         @Common.Label: 'Claim Type Item ID';
        PERCENTAGE_COMPENSATION    : Decimal(5, 2)  @Common.Label: '% Compensation';
        ACCOUNT_NO                 : String(255)    @Common.Label: 'Account No';
        AMOUNT                     : Decimal(16, 2) @Common.Label: 'Amount';
        ATTACHMENT_FILE_1          : String         @Common.Label: 'Attachment 1';
        ATTACHMENT_FILE_2          : String         @Common.Label: 'Attachment 2';
        BILL_NO                    : String         @Common.Label: 'Bill No';
        BILL_DATE                  : Date           @Common.Label: 'Bill Date';
        CLAIM_CATEGORY             : String         @Common.Label: 'Claim Category';
        COUNTRY                    : String(3)      @Common.Label: 'Country';
        DISCLAIMER                 : Boolean        @Common.Label: 'Disclaimer: - installment, entertainment subs, games, roaming, storage, any other personal usage';
        START_DATE                 : Date           @Common.Label: 'Start Date';
        END_DATE                   : Date           @Common.Label: 'End Date';
        START_TIME                 : Time           @Common.Label: 'Start Time';
        END_TIME                   : Time           @Common.Label: 'End Time';
        FLIGHT_CLASS               : String         @Common.Label: 'Flight Class';
        FROM_LOCATION              : String         @Common.Label: 'From Location'; //free text
        FROM_LOCATION_OFFICE       : String(10)     @Common.Label: 'From Location Office'; //office distance
        KM                         : Decimal(6, 2)  @Common.Label: 'Kilometer';
        LOCATION                   : String         @Common.Label: 'Location';
        LOCATION_TYPE              : String(6)      @Common.Label: 'Location Type';
        ROUND_TRIP                 : Boolean        @Common.Label: 'Round Trip';
        LODGING_CATEGORY           : String(2)      @Common.Label: 'Lodging Category';
        LODGING_ADDRESS            : String         @Common.Label: 'Lodging Address';
        MARRIAGE_CATEGORY          : String(2)      @Common.Label: 'Marriage Category';
        AREA                       : String(6)      @Common.Label: 'Area';
        NO_OF_FAMILY_MEMBER        : Integer        @Common.Label: 'Number of Family Member';
        PARKING                    : Decimal        @Common.Label: 'Parking';
        PHONE_NO                   : String         @Common.Label: 'Phone No';
        RATE_PER_KM                : String(10)     @Common.Label: 'Rate per Kilometer';
        RECEIPT_DATE               : Date           @Common.Label: 'Receipt Date';
        RECEIPT_NUMBER             : String         @Common.Label: 'Receipt Number';
        REMARK                     : String         @Common.Label: 'Remark';
        ROOM_TYPE                  : String(2)      @Common.Label: 'Room Type';
        REGION                     : String(2)      @Common.Label: 'Semenanjung Or Sabah Sarawak';
        FROM_STATE_ID              : String(4)      @Common.Label: 'From State ID'; //office distance
        TO_STATE_ID                : String(4)      @Common.Label: 'To State ID'; //office distance
        TO_LOCATION                : String         @Common.Label: 'To Location'; //free text
        TO_LOCATION_OFFICE         : String(10)     @Common.Label: 'To Location Office'; //office distance
        TOLL                       : Decimal(16, 2) @Common.Label: 'Toll';
        TOTAL_EXP_AMOUNT           : Decimal(16, 2) @Common.Label: 'Total Expenses Amount';
        VEHICLE_TYPE               : String(2)      @Common.Label: 'Vehicle Type';
        VEHICLE_FARE               : Boolean        @Common.Label: 'Vehicle (Tambang)';
        TRIP_START_DATE            : Date           @Common.Label: 'Trip Start Date';
        TRIP_START_TIME            : Time           @Common.Label: 'Trip Start Time';
        TRIP_END_DATE              : Date           @Common.Label: 'Trip End Date';
        TRIP_END_TIME              : Time           @Common.Label: 'Trip End Time';
        EVENT_START_DATE           : Date           @Common.Label: 'Event Start Date';
        EVENT_END_DATE             : Date           @Common.Label: 'Event End Date';
        TRAVEL_DURATION_DAY        : Decimal(3, 1)  @Common.Label: 'Travel Duration (Days)';
        TRAVEL_DURATION_HOUR       : Decimal(4, 1)  @Common.Label: 'Travel Duration (Hour)';
        PROVIDED_BREAKFAST         : String         @Common.Label: 'Provided Breakfast';
        PROVIDED_LUNCH             : String         @Common.Label: 'Provided Lunch';
        PROVIDED_DINNER            : String         @Common.Label: 'Provided Dinner';
        ENTITLED_BREAKFAST         : String         @Common.Label: 'Entitled Breakfast';
        ENTITLED_LUNCH             : String         @Common.Label: 'Entitled Lunch';
        ENTITLED_DINNER            : String         @Common.Label: 'Entitled Dinner';
        ANGGOTA_ID                 : String         @Common.Label: 'Anggota ID';
        ANGGOTA_NAME               : String         @Common.Label: 'Anggota Name';
        DEPENDENT_NAME             : String         @Common.Label: 'Depedent Name';
        TYPE_OF_PROFESSIONAL_BODY  : String(3)      @Common.Label: 'Type of Professional Body';
        DISCLAIMER_GALAKAN         : Boolean        @Common.Label: 'Disclaimer: Dengan kelulusan ini, saya megesahkan tuntutan elaun galakan sijil profesional ini adalah berkaitan dengan bidang tugas anggota.';
        VEHICLE_OWNERSHIP_ID       : String(2)      @Common.Label: 'Vehicle Ownership ID (Sendiri/Pejabat)';
        MODE_OF_TRANSFER           : String(2)      @Common.Label: 'Mode of Transfer';
        TRANSFER_DATE              : Date           @Common.Label: 'Tarikh Pindah';
        NO_OF_DAYS                 : Integer        @Common.Label: 'Number of Days';
        FAMILY_COUNT               : Integer        @Common.Label: 'Number of Family Member (Per Head)';
        FUNERAL_TRANSPORTATION     : String(2)      @Common.Label: 'Kemudahan Membawa Jenazah';
        COST_CENTER                : String         @Common.Label: 'Cost Center';
        GL_ACCOUNT                 : String(6)      @Common.Label: 'GL Account';
        MATERIAL_CODE              : String         @Common.Label: 'Material Code';
        COURSE_TITLE               : String         @Common.Label: 'Course Title';
        PURPOSE                    : String         @Common.Label: 'Purpose';
        MOBILE_CATEGORY_PURPOSE_ID : String(2)      @Common.Label: 'Category/Purpose (Mobile)';
        STUDY_LEVELS_ID            : String(2)      @Common.Label: 'Level of Studies';
        ACTUAL_AMOUNT              : Decimal(16, 2) @Common.Label: 'Actual Amount';
        FARE_TYPE_ID               : String(2)      @Common.Label: 'Type of Fare';
        VEHICLE_CLASS_ID           : String(2)      @Common.Label: 'Vehicle Class';
        NEED_FOREIGN_CURRENCY      : Boolean        @Common.Label: 'Need Foreign Currency?';
        CURRENCY_CODE              : String         @Common.Label: 'Currency Code';
        CURRENCY_RATE              : Decimal(16, 4) @Common.Label: 'Currency Rate';
        CURRENCY_AMOUNT            : Decimal(16, 2) @Common.Label: 'Currency Amount';
        REQUEST_APPROVAL_AMOUNT    : Decimal(16, 2) @Common.Label: 'Request Approved Amount';
        DEPARTURE_TIME             : Timestamp      @Common.Label: 'Departure Time';
        ARRIVAL_TIME               : Timestamp      @Common.Label: 'Arrival Time';
        DEPENDENT                  : String         @Common.Label: 'Dependent';
        POLICY_NUMBER              : String         @Common.Label: 'Policy Number';
        INSURANCE_PROVIDER_ID      : String(3)      @Common.Label: 'ID Pembekal Insuran';
        INSURANCE_PROVIDER_NAME    : String         @Common.Label: 'Name Pembekal Insuran';
        INSURANCE_PACKAGE_ID       : String(2)      @Common.Label: 'Insurance Package';
        INSURANCE_PURCHASE_DATE    : Date           @Common.Label: 'Date of Purchase of Insurance';
        INSURANCE_CERT_START_DATE  : Date           @Common.Label: 'Insurance Period of Certificate Start Date';
        INSURANCE_CERT_END_DATE    : Date           @Common.Label: 'Insurance Period of Certificate End Date';
        TRAVEL_DAYS_ID             : String(2)      @Common.Label: 'Number of Days Category (Travel Insurance)';
        METER_CUBE_ENTITLED        : Decimal(6, 2)  @Common.Label: 'Meter Cube (Entitled)';
        METER_CUBE_ACTUAL          : Decimal(6, 2)  @Common.Label: 'Meter Cube (Actual)';
        DAILY_ALLOWANCE            : Integer        @Common.Label: 'Daily Allowance';
        TIPS                       : Integer        @Common.Label: 'Tips';
        EXCLUDE_TIPS               : Boolean        @Common.Label: 'Exclude Tips';
        TOTAL_TRAVELLER            : Integer        @Common.Label: 'Total Traveller';
        ZCLAIM_HEADER              : Association to ZCLAIM_HEADER
                                         on ZCLAIM_HEADER.CLAIM_ID = CLAIM_ID;
        ZCLAIM_CATEGORY            : Association to ZCLAIM_CATEGORY
                                         on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CLAIM_CATEGORY;
        ZLODGING_CAT               : Association to ZLODGING_CAT
                                         on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY;
        ZCLAIM_TYPE_ITEM           : Association to one ZCLAIM_TYPE_ITEM
                                         on  ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID
                                         and ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID      = CLAIM_TYPE_ID;
        ZVEHICLE_TYPE              : Association to one ZVEHICLE_TYPE
                                         on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE;
        ZROOM_TYPE                 : Association to one ZROOM_TYPE
                                         on ZROOM_TYPE.ROOM_TYPE_ID = ROOM_TYPE;
        ZFLIGHT_CLASS              : Association to one ZFLIGHT_CLASS
                                         on ZFLIGHT_CLASS.FLIGHT_CLASS_ID = FLIGHT_CLASS;
        ZREGION                    : Association to one ZREGION
                                         on ZREGION.REGION_ID = REGION;
        ZAREA                      : Association to one ZAREA
                                         on ZAREA.AREA_ID = AREA;
        ZMARITAL_CAT               : Association to one ZMARITAL_CAT
                                         on ZMARITAL_CAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZLOC_TYPE                  : Association to one ZLOC_TYPE
                                         on ZLOC_TYPE.LOC_TYPE_ID = LOCATION_TYPE;
        ZCOUNTRY                   : Association to ZCOUNTRY
                                         on ZCOUNTRY.COUNTRY_ID = COUNTRY;
        ZOFFICE_DISTANCE           : Association to ZOFFICE_DISTANCE
                                         on  ZOFFICE_DISTANCE.FROM_LOCATION_ID = FROM_LOCATION_OFFICE
                                         and ZOFFICE_DISTANCE.FROM_STATE_ID    = FROM_STATE_ID
                                         and ZOFFICE_DISTANCE.TO_LOCATION_ID   = TO_LOCATION_OFFICE
                                         and ZOFFICE_DISTANCE.TO_STATE_ID      = TO_STATE_ID;
        ZCOSTCENTER                : Association to ZCOST_CENTER
                                         on ZCOSTCENTER.COST_CENTER_ID = COST_CENTER;
        ZSTATE                     : Association to ZSTATE
                                         on  ZSTATE.COUNTRY_ID = COUNTRY
                                         and ZSTATE.STATE_ID   = FROM_STATE_ID;
        ZTOSTATE                   : Association to ZSTATE
                                         on  ZTOSTATE.COUNTRY_ID = COUNTRY
                                         and ZTOSTATE.STATE_ID   = TO_STATE_ID;
        ZVEHICLE_OWNERSHIP         : Association to one ZVEHICLE_OWNERSHIP
                                         on ZVEHICLE_OWNERSHIP.VEHICLE_OWNERSHIP_ID = VEHICLE_OWNERSHIP_ID;
        ZMOBILE_CATEGORY_PURPOSE   : Association to ZMOBILE_CATEGORY_PURPOSE
                                         on ZMOBILE_CATEGORY_PURPOSE.MOBILE_CATEGORY_PURPOSE_ID = MOBILE_CATEGORY_PURPOSE_ID;
        ZSTUDY_LEVELS              : Association to ZSTUDY_LEVELS
                                         on ZSTUDY_LEVELS.STUDY_LEVELS_ID = STUDY_LEVELS_ID;
        ZVEHICLE_CLASS             : Association to ZVEHICLE_CLASS
                                         on ZVEHICLE_CLASS.VEHICLE_CLASS_ID = VEHICLE_CLASS_ID;
        ZINSURANCE_PROVIDER        : Association to ZINSURANCE_PROVIDER
                                         on ZINSURANCE_PROVIDER.INSURANCE_PROVIDER_ID = INSURANCE_PROVIDER_ID;
        ZINSURANCE_PACKAGE         : Association to ZINSURANCE_PACKAGE
                                         on ZINSURANCE_PACKAGE.INSURANCE_PACKAGE_ID = INSURANCE_PACKAGE_ID;
        ZCLAIM_TYPE                : Association to ZCLAIM_TYPE
                                         on ZCLAIM_TYPE.CLAIM_TYPE_ID = CLAIM_TYPE_ID;
        ZTRAVEL_DAYS               : Association to ZTRAVEL_DAYS
                                         on ZTRAVEL_DAYS.TRAVEL_DAYS_ID = TRAVEL_DAYS_ID;
        ZEMP_MASTER                : Association to one ZEMP_MASTER
                                         on ZEMP_MASTER.EEID = EMP_ID;
        ZEMP_DEPENDENT             : Association to ZEMP_DEPENDENT
                                         on ZEMP_DEPENDENT.DEPENDENT_NO = DEPENDENT;
        ZFARE_TYPE                 : Association to ZFARE_TYPE
                                         on ZFARE_TYPE.FARE_TYPE_ID = FARE_TYPE_ID;
        ZMATERIAL_GROUP            : Association to ZMATERIAL_GROUP
                                         on ZMATERIAL_GROUP.MATERIAL_CODE_ID = MATERIAL_CODE;
        ZTRANSPORT_PASSING         : Association to ZTRANSPORT_PASSING
                                         on ZTRANSPORT_PASSING.TRANSPORT_PASSING_ID = FUNERAL_TRANSPORTATION;
        ZTRANSFER_MODE             : Association to ZTRANSFER_MODE
                                         on ZTRANSFER_MODE.TRANSFER_MODE_ID = MODE_OF_TRANSFER;
        ZPROFESIONAL_BODY          : Association to ZPROFESIONAL_BODY
                                         on ZPROFESIONAL_BODY.PROFESIONAL_BODY_ID = TYPE_OF_PROFESSIONAL_BODY;
        ZGL_ACCOUNT                : Association to ZGL_ACCOUNT
                                         on ZGL_ACCOUNT.GL_ACCOUNT_ID = GL_ACCOUNT;
        ZCURRENCY                  : Association to ZCURRENCY
                                         on ZCURRENCY.CURRENCY_ID = CURRENCY_CODE;
}

entity ZLODGING_CAT : managed {
    key LODGING_CATEGORY_ID   : String(2)  @mandatory  @Common.Label: 'Lodging Category ID';
        LODGING_CATEGORY_DESC : String     @Common.Label: 'Lodging Category Description';
        START_DATE            : Date       @Common.Label: 'Start Date';
        END_DATE              : Date       @Common.Label: 'End Date';
        STATUS                : String(10) @Common.Label: 'Status';
}

entity ZCOST_CENTER : managed {
    key COST_CENTER_ID   : String     @Common.Label: 'Cost Center';
        COST_CENTER_DESC : String;
        EXTERNAL_OBJ_ID  : String     @Common.Label: 'External Object ID';
        DEPARTMENT       : String     @Common.Label: 'Department';
        START_DATE       : Date       @Common.Label: 'Start Date';
        END_DATE         : Date       @Common.Label: 'End Date';
        STATUS           : String(10) @Common.Label: 'Status';
}

entity ZRISK : managed {
    key RISK_ID    : String(2)  @mandatory  @Common.Label: 'Risk Id';
        RISK_DESC  : String     @Common.Label: 'Risk Description';
        START_DATE : Date       @Common.Label: 'Start Date';
        END_DATE   : Date       @Common.Label: 'End Date';
        STATUS     : String(10) @Common.Label: 'Status';
}

entity ZCLAIM_TYPE_ITEM : managed {
    key CLAIM_TYPE_ID        : String     @mandatory  @Common.Label: 'Claim Type ID';
    key CLAIM_TYPE_ITEM_ID   : String     @mandatory  @Common.Label: 'Claim Type Item Id';
        CLAIM_TYPE_ITEM_DESC : String     @Common.Label: 'Claim Type Item Description';
        START_DATE           : Date       @Common.Label: 'Start Date';
        END_DATE             : Date       @Common.Label: 'End Date';
        STATUS               : String(10) @Common.Label: 'Status';
        CATEGORY_ID          : String     @Common.Label: 'Category ID';
        MATERIAL_CODE        : String     @Common.Label: 'Material Code';
        RISK                 : String(2)  @Common.Label: 'Risk';
        SUBMISSION_TYPE      : String     @Common.Label: 'Submission Type';
        IND_OR_GROUP         : String(4)  @Common.Label: 'Individual/Group';
        FREQUENCY            : Integer    @Common.Label: 'Frequency';
        PERIOD               : Integer    @Common.Label: 'Period';
        PERIOD_UNIT          : String(24) @Common.Label: 'Period Unit';
        ZCLAIM_CATEGORY      : Association to ZCLAIM_CATEGORY
                                   on ZCLAIM_CATEGORY.CLAIM_CAT_ID = CATEGORY_ID;
        ZRISK                : Association to ZRISK
                                   on ZRISK.RISK_ID = RISK;
        ZSUBMISSION_TYPE     : Association to ZSUBMISSION_TYPE
                                   on ZSUBMISSION_TYPE.SUBMISSION_TYPE_ID = SUBMISSION_TYPE;
        ZINDIV_GROUP         : Association to ZINDIV_GROUP
                                   on ZINDIV_GROUP.IND_OR_GROUP_ID = IND_OR_GROUP;
}

entity ZBUDGET : managed {
    key YEAR            : String(4)      @mandatory  @Common.Label: 'Year';
    key INTERNAL_ORDER  : String         @mandatory  @Common.Label: 'Internal Order';
    key COMMITMENT_ITEM : String(6)      @mandatory  @Common.Label: 'Commitment Item';
    key FUND_CENTER     : String         @mandatory  @Common.Label: 'Fund Center';
    key MATERIAL_GROUP  : String         @mandatory  @Common.Label: 'Material Group';
        ORIGINAL_BUDGET : Decimal(16, 2) @Common.Label: 'Original Budget';
        VIREMENT_IN     : Decimal(16, 2) @Common.Label: 'Virement In';
        VIREMENT_OUT    : Decimal(16, 2) @Common.Label: 'Virement Out';
        SUPPLEMENT      : Decimal(16, 2) @Common.Label: 'Supplement';
        RETURN          : Decimal(16, 2) @Common.Label: 'Return';
        CURRENT_BUDGET  : Decimal(16, 2) @Common.Label: 'Current Budget';
        COMMITMENT      : Decimal(16, 2) @Common.Label: 'Commitment';
        ACTUAL          : Decimal(16, 2) @Common.Label: 'Actual';
        CONSUMED        : Decimal(16, 2) @Common.Label: 'Consumed';
        BUDGET_BALANCE  : Decimal(16, 2) @Common.Label: 'Budget Balance';
        PROJECT_CODE    : String         @Common.Label: 'Project Code';
        BUDGET_OWNER_ID : String         @Common.Label: 'Budget Owner';
        WBS_CODE        : String         @Common.Label: 'WBS';
        CURRENCY        : String(3)      @Common.Label: 'Currency';
        ZCOST_CENTER    : Association to ZCOST_CENTER
                              on ZCOST_CENTER.COST_CENTER_ID = FUND_CENTER;
        ZINTERNAL_ORDER : Association to ZINTERNAL_ORDER
                              on ZINTERNAL_ORDER.IO_ID = INTERNAL_ORDER;
        ZGL_ACCOUNT     : Association to ZGL_ACCOUNT
                              on ZGL_ACCOUNT.GL_ACCOUNT_ID = COMMITMENT_ITEM;
        ZPROJECT_HDR    : Association to ZPROJECT_HDR
                              on ZPROJECT_HDR.PROJECT_CODE_IO = PROJECT_CODE;
        ZMATERIAL_GROUP : Association to ZMATERIAL_GROUP
                              on ZMATERIAL_GROUP.MATERIAL_CODE_ID = MATERIAL_GROUP;
        ZCURRENCY       : Association to ZCURRENCY
                              on ZCURRENCY.CURRENCY_ID = CURRENCY;
}

entity ZCLAIM_CATEGORY : managed {
    key CLAIM_CAT_ID        : String     @mandatory  @Common.Label: 'Claim Category ID';
        CLAIM_CATEGORY_DESC : String     @Common.Label: 'Claim Category Description';
        START_DATE          : Date       @Common.Label: 'Start Date';
        END_DATE            : Date       @Common.Label: 'End Date';
        STATUS              : String(10) @Common.Label: 'Status';
}

entity ZSTATUS : managed {
    key STATUS_ID   : String     @mandatory  @Common.Label: 'Status ID';
        STATUS_DESC : String     @Common.Label: 'Status Description';
        START_DATE  : Date       @Common.Label: 'Start Date';
        END_DATE    : Date       @Common.Label: 'End Date';
        STATUS      : String(10) @Common.Label: 'Status';
}

entity ZROOM_TYPE : managed {
    key ROOM_TYPE_ID   : String(2)  @mandatory  @Common.Label: 'Room Type ID';
        ROOM_TYPE_DESC : String     @Common.Label: 'Room Type Description';
        LEVEL          : Integer    @Common.Label: 'Level';
        START_DATE     : Date       @Common.Label: 'Start Date';
        END_DATE       : Date       @Common.Label: 'End Date';
        STATUS         : String(10) @Common.Label: 'Status';
}

entity ZFLIGHT_CLASS : managed {
    key FLIGHT_CLASS_ID   : String     @mandatory  @Common.Label: 'Flight Class ID';
        FLIGHT_CLASS_DESC : String     @Common.Label: 'Flight Class Description';
        LEVEL             : Integer    @Common.Label: 'Level';
        START_DATE        : Date       @Common.Label: 'Start Date';
        END_DATE          : Date       @Common.Label: 'End Date';
        STATUS            : String(10) @Common.Label: 'Status';
}

entity ZCOUNTRY : managed {
    key COUNTRY_ID       : String(3)  @mandatory  @Common.Label: 'Country ID';
        COUNTRY_DESC     : String     @Common.Label: 'Country Description';
        START_DATE       : Date       @Common.Label: 'Start Date';
        END_DATE         : Date       @Common.Label: 'End Date';
        STATUS           : String(10) @Common.Label: 'Status';
        LODGING_CATEGORY : String(2)  @Common.Label: 'Lodging Category';
        ZLODGING_CAT     : Association to ZLODGING_CAT
                               on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY

}

entity ZAREA : managed {
    key AREA_ID    : String(6)  @mandatory  @Common.Label: 'Area ID';
        AREA_DESC  : String     @Common.Label: 'Area Description';
        START_DATE : Date       @Common.Label: 'Start Date';
        END_DATE   : Date       @Common.Label: 'End Date';
        STATUS     : String(10) @Common.Label: 'Status';
}

entity ZLOC_TYPE : managed {
    key LOC_TYPE_ID   : String(6)  @mandatory  @Common.Label: 'Location Type ID';
        LOC_TYPE_DESC : String     @Common.Label: 'Location Type Description';
        START_DATE    : Date       @Common.Label: 'Start Date';
        END_DATE      : Date       @Common.Label: 'End Date';
        STATUS        : String(10) @Common.Label: 'Status';
}

entity ZMARITAL_STAT : managed {
    key MARRIAGE_STATUS_ID   : String(2)  @mandatory  @Common.Label: 'Marriage Status ID';
        MARRIAGE_STATUS_DESC : String     @Common.Label: 'Marriage Status Description';
        START_DATE           : Date       @Common.Label: 'Start Date';
        END_DATE             : Date       @Common.Label: 'End Date';
        STATUS               : String(10) @Common.Label: 'Status';
}

entity ZVEHICLE_TYPE : managed {
    key VEHICLE_TYPE_ID   : String(2)  @mandatory  @Common.Label: 'Vehicle Type ID';
        VEHICLE_TYPE_DESC : String     @Common.Label: 'Vehicle Type Description';
        START_DATE        : Date       @Common.Label: 'Start Date';
        END_DATE          : Date       @Common.Label: 'End Date';
        STATUS            : String(10) @Common.Label: 'Status';
}

entity ZRATE_KM : managed {
    key RATE_KM_ID         : String(2)  @mandatory  @Common.Label: 'Rate KM ID';
    key VEHICLE_TYPE_ID    : String(2)  @mandatory  @Common.Label: 'Vehicle ID';
    key CLAIM_TYPE_ITEM_ID : String     @mandatory  @Common.Label: 'Claim Type Item ID';
        RATE               : Decimal    @Common.Label: 'Rate';
        START_DATE         : Date       @Common.Label: 'Start Date';
        END_DATE           : Date       @Common.Label: 'End Date';
        STATUS             : String(10) @Common.Label: 'Status';
        ZVEHICLE_TYPE      : Association to ZVEHICLE_TYPE
                                 on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE_ID;
        ZCLAIM_TYPE_ITEM   : Association to one ZCLAIM_TYPE_ITEM
                                 on ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID;
}

entity ZREGION : managed {
    key REGION_ID   : String(2)  @mandatory  @Common.Label: 'Region ID';
        REGION_DESC : String     @Common.Label: 'Region Description';
        START_DATE  : Date       @Common.Label: 'Start Date';
        END_DATE    : Date       @Common.Label: 'End Date';
        STATUS      : String(10) @Common.Label: 'Status';
}

entity ZSTATE : managed {
    key COUNTRY_ID : String(3)  @mandatory  @Common.Label: 'Country ID';
    key STATE_ID   : String(4)  @mandatory  @Common.Label: 'State ID';
        STATE_DESC : String     @Common.Label: 'State Description';
        START_DATE : Date       @Common.Label: 'Start Date';
        END_DATE   : Date       @Common.Label: 'End Date';
        STATUS     : String(10) @Common.Label: 'Status';
}

entity ZJOB_GROUP : managed {
    key JOB_GROUP_ID   : String(8)  @mandatory  @Common.Label: 'Job Group ID';
        JOB_GROUP_DESC : String     @Common.Label: 'Job Group ID';
        START_DATE     : Date       @Common.Label: 'Start Date';
        END_DATE       : Date       @Common.Label: 'End Date';
        STATUS         : String(10) @Common.Label: 'Status';
}

entity ZDEPARTMENT : managed {
    key DEPARTMENT_ID      : String(10)  @mandatory  @Common.Label: 'Department ID';
        DEPARTMENT_DESC    : String      @Common.Label: 'Department Description';
        START_DATE         : Date        @Common.Label: 'Start Date';
        END_DATE           : Date        @Common.Label: 'End Date';
        STATUS             : String(10)  @Common.Label: 'Status';
        HEAD_OF_DEPARTMENT : String      @Common.Label: 'Head of Department';
        SHORT_CODE         : String      @Common.Label: 'Short Code';
        COST_CENTER        : String      @Common.Label: 'Cost Center';
        DIVISION           : String      @Common.Label: 'Division';
}

entity ZROLE : managed {
    key ROLE_ID    : String(3)  @mandatory  @Common.Label: 'Role ID';
        ROLE_DESC  : String     @Common.Label: 'Role Description';
        START_DATE : Date       @Common.Label: 'Start Date';
        END_DATE   : Date       @Common.Label: 'End Date';
        STATUS     : String(10) @Common.Label: 'Status';
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
    key LOCATION_ID       : String(10)  @mandatory  @Common.Label: 'Location ID';
    key STATE_ID          : String(4)   @mandatory  @Common.Label: 'State ID';
        LOCATION_DESC     : String      @Common.Label: 'Location Description';
        LOCATION_GROUP    : String      @Common.Label: 'Location Group';
        LEGAL_ENTITY      : String      @Common.Label: 'Legal Entity';
        START_DATE        : Date        @Common.Label: 'Start Date';
        END_DATE          : Date        @Common.Label: 'End Date';
        STATUS            : String(10)  @Common.Label: 'Status';
        ZOFFICE_DISTANCE  : Association to ZOFFICE_DISTANCE
                                on  ZOFFICE_DISTANCE.FROM_LOCATION_ID = LOCATION_ID
                                and ZOFFICE_DISTANCE.FROM_STATE_ID    = STATE_ID;
        ZOFFICE_DISTANCE1 : Association to ZOFFICE_DISTANCE
                                on  ZOFFICE_DISTANCE1.TO_LOCATION_ID = LOCATION_ID
                                and ZOFFICE_DISTANCE1.TO_STATE_ID    = STATE_ID;

}

entity ZOFFICE_DISTANCE : managed {
    key FROM_STATE_ID     : String(4)   @mandatory  @Common.Label: 'From State ID';
    key FROM_LOCATION_ID  : String(10)  @mandatory  @Common.Label: 'From Location ID';
    key TO_STATE_ID       : String(4)   @mandatory  @Common.Label: 'To State ID';
    key TO_LOCATION_ID    : String(10)  @mandatory  @Common.Label: 'To Location ID';
        MILEAGE           : String      @Common.Label: 'Mileage';
        START_DATE        : Date        @Common.Label: 'Start Date';
        END_DATE          : Date        @Common.Label: 'End Date';
        STATUS            : String(10)  @Common.Label: 'Status';
        ZOFFICE_LOCATION  : Association to ZOFFICE_LOCATION
                                on  ZOFFICE_LOCATION.LOCATION_ID = FROM_LOCATION_ID
                                and ZOFFICE_LOCATION.STATE_ID    = FROM_STATE_ID;
        ZOFFICE_LOCATION1 : Association to ZOFFICE_LOCATION
                                on  ZOFFICE_LOCATION1.LOCATION_ID = TO_LOCATION_ID
                                and ZOFFICE_LOCATION1.STATE_ID    = TO_STATE_ID;
        ZSTATE            : Association to ZSTATE
                                on ZSTATE.STATE_ID = FROM_STATE_ID;
        ZTOSTATE          : Association to ZSTATE
                                on ZTOSTATE.STATE_ID = TO_STATE_ID;


}

entity ZGL_ACCOUNT : managed {
    key GL_ACCOUNT_ID   : String(6)  @mandatory  @Common.Label: 'GL Account ID';
        GL_ACCOUNT_DESC : String     @Common.Label: 'GL Account Description';
        START_DATE      : Date       @Common.Label: 'Start Date';
        END_DATE        : Date       @Common.Label: 'End Date';
        STATUS          : String(10) @Common.Label: 'Status';
}

entity ZMATERIAL_GROUP : managed {
    key MATERIAL_CODE_ID   : String  @mandatory  @Common.Label: 'Material Code ID';
        MATERIAL_CODE_DESC : String  @Common.Label: 'Material Code Description';
        START_DATE         : Date    @Common.Label: 'Start Date';
        END_DATE           : Date    @Common.Label: 'End Date';
        STATUS             : String  @Common.Label: 'Status';

}

entity ZINDIV_GROUP : managed {
    key IND_OR_GROUP_ID   : String(4)  @mandatory  @Common.Label: 'Individual/Group ID';
        IND_OR_GROUP_DESC : String     @Common.Label: 'Individual/Group ID Description';
        START_DATE        : Date       @Common.Label: 'Start Date';
        END_DATE          : Date       @Common.Label: 'End Date';
        STATUS            : String(10) @Common.Label: 'Status';
}

entity ZTRAIN_COURSE_PART : managed {
    key COURSE_ID           : String      @mandatory  @Common.Label: 'Course ID';
    key COURSE_DESC         : String      @mandatory  @Common.Label: 'Course Description';
    key SESSION_NUMBER      : String(15)  @mandatory  @Common.Label: 'Session Number';
    key COURSE_SESSION_STAT : String(10)  @mandatory  @Common.Label: 'Course Session Status';
    key ATTENDENCE_STATUS   : Boolean     @mandatory  @Common.Label: 'Attendence Status';
    key PARTICIPANT_ID      : String      @mandatory  @Common.Label: 'Participants';
    key START_DATE          : Date        @mandatory  @Common.Label: 'Start Date';
    key END_DATE            : Date        @mandatory  @Common.Label: 'End Date';
        ZEMP_MASTER         : Association to ZEMP_MASTER
                                  on ZEMP_MASTER.EEID = PARTICIPANT_ID
}

entity ZMARITAL_CAT : managed {
    key MARRIAGE_CATEGORY_ID   : String(2)  @mandatory  @Common.Label: 'Marriage Category ID';
        MARRIAGE_CATEGORY_DESC : String     @Common.Label: 'Marriage Category Description';
        START_DATE             : Date       @Common.Label: 'Start Date';
        END_DATE               : Date       @Common.Label: 'End Date';
        STATUS                 : String(10) @Common.Label: 'Status';
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
    key VEHICLE_OWNERSHIP_ID   : String(2)  @mandatory  @Common.Label: 'Vehicle Ownership ID';
        VEHICLE_OWNERSHIP_DESC : String     @mandatory  @Common.Label: 'Vehicle Description';
        START_DATE             : Date       @mandatory  @Common.Label: 'Start Date';
        END_DATE               : Date       @mandatory  @Common.Label: 'End Date';
        STATUS                 : String(10) @Common.Label: 'Status';
}

entity ZEMP_DEPENDENT : managed {
    key EMP_ID                            : String        @mandatory  @Common.Label: 'Employee ID';
    key RELATIONSHIP                      : String        @mandatory  @Common.Label: 'Relationship';
    key DEPENDENT_NO                      : String(128)   @mandatory  @Common.Label: 'Dependent Number';
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
    key PROJECT_CODE_IO : String    @mandatory  @Common.Label: 'Project Code(IO)';
        PROJECT_DESC    : String    @Common.Label: 'Project Description';
        GL_ACCOUNT      : String(6) @Common.Label: 'GL Account';
        COST_CENTER     : String(9) @Common.Label: 'Cost Center';
        STATUS          : String    @Common.Label: 'Status';
        BUFFER_FIELD1   : String    @Common.Label: 'Buffer Field 1';
        BUFFER_FIELD2   : String    @Common.Label: 'Buffer Field 2';
        START_DATE      : Date      @Common.Label: 'Start Date';
        END_DATE        : Date      @Common.Label: 'End Date';
        ZGL_ACCOUNT     : Association to ZGL_ACCOUNT
                              on ZGL_ACCOUNT.GL_ACCOUNT_ID = GL_ACCOUNT;
        ZCOST_CENTER    : Association to ZCOST_CENTER
                              on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
}

entity ZBRANCH : managed {
    key BRANCH_ID    : String(10)  @mandatory  @Common.Label: 'Unit/Section (Branch) ID';
        BRANCH_DESC  : String      @Common.Label: 'Unit/Section (Branch) Description';
        HEAD_OF_UNIT : String      @Common.Label: 'Head of Unit';
        START_DATE   : Date        @Common.Label: 'Start Date';
        END_DATE     : Date        @Common.Label: 'End Date';
        STATUS       : String(10)  @Common.Label: 'Status';
}

entity ZEMP_CA_PAYMENT : managed {
    key REQUEST_ID           : String    @mandatory  @Common.Label: 'Pre Approval Request ID';
    key EMP_ID               : String    @mandatory  @Common.Label: 'Employee ID';
    key DISBURSEMENT_DATE    : Date      @mandatory  @Common.Label: 'Disbursement Date';
        DISBURSEMENT_STATUS  : String(2) @Common.Label          : 'Disbursement Status'
                                         @Common.Text           : ZDISBURSEMENT_STATUS.DISBURSEMENT_STATUS_DESC
                                         @Common.TextArrangement: #TextOnly;
        ZDISBURSEMENT_STATUS : Association to ZDISBURSEMENT_STATUS
                                   on ZDISBURSEMENT_STATUS.DISBURSEMENT_STATUS_ID = DISBURSEMENT_STATUS
}

entity ZPERDIEM_ENT : managed {
    key PERSONAL_GRADE     : String        @mandatory  @Common.Label: 'Personal Grade From';
    key LOCATION           : String(2)     @mandatory  @Common.Label: 'Location';
    key CLAIM_TYPE_ID      : String        @mandatory  @Common.Label: 'Claim Type ID';
    key CLAIM_TYPE_ITEM_ID : String        @mandatory  @Common.Label: 'Claim Type Item ID';
    key START_DATE         : Date          @mandatory  @Common.Label: 'Start Date';
    key END_DATE           : Date          @mandatory  @Common.Label: 'End Date';
        CURRENCY           : String(3)     @Common.Label: 'Currency';
        AMOUNT             : Decimal(7, 2) @Common.Label: 'Amount';
        STATUS             : String(10)    @Common.Label: 'Status';
        ZCLAIM_TYPE_ITEM   : Association to one ZCLAIM_TYPE_ITEM
                                 on  ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_ID = CLAIM_TYPE_ITEM_ID
                                 and ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ID      = CLAIM_TYPE_ID;
        ZREGION            : Association to ZREGION
                                 on ZREGION.REGION_ID = LOCATION;
        ZCURRENCY          : Association to ZCURRENCY
                                 on ZCURRENCY.CURRENCY_ID = CURRENCY;
}

entity ZHOUSING_LOAN_SCHEME : managed {
    key HOUSING_LOAN_SCHEME_ID   : String(2)  @mandatory  @Common.Label: 'Housing Loan Scheme ID';
        HOUSING_LOAN_SCHEME_DESC : String     @Common.Label: 'Housing Loan Scheme Description';
        START_DATE               : Date       @Common.Label: 'Start Date';
        END_DATE                 : Date       @Common.Label: 'End Date';
        STATUS                   : String(10) @Common.Label: 'Status';
}

entity ZLENDER_NAME : managed {
    key LENDER_ID   : String(2)  @mandatory  @Common.Label: 'Lender ID';
        LENDER_NAME : String     @Common.Label: 'Lender Name';
        START_DATE  : Date       @Common.Label: 'Start Date';
        END_DATE    : Date       @Common.Label: 'End Date';
        STATUS      : String(10) @Common.Label: 'Status';
}

entity ZREJECT_REASON : managed {
    key REASON_ID   : String(3)  @mandatory  @Common.Label: 'Reason ID';
    key REASON_TYPE : String     @mandatory  @Common.Label: 'Reason Type';
    key START_DATE  : Date       @mandatory  @Common.Label: 'Start Date';
    key END_DATE    : Date       @mandatory  @Common.Label: 'End Date';
        STATUS      : String(10) @Common.Label: 'Status';
        REASON_DESC : String     @Common.Label: 'Reason Text';
}

entity ZWORKFLOW_STEP : managed {
    key WORKFLOW_CODE            : String  @mandatory  @Common.Label: 'Workflow Code';
    key WORKFLOW_TYPE            : String  @mandatory  @Common.Label: 'Workflow Type';
    key START_DATE               : Date    @mandatory  @Common.Label: 'Start Date';
    key END_DATE                 : Date    @mandatory  @Common.Label: 'End Date';
        WORKFLOW_NAME            : String;
        WORKFLOW_APPROVAL_LEVELS : Integer;
        REMARK                   : String;
}

entity ZWORKFLOW_RULE : managed {
    key WORKFLOW_ID           : String        @mandatory  @Common.Label: 'Workflow ID';
    key WORKFLOW_TYPE         : String        @mandatory  @Common.Label: 'Workflow Type';
    key CLAIM_TYPE_ID         : String        @mandatory  @Common.Label: 'Claim Type ID';
    key CLAIM_TYPE_ITEM_ID    : String        @mandatory  @Common.Label: 'Claim Type Item ID';
    key START_DATE            : Date          @mandatory  @Common.Label: 'Start Date';
    key END_DATE              : Date          @mandatory  @Common.Label: 'End Date';
        RISK_LEVEL            : String(1)     @Common.Label: 'Risk Level';
        THRESHOLD_AMOUNT      : Decimal(7, 2) @Common.Label: 'Threshold Amount';
        THRESHOLD_VALUE       : String(2)     @Common.Label: 'Threshold Value';
        RECEIPT_DAY           : Integer       @Common.Label: 'Receipt Day';
        RECEIPT_AGE           : String        @Common.Label: 'Receipt Age';
        EMPLOYEE_COST_CENTER  : String(9)     @Common.Label: 'Employee Cost Center';
        OUTCOME_WORKFLOW_CODE : String(3)     @Common.Label: 'Outcome Workflow Code';
        REMARK                : String(255)   @Common.Label: 'Remark';
        REQUEST_TYPE_ID       : String        @Common.Label: 'Request Type ID';
        CASH_ADVANCE          : Boolean       @Common.Label: 'Cash Advance';
        TRIP_START_DATE       : String(2)     @Common.Label: 'Trip Start Date';
        ROLE                  : String(15)    @Common.Label: 'Role';
        DEPARTMENT_ID         : String(10)    @Common.Label: 'Department ID';
        ZREQUEST_TYPE         : Association to ZREQUEST_TYPE
                                    on ZREQUEST_TYPE.REQUEST_TYPE_ID = REQUEST_TYPE_ID;
        ZDEPARTMENT           : Association to ZDEPARTMENT
                                    on ZDEPARTMENT.DEPARTMENT_ID = DEPARTMENT_ID;
}

entity ZCURRENCY : managed {
    key CURRENCY_ID   : String(3)  @mandatory  @Common.Label: 'Currency ID';
        CURRENCY_DESC : String     @Common.Label: 'Currency Description';
        START_DATE    : Date       @Common.Label: 'Start Date';
        END_DATE      : Date       @Common.Label: 'End Date';
        STATUS        : String(10) @Common.Label: 'Status';
}

entity ZMOBILE_CATEGORY_PURPOSE : managed {
    key MOBILE_CATEGORY_PURPOSE_ID   : String(2)  @mandatory  @Common.Label: 'Category/Purpose (Mobile) ID';
        MOBILE_CATEGORY_PURPOSE_DESC : String     @Common.Label: 'Category/Purpose (Mobile) Description';
        START_DATE                   : Date       @Common.Label: 'Start Date';
        END_DATE                     : Date       @Common.Label: 'End Date';
        STATUS                       : String(10) @Common.Label: 'Status';

}

entity ZVEHICLE_CLASS : managed {
    key VEHICLE_CLASS_ID   : String(2)  @mandatory  @Common.Label: 'Vehicle Class ID';
        VEHICLE_CLASS_DESC : String     @Common.Label: 'Vehicle Class Description';
        LEVEL              : Integer    @Common.Label: 'Level';
        START_DATE         : Date       @Common.Label: 'Start Date';
        END_DATE           : Date       @Common.Label: 'End Date';
        STATUS             : String(10) @Common.Label: 'Status';

}

entity ZINSURANCE_PROVIDER : managed {
    key INSURANCE_PROVIDER_ID   : String(3)  @mandatory  @Common.Label: 'Insurance Provider ID';
        INSURANCE_PROVIDER_DESC : String     @Common.Label: 'Insurance Provider Description';
        START_DATE              : Date       @Common.Label: 'Start Date';
        END_DATE                : Date       @Common.Label: 'End Date';
        STATUS                  : String(10) @Common.Label: 'Status';
}

entity ZINSURANCE_PACKAGE : managed {
    key INSURANCE_PACKAGE_ID    : String(2)  @mandatory  @Common.Label: 'Insurance Package ID';
        ZINSURANCE_PACKAGE_DESC : String     @Common.Label: 'Insurance Package Description';
        START_DATE              : Date       @Common.Label: 'Start Date';
        END_DATE                : Date       @Common.Label: 'End Date';
        STATUS                  : String(10) @Common.Label: 'Status';
}

entity ZPROFESIONAL_BODY : managed {
    key PROFESIONAL_BODY_ID   : String(3)  @mandatory  @Common.Label: 'Type of Profesional Body ID';
        PROFESIONAL_BODY_DESC : String     @Common.Label: 'Type of Profesional Body Description';
        START_DATE            : Date       @Common.Label: 'Start Date';
        END_DATE              : Date       @Common.Label: 'End Date';
        STATUS                : String(10) @Common.Label: 'Status';
}

entity ZSTUDY_LEVELS : managed {
    key STUDY_LEVELS_ID   : String(2)  @mandatory  @Common.Label: 'Level of Studies ID';
        STUDY_LEVELS_DESC : String     @Common.Label: 'Level of Studies Description';
        START_DATE        : Date       @Common.Label: 'Start Date';
        END_DATE          : Date       @Common.Label: 'End Date';
        STATUS            : String(10) @Common.Label: 'Status';
}

entity ZTRANSFER_MODE : managed {
    key TRANSFER_MODE_ID   : String(2)  @mandatory  @Common.Label: 'Mode of Transfer ID';
        TRANSFER_MODE_DESC : String     @Common.Label: 'Mode of Transfer Description';
        NUMBER_OF_DAYS     : Integer    @Common.Label: 'Number of Days';
        START_DATE         : Date       @Common.Label: 'Start Date';
        END_DATE           : Date       @Common.Label: 'End Date';
        STATUS             : String(10) @Common.Label: 'Status';
}

entity ZTRANSPORT_PASSING : managed {
    key TRANSPORT_PASSING_ID   : String(2)  @mandatory  @Common.Label: 'Transportation of the passing (dead) ID';
        TRANSPORT_PASSING_DESC : String     @Common.Label: 'Transportation of the passing (dead) Description';
        START_DATE             : Date       @Common.Label: 'Start Date';
        END_DATE               : Date       @Common.Label: 'End Date';
        STATUS                 : String(10) @Common.Label: 'Status';
}

entity ZTRAVEL_TYPE : managed {
    key TRAVEL_TYPE_ID   : String(2)  @mandatory  @Common.Label: 'Travel (Sendirian/With Family) ID';
        TRAVEL_TYPE_DESC : String     @Common.Label: 'Travel (Sendirian/With Family) Description';
        START_DATE       : Date       @Common.Label: 'Start Date';
        END_DATE         : Date       @Common.Label: 'End Date';
        STATUS           : String(10) @Common.Label: 'Status';
}

entity ZFAMILY_TIMING : managed {
    key FAMILY_TIMING_ID   : String(2)  @mandatory  @Common.Label: 'With Family Now or Later ID';
        FAMILY_TIMING_DESC : String     @Common.Label: 'With Family Now or Later Description';
        START_DATE         : Date       @Common.Label: 'Start Date';
        END_DATE           : Date       @Common.Label: 'End Date';
        STATUS             : String(10) @Common.Label: 'Status';
}

entity ZSPORTS_REPRESENTATION : managed {
    key SPORTS_REPRESENTATION_ID   : String(2)  @mandatory  @Common.Label: 'Represent KWSP in Sport Activity ID';
        SPORTS_REPRESENTATION_DESC : String     @Common.Label: 'Represent KWSP in Sport Activity Description';
        START_DATE                 : Date       @Common.Label: 'Start Date';
        END_DATE                   : Date       @Common.Label: 'End Date';
        STATUS                     : String(10) @Common.Label: 'Status';
}

entity ZPOSITION_EVENT_REASON : managed {
    key POSITION_EVENT_REASON_ID   : String(4)  @mandatory  @Common.Label: 'Position Event Reason ID';
        POSITION_EVENT_REASON_DESC : String     @Common.Label: 'Position Event Reason Description';
        START_DATE                 : Date       @Common.Label: 'Start Date';
        END_DATE                   : Date       @Common.Label: 'End Date';
        STATUS                     : String(10) @Common.Label: 'Status';
}

entity ZEMP_DEPENDENT_TYPE : managed {
    key DEPENDENT_TYPE_ID   : String(2)  @mandatory  @Common.Label: 'Dependent Type ID';
        DEPENDENT_TYPE_DESC : String     @Common.Label: 'Dependent Type Description';
        START_DATE          : Date       @Common.Label: 'Start Date';
        END_DATE            : Date       @Common.Label: 'End Date';
        STATUS              : String(10) @Common.Label: 'Status';
}

entity ZCLAIM_BASIS : managed {
    key CLAIM_BASIS_ID   : String(2)  @mandatory  @Common.Label: 'Claim Basis ID';
        CLAIM_BASIS_DESC : String     @Common.Label: 'Claim Basis Description';
        START_DATE       : Date       @Common.Label: 'Start Date';
        END_DATE         : Date       @Common.Label: 'End Date';
        STATUS           : String(10) @Common.Label: 'Status';
}

entity ZHOTEL_LODGING : managed {
    key HOTEL_LODGING_ID   : String(2)  @mandatory  @Common.Label: 'Hotel/Lodjing ID';
        HOTEL_LODGING_DESC : String     @Common.Label: 'Hotel/Lodjing Description';
        START_DATE         : Date       @Common.Label: 'Start Date';
        END_DATE           : Date       @Common.Label: 'End Date';
        STATUS             : String(10) @Common.Label: 'Status';
}

entity ZFARE_TYPE : managed {
    key FARE_TYPE_ID   : String(2)  @mandatory  @Common.Label: 'Fare Type ID';
        FARE_TYPE_DESC : String     @Common.Label: 'Fare Type Description';
        START_DATE     : Date       @Common.Label: 'Start Date';
        END_DATE       : Date       @Common.Label: 'End Date';
        STATUS         : String(10) @Common.Label: 'Status';
}

entity ZMETER_CUBE : managed {
    key METER_CUBE_ID     : String(2)     @mandatory  @Common.Label: 'Meter Cube ID';
        MARITAL_STATUS    : String        @Common.Label: 'Marital Status';
        DEPENDENT_TYPE_ID : String        @Common.Label: 'Dependent Type ID';
        AGE_CONDITION     : String(3)     @Common.Label: 'Age Condition';
        AGE               : Integer       @Common.Label: 'Age';
        METER_CUBE        : Decimal(5, 2) @Common.Label: 'Meter Cube';
        START_DATE        : Date          @Common.Label: 'Start Date';
        END_DATE          : Date          @Common.Label: 'End Date';
        STATUS            : String(10)    @Common.Label: 'Status';
        ZEMP_RELATIONSHIP : Association to one ZEMP_RELATIONSHIP
                                on ZEMP_RELATIONSHIP.RELATIONSHIP_TYPE_ID = DEPENDENT_TYPE_ID;

}

entity ZTRAVEL_DAYS : managed {
    key TRAVEL_DAYS_ID   : String(2)  @mandatory  @Common.Label: 'Travel Days ID';
        TRAVEL_DAYS_DESC : String     @Common.Label: 'Travel Days Description';
        START_DATE       : Date       @Common.Label: 'Start Date';
        END_DATE         : Date       @Common.Label: 'End Date';
        STATUS           : String(10) @Common.Label: 'Status';
}

entity ZELIGIBILITY_RULE : managed {
    key CLAIM_TYPE_ID             : String         @mandatory  @Common.Label: 'Claim Type ID';
    key CLAIM_TYPE_ITEM_ID        : String         @mandatory  @Common.Label: 'Claim Type Item ID';
    key ROLE_ID                   : String(3)      @mandatory  @Common.Label: 'Role';
    key POSITION_NO_DESC          : String         @mandatory  @Common.Label: 'Position Number/Description';
    key ROW_COUNT                 : Integer        @mandatory  @Common.Label: 'Row Count';
    key START_DATE                : Date           @mandatory  @Common.Label: 'Start Date';
    key END_DATE                  : Date           @mandatory  @Common.Label: 'End Date';
        EMPLOYEE_TYPE             : String         @Common.Label: 'Employee Type';
        ASSIGNED_APPROVER         : String         @Common.Label: 'Assigned Approver';
        CONFIRMATION_DATE         : Date           @Common.Label: 'Confirmation Date';
        PERSONAL_GRADE            : String         @Common.Label: 'Personal Grade';
        MOBILE_PHONE_BILL         : String         @Common.Label: 'Mobile Phone Bill';
        ELIGIBLE_AMOUNT           : Decimal(16, 2) @Common.Label: 'Eligible Amount';
        FREQUENCY                 : Integer        @Common.Label: 'Frequency';
        PERIOD                    : String         @Common.Label: 'Period';
        DEPENDENT                 : String         @Common.Label: 'Dependent';
        PERMITTED_DEPENDENT_COUNT : Integer        @Common.Label: 'Permitted for ? Number of dependent';
        CLAIM_YEARS               : Integer        @Common.Label: 'Allowed to claim up to ? Years';
        SUBSIDISED_RATE           : Decimal(5, 2)  @Common.Label: 'Subsidised Rate';
        MARITAL_STATUS            : String(2)      @Common.Label: 'Marital Status';
        DEPENDENT_TYPE_ID         : String(2)      @Common.Label: 'Anggota/spouse/anak';
        VEHICLE_OWNERSHIP_ID      : String(2)      @Common.Label: 'Kenderaan Sendiri/Pejabat';
        CLAIMABLE_PERIOD_DAYS     : Integer        @Common.Label: 'Claimable Period (Days)';
        REGION_ID                 : String(2)      @Common.Label: 'Semenanjung or Sabah/Sarawak/Labuan';
        MAXIMUM_DAYS              : Integer        @Common.Label: 'Maximum Days';
        CLAIM_BASIS_ID            : String(2)      @Common.Label: 'Based on Receipt/Max amount';
        TRANSFER_MODE_ID          : String(2)      @Common.Label: 'Mode of Transfer';
        EVENT_REASON              : String(4)      @Common.Label: 'Event Reason';
        NO_OF_NIGHT               : Integer        @Common.Label: 'Number of Nights';
        VEHICLE_TYPE_ID           : String(2)      @Common.Label: 'Vehicle Type';
        RATE                      : Decimal(5, 2)  @Common.Label: 'Rate';
        MARRIAGE_CATEGORY         : String(2)      @Common.Label: 'Marriage Category';
        FLIGHT_CLASS_ID           : String         @Common.Label: 'Flight Class';
        HOTEL_LODGING_ID          : String(2)      @Common.Label: 'Hotel/Lodging';
        TRANSPORT_CLASS           : String(2)      @Common.Label: 'Train/Boat Class';
        TRANSPORT_PASSING_ID      : String(2)      @Common.Label: 'Transportation of The Passing (Dead)';
        INSURANCE_PACKAGE_ID      : String(2)      @Common.Label: 'Insurance Package';
        TRAVEL_DAYS_ID            : String         @Common.Label: 'Number of Days Category (Travel Insurance)';
        CURRENCY                  : String(3)      @Common.Label: 'Currency';
        ROOM_TYPE_ID              : String(2)      @Common.Label: 'Room Type';
        IND_OR_GROUP              : String(4)      @Common.Label: 'Individual or Group';
        TRAVEL_HOURS              : Integer        @Common.Label: 'Travel Hours';
        AGING_NUMBER              : Integer        @Common.Label: 'Aging Number';
        AGING_PERIOD              : String(2)      @Common.Label: 'Period Number';
        STATUS                    : String(10)     @Common.Label: 'Status';
        JOB_GROUP                 : String(8)      @Common.Label: 'Job Group';
        SUBMISSION_TYPE           : String         @Common.Label: 'Submission Type';
        COST_CENTER               : String(4)      @Common.Label: 'Cost_Center';
        LODGING_CATEGORY          : String(2)      @Common.Label: 'Lodging Category';
        ZEMP_TYPE                 : Association to ZEMP_TYPE
                                        on ZEMP_TYPE.EMP_TYPE_ID = EMPLOYEE_TYPE;
        ZROLE                     : Association to ZROLE
                                        on ZROLE.ROLE_ID = ROLE_ID;
        ZMARITAL_STAT             : Association to ZMARITAL_STAT
                                        on ZMARITAL_STAT.MARRIAGE_STATUS_ID = MARITAL_STATUS;
        ZEMP_DEPENDENT_TYPE       : Association to ZEMP_DEPENDENT_TYPE
                                        on ZEMP_DEPENDENT_TYPE.DEPENDENT_TYPE_ID = DEPENDENT_TYPE_ID;
        ZVEHICLE_OWNERSHIP        : Association to ZVEHICLE_OWNERSHIP
                                        on ZVEHICLE_OWNERSHIP.VEHICLE_OWNERSHIP_ID = VEHICLE_OWNERSHIP_ID;
        ZREGION                   : Association to ZREGION
                                        on ZREGION.REGION_ID = REGION_ID;
        ZCLAIM_BASIS              : Association to ZCLAIM_BASIS
                                        on ZCLAIM_BASIS.CLAIM_BASIS_ID = CLAIM_BASIS_ID;
        ZTRANSFER_MODE            : Association to ZTRANSFER_MODE
                                        on ZTRANSFER_MODE.TRANSFER_MODE_ID = TRANSFER_MODE_ID;
        ZPOSITION_EVENT_REASON    : Association to ZPOSITION_EVENT_REASON
                                        on ZPOSITION_EVENT_REASON.POSITION_EVENT_REASON_ID = EVENT_REASON;
        ZVEHICLE_TYPE             : Association to ZVEHICLE_TYPE
                                        on ZVEHICLE_TYPE.VEHICLE_TYPE_ID = VEHICLE_TYPE_ID;
        ZMARITAL_CAT              : Association to ZMARITAL_CAT
                                        on ZMARITAL_CAT.MARRIAGE_CATEGORY_ID = MARRIAGE_CATEGORY;
        ZFLIGHT_CLASS             : Association to ZFLIGHT_CLASS
                                        on ZFLIGHT_CLASS.FLIGHT_CLASS_ID = FLIGHT_CLASS_ID;
        ZHOTEL_LODGING            : Association to ZHOTEL_LODGING
                                        on ZHOTEL_LODGING.HOTEL_LODGING_ID = HOTEL_LODGING_ID;
        ZVEHICLE_CLASS            : Association to ZVEHICLE_CLASS
                                        on ZVEHICLE_CLASS.VEHICLE_CLASS_ID = TRANSPORT_CLASS;
        ZTRANSPORT_PASSING        : Association to ZTRANSPORT_PASSING
                                        on ZTRANSPORT_PASSING.TRANSPORT_PASSING_ID = TRANSPORT_PASSING_ID;
        ZINSURANCE_PACKAGE        : Association to ZINSURANCE_PACKAGE
                                        on ZINSURANCE_PACKAGE.INSURANCE_PACKAGE_ID = INSURANCE_PACKAGE_ID;
        ZCURRENCY                 : Association to ZCURRENCY
                                        on ZCURRENCY.CURRENCY_ID = CURRENCY;
        ZROOM_TYPE                : Association to ZROOM_TYPE
                                        on ZROOM_TYPE.ROOM_TYPE_ID = ROOM_TYPE_ID;
        ZINDIV_GROUP              : Association to ZINDIV_GROUP
                                        on ZINDIV_GROUP.IND_OR_GROUP_ID = IND_OR_GROUP;
        ZJOB_GROUP                : Association to ZJOB_GROUP
                                        on ZJOB_GROUP.JOB_GROUP_ID = JOB_GROUP;
        ZNUM_RANGE                : Association to ZNUM_RANGE
                                        on ZNUM_RANGE.PREFIX = SUBMISSION_TYPE;
        ZCOST_CENTER              : Association to one ZCOST_CENTER
                                        on ZCOST_CENTER.COST_CENTER_ID = COST_CENTER;
        ZLODGING_CAT              : Association to ZLODGING_CAT
                                        on ZLODGING_CAT.LODGING_CATEGORY_ID = LODGING_CATEGORY
}

entity ZAPPROVER_DETAILS_CLAIMS : managed {
    key CLAIM_ID               : String  @mandatory;
    key LEVEL                  : Integer @mandatory;
        APPROVER_ID            : String;
        SUBSTITUTE_APPROVER_ID : String;
        STATUS                 : String;
        REJECT_REASON_ID       : String(3);
        PROCESS_TIMESTAMP      : Timestamp;
        COMMENT                : String;
        ZEMP_MASTER_APPROVER   : Association to one ZEMP_MASTER
                                     on ZEMP_MASTER_APPROVER.EEID = APPROVER_ID;
        ZEMP_MASTER_SUBS       : Association to one ZEMP_MASTER
                                     on ZEMP_MASTER_SUBS.EEID = SUBSTITUTE_APPROVER_ID;
        ZREJECT_REASON         : Association to ZREJECT_REASON
                                     on ZREJECT_REASON.REASON_ID = REJECT_REASON_ID;
        ZSTATUS                : Association to one ZSTATUS
                                     on ZSTATUS.STATUS_ID = STATUS;
        ZCLAIM_HEADER          : Association to ZCLAIM_HEADER
                                     on ZCLAIM_HEADER.CLAIM_ID = CLAIM_ID;
}

entity ZAPPROVER_DETAILS_PREAPPROVAL : managed {
    key PREAPPROVAL_ID         : String  @mandatory;
    key LEVEL                  : Integer @mandatory;
        APPROVER_ID            : String;
        SUBSTITUTE_APPROVER_ID : String;
        STATUS                 : String;
        REJECT_REASON_ID       : String(3);
        PROCESS_TIMESTAMP      : Timestamp;
        COMMENT                : String;
        ZEMP_MASTER_APPROVER   : Association to one ZEMP_MASTER
                                     on ZEMP_MASTER_APPROVER.EEID = APPROVER_ID;
        ZEMP_MASTER_SUBS       : Association to one ZEMP_MASTER
                                     on ZEMP_MASTER_SUBS.EEID = SUBSTITUTE_APPROVER_ID;
        ZREJECT_REASON         : Association to ZREJECT_REASON
                                     on ZREJECT_REASON.REASON_ID = REJECT_REASON_ID;
        ZSTATUS                : Association to one ZSTATUS
                                     on ZSTATUS.STATUS_ID = STATUS;
        ZREQUEST_HEADER        : Association to ZREQUEST_HEADER
                                     on ZREQUEST_HEADER.REQUEST_ID = PREAPPROVAL_ID;
}

entity ZSUBSTITUTION_RULES : managed {
    key SUBSTITUTE_RULE_ID : String(10) @mandatory;
    key USER_ID            : String     @mandatory;
    key SUBSTITUTE_ID      : String     @mandatory;
    key VALID_FROM         : Date       @mandatory;
    key VALID_TO           : Date       @mandatory;
        ZEMP_MASTER_USER   : Association to one ZEMP_MASTER
                                 on ZEMP_MASTER_USER.EEID = USER_ID;
        ZEMP_MASTER_SUBS   : Association to one ZEMP_MASTER
                                 on ZEMP_MASTER_SUBS.EEID = SUBSTITUTE_ID;
}

entity ZDB_STRUCTURE : managed {
    key APP_CONTROL_ID     : String  @mandatory  @Common.Label: 'App Control Number';
        SUBMISSION_TYPE    : String  @Common.Label: 'Submission Type';
        COMPONENT_LEVEL    : String  @Common.Label: 'Component Level';
        REQUEST_TYPE_ID    : String  @Common.Label: 'Request Type ID';
        CLAIM_TYPE_ID      : String  @Common.Label: 'Claim Type ID';
        CLAIM_TYPE_ITEM_ID : String  @Common.Label: 'Claim Type Item ID';
        FIELD              : String  @Common.Label: 'Field';
}

entity ZDISBURSEMENT_STATUS : managed {
    key DISBURSEMENT_STATUS_ID   : String(2)  @mandatory  @Common.Label: 'Disbursement Status ID';
        DISBURSEMENT_STATUS_DESC : String     @Common.Label: 'Disbursement Status Description';
        START_DATE               : Date       @Common.Label: 'Start Date';
        END_DATE                 : Date       @Common.Label: 'End Date';
        STATUS                   : String(10) @Common.Label: 'Status';
}

entity ZROLEHIERARCHY : managed {
    key ROLE : String  @mandatory  @Common.Label: 'Role';
        RANK : String  @mandatory  @Common.Label: 'Rank';

}

entity ZCONSTANTS : managed {
    key ID    : String  @mandatory  @Common.Label: 'Id';
    key VALUE : String  @mandatory  @Common.Label: 'Value';
}

entity ZCLM_APPR_REQ_STAT : managed {
    key EMP_ID     : String(6)      @mandatory  @Common.Label: 'Employee Id';
    key REQUEST_ID : String         @mandatory  @Common.Label: 'Request ID';
        AMOUNT     : Decimal(20, 2) @Common.Label: 'Amount';
        CLAIMED    : Boolean        @Common.Label: 'Claimed';
}

entity ZCLM_TYPE_EXCEPTION_LIST : managed {

    key EMP_ID          : String(6)      @mandatory  @Common.Label: 'Employee Id';
    key CLAIM_TYPE_ID   : String(20)     @mandatory  @Common.Label: 'Claim Type ID';
    key START_DATE      : Date           @mandatory  @Common.Label: 'Start Date';
    key END_DATE        : Date           @mandatory  @Common.Label: 'End Date';
        ELIGIBLE_AMOUNT : Decimal(20, 2) @Common.Label: 'Eligible Amount';
}
