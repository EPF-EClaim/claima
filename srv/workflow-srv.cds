using { ECLAIM } from '../db/eclaim';
using { eclaim_srv } from './eclaim_srv';
using {CE_API_EARMARKEDFUNDSDOCUMENT_0001 as external} from './external/CE_API_EARMARKEDFUNDSDOCUMENT_0001';
using { sap_s4_OP_API_EARMARKEDFUNDS_SRV_0001_v1 as budget_api } from './external/sap-s4-OP_API_EARMARKEDFUNDS_SRV_0001-v1';

type ApproverActionRequest {
    Id              : String;
    UserId          : String;
    ApproverAction  : String;
    Comments        : String;
    RejectionReason : String;
}


service workflow {

    action startWorkflow(
        id : String,
        currentStatus: String
    ) returns{
        Success             : Boolean;
        DocumentID          : String;
        Area                : String;
        Message             : String;
        AutoApproved        : Boolean;
        EligibilityResults  : many eclaim_srv.EligibilityPayload;
    };
    action processApproval(
        request : ApproverActionRequest
    ) returns{
        Success             : Boolean;
        DocumentID          : String;
        Area                : String;
        Message             : String;
    };

    
    entity API_EARMARKSFUND_HEADER as projection on external.EarmarkedFundsDocument;

    entity API_EARMARKSFUND_ITEM as projection on external.EarmarkedFundsDocumentItem;

    entity EARMARKEDFUNDS as projection on budget_api.EarmarkedFundsDocument;


}