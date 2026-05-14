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
    try{  
    // Retrieve Header context
        const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
        if(!oHeaderContext){
            console.log(`No header context found for document ${sId}`);
            return false;
        }
        
        // Retrieve Claimant Context
        const oClaimantContext = await retrieveEmployeeDetails(oHeaderContext[Constant.EntitiesFields.EMP_ID]);    
        if(!oClaimantContext) {
            console.log(`No claimant context found for employee ${oHeaderContext[Constant.EntitiesFields.EMP_ID]}`);
            return false;
        }
        let oEmailPayload = null;      
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