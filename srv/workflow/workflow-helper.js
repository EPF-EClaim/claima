const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const { Constant } = require("../utils/constant");

const aEntityTableByPrefix = {
    [Constant.WorkflowType.CLAIM]   : {
        entityPrefix        : Constant.WorkflowType.CLAIM,
        entityHeader        : cds.entities['eclaim_srv.ZCLAIM_HEADER'],
        entityItem          : cds.entities['eclaim_srv.ZCLAIM_ITEM'],
        entityApprovers     : cds.entities['eclaim_srv.ZAPPROVER_DETAILS_CLAIMS'],
        idField             : Constant.EntitiesFields.CLAIMID,
        typeField           : Constant.EntitiesFields.SUBMISSION_TYPE,
        approverIdField     : Constant.ApproverDetailsTable.CLAIM_ID,
        entityTypeDesc      : 'ZSUBMISSION_TYPE.SUBMISSION_TYPE_DESC',
        entityTypeDescField : 'ZSUBMISSION_TYPE_SUBMISSION_TYPE_DESC'
    },
    [Constant.WorkflowType.REQUEST] : {
        entityPrefix        : Constant.WorkflowType.REQUEST,
        entityHeader        : cds.entities['eclaim_srv.ZREQUEST_HEADER'],
        entityItem          : cds.entities['eclaim_srv.ZREQUEST_ITEM'],
        entityApprovers     : cds.entities['eclaim_srv.ZAPPROVER_DETAILS_PREAPPROVAL'],
        idField             : Constant.EntitiesFields.REQUESTID,
        typeField           : Constant.EntitiesFields.REQUEST_TYPE_ID,
        approverIdField     : Constant.ApproverDetailsTable.PREAPPROVAL_ID,
        entityTypeDesc      : 'ZREQUEST_TYPE.REQUEST_TYPE_DESC',
        entityTypeDescField : 'ZREQUEST_TYPE_REQUEST_TYPE_DESC'
    }
}
function resolveDocDescriptor(sId) {
    const sPrefix = sId.slice(0,3);

    const oDescriptor = aEntityTableByPrefix[sPrefix]
    //console.log('[workflow-determination/resolveDocDescriptor] oDescriptor:', oDescriptor)
    return oDescriptor
}
async function retrieveHeaderDetails(oTx, sId, oDescriptor) {
    
    const oHeader =  await oTx.run(
        SELECT
            .one
            .from(oDescriptor.entityHeader)
            .columns(   oDescriptor.idField,
                        oDescriptor.typeField,
                        oDescriptor.entityTypeDesc,
                        Constant.EntitiesFields.EMP_ID,
                        Constant.EntitiesFields.COST_CENTER,
                        Constant.EntitiesFields.ALTERNATE_COST_CENTER
            )
            .where( { [oDescriptor.idField]:sId })
    );
    
    return oHeader;
}
async function retrieveEmployeeDetails(oTx, sId, sEmail){

    const sEmpMasterTable = cds.entities['eclaim_srv.ZEMP_MASTER'];
    let sWhereClause;
    if(sId && sEmail) {
        sWhereClause = {
            [Constant.EntitiesFields.EEID]      : sId,
            [Constant.EntitiesFields.EMAIL]     : sEmail
        }
    }
    else if(sId) {
        sWhereClause = {
            [Constant.EntitiesFields.EEID]  : sId
        };
    }
    else if(sEmail) {
        sWhereClause = {
            [Constant.EntitiesFields.EMAIL]     : sEmail
        };
    }    
    const oEmployeeContext =  await cds.run(
        SELECT  
            .one
            .from(sEmpMasterTable)
            .where(sWhereClause)
            .columns(
                Constant.EntitiesFields.EEID,
                Constant.EntitiesFields.NAME,
                Constant.EntitiesFields.DEP,
                Constant.EntitiesFields.EMAIL,
                Constant.EntitiesFields.DIRECT_SUPERIOR,
                Constant.EntitiesFields.ROLE,
            )
    )
    if(!oEmployeeContext) {
        return null;
    }
    return oEmployeeContext;
}
module.exports = { 
    resolveDocDescriptor,
    retrieveHeaderDetails,
    retrieveEmployeeDetails
};