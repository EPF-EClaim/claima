/* checksum : eb255a891ad3d0aac79d465e933874ae */
@cds.external : true
@CodeList.CurrencyCodes.Url : '../../../../default/iwbep/common/0001/$metadata'
@CodeList.CurrencyCodes.CollectionPath : 'Currencies'
@Common.ApplyMultiUnitBehaviorForSortingAndFiltering : true
@Capabilities.FilterFunctions : [
  'eq',
  'ne',
  'gt',
  'ge',
  'lt',
  'le',
  'and',
  'or',
  'contains',
  'startswith',
  'endswith',
  'any',
  'all'
]
@Capabilities.SupportedFormats : [ 'application/json', 'application/pdf' ]
@PDF.Features.DocumentDescriptionReference : '../../../../default/iwbep/common/0001/$metadata'
@PDF.Features.DocumentDescriptionCollection : 'MyDocumentDescriptions'
@PDF.Features.ArchiveFormat : true
@PDF.Features.Border : true
@PDF.Features.CoverPage : true
@PDF.Features.FitToPage : true
@PDF.Features.FontName : true
@PDF.Features.FontSize : true
@PDF.Features.HeaderFooter : true
@PDF.Features.IANATimezoneFormat : true
@PDF.Features.Margin : true
@PDF.Features.Padding : true
@PDF.Features.ResultSizeDefault : 20000
@PDF.Features.ResultSizeMaximum : 20000
@PDF.Features.Signature : true
@PDF.Features.TextDirectionLayout : true
@PDF.Features.Treeview : true
@PDF.Features.UploadToFileShare : true
@Capabilities.KeyAsSegmentSupported : true
@Capabilities.AsynchronousRequestsSupported : true
service sap_s4_OP_API_EARMARKEDFUNDS_SRV_0001_v1 {
  @cds.external : true
  type SAP__Message {
    code : String not null;
    message : String not null;
    target : String;
    additionalTargets : many String not null;
    transition : Boolean not null;
    @odata.Type : 'Edm.Byte'
    numericSeverity : Integer not null;
    longtextUrl : String;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Remote Interface Earmarked Funds'
  @Common.SemanticKey : [ 'EarmarkedFundsDocument' ]
  @Common.Messages : SAP__Messages
  @Capabilities.NavigationRestrictions.RestrictedProperties : [
    {
      NavigationProperty: _EarmarkedFundsDocumentItem,
      InsertRestrictions: { Insertable: true }
    }
  ]
  @Capabilities.SearchRestrictions.Searchable : false
  @Capabilities.UpdateRestrictions.DeltaUpdateSupported : true
  @Capabilities.UpdateRestrictions.NonUpdatableNavigationProperties : [ '_EarmarkedFundsDocumentItem' ]
  @Capabilities.UpdateRestrictions.QueryOptions.SelectSupported : true
  @Capabilities.DeepUpdateSupport.ContentIDSupported : true
  @Capabilities.DeleteRestrictions.Deletable : false
  entity EarmarkedFundsDocument {
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Document Number'
    @Common.Heading : 'Doc. No.'
    @Common.QuickInfo : 'Document Number for Earmarked Funds'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLNR_DY'
    key EarmarkedFundsDocument : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'External Document Number'
    @Common.QuickInfo : 'External Document Number for Earmarked Funds'
    EmrkdFndsExtDocumentNumber : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Scenario'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMR_INTSCENARIO'
    EmrkdFndsIntegrationScenario : String(3) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Scenario Variant'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMR_SCVAR'
    EmrkdFndsIntegScenarioVariant : String(10) not null;
    @Common.IsDigitSequence : true
    @Common.Label : 'Document Category'
    @Common.QuickInfo : 'Document Category of an Earmarked Funds Document'
    EarmarkedFundsDocumentCategory : String(3) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Document Type'
    @Common.Heading : 'DT'
    @Common.QuickInfo : 'Earmarked Fund Document Type'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRE_BLART'
    EarmarkedFundsDocumentType : String(2) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Company Code'
    @Common.Heading : 'CoCd'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BUKRS'
    CompanyCode : String(4) not null;
    @Common.IsCurrency : true
    @Common.IsUpperCase : true
    @Common.Label : 'Transaction Currency'
    @Common.Heading : 'TCurr'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=TWAER'
    TransactionCurrency : String(3) not null;
    @Common.IsCurrency : true
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Local currency'
    @Common.Heading : 'L.cur'
    @Common.QuickInfo : 'Local currency key'
    CompanyCodeCurrency : String(3) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Reference'
    @Common.QuickInfo : 'Reference Document Number'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=XBLNR1'
    EarmarkedFundsDocReference : String(16) not null;
    @Common.Label : 'Reference 2'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRE_XBLNR2'
    EarmarkedFundsDocReference2 : String(70) not null;
    @Common.Label : 'Reference 3'
    EarmarkedFundsDocReference3 : String(70) not null;
    @Common.Label : 'Document Header Text'
    @Common.Heading : 'Text'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLKTEXT'
    EarmarkedFundsHeaderText : String(50) not null;
    @Common.Label : 'Posting Date'
    @Common.Heading : 'Pstng Date'
    @Common.QuickInfo : 'Posting Date in the Document'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BUDAT'
    PostingDate : Date;
    @Common.Label : 'Document Date'
    @Common.Heading : 'Doc. Date'
    @Common.QuickInfo : 'Document Date in Document'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BLDAT'
    DocumentDate : Date;
    @Common.Label : 'Translation Date'
    @Common.Heading : 'TranslDate'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=WWERT_D'
    ExchangeRateDate : Date;
    @Common.Label : 'Absolute Exchange Rate'
    AbsoluteExchangeRate : Decimal(9, 5) not null;
    @Common.Label : 'Exchange Rate Is Indirect Quotation'
    ExchRateIsIndirectQuotation : Boolean not null;
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Entered By'
    EmrkdFndsDocCreatedByUser : String(12) not null;
    @Core.Computed : true
    @Common.Label : 'Entered On'
    EmrkdFndsDocCreationDate : Date;
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Last Changed By'
    @Common.Heading : 'Changed By'
    EmrkdFndsDocLastChangedByUser : String(12) not null;
    @Core.Computed : true
    @Common.Label : 'Changed On'
    @Common.QuickInfo : 'Date of Last Change'
    EmrkdFndsDocLastChangeDate : Date;
    @odata.Precision : 0
    @odata.Type : 'Edm.DateTimeOffset'
    @Core.Computed : true
    @Common.Label : 'Last Changed On'
    @Common.QuickInfo : 'Change Date and Time'
    EmrkdFndsDocLastChangeDateTime : DateTime;
    @Common.IsUpperCase : true
    @Common.Label : 'Reference procedure'
    @Common.Heading : 'Ref. proc.'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=AWTYP'
    ReferenceDocumentType : String(5) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Reference Document'
    @Common.Heading : 'Ref. Doc.'
    @Common.QuickInfo : 'Reference Doc. Number'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=AWREF'
    ReferenceDocument : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Reference Org. Unit'
    @Common.Heading : 'Ref.org.un'
    @Common.QuickInfo : 'Reference Organizational Units'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=AWORG'
    ReferenceDocumentContext : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Log. system source'
    @Common.Heading : 'Log.System'
    @Common.QuickInfo : 'Logical system of source document'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=AWSYS'
    ReferenceDocumentLogicalSystem : String(10) not null;
    @Common.Label : 'Negative Values'
    @Common.QuickInfo : 'Indicator: Document Has Negative Amounts'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=NEGVAL'
    EmrkdFndsHasNegativeAmounts : Boolean not null;
    @Common.Label : 'Document Blocked'
    @Common.Heading : 'BLK'
    @Common.QuickInfo : 'Blocking Indicator (Header)'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BLKKZ'
    EmrkdFndsIsBlockedAgainstUsage : Boolean not null;
    @Common.Label : 'Document Completed'
    @Common.QuickInfo : 'Indicator: Final Completion (Paid)'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FEXEC'
    EarmarkedFundsIsCompleted : Boolean not null;
    @Core.Computed : true
    @Common.Label : 'Document Approved'
    @Common.Heading : 'Doc. Approved'
    @Common.QuickInfo : 'Indicator: Document Is Approved'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=WKAPK'
    EarmarkedFundsIsApproved : Boolean not null;
    @Common.Label : 'Already Approved'
    @Common.QuickInfo : 'Document Already Approved Once'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=WKAOK'
    EmrkdFndsWasAlreadyAprvdOnce : Boolean not null;
    @Common.Label : 'Start Approval by Workflow'
    @Common.Heading : 'Start Approval Workflow'
    EarmarkedFundsStartWorkflow : Boolean not null;
    @Common.Label : 'Val.adjust.docs req.'
    @Common.Heading : 'Value Adjustments Required'
    @Common.QuickInfo : 'Changes to Doc. Amounts Only Using Value Adjustment Docs'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMPMDOCS'
    EmrkdFndsHasValueAdjustments : Boolean not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Decision Reason'
    @Common.QuickInfo : 'Reason for Decision for Workflow'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMREASON'
    EarmarkedFundsDecisionReason : String(2) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Document Block'
    @Common.QuickInfo : 'Funds Precommitment Document Block'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRDOCLOCK'
    EarmarkedFundsManualEditBlock : String(2) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Entry Status'
    @Common.Heading : 'Status'
    @Common.QuickInfo : 'Document Entry Status (Posted, Parked)'
    EarmarkedFundsDocEntryStatus : String(1) not null;
    SAP__Messages : many SAP__Message not null;
    @Common.Composition : true
    _EarmarkedFundsDocumentItem : Composition of many EarmarkedFundsDocumentItem on _EarmarkedFundsDocumentItem._EarmarkedFundsDocument = $self;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Remote Interface Earmarked Funds Item'
  @Common.SemanticKey : [ 'EarmarkedFundsDocument', 'EarmarkedFundsDocumentItem' ]
  @Common.Messages : SAP__Messages
  @Capabilities.SearchRestrictions.Searchable : false
  @Capabilities.UpdateRestrictions.DeltaUpdateSupported : true
  @Capabilities.UpdateRestrictions.NonUpdatableNavigationProperties : [ '_EarmarkedFundsDocument' ]
  @Capabilities.UpdateRestrictions.QueryOptions.SelectSupported : true
  @Capabilities.DeepUpdateSupport.ContentIDSupported : true
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  @Capabilities.FilterRestrictions.FilterExpressionRestrictions : [
    { Property: CommitmentItem, AllowedExpressions: 'MultiValue' },
    {
      Property: EmrkdFndsAmountInTransCrcy,
      AllowedExpressions: 'MultiValue'
    },
    {
      Property: EmrkdFndsOpenAmtInTransCrcy,
      AllowedExpressions: 'MultiValue'
    },
    {
      Property: EmrkdFndsCnsmdAmtInTransCrcy,
      AllowedExpressions: 'MultiValue'
    },
    { Property: EmrkdFndsAmountInCCCrcy, AllowedExpressions: 'MultiValue' },
    { Property: EmrkdFndsOpenAmtInCCCrcy, AllowedExpressions: 'MultiValue' },
    { Property: EmrkdFndsCnsmdAmtInCCCrcy, AllowedExpressions: 'MultiValue' }
  ]
  entity EarmarkedFundsDocumentItem {
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Document Number'
    @Common.Heading : 'Doc. No.'
    @Common.QuickInfo : 'Document Number for Earmarked Funds'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLNR_DY'
    key EarmarkedFundsDocument : String(10) not null;
    @Core.Computed : true
    @Common.IsDigitSequence : true
    @Common.Label : 'Document Item'
    @Common.Heading : 'Itm'
    @Common.QuickInfo : 'Earmarked Funds: Document Item'
    key EarmarkedFundsDocumentItem : String(3) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Company Code'
    @Common.Heading : 'CoCd'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BUKRS'
    CompanyCode : String(4) not null;
    @Common.IsCurrency : true
    @Common.IsUpperCase : true
    @Common.Label : 'Transaction Currency'
    @Common.Heading : 'TCurr'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=TWAER'
    TransactionCurrency : String(3) not null;
    @Common.IsCurrency : true
    @Common.IsUpperCase : true
    @Common.Label : 'Local currency'
    @Common.Heading : 'L.cur'
    @Common.QuickInfo : 'Local currency key'
    CompanyCodeCurrency : String(3) not null;
    @Common.Label : 'Posting Date'
    @Common.Heading : 'Pstng Date'
    @Common.QuickInfo : 'Posting Date in the Document'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BUDAT'
    PostingDate : Date;
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Entered By'
    EmrkdFndsDocItmCreatedByUser : String(12) not null;
    @Core.Computed : true
    @Common.Label : 'Entered On'
    EmrkdFndsDocItmCreationDate : Date;
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Last Changed By'
    @Common.Heading : 'Changed By'
    EmrkdFndsDocItmLastChgdByUsr : String(12) not null;
    @Core.Computed : true
    @Common.Label : 'Changed On'
    @Common.QuickInfo : 'Date of Last Change'
    EmrkdFndsDocItmLastChangeDate : Date;
    @Common.IsUpperCase : true
    @Common.Label : 'Reference item'
    @Common.Heading : 'Ref. item'
    @Common.QuickInfo : 'Reference line item'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=AWPOS'
    EmrkdFndsReferenceDocumentItem : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'G/L Account'
    @Common.Heading : 'G/L Acct'
    @Common.QuickInfo : 'G/L Account Number'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=SAKNR'
    GLAccount : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Cost Center'
    @Common.Heading : 'Cost Ctr'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KOSTL'
    CostCenter : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'WBS Element'
    @Common.QuickInfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=PS_POSID_EDIT'
    WBSElementExternalID : String(24) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Profit Center'
    ProfitCenter : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Order'
    @Common.QuickInfo : 'Order Number'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=AUFNR'
    InternalOrder : String(12) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Business Area'
    @Common.Heading : 'BusA'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=GSBER'
    BusinessArea : String(4) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Fund'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BP_GEBER'
    Fund : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Budget Period'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FM_BUDGET_PERIOD'
    BudgetPeriod : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Commitment Item'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FM_FIPEX'
    CommitmentItem : String(24) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Funds Center'
    @Common.Heading : 'Funds Ctr'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FISTL'
    FundsCenter : String(16) not null;
    @Core.Computed : true
    @Common.IsUpperCase : true
    @Common.Label : 'Funded Program'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FM_MEASURE'
    FundedProgram : String(24) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Functional Area'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FKBER'
    FunctionalArea : String(16) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Grant'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=GM_GRANT_NBR'
    GrantID : String(20) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Supplier'
    @Common.QuickInfo : 'Account Number of Supplier'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=LIFNR'
    Supplier : String(10) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Customer'
    @Common.QuickInfo : 'Customer Number'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KUNNR'
    Customer : String(10) not null;
    @Common.Label : 'Text'
    @Common.QuickInfo : 'Item Text'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=SGTXT'
    DocumentItemText : String(50) not null;
    @Common.Label : 'Due On'
    @Common.QuickInfo : 'Costs Due On'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLFDATK'
    DueDate : Date;
    @Common.Label : 'US Government Fields'
    @Common.QuickInfo : 'United States Federal Government Fields'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMFG_US_KEY'
    USFedGovernmentUUID : UUID;
    @Common.Label : 'Per. of Perf. Start'
    @Common.Heading : 'Start Date'
    @Common.QuickInfo : 'Period of Performance Start'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FM_PEROP_LOW'
    FundsMgmtPeriodOfPerfStartDate : Date;
    @Common.Label : 'Per. of Perf. End'
    @Common.Heading : 'End Date'
    @Common.QuickInfo : 'Period of Performance End'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FM_PEROP_HIGH'
    FundsMgmtPeriodOfPerfEndDate : Date;
    @Common.Label : 'PPA Exclude'
    @Common.Heading : 'PPA Ex.'
    @Common.QuickInfo : 'PPA Exclude Indicator'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=EXCLUDE_FLG'
    USFedPromptPaytActExclude : Boolean not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Funds Reservation'
    @Common.QuickInfo : 'Referenced Funds Reservation'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_PRED_FUNDSRESDOC'
    PrdcssrFundsReservationDoc : String(10) not null;
    @Common.IsDigitSequence : true
    @Common.Label : 'Funds Reservation Item'
    @Common.QuickInfo : 'Item in Referenced Funds Reservation'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_PRED_FUNDSRESDOCITEM'
    PrdcssrFundsReservationDocItem : String(3) not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Funds Precommitment'
    @Common.QuickInfo : 'Referenced Funds Precommitment'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_PRED_FUNDSPRECOMDOC'
    PrdcssrFundsPreCmtmtDoc : String(10) not null;
    @Common.IsDigitSequence : true
    @Common.Label : 'Funds Precommitment Item'
    @Common.QuickInfo : 'Item in Referenced Funds Precommitment'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_PRED_FUNDSPRECOMDOCIT'
    PrdcssrFundsPreCmtmtDocItem : String(3) not null;
    @Common.Label : 'Set to "Completed"'
    @Common.Heading : 'Comp'
    @Common.QuickInfo : 'Used earmarked funds are set to "Completed".'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=REFSETERLK'
    EmrkdFndsItmPrdcssrCompleted : Boolean not null;
    @Common.Label : 'Item Completed'
    @Common.Heading : 'S'
    @Common.QuickInfo : 'Completion Indicator for Earmarked Funds Document Item'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRE_ERLKZ'
    EmrkdFndsItmIsCompleted : Boolean not null;
    @Common.Label : 'Statistical ID'
    @Common.Heading : 'Statistical'
    @Common.QuickInfo : 'Funds Management Statistical Indicator'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRE_STATS'
    EmrkdFndsItmIsStatistical : Boolean not null;
    @Common.Label : 'Deletion Indicator'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_ITMDELINDICATOR'
    EmrkdFndsItmIsDeleted : Boolean not null;
    @Common.Label : 'Sender'
    @Common.Heading : 'S'
    @Common.QuickInfo : 'Indicator: Sender'
    EmrkdFndsItmIsSender : Boolean not null;
    @Common.Label : 'Receiver'
    @Common.Heading : 'R'
    @Common.QuickInfo : 'Indicator: Receiver'
    EmrkdFndsItmIsReceiver : Boolean not null;
    @Common.IsUpperCase : true
    @Common.Label : 'Item Block'
    @Common.QuickInfo : 'Item Block to Prevent Manual Processing'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRPOSLOCK'
    EmrkdFndsItmManualEditBlock : String(2) not null;
    @Common.Label : 'Item Blocked'
    @Common.Heading : 'B'
    @Common.QuickInfo : 'Blocking Indicator (Item)'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=BLPKZ'
    EmrkdFndsItmIsBlkdAgainstUsage : Boolean not null;
    @Common.Label : 'Exceed Without Limit'
    @Common.Heading : 'E'
    @Common.QuickInfo : 'Usage May Exceed Reserved Amount Without Limit'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMCONSUME'
    EmrkdFndsItmIsUnlimited : Boolean not null;
    @Common.Label : 'Overrun Tolerance'
    @Common.QuickInfo : 'Tolerance Limit for Overrun'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMUEBTO'
    EmrkdFndsItmToleranceLmtInPct : Decimal(4, 1) not null;
    @Common.Label : 'Override Global Tolerance'
    @Common.QuickInfo : 'Override Global (Percentage-Based) Tolerance'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_OVERRIDEGLOBTOL'
    EmrkdFndsOverrideGlobTolerance : Boolean not null;
    @Core.Computed : true
    @Common.Label : 'Item Approved'
    @Common.QuickInfo : 'Earmarked Funds Item Is Approved'
    EmrkdFndsItmIsApproved : Boolean not null;
    @Common.Label : 'Account Assignment Changeable'
    @Common.QuickInfo : 'Account Assignment Can Be Changed in Follow-On Document'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_ACCTASSGMTCHANGEABLE'
    EmrkdFndsAcctAssgmtChangeable : Boolean not null;
    @Common.Label : 'Val.Adjust.Required'
    @Common.Heading : 'Value Adjustment Documents Required'
    @Common.QuickInfo : 'Indicator: Amount Change Only with Value Adjustment Document'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMRPMACTIVE'
    EmrkdFndsHasValueAdjustments : Boolean not null;
    @Common.Label : 'Reduction in Local Currency only'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_CNSMPNINCCCRCYONLY'
    EmrkdFndsItmCnsmpnInCCCrcyOnly : Boolean not null;
    @Measures.ISOCurrency : TransactionCurrency
    @Common.Label : 'Total Amount'
    @Common.QuickInfo : 'Total Reserved Amount in Transaction Currency'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLWTG'
    EmrkdFndsAmountInTransCrcy : Decimal(precision: 15) not null;
    @Core.Computed : true
    @Measures.ISOCurrency : TransactionCurrency
    @Common.Label : 'Open Amount'
    @Common.QuickInfo : 'Open Amount in Transaction Currency'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMWTFREE'
    EmrkdFndsOpenAmtInTransCrcy : Decimal(precision: 15) not null;
    @Core.Computed : true
    @Measures.ISOCurrency : TransactionCurrency
    @Common.Label : 'Reduced Amount'
    @Common.QuickInfo : 'Funds Reservation Amount Reduced'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLWTABG'
    EmrkdFndsCnsmdAmtInTransCrcy : Decimal(precision: 15) not null;
    @Measures.ISOCurrency : CompanyCodeCurrency
    @Common.Label : 'Total Amount in Local Currency'
    @Common.QuickInfo : 'Total Reserved Amount in Local Currency'
    EmrkdFndsAmountInCCCrcy : Decimal(precision: 15) not null;
    @Core.Computed : true
    @Measures.ISOCurrency : CompanyCodeCurrency
    @Common.Label : 'Open Amount in Local Currency'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=FMIS_EFD_OPENAMTINCCCRCY'
    EmrkdFndsOpenAmtInCCCrcy : Decimal(precision: 15) not null;
    @Core.Computed : true
    @Measures.ISOCurrency : CompanyCodeCurrency
    @Common.Label : 'Reduced Amount'
    @Common.QuickInfo : 'Funds Reservation Amount Reduced'
    @Common.DocumentationRef : 'urn:sap-com:documentation:key?=type=DE&id=KBLWTABG'
    EmrkdFndsCnsmdAmtInCCCrcy : Decimal(precision: 15) not null;
    SAP__Messages : many SAP__Message not null;
    _EarmarkedFundsDocument : Association to one EarmarkedFundsDocument on _EarmarkedFundsDocument.EarmarkedFundsDocument = EarmarkedFundsDocument;
  };
};

