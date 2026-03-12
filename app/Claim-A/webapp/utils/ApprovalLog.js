sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {

		/* =========================================================
		* Approval Log Fragment
		* ======================================================= */

		async _showApprovalLog(that) {
			const oPage = that.byId("request_form");
			if (!oPage) return;

			const oCreate = await that._getFormFragment("approval_log");
			await that._replaceContentAt(oPage, 2, oCreate);
		},
        
		/* =========================================================
		* JSONModel Reset
		* ======================================================= */

        _ensureRequestModelDefaults(oReq) {
			const data = oReq.getData() || {};
			data.req_header        = { reqid: "", grptype: "IND" };
			data.req_item_rows     = [];
			data.req_item          = data.req_item || {
				cash_advance: "no_cashadv"
			};
			data.participant       = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view              = "view";
			data.list_count        = 0;
			oReq.setData(data);
		},

		/* =========================================================
		* Get List from Backend
		* ======================================================= */

		async getApproverList(oReq, oModel, id) {

            let submission_type = id.substring(0,3);
            let oListBinding;

            if (submission_type == "REQ") {
                oListBinding = oModel.bindList("/ZEMP_APPROVER_REQUEST_DETAILS", undefined,
                    null,[new Filter("PREAPPROVAL_ID", "EQ", id)],
                    {
                        $$ownRequest: true,
                        $$groupId: "$auto",
                        $$updateGroupId: "$auto"
                    }
                );
            } else if (submission_type == "CLM") {
                oListBinding = oModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
                    null,[new Filter("CLAIM_ID", "EQ", id)],
                    {
                        $$ownRequest: true,
                        $$groupId: "$auto",
                        $$updateGroupId: "$auto"
                    }
                );
            }

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());
                
				oReq.setProperty("/approval", a);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/approval", []);
				return [];
			}
		},

        onClaimsApproverDetermination: async function (oModel, claimID){
			//test variables
			var empID = 1900668;

			// claim header
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZCLAIM_HEADER", null,null, [
				new sap.ui.model.Filter({ path: "CLAIM_ID", operator: "EQ", value1: claimID })
			], null);
			const aClaimHeaderContexts = await oListBinding.requestContexts();
			const aClaimHeaderData = aClaimHeaderContexts.map(oContext => oContext.getObject());

			//var empID = aData[0].EMP_ID commented for test
			//var claimTypeID = aData[0].CLAIM_TYPE_ID;
			var claimsCC = aClaimHeaderData[0].COST_CENTER;
			var claimsAltCC = aClaimHeaderData[0].ALTERNATE_COST_CENTER;
			var claimsRequestID = aClaimHeaderData[0].REQUEST_ID;
			var claimsSubmissionType = aClaimHeaderData[0].SUBMISSION_TYPE;
			var claimsSubmissionDate = aClaimHeaderData[0].SUBMITTED_DATE;
			var claimSubmissionYear = new Date(aClaimHeaderData[0].SUBMITTED_DATE).getFullYear();

			//claim Item
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZCLAIM_ITEM", null,null, [
				new sap.ui.model.Filter({ path: "CLAIM_ID", operator: "EQ", value1: claimID })
			], null);
			const aClaimItemsContexts = await oListBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

			let claimItemTotalExpAmtArr = [];
			let claimItemReceiptDateArr = [];
			let claimTypeItemIDArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){

				claimItemTotalExpAmtArr.push(parseFloat(aClaimsItemData[i].TOTAL_EXP_AMOUNT));
				claimItemReceiptDateArr.push(new Date(aClaimsItemData[i].RECEIPT_DATE));
				claimTypeItemIDArr.push(aClaimsItemData[i].CLAIM_TYPE_ITEM_ID);
			}
			
			// furthest date + high amount among all the claim items
			var furthestReceiptDate = new Date(Math.max(...claimItemReceiptDateArr)).toLocaleDateString('en-CA');
			var highestTotalExpAmt = Math.max(...claimItemTotalExpAmtArr);

			var claimsOverallRisk;
			let claimsTypeItemRiskArr = [];

			for(var i = 0; i < claimTypeItemIDArr.length; i++){
				//var oModel = this.getView().getModel();
				var oListBinding = oModel.bindList("/ZCLAIM_TYPE_ITEM", null,null, [
					new sap.ui.model.Filter({ path: "CLAIM_TYPE_ITEM_ID", operator: "EQ", value1: claimTypeItemIDArr[i] })
				], null);
				const aClaimTypeItemsContexts = await oListBinding.requestContexts();
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

			//get employee info
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new sap.ui.model.Filter({ path: "EEID", operator: "EQ", value1: empID })
			], null);
			const aEmpContexts = await oListBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			var departmentID =  aEmpData[0].DEP;
			var empDept = aEmpData[0].DEP; //to set into the url
			var empRole = aEmpData[0].ROLE;
			var empCC = aEmpData[0].CC;

			//JKEW dept = 0500000000
			//array this. test dep id getting all emp with roles with the same dept id as claimant need to add loop to this as well
			departmentID = 4300100000;
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new sap.ui.model.Filter({ path: "DEP", operator: "EQ", value1: departmentID }),
				new sap.ui.model.Filter({ path: "ROLE", operator: "NE", value1: null })
			], null);
			const aAllEmpWithSameDepContexts = await oListBinding.requestContexts();
			const aAllEmpWithSameDepData = aAllEmpWithSameDepContexts.map(oContext => oContext.getObject());

			//get all the workflow rules based on workflow type request type (submission type) and role. populate to array and check if there is anything that needs to be checked then pop out the ones that is not needed
			//empRole, claimsSubmissionType, Workflow Type hardcode to CLM
			claimsSubmissionType = "ST0001"; //for testing
			if(empRole == null){
				empRole = "HOS";
			}

			if(empDept == "0500000000"){
				if(empRole == null || empRole == ""){
					empRole = "JKEW"
				}else{
					empRole = "JKEW/" + empRole
				}
			}

			//get workflow rule
			var oListBinding = oModel.bindList("/ZWORKFLOW_RULE", null,null, [
				new sap.ui.model.Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "CLM" }),
				new sap.ui.model.Filter({ path: "REQUEST_TYPE_ID", operator: "EQ", value1: claimsSubmissionType }),
				new sap.ui.model.Filter({ path: "ROLE", operator: "EQ", value1: empRole })
				
			], null);
			const aWorkflowRuleContexts = await oListBinding.requestContexts();
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

			//dateDiff receipt age from submission date
			//claimsOverallRisk; risk either L H or empty
			//highestTotalExpAmt; highest amt
			//empCCVal; whether match, not match or empty
			//check if i need to check any of these values for rules

			if(claimsCC != empCC){
				empCCVal = "NE";
			}else if (claimsCC == empCC){
				empCCVal = "EQ";
			}else{
				empCCVal = "";
			}
			var threshholdVal, receiptAge;
			var empCCVal = "";
			let riskLevelWorkflowCodeArr = [];
			let thresholdWorkflowCodeArr = [];
			let empCCWorkflowCodeArr = [];
			let receiptAgingWorkflowCodeArr = [];

			for(var i = 0; i < nestedWorkflowRuleArr.length; i++){
				if(claimsOverallRisk == nestedWorkflowRuleArr[i][3]){
					riskLevelWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}

				if(empCCVal == nestedWorkflowRuleArr[i][2]){
					empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}

				if(highestTotalExpAmt > nestedWorkflowRuleArr[i][0]){
					threshholdVal = "GT";
				}else if(highestTotalExpAmt < nestedWorkflowRuleArr[i][0]){
					threshholdVal = "LE";
				}else{
					threshholdVal = "";
				}

				if(threshholdVal == nestedWorkflowRuleArr[i][5]){
					thresholdWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}

				if(empCCVal == nestedWorkflowRuleArr[i][2]){
					empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}

				var dateDiff = new Date(furthestReceiptDate) - new Date(claimsSubmissionDate);
				dateDiff = dateDiff/86400000;

				if(dateDiff > nestedWorkflowRuleArr[i][1]){
					receiptAge = "GT";
				}else if(dateDiff < nestedWorkflowRuleArr[i][1]){
					receiptAge = "LE";
				}else{
					receiptAge = "";
				}

				if(receiptAge == nestedWorkflowRuleArr[i][6]){
					receiptAgingWorkflowCodeArr.push(nestedWorkflowRuleArr[i][4]);
				}
			}
			//filter for the only workflow code that is the same among all the rule checks
			const commonWorkflowCode = [...new Set(riskLevelWorkflowCodeArr)].filter(item => 
				new Set(thresholdWorkflowCodeArr).has(item) && new Set(empCCWorkflowCodeArr).has(item) && new Set(receiptAgingWorkflowCodeArr).has(item)
			);
			
			//get approver levels and approvers
			var oListBinding = oModel.bindList("/ZWORKFLOW_STEP", null,null, [
				new sap.ui.model.Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "CLM" }),
				new sap.ui.model.Filter({ path: "WORKFLOW_CODE", operator: "EQ", value1: commonWorkflowCode[0] }),
				
			], null);
			const aWorkflowStepContexts = await oListBinding.requestContexts();
			const aWorkflowStepData = aWorkflowStepContexts.map(oContext => oContext.getObject());
			
			var workflowName =  aWorkflowStepData[0].WORKFLOW_NAME;
			var workflowApprLvl =  aWorkflowStepData[0].WORKFLOW_APPROVAL_LEVELS;
			workflowApprLvl = 3;
			workflowName = "CXO"
			if(workflowApprLvl > 1){
				var workflowApprStep = workflowName.split("-");
			}else{
				workflowApprStep = [workflowName];
			}

			let apprEmpID = [];
			claimsAltCC = "4001";

			for(var i = 0; i < workflowApprStep.length; i++){
				for(var x = 0; x < aAllEmpWithSameDepData.length; x++){
					//console.log(workflowApprStep[i] + approverDetailsDataArr[x].ROLE);
					if(workflowApprStep[i] == aAllEmpWithSameDepData[x].ROLE){
						apprEmpID.push(aAllEmpWithSameDepData[x].EEID)						
					}else if(workflowApprStep[i] == "Budget" && x == 0){
						//var oModel = this.getView().getModel();
						var oListBinding = oModel.bindList("/ZBUDGET", null,null, [
							new sap.ui.model.Filter({ path: "YEAR", operator: "EQ", value1: claimSubmissionYear }),
							new sap.ui.model.Filter({ path: "FUND_CENTER", operator: "EQ", value1: claimsAltCC })
						], null);
						const aContexts = await oListBinding.requestContexts();
						const aData = aContexts.map(oContext => oContext.getObject());
						apprEmpID.push(aData[0].BUDGET_OWNER_ID);
					}
				}
			}

			let subEmpID = [];
			//search for substitute
			for(var i = 0; i < apprEmpID.length; i++){

				var oListBinding = oModel.bindList("/ZSUBSTITUTION_RULES", null,null, [
					new sap.ui.model.Filter({ path: "USER_ID", operator: "EQ", value1: apprEmpID[i] }),
					new sap.ui.model.Filter({ path: "VALID_FROM", operator: "LE", value1: claimsSubmissionDate }),
					new sap.ui.model.Filter({ path: "VALID_TO", operator: "LE", value1: claimsSubmissionDate })
					
				], null);
				const aSubEmpContexts = await oListBinding.requestContexts();
				const aSubEmpData = aSubEmpContexts.map(oContext => oContext.getObject());

				if(aSubEmpData[0] != null && aSubEmpData[0] != "" && aSubEmpData[0] != undefined){
					subEmpID.push(aSubEmpData[0].SUBSTITUTE_ID);
				}else{
					subEmpID.push(null);
				}
			}
			
			//create ZAPPROVER DETAILS (remove the comments when pushing to main)
			var oBindList = oModel.bindList("/ZAPPROVER_DETAILS_CLAIMS");

			for(var i = 0; i < workflowApprLvl; i++){
				var oContext = oBindList.create({
					"CLAIM_ID": claimID,
					"LEVEL": i+1,
					"APPROVER_ID": apprEmpID[i],
					"SUBSTITUTE_APPROVER_ID": subEmpID[i],
					"STATUS": "'STAT02'"
				});

				oContext.created().then(function (){
					console.log("success")
				}).catch(function(oError){
					console.log(oError);
				})	
			}


        },
        onPARApproverDetermination: async function (oModel, PARID){
			//test variables
			var empID = 1900668;

			// request header
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZREQUEST_HEADER", null,null, [
				new sap.ui.model.Filter({ path: "REQUEST_ID", operator: "EQ", value1: PARID })
			], null);
			const aPARHeaderContexts = await oListBinding.requestContexts();
			const aPARHeaderData = aPARHeaderContexts.map(oContext => oContext.getObject());

			//var empID = aData[0].EMP_ID commented for test
			//var claimTypeID = aData[0].CLAIM_TYPE_ID;
			var parCC = aPARHeaderData[0].COST_CENTER;
			var parAltCC = aPARHeaderData[0].ALTERNATE_COST_CENTER; // for budget owner 
			var parSubmissionType = aPARHeaderData[0].REQUEST_TYPE_ID;
			var parSubmissionDate = aPARHeaderData[0].SUBMITTED_DATE;
			var parSubmissionYear = new Date(aPARHeaderData[0].SUBMITTED_DATE).getFullYear();
			var parTripStartDate = aPARHeaderData[0].TRIP_START_DATE;
			
			//request Item
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZREQUEST_ITEM", null,null, [
				new sap.ui.model.Filter({ path: "REQUEST_ID", operator: "EQ", value1: PARID })
			], null);
			const aClaimItemsContexts = await oListBinding.requestContexts();
			const aClaimsItemData = aClaimItemsContexts.map(oContext => oContext.getObject());

			let parCashAdvArr = [];
			for(var i = 0; i < aClaimsItemData.length; i++){
				parCashAdvArr.push(aClaimsItemData[i].CASH_ADVANCE);
			}
			console.log(parCashAdvArr);

			//get employee info
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new sap.ui.model.Filter({ path: "EEID", operator: "EQ", value1: empID })
			], null);
			const aEmpContexts = await oListBinding.requestContexts();
			const aEmpData = aEmpContexts.map(oContext => oContext.getObject());

			//var departmentID =  aEmpData[0].DEP;
			var empDept = aEmpData[0].DEP; //to set into the url
			var empRole = aEmpData[0].ROLE;
			var empCC = aEmpData[0].CC;
			console.log(empDept + " " + empRole + " " + empCC);
			//JKEW dept = 0500000000
			//array this. test dep id getting all emp with roles with the same dept id as claimant need to add loop to this as well
			empDept = 4300100000;
			//var oModel = this.getView().getModel();
			var oListBinding = oModel.bindList("/ZEMP_MASTER", null,null, [
				new sap.ui.model.Filter({ path: "DEP", operator: "EQ", value1: empDept }),
				new sap.ui.model.Filter({ path: "ROLE", operator: "NE", value1: null })
			], null);
			const aAllEmpWithSameDepContexts = await oListBinding.requestContexts();
			const aAllEmpWithSameDepData = aAllEmpWithSameDepContexts.map(oContext => oContext.getObject());

			if(empRole == null){
				empRole = "";
			}

			if(empDept == "0500000000"){
				if(empRole == null || empRole == ""){
					empRole = "JKEW"
				}else{
					empRole = "JKEW/" + empRole
				}
			}
			console.log(empCC + " " + parCC);
			
			console.log(empRole);
			console.log(aAllEmpWithSameDepData);
			console.log(parSubmissionType);
			parSubmissionType = 'RT0001';
			empRole = "";
			//get workflow rule
			var oListBinding = oModel.bindList("/ZWORKFLOW_RULE", null,null, [
				new sap.ui.model.Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "PRE" }),
				new sap.ui.model.Filter({ path: "REQUEST_TYPE_ID", operator: "EQ", value1: parSubmissionType }),
				new sap.ui.model.Filter({ path: "ROLE", operator: "EQ", value1: empRole })
				
			], null);
			const aWorkflowRuleContexts = await oListBinding.requestContexts();
			const aWorkflowRuleData = aWorkflowRuleContexts.map(oContext => oContext.getObject());
			console.log(aWorkflowRuleData);
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
			if(parCC != empCC){
				empCCVal = "NE";
			}else if (parCC == empCC){
				empCCVal = "EQ";
			}else{
				empCCVal = "";
			}
			var tripStartAge;//change for trip start date
			let empCCWorkflowCodeArr = [];
			let tripStartAgingWorkflowCodeArr = [];
			let cashAdvWorkflowCodeArr = [];
			var currentDate = new Date();
			parTripStartDate = new Date(parTripStartDate);
			for(var i = 0; i < nestedWorkflowRuleArr.length; i++){
				if(empCCVal == nestedWorkflowRuleArr[i][1]){
					empCCWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
				}

				if(parTripStartDate > currentDate){
					tripStartAge = "GE";
				}else if(parTripStartDate < currentDate){
					tripStartAge = "LT";
				}else{
					tripStartAge = "";
				}

				if(tripStartAge == nestedWorkflowRuleArr[i][2]){
					tripStartAgingWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
				}

				for(var x = 0; x < parCashAdvArr.length; x++){
					if(parCashAdvArr[x] == nestedWorkflowRuleArr[i][0]){
						cashAdvWorkflowCodeArr.push(nestedWorkflowRuleArr[i][3]);
					}
				}
				


			}
			console.log(empCCVal);
			console.log(parCashAdvArr);
			console.log(tripStartAge);
			console.log(empCCWorkflowCodeArr);
			console.log(tripStartAgingWorkflowCodeArr);
			console.log(cashAdvWorkflowCodeArr)

			//&& new Set(empCCWorkflowCodeArr).has(item) && new Set(receiptAgingWorkflowCodeArr).has(item)
			//filter for the only workflow code that is the same among all the rule checks
			const commonWorkflowCode = [...new Set(empCCWorkflowCodeArr)].filter(item => 
				new Set(tripStartAgingWorkflowCodeArr).has(item) && new Set(cashAdvWorkflowCodeArr).has(item)
			);
			console.log(nestedWorkflowRuleArr);
			console.log(commonWorkflowCode[0]);

			//get approver levels and approvers
			var oListBinding = oModel.bindList("/ZWORKFLOW_STEP", null,null, [
				new sap.ui.model.Filter({ path: "WORKFLOW_TYPE", operator: "EQ", value1: "PRE" }),
				new sap.ui.model.Filter({ path: "WORKFLOW_CODE", operator: "EQ", value1: commonWorkflowCode[0] }),
				
			], null);
			const aWorkflowStepContexts = await oListBinding.requestContexts();
			const aWorkflowStepData = aWorkflowStepContexts.map(oContext => oContext.getObject());
			
			var workflowName =  aWorkflowStepData[0].WORKFLOW_NAME;
			var workflowApprLvl =  aWorkflowStepData[0].WORKFLOW_APPROVAL_LEVELS;
			workflowApprLvl = 3;
			workflowName = "CXO-HOD-HOS-Budget"
			if(workflowApprLvl > 1){
				var workflowApprStep = workflowName.split("-");
			}else{
				workflowApprStep = [workflowName];
			}

			let apprEmpID = [];
			parAltCC = "4001";
			console.log(aAllEmpWithSameDepData);
			parSubmissionYear = 2026;
			for(var i = 0; i < workflowApprStep.length; i++){
				for(var x = 0; x < aAllEmpWithSameDepData.length; x++){
					//console.log(workflowApprStep[i] + approverDetailsDataArr[x].ROLE);
					if(workflowApprStep[i] == aAllEmpWithSameDepData[x].ROLE){
						apprEmpID.push(aAllEmpWithSameDepData[x].EEID)						
					}else if(workflowApprStep[i] == "Budget" && x == 0){
						//var oModel = this.getView().getModel();
						var oListBinding = oModel.bindList("/ZBUDGET", null,null, [
							new sap.ui.model.Filter({ path: "YEAR", operator: "EQ", value1: parSubmissionYear }),
							new sap.ui.model.Filter({ path: "FUND_CENTER", operator: "EQ", value1: parAltCC })
						], null);
						const aContexts = await oListBinding.requestContexts();
						const aData = aContexts.map(oContext => oContext.getObject());
						apprEmpID.push(aData[0].BUDGET_OWNER_ID);
					}
				}
			}
			let subEmpID = [];
			//search for substitute
			for(var i = 0; i < apprEmpID.length; i++){

				var oListBinding = oModel.bindList("/ZSUBSTITUTION_RULES", null,null, [
					new sap.ui.model.Filter({ path: "USER_ID", operator: "EQ", value1: apprEmpID[i] }),
					new sap.ui.model.Filter({ path: "VALID_FROM", operator: "LE", value1: parSubmissionDate }),
					new sap.ui.model.Filter({ path: "VALID_TO", operator: "LE", value1: parSubmissionDate })
					
				], null);
				const aSubEmpContexts = await oListBinding.requestContexts();
				const aSubEmpData = aSubEmpContexts.map(oContext => oContext.getObject());

				if(aSubEmpData[0] != null && aSubEmpData[0] != "" && aSubEmpData[0] != undefined){
					subEmpID.push(aSubEmpData[0].SUBSTITUTE_ID);
				}else{
					subEmpID.push(null);
				}
			}
			
			//create ZAPPROVER DETAILS (remove the comments when pushing to main)
			var oBindList = oModel.bindList("/ZAPPROVER_DETAILS_PREAPPROVAL");

			for(var i = 0; i < workflowApprLvl; i++){
				var oContext = oBindList.create({
					"CLAIM_ID": claimID,
					"LEVEL": i+1,
					"APPROVER_ID": apprEmpID[i],
					"SUBSTITUTE_APPROVER_ID": subEmpID[i],
					"STATUS": "'STAT02'"
				});

				oContext.created().then(function (){
					console.log("success")
				}).catch(function(oError){
					console.log(oError);
				})	
			}

        },
		
		onSendEmail: async function (ApproverName,SubmissionDate,ClaimantName,InstanceID,ClaimType,ClaimID,RecipientName,Action,ReceiverEmail,CCEmail,EmailTitle,EmailBody,NextApproverName){

			var urlEmail = "/odata/v4/EmployeeSrv/sendEmail";

			// var testPayload ={
			// 	"ApproverName":"test",
			// 	"SubmissionDate":"12/01/2025",
			// 	"ClaimantName":"Vincent",
			// 	"InstanceID":"123",
			// 	"ClaimType":"test",
			// 	"ClaimID":"test12341",
			// 	"RecipientName":"vincent",
			// 	"Action":"",
			// 	"ReceiverEmail":"dick.soon.yong@my.ey.com",
			// 	"CCEmail":"",
			// 	"EmailTitle":"Auto-Approved Claim Submission",
			// 	"EmailBody":"Dear Sender, your claim has been auto approved"
			//	"NextApproverName" : "test"
			// }

			var Payload ={
				"ApproverName":ApproverName,
				"SubmissionDate":SubmissionDate,
				"ClaimantName":ClaimantName,
				"InstanceID":InstanceID,
				"ClaimType":ClaimType,
				"ClaimID":ClaimID,
				"RecipientName":RecipientName,
				"Action":Action,
				"ReceiverEmail":ReceiverEmail,
				"CCEmail":CCEmail,
				"EmailTitle":EmailTitle,
				"EmailBody":EmailBody,
				"NextApproverName" : NextApproverName
			}

			const sendEmail = await fetch(urlEmail, {
				method: "POST",
				headers: { "Content-Type": "application/json", "Accept": "application/json" },
				body: JSON.stringify(payload)
			});
			if (!sendEmail.ok) {
				alert("Error");
			}

		}

    };
});

