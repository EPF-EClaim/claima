using {ECLAIM} from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv @(requires: 'authenticated-user'){
    type Response {
        message : String;
    };

    @odata.singleton
    entity FeatureControl {
        operationHidden  : Boolean;
        operationEnabled : Boolean;
    };

    @odata.singleton
    entity BudgetControl {
        operationHidden  : Boolean;
        operationEnabled : Boolean;
    }

    type budgetdata {
        YEAR            : String(4);
        INTERNAL_ORDER  : String;
        FUND_CENTER     : String;
        MATERIAL_GROUP  : String;
        COMMITMENT_ITEM : String;
        CLAIM_TYPE_ITEM : String;
        AMOUNT          : Decimal;
        INDICATOR       : String; //CLM and REQ
        ACTION          : String; //SUBMIT, REJECT, APPROVE
    }

    type BudgetResult {
        YEAR               : String;
        INTERNAL_ORDER     : String;
        FUND_CENTER        : String;
        MATERIAL_GROUP     : String;
        COMMITMENT_ITEM    : String;
        AMOUNT             : Decimal(15, 2);
        CLAIM_TYPE_ITEM    : String;
        PREV_CONSUMED      : Decimal(15, 2);
        NEW_CONSUMED       : Decimal(15, 2);
        PREV_ACTUAL        : Decimal(15, 2);
        NEW_ACTUAL         : Decimal(15, 2);
        PREV_COMMITMENT    : Decimal(15, 2);
        NEW_COMMITMENT     : Decimal(15, 2);
        PREV_BUDGETBALANCE : Decimal(15, 2);
        NEW_BUDGETBALANCE  : Decimal(15, 2);
        STATUS             : String;
    }

    action   batchCreateEmployee(employees: many ZEMP_MASTER)                                  returns Response;

    action   batchCreateDependent(dependents: many ZEMP_DEPENDENT)                             returns Response;

    action   batchCreateCostCenter(costcenters: many ZCOST_CENTER)                             returns Response;

    action   budgetchecking(budget: many budgetdata)                                           returns many BudgetResult;


    entity ZREQUEST_TYPE                 as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZCLAIM_ITEM                   as
        projection on ECLAIM.ZCLAIM_ITEM {
            @Core.Computed CLAIM_SUB_ID,
            *
        };

    entity ZREQUEST_HEADER               as
        projection on ECLAIM.ZREQUEST_HEADER {
            @Core.Computed REQUEST_ID,
            *
        };

    entity ZEMP_MASTER                   as projection on ECLAIM.ZEMP_MASTER;


    entity ZCLAIM_TYPE                   as
        projection on ECLAIM.ZCLAIM_TYPE {
            key CLAIM_TYPE_ID,
                CLAIM_TYPE_DESC,
                GL_ACCOUNT,
                IND_OR_GROUP,
                REQUEST_TYPE,
                PROJECT_CLAIM,
                createdAt,
                createdBy,
                modifiedAt,
                modifiedBy,
                END_DATE,
                START_DATE,
                STATUS,
                COST_CENTER,
                ZCLAIM_TYPE.ZCLAIM_TYPE_ITEM as Items
        };

    entity ZREQUEST_ITEM                 as
        projection on ECLAIM.ZREQUEST_ITEM {
            @Core.Computed REQUEST_SUB_ID,
            *
        };

    entity ZREQ_ITEM_PART                as projection on ECLAIM.ZREQ_ITEM_PART;

    entity ZCLAIM_HEADER                 as
        projection on ECLAIM.ZCLAIM_HEADER {
            @Core.Computed CLAIM_ID,
            *
        };

    entity ZNUM_RANGE                    as projection on ECLAIM.ZNUM_RANGE;

    entity ZRISK                         as projection on ECLAIM.ZRISK;

    entity ZCLAIM_TYPE_ITEM              as projection on ECLAIM.ZCLAIM_TYPE_ITEM;

    entity ZCLAIM_CATEGORY               as projection on ECLAIM.ZCLAIM_CATEGORY;

    entity ZSTATUS                       as projection on ECLAIM.ZSTATUS;

    entity ZLODGING_CAT                  as projection on ECLAIM.ZLODGING_CAT;

    entity ZROOM_TYPE                    as projection on ECLAIM.ZROOM_TYPE;

    entity ZFLIGHT_CLASS                 as projection on ECLAIM.ZFLIGHT_CLASS;

    entity ZCOUNTRY                      as projection on ECLAIM.ZCOUNTRY;

    entity ZAREA                         as projection on ECLAIM.ZAREA;

    entity ZMARITAL_STAT                 as projection on ECLAIM.ZMARITAL_STAT;

    entity ZVEHICLE_TYPE                 as projection on ECLAIM.ZVEHICLE_TYPE;

    entity ZSTATE                        as projection on ECLAIM.ZSTATE;

    entity ZUSER_TYPE                    as projection on ECLAIM.ZUSER_TYPE;

    entity ZROLE                         as projection on ECLAIM.ZROLE;

    entity ZDEPARTMENT                   as projection on ECLAIM.ZDEPARTMENT;

    entity ZJOB_GROUP                    as projection on ECLAIM.ZJOB_GROUP;

    entity ZEMP_TYPE                     as projection on ECLAIM.ZEMP_TYPE;

    entity ZREGION                       as projection on ECLAIM.ZREGION;

    entity ZRATE_KM                      as projection on ECLAIM.ZRATE_KM;

    entity ZSUBMISSION_TYPE              as projection on ECLAIM.ZSUBMISSION_TYPE;

    entity ZOFFICE_LOCATION              as projection on ECLAIM.ZOFFICE_LOCATION;

    entity ZOFFICE_DISTANCE              as projection on ECLAIM.ZOFFICE_DISTANCE;

    entity ZLOC_TYPE                     as projection on ECLAIM.ZLOC_TYPE;

    entity ZMATERIAL_GROUP               as projection on ECLAIM.ZMATERIAL_GROUP;

    entity ZINDIV_GROUP                  as projection on ECLAIM.ZINDIV_GROUP;

    entity ZTRAIN_COURSE_PART            as projection on ECLAIM.ZTRAIN_COURSE_PART;

    entity ZEMP_DEPENDENT                as projection on ECLAIM.ZEMP_DEPENDENT;

    entity ZBUDGET                       as projection on ECLAIM.ZBUDGET;

    entity ZVEHICLE_OWNERSHIP            as projection on ECLAIM.ZVEHICLE_OWNERSHIP;

    entity ZCOST_CENTER                  as projection on ECLAIM.ZCOST_CENTER;

    entity ZEMP_RELATIONSHIP             as projection on ECLAIM.ZEMP_RELATIONSHIP;

    entity ZINTERNAL_ORDER               as projection on ECLAIM.ZINTERNAL_ORDER;

    entity ZGL_ACCOUNT                   as projection on ECLAIM.ZGL_ACCOUNT;

    entity ZMARITAL_CAT                  as projection on ECLAIM.ZMARITAL_CAT;

    entity ZPROJECT_HDR                  as projection on ECLAIM.ZPROJECT_HDR;

    entity ZBRANCH                       as projection on ECLAIM.ZBRANCH;

    entity ZEMP_CA_PAYMENT               as projection on ECLAIM.ZEMP_CA_PAYMENT;

    entity ZPERDIEM_ENT                  as projection on ECLAIM.ZPERDIEM_ENT;

    entity ZHOUSING_LOAN_SCHEME          as projection on ECLAIM.ZHOUSING_LOAN_SCHEME;

    entity ZLENDER_NAME                  as projection on ECLAIM.ZLENDER_NAME;

    entity ZREJECT_REASON                as projection on ECLAIM.ZREJECT_REASON;

    entity ZCURRENCY                     as projection on ECLAIM.ZCURRENCY;

    entity ZMOBILE_CATEGORY_PURPOSE      as projection on ECLAIM.ZMOBILE_CATEGORY_PURPOSE;

    entity ZVEHICLE_CLASS                as projection on ECLAIM.ZVEHICLE_CLASS;

    entity ZINSURANCE_PROVIDER           as projection on ECLAIM.ZINSURANCE_PROVIDER;

    type UserInfo {
        id          : String;
        userType    : String;
        costcenters : String;
        userId      : String;
        name        : String;
        position    : String;
        origin      : String;
        grade       : String;
        department  : String;
        user        : String;
    }

    function getUserType()                                                                     returns UserInfo;

    action   sendEmail(ApproverName: String,
                       SubmissionDate: String,
                       ClaimantName: String,
                       InstanceID: String,
                       ClaimType: String,
                       ClaimID: String,
                       RecipientName: String,
                       Action: String,
                       ReceiverEmail: String,
                       CCEmail: String,
                       EmailTitle: String,
                       EmailBody: String,
                       NextApproverName: String,
                       RejectReason: String,
                       ApproverComments: String)                                               returns Response;

    entity ZINSURANCE_PACKAGE            as projection on ECLAIM.ZINSURANCE_PACKAGE;

    entity ZPROFESIONAL_BODY             as projection on ECLAIM.ZPROFESIONAL_BODY;

    entity ZSTUDY_LEVELS                 as projection on ECLAIM.ZSTUDY_LEVELS;

    entity ZTRANSFER_MODE                as projection on ECLAIM.ZTRANSFER_MODE;

    entity ZTRANSPORT_PASSING            as projection on ECLAIM.ZTRANSPORT_PASSING;

    entity ZTRAVEL_TYPE                  as projection on ECLAIM.ZTRAVEL_TYPE;

    entity ZFAMILY_TIMING                as projection on ECLAIM.ZFAMILY_TIMING;

    entity ZSPORTS_REPRESENTATION        as projection on ECLAIM.ZSPORTS_REPRESENTATION;

    entity ZPOSITION_EVENT_REASON        as projection on ECLAIM.ZPOSITION_EVENT_REASON;

    entity ZEMP_DEPENDENT_TYPE           as projection on ECLAIM.ZEMP_DEPENDENT_TYPE;

    entity ZCLAIM_BASIS                  as projection on ECLAIM.ZCLAIM_BASIS;

    entity ZHOTEL_LODGING                as projection on ECLAIM.ZHOTEL_LODGING;

    entity ZFARE_TYPE                    as projection on ECLAIM.ZFARE_TYPE;

    entity ZMETER_CUBE                   as projection on ECLAIM.ZMETER_CUBE;

    entity ZTRAVEL_DAYS                  as projection on ECLAIM.ZTRAVEL_DAYS;

    entity ZELIGIBILITY_RULE             as projection on ECLAIM.ZELIGIBILITY_RULE;

    entity ZWORKFLOW_STEP                as projection on ECLAIM.ZWORKFLOW_STEP;

    entity ZWORKFLOW_RULE                as projection on ECLAIM.ZWORKFLOW_RULE;

    entity ZAPPROVER_DETAILS_CLAIMS      as projection on ECLAIM.ZAPPROVER_DETAILS_CLAIMS;

    entity ZAPPROVER_DETAILS_PREAPPROVAL as projection on ECLAIM.ZAPPROVER_DETAILS_PREAPPROVAL;

    entity ZSUBSTITUTION_RULES           as projection on ECLAIM.ZSUBSTITUTION_RULES;

    entity ZDB_STRUCTURE                 as projection on ECLAIM.ZDB_STRUCTURE;

    type PreApproveClaims {
        REQUEST_ID     : String;
        REQUEST_SUB_ID : String;
    }

    action   batchUpdatePreApproved(PreApprove: many PreApproveClaims)                         returns Response;

    function updateDisbursementStatus()                                                        returns array of Response;

    entity ZDISBURSEMENT_STATUS          as projection on ECLAIM.ZDISBURSEMENT_STATUS;

    action   batchCreateCourse(course: many ZTRAIN_COURSE_PART)                                returns Response;


    type BudgetProcessResult {
        status          : String;
        year            : String;
        internalorder   : String;
        commitment_item : String;
        fund_center     : String;
        materialgroup   : String;
        currentBudget   : Decimal(15, 2);
        budgetBalance   : Decimal(15, 2);
    }


    action   batchCreateBudget(budget: many ZBUDGET)                                           returns BudgetProcessResult;

    entity ZROLEHIERARCHY                as projection on ECLAIM.ZROLEHIERARCHY;
    entity ZCONSTANTS                    as projection on ECLAIM.ZCONSTANTS;

    entity ZCLM_APPR_REQ_STAT            as projection on ECLAIM.ZCLM_APPR_REQ_STAT;
    action   onFinalApproveInsert(ApproveRequest: many ZCLM_APPR_REQ_STAT)                     returns Response;

    type DisbursementUpdateInput {
        REQUEST_ID          : String;
        DISBURSEMENT_STATUS : String(2);
    }

    action   batchDisbursementUpdate(disbursement: many DisbursementUpdateInput)               returns many ZEMP_CA_PAYMENT;

    type ApproverDetails {
        ID                     : String;
        LEVEL                  : Integer;
        APPROVER_ID            : String;
        SUBSTITUTE_APPROVER_ID : String;
        STATUS                 : String;
        REJECT_REASON_ID       : String(3);
        PROCESS_TIMESTAMP      : String;
        COMMENT                : String;
    }

    action   UpdateApproverDetails(aPayloadToCreateApproverDetailsTable: many ApproverDetails) returns Response;

    action   DeleteApproverDetails(ID: String)                                                 returns Response;

    type eligibleCheck {
        MOBILE_BILL_ELIGIBLE    : Boolean;
        MOBILE_BILL_ELIG_AMOUNT : Decimal(15, 2);
    }

    function checkEligibleMobileClaim(sEmployeeId: String) returns String; 

    type EligibilityPayload{
        CheckFields: many EligibilityCheckFields;
        ClaimType: String;
        ClaimTypeItem: String;
        EmpId: String;
        RecordId: String;
        RecordSubId: String;
    }

    type EligibilityCheckFields{
        fieldName: String;
        value: LargeString @Core.MediaType: 'application/json';
        result: LargeString @Core.MediaType: 'application/json';
    }

    action EligibilityCheck(aPayload: many EligibilityPayload) returns many Response;
    type perdiem {
        amount : Decimal(15, 2);
        daily_allowance: Decimal(15,2);
        currency_code: String;
    }

    function getAmountEntitlement(employeeid: String,
                                  day:Integer, 
                                  hours: Decimal(5, 1), 
                                  location: String, 
                                  claimtypeid: String, 
                                  claimtypeitem: String,
                                  breakfast: Integer, 
                                  lunch: Integer, 
                                  dinner: Integer) returns perdiem;

    entity ZCLM_TYPE_EXCEPTION_LIST                as projection on ECLAIM.ZCLM_TYPE_EXCEPTION_LIST;

    function checkDefaultCostCenter(sClaimTypeId: String) returns String;
    
    function getEligibleAmountEPengakut(
        sMaritalStatus: String,
        sEmployeeType:  String
    ) returns Decimal(16, 2);
    
    type reminders {
        empName     : String;
        empEmail    : String; 
        ccEmail     : String;
        tripEndDate : String;
        scenario    : String; 
        milestone   : String;
    }
    
    function getEmailReminder() returns array of reminders;

    function getOfficeDistance(
        sFromState: String,
        sFromOffice: String,
        sToState: String,
        sToOffice: String,
    ) returns String;

    action CheckUserClaimTypes(ID: String) returns many Response;

    type PreApprovalUsageCheck {
        isUsed: Boolean
    }

    function checkPreApprovalUsage(requestID: String) returns PreApprovalUsageCheck;

    type ParticipantKey {
        REQUEST_ID: String;
        REQUEST_SUB_ID: String;
        PARTICIPANTS_ID: String;
    }
    action deleteParticipants(participants: array of ParticipantKey) returns Boolean;
};
