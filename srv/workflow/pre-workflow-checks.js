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
    performBudgetChecking,
    generateReturnMessage
} = require("./workflow-helper");

/**
 * startWorkflow steps 1-5: eligibility check, budget locking, workflow
 * determination, approver determination, and approver detail persistence.
 *
 * On failure, rolls back the transaction and returns a generateReturnMessage
 * object (Success: false) instead of throwing, so the frontend can read
 * oResponse.Area / oResponse.Message directly.
 * On success, returns { oWorkflowContext, aApproversContext, aApproversContextNew }.
 *
 * @param {object} oTx - the cds transaction (cds.tx(req))
 * @param {string} sId - claim/request id
 * @param {object} oDescriptor - result of resolveDocDescriptor(sId)
 * @returns {Promise<object>} either the success context object, or a generateReturnMessage failure object
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
                return generateReturnMessage(false, sId, Constant.WorkflowArea.ELIGIBILITY_CHECKING, aEligibilityResult, false);
            }
        } catch (oError) {
            await oTx.rollback();
            return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, `Error encountered during submission eligibility checking: ${oError.message}`, false);
        }
    }

    // 2. Budget Locking (return full list of claim type item that failed)
    let aBudgetContext, aBudgetCheckReturn;
    try {
        aBudgetContext = await retrieveBudgetContext(sId, oDescriptor, Constant.BudgetProcessingAction.SUBMIT);
        aBudgetCheckReturn = await performBudgetChecking(oTx, aBudgetContext);

        const oInvalidBudget = aBudgetCheckReturn.find(r => r.STATUS === Constant.BudgetCheckStatus.NOT_FOUND || r.STATUS === Constant.BudgetCheckStatus.INSUFFICIENT);
        if (oInvalidBudget) {
            await oTx.rollback();
            return generateReturnMessage(false, sId, Constant.WorkflowArea.BUDGET_CHECKING, aBudgetCheckReturn, false);
        }
    } catch (oError) {
        await oTx.rollback();
        return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, `Error encountered during submission budget checking: ${oError.message}`, false);
    }

    // 3. Determine workflow
    let oWorkflowContext;
    try {
        oWorkflowContext = await determineWorkflow(oTx, sId);

        if (!oWorkflowContext) {
            await oTx.rollback();
            return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `No workflow rule matched for ${sId}`, false);
        }
    } catch (oError) {
        await oTx.rollback();
        return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, `Error encountered during Workflow Determination: ${oError.message}`, false);
    }

    // 4. Determine approvers and substitutes
    let aApproversContext;
    try {
        aApproversContext = await determineApprovers(oTx, sId, oWorkflowContext);

        if (!aApproversContext?.length) {
            await oTx.rollback();
            return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `No approvers determined for ${sId}`, false);
        }
    } catch (oError) {
        await oTx.rollback();
        return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, `Error encountered during Approver Determination: ${oError.message}`, false);
    }

    // 5. Populate ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL table
    const aApproversContextNew = setApproversContext(oDescriptor, sId, aApproversContext);
    if (!aApproversContextNew?.length) {
        await oTx.rollback();
        return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_DETERMINATION, `Error encountered during Approver Normalization for ${sId}`, false);
    }

    try {
        await deleteApproverDetails(oDescriptor.entityApprovers, oDescriptor.approverIdField, sId, oTx);
        await insertRecords(oDescriptor.entityApprovers, aApproversContextNew, oTx);
    } catch (oError) {
        await oTx.rollback();
        return generateReturnMessage(false, sId, Constant.WorkflowArea.WORKFLOW_GENERAL, `Error encountered while saving approver details: ${oError.message}`, false);
    }

    return { oWorkflowContext, aApproversContext, aApproversContextNew };
}

module.exports = { runPreWorkflowChecks };