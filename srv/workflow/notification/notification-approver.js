const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");
const {
    retrieveHeaderDetails,
    retrieveEmployeeDetails
} = require("../workflow-helper");
const {
    generateEmailPayload,
    sendEmailViaSAPIS
} = require("./notification-helper");

async function sendEmailToApprover(aApproversContext, sId, oDescriptor, sAction, sLevel = 1) {    
    console.log(`Preparing to send email to approver(s) for document ${sId} at level ${sLevel} with action ${sAction}`);
    let oResponse = null;
    try{

        // Initialize variables
        // For submitted date should take current date as the action has already been performed, and this email is to notify the claimant of the action taken
        let sSubmittedDate = new Date().toISOString().split('T')[0];

        // Retrieve Header context
        console.log
        const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
        if(!oHeaderContext){
            console.log(`No header context found for document ${sId}`);
            return false;
        }
        // Retrieve Claimant Context
        console.log("Retrieving claimant context for employee: ", oHeaderContext[Constant.EntitiesFields.EMP_ID]);
        const oClaimantContext = await retrieveEmployeeDetails(oHeaderContext[Constant.EntitiesFields.EMP_ID]);    
        if(!oClaimantContext) {
            console.log(`No claimant context found for employee ${oHeaderContext[Constant.EntitiesFields.EMP_ID]}`);
            return false;
        }
        let oEmailPayload = null;
       
        console.log(`Looping through approvers context to send email for document ${sId} at level ${sLevel} with action ${sAction}`);
        for(const oApproverContext of aApproversContext){
            if(oApproverContext.LEVEL = sLevel) {
                oEmailPayload = generateEmailPayload(
                    oApproverContext.APPROVER_NAME,
                    sSubmittedDate,
                    oClaimantContext[Constant.EntitiesFields.NAME],
                    oHeaderContext[oDescriptor.entityTypeDescField],
                    sId,
                    oApproverContext.APPROVER_NAME,
                    sAction,
                    oApproverContext.APPROVER_EMAIL
                )
                console.log("Generated email payload approver: ", oEmailPayload);
                oResponse = await sendEmailViaSAPIS(oEmailPayload);
                console.log(oResponse);
                if(oApproverContext.SUB_NAME) {
                    oEmailPayload = generateEmailPayload(
                        oApproverContext.SUB_NAME,
                        sSubmittedDate,
                        oClaimantContext[Constant.EntitiesFields.NAME],
                        oHeaderContext[oDescriptor.entityTypeDescField],
                        sId,
                        oApproverContext.SUB_NAME,
                        sAction,
                        oApproverContext.SUB_EMAIL
                    )
                    console.log("Generated email payload sub: ", oEmailPayload);
                    oResponse = await sendEmailViaSAPIS(oEmailPayload);
                    console.log(oResponse);
                }
                return true;
            }
        }
        return true;
    }
    catch(oError){
        console.log("Email sending failed with error: ", oError);
        return false;
    }
    
}

module.exports = { sendEmailToApprover }