using {ECLAIM} from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv {
    type Response {
        message : String;
    };

    action batchCreateEmployee(employees: many ZEMP_MASTER) returns Response;

    entity ZEMP_MASTER          as projection on ECLAIM.ZEMP_MASTER;

    entity ZREQUEST_TYPE        as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZCLAIM_ITEM          as projection on ECLAIM.ZCLAIM_ITEM;

    entity ZREQUEST_HEADER      as projection on ECLAIM.ZREQUEST_HEADER;

    entity ZCLAIM_TYPE          as
        projection on ECLAIM.ZCLAIM_TYPE {
            key CLAIM_TYPE_ID,
                CLAIM_TYPE_DESC,
                END_DATE,
                START_DATE,
                STATUS,
                ZCLAIM_TYPE.ZCLAIM_TYPE_ITEM as Items
        };

    entity ZREQUEST_ITEM        as projection on ECLAIM.ZREQUEST_ITEM;
    entity ZREQ_ITEM_PART       as projection on ECLAIM.ZREQ_ITEM_PART;

    entity ZCLAIM_HEADER        as projection on ECLAIM.ZCLAIM_HEADER;

    entity ZNUM_RANGE           as projection on ECLAIM.ZNUM_RANGE;

    entity ZRISK                as projection on ECLAIM.ZRISK
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(RISK_ID: String @(Common.Label: 'New Risk ID'),
                        RISK_DESC: String @(Common.Label: 'Risk Description')
            ) returns ZRISK;
        };

    entity ZCLAIM_TYPE_ITEM     as projection on ECLAIM.ZCLAIM_TYPE_ITEM
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_TYPE_ITEM_ID: String @(Common.Label: 'New Claim Type Item ID'),
                        CLAIM_TYPE_ITEM_DESC: String @(Common.Label: 'Claim Type Item Description')
            ) returns ZCLAIM_TYPE_ITEM;
        };

    entity ZAPP_FIELD_CTRL      as projection on ECLAIM.ZAPP_FIELD_CTRL
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_TYPE_ID: String  @mandatory  @Common.Label: 'New Claim Type ID',
                        CLAIM_TYPE_ITEM_ID: String  @mandatory  @Common.Label: 'New Claim Type Item ID',
                        FIELD01: Boolean @Common.Label: 'Field01',
                        FIELD02: Boolean @Common.Label: 'Field02',
                        FIELD03: Boolean @Common.Label: 'Field03',
                        FIELD04: Boolean @Common.Label: 'Field04',
                        FIELD05: Boolean @Common.Label: 'Field05',
                        FIELD06: Boolean @Common.Label: 'Field06',
                        FIELD07: Boolean @Common.Label: 'Field07',
                        FIELD08: Boolean @Common.Label: 'Field08',
                        FIELD09: Boolean @Common.Label: 'Field09',
                        FIELD10: Boolean @Common.Label: 'Field10',
                        FIELD11: Boolean @Common.Label: 'Field11',
                        FIELD12: Boolean @Common.Label: 'Field12',
                        FIELD13: Boolean @Common.Label: 'Field13',
                        FIELD14: Boolean @Common.Label: 'Field14',
                        FIELD15: Boolean @Common.Label: 'Field15',
                        FIELD16: Boolean @Common.Label: 'Field16',
                        FIELD17: Boolean @Common.Label: 'Field17',
                        FIELD18: Boolean @Common.Label: 'Field18',
                        FIELD19: Boolean @Common.Label: 'Field19',
                        FIELD20: Boolean @Common.Label: 'Field20',
            ) returns ZAPP_FIELD_CTRL;
        };

    entity ZCLAIM_CATEGORY      as projection on ECLAIM.ZCLAIM_CATEGORY
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_CAT_ID: String  @mandatory  @Common.Label: 'New Claim Category ID',
                        CLAIM_CATEGORY_DESC: String @Common.Label: 'Claim Category Description'
            ) returns ZCLAIM_CATEGORY;
        };

    entity ZSTATUS              as projection on ECLAIM.ZSTATUS;

    entity ZLODGING_CAT         as projection on ECLAIM.ZLODGING_CAT;

    entity ZROOM_TYPE           as projection on ECLAIM.ZROOM_TYPE;

    entity ZFLIGHT_CLASS        as projection on ECLAIM.ZFLIGHT_CLASS;

    entity ZCOUNTRY             as projection on ECLAIM.ZCOUNTRY;

    entity ZAREA                as projection on ECLAIM.ZAREA;

    entity ZSTAFF_CAT           as projection on ECLAIM.ZSTAFF_CAT;

    entity ZMARITAL_STAT        as projection on ECLAIM.ZMARITAL_STAT;

    entity ZVEHICLE_TYPE        as projection on ECLAIM.ZVEHICLE_TYPE;

    entity ZSTATE               as projection on ECLAIM.ZSTATE;

    entity ZUSER_TYPE           as projection on ECLAIM.ZUSER_TYPE;

    entity ZROLE                as projection on ECLAIM.ZROLE;

    entity ZDEPARTMENT          as projection on ECLAIM.ZDEPARTMENT;

    entity ZJOB_GROUP           as projection on ECLAIM.ZJOB_GROUP;

    entity ZEMP_TYPE            as projection on ECLAIM.ZEMP_TYPE;

    entity ZREGION              as projection on ECLAIM.ZREGION;

    entity ZRATE_KM             as projection on ECLAIM.ZRATE_KM;

    entity ZSUBMISSION_TYPE     as projection on ECLAIM.ZSUBMISSION_TYPE;

    entity ZOFFICE_LOCATION     as projection on ECLAIM.ZOFFICE_LOCATION;

    entity ZOFFICE_DISTANCE     as projection on ECLAIM.ZOFFICE_DISTANCE;

    entity ZLOC_TYPE            as projection on ECLAIM.ZLOC_TYPE;

    entity ZMATERIAL_GROUP      as projection on ECLAIM.ZMATERIAL_GROUP;

    entity ZINDIV_GROUP         as projection on ECLAIM.ZINDIV_GROUP;

    entity ZTRAIN_COURSE_PART   as projection on ECLAIM.ZTRAIN_COURSE_PART;

    entity ZEMP_DEPENDENT       as projection on ECLAIM.ZEMP_DEPENDENT;

    entity ZBUDGET              as projection on ECLAIM.ZBUDGET;

    entity ZAPPROVAL_1          as projection on ECLAIM.ZAPPROVAL_1;

    entity ZAPPROVAL_2          as projection on ECLAIM.ZAPPROVAL_2;

    entity ZAPPROVAL_3          as projection on ECLAIM.ZAPPROVAL_3;

    entity ZEMP_VEHICLE         as projection on ECLAIM.ZEMP_VEHICLE;

    entity ZCOST_CENTER         as projection on ECLAIM.ZCOST_CENTER;

    entity ZEMP_RELATIONSHIP    as projection on ECLAIM.ZEMP_RELATIONSHIP;

    entity ZINTERNAL_ORDER      as projection on ECLAIM.ZINTERNAL_ORDER;

    entity ZGL_ACCOUNT          as projection on ECLAIM.ZGL_ACCOUNT;

    entity ZLOOKUP_FIELD        as projection on ECLAIM.ZLOOKUP_FIELD;

    entity ZMARITAL_CAT         as projection on ECLAIM.ZMARITAL_CAT;

    entity ZPROJECT_HDR         as projection on ECLAIM.ZPROJECT_HDR;

    entity ZBRANCH              as projection on ECLAIM.ZBRANCH;

    entity ZEMP_CA_PAYMENT      as projection on ECLAIM.ZEMP_CA_PAYMENT;

    entity ZPERDIEM_ENT         as projection on ECLAIM.ZPERDIEM_ENT;

    entity ZHOUSING_LOAN_SCHEME as projection on ECLAIM.ZHOUSING_LOAN_SCHEME;

    entity ZLENDER_NAME         as projection on ECLAIM.ZLENDER_NAME;

    entity ZREJECT_REASON       as projection on ECLAIM.ZREJECT_REASON;
};
