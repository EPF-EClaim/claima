const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../../utils/constant");
const { constants } = require('@sap/xssec');
const { fn } = cds;
const { sendFinalApproveLog } = require("../determination/determination-helper");
const { sendEmailInternal } = require("../../utils/EmailHelper");


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
    console.log("Start Update Corpo Card Advance");
    const bIsApproved = sStatus === Constant.Status.APPROVED;
    const bIsPushBack = sStatus === Constant.Status.PUSH_BACK;
    const bIsRejected = sStatus === Constant.Status.REJECTED;
    const bIsPendingApproval = sStatus === Constant.Status.PENDING_APPROVAL;
 
    if (!bIsApproved && !bIsPushBack && !bIsRejected && !bIsPendingApproval) {
        return true;
    }
 
    const sPrefix = sId.slice(0,3);
    console.log("sPrefix",sPrefix)
    const bIsRequest = sPrefix === Constant.WorkflowType.REQUEST;
 
    // Requests only care about approval (establishes the monthly advance).
    // Push back / rejected / pending approval commit-offset tracking is
    // claim-settlement specific and doesn't apply to requests.
    if (bIsRequest && !bIsApproved) {
        return true;
    }
 
    if (bIsRequest) {
        console.log("Update Corpo Card Advance REQUEST");
        const aItemParts = await oTx.run(
            SELECT.from('ZREQ_ITEM_CCC_PART')
                .where({ REQUEST_ID: sId })
        );
 
        if (!aItemParts || aItemParts.length === 0) return true;
 
        return _applyCorpoCardAdvanceUpdates(oTx, _sumRequestPartsByCard(aItemParts), { bIsApproved, bIsPushBack: false, bIsRejected: false, bIsPendingApproval: false, bIsRequest: true });
 
    } else if (sPrefix === Constant.WorkflowType.CLAIM) {
        console.log("Update Corpo Card Advance CLAIM");
        const aClaimItems = await oTx.run(
            SELECT.from('ZCLAIM_ITEM')
                .where({ CLAIM_ID: sId, CHARGED_TO_CCC: true })
        );
 
        if (!aClaimItems || aClaimItems.length === 0) return true;
 
        const mAmountByEmp = _sumClaimItemsByEmployee(aClaimItems);
        const mAmountByCard = await _resolveCardNoForEmployees(oTx, mAmountByEmp);
 
        return _applyCorpoCardAdvanceUpdates(oTx, mAmountByCard, { bIsApproved, bIsPushBack, bIsRejected, bIsPendingApproval, bIsRequest: false });
 
    } else {
        console.warn(`Unrecognized ID format, cannot determine Request vs Claim: ${sId}`);
        return true;
    }
}

