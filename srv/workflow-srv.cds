using { ECLAIM } from '../db/eclaim';

type ApproverActionRequest {
    Id              : String;
    UserId          : String;
    Action          : String;
    Comments        : String;
    RejectionReason : String;
}


service workflow {

    action startWorkflow(
        id : String
    ) returns{
        Success             : Boolean;
        DocumentID          : String;
        Area                : String;
        Message             : String;
    };
    action processApproval(
        request : ApproverActionRequest
    );

}