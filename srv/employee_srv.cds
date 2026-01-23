using ZEMP_MASTER from '../db/employee';

@path: 'EmployeeSrv'
service employee_srv {
    entity EmployeeData    as projection on ZEMP_MASTER.ZEMP_MASTER;

    entity ZREQUEST_TYPE   as projection on ZEMP_MASTER.ZREQUEST_TYPE;

    @cds.redirection.target
    entity ZREQUEST_HEADER as projection on ZEMP_MASTER.ZREQUEST_HEADER;

    @cds.redirection.target
    entity ZCLAIM_TYPE     as projection on ZEMP_MASTER.ZCLAIM_TYPE;

    @cds.redirection.target
    entity ZREQUEST_ITEM   as projection on ZEMP_MASTER.ZREQUEST_ITEM;

    @cds.redirection.target
    entity ZREQUEST_TYPE1  as projection on ZEMP_MASTER.ZREQUEST_TYPE;

    @cds.redirection.target
    entity ZREQUEST_GRP    as projection on ZEMP_MASTER.ZREQUEST_GRP;

    @cds.redirection.target
    entity ZCLAIM_HEADER   as projection on ZEMP_MASTER.ZCLAIM_HEADER;

    entity ZNUM_RANGE      as projection on ZEMP_MASTER.ZNUM_RANGE;
}
