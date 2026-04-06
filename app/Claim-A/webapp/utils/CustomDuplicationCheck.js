sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "claima/utils/Constants",
    "claima/utils/Utility",
    "claima/utils/DateUtility"
], function (Filter, FilterOperator, Constants, Utility, DateUtility) {
    "use strict";

    return {

        init: function (oOwnerComponent) {
            this._oOwnerComponent = oOwnerComponent;
        },

        /**
         * Checks all claim items for duplication.
         * @public
         * @param {object} oController the controller containing the claim models
         * @returns {Promise<void>} throws an error if duplication is found
         */
        async CheckAllItems(oController) {

            const oSubmissionModel = oController.getView().getModel("claimsubmission_input");
            const aItems = oSubmissionModel.getProperty("/claim_items") || [];

            for (let iIndex = 0; iIndex < aItems.length; iIndex++) {

                const oItem = aItems[iIndex];

                this._checkLocalDuplicate(aItems, iIndex);
                await this._checkBackendDuplicate(oController, oItem);
            }
        },

        /**
         * Checks a claim item for duplication within the local list.
         * @public
         * @param {object[]} aItems the array of claim items
         * @param {int} iIndex the index of the current item to check
         * @returns {void} throws an error if a duplicate is found
         */
        _checkLocalDuplicate: function (aItems, iIndex) {

            const oItem = aItems[iIndex];

            for (let iCompare = 0; iCompare < aItems.length; iCompare++) {

                if (iCompare === iIndex) continue;

                const oCompare = aItems[iCompare];

                // Receipt duplicate
                if (
                    oItem.receipt_number &&
                    oItem.receipt_number === oCompare.receipt_number &&
                    oItem.receipt_date === oCompare.receipt_date
                ) {
                    throw new Error(Utility.getText("msg_duplicate_error_receipt_local"));
                }

                // Bill duplicate
                if (
                    oItem.bill_no &&
                    oItem.bill_no === oCompare.bill_no &&
                    oItem.bill_date === oCompare.bill_date
                ) {
                    throw new Error(Utility.getText("msg_duplicate_error_bill_local"));
                }
            }
        },



        /**
         * Checks a claim item for duplication in the backend.
         * @public
         * @param {object} oController the controller containing the claim models
         * @param {object} oItem the claim item to check
         * @returns {Promise<void>} throws an error if a duplicate is found
         */
        async _checkBackendDuplicate(oController, oItem) {
            const sEmpId = oController._oSessionModel.getProperty("/userId");
            const sClaimTypeId = oItem.claim_type_id;

            if (!sEmpId) return false;
            const sRawDate =
                oItem.receipt_date ||
                oItem.bill_date;

            if (!DateUtility.isValidDate(sRawDate)) return false;

            const oWindow = DateUtility.getPrevYearToYearEnd(sRawDate);
            const sStartDate = oWindow.start;
            const sEndDate = oWindow.end;

            await this._checkBackendReceiptBill(oController, oItem, sEmpId, sStartDate, sEndDate);
            if (sClaimTypeId === Constants.ClaimType.KURSUS_DLM_NEGARA) {
                await this._checkBackendKursus(oController, oItem, sEmpId, sStartDate, sEndDate);
            }

            return false;
        },


        /**
         * Checks duplication in backend for Receipt/Bill Number and Date.
         * @public
         * @param {object} oController the controller containing the claim models
         * @param {object} oItem the claim item to check
         * @param {string} sEmpId employee ID used for filtering
         * @param {string} sStartDate start of the 2-year validation window
         * @param {string} sEndDate end of the 2-year validation window
         * @returns {Promise<void>} throws an error if a duplicate is found
         */
        async _checkBackendReceiptBill(oController, oItem, sEmpId, sStartDate, sEndDate) {

            const oModel = oController.getOwnerComponent().getModel();
            const aFilters = [];

            // Receipt duplicate
            if (oItem.receipt_number && oItem.receipt_date) {
                aFilters.push(new Filter({
                    and: true,
                    filters: [
                        new Filter("EMP_ID", FilterOperator.EQ, sEmpId),
                        new Filter("RECEIPT_DATE", FilterOperator.BT, sStartDate, sEndDate),
                        new Filter("RECEIPT_NUMBER", FilterOperator.EQ, oItem.receipt_number),
                        new Filter("RECEIPT_DATE", FilterOperator.EQ, oItem.receipt_date),
                        new Filter("CLAIM_SUB_ID", FilterOperator.NE, oItem.claim_sub_id)
                    ]
                }));
            }

            // Bill duplicate
            if (oItem.bill_no && oItem.bill_date) {
                aFilters.push(new Filter({
                    and: true,
                    filters: [
                        new Filter("EMP_ID", FilterOperator.EQ, sEmpId),
                        new Filter("BILL_DATE", FilterOperator.BT, sStartDate, sEndDate),
                        new Filter("BILL_NO", FilterOperator.EQ, oItem.bill_no),
                        new Filter("BILL_DATE", FilterOperator.EQ, oItem.bill_date),
                        new Filter("CLAIM_SUB_ID", FilterOperator.NE, oItem.claim_sub_id)
                    ]
                }));
            }

            if (aFilters.length === 0) return false;

            const oBinding = oModel.bindList("/ZCLAIM_ITEM", null, null, aFilters, { $$ownRequest: true });
            const aContexts = await oBinding.requestContexts(0, Infinity);

            if (aContexts.length > 0) {

                if (oItem.receipt_number) {
                    throw new Error(Utility.getText("msg_duplicate_error_receipt"));
                }

                if (oItem.bill_no) {
                    throw new Error(Utility.getText("msg_duplicate_error_bill"));
                }
            }

            return false;
        },


        /**
         * Checks duplication in backend for Claim Type KURSUS DLM NEGARA.
         * @public
         * @param {object} oController the controller containing the claim models
         * @param {object} oItem the claim item to check
         * @param {string} sEmpId employee ID used for filtering
         * @param {string} sStartDate start of the 2-year validation window
         * @param {string} sEndDate end of the 2-year validation window
         * @returns {Promise<void>} throws an error if a duplicate is found
         */
        async _checkBackendKursus(oController, oItem, sEmpId, sStartDate, sEndDate) {

            const sCourseCode = await this._fetchBackendCourseCode(oController, oItem.claim_id);
            if (!sCourseCode) return false;

            const sSessionNumber = await this._fetchBackendSessionNo(
                oController,
                sEmpId,
                oItem.claim_id,
                sCourseCode
            );

            if (!sSessionNumber) return false;

            const oEmpViewModel = oController.getView().getModel("employee_view");

            const aFilters = [
                new Filter("EMP_ID", FilterOperator.EQ, sEmpId),
                new Filter("COURSE_CODE", FilterOperator.EQ, sCourseCode),
                new Filter("SESSION_NUMBER", FilterOperator.EQ, sSessionNumber),
                new Filter("RECEIPT_DATE", FilterOperator.BT, sStartDate, sEndDate),
                new Filter("START_DATE", FilterOperator.LE, oItem.end_date),
                new Filter("END_DATE", FilterOperator.GE, oItem.start_date),
                new Filter("CLAIM_SUB_ID", FilterOperator.NE, oItem.claim_sub_id)
            ];

            const oBinding = oEmpViewModel.bindList("/ZEMP_CLAIM_ITEM_VIEW", null, null, aFilters, {
                $$ownRequest: true
            });

            const aContexts = await oBinding.requestContexts(0, Infinity);

            if (aContexts.length > 0) {
                throw new Error(Utility.getText("msg_duplicate_error_kursus"));
            }

            return false;
        },


        /**
         * Checks duplication in backend for Receipt/Bill Number and Date.
         * @public
         * @param {object} oController the controller containing the claim models
         * @param {string} sEmpId employee ID used for filtering
         * @param {string} sClaimId Claim ID
         * @param {string} sCourseCode Course code 
         * @returns {Promise<void>} throws an error if a duplicate is found
         */

        async _fetchBackendSessionNo(oController, sEmpId, sClaimId, sCourseCode) {

            const oEmpViewModel = oController.getView().getModel("employee_view");

            const aFilters = [
                new Filter("EMP_ID", FilterOperator.EQ, sEmpId),
                new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId),
                new Filter("COURSE_CODE", FilterOperator.EQ, sCourseCode)
            ];

            const oBinding = oEmpViewModel.bindList("/ZEMP_CLAIM_ITEM_VIEW", null, null, aFilters, {
                $$ownRequest: true
            });

            const aContexts = await oBinding.requestContexts(0, 1);
            if (aContexts.length === 0) return null;

            return aContexts[0].getProperty("SESSION_NUMBER");
        },

        /**
        * Checks duplication in backend for Receipt/Bill Number and Date.
        * @public
        * @param {object} oController the controller containing the claim models
        * @param {string} sClaimId Claim ID
        * @returns {Promise<void>} throws an error if a duplicate is found
        */
        async _fetchBackendCourseCode(oController, sClaimId) {

            const oModel = oController.getOwnerComponent().getModel();

            const aFilters = [
                new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId)
            ];

            const oBinding = oModel.bindList("/ZCLAIM_HEADER", null, null, aFilters, { $$ownRequest: true });
            const aContexts = await oBinding.requestContexts(0, 1);

            if (aContexts.length === 0) return null;

            return aContexts[0].getProperty("COURSE_CODE");
        }
    };
});