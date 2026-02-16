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

annotate eclaim_srv.ZAPP_FIELD_CTRL with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : CLAIM_TYPE_ID,
            Label : 'Claim Type ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : CLAIM_TYPE_ITEM_ID,
            Label : 'Claim Type Item ID',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD01,
            Label : 'Field 1',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD02,
            Label : 'Field 2',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD03,
            Label : 'Field 3',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD04,
            Label : 'Field 4',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD05,
            Label : 'Field 5',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD06,
            Label : 'Field 6',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD07,
            Label : 'Field 7',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD08,
            Label : 'Field 8',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD09,
            Label : 'Field 9',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD10,
            Label : 'Field 10',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD11,
            Label : 'Field 11',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD12,
            Label : 'Field 12',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD13,
            Label : 'Field 13',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD14,
            Label : 'Field 14',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD15,
            Label : 'Field 15',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD16,
            Label : 'Field 16',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD17,
            Label : 'Field 17',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD18,
            Label : 'Field 18',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD19,
            Label : 'Field 19',
            @UI.Importance : #High,
        },
        {
            $Type : 'UI.DataField',
            Value : FIELD20,
            Label : 'Field 20',
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

