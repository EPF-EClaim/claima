using eclaim_srv from '../../srv/eclaim_srv';
using from '../../srv/eclaim_config';

annotate eclaim_srv.ZRISK with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : RISK_ID,
            Label : 'Risk ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : RISK_DESC,
            Label : 'Risk Description',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : START_DATE,
            Label : 'Start Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : END_DATE,
            Label : 'End Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : STATUS,
            Label : 'Status',
            @UI.Importance : #High,
        },
    ]
);

annotate eclaim_srv.ZLENDER_NAME with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : LENDER_ID,
            Label : 'Lender ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : LENDER_NAME,
            Label : 'Lender Name',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : START_DATE,
            Label : 'Start Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : END_DATE,
            Label : 'End Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : STATUS,
            Label : 'Status',
            @UI.Importance : #High,
        },
    ]
);

annotate eclaim_srv.ZSTATUS with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : STATUS_ID,
            Label : 'Status ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : STATUS_DESC,
            Label : 'Status Description',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : START_DATE,
            Label : 'Start Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : END_DATE,
            Label : 'End Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : STATUS,
            Label : 'Status',
            @UI.Importance : #High,
        },
    ]
);

annotate eclaim_srv.ZCLAIM_TYPE with @(
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : CLAIM_TYPE_ID,
        },
        TypeName : '',
        TypeNamePlural : '',
        Description : {
            $Type : 'UI.DataField',
            Value : 'Claim Type',
        },
    }
);

annotate eclaim_srv.ZEMP_MASTER with @(
    UI.SelectionFields : [
        EEID,
        NAME,
        EMAIL,
        USER_TYPE,
        B_PLACE,
        CC,
        CONFIRMATION_DATE,
        CONTACT_NO,
        COUNTRY,
        DEP,
        DIRECT_SUPPERIOR,
        EFFECTIVE_DATE,
        EMPLOYEE_TYPE,
        GRADE,
        JOB_GROUP,
        MARITAL,
        MEDICAL_INSURANCE_ENTITLEMENT,
        MOBILE_BILL_ELIG_AMOUNT,
        POS,
        POSITION_EVENT_REASON,
    ]
);

annotate eclaim_srv.ZEMP_MASTER with {
    EEID @Common.Label : 'EEID'
};

annotate eclaim_srv.ZEMP_MASTER with {
    NAME @Common.Label : 'NAME'
};

annotate eclaim_srv.ZEMP_MASTER with {
    EMAIL @Common.Label : 'EMAIL'
};

annotate eclaim_srv.ZEMP_MASTER with {
    USER_TYPE @Common.Label : 'USER_TYPE'
};

annotate eclaim_srv.ZEMP_MASTER with {
    B_PLACE @Common.Label : 'B_PLACE'
};

annotate eclaim_srv.ZEMP_MASTER with {
    CC @Common.Label : 'CC'
};

annotate eclaim_srv.ZEMP_MASTER with {
    CONFIRMATION_DATE @Common.Label : 'CONFIRMATION_DATE'
};

annotate eclaim_srv.ZEMP_MASTER with {
    CONTACT_NO @Common.Label : 'CONTACT_NO'
};

annotate eclaim_srv.ZEMP_MASTER with {
    COUNTRY @Common.Label : 'COUNTRY'
};

annotate eclaim_srv.ZEMP_MASTER with {
    DEP @Common.Label : 'DEP'
};

annotate eclaim_srv.ZEMP_MASTER with {
    DIRECT_SUPPERIOR @Common.Label : 'DIRECT_SUPPERIOR'
};

annotate eclaim_srv.ZEMP_MASTER with {
    EFFECTIVE_DATE @Common.Label : 'EFFECTIVE_DATE'
};

annotate eclaim_srv.ZEMP_MASTER with {
    EMPLOYEE_TYPE @Common.Label : 'EMPLOYEE_TYPE'
};

annotate eclaim_srv.ZEMP_MASTER with {
    GRADE @Common.Label : 'GRADE'
};

annotate eclaim_srv.ZEMP_MASTER with {
    JOB_GROUP @Common.Label : 'JOB_GROUP'
};

annotate eclaim_srv.ZEMP_MASTER with {
    MARITAL @Common.Label : 'MARITAL'
};

annotate eclaim_srv.ZEMP_MASTER with {
    MEDICAL_INSURANCE_ENTITLEMENT @Common.Label : 'MEDICAL_INSURANCE_ENTITLEMENT'
};

annotate eclaim_srv.ZEMP_MASTER with {
    MOBILE_BILL_ELIG_AMOUNT @Common.Label : 'MOBILE_BILL_ELIG_AMOUNT'
};

annotate eclaim_srv.ZEMP_MASTER with {
    POS @Common.Label : 'POS'
};

annotate eclaim_srv.ZEMP_MASTER with {
    POSITION_EVENT_REASON @Common.Label : 'POSITION_EVENT_REASON'
};

