using {ECLAIM} from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv {
    entity ZEMP_MASTER       as projection on ECLAIM.ZEMP_MASTER;

    entity ZREQUEST_TYPE     as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZREQUEST_HEADER   as projection on ECLAIM.ZREQUEST_HEADER;

    entity ZCLAIM_TYPE       as projection on ECLAIM.ZCLAIM_TYPE;

    entity ZREQUEST_ITEM     as projection on ECLAIM.ZREQUEST_ITEM;

    entity ZREQUEST_GRP      as projection on ECLAIM.ZREQUEST_GRP;

    entity ZCLAIM_HEADER     as projection on ECLAIM.ZCLAIM_HEADER;

    entity ZNUM_RANGE        as projection on ECLAIM.ZNUM_RANGE;

    entity ZCLAIM_PURPOSE    as projection on ECLAIM.ZCLAIM_PURPOSE;

    entity ZRISK             as projection on ECLAIM.ZRISK;

    entity ZCLAIM_TYPE_ITEM  as projection on ECLAIM.ZCLAIM_TYPE_ITEM;

    entity ZAPP_FIELD_CTRL   as projection on ECLAIM.ZAPP_FIELD_CTRL;

    entity ZARITH_OPT        as projection on ECLAIM.ZARITH_OPT;

    entity ZAPPROVAL_RULES   as projection on ECLAIM.ZAPPROVAL_RULES;

    entity ZCLAIM_MAIN_CAT   as projection on ECLAIM.ZCLAIM_MAIN_CAT;

    entity ZCLAIM_CATEGORY   as projection on ECLAIM.ZCLAIM_CATEGORY;

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
}
