const { Constant } = require("./constant");
const BuildSelectWhereConditions = require("./BuildSelectWhereConditions");
module.exports = {
    updateApproverActionToHeader: async function (sRecordId, sStatus, tx) {
        var sHeaderTable, sToUpdateFields, sWhereConditions, sApproverDetailsTable, sApproverIdField, sIdField, sDateField, sTimeField, sReasonIdField;

        // Build Where Condition
        switch (sRecordId.substring(0, 3)) {
            case Constant.WorkflowType.CLAIM:
                sApproverDetailsTable = Constant.ApproverDetailsTable.CLAIM;
                sApproverIdField = Constant.ApproverDetailsTable.CLAIM_ID;
                sIdField = Constant.EntitiesFields.CLAIMID;
                sHeaderTable = Constant.Entities.ZCLAIM_HEADER;
                break;

            case Constant.WorkflowType.REQUEST:
                sApproverDetailsTable = Constant.ApproverDetailsTable.REQUEST;
                sApproverIdField = Constant.ApproverDetailsTable.PREAPPROVAL_ID;
                sIdField = Constant.EntitiesFields.REQUESTID;
                sHeaderTable = Constant.Entities.ZREQUEST_HEADER;
                break;
        };

        var tTimestampDesc = Constant.EntitiesFields.PROCESS_TIMESTAMP + " " + Constant.WhereCondition.DESC;
        let aApproverConditions = {
            [sApproverIdField]: sRecordId
        };
        const sApproverConditions = BuildSelectWhereConditions.buildWhereCondition(aApproverConditions);

        // Select from Approver Details
        var tTimestamp = await tx.run(
            SELECT.one.from(sApproverDetailsTable)
                .where(`${sApproverConditions}`)
                .columns(Constant.EntitiesFields.PROCESS_TIMESTAMP,
                        Constant.EntitiesFields.REJECT_REASON_ID
                )
                .orderBy(`${tTimestampDesc}`)
                .limit(1)
        );

        if (!(!!tTimestamp)) {
            throw new Error("No Approver Details Record Found.");
        }

        //Split Timestamp into Date Time
        var oDateTime = BuildSelectWhereConditions.formatTimeStamp(tTimestamp.PROCESS_TIMESTAMP);

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
                sReasonId = tTimestamp.REJECT_REASON_ID;
                break;

            case Constant.Status.PUSH_BACK:
                sDateField = Constant.EntitiesFields.LAST_PUSH_BACK_DATE;
                sTimeField = Constant.EntitiesFields.LAST_PUSH_BACK_TIME;
                sReasonIdField = Constant.EntitiesFields.PUSH_BACK_REASON_ID;
                sReasonId = tTimestamp.REJECT_REASON_ID;
                break;

            default:
                throw new Error("No corresponding status field in header Table.");
                break;
        }

        sToUpdateFields = {
            [sDateField]: dDate,
            [sTimeField]: tTime,
            [Constant.EntitiesFields.STATUS]: sStatus
        };

        if ((sStatus == Constant.Status.REJECTED) || (sStatus == Constant.Status.PUSH_BACK)) {
            sToUpdateFields[sReasonIdField] =  sReasonId;
        }
        console.log(sToUpdateFields, tTimestamp);
        var sWhereConditions = {
            [sIdField]: sRecordId
        };

        return sResult = await this.updateHeader(sHeaderTable, sToUpdateFields, sWhereConditions, tx);
    },

    updateHeader: async function (sHeaderTable, sToUpdateFields, sWhereConditions, tx) {
        return sResult = await tx.run(
            UPDATE(sHeaderTable)
                .set(sToUpdateFields)
                .where(sWhereConditions));
    }

};