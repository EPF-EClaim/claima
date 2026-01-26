using  { ZEMP_MASTER }
   from '../db/eclaim';

@path : 'EmployeeSrv'
service eclaim_srv
{
    entity EmployeeData as
        projection on ZEMP_MASTER.ZEMP_MASTER;

    entity ZREQUEST_TYPE as
        projection on ZEMP_MASTER.ZREQUEST_TYPE;

   
    entity ZREQUEST_HEADER as
        projection on ZEMP_MASTER.ZREQUEST_HEADER;


    entity ZCLAIM_TYPE as
        projection on ZEMP_MASTER.ZCLAIM_TYPE;


    entity ZREQUEST_ITEM as
        projection on ZEMP_MASTER.ZREQUEST_ITEM;


    entity ZREQUEST_GRP as
        projection on ZEMP_MASTER.ZREQUEST_GRP;

    entity ZCLAIM_HEADER as
        projection on ZEMP_MASTER.ZCLAIM_HEADER;

    entity ZNUM_RANGE as
        projection on ZEMP_MASTER.ZNUM_RANGE;
}
