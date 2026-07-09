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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        CreateHidden  : {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden  : {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        UpdateHidden  : {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo    : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim Type - ZCLAIM_TYPE',
            TypeNamePlural: 'Claim Type - ZCLAIM_TYPE',
        },
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
                Value: COST_CENTER,
                Label: 'Cost Center'
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
                Value: COST_CENTER,
                Label: 'Cost Center'
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
            TypeName      : 'Claim ID Number Sequence - ZNUM_RANGE',
            TypeNamePlural: 'Claim ID Number Sequence - ZNUM_RANGE',
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
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENT_YEAR,
                ![@UI.Importance]: #High,
                Label            : 'Current Year'
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

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim Type Item - ZCLAIM_TYPE_ITEM',
            TypeNamePlural: 'Claim Type Item - ZCLAIM_TYPE_ITEM',
        },

        LineItem    : [
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
                Value: CATEGORY_ID,
                Label: 'Category ID'
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
            },
            {
                $Type: 'UI.DataField',
                Value: IND_OR_GROUP,
                Label: 'Individual/Group'
            },
            {
                $Type: 'UI.DataField',
                Value: FREQUENCY,
                Label: 'Frequency'
            },
            {
                $Type: 'UI.DataField',
                Value: PERIOD,
                Label: 'Period'
            },
            {
                $Type: 'UI.DataField',
                Value: PERIOD_UNIT,
                Label: 'Period Unit'
            },
            {
                $Type: 'UI.DataField',
                Value: STATUS,
                Label: 'Status'
            },
        ]
    }
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Travel Claim Category - ZCLAIM_CATEGORY',
            TypeNamePlural: 'Travel Claim Category - ZCLAIM_CATEGORY',
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claim/Request Submission Status - ZSTATUS',
            TypeNamePlural: 'Claim/Request Submission Status - ZSTATUS',
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Lodging Category - ZLODGING_CAT',
            TypeNamePlural: 'Lodging Category - ZLODGING_CAT',
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Hotel Room Type - ZROOM_TYPE',
            TypeNamePlural: 'Hotel Room Type - ZROOM_TYPE',
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Flight Class - ZFLIGHT_CLASS',
            TypeNamePlural: 'Flight Class - ZFLIGHT_CLASS',
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Country - ZCOUNTRY',
            TypeNamePlural: 'Country - ZCOUNTRY',
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
            },
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_CATEGORY,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Category'
            }
        ]
    }
);

annotate service.ZAREA with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
    Capabilities.SearchRestrictions: {Searchable: false},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
    Capabilities.SearchRestrictions: {Searchable: false},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
    Capabilities.SearchRestrictions: {Searchable: false},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        Deletable : false,
        Updatable : true,
        Insertable: false
    },
    odata.draft.enabled,

    UI                             : {
        //removed the conditional checking for crud operation visibility as the table is accessible for view/edit to JKEW and DTD
        //table visibility is controlled in the app side navigation menu - hidden for GA admin
        CreateHidden: false,
        DeleteHidden: false,
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
                Label            : 'Disbursement Status',
            }
        ]
    }
);

annotate service.ZEMP_CA_PAYMENT with {

    DISBURSEMENT_STATUS @(
        Common.ValueList               : {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'ZDISBURSEMENT_STATUS',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'DISBURSEMENT_STATUS_DESC'
            }]
        },
        Common.ValueListWithFixedValues: true
    );

};

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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
    Capabilities.SearchRestrictions: {Searchable: false},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
                Value            : AGE_CONDITION,
                ![@UI.Importance]: #High,
                Label            : 'Age Condition'
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
        Deletable : false,
        Updatable : false,
        Insertable: false
    },
    odata.draft.enabled,
    UI                             : {
        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Budget Data - ZBUDGET',
            TypeNamePlural: 'Budget Data - ZBUDGET',
        },
        LineItem  : [
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
    Common.SemanticKey             : [
        CLAIM_TYPE_ID,
        CLAIM_TYPE_ITEM_ID,
        ROLE_ID,
        POSITION_NO_DESC,
        ROW_COUNT,
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
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
                Value            : SUBSIDISED_RATE,
                ![@UI.Importance]: #High,
                Label            : 'Subsidised Rate'
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
                Label            : 'Individual/Group'
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
            },
            {
                $Type            : 'UI.DataField',
                Value            : JOB_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Job Group'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost_Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_CATEGORY,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Category'
            }
        ]
    }
);

annotate service.ZCONSTANTS with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [
        ID,
        VALUE
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Constants Value Table Maintenance - ZCONSTANTS',
            TypeNamePlural: 'Constants Value Table Maintenance - ZCONSTANTS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : ID,
                ![@UI.Importance]: #High,
                Label            : 'Constants ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VALUE,
                ![@UI.Importance]: #High,
                Label            : 'Constants Value'
            }
        ]
    }
);

annotate service.ZROLEHIERARCHY with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [ROLE],
    Capabilities                   : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    odata.draft.enabled,

    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Employee Role Hierarchy Table - ZROLEHIERARCHY',
            TypeNamePlural: 'Employee Role Hierarchy Table - ZROLEHIERARCHY',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : ROLE,
                ![@UI.Importance]: #High,
                Label            : 'Employee Role'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RANK,
                ![@UI.Importance]: #High,
                Label            : 'Employee Rank'
            }
        ]
    }
);

annotate service.ZWORKFLOW_STEP with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [
        WORKFLOW_CODE,
        WORKFLOW_TYPE,
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Workflow Step - ZWORKFLOW_STEP',
            TypeNamePlural: 'Workflow Step - ZWORKFLOW_STEP',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : WORKFLOW_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Workflow Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : WORKFLOW_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Workflow Type'
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

annotate service.ZWORKFLOW_RULE with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [
        WORKFLOW_ID,
        WORKFLOW_TYPE,
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Workflow Rule - ZWORKFLOW_RULE',
            TypeNamePlural: 'Workflow Rule - ZWORKFLOW_RULE',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : WORKFLOW_ID,
                ![@UI.Importance]: #High,
                Label            : 'Workflow ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : WORKFLOW_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Workflow Type'
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
                Value            : RISK_LEVEL,
                ![@UI.Importance]: #High,
                Label            : 'Risk Level'
            },
            {
                $Type            : 'UI.DataField',
                Value            : THRESHOLD_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Threshold Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : THRESHOLD_VALUE,
                ![@UI.Importance]: #High,
                Label            : 'Threshold Value'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RECEIPT_DAY,
                ![@UI.Importance]: #High,
                Label            : 'Receipt Day'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RECEIPT_AGE,
                ![@UI.Importance]: #High,
                Label            : 'Receipt Age'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMPLOYEE_COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Employee Cost Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OUTCOME_WORKFLOW_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Outcome Workflow Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REMARK,
                ![@UI.Importance]: #High,
                Label            : 'Remark'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Request Type ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROLE,
                ![@UI.Importance]: #High,
                Label            : 'Role'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_ID,
                ![@UI.Importance]: #High,
                Label            : 'Department ID'
            }
        ]
    }
);

