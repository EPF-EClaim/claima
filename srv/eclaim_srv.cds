using {ECLAIM} from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv {
    entity ZEMP_MASTER       as projection on ECLAIM.ZEMP_MASTER;

    entity ZREQUEST_TYPE     as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZCLAIM_ITEM       as projection on ECLAIM.ZCLAIM_ITEM;

    entity ZREQUEST_HEADER   as projection on ECLAIM.ZREQUEST_HEADER;

    entity ZCLAIM_TYPE       as
        projection on ECLAIM.ZCLAIM_TYPE {
                // actions {
                //     @Common.DefaultValuesFunction: 'getDefaultsForCopy'
                //     action Copy(claim_type_id : String @(Common.Label: 'New Claim Type ID'),
                //     CLAIM_TYPE_DESC           : String @(Common.Label: 'Claim Type Description')
                //                                 ) returns zclaim_type;
            key CLAIM_TYPE_ID,
                CLAIM_TYPE_DESC,
                ZCLAIM_TYPE.ZCLAIM_TYPE_ITEM as Item


        // }
        };

    entity ZREQUEST_ITEM     as projection on ECLAIM.ZREQUEST_ITEM;
    entity ZREQ_ITEM_PART    as projection on ECLAIM.ZREQ_ITEM_PART;

    entity ZREQUEST_GRP      as projection on ECLAIM.ZREQUEST_GRP
        actions {
            @Common.DefaultValuesFunction: 'getDefaultsForCopy'
            action Copy(REQUEST_GROUP_ID: String @(Common.Label: 'REQUEST_GROUP_ID'),
                        REQUEST_GROUP_DESC: String @(Common.Label: 'REQUEST_GROUP_DESC'),
                        END_DATE: Date @(Common.Label: 'END_DATE'),
                        START_DATE: Date @(Common.Label: 'START_DATE'),
                        STATUS: String @(Common.Label: 'STATUS')
            ) returns ZREQUEST_GRP;
        };

    entity ZCLAIM_HEADER     as projection on ECLAIM.ZCLAIM_HEADER;

    entity ZNUM_RANGE        as projection on ECLAIM.ZNUM_RANGE;

    entity ZCLAIM_PURPOSE    as projection on ECLAIM.ZCLAIM_PURPOSE
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_PURPOSE_ID: String @(Common.Label: 'New Claim Purpose ID'),
                        CLAIM_PURPOSE_DESC: String @(Common.Label: 'Description')
            ) returns ZCLAIM_PURPOSE;
        };

    function getDefaultsForCopy(ID: ZCLAIM_PURPOSE:CLAIM_PURPOSE_ID) returns ZCLAIM_PURPOSE;

    entity ZRISK             as projection on ECLAIM.ZRISK
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(RISK_ID: String @(Common.Label: 'New Risk ID'),
                        RISK_DESC: String @(Common.Label: 'Risk Description')
            ) returns ZRISK;
        };

    entity ZCLAIM_TYPE_ITEM  as projection on ECLAIM.ZCLAIM_TYPE_ITEM
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_TYPE_ITEM_ID: String @(Common.Label: 'New Claim Type Item ID'),
                        CLAIM_TYPE_ITEM_DESC: String @(Common.Label: 'Claim Type Item Description')
            ) returns ZCLAIM_TYPE_ITEM;
        };

    entity ZAPP_FIELD_CTRL   as projection on ECLAIM.ZAPP_FIELD_CTRL
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

    entity ZARITH_OPT        as projection on ECLAIM.ZARITH_OPT
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(OPERATOR_ID: String  @mandatory  @Common.Label: 'Operator Id',
                        OPERATOR_DESC: String @Common.Label: 'Operator Description'
            ) returns ZARITH_OPT;
        };

    entity ZAPPROVAL_RULES   as projection on ECLAIM.ZAPPROVAL_RULES
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(ZSCENARIO: String  @mandatory  @Common.Label: 'ZSCENARIO',
                        ZSEQNO: String(1)  @mandatory  @Common.Label: 'ZSEQNO',
                        ZAPPR_LVL: String(1)  @mandatory  @Common.Label: 'ZAPPR_LVL',
                        ZAMT: Decimal @Common.Label: 'ZAMT',
                        ZAMT_OP: String(2) @Common.Label: 'ZAMT_OP',
                        ZDAYS: Integer @Common.Label: 'ZDAYS',
                        ZDAYS_OP: String(2) @Common.Label: 'ZDAYS_OP',
                        ZCOSTCTR: String @Common.Label: 'ZCOSTCTR',
                        ZCOSTCTR_OP: String(2) @Common.Label: 'ZCOSTCTR_OP',
                        ZRISK: String @Common.Label: 'ZRISK',
                        ZRISK_OP: String @Common.Label: 'ZRISK_OP',
                        ZAPPROVER_ID: String @Common.Label: 'ZAPPROVER_ID'
            ) returns ZAPPROVAL_RULES;
        };

    entity ZCLAIM_MAIN_CAT   as projection on ECLAIM.ZCLAIM_MAIN_CAT
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_MAIN_CAT_ID: String  @mandatory  @Common.Label: 'CLAIM_MAIN_CAT_ID',
                        CLAIM_MAIN_CAT_DESC: String @Common.Label: 'CLAIM_MAIN_CAT_DESC'
            ) returns ZCLAIM_MAIN_CAT;
        };

    entity ZCLAIM_CATEGORY   as projection on ECLAIM.ZCLAIM_CATEGORY
        actions {
            @Common.DefaultValueFunction: 'getDefaultsForCopy'
            action Copy(CLAIM_CAT_ID: String  @mandatory  @Common.Label: 'New Claim Category ID',
                        CLAIM_CATEGORY_DESC: String @Common.Label: 'Claim Category Description'
            ) returns ZCLAIM_CATEGORY;
        };

    entity ZSTATUS           as projection on ECLAIM.ZSTATUS;

    entity ZCLAIM_DISCLAIMER as projection on ECLAIM.ZCLAIM_DISCLAIMER;

    entity ZLODGING_CAT      as projection on ECLAIM.ZLODGING_CAT;

    entity ZROOM_TYPE        as projection on ECLAIM.ZROOM_TYPE;

    entity ZFLIGHT_CLASS     as projection on ECLAIM.ZFLIGHT_CLASS;

    entity ZCOUNTRY          as projection on ECLAIM.ZCOUNTRY;

    entity ZAREA             as projection on ECLAIM.ZAREA;

    entity ZCURRENCY         as projection on ECLAIM.ZCURRENCY;

    entity ZSTAFF_CAT        as projection on ECLAIM.ZSTAFF_CAT;

    entity ZMARITAL_STAT     as projection on ECLAIM.ZMARITAL_STAT;

    entity ZVEHICLE_TYPE     as projection on ECLAIM.ZVEHICLE_TYPE;

    entity ZKWSP_BRANCH      as projection on ECLAIM.ZKWSP_BRANCH;

    entity ZSTATE            as projection on ECLAIM.ZSTATE;

    entity ZUSER_TYPE        as projection on ECLAIM.ZUSER_TYPE;

    entity ZROLE             as projection on ECLAIM.ZROLE;

    entity ZDEPARTMENT       as projection on ECLAIM.ZDEPARTMENT;

    entity ZJOB_GROUP         as projection on ECLAIM.ZJOB_GROUP;

    entity ZEMP_TYPE         as projection on ECLAIM.ZEMP_TYPE;

    entity ZREGION         as projection on ECLAIM.ZREGION;

};



