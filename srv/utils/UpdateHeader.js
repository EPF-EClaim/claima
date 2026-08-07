const { Constant } = require("./constant");
const BuildSelectWhereConditions = require("./BuildSelectWhereConditions");
module.exports = {
    /**
        * Update Claim and Request Header Date Time fields for analytics and auditing
        * @public
        * @param {String} sRecordId - Claims / Request Record ID
        * @param {String} sStatus - Status to be updated into header tables
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} result number of records updated in header tables
        */
    updateApproverActionToHeader: async function (sRecordId, sStatus, tx) {
        var sHeaderTable, oToUpdateFields, oWhereConditions, sApproverDetailsTable, sApproverIdField, sIdField, sDateField, sTimeField, sReasonIdField, sStatusField;

        // Build Where Condition
        switch (sRecordId.substring(0, 3)) {
            case Constant.WorkflowType.CLAIM:
                sApproverDetailsTable = Constant.ApproverDetailsTable.CLAIM;
                sApproverIdField = Constant.ApproverDetailsTable.CLAIM_ID;
                sIdField = Constant.EntitiesFields.CLAIMID;
                sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
                sStatusField = Constant.EntitiesFields.STATUS_ID;
                break;

            case Constant.WorkflowType.REQUEST:
                sApproverDetailsTable = Constant.ApproverDetailsTable.REQUEST;
                sApproverIdField = Constant.ApproverDetailsTable.PREAPPROVAL_ID;
                sIdField = Constant.EntitiesFields.REQUESTID;
                sHeaderTable = Constant.Entities.ZREQUEST_HEADER;
                sStatusField = Constant.EntitiesFields.STATUS;
                break;
        };

        var tTimestampDesc = Constant.EntitiesFields.PROCESS_TIMESTAMP + " " + Constant.WhereCondition.DESC;
        let aApproverConditions = {
            [sApproverIdField]: sRecordId
        };
        const sApproverConditions = BuildSelectWhereConditions.buildWhereCondition(aApproverConditions);

        // Select from Approver Details
        var oTimestamp = await tx.run(
            SELECT.one.from(sApproverDetailsTable)
                .where(`${sApproverConditions}`)
                .columns(Constant.EntitiesFields.PROCESS_TIMESTAMP,
                        Constant.EntitiesFields.REJECT_REASON_ID
                )
                .orderBy(`${tTimestampDesc}`)
                .limit(1)
        );

        if (!(!!oTimestamp)) {
            throw new Error("No Approver Details Record Found.");
        }

        //Split Timestamp into Date Time
        var oDateTime = BuildSelectWhereConditions.formatTimeStamp(oTimestamp.PROCESS_TIMESTAMP);

        var dDate = oDateTime.sDateFormat;
        var tTime = oDateTime.sTimeFormat;

        // change Date time field based on Status
        switch (sStatus) {
            case Constant.Status.APPROVED:
                sDateField = Constant.EntitiesFields.LAST_APPROVED_DATE;
                sTimeField = Constant.EntitiesFields.LAST_APPROVED_TIME;
                break;

            case Constant.Status.REJECTED:
                sDateField = Constant.EntitiesFields.REJECT_REASON_DATE;
                sTimeField = Constant.EntitiesFields.REJECT_REASON_TIME;
                sReasonIdField = Constant.EntitiesFields.REJECT_REASON_ID;
                sReasonId = oTimestamp.REJECT_REASON_ID;
                break;

            case Constant.Status.PUSH_BACK:
                sDateField = Constant.EntitiesFields.LAST_PUSH_BACK_DATE;
                sTimeField = Constant.EntitiesFields.LAST_PUSH_BACK_TIME;
                sReasonIdField = Constant.EntitiesFields.PUSH_BACK_REASON_ID;
                sReasonId = oTimestamp.REJECT_REASON_ID;
                break;

            default:
                throw new Error("No corresponding status field in header Table.");
                break;
        }

        // Object of to be updated fields
        oToUpdateFields = {
            [sDateField]: dDate,
            [sTimeField]: tTime,
            [sStatusField]: sStatus // caters for both par and claim
        };

        // Reject and Push back has reason ID fields
        if ((sStatus == Constant.Status.REJECTED) || (sStatus == Constant.Status.PUSH_BACK)) {
            oToUpdateFields[sReasonIdField] =  sReasonId;
        }

        // where condition
        var oWhereConditions = {
            [sIdField]: sRecordId
        };

        console.log("To Update Fields: ", oToUpdateFields);
        console.log("Where Conditions: ", oWhereConditions);
        console.log("Header Table: ", sHeaderTable);    

        return sResult = await this.updateHeader(sHeaderTable, oToUpdateFields, oWhereConditions, tx);
    },

    /**
        * Update header table based on input parameters
        * @public
        * @param {String} sHeaderTable - Header Table Name
        * @param {Object} oToUpdateFields - Object of to be updated fields
        * @param {Object} oWhereConditions - Update statement Where Conditions
        * @param {Object} tx - CDS Transaction
        * @returns {Integer} number of records updated
        */
    updateHeader: async function (sHeaderTable, oToUpdateFields, oWhereConditions, tx) {
        const iResult = await tx.run(
            UPDATE(sHeaderTable)
                .set(oToUpdateFields)
                .where(oWhereConditions));

        if (sHeaderTable === 'ZREQUEST_HEADER' || sHeaderTable === Constant.Entities.ZREQUEST_HEADER) {
        
            // Extract the ID and Status from the objects passed into the function
            const sRequestId = oWhereConditions.REQUEST_ID; 
            const sStatus = oToUpdateFields.STATUS;

            await this.handlePostHeaderUpdate(sRequestId, sStatus, tx);

        }

        // Return the original update result (number of affected rows)
        return iResult;
    },

    /**
     * Post-update logic for ZREQUEST_HEADER
     * Call this function immediately after updating the header table manually.
     */
    handlePostHeaderUpdate: async function (sRequestId, sStatus, tx) {
        if (!sRequestId) return;

        // 1. Single Read for Header Data
        const oHeader = await tx.run(
            SELECT.one.from('ZREQUEST_HEADER').where({ REQUEST_ID: sRequestId })
        );

        if (!oHeader) return;

        // 2. Perform the Item Update (Project Code -> Internal Order)
        if (oHeader.PROJECT_CODE) {
            const sCurrentYear = String(new Date().getFullYear());
            const oBudget = await tx.run(
                SELECT.one
                    .from('ZBUDGET')
                    .columns('WBS_CODE')
                    .where({
                        PROJECT_CODE: sProjectCode,
                        YEAR: sCurrentYear
                    })
            );
            await tx.run(
                UPDATE('ZREQUEST_ITEM')
                    .set({ INTERNAL_ORDER: oBudget?.WBS_CODE })
                    .where({ REQUEST_ID: sRequestId })
            );
        }

        // 3. Handle the Approval Logic
        if (sStatus === Constant.Status.APPROVED) {
            
            // Spawn background task using the transaction's user context
            cds.spawn({ user: tx.context?.user }, async (spawnTx) => {
                try {
                    switch (oHeader.CLAIM_TYPE_ID) {
                        case Constant.ClaimType.HANDPHONE:
                            const aReqItem = await spawnTx.run(
                                SELECT.from(Constant.Entities.ZREQUEST_ITEM).where({ REQUEST_ID: sRequestId })
                            );

                            const aReqSubId = aReqItem.map((d) => d.REQUEST_SUB_ID);
                            const aParticipantData = await spawnTx.run(
                                SELECT.from(Constant.Entities.ZREQ_ITEM_PART).where({
                                    REQUEST_ID: sRequestId,
                                    REQUEST_SUB_ID: { in: aReqSubId }
                                })
                            );

                            // Use Promise.all for inserting inside loops
                            const insertPromises = aParticipantData.map(participant => {
                                const aPartReqItem = aReqItem.find(item => item.REQUEST_SUB_ID === participant.REQUEST_SUB_ID);
                                if (aPartReqItem) {
                                    return spawnTx.run(
                                        INSERT.into('ZCLM_TYPE_EXCEPTION_LIST').entries({
                                            EMP_ID: participant.PARTICIPANTS_ID,
                                            CLAIM_TYPE_ID: aPartReqItem.CLAIM_TYPE_ID,
                                            START_DATE: aPartReqItem.START_DATE,
                                            END_DATE: aPartReqItem.END_DATE,
                                            ELIGIBLE_AMOUNT: participant.ALLOCATED_AMOUNT
                                        })
                                    );
                                }
                            });
                            await Promise.all(insertPromises);
                            break;

                        default:
                            const oCashAdvanceItem = await spawnTx.run(
                                SELECT.one.from('ZREQUEST_ITEM').where({
                                    REQUEST_ID: sRequestId,
                                    CASH_ADVANCE: true
                                })
                            );

                            if (!oCashAdvanceItem) return;

                            const oExistingCashAdvRecords = await spawnTx.run(
                                SELECT.one.from('ZEMP_CA_PAYMENT').where({
                                    REQUEST_ID: sRequestId,
                                    EMP_ID: oHeader.EMP_ID
                                })
                            );

                            if (oExistingCashAdvRecords) return;

                            let dDate = new Date(oHeader.TRIP_START_DATE);
                            dDate.setDate(dDate.getDate() - 14);
                            const sDisbursementDate = dDate.toISOString().split('T')[0];

                            await spawnTx.run(
                                INSERT.into('ZEMP_CA_PAYMENT').entries({
                                    REQUEST_ID: sRequestId,
                                    EMP_ID: oHeader.EMP_ID,
                                    DISBURSEMENT_DATE: sDisbursementDate,
                                    DISBURSEMENT_STATUS: Constant.DisbursementStatus.TO_BE_DISBURSED
                                })
                            );
                            break;
                    }
                } catch (error) {
                    console.error(`Background task failed for Request ID ${sRequestId}: ${error.message}`);
                }
            });
        }
    }

};