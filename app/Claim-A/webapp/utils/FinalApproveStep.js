sap.ui.define([
    "./Utility",
    "./budgetCheck"
],
function (Utility, budgetCheck){
    "use strict";

    return {
        onFinalApprove: function(oModel, req) {
            // Create instance of file to call function
            // var oUpdateStatus = new Utility();
            // oUpdateStatus._updateStatus();
            // const oModel = this.getOwnerComponent().getModel();
            // Call Update Status
            Utility._updateStatus(oModel);

            // Call Budget Processing

            
            const dataset = (req.data);

            // split front 3 letters to determine if claim or request
            const submission_type = req.claimid.substring(0,3);

            budgetCheck.budgetProcessing( oModel, dataset, submission_type, 'approve' );
            // Call Farisha email Function


            // Call Pass Approval Claims to SAP IS


        }

    };

    


});