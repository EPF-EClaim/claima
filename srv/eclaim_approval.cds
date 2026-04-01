using {ECLAIM_VIEW_SRV as service} from './eclaim_view_srv';

annotate service.ZEMP_CLAIM_EE_VIEW with @(

  cds.autoexpose,
  //Capabilities.SearchRestrictions: {Searchable: true},
        Common.SemanticKey             : [
        CLAIM_ID
    ],

  UI                             : {

    //SelectionFields: [CLAIM_ID],

    HeaderInfo     : {
      $Type         : 'UI.HeaderInfoType',
      TypeName      : 'Claim Status',
      TypeNamePlural: 'Claim Status'
    },

    LineItem       : [
      {
        $Type: 'UI.DataField',
        Value: CLAIM_ID,
        ![@UI.Importance]: #High,
        Label: 'Claim ID'
      },

      {
        $Type: 'UI.DataField',
        Value: PURPOSE,
        ![@UI.Importance]: #High,
        Label: 'Purpose'
      },

      {
        $Type: 'UI.DataField',
        Value: TRIP_START_DATE,
        ![@UI.Importance]: #High,
        Label: 'Trip Start Date'
      },

      {
        $Type: 'UI.DataField',
        Value: TOTAL_CLAIM_AMOUNT,
        ![@UI.Importance]: #High,
        Label: 'Total Claim Amount'
      },

      {
        $Type: 'UI.DataField',
        Value: STATUS_DESC,
        ![@UI.Importance]: #High,
        Label: 'Status Description'
      },

      {
        $Type: 'UI.DataField',
        Value: modifiedAt,
        ![@UI.Importance]: #High,
        Label: 'Modified At'
      }
    ]
  }
);


annotate service.ZEMP_REQUEST_EE_VIEW with @(

  // cds.autoexpose,
  //Capabilities.SearchRestrictions: {Searchable: true},
      Common.SemanticKey             : [
        REQUEST_ID
    ],

  UI                             : {

    //SelectionFields: [REQUEST_ID],


    HeaderInfo     : {
      $Type         : 'UI.HeaderInfoType',
      TypeName      : 'Pre Approval Status',
      TypeNamePlural: 'Pre Approval Status'
    },

    LineItem       : [
      {
        $Type: 'UI.DataField',
        Value: REQUEST_ID,
        ![@UI.Importance]: #High,
        Label: 'Request ID'
      },

      {
        $Type: 'UI.DataField',
        Value: OBJECTIVE_PURPOSE,
        ![@UI.Importance]: #High,
        Label: 'Purpose / Objective'
      },

      {
        $Type: 'UI.DataField',
        Value: REQUEST_DATE,
        ![@UI.Importance]: #High,
        Label: 'Request Date'
      },

      {
        $Type: 'UI.DataField',
        Value: PREAPPROVAL_AMOUNT,
        ![@UI.Importance]: #High,
        Label: 'Pre‑Approval Amount'
      },

      {
        $Type: 'UI.DataField',
        Value: STATUS_DESC,
        ![@UI.Importance]: #High,
        Label: 'Status Description'
      },

      {
        $Type: 'UI.DataField',
        Value: modifiedAt,
        ![@UI.Importance]: #High,
        Label: 'Modified At'
      }
    ]
  }
);
