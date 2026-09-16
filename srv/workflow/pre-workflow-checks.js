const { Constant } = require("../utils/constant");
const {
    onEligibilityCheck,
    generateEligibilityPayload
} = require("../utils/EligibilityScenarios/EligibleScenarioCheck");
const {
    determineWorkflow
} = require("./determination/determination-workflow");
const {
    determineApprovers
} = require("./determination/determination-approver");
const {
    setApproversContext,
    deleteApproverDetails,
    insertRecords
} = require("./determination/determination-helper");
const {
    retrieveBudgetContext,
    performBudgetChecking
} = require("./workflow-helper");

/**
 * startWorkflow steps 1-5: eligibility check, budget locking, workflow
 * determination, approver determination, and approver detail persistence.
 *
 * Every failure path here rolls back the transaction and throws - none
 * of them return a soft { bStatus: false, ... } message - so the caller
 * only needs a single try/catch around the call, instead of inspecting a
 * mix of thrown errors and returned failure objects.
 *
 * @param {object} oTx - the cds transaction (cds.tx(req))
 * @param {string} sId - claim/request id
 * @param {object} oDescriptor - result of resolveDocDescriptor(sId)
 * @returns {Promise<{ oWorkflowContext: object, aApproversContext: object[], aApproversContextNew: object[] }>}
 * @throws {Error} on any failure - oTx.rollback() is called before throwing
 */
async function runPreWorkflowChecks(oTx, sId, oDescriptor) {
    // 1. Eligibility Checking (Claim only, upon submission)
    if (oDescriptor.entityPrefix === Constant.WorkflowType.CLAIM) {
        try {
            const aEligibilityPayload = await generateEligibilityPayload(sId, oTx);
            const aEligibilityResult = aEligibilityPayload.length
                ? await onEligibilityCheck(aEligibilityPayload, oTx)
                : [];
            const bEligible = aEligibilityResult.every(oPayload =>
                (oPayload.CheckFields || []).every(oField => oField.result === true || oField.result === null)
            );
            if (!bEligible) {
                await oTx.rollback();
                throw new Error(`Eligibility check failed for ${sId}`);
            }
        } catch (error) {
            await oTx.rollback();
            throw new Error(`Error encountered during submission eligibility checking: ${error.message}`);
        }
    }

    // 2. Budget Locking (return full list of claim type item that failed)
    let aBudgetContext, aBudgetCheckReturn;
    try {
        aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, Constant.BudgetProcessingAction.SUBMIT);
        aBudgetCheckReturn = await performBudgetChecking(oTx, aBudgetContext);
    } catch (error) {
        await oTx.rollback();
        throw new Error(`Error encountered during Budget Locking: ${error.message}`);
    }

    const oInvalidBudget = aBudgetCheckReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND || r.STATUS === Constant.BudgetCheckStatus.INSUFFICIENT);
    if (oInvalidBudget) {
        await oTx.rollback();
        throw new Error(`Budget check failed for ${sId}`);
    }

    // 3. Determine workflow
    let oWorkflowContext;
    try {
        oWorkflowContext = await determineWorkflow(oTx, sId);
    } catch (error) {
        await oTx.rollback();
        throw new Error(`Error encountered during Workflow Determination: ${error.message}`);
    }
    if (!oWorkflowContext) {
        await oTx.rollback();
        throw new Error(`No workflow rule matched for ${sId}`);
    }

    // 4. Determine approvers and substitutes
    let aApproversContext;
    try {
        aApproversContext = await determineApprovers(oTx, sId, oWorkflowContext);
    } catch (error) {
        await oTx.rollback();
        throw new Error(`Error encountered during Approver Determination: ${error.message}`);
    }
    if (!aApproversContext?.length) {
        await oTx.rollback();
        throw new Error(`No approvers determined for ${sId}`);
    }

    // 5. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
    const aApproversContextNew = setApproversContext(oDescriptor, sId, aApproversContext);
    if (!aApproversContextNew?.length) {
        await oTx.rollback();
        throw new Error(`Error encountered during Approver Normalization for ${sId}`);
    }

    try {
        await deleteApproverDetails(oDescriptor.entityApprovers, oDescriptor.approverIdField, sId, oTx);
        await insertRecords(oDescriptor.entityApprovers, aApproversContextNew, oTx);
    } catch (error) {
        await oTx.rollback();
        throw new Error(`Error encountered while saving approver details: ${error.message}`);
    }

    return { oWorkflowContext, aApproversContext, aApproversContextNew };
}

module.exports = { runPreWorkflowChecks };