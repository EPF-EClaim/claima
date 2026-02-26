using {ECLAIM} from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv @(requires: 'authenticated-user'){
    type Response {
        message : String;
    };

    action   batchCreateEmployee(employees: many ZEMP_MASTER)      returns Response;

    action   batchCreateDependent(dependents: many ZEMP_DEPENDENT) returns Response;

    action   batchCreateCostCenter(costcenters: many ZCOST_CENTER) returns Response;

    entity ZEMP_MASTER              as projection on ECLAIM.ZEMP_MASTER;

    entity ZREQUEST_TYPE            as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZCLAIM_ITEM              as projection on ECLAIM.ZCLAIM_ITEM;

    entity ZREQUEST_HEADER          as projection on ECLAIM.ZREQUEST_HEADER;

    entity ZCLAIM_TYPE              as
        projection on ECLAIM.ZCLAIM_TYPE {
            key CLAIM_TYPE_ID,
                CLAIM_TYPE_DESC,
                GL_ACCOUNT,
                CATEGORY_ID,
                createdAt,
                createdBy,
                modifiedAt,
                modifiedBy,
                END_DATE,
                START_DATE,
                STATUS,
                ZCLAIM_TYPE.ZCLAIM_TYPE_ITEM as Items
        };

    entity ZREQUEST_ITEM            as projection on ECLAIM.ZREQUEST_ITEM;

    entity ZREQ_ITEM_PART           as projection on ECLAIM.ZREQ_ITEM_PART;

    entity ZCLAIM_HEADER            as projection on ECLAIM.ZCLAIM_HEADER;

    entity ZNUM_RANGE               as projection on ECLAIM.ZNUM_RANGE;

    entity ZRISK                    as projection on ECLAIM.ZRISK;

    entity ZCLAIM_TYPE_ITEM         as projection on ECLAIM.ZCLAIM_TYPE_ITEM;

    entity ZAPP_FIELD_CTRL          as projection on ECLAIM.ZAPP_FIELD_CTRL;

    entity ZCLAIM_CATEGORY          as projection on ECLAIM.ZCLAIM_CATEGORY;

    entity ZSTATUS                  as projection on ECLAIM.ZSTATUS;

    entity ZLODGING_CAT             as projection on ECLAIM.ZLODGING_CAT;

    entity ZROOM_TYPE               as projection on ECLAIM.ZROOM_TYPE;

    entity ZFLIGHT_CLASS            as projection on ECLAIM.ZFLIGHT_CLASS;

    entity ZCOUNTRY                 as projection on ECLAIM.ZCOUNTRY;

    entity ZAREA                    as projection on ECLAIM.ZAREA;

    entity ZMARITAL_STAT            as projection on ECLAIM.ZMARITAL_STAT;

    entity ZVEHICLE_TYPE            as projection on ECLAIM.ZVEHICLE_TYPE;

    entity ZSTATE                   as projection on ECLAIM.ZSTATE;

    entity ZUSER_TYPE               as projection on ECLAIM.ZUSER_TYPE;

    entity ZROLE                    as projection on ECLAIM.ZROLE;

    entity ZDEPARTMENT              as projection on ECLAIM.ZDEPARTMENT;

    entity ZJOB_GROUP               as projection on ECLAIM.ZJOB_GROUP;

    entity ZEMP_TYPE                as projection on ECLAIM.ZEMP_TYPE;

    entity ZREGION                  as projection on ECLAIM.ZREGION;

    entity ZRATE_KM                 as projection on ECLAIM.ZRATE_KM;

    entity ZSUBMISSION_TYPE         as projection on ECLAIM.ZSUBMISSION_TYPE;

    entity ZOFFICE_LOCATION         as projection on ECLAIM.ZOFFICE_LOCATION;

    entity ZOFFICE_DISTANCE         as projection on ECLAIM.ZOFFICE_DISTANCE;

    entity ZLOC_TYPE                as projection on ECLAIM.ZLOC_TYPE;

    entity ZMATERIAL_GROUP          as projection on ECLAIM.ZMATERIAL_GROUP;

    entity ZINDIV_GROUP             as projection on ECLAIM.ZINDIV_GROUP;

    entity ZTRAIN_COURSE_PART       as projection on ECLAIM.ZTRAIN_COURSE_PART;

    entity ZEMP_DEPENDENT           as projection on ECLAIM.ZEMP_DEPENDENT;

    entity ZBUDGET                  as projection on ECLAIM.ZBUDGET;

    entity ZVEHICLE_OWNERSHIP       as projection on ECLAIM.ZVEHICLE_OWNERSHIP;

    entity ZCOST_CENTER             as projection on ECLAIM.ZCOST_CENTER;

    entity ZEMP_RELATIONSHIP        as projection on ECLAIM.ZEMP_RELATIONSHIP;

    entity ZINTERNAL_ORDER          as projection on ECLAIM.ZINTERNAL_ORDER;

    entity ZGL_ACCOUNT              as projection on ECLAIM.ZGL_ACCOUNT;

    entity ZMARITAL_CAT             as projection on ECLAIM.ZMARITAL_CAT;

    entity ZPROJECT_HDR             as projection on ECLAIM.ZPROJECT_HDR;

    entity ZBRANCH                  as projection on ECLAIM.ZBRANCH;

    entity ZEMP_CA_PAYMENT          as projection on ECLAIM.ZEMP_CA_PAYMENT;

    entity ZPERDIEM_ENT             as projection on ECLAIM.ZPERDIEM_ENT;

    entity ZHOUSING_LOAN_SCHEME     as projection on ECLAIM.ZHOUSING_LOAN_SCHEME;

    entity ZLENDER_NAME             as projection on ECLAIM.ZLENDER_NAME;

    entity ZREJECT_REASON           as projection on ECLAIM.ZREJECT_REASON;

    entity ZCURRENCY                as projection on ECLAIM.ZCURRENCY;

    entity ZMOBILE_CATEGORY_PURPOSE as projection on ECLAIM.ZMOBILE_CATEGORY_PURPOSE;

    entity ZVEHICLE_CLASS           as projection on ECLAIM.ZVEHICLE_CLASS;

    entity ZINSURANCE_PROVIDER      as projection on ECLAIM.ZINSURANCE_PROVIDER;
    type UserInfo {
        id       : String;
        userType : String;
    }

    function getUserType() returns UserInfo;

    entity ZINSURANCE_PACKAGE       as projection on ECLAIM.ZINSURANCE_PACKAGE;

    entity ZPROFESIONAL_BODY        as projection on ECLAIM.ZPROFESIONAL_BODY;

    entity ZSTUDY_LEVELS            as projection on ECLAIM.ZSTUDY_LEVELS;

    entity ZTRANSFER_MODE           as projection on ECLAIM.ZTRANSFER_MODE;

    entity ZTRANSPORT_PASSING       as projection on ECLAIM.ZTRANSPORT_PASSING;

    entity ZTRAVEL_TYPE             as projection on ECLAIM.ZTRAVEL_TYPE;

    entity ZFAMILY_TIMING           as projection on ECLAIM.ZFAMILY_TIMING;

    entity ZSPORTS_REPRESENTATION   as projection on ECLAIM.ZSPORTS_REPRESENTATION;

    entity ZPOSITION_EVENT_REASON   as projection on ECLAIM.ZPOSITION_EVENT_REASON;

    entity ZEMP_DEPENDENT_TYPE      as projection on ECLAIM.ZEMP_DEPENDENT_TYPE;

    entity ZCLAIM_BASIS             as projection on ECLAIM.ZCLAIM_BASIS;

    entity ZHOTEL_LODGING           as projection on ECLAIM.ZHOTEL_LODGING;

    entity ZFARE_TYPE               as projection on ECLAIM.ZFARE_TYPE;

    entity ZMETER_CUBE              as projection on ECLAIM.ZMETER_CUBE;

    entity ZTRAVEL_DAYS             as projection on ECLAIM.ZTRAVEL_DAYS;

    entity ZELIGIBILITY_RULE        as projection on ECLAIM.ZELIGIBILITY_RULE;
};
