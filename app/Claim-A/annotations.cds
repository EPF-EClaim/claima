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

