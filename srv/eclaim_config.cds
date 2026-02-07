using {eclaim_srv as service} from './eclaim_srv';

annotate service.ZCLAIM_PURPOSE with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [CLAIM_PURPOSE_ID],
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
            TypeName      : 'ZCLAIM_PURPOSE',
            TypeNamePlural: 'ZCLAIM_PURPOSE',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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

);

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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
            }
        ]
    }
);

annotate service.ZREQUEST_GRP with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [REQUEST_GROUP_ID],
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
            TypeName      : 'ZREQUEST_GRP',
            TypeNamePlural: 'ZREQUEST_GRP',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_GROUP_ID,
                ![@UI.Importance]: #High,
                Label            : 'Request Group ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : REQUEST_GROUP_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Requese Group Description'
            }
        ]
    }
);

annotate service.ZREQUEST_TYPE with @(
    cds.autoexpose,
    odata.draft.bypass,
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
        ]
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
    odata.draft.enabled,

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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
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

annotate service.ZARITH_OPT with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [OPERATOR_ID],
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
            TypeName      : 'ZARITH_OPT',
            TypeNamePlural: 'ZARITH_OPT',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OPERATOR_ID,
                ![@UI.Importance]: #High,
                Label            : 'Operator ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : OPERATOR_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Operator Description'
            }
        ]
    }
);

annotate service.ZAPPROVAL_RULES with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [
        ZSCENARIO,
        ZSEQNO,
        ZAPPR_LVL
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
            TypeName      : 'ZAPPROVAL_RULES',
            TypeNamePlural: 'ZAPPROVAL_RULES',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZSCENARIO,
                ![@UI.Importance]: #High,
                Label            : 'ZSCENARIO'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZSEQNO,
                ![@UI.Importance]: #High,
                Label            : 'ZSEQNO'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZAPPR_LVL,
                ![@UI.Importance]: #High,
                Label            : 'ZAPPR_LVL'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZAMT,
                ![@UI.Importance]: #High,
                Label            : 'ZAMT'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZAMT_OP,
                ![@UI.Importance]: #High,
                Label            : 'ZAMT_OP'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZDAYS,
                ![@UI.Importance]: #High,
                Label            : 'ZDAYS'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZDAYS_OP,
                ![@UI.Importance]: #High,
                Label            : 'ZDAYS_OP'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZCOSTCTR,
                ![@UI.Importance]: #High,
                Label            : 'ZCOSTCTR'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZCOSTCTR_OP,
                ![@UI.Importance]: #High,
                Label            : 'ZCOSTCTR_OP'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZRISK,
                ![@UI.Importance]: #High,
                Label            : 'ZRISK'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZRISK_OP,
                ![@UI.Importance]: #High,
                Label            : 'ZRISK_OP'
            },
            {
                $Type            : 'UI.DataField',
                Value            : ZAPPROVER_ID,
                ![@UI.Importance]: #High,
                Label            : 'ZAPPROVER_ID'
            },
        ]
    }
);

annotate service.ZCLAIM_MAIN_CAT with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [CLAIM_MAIN_CAT_ID],
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
            TypeName      : 'ZCLAIM_MAIN_CAT',
            TypeNamePlural: 'ZCLAIM_MAIN_CAT',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_MAIN_CAT_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Main Category ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_MAIN_CAT_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Main Category Description'
            }
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
            }
        ]
    }
);

annotate service.ZCLAIM_DISCLAIMER with @(
    cds.autoexpose,
    odata.draft.bypass,
    Common.SemanticKey: [CLAIM_DISCLAIMER_ID],
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
            TypeName      : 'ZCLAIM_DISCLAIMER',
            TypeNamePlural: 'ZCLAIM_DISCLAIMER',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_DISCLAIMER_ID,
                ![@UI.Importance]: #High,
                Label            : 'Claim Disclaimer ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : CLAIM_DISCLAIMER_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Claim Disclaimer Description'
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
            }
        ]
    }
);

annotate service.ZCURRENCY with @(
    cds.autoexpose,
    odata.draft.bypass,
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
    odata.draft.enabled,

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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
            }
        ]
    }
);

annotate service.ZKWSP_BRANCH with @(
    cds.autoexpose,
    odata.draft.bypass,
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
            TypeName      : 'ZKWSP_BRANCH',
            TypeNamePlural: 'ZKWSP_BRANCH',
        },
        LineItem    : [
            {
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_ID,
                ![@UI.Importance]: #High,
                Label            : 'Branch ID'
            },
            {
                $Type            : 'UI.DataField',
                Value            : BRANCH_DESC,
                ![@UI.Importance]: #High,
                Label            : 'Branch Description'
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
                $Type              : 'UI.DataFieldForAction',
                Action             : '',
                ![@UI.IsCopyAction]: true,
                Label              : 'Copy'
            },
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
        ]
    }
);