annotate service.ZTRAIN_COURSE_PART with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [
        COURSE_ID,
        COURSE_DESC,
        SESSION_NUMBER,
        COURSE_SESSION_STAT,
        ATTENDENCE_STATUS,
        PARTICIPANT_ID,
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
        UpdateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ELC-Participant Course Code - ZTRAIN_COURSE_PART',
            TypeNamePlural: 'ELC-Participant Course Code - ZTRAIN_COURSE_PART',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Course ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Course Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SESSION_NUMBER,
                ![@UI.Importance]: #High,
                Label            : 'Session Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_SESSION_STAT,
                ![@UI.Importance]: #High,
                Label            : 'Course Session Stat'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ATTENDENCE_STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Attendence Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PARTICIPANT_ID,
                ![@UI.Importance]: #High,
                Label            : 'Participant ID'
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
        ]
    }
);

annotate service.ZEMP_CLAIM_REPORT_SUMMARY with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false,
    },
    UI          : {
        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claims Report Summary',
            TypeNamePlural: 'Claims Report Summary',
        },
        LineItem  : [
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
                Label            : 'Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEP,
                ![@UI.Importance]: #High,
                Label            : 'Department'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Department Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UNIT_SECTION,
                ![@UI.Importance]: #High,
                Label            : 'Branch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Branch Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Position'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMITTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Submitted Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_APPROVED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Final Approved Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_PUSH_BACK_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Last Sent Back Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PAYMENT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Payment Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALTERNATE_COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALT_COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GL_ACCOUNT,
                ![@UI.Importance]: #High,
                Label            : 'GL No (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TOTAL_CLAIM_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Total Claim Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FINAL_AMOUNT_TO_RECEIVE,
                ![@UI.Importance]: #High,
                Label            : 'Final Amount to Receive'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Course Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Course Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SESSION_NUMBER,
                ![@UI.Importance]: #High,
                Label            : 'Course Session Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PURPOSE,
                ![@UI.Importance]: #High,
                Label            : 'Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMMENT,
                ![@UI.Importance]: #High,
                Label            : 'Remark'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DAYS_APPROVED,
                ![@UI.Importance]: #High,
                Label            : 'Approval Duration (Days)'
            }
        ],
    }
) {
    ALT_COST_CENTER_DESC @(Common.Label: 'Alternate Cost Center Description');
    COST_CENTER_DESC     @(Common.Label: 'Cost Center Description');
    CASH_ADVANCE_DATE    @(Common.Label: 'Cash Advance Date');
    APPROVER1_NAME       @(Common.Label: 'Approver 1 Name');
    APPROVER2_NAME       @(Common.Label: 'Approver 2 Name');
    APPROVER3_NAME       @(Common.Label: 'Approver 3 Name');
    APPROVER4_NAME       @(Common.Label: 'Approver 4 Name');
    APPROVER5_NAME       @(Common.Label: 'Approver 5 Name');
    DAYS_APPROVED        @(Common.Label: 'Approval Duration (Days)');
    APPROVER1            @(Common.Label: 'Approver 1 ID');
    APPROVER2            @(Common.Label: 'Approver 2 ID');
    APPROVER3            @(Common.Label: 'Approver 3 ID');
    APPROVER4            @(Common.Label: 'Approver 4 ID');
    APPROVER5            @(Common.Label: 'Approver 5 ID');
    UNIT_SECTION         @(Common.Label: 'Branch');
    BRANCH_DESC          @(Common.Label: 'Branch Description');
    COURSE_ID            @(
        Common.Label                   : 'Course Code',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : COURSE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZEMP_COURSE_VALUE_HELP',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COURSE_ID,
                    ValueListProperty: 'COURSE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: COURSE_DESC,
                    ValueListProperty: 'COURSE_DESC'
                }
            ]
        }
    );
    SUBMISSION_TYPE      @(
        Common.Label                   : 'Submission Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : SUBMISSION_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Submission Type Selection',
            CollectionPath: 'ZSUBMISSION_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: SUBMISSION_TYPE_ID,
                    ValueListProperty: 'SUBMISSION_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: SUBMISSION_TYPE_DESC,
                    ValueListProperty: 'SUBMISSION_TYPE_DESC'
                }
            ]
        }
    );
    STATUS_ID            @(
        Common.Label                   : 'Status',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Status Selection',
            CollectionPath: 'ZSTATUS',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: STATUS_DESC,
                ValueListProperty: 'STATUS_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    COST_CENTER          @(
        Common.Label                   : 'Cost Center',
        //UI.Hidden                      : true,
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : COST_CENTER_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Cost Center Selection',
            CollectionPath: 'ZCOST_CENTER_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COST_CENTER,
                    ValueListProperty: 'COST_CENTER_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: COST_CENTER_DESC,
                    ValueListProperty: 'COST_CENTER_DESC'
                }
            ]
        }
    );
    DEP                  @(
        Common.Label                   : 'Department',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : DEPARTMENT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Department Selection',
            CollectionPath: 'ZDEPARTMENT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: DEP,
                    ValueListProperty: 'DEPARTMENT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: DEPARTMENT_DESC,
                    ValueListProperty: 'DEPARTMENT_DESC'
                }
            ]
        }
    );
    GL_ACCOUNT           @(
        Common.Label                   : 'GL Account',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : GL_ACCOUNT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'GL Account Selection',
            CollectionPath: 'ZGL_ACCOUNT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: GL_ACCOUNT,
                    ValueListProperty: 'GL_ACCOUNT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: GL_ACCOUNT_DESC,
                    ValueListProperty: 'GL_ACCOUNT_DESC'
                }
            ]
        }
    );
    CLAIM_TYPE_ID        @(
        Common.Label                   : 'Claim Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ID,
                    ValueListProperty: 'CLAIM_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_DESC,
                    ValueListProperty: 'CLAIM_TYPE_DESC'
                }
            ]
        }
    );
    NAME                 @(
        Common.Label                   : 'Employee Name',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Employee Selection',
            CollectionPath: 'ZEMP_MASTER',
            // Your lookup table
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: EEID,
                    ValueListProperty: 'EEID' // The field name in ZSTATUS table
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: NAME,
                    ValueListProperty: 'NAME'
                }
            ]
        }
    );
};

