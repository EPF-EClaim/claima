sap.ui.define([
    "./Utility",
    "./budgetCheck"
],
function (Utility, budgetCheck){
    "use strict";

    return {
        onFinalApprove: function(req) {
            // Create instance of file to call function
            // var oUpdateStatus = new Utility();
            // oUpdateStatus._updateStatus();

            // Call Update Status
            Utility._updateStatus();

            // Call Budget Processing

            const oModel = this.getOwnerComponent().getModel();
            const dataset = (req.data);

            budgetCheck.budgetProcessing( oModel, dataset, 'CLM', 'approve' );

            // Call Farisha email Function
            

            // Call Pass Approval Claims to SAP IS


        }

    };

    


});