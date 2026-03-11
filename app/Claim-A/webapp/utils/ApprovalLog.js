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

        onClaimsApproverDetermination: async function (claimID){
			//test variables
			var empID = 1900668;

			// claim header
			var ClaimsURL = "/odata/v4/EmployeeSrv/ZCLAIM_HEADER?$filter=CLAIM_ID%20eq%20'" + claimID + "'";
			//get emp id from claims id
			const empIDRes = await fetch(ClaimsURL, { headers: { "Accept": "application/json" } });
			if (!empIDRes.ok) throw new Error(`HTTP ${empIDRes.status} ${empIDRes.statusText}`);
			const empData = await empIDRes.json();
			const stringifyEmpData = JSON.stringify(empData.value);
			var parseEmpData = JSON.parse(stringifyEmpData);
			//var empID = parseEmpData[0].EMP_ID commented for test
			//var claimTypeID = parseEmpData[0].CLAIM_TYPE_ID;
			var claimsCC = parseEmpData[0].COST_CENTER;
			var claimsAltCC = parseEmpData[0].ALTERNATE_COST_CENTER;
			var claimsRequestID = parseEmpData[0].REQUEST_ID;
			var claimsSubmissionType = parseEmpData[0].SUBMISSION_TYPE;

			var ClaimsItemURL = "/odata/v4/EmployeeSrv/ZCLAIM_ITEM?$filter=CLAIM_ID%20eq%20'" + claimID + "'";
			//claim items might need to loop to account for multiple items
			const claimItemsRes = await fetch(ClaimsItemURL, { headers: { "Accept": "application/json" } });
			if (!claimItemsRes.ok) throw new Error(`HTTP ${claimItemsRes.status} ${claimItemsRes.statusText}`);
			const claimItemsData = await claimItemsRes.json();
			const claimsItemarr = Array.isArray(claimItemsData?.value) ? claimItemsData.value : [];
			let claimItemTotalExpAmtArr = [];
			let claimItemReceiptDateArr = [];
			let claimTypeItemIDArr = [];
			for(var i = 0; i < claimsItemarr.length; i++){

				claimItemTotalExpAmtArr.push(parseFloat(claimsItemarr[i].TOTAL_EXP_AMOUNT));
				claimItemReceiptDateArr.push(new Date(claimsItemarr[i].RECEIPT_DATE));
				claimTypeItemIDArr.push(claimsItemarr[i].CLAIM_TYPE_ITEM_ID);
			}
			
			// furthest date + high amount among all the claim items
			var furthestReceiptDate = new Date(Math.max(...claimItemReceiptDateArr)).toLocaleDateString('en-CA');
			var highestTotalExpAmt = Math.max(...claimItemTotalExpAmtArr);

			var claimsOverallRisk;
			let claimsTypeItemRiskArr = [];

			for(var i = 0; i < claimTypeItemIDArr.length; i++){
				//checking claim type item id for risk level
				var ClaimsTypeItemURL = "/odata/v4/EmployeeSrv/ZCLAIM_TYPE_ITEM?$filter=CLAIM_TYPE_ITEM_ID%20eq%20'" + claimTypeItemIDArr[i] + "'";
				const claimsTypeItemRes = await fetch(ClaimsTypeItemURL, { headers: { "Accept": "application/json" } });
				if (!claimsTypeItemRes.ok) throw new Error(`HTTP ${claimsTypeItemRes.status} ${claimsTypeItemRes.statusText}`);
				const claimsTypeItemData = await claimsTypeItemRes.json();
				const claimsTypeItemArr = Array.isArray(claimsTypeItemData?.value) ? claimsTypeItemData.value : [];
				for(var x = 0; x < claimsTypeItemArr.length; x++){
					claimsTypeItemRiskArr.push(claimsTypeItemArr[x].RISK);
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

			var EmpURL = "/odata/v4/EmployeeSrv/ZEMP_MASTER?$filter=EEID%20eq%20'" + empID + "'";
			//get emp role and department
			const empRoleDeptres = await fetch(EmpURL, { headers: { "Accept": "application/json" } });
			if (!empRoleDeptres.ok) throw new Error(`HTTP ${empRoleDeptres.status} ${empRoleDeptres.statusText}`);
			const empRoleDeptData = await empRoleDeptres.json();
			const stringifyempRoleDept = JSON.stringify(empRoleDeptData.value);
			var parseEmpRoleDept = JSON.parse(stringifyempRoleDept);
			var departmentID =  parseEmpRoleDept[0].DEP;
			var empDept = parseEmpRoleDept[0].DEP;
			var empRole = parseEmpRoleDept[0].ROLE;
			var empCC = parseEmpRoleDept[0].CC;

			//array this. test dep id getting all emp with roles with the same dept id as claimant need to add loop to this as well
			departmentID = 4300100000;
			var allDeptEmployeeRole = "/odata/v4/EmployeeSrv/ZEMP_MASTER?$filter=DEP%20eq%20'" + departmentID + "' and ROLE%20ne%20null";
			const approverDetailsRes = await fetch(allDeptEmployeeRole, { headers: { "Accept": "application/json" } });
			const approverDetailsData = await approverDetailsRes.json();
			const stringifyApproverDetails = JSON.stringify(approverDetailsData.value);
			var parseApproverDetails = JSON.parse(stringifyApproverDetails);
			var approverEmail = parseApproverDetails[0].EMAIL;
			var approverRole = parseApproverDetails[0].ROLE;

			// console.log("Checking for all required variables \n");
			// console.log("claim type id = " + claimTypeID);
			// console.log("claim CC = " + claimsCC);
			// console.log("claims alt cc = " + claimsAltCC);
			// console.log("claim total exp = " + claimItemTotalExpAmt);
			// console.log("claim receipt date = " + claimItemReceiptDate);
			// console.log("emp dept = " + empDept);
			// console.log("emp role = " + empRole);
			// console.log("emp cc = " + empCC);
			// console.log("approver email = " + approverEmail);
			// console.log("approver role = " + approverRole);
			// console.log("claim request ID = " + claimsRequestID);
			// console.log("claim submission type = " + claimsSubmissionType);

			//get all the workflow rules based on workflow type request type (submission type) and role. populate to array and check if there is anything that needs to be checked then pop out the ones that is not needed
			//empRole, claimsSubmissionType, Workflow Type hardcode to CLM
			claimsSubmissionType = "ST0001"; //for testing
			if(empRole == null){
				empRole = "HOS";
			}

			var workflowRuleURL = "/odata/v4/EmployeeSrv/ZWORKFLOW_RULE?$filter=WORKFLOW_TYPE%20eq%20'CLM'%20and%20REQUEST_TYPE_ID%20eq%20'" + claimsSubmissionType + "'%20and%20ROLE%20eq%20'" + empRole + "'";
			const workflowRuleRes = await fetch(workflowRuleURL, { headers: { "Accept": "application/json" } });
			if (!workflowRuleRes.ok) throw new Error(`HTTP ${workflowRuleRes.status} ${workflowRuleRes.statusText}`);
			const workflowRuleData = await workflowRuleRes.json();
			const workflowRuleArr = Array.isArray(workflowRuleData?.value) ? workflowRuleData.value : [];
			
			for(var i = 0; i < workflowRuleArr.length; i++){
				console.log(workflowRuleArr[i]);
			}


        },
        onPARApproverDetermination: async function (PARID){
            var url = "/odata/v4/EmployeeSrv/ZREQUEST_HEADER?$filter=REQUEST_ID%20eq%20'" + PARID + "'";
			const res = await fetch(url, { headers: { "Accept": "application/json" } });
			if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
			const data = await res.json();
			const stringifyData = JSON.stringify(data.value);
			var test = JSON.parse(stringifyData);
			//console.log(test[0].EMP_ID);
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