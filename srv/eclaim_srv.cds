using {ECLAIM} from '../db/eclaim';

@path: 'EmployeeSrv'
service eclaim_srv @(requires: 'authenticated-user') {
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

    type paymentdata {
        ID           : String;
        PAYMENT_DATE : Date;
        STATUS_ID    : String;
    }

    action   batchCreateEmployee(employees: many ZEMP_MASTER)                                            returns Response;

    action   batchCreateDependent(dependents: many ZEMP_DEPENDENT)                                       returns Response;

    action   batchCreateCostCenter(costcenters: many ZCOST_CENTER)                                       returns Response;

    action   budgetchecking(budget: many budgetdata)                                                     returns many BudgetResult;

    action   batchUpdatePaymentStatus(aPayment: many paymentdata)                                        returns Response;


    entity ZREQUEST_TYPE                 as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZCLAIM_ITEM                   as
        projection on ECLAIM.ZCLAIM_ITEM {
            @Core.Computed CLAIM_SUB_ID,
            *
        };

    @cds.redirection.target
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
                ZCOST_CENTER.COST_CENTER_DESC as COST_CENTER_DESC,
                ZCLAIM_TYPE.ZCLAIM_TYPE_ITEM  as Items
        };

    entity ZREQUEST_ITEM                 as
        projection on ECLAIM.ZREQUEST_ITEM {
            @Core.Computed REQUEST_SUB_ID,
            *
        };

    entity ZREQ_ITEM_PART                as projection on ECLAIM.ZREQ_ITEM_PART;

    @cds.redirection.target
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

    @cds.redirection.target
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

     type UserRoles {
        isClaimant     : Boolean;
        isApprover     : Boolean;
        isDTDAdmin     : Boolean;
        isAdminSystem  : Boolean;
        isAdminCC      : Boolean;
    }

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
        roles       : UserRoles;
    }

    function getUserType()                                                                               returns UserInfo;

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
                       ApproverComments: String)                                                         returns Response;

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

    @cds.redirection.target
    entity ZAPPROVER_DETAILS_CLAIMS      as projection on ECLAIM.ZAPPROVER_DETAILS_CLAIMS;

    @cds.redirection.target
    entity ZAPPROVER_DETAILS_PREAPPROVAL as projection on ECLAIM.ZAPPROVER_DETAILS_PREAPPROVAL;

    entity ZSUBSTITUTION_RULES           as projection on ECLAIM.ZSUBSTITUTION_RULES;

    entity ZDB_STRUCTURE                 as projection on ECLAIM.ZDB_STRUCTURE;

    type PreApproveClaims {
        REQUEST_ID     : String;
        REQUEST_SUB_ID : String;
    }

    action   batchUpdatePreApproved(PreApprove: many PreApproveClaims)                                   returns Response;

    function updateDisbursementStatus()                                                                  returns array of Response;

    entity ZDISBURSEMENT_STATUS          as projection on ECLAIM.ZDISBURSEMENT_STATUS;

    action   batchCreateCourse(course: many ZTRAIN_COURSE_PART)                                          returns Response;


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


    action   batchCreateBudget(budget: many ZBUDGET)                                                     returns BudgetProcessResult;

    entity ZROLEHIERARCHY                as projection on ECLAIM.ZROLEHIERARCHY;
    entity ZCONSTANTS                    as projection on ECLAIM.ZCONSTANTS;

    entity ZCLM_APPR_REQ_STAT            as projection on ECLAIM.ZCLM_APPR_REQ_STAT;
    action   onFinalApproveInsert(ApproveRequest: many ZCLM_APPR_REQ_STAT)                               returns Response;

    type DisbursementUpdateInput {
        REQUEST_ID          : String;
        DISBURSEMENT_STATUS : String(2);
    }

    action   batchDisbursementUpdate(disbursement: many DisbursementUpdateInput)                         returns many ZEMP_CA_PAYMENT;

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

    action   UpdateApproverDetails(aPayloadToCreateApproverDetailsTable: many ApproverDetails)           returns Response;

    action   DeleteApproverDetails(ID: String)                                                           returns Response;

    type eligibleCheck {
        MOBILE_BILL_ELIGIBLE    : Boolean;
        MOBILE_BILL_ELIG_AMOUNT : Decimal(15, 2);
    }

    type EligibilityPayload {
        CheckFields   : many EligibilityCheckFields;
        ClaimType     : String;
        ClaimTypeItem : String;
        EmpId         : String;
        RecordId      : String;
        RecordSubId   : String;
    }

    type EligibilityCheckFields {
        fieldName : String;
        value     : LargeString @Core.MediaType: 'application/json';
        result    : LargeString @Core.MediaType: 'application/json';
    }

    action   EligibilityCheck(aPayload: many EligibilityPayload)                                         returns many Response;

    function getApprovedCashAdvanceAmount(sRequestId: String)                                            returns Decimal(16, 2);

    type perdiem {
        amount          : Decimal(15, 2);
        daily_allowance : Decimal(15, 2);
        currency_code   : String;
        tips_amount     : Decimal;
    }

    function getAmountEntitlement(employeeid: String,
                                  day: Integer,
                                  hours: Decimal(5, 1),
                                  location: String,
                                  claimtypeid: String,
                                  claimtypeitem: String,
                                  breakfast: Integer,
                                  lunch: Integer,
                                  dinner: Integer,
                                  exclude_tips: Boolean,
                                  dependent: Integer)                                                    returns perdiem;

    action getMeterCubeEntitlement(
        selectedDependents : array of String
    )                                                                                                    returns Decimal(15, 2);

    type meterCubeAmount {
        entitled : Decimal(15, 2);
        amount   : Decimal(15, 2);
    }

    action calculatePengangkutanLautAmount(actualMeterCube: Decimal(15, 2),
                                             actualAmount: Decimal(15, 2),
                                             selectedDependents : array of String)                       returns meterCubeAmount;

    type matawangAmount {
        percentage : Decimal(15, 2);
        amount     : Decimal(15, 2);
    }

    function calculateMatawangAmount(claimItems: LargeString)                                            returns matawangAmount;

    entity ZCLM_TYPE_EXCEPTION_LIST      as projection on ECLAIM.ZCLM_TYPE_EXCEPTION_LIST;

    function checkDefaultCostCenter(sClaimTypeId: String)                                                returns String;

    type rateperkm {
        id    : String;
        value : Decimal(34);
    }

    function getRatePerKm(sVehicleType: String, sClaimTypeItem: String, dRateDate: Date)                 returns rateperkm;

    function getMarriageCategoryBasedOnStatus()                                                          returns String;

    function getUserEligibleAmountEPengakut()                                                            returns Decimal(16, 2);

    function getUserClaimStatusEPengakut()                                                               returns String;

    function getUserEligibleAmountLodging(sClaimType: String,
                                          sClaimTypeItem: String)                                        returns Decimal(16, 2);

    type reminders {
        empName     : String;
        empEmail    : String;
        ccEmail     : String;
        tripEndDate : String;
        scenario    : String;
        milestone   : String;
    }

    function getEmailReminder()                                                                          returns array of reminders;

    function getOfficeDistance(sFromState: String,
                               sFromOffice: String,
                               sToState: String,
                               sToOffice: String, )                                                      returns String;

    action   CheckUserClaimTypes(ID: String)                                                             returns many Response;

    type PreApprovalUsageCheck {
        isUsed : Boolean
    }

    function checkPreApprovalUsage(requestID: String)                                                    returns PreApprovalUsageCheck;

    type ParticipantKey {
        REQUEST_ID      : String;
        REQUEST_SUB_ID  : String;
        PARTICIPANTS_ID : String;
    }

    action   deleteParticipants(participants: array of ParticipantKey)                                   returns Boolean;

    function getLodgingAmount(sClaimTypeId: String,
                              sClaimTypeItemId: String,
                              sEmpId: String)                                                            returns Decimal(15, 2);

    //IND1 - Spouse_Child
    function getNumberOfFamilyMembers(IND: String)                                                       returns Integer;

    type DaratAmounts {
        fAmount  : Decimal(15, 2);
        fRate    : Decimal(15, 2);
        bMinimum : Boolean
    }

    function getPengangkutanDaratAmount(sRegion: String,
                                        fKilometer: Decimal(10, 2),
                                        sMaritalCategory: String)                                        returns DaratAmounts;

    type PemPindahAmount {
        fAmount      : Decimal(15, 2);
        fPercentage  : Decimal(15, 2);
        fFinalAmount : Decimal(15, 2);
    }

    function getUserEligibleAmountPemPindah(sRegion: String,
                                            sClaimType: String,
                                            sClaimTypeItem: String,
                                            sTravelAloneFamily: String,
                                            sTravelFamilyNowLater: String)                               returns PemPindahAmount;

    type PEAValidationResult {
        canProceed : Boolean;
    }

    function validatePEATotal(headerTotal: Decimal(15, 2),
                              currentAmount: Decimal(15, 2),
                              isNew: Boolean,
                              oldAmount: Decimal(15, 2))                                                 returns PEAValidationResult;

    type JenazahEligibleAmount {
        iAmount : Decimal(16,2);
    }

    function getJenazahEligibleAmount(
            sTransportPassingID: String,
            sClaimType: String,
            sClaimTypeItem: String)
        returns JenazahEligibleAmount;

    function checkElaunTukarEligible(IS_CLAIM: Boolean)                                                  returns Boolean;

    type LodgingOverseaAmountAndCat {
        sCategory       : String;
        iEligibleAmount : Decimal(16, 2);
    }

    function getLodgingOverseaAmountAndCat(sCountry: String, sClaimType: String, sClaimTypeItem: String) returns LodgingOverseaAmountAndCat;

    action   updateApproverHeader(sRecordId: String,
                                  sStatus: String)                                                       returns Response;
    type Roundtripamount {
        fFinalAmount: Decimal(15,2);
    }
    function calculateRoundTripKM (fKM: Decimal(15, 2))                                              returns Roundtripamount;

    entity ZEMP_APPROVER_REQUEST_DETAILS as
        projection on ECLAIM.ZAPPROVER_DETAILS_PREAPPROVAL {
            key PREAPPROVAL_ID,
            key LEVEL,
                STATUS,
                ZSTATUS.STATUS_DESC,
                APPROVER_ID,
                ZEMP_MASTER_APPROVER.NAME         as APPROVER_NAME,
                ZEMP_MASTER_APPROVER.EMAIL        as APPROVER_EMAIL,
                SUBSTITUTE_APPROVER_ID,
                ZEMP_MASTER_SUBS.NAME             as SUBSTITUTE_NAME,
                ZEMP_MASTER_SUBS.EMAIL            as SUBSTITUTE_EMAIL,
                ZREQUEST_HEADER.OBJECTIVE_PURPOSE,
                ZREQUEST_HEADER.EMP_ID,
                ZREQUEST_HEADER.ZEMP_MASTER.NAME  as EMPLOYEE_NAME,
                ZREQUEST_HEADER.ZEMP_MASTER.EMAIL as EMPLOYEE_EMAIL,
                ZREQUEST_HEADER.REQUEST_DATE,
                ZREQUEST_HEADER.CASH_ADVANCE,
                ZREQUEST_HEADER.PREAPPROVAL_AMOUNT,
                REJECT_REASON_ID,
                ZREJECT_REASON.REASON_DESC,
                PROCESS_TIMESTAMP,
                COMMENT,
                modifiedAt
        };

    entity ZEMP_APPROVER_CLAIM_DETAILS   as
        projection on ECLAIM.ZAPPROVER_DETAILS_CLAIMS {
            key CLAIM_ID,
            key LEVEL,
                STATUS,
                ZSTATUS.STATUS_DESC,
                APPROVER_ID,
                ZEMP_MASTER_APPROVER.NAME       as APPROVER_NAME,
                ZEMP_MASTER_APPROVER.EMAIL      as APPROVER_EMAIL,
                SUBSTITUTE_APPROVER_ID,
                ZEMP_MASTER_SUBS.NAME           as SUBSTITUTE_NAME,
                ZEMP_MASTER_SUBS.EMAIL          as SUBSTITUTE_EMAIL,
                ZCLAIM_HEADER.EMP_ID,
                ZCLAIM_HEADER.ZEMP_MASTER.NAME  as EMPLOYEE_NAME,
                ZCLAIM_HEADER.ZEMP_MASTER.EMAIL as EMPLOYEE_EMAIL,
                ZCLAIM_HEADER.PURPOSE,
                ZCLAIM_HEADER.SUBMITTED_DATE,
                ZCLAIM_HEADER.FINAL_AMOUNT_TO_RECEIVE,
                ZCLAIM_HEADER.TOTAL_CLAIM_AMOUNT,
                ZCLAIM_HEADER.PREAPPROVED_AMOUNT,
                REJECT_REASON_ID,
                ZREJECT_REASON.REASON_DESC,
                PROCESS_TIMESTAMP,
                COMMENT,
                modifiedAt
        };

    view ZAPPROVER_REQUEST_PIVOT as
        select from ZEMP_APPROVER_REQUEST_DETAILS {
            key PREAPPROVAL_ID,
                max(case
                        when LEVEL = 1
                             then APPROVER_ID
                    end) as APPROVER1      : String,
                max(case
                        when LEVEL = 1
                             then APPROVER_NAME
                    end) as APPROVER1_NAME : String,
                max(case
                        when LEVEL = 2
                             then APPROVER_ID
                    end) as APPROVER2      : String,
                max(case
                        when LEVEL = 2
                             then APPROVER_NAME
                    end) as APPROVER2_NAME : String,
                max(case
                        when LEVEL = 3
                             then APPROVER_ID
                    end) as APPROVER3      : String,
                max(case
                        when LEVEL = 3
                             then APPROVER_NAME
                    end) as APPROVER3_NAME : String,
                max(case
                        when LEVEL = 4
                             then APPROVER_ID
                    end) as APPROVER4      : String,
                max(case
                        when LEVEL = 4
                             then APPROVER_NAME
                    end) as APPROVER4_NAME : String,
                max(case
                        when LEVEL = 5
                             then APPROVER_ID
                    end) as APPROVER5      : String,
                max(case
                        when LEVEL = 5
                             then APPROVER_NAME
                    end) as APPROVER5_NAME : String
        }
        group by
            PREAPPROVAL_ID;

    view ZAPPROVER_CLAIM_PIVOT as
        select from ZEMP_APPROVER_CLAIM_DETAILS {
            key CLAIM_ID,
                max(case
                        when LEVEL = 1
                             then APPROVER_ID
                    end) as APPROVER1      : String,
                max(case
                        when LEVEL = 1
                             then APPROVER_NAME
                    end) as APPROVER1_NAME : String,
                max(case
                        when LEVEL = 2
                             then APPROVER_ID
                    end) as APPROVER2      : String,
                max(case
                        when LEVEL = 2
                             then APPROVER_NAME
                    end) as APPROVER2_NAME : String,
                max(case
                        when LEVEL = 3
                             then APPROVER_ID
                    end) as APPROVER3      : String,
                max(case
                        when LEVEL = 3
                             then APPROVER_NAME
                    end) as APPROVER3_NAME : String,
                max(case
                        when LEVEL = 4
                             then APPROVER_ID
                    end) as APPROVER4      : String,
                max(case
                        when LEVEL = 4
                             then APPROVER_NAME
                    end) as APPROVER4_NAME : String,
                max(case
                        when LEVEL = 5
                             then APPROVER_ID
                    end) as APPROVER5      : String,
                max(case
                        when LEVEL = 5
                             then APPROVER_NAME
                    end) as APPROVER5_NAME : String
        }
        group by
            CLAIM_ID;

    entity ZEMP_REQUEST_REPORT_SUMMARY   as
        select from ECLAIM.ZREQUEST_HEADER as HEADER
        left join ZAPPROVER_REQUEST_PIVOT as PIVOT
            on PIVOT.PREAPPROVAL_ID = HEADER.REQUEST_ID
        {
            key REQUEST_ID,
                EMP_ID,
                REQUEST_TYPE_ID,
                ZREQUEST_TYPE.REQUEST_TYPE_DESC,
                CASH_ADVANCE_DATE,
                COST_CENTER,
                ZCOST_CENTER.COST_CENTER_DESC,
                ALTERNATE_COST_CENTER,
                COSTCENTER.COST_CENTER_DESC as ALT_COST_CENTER_DESC,
                TOTAL_AMOUNT,
                CASH_ADVANCE,
                OBJECTIVE_PURPOSE,
                TRIP_START_DATE,
                TRIP_END_DATE,
                EVENT_START_DATE,
                EVENT_END_DATE,
                LOCATION,
                TYPE_OF_TRANSPORTATION,
                REMARK,
                ZEMP_MASTER.UNIT_SECTION,
                ZEMP_MASTER.ZBRANCH.BRANCH_DESC,
                REQUEST_DATE,
                STATUS,
                ZSTATUS.STATUS_DESC,
                ZEMP_MASTER.NAME,
                ZEMP_MASTER.GRADE,
                ZEMP_MASTER.DEP,
                ZEMP_MASTER.ZDEPARTMENT.DEPARTMENT_DESC,
                ZEMP_MASTER.POSITION_NAME,
                PIVOT.APPROVER1,
                PIVOT.APPROVER1_NAME,
                PIVOT.APPROVER2,
                PIVOT.APPROVER2_NAME,
                PIVOT.APPROVER3,
                PIVOT.APPROVER3_NAME,
                PIVOT.APPROVER4,
                PIVOT.APPROVER4_NAME,
                PIVOT.APPROVER5,
                PIVOT.APPROVER5_NAME,
                LAST_PUSH_BACK_DATE,
                LAST_APPROVED_DATE,
                CASH_ADVANCE_DATE           as PAYMENT_DATE,
                SUBMITTED_DATE,
                CLAIM_TYPE_ID,
                ZCLAIM_TYPE.CLAIM_TYPE_DESC,
                ZCLAIM_TYPE.GL_ACCOUNT,
                ZCLAIM_TYPE.ZGL_ACCOUNT.GL_ACCOUNT_DESC,
                createdBy,
                IND_OR_GROUP,
                ZINDIV_GROUP.IND_OR_GROUP_DESC,
                 // Calculate the difference between Submitted and Last Approved date
                days_between(HEADER.SUBMITTED_DATE, HEADER.LAST_APPROVED_DATE) as DAYS_APPROVED : Integer
        };

    entity ZEMP_REQUEST_REPORT_DETAILS   as
        select from ECLAIM.ZREQUEST_HEADER as HEADER
        left join ZAPPROVER_REQUEST_PIVOT as PIVOT
            on PIVOT.PREAPPROVAL_ID = HEADER.REQUEST_ID
        {
            key REQUEST_ID,
            key ZREQUEST_ITEM.REQUEST_SUB_ID,
                EMP_ID,
                REQUEST_TYPE_ID,
                ZREQUEST_TYPE.REQUEST_TYPE_DESC,
                CASH_ADVANCE_DATE,
                COST_CENTER,
                ZCOST_CENTER.COST_CENTER_DESC,
                ALTERNATE_COST_CENTER,
                COSTCENTER.COST_CENTER_DESC                                    as ALT_COST_CENTER_DESC,
                TOTAL_AMOUNT,
                CASH_ADVANCE,
                OBJECTIVE_PURPOSE,
                TRIP_START_DATE,
                TRIP_END_DATE,
                EVENT_START_DATE,
                EVENT_END_DATE,
                LOCATION,
                TYPE_OF_TRANSPORTATION,
                STATUS,
                ZSTATUS.STATUS_DESC,
                ZREQUEST_ITEM.CLAIM_TYPE_ID,
                ZREQUEST_ITEM.CLAIM_TYPE_ITEM_ID,
                ZREQUEST_ITEM.ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_DESC,
                ZREQUEST_ITEM.EST_AMOUNT,
                ZREQUEST_ITEM.EST_NO_PARTICIPANT,
                REQUEST_DATE,
                ZREQUEST_ITEM.CASH_ADVANCE                                     as CASH_ADV_YES_NO,
                ZREQUEST_ITEM.START_DATE,
                ZREQUEST_ITEM.END_DATE,
                ZREQUEST_ITEM.REMARK,
                ZEMP_MASTER.UNIT_SECTION,
                ZEMP_MASTER.ZBRANCH.BRANCH_DESC,
                ZEMP_MASTER.NAME,
                ZEMP_MASTER.GRADE,
                ZEMP_MASTER.DEP,
                ZEMP_MASTER.ZDEPARTMENT.DEPARTMENT_DESC,
                ZEMP_MASTER.POSITION_NAME,
                ZREQUEST_ITEM.DECLARE_CLUB_MEMBERSHIP,
                ZREQUEST_ITEM.KWSP_SPORTS_REPRESENTATION,
                ZREQUEST_ITEM.ZSPORTS_REPRESENTATION.SPORTS_REPRESENTATION_DESC,
                ZREQUEST_ITEM.SPORTS_CLAIM_DISCLAIMER,
                ZREQUEST_ITEM.VEHICLE_OWNERSHIP_ID,
                ZREQUEST_ITEM.ZVEHICLE_OWNERSHIP.VEHICLE_OWNERSHIP_DESC,
                ZREQUEST_ITEM.MODE_OF_TRANSFER,
                ZREQUEST_ITEM.ZTRANSFER_MODE.TRANSFER_MODE_DESC,
                ZREQUEST_ITEM.TRANSFER_DATE,
                ZREQUEST_ITEM.NO_OF_DAYS,
                ZREQUEST_ITEM.MARRIAGE_CATEGORY,
                ZREQUEST_ITEM.ZMARITAL_CAT.MARRIAGE_CATEGORY_DESC,
                ZREQUEST_ITEM.FAMILY_COUNT,
                ZREQUEST_ITEM.GL_ACCOUNT,
                ZREQUEST_ITEM.MATERIAL_CODE,
                PIVOT.APPROVER1,
                PIVOT.APPROVER1_NAME,
                PIVOT.APPROVER2,
                PIVOT.APPROVER2_NAME,
                PIVOT.APPROVER3,
                PIVOT.APPROVER3_NAME,
                PIVOT.APPROVER4,
                PIVOT.APPROVER4_NAME,
                PIVOT.APPROVER5,
                PIVOT.APPROVER5_NAME,
                LAST_PUSH_BACK_DATE,
                SUBMITTED_DATE,
                LAST_APPROVED_DATE,
                CASH_ADVANCE_DATE                                              as PAYMENT_DATE,
                CLAIM_TYPE_ID                                                  as CLAIM_TYPE_HEADER,
                ZCLAIM_TYPE.CLAIM_TYPE_DESC                                    as CLAIM_TYPE_DESC_HEADER,
                createdBy,
                ZREQUEST_ITEM.COURSE_TITLE,
                ZREQUEST_ITEM.KILOMETER,
                ZREQUEST_ITEM.RATE_PER_KM,
                ZREQUEST_ITEM.FLIGHT_CLASS,
                ZREQUEST_ITEM.ZFLIGHT_CLASS.FLIGHT_CLASS_DESC,
                ZREQUEST_ITEM.LOCATION_TYPE,
                ZREQUEST_ITEM.ZLOC_TYPE.LOC_TYPE_DESC,
                ZREQUEST_ITEM.COUNTRY,
                ZREQUEST_ITEM.ZCOUNTRY.COUNTRY_DESC,
                ZREQUEST_ITEM.FROM_STATE_ID,
                ZREQUEST_ITEM.ZSTATE.STATE_DESC                                as FROM_STATE_DESC,
                ZREQUEST_ITEM.TO_STATE_ID,
                ZREQUEST_ITEM.ZTOSTATE.STATE_DESC                              as TO_STATE_DESC,
                ZREQUEST_ITEM.FROM_LOCATION,
                ZREQUEST_ITEM.FROM_LOCATION_OFFICE,
                ZREQUEST_ITEM.ZOFFICE_DISTANCE.ZOFFICE_LOCATION.LOCATION_DESC  as FROM_LOCATION_DESC,
                ZREQUEST_ITEM.TO_LOCATION,
                ZREQUEST_ITEM.TO_LOCATION_OFFICE,
                ZREQUEST_ITEM.ZOFFICE_DISTANCE.ZOFFICE_LOCATION1.LOCATION_DESC as TO_LOCATION_DESC,
                ZREQUEST_ITEM.MOBILE_CATEGORY_PURPOSE_ID,
                ZREQUEST_ITEM.ZMOBILE_CATEGORY_PURPOSE.MOBILE_CATEGORY_PURPOSE_DESC,
                ZREQUEST_ITEM.TOLL,
                ZREQUEST_ITEM.VEHICLE_TYPE,
                ZREQUEST_ITEM.ZVEHICLE_TYPE.VEHICLE_TYPE_DESC,
                ZREQUEST_ITEM.REGION,
                ZREQUEST_ITEM.ZREGION.REGION_DESC,
                ZREQUEST_ITEM.ROOM_TYPE,
                ZREQUEST_ITEM.ZROOM_TYPE.ROOM_TYPE_DESC,
                ZREQUEST_ITEM.LODGING_CATEGORY,
                ZREQUEST_ITEM.ZLODGING_CAT.LODGING_CATEGORY_DESC,
                ZREQUEST_ITEM.AREA,
                ZREQUEST_ITEM.ZAREA.AREA_DESC,
                ZREQUEST_ITEM.START_TIME,
                ZREQUEST_ITEM.END_TIME,
                ZREQUEST_ITEM.DEPENDENT,
                ZREQUEST_ITEM.METER_CUBE_ENTITLED,
                ZREQUEST_ITEM.METER_CUBE_ACTUAL,
                ZREQUEST_ITEM.FARE_TYPE_ID,
                ZREQUEST_ITEM.ZFARE_TYPE.FARE_TYPE_DESC,
                ZREQUEST_ITEM.VEHICLE_CLASS_ID,
                ZREQUEST_ITEM.ZVEHICLE_CLASS.VEHICLE_CLASS_DESC,
                ZREQUEST_ITEM.PURPOSE,
                ZREQUEST_ITEM.DEPARTURE_TIME,
                ZREQUEST_ITEM.ARRIVAL_TIME,
                ZREQUEST_ITEM.TOTAL_TRAVELLER,
                 // Calculate the difference between Submitted and Last Approved date
                days_between(HEADER.SUBMITTED_DATE, HEADER.LAST_APPROVED_DATE) as DAYS_APPROVED : Integer                
        };


    entity ZEMP_CLAIM_REPORT_SUMMARY     as
        select from ECLAIM.ZCLAIM_HEADER as HEADER
        left join ZAPPROVER_CLAIM_PIVOT as PIVOT
            on PIVOT.CLAIM_ID = HEADER.CLAIM_ID
        {
            key HEADER.CLAIM_ID,
                EMP_ID,
                ZREQUEST_HEADER.REQUEST_ID,
                ZREQUEST_HEADER.REQUEST_DATE,
                CLAIM_TYPE_ID,
                ZCLAIM_TYPE.CLAIM_TYPE_DESC,
                ZCLAIM_TYPE.GL_ACCOUNT,
                ZEMP_MASTER.NAME,
                ZEMP_MASTER.GRADE,
                ZEMP_MASTER.DEP,
                ZEMP_MASTER.ZDEPARTMENT.DEPARTMENT_DESC,
                ZEMP_MASTER.POSITION_NAME,
                SUBMISSION_TYPE,
                ZSUBMISSION_TYPE.SUBMISSION_TYPE_DESC,
                SUBMITTED_DATE,
                ZREQUEST_HEADER.CASH_ADVANCE_DATE,
                LAST_APPROVED_DATE,
                PAYMENT_DATE,
                STATUS_ID,
                ZSTATUS.STATUS_DESC,
                COST_CENTER,
                COSTCENTER.COST_CENTER_DESC,
                ALTERNATE_COST_CENTER,
                FINAL_AMOUNT_TO_RECEIVE,
                ZCOST_CENTER.COST_CENTER_DESC as ALT_COST_CENTER_DESC,
                TOTAL_CLAIM_AMOUNT,
                CASH_ADVANCE_AMOUNT,
                PURPOSE,
                COMMENT,
                TRIP_START_DATE,
                TRIP_END_DATE,
                LOCATION,
                PIVOT.APPROVER1,
                PIVOT.APPROVER1_NAME,
                PIVOT.APPROVER2,
                PIVOT.APPROVER2_NAME,
                PIVOT.APPROVER3,
                PIVOT.APPROVER3_NAME,
                PIVOT.APPROVER4,
                PIVOT.APPROVER4_NAME,
                PIVOT.APPROVER5,
                PIVOT.APPROVER5_NAME,
                ZEMP_MASTER.UNIT_SECTION,
                ZTRAIN_COURSE_PART.COURSE_ID,
                ZTRAIN_COURSE_PART.COURSE_DESC,
                ZTRAIN_COURSE_PART.SESSION_NUMBER,
                LAST_PUSH_BACK_DATE,
                createdBy, 
                 // Calculate the difference between Submitted and Last Approved date
                days_between(HEADER.SUBMITTED_DATE, HEADER.LAST_APPROVED_DATE) as DAYS_APPROVED : Integer                
        };

    entity ZEMP_CLAIM_REPORT_DETAILS     as
        select from ECLAIM.ZCLAIM_HEADER as HEADER
        left join ZAPPROVER_CLAIM_PIVOT as PIVOT
            on PIVOT.CLAIM_ID = HEADER.CLAIM_ID
        {
            key HEADER.CLAIM_ID,
            key ZCLAIM_ITEM.CLAIM_SUB_ID,
                EMP_ID,
                ZEMP_MASTER.NAME,
                ZEMP_MASTER.GRADE,
                ZEMP_MASTER.DEP,
                ZEMP_MASTER.ZDEPARTMENT.DEPARTMENT_DESC,
                ZEMP_MASTER.POSITION_NAME,
                SUBMISSION_TYPE,
                ZSUBMISSION_TYPE.SUBMISSION_TYPE_DESC,
                SUBMITTED_DATE,
                LAST_APPROVED_DATE,
                ZREQUEST_HEADER.CASH_ADVANCE_DATE,
                PAYMENT_DATE,
                STATUS_ID,
                ZSTATUS.STATUS_DESC,
                COST_CENTER,
                COSTCENTER.COST_CENTER_DESC,
                ALTERNATE_COST_CENTER,
                ZCOST_CENTER.COST_CENTER_DESC                                as ALT_COST_CENTER_DESC,
                TOTAL_CLAIM_AMOUNT,
                CASH_ADVANCE_AMOUNT,
                FINAL_AMOUNT_TO_RECEIVE,
                PURPOSE,
                LOCATION,
                CLAIM_TYPE_ID,
                TRIP_START_DATE                                              as TRIP_START_DATE_HEADER,
                TRIP_END_DATE                                                as TRIP_END_DATE_HEADER,
                ZCLAIM_TYPE.CLAIM_TYPE_DESC,
                ZCLAIM_ITEM.CLAIM_TYPE_ITEM_ID,
                ZCLAIM_ITEM.ZCLAIM_TYPE_ITEM.CLAIM_TYPE_ITEM_DESC,
                ZCLAIM_ITEM.REMARK,
                ZCLAIM_ITEM.TRIP_START_DATE,
                ZCLAIM_ITEM.TRIP_START_TIME,
                ZCLAIM_ITEM.TRIP_END_DATE,
                ZCLAIM_ITEM.TRIP_END_TIME,
                ZCLAIM_ITEM.LOCATION                                         as LOCATION_ITEM,
                ZCLAIM_ITEM.PERCENTAGE_COMPENSATION,
                ZCLAIM_ITEM.ACCOUNT_NO,
                ZCLAIM_ITEM.AMOUNT,
                ZCLAIM_ITEM.BILL_DATE,
                ZCLAIM_ITEM.BILL_NO,
                ZCLAIM_ITEM.CLAIM_CATEGORY,
                ZCLAIM_ITEM.COUNTRY,
                ZCLAIM_ITEM.DISCLAIMER,
                ZCLAIM_ITEM.END_DATE,
                ZCLAIM_ITEM.END_TIME,
                ZCLAIM_ITEM.FLIGHT_CLASS,
                ZCLAIM_ITEM.ZFLIGHT_CLASS.FLIGHT_CLASS_DESC,
                ZCLAIM_ITEM.FROM_LOCATION,
                ZCLAIM_ITEM.FROM_LOCATION_OFFICE,
                ZCLAIM_ITEM.ZOFFICE_DISTANCE.ZOFFICE_LOCATION.LOCATION_DESC  as FROM_LOCATION_DESC,
                ZCLAIM_ITEM.KM,
                ZCLAIM_ITEM.LOCATION_TYPE,
                ZCLAIM_ITEM.ZLOC_TYPE.LOC_TYPE_DESC,
                ZCLAIM_ITEM.LODGING_ADDRESS,
                ZCLAIM_ITEM.LODGING_CATEGORY,
                ZCLAIM_ITEM.ZLODGING_CAT.LODGING_CATEGORY_DESC,
                ZCLAIM_ITEM.MARRIAGE_CATEGORY,
                ZCLAIM_ITEM.ZMARITAL_CAT.MARRIAGE_CATEGORY_DESC,
                ZCLAIM_ITEM.AREA,
                ZCLAIM_ITEM.ZAREA.AREA_DESC,
                ZCLAIM_ITEM.NO_OF_FAMILY_MEMBER,
                ZCLAIM_ITEM.PARKING,
                ZCLAIM_ITEM.PHONE_NO,
                ZCLAIM_ITEM.RATE_PER_KM,
                ZCLAIM_ITEM.RECEIPT_DATE,
                ZCLAIM_ITEM.RECEIPT_NUMBER,
                ZCLAIM_ITEM.ROOM_TYPE,
                ZCLAIM_ITEM.ZROOM_TYPE.ROOM_TYPE_DESC,
                ZCLAIM_ITEM.REGION,
                ZCLAIM_ITEM.ZREGION.REGION_DESC,
                ZCLAIM_ITEM.START_DATE,
                ZCLAIM_ITEM.START_TIME,
                ZCLAIM_ITEM.TO_LOCATION,
                ZCLAIM_ITEM.TO_LOCATION_OFFICE,
                ZCLAIM_ITEM.ZOFFICE_DISTANCE.ZOFFICE_LOCATION1.LOCATION_DESC as TO_LOCATION_DESC,
                ZCLAIM_ITEM.TOLL,
                ZCLAIM_ITEM.TOTAL_EXP_AMOUNT,
                ZCLAIM_ITEM.VEHICLE_TYPE,
                ZCLAIM_ITEM.ZVEHICLE_TYPE.VEHICLE_TYPE_DESC,
                ZCLAIM_ITEM.VEHICLE_FARE,
                ZCLAIM_ITEM.EVENT_START_DATE,
                ZCLAIM_ITEM.EVENT_END_DATE,
                ZCLAIM_ITEM.TRAVEL_DURATION_DAY,
                ZCLAIM_ITEM.TRAVEL_DURATION_HOUR,
                ZCLAIM_ITEM.PROVIDED_BREAKFAST,
                ZCLAIM_ITEM.PROVIDED_LUNCH,
                ZCLAIM_ITEM.PROVIDED_DINNER,
                ZCLAIM_ITEM.ENTITLED_BREAKFAST,
                ZCLAIM_ITEM.ENTITLED_LUNCH,
                ZCLAIM_ITEM.ENTITLED_DINNER,
                ZCLAIM_ITEM.ANGGOTA_ID,
                ZCLAIM_ITEM.ANGGOTA_NAME,
                ZCLAIM_ITEM.DEPENDENT_NAME,
                ZCLAIM_ITEM.FROM_STATE_ID,
                ZCLAIM_ITEM.ZSTATE.STATE_DESC                                as FROM_STATE_DESC,
                ZCLAIM_ITEM.TO_STATE_ID,
                ZCLAIM_ITEM.ZTOSTATE.STATE_DESC                              as TO_STATE_DESC,
                ZCLAIM_ITEM.GL_ACCOUNT,
                ZCLAIM_ITEM.MATERIAL_CODE,
                ZREQUEST_HEADER.REQUEST_ID,
                ZREQUEST_HEADER.REQUEST_DATE,
                PIVOT.APPROVER1,
                PIVOT.APPROVER1_NAME,
                PIVOT.APPROVER2,
                PIVOT.APPROVER2_NAME,
                PIVOT.APPROVER3,
                PIVOT.APPROVER3_NAME,
                PIVOT.APPROVER4,
                PIVOT.APPROVER4_NAME,
                PIVOT.APPROVER5,
                PIVOT.APPROVER5_NAME,
                ZEMP_MASTER.UNIT_SECTION,
                ZTRAIN_COURSE_PART.COURSE_ID,
                ZTRAIN_COURSE_PART.COURSE_DESC,
                ZTRAIN_COURSE_PART.SESSION_NUMBER,
                LAST_PUSH_BACK_DATE,
                createdBy,
                ZCLAIM_ITEM.ROUND_TRIP,
                ZCLAIM_ITEM.TYPE_OF_PROFESSIONAL_BODY,
                ZCLAIM_ITEM.ZPROFESIONAL_BODY.PROFESIONAL_BODY_DESC,
                ZCLAIM_ITEM.DISCLAIMER_GALAKAN,
                ZCLAIM_ITEM.TRANSFER_DATE,
                ZCLAIM_ITEM.NO_OF_DAYS,
                ZCLAIM_ITEM.FAMILY_COUNT,
                ZCLAIM_ITEM.FUNERAL_TRANSPORTATION,
                ZCLAIM_ITEM.ZTRANSPORT_PASSING.TRANSPORT_PASSING_DESC,
                ZCLAIM_ITEM.COURSE_TITLE,
                ZCLAIM_ITEM.ACTUAL_AMOUNT,
                ZCLAIM_ITEM.NEED_FOREIGN_CURRENCY,
                ZCLAIM_ITEM.CURRENCY_CODE,
                ZCLAIM_ITEM.ZCURRENCY.CURRENCY_DESC,
                ZCLAIM_ITEM.CURRENCY_RATE,
                ZCLAIM_ITEM.CURRENCY_AMOUNT,
                ZCLAIM_ITEM.REQUEST_APPROVAL_AMOUNT,
                ZCLAIM_ITEM.DEPARTURE_TIME,
                ZCLAIM_ITEM.ARRIVAL_TIME,
                ZCLAIM_ITEM.DEPENDENT,
                ZCLAIM_ITEM.ZEMP_DEPENDENT.DEPENDENT_NO,
                ZCLAIM_ITEM.POLICY_NUMBER,
                ZCLAIM_ITEM.INSURANCE_PROVIDER_ID,
                ZCLAIM_ITEM.ZINSURANCE_PROVIDER.INSURANCE_PROVIDER_DESC,
                ZCLAIM_ITEM.INSURANCE_PROVIDER_NAME,
                ZCLAIM_ITEM.INSURANCE_PURCHASE_DATE,
                ZCLAIM_ITEM.INSURANCE_CERT_START_DATE,
                ZCLAIM_ITEM.INSURANCE_CERT_END_DATE,
                ZCLAIM_ITEM.TRAVEL_DAYS_ID,
                ZCLAIM_ITEM.ZTRAVEL_DAYS.TRAVEL_DAYS_DESC,
                ZCLAIM_ITEM.METER_CUBE_ENTITLED,
                ZCLAIM_ITEM.METER_CUBE_ACTUAL,
                ZCLAIM_ITEM.INSURANCE_PACKAGE_ID,
                ZCLAIM_ITEM.ZINSURANCE_PACKAGE.ZINSURANCE_PACKAGE_DESC,
                ZCLAIM_ITEM.FARE_TYPE_ID,
                ZCLAIM_ITEM.ZFARE_TYPE.FARE_TYPE_DESC,
                ZCLAIM_ITEM.VEHICLE_CLASS_ID,
                ZCLAIM_ITEM.ZVEHICLE_CLASS.VEHICLE_CLASS_DESC,
                ZCLAIM_ITEM.MOBILE_CATEGORY_PURPOSE_ID,
                ZCLAIM_ITEM.ZMOBILE_CATEGORY_PURPOSE.MOBILE_CATEGORY_PURPOSE_DESC,
                ZCLAIM_ITEM.STUDY_LEVELS_ID,
                ZCLAIM_ITEM.ZSTUDY_LEVELS.STUDY_LEVELS_DESC,
                ZCLAIM_ITEM.MODE_OF_TRANSFER,
                ZCLAIM_ITEM.ZTRANSFER_MODE.TRANSFER_MODE_DESC,
                ZCLAIM_ITEM.VEHICLE_OWNERSHIP_ID,
                ZCLAIM_ITEM.ZVEHICLE_OWNERSHIP.VEHICLE_OWNERSHIP_DESC,
                 // Calculate the difference between Submitted and Last Approved date
                days_between(HEADER.SUBMITTED_DATE, HEADER.LAST_APPROVED_DATE) as DAYS_APPROVED : Integer                  
        };

    entity ZEMP_CASHADVANCE_REPORT       as
        projection on ECLAIM.ZREQUEST_HEADER {
            key REQUEST_ID,
            key ZCLAIM_HEADER.CLAIM_ID,
                EMP_ID,
                CLAIM_TYPE_ID,
                OBJECTIVE_PURPOSE,
                STATUS,
                ZSTATUS.STATUS_DESC               as REQUEST_STATUS_DESC,
                TRIP_START_DATE,
                TRIP_END_DATE,
                LAST_APPROVED_DATE,
                CASH_ADVANCE,
                ZCLAIM_HEADER.SUBMITTED_DATE,
                ZCLAIM_HEADER.STATUS_ID,
                ZCLAIM_HEADER.ZSTATUS.STATUS_DESC as CLAIM_STATUS_DESC,
                ZEMP_MASTER.NAME,
                ZEMP_MASTER.GRADE,
                ZEMP_MASTER.DEP,
                ZEMP_MASTER.ZDEPARTMENT.DEPARTMENT_DESC,
                ZEMP_MASTER.UNIT_SECTION,
                createdBy
        };

    entity ZEMP_COURSE_VALUE_HELP        as
        projection on ZTRAIN_COURSE_PART {
            key COURSE_ID,
                COURSE_DESC
        }
        group by
            COURSE_ID,
            COURSE_DESC;

    entity ZCOST_CENTER_VH               as
        projection on ZCOST_CENTER {
            COST_CENTER_ID,
            COST_CENTER_DESC
        };

    entity ZEMP_CC_BUDGET_DETAIL         as
        select from ECLAIM.ZCLAIM_HEADER as HEADER
        inner join ECLAIM.ZCLAIM_ITEM as ITEM
            on HEADER.CLAIM_ID = ITEM.CLAIM_ID
        left join ECLAIM.ZEMP_MASTER as EMP
            on HEADER.EMP_ID = EMP.EEID
        {
            key HEADER.CLAIM_ID,
            key ITEM.CLAIM_SUB_ID,
                HEADER.EMP_ID,
                EMP.NAME,
                EMP.GRADE,
                EMP.DEP,
                EMP.POS,

                /* Cost Center logic */
                case
                    when HEADER.ALTERNATE_COST_CENTER is not null
                         and HEADER.ALTERNATE_COST_CENTER <> ''
                         then HEADER.ALTERNATE_COST_CENTER
                    else HEADER.COST_CENTER
                end                as FUND_CENTER : String,

                /* Match with budget */
                ITEM.GL_ACCOUNT    as COMMITMENT_ITEM,
                ITEM.MATERIAL_CODE as MATERIAL_GROUP,

                /* Claim info */
                HEADER.SUBMITTED_DATE,
                HEADER.PAYMENT_DATE,
                HEADER.STATUS_ID,
                HEADER.PURPOSE,
                HEADER.TRIP_START_DATE,
                HEADER.TRIP_END_DATE,

                ITEM.CLAIM_TYPE_ID,
                ITEM.CLAIM_TYPE_ITEM_ID,
                ITEM.AMOUNT
        };

    entity ZEMP_CC_BUDGET_REPORT         as
        projection on ECLAIM.ZBUDGET {

            key YEAR,
            key INTERNAL_ORDER,
            key FUND_CENTER,
            key COMMITMENT_ITEM,
            key MATERIAL_GROUP,

                CURRENT_BUDGET,
                VIREMENT_IN,
                VIREMENT_OUT,
                SUPPLEMENT,
                RETURN,

                (
                    coalesce(
                        VIREMENT_IN, 0
                    )+coalesce(
                        VIREMENT_OUT, 0
                    )+coalesce(
                        SUPPLEMENT, 0
                    )+coalesce(
                        RETURN, 0
                    )
                ) as ADJUST_AMOUNT : Decimal(16, 2),

                COMMITMENT,
                ACTUAL,
                CONSUMED,
                BUDGET_BALANCE,
                _Detail            : Association to many ZEMP_CC_BUDGET_DETAIL
                                         on FUND_CENTER = _Detail.FUND_CENTER
        }        
};