annotate service.ZEMP_CLAIM_REPORT_DETAILS with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false,
    },
    UI          : {

        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Claims Report Details',
            TypeNamePlural: 'Claims Report Details',
        },
        LineItem  : [
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
                Label            : 'Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEP,
                ![@UI.Importance]: #High,
                Label            : 'Department'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Department Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UNIT_SECTION,
                ![@UI.Importance]: #High,
                Label            : 'Branch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Branch Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Position'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_SUB_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Sub ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMISSION_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Submission Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMITTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Submitted Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_APPROVED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Final Approved Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_PUSH_BACK_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Last Sent Back Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PAYMENT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Payment Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALTERNATE_COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALT_COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GL_ACCOUNT,
                ![@UI.Importance]: #High,
                Label            : 'GL No (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MATERIAL_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Code Material (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TOTAL_CLAIM_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Total Claim Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FINAL_AMOUNT_TO_RECEIVE,
                ![@UI.Importance]: #High,
                Label            : 'Final Amount to Receive'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Course Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Course Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SESSION_NUMBER,
                ![@UI.Importance]: #High,
                Label            : 'Course Session Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PURPOSE,
                ![@UI.Importance]: #High,
                Label            : 'Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMMENT,
                ![@UI.Importance]: #High,
                Label            : 'Remark'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE_HEADER,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_DATE_HEADER,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Location Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PERCENTAGE_COMPENSATION,
                ![@UI.Importance]: #High,
                Label            : '% Compensation'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ACCOUNT_NO,
                ![@UI.Importance]: #High,
                Label            : 'Account No'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BILL_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Bill Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BILL_NO,
                ![@UI.Importance]: #High,
                Label            : 'Bill No'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_CATEGORY,
                ![@UI.Importance]: #High,
                Label            : 'Category/Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Item'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COUNTRY,
                ![@UI.Importance]: #High,
                Label            : 'Country'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DISCLAIMER,
                ![@UI.Importance]: #High,
                Label            : 'Category/Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_TIME,
                ![@UI.Importance]: #High,
                Label            : 'End Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FLIGHT_CLASS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Flight Class'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'From Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_LOCATION_OFFICE,
                ![@UI.Importance]: #High,
                Label            : 'From Location (Office)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : KM,
                ![@UI.Importance]: #High,
                Label            : 'Kilometer'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION_ITEM,
                ![@UI.Importance]: #High,
                Label            : 'Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOC_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Location type '
            },
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_ADDRESS,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Address'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Category'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AREA_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Negara/wilayah'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NO_OF_FAMILY_MEMBER,
                ![@UI.Importance]: #High,
                Label            : 'Num of Family Members'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PARKING,
                ![@UI.Importance]: #High,
                Label            : 'Parking '
            },
            {
                $Type            : 'UI.DataField',
                Value            : PHONE_NO,
                ![@UI.Importance]: #High,
                Label            : 'Phone No'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RATE_PER_KM,
                ![@UI.Importance]: #High,
                Label            : 'Rate Per Kilometer'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RECEIPT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Receipt Date '
            },
            {
                $Type            : 'UI.DataField',
                Value            : RECEIPT_NUMBER,
                ![@UI.Importance]: #High,
                Label            : 'Receipt Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REMARK,
                ![@UI.Importance]: #High,
                Label            : 'Remark'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROOM_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Room Type '
            },
            {
                $Type            : 'UI.DataField',
                Value            : REGION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Semenanjung or Sabah Sarawak'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_TIME,
                ![@UI.Importance]: #High,
                Label            : 'Start Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_STATE_ID,
                ![@UI.Importance]: #High,
                Label            : 'State'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'To Location(Office)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_LOCATION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'To Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_LOCATION_OFFICE,
                ![@UI.Importance]: #High,
                Label            : 'To Location (Office)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TOLL,
                ![@UI.Importance]: #High,
                Label            : 'Toll'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TOTAL_EXP_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Total Expenses Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Vehicle'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_FARE,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle (Tambang)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_TIME,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_TIME,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_DURATION_DAY,
                ![@UI.Importance]: #High,
                Label            : 'Travel Duration (days)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_DURATION_HOUR,
                ![@UI.Importance]: #High,
                Label            : 'Travel Duration (hours)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROVIDED_BREAKFAST,
                ![@UI.Importance]: #High,
                Label            : 'Provided Breakfast'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROVIDED_LUNCH,
                ![@UI.Importance]: #High,
                Label            : 'Provided Lunch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROVIDED_DINNER,
                ![@UI.Importance]: #High,
                Label            : 'Provided Dinner'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ENTITLED_BREAKFAST,
                ![@UI.Importance]: #High,
                Label            : 'Entitled Breakfast'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ENTITLED_LUNCH,
                ![@UI.Importance]: #High,
                Label            : 'Entitled Lunch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ENTITLED_DINNER,
                ![@UI.Importance]: #High,
                Label            : 'Entitled Dinner'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ANGGOTA_ID,
                ![@UI.Importance]: #High,
                Label            : 'Anggota ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ANGGOTA_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Anggota Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROUND_TRIP,
                ![@UI.Importance]: #High,
                Label            : 'Round Trip'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PROFESIONAL_BODY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Profesional Body'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DISCLAIMER_GALAKAN,
                ![@UI.Importance]: #High,
                Label            : 'Disclaimer Galakan'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Transfer Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NO_OF_DAYS,
                ![@UI.Importance]: #High,
                Label            : 'Number of Days'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FAMILY_COUNT,
                ![@UI.Importance]: #High,
                Label            : 'Number of family member (per head)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSPORT_PASSING_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Transportation for the Passing'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_TITLE,
                ![@UI.Importance]: #High,
                Label            : 'Course Title'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ACTUAL_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Actual Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NEED_FOREIGN_CURRENCY,
                ![@UI.Importance]: #High,
                Label            : 'Need Foreign Currency?'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Course Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Currency'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY_RATE,
                ![@UI.Importance]: #High,
                Label            : 'Currency Rate'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENCY_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Currency Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_APPROVAL_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Request Approval Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTURE_TIME,
                ![@UI.Importance]: #High,
                Label            : 'Departure Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ARRIVAL_TIME,
                ![@UI.Importance]: #High,
                Label            : 'Arrival Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_NO,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_RELATIONSHIP,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Relationship'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POLICY_NUMBER,
                ![@UI.Importance]: #High,
                Label            : 'Policy Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PROVIDER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Provider'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PROVIDER_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Provider Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_PURCHASE_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Purchase Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_CERT_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Cert Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : INSURANCE_CERT_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Cert End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRAVEL_DAYS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Travel Days'
            },
            {
                $Type            : 'UI.DataField',
                Value            : METER_CUBE_ENTITLED,
                ![@UI.Importance]: #High,
                Label            : 'Meter Cube Entitled'
            },
            {
                $Type            : 'UI.DataField',
                Value            : METER_CUBE_ACTUAL,
                ![@UI.Importance]: #High,
                Label            : 'Meter Cube Actual'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZINSURANCE_PACKAGE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Insurance Package'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FARE_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Fare'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_CLASS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Train/Ship Class'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_CATEGORY_PURPOSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Mobile Category/Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STUDY_LEVELS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Education Level'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_MODE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Mode of Transfer'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_OWNERSHIP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Self/Company Vehicle'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DAYS_APPROVED,
                ![@UI.Importance]: #High,
                Label            : 'Approval Duration (Days)'
            }
        ],

    }
) {
    ALT_COST_CENTER_DESC @(Common.Label: 'Alternate Cost Center Description');
    COST_CENTER_DESC     @(Common.Label: 'Cost Center Description');
    CASH_ADVANCE_DATE    @(Common.Label: 'Cash Advance Date');
    APPROVER1_NAME       @(Common.Label: 'Approver 1 Name');
    APPROVER2_NAME       @(Common.Label: 'Approver 2 Name');
    APPROVER3_NAME       @(Common.Label: 'Approver 3 Name');
    APPROVER4_NAME       @(Common.Label: 'Approver 4 Name');
    APPROVER5_NAME       @(Common.Label: 'Approver 5 Name');
    DAYS_APPROVED        @(Common.Label: 'Approval Duration (Days)');
    APPROVER1            @(Common.Label: 'Approver 1 ID');
    APPROVER2            @(Common.Label: 'Approver 2 ID');
    APPROVER3            @(Common.Label: 'Approver 3 ID');
    APPROVER4            @(Common.Label: 'Approver 4 ID');
    APPROVER5            @(Common.Label: 'Approver 5 ID');
    UNIT_SECTION         @(Common.Label: 'Branch');
    BRANCH_DESC          @(Common.Label: 'Branch Description');

    CLAIM_TYPE_ITEM_ID   @(
        Common.Label                   : 'Claim Type Item',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_ITEM_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE_ITEM',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ITEM_ID,
                    ValueListProperty: 'CLAIM_TYPE_ITEM_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_ITEM_DESC,
                    ValueListProperty: 'CLAIM_TYPE_ITEM_DESC'
                }
            ]
        }
    );
    LOCATION_TYPE        @(
        Common.Label                   : 'Location Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : LOC_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZLOC_TYPE',
            Parameters    : [{
                // This pulls the description into the dropdown list
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: LOC_TYPE_DESC,
                ValueListProperty: 'LOC_TYPE_DESC'
            }]
        }
    );
    STATUS_ID            @(
        Common.Label                   : 'Status',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Status Selection',
            CollectionPath: 'ZSTATUS',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: STATUS_DESC,
                ValueListProperty: 'STATUS_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    COST_CENTER          @(
        Common.Label                   : 'Cost Center',
        //UI.Hidden                      : true,
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : COST_CENTER_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Cost Center Selection',
            CollectionPath: 'ZCOST_CENTER_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COST_CENTER,
                    ValueListProperty: 'COST_CENTER_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: COST_CENTER_DESC,
                    ValueListProperty: 'COST_CENTER_DESC'
                }
            ]
        }
    );
    DEP                  @(
        Common.Label                   : 'Department',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : DEPARTMENT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Department Selection',
            CollectionPath: 'ZDEPARTMENT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: DEP,
                    ValueListProperty: 'DEPARTMENT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: DEPARTMENT_DESC,
                    ValueListProperty: 'DEPARTMENT_DESC'
                }
            ]
        }
    );
    GL_ACCOUNT           @(
        Common.Label                   : 'GL Account',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : GL_ACCOUNT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'GL Account Selection',
            CollectionPath: 'ZGL_ACCOUNT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: GL_ACCOUNT,
                    ValueListProperty: 'GL_ACCOUNT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: GL_ACCOUNT_DESC,
                    ValueListProperty: 'GL_ACCOUNT_DESC'
                }
            ]
        }
    );
    CLAIM_TYPE_ID        @(
        Common.Label                   : 'Claim Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ID,
                    ValueListProperty: 'CLAIM_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_DESC,
                    ValueListProperty: 'CLAIM_TYPE_DESC'
                }
            ]
        }
    );
    NAME                 @(
        Common.Label                   : 'Employee Name',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Employee Selection',
            CollectionPath: 'ZEMP_MASTER',
            // Your lookup table
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: EEID,
                    ValueListProperty: 'EEID' // The field name in ZSTATUS table
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: NAME,
                    ValueListProperty: 'NAME'
                }
            ]
        }
    );
};

