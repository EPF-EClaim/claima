using {eclaim_srv as service} from './eclaim_srv';

annotate service.ZRISK with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [RISK_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZRISK',
            TypeNamePlural: 'ZRISK',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : RISK_ID,
                ![@UI.Importance]: #High,
                Label            : 'Risk ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RISK_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Risk Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ],
      
    }
);

annotate service.ZREQUEST_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [REQUEST_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZREQUEST_TYPE',
            TypeNamePlural: 'ZREQUEST_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Request Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Requese Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Request Type Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Requese Type End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Request Type Status'
            }
        ]
    }
);

annotate service.ZCLAIM_TYPE with @(
    cds.autoexpose,
    odata.draft.enabled,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [CLAIM_TYPE_ID],

    UI                : {
        Identification: [
            {
                $Type: 'UI.DataField',
                Value: CLAIM_TYPE_ID,
                Label: 'Claim Type ID'
            },
            {
                $Type: 'UI.DataField',
                Value: CLAIM_TYPE_DESC,
                Label: 'Description'
            },
            {
                $Type: 'UI.DataField',
                Value: GL_ACCOUNT,
                Label: 'GL Account'
            },
            {
                $Type: 'UI.DataField',
                Value: CATEGORY_ID,
                Label: 'Category ID'
            },
            {
                $Type: 'UI.DataField',
                Value: START_DATE,
                Label: 'Start Date'
            },
            {
                $Type: 'UI.DataField',
                Value: END_DATE,
                Label: 'End Date'
            },
            {
                $Type: 'UI.DataField',
                Value: STATUS,
                Label: 'Status'
            }
        ],

        LineItem      : [
            {
                $Type: 'UI.DataField',
                Value: CLAIM_TYPE_ID,
                Label: 'Claim Type ID'
            },
            {
                $Type: 'UI.DataField',
                Value: CLAIM_TYPE_DESC,
                Label: 'Description'
            },
            {
                $Type: 'UI.DataField',
                Value: GL_ACCOUNT,
                Label: 'GL Account'
            },
            {
                $Type: 'UI.DataField',
                Value: CATEGORY_ID,
                Label: 'Category ID'
            },
            {
                $Type: 'UI.DataField',
                Value: START_DATE,
                Label: 'Start Date'
            },
            {
                $Type: 'UI.DataField',
                Value: END_DATE,
                Label: 'End Date'
            },
            {
                $Type: 'UI.DataField',
                Value: STATUS,
                Label: 'Status'
            }
        ],

        Facets        : [
            {
                $Type : 'UI.ReferenceFacet',
                Label : 'General Information',
                Target: '@UI.Identification'
            },
            {
                $Type : 'UI.ReferenceFacet',
                Label : 'Items',
                Target: 'Items/@UI.LineItem'
            }
        ]
    }
);

annotate service.ZNUM_RANGE with @(
    cds.autoexpose,
    Common.SemanticKey: [RANGE_ID],
    Capabilities.SearchRestrictions: {Searchable: false},
    UI                : {
        CreateHidden: true,
        DeleteHidden: true,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZNUM_RANGE',
            TypeNamePlural: 'ZNUM_RANGE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : RANGE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Range ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RANGE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Range Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM,
                ![@UI.Importance]: #High,
                Label            : 'From'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO,
                ![@UI.Importance]: #High,
                Label            : 'To'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENT,
                ![@UI.Importance]: #High,
                Label            : 'Current'
            }
        ]
    }
);

annotate service.ZCLAIM_TYPE_ITEM with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        CLAIM_TYPE_ID,
        CLAIM_TYPE_ITEM_ID
    ],

    UI                : {LineItem: [
        {
            $Type: 'UI.DataField',
            Value: CLAIM_TYPE_ITEM_ID,
            Label: 'Item ID'
        },
        {
            $Type: 'UI.DataField',
            Value: CLAIM_TYPE_ITEM_DESC,
            Label: 'Description'
        },
        {
            $Type: 'UI.DataField',
            Value: START_DATE,
            Label: 'Start Date'
        },
        {
            $Type: 'UI.DataField',
            Value: END_DATE,
            Label: 'End Date'
        },
        {
            $Type: 'UI.DataField',
            Value: STATUS,
            Label: 'Status'
        },
        {
            $Type: 'UI.DataField',
            Value: CATEGORY_ID,
            Label: 'Category ID'
        },
        {
            $Type: 'UI.DataField',
            Value: COST_CENTER,
            Label: 'Cost Center'
        },
        {
            $Type: 'UI.DataField',
            Value: MATERIAL_CODE,
            Label: 'Material Code'
        },
        {
            $Type: 'UI.DataField',
            Value: RISK,
            Label: 'Risk'
        },
        {
            $Type: 'UI.DataField',
            Value: SUBMISSION_TYPE,
            Label: 'Submission Type'
        }
    ]}
);

