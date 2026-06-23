using { ECLAIM } from '../db/eclaim';

type ApproverActionRequest {
    Id              : String;
    UserId          : String;
    ApproverAction  : String;
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
        AutoApproved        : Boolean;
    };
    action processApproval(
        request : ApproverActionRequest
    ) returns{
        Success             : Boolean;
        DocumentID          : String;
        Area                : String;
        Message             : String;
    };

}