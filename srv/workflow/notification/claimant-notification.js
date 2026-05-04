const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");
const {
    retrieveHeaderDetails,
    retrieveEmployeeDetails
} = require("../../workflow/workflow-helper");

async function sendEmailToClaimant(oTx, aApproversContext, sId, oDescriptor) {

    // Retrieve Header context
    const oHeaderContext = await retrieveHeaderDetails(oTx, sId, oDescriptor);
    if(!oHeaderContext){
        return null;
    }

    // Retrieve Claimant Context
    const oClaimantContext = await retrieveEmployeeDetails(oTx, sId);
    if(!oClaimantContext) {
        return null;
    }
    try{

        for(const oApproverContext of aApproversContext){
            const oAction = oModel.bindContext("/sendEmail(...)");
            oAction.setParameter("ApproverName" , oApproverContext.APPROVER_NAME);
            oAction.setParameter("SubmissionDate" , oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE]);
            oAction.setParameter("ClaimantName" , oClaimantContext[Constant.EntitiesFields.NAME]);
            oAction.setParameter("ClaimType" , oApproverContext.ClaimType);
            oAction.setParameter("ClaimID" , sId);
            oAction.setParameter("RecipientName" , oClaimantContext[Constant.EntitiesFields.NAME]);
            oAction.setParameter("Action" , oApproverContext.Action);
            //oAction.setParameter("ReceiverEmail" , oApproverContext.ReceiverEmail);
            // hardcode email address for testing purposes. If need to test, set ReceiverEmail to your email, comment out once done
            oAction.setParameter("ReceiverEmail" , "reuben.lai@my.ey.com");
            //oAction.setParameter("NextApproverName" , oApproverContext.NextApproverName);

            await oAction.execute();
        }
        
        
    }
    catch(oError){
        MessageToast.show(Utility.getText("msg_failed_generic_error", [oError]));
    }
}

module.exports = { sendEmailToClaimant }