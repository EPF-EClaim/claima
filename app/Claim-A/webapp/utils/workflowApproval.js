//const { odata } = require("@sap/cds");

sap.ui.define([
    "claima/utils/FinalApproveStep",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/FilterOperator",
	"claima/utils/Constants"
], function (FinalApproveStep, Filter, MessageToast,FilterOperator,Constants) {
    "use strict";

    return {
        onSendEmail: async function (oModel, aPayload){
         
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

            oAction.execute();

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
            const that = this;

            // Variable declaration for use of the entire function block
            let aApproversDetails = [];         // Variable to store multiple approvers
            let aFullApproversDetails = [];     // Variable to store approvers with substitutes
            const oSubmissionTypeDesc = [];     // Variable to store claim submission type desc

			const oListClaimHeaderBinding = oModel.bindList("/ZCLAIM_HEADER", null,null, [
				new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: sClaimID })
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

            // Retrieve Submission Type Description
            oSubmissionTypeDesc = await that.getSubmissionTypeDesc(oModel, aClaimHeaderData[0].SUBMISSION_TYPE);

			//claim Item
			const oListClaimItemBinding = oModel.bindList("/ZCLAIM_ITEM", null,null, [
				new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: sClaimID })
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
				const oListClaimTypeItemBinding = oModel.bindList("/ZCLAIM_TYPE_ITEM", null,null, [
					new Filter({ path: "CLAIM_TYPE_ITEM_ID", operator: FilterOperator.EQ, value1: aClaimTypeItemIDArr[i] })
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
					sClaimsOverallRisk = 'H';
				}else{
					sClaimsOverallRisk = aClaimsTypeItemRiskArr[0];
				}
			}
			
			if(sClaimsOverallRisk == "" || sClaimsOverallRisk == null){
				sClaimsOverallRisk = null;
			}

			//get employee info
			const oListEmpMasterBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: sEmpID })
			], null);
			const aEmpContexts = await oListEmpMasterBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			const sEmpDept = aEmpData[0].DEP; 
			var sEmpRole = aEmpData[0].ROLE;
			const sEmpCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			//array this. test dep id getting all emp with roles with the same dept id as claimant need to add loop to this as well
			const oListAllEmpMasterBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "DEP", operator: FilterOperator.EQ, value1: sEmpDept }),
				new Filter({ path: "ROLE", operator: FilterOperator.NE, value1: null })
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
			const oListWorkflowRuleBinding = oModel.bindList("/ZWORKFLOW_RULE", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: Constants.WorkflowType.CLAIM }),
				new Filter({ path: "REQUEST_TYPE_ID", operator: FilterOperator.EQ, value1: sClaimsSubmissionType }),
				new Filter({ path: "ROLE", operator: FilterOperator.EQ, value1: sEmpRole })
				
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
				sEmpCCVal = "EQ";
            }else{
                sEmpCCVal = "NE";
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

                if(iHighestAmount > aNestedWorkflowRuleArr[i][0]){
					sThreshholdVal = "GT";
                }else if(iHighestAmount <= aNestedWorkflowRuleArr[i][0]){    
					sThreshholdVal = "LE";
				}else{
					sThreshholdVal = null;
				}

                if(aNestedWorkflowRuleArr[i][5] == null){
                    aThresholdWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
                }else if(sThreshholdVal == aNestedWorkflowRuleArr[i][5]){
					aThresholdWorkflowCodeArr.push(aNestedWorkflowRuleArr[i][4]);
				}

				if(iDateDiff > aNestedWorkflowRuleArr[i][1]){
					sReceiptAge = "GT";
				}else if(iDateDiff <= aNestedWorkflowRuleArr[i][1]){
					sReceiptAge = "LE";
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
			const oListWorkflowStepBinding = oModel.bindList("/ZWORKFLOW_STEP", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: Constants.WorkflowType.CLAIM }),
				new Filter({ path: "WORKFLOW_CODE", operator: FilterOperator.EQ, value1: aCommonWorkflowCode[0] }),
				
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
            
            if(sWorkflowName == "Auto" && iWorkflowApprLvl == 0){
                aApprEmpID.push("Auto");
                aApproversDetails.push({
                    EEID: null,
                    NAME: "Auto",
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
                const aRoleRanks = await that.getRoleRank(oModel);
                const oClaimantDetails = await that.getEmployeeDetails(oModel, sEmpID);
                for(var i = 0; i < aWorkflowApprStep.length; i++){

                    // Start of Approver Determination logic
                    // Standard Workflow logic is when following approver level, the next level should be higher than the previous level
                    // Special case would include first level higher than second level. This case would require the first approver to
                    // Be handled separately from the next level approvers 
                    // After that, the logic will follow the Standard Workflow logic

                    // Populate current role rank
                    oCurrOutcome = aRoleRanks.find(r => r.ROLE === aWorkflowApprStep[i]);
                    
                    // Check if claimant is CEO
                    // If yes, approver for CEO is CEO_FI
                    if(oClaimantDetails.ROLE === "CEO"){
                        aWorkflowApprStep[i] = "CEO_FI";
                    }
                    if(oCurrOutcome == null){
                        // Block to check for Special Approver within ZCONSTANTS table and budget approver
                        switch(aWorkflowApprStep[i]){
                            case "Budget":
                                if(sClaimsFinalCC != null){
                                    oBudgetDetails = await that.getBudgetDetails(oModel, sClaimsFinalCC, sClaimSubmissionYear);
                                    if(oBudgetDetails == null || oBudgetDetails.EEID == null){
                                        throw new Error("Budget owner cannot be found")
                                    }else{
                                        oApproverDetails = await that.getEmployeeDetails(oModel, oBudgetDetails.BUDGET_OWNER_ID);
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
                                    throw new Error("No Cost Center found for claim")
                                }
                                break;
                            case "CEO_FI":
                            case "FI_SETTLEMENT_A":
                            case "FI_SETTLEMENT_B":
                            case "HOD_JKEW":
                                // Possible multiple approvers retrieved from ZCONSTANTS table
                                aConstantValues = await that.getConstants(oModel, aWorkflowApprStep[i]);
                                if(aConstantValues.length() > 0){
                                    for(const id of aConstantValues){
                                        if(id.VALUE != null || id.VALUE != ""){
                                            oApproverDetails = await that.getEmployeeDetails(oModel, id.VALUE);
                                            if(oApproverDetails){
                                                aApproversDetails.push({
                                                EEID:   oApproverDetails.EEID,
                                                NAME:   oApproverDetails.NAME,
                                                EMAIL:  oApproverDetails.EMAIL,
                                                LEVEL:  Number(i) + 1
                                            });
                                            }else{
                                                throw new Error("No Approver details found for approver " + id.VALUE);
                                            }
                                        }else{
                                            throw new Error("No Approver found in ZCONSTANTS table");
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
                            iApproverRank = Number(iApproverRank) + 1;
                        }else if(oPrevOutcome.RANK == oCurrOutcome.RANK){
                            // If the Outcome repeats a role, move on to the next role
                            continue;
                        }
                        // Retrieve Approver based on iApproverRank
                        oApproverDetails = await that.getApprover(oModel, sEmpID, iApproverRank);
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
                    iApproverRank = Number(oApproverDetails.RANK);                    
                    oPrevOutcome = oCurrOutcome;
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
            }
            
            // Variable declaration for substitutes
            let oSubstitute = null;         // Variable to store substitute user
            let oSubstituteDetails = null;  // Variable to store substitute user details
            let sSubstitute_eeid = "";       // Variable to store substitute EEID
            let sSubstitute_name = "";       // Variable to store substitute name
            let sSubstitute_email = "";      // Variable to store substitute email
            // Retrieve substitute for approvers
            for (const approver of aApproversDetails){
                // If LEVEL = 0, Approver is Auto
                if(approver.LEVEL > 0){
                    oSubstitute = await that.getSubstitute(oModel, approver.EEID);
                    if(oSubstitute){
                        oSubstituteDetails = await that.getEmployeeDetails(oModel, oSubstitute.EEID);
                        if(oSubstituteDetails){
                            sSubstitute_eeid = oSubstituteDetails.EEID;
                            sSubstitute_name = oSubstituteDetails.NAME;
                            sSubstitute_email = oSubstituteDetails.EMAIL;
                        }
                    }
                }else{
                    sSubstitute_name = "Auto";
                }
                aFullApproversDetails.push({
                    APPROVER_EEID:   approver.EEID,
                    APPROVER_NAME:   approver.NAME,
                    APPROVER_EMAIL:  approver.EMAIL,
                    LEVEL:  Number(approver.LEVEL),
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
			const oBindApprDetailsList = oModel.bindList("/ZAPPROVER_DETAILS_CLAIMS");
			//for(var i = 0; i < aApprEmpID.length; i++){
            for(var i = 0; i < aFullApproversDetails.length; i++){
                //if(aApprEmpID[i] == "Auto"){
                if(aFullApproversDetails[i].LEVEL == 0){
                    var oContext = oBindApprDetailsList.create({
                        "CLAIM_ID": sClaimID,
                        //"LEVEL": "0",
                        "LEVEL": aFullApproversDetails[i].LEVEL,
                        //"APPROVER_ID": "Auto",
                        "APPROVER_ID": aFullApproversDetails[i].APPROVER_EEID,
                        "SUBSTITUTE_APPROVER_ID": aFullApproversDetails[i].SUB_EEID,
                        "STATUS": "STAT05"
                    });
                }else{
                    //if(i == 0){    
                    if(aFullApproversDetails[i].LEVEL == 1){                
                    var oContext = oBindApprDetailsList.create({
                        "CLAIM_ID": sClaimID,
                        //"LEVEL": i+1,
                        "LEVEL": aFullApproversDetails[i].LEVEL,
                        //"APPROVER_ID": aApprEmpID[i],
                        "APPROVER_ID": aFullApproversDetails[i].APPROVER_EEID,
                        //"SUBSTITUTE_APPROVER_ID": aSubEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": aFullApproversDetails[i].SUB_EEID,
                        "STATUS": "STAT02"
                        });
                    }else{
                        var oContext = oBindApprDetailsList.create({
                            "CLAIM_ID": sClaimID,
                            //"LEVEL": i+1,
                            "LEVEL": aFullApproversDetails[i].LEVEL,
                            //"APPROVER_ID": aApprEmpID[i],
                            "APPROVER_ID": aFullApproversDetails[i].APPROVER_EEID,
                            //"SUBSTITUTE_APPROVER_ID": aSubEmpID[i],
                            "SUBSTITUTE_APPROVER_ID": aFullApproversDetails[i].SUB_EEID,
                            "STATUS": null
                        });
                    }
                }
			}

            oContext.created().then(async function (){
            // Send email notification to first level approver or
            // Start Final Approve Step for Auto approve
            // Declaration for this block
                const aPayloadMain = []     // Variable to store payload for sending email
                
                for(const approver of aFullApproversDetails){
                    if(Number(aFullApproversDetails.LEVEL) = 1){
                        // Populate array for sending email to approver
                        aPayloadMain.push({
                            "ApproverName":approver.APPROVER_NAME, 
                            "SubmissionDate":sClaimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":oSubmissionTypeDesc.SUBMISSION_TYPE_DESC, 
                            "ClaimID":sClaimID, 
                            "RecipientName":approver.APPROVER_NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":approver.APPROVER_EMAIL
                        });
                        // Send email to approver
                        that.onSendEmail(oModel, aPayload); 
                        if(approver.SUB_NAME != ""){
                            // If substitute available, populate payload and send email to substitute also
                            aPayloadMain.push({
                                "ApproverName":approver.SUB_NAME, 
                                "SubmissionDate":sClaimsSubmissionDate, 
                                "ClaimantName":aClaimantNameData[0].NAME, 
                                "ClaimType":oSubmissionTypeDesc.SUBMISSION_TYPE_DESC, 
                                "ClaimID":sClaimID, 
                                "RecipientName":approver.SUB_NAME, 
                                "Action": "Notify", 
                                "ReceiverEmail":approver.SUB_EMAIL
                            });
                            that.onSendEmail(oModel, aPayload); 
                        }
                    }else if(Number(approver.LEVEL) = 0){
                        FinalApproveStep.onFinalApprove(oModel, sClaimID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                        break;
                    }
                }

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
                        that.onSendEmail(oModel, aPayloadSub);
                        that.onSendEmail(oModel, aPayloadMain);
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
                        that.onSendEmail(oModel, aPayload);        
                    }
                }else{
                    FinalApproveStep.onFinalApprove(oModel, sClaimID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                }
                */
            }).catch(function(oError){
                new MessageToast.show(oError);
            })	
			
        },
        onPARApproverDetermination: async function (oModel, sPARID, oEmployeeModel){
			// request header
            const that = this;
			const oListRequestHeaderBinding = oModel.bindList("/ZREQUEST_HEADER", null,null, [
				new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: sPARID })
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
			
			//request Item
			const oListRequestItemBinding = oModel.bindList("/ZREQUEST_ITEM", null,null, [
				new Filter({ path: "REQUEST_ID", operator: FilterOperator.EQ, value1: sPARID })
			], null);
			const aClaimItemsContexts = await oListRequestItemBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

			let aParCashAdvArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){
				aParCashAdvArr.push(aClaimsItemData[i].CASH_ADVANCE);
			}

			//get employee info
			const oListPAREmpMasterBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "EEID", operator: FilterOperator.EQ, value1: sEmpID })
			], null);
			const aEmpContexts = await oListPAREmpMasterBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			const sEmpDept = aEmpData[0].DEP;
			var sEmpRole = aEmpData[0].ROLE;
			const sEmpCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			const oListPARAllEmpBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "DEP", operator: FilterOperator.EQ, value1: sEmpDept }),
				new Filter({ path: "ROLE", operator: FilterOperator.NE, value1: null })
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
			const oListWorkflowRuleBinding = oModel.bindList("/ZWORKFLOW_RULE", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: Constants.WorkflowType.PRE_APPROVAL }),
				new Filter({ path: "REQUEST_TYPE_ID", operator: FilterOperator.EQ, value1: sParSubmissionType }),
				new Filter({ path: "ROLE", operator: FilterOperator.EQ, value1: sEmpRole })
				
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
				sEmpCCVal = "EQ";
            }else{
                sEmpCCVal = "NE";
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
					sTripStartAge = "GE";
				}else if(sParTripStartDate < dCurrentDate){
					sTripStartAge = "LT";
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
			const oListWorkflowStepBinding = oModel.bindList("/ZWORKFLOW_STEP", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: Constants.WorkflowType.PRE_APPROVAL }),
				new Filter({ path: "WORKFLOW_CODE", operator: FilterOperator.EQ, value1: aCommonWorkflowCode[0] }),
				
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
            if(sWorkflowName == "Auto" && iWorkflowApprLvl == 0){
                aApprEmpID.push("Auto");
            }else{
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
                }
            }
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
			
			//create ZAPPROVER DETAILS
			const oBindApprDetailsList = oModel.bindList("/ZAPPROVER_DETAILS_PREAPPROVAL");

			for(var i = 0; i < aApprEmpID.length; i++){
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
			}

            oContext.created().then(async function (){
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
                        that.onSendEmail(oModel, aPayloadSub);
                        that.onSendEmail(oModel, aPayloadMain);
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
                        that.onSendEmail(oModel,aPayload);
                    }
                }else{
                    FinalApproveStep.onFinalApprove(oModel, sPARID, Constants.ClaimStatus.APPROVED, oEmployeeModel);
                }
            }).catch(function(oError){
                new MessageToast.show(oError);
            })
        },
        /**
         * Fetch Submission Type Description from ZSUBMISSION_TYPE by Submission Type ID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sSubmissionTypeID - Submission Type ID
         * @returns {Promise<object|null>} - Submission type description or null if not found
         */
        getSubmissionTypeDesc: async function (oModel, sSubmissionTypeID) {

            const that = this;
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getSubmissionTypeDesc()");
            }
            if (!sSubmissionTypeID) {
                throw new Error("Submission Type ID is required to fetch employee details.");
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sTable = "/ZSUBMISSION_TYPE";

            // Build filter
            const aFilters = [
                new Filter("SUBMISSION_TYPE_ID", FilterOperator.EQ, sSubmissionTypeID)
            ];

            // Bind list
            const binding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await binding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            oData = aCtx[0].getObject();

            // Return only the required fields
            return {
                SUBMISSION_TYPE_ID:     oData.SUBMISSION_TYPE_ID,
                SUBMISSION_TYPE_DESC:   oData.SUBMISSION_TYPE_DESC
            };
        },
        /**
         * Fetch employee master record from ZEMP_MASTER by EEID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sEEID - Employee ID (EEID)
         * @returns {Promise<object|null>} - Employee data or null if not found
         */
        getEmployeeDetails: async function (oModel, sEEID) {

            const that = this;
            let sRank = "";
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getEmployeeDetails()");
            }
            if (!sEEID) {
                throw new Error("EEID is required to fetch employee details.");
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sTable = "/ZEMP_MASTER";

            // Build filter
            const aFilters = [
                new Filter("EEID", FilterOperator.EQ, sEEID)
            ];

            // Bind list
            const binding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await binding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            else{
                oData = aCtx[0].getObject();
                if(oData.ROLE === "" || oData.ROLE === null){
                    sRank = 0;
                }else{
                    const aEmpRoleRank = await that.getRoleRank(oModel, oData.ROLE)
                    sRank = aEmpRoleRank[0].RANK;
                }
            }

            // Return only the required fields
            return {
                EEID:               oData.EEID,
                NAME:               oData.NAME,
                EMAIL:              oData.EMAIL,
                DEPARTMENT:         oData.DEPARTMENT,
                ROLE:               oData.ROLE,
                RANK:               sRank,
                DIRECT_SUPERIOR:    oData.DIRECT_SUPPERIOR
            };
        },
        /**
         * Fetch substitution rule record from ZSUBSTITUTION_RULES by EEID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sApproverEEID - Approver ID (EEID)
         * @param {Date} [dDate] - Optional date (defaults to today)
         * @returns {Promise<object|null>} - Employee data or null if not found
         */
        getSubstitute: async function (oModel, sApproverEEID, dDate = new Date()) {

            const that = this;
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getSubstitute()");
            }
            if (!sApproverEEID) {
                throw new Error("EEID is required to fetch employee details.");
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sTable = "/ZSUBSTITUTION_RULES";

            // Convert to ISO date string (YYYY-MM-DD)
            const sToday = dDate.toISOString().split("T")[0];
            
            // Filters:
            // USER_ID EQ EEID
            // VALID_FROM LE today
            // VALID_TO GE today
            const aFilters = [
                new Filter("USER_ID", FilterOperator.EQ, sApproverEEID),
                new Filter("VALID_FROM", FilterOperator.LE, sToday),
                new Filter("VALID_TO", FilterOperator.GE, sToday)
            ];

            // Bind list
            const binding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await binding.requestContexts(0, Infinity);
            if (!aCtx || aCtx.length === 0) {
                return null; // no substitute found
            }
            const oData = aCtx[0].getObject();
            const oEmployeeDetail = await that.getEmployeeDetails(oModel, oData.SUBSTITUTE_ID);

            // Return only the required fields
            return {
                EEID:               oEmployeeDetail.EEID,
                NAME:               oEmployeeDetail.NAME,
                EMAIL:              oEmployeeDetail.EMAIL,
                DEPARTMENT:         oEmployeeDetail.DEPARTMENT,
                ROLE:               oEmployeeDetail.ROLE,
                RANK:               oEmployeeDetail.RANK,
                DIRECT_SUPERIOR:    oEmployeeDetail.DIRECT_SUPPERIOR
            };
        },
        /**
         * Fetch budget record from ZBUDGET by Cost Center and Year
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sCostCenter - Cost Center
         * @param {string} sYear - Year
         * @returns {Promise<object|null>} - Budget data or null if not found
         */
        getBudgetDetails: async function (oModel, sCostCenter, sYear) {

            const that = this;
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getBudgetDetails()");
            }
            if (!sCostCenter) {
                throw new Error("sCostCenter is required to fetch budget details.");
            }
            if (!sYear) {
                throw new Error("sYear is required to fetch budget details")
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sTable = "/ZBUDGET";

            // Build filter
            const aFilters = [
                new Filter("FUND_CENTER", FilterOperator.EQ, sCostCenter),
                new Filter("YEAR", FilterOperator.EQ, sYear)
            ];

            // Bind list
            const binding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await binding.requestContexts(0, Infinity);
            if (!aCtx || aCtx.length === 0) {
                return null; // no budget data found
            }
            else{
                const oData = aCtx[0].getObject();
                const oBudgetOwner = await that.getEmployeeDetailsByEmail(oModel, oData.BUDGET_OWNER_ID)
            }

            // Return only the required fields
            return {
                YEAR:               oData.YEAR,
                INTERNAL_ORDER:     oData.INTERNAL_ORDER,
                COMMITMENT_ITEM:    oData.COMMITMENT_ITEM,
                FUND_CENTER:        oData.FUND_CENTER,
                MATERIAL_GROUP:     oData.MATERIAL_GROUP,
                BUDGET_OWNER_EMAIL: oData.BUDGET_OWNER_ID,
                BUDGET_OWNER_ID:    oBudgetOwner.EEID
            };
        },
        /**
         * Fetch employee master record from ZEMP_MASTER by Email
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sEmail - Email (EEID)
         * @returns {Promise<object|null>} - Employee data or null if not found
         */
        getEmployeeDetailsByEmail: async function (oModel, sEmail) {

            const that = this;
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getEmployeeDetailsByEmail()");
            }
            if (!sEmail) {
                throw new Error("Email is required to fetch employee details.");
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sTable = "/ZEMP_MASTER";

            // Build filter
            const aFilters = [
                new Filter("EMAIL", FilterOperator.EQ, sEmail)
            ];

            // Bind list
            const binding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await binding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            else{
                oData = aCtx[0].getObject();
                if(oData.ROLE === "" || oData.ROLE === null){
                    sRank = 0;
                }else{
                    const aEmpRoleRank = await that.getRoleRank(oModel, oData.ROLE)
                    sRank = aEmpRoleRank[0].RANK;
                }
            }

            // Return only the required fields
            return {
                EEID:               oData.EEID,
                NAME:               oData.NAME,
                EMAIL:              oData.EMAIL,
                DEPARTMENT:         oData.DEPARTMENT,
                ROLE:               oData.ROLE,
                RANK:               sRank,
                DIRECT_SUPERIOR:    oData.DIRECT_SUPPERIOR
            };
        },
        /**
         * Fetch role rank record from ZROLEHIERARCHY by ROLE
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} [sRole] - Optional ROLE parameter
         * @returns {Promise<Array>} - Array of { ROLE, RANK } objects
         */
        getRoleRank: async function (oModel, sRole) {
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getRoleHierarchy()");
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            const sTable = "/ZROLEHIERARCHY";
            // Build filter list
            const aFilters = [];
            // Apply filter only if ROLE parameter is passed
            if (sRole) {
                aFilters.push(new Filter("ROLE", FilterOperator.EQ, sRole));
            }

            // Bind list
            const oBinding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch records
            const aCtx = await oBinding.requestContexts(0, Infinity);
            const rows = aCtx.map(ctx => ctx.getObject());

            // Return only needed fields
            return rows.map(r => ({
                ROLE: r.ROLE,
                RANK: r.RANK
            }));
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
            const that = this;
            // Safety: stop infinite recursion
            if (idepth > 20) {
                return null;
            }

            // Fetch employee
            const oEmp = await that.getEmployeeDetails(oModel, sEEID);
            if (!oEmp) return null;

            // If employee has no superior → stop
            if (!oEmp.DIRECT_SUPERIOR) {
                return null;
            }

            // Fetch direct superior
            const oDirectSuperior = await that.getEmployeeDetails(oModel, oEmp.DIRECT_SUPERIOR);
            if (!oDirectSuperior) return null;

            // CEO check
            if (oDirectSuperior.ROLE === "CEO") {
                return oDirectSuperior;
            }

            if (oDirectSuperior.RANK >= iApproverRank) {
                return oDirectSuperior; // ✅ Found the correct manager
            }

            // Otherwise recurse deeper up the chain
            return await that.getApprover(oModel, oDirectSuperior.EEID, iApproverRank, idepth + 1);
        },
        /**
         * Fetch Value record from ZCONSTANTS table by ID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sID - ID
         * @returns {Promise<object|null>} - Constant data or null if not found
         */
        getConstants: async function (oModel, sID) {

            const that = this;
            // --- Sanity check ---
            if (!oModel) {
                throw new Error("oModel is undefined in getConstants()");
            }
            if (!sID) {
                throw new Error("ID is required to fetch Constant details.");
            }

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sTable = "/ZCONSTANTS";

            // Build filter
            const aFilters = [
                new Filter("ID", FilterOperator.EQ, sID)
            ];

            // Bind list
            const binding = oModel.bindList(
                sTable,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await binding.requestContexts(0, Infinity);
            const rows = aCtx.map(ctx => ctx.getObject());

            // Return only needed fields
            return rows.map(r => ({
                ROLE: r.ID,
                RANK: r.VALUE
            }));
        }
    };
    
});

    
