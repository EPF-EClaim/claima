
sap.ui.define([
	"sap/m/MessageBox",
	"sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "claima/utils/Constants",
	"claima/utils/Utility"
], function (
	MessageBox,
	MessageToast,
	BusyIndicator,
	Fragment,
	Filter,
	FilterOperator,
	JSONModel,
	Sorter,
	Constants,
    Utility
) {
    "use strict";

    return {
        /**
         * Initialize the Utility 
         * @public
         */
        init: function (oOwnerComponent, oView) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
        },

        /* =========================================================
        * Update Status
        * ======================================================= */

        async _updateStatus(oModel, sID, sStatus) {
            let sSubmission_type = sID.substring(0, 3);

            let sHeaderTablePath = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.Entities.ZREQUEST_HEADER : Constants.Entities.ZCLAIM_HEADER;
            let sField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

            // Declare field for status
            // REQ uses STATUS field while CLM uses STATUS_ID field
            let sStatusField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.STATUS : Constants.EntitiesFields.CLAIM_STATUS;

            const oListBinding = oModel.bindList(sHeaderTablePath, null, null,
                [
                    new Filter({ path: sField, operator: FilterOperator.EQ, value1: sID })
                ],
                {
                    $$ownRequest: true,
                    $$groupId: "$auto",
                    $$updateGroupId: "$auto"
                }
            );

            const aCtx = await oListBinding.requestContexts(0, 1);
            const oCtx = aCtx[0];

            if (!oCtx) {
                throw new Error("Record not found.");
            }
            oCtx.setProperty(sStatusField, sStatus);

            await oModel.submitBatch("$auto");
        },

        /**
         * Gets text from the resource bundle.
         * @public
         * @param {string} sKey name of the resource
         * @param {string[]} aArgs Array of strings, variables for dynamic content
         * @returns {string} the text
         */
        getText: function (sKey, aArgs) {
            return this._oOwnerComponent.getModel("i18n").getResourceBundle().getText(sKey, aArgs);
        },

        async _updateSubmittedDate(oModel, sID) {
            let sSubmission_type = sID.substring(0, 3);

            let sHeaderTablePath = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.Entities.ZREQUEST_HEADER : Constants.Entities.ZCLAIM_HEADER;
            let sField = sSubmission_type === Constants.WorkflowType.REQUEST ? Constants.EntitiesFields.REQUESTID : Constants.EntitiesFields.CLAIMID;

            const oListBinding = oModel.bindList(sHeaderTablePath, null, null,
                [
                    new Filter({ path: sField, operator: FilterOperator.EQ, value1: sID })
                ],
                {
                    $$ownRequest: true,
                    $$groupId: "$auto",
                    $$updateGroupId: "$auto"
                }
            );

            const aCtx = await oListBinding.requestContexts(0, 1);
            const oCtx = aCtx[0];

            if (!oCtx) {
                throw new Error("Record not found.");
            }
            oCtx.setProperty(Constants.EntitiesFields.SUBMITTED_DATE, new Date().toISOString().slice(0, 10));

            await oModel.submitBatch("$auto");
        },

        openClaimTypeFilterDialog: async function (oController, sModelName, sListPath) {
            var oModel = oController.getView().getModel(sModelName);
            var aList = oModel.getProperty(sListPath) || [];
            var aTypes = [...new Set(aList.map(item => item.CLAIM_TYPE_DESC).filter(Boolean))];

            if (!oController._oFilterDialog) {
                oController._oFilterDialog = await Fragment.load({
                    id: oController.getView().getId(),
                    name: 'claima.fragment.claimtypefilterdialog',
                    controller: oController
                });
                oController.getView().addDependent(oController._oFilterDialog);

                var oFilterModel = new JSONModel({ items: [] });
                oController._oFilterDialog.setModel(oFilterModel, 'filterModel');
            }

            oController._oFilterDialog.getModel('filterModel').setProperty('/items',
                aTypes.map(sType => ({ title: sType }))
            );

            var aSelectedTypes = oController._aActiveClaimTypeFilters || [];
            oController._oFilterDialog.getItems().forEach(oItem => {
                if (aSelectedTypes.includes(oItem.getTitle())) {
                    oItem.setSelected(true);
                }
            });

            oController._oFilterDialog.open();
        },

        confirmClaimTypeFilter: function (oController, sModelName, sListPath, sCountPath, oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var aSelectedTypes = aSelectedItems.map(item => item.getTitle());
            oController._aActiveClaimTypeFilters = aSelectedTypes;

            var oModel = oController.getView().getModel(sModelName);
            var sFullListPath = sListPath + '_full';

            if (!oModel.getProperty(sFullListPath)) {
                oModel.setProperty(sFullListPath, [...oModel.getProperty(sListPath)]);
            }

            var aFullList = oModel.getProperty(sFullListPath);

            var aFiltered = aSelectedTypes.length
                ? aFullList.filter(item => aSelectedTypes.includes(item.CLAIM_TYPE_DESC))
                : aFullList;

            oModel.setProperty(sListPath, aFiltered);
            oModel.setProperty(sCountPath, aFiltered.length);
        },

        /**
         * @public
         * Updates footer buttons based on view mode and claim status.
         *
         * @param {sap.ui.core.mvc.View} oView - The view containing footer buttons.
         * @param {sap.ui.model.Model} oClaimModel - Model providing claim status data.
         * @param {object} oConstants - Constants for claim statuses and footer modes.
         * @param {string} sMode - Footer mode (SUMMARY, DETAILS, APPROVER, VIEW_ONLY).
         * @returns {void} - No return value.
         */

        updateFooterState: function (oView, oClaimModel, oConstants, sMode) {
            if (!oView || !oClaimModel || !oConstants) return;

            const sStatusId = oClaimModel.getProperty("/claim_header/status_id");

            const oButtons = {
                oBtnReject: oView.byId("button_claimapprover_reject"),
                oBtnSendBack: oView.byId("button_claimapprover_pushback"),
                oBtnApprove: oView.byId("button_claimapprover_approve"),

                oBtnSaveDraft: oView.byId("button_claimsubmission_savedraft"),
                oBtnDelete: oView.byId("button_claimsubmission_deletereport"),
                oBtnSubmit: oView.byId("button_claimsubmission_submitreport"),
                oBtnBack: oView.byId("button_claimsubmission_back"),

                oBtnDetailSave: oView.byId("button_claimdetails_input_save"),
                oBtnCancel: oView.byId("button_claimdetails_input_cancel")
            };

            Object.values(oButtons).forEach(oButton => oButton?.setVisible(false));

            const oModeButtons = {
                SUMMARY: ["oBtnSaveDraft", "oBtnDelete", "oBtnSubmit", "oBtnBack"],
                DETAILS: ["oBtnDetailSave", "oBtnCancel"],
                APPROVER: ["oBtnReject", "oBtnSendBack", "oBtnApprove", "oBtnBack"],
                VIEW_ONLY: ["oBtnBack"]
            };

            const aVisibleKeys = oModeButtons[sMode] || [];
            aVisibleKeys.forEach(sButtonKey => {
                oButtons[sButtonKey]?.setVisible(true);
            });

            const bIsFinalStatus =
                sStatusId === oConstants.ClaimStatus.CANCELLED ||
                sStatusId === oConstants.ClaimStatus.PENDING_APPROVAL ||
                sStatusId === oConstants.ClaimStatus.APPROVED ||
                sStatusId === oConstants.ClaimStatus.COMPLETED_DISBURSEMENT;

            if (bIsFinalStatus) {
                if (sMode === oConstants.ClaimFooterMode.APPROVER && sStatusId === oConstants.ClaimStatus.APPROVED) {
                    oButtons.oBtnReject?.setVisible(false);
                    oButtons.oBtnSendBack?.setVisible(false);
                    oButtons.oBtnApprove?.setVisible(false);
                }

                oButtons.oBtnSaveDraft?.setEnabled(false);
                oButtons.oBtnDelete?.setEnabled(false);
                oButtons.oBtnSubmit?.setEnabled(false);

            } else {

                oButtons.oBtnSaveDraft?.setEnabled(true);
                oButtons.oBtnDelete?.setEnabled(true);

                const bAllowSubmit =
                    sStatusId === oConstants.ClaimStatus.DRAFT ||
                    sStatusId === oConstants.ClaimStatus.SEND_BACK;

                oButtons.oBtnSubmit?.setEnabled(bAllowSubmit);
            }
        },

        /**
         * call backend service to retrieve cash advance amount for request based on approved items
         * @public
         * @param {String} sRequestId - ID of pre-approval request 
         */
        getApprovedCashAdvanceAmount: async function (sRequestId) {
            const oDataModel = this._oOwnerComponent.getModel();
            var dResult = 0.00;
            if (!sRequestId) return dResult;

            try {
                BusyIndicator.show(0); 
                
                const oFunction = oDataModel.bindContext("/getApprovedCashAdvanceAmount(...)");
                
                oFunction.setParameter("sRequestId", sRequestId);

                await oFunction.execute();
                
                const oContext = oFunction.getBoundContext();
				dResult = oContext.getObject("value") || 0.00;
                
            } catch (oError) {
                MessageBox.error(oError.toString());
                dResult = 0.00; 
            } finally {
                BusyIndicator.hide();
            }

            return dResult;
        },

         /**
         * Determine whether the number of days calculation should be treated as
         * "number of nights" instead of inclusive calendar days.
         *
         * applies ONLY to specific claim types
         *
         * When this method returns true, the date difference will be calculated
         * without adding 1 day (end date minus start date = number of nights).
         *
         * @public
         * @param {object} oHeader - claim header data containing claim type information
         * @param {object} oItem - claim item data containing claim type item ID
         * @return {boolean} bIsNightBased - true if calculation should be based on number of nights
         */

        isNightBasedCalculation: function (oHeader, oItem) {
            const aNightClaimTypes = [
                Constants.ClaimType.DLM_NEGARA,
                Constants.ClaimType.LUAR_NEGARA,
                Constants.ClaimType.KURSUS_DLM_NEGARA,
                Constants.ClaimType.KURSUS_LUAR_NEGARA,
                Constants.ClaimType.ELAUN_TUKAR
            ];

            const aLodgingItems = [
                Constants.ClaimTypeItem.HOTEL_L,
                Constants.ClaimTypeItem.HOTEL_O,
                Constants.ClaimTypeItem.LODGING_L,
                Constants.ClaimTypeItem.LODG_O,
                Constants.ClaimTypeItem.LOD_TUKAR
            ];

            return aNightClaimTypes.includes(oHeader.claimtype || oHeader.claim_type_id) &&
                aLodgingItems.includes(oItem.claim_type_item_id);
        },

        /**
		* Retrieve the number of family member including the employee him/herself
		* @public
		* @param {string} sEmpId - employee ID to retrieve dependents for
		* @returns {integer} if records found, return total number of dependents for employee
		*/
		getNumberOfFamilyMembers: async function (sClaimType) {
			const oModel = this._oOwnerComponent.getModel();
            const oContext = oModel.bindContext("/getNumberOfFamilyMembers(...)");

            if (sClaimType === Constants.ClaimTypeItem.MKN_LOAN || 
                sClaimType === Constants.ClaimTypeItem.MKN_TUKAR || 
                sClaimType === Constants.ClaimTypeItem.LOD_TUKAR
            ) {
			    oContext.setParameter("IND", Constants.DependentIndicator.Spouse_Child); //Get count of spouse and children + self
            } 

			try {
                await oContext.execute();

                const oResult = await oContext.requestObject();
    		    return oResult?.value ?? 0;
            } catch (error) {
                return 0;
            }

		},

		/**
		* Set filters for state and office location when values found for existing claim item
		* @public
		* @param {Object} oView - view from claim or PAR
		* @param {Object} oItem - claim item data containing claim type item ID
		*/
		setFiltersExistingStateLocation: function (sSubmissionType) {
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.CLAIM:
                    var oItem = this._oView.getModel("claimitem_input")?.getProperty("/claim_item");

                    // set filters
                    var sFromState = oItem.from_state_id;
                    var sFromOffice = oItem.from_location_office;
                    var sToState = oItem.to_state_id;

                    // set selection fields
                    var oSelectFromLoc = this._oView.byId("select_claimdetails_input_from_location");
                    var oSelectToState = this._oView.byId("select_claimdetails_input_to_state_id");
                    var oSelectToLoc = this._oView.byId("select_claimdetails_input_to_location");
                    break;
                case Constants.SubmissionTypePrefix.REQUEST:
                    var oItem = this._oOwnerComponent.getModel("request")?.getProperty("/req_item");
                    
                    // set filters
                    var sFromState = oItem.from_state;
                    var sFromOffice = oItem.from_location_office;
                    var sToState = oItem.to_state;

                    // set selection fields
                    var oSelectFromLoc = this._oView.byId("item_from_location_office");
                    var oSelectToState = this._oView.byId("item_to_state");
                    var oSelectToLoc = this._oView.byId("item_to_location_office");
                    break;
            }

			if (!sFromState || !sFromOffice || !sToState ||
                !oSelectFromLoc || !oSelectToState || !oSelectToLoc) return;

			// filter From Location (Office)
			var oBindingFromLoc = oSelectFromLoc?.getBinding("items");
			var aFiltersFromLoc = [
				new Filter(Constants.EntitiesFields.STATUS, FilterOperator.EQ, Constants.Status.ACTIVE),
				new Filter(Constants.EntitiesFields.STATE_ID, FilterOperator.EQ, sFromState)
			];
			oBindingFromLoc?.filter(aFiltersFromLoc);

			// filter To State
			var oBindingToState = oSelectToState?.getBinding("items");
			var aFiltersToState = [
				new Filter(Constants.EntitiesFields.STATUS, FilterOperator.EQ, Constants.Status.ACTIVE),
				new Filter(Constants.EntitiesFields.FROM_STATE_ID, FilterOperator.EQ, sFromState),
				new Filter(Constants.EntitiesFields.FROM_LOCATION_ID, FilterOperator.EQ, sFromOffice)
			];
			oBindingToState?.filter(aFiltersToState);

			// filter To Location (Office)
			var oBindingToLoc = oSelectToLoc?.getBinding("items");
			var aFiltersToLoc = [
				new Filter(Constants.EntitiesFields.STATUS, FilterOperator.EQ, Constants.Status.ACTIVE),
				new Filter(Constants.EntitiesFields.FROM_STATE_ID, FilterOperator.EQ, sFromState),
				new Filter(Constants.EntitiesFields.FROM_LOCATION_ID, FilterOperator.EQ, sFromOffice),
				new Filter(Constants.EntitiesFields.TO_STATE_ID, FilterOperator.EQ, sToState)
			];
			oBindingToLoc?.filter(aFiltersToLoc);
		},

		/**
		 * Retrieve mileage based on selected office locations
		 * @public
		 * @param {String} sFromState - value of From State
		 * @param {String} sFromOffice - value of From Location (Office)
		 * @param {String} sToState - value of To State
		 * @param {String} sToOffice - value of To Location (Office)
		 * @return {Float} fMileage - returns mileage based on selected office locations
		 */
		determineOfficeMileage: async function (sFromState, sFromOffice, sToState, sToOffice) {
			var fMileage = 0.0;

			if (!sFromState || !sFromOffice || !sToState || !sToOffice) return;

			try {
				BusyIndicator.show(0);
				const oFunction = this._oOwnerComponent.getModel().bindContext("/getOfficeDistance(...)");

				oFunction.setParameter("sFromState", sFromState);
				oFunction.setParameter("sFromOffice", sFromOffice);
				oFunction.setParameter("sToState", sToState);
				oFunction.setParameter("sToOffice", sToOffice);

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

				fMileage = parseFloat(oResult.value) || 0.0;

			} catch (oError) {
                MessageToast.show(oError.value);
				fMileage = 0.0;
			} finally {
				BusyIndicator.hide();
			}

            return fMileage;
		},

        /**
         * method to call the backend service to get Pengangkutan Darat Amount
         * @param {String} sSubmissionType 
         */
        determineDaratAmount: async function (sSubmissionType) {
            const oDataModel = this._oOwnerComponent.getModel();
            let sRegion, fKilometer;

            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    const oReqItem = this._oOwnerComponent.getModel("request").getProperty("/req_item");
                    sRegion       = oReqItem.sss; 
                    fKilometer    = oReqItem.kilometer;
                    break;

                 case Constants.SubmissionTypePrefix.CLAIM:
                    const oItem = this._oView.getModel("claimitem_input")?.getProperty("/claim_item");
                    sRegion     = oItem.region; 
                    fKilometer  = oItem.km;
                    break;
                
                default:
                    MessageBox.error("Invalid submission type provided for calculation.");
                    return null;
            }

            if (!sRegion || !fKilometer) return;

            const oFunction = oDataModel.bindContext("/getPengangkutanDaratAmount(...)");
            
            oFunction.setParameter("sRegion", sRegion);
            oFunction.setParameter("fKilometer", fKilometer);

            try {
                BusyIndicator.show(0); 
                
                await oFunction.execute();
                
                const oContext = oFunction.getBoundContext();
                const oResult  = oContext.getObject();

                return oResult;
                
            } catch (oError) {
                MessageBox.error(this.getText("d_e_not_record_found", []));
                return null; 
            } finally {
                BusyIndicator.hide();
            }
        },
        getModeofTransferMaxDays: function (sModeOfTransfer){
            const oConstantBindList = this._oOwnerComponent.getModel().bindList("/ZTRANSFER_MODE");
			var aConstantFilters = [];
            var aConstantAndFilters = [];

            aConstantAndFilters.push(new Filter(Constants.EntitiesFields.TRANSFER_MODE_ID, FilterOperator.EQ, sModeOfTransfer));
			aConstantAndFilters = new Filter(aConstantAndFilters, true);

            aConstantFilters.push(new Filter(aConstantAndFilters));
            aConstantFilters = new Filter(aConstantFilters, true);
           
            const iMaxDays = oConstantBindList.filter(aConstantFilters).requestContexts().then(function (aContexts) {
                // Process the filtered data contexts
                var oConstants = aContexts.map(context => context.getObject())[0];
                return oConstants.NUMBER_OF_DAYS;
            });
            
            return iMaxDays;
        },

        getMarriageCategoryBasedOnStatus:async function(){
            const oDataModel = this._oOwnerComponent.getModel();
            const oFunction = oDataModel.bindContext("/getMarriageCategoryBasedOnStatus(...)");

            try {                
                await oFunction.execute();
                const oContext = oFunction.getBoundContext();
                const oResult  = oContext.getObject();
                return oResult.value;
                
            } catch (oError) {
                MessageBox.error(this.getText("error_marriage_category_not_found", []));
                return null; 
            }
        }

    };
    });