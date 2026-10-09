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
    let oResponse = null;
    try{

        // Initialize variables
        // For submitted date should take current date as the action has already been performed, and this email is to notify the claimant of the action taken
        let sSubmittedDate = new Date().toISOString().split('T')[0];

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
        let oEmailPayload = null;
       
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
                oResponse = await sendEmailViaSAPIS(oEmailPayload);
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
                    oResponse = await sendEmailViaSAPIS(oEmailPayload);
                }
                return true;
            }
        }
        return true;
    }
    catch(oError){
        return false;
    }
    
}

module.exports = { sendEmailToApprover }