annotate service.ZEMP_REQUEST_REPORT_DETAILS with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false,
    },
    UI          : {

        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Pre-Approved Request Details',
            TypeNamePlural: 'Pre-Approved Request Details',
        },
        LineItem  : [
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
                Label            : 'Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEP,
                ![@UI.Importance]: #High,
                Label            : 'Department'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Department Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UNIT_SECTION,
                ![@UI.Importance]: #High,
                Label            : 'Branch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Branch Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Position'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_SUB_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request Sub ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Request Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMITTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Submitted Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_APPROVED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Final Approved Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_PUSH_BACK_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Last Sent Back Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance Received Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PAYMENT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Payment Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALTERNATE_COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALT_COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GL_ACCOUNT,
                ![@UI.Importance]: #High,
                Label            : 'GL No (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MATERIAL_CODE,
                ![@UI.Importance]: #High,
                Label            : 'Code Material (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PREAPPROVAL_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Total Request Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OBJECTIVE_PURPOSE,
                ![@UI.Importance]: #High,
                Label            : 'Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REMARK,
                ![@UI.Importance]: #High,
                Label            : 'Remarks/Justification'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EVENT_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Event Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EVENT_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Event End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION_TYPE,
                ![@UI.Importance]: #High,
                Label            : 'Location Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TYPE_OF_TRANSPORTATION,
                ![@UI.Importance]: #High,
                Label            : 'Type of Transportation'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Item'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EST_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Estimated Amount (MYR)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EST_NO_PARTICIPANT,
                ![@UI.Importance]: #High,
                Label            : 'Estimated No. of Participants'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
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
                Value            : REMARK,
                ![@UI.Importance]: #High,
                Label            : 'Remark/Justification'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DECLARE_CLUB_MEMBERSHIP,
                ![@UI.Importance]: #High,
                Label            : 'Berdasarkan terma keahlian kelab, sila nyatakan sama ada keahlian ini boleh dipindah milik atau tidak?'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SPORTS_REPRESENTATION_DESC,
                ![@UI.Importance]: #High,
                Label            : ' Mewakili KWSP dalam aktiviti sukan anjuran pengurusan KWSP atau Pihak Luar'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SPORTS_CLAIM_DISCLAIMER,
                ![@UI.Importance]: #High,
                Label            : 'Disclaimer: Sebarang penyertaan dalam sukan anjuran jabatan dan cawangan masing-masing adalah tidak layak membuat tuntutan'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_OWNERSHIP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle (Sendiri/Pejabat)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_MODE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Mode of Transfer'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRANSFER_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Transfer Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : NO_OF_DAYS,
                ![@UI.Importance]: #High,
                Label            : 'Number of Days'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MARRIAGE_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Marriage Category'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FAMILY_COUNT,
                ![@UI.Importance]: #High,
                Label            : 'Number of family member (per head)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EST_NO_PARTICIPANT,
                ![@UI.Importance]: #High,
                Label            : 'Total Participant'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COURSE_TITLE,
                ![@UI.Importance]: #High,
                Label            : 'Course Title'
            },
            {
                $Type            : 'UI.DataField',
                Value            : KILOMETER,
                ![@UI.Importance]: #High,
                Label            : 'Kilometer'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RATE_PER_KM,
                ![@UI.Importance]: #High,
                Label            : 'Rate Per Kilometer'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FLIGHT_CLASS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Flight Class'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOC_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Location Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COUNTRY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Country '
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_STATE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'From State'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_STATE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'To State'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_LOCATION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'From Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FROM_LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'From Location (Office)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_LOCATION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'To Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TO_LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'To Location(Office)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MOBILE_CATEGORY_PURPOSE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Mobile Category/Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TOLL,
                ![@UI.Importance]: #High,
                Label            : 'Toll'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Vehicle'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REGION_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Semenanjung or Sabah Sarawak'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ROOM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Room Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LODGING_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Lodging Category'
            },
            {
                $Type            : 'UI.DataField',
                Value            : AREA_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Area'
            },
            {
                $Type            : 'UI.DataField',
                Value            : START_TIME,
                ![@UI.Importance]: #High,
                Label            : 'Start Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : END_TIME,
                ![@UI.Importance]: #High,
                Label            : 'End Time'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT,
                ![@UI.Importance]: #High,
                Label            : 'Dependent'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_NO,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Number'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPENDENT_RELATIONSHIP,
                ![@UI.Importance]: #High,
                Label            : 'Dependent Relationship'
            },
            {
                $Type            : 'UI.DataField',
                Value            : RELATIONSHIP,
                ![@UI.Importance]: #High,
                Label            : 'Relationship'
            },
            {
                $Type            : 'UI.DataField',
                Value            : METER_CUBE_ENTITLED,
                ![@UI.Importance]: #High,
                Label            : 'Meter Cube Entitled'
            },
            {
                $Type            : 'UI.DataField',
                Value            : METER_CUBE_ACTUAL,
                ![@UI.Importance]: #High,
                Label            : 'Meter Cube Actual'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FARE_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Type of Fare'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VEHICLE_CLASS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Train/Ship Class'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PURPOSE,
                ![@UI.Importance]: #High,
                Label            : 'Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DAYS_APPROVED,
                ![@UI.Importance]: #High,
                Label            : 'Approval Duration (Days)'
            }
        ],
    }
) {
    ALT_COST_CENTER_DESC @(Common.Label: 'Alternate Cost Center Description');
    COST_CENTER_DESC     @(Common.Label: 'Cost Center Description');
    CASH_ADVANCE_DATE    @(Common.Label: 'Cash Advance Date');
    PAYMENT_DATE         @(Common.Label: 'Payment Date');
    CASH_ADVANCE         @(Common.Label: 'Cash Advance');
    APPROVER1_NAME       @(Common.Label: 'Approver 1 Name');
    APPROVER2_NAME       @(Common.Label: 'Approver 2 Name');
    APPROVER3_NAME       @(Common.Label: 'Approver 3 Name');
    APPROVER4_NAME       @(Common.Label: 'Approver 4 Name');
    APPROVER5_NAME       @(Common.Label: 'Approver 5 Name');
    DAYS_APPROVED        @(Common.Label: 'Approval Duration (Days)');
    APPROVER1            @(Common.Label: 'Approver 1 ID');
    APPROVER2            @(Common.Label: 'Approver 2 ID');
    APPROVER3            @(Common.Label: 'Approver 3 ID');
    APPROVER4            @(Common.Label: 'Approver 4 ID');
    APPROVER5            @(Common.Label: 'Approver 5 ID');
    UNIT_SECTION         @(Common.Label: 'Branch');
    BRANCH_DESC          @(Common.Label: 'Branch Description');

    CLAIM_TYPE_ITEM_ID   @(
        Common.Label                   : 'Claim Type Item',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_ITEM_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE_ITEM',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ITEM_ID,
                    ValueListProperty: 'CLAIM_TYPE_ITEM_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_ITEM_DESC,
                    ValueListProperty: 'CLAIM_TYPE_ITEM_DESC'
                }
            ]
        }
    );
    LOCATION_TYPE        @(
        Common.Label                   : 'Location Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : LOC_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZLOC_TYPE',
            Parameters    : [{
                // This pulls the description into the dropdown list
                $Type            : 'Common.ValueListParameterOut',
                LocalDataProperty: LOC_TYPE_DESC,
                ValueListProperty: 'LOC_TYPE_DESC'
            }]
        }
    );
    STATUS               @(
        Common.Label                   : 'Status',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Status Selection',
            CollectionPath: 'ZSTATUS',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: STATUS_DESC,
                ValueListProperty: 'STATUS_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    COST_CENTER          @(
        Common.Label                   : 'Cost Center',
        //UI.Hidden                      : true,
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : COST_CENTER_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Cost Center Selection',
            CollectionPath: 'ZCOST_CENTER_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COST_CENTER,
                    ValueListProperty: 'COST_CENTER_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: COST_CENTER_DESC,
                    ValueListProperty: 'COST_CENTER_DESC'
                }
            ]
        }
    );
    DEP                  @(
        Common.Label                   : 'Department',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : DEPARTMENT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Department Selection',
            CollectionPath: 'ZDEPARTMENT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: DEP,
                    ValueListProperty: 'DEPARTMENT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: DEPARTMENT_DESC,
                    ValueListProperty: 'DEPARTMENT_DESC'
                }
            ]
        }
    );
    GL_ACCOUNT           @(
        Common.Label                   : 'GL Account',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : GL_ACCOUNT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'GL Account Selection',
            CollectionPath: 'ZGL_ACCOUNT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: GL_ACCOUNT,
                    ValueListProperty: 'GL_ACCOUNT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: GL_ACCOUNT_DESC,
                    ValueListProperty: 'GL_ACCOUNT_DESC'
                }
            ]
        }
    );
    CLAIM_TYPE_ID        @(
        Common.Label                   : 'Claim Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ID,
                    ValueListProperty: 'CLAIM_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_DESC,
                    ValueListProperty: 'CLAIM_TYPE_DESC'
                }
            ]
        }
    );
    REQUEST_TYPE_ID      @(
        Common.Label                   : 'Request Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : REQUEST_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZREQUEST_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: REQUEST_TYPE_ID,
                    ValueListProperty: 'REQUEST_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: REQUEST_TYPE_DESC,
                    ValueListProperty: 'REQUEST_TYPE_DESC'
                }
            ]
        }
    );
    NAME                 @(
        Common.Label                   : 'Employee Name',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Employee Selection',
            CollectionPath: 'ZEMP_MASTER',
            // Your lookup table
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: EEID,
                    ValueListProperty: 'EEID' // The field name in ZSTATUS table
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: NAME,
                    ValueListProperty: 'NAME'
                }
            ]
        }
    );
};

