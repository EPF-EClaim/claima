using {
    sap_s4_OP_API_EARMARKEDFUNDS_SRV_0001_v1 as budget
} from './external/sap-s4-OP_API_EARMARKEDFUNDS_SRV_0001-v1';

@path: 'budget'
service BudgetService {

    entity EarmarkedFundsDocument
        as projection on budget.EarmarkedFundsDocument;

    entity EarmarkedFundsDocumentItem
        as projection on budget.EarmarkedFundsDocumentItem;
}

