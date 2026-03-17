sap.ui.define([
    "claima/utils/FinalApproveStep",
    "sap/ui/model/Filter"
], function (FinalApproveStep, Filter) {
    "use strict";

    return {
        onSendEmail: async function (oModel, payload){
         
            var stringifyPayload = JSON.stringify(payload);
            var parsePayload = JSON.parse(stringifyPayload);

            var oAction = oModel.bindContext("/sendEmail(...)");
            oAction.setParameter("ApproverName" , parsePayload.ApproverName);
            oAction.setParameter("SubmissionDate" , parsePayload.SubmissionDate);
            oAction.setParameter("ClaimantName" , parsePayload.ClaimantName);
            oAction.setParameter("ClaimType" , parsePayload.ClaimType);
            oAction.setParameter("ClaimID" , parsePayload.ClaimID);
            oAction.setParameter("RecipientName" , parsePayload.RecipientName);
            oAction.setParameter("Action" , parsePayload.Action);
            oAction.setParameter("ReceiverEmail" , parsePayload.ReceiverEmail);
            oAction.setParameter("NextApproverName" , parsePayload.NextApproverName);

            oAction.execute().then(function (){
                console.log("email sent");
            }).catch(function (){
                console.log("email not sent");
            })

		},

        //Aiman Added for MyApproval
        onSendEmailApprover: async function (oModel, payload){
         
            var stringifyPayload = JSON.stringify(payload);
            var parsePayload = JSON.parse(stringifyPayload);

            var oAction = oModel.bindContext("/sendEmail(...)");
            oAction.setParameter("ApproverName" , parsePayload.ApproverName);
            oAction.setParameter("SubmissionDate" , parsePayload.SubmissionDate);
            oAction.setParameter("ClaimantName" , parsePayload.ClaimantName);
            oAction.setParameter("ClaimType" , parsePayload.ClaimType);
            oAction.setParameter("ClaimID" , parsePayload.ClaimID);
            oAction.setParameter("RecipientName" , parsePayload.RecipientName);
            oAction.setParameter("Action" , parsePayload.Action);
            oAction.setParameter("ReceiverEmail" , parsePayload.ReceiverEmail);
            oAction.setParameter("NextApproverName" , parsePayload.NextApproverName);
            oAction.setParameter("RejectReason" , parsePayload.RejectReason);
            oAction.setParameter("ApproverComments" , parsePayload.ApproverComments);

            oAction.execute().then(function (){
                console.log("email sent");
            }).catch(function (){
                console.log("email not sent");
            })

		},
        onClaimsApproverDetermination: async function (oModel, claimID){
			// claim header
			//var oModel = this.getView().getModel();
            var that = this;

			const oListClaimHeaderBinding = oModel.bindList("/ZCLAIM_HEADER", null,null, [
				new Filter({ path: "CLAIM_ID", operator: "EQ", value1: claimID })
			], null);
			const aClaimHeaderContexts = await oListClaimHeaderBinding.requestContexts();
			const aClaimHeaderData = aClaimHeaderContexts.map(oContext => oContext.getObject());

			var empID = aClaimHeaderData[0].EMP_ID;
			//var claimTypeID = aData[0].CLAIM_TYPE_ID;
			var claimsCC = aClaimHeaderData[0].COST_CENTER;
			var claimsAltCC = aClaimHeaderData[0].ALTERNATE_COST_CENTER;
			var claimsSubmissionType = aClaimHeaderData[0].SUBMISSION_TYPE;
			var claimsSubmissionDate = aClaimHeaderData[0].SUBMITTED_DATE;
			var claimSubmissionYear = new Date(aClaimHeaderData[0].SUBMITTED_DATE).getFullYear();

			//claim Item
			//var oModel = this.getView().getModel();
			const oListClaimItemBinding = oModel.bindList("/ZCLAIM_ITEM", null,null, [
				new Filter({ path: "CLAIM_ID", operator: "EQ", value1: claimID })
			], null);
			const aClaimItemsContexts = await oListClaimItemBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

            //Need to change the checking from total_exp_amount to amount
			//let claimItemTotalExpAmtArr = [];
            let claimItemAmountArr = [];
			let claimItemReceiptDateArr = [];
			let claimTypeItemIDArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){

                //Need to change the checking from total_exp_amount to amount
				//claimItemTotalExpAmtArr.push(parseFloat(aClaimsItemData[i].TOTAL_EXP_AMOUNT));
                claimItemAmountArr.push(parseFloat(aClaimsItemData[i].AMOUNT));
				claimItemReceiptDateArr.push(new Date(aClaimsItemData[i].RECEIPT_DATE));
				claimTypeItemIDArr.push(aClaimsItemData[i].CLAIM_TYPE_ITEM_ID);
			}
			
			// furthest date + high amount among all the claim items
			var furthestReceiptDate = new Date(Math.max(...claimItemReceiptDateArr)).toLocaleDateString('en-CA');

            //Need to change the checking from total_exp_amount to amount
			//var highestTotalExpAmt = Math.max(...claimItemTotalExpAmtArr);
            var highestAmount = Math.max(...claimItemAmountArr);

			var claimsOverallRisk;
			let claimsTypeItemRiskArr = [];

			for(var i = 0; i < claimTypeItemIDArr.length; i++){
				//var oModel = this.getView().getModel();
				const oListClaimTypeItemBinding = oModel.bindList("/ZCLAIM_TYPE_ITEM", null,null, [
					new Filter({ path: "CLAIM_TYPE_ITEM_ID", operator: "EQ", value1: claimTypeItemIDArr[i] })
				], null);
				const aClaimTypeItemsContexts = await oListClaimTypeItemBinding.requestContexts();
				const aClaimsTypeItemData = aClaimTypeItemsContexts.map(oContext => oContext.getObject());

				for(var x = 0; x < aClaimsTypeItemData.length; x++){
					claimsTypeItemRiskArr.push(aClaimsTypeItemData[x].RISK);
				}			

			}

			//get overall risk 
			for(var i = 0; i< claimsTypeItemRiskArr.length; i++){
				if(claimsTypeItemRiskArr[i] != claimsTypeItemRiskArr[0]){
					claimsOverallRisk = 'H';
				}else{
					claimsOverallRisk = claimsTypeItemRiskArr[0];
				}
			}
			
			if(claimsOverallRisk == "" || claimsOverallRisk == null){
				claimsOverallRisk = null;
			}

			//get employee info
			//var oModel = this.getView().getModel();
			const oListEmpMasterBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "EEID", operator: "EQ", value1: empID })
			], null);
			const aEmpContexts = await oListEmpMasterBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			var empDept = aEmpData[0].DEP; 
			var empRole = aEmpData[0].ROLE;
			var empCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			//array this. test dep id getting all emp with roles with the same dept id as claimant need to add loop to this as well
			const oListAllEmpMasterBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "DEP", operator: "EQ", value1: empDept }),
				new Filter({ path: "ROLE", operator: "NE", value1: null })
			], null);
			const aAllEmpWithSameDepContexts = await oListAllEmpMasterBinding.requestContexts();
			const aAllEmpWithSameDepData = aAllEmpWithSameDepContexts.map(oContext => oContext.getObject());

			//get all the workflow rules based on workflow type request type (submission type) and role. populate to array and check if there is anything that needs to be checked then pop out the ones that is not needed
			//empRole, claimsSubmissionType, Workflow Type hardcode to CLM
			if(empRole == null || empRole == ""){
				empRole = null;
			}

			if(empDept == "0500000000"){
				if(empRole == null || empRole == ""){
					empRole = "JKEW"
				}else{
					empRole = "JKEW/" + empRole
				}
			}

			//get workflow rule
			const oListWorkflowRuleBinding = oModel.bindList("/ZWORKFLOW_RULE", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "CLM" }),
				new Filter({ path: "REQUEST_TYPE_ID", operator: "EQ", value1: claimsSubmissionType }),
				new Filter({ path: "ROLE", operator: "EQ", value1: empRole })
				
			], null);
			const aWorkflowRuleContexts = await oListWorkflowRuleBinding.requestContexts();
			const aWorkflowRuleData = aWorkflowRuleContexts.map(oContext => oContext.getObject());

			let workflowRuleElimArr = [];
			let nestedWorkflowRuleArr = [];
			for(var i = 0; i < aWorkflowRuleData.length; i++){
				workflowRuleElimArr.push(aWorkflowRuleData[i].THRESHOLD_AMOUNT);
				workflowRuleElimArr.push(aWorkflowRuleData[i].RECEIPT_DAY);
				workflowRuleElimArr.push(aWorkflowRuleData[i].EMPLOYEE_COST_CENTER);
				workflowRuleElimArr.push(aWorkflowRuleData[i].RISK_LEVEL);
				workflowRuleElimArr.push(aWorkflowRuleData[i].OUTCOME_WORKFLOW_CODE);
				workflowRuleElimArr.push(aWorkflowRuleData[i].THRESHOLD_VALUE);
				workflowRuleElimArr.push(aWorkflowRuleData[i].RECEIPT_AGE);
				
				nestedWorkflowRuleArr.push(workflowRuleElimArr);
				workflowRuleElimArr = [];
			}
			
			var dateDiff = new Date(furthestReceiptDate) - new Date(claimsSubmissionDate);
			dateDiff = dateDiff/86400000;
			dateDiff = Math.abs(dateDiff);

			var empCCVal;

            if(claimsAltCC == "" || claimsAltCC == null) {  
				empCCVal = "EQ";
            }else{
                empCCVal = "NE";
            }
			
			var threshholdVal, receiptAge;
			let riskLevelWorkflowCodeArr = [];
			let thresholdWorkflowCodeArr = [];
			let empCCWorkflowCodeArr = [];
			let receiptAgingWorkflowCodeArr = [];
			for(var i = 0; i < nestedWorkflowRuleArr.length; i++){

                if(nestedWorkflowRuleArr[i][3] == null){
                    riskLevelWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
                }else if(claimsOverallRisk == nestedWorkflowRuleArr[i][3]){
                    riskLevelWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
                }


                if(nestedWorkflowRuleArr[i][2] == null){
                    empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
                }else if(empCCVal == nestedWorkflowRuleArr[i][2]){
					empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}

                if(highestAmount > nestedWorkflowRuleArr[i][0]){
					threshholdVal = "GT";
                }else if(highestAmount <= nestedWorkflowRuleArr[i][0]){    
					threshholdVal = "LE";
				}else{
					threshholdVal = null;
				}

                if(nestedWorkflowRuleArr[i][5] == null){
                    thresholdWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
                }else if(threshholdVal == nestedWorkflowRuleArr[i][5]){
					thresholdWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}

				if(dateDiff > nestedWorkflowRuleArr[i][1]){
					receiptAge = "GT";
				}else if(dateDiff <= nestedWorkflowRuleArr[i][1]){
					receiptAge = "LE";
				}else{
					receiptAge = null;
				}

                if(nestedWorkflowRuleArr[i][6] == null){
                    receiptAgingWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
                }else if(receiptAge == nestedWorkflowRuleArr[i][6]){
					receiptAgingWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}
			}

			//filter for the only workflow code that is the same among all the rule checks
			const commonWorkflowCode = [...new Set(riskLevelWorkflowCodeArr)].filter(item => 
				new Set(thresholdWorkflowCodeArr).has(item) && new Set(empCCWorkflowCodeArr).has(item) && new Set(receiptAgingWorkflowCodeArr).has(item)
			);

			//get approver levels and approvers
			const oListWorkflowStepBinding = oModel.bindList("/ZWORKFLOW_STEP", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "CLM" }),
				new Filter({ path: "WORKFLOW_CODE", operator: "EQ", value1: commonWorkflowCode[0] }),
				
			], null);
			const aWorkflowStepContexts = await oListWorkflowStepBinding.requestContexts();
			const aWorkflowStepData = aWorkflowStepContexts.map(oContext => oContext.getObject());
			
			var workflowName =  aWorkflowStepData[0].WORKFLOW_NAME;
			var workflowApprLvl =  aWorkflowStepData[0].WORKFLOW_APPROVAL_LEVELS;
			if(workflowApprLvl > 1){
				var workflowApprStep = workflowName.split("-");
			}else{
				workflowApprStep = [workflowName];
			}

			let apprEmpID = [];

            if(workflowName == "Auto" && workflowApprLvl == 0){
                apprEmpID.push("Auto");
            }else{
                for(var i = 0; i < workflowApprStep.length; i++){
                    for(var x = 0; x < aAllEmpWithSameDepData.length; x++){
                        if(workflowApprStep[i] == aAllEmpWithSameDepData[x].ROLE){
                            apprEmpID.push(aAllEmpWithSameDepData[x].EEID)						
                        }else if(workflowApprStep[i] == "Budget" && x == 0){
                            const oListBudgetBinding = oModel.bindList("/ZBUDGET", null,null, [
                                new Filter({ path: "YEAR", operator: "EQ", value1: claimSubmissionYear }),
                                new Filter({ path: "FUND_CENTER", operator: "EQ", value1: claimsAltCC })
                            ], null);
                            const aContexts = await oListBudgetBinding.requestContexts();
                            const aData = aContexts.map(oContext => oContext.getObject());
                            const oListEmpBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                                new Filter({ path: "EMAIL", operator: "EQ", value1: aData[0].BUDGET_OWNER_ID })
                            ], null);
                            const aEEIDContexts = await oListEmpBinding.requestContexts();
                            const aEEIDData = aEEIDContexts.map(oContext => oContext.getObject());
                            apprEmpID.push(aEEIDData[0].EEID);
                        }
                    }
                }
            }

			let subEmpID = [];
			//search for substitute
            if(apprEmpID[0] != "Auto"){
                for(var i = 0; i < apprEmpID.length; i++){
                    
                    const oListSubRulesBinding = oModel.bindList("/ZSUBSTITUTION_RULES", null,null, [
                        new Filter({ path: "USER_ID", operator: "EQ", value1: apprEmpID[i] }),
                        new Filter({ path: "VALID_FROM", operator: "LE", value1: claimsSubmissionDate }),
                        new Filter({ path: "VALID_TO", operator: "GE", value1: claimsSubmissionDate })
                        
                    ], null);
                    const aSubEmpContexts = await oListSubRulesBinding.requestContexts();
                    const aSubEmpData = aSubEmpContexts.map(oContext => oContext.getObject());

                    if(aSubEmpData[0] != null && aSubEmpData[0] != "" && aSubEmpData[0] != undefined){
                        subEmpID.push(aSubEmpData[0].SUBSTITUTE_ID);
                    }else{
                        subEmpID.push(null);
                    }
			    }
            }
			

			//create ZAPPROVER DETAILS
			var oBindList = oModel.bindList("/ZAPPROVER_DETAILS_CLAIMS");
			for(var i = 0; i < apprEmpID.length; i++){
                if(apprEmpID[i] == "Auto"){
                    var oContext = oBindList.create({
                        "CLAIM_ID": claimID,
                        "LEVEL": "0",
                        "APPROVER_ID": "Auto",
                        "SUBSTITUTE_APPROVER_ID": null,
                        "STATUS": "STAT05"
                    });
                }else{
                    if(i == 0){                    
                    var oContext = oBindList.create({
                        "CLAIM_ID": claimID,
                        "LEVEL": i+1,
                        "APPROVER_ID": apprEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": subEmpID[i],
                        "STATUS": "STAT02"
                        });
                    }else{
                        var oContext = oBindList.create({
                            "CLAIM_ID": claimID,
                            "LEVEL": i+1,
                            "APPROVER_ID": apprEmpID[i],
                            "SUBSTITUTE_APPROVER_ID": subEmpID[i],
                            "STATUS": null
                        });
                    }
                }
			}

            oContext.created().then(async function (){
                console.log("success");
                
                if(apprEmpID[0] != "Auto"){
                    var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: apprEmpID[0] })
                    ], null);
                    const aApprNameContexts = await oListBinding.requestContexts();
                    const aApprNameData = aApprNameContexts.map(oContext => oContext.getObject());
                    
                    var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: empID })
                    ], null);
                    const aClaimantNameContexts = await oListBinding.requestContexts();
                    const aClaimantNameData = aClaimantNameContexts.map(oContext => oContext.getObject());

                    if(apprEmpID.length != 1){
                        var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: apprEmpID[1] })
                        ], null);
                        const aNextApprNameContexts = await oListBinding.requestContexts();
                        var aNextApprNameData = aNextApprNameContexts.map(oContext => oContext.getObject());
                        var nextApprName = aNextApprNameData[0].NAME;
                    }else{
                        nextApprName = null;
                    }
                
                    var oListBinding = oModel.bindList("/ZSUBMISSION_TYPE", null,null, [
                        new Filter({ path: "SUBMISSION_TYPE_ID", operator: "EQ", value1: claimsSubmissionType })
                    ], null);
                    const aSubmissionTypeNameContexts = await oListBinding.requestContexts();
                    const aSubmissionTypeNameData = aSubmissionTypeNameContexts.map(oContext => oContext.getObject());

                    if(subEmpID[0] != null){

                        var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: subEmpID[0] })
                        ], null);
                        const aApprSubNameContexts = await oListBinding.requestContexts();
                        const aApprSubNameData = aApprSubNameContexts.map(oContext => oContext.getObject());

                        var payloadSub ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":claimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC, 
                            "ClaimID":claimID, 
                            "RecipientName":aApprSubNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprSubNameData[0].EMAIL, 
                            "NextApproverName" : nextApprName 
                        }

                        var payloadMain = {
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":claimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC, 
                            "ClaimID":claimID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : nextApprName 
                        }
                        that.onSendEmail(oModel, payloadSub);
                        that.onSendEmail(oModel, payloadMain);
                    }else{
                        var payload ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":claimsSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].SUBMISSION_TYPE_DESC, 
                            "ClaimID":claimID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : nextApprName 
                        }                      
                        that.onSendEmail(oModel, payload);        
                    }
                }else{
                    FinalApproveStep.onFinalApprove(oModel, claimID, 'STAT05', oModel);
                }
                
            }).catch(function(oError){
                console.log(oError);
            })	
			
        },
        onPARApproverDetermination: async function (oModel, PARID){
			// request header
            var that = this;
			const oListRequestHeaderBinding = oModel.bindList("/ZREQUEST_HEADER", null,null, [
				new Filter({ path: "REQUEST_ID", operator: "EQ", value1: PARID })
			], null);
			const aPARHeaderContexts = await oListRequestHeaderBinding.requestContexts();
			const aPARHeaderData = aPARHeaderContexts.map(oContext => oContext.getObject());

			var empID = aPARHeaderData[0].EMP_ID;
			var parCC = aPARHeaderData[0].COST_CENTER;
			var parAltCC = aPARHeaderData[0].ALTERNATE_COST_CENTER; // for budget owner 
			var parSubmissionType = aPARHeaderData[0].REQUEST_TYPE_ID;
			var parSubmissionDate = aPARHeaderData[0].SUBMITTED_DATE;
			var parSubmissionYear = new Date(aPARHeaderData[0].SUBMITTED_DATE).getFullYear();
			var parTripStartDate = aPARHeaderData[0].TRIP_START_DATE;
			
			//request Item
			const oListRequestItemBinding = oModel.bindList("/ZREQUEST_ITEM", null,null, [
				new Filter({ path: "REQUEST_ID", operator: "EQ", value1: PARID })
			], null);
			const aClaimItemsContexts = await oListRequestItemBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

			let parCashAdvArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){
				parCashAdvArr.push(aClaimsItemData[i].CASH_ADVANCE);
			}

			//get employee info
			const oListPAREmpMasterBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "EEID", operator: "EQ", value1: empID })
			], null);
			const aEmpContexts = await oListPAREmpMasterBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			var empDept = aEmpData[0].DEP;
			var empRole = aEmpData[0].ROLE;
			var empCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			const oListPARAllEmpBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new Filter({ path: "DEP", operator: "EQ", value1: empDept }),
				new Filter({ path: "ROLE", operator: "NE", value1: null })
			], null);
			const aAllEmpWithSameDepContexts = await oListPARAllEmpBinding.requestContexts();
			const aAllEmpWithSameDepData = aAllEmpWithSameDepContexts.map(oContext => oContext.getObject());

			if(empRole == null || empRole == ""){
				empRole = null;
			}

			if(empDept == "0500000000"){
				if(empRole == null || empRole == ""){
					empRole = "JKEW"
				}else{
					empRole = "JKEW/" + empRole
				}
			}

			//get workflow rule
			const oListWorkflowRuleBinding = oModel.bindList("/ZWORKFLOW_RULE", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "PRE" }),
				new Filter({ path: "REQUEST_TYPE_ID", operator: "EQ", value1: parSubmissionType }),
				new Filter({ path: "ROLE", operator: "EQ", value1: empRole })
				
			], null);
			const aWorkflowRuleContexts = await oListWorkflowRuleBinding.requestContexts();
			const aWorkflowRuleData = aWorkflowRuleContexts.map(oContext => oContext.getObject());

			let workflowRuleElimArr = [];
			let nestedWorkflowRuleArr = [];
			for(var i = 0; i < aWorkflowRuleData.length; i++){
				workflowRuleElimArr.push(aWorkflowRuleData[i].CASH_ADVANCE);
				workflowRuleElimArr.push(aWorkflowRuleData[i].EMPLOYEE_COST_CENTER);
				workflowRuleElimArr.push(aWorkflowRuleData[i].TRIP_START_DATE);
				workflowRuleElimArr.push(aWorkflowRuleData[i].OUTCOME_WORKFLOW_CODE);
				
				nestedWorkflowRuleArr.push(workflowRuleElimArr);
				workflowRuleElimArr = [];
			}

			var empCCVal;
            if(parAltCC == "" || parAltCC == null) {  
				empCCVal = "EQ";
            }else{
                empCCVal = "NE";
            }
            
			var tripStartAge;//change for trip start date
			let empCCWorkflowCodeArr = [];
			let tripStartAgingWorkflowCodeArr = [];
			let cashAdvWorkflowCodeArr = [];
			var currentDate = new Date();
			parTripStartDate = new Date(parTripStartDate);

            
			for(var i = 0; i < nestedWorkflowRuleArr.length; i++){
                if(nestedWorkflowRuleArr[i][1] == null){
                    empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
                }else if(empCCVal == nestedWorkflowRuleArr[i][1]){
					empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
				}

				if(parTripStartDate >= currentDate){
					tripStartAge = "GE";
				}else if(parTripStartDate < currentDate){
					tripStartAge = "LT";
				}else{
					tripStartAge = null;
				}

                if(nestedWorkflowRuleArr[i][1] == null){
                    empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
                }else if(tripStartAge == nestedWorkflowRuleArr[i][2]){
					tripStartAgingWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
				}

                //cash adv is either true or false. added a null check for human error when user create in config table
                if(nestedWorkflowRuleArr[i][0] == null){
                    cashAdvWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
                }else{
                    if(parCashAdvArr.includes("true") == true){
                        if(nestedWorkflowRuleArr[i][0] == 1){
                            cashAdvWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
                        }
                    }else{
                        if(nestedWorkflowRuleArr[i][0] == 0){
                            cashAdvWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
                        }
                    }
                }
			}


			//filter for the only workflow code that is the same among all the rule checks
			const commonWorkflowCode = [...new Set(empCCWorkflowCodeArr)].filter(item => 
				new Set(tripStartAgingWorkflowCodeArr).has(item) && new Set(cashAdvWorkflowCodeArr).has(item)
			); 


			//get approver levels and approvers
			const oListWorkflowStepBinding = oModel.bindList("/ZWORKFLOW_STEP", null,null, [
				new Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "PRE" }),
				new Filter({ path: "WORKFLOW_CODE", operator: "EQ", value1: commonWorkflowCode[0] }),
				
			], null);
			const aWorkflowStepContexts = await oListWorkflowStepBinding.requestContexts();
			const aWorkflowStepData = aWorkflowStepContexts.map(oContext => oContext.getObject());
			
			var workflowName =  aWorkflowStepData[0].WORKFLOW_NAME;
			var workflowApprLvl =  aWorkflowStepData[0].WORKFLOW_APPROVAL_LEVELS;

			if(workflowApprLvl > 1){
				var workflowApprStep = workflowName.split("-");
			}else{
				workflowApprStep = [workflowName];
			}

			let apprEmpID = [];
            if(workflowName == "Auto" && workflowApprLvl == 0){
                apprEmpID.push("Auto");
            }else{
                for(var i = 0; i < workflowApprStep.length; i++){
                    for(var x = 0; x < aAllEmpWithSameDepData.length; x++){
                        if(workflowApprStep[i] == aAllEmpWithSameDepData[x].ROLE){
                            apprEmpID.push(aAllEmpWithSameDepData[x].EEID)						
                        }else if(workflowApprStep[i] == "Budget" && x == 0){
                            //var oModel = this.getView().getModel();
                            const oListBudgetBinding = oModel.bindList("/ZBUDGET", null,null, [
                                new Filter({ path: "YEAR", operator: "EQ", value1: parSubmissionYear }),
                                new Filter({ path: "FUND_CENTER", operator: "EQ", value1: parAltCC })
                            ], null);
                            const aContexts = await oListBudgetBinding.requestContexts();
                            const aData = aContexts.map(oContext => oContext.getObject());
                            //apprEmpID.push(aData[0].BUDGET_OWNER_ID);
                            const oListBudgetOwnerBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                                new Filter({ path: "EMAIL", operator: "EQ", value1: aData[0].BUDGET_OWNER_ID })
                            ], null);
                            const aEEIDContexts = await oListBudgetOwnerBinding.requestContexts();
                            const aEEIDData = aEEIDContexts.map(oContext => oContext.getObject());
                            apprEmpID.push(aEEIDData[0].EEID);
                        }
                    }
                }
            }
			let subEmpID = [];
			//search for substitute
            if(apprEmpID[0] != "Auto"){
                for(var i = 0; i < apprEmpID.length; i++){

                    const oListSubRulesBinding = oModel.bindList("/ZSUBSTITUTION_RULES", null,null, [
                        new Filter({ path: "USER_ID", operator: "EQ", value1: apprEmpID[i] }),
                        new Filter({ path: "VALID_FROM", operator: "LE", value1: parSubmissionDate }),
                        new Filter({ path: "VALID_TO", operator: "GE", value1: parSubmissionDate })
                        
                    ], null);
                    const aSubEmpContexts = await oListSubRulesBinding.requestContexts();
                    const aSubEmpData = aSubEmpContexts.map(oContext => oContext.getObject());

                    if(aSubEmpData[0] != null && aSubEmpData[0] != "" && aSubEmpData[0] != undefined){
                        subEmpID.push(aSubEmpData[0].SUBSTITUTE_ID);
                    }else{
                        subEmpID.push(null);
                    }
                }
            }
			
			//create ZAPPROVER DETAILS
			var oBindList = oModel.bindList("/ZAPPROVER_DETAILS_PREAPPROVAL");

			for(var i = 0; i < workflowApprLvl; i++){
				if(apprEmpID[i] == "Auto"){
                    var oContext = oBindList.create({
                        "PREAPPROVAL_ID": PARID,
                        "LEVEL": "0",
                        "APPROVER_ID": "Auto",
                        "SUBSTITUTE_APPROVER_ID": null,
                        "STATUS": "STAT05"
                    });
                }else{
                    if(i == 0){
                        var oContext = oBindList.create({
                        "PREAPPROVAL_ID": PARID,
                        "LEVEL": i+1,
                        "APPROVER_ID": apprEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": subEmpID[i],
                        "STATUS": "STAT02"
					    });
                    }else{
                        var oContext = oBindList.create({
                        "PREAPPROVAL_ID": PARID,
                        "LEVEL": i+1,
                        "APPROVER_ID": apprEmpID[i],
                        "SUBSTITUTE_APPROVER_ID": subEmpID[i],
                        "STATUS": null
                        });
                    }
                }
                
                
			}

            oContext.created().then(async function (){
                console.log("success")
                if(apprEmpID[0] != "Auto"){
                    const oListApprDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: apprEmpID[0] })
                    ], null);
                    const aApprNameContexts = await oListApprDetailsBinding.requestContexts();
                    const aApprNameData = aApprNameContexts.map(oContext => oContext.getObject());

                    const oListClaimantDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: empID })
                    ], null);
                    const aClaimantNameContexts = await oListClaimantDetailsBinding.requestContexts();
                    const aClaimantNameData = aClaimantNameContexts.map(oContext => oContext.getObject());

                    if(apprEmpID.length != 1){
                        const oListNextApprBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: apprEmpID[1] })
                        ], null);
                        const aNextApprNameContexts = await oListNextApprBinding.requestContexts();
                        var aNextApprNameData = aNextApprNameContexts.map(oContext => oContext.getObject());
                        var nextApprName = aNextApprNameData[0].NAME;
                    }else{
                        nextApprName = null;
                    }

                    const oListRequestTypeBinding = oModel.bindList("/ZREQUEST_TYPE", null,null, [
                        new Filter({ path: "REQUEST_TYPE_ID", operator: "EQ", value1: parSubmissionType })
                    ], null);
                    const aSubmissionTypeNameContexts = await oListRequestTypeBinding.requestContexts();
                    const aSubmissionTypeNameData = aSubmissionTypeNameContexts.map(oContext => oContext.getObject());

                    if(subEmpID[0] != null){

                        const oListSubDetailsBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
                        new Filter({ path: "EEID", operator: "EQ", value1: subEmpID[0] })
                        ], null);
                        const aApprSubNameContexts = await oListSubDetailsBinding.requestContexts();
                        const aApprSubNameData = aApprSubNameContexts.map(oContext => oContext.getObject());

                        var payloadSub ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":parSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].REQUEST_TYPE_DESC, 
                            "ClaimID":PARID, 
                            "RecipientName":aApprSubNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprSubNameData[0].EMAIL, 
                            "NextApproverName" : nextApprName 
                        }

                        var payloadMain ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":parSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].REQUEST_TYPE_DESC, 
                            "ClaimID":PARID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : nextApprName 
                        }
                        that.onSendEmail(oModel, payloadSub);
                        that.onSendEmail(oModel, payloadMain);
                    }else{
                        var payload ={
                            "ApproverName":aApprNameData[0].NAME, 
                            "SubmissionDate":parSubmissionDate, 
                            "ClaimantName":aClaimantNameData[0].NAME, 
                            "ClaimType":aSubmissionTypeNameData[0].REQUEST_TYPE_DESC, 
                            "ClaimID":PARID, 
                            "RecipientName":aApprNameData[0].NAME, 
                            "Action": "Notify", 
                            "ReceiverEmail":aApprNameData[0].EMAIL, 
                            "NextApproverName" : nextApprName 
                        }
                        that.onSendEmail(oModel,payload);
                    }
                }else{
                    FinalApproveStep.onFinalApprove(oModel, claimID, 'STAT05',oModel);
                }
            }).catch(function(oError){
                console.log(oError);
            })
        }
    };
});