annotate service.ZEMP_REQUEST_REPORT_SUMMARY with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false,
    },
    UI          : {
        HeaderInfo     : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Pre-Approved Request Summary',
            TypeNamePlural: 'Pre-Approved Request Summary',
        },
        SelectionFields: [
            STATUS_DESC,
            DEP
        ],
        LineItem       : [
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
                Label            : 'Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEP,
                ![@UI.Importance]: #High,
                Label            : 'Department'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Department Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UNIT_SECTION,
                ![@UI.Importance]: #High,
                Label            : 'Branch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Branch Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : POSITION_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Position'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
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
                Label            : 'Request Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMITTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Submitted Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER1_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 1 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER2_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 2 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER3_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 3 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER4_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 4 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : APPROVER5_NAME,
                ![@UI.Importance]: #High,
                Label            : 'Approver 5 Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_APPROVED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Final Approved Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_PUSH_BACK_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Last Push Back Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance Received Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PAYMENT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Payment Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS,
                ![@UI.Importance]: #High,
                Label            : 'Claim Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Status Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALTERNATE_COST_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ALT_COST_CENTER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Alternate Cost Center Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GL_ACCOUNT,
                ![@UI.Importance]: #High,
                Label            : 'GL No (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GL_ACCOUNT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'GL Description (Claim Item)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PREAPPROVAL_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Total Request Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OBJECTIVE_PURPOSE,
                ![@UI.Importance]: #High,
                Label            : 'Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REMARK,
                ![@UI.Importance]: #High,
                Label            : 'Remarks/Justification'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EVENT_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Event Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EVENT_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Event End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LOCATION,
                ![@UI.Importance]: #High,
                Label            : 'Location'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TYPE_OF_TRANSPORTATION,
                ![@UI.Importance]: #High,
                Label            : 'Type of Transportation'
            },
            {
                $Type            : 'UI.DataField',
                Value            : IND_OR_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Individual or Group'
            },
            {
                $Type            : 'UI.DataField',
                Value            : IND_OR_GROUP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Individual or Group Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DAYS_APPROVED,
                ![@UI.Importance]: #High,
                Label            : 'Approval Duration (Days)'
            }
        ],
    }

) {
    ALT_COST_CENTER_DESC @(Common.Label: 'Alternate Cost Center Description');
    COST_CENTER_DESC     @(Common.Label: 'Cost Center Description');
    PAYMENT_DATE         @(Common.Label: 'Payment Date');
    CASH_ADVANCE_DATE    @(Common.Label: 'Cash Advance Date');
    CASH_ADVANCE         @(Common.Label: 'Cash Advance');
    APPROVER1_NAME       @(Common.Label: 'Approver 1 Name');
    APPROVER2_NAME       @(Common.Label: 'Approver 2 Name');
    APPROVER3_NAME       @(Common.Label: 'Approver 3 Name');
    APPROVER4_NAME       @(Common.Label: 'Approver 4 Name');
    APPROVER5_NAME       @(Common.Label: 'Approver 5 Name');
    APPROVER1            @(Common.Label: 'Approver 1 ID');
    APPROVER2            @(Common.Label: 'Approver 2 ID');
    APPROVER3            @(Common.Label: 'Approver 3 ID');
    APPROVER4            @(Common.Label: 'Approver 4 ID');
    APPROVER5            @(Common.Label: 'Approver 5 ID');
    DAYS_APPROVED        @(Common.Label: 'Approval Duration (Days)');
    UNIT_SECTION         @(Common.Label: 'Branch');
    BRANCH_DESC          @(Common.Label: 'Branch Description');

    STATUS               @(
        Common.Label                   : 'Status',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Status Selection',
            CollectionPath: 'ZSTATUS',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: STATUS_DESC,
                ValueListProperty: 'STATUS_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    COST_CENTER          @(
        Common.Label                   : 'Cost Center',
        //UI.Hidden                      : true,
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : COST_CENTER_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Cost Center Selection',
            CollectionPath: 'ZCOST_CENTER_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COST_CENTER,
                    ValueListProperty: 'COST_CENTER_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: COST_CENTER_DESC,
                    ValueListProperty: 'COST_CENTER_DESC'
                }
            ]
        }
    );
    DEP                  @(
        Common.Label                   : 'Department',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : DEPARTMENT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Department Selection',
            CollectionPath: 'ZDEPARTMENT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: DEP,
                    ValueListProperty: 'DEPARTMENT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: DEPARTMENT_DESC,
                    ValueListProperty: 'DEPARTMENT_DESC'
                }
            ]
        }
    );
    GL_ACCOUNT           @(
        Common.Label                   : 'GL Account',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : GL_ACCOUNT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'GL Account Selection',
            CollectionPath: 'ZGL_ACCOUNT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: GL_ACCOUNT,
                    ValueListProperty: 'GL_ACCOUNT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: GL_ACCOUNT_DESC,
                    ValueListProperty: 'GL_ACCOUNT_DESC'
                }
            ]
        }
    );
    CLAIM_TYPE_ID        @(
        Common.Label                   : 'Claim Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ID,
                    ValueListProperty: 'CLAIM_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_DESC,
                    ValueListProperty: 'CLAIM_TYPE_DESC'
                }
            ]
        }
    );
    REQUEST_TYPE_ID      @(
        Common.Label                   : 'Request Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : REQUEST_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZREQUEST_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: REQUEST_TYPE_ID,
                    ValueListProperty: 'REQUEST_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: REQUEST_TYPE_DESC,
                    ValueListProperty: 'REQUEST_TYPE_DESC'
                }
            ]
        }
    );
    IND_OR_GROUP         @(
        Common.Label                   : 'Individual or Group',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Individual or Group Selection',
            CollectionPath: 'ZINDIV_GROUP',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: IND_OR_GROUP_DESC,
                ValueListProperty: 'IND_OR_GROUP_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    NAME                 @(
        Common.Label                   : 'Employee Name',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Employee Selection',
            CollectionPath: 'ZEMP_MASTER',
            // Your lookup table
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: EEID,
                    ValueListProperty: 'EEID' // The field name in ZSTATUS table
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: NAME,
                    ValueListProperty: 'NAME'
                }
            ]
        }
    );
};

