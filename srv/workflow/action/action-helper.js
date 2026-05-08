const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");

async function updateApproverDetailsTable(sId, sAction, oTx, oDescriptor, sComments, sRejectionReason) {
    // Check for action type
    // If action type is REJECT / PUSH BACK, check rejection reason and comment
}
async function verifyCorrectApproverForAction(sId, sUserId, oDescriptor) {

}
async function checkFinalLevelApproverStatus(sId, oDescriptor) {

}
modules.export = {
    updateApproverDetailsTable,
    verifyCorrectApproverForAction,
    checkFinalLevelApproverStatus
};