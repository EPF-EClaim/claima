using { ECLAIM } from '../db/eclaim';

type ApproverActionRequest {
    id              : String;
    action          : String;
    comments        : String;
    rejectionReason : String;
}


service workflow {

    action startWorkflow(
        id : String
    ) returns{
        success             : String;
        documentID          : String;
        documentPrefix      : String;
        outcomeWorkflowCode : String;
        message             : String;
    };
    action processApproval(
        request : ApproverActionRequest
    );

}