annotate service.ZEMP_CASHADVANCE_REPORT with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false,
    },
    UI          : {

        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Cash Advance Report',
            TypeNamePlural: 'Cash Advance Report',
        },
        LineItem  : [
            {
                $Type            : 'UI.DataField',
                Value            : NAME,
                ![@UI.Importance]: #High,
                Label            : 'Employee Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : GRADE,
                ![@UI.Importance]: #High,
                Label            : 'Personal Grade'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEP,
                ![@UI.Importance]: #High,
                Label            : 'Department ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : DEPARTMENT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Department Name'
            },
            {
                $Type            : 'UI.DataField',
                Value            : UNIT_SECTION,
                ![@UI.Importance]: #High,
                Label            : 'Branch'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Branch Description'
            },
            {
                $Type            : 'UI.DataField',
                Value            : LAST_APPROVED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Final Approved Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OBJECTIVE_PURPOSE,
                ![@UI.Importance]: #High,
                Label            : 'Purpose'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_START_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip Start Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : TRIP_END_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Trip End Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Request ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CASH_ADVANCE,
                ![@UI.Importance]: #High,
                Label            : 'Cash Advance'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PAYMENT_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Payment Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMITTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Claim Submitted Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim ID'
            }
        ]
    }
) {
    REQUEST_STATUS_DESC @Common.Label: 'Pre-Approval Status Description';
    CLAIM_STATUS_DESC   @Common.Label: 'Claim Status Description';
    CASH_ADVANCE        @Common.Label: 'Cash Advance';

    STATUS              @(
        Common.Label                   : 'Pre-Approval Status',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Status Selection',
            CollectionPath: 'ZSTATUS',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: STATUS_DESC,
                ValueListProperty: 'STATUS_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    STATUS_ID           @(
        Common.Label                   : 'Claim Status',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Status Selection',
            CollectionPath: 'ZSTATUS',
            // Your lookup table
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: STATUS_DESC,
                ValueListProperty: 'STATUS_DESC' // The field name in ZSTATUS table
            }]
        }
    );
    DEP                 @(
        Common.Label                   : 'Department',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : DEPARTMENT_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Department Selection',
            CollectionPath: 'ZDEPARTMENT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: DEP,
                    ValueListProperty: 'DEPARTMENT_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: DEPARTMENT_DESC,
                    ValueListProperty: 'DEPARTMENT_DESC'
                }
            ]
        }
    );
    CLAIM_TYPE_ID       @(
        Common.Label                   : 'Claim Type',
        // This links the Code to the Description field for a "Code (Name)" display
        Common.Text                    : CLAIM_TYPE_DESC,
        Common.TextArrangement         : #TextSeparate,
        // Options: #TextFirst, #TextLast, #TextOnly, #TextSeparate
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Claim Type Selection',
            CollectionPath: 'ZCLAIM_TYPE',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: CLAIM_TYPE_ID,
                    ValueListProperty: 'CLAIM_TYPE_ID'
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: CLAIM_TYPE_DESC,
                    ValueListProperty: 'CLAIM_TYPE_DESC'
                }
            ]
        }
    );
    NAME                @(
        Common.Label                   : 'Employee Name',
        Common.ValueListWithFixedValues: true,
        // This creates the dropdown
        Common.ValueList               : {
            Label         : 'Employee Selection',
            CollectionPath: 'ZEMP_MASTER',
            // Your lookup table
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: EEID,
                    ValueListProperty: 'EEID' // The field name in ZSTATUS table
                },
                {
                    // This pulls the description into the dropdown list
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: NAME,
                    ValueListProperty: 'NAME'
                }
            ]
        }
    );
};

