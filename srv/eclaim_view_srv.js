// srv/eclaim_view_srv.js
const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {
  // Ensure attaching to the right service
  if (this.name !== 'ECLAIM_VIEW_SRV') return;

  // Unbound action handler: POST /odata/v4/eclaim-view-srv/sendClaim
  this.on('sendClaim', async (req) => {
    try {
  
const row = req.data; // flat params from UI

    // Build the expected structure
    const payload = {
      ZEMP_CLAIMS_DETAILS: [
        {
          CLAIM_ID: row.CLAIM_ID,
          EMP_ID: row.EMP_ID,
          LAST_MODIFIED_DATE: row.LAST_MODIFIED_DATE,
          SUBMITTED_DATE: row.SUBMITTED_DATE,
          FINAL_AMOUNT_TO_RECEIVE: row.FINAL_AMOUNT_TO_RECEIVE,
          CLAIM_SUB_ID: row.CLAIM_SUB_ID,
          RECEIPT_DATE: row.RECEIPT_DATE,
          AMOUNT: row.AMOUNT,
          COST_CENTER: row.COST_CENTER,
          GL_ACCOUNT: row.GL_ACCOUNT,
          MATERIAL_CODE: row.MATERIAL_CODE
        }
      ]
    };

    const IS = await cds.connect.to('IS_NonProd_Conn');

    await IS.send({
      method: 'POST',
      path: '/http/ApprovedClaims_SF_DEV', 
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    return { success: true, message: "Forwarded to IS with correct structure" };

  } catch (e) {
    return req.error(500, `IS call failed: ${e.message}`);
  }
});

});