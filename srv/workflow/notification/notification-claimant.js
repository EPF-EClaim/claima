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

async function sendEmailToClaimant(sId, sApproverId, oDescriptor, sAction, sComments = null, sRejectionReason = null) {
    try{  
        // Initialize variables
        // For email to claimant, submitted date should take current date as the action has already been performed, and this email is to notify the claimant of the action taken
        let sSubmittedDate = new Date().toISOString().split('T')[0];

        let sApproverName = "";
    // Retrieve Header context
        console.log("Retrieving header context for document: ", sId);
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

        //Retrieve Approver Context
        console.log("Retrieving approver context for employee: ", sApproverId); 
        if(sApproverId === Constant.Role.AUTO) {
            sApproverName = sApproverId;
        }
        else {
            const oApproverContext = await retrieveEmployeeDetails(sApproverId);
            if(!oApproverContext) {
                console.log(`No approver context found for employee ${sApproverId}`);
                return false;
            }
            sApproverName = oApproverContext[Constant.EntitiesFields.NAME];
        }
        
        let oEmailPayload = null;    

        // Generate Email Payload  
        console.log("Generating email payload for claimant notification...");
        oEmailPayload = generateEmailPayload(
            sApproverName,
            sSubmittedDate,
            oClaimantContext[Constant.EntitiesFields.NAME],
            oHeaderContext[oDescriptor.entityTypeDescField],
            sId,
            oClaimantContext[Constant.EntitiesFields.NAME],
            sAction,
            oClaimantContext[Constant.EntitiesFields.EMAIL],
            sComments,
            sRejectionReason
        )
        console.log("Generated email payload: ", oEmailPayload);
        const oResponse = await sendEmailViaSAPIS(oEmailPayload);
        console.log(oResponse);
        return true;
    }
    catch(oError){
        console.log("Email sending failed with error: ", oError);
        return false;
    }    
}

module.exports = { sendEmailToClaimant }