const cds = require('@sap/cds')
const { SELECT } = require('@sap/cds/lib/ql/cds-ql')
const { Constant } = require("../../utils/constant");
const {
    determineWorkflowStepContext,
    retrieveFromConstantTable,
    retrieveApprover,
    retrieveBudgetDetails,
    retrieveProjectOwnerDetails,
    populateApproverDetails,
    normalizeApproversByGroup,
    retrieveSubstitute
} = require('./determination-helper');
const {
    resolveDocDescriptor,
    retrieveHeaderDetails,
    retrieveEmployeeDetails,
    retrieveRoleRank
} = require("../../workflow/workflow-helper");
const oauthConfiguration = require('@sap/approuter/lib/passport/oauth-configuration');


async function runApproverDetermination(oTx, sId, oWorkflowStepContext, oDescriptor) {
    // Variable declarations for Approver Determination logic
    let oCurrOutcome = null;        // Variable to store current outcome ROLE and RANK
    let oPrevOutcome = null;        // Variable to store previous outcome ROLE and RANK
    let iApproverRank = 0;          // Variable to store approver rank to retrieve
    let oApproverDetails = null;    // Variable to store approver details 
    let aApproversDetails = [];      // Variable to store multiple approvers
    let oBudgetDetails = null;      // Variable to store budget approver details (If applicable)
    let oProjectDetails = null;     // Variable to store project owner details
    let aConstantValues = [];       // Variable to store EEID retrieved from ZCONSTANTS table
    let oPopulatedEmployee = null;  // Variable to store populated Employee
    let aWorkflowApprStep = [];
    let aUniqueApproversDetails = [];
    let aFullApproversDetails = [];

    console.log("Start")
    
    const sSystemDate = new Date();
    const sSystemYear = new Date(sSystemDate).getFullYear();
    
    const aRoleRanks = await retrieveRoleRank();
    
    const oHeader = await retrieveHeaderDetails(sId, oDescriptor)
    const sFinalCC = oHeader[Constant.EntitiesFields.ALTERNATE_COST_CENTER] ?? oHeader[Constant.EntitiesFields.COST_CENTER] ?? null;
    const sProjectCode = oHeader[Constant.EntitiesFields.PROJECT_CODE]
    const oClaimantDetails = await retrieveEmployeeDetails(oHeader[Constant.EntitiesFields.EMP_ID], );
    //console.log(oClaimantDetails);
    
    const sLevels = Number(oWorkflowStepContext.WORKFLOW_APPROVAL_LEVELS) || 0;
    const sWorkflowName = oWorkflowStepContext.WORKFLOW_NAME;
    const aFIDep = await retrieveFromConstantTable(oTx, 'FI_DEP');
    const sFIDep = aFIDep[0].VALUE;
    //console.log(sFIDep);
    aWorkflowApprStep = 
        sLevels > 1 
            ? sWorkflowName.split("-").map(s => s.trim())
            : [sWorkflowName.trim()];
    if(sWorkflowName == Constant.Role.AUTO && sLevels == 0){
        aUniqueApproversDetails.push({
            EEID: Constant.Role.AUTO,
            NAME: Constant.Role.AUTO,
            EMAIL: null,
            LEVEL: Number(0),
            GROUP: Number(0)
        });
    }
    else{
        for(let [iIndex, oWorkflowApprStep] of aWorkflowApprStep.entries()){

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
            console.log("Approver Search: ", oWorkflowApprStep)
            console.log("oCurrOutcome: ", oCurrOutcome)
            if(oCurrOutcome == null){
                // Block to check for Special Approver within ZCONSTANTS table and budget approver
                switch(oWorkflowApprStep){
                    case Constant.Role.BUDGET:  
                        if(sFinalCC){
                            console.log("FinalCC: ", sFinalCC);
                            console.log("System Year: ", sSystemYear);
                            oBudgetDetails = await retrieveBudgetDetails(sFinalCC, sSystemYear);
                            console.log("Budget Details: ", oBudgetDetails);
                            if(!oBudgetDetails){
                                return false;
                            }
                            oApproverDetails = await retrieveEmployeeDetails(oBudgetDetails[Constant.EntitiesFields.BUDGET_OWNER_ID]);
                            oPopulatedEmployee = populateApproverDetails(oApproverDetails, iIndex);
                            if(oPopulatedEmployee){
                                aApproversDetails.push(oPopulatedEmployee);
                            }
                            
                            console.log("Budget Approver: ", oPopulatedEmployee);
                        }else{
                            return false;
                        }
                        break;
                    case Constant.Role.PROJECT_OWNER:
                        if(sProjectCode){
                            console.log("Project Code: ", sProjectCode);
                            console.log("System Year: ", sSystemYear);
                            oProjectDetails = await retrieveProjectOwnerDetails(sProjectCode, sSystemYear);
                            console.log("Project Details: ", oProjectDetails);
                            if(!oProjectDetails){
                                return false;
                            }
                            oApproverDetails = await retrieveEmployeeDetails(oProjectDetails[Constant.EntitiesFields.BUDGET_OWNER_ID]);
                            oPopulatedEmployee = populateApproverDetails(oApproverDetails, iIndex);
                            if(oPopulatedEmployee){
                                aApproversDetails.push(oPopulatedEmployee);
                            }
                            
                            console.log("Project Owner: ", oPopulatedEmployee);
                        }else{
                            return false;
                        }
                        break;
                    case Constant.Role.CEO_FI:
                    case Constant.Role.CASH_FI:
                    case Constant.Role.FI_SETTLEMENT_A:
                    case Constant.Role.FI_SETTLEMENT_B:
                    case Constant.Role.HOD_JKEW:
                    case Constant.Role.MED_REVIEWER:
                        // Possible multiple approvers retrieved from ZCONSTANTS table
                        aConstantValues = await retrieveFromConstantTable(oTx, oWorkflowApprStep);
                        console.log("aConstantValues", aConstantValues)
                        if(aConstantValues.length){
                            for(const oId of aConstantValues){
                                if(oId.VALUE){
                                    oApproverDetails = await retrieveEmployeeDetails(oId.VALUE);
                                    console.log("oApproverDetails", oApproverDetails)
                                    oPopulatedEmployee = populateApproverDetails(oApproverDetails, iIndex);
                                    console.log("oPopulatedEmployee", oPopulatedEmployee)
                                    if(oPopulatedEmployee){
                                        aApproversDetails.push(oPopulatedEmployee);
                                    }else{
                                        return [];
                                    }
                                    console.log("Constant Approver: ", oPopulatedEmployee)
                                }else{
                                    return [];
                                }
                            }

                        }
                        break;
                        case Constant.Role.ELAUN_PINDAH_VERIFIER:
                        // Possible multiple approvers retrieved from ZCONSTANTS table
                        aConstantValues = await retrieveFromConstantTable(oTx, oWorkflowApprStep);
                        console.log("aConstantValues", aConstantValues)
                        if(aConstantValues.length){
                            for(const oId of aConstantValues){
                                if(oId.VALUE){
                                    oApproverDetails = await retrieveEmployeeDetails(oId.VALUE);
                                    console.log("oApproverDetails", oApproverDetails)
                                    oPopulatedEmployee = populateApproverDetails(oApproverDetails, iIndex);
                                    console.log("oPopulatedEmployee", oPopulatedEmployee)
                                    if(oPopulatedEmployee){
                                        aApproversDetails.push(oPopulatedEmployee);
                                    }else{
                                        return [];
                                    }
                                    console.log("Constant Approver: ", oPopulatedEmployee)
                                }else{
                                    return [];
                                }
                            }

                        }
                        break;
                        case Constant.Role.WILAYAH_ASAL_VERIFIER:
                        // Possible multiple approvers retrieved from ZCONSTANTS table
                        aConstantValues = await retrieveFromConstantTable(oTx, oWorkflowApprStep);
                        console.log("aConstantValues", aConstantValues)
                        if(aConstantValues.length){
                            for(const oId of aConstantValues){
                                if(oId.VALUE){
                                    oApproverDetails = await retrieveEmployeeDetails(oId.VALUE);
                                    console.log("oApproverDetails", oApproverDetails)
                                    oPopulatedEmployee = populateApproverDetails(oApproverDetails, iIndex);
                                    console.log("oPopulatedEmployee", oPopulatedEmployee)
                                    if(oPopulatedEmployee){
                                        aApproversDetails.push(oPopulatedEmployee);
                                    }else{
                                        return [];
                                    }
                                    console.log("Constant Approver: ", oPopulatedEmployee)
                                }else{
                                    return [];
                                }
                            }

                        }
                        break;
                    default:
                }
            }
            else{
                if(oClaimantDetails[Constant.EntitiesFields.RANK] < oCurrOutcome[Constant.EntitiesFields.RANK]){
                    iApproverRank = Number(oCurrOutcome[Constant.EntitiesFields.RANK]);
                }
                else{
                    iApproverRank = Number(oClaimantDetails[Constant.EntitiesFields.RANK]) + 1;
                }
                // Retrieve Approver based on iApproverRank
                oApproverDetails = await retrieveApprover(oClaimantDetails[Constant.EntitiesFields.EEID], iApproverRank);
                if(oApproverDetails){
                        oPopulatedEmployee = populateApproverDetails(oApproverDetails, iIndex);
                    if(oPopulatedEmployee){
                        aApproversDetails.push(oPopulatedEmployee);
                    }
                }else{
                    return [];
                }
                console.log("Standard Approver: ", oPopulatedEmployee)
            } 
            // Check if approver is found. If approver not found, do not store approver rank and current outcome
            if(oApproverDetails){
                iApproverRank = Number(oApproverDetails.RANK);                    
                oPrevOutcome = oCurrOutcome;
            }
        }
        aUniqueApproversDetails = normalizeApproversByGroup(aApproversDetails, oClaimantDetails);
    }
    //console.log(aUniqueApproversDetails);
    // Retrieve substitute for approvers
    for (const oApprover of aUniqueApproversDetails){
        // Variable declaration for substitutes
        let sSubstitute = null;         // Variable to store substitute user
        let oSubstituteDetails = null;  // Variable to store substitute user details
        let sSubstitute_eeid = "";       // Variable to store substitute EEID
        let sSubstitute_name = "";       // Variable to store substitute name
        let sSubstitute_email = "";      // Variable to store substitute email
        // If LEVEL = 0, Approver is Auto
        if(oApprover.LEVEL > 0){
            sSubstitute = await retrieveSubstitute(oApprover.EEID);
            //console.log("sSubstitute", sSubstitute);
            if(sSubstitute){
                oSubstituteDetails = await retrieveEmployeeDetails(sSubstitute);
                if(oSubstituteDetails){
                    sSubstitute_eeid = oSubstituteDetails.EEID;
                    sSubstitute_name = oSubstituteDetails.NAME;
                    sSubstitute_email = oSubstituteDetails.EMAIL;
                }
            }
        }else{
            sSubstitute_name = Constant.Role.AUTO;
        }
        aFullApproversDetails.push({
            APPROVER_EEID   : oApprover.EEID,
            APPROVER_NAME   : oApprover.NAME,
            APPROVER_EMAIL  : oApprover.EMAIL,
            LEVEL           : Number(oApprover.LEVEL),
            SUB_EEID        : sSubstitute_eeid,
            SUB_NAME        : sSubstitute_name,
            SUB_EMAIL       : sSubstitute_email
        });
    }
    console.log("Full Approvers: ", aFullApproversDetails);
    return aFullApproversDetails;
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
        return null;
    }

    const oWorkflowStepContext = await determineWorkflowStepContext(oTx, oWorkflowContext.OUTCOME_WORKFLOW_CODE, oDescriptor)
    console.log('[approver-determination/determineApprovers] oWorkflowStepContext:', oWorkflowStepContext)

    if(!oWorkflowStepContext){
        return null;
    }
    aApproversContext = await runApproverDetermination(oTx, sId, oWorkflowStepContext, oDescriptor);
    if(!aApproversContext) {
        return null;
    }    
    return aApproversContext;
}



module.exports = { determineApprovers }