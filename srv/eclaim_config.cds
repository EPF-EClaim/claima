using {eclaim_srv as service} from './eclaim_srv';

annotate service.ZCLAIM_PURPOSE with @(

    Capabilities.Deletable : true,
    Capabilities.Updatable : true,
    Capabilities.Insertable: true,
    odata.draft.enabled,


    UI                     : {
        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZCLAIM_PURPOSE',
            TypeNamePlural: 'ZCLAIM_PURPOSE',
        },
        LineItem  : [
            // {
            //     $Type : 'UI.DataFieldForAction',
            //     Action: 'service.copyData',
            //     Label : 'Copy'
            // },
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
