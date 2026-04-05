sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "claima/utils/Constants",
    "claima/utils/Utility",
    "claima/utils/DateUtility"
], function (Filter, FilterOperator, Sorter, Constants, Utility, DateUtility) {
    "use strict";

    return {
        /**
         * Initialize the Utility 
         * @public
         */
        init: function (oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
        },

        //New logic for Duplication check;

        async CheckDuplicateClaimItem(oController, oItem) {

            const oModelEmployee = oController.getOwnerComponent().getModel(); // OData V4
            const sEmpId = oItem.emp_id;

            if (!sEmpId) return false;

            const aFilters = [];

            // --- Determine raw date (receipt or bill)

            const sRawDate = oItem.receipt_date || oItem.bill_date;
            if (!DateUtility.isValidDate(sRawDate)) return false;

            const oDate = new Date(sRawDate);
            if (isNaN(oDate)) return false;

            // --- Build date window: Previous Year → Current Year

            const oWindow = DateUtility.getTwoYearWindow(sRawDate);
            const sStartDate = oWindow.start;
            const sEndDate = oWindow.end;

            //RECEIPT Duplicate Check
            if (oItem.receipt_number && oItem.receipt_date) {

                aFilters.push(Filter({
                    and: true,
                    filters: [
                        new Filter("EMP_ID", FilterOperator.EQ, sEmpId),

                        // Restrict to 2-year history
                        new Filter("RECEIPT_DATE", FilterOperator.BT, sStartDate, sEndDate),

                        // Duplicate fields
                        new Filter("RECEIPT_NUMBER", FilterOperator.EQ, oItem.receipt_number),
                        new Filter("RECEIPT_DATE", FilterOperator.EQ, oItem.receipt_date),
                        // Exclude the current claim from duplicate detection
                        new Filter("CLAIM_SUB_ID", FilterOperator.NE, oItem.claim_sub_id)
                    ]
                }));
            }
            // BILL Duplicate Check
            if (oItem.bill_no && oItem.bill_date) {

                aFilters.push(new sap.ui.model.Filter({
                    and: true,
                    filters: [
                        new Filter("EMP_ID", FilterOperator.EQ, sEmpId),

                        // Restrict to 2-year history
                        new Filter("BILL_DATE", FilterOperator.BT, sStartDate, sEndDate),

                        // Duplicate fields
                        new Filter("BILL_NO", FilterOperator.EQ, oItem.bill_no),
                        new Filter("BILL_DATE", FilterOperator.EQ, oItem.bill_date),
                        new Filter("CLAIM_SUB_ID", FilterOperator.NE, oItem.claim_sub_id)
                    ]
                }));
            }


            const bIsKursus =
                oItem.claim_type === Constants.ClaimType.KURSUS &&
                oHeader.course_code &&
                oItem.session_no;

            if (bIsKursus) {

                const sCourseCode = oHeader.course_code;
                const sSessionNo = oItem.session_no;
                const sStart = oItem.start_date;
                const sEnd = oItem.end_date;

                if (sStart === sEnd) {
                    throw new Error(Utility.getText("msg_kursus_invalid_same_date"));
                }

                const oOverlapFilter = new Filter({
                    and: false,
                    filters: [
                        new Filter("START_DATE", FilterOperator.BT, sStart, sEnd),
                        new Filter("END_DATE", FilterOperator.BT, sStart, sEnd)
                    ]
                });

                aFilters.push(new Filter({
                    and: true,
                    filters: [
                        new Filter("EMP_ID", FilterOperator.EQ, sEmpId),

                        new Filter("COURSE_CODE", FilterOperator.EQ, sCourseCode),
                        new Filter("SESSION_NO", FilterOperator.EQ, sSessionNo),

                        // 2-year date window
                        new Filter("RECEIPT_DATE", FilterOperator.BT, sStartDate, sEndDate),

                        oOverlapFilter,

                        new Filter("CLAIM_SUB_ID", FilterOperator.NE, oItem.claim_sub_id)
                    ]
                }));
            }


            if (aFilters.length === 0) return false;
            const oListBinding = oModelEmployee.bindList("/ZCLAIM_ITEM", null, null, aFilters, {
                $$ownRequest: true
            });
            const aContexts = await oListBinding.requestContexts(0, Infinity);
            const aResults = aContexts.map(oCtx => oCtx.getObject());

            if (aResults.length > 0) {

                if (oItem.receipt_number && oItem.receipt_date) {
                    throw new Error(Utility.getText("msg_duplicate_error_receipt"))
                }

                if (oItem.bill_no && oItem.bill_date) {
                    throw new Error(Utility.getText("msg_duplicate_error_bill"))
                }
            }

            return false;
        }

    };
});