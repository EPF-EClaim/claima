const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");
const { constants } = require('@sap/xssec');
const { fn } = cds;

const aApproverActions = {
    [Constant.Status.APPROVED]  : {
        actionValue         : Constant.Status.APPROVED,
        budgetActionValue   : Constant.ApproverActions.APPROVE,
        approverActionValue : Constant.ApproverActions.APPROVE,
        emailAction         : Constant.ApprovalEmailAction.ACTION_APPROVE
    },
    [Constant.Status.REJECTED]   : {
        actionValue         : Constant.Status.REJECTED,
        budgetActionValue   : Constant.ApproverActions.REJECT,
        approverActionValue : Constant.ApproverActions.REJECT,
        emailAction         : Constant.ApprovalEmailAction.ACTION_REJECT
    },
    [Constant.Status.PUSH_BACK] : {
        actionValue         : Constant.Status.PUSH_BACK,
        budgetActionValue   : Constant.ApproverActions.REJECT,
        approverActionValue : Constant.ApproverActions.PUSHBACK,
        emailAction         : Constant.ApprovalEmailAction.ACTION_PUSHBACK
    }
}

function resolveActionDescriptor(sAction) {
    console.log("Resolving action descriptor for action: ", sAction);
    console.log("Approver Actions: ", aApproverActions);
    return aApproverActions[sAction];
}

