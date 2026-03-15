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
    }

    type budgetdata {
        YEAR            : String(4);
        INTERNAL_ORDER  : String;
        FUND_CENTER     : String;
        MATERIAL_GROUP  : String;
        COMMITMENT_ITEM : String;
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

    action   batchCreateEmployee(employees: many ZEMP_MASTER)          returns Response;

    action   batchCreateDependent(dependents: many ZEMP_DEPENDENT)     returns Response;

    action   batchCreateCostCenter(costcenters: many ZCOST_CENTER)     returns Response;

    action   budgetchecking(budget: many budgetdata)                   returns many BudgetResult;


    entity ZREQUEST_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Claimant',
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZREQUEST_TYPE;

    entity ZCLAIM_ITEM @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: '*',
            to   : [
                'DTD_Admin',
                'Claimant'
            ]
        }
    ])                              as projection on ECLAIM.ZCLAIM_ITEM;

    entity ZREQUEST_HEADER @(restrict: [
        {
            grant: 'WRITE',
            to   : 'Claimant'

        },
        {
            grant: 'READ',
            to   : 'Claimant',
            where: (createdBy = $user)
        }
    ])                              as projection on ECLAIM.ZREQUEST_HEADER;

    entity ZEMP_MASTER @(restrict: [
        {
            grant: ['*'],
            to   : [
                'DTD_Admin',
                'Approver'
            ]
        },
        {
            grant: ['READ'],
            to   : [
                'Claimant',
                'Admin_CC',
                'Admin_System'

            ]
        }
    ])                              as projection on ECLAIM.ZEMP_MASTER;


    entity ZCLAIM_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Claimant',
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as
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
                ZCLAIM_TYPE.ZCLAIM_TYPE_ITEM as Items
        };

    entity ZREQUEST_ITEM @(restrict: [
        {
            grant: [
                'READ',
                'UPDATE'
            ],
            to   : ['Approver']
        },
        {
            grant: 'WRITE',
            to   : ['Claimant']
        },
        {
            grant: 'READ',
            to   : ['Claimant'],
            where: (createdBy = $user)
        }

    ])                              as projection on ECLAIM.ZREQUEST_ITEM;

    entity ZREQ_ITEM_PART @(restrict: [
        {
            grant: [
                'READ',
                'UPDATE'
            ],
            to   : ['Approver']
        },
        {
            grant: 'READ',
            to   : ['Claimant'],
            where: (createdBy = $user)
        },
        {
            grant: 'WRITE',
            to   : ['Claimant']
        }
    ])                              as projection on ECLAIM.ZREQ_ITEM_PART;

    entity ZCLAIM_HEADER @(restrict: [
        {
            grant: 'READ',
            to   : 'Claimant',
            where: (createdBy = $user)
        },
        {
            grant: ['WRITE'],
            to   : 'Claimant'
        }
    ])                              as projection on ECLAIM.ZCLAIM_HEADER;

    entity ZNUM_RANGE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['*'],
            to   : [
                'Claimant',
                'Approver'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZNUM_RANGE;

    entity ZRISK @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZRISK;

    entity ZCLAIM_TYPE_ITEM @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZCLAIM_TYPE_ITEM;

    entity ZCLAIM_CATEGORY @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZCLAIM_CATEGORY;

    entity ZSTATUS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZSTATUS;

    entity ZLODGING_CAT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZLODGING_CAT;

    entity ZROOM_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZROOM_TYPE;

    entity ZFLIGHT_CLASS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZFLIGHT_CLASS;

    entity ZCOUNTRY @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZCOUNTRY;

    entity ZAREA @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZAREA;

    entity ZMARITAL_STAT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZMARITAL_STAT;

    entity ZVEHICLE_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZVEHICLE_TYPE;

    entity ZSTATE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZSTATE;

    entity ZUSER_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZUSER_TYPE;

    entity ZROLE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZROLE;

    entity ZDEPARTMENT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZDEPARTMENT;

    entity ZJOB_GROUP @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZJOB_GROUP;

    entity ZEMP_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZEMP_TYPE;

    entity ZREGION @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZREGION;

    entity ZRATE_KM @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZRATE_KM;

    entity ZSUBMISSION_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZSUBMISSION_TYPE;

    entity ZOFFICE_LOCATION @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZOFFICE_LOCATION;

    entity ZOFFICE_DISTANCE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZOFFICE_DISTANCE;

    entity ZLOC_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZLOC_TYPE;

    entity ZMATERIAL_GROUP @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZMATERIAL_GROUP;

    entity ZINDIV_GROUP @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZINDIV_GROUP;

    entity ZTRAIN_COURSE_PART @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZTRAIN_COURSE_PART;

    entity ZEMP_DEPENDENT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZEMP_DEPENDENT;

    entity ZBUDGET @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC'
            ]
        },
        {
            grant: [
                'READ',
                'WRITE'
            ],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : [
                'DTD_Admin',
                'Admin_System'
            ]
        }
    ])                              as projection on ECLAIM.ZBUDGET;

    entity ZVEHICLE_OWNERSHIP @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: [
                'READ',
                'WRITE'
            ],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZVEHICLE_OWNERSHIP;

    entity ZCOST_CENTER @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZCOST_CENTER;

    entity ZEMP_RELATIONSHIP @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZEMP_RELATIONSHIP;

    entity ZINTERNAL_ORDER @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZINTERNAL_ORDER;

    entity ZGL_ACCOUNT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZGL_ACCOUNT;

    entity ZMARITAL_CAT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZMARITAL_CAT;

    entity ZPROJECT_HDR @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZPROJECT_HDR;

    entity ZBRANCH @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: ['READ'],
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZBRANCH;

    entity ZEMP_CA_PAYMENT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: 'READ',
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZEMP_CA_PAYMENT;

    entity ZPERDIEM_ENT @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: 'READ',
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZPERDIEM_ENT;

    entity ZHOUSING_LOAN_SCHEME @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: 'READ',
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZHOUSING_LOAN_SCHEME;

    entity ZLENDER_NAME @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: 'READ',
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZLENDER_NAME;

    entity ZREJECT_REASON @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System'
            ]
        },
        {
            grant: 'READ',
            to   : ['Claimant']
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZREJECT_REASON;

    entity ZCURRENCY @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZCURRENCY;

    entity ZMOBILE_CATEGORY_PURPOSE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZMOBILE_CATEGORY_PURPOSE;

    entity ZVEHICLE_CLASS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZVEHICLE_CLASS;

    entity ZINSURANCE_PROVIDER @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZINSURANCE_PROVIDER;

    type UserInfo {
        id          : String;
        userType    : String;
        costcenters : String;
        userId      : String;
        name        : String;
        position    : String;
    }

    function getUserType()                                         returns UserInfo;
        
    action sendEmail(ApproverName: String,SubmissionDate: String,ClaimantName: String,InstanceID: String,ClaimType: String,ClaimID: String,RecipientName: String,Action: String,
                       ReceiverEmail: String,CCEmail: String,EmailTitle: String,EmailBody: String, NextApproverName: String) returns Response; 

    entity ZINSURANCE_PACKAGE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZINSURANCE_PACKAGE;

    entity ZPROFESIONAL_BODY @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZPROFESIONAL_BODY;

    entity ZSTUDY_LEVELS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZSTUDY_LEVELS;

    entity ZTRANSFER_MODE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZTRANSFER_MODE;

    entity ZTRANSPORT_PASSING @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZTRANSPORT_PASSING;

    entity ZTRAVEL_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZTRAVEL_TYPE;

    entity ZFAMILY_TIMING @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZFAMILY_TIMING;

    entity ZSPORTS_REPRESENTATION @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZSPORTS_REPRESENTATION;

    entity ZPOSITION_EVENT_REASON @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZPOSITION_EVENT_REASON;

    entity ZEMP_DEPENDENT_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZEMP_DEPENDENT_TYPE;

    entity ZCLAIM_BASIS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZCLAIM_BASIS;

    entity ZHOTEL_LODGING @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZHOTEL_LODGING;

    entity ZFARE_TYPE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZFARE_TYPE;

    entity ZMETER_CUBE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZMETER_CUBE;

    entity ZTRAVEL_DAYS @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZTRAVEL_DAYS;

    entity ZELIGIBILITY_RULE @(restrict: [
        {
            grant: 'READ',
            to   : [
                'Approver',
                'Admin_CC',
                'Admin_System',
                'Claimant'
            ]
        },
        {
            grant: '*',
            to   : 'DTD_Admin'
        }
    ])                              as projection on ECLAIM.ZELIGIBILITY_RULE;

    entity ZWORKFLOW_STEP           as projection on ECLAIM.ZWORKFLOW_STEP;

    entity ZWORKFLOW_RULE           as projection on ECLAIM.ZWORKFLOW_RULE;

    entity ZAPPROVER_DETAILS_CLAIMS as projection on ECLAIM.ZAPPROVER_DETAILS_CLAIMS;

    entity ZAPPROVER_DETAILS_PREAPPROVAL @(restrict: [{
        grant: '*',
        to   : 'Approver'
    }])                             as projection on ECLAIM.ZAPPROVER_DETAILS_PREAPPROVAL;

    entity ZSUBSTITUTION_RULES @(restrict: [
        {
            grant: 'WRITE',
            to   : 'Approver'
        },
        {
            grant: 'READ',
            to   : 'Approver',
            where: (createdBy = $user)
        }
    ])                              as projection on ECLAIM.ZSUBSTITUTION_RULES;

    entity ZDB_STRUCTURE            as projection on ECLAIM.ZDB_STRUCTURE;

    function runjob()                                                  returns Response;

    type PreApproveClaims {
        REQUEST_ID     : String;
        REQUEST_SUB_ID : String;
    }

    action   batchUpdatePreApproved(PreApprove: many PreApproveClaims) returns Response;

    function updateDisbursementStatus()                                returns array of Response;
    
    entity ZDISBURSEMENT_STATUS          as projection on ECLAIM.ZDISBURSEMENT_STATUS;

};
