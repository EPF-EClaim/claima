sap.ui.define([
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/FilterOperator",
	"claima/utils/Constants"
], function (Filter, MessageToast,FilterOperator,Constants) {
    "use strict";

    return {
        /**
         * Sanity check function
         * 
         * @param {*} oValue - the variable to check
         * @param {string} SI18nKey - key in i18n for the error message
         * @returns {boolean}
         */
        sanityCheck: function (oValue, sI18nKey) {
            if (oValue === null || oValue === undefined) {
                MessageToast.show(Utility.getText(this, sI18nKey))
                return false;    // ✅ Caller can "return" if needed
            }
            return true;
        },
        /**
         * Fetch Submission Type Description from ZSUBMISSION_TYPE by Submission Type ID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sSubmissionTypeID - Submission Type ID
         * @returns {Promise<object|null>} - Submission type description or null if not found
         */
        getSubmissionTypeDesc: async function (oModel, sSubmissionTypeID) {

            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sSubmissionTypeID, "msg_failed_submission_type_id_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sSubmissionTypeTablePath = Constants.Entities.ZSUBMISSION_TYPE;

            // Build filter
            const aFilters = [
                new Filter(Constants.EntitiesFields.SUBMISSION_TYPE_ID, FilterOperator.EQ, sSubmissionTypeID)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sSubmissionTypeTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            oData = aCtx[0].getObject();

            // Return only the required fields
            return {
                SUBMISSION_TYPE_ID:     oData.SUBMISSION_TYPE_ID,
                SUBMISSION_TYPE_DESC:   oData.SUBMISSION_TYPE_DESC
            };
        },
        /**
         * Fetch Request Type Description from ZREQUEST_TYPE by Submission Type ID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sRequestTypeID - Request Type ID
         * @returns {Promise<object|null>} - Request type description or null if not found
         */
        getRequestTypeDesc: async function (oModel, sRequestTypeID) {

            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sRequestTypeID, "msg_failed_request_type_id_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sRequestTypeTablePath = Constants.Entities.ZREQUEST_TYPE;

            // Build filter
            const aFilters = [
                new Filter(Constants.EntitiesFields.REQUEST_TYPE_ID, FilterOperator.EQ, sRequestTypeID)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sRequestTypeTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            oData = aCtx[0].getObject();

            // Return only the required fields
            return {
                REQUEST_TYPE_ID:     oData.REQUEST_TYPE_ID,
                REQUEST_TYPE_DESC:   oData.REQUEST_TYPE_DESC
            };
        },
        /**
         * Fetch employee master record from ZEMP_MASTER by EEID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sEEID - Employee ID (EEID)
         * @returns {Promise<object|null>} - Employee data or null if not found
         */
        getEmployeeDetails: async function (oModel, sEEID) {

            let iRank = 0;
            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sEEID, "msg_failed_eeid_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sEmpMasterTablePath = Constants.Entities.ZEMP_MASTER;

            // Build filter
            const aFilters = [
                new Filter(Constants.EntitiesFields.EEID, FilterOperator.EQ, sEEID)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sEmpMasterTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            else{
                oData = aCtx[0].getObject();
                if(oData.ROLE === "" || oData.ROLE === null){
                    iRank = 0;
                }else{
                    const aEmpRoleRank = await this.getRoleRank(oModel, oData.ROLE)
                    iRank = aEmpRoleRank[0].RANK;
                }
            }

            // Return only the required fields
            return {
                EEID:               oData.EEID,
                NAME:               oData.NAME,
                EMAIL:              oData.EMAIL,
                DEPARTMENT:         oData.DEPARTMENT,
                ROLE:               oData.ROLE,
                RANK:               iRank,
                DIRECT_SUPERIOR:    oData.DIRECT_SUPPERIOR
            };
        },
        /**
         * Fetch substitution rule record from ZSUBSTITUTION_RULES by EEID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sApproverEEID - Approver ID (EEID)
         * @param {Date} [dDate] - Optional date (defaults to today)
         * @returns {Promise<object|null>} - Employee data or null if not found
         */
        getSubstitute: async function (oModel, sApproverEEID, dDate = new Date()) {

            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sApproverEEID, "msg_failed_eeid_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sSubstitutionRulesTablePath = Constants.Entities.ZSUBSTITUTION_RULES;

            // Convert to ISO date string (YYYY-MM-DD)
            const sToday = dDate.toISOString().split("T")[0];
            
            // Filters:
            // USER_ID EQ EEID
            // VALID_FROM LE today
            // VALID_TO GE today
            const aFilters = [
                new Filter(Constants.EntitiesFields.USER_ID, FilterOperator.EQ, sApproverEEID),
                new Filter(Constants.EntitiesFields.VALID_FROM, FilterOperator.LE, sToday),
                new Filter(Constants.EntitiesFields.VALID_TO, FilterOperator.GE, sToday)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sSubstitutionRulesTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            if (!aCtx || aCtx.length === 0) {
                return null; // no substitute found
            }
            const oData = aCtx[0].getObject();
            const oEmployeeDetail = await this.getEmployeeDetails(oModel, oData.SUBSTITUTE_ID);

            // Return only the required fields
            return {
                EEID:               oEmployeeDetail.EEID,
                NAME:               oEmployeeDetail.NAME,
                EMAIL:              oEmployeeDetail.EMAIL,
                DEPARTMENT:         oEmployeeDetail.DEPARTMENT,
                ROLE:               oEmployeeDetail.ROLE,
                RANK:               oEmployeeDetail.RANK,
                DIRECT_SUPERIOR:    oEmployeeDetail.DIRECT_SUPPERIOR
            };
        },
        /**
         * Fetch budget record from ZBUDGET by Cost Center and Year
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sCostCenter - Cost Center
         * @param {string} sYear - Year
         * @returns {Promise<object|null>} - Budget data or null if not found
         */
        getBudgetDetails: async function (oModel, sCostCenter, sYear) {
            let oData = null;
            let oBudgetOwner = null;
            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sCostCenter, "msg_failed_cost_center_undefined")) return null;
            if (!this.sanityCheck(sYear, "msg_failed_year_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sBudgetTablePath = Constants.Entities.ZBUDGET;

            // Build filter
            const aFilters = [
                new Filter(Constants.EntitiesFields.FUND_CENTER, FilterOperator.EQ, sCostCenter),
                new Filter(Constants.EntitiesFields.YEAR, FilterOperator.EQ, sYear)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sBudgetTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            if (!aCtx || aCtx.length === 0) {
                return null; // no budget data found
            }
            else{
                oData = aCtx[0].getObject();
                oBudgetOwner = await this.getEmployeeDetailsByEmail(oModel, oData.BUDGET_OWNER_ID)
            }

            // Return only the required fields
            return {
                YEAR:               oData.YEAR,
                INTERNAL_ORDER:     oData.INTERNAL_ORDER,
                COMMITMENT_ITEM:    oData.COMMITMENT_ITEM,
                FUND_CENTER:        oData.FUND_CENTER,
                MATERIAL_GROUP:     oData.MATERIAL_GROUP,
                BUDGET_OWNER_EMAIL: oData.BUDGET_OWNER_ID,
                BUDGET_OWNER_ID:    oBudgetOwner.EEID
            };
        },
        /**
         * Fetch employee master record from ZEMP_MASTER by Email
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sEmail - Email (EEID)
         * @returns {Promise<object|null>} - Employee data or null if not found
         */
        getEmployeeDetailsByEmail: async function (oModel, sEmail) {

            let iRank = 0;
            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sEmail, "msg_failed_eeid_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sEmpMasterTablePath = Constants.Entities.ZEMP_MASTER;

            // Build filter
            const aFilters = [
                new Filter(Constants.EntitiesFields.EMAIL, FilterOperator.EQ, sEmail)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sEmpMasterTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            let oData = null;
            if (!aCtx || aCtx.length === 0) {
                return null; // no employee found
            }
            else{
                oData = aCtx[0].getObject();
                if(oData.ROLE === "" || oData.ROLE === null){
                    iRank = 0;
                }else{
                    const aEmpRoleRank = await this.getRoleRank(oModel, oData.ROLE)
                    iRank = aEmpRoleRank[0].RANK;
                }
            }

            // Return only the required fields
            return {
                EEID:               oData.EEID,
                NAME:               oData.NAME,
                EMAIL:              oData.EMAIL,
                DEPARTMENT:         oData.DEPARTMENT,
                ROLE:               oData.ROLE,
                RANK:               iRank,
                DIRECT_SUPERIOR:    oData.DIRECT_SUPPERIOR
            };
        },
        /**
         * Fetch role rank record from ZROLEHIERARCHY by ROLE
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} [sRole] - Optional ROLE parameter
         * @returns {Promise<Array>} - Array of { ROLE, RANK } objects
         */
        getRoleRank: async function (oModel, sRole) {
            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            const sRoleHierarchyTablePath = Constants.Entities.ZROLEHIERARCHY;
            // Build filter list
            const aFilters = [];
            // Apply filter only if ROLE parameter is passed
            if (sRole) {
                aFilters.push(new Filter(Constants.EntitiesFields.ROLE, FilterOperator.EQ, sRole));
            }

            // Bind list
            const oBinding = oModel.bindList(
                sRoleHierarchyTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch records
            const aCtx = await oBinding.requestContexts(0, Infinity);
            const rows = aCtx.map(ctx => ctx.getObject());

            // Return only needed fields
            return rows.map(r => ({
                ROLE: r.ROLE,
                RANK: r.RANK
            }));
        },
        /**
         * Fetch Value record from ZCONSTANTS table by ID
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - OData model instance
         * @param {string} sID - ID
         * @returns {Promise<object|null>} - Constant data or null if not found
         */
        getConstants: async function (oModel, sID) {

            // --- Sanity check ---
            if (!this.sanityCheck(oModel, "msg_failed_omodel_undefined")) return null;
            if (!this.sanityCheck(sID, "msg_failed_id_undefined")) return null;

            // Ensure metadata is loaded
            await oModel.getMetaModel().requestObject("/");

            // Main table path
            const sConstantsTablePath = Constants.Entities.ZCONSTANTS;

            // Build filter
            const aFilters = [
                new Filter(Constants.EntitiesFields.ID, FilterOperator.EQ, sID)
            ];

            // Bind list
            const oBinding = oModel.bindList(
                sConstantsTablePath,
                null,
                null,
                aFilters,
                { $$ownRequest: true }
            );

            // Fetch data
            const aCtx = await oBinding.requestContexts(0, Infinity);
            const rows = aCtx.map(ctx => ctx.getObject());

            // Return only needed fields
            return rows.map(r => ({
                ID: r.ID,
                VALUE: r.VALUE
            }));
        }
    };
    
});

    
