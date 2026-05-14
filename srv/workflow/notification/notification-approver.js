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
    try{ 
        // Retrieve Header context
        const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
        if(!oHeaderContext){
            console.log(`No header context found for document ${sId}`);
            return false;
        }
        console.log(oHeaderContext);
        // Retrieve Claimant Context
        const oClaimantContext = await retrieveEmployeeDetails(oHeaderContext[Constant.EntitiesFields.EMP_ID]);    
        if(!oClaimantContext) {
            console.log(`No claimant context found for employee ${oHeaderContext[Constant.EntitiesFields.EMP_ID]}`);
            return false;
        }
        let oEmailPayload = null;
       
        for(const oApproverContext of aApproversContext){
            if(oApproverContext.LEVEL = sLevel) {
                oEmailPayload = generateEmailPayload(
                    oApproverContext.APPROVER_NAME,
                    oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE],
                    oClaimantContext[Constant.EntitiesFields.NAME],
                    oHeaderContext[oDescriptor.entityTypeDescField],
                    sId,
                    oApproverContext.APPROVER_NAME,
                    sAction,
                    "reuben.lai@my.ey.com"
                )
                sendEmailViaSAPIS(oEmailPayload);
                if(oApproverContext.SUB_NAME) {
                    oEmailPayload = generateEmailPayload(
                        oApproverContext.SUB_NAME,
                        oHeaderContext[Constant.EntitiesFields.SUBMITTED_DATE],
                        oClaimantContext[Constant.EntitiesFields.NAME],
                        oHeaderContext[oDescriptor.entityTypeDescField],
                        sId,
                        oApproverContext.SUB_NAME,
                        sAction,
                        "reuben.lai@my.ey.com"
                    )
                    sendEmailViaSAPIS(oEmailPayload);
                }
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