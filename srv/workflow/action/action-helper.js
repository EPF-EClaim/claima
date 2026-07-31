const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");
const { constants } = require('@sap/xssec');
const { fn } = cds;
const { sendFinalApproveLog } = require("../determination/determination-helper");


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
        const iStatusCode = oError?.status || oError?.statusCode || oError?.code || "500";
        const sMessage = oError?.message || "No Message";
        await sendFinalApproveLog(sId, "", "APPROVAL_PROCESS" ,iStatusCode, sMessage);
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

async function updateCorpoCardAdvance(oTx, sId, sStatus) {
    const aCommitStatuses = [Constant.Status.DRAFT, Constant.Status.PENDING_APPROVAL, Constant.Status.PUSH_BACK];
    const bIsApproved = sStatus === Constant.Status.APPROVED;
    const bIsCommit = aCommitStatuses.includes(sStatus);

    if (!bIsApproved && !bIsCommit) {
        return true;
    }

    const sPrefix = sId.slice(0,3);
    console.log("sPrefix",sPrefix)
    if (sPrefix === Constant.WorkflowType.REQUEST) {
        const aItemParts = await oTx.run(
            SELECT.from('ZREQ_ITEM_CCC_PART')
                .where({ REQUEST_ID: sId })
        );

        if (!aItemParts || aItemParts.length === 0) return true;

        return _applyCorpoCardAdvanceUpdates(oTx, _sumRequestPartsByCard(aItemParts), bIsApproved, bIsCommit);

    } else if (sPrefix === Constant.WorkflowType.CLAIM) {
        const aClaimItems = await oTx.run(
            SELECT.from('ZCLAIM_ITEM')
                .where({ CLAIM_ID: sId, CHARGED_TO_CCC: true })
        );

        if (!aClaimItems || aClaimItems.length === 0) return true;

        const mAmountByEmp = _sumClaimItemsByEmployee(aClaimItems);
        const mAmountByCard = await _resolveCardNoForEmployees(oTx, mAmountByEmp);

        return _applyCorpoCardAdvanceUpdates(oTx, mAmountByCard, bIsApproved, bIsCommit);

    } else {
        console.warn(`Unrecognized ID format, cannot determine Request vs Claim: ${sId}`);
        return true;
    }
}

function _sumRequestPartsByCard(aItemParts) {
    const mAmountByCard = {};
    aItemParts.forEach((oPart) => {
        const sCardNo = oPart.CARD_NO;
        const fAmount = parseFloat(oPart.STATEMENT_DUE_AMT || 0)
                       - parseFloat(oPart.CASHBACK || 0);

        mAmountByCard[sCardNo] = (mAmountByCard[sCardNo] || 0) + fAmount;
    });
    return mAmountByCard;
}

function _sumClaimItemsByEmployee(aClaimItems) {
    const mAmountByEmp = {};
    aClaimItems.forEach((oItem) => {
        const sEmpId = oItem.EMP_ID;
        const fAmount = parseFloat(oItem.AMOUNT || 0);

        mAmountByEmp[sEmpId] = (mAmountByEmp[sEmpId] || 0) + fAmount;
    });
    return mAmountByEmp;
}

async function _resolveCardNoForEmployees(oTx, mAmountByEmp) {
    const aEmpIds = Object.keys(mAmountByEmp);
    if (aEmpIds.length === 0) return {};

    const aCards = await oTx.run(
        SELECT.from('ZCORPORATE_CARD')
            .where({ CARDHOLDER_ID: aEmpIds })
    );

    const mAmountByCard = {};
    aCards.forEach((oCard) => {
        const fAmount = mAmountByEmp[oCard.CARDHOLDER_ID] || 0;
        if (fAmount) {
            mAmountByCard[oCard.CARD_NO] = (mAmountByCard[oCard.CARD_NO] || 0) + fAmount;
        }
    });

    return mAmountByCard;
}

async function _applyCorpoCardAdvanceUpdates(oTx, mAmountByCard, bIsApproved, bIsCommit) {
    const aCards = await oTx.run(
        SELECT.from('ZCORPORATE_CARD')
            .where({ CARD_NO: Object.keys(mAmountByCard) })
    );

    const mCardholderByCard = {};
    aCards.forEach((oCard) => {
        mCardholderByCard[oCard.CARD_NO] = oCard.CARDHOLDER_ID;
    });

    for (const sCardNo of Object.keys(mAmountByCard)) {
        const fAmount = mAmountByCard[sCardNo];
        const sCardholderId = mCardholderByCard[sCardNo];

        if (!sCardholderId) {
            console.warn(`No cardholder found for CARD_NO: ${sCardNo}`);
            continue;
        }

        const [oExisting] = await oTx.run(
            SELECT.from('ZCORPORATE_CARD_ADVANCED')
                .where({ CARD_NO: sCardNo, CARDHOLDER_ID: sCardholderId })
        );

        let fMonthlyAdvanced = oExisting ? parseFloat(oExisting.MONTHLY_ADVANCED_AMT || 0) : 0;
        let fCommitOffset = oExisting ? parseFloat(oExisting.COMMIT_OFFSET_AMT || 0) : 0;
        let fActualOffset = oExisting ? parseFloat(oExisting.ACTUAL_OFFSET_AMT || 0) : 0;

        if (bIsApproved) {
            fMonthlyAdvanced += fAmount;
            fActualOffset += fAmount;
        } else if (bIsCommit) {
            fCommitOffset += fAmount;
        }

        const fCurrentBalance = fMonthlyAdvanced - fActualOffset;

        const oPayload = {
            MONTHLY_ADVANCED_AMT: fMonthlyAdvanced,
            COMMIT_OFFSET_AMT: fCommitOffset,
            ACTUAL_OFFSET_AMT: fActualOffset,
            CURRENT_ADVANCED_BALANCE: fCurrentBalance,
            MODIFIEDAT: new Date().toISOString(),
        };

        if (oExisting) {
            await oTx.run(
                UPDATE('ZCORPORATE_CARD_ADVANCED')
                    .set(oPayload)
                    .where({ CARD_NO: sCardNo, CARDHOLDER_ID: sCardholderId })
            );
        } else {
            await oTx.run(
                INSERT.into('ZCORPORATE_CARD_ADVANCED').entries({
                    CARD_NO: sCardNo,
                    CARDHOLDER_ID: sCardholderId,
                    STATUS: 'ACTIVE',
                    CREATEDAT: new Date().toISOString(),
                    ...oPayload
                })
            );
        }
    }

    return true;
}

