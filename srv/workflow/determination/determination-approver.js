const cds = require('@sap/cds')
const { SELECT } = require('@sap/cds/lib/ql/cds-ql')
const { Constant } = require("../../utils/constant");
const {
    resolveDocDescriptor,
    determineWorkflowStepContext,
    retrieveRoleRank,
    retrieveHeaderDetails,
    retrieveEmployeeDetails,
    retrieveFromConstantTable,
    retrieveApprover,
    retrieveBudgetDetails
} = require('./determination-helper');

async function runApproverDetermination(oTx, sId, oWorkflowStepContext, oDescriptor) {
    // Variable declarations for Approver Determination logic
    let oCurrOutcome = null;        // Variable to store current outcome ROLE and RANK
    let oPrevOutcome = null;        // Variable to store previous outcome ROLE and RANK
    let iApproverRank = 0;          // Variable to store approver rank to retrieve
    let oApproverDetails = null;    // Variable to store approver details 
    let aApproversDetails = [];      // Variable to store multiple approvers
    let oBudgetDetails = null;      // Variable to store budget approver details (If applicable)
    let aConstantValues = [];       // Variable to store EEID retrieved from ZCONSTANTS table
    let oPopulatedEmployee = null;  // Variable to store populated Employee
    let aWorkflowApprStep = [];
    const sSystemDate = new Date();
    const sSystemYear = new Date(sSystemDate).getFullYear();
    const aRoleRanks = await retrieveRoleRank(oTx);
    const oHeader = await retrieveHeaderDetails(oTx, sId, oDescriptor)
    const sFinalCC = oHeader[Constant.EntitiesFields.COST_CENTER] ?? oHeader[Constant.EntitiesFields.ALTERNATE_COST_CENTER] ?? null;
    const oClaimantDetails = await retrieveEmployeeDetails(oTx, oHeader[Constant.EntitiesFields.EMP_ID], );
    console.log(oClaimantDetails);
    const sLevels = Number(oWorkflowStepContext.WORKFLOW_APPROVAL_LEVELS) || 0;
    const sWorkflowName = oWorkflowStepContext.WORKFLOW_NAME;
    const aFIDep = await retrieveFromConstantTable(oTx, 'FI_DEP');
    const sFIDep = aFIDep[0].VALUE;
    console.log(sFIDep);
    if(sLevels > 1){
        aWorkflowApprStep = sWorkflowName.split("-").map(s => s.trim());
    }else{
        aWorkflowApprStep = sWorkflowName.trim();
    }
    console.log("Start Determination");
    for(const [iIndex, oWorkflowApprStep] of aWorkflowApprStep.entries){

        // Start of Approver Determination logic

        // If claimant is in the same department as JKEW, HOD_JKEW will be considered as HOD and go thru the standard approver determination logic
        if(oClaimantDetails.DEP === sFIDep && oWorkflowApprStep === Constant.Role.HOD_JKEW){
            oWorkflowApprStep = Constant.Role.HOD;
        }

        // Populate current role rank
        oCurrOutcome = aRoleRanks.find(r => r.ROLE === oWorkflowApprStep);

            // Check if claimant is CEO
        // If yes, approver for CEO is CEO_FI
        if(oCurrOutcome != null && oClaimantDetails.ROLE === Constant.Role.CEO){
            oWorkflowApprStep = Constant.Role.CEO_FI;
            oCurrOutcome = null;
        }        
        
        if(oCurrOutcome == null){
            // Block to check for Special Approver within ZCONSTANTS table and budget approver
            switch(oWorkflowApprStep){
                case Constant.Role.BUDGET:  
                    if(sFinalCC){
                        oBudgetDetails = await retrieveBudgetDetails(oTx, sFinalCC, sSystemYear);
                        if(!oBudgetDetails){
                            MessageToast.show(Utility.getText("msg_failed_no_budget"));
                            return false;
                        }else{
                            oApproverDetails = await WorkflowApproverHelper.getEmployeeDetails(oModel, oBudgetDetails.BUDGET_OWNER_ID);
                            oPopulatedEmployee = this._populateApproverDetails(oApproverDetails, iIndex);
                            if(oPopulatedEmployee){
                                oApproversDetails.push(oPopulatedEmployee);
                            }
                        }
                    }else{
                        MessageToast.show(Utility.getText("msg_failed_no_cost_center"));
                        return false;
                    }
                    break;
                case Constant.Role.CEO_FI:
                case Constant.Role.CASH_FI:
                case Constant.Role.FI_SETTLEMENT_A:
                case Constant.Role.FI_SETTLEMENT_B:
                case Constant.Role.HOD_JKEW:
                    // Possible multiple approvers retrieved from ZCONSTANTS table
                    aConstantValues = await retrieveFromConstantTable(oTx, oWorkflowApprStep);
                    if(aConstantValues.length){
                        for(const oId of aConstantValues){
                            if(oId.VALUE){
                                oApproverDetails = await retrieveEmployeeDetails(oTx, oId.VALUE);
                                //oPopulatedEmployee = this._populateApproverDetails(oApproverDetails, i);
                                //if(oPopulatedEmployee){
                                //    aApproversDetails.push(oPopulatedEmployee);
                                //}else{
                                //    MessageToast.show(Utility.getText("msg_failed_no_approver_details", [id.VALUE]));
                                //    return false;
                                //}
                            }else{
                                //MessageToast.show(Utility.getText("msg_failed_no_approver"));
                                return null;
                            }
                        }
                    }
                    break;
                default:
            }
        }
        else{
            if(oClaimantDetails[Constant.EntitiesFields.RANK] < oCurrOutcome[Constant.EntitiesFields.RANK]){
                iApproverRank = oCurrOutcome[Constant.EntitiesFields.RANK];
            }
            else{
                iApproverRank = oClaimantDetails[Constant.EntitiesFields.RANK] + 1;
            }
            // Retrieve Approver based on iApproverRank
            oApproverDetails = await retrieveApprover(oTx, oClaimantDetails[Constant.EntitiesFields.EEID], iApproverRank);
            if(oApproverDetails){
                    oPopulatedEmployee = this._populateApproverDetails(oApproverDetails, i);
                if(oPopulatedEmployee){
                    aApproversDetails.push(oPopulatedEmployee);
                }
            }else{
                // Placeholder for error handling
            }
            
        } 

        // Check if approver is found. If approver not found, do not store approver rank and current outcome
        if(oApproverDetails){
            iApproverRank = Number(oApproverDetails.RANK);                    
            oPrevOutcome = oCurrOutcome;
        }
    }

    return aApproversDetails;
}