annotate service.ZAPP_FIELD_CTRL with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        CLAIM_TYPE_ID,
        CLAIM_TYPE_ITEM_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZAPP_FIELD_CTRL',
            TypeNamePlural: 'ZAPP_FIELD_CTRL',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Item ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD01,
                ![@UI.Importance]: #High,
                Label            : 'Field 1'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD02,
                ![@UI.Importance]: #High,
                Label            : 'Field 2'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD03,
                ![@UI.Importance]: #High,
                Label            : 'Field 3'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD04,
                ![@UI.Importance]: #High,
                Label            : 'Field 4'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD05,
                ![@UI.Importance]: #High,
                Label            : 'Field 5'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD06,
                ![@UI.Importance]: #High,
                Label            : 'Field 6'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD07,
                ![@UI.Importance]: #High,
                Label            : 'Field 7'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD08,
                ![@UI.Importance]: #High,
                Label            : 'Field 8'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD09,
                ![@UI.Importance]: #High,
                Label            : 'Field 9'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD10,
                ![@UI.Importance]: #High,
                Label            : 'Field 10'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD11,
                ![@UI.Importance]: #High,
                Label            : 'Field 11'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD12,
                ![@UI.Importance]: #High,
                Label            : 'Field 12'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD13,
                ![@UI.Importance]: #High,
                Label            : 'Field 13'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD14,
                ![@UI.Importance]: #High,
                Label            : 'Field 14'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD15,
                ![@UI.Importance]: #High,
                Label            : 'Field 15'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD16,
                ![@UI.Importance]: #High,
                Label            : 'Field 16'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD17,
                ![@UI.Importance]: #High,
                Label            : 'Field 17'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD18,
                ![@UI.Importance]: #High,
                Label            : 'Field 18'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD19,
                ![@UI.Importance]: #High,
                Label            : 'Field 19'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FIELD20,
                ![@UI.Importance]: #High,
                Label            : 'Field 20'
            },
        ]
    }
);

