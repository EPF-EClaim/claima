const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");

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
    return aApproverActions[sAction];
}

async function updateApproverDetailsTable(oTx, sId, sUserId, oActionDescriptor, sComments = "", sRejectionReason = "", oDescriptor) {
    // Retrieve context of the entire document approval flow

    try{
        const aApproversDetails = await getApproversDetails(sId, oDescriptor);
        if(!aApproversDetails.length) {
            return false;
        }
        // Set PENDING APPROVAL Status to the Approver action for the provided User ID
        let iUpdatedRows = await oTx.run(
            UPDATE(oDescriptor.entityApprovers)
                .set({
                    [Constant.EntitiesFields.STATUS]            : oActionDescriptor.approverActionValue,
                    [Constant.EntitiesFields.COMMENT]           : sComments,
                    [Constant.EntitiesFields.REJECT_REASON_ID]  : sRejectionReason
                })
                .where({
                    and: [{
                        or: [{
                            [Constant.EntitiesFields.APPROVER_ID] : sUserId
                        },
                        {
                            [Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID] : sUserId
                        }
                    ]},
                    {
                        [Constant.EntitiesFields.STATUS]    : Constant.Status.PENDING_APPROVAL,
                        [oDescriptor.approverIdField]       : sId 
                    }]
                })
        )
        if(iUpdatedRows === 0) {
            return false;
        }

        // Clear all other PENDING STATUS statuses
        iUpdatedRows = await oTx.run(
            UPDATE(oDescriptor.entityApprovers)
                .set({
                    [Constant.EntitiesFields.STATUS]            : ""
                })
                .where({
                    and: [{
                        not: {
                            or: [
                                { [Constant.EntitiesFields.APPROVER_ID]             : sUserId },
                                { [Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID]  : sUserId }
                            ]
                        }
                    },
                    {   
                        [Constant.EntitiesFields.STATUS] : Constant.Status.PENDING_APPROVAL,
                        [oDescriptor.approverIdField]       : sId
                     }
                ]}
                )
        )
        if(iUpdatedRows === 0) {
            return false;
        }
        // If action = APPROVE, check for next level to set status to PENDING APPROVAL
        if(oActionDescriptor.approverActionValue === Constant.ApproverActions.APPROVE) {
            const oLastLevelApproverStatus = isLastApproverLevel(aApproversDetails, sUserId)
            if(!oLastLevelApproverStatus.STATUS) {
                return false
            }
            const oNextApproverDetails = aApproversDetails.find(oRow=> 
                oRow[Constant.EntitiesFields.LEVEL] === oLastLevelApproverStatus.NEXTLEVEL
            );
            if(!oNextApproverDetails){
                return false;
            }
            iUpdatedRows = await oTx.run(
                UPDATE(oDescriptor.entityApprovers)
                    .set({
                        [Constant.EntitiesFields.STATUS]    : Constant.Status.PENDING_APPROVAL
                    })
                    .where({
                        [Constant.EntitiesFields.LEVEL]     : sNextLevel,
                        [oDescriptor.approverIdField]       : sId
                    })
            );
            if(iUpdatedRows === 0) {
                return false;
            }
        }
        return true;
    }
    catch(oError) {
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
                and: [{
                    or: [
                        { [Constant.EntitiesFields.APPROVER_ID]             : sUserId },
                        { [Constant.EntitiesFields.SUBSTITUTE_APPROVER_ID]  : sUserId }
                ]},
                    { 
                        [Constant.EntitiesFields.STATUS]    : Constant.Status.PENDING_APPROVAL,
                        [oDescriptor.approverIdField]       : sId
                    }
                ]
            })
    );
    if(!oApproverLine) {
        return false;
    }
    return true;
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
    const oNextApproverDetails = oApproverDetails.find(oRow=> 
        oRow[Constant.EntitiesFields.LEVEL] === sNextLevel
    );
    if(!oNextApproverDetails){
        return {
            ISLASTLEVEL : true,
            CURRENTLEVEL: sCurrentLevel,
            NEXTLEVEL   : sNextLevel,
            SUCCESS     : false
        };
    }
    return {
        ISLASTLEVEL : false,
        CURRENTLEVEL: sCurrentLevel,
        SUCCESS     : false
    };
}

async function getApproversDetails(sId, oDescriptor) {
    return await cds.run(
        SELECT
            .from(oDescriptor.entityApprovers)
            .where({
                [oDescriptor.approverIdField] : sId    
            })
        );
}
module.exports = {
    updateApproverDetailsTable,
    verifyCorrectApproverForAction,
    determineLastApproverLevel,
    resolveActionDescriptor
};