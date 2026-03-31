const cds = require('@sap/cds');

module.exports = (srv) => {
  if (srv.name !== 'ECLAIM_VIEW_SRV') return;

  srv.on('sendApprovedClaimBatch', async (req) => {
    try {
      const ISservice = await cds.connect.to('IS_Conn');

      const oBatch = req.data.batch || {};
      const { ClaimID, Items } = oBatch;

      if (!ClaimID || !Array.isArray(Items) || Items.length === 0) {
        return req.error(400, "Invalid batch payload: missing ClaimID or empty Items");
      }

      // Forward the single consolidated payload to IS

      const sData = 
        Items.map(oItem => ({
            CLAIM_ID:                oItem.ClaimID,
            CLAIM_SUB_ID:            oItem.ClaimSubID,
            EMP_ID:                  oItem.EmpID,
            SUBMITTED_DATE:          oItem.SubmissionDate,
            FINAL_AMOUNT_TO_RECEIVE: oItem.FinalAmounttoReceive,
            LAST_MODIFIED_DATE:      oItem.LastModifiedDate,
            AMOUNT:                  oItem.Amount,
            RECEIPT_DATE:            oItem.ReceiptDate,
            COST_CENTER:             oItem.CostCenter,
            GL_ACCOUNT:              oItem.GLAccount,
            MATERIAL_CODE:           oItem.MaterialCode
        }));
      const oResponse = await ISservice.send({
        method: 'POST',
        path: "/http/ApprovedClaims_SF",  
        data: { 
          ZEMP_CLAIMS_DETAILS: sData
        }
        });

      return { message: "Approved claim batch sent", oResponse };

    } catch (e) {
      req.error(500, `sendApprovedClaimBatch failed: ${e?.message || e}`);
    }
  });
};