//   srv.on('batchUpdatePreApproved', async (req) => {
//     const { ZREQUEST_ITEM } = srv.entities;
//     // check request if empty
//     try {
//       const { PreApprove } = req.data;
//       if (!PreApprove) {
//         throw new Error('No Data Sent')
//       }

//       //remove dupe and empty values
//       const uniqueClaimID = [...new Set(PreApprove.map(id => String(id).trim()).filter(Boolean))];

//       const tx = cds.tx(req);

//       // retrieve and lock data records
//       const PreApprovedClaims = await tx.run(
//         SELECT.from(ZREQUEST_ITEM)
//           .where({ REQUEST_SUB_ID: { in: uniqueClaimID } })
//           .columns('REQUEST_SUB_ID')
//       );

//       // if no records found
//       // if (PreApprovedClaims.length === 0) {
//       //   return req.error(404, 'No Matching Claims');
//       // }

//       // Filter matching and missing existing claims by id for troubleshoot
//       // const FoundClaimIDs = PreApprovedClaims.map(r => r.REQUEST_SUB_ID);
//       // const MissingClaimIDs = uniqueClaimID.filter(id => !FoundClaimIDs.includes(id));

//       // Set Send to SF as True (Success)
//       // const updateSendtoSF = { SEND_TO_SF: 'X' };

//       const results = await tx.run(
//         UPDATE(ZREQUEST_ITEM).set({ SEND_TO_SF: true }).where({ REQUEST_SUB_ID: { in: PreApprovedClaims } })
//       );

//       const response = {
//         success: true,
//         // updatedCount: results ?? FoundClaimIDs.length,
//         // field: SEND_TO_SF,
//         // value: 'X'
//         // ...FoundClaimIDs(MissingClaimIDs.length > 0 && {
//         //   warnings: [
//         //     `${MissingClaimIDs.length} Claim IDs were not found and skipped: ${MissingClaimIDs.join(', ')}`]
//         // })
//       };

//       req.notify(200, `Successfully updated "SEND_TO_SF" for`)
//       return response;


//     } catch (error) {
//       req.error(400, `Fail updating record: ${error.message}`);
//     }
//   });