annotate service.ZEMP_CC_BUDGET_REPORT with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false
    },


    Capabilities: {
        Searchable: true
    },

    UI          : {

        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Cost Center Budget Report',
            TypeNamePlural: 'Cost Center Budget Report',
        },

        LineItem  : [

            {
                $Type            : 'UI.DataField',
                Value            : YEAR,
                ![@UI.Importance]: #High,
                Label            : 'Effective Date'
            },
            {
                $Type            : 'UI.DataField',
                Value            : FUND_CENTER,
                ![@UI.Importance]: #High,
                Label            : 'Cost Center'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMMITMENT_ITEM,
                ![@UI.Importance]: #High,
                Label            : 'GL Code'
            },
            {
                $Type            : 'UI.DataField',
                Value            : MATERIAL_GROUP,
                ![@UI.Importance]: #High,
                Label            : 'Code Material'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CURRENT_BUDGET,
                ![@UI.Importance]: #High,
                Label            : 'Current Budget Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ADJUST_AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Adjustment Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : COMMITMENT,
                ![@UI.Importance]: #High,
                Label            : 'Commitment Amount'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ACTUAL,
                ![@UI.Importance]: #High,
                Label            : 'Amount Paid(Actual)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CONSUMED,
                ![@UI.Importance]: #High,
                Label            : 'Amount Used(Consumed)'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BUDGET_BALANCE,
                ![@UI.Importance]: #High,
                Label            : 'Current Balance'
            }
        ]
    }
){
    
    ADJUST_AMOUNT @Common.Label : 'Adjustment Amount';
    COMMITMENT @Common.Label : 'Commitment Amount';
    YEAR @Common.Label: 'Effective Date';
    ACTUAL @Common.Label: 'Amount Paid(Actual)';
    BUDGET_BALANCE @Common.Label: 'Current Balance';
    CONSUMED @Common.Label: 'Amount Used(Consumed)';

    FUND_CENTER         @(
        Common.Label                   : 'Cost Center',
        Common.Text                    : COST_CENTER_DESC,
        Common.TextArrangement         : #TextSeparate,
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Cost Center Selection',
            CollectionPath: 'ZCOST_CENTER_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COST_CENTER,
                    ValueListProperty: 'COST_CENTER_ID'
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: COST_CENTER_DESC,
                    ValueListProperty: 'COST_CENTER_DESC'
                }
            ]
        }
    );

    COMMITMENT_ITEM         @(
        Common.Label                   : 'GL Code',
        Common.Text                    : GL_ACCOUNT_DESC,
        Common.TextArrangement         : #TextSeparate,
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'GL Code Selection',
            CollectionPath: 'ZGL_ACCOUNT',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: COMMITMENT_ITEM,
                    ValueListProperty: 'GL_ACCOUNT_ID'
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: GL_ACCOUNT_DESC,
                    ValueListProperty: 'GL_ACCOUNT_DESC'
                }
            ]
        }
    );

    MATERIAL_GROUP         @(
        Common.Label                   : 'Code Material',
        Common.Text                    : MATERIAL_CODE_DESC,
        Common.TextArrangement         : #TextSeparate,
        Common.ValueListWithFixedValues: true,
        Common.ValueList               : {
            Label         : 'Code Material Selection',
            CollectionPath: 'ZMATERIAL_GROUP',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: MATERIAL_GROUP,
                    ValueListProperty: 'MATERIAL_CODE_ID'
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: MATERIAL_CODE_DESC,
                    ValueListProperty: 'MATERIAL_CODE_DESC'
                }
            ]
        }
    );


};

