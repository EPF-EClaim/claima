using { ECLAIM } from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv {
    entity ZEMP_MASTER    as projection on ECLAIM.ZEMP_MASTER;

    entity ZREQUEST_TYPE   as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZREQUEST_HEADER as projection on ECLAIM.ZREQUEST_HEADER;

    entity ZCLAIM_TYPE     as projection on ECLAIM.ZCLAIM_TYPE;

    entity ZCLAIM_TYPE_ITEM as projection on ECLAIM.ZCLAIM_TYPE_ITEM;

    entity ZREQUEST_ITEM   as projection on ECLAIM.ZREQUEST_ITEM;

    entity ZREQUEST_GRP    as projection on ECLAIM.ZREQUEST_GRP;

    entity ZCLAIM_HEADER   as projection on ECLAIM.ZCLAIM_HEADER;

    entity ZNUM_RANGE      as projection on ECLAIM.ZNUM_RANGE;

    entity ZCLAIM_PURPOSE  as projection on ECLAIM.ZCLAIM_PURPOSE;
}
