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

async function sendEmailToClaimant(oTx, aApproversContext, sId, oDescriptor, sAction) {

    // Retrieve Header context
    const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
    if(!oHeaderContext){
        return null;
    }
    
    // Retrieve Claimant Context
    const oClaimantContext = await retrieveEmployeeDetails(oTx, oHeaderContext[Constant.EntitiesFields.EMP_ID]);    
    if(!oClaimantContext) {
        return null;
    }
    let oEmailPayload = null;
    
    try{    
        for(const oApproverContext of aApproversContext){
            oEmailPayload = generateEmailPayload(
                oApproverContext.APPROVER_NAME,
                oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE],
                oClaimantContext[Constant.EntitiesFields.NAME],
                oHeaderContext[oDescriptor.entityTypeDescField],
                sId,
                oClaimantContext[Constant.EntitiesFields.NAME],
                sAction,
                "reuben.lai@my.ey.com"
            )
            return sendEmailViaSAPIS(oEmailPayload);
        }
    }
    catch(oError){
        return null;
    }    
}

module.exports = { sendEmailToClaimant }