annotate service.ZEMP_CC_BUDGET_DETAIL with @(
    cds.autoexpose,
    Capabilities: {
        Deletable : false,
        Updatable : false,
        Insertable: false,
    },
    UI: {
        HeaderInfo: {
            $Type: 'UI.HeaderInfoType',
            TypeName: 'Budget Detail',
            TypeNamePlural: 'Budget Details',
            Title: { Value: CLAIM_ID }
        },

        LineItem: [
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID '
            },
            {
                $Type            : 'UI.DataField',
                Value            : NAME,
                ![@UI.Importance]: #High,
                Label            : 'Employee Name '
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim ID  '
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type  '
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Item  '
            },
            {
                $Type            : 'UI.DataField',
                Value            : AMOUNT,
                ![@UI.Importance]: #High,
                Label            : 'Amount  '
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Status  '
            }

        ]
    }
);

annotate service.ZEMP_PENDING_LIST with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    UI                             : {

        HeaderInfo: {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Reassign Approvers',
            TypeNamePlural: 'Reassign Approvers',
        },

        LineItem  : [
            {
                $Type            : 'UI.DataField',
                Value            : ID,
                ![@UI.Importance]: #High,
                Label            : 'ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : EMP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Employee ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Status'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBMITTED_DATE,
                ![@UI.Importance]: #High,
                Label            : 'Submitted Date'
            }            
        ]
    }
);

annotate service.ZEMP_APPROVER_LIST_VH with @(UI.SelectionFields: [
    EEID,
    NAME,
]) {
    @UI.hidden: true
    DEP;
};

annotate service.ZEMP_APPROVER_VH with @(UI.SelectionFields: [
    EEID,
    NAME,
    EMAIL
]) {
    @UI.hidden: true
    ROLE;
    @UI.hidden: true
    DEP;
};

annotate service.ZEMP_SUBSTITUTE_VH with @(UI.SelectionFields: [
    EEID,
    NAME,
    EMAIL
]) {
    @UI.hidden: true
    ROLE;
    @UI.hidden: true
    DEP;
    @UI.hidden: true
    SELECTED_APPROVER;
};

annotate service.ZSUBSTITUTION_RULES_CONFIG with {
    @Core.Computed SUBSTITUTE_RULE_ID;
    VALID_FROM @(Common.Label: 'Valid From');
    VALID_TO   @(Common.Label: 'Valid To');
}

annotate service.ZSUBSTITUTION_RULES_CONFIG with @(
    cds.autoexpose,
    Capabilities.SearchRestrictions: {Searchable: false},
    Common.SemanticKey             : [
        SUBSTITUTE_RULE_ID,
        USER_ID,
        SUBSTITUTE_ID,
        VALID_FROM,
        VALID_TO
    ],
    Capabilities                   : {
        Deletable : true,
        Updatable : false,
        Insertable: true
    },
    odata.draft.enabled,
    UI                             : {
        CreateHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        DeleteHidden: {$edmJson: {$Path: '/eclaim_srv.EntityContainer/FeatureControl/operationHidden'}},
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'Substitution Rules - ZSUBSTITUTION_RULES',
            TypeNamePlural: 'Substitution Rules - ZSUBSTITUTION_RULES',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : SUBSTITUTE_RULE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Substitution Rule ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : USER_ID,
                ![@UI.Importance]: #High,
                Label            : 'Approver ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : SUBSTITUTE_ID,
                ![@UI.Importance]: #High,
                Label            : 'Substitute ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VALID_FROM,
                ![@UI.Importance]: #High,
                Label            : 'Valid From'
            },
            {
                $Type            : 'UI.DataField',
                Value            : VALID_TO,
                ![@UI.Importance]: #High,
                Label            : 'Valid To'
            }
        ]
    }
) {
    USER_ID       @(
        Common.Label                   : 'Approver ID',
        Common.ValueListWithFixedValues: false,
        Common.ValueList               : {
            Label         : 'User Selection',
            CollectionPath: 'ZEMP_APPROVER_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: USER_ID, // Use the actual property of your main entity
                    ValueListProperty: 'EEID' // The key field in ZEMP_MASTER
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'NAME'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'EMAIL'
                }
            ]
        },
        Common.SideEffects             : {
            $Type           : 'Common.SideEffectsType',
            SourceProperties: [USER_ID],
            TargetProperties: [SUBSTITUTE_ID]
        }
    );
    SUBSTITUTE_ID @(
        Common.Label                   : 'Substitute ID',
        Common.ValueListWithFixedValues: false,
        Common.ValueList               : {
            Label         : 'Substitute Selection',
            CollectionPath: 'ZEMP_SUBSTITUTE_VH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterIn',
                    LocalDataProperty: USER_ID,
                    ValueListProperty: 'SELECTED_APPROVER'
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: SUBSTITUTE_ID,
                    ValueListProperty: 'EEID'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'NAME'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'EMAIL'
                }
            ]
        }
    );
};
