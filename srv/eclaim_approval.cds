using {ECLAIM_VIEW_SRV as service} from './eclaim_view_srv';


annotate service.ZEMP_CLAIM_EE_VIEW with @(
    cds.autoexpose,

    Common.SemanticKey : [ CLAIM_ID ],

    UI : {

        HeaderInfo : {
            TypeName        : 'Employee Claim',
            TypeNamePlural  : 'Employee Claims',
            Title           : { $Path : 'CLAIM_ID' },
            Description     : { $Path : 'STATUS_DESC' }
        },

        LineItem : [

            { 
              $Type : 'UI.DataField',
              Value : CLAIM_ID,
              Label : 'Claim ID'
            },

            { 
              $Type : 'UI.DataField',
              Value : PURPOSE,
              Label : 'Purpose'
            },

            { 
              $Type : 'UI.DataField',
              Value : TRIP_START_DATE,
              Label : 'Trip Start Date'
            },

            { 
              $Type : 'UI.DataField',
              Value : TOTAL_CLAIM_AMOUNT,
              Label : 'Total Claim Amount'
            },

            { 
              $Type : 'UI.DataField',
              Value : STATUS_DESC,
              Label : 'Status Description'
            },

            { 
              $Type : 'UI.DataField',
              Value : modifiedAt,
              Label : 'Modified At'
            }
        ]
    }
);


annotate service.ZEMP_REQUEST_EE_VIEW with @(
    cds.autoexpose,

    Common.SemanticKey : [ REQUEST_ID ],

    UI : {

        HeaderInfo : {
            TypeName        : 'Request Record',
            TypeNamePlural  : 'Request Records',
            Title           : { $Path : 'REQUEST_ID' },
            Description     : { $Path : 'STATUS_DESC' }
        },

        LineItem : [

            { 
              $Type : 'UI.DataField',
              Value : REQUEST_ID,
              Label : 'Request ID'
            },

            { 
              $Type : 'UI.DataField',
              Value : OBJECTIVE_PURPOSE,
              Label : 'Purpose / Objective'
            },

            { 
              $Type : 'UI.DataField',
              Value : REQUEST_DATE,
              Label : 'Request Date'
            },

            { 
              $Type : 'UI.DataField',
              Value : PREAPPROVAL_AMOUNT,
              Label : 'Pre‑Approval Amount'
            },

            { 
              $Type : 'UI.DataField',
              Value : STATUS_DESC,
              Label : 'Status Description'
            },

            { 
              $Type : 'UI.DataField',
              Value : modifiedAt,
              Label : 'Modified At'
            }
        ]
    }
);




