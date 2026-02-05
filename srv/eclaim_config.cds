using {eclaim_srv as service} from './eclaim_srv';

annotate service.ZCLAIM_PURPOSE with @(
    cds.autoexpose,
    Common.SemanticKey: [CLAIM_PURPOSE_ID],
    Capabilities: {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,
    UI          : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZCLAIM_PURPOSE',
            TypeNamePlural: 'ZCLAIM_PURPOSE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_PURPOSE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Purpose ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_PURPOSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Purpose Description'
            }
        ]
    }

)
