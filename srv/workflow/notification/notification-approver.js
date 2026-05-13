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

    // Retrieve Header context
    const oHeaderContext = await retrieveHeaderDetails(sId, oDescriptor);
    if(!oHeaderContext){
        return null;
    }
    console.log(oHeaderContext);
    // Retrieve Claimant Context
    const oClaimantContext = await retrieveEmployeeDetails(oHeaderContext[Constant.EntitiesFields.EMP_ID]);    
    if(!oClaimantContext) {
        return false;
    }
    let oEmailPayload = null;
    
    try{    
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
        return false;
    }
    
}

module.exports = { sendEmailToApprover }