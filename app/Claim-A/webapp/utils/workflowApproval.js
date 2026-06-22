sap.ui.define([
    "claima/utils/FinalApproveStep",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/FilterOperator",
	"claima/utils/Constants",
    "claima/utils/WorkflowApproverHelper",
    "claima/utils/Utility",
    "claima/utils/DateUtility",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox"
], function (FinalApproveStep, Filter, MessageToast,FilterOperator,Constants, WorkflowApproverHelper, Utility, DateUtility, BusyIndicator, MessageBox) {
    "use strict";

    return {
        //Aiman Added for MyApproval
        onSendEmailApprover: async function (oModel, aPayload){
            
            const aStringifyPayload = JSON.stringify(aPayload);
            const aParsePayload = JSON.parse(aStringifyPayload);

            const oAction = oModel.bindContext("/sendEmail(...)");
            oAction.setParameter("ApproverName" , aParsePayload.ApproverName);
            oAction.setParameter("SubmissionDate" , aParsePayload.SubmissionDate);
            oAction.setParameter("ClaimantName" , aParsePayload.ClaimantName);
            oAction.setParameter("ClaimType" , aParsePayload.ClaimType);
            oAction.setParameter("ClaimID" , aParsePayload.ClaimID);
            oAction.setParameter("RecipientName" , aParsePayload.RecipientName);
            oAction.setParameter("Action" , aParsePayload.Action);
            oAction.setParameter("ReceiverEmail" , aParsePayload.ReceiverEmail);
            oAction.setParameter("NextApproverName" , aParsePayload.NextApproverName);
            oAction.setParameter("RejectReason" , aParsePayload.RejectReason);
            oAction.setParameter("ApproverComments" , aParsePayload.ApproverComments);

            oAction.execute();

		},
        onProcessApproval: async function(oModel, oRequestData) {
            let oResponse = null;
            const oAction = oModel.bindContext("/processApproval(...)");
            oAction.setParameter("request", {
                Id              : oRequestData.Id,
                UserId          : oRequestData.UserId,
                ApproverAction  : oRequestData.ApproverAction,
                Comments        : oRequestData.Comments,
                RejectionReason : oRequestData.RejectionReason
            })

            try {
                await oAction.execute();
                const oContext = oAction.getBoundContext();
                oResponse = await oContext.requestObject();
            } catch (oError) {
                MessageBox.error(oError.message);
                return false;
            } finally {
                BusyIndicator.hide();
            }
            
            console.log(oResponse);
            return oResponse
        },

        onApproverDetermination: async function (oModel, sId){
			// claim header

            // Call CAP action to update header table

            let oResponse = null;
            const oAction = oModel.bindContext("/startWorkflow(...)");
            oAction.setParameter("id", sId,);
            

            try {
                await oAction.execute();
                const oContext = oAction.getBoundContext();
                oResponse = await oContext.requestObject();
            } catch (oError) {
                MessageBox.error(oError.message);
                return false;
            } finally {
                BusyIndicator.hide();
            }
            
            console.log(oResponse);
            return oResponse
        },
    }    
});

    
