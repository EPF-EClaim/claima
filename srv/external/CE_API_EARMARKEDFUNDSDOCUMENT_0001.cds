/* checksum : ea6179517e0098447c211a2abf1fa36c */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service CE_API_EARMARKEDFUNDSDOCUMENT_0001 {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Remote Interface Earmarked Funds'
  entity EarmarkedFundsDocument {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Number'
    @sap.quickinfo : 'Document Number for Earmarked Funds'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key EarmarkedFundsDocument : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'External Document Number'
    @sap.quickinfo : 'External Document Number for Earmarked Funds'
    EmrkdFndsExtDocumentNumber : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scenario'
    EmrkdFndsIntegrationScenario : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scenario Variant'
    EmrkdFndsIntegScenarioVariant : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Document Category'
    @sap.quickinfo : 'Document Category of an Earmarked Funds Document'
    EarmarkedFundsDocumentCategory : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Earmarked Fund Document Type'
    EarmarkedFundsDocumentType : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    CompanyCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Transaction Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Local currency'
    @sap.quickinfo : 'Local currency key'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.semantics : 'currency-code'
    CompanyCodeCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference'
    @sap.quickinfo : 'Reference Document Number'
    EarmarkedFundsDocReference : String(16);
    @sap.label : 'Document Header Text'
    EarmarkedFundsHeaderText : String(50);
    @sap.display.format : 'Date'
    @sap.label : 'Posting Date'
    @sap.quickinfo : 'Posting Date in the Document'
    PostingDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Document Date'
    @sap.quickinfo : 'Document Date in Document'
    DocumentDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Translation Date'
    ExchangeRateDate : Date;
    @sap.label : 'Absolute Exchange Rate'
    AbsoluteExchangeRate : Decimal(9, 5);
    @sap.label : 'Exchange Rate Is Indirect Quotation'
    ExchRateIsIndirectQuotation : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Entered By'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocCreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Entered On'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocCreationDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Last Changed By'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocLastChangedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Date of Last Change'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocLastChangeDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @sap.label : 'Last Changed On'
    @sap.quickinfo : 'Change Date and Time'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocLastChangeDateTime : DateTime;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference Transact.'
    @sap.quickinfo : 'Reference Transaction'
    ReferenceDocumentType : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference Document'
    @sap.quickinfo : 'Reference Doc. Number'
    ReferenceDocument : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference Org. Unit'
    @sap.quickinfo : 'Reference Organizational Units'
    ReferenceDocumentContext : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Log. System Source'
    @sap.quickinfo : 'Logical System of Source Document'
    ReferenceDocumentLogicalSystem : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Block'
    @sap.quickinfo : 'Funds Precommitment Document Block'
    EarmarkedFundsManualEditBlock : String(2);
    to_EarmarkedFundsDocumentItem : Composition of many EarmarkedFundsDocumentItem {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Remote Interface Earmarked Funds Item'
  entity EarmarkedFundsDocumentItem {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Number'
    @sap.quickinfo : 'Document Number for Earmarked Funds'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key EarmarkedFundsDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Document Item'
    @sap.quickinfo : 'Earmarked Funds: Document Item'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key EarmarkedFundsDocumentItem : String(3) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    CompanyCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Transaction Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Local currency'
    @sap.quickinfo : 'Local currency key'
    @sap.semantics : 'currency-code'
    CompanyCodeCurrency : String(5);
    @sap.display.format : 'Date'
    @sap.label : 'Posting Date'
    @sap.quickinfo : 'Posting Date in the Document'
    PostingDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Entered By'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocItmCreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Entered On'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocItmCreationDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Last Changed By'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocItmLastChgdByUsr : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Date of Last Change'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsDocItmLastChangeDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference item'
    @sap.quickinfo : 'Reference line item'
    EmrkdFndsReferenceDocumentItem : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    GLAccount : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center'
    CostCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    WBSElementExternalID : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fund'
    Fund : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Budget Period'
    BudgetPeriod : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Commitment Item'
    CommitmentItem : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Funds Center'
    FundsCenter : String(16);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Funded Program'
    FundedProgram : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Area'
    FunctionalArea : String(16);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Grant'
    GrantID : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    Supplier : String(10);
    @sap.label : 'Text'
    @sap.quickinfo : 'Item Text'
    DocumentItemText : String(50);
    @sap.display.format : 'Date'
    @sap.label : 'Due On'
    @sap.quickinfo : 'Costs Due On'
    DueDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profit Center'
    ProfitCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Funds Reservation'
    @sap.quickinfo : 'Referenced Funds Reservation'
    PrdcssrFundsReservationDoc : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Funds Reservation Item'
    @sap.quickinfo : 'Item in Referenced Funds Reservation'
    PrdcssrFundsReservationDocItem : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Funds Precommitment'
    @sap.quickinfo : 'Referenced Funds Precommitment'
    PrdcssrFundsPreCmtmtDoc : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Funds Precommitment Item'
    @sap.quickinfo : 'Item in Referenced Funds Precommitment'
    PrdcssrFundsPreCmtmtDocItem : String(3);
    @sap.label : 'Set to &quot;Completed&quot;'
    @sap.quickinfo : 'Used earmarked funds are set to &quot;Completed&quot;.'
    EmrkdFndsItmPrdcssrCompleted : Boolean;
    @sap.display.format : 'Date'
    @sap.label : 'Completed On'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsItmCompletionDate : Date;
    @sap.label : 'Item Completed'
    @sap.quickinfo : 'Completion Indicator for Earmarked Funds Document Item'
    EmrkdFndsItmIsCompleted : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Item Block'
    @sap.quickinfo : 'Item Block to Prevent Manual Processing'
    EmrkdFndsItmManualEditBlock : String(2);
    @sap.label : 'Item Blocked'
    @sap.quickinfo : 'Blocking Indicator (Item)'
    EmrkdFndsItmIsBlkdAgainstUsage : Boolean;
    @sap.label : 'Item Approved'
    @sap.quickinfo : 'Earmarked Funds Item Is Approved'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsItmIsApproved : Boolean;
    @sap.label : 'Account Assignment Changeable'
    @sap.quickinfo : 'Account Assignment Can Be Changed in Follow-On Document'
    EmrkdFndsAcctAssgmtChangeable : Boolean;
    @sap.unit : 'TransactionCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Total Amount'
    @sap.quickinfo : 'Total Reserved Amount in Transaction Currency'
    EmrkdFndsAmountInTransCrcy : Decimal(15, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Open Amount'
    @sap.quickinfo : 'Open Amount in Transaction Currency'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsOpenAmtInTransCrcy : Decimal(15, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Reduced Amount'
    @sap.quickinfo : 'Funds Reservation Amount Reduced'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsCnsmdAmtInTransCrcy : Decimal(15, 3);
    @sap.unit : 'CompanyCodeCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Total Amount in Local Currency'
    @sap.quickinfo : 'Total Reserved Amount in Local Currency'
    EmrkdFndsAmountInCCCrcy : Decimal(15, 3);
    @sap.unit : 'CompanyCodeCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Open Amount in Local Currency'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsOpenAmtInCCCrcy : Decimal(15, 3);
    @sap.unit : 'CompanyCodeCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Reduced Amount'
    @sap.quickinfo : 'Funds Reservation Amount Reduced'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    EmrkdFndsCnsmdAmtInCCCrcy : Decimal(15, 3);
    to_EarmarkedFundsDocument : Association to EarmarkedFundsDocument {  };
  };
};

