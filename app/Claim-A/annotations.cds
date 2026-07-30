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

annotate eclaim_srv.ZCORPORATE_CARD with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : CARD_NO,
            Label : 'Card No.',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : CARDHOLDER_ID,
            Label : 'Cardholder ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : CARDHOLDER_NAME,
            Label : 'Cardholder Name',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : PRINCIPLE,
            Label : 'Principal',
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
            Value : STATEMENT_DATE,
            Label : 'Statement Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : DUE_DATE,
            Label : 'Due Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : EXPIRY_DATE,
            Label : 'Expiry Date',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : REMARKS,
            Label : 'Remarks',
            @UI.Importance : #High,
        },
    ]
);

annotate eclaim_srv.ZCORPORATE_CARD_ADVANCED with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : CARD_NO,
            Label : 'Card No.',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : CARDHOLDER_ID,
            Label : 'Cardholder ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : STATUS,
            Label : 'Status',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : MONTHLY_ADVANCED_AMT,
            Label : 'Monthly Advanced Amount',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : COMMIT_OFFSET_AMT,
            Label : 'Commit Offset Amount',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : ACTUAL_OFFSET_AMT,
            Label : 'Actual Offset Amount',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : CURRENT_ADVANCED_BALANCE,
            Label : 'Current Advanced Balance',
            @UI.Importance : #High,
        },
    ]
);