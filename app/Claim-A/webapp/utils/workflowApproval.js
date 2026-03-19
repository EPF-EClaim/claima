sap.ui.define([
    "claima/utils/FinalApproveStep",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/FilterOperator"
], function (FinalApproveStep, Filter, MessageToast,FilterOperator) {
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

			const oListClaimHeaderBinding = oModel.bindList("/ZCLAIM_HEADER", null,null, [
				new Filter({ path: "CLAIM_ID", operator: FilterOperator.EQ, value1: sClaimID })
			], null);
			const aClaimHeaderContexts = await oListClaimHeaderBinding.requestContexts();
			const aClaimHeaderData = aClaimHeaderContexts.map(oContext => oContext.getObject());

			const sEmpID = aClaimHeaderData[0].EMP_ID;
			const sClaimCC = aClaimHeaderData[0].COST_CENTER;
			const sClaimsAltCC = aClaimHeaderData[0].ALTERNATE_COST_CENTER;
			const sClaimsSubmissionType = aClaimHeaderData[0].SUBMISSION_TYPE;
			const sClaimsSubmissionDate = aClaimHeaderData[0].SUBMITTED_DATE;
			const sClaimSubmissionYear = new Date(aClaimHeaderData[0].SUBMITTED_DATE).getFullYear();

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
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: "CLM" }),
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
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: "CLM" }),
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
                }
            }

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
			

			//create ZAPPROVER DETAILS
			const oBindApprDetailsList = oModel.bindList("/ZAPPROVER_DETAILS_CLAIMS");
			for(var i = 0; i < aApprEmpID.length; i++){
                if(aApprEmpID[i] == "Auto"){
                    var oContext = oBindApprDetailsList.create({
                        "CLAIM_ID": sClaimID,
                        "LEVEL": "0",
                        "APPROVER_ID": "Auto",
                        "SUBSTITUTE_APPROVER_ID": null,
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
                    FinalApproveStep.onFinalApprove(oModel, sClaimID, 'STAT05', oEmployeeModel);
                }
                
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
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: "PRE" }),
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
				new Filter({ path: "WORKFLOW_TYPE", operator: FilterOperator.EQ, value1: "PRE" }),
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

			for(var i = 0; i < iWorkflowApprLvl; i++){
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
                    FinalApproveStep.onFinalApprove(oModel, sPARID, 'STAT05', oEmployeeModel);
                }
            }).catch(function(oError){
                new MessageToast.show(oError);
            })
        }
    };
});