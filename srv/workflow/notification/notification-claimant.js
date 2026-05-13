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

async function sendEmailToClaimant(sId, oDescriptor, sAction) {

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
    
    try{    
        oEmailPayload = generateEmailPayload(
            oClaimantContext.NAME,
            oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE],
            oClaimantContext[Constant.EntitiesFields.NAME],
            oHeaderContext[oDescriptor.entityTypeDescField],
            sId,
            oClaimantContext[Constant.EntitiesFields.NAME],
            sAction,
            "reuben.lai@my.ey.com"
        )
        sendEmailViaSAPIS(oEmailPayload);
        return true;
    }
    catch(oError){
        return false;
    }    
}

module.exports = { sendEmailToClaimant }