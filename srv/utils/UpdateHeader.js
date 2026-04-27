const { Constant } = require("./constant");
const { formatTimeStamp } = require("./BuildSelectWhereConditions");
module.exports = {
    updateApproverActionToHeader: async function (sRecordId, sStatus, sDateField, sTimeField, tTimestamp, tx) {
        var sToUpdateFields, sWhereConditions, sIdField;
        var oDateTime = formatTimeStamp(tTimestamp);
        //Split Timestamp into Date Time
        var dDate = oDateTime.sDateFormat;
        var tTime = oDateTime.sTimeFormat;

        switch (sAction) {
            case sStatus:

                break;

            default:
                sToUpdateFields = {
                    [sDateField]: dDate,
                    [sTimeField]: tTime,
                    [Constant.EntitiesFields.STATUS]: sStatus
                };
                break;
        };

        // Build Where Condition
        switch (sRecordId.substring(0, 3)) {
            case Constant.Entities.ZCLAIM_HEADER:
                sIdField = Constant.EntitiesFields.CLAIMID;
                break;

            case Constant.Entities.ZREQUEST_HEADER:
                sIdField = Constant.EntitiesFields.REQUESTID;
                break;
        };

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