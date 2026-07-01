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
            CASH_ADVANCE_AMOUNT:     oItem.CashAdvanceAmount,
            LAST_MODIFIED_DATE:      oItem.LastModifiedDate,
            AMOUNT:                  oItem.Amount,
            RECEIPT_DATE:            oItem.ReceiptDate,
            COST_CENTER:             oItem.CostCenter,
            GL_ACCOUNT:              oItem.GLAccount,
            MATERIAL_CODE:           oItem.MaterialCode,
            INTERNAL_ORDER:          oItem.InternalOrder
        }));
      const oResponse = await ISservice.send({
        method: 'POST',
        path: "/http/ApprovedClaim",  
        data: { 
          ZEMP_CLAIMS_DETAILS: sData
        }
      });

      return { message: "Approved claim batch sent", oResponse };

    } catch (e) {
        await createErrorLog(req, e);
        req.error(500, `sendApprovedClaimBatch failed: ${e?.message || e}`);
    }
  });

  async function createErrorLog(req, e){
    try{
      const tx = cds.tx(req);
      await tx.run(
        INSERT.into('ZLOG_TEMP').entries({
            TIMESTAMP: new Date(),
            RECORD_ID: req.data?.batch?.ClaimID,
            MESSAGE_TYPE: "",
            STATUS_CODE: e.status || e.code || "",
            MESSAGE: e.message
        })
      );
    }catch(oError){
      console.error("Failed to write error log:", oError);
    }
  }
};