annotate service.ZCLAIM_CATEGORY with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [CLAIM_CAT_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZCLAIM_CATEGORY',
            TypeNamePlural: 'ZCLAIM_CATEGORY',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_CAT_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Category ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Category Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZSTATUS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [STATUS_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZSTATUS',
            TypeNamePlural: 'ZSTATUS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Status ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Status Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZLODGING_CAT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [LODGING_CATEGORY_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZLODGING_CAT',
            TypeNamePlural: 'ZLODGING_CAT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_CATEGORY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Category ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Category Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZROOM_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [ROOM_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZROOM_TYPE',
            TypeNamePlural: 'ZROOM_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : ROOM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Room Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROOM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Room Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZFLIGHT_CLASS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [FLIGHT_CLASS_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZFLIGHT_CLASS',
            TypeNamePlural: 'ZFLIGHT_CLASS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : FLIGHT_CLASS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Flight Class ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FLIGHT_CLASS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Flight Class Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZCOUNTRY with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [COUNTRY_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZCOUNTRY',
            TypeNamePlural: 'ZCOUNTRY',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : COUNTRY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Country ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COUNTRY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Country Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZAREA with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [AREA_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZAREA',
            TypeNamePlural: 'ZAREA',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : AREA_ID,
                ![@UI.Importance]: #High,
                Label            : 'Area ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AREA_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Area Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZMARITAL_STAT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [MARRIAGE_CATEGORY_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZMARITAL_STAT',
            TypeNamePlural: 'ZMARITAL_STAT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZVEHICLE_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [VEHICLE_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZVEHICLE_TYPE',
            TypeNamePlural: 'ZVEHICLE_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZSTATE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        COUNTRY_ID,
        STATE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZSTATE',
            TypeNamePlural: 'ZSTATE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : COUNTRY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Country ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATE_ID,
                ![@UI.Importance]: #High,
                Label            : 'State ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'State Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZEMP_MASTER with @(
    cds.autoexpose,

    Capabilities.SearchRestrictions: {Searchable: false},
    cds.server.body_parser.limit: '10mb',
    Common.SemanticKey: [EEID],
    Capabilities      : {
        Deletable : false,
        Updatable : true,
        Insertable: true
    },

    UI                : {
        CreateHidden: true,
        DeleteHidden: true,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZEMP_MASTER',
            TypeNamePlural: 'ZEMP_MASTER',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : EEID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NAME,
                ![@UI.Importance]: #High,
                Label            : 'Employee Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GRADE,
                ![@UI.Importance]: #High,
                Label            : 'Personal Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CC,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POS,
                ![@UI.Importance]: #High,
                Label            : 'Position Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEP,
                ![@UI.Importance]: #High,
                Label            : 'Department'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UNIT_SECTION,
                ![@UI.Importance]: #High,
                Label            : 'Unit/Section'
            },
            {
                $Type            : 'UI.DataField',
                Value            : B_PLACE,
                ![@UI.Importance]: #High,
                Label            : 'Place of Birth'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARITAL,
                ![@UI.Importance]: #High,
                Label            : 'Marital Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : JOB_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Job Group'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OFFICE_LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Office Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ADDRESS_LINE1,
                ![@UI.Importance]: #High,
                Label            : 'Address Line 1'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ADDRESS_LINE2,
                ![@UI.Importance]: #High,
                Label            : 'Address Line 2'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ADDRESS_LINE3,
                ![@UI.Importance]: #High,
                Label            : 'Address Line 3'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSTCODE,
                ![@UI.Importance]: #High,
                Label            : 'Postcode'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATE,
                ![@UI.Importance]: #High,
                Label            : 'State'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COUNTRY,
                ![@UI.Importance]: #High,
                Label            : 'Country'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CONTACT_NO,
                ![@UI.Importance]: #High,
                Label            : 'Contact No'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMAIL,
                ![@UI.Importance]: #High,
                Label            : 'Email'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DIRECT_SUPPERIOR,
                ![@UI.Importance]: #High,
                Label            : 'Direct Supperior'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROLE,
                ![@UI.Importance]: #High,
                Label            : 'Role'
            },
            {
                $Type            : 'UI.DataField',
                Value            : USER_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'User Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MEDICAL_INSURANCE_ENTITLEMENT,
                ![@UI.Importance]: #High,
                Label            : 'Medical Insurance Entitlement'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_BILL_ELIGIBILITY,
                ![@UI.Importance]: #High,
                Label            : 'Mobile Bill Eligibility'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_BILL_ELIG_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Mobile Phone Bill Eligible Amount Per Month'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMPLOYEE_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Employee Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Position Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Position Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_EVENT_REASON,
                ![@UI.Importance]: #High,
                Label            : 'Position Event Reason'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CONFIRMATION_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Confimation Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EFFECTIVE_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Effective Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UPDATED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Updated Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSERTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Inserted Date'
            },
        ]
    }
);

annotate service.ZJOB_GROUP with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [JOB_GROUP_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZJOB_GROUP',
            TypeNamePlural: 'ZJOB_GROUP',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : JOB_GROUP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Job Group ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : JOB_GROUP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Job Group Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZDEPARTMENT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [DEPARTMENT_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZDEPARTMENT',
            TypeNamePlural: 'ZDEPARTMENT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_ID,
                ![@UI.Importance]: #High,
                Label            : 'Department ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Department Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : HEAD_OF_DEPARTMENT,
                ![@UI.Importance]: #High,
                Label            : 'Head of Department'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SHORT_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Short Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DIVISION,
                ![@UI.Importance]: #High,
                Label            : 'Division'
            }
        ]
    }
);

