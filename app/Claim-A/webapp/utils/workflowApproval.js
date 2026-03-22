sap.ui.define([
    "claima/utils/FinalApproveStep",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/FilterOperator",
	"claima/utils/Constants",
    "claima/utils/Helper"
], function (FinalApproveStep, Filter, MessageToast,FilterOperator,Constants, Helper) {
    "use strict";

    return {
        onSendEmail: async function (oModel, aPayload){
         
            try{
                const aStringifyPayload = JSON.stringify(aPayload);
                const aParsePayload = JSON.parse(aStringifyPayload);

                for(const opayload of aPayload){
                    const oAction = oModel.bindContext("/sendEmail(...)");
                    oAction.setParameter("ApproverName" , opayload.ApproverName);
                    oAction.setParameter("SubmissionDate" , opayload.SubmissionDate);
                    oAction.setParameter("ClaimantName" , opayload.ClaimantName);
                    oAction.setParameter("ClaimType" , opayload.ClaimType);
                    oAction.setParameter("ClaimID" , opayload.ClaimID);
                    oAction.setParameter("RecipientName" , opayload.RecipientName);
                    oAction.setParameter("Action" , opayload.Action);
                    oAction.setParameter("ReceiverEmail" , opayload.ReceiverEmail);
                    // hardcode email address for testing purposes. If need to test, set ReceiverEmail to your email, comment out once done
                    //oAction.setParameter("ReceiverEmail" , "reuben.lai@my.ey.com");
                    oAction.setParameter("NextApproverName" , opayload.NextApproverName);

                    await oAction.execute();
                }
                
                
            }
            catch(oError){
                MessageToast.show(Utility.getText(this, Constants.Errors.GENERIC_ERROR, [oError]));
                throw new Error(Utility.getText(this, Constants.errors.GENERIC_ERROR, [oError]));
            }
            

		},

        //Aiman Added for MyApproval
        onSendEmailApprover: async function (oModel, aPayload){
            
            const aStringifyPayload = JSON.stringify(aPayload);
            const aParsePayload = JSON.parse(aStringifyPayload);

            const oAction = oModel.bindContext("/sendEmail(...)");
            oAction.setParameter("ApproverName" , aParsePayload.ApproverName);
            oAction.setParameter("SubmissionDate" , aParsePayload.SubmissionDate);
            oAction.setParameter("ClaimantName" , aParsePayload.ClaimantName);
            oAction.setParameter("ClaimType" , aParsePayload.ClaimType);
            oAction.setParameter("ClaimID" , aParsePayload.ClaimID);
            oAction.setParameter("RecipientName" , aParsePayload.RecipientName);
            oAction.setParameter("Action" , aParsePayload.Action);
            oAction.setParameter("ReceiverEmail" , aParsePayload.ReceiverEmail);
            oAction.setParameter("NextApproverName" , aParsePayload.NextApproverName);
            oAction.setParameter("RejectReason" , aParsePayload.RejectReason);
            oAction.setParameter("ApproverComments" , aParsePayload.ApproverComments);

            oAction.execute();

		},
        onClaimsApproverDetermination: async function (oModel, sClaimID, oEmployeeModel){
			// claim header

            // Variable declaration for use of the entire function block
            let aApproversDetails = [];             // Variable to store multiple approvers
            let aFullApproversDetails = [];         // Variable to store approvers with substitutes
            let aUniqueApproversDetails = [];       // Variable to store unique approvers

			const oListClaimHeaderBinding = oModel.bindList(Constants.Entities.ZCLAIM_HEADER, null,null, [
				new Filter({ path: Constants.EntitiesFields.CLAIMID, operator: FilterOperator.EQ, value1: sClaimID })
			], null);
			const aClaimHeaderContexts = await oListClaimHeaderBinding.requestContexts();
			const aClaimHeaderData = aClaimHeaderContexts.map(oContext => oContext.getObject());

			const sEmpID = aClaimHeaderData[0].EMP_ID;
			const sClaimsCC = aClaimHeaderData[0].COST_CENTER;
			const sClaimsAltCC = aClaimHeaderData[0].ALTERNATE_COST_CENTER;
			const sClaimsSubmissionType = aClaimHeaderData[0].SUBMISSION_TYPE;
			const sClaimsSubmissionDate = aClaimHeaderData[0].SUBMITTED_DATE;
			const sClaimSubmissionYear = new Date(aClaimHeaderData[0].SUBMITTED_DATE).getFullYear();
            const sClaimsFinalCC = sClaimsCC ?? sClaimsAltCC ?? null;

            // Add TOTAL_CLAIM_AMOUNT and PREAPPROVED_AMOUNT
            const sTotalClaimAmount = aClaimHeaderData[0].TOTAL_CLAIM_AMOUNT;
            const sPreapprovedAmount = aClaimHeaderData[0].PREAPPROVED_AMOUNT;  
            
            // Retrieve claimant details for use of entire function
            const oClaimantDetails = await Helper.getEmployeeDetails(oModel, sEmpID);
            if(oClaimantDetails === null){
                MessageToast.show(Utility.getText(this, Constants.errors.NO_CLAIMANT_ERROR))
                throw new Error(Utility.getText(this, Constants.errors.NO_CLAIMANT_ERROR));
            }

            // Retrieve Submission Type Description for use of email notification function
            const oSubmissionTypeDesc = await Helper.getSubmissionTypeDesc(oModel, sClaimsSubmissionType);

			//claim Item
			const oListClaimItemBinding = oModel.bindList(Constants.Entities.ZCLAIM_ITEM, null,null, [
				new Filter({ path: Constants.EntitiesFields.CLAIMID, operator: FilterOperator.EQ, value1: sClaimID })
			], null);
			const aClaimItemsContexts = await oListClaimItemBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

            //Need to change the checking from total_exp_amount to amount
			//let claimItemTotalExpAmtArr = [];
            let aClaimItemAmountArr = [];
			let aClaimItemReceiptDateArr = [];
			let aClaimTypeItemIDArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){
                //Need to change the checking from total_exp_amount to amount
                aClaimItemAmountArr.push(parseFloat(aClaimsItemData[i].AMOUNT));
				aClaimItemReceiptDateArr.push(new Date(aClaimsItemData[i].RECEIPT_DATE));
				aClaimTypeItemIDArr.push(aClaimsItemData[i].CLAIM_TYPE_ITEM_ID);
			}
			
			// furthest date + high amount among all the claim items
			var dFurthestReceiptDate = new Date(Math.max(...aClaimItemReceiptDateArr)).toLocaleDateString('en-CA');

            //Need to change the checking from total_exp_amount to amount
			//var highestTotalExpAmt = Math.max(...claimItemTotalExpAmtArr);
            var iHighestAmount = Math.max(...aClaimItemAmountArr);

			var sClaimsOverallRisk;
			let aClaimsTypeItemRiskArr = [];

			for(var i = 0; i < aClaimTypeItemIDArr.length; i++){
				const oListClaimTypeItemBinding = oModel.bindList(Constants.Entities.ZCLAIM_TYPE_ITEM, null,null, [
					new Filter({ path: Constants.EntitiesFields.CLAIM_TYPE_ITEM_ID, operator: FilterOperator.EQ, value1: aClaimTypeItemIDArr[i] })
				], null);
				const aClaimTypeItemsContexts = await oListClaimTypeItemBinding.requestContexts();
				const aClaimsTypeItemData = aClaimTypeItemsContexts.map(oContext => oContext.getObject());

				for(var x = 0; x < aClaimsTypeItemData.length; x++){
					aClaimsTypeItemRiskArr.push(aClaimsTypeItemData[x].RISK);
				}			

			}

			//get overall risk 
			for(var i = 0; i< aClaimsTypeItemRiskArr.length; i++){
				if(aClaimsTypeItemRiskArr[i] != aClaimsTypeItemRiskArr[0]){
					sClaimsOverallRisk = Constants.Risk_Category.H;
				}else{
					sClaimsOverallRisk = aClaimsTypeItemRiskArr[0];
				}
			}
			
			if(sClaimsOverallRisk == "" || sClaimsOverallRisk == null){
				sClaimsOverallRisk = null;
			}

			//get employee info
			const oListEmpMasterBinding = oModel.bindList(Constants.Entities.ZEMP_MASTER, null,null, [
				new Filter({ path: Constants.EntitiesFields.EEID, operator: FilterOperator.EQ, value1: sEmpID })
			], null);
			const aEmpContexts = await oListEmpMasterBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			const sEmpDept = aEmpData[0].DEP; 
			var sEmpRole = aEmpData[0].ROLE;
			const sEmpCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			//array this. test dep id getting all emp with roles with the same dept id as claimant need to add loop to this as well
			const oListAllEmpMasterBinding = oModel.bindList(Constants.Entities.ZEMP_MASTER, null,null, [
				new Filter({ path: Constants.EntitiesFields.DEP, operator: FilterOperator.EQ, value1: sEmpDept }),
				new Filter({ path: Constants.EntitiesFields.ROLE, operator: FilterOperator.NE, value1: null })
			], null);
			const aAllEmpWithSameDepContexts = await oListAllEmpMasterBinding.requestContexts();
			const aAllEmpWithSameDepData = aAllEmpWithSameDepContexts.map(oContext => oContext.getObject());

			//get all the workflow rules based on workflow type request type (submission type) and role. populate to array and check if there is anything that needs to be checked then pop out the ones that is not needed
			//sEmpRole, sClaimsSubmissionType, Workflow Type hardcode to CLM
			if(sEmpRole == null || sEmpRole == ""){
				sEmpRole = null;
			}

			if(sEmpDept == "0500000000"){
				if(sEmpRole == null || sEmpRole == ""){
					sEmpRole = "JKEW"
				}else{
					sEmpRole = "JKEW/" + sEmpRole
				}
			}

			//get workflow rule
            // Workflow rule table does not utilize role anymore as approver determination is now dynamic
			const oListWorkflowRuleBinding = oModel.bindList(Constants.Entities.ZWORKFLOW_RULE, null,null, [
				new Filter({ path: Constants.EntitiesFields.WORKFLOW_TYPE, operator: FilterOperator.EQ, value1: Constants.WorkflowType.CLAIM }),
				new Filter({ path: Constants.EntitiesFields.REQUEST_TYPE_ID, operator: FilterOperator.EQ, value1: sClaimsSubmissionType })				
			], null);

			const aWorkflowRuleContexts = await oListWorkflowRuleBinding.requestContexts();
			const aWorkflowRuleData = aWorkflowRuleContexts.map(oContext => oContext.getObject());

			let aWorkflowRuleElimArr = [];
			let aNestedWorkflowRuleArr = [];
			for(var i = 0; i < aWorkflowRuleData.length; i++){
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].THRESHOLD_AMOUNT);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].RECEIPT_DAY);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].EMPLOYEE_COST_CENTER);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].RISK_LEVEL);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].OUTCOME_WORKFLOW_CODE);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].THRESHOLD_VALUE);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].RECEIPT_AGE);
				
				aNestedWorkflowRuleArr.push(aWorkflowRuleElimArr);
				aWorkflowRuleElimArr = [];
			}
			
			var iDateDiff = new Date(dFurthestReceiptDate) - new Date(sClaimsSubmissionDate);
			iDateDiff = iDateDiff/86400000;
			iDateDiff = Math.abs(iDateDiff);

			var sEmpCCVal;

            if(sClaimsAltCC == "" || sClaimsAltCC == null) {  
				sEmpCCVal = Constants.Operators.EQ;
            }else{
                sEmpCCVal = Constants.Operators.NE;
            }
			
			var sThreshholdVal, sReceiptAge;
			let aRiskLevelWorkflowCodeArr = [];
			let aThresholdWorkflowCodeArr = [];
			let aEmpCCWorkflowCodeArr = [];
			let aReceiptAgingWorkflowCodeArr = [];
			for(var i = 0; i < aNestedWorkflowRuleArr.length; i++){

                if(aNestedWorkflowRuleArr[i][3] == null){
                    aRiskLevelWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
                }else if(sClaimsOverallRisk == aNestedWorkflowRuleArr[i][3]){
                    aRiskLevelWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
                }
                
                if(aNestedWorkflowRuleArr[i][2] == null){
                    aEmpCCWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
                }else if(sEmpCCVal == aNestedWorkflowRuleArr[i][2]){
					aEmpCCWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
				}

                // Add logic to include TOTAL_CLAIM_AMOUNT vs PREAPPROVED_AMOUNT
                // If Total Claim Amount > Preapproved Amount, straight set our indicator to GT 
                // Else, use Amount vs Threshold Amount in workflow rule table to determine indicator
                if(sTotalClaimAmount > sPreapprovedAmount){
                    sThreshholdVal = Constants.Operators.GT
                }else{
                    if(iHighestAmount > aNestedWorkflowRuleArr[i][0]){
                        sThreshholdVal = Constants.Operators.GT;
                    }else if(iHighestAmount <= aNestedWorkflowRuleArr[i][0]){    
                        sThreshholdVal = Constants.Operators.LE;
                    }else{
                        sThreshholdVal = null;
                    }
                }
                

                if(aNestedWorkflowRuleArr[i][5] == null){
                    aThresholdWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
                }else if(sThreshholdVal == aNestedWorkflowRuleArr[i][5]){
					aThresholdWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
				}

				if(iDateDiff > aNestedWorkflowRuleArr[i][1]){
					sReceiptAge = Constants.Operators.GT;
				}else if(iDateDiff <= aNestedWorkflowRuleArr[i][1]){
					sReceiptAge = Constants.Operators.LE;
				}else{
					sReceiptAge = null;
				}

                if(aNestedWorkflowRuleArr[i][6] == null){
                    aReceiptAgingWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
                }else if(sReceiptAge == aNestedWorkflowRuleArr[i][6]){
					aReceiptAgingWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
				}
			}

			//filter for the only workflow code that is the same among all the rule checks
			const aCommonWorkflowCode = [...new Set(aRiskLevelWorkflowCodeArr)].filter(item => 
				new Set(aThresholdWorkflowCodeArr).has(item) && new Set(aEmpCCWorkflowCodeArr).has(item) && new Set(aReceiptAgingWorkflowCodeArr).has(item)
			);

			//get approver levels and approvers
			const oListWorkflowStepBinding = oModel.bindList(Constants.Entities.ZWORKFLOW_STEP, null,null, [
				new Filter({ path: Constants.EntitiesFields.WORKFLOW_TYPE, operator: FilterOperator.EQ, value1: Constants.WorkflowType.CLAIM }),
				new Filter({ path: Constants.EntitiesFields.WORKFLOW_CODE, operator: FilterOperator.EQ, value1: aCommonWorkflowCode[0] }),
				
			], null);
			const aWorkflowStepContexts = await oListWorkflowStepBinding.requestContexts();
			const aWorkflowStepData = aWorkflowStepContexts.map(oContext => oContext.getObject());
			
			const sWorkflowName =  aWorkflowStepData[0].WORKFLOW_NAME;
			const iWorkflowApprLvl =  aWorkflowStepData[0].WORKFLOW_APPROVAL_LEVELS;
			if(iWorkflowApprLvl > 1){
				var aWorkflowApprStep = sWorkflowName.split("-");
			}else{
				aWorkflowApprStep = [sWorkflowName];
			}


			let aApprEmpID = [];
            
            if(sWorkflowName == Constants.Approvers.AUTO && iWorkflowApprLvl == 0){
                aApprEmpID.push(Constants.Approvers.AUTO);
                aApproversDetails.push({
                    EEID: null,
                    NAME: Constants.Approvers.AUTO,
                    EMAIL: null,
                    LEVEL: Number(0)
                });
            }else{

                // Variable declarations for Approver Determination logic
                let oCurrOutcome = null;        // Variable to store current outcome ROLE and RANK
                let oPrevOutcome = null;        // Variable to store previous outcome ROLE and RANK
                let iApproverRank = 0;          // Variable to store approver rank to retrieve
                let oApproverDetails = null;    // Variable to store approver details 
                let oBudgetDetails = null;      // Variable to store budget approver details (If applicable)
                let aConstantValues = [];       // Variable to store EEID retrieved from ZCONSTANTS table
                const aRoleRanks = await Helper.getRoleRank(oModel);
                const oClaimantDetails = await Helper.getEmployeeDetails(oModel, sEmpID);
                for(var i = 0; i < aWorkflowApprStep.length; i++){

                    // Start of Approver Determination logic
                    // Standard Workflow logic is when following approver level, the next level should be higher than the previous level
                    // Special case would include first level higher than second level. This case would require the first approver to
                    // Be handled separately from the next level approvers 
                    // After that, the logic will follow the Standard Workflow logic

                    // Check if claimant is CEO
                    // If yes, approver for CEO is CEO_FI
                    if(oClaimantDetails.ROLE === Constants.Role.CEO){
                        aWorkflowApprStep[i] = Constants.User_Type.CEO_FI;
                    }
                    // Populate current role rank
                    oCurrOutcome = aRoleRanks.find(r => r.ROLE === aWorkflowApprStep[i]);
                    
                    
                    if(oCurrOutcome == null){
                        // Block to check for Special Approver within ZCONSTANTS table and budget approver
                        switch(aWorkflowApprStep[i]){
                            case Constants.Approvers.BUDGET:
                                if(sClaimsFinalCC != null){
                                    oBudgetDetails = await Helper.getBudgetDetails(oModel, sClaimsFinalCC, sClaimSubmissionYear);
                                    if(!oBudgetDetails){
                                        MessageToast.show(Utility.getText(this, Constants.Errors.No_BUDGET_ERROR));
                                        throw new Error(Utility.getText(this, Constants.Errors.No_BUDGET_ERROR));
                                    }else{
                                        oApproverDetails = await Helper.getEmployeeDetails(oModel, oBudgetDetails.BUDGET_OWNER_ID);
                                        if(oApproverDetails != null){
                                            aApproversDetails.push({
                                                EEID:   oApproverDetails.EEID,
                                                NAME:   oApproverDetails.NAME,
                                                EMAIL:  oApproverDetails.EMAIL,
                                                LEVEL:  Number(i) + 1
                                            });
                                        }
                                    }
                                }else{
                                    MessageToast.show(Utility.getText(this, Constants.Errors.No_COST_CENTER_ERROR));
                                    throw new Error(Utility.getText(this, Constants.Errors.No_COST_CENTER_ERROR));
                                }
                                break;
                            case Constants.User_Type.CEO_FI:
                            case Constants.User_Type.CASH_FI:
                            case Constants.User_Type.FI_SETTLEMENT_A:
                            case Constants.User_Type.FI_SETTLEMENT_B:
                            case Constants.User_Type.HOD_JKEW:
                                // Possible multiple approvers retrieved from ZCONSTANTS table
                                aConstantValues = await Helper.getConstants(oModel, aWorkflowApprStep[i]);
                                if(aConstantValues){
                                    for(const id of aConstantValues){
                                        if(id.VALUE){
                                            oApproverDetails = await Helper.getEmployeeDetails(oModel, id.VALUE);
                                            if(oApproverDetails){
                                                aApproversDetails.push({
                                                EEID:   oApproverDetails.EEID,
                                                NAME:   oApproverDetails.NAME,
                                                EMAIL:  oApproverDetails.EMAIL,
                                                LEVEL:  Number(i) + 1
                                            });
                                            }else{

                                                MessageToast.show(Utility.getText(this, Constants.Errors.No_APPROVER_DETAILS_ERROR, [id.VALUE]));
                                                throw new Error(Utility.getText(this, Constants.Errors.No_APPROVER_DETAILS_ERROR, [id.VALUE]));
                                            }
                                        }else{
                                            MessageToast.show(Utility.getText(this, Constants.Errors.No_APPROVER_ERROR));
                                            throw new Error(Utility.getText(this, Constants.Errors.No_APPROVER_ERROR));
                                        }
                                    }
                                }
                                break;
                            default:
                        }
                    }
                    else{
                        // Block to check for Approver within the ZROLEHIERARCHY table
                        if(oPrevOutcome == null){
                            // Block to perform logic checking for first level approver

                            //oPrevOutcome = aRoleRanks.find(r => r.ROLE === aWorkflowApprStep[i]);
                            //console.log(oCurrentOutcome.RANK);
                            if(oClaimantDetails.RANK < oCurrOutcome.RANK){
                                iApproverRank = oCurrOutcome.RANK;
                            }
                            else if(oClaimantDetails.RANK = oCurrOutcome.RANK){
                                iApproverRank = iApproverRank + 1;
                            }
                            else{
                                iApproverRank = oClaimantDetails.RANK;
                            }
                        }else if(oPrevOutcome.RANK < oCurrOutcome.RANK){
                            // Block to perform logic checking when previous approver is lower rank than current approver
                            // next level approver would need to be higher than current approver rank
                            iApproverRank = Number(iApproverRank) + 1;
                        }else if(oPrevOutcome.RANK == oCurrOutcome.RANK){
                            // If the Outcome repeats a role, move on to the next role
                            continue;   
                        }else{
                            // If current rank is below previous rank, compare against claimant rank as usual
                            if(oClaimantDetails.RANK < oCurrOutcome.RANK){
                                iApproverRank = oCurrOutcome.RANK;
                            }
                            else if(oClaimantDetails.RANK = oCurrOutcome.RANK){
                                iApproverRank = iApproverRank + 1;
                            }
                            else{
                                iApproverRank = oClaimantDetails.RANK;
                            }
                        }   
                        // Retrieve Approver based on iApproverRank
                        oApproverDetails = await this.getApprover(oModel, sEmpID, iApproverRank);
                        if(oApproverDetails != null){
                            aApproversDetails.push({
                                EEID:   oApproverDetails.EEID,
                                NAME:   oApproverDetails.NAME,
                                EMAIL:  oApproverDetails.EMAIL,
                                LEVEL:  Number(i) + 1
                            });
                        }
                    } 

                    // Check if approver is found. If approver not found, do not store approver rank and current outcome
                    if(oApproverDetails !== null){
                        iApproverRank = Number(oApproverDetails.RANK);                    
                        oPrevOutcome = oCurrOutcome;
                    }
                    
                    /**


                    for(var x = 0; x < aAllEmpWithSameDepData.length; x++){
                        if(aWorkflowApprStep[i] == aAllEmpWithSameDepData[x].ROLE){
                            aApprEmpID.push(aAllEmpWithSameDepData[x].EEID)						
                        }else if(aWorkflowApprStep[i] == "Budget" && x == 0){
                            const oListBudgetBinding = oModel.bindList("/ZBUDGET", null,null, [
                                new Filter({ path: "YEAR", operator: FilterOperator.EQ, value1: sClaimSubmissionYear }),
                                new Filter({ path: "FUND_CENTER", operator: FilterOperator.EQ, value1: sClaimsAltCC })
                            ], null);
                            const aContexts = await oListBudgetBinding.requestContexts();
                            const aData = aContexts.map(oContext => oContext.getObject());
                            const oListEmpBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                                new Filter({ path: "EMAIL", operator: FilterOperator.EQ, value1: aData[0].BUDGET_OWNER_ID })
                            ], null);
                            const aEEIDContexts = await oListEmpBinding.requestContexts();
                            const aEEIDData = aEEIDContexts.map(oContext => oContext.getObject());
                            aApprEmpID.push(aEEIDData[0].EEID);
                        }
                    }
                     */
                }
                // at the end of approver determination, do the following
                // 1. Remove duplicate approvers
                // 2. Remove approvers who is the claimant
                // 3. Renumber levels after operation
                const oSeen = new Set();
                let sLevel = 0;
                oSeen.add(oClaimantDetails.EEID);
                for (const oApprover of aApproversDetails){
                    if(!oSeen.has(oApprover.EEID)){
                        oSeen.add(oApprover.EEID);
                        sLevel = sLevel + 1;
                        oApprover.LEVEL = sLevel;
                        aUniqueApproversDetails.push(oApprover);
                    }
                }
            }
            
            // Variable declaration for substitutes
            let oSubstitute = null;         // Variable to store substitute user
            let oSubstituteDetails = null;  // Variable to store substitute user details
            let sSubstitute_eeid = "";       // Variable to store substitute EEID
            let sSubstitute_name = "";       // Variable to store substitute name
            let sSubstitute_email = "";      // Variable to store substitute email
            // Retrieve substitute for approvers
            for (const oApprover of aUniqueApproversDetails){
                // If LEVEL = 0, Approver is Auto
                if(oApprover.LEVEL > 0){
                    oSubstitute = await Helper.getSubstitute(oModel, oApprover.EEID);
                    if(oSubstitute){
                        oSubstituteDetails = await Helper.getEmployeeDetails(oModel, oSubstitute.EEID);
                        if(oSubstituteDetails){
                            sSubstitute_eeid = oSubstituteDetails.EEID;
                            sSubstitute_name = oSubstituteDetails.NAME;
                            sSubstitute_email = oSubstituteDetails.EMAIL;
                        }
                    }
                }else{
                    sSubstitute_name = Constants.Approvers.AUTO;
                }
                aFullApproversDetails.push({
                    APPROVER_EEID:   oApprover.EEID,
                    APPROVER_NAME:   oApprover.NAME,
                    APPROVER_EMAIL:  oApprover.EMAIL,
                    LEVEL:  Number(oApprover.LEVEL),
                    SUB_EEID:        sSubstitute_eeid,
                    SUB_NAME:        sSubstitute_name,
                    SUB_EMAIL:       sSubstitute_email
                });
            }
            /**
			let aSubEmpID = [];
			//search for substitute
            if(aApprEmpID[0] != "Auto"){
                for(var i = 0; i < aApprEmpID.length; i++){
                    
                    const oListSubRulesBinding = oModel.bindList("/ZSUBSTITUTION_RULES", null,null, [
                        new Filter({ path: "USER_ID", operator: FilterOperator.EQ, value1: aApprEmpID[i] }),
                        new Filter({ path: "VALID_FROM", operator: FilterOperator.LE, value1: sClaimsSubmissionDate }),
                        new Filter({ path: "VALID_TO", operator: FilterOperator.GE, value1: sClaimsSubmissionDate })
                        
                    ], null);
                    const aSubEmpContexts = await oListSubRulesBinding.requestContexts();
                    const aSubEmpData = aSubEmpContexts.map(oContext => oContext.getObject());

                    if(aSubEmpData[0] != null && aSubEmpData[0] != "" && aSubEmpData[0] != undefined){
                        aSubEmpID.push(aSubEmpData[0].SUBSTITUTE_ID);
                    }else{
                        aSubEmpID.push(null);
                    }
			    }
            }
			*/

			//create ZAPPROVER DETAILS
			const oBindApprDetailsList = oModel.bindList(Constants.Entities.ZAPPROVER_DETAILS_CLAIMS);

            // create all contexts
            let aCreatePromises = [];

			//for(var i = 0; i < aApprEmpID.length; i++){
            for(const oApprover of aFullApproversDetails){

                var oContext = oBindApprDetailsList.create({
                    "CLAIM_ID": sClaimID,
                    //"LEVEL": "0",
                    "LEVEL": oApprover.LEVEL,
                    //"APPROVER_ID": "Auto",
                    "APPROVER_ID": oApprover.APPROVER_EEID,
                    "SUBSTITUTE_APPROVER_ID": oApprover.SUB_EEID,
                    "STATUS": oApprover.LEVEL === 1 ? Constants.ClaimStatus.PENDING_APPROVAL : (oApprover.LEVEL === 0 ? Constants.ClaimStatus.APPROVED : "")
                });
                aCreatePromises.push(oContext.created());
                /** 
                if(aApprEmpID[i] == "Auto"){
                    var oContext = oBindApprDetailsList.create({
                        "CLAIM_ID": sClaimID,
                        "LEVEL": "0",
                        "APPROVER_ID": "Auto",
                        "SUBSTITUTE_APPROVER_ID": aFullApproversDetails[i].SUB_EEID,
                        "STATUS": "STAT05"
                    });
                }else{
                    if(i == 0){                  
                    var oContext = oBindApprDetailsList.create({
                        "CLAIM_ID": sClaimID,
                        "LEVEL": i+1,
                        "APPROVER_ID": aApprEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": aSubEmpID[i],
                        "STATUS": "STAT02"
                        });
                    }else{
                        var oContext = oBindApprDetailsList.create({
                            "CLAIM_ID": sClaimID,
                            "LEVEL": i+1,
                            "APPROVER_ID": aApprEmpID[i],
                            "SUBSTITUTE_APPROVER_ID": aSubEmpID[i],
                            "STATUS": null
                        });
                    }
                }
                */
			}

            // submit the batch
            await oModel.submitBatch("$auto");

            // wait for all created
            const aCreatedContext = await Promise.all(aCreatePromises);

            //oContext.created().then(async function (){
            try{
            // Send email notification to first level approver or
            // Start Final Approve Step for Auto approve
            // Declaration for this block
                const aPayloadMain = []     // Variable to store payload for sending email
                
                for(const oApprover of aFullApproversDetails){
                    if(oApprover.LEVEL == 1){
                        // Populate array for sending email to approver
                        aPayloadMain.push({
                            "ApproverName":oApprover.APPROVER_NAME, 
                            "SubmissionDate":sClaimsSubmissionDate, 
                            "ClaimantName":oClaimantDetails.NAME, 
                            "ClaimType":oSubmissionTypeDesc.SUBMISSION_TYPE_DESC, 
                            "ClaimID":sClaimID, 
                            "RecipientName": oApprover.APPROVER_NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":oApprover.APPROVER_EMAIL,
                            "NextApproverName":""
                        });
                        if(oApprover.SUB_NAME != ""){
                            // If substitute available, populate payload and send email to substitute also
                            aPayloadMain.push({
                                "ApproverName":oApprover.SUB_NAME, 
                                "SubmissionDate":sClaimsSubmissionDate, 
                                "ClaimantName":oClaimantDetails.NAME, 
                                "ClaimType":oSubmissionTypeDesc.SUBMISSION_TYPE_DESC, 
                                "ClaimID":sClaimID, 
                                "RecipientName":oApprover.SUB_NAME, 
                                "Action": "Notify", 
                                "ReceiverEmail":oApprover.SUB_EMAIL,
                                "NextApproverName":""
                            }); 
                        }
                    }else if(oApprover.LEVEL == 0){
                        FinalApproveStep.onFinalApprove(oModel, sClaimID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                        break;
                    }
                }
                if(aPayloadMain.length > 0){
                    // Send email to approver
                    this.onSendEmail(oModel, aPayloadMain);
                }

                // submit the batch
                await oModel.submitBatch("$auto");

                // wait for all created
                const aCreatedContext = await Promise.all(aCreatePromises);
                

                /** 
                if(aApprEmpID[0] != "Auto"){
                    const oListApprDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: aApprEmpID[0] })
                    ], null);
                    const aApprNameContexts = await oListApprDetailsBinding.requestContexts();
                    const aApprNameData = aApprNameContexts.map(oContext => oContext.getObject());
                    
                    const oListClaimantDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: sEmpID })
                    ], null);
                    const aClaimantNameContexts = await oListClaimantDetailsBinding.requestContexts();
                    const aClaimantNameData = aClaimantNameContexts.map(oContext => oContext.getObject());

                    if(aApprEmpID.length != 1){
                        const oListNextApprBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: aApprEmpID[1] })
                        ], null);
                        const aNextApprNameContexts = await oListNextApprBinding.requestContexts();
                        const aNextApprNameData = aNextApprNameContexts.map(oContext => oContext.getObject());
                        var sNextApprName = aNextApprNameData[0].NAME;
                    }else{
                        sNextApprName = null;
                    }
                
                    const oListSubTypeBinding = oModel.bindList("/ZSUBMISSION_TYPE", null,null, [
                        new Filter({ path: "SUBMISSION_TYPE_ID", operator: FilterOperator.EQ, value1: sClaimsSubmissionType })
                    ], null);
                    const aSubmissionTypeNameContexts = await oListSubTypeBinding.requestContexts();
                    const aSubmissionTypeNameData = aSubmissionTypeNameContexts.map(oContext => oContext.getObject());

                    if(aSubEmpID[0] != null){

                        const oListSubDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: aSubEmpID[0] })
                        ], null);
                        const aApprSubNameContexts = await oListSubDetailsBinding.requestContexts();
                        const aApprSubNameData = aApprSubNameContexts.map(oContext => oContext.getObject());

                        const aPayloadSub ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":sClaimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC, 
                            "ClaimID":sClaimID, 
                            "RecipientName":aApprSubNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprSubNameData[0].EMAIL, 
                            "NextApproverName" : sNextApprName 
                        }

                        const aPayloadMain = {
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":sClaimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC, 
                            "ClaimID":sClaimID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : sNextApprName 
                        }
                        this.onSendEmail(oModel, aPayloadSub);
                        this.onSendEmail(oModel, aPayloadMain);
                    }else{
                        const aPayload ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":sClaimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC, 
                            "ClaimID":sClaimID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : sNextApprName 
                        }                      
                        this.onSendEmail(oModel, aPayload);        
                    }
                }else{
                    FinalApproveStep.onFinalApprove(oModel, sClaimID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                }
                */
            }catch(oError){
                MessageToast.show(Utility.getText(this, Constants.Errors.GENERIC_ERROR, [oError]));
                throw new Error(Utility.getText(this, Constants.errors.GENERIC_ERROR, [oError]));
            }	
			
        },
        onPARApproverDetermination: async function (oModel, sPARID, oEmployeeModel){
			// request header
            const that = this;

            // Variable declaration for use of the entire function block
            let aApproversDetails = [];             // Variable to store multiple approvers
            let aFullApproversDetails = [];         // Variable to store approvers with substitutes
            let aUniqueApproversDetails = [];       // Variable to store unique approvers

			const oListRequestHeaderBinding = oModel.bindList(Constants.Entities.ZREQUEST_HEADER, null,null, [
				new Filter({ path: Constants.EntitiesFields.REQUEST_ID, operator: FilterOperator.EQ, value1: sPARID })
			], null);
			const aPARHeaderContexts = await oListRequestHeaderBinding.requestContexts();
			const aPARHeaderData = aPARHeaderContexts.map(oContext => oContext.getObject());

			const sEmpID = aPARHeaderData[0].EMP_ID;
			const sParCC = aPARHeaderData[0].COST_CENTER;
			const sParAltCC = aPARHeaderData[0].ALTERNATE_COST_CENTER; // for budget owner 
			const sParSubmissionType = aPARHeaderData[0].REQUEST_TYPE_ID;
			const sParSubmissionDate = aPARHeaderData[0].SUBMITTED_DATE;
			var sParSubmissionYear = new Date(aPARHeaderData[0].SUBMITTED_DATE).getFullYear();
			var sParTripStartDate = aPARHeaderData[0].TRIP_START_DATE;

            // Retrieve claimant details for use of entire function
            const oClaimantDetails = await Helper.getEmployeeDetails(oModel, sEmpID);
            if(oClaimantDetails === null){
                MessageToast.show(Utility.getText(this, Constants.Errors.NO_CLAIMANT_ERROR))
                throw new Error(Utility.getText(this, Constants.Errors.NO_CLAIMANT_ERROR));
            }

            // Retrieve Submission Type Description for use of email notification function
            const oRequestTypeDesc = await Helper.getRequestTypeDesc(oModel, sParSubmissionType);
			
			//request Item
			const oListRequestItemBinding = oModel.bindList(Constants.Entities.ZREQUEST_ITEM, null,null, [
				new Filter({ path: Constants.EntitiesFields.REQUEST_ID, operator: FilterOperator.EQ, value1: sPARID })
			], null);
			const aClaimItemsContexts = await oListRequestItemBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

			let aParCashAdvArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){
				aParCashAdvArr.push(aClaimsItemData[i].CASH_ADVANCE);
			}

			//get employee info
			const oListPAREmpMasterBinding = oModel.bindList(Constants.Entities.ZEMP_MASTER, null,null, [
				new Filter({ path: Constants.EntitiesFields.EEID, operator: FilterOperator.EQ, value1: sEmpID })
			], null);
			const aEmpContexts = await oListPAREmpMasterBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			const sEmpDept = aEmpData[0].DEP;
			var sEmpRole = aEmpData[0].ROLE;
			const sEmpCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			const oListPARAllEmpBinding = oModel.bindList(Constants.Entities.ZEMP_MASTER, null,null, [
				new Filter({ path: Constants.EntitiesFields.DEP, operator: FilterOperator.EQ, value1: sEmpDept }),
				new Filter({ path: Constants.EntitiesFields.ROLE, operator: FilterOperator.NE, value1: null })
			], null);
			const aAllEmpWithSameDepContexts = await oListPARAllEmpBinding.requestContexts();
			const aAllEmpWithSameDepData = aAllEmpWithSameDepContexts.map(oContext => oContext.getObject());

			if(sEmpRole == null || sEmpRole == ""){
				sEmpRole = null;
			}

			if(sEmpDept == "0500000000"){
				if(sEmpRole == null || sEmpRole == ""){
					sEmpRole = "JKEW"
				}else{
					sEmpRole = "JKEW/" + sEmpRole
				}
			}

			//get workflow rule
			const oListWorkflowRuleBinding = oModel.bindList(Constants.Entities.ZWORKFLOW_RULE, null,null, [
				new Filter({ path: Constants.EntitiesFields.WORKFLOW_TYPE, operator: FilterOperator.EQ, value1: Constants.WorkflowType.PRE_APPROVAL }),
				new Filter({ path: Constants.EntitiesFields.REQUEST_TYPE_ID, operator: FilterOperator.EQ, value1: sParSubmissionType })//,
				//new Filter({ path: "ROLE", operator: FilterOperator.EQ, value1: sEmpRole })
				
			], null);
			const aWorkflowRuleContexts = await oListWorkflowRuleBinding.requestContexts();
			const aWorkflowRuleData = aWorkflowRuleContexts.map(oContext => oContext.getObject());

			let aWorkflowRuleElimArr = [];
			let aNestedWorkflowRuleArr = [];
			for(var i = 0; i < aWorkflowRuleData.length; i++){
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].CASH_ADVANCE);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].EMPLOYEE_COST_CENTER);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].TRIP_START_DATE);
				aWorkflowRuleElimArr.push(aWorkflowRuleData[i].OUTCOME_WORKFLOW_CODE);
				
				aNestedWorkflowRuleArr.push(aWorkflowRuleElimArr);
				aWorkflowRuleElimArr = [];
			}

			var sEmpCCVal;
            if(sParAltCC == "" || sParAltCC == null) {  
				sEmpCCVal = Constants.Operators.EQ;
            }else{
                sEmpCCVal = Constants.Operators.NE;
            }
            
			var sTripStartAge;//change for trip start date
			let aEmpCCWorkflowCodeArr = [];
			let aTripStartAgingWorkflowCodeArr = [];
			let aCashAdvWorkflowCodeArr = [];
			var dCurrentDate = new Date();
			sParTripStartDate = new Date(sParTripStartDate);

            
			for(var i = 0; i < aNestedWorkflowRuleArr.length; i++){
                if(aNestedWorkflowRuleArr[i][1] == null){
                    aEmpCCWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
                }else if(sEmpCCVal == aNestedWorkflowRuleArr[i][1]){
					aEmpCCWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
				}

				if(sParTripStartDate >= dCurrentDate){
					sTripStartAge = Constants.Operators.GE;
				}else if(sParTripStartDate < dCurrentDate){
					sTripStartAge = Constants.Operators.LT;
				}else{
					sTripStartAge = null;
				}

                if(aNestedWorkflowRuleArr[i][1] == null){
                    aEmpCCWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
                }else if(sTripStartAge == aNestedWorkflowRuleArr[i][2]){
					aTripStartAgingWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
				}

                //cash adv is either true or false. added a null check for human error when user create in config table
                if(aNestedWorkflowRuleArr[i][0] == null){
                    aCashAdvWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
                }else{
                    if(aParCashAdvArr.includes("true") == true){
                        if(aNestedWorkflowRuleArr[i][0] == 1){
                            aCashAdvWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
                        }
                    }else{
                        if(aNestedWorkflowRuleArr[i][0] == 0){
                            aCashAdvWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][3]);
                        }
                    }
                }
			}


			//filter for the only workflow code that is the same among all the rule checks
			const aCommonWorkflowCode = [...new Set(aEmpCCWorkflowCodeArr)].filter(item => 
				new Set(aTripStartAgingWorkflowCodeArr).has(item) && new Set(aCashAdvWorkflowCodeArr).has(item)
			); 


			//get approver levels and approvers
			const oListWorkflowStepBinding = oModel.bindList(Constants.Entities.ZWORKFLOW_STEP, null,null, [
				new Filter({ path: Constants.EntitiesFields.WORKFLOW_TYPE, operator: FilterOperator.EQ, value1: Constants.WorkflowType.PRE_APPROVAL }),
				new Filter({ path: Constants.EntitiesFields.WORKFLOW_CODE, operator: FilterOperator.EQ, value1: aCommonWorkflowCode[0] }),
				
			], null);
			const aWorkflowStepContexts = await oListWorkflowStepBinding.requestContexts();
			const aWorkflowStepData = aWorkflowStepContexts.map(oContext => oContext.getObject());
			
			const sWorkflowName =  aWorkflowStepData[0].WORKFLOW_NAME;
			const iWorkflowApprLvl =  aWorkflowStepData[0].WORKFLOW_APPROVAL_LEVELS;

			if(iWorkflowApprLvl > 1){
				var aWorkflowApprStep = sWorkflowName.split("-");
			}else{
				aWorkflowApprStep = [sWorkflowName];
			}

			let aApprEmpID = [];
            if(sWorkflowName == Constants.Approvers.AUTO && iWorkflowApprLvl == 0){
                aApprEmpID.push(Constants.Approvers.AUTO);
                aApproversDetails.push({
                    EEID: null,
                    NAME: Constants.Approvers.AUTO,
                    EMAIL: null,
                    LEVEL: Number(0)
                });
            }else{
                // Variable declarations for Approver Determination logic
                let oCurrOutcome = null;        // Variable to store current outcome ROLE and RANK
                let oPrevOutcome = null;        // Variable to store previous outcome ROLE and RANK
                let iApproverRank = 0;          // Variable to store approver rank to retrieve
                let oApproverDetails = null;    // Variable to store approver details 
                let oBudgetDetails = null;      // Variable to store budget approver details (If applicable)
                let aConstantValues = [];       // Variable to store EEID retrieved from ZCONSTANTS table
                const aRoleRanks = await Helper.getRoleRank(oModel);
                const oClaimantDetails = await Helper.getEmployeeDetails(oModel, sEmpID);
                for(var i = 0; i < aWorkflowApprStep.length; i++){

                    // Start of Approver Determination logic
                    // Standard Workflow logic is when following approver level, the next level should be higher than the previous level
                    // Special case would include first level higher than second level. This case would require the first approver to
                    // Be handled separately from the next level approvers 
                    // After that, the logic will follow the Standard Workflow logic

                    // Check if claimant is CEO
                    // If yes, approver for CEO is CEO_FI
                    if(oClaimantDetails.ROLE === Constants.Role.CEO){
                        aWorkflowApprStep[i] = Constants.User_Type.CEO_FI;
                    }
                    // Populate current role rank
                    oCurrOutcome = aRoleRanks.find(r => r.ROLE === aWorkflowApprStep[i]);
                    
                    
                    if(oCurrOutcome == null){
                        // Block to check for Special Approver within ZCONSTANTS table and budget approver
                        switch(aWorkflowApprStep[i]){
                            case Constants.Approvers.BUDGET:
                                if(sClaimsFinalCC != null){
                                    oBudgetDetails = await Helper.getBudgetDetails(oModel, sClaimsFinalCC, sClaimSubmissionYear);
                                    if(!oBudgetDetails){
                                        MessageToast.show(Utility.getText(this, Constants.Errors.No_BUDGET_ERROR));
                                        throw new Error(Utility.getText(this, Constants.Errors.No_BUDGET_ERROR));
                                    }else{
                                        oApproverDetails = await Helper.getEmployeeDetails(oModel, oBudgetDetails.BUDGET_OWNER_ID);
                                        if(oApproverDetails != null){
                                            aApproversDetails.push({
                                                EEID:   oApproverDetails.EEID,
                                                NAME:   oApproverDetails.NAME,
                                                EMAIL:  oApproverDetails.EMAIL,
                                                LEVEL:  Number(i) + 1
                                            });
                                        }
                                    }
                                }else{
                                    MessageToast.show(Utility.getText(this, Constants.Errors.No_COST_CENTER_ERROR));
                                    throw new Error(Utility.getText(this, Constants.Errors.No_COST_CENTER_ERROR));
                                }
                                break;
                            case Constants.User_Type.CEO_FI:
                            case Constants.User_Type.CASH_FI:
                            case Constants.User_Type.FI_SETTLEMENT_A:
                            case Constants.User_Type.FI_SETTLEMENT_B:
                            case Constants.User_Type.HOD_JKEW:
                                // Possible multiple approvers retrieved from ZCONSTANTS table
                                aConstantValues = await Helper.getConstants(oModel, aWorkflowApprStep[i]);
                                if(aConstantValues){
                                    for(const id of aConstantValues){
                                        if(id.VALUE){
                                            oApproverDetails = await Helper.getEmployeeDetails(oModel, id.VALUE);
                                            if(oApproverDetails){
                                                aApproversDetails.push({
                                                EEID:   oApproverDetails.EEID,
                                                NAME:   oApproverDetails.NAME,
                                                EMAIL:  oApproverDetails.EMAIL,
                                                LEVEL:  Number(i) + 1
                                            });
                                            }else{
                                                MessageToast.show(Utility.getText(this, Constants.Errors.No_APPROVER_DETAILS_ERROR, [id.VALUE]));
                                                throw new Error(Utility.getText(this, Constants.Errors.No_APPROVER_DETAILS_ERROR, [id.VALUE]));
                                            }
                                        }else{
                                            MessageToast.show(Utility.getText(this, Constants.Errors.No_APPROVER_ERROR));
                                            throw new Error(Utility.getText(this, Constants.Errors.No_APPROVER_ERROR));
                                        }
                                    }
                                }
                                break;
                            default:
                        }
                    }
                    else{
                        // Block to check for Approver within the ZROLEHIERARCHY table
                        if(oPrevOutcome == null){
                            // Block to perform logic checking for first level approver

                            //oPrevOutcome = aRoleRanks.find(r => r.ROLE === aWorkflowApprStep[i]);
                            //console.log(oCurrentOutcome.RANK);
                            if(oClaimantDetails.RANK < oCurrOutcome.RANK){
                                iApproverRank = oCurrOutcome.RANK;
                            }
                            else if(oClaimantDetails.RANK = oCurrOutcome.RANK){
                                iApproverRank = iApproverRank + 1;
                            }
                            else{
                                iApproverRank = oClaimantDetails.RANK;
                            }
                        }else if(oPrevOutcome.RANK < oCurrOutcome.RANK){
                            // Block to perform logic checking when previous approver is lower rank than current approver
                            // next level approver would need to be higher than current approver rank
                            iApproverRank = Number(iApproverRank) + 1;
                        }else if(oPrevOutcome.RANK == oCurrOutcome.RANK){
                            // If the Outcome repeats a role, move on to the next role
                            continue;   
                        }else{
                            // If current rank is below previous rank, compare against claimant rank as usual
                            if(oClaimantDetails.RANK < oCurrOutcome.RANK){
                                iApproverRank = oCurrOutcome.RANK;
                            }
                            else if(oClaimantDetails.RANK = oCurrOutcome.RANK){
                                iApproverRank = iApproverRank + 1;
                            }
                            else{
                                iApproverRank = oClaimantDetails.RANK;
                            }
                        }   
                        // Retrieve Approver based on iApproverRank
                        oApproverDetails = await this.getApprover(oModel, sEmpID, iApproverRank);
                        if(oApproverDetails != null){
                            aApproversDetails.push({
                                EEID:   oApproverDetails.EEID,
                                NAME:   oApproverDetails.NAME,
                                EMAIL:  oApproverDetails.EMAIL,
                                LEVEL:  Number(i) + 1
                            });

                            //aApproversDetails.push(oApproverDetails, Number(i) + 1);
                        }
                    } 

                    // Check if approver is found. If approver not found, do not store approver rank and current outcome
                    if(oApproverDetails !== null){
                        iApproverRank = Number(oApproverDetails.RANK);                    
                        oPrevOutcome = oCurrOutcome;
                    }
                /**     
                
                for(var i = 0; i < aWorkflowApprStep.length; i++){
                    for(var x = 0; x < aAllEmpWithSameDepData.length; x++){
                        if(aWorkflowApprStep[i] == aAllEmpWithSameDepData[x].ROLE){
                            aApprEmpID.push(aAllEmpWithSameDepData[x].EEID)						
                        }else if(aWorkflowApprStep[i] == "Budget" && x == 0){
                            const oListBudgetBinding = oModel.bindList("/ZBUDGET", null,null, [
                                new Filter({ path: "YEAR", operator: FilterOperator.EQ, value1: sParSubmissionYear }),
                                new Filter({ path: "FUND_CENTER", operator: FilterOperator.EQ, value1: sParAltCC })
                            ], null);
                            const aContexts = await oListBudgetBinding.requestContexts();
                            const aData = aContexts.map(oContext => oContext.getObject());
                            //aApprEmpID.push(aData[0].BUDGET_OWNER_ID);
                            const oListBudgetOwnerBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                                new Filter({ path: "EMAIL", operator: FilterOperator.EQ, value1: aData[0].BUDGET_OWNER_ID })
                            ], null);
                            const aEEIDContexts = await oListBudgetOwnerBinding.requestContexts();
                            const aEEIDData = aEEIDContexts.map(oContext => oContext.getObject());
                            aApprEmpID.push(aEEIDData[0].EEID);
                        }
                    }
                    */
                }
                
               // at the end of approver determination, do the following
                // 1. Remove duplicate approvers
                // 2. Remove approvers who is the claimant
                // 3. Renumber levels after operation
                const oSeen = new Set();
                let sLevel = 0;
                oSeen.add(oClaimantDetails.EEID);
                for (const oApprover of aApproversDetails){
                    if(!oSeen.has(oApprover.EEID)){
                        oSeen.add(oApprover.EEID);
                        sLevel = sLevel + 1;
                        oApprover.LEVEL = sLevel;
                        aUniqueApproversDetails.push(oApprover);
                    }
                }
            }

            // Variable declaration for substitutes
            let oSubstitute = null;         // Variable to store substitute user
            let oSubstituteDetails = null;  // Variable to store substitute user details
            let sSubstitute_eeid = "";       // Variable to store substitute EEID
            let sSubstitute_name = "";       // Variable to store substitute name
            let sSubstitute_email = "";      // Variable to store substitute email
            // Retrieve substitute for approvers
            for (const oApprover of aUniqueApproversDetails){
                // If LEVEL = 0, Approver is Auto
                if(oApprover.LEVEL > 0){
                    oSubstitute = await Helper.getSubstitute(oModel, oApprover.EEID);
                    if(oSubstitute){
                        oSubstituteDetails = await Helper.getEmployeeDetails(oModel, oSubstitute.EEID);
                        if(oSubstituteDetails){
                            sSubstitute_eeid = oSubstituteDetails.EEID;
                            sSubstitute_name = oSubstituteDetails.NAME;
                            sSubstitute_email = oSubstituteDetails.EMAIL;
                        }
                    }
                }else{
                    sSubstitute_name = Constants.Approvers.AUTO;
                }
                aFullApproversDetails.push({
                    APPROVER_EEID:   oApprover.EEID,
                    APPROVER_NAME:   oApprover.NAME,
                    APPROVER_EMAIL:  oApprover.EMAIL,
                    LEVEL:  Number(oApprover.LEVEL),
                    SUB_EEID:        sSubstitute_eeid,
                    SUB_NAME:        sSubstitute_name,
                    SUB_EMAIL:       sSubstitute_email
                });
            }
            /** 
			let aSubEmpID = [];
			//search for substitute
            if(aApprEmpID[0] != "Auto"){
                for(var i = 0; i < aApprEmpID.length; i++){

                    const oListSubRulesBinding = oModel.bindList("/ZSUBSTITUTION_RULES", null,null, [
                        new Filter({ path: "USER_ID", operator: FilterOperator.EQ, value1: aApprEmpID[i] }),
                        new Filter({ path: "VALID_FROM", operator: FilterOperator.LE, value1: sParSubmissionDate }),
                        new Filter({ path: "VALID_TO", operator: FilterOperator.GE, value1: sParSubmissionDate })
                        
                    ], null);
                    const aSubEmpContexts = await oListSubRulesBinding.requestContexts();
                    const aSubEmpData = aSubEmpContexts.map(oContext => oContext.getObject());

                    if(aSubEmpData[0] != null && aSubEmpData[0] != "" && aSubEmpData[0] != undefined){
                        aSubEmpID.push(aSubEmpData[0].SUBSTITUTE_ID);
                    }else{
                        aSubEmpID.push(null);
                    }
                }
            }
			*/
			//create ZAPPROVER DETAILS
			const oBindApprDetailsList = oModel.bindList(Constants.Entities.ZAPPROVER_DETAILS_PREAPPROVAL);

            // create all contexts
            let aCreatePromises = [];

			//for(var i = 0; i < aApprEmpID.length; i++){
            for(const oApprover of aFullApproversDetails){

                var oContext = oBindApprDetailsList.create({
                    "CLAIM_ID": sClaimID,
                    //"LEVEL": "0",
                    "LEVEL": oApprover.LEVEL,
                    //"APPROVER_ID": "Auto",
                    "APPROVER_ID": oApprover.APPROVER_EEID,
                    "SUBSTITUTE_APPROVER_ID": oApprover.SUB_EEID,
                    "STATUS": oApprover.LEVEL === 1 ? Constants.ClaimStatus.PENDING_APPROVAL : (oApprover.LEVEL === 0 ? Constants.ClaimStatus.APPROVED : "")
                });
                aCreatePromises.push(oContext.created());
                /**
				if(aApprEmpID[i] == "Auto"){
                    var oContext = oBindApprDetailsList.create({
                        "PREAPPROVAL_ID": sPARID,
                        "LEVEL": "0",
                        "APPROVER_ID": "Auto",
                        "SUBSTITUTE_APPROVER_ID": null,
                        "STATUS": "STAT05"
                    });
                }else{
                    if(i == 0){
                        var oContext = oBindApprDetailsList.create({
                        "PREAPPROVAL_ID": sPARID,
                        "LEVEL": i+1,
                        "APPROVER_ID": aApprEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": aSubEmpID[i],
                        "STATUS": "STAT02"
					    });
                    }else{
                        var oContext = oBindApprDetailsList.create({
                        "PREAPPROVAL_ID": sPARID,
                        "LEVEL": i+1,
                        "APPROVER_ID": aApprEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": aSubEmpID[i],
                        "STATUS": null
                        });
                    }
                } 
                */           
			}

            // submit the batch
            await oModel.submitBatch("$auto");

            // wait for all created
            const aCreatedContext = await Promise.all(aCreatePromises);

            //oContext.created().then(async function (){
            try{
            // Send email notification to first level approver or
            // Start Final Approve Step for Auto approve
            // Declaration for this block
                const aPayloadMain = []     // Variable to store payload for sending email
                
                for(const oApprover of aFullApproversDetails){
                    if(oApprover.LEVEL == 1){
                        // Populate array for sending email to approver
                        aPayloadMain.push({
                            "ApproverName":oApprover.APPROVER_NAME, 
                            "SubmissionDate":sClaimsSubmissionDate, 
                            "ClaimantName":oClaimantDetails.NAME, 
                            "ClaimType":oSubmissionTypeDesc.SUBMISSION_TYPE_DESC, 
                            "ClaimID":sClaimID, 
                            "RecipientName":oApprover.APPROVER_NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":oApprover.APPROVER_EMAIL,
                            "NextApproverName":""
                        });
                        if(oApprover.SUB_NAME != ""){
                            // If substitute available, populate payload and send email to substitute also
                            aPayloadMain.push({
                                "ApproverName":oApprover.SUB_NAME, 
                                "SubmissionDate":sClaimsSubmissionDate, 
                                "ClaimantName":oClaimantDetails.NAME, 
                                "ClaimType":oSubmissionTypeDesc.SUBMISSION_TYPE_DESC, 
                                "ClaimID":sClaimID, 
                                "RecipientName":oApprover.SUB_NAME, 
                                "Action": "Notify", 
                                "ReceiverEmail":oApprover.SUB_EMAIL,
                                "NextApproverName":""
                            }); 
                        }
                    }else if(oApprover.LEVEL == 0){
                        FinalApproveStep.onFinalApprove(oModel, sClaimID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                        break;
                    }
                }
                if(aPayloadMain.length > 0){
                    // Send email to approver
                    this.onSendEmail(oModel, aPayloadMain);
                }

                // submit the batch
                await oModel.submitBatch("$auto");

                // wait for all created
                const aCreatedContext = await Promise.all(aCreatePromises);

                /** 
                if(aApprEmpID[0] != "Auto"){
                    const oListApprDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: aApprEmpID[0] })
                    ], null);
                    const aApprNameContexts = await oListApprDetailsBinding.requestContexts();
                    const aApprNameData = aApprNameContexts.map(oContext => oContext.getObject());

                    const oListClaimantDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: sEmpID })
                    ], null);
                    const aClaimantNameContexts = await oListClaimantDetailsBinding.requestContexts();
                    const aClaimantNameData = aClaimantNameContexts.map(oContext => oContext.getObject());

                    if(aApprEmpID.length != 1){
                        const oListNextApprBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: aApprEmpID[1] })
                        ], null);
                        const aNextApprNameContexts = await oListNextApprBinding.requestContexts();
                        const aNextApprNameData = aNextApprNameContexts.map(oContext => oContext.getObject());
                        var sNextApprName = aNextApprNameData[0].NAME;
                    }else{
                        sNextApprName = null;
                    }

                    const oListRequestTypeBinding = oModel.bindList("/ZREQUEST_TYPE", null,null, [
                        new Filter({ path: "REQUEST_TYPE_ID", operator: FilterOperator.EQ, value1: sParSubmissionType })
                    ], null);
                    const aSubmissionTypeNameContexts = await oListRequestTypeBinding.requestContexts();
                    const aSubmissionTypeNameData = aSubmissionTypeNameContexts.map(oContext => oContext.getObject());

                    if(aSubEmpID[0] != null){

                        const oListSubDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: aSubEmpID[0] })
                        ], null);
                        const aApprSubNameContexts = await oListSubDetailsBinding.requestContexts();
                        const aApprSubNameData = aApprSubNameContexts.map(oContext => oContext.getObject());

                        const aPayloadSub ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":sParSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].REQUEST_TYPE_DESC, 
                            "ClaimID":sPARID, 
                            "RecipientName":aApprSubNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprSubNameData[0].EMAIL, 
                            "NextApproverName" : sNextApprName 
                        }

                        const aPayloadMain ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":sParSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].REQUEST_TYPE_DESC, 
                            "ClaimID":sPARID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : sNextApprName 
                        }
                        this.onSendEmail(oModel, aPayloadSub);
                        this.onSendEmail(oModel, aPayloadMain);
                    }else{
                        const aPayload ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":sParSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].REQUEST_TYPE_DESC, 
                            "ClaimID":sPARID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : sNextApprName 
                        }
                        this.onSendEmail(oModel,aPayload);
                    }
                }else{
                    FinalApproveStep.onFinalApprove(oModel, sPARID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                }
                */
            }catch(oError){
                MessageToast.show(Utility.getText(this, Constants.Errors.GENERIC_ERROR, [oError]));
                throw new Error(Utility.getText(this, Constants.errors.GENERIC_ERROR, [oError]));
            }
        },
        /**
         * Recursively find the first superior whose rank is higher than the employee.
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model
         * @param {string} sEEID - Employee being evaluated
         * @param {number} iEmployeeRank - Employee rank for comparison
         * @param {number} idepth - recursion depth to prevent infinite loops
         * @returns {Promise<object|null>} The manager details or null if none found
         */
        getApprover: async function (oModel, sEEID, iApproverRank, idepth = 0) {
            // Safety: stop infinite recursion
            if (idepth > 20) {
                return null;
            }

            // Fetch employee
            const oEmp = await Helper.getEmployeeDetails(oModel, sEEID);
            if (!oEmp) return null;

            // If employee has no superior → stop
            if (!oEmp.DIRECT_SUPERIOR) {
                return null;
            }

            // Fetch direct superior
            const oDirectSuperior = await Helper.getEmployeeDetails(oModel, oEmp.DIRECT_SUPERIOR);
            if (!oDirectSuperior) return null;

            // CEO check
            if (oDirectSuperior.ROLE === Constants.Role.CEO) {
                return oDirectSuperior;
            }

            if (oDirectSuperior.RANK >= iApproverRank) {
                return oDirectSuperior; // ✅ Found the correct manager
            }

            // Otherwise recurse deeper up the chain
            return await this.getApprover(oModel, oDirectSuperior.EEID, iApproverRank, idepth + 1);
        }
    };
    
});

    
