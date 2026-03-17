const cds = require('@sap/cds');

module.exports = (srv) => {
  if (srv.name !== 'ECLAIM_VIEW_SRV') return;

  console.log(">>> Handlers loaded for ECLAIM_VIEW_SRV");

  srv.on('sendApprovedClaimBatch', async (req) => {
    try {
      const ISservice = await cds.connect.to('IS_NonProd_Conn');

      const batch = req.data.batch || {};
      const { ClaimID, Items } = batch;

      if (!ClaimID || !Array.isArray(Items) || Items.length === 0) {
        return req.error(400, "Invalid batch payload: missing ClaimID or empty Items");
      }

      // Forward the single consolidated payload to IS
      const res = await ISservice.send({
        method: 'POST',
        path: "/http/ApprovedClaims_SF_DEV",  
        data: {
          CLAIM_ID: ClaimID,
          ITEMS: Items.map(i => ({
            CLAIM_SUB_ID:            i.ClaimSubID,
            EMP_ID:                  i.EmpID,
            SUBMITTED_DATE:          i.SubmissionDate,
            FINAL_AMOUNT_TO_RECEIVE: i.FinalAmounttoReceive,
            LAST_MODIFIED_DATE:      i.LastModifiedDate,
            AMOUNT:                  i.Amount,
            RECEIPT_DATE:            i.ReceiptDate,
            COST_CENTER:             i.CostCenter,
            GL_ACCOUNT:              i.GLAccount,
            MATERIAL_CODE:           i.MaterialCode
          }))
        }
      });

      return { message: "Approved claim batch sent", res };

    } catch (e) {
      req.error(500, `sendApprovedClaimBatch failed: ${e?.message || e}`);
    }
  });
};