// claima/utils/NotifyAndPost.js
sap.ui.define([], function () {
  "use strict";

  async function sendEmailClaimant(oModel, oEmailPayload) {
    const oPayload = JSON.parse(JSON.stringify(oEmailPayload));
    const oAction = oModel.bindContext("/sendEmail(...)");
    oAction.setParameter("ApproverName", oPayload.ApproverName);
    oAction.setParameter("SubmissionDate", oPayload.SubmissionDate);
    oAction.setParameter("ClaimantName", oPayload.ClaimantName);
    oAction.setParameter("ClaimType", oPayload.ClaimType);
    oAction.setParameter("ClaimID", oPayload.ClaimID);
    oAction.setParameter("RecipientName", oPayload.ClaimantName);
    oAction.setParameter("Action", oPayload.Action);
    oAction.setParameter("ReceiverEmail", oPayload.ReceiverEmail);

    await oAction.execute();
    return true;
  }

  
 async function sendApprovedClaimBatch(oModelView, sClaimID, aClaimItems) {
    // items must be in the ApprovedClaimItem[] shape
    const oAction = oModelView.bindContext("/sendApprovedClaimBatch(...)");
    oAction.setParameter("batch", { 
            ClaimID: sClaimID,
            Items: aClaimItems
   });
    await oAction.execute();
    return true;
  }

  return {
    sendEmailClaimant,
    sendApprovedClaimBatch
  };
})
