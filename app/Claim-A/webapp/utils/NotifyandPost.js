// claima/utils/NotifyAndPost.js
sap.ui.define([], function () {
  "use strict";

  async function sendEmailClaimant(oModel, emailPayload) {
    const p = JSON.parse(JSON.stringify(emailPayload));
    const oAction = oModel.bindContext("/sendEmail(...)");
    oAction.setParameter("ApproverName", p.ApproverName);
    oAction.setParameter("SubmissionDate", p.SubmissionDate);
    oAction.setParameter("ClaimantName", p.ClaimantName);
    oAction.setParameter("ClaimType", p.ClaimType);
    oAction.setParameter("ClaimID", p.ClaimID);
    oAction.setParameter("RecipientName", p.RecipientName || p.ClaimantName);
    oAction.setParameter("Action", p.Action);
    oAction.setParameter("ReceiverEmail", p.ReceiverEmail);

    await oAction.execute();
    return true;
  }

  
 async function sendApprovedClaimBatch(oModelView, ClaimID, items) {
    // items must be in the ApprovedClaimItem[] shape
    const oAction = oModelView.bindContext("/sendApprovedClaimBatch(...)");
    oAction.setParameter("batch", { ClaimID, Items: items });
    await oAction.execute();
    return true;
  }

  return {
    sendEmailClaimant,
    sendApprovedClaimBatch
  };
})
