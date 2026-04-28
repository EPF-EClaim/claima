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
    );
    action processApproval(
        request : ApproverActionRequest
    );

}