function _sumRequestPartsByCard(aItemParts) {
    const mTotalsByCard = {};
    aItemParts.forEach((oPart) => {
        const sCardNo = oPart.CARD_NO;
        if (!mTotalsByCard[sCardNo]) {
            mTotalsByCard[sCardNo] = { currentBalance: 0, serviceTax: 0, merchantRefund: 0 };
        }
        mTotalsByCard[sCardNo].currentBalance += parseFloat(oPart.STATEMENT_DUE_AMT || 0);
        mTotalsByCard[sCardNo].serviceTax += parseFloat(oPart.SERVICE_TAX || 0);
        mTotalsByCard[sCardNo].merchantRefund += parseFloat(oPart.MERCHANT_REFUND_AMT || 0);
    });

    const mAmountByCard = {};
    Object.keys(mTotalsByCard).forEach((sCardNo) => {
        const oTotals = mTotalsByCard[sCardNo];
        const fAmount = oTotals.currentBalance < 0
            ? oTotals.currentBalance + oTotals.serviceTax - oTotals.merchantRefund
            : oTotals.currentBalance - oTotals.serviceTax + oTotals.merchantRefund;
        mAmountByCard[sCardNo] = Math.max(0, fAmount);
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

async function _applyCorpoCardAdvanceUpdates(oTx, mAmountByCard, { bIsApproved, bIsPushBack, bIsRejected, bIsPendingApproval, bIsRequest }) {
    console.log("Starintg apply corpo card advance");
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
            if (bIsRequest) {
                // A Corporate Credit Card request being approved establishes/
                // increases the cardholder's monthly advance.
                fMonthlyAdvanced += fAmount;
            } else {
                // A claim settlement being approved offsets against the
                // existing advance - it does not create additional advance.
                fActualOffset += fAmount;
            }
        } else if (bIsPushBack || bIsPendingApproval) {
            fCommitOffset += fAmount;
        } else if (bIsRejected) {
            fCommitOffset -= fAmount;
        }
 
        if(bIsRequest){
            var fCurrentBalance = 0;
        }else{
            var fCurrentBalance = fMonthlyAdvanced < 0
                                ? fMonthlyAdvanced + fActualOffset
                                : fMonthlyAdvanced - fActualOffset;
        }
 
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
 
        console.log("Completed apply corpo card advance");
    }
 
    return true;
}

async function notifyCardholdersOfRequestApproval(oTx, sRequestId) {
    console.log("Starintg apply cardholder email");
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
 
        // Sum THIS request's own amounts per card - Advance Amount = Current
        // Balance (STATEMENT_DUE_AMT) - Service Tax - Merchant Refund - rather
        // than reading the persisted running balance off ZCORPORATE_CARD_ADVANCED.
        const mTotalsByCard = {};
        aItemParts.forEach((oPart) => {
            const sCardNo = oPart.CARD_NO;
            if (!mTotalsByCard[sCardNo]) {
                mTotalsByCard[sCardNo] = { currentBalance: 0, serviceTax: 0, merchantRefund: 0 };
            }
            mTotalsByCard[sCardNo].currentBalance += Number(oPart.STATEMENT_DUE_AMT) || 0;
            mTotalsByCard[sCardNo].serviceTax += Number(oPart.SERVICE_TAX) || 0;
            mTotalsByCard[sCardNo].merchantRefund += Number(oPart.MERCHANT_REFUND_AMT) || 0;
        });
 
        const aCardNos = Object.keys(mTotalsByCard);
        if (aCardNos.length === 0) return;
        console.log("aCardNos", aCardNos);
 
        // Resolve cardholder(s) for each card from ZCORPORATE_CARD (a card can
        // have more than one cardholder - e.g. principal + supplementary)
        const aCardholderRows = await oTx.run(
            SELECT.from('ZCORPORATE_CARD')
                .where({ CARD_NO: { in: aCardNos } })
                .columns('CARD_NO', 'CARDHOLDER_ID')
        );
 
        console.log("aCardholderRows", aCardholderRows);
 
        const aFoundCardNos = new Set(aCardholderRows.map((oRow) => oRow.CARD_NO));
        aCardNos.forEach((sCardNo) => {
            if (!aFoundCardNos.has(sCardNo)) {
                console.warn(`[CCC_ADVANCE_EMAIL] Card ${sCardNo} has no matching row in ZCORPORATE_CARD, no cardholder to notify`);
            }
        });
 
        for (const oCardRow of aCardholderRows) {
            const oTotals = mTotalsByCard[oCardRow.CARD_NO];
            if (!oTotals) {
                console.log(`[CCC_ADVANCE_EMAIL] No item totals found for Card ${oCardRow.CARD_NO}, skipping`);
                continue;
            }
 
            const fAdvanceAmount = oTotals.currentBalance < 0
                                    ? oTotals.currentBalance + oTotals.serviceTax - oTotals.merchantRefund
                                    : oTotals.currentBalance - oTotals.serviceTax + oTotals.merchantRefund;
            console.log(`[CCC_ADVANCE_EMAIL] Card ${oCardRow.CARD_NO} / Cardholder ${oCardRow.CARDHOLDER_ID}: currentBalance=${oTotals.currentBalance} serviceTax=${oTotals.serviceTax} merchantRefund=${oTotals.merchantRefund} -> fAdvanceAmount=${fAdvanceAmount}`);
 
            // Only notify when THIS request's own advance amount is positive
            if (!(fAdvanceAmount > 0)) {
                console.log(`[CCC_ADVANCE_EMAIL] Card ${oCardRow.CARD_NO} advance amount ${fAdvanceAmount} is not positive, skipping notification`);
                continue;
            }
 
            const oCardholder = await oTx.run(
                SELECT.one.from(Constant.Entities.ZEMP_MASTER)
                    .where({ EEID: String(oCardRow.CARDHOLDER_ID) })
                    .columns('EEID', 'NAME', 'EMAIL')
            );
 
            if (!oCardholder || !oCardholder.EMAIL) {
                console.warn(`[CCC_ADVANCE_EMAIL] No email found for cardholder ${oCardRow.CARDHOLDER_ID}, skipping notification for Card ${oCardRow.CARD_NO}`);
                continue;
            }
 
            try {
                const oEmailPayload = {
                    ApproverName: oCardholder.NAME,
                    ClaimID: sRequestId,
                    Action: Constant.ApprovalEmailAction.ACTION_NOTIFY_CARDHOLDER,
                    EmailTitle: `Corporate Credit Card Settlement - Submission of Claims`,
                    ReceiverEmail: oCardholder.EMAIL,
                    SubmissionDate: new Date().toISOString().split('T')[0],
                    ClaimantName: oCardholder.NAME,
                    RecipientName: oCardholder.NAME,
                    ClaimType: 'Corporate Credit Card Advance',
                    TripStartDate: oRequest?.TRIP_START_DATE || null,
                    TripEndDate: oRequest?.TRIP_END_DATE || null,
                    CardAdvanceAmt: String(fAdvanceAmount)
                };
 
                console.log(`[CCC_ADVANCE_EMAIL] Email payload for cardholder ${oCardRow.CARDHOLDER_ID}:`, oEmailPayload);
 
                await sendEmailInternal(oEmailPayload);
 
                console.log(`[CCC_ADVANCE_EMAIL] Advance notification sent for Request ${sRequestId} to cardholder ${oCardRow.CARDHOLDER_ID} (${oCardholder.EMAIL})`);
 
            } catch (oEmailError) {
                console.error(`[CCC_ADVANCE_EMAIL] Failed to send advance notification for Request ${sRequestId}, cardholder ${oCardRow.CARDHOLDER_ID}`, oEmailError);
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
            console.log("Completed cardholder email");
        }
 
    } catch (oError) {
        console.error(`[CCC_ADVANCE_EMAIL] Failed processing cardholder advance notifications for Request ${sRequestId}`, oError);
    }
}

async function notifyCCCMakerOfApproval(oTx, sRequestId, sApproverId) {
    console.log("Starintg email CCC maker");
    try {
        const oRequest = await oTx.run(
            SELECT.one.from('ZREQUEST_HEADER')
                .where({ REQUEST_ID: sRequestId })
                .columns('REQUEST_ID', 'REQUEST_TYPE_ID', 'EMP_ID')
        );
 
        if (!oRequest || String(oRequest.REQUEST_TYPE_ID) !== String(Constant.RequestType.CORP_CC)) {
            return; // not a Corporate Credit Card request - nothing to notify
        }

        // ApproverName = the current logged-in user performing this final
        // approval action. ClaimantName = the person who originally raised
        // the request. Neither is the CCC_MAKER - the maker is only the
        // email recipient.
        const [oApprover, oClaimant] = await Promise.all([
            sApproverId ? oTx.run(SELECT.one.from(Constant.Entities.ZEMP_MASTER).where({ EEID: sApproverId }).columns('EEID', 'NAME')) : null,
            oTx.run(SELECT.one.from(Constant.Entities.ZEMP_MASTER).where({ EEID: oRequest.EMP_ID }).columns('EEID', 'NAME'))
        ]);

        const sApproverName = oApprover?.NAME || sApproverId || '';
        const sClaimantName = oClaimant?.NAME || oRequest.EMP_ID || '';
 
        const aConstantRecs = await oTx.run(
            SELECT.from(Constant.Entities.ZCONSTANTS)
                .columns(Constant.EntitiesFields.VALUE)
                .where({ ID: Constant.ConstantId.CCC_MAKER })
        );
 
        const aMakerEmpIds = (aConstantRecs || [])
            .map(oRec => oRec?.VALUE)
            .filter(sVal => !!sVal);

        if (aMakerEmpIds.length === 0) {
            console.warn(`[CCC_MAKER_EMAIL] No CCC_MAKER configured in ZCONSTANTS, skipping notification for Request ${sRequestId}`);
            return;
        }
 
        const aMakers = await oTx.run(
            SELECT.from(Constant.Entities.ZEMP_MASTER)
                .where({ EEID: aMakerEmpIds })
                .columns('EEID', 'NAME', 'EMAIL')
        );
 
        const aMakersWithEmail = (aMakers || []).filter(oMaker => !!oMaker.EMAIL);

        if (aMakersWithEmail.length === 0) {
            console.warn(`[CCC_MAKER_EMAIL] No email found for any configured CCC_MAKER (${aMakerEmpIds.join(', ')}), skipping notification for Request ${sRequestId}`);
            return;
        }
        // Total advance amount across all cards/items on this request:
        // Advance Amount = Current Balance (STATEMENT_DUE_AMT) - Service Tax - Merchant Refund
        const aItemParts = await oTx.run(
            SELECT.from('ZREQ_ITEM_CCC_PART').where({ REQUEST_ID: sRequestId })
        );

        const oRequestTotals = (aItemParts || []).reduce((oAcc, oPart) => {
            oAcc.currentBalance += Number(oPart.STATEMENT_DUE_AMT) || 0;
            oAcc.serviceTax += Number(oPart.SERVICE_TAX) || 0;
            oAcc.merchantRefund += Number(oPart.MERCHANT_REFUND_AMT) || 0;
            return oAcc;
        }, { currentBalance: 0, serviceTax: 0, merchantRefund: 0 });

        const fRequestAdvanceAmount = oRequestTotals.currentBalance < 0
            ? oRequestTotals.currentBalance + oRequestTotals.serviceTax - oRequestTotals.merchantRefund
            : oRequestTotals.currentBalance - oRequestTotals.serviceTax + oRequestTotals.merchantRefund;
 
        for (const oMaker of aMakersWithEmail) {
            await sendEmailInternal({
                ApproverName: sApproverName,
                ClaimID: sRequestId,
                Action: Constant.ApprovalEmailAction.ACTION_APPROVED_TRANSFER,
                EmailTitle: `Corporate Credit Card Request Approved: ${sRequestId}`,
                ReceiverEmail: oMaker.EMAIL,
                SubmissionDate: new Date().toISOString().split('T')[0],
                ClaimantName: sClaimantName,
                RecipientName: oMaker.NAME,
                ClaimType: 'Corporate Credit Card Request',
                CardAdvanceAmt: String(fRequestAdvanceAmount)
            });

            console.log(`[CCC_MAKER_EMAIL] Approved Transfer notification sent for Request ${sRequestId} to CCC_MAKER ${oMaker.EEID} (${oMaker.EMAIL})`);
        }
 
    } catch (oError) {
        console.error(`[CCC_MAKER_EMAIL] Failed to send CCC_MAKER notification for Request ${sRequestId}`, oError);
        try {
            await oTx.run(
                INSERT.into(Constant.Entities.ZLOG).entries({
                    TIMESTAMP: new Date(),
                    RECORD_ID: String(sRequestId || '').slice(0, 20),
                    PROGRAM: 'CCC_MAKER_EMAIL',
                    MESSAGE_TYPE: 'W',
                    STATUS_CODE: String(oError?.status || oError?.statusCode || oError?.code || "500"),
                    MESSAGE: oError?.message || "No Message"
                })
            );
        } catch (oLogError) {
            console.error('[CCC_MAKER_EMAIL] Failed to write background log', oLogError);
        }
    }
    console.log("Completed email CCC maker");
}


module.exports = {
    updateApproverDetailsTable,
    verifyCorrectApproverForAction,
    determineLastApproverLevel,
    resolveActionDescriptor,
    updateCorpoCardAdvance,
    notifyCardholdersOfRequestApproval,
    notifyCCCMakerOfApproval
};