annotate service.ZROLE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [ROLE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZROLE',
            TypeNamePlural: 'ZROLE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : ROLE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Role ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROLE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Role Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZUSER_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [USER_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZUSER_TYPE',
            TypeNamePlural: 'ZUSER_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : USER_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'User Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : USER_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'User Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZEMP_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [EMP_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZEMP_TYPE',
            TypeNamePlural: 'ZEMP_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : EMP_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Employee Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZREGION with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [REGION_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZREGION',
            TypeNamePlural: 'ZREGION',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : REGION_ID,
                ![@UI.Importance]: #High,
                Label            : 'Region ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REGION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Region Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZRATE_KM with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [RATE_KM_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZRATE_KM',
            TypeNamePlural: 'ZRATE_KM',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : RATE_KM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Rate KM ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Item ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RATE,
                ![@UI.Importance]: #High,
                Label            : 'Rate'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZSUBMISSION_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [SUBMISSION_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZSUBMISSION_TYPE',
            TypeNamePlural: 'ZSUBMISSION_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);


annotate service.ZOFFICE_LOCATION with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        LOCATION_ID,
        STATE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZOFFICE_LOCATION',
            TypeNamePlural: 'ZOFFICE_LOCATION',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION_ID,
                ![@UI.Importance]: #High,
                Label            : 'Location ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATE_ID,
                ![@UI.Importance]: #High,
                Label            : 'State ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Location Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Location Group'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LEGAL_ENTITY,
                ![@UI.Importance]: #High,
                Label            : 'Legal Entity'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZOFFICE_DISTANCE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        FROM_LOCATION_ID,
        FROM_STATE_ID,
        TO_LOCATION_ID,
        TO_STATE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZOFFICE_DISTANCE',
            TypeNamePlural: 'ZOFFICE_DISTANCE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : FROM_STATE_ID,
                ![@UI.Importance]: #High,
                Label            : 'From State ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_LOCATION_ID,
                ![@UI.Importance]: #High,
                Label            : 'From Location ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_STATE_ID,
                ![@UI.Importance]: #High,
                Label            : 'To State ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_LOCATION_ID,
                ![@UI.Importance]: #High,
                Label            : 'To Location ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MILEAGE,
                ![@UI.Importance]: #High,
                Label            : 'Mileage'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZLOC_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [LOC_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZLOC_TYPE',
            TypeNamePlural: 'ZLOC_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : LOC_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Location Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOC_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Location Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZMATERIAL_GROUP with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [MATERIAL_CODE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZMATERIAL_GROUP',
            TypeNamePlural: 'ZMATERIAL_GROUP',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : MATERIAL_CODE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Material Code ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MATERIAL_CODE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Material Code Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZINDIV_GROUP with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [IND_OR_GROUP_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZINDIV_GROUP',
            TypeNamePlural: 'ZINDIV_GROUP',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : IND_OR_GROUP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Individual/Group ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : IND_OR_GROUP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Individual/Group ID Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZVEHICLE_OWNERSHIP with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [VEHICLE_OWNERSHIP_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZVEHICLE_OWNERSHIP',
            TypeNamePlural: 'ZVEHICLE_OWNERSHIP',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_OWNERSHIP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Ownership ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_OWNERSHIP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Ownership Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZEMP_RELATIONSHIP with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [RELATIONSHIP_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZEMP_RELATIONSHIP',
            TypeNamePlural: 'ZEMP_RELATIONSHIP',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : RELATIONSHIP_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Relationship Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RELATIONSHIP_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Relationship Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZLOOKUP_FIELD with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [LOOKUP_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZLOOKUP_FIELD',
            TypeNamePlural: 'ZLOOKUP_FIELD',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : LOOKUP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Lookup ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOOKUP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Lookup Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZMARITAL_CAT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [MARRIAGE_CATEGORY_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZMARITAL_CAT',
            TypeNamePlural: 'ZMARITAL_CAT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZPROJECT_HDR with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [PROJECT_CODE_IO],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZPROJECT_HDR',
            TypeNamePlural: 'ZPROJECT_HDR',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : PROJECT_CODE_IO,
                ![@UI.Importance]: #High,
                Label            : 'Project Code (IO)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROJECT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Project Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GL_ACCOUNT,
                ![@UI.Importance]: #High,
                Label            : 'GL Account'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BUFFER_FIELD1,
                ![@UI.Importance]: #High,
                Label            : 'Buffer Field 1'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BUFFER_FIELD2,
                ![@UI.Importance]: #High,
                Label            : 'Buffer Field 2'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            }
        ]
    }
);

annotate service.ZBRANCH with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [BRANCH_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZBRANCH',
            TypeNamePlural: 'ZBRANCH',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_ID,
                ![@UI.Importance]: #High,
                Label            : 'Unit/Section (Branch) ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Unit/Section (Branch) Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : HEAD_OF_UNIT,
                ![@UI.Importance]: #High,
                Label            : 'Head of Unit'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZEMP_CA_PAYMENT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        REQUEST_ID,
        EMP_ID,
        DISBURSEMENT_DATE
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZEMP_CA_PAYMENT',
            TypeNamePlural: 'ZEMP_CA_PAYMENT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DISBURSEMENT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Disbursement Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DISBURSEMENT_STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Disbursement Status (Y/N)'
            }
        ]
    }
);

annotate service.ZPERDIEM_ENT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        PERSONAL_GRADE_FROM,
        PERSONAL_GRADE_TO,
        LOCATION,
        EFFECTIVE_START_DATE,
        EFFECTIVE_END_DATE
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZPERDIEM_ENT',
            TypeNamePlural: 'ZPERDIEM_ENT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : PERSONAL_GRADE_FROM,
                ![@UI.Importance]: #High,
                Label            : 'Personal Grade From'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PERSONAL_GRADE_TO,
                ![@UI.Importance]: #High,
                Label            : 'Personal Grade To'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EFFECTIVE_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Effective Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EFFECTIVE_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Effective End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY,
                ![@UI.Importance]: #High,
                Label            : 'Currency'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Amount'
            }
        ]
    }
);

annotate service.ZHOUSING_LOAN_SCHEME with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [HOUSING_LOAN_SCHEME_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZHOUSING_LOAN_SCHEME',
            TypeNamePlural: 'ZHOUSING_LOAN_SCHEME',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : HOUSING_LOAN_SCHEME_ID,
                ![@UI.Importance]: #High,
                Label            : 'Housing Loan Scheme ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : HOUSING_LOAN_SCHEME_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Housing Loan Scheme Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZLENDER_NAME with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [LENDER_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZLENDER_NAME',
            TypeNamePlural: 'ZLENDER_NAME',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : LENDER_ID,
                ![@UI.Importance]: #High,
                Label            : 'Lender ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LENDER_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Lender Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZREJECT_REASON with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        REASON_ID,
        REASON_TYPE,
        START_DATE,
        END_DATE
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZREJECT_REASON',
            TypeNamePlural: 'ZREJECT_REASON',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : REASON_ID,
                ![@UI.Importance]: #High,
                Label            : 'Reason ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REASON_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Reason Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REASON_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Reason Text'
            }
        ]
    }
);

annotate service.ZCURRENCY with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [CURRENCY_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZCURRENCY',
            TypeNamePlural: 'ZCURRENCY',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Currency ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Currency Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            }
        ]
    }
);

annotate service.ZEMP_DEPENDENT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey: [
        EMP_ID,
        RELATIONSHIP,
        DEPENDENT_NO
    ],
    Capabilities      : {
        Deletable : false,
        Updatable : true,
        Insertable: true
    },
    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZEMP_DEPENDENT',
            TypeNamePlural: 'ZEMP_DEPENDENT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RELATIONSHIP,
                ![@UI.Importance]: #High,
                Label            : 'Relationship'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_NO,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SPOUSE_EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Spouse Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LEGAL_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Legal Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NATIONAL_ID,
                ![@UI.Importance]: #High,
                Label            : 'National ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DOB,
                ![@UI.Importance]: #High,
                Label            : 'Date Of Birth'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STUDENT,
                ![@UI.Importance]: #High,
                Label            : 'Student'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMPLOYED,
                ![@UI.Importance]: #High,
                Label            : 'Employed'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POST_EDU_ASSISTANT_CLAIM_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Post Education Assistance Claim Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POST_EDU_ASSISTANT_ENTITLE_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Post Education Assistance Entitled Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MEDICAL_INSURANCE,
                ![@UI.Importance]: #High,
                Label            : 'Medical Insurance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Effective Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UPDATED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Updated Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSERTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Inserted Date'
            }
        ]
    }
);