async function updateApproverDetailsTable(oTx, sId, sUserId, oActionDescriptor, sComments = "", sRejectionReason = "", oDescriptor) {
    // Retrieve context of the entire document approval flow

    try{
        const aApproversDetails = await getApproversDetails(sId, oDescriptor);
        if(!aApproversDetails.length) {
            return false;
        }
        console.log("Approvers Retrieved");
        // Set PENDING APPROVAL Status to the Approver action for the provided User ID
        let iUpdatedRows = await oTx.run(
            UPDATE(oDescriptor.entityApprovers)
                .set({
                    [Constant.EntitiesFields.STATUS]            : oActionDescriptor.actionValue,
                    [Constant.EntitiesFields.COMMENT]           : sComments,
                    [Constant.EntitiesFields.REJECT_REASON_ID]  : sRejectionReason,
                    [Constant.EntitiesFields.PROCESS_TIMESTAMP] : cds.context.timestamp
                })
                .where({
                        [Constant.EntitiesFields.STATUS]        : Constant.Status.PENDING_APPROVAL,
                        [oDescriptor.approverIdField]           : sId 
                    })
        )
        if(iUpdatedRows === 0) {
            console.log("Failed to update approver action");
            return false;
        }   
        console.log("Updated approver action");

        // Clear all other PENDING STATUS statuses
        iUpdatedRows = await oTx.run(
            UPDATE(oDescriptor.entityApprovers)
                .set({
                    [Constant.EntitiesFields.STATUS]            : ""
                })
                .where({
                    [Constant.EntitiesFields.APPROVER_ID]       : sUserId,
                    [Constant.EntitiesFields.STATUS]            : Constant.Status.PENDING_APPROVAL,
                    [oDescriptor.approverIdField]               : sId
                })
        )
        if(iUpdatedRows === 0) {
            // return false;
            console.log("No other approvers found with status PENDING APPROVAL");
        }
        // If action = APPROVE, check for next level to set status to PENDING APPROVAL
        if(oActionDescriptor.approverActionValue === Constant.ApproverActions.APPROVE) {
            const oLastLevelApproverStatus = isLastApproverLevel(aApproversDetails, sUserId)
            console.log("LastLevelApproverContext: ", oLastLevelApproverStatus);
            // If last level, return true - Approver action ends. No need to update next level
            if(oLastLevelApproverStatus.ISLASTLEVEL) {
                console.log("Approver is at last level, no next level approver to update");
                return true;
            }
            // If not last level, update next level to PENDING APPROVAL status
            const oNextApproverDetails = aApproversDetails.find(oRow=> 
                oRow[Constant.EntitiesFields.LEVEL] === oLastLevelApproverStatus.NEXTLEVEL
            );
            // If not last level, but cannot find next level, something went wrong.
            if(!oNextApproverDetails){
                console.log("Next level approver details not found, something went wrong"); 
                return false;
            }
            console.log("Next level approver: ", oNextApproverDetails);
            iUpdatedRows = await oTx.run(
                UPDATE(oDescriptor.entityApprovers)
                    .set({
                        [Constant.EntitiesFields.STATUS]    : Constant.Status.PENDING_APPROVAL
                    })
                    .where({
                        [Constant.EntitiesFields.LEVEL]     : oNextApproverDetails[Constant.EntitiesFields.LEVEL],
                        [oDescriptor.approverIdField]       : sId
                    })
            );
            if(iUpdatedRows === 0) {
                console.log("Failed to update next level approver to PENDING APPROVAL");
                return false;
            }
            console.log("Updated next level approver to PENDING APPROVAL");
        }
        return true;
    }
    catch(oError) {
        console.log("Error found: ", oError);
        return false;
    }
}
async function verifyCorrectApproverForAction(sId, sUserId, oDescriptor) {

    // Check if line exists for approver with status PENDING APPROVAL
    // If yes, return true, if not, return false
    const oApproverLine = await cds.run(
        SELECT
            .one
            .from(oDescriptor.entityApprovers)
            .where({
                [Constant.EntitiesFields.STATUS]        : Constant.Status.PENDING_APPROVAL,
                [oDescriptor.approverIdField]           : sId
            }).columns(
                'APPROVER_ID',
                'SUBSTITUTE_APPROVER_ID'
            )
    );
    console.log(oApproverLine);
    var bExists = Object.values(oApproverLine).includes(sUserId);
    console.log("Approver ", bExists)
    return bExists;
    
}
async function determineLastApproverLevel(sId, sUserId, oDescriptor) {
    const aApproversDetails = await getApproversDetails(sId, oDescriptor);
    if(!aApproversDetails.length) {
         return {
            ISLASTLEVEL : false,
            CURRENTLEVEL: 0,
            NEXTLEVEL   : 0,
            SUCCESS     : false
        };
    }
    return isLastApproverLevel(aApproversDetails, sUserId); 
    
}
function isLastApproverLevel(aApproversDetails, sUserId) {
    const oApproverDetails = aApproversDetails.find(oRow=>
        (
            oRow[Constant.EntitiesFields.APPROVER_ID] === sUserId ||
            oRow[Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID] === sUserId
        ) &&
        oRow[Constant.EntitiesFields.STATUS] === Constant.Status.PENDING_APPROVAL
    );
    if(!oApproverDetails) {
        return {
            ISLASTLEVEL : false,
            CURRENTLEVEL: 0,
            NEXTLEVEL   : 0,
            SUCCESS     : false
        };
    }
    const sCurrentLevel = Number(oApproverDetails[Constant.EntitiesFields.LEVEL]);
    if(Number.isNaN(sCurrentLevel)) {
        return {
            ISLASTLEVEL : false,
            CURRENTLEVEL: 0,
            NEXTLEVEL   : 0,
            SUCCESS     : false
        };
    }
    const sNextLevel = sCurrentLevel + 1;
    const oNextApproverDetails = aApproversDetails.find(oRow=> 
        oRow[Constant.EntitiesFields.LEVEL] === sNextLevel
    );
    if(!oNextApproverDetails){
        return {
            ISLASTLEVEL : true,
            CURRENTLEVEL: sCurrentLevel,
            NEXTLEVEL   : sNextLevel,
            SUCCESS     : true
        };
    }
    return {
        ISLASTLEVEL : false,
        CURRENTLEVEL: sCurrentLevel,
        NEXTLEVEL   : sNextLevel,
        SUCCESS     : true
    };
}

async function getApproversDetails(sId, oDescriptor) {
    const aApproversDetails = await cds.run(
        SELECT
            .from(oDescriptor.entityApprovers)
            .where({
                [oDescriptor.approverIdField] : sId    
            })
        );
    if(!aApproversDetails.length) {
        return []
    }
    return aApproversDetails;

}
module.exports = {
    updateApproverDetailsTable,
    verifyCorrectApproverForAction,
    determineLastApproverLevel,
    resolveActionDescriptor
};