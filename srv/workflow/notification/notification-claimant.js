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
        const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
        if(!oHeaderContext){
            return false;
        }
        
        // Retrieve Claimant Context
        const oClaimantContext = await retrieveEmployeeDetails(oHeaderContext[Constant.EntitiesFields.EMP_ID]);    
        if(!oClaimantContext) {
            return false;
        }

        //Retrieve Approver Context
        if(sApproverId === Constant.Role.AUTO) {
            sApproverName = sApproverId;
        }
        else {
            const oApproverContext = await retrieveEmployeeDetails(sApproverId);
            if(!oApproverContext) {
                return false;
            }
            sApproverName = oApproverContext[Constant.EntitiesFields.NAME];
        }
        
        let oEmailPayload = null;    

        // Generate Email Payload
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
        const oResponse = await sendEmailViaSAPIS(oEmailPayload);
        return true;
    }
    catch(oError){
        return false;
    }    
}

module.exports = { sendEmailToClaimant }