async function notifyCardholdersOfRequestApproval(oTx, sRequestId) {
    try {
        const oRequest = await oTx.run(
            SELECT.one.from('ZREQUEST_HEADER')
                .where({ REQUEST_ID: sRequestId })
                .columns('REQUEST_ID', 'REQUEST_TYPE_ID', 'TRIP_START_DATE', 'TRIP_END_DATE')
        );
 
        if (!oRequest || String(oRequest.REQUEST_TYPE_ID) !== String(Constant.RequestType.CORP_CC)) {
            return; // not a Corporate Credit Card request - nothing to notify
        }
 
        const aItemParts = await oTx.run(
            SELECT.from('ZREQ_ITEM_CCC_PART').where({ REQUEST_ID: sRequestId })
        );
 
        if (!aItemParts || aItemParts.length === 0) return;
 
        const aCardNos = [...new Set(aItemParts.map((oPart) => oPart.CARD_NO).filter(Boolean))];
        if (aCardNos.length === 0) return;
 
        const aAdvances = await oTx.run(
            SELECT.from('ZCORPORATE_CARD_ADVANCED')
                .where({ CARD_NO: aCardNos })
        );
 
        for (const oAdvance of aAdvances) {
            const fAdvanceAmount = Number(oAdvance.MONTHLY_ADVANCED_AMT) || 0;
            if (fAdvanceAmount <= 0) continue;
 
            const oCardholder = await oTx.run(
                SELECT.one.from(Constant.Entities.ZEMP_MASTER)
                    .where({ EEID: String(oAdvance.CARDHOLDER_ID) })
                    .columns('EEID', 'NAME', 'EMAIL')
            );
 
            if (!oCardholder || !oCardholder.EMAIL) {
                console.warn(`[CCC_ADVANCE_EMAIL] No email found for cardholder ${oAdvance.CARDHOLDER_ID}, skipping notification for Card ${oAdvance.CARD_NO}`);
                continue;
            }
 
            try {
                await sendEmailInternal({
                    ApproverName: oCardholder.NAME,
                    ClaimID: oAdvance.CARD_NO,
                    Action: Constant.ApprovalEmailAction.ACTION_NOTIFY,
                    EmailTitle: `Corporate Credit Card Advance Approved: ${sRequestId}`,
                    ReceiverEmail: oCardholder.EMAIL,
                    SubmissionDate: new Date().toISOString().split('T')[0],
                    ClaimantName: oCardholder.NAME,
                    RecipientName: oCardholder.NAME,
                    ClaimType: 'Corporate Credit Card Advance',
                    TripStartDate: oRequest?.TRIP_START_DATE || null,
                    TripEndDate: oRequest?.TRIP_END_DATE || null,
                    AdvanceAmount: fAdvanceAmount
                });
 
                console.log(`[CCC_ADVANCE_EMAIL] Advance notification sent for Request ${sRequestId} to cardholder ${oAdvance.CARDHOLDER_ID} (${oCardholder.EMAIL})`);
 
            } catch (oEmailError) {
                console.error(`[CCC_ADVANCE_EMAIL] Failed to send advance notification for Request ${sRequestId}, cardholder ${oAdvance.CARDHOLDER_ID}`, oEmailError);
                try {
                    await oTx.run(
                        INSERT.into(Constant.Entities.ZLOG).entries({
                            TIMESTAMP: new Date(),
                            RECORD_ID: String(sRequestId || '').slice(0, 20),
                            PROGRAM: 'CCC_ADVANCE_EMAIL',
                            MESSAGE_TYPE: 'W',
                            STATUS_CODE: String(oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500"),
                            MESSAGE: oEmailError?.message || "No Message"
                        })
                    );
                } catch (oLogError) {
                    console.error('[CCC_ADVANCE_EMAIL] Failed to write background log', oLogError);
                }
            }
        }
 
    } catch (oError) {
        console.error(`[CCC_ADVANCE_EMAIL] Failed processing cardholder advance notifications for Request ${sRequestId}`, oError);
    }
}

module.exports = {
    updateApproverDetailsTable,
    verifyCorrectApproverForAction,
    determineLastApproverLevel,
    resolveActionDescriptor,
    updateCorpoCardAdvance,
    notifyCardholdersOfRequestApproval
};