async function determineApprovers(oTx, sId, oWorkflowContext) {

    //1. Retrieve Workflow Step from Workflow Context
    //2. Check if Workflow Step is AUTO. If yes, populate ApproverContext
    //3. If Workflow Step is not AUTO, retrieve claimant details (department | role | direct superior)
    //4. Retrieve role hierarchy from ZROLEHIERARCHY table
    //5. Compare claimant role against Workflow Step role. If claimant role is higher than current Workflow Step role, increase required role rank by 1
    //6. Iterate search for approver with role rank equal to or higher than required role rank based on claimant direct superior
    
    //Special cases:
    //required role not found in ZROLEHIERARCHY table - retrieve from ZCONSTANT table
    //claimant is CEO - all required roles are to be replaced with CEO_FI role
    //claimant is high ranking, not able to get all level of approvers (Eg CXO role needs approvers HOS -> CXO, will only be converted to one approver, CEO)

    //Post approver determination
    //1. Check for and remove duplicate approvers and delete
    //2. Check for and remove approvers where the claimant is included (Possible when using ZCONSTANT table special approver)
    //3. Refactor approver levels - including group approvers
    
    //Save Approver Contexts in ZAPPROVER_DETAILS_CLAIMS/ZAPPROVER_DETAILS_PREAPPROVAL if Approver Context has at least 1 approver
    //If Approver Context has 0 approvers, throw error

    let aApproversContext = [];
    const oDescriptor = resolveDocDescriptor(sId);
    if (!oDescriptor) {
        return null
    }

    const oWorkflowStepContext = await determineWorkflowStepContext(oTx, oWorkflowContext.OUTCOME_WORKFLOW_CODE, oDescriptor)
    console.log('[approver-determination/determineApprovers] oWorkflowStepContext:', oWorkflowStepContext)

    if(!oWorkflowStepContext){

        return null;
    }
    // AUTO APPROVE Scenario
    if(oWorkflowStepContext[Constant.EntitiesFields.WORKFLOW_APPROVAL_LEVELS] === 0) {
        aApproversContext.push(_setApproverContext(
            oDescriptor, 
            sId, 
            oWorkflowStepContext[Constant.EntitiesFields.WORKFLOW_APPROVAL_LEVELS],
            oWorkflowStepContext[Constant.EntitiesFields.WORKFLOW_NAME],
            '',
            Constant.Status.APPROVED
        ))
    }
    else {
        console.log('[approver-determination/determineApprovers] oWorkflowStepContext:', oWorkflowStepContext)
        aApproversContext = runApproverDetermination(oTx, sId, oWorkflowStepContext, oDescriptor);
    }
    

    return aApproversContext;
}

function _setApproverContext(oDescriptor, sId, sLevel, sApproverID, sSubApproverId, sStatus, sTimestamp = new Date()) {
    return ({
        [oDescriptor.idField]                               : sId,
        [Constant.EntitiesFields.LEVEL]                     : sLevel,
        [Constant.EntitiesFields.APPROVER_ID]               : sApproverID,
        [Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID]    : sSubApproverId,
        [Constant.EntitiesFields.STATUS]                    : sStatus,
        [Constant.EntitiesFields.PROCESS_TIMESTAMP]         : sTimestamp
    })
}
function _populateApproverDetails(oApproverDetails, iLevel) {
    if(!oApproverDetails) return null;
        return {
            EEID: oApproverDetails.EEID,
            NAME: oApproverDetails.NAME,
            EMAIL: oApproverDetails.EMAIL,
            LEVEL: Number(iLevel) + 1
        };
}
module.exports = { determineApprovers }