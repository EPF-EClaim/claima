using {eclaim_srv as service} from './eclaim_srv';

annotate service.ZRISK with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Capabilities.SortRestrictions  : {Sortable: true},
    Common.SemanticKey             : [RISK_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Risk Level - ZRISK',
            TypeNamePlural: 'Risk Level - ZRISK',
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
    Common.SemanticKey             : [REQUEST_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Pre-Approval Request Type - ZREQUEST_TYPE',
            TypeNamePlural: 'Pre-Approval Request Type - ZREQUEST_TYPE',
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
    Common.SemanticKey             : [CLAIM_TYPE_ID],

    UI                             : {
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
                Value: REQUEST_TYPE,
                Label: 'Request Type'
            },
            {
                $Type: 'UI.DataField',
                Value: IND_OR_GROUP,
                Label: 'Individual/Group'
            },
            {
                $Type: 'UI.DataField',
                Value: PROJECT_CLAIM,
                Label: 'Project Claim'
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
                Value: REQUEST_TYPE,
                Label: 'Request Type'
            },
            {
                $Type: 'UI.DataField',
                Value: IND_OR_GROUP,
                Label: 'Individual/Group'
            },
            {
                $Type: 'UI.DataField',
                Value: PROJECT_CLAIM,
                Label: 'Project Claim'
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
    Common.SemanticKey             : [RANGE_ID],
    Capabilities.SearchRestrictions: {Searchable: false},
    UI                             : {
        CreateHidden: true,
        DeleteHidden: true,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim ID Number Sequence',
            TypeNamePlural: 'Claim ID Number Sequence',
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
                Value            : PREFIX,
                ![@UI.Importance]: #High,
                Label            : 'Prefix'
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
    Common.SemanticKey             : [
        CLAIM_TYPE_ID,
        CLAIM_TYPE_ITEM_ID
    ],

    UI                             : {LineItem: [
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

annotate service.ZCLAIM_CATEGORY with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [CLAIM_CAT_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Travel Claim Category',
            TypeNamePlural: 'Travel Claim Category',
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
    Common.SemanticKey             : [STATUS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim/Request Submission Status',
            TypeNamePlural: 'Claim/Request Submission Status',
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
    Common.SemanticKey             : [LODGING_CATEGORY_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Lodging Category',
            TypeNamePlural: 'Lodging Category',
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
    Common.SemanticKey             : [ROOM_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Hotel Room Type',
            TypeNamePlural: 'Hotel Room Type',
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
                Value            : LEVEL,
                ![@UI.Importance]: #High,
                Label            : 'Level'
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
    Common.SemanticKey             : [FLIGHT_CLASS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Flight Class',
            TypeNamePlural: 'Flight Class',
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
                Value            : LEVEL,
                ![@UI.Importance]: #High,
                Label            : 'Level'
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
    Common.SemanticKey             : [COUNTRY_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Country',
            TypeNamePlural: 'Country',
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
    Capabilities.SearchRestrictions: {Searchable: true},
    Common.SemanticKey             : [AREA_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Country/Region - ZAREA',
            TypeNamePlural: 'Country/Region - ZAREA',
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
    Capabilities.SearchRestrictions: {Searchable: true},
    Common.SemanticKey             : [MARRIAGE_STATUS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Marital Status - ZMARITAL_STAT',
            TypeNamePlural: 'Marital Status - ZMARITAL_STAT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_STATUS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Status ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Status Description'
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
    Capabilities.SearchRestrictions: {Searchable: true},
    Common.SemanticKey             : [VEHICLE_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Vehicle Type - ZVEHICLE_TYPE',
            TypeNamePlural: 'Vehicle Type - ZVEHICLE_TYPE',
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
    Capabilities.SearchRestrictions: {Searchable: true},
    Common.SemanticKey             : [
        COUNTRY_ID,
        STATE_ID
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'State - ZSTATE',
            TypeNamePlural: 'State - ZSTATE',
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
    cds.server.body_parser.limit   : '10mb',
    Common.SemanticKey             : [EEID],
    Capabilities                   : {
        Deletable : false,
        Updatable : true,
        Insertable: true
    },

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Employee Mini Master - ZEMP_MASTER',
            TypeNamePlural: 'Employee Mini Master - ZEMP_MASTER',
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
    Common.SemanticKey             : [JOB_GROUP_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Job Group - ZJOB_GROUP',
            TypeNamePlural: 'Job Group - ZJOB_GROUP',
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
    Common.SemanticKey             : [DEPARTMENT_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Department - ZDEPARTMENT',
            TypeNamePlural: 'Department - ZDEPARTMENT',
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
    Common.SemanticKey             : [ROLE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'eClaim Role - ZROLE',
            TypeNamePlural: 'eClaim Role - ZROLE',
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
    Common.SemanticKey             : [USER_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'eClaim User Type - ZUSER_TYPE',
            TypeNamePlural: 'eClaim User Type - ZUSER_TYPE',
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
    Common.SemanticKey             : [EMP_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Employee Status - ZEMP_TYPE',
            TypeNamePlural: 'Employee Status - ZEMP_TYPE',
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
    Common.SemanticKey             : [REGION_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Semenanjung & Sabah/Sarawak - ZREGION',
            TypeNamePlural: 'Semenanjung & Sabah/Sarawak - ZREGION',
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
    Common.SemanticKey             : [RATE_KM_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Rate Per KM - ZRATE_KM',
            TypeNamePlural: 'Rate Per KM - ZRATE_KM',
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
    Common.SemanticKey             : [SUBMISSION_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim Submission Type - ZSUBMISSION_TYPE',
            TypeNamePlural: 'Claim Submission Type - ZSUBMISSION_TYPE',
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
    Common.SemanticKey             : [
        LOCATION_ID,
        STATE_ID
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'KWSP Office Location - ZOFFICE_LOCATION',
            TypeNamePlural: 'KWSP Office Location - ZOFFICE_LOCATION',
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
    Common.SemanticKey             : [
        FROM_LOCATION_ID,
        FROM_STATE_ID,
        TO_LOCATION_ID,
        TO_STATE_ID
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'KWSP Office Location Distance - ZOFFICE_DISTANCE',
            TypeNamePlural: 'KWSP Office Location Distance - ZOFFICE_DISTANCE',
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
    Common.SemanticKey             : [LOC_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Travel Location Type - ZLOC_TYPE',
            TypeNamePlural: 'Travel Location Type - ZLOC_TYPE',
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
    Common.SemanticKey             : [MATERIAL_CODE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'EPF Material Code - ZMATERIAL_GROUP',
            TypeNamePlural: 'EPF Material Code - ZMATERIAL_GROUP',
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
    Common.SemanticKey             : [IND_OR_GROUP_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Pre-Approval Request - Individual/Group - ZINDIV_GROUP',
            TypeNamePlural: 'Pre-Approval Request - Individual/Group - ZINDIV_GROUP',
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
    Common.SemanticKey             : [VEHICLE_OWNERSHIP_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Self/Company Vehicle - ZVEHICLE_OWNERSHIP',
            TypeNamePlural: 'Self/Company Vehicle - ZVEHICLE_OWNERSHIP',
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
    Common.SemanticKey             : [RELATIONSHIP_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Dependent Relationship Status - ZEMP_RELATIONSHIP',
            TypeNamePlural: 'Dependent Relationship Status - ZEMP_RELATIONSHIP',
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

annotate service.ZMARITAL_CAT with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [MARRIAGE_CATEGORY_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Marriage Category - ZMARITAL_CAT',
            TypeNamePlural: 'Marriage Category - ZMARITAL_CAT',
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
    Common.SemanticKey             : [PROJECT_CODE_IO],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Project Code - ZPROJECT_HDR',
            TypeNamePlural: 'Project Code - ZPROJECT_HDR',
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
    Common.SemanticKey             : [BRANCH_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'EPF Branch - ZBRANCH',
            TypeNamePlural: 'EPF Branch - ZBRANCH',
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
    Common.SemanticKey             : [
        REQUEST_ID,
        EMP_ID,
        DISBURSEMENT_DATE
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Cash Advance Payment Date Bypass - ZEMP_CA_PAYMENT',
            TypeNamePlural: 'Cash Advance Payment Date Bypass - ZEMP_CA_PAYMENT',
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
    Common.SemanticKey             : [
        PERSONAL_GRADE,
        LOCATION,
        CLAIM_TYPE_ID,
        CLAIM_TYPE_ITEM_ID,
        START_DATE,
        END_DATE
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Meal Allowance Entitlement - ZPERDIEM_ENT',
            TypeNamePlural: 'Meal Allowance Entitlement - ZPERDIEM_ENT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : PERSONAL_GRADE,
                ![@UI.Importance]: #High,
                Label            : 'Personal Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Location'
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
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Item ID'
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

annotate service.ZHOUSING_LOAN_SCHEME with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [HOUSING_LOAN_SCHEME_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Housing Loan Scheme - ZHOUSING_LOAN_SCHEME',
            TypeNamePlural: 'Housing Loan Scheme - ZHOUSING_LOAN_SCHEME',
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
    Common.SemanticKey             : [LENDER_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Loan Provider - ZLENDER_NAME',
            TypeNamePlural: 'Loan Provider - ZLENDER_NAME',
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
    Common.SemanticKey             : [
        REASON_ID,
        REASON_TYPE,
        START_DATE,
        END_DATE
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim/Request Reject Reasoning - ZREJECT_REASON',
            TypeNamePlural: 'Claim/Request Reject Reasoning - ZREJECT_REASON',
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
    Common.SemanticKey             : [CURRENCY_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Currency Code - ZCURRENCY',
            TypeNamePlural: 'Currency Code - ZCURRENCY',
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
    Capabilities.SearchRestrictions: {Searchable: true},
    Common.SemanticKey             : [
        EMP_ID,
        RELATIONSHIP,
        DEPENDENT_NO
    ],
    Capabilities                   : {
        Deletable : false,
        Updatable : true,
        Insertable: true
    },
    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Employee Dependent - ZEMP_DEPENDENT',
            TypeNamePlural: 'Employee Dependent - ZEMP_DEPENDENT',
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

annotate service.ZMOBILE_CATEGORY_PURPOSE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [MOBILE_CATEGORY_PURPOSE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Mobile Phone Bill Category/Purpose - ZMOBILE_CATEGORY_PURPOSE',
            TypeNamePlural: 'Mobile Phone Bill Category/Purpose - ZMOBILE_CATEGORY_PURPOSE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_CATEGORY_PURPOSE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Category/Purpose (Mobile) ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_CATEGORY_PURPOSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Category/Purpose (Mobile) Description'
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

annotate service.ZVEHICLE_CLASS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [VEHICLE_CLASS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Train/Ship Class - ZVEHICLE_CLASS',
            TypeNamePlural: 'Train/Ship Class - ZVEHICLE_CLASS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_CLASS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Class ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_CLASS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Class Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LEVEL,
                ![@UI.Importance]: #High,
                Label            : 'Level'
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

annotate service.ZINSURANCE_PROVIDER with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [INSURANCE_PROVIDER_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Insurance Provider - ZINSURANCE_PROVIDER',
            TypeNamePlural: 'Insurance Provider - ZINSURANCE_PROVIDER',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PROVIDER_ID,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Provider ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PROVIDER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Provider Description'
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

annotate service.ZINSURANCE_PACKAGE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [INSURANCE_PACKAGE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Insurance Package - ZINSURANCE_PACKAGE',
            TypeNamePlural: 'Insurance Package - ZINSURANCE_PACKAGE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PACKAGE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Package ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZINSURANCE_PACKAGE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Package Description'
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

annotate service.ZPROFESIONAL_BODY with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [PROFESIONAL_BODY_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Type of Profesional Body - ZPROFESIONAL_BODY',
            TypeNamePlural: 'Type of Profesional Body - ZPROFESIONAL_BODY',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : PROFESIONAL_BODY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Type of Profesional Body ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROFESIONAL_BODY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Profesional Body Description'
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

annotate service.ZSTUDY_LEVELS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [STUDY_LEVELS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Education Level - ZSTUDY_LEVELS',
            TypeNamePlural: 'Education Level - ZSTUDY_LEVELS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : STUDY_LEVELS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Level of Studies ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STUDY_LEVELS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Level of Studies Description'
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

annotate service.ZTRANSFER_MODE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [TRANSFER_MODE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Mode of Transfer Type - ZTRANSFER_MODE',
            TypeNamePlural: 'Mode of Transfer Type - ZTRANSFER_MODE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_MODE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Mode of Transfer ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_MODE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Mode of Transfer Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NUMBER_OF_DAYS,
                ![@UI.Importance]: #High,
                Label            : 'Number of Days'
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

annotate service.ZTRANSPORT_PASSING with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [TRANSPORT_PASSING_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Type of Transportation for the Passing - ZTRANSPORT_PASSING',
            TypeNamePlural: 'Type of Transportation for the Passing - ZTRANSPORT_PASSING',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : TRANSPORT_PASSING_ID,
                ![@UI.Importance]: #High,
                Label            : 'Transportation of the passing (dead) ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSPORT_PASSING_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Transportation of the passing (dead) Description'
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

annotate service.ZTRAVEL_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [TRAVEL_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Elaun Pertukaran - Moving with Family Type - ZTRAVEL_TYPE',
            TypeNamePlural: 'Elaun Pertukaran - Moving with Family Type - ZTRAVEL_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Travel (Sendirian/With Family) ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Travel (Sendirian/With Family) Description'
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

annotate service.ZFAMILY_TIMING with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [FAMILY_TIMING_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Elaun Pertukaran - Moving with Family Period - ZFAMILY_TIMING',
            TypeNamePlural: 'Elaun Pertukaran - Moving with Family Period - ZFAMILY_TIMING',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : FAMILY_TIMING_ID,
                ![@UI.Importance]: #High,
                Label            : 'With Family Now or Later ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FAMILY_TIMING_DESC,
                ![@UI.Importance]: #High,
                Label            : 'With Family Now or Later Description'
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

annotate service.ZSPORTS_REPRESENTATION with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [SPORTS_REPRESENTATION_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Sports Activity Representative - ZSPORTS_REPRESENTATION',
            TypeNamePlural: 'Sports Activity Representative - ZSPORTS_REPRESENTATION',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : SPORTS_REPRESENTATION_ID,
                ![@UI.Importance]: #High,
                Label            : 'Represent KWSP in Sport Activity ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SPORTS_REPRESENTATION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Represent KWSP in Sport Activity Description'
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

annotate service.ZPOSITION_EVENT_REASON with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [POSITION_EVENT_REASON_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Employee Position Event Reason - ZPOSITION_EVENT_REASON',
            TypeNamePlural: 'Employee Position Event Reason - ZPOSITION_EVENT_REASON',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_EVENT_REASON_ID,
                ![@UI.Importance]: #High,
                Label            : 'Position Event Reason ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_EVENT_REASON_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Position Event Reason Description'
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

annotate service.ZEMP_DEPENDENT_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [DEPENDENT_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Employee Dependent Selection - ZEMP_DEPENDENT_TYPE',
            TypeNamePlural: 'Employee Dependent Selection - ZEMP_DEPENDENT_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Type Description'
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

annotate service.ZCLAIM_BASIS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [CLAIM_BASIS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim Item Claim Amount Basis - ZCLAIM_BASIS',
            TypeNamePlural: 'Claim Item Claim Amount Basis - ZCLAIM_BASIS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_BASIS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Basis ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_BASIS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Basis Description'
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

annotate service.ZHOTEL_LODGING with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [HOTEL_LODGING_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Hotel/Lodging Selection - ZHOTEL_LODGING',
            TypeNamePlural: 'Hotel/Lodging Selection - ZHOTEL_LODGING',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : HOTEL_LODGING_ID,
                ![@UI.Importance]: #High,
                Label            : 'Hotel/Lodjing ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : HOTEL_LODGING_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Hotel/Lodjing Description'
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

annotate service.ZFARE_TYPE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [FARE_TYPE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Type Of Fare - ZFARE_TYPE',
            TypeNamePlural: 'Type Of Fare - ZFARE_TYPE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : FARE_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Fare Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FARE_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Fare Type Description'
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

annotate service.ZMETER_CUBE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [METER_CUBE_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Elaun Makan Amount Entitlement Control - ZMETER_CUBE',
            TypeNamePlural: 'Elaun Makan Amount Entitlement Control - ZMETER_CUBE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : METER_CUBE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Meter Cube ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARITAL_STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Marital Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AGE,
                ![@UI.Importance]: #High,
                Label            : 'Age'
            },
            {
                $Type            : 'UI.DataField',
                Value            : METER_CUBE,
                ![@UI.Importance]: #High,
                Label            : 'Meter Cube'
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

annotate service.ZTRAVEL_DAYS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [TRAVEL_DAYS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Travel Insurance (Number of Days Category) - ZTRAVEL_DAYS',
            TypeNamePlural: 'Travel Insurance (Number of Days Category) - ZTRAVEL_DAYS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_DAYS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Travel Days ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_DAYS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Travel Days Description'
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

annotate service.ZDB_STRUCTURE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [APP_CONTROL_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim Type Item - Field Control - ZDB_STRUCTURE',
            TypeNamePlural: 'Claim Type Item - Field Control - ZDB_STRUCTURE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : APP_CONTROL_ID,
                ![@UI.Importance]: #High,
                Label            : 'App Control Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMPONENT_LEVEL,
                ![@UI.Importance]: #High,
                Label            : 'Component Level'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Request Type ID'
            },
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
                Value            : FIELD,
                ![@UI.Importance]: #High,
                Label            : 'Field'
            },
        ]
    }
);

annotate service.ZBUDGET with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [
        YEAR,
        INTERNAL_ORDER,
        COMMITMENT_ITEM,
        FUND_CENTER,
        MATERIAL_GROUP
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/BudgetControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/BudgetControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Budget Data - ZBUDGET',
            TypeNamePlural: 'Budget Data - ZBUDGET',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : YEAR,
                ![@UI.Importance]: #High,
                Label            : 'Year'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INTERNAL_ORDER,
                ![@UI.Importance]: #High,
                Label            : 'Internal Order'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMMITMENT_ITEM,
                ![@UI.Importance]: #High,
                Label            : 'Commitment Item'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FUND_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Fund Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MATERIAL_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Material Group'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ORIGINAL_BUDGET,
                ![@UI.Importance]: #High,
                Label            : 'Original Budget'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VIREMENT_IN,
                ![@UI.Importance]: #High,
                Label            : 'Virement In'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VIREMENT_OUT,
                ![@UI.Importance]: #High,
                Label            : 'Virement Out'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUPPLEMENT,
                ![@UI.Importance]: #High,
                Label            : 'Supplement'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RETURN,
                ![@UI.Importance]: #High,
                Label            : 'Return'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENT_BUDGET,
                ![@UI.Importance]: #High,
                Label            : 'Current Budget'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMMITMENT,
                ![@UI.Importance]: #High,
                Label            : 'Commitment'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ACTUAL,
                ![@UI.Importance]: #High,
                Label            : 'Actual'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CONSUMED,
                ![@UI.Importance]: #High,
                Label            : 'Consumed'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BUDGET_BALANCE,
                ![@UI.Importance]: #High,
                Label            : 'Budget Balance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROJECT_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Project Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BUDGET_OWNER_ID,
                ![@UI.Importance]: #High,
                Label            : 'Budget Owner'
            },
            {
                $Type            : 'UI.DataField',
                Value            : WBS_CODE,
                ![@UI.Importance]: #High,
                Label            : 'WBS'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY,
                ![@UI.Importance]: #High,
                Label            : 'Currency'
            },
        ]
    }
);

annotate service.ZDISBURSEMENT_STATUS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [DISBURSEMENT_STATUS_ID],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Cash Advance Payment Disbursement Bypass - ZDISBURSEMENT_STATUS',
            TypeNamePlural: 'Cash Advance Payment Disbursement Bypass - ZDISBURSEMENT_STATUS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : DISBURSEMENT_STATUS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Disbursement Status ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DISBURSEMENT_STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Disbursement Status Description'
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

annotate service.ZELIGIBILITY_RULE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [CLAIM_TYPE_ID, CLAIM_TYPE_ITEM_ID, ROLE_ID, POSITION_NO_DESC, ROW_COUNT, START_DATE, END_DATE],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Eligibility Rule - ZELIGIBILITY_RULE',
            TypeNamePlural: 'Eligibility Rule - ZELIGIBILITY_RULE',
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
                Value            : ROLE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Role'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_NO_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Position Number/Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROW_COUNT,
                ![@UI.Importance]: #High,
                Label            : 'Row Count'
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
                Value            : EMPLOYEE_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Employee Type'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : ASSIGNED_APPROVER,
                ![@UI.Importance]: #High,
                Label            : 'Assigned Approver'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : CONFIRMATION_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Confirmation Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PERSONAL_GRADE,
                ![@UI.Importance]: #High,
                Label            : 'Personal Grade'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_PHONE_BILL,
                ![@UI.Importance]: #High,
                Label            : 'Mobile Phone Bill'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : ELIGIBLE_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Eligible Amount'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : FREQUENCY,
                ![@UI.Importance]: #High,
                Label            : 'Eligible Amount'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : PERIOD,
                ![@UI.Importance]: #High,
                Label            : 'Period'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT,
                ![@UI.Importance]: #High,
                Label            : 'Dependent'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PERMITTED_DEPENDENT_COUNT,
                ![@UI.Importance]: #High,
                Label            : 'Permitted for ? Number of dependent'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_YEARS,
                ![@UI.Importance]: #High,
                Label            : 'Allowed to claim up to ? Years'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBSIDIESED_RATE,
                ![@UI.Importance]: #High,
                Label            : 'Subsidiesed Rate'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARITAL_STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Marital Status'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Anggota/spouse/anak'
            },
             {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_OWNERSHIP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Kenderaan Sendiri/Pejabat'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : CLAIMABLE_PERIOD_DAYS,
                ![@UI.Importance]: #High,
                Label            : 'Claimable Period (Days)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REGION_ID,
                ![@UI.Importance]: #High,
                Label            : 'Semenanjung or Sabah/Sarawak/Labuan'
            },
             {
                $Type            : 'UI.DataField',
                Value            : MAXIMUM_DAYS,
                ![@UI.Importance]: #High,
                Label            : 'Maximum Days'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_BASIS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Based on Receipt/Max amount'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_MODE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Mode of Transfer'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : EVENT_REASON,
                ![@UI.Importance]: #High,
                Label            : 'Event Reason'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : NO_OF_NIGHT,
                ![@UI.Importance]: #High,
                Label            : 'Number of Nights'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Type'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : RATE,
                ![@UI.Importance]: #High,
                Label            : 'Rate'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FLIGHT_CLASS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Flight Class'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : HOTEL_LODGING_ID,
                ![@UI.Importance]: #High,
                Label            : 'Hotel/Lodging'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSPORT_CLASS,
                ![@UI.Importance]: #High,
                Label            : 'Train/Boat Class'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : TRANSPORT_PASSING_ID,
                ![@UI.Importance]: #High,
                Label            : 'Transportation of The Passing (Dead)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PACKAGE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Package'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_DAYS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Number of Days Category (Travel Insurance)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY,
                ![@UI.Importance]: #High,
                Label            : 'Currency'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : ROOM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Room Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : IND_OR_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Individual or Group'
            }, 
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_HOURS,
                ![@UI.Importance]: #High,
                Label            : 'Travel Hours'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AGING_NUMBER,
                ![@UI.Importance]: #High,
                Label            : 'Aging Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AGING_PERIOD,
                ![@UI.Importance]: #High,
                Label            : 'Period Number'
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

