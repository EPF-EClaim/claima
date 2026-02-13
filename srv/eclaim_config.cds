using {eclaim_srv as service} from './eclaim_srv';

annotate service.ZRISK with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [RISK_ID],
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
        ]
    }
);

annotate service.ZREQUEST_TYPE with @(
    cds.autoexpose,
    // odata.draft.bypass,
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
    odata.draft.bypass,
    Common.SemanticKey: [CLAIM_TYPE_ID],
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
            TypeName      : 'ZCLAIM_TYPE',
            TypeNamePlural: 'ZCLAIM_TYPE',
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
                Value            : CLAIM_TYPE_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Description'
            }
        ], 
        Facets  : [
            {
                $Type: 'UI.ReferenceFacet', 
                Target: 'ZCLAIM_TYPE_ITEM/@UI.LineItem',
                Label: 'Items',
                ID: 'Items'
            }
        ],
    }
);

annotate service.ZNUM_RANGE with @(
    cds.autoexpose,
    Common.SemanticKey: [RANGE_ID],


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
    odata.draft.bypass,
    Common.SemanticKey: [CLAIM_TYPE_ITEM_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    // odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZCLAIM_TYPE_ITEM',
            TypeNamePlural: 'ZCLAIM_TYPE_ITEM',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Item ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_TYPE_ITEM_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Type Item Description'
            }
        ]
    }
);

annotate service.ZAPP_FIELD_CTRL with @(
    cds.autoexpose,
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
    Common.SemanticKey: [ROOM_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
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

annotate service.ZSTAFF_CAT with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [STAFF_CATEGORY_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

    UI                : {
        CreateHidden: false,
        DeleteHidden: false,
        HeaderInfo  : {
            $Type         : 'UI.HeaderInfoType',
            TypeName      : 'ZSTAFF_CAT',
            TypeNamePlural: 'ZSTAFF_CAT',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : STAFF_CATEGORY_ID,
                ![@UI.Importance]: #High,
                Label            : 'Staff Category ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : STAFF_CATEGORY_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Staff Category Description'
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
    odata.draft.bypass,
    Common.SemanticKey: [VEHICLE_TYPE_ID],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
    odata.draft.bypass,
    Common.SemanticKey: [
        COUNTRY_ID,
        STATE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
    odata.draft.bypass,
    Common.SemanticKey: [
        EEID
    ],
    Capabilities      : {
        Deletable : false,
        Updatable : true,
        Insertable: false
    },
    odata.draft.enabled,

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
                Value            : MOBILE_BILL_ELIGIBILITY,
                ![@UI.Importance]: #High,
                Label            : 'Mobile Bill Eligibility'
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
    odata.draft.bypass,
    Common.SemanticKey: [
        JOB_GROUP_ID
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
        ]
    }
);

annotate service.ZDEPARTMENT with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        DEPARTMENT_ID
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
        ]
    }
);

annotate service.ZROLE with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        ROLE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
        ]
    }
);

annotate service.ZUSER_TYPE with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        USER_TYPE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
        ]
    }
);

annotate service.ZEMP_TYPE with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        EMP_TYPE_ID
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
        ]
    }
);

annotate service.ZREGION with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        REGION_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
        ]
    }
);

annotate service.ZRATE_KM with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        ROLE_ID
    ],
    Capabilities      : {
        Deletable : true,
        Updatable : true,
        Insertable: true
    },
    //odata.draft.enabled,

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
                Value            : RATE_PER_KM,
                ![@UI.Importance]: #High,
                Label            : 'Rate Per KM'
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
    odata.draft.bypass,
    Common.SemanticKey: [
        SUBMISSION_TYPE_ID
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
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
    Common.SemanticKey: [
        LOC_TYPE_ID
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
    odata.draft.bypass,
    Common.SemanticKey: [
        MATERIAL_CODE_ID
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
    odata.draft.bypass,
    Common.SemanticKey: [
        IND_OR_GROUP_ID
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

annotate service.ZPREAPPROVAL_STATUS with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        PREAPPROVAL_STATUS_ID
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
            TypeName      : 'ZPREAPPROVAL_STATUS',
            TypeNamePlural: 'ZPREAPPROVAL_STATUS',
        },
        LineItem    : [
            {
                $Type            : 'UI.DataField',
                Value            : PREAPPROVAL_STATUS_ID,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Status ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : PREAPPROVAL_STATUS_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Pre-Approval Status Description'
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

annotate service.ZEMP_VEHICLE with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        EMP_ID,
        VEHICLE_NO
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
            TypeName      : 'ZEMP_VEHICLE',
            TypeNamePlural: 'ZEMP_VEHICLE',
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
                Value            : VEHICLE_NO,
                ![@UI.Importance]: #High,
                Label            : 'Vehicle Number'
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
    odata.draft.bypass,
    Common.SemanticKey: [
        RELATIONSHIP_TYPE_ID
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
    odata.draft.bypass,
    Common.SemanticKey: [
        LOOKUP_ID
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
    odata.draft.bypass,
    Common.SemanticKey: [
        MARRIAGE_CATEGORY_ID
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
    odata.draft.bypass,
    Common.SemanticKey: [
        PROJECT_CODE_IO
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
    odata.draft.bypass,
    Common.SemanticKey: [
        BRANCH_ID
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
    odata.draft.bypass,
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
    odata.draft.bypass,
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
    odata.draft.bypass,
    Common.SemanticKey: [
        HOUSING_LOAN_SCHEME_ID
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
    odata.draft.bypass,
    Common.SemanticKey: [
        LENDER_ID
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








