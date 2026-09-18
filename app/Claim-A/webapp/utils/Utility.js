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
        * Purpose of this code is to prevent any users from using a url with a claim id/ request id that is not tied to their employee id
        * this could be either if they are not the claimant, approver or the substitute approver
        * only the owner of the claim, the current approver or current substitute of the claim/request can view the claim/request
        * @public
         * @param {string} sId - the Claim ID or Request ID to check
         * @returns {Promise<boolean>} true if access is allowed, false otherwise
         */
        checkClaimAccess: async function (sId) {
            const oModel = this._oOwnerComponent.getModel();

            if (!sId || !oModel) {
                this._denyClaimAccess();
                return false;
            }

            let bHasAccess = false;

            try {
                const oFunction = oModel.bindContext("/checkClaimAccess(...)");
                oFunction.setParameter("sId", sId);

                await oFunction.execute();

                bHasAccess = !!oFunction.getBoundContext().getObject("value");
            } catch (oError) {
                this._denyClaimAccess(this.getText("msg_claim_access_check_failed"));
                return false;
            }

            if (!bHasAccess) {
                this._denyClaimAccess();
            }

            return bHasAccess;
        },

        /**
         * shows a pop up error message to notifying the users about the unathorized claim/request access
         * @private
         * @param {string} [sMessage] - message to display; defaults to the
         *      "not authorized" message when omitted
         */
        _denyClaimAccess: function (sMessage) {
            MessageBox.error(sMessage || this.getText("msg_claim_access_denied"), {
                onClose: () => {
                    const oRouter = this._oOwnerComponent && this._oOwnerComponent.getRouter();
                    if (oRouter) {
                        oRouter.navTo("Dashboard", {}, true);
                    }
                }
            });
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
                Constants.ClaimType.KURSUS_LUAR_NEGARA
            ];

            const aLodgingItems = [
                Constants.ClaimTypeItem.HOTEL_L,
                Constants.ClaimTypeItem.HOTEL_O,
                Constants.ClaimTypeItem.LODGING_L,
                Constants.ClaimTypeItem.LODG_O
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
        determineDaratAmount: async function (sSubmissionType, bIsAlone) {
            const oDataModel = this._oOwnerComponent.getModel();
            let sRegion, fKilometer,sMaritalCategory;

            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    const oReqItem = this._oOwnerComponent.getModel("request").getProperty("/req_item");
                    const oReqHeader = this._oOwnerComponent.getModel("request").getProperty("/req_header");

                    sRegion         = oReqItem.sss; 
                    fKilometer      = oReqItem.kilometer;

                    if (oReqHeader.transferalonefamily === Constants.TravelAloneOrWithFamily.ALONE || 
                        oReqHeader.transferfamilynowlater === Constants.TravelWithFamilyNowOrLater.LATER) {
                        sMaritalCategory = Constants.MarriageCategory.SINGLE;
                    } else {
                        sMaritalCategory = oReqItem.marriage_cat ? oReqItem.marriage_cat : null;
                    }

                    break;

                 case Constants.SubmissionTypePrefix.CLAIM:
                    const oItem = this._oView.getModel("claimitem_input")?.getProperty("/claim_item");
                    const sTravelAloneFamily = this._oView.getModel("claimsubmission_input").getProperty("/claim_header/travel_alone_family");
                    const sTravelFamilyNowLater = this._oView.getModel("claimsubmission_input").getProperty("/claim_header/travel_family_now_later");

                    sRegion     = oItem.region; 
                    fKilometer  = oItem.km;
                    if(sTravelAloneFamily == Constants.TravelAloneOrWithFamily.ALONE_DESC || sTravelFamilyNowLater == Constants.TravelWithFamilyNowOrLater.LATER_DESC ||
                        sTravelAloneFamily == Constants.TravelAloneOrWithFamily.ALONE || sTravelFamilyNowLater == Constants.TravelWithFamilyNowOrLater.LATER
                    ){
                        sMaritalCategory = Constants.MarriageCategory.SINGLE;
                    }else{
                        sMaritalCategory = oItem.marriage_category ? oItem.marriage_category : null;
                    }
                    break;
                
                default:
                    MessageBox.error("Invalid submission type provided for calculation.");
                    return null;
            }

            if (!sRegion, !sMaritalCategory) return;

            const oFunction = oDataModel.bindContext("/getPengangkutanDaratAmount(...)");
            
            oFunction.setParameter("sRegion", sRegion);
            oFunction.setParameter("fKilometer", fKilometer);
            oFunction.setParameter("sMaritalCategory", sMaritalCategory);

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
                // Return value - 1 to include date selected
                return oConstants.NUMBER_OF_DAYS - 1;
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
        },

        getLodgingOverseaAmountAndCat: async function(sSubmissionType){
            let sCountry,sClaimType,sClaimTypeItem;
            const oDataModel = this._oOwnerComponent.getModel();

            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    const oReqHeader = this._oOwnerComponent.getModel("request")?.getProperty("/req_header");
                    const oReqItem = this._oOwnerComponent.getModel("request")?.getProperty("/req_item");

                    sCountry = oReqItem.country;
                    sClaimType = oReqHeader.claimtype;
                    sClaimTypeItem = oReqItem.claim_type_item_id;
                    break;
                case Constants.SubmissionTypePrefix.CLAIM:  
                    const oItem = this._oView.getModel("claimitem_input")?.getProperty("/claim_item");

                    sCountry = oItem.country;
                    sClaimType = this._oView.getModel("claimsubmission_input").getProperty("/claim_header/claim_type_id");
                    sClaimTypeItem = oItem.claim_type_item_id;
                    break;
                
            }

            if (!sCountry) return;

            const oFunction = oDataModel.bindContext("/getLodgingOverseaAmountAndCat(...)");
            oFunction.setParameter("sCountry", sCountry);
            oFunction.setParameter("sClaimType", sClaimType);
            oFunction.setParameter("sClaimTypeItem", sClaimTypeItem);

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
        handleRoundTrip: async function (sSubmissionType, oEvent) {
            let oItemModel, oHeaderModel;
            const bIsSelected = oEvent.getParameter("selected");
            const oODataModel = this._oOwnerComponent.getModel();

            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.REQUEST:
                    oItemModel = this._oOwnerComponent.getModel("request");
                    oHeaderModel = this._oOwnerComponent.getModel("request");
                    var fKM = oItemModel.getProperty("/req_item/kilometer");
                    var sOriginalKMPath = "/req_item/_originalKM";
                    break;

                case Constants.SubmissionTypePrefix.CLAIM:
                    oItemModel = this._oView.getModel("claimitem_input");
                    oHeaderModel = this._oView.getModel("claimsubmission_input");

                    var fKM = oItemModel.getProperty("/claim_item/km");
                    var sOriginalKMPath = "/claim_item/_originalKM";
                    break;
            }
            if (bIsSelected && oItemModel.getProperty(sOriginalKMPath) === undefined) {
                oItemModel.setProperty(sOriginalKMPath, fKM);
            }
            const fOriginalKM = oItemModel.getProperty(sOriginalKMPath);
            if (bIsSelected && fOriginalKM) {
                const fFinalKM = await this.calculateRoundTripKM(oODataModel, fOriginalKM);
                return { km: fFinalKM };
            }
            if (!bIsSelected && fOriginalKM !== undefined) {
                oItemModel.setProperty(sOriginalKMPath, undefined);
                return { km: fOriginalKM };
            }
            return {};
        },

        /**
         * Calculate the KM based on tickbox RoundTrip.
         *
         * Calls backend calculation function using KM field and multiple by 2.
         *
         * @public
         * @returns final amount KM after multiply by 2
         */
        calculateRoundTripKM: async function (oModel, fKM) {
            const oAction = oModel.bindContext("/calculateRoundTripKM(...)");
            oAction.setParameter("fKM", fKM);
            await oAction.execute();
            const oResult = oAction.getBoundContext().getObject();
            return oResult.fFinalAmount;
        },

        mapOwnerDetail: function (oOwnerDetailModel, oHeader, ownerType) {
            oOwnerDetailModel.setProperty("/owner_detail_title", this.getText("owner_detail_title", [ownerType]));
            oOwnerDetailModel.setProperty("/owner_name_label", this.getText("owner_name", [ownerType]));
            oOwnerDetailModel.setProperty("/owner_name", oHeader.NAME);
            oOwnerDetailModel.setProperty("/owner_grade", oHeader.GRADE);
            oOwnerDetailModel.setProperty("/owner_department", oHeader.DEP + " - " + oHeader.DEPARTMENT_DESC);
            oOwnerDetailModel.setProperty("/owner_position", oHeader.POSITION_NAME);
        },

        getCentraLink: async function () {
            const oDataModel = this._oOwnerComponent.getModel();
            const oFunction = oDataModel.bindContext("/getCentraLink(...)");

            try {                
                await oFunction.execute();
                const oContext = oFunction.getBoundContext();
                const oResult  = oContext.getObject();
                return oResult.sCentraLink;
                
            } catch (oError) {
                MessageBox.error(this.getText("error_centra_link_not_found", []));
                return null; 
            }
        },

        getInternalOrderByProjectCode: async function (oModel, sProjectCode) {
            if (!sProjectCode) {
                return null;
            }

            const oFunction = oModel.bindContext("/getInternalOrderByProjectCode(...)");
            oFunction.setParameter("sProjectCode", sProjectCode);

            try {
                await oFunction.execute();

                const oContext = oFunction.getBoundContext();
                const oResult = oContext.getObject();

                return oResult?.value || oResult || null;

            } catch (oError) {
                return null;
            }
        },

        setFieldEditableState: function (sField, sAltCC, sProjectCode, bEmailApprove, sSubmissionType) {
            switch (sField) {
                case Constants.EntitiesFields.ALT_CC:
                    if(sProjectCode || (!bEmailApprove && sSubmissionType == Constants.SubmissionType.PRE_APPROVE)){
                        return 'ReadOnly';
                    }
                    else{
                        return 'Editable';
                    }
                case Constants.EntitiesFields.PROJECT_CODE:
                    if(sAltCC || (!bEmailApprove && sSubmissionType == Constants.SubmissionType.PRE_APPROVE)){
                        return false;
                    }else{
                        return true;
                    }
                default:
                    
                    break;
            }
        },

        getGLAccountByProjectCode: async function (oModel, sProjectCode) {
            if (!sProjectCode) {
                return null;
            }

            const oFunction = oModel.bindContext("/getGLAccountByProjectCode(...)");
            oFunction.setParameter("sProjectCode", sProjectCode);

            try {
                await oFunction.execute();

                const oContext = oFunction.getBoundContext();
                const oResult = oContext.getObject();

                return oResult?.value || oResult || null;

            } catch (oError) {
                return null;
            }
        },

        /**
         * Retrieve remaining medical entitlement.
         * Shared utility for Claim Submission and Pre-Approval Request.
         *
         * @public
         * @param {sap.ui.model.json.JSONModel} oModel
         * @param {string} sEmpId
         * @param {string} sPropertyPath
         */
        getRemainingMedicalEntitlement: async function (oModel, sEmpId, sPropertyPath) {

            const oFunction = this._oOwnerComponent.getModel().bindContext("/getRemainingMedicalEntitlement(...)");

            oFunction.setParameter("empId", sEmpId);

            try {

                await oFunction.execute();

                const oResult = oFunction.getBoundContext().getObject();

                oModel.setProperty(sPropertyPath,oResult.remaining || 0);
                
            } catch (oError) {

                oModel.setProperty(sPropertyPath,0);
            }
        },

        getMonthlyAdvanceAmount: async function (sCardNo, sCardholderId) {
            const oDataModel = this._oOwnerComponent.getModel();
            var dResult = 0.00;
            if (!sCardNo || !sCardholderId) return dResult;
        
            try {
                BusyIndicator.show(0);
        
                const oFunction = oDataModel.bindContext("/getMonthlyAdvanceAmount(...)");
        
                oFunction.setParameter("sCardNo", sCardNo);
                oFunction.setParameter("sCardholderId", sCardholderId);
        
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

        async getDefaultChargingCostCenter(oModel, sClaimType, sClaimTypeItem) {

            const oListBinding = oModel.bindList("/ZCLAIM_TYPE_ITEM", null, null, [
                new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, sClaimType),
                new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, sClaimTypeItem)
            ]);

            try {
                const aContexts = await oListBinding.requestContexts(0, 1);

                if (aContexts.length > 0) {
                    const oData = aContexts[0].getObject();
                    return oData.COST_CENTER || "";
                }

                return "";

            } catch (oError) {
                console.error("Error fetching charging cost center", oError);
                return "";
            }
        },

        /**
         * Resolves and populates display descriptions for a set of employee master
         * fields (cost center, department, branch/unit section, marital status,
         * job group, office location, state, country, role, user type, employee
         * type) on the given model, driven by a config array (`aDescriptorConfig`).
         *
         * For each entry whose source path has a value, looks up the corresponding
         * ID's description via `bindEclaimDescr` and writes it to the matching
         * `/emp_master/descr/*` path. Runs sequentially (`for...of` with `await`),
         * not in parallel — each lookup completes before the next starts. Entries
         * needing a second filter (e.g. office location filtered by state) support
         * it via optional `srcPath2`/`fieldId2` config fields.
         *
         * @param {sap.ui.model.Model} oModel - the model holding `/emp_master/*`
         * @returns {Promise<void>} resolves once every applicable description has been set
         */
        applyEmpDataDescr: async function (oModel) {
            const aDescriptorConfig = [
                { srcPath: "/emp_master/cc", destPath: "/emp_master/descr/cc", entity: Constants.Entities.ZCOST_CENTER, fieldId: Constants.EntitiesFields.COST_CENTER_ID, fieldDesc: Constants.EntitiesFields.COST_CENTER_DESC },
                { srcPath: "/emp_master/dep", destPath: "/emp_master/descr/dep", entity: Constants.Entities.ZDEPARTMENT, fieldId: Constants.EntitiesFields.DEPARTMENT_ID, fieldDesc: Constants.EntitiesFields.DEPARTMENT_DESC },
                { srcPath: "/emp_master/unit_section", destPath: "/emp_master/descr/unit_section", entity: Constants.Entities.ZBRANCH, fieldId: Constants.EntitiesFields.BRANCH_ID, fieldDesc: Constants.EntitiesFields.BRANCH_DESC },
                { srcPath: "/emp_master/marital", destPath: "/emp_master/descr/marital", entity: Constants.Entities.ZMARITAL_STAT, fieldId: Constants.EntitiesFields.MARRIAGE_STATUS_ID, fieldDesc: Constants.EntitiesFields.MARRIAGE_STATUS_DESC },
                { srcPath: "/emp_master/job_group", destPath: "/emp_master/descr/job_group", entity: Constants.Entities.ZJOB_GROUP, fieldId: Constants.EntitiesFields.JOB_GROUP_ID, fieldDesc: Constants.EntitiesFields.JOB_GROUP_DESC },
                { srcPath: "/emp_master/office_location", destPath: "/emp_master/descr/office_location", entity: Constants.Entities.ZOFFICE_LOCATION, fieldId: Constants.EntitiesFields.LOCATION_ID, fieldDesc: Constants.EntitiesFields.LOCATION_DESC, srcPath2: "/emp_master/state", fieldId2: Constants.EntitiesFields.STATE_ID },
                { srcPath: "/emp_master/state", destPath: "/emp_master/descr/state", entity: Constants.Entities.ZSTATE, fieldId: Constants.EntitiesFields.STATE_ID, fieldDesc: Constants.EntitiesFields.STATE_DESC, srcPath2: "/emp_master/country", fieldId2: Constants.EntitiesFields.COUNTRY_ID },
                { srcPath: "/emp_master/country", destPath: "/emp_master/descr/country", entity: Constants.Entities.ZCOUNTRY, fieldId: Constants.EntitiesFields.COUNTRY_ID, fieldDesc: Constants.EntitiesFields.COUNTRY_DESC },
                { srcPath: "/emp_master/role", destPath: "/emp_master/descr/role", entity: Constants.Entities.ZROLE, fieldId: Constants.EntitiesFields.ROLE_ID, fieldDesc: Constants.EntitiesFields.ROLE_DESC },
                { srcPath: "/emp_master/user_type", destPath: "/emp_master/descr/user_type", entity: Constants.Entities.ZUSER_TYPE, fieldId: Constants.EntitiesFields.USER_TYPE_ID, fieldDesc: Constants.EntitiesFields.USER_TYPE_DESC },
                { srcPath: "/emp_master/employee_type", destPath: "/emp_master/descr/employee_type", entity: Constants.Entities.ZEMP_TYPE, fieldId: Constants.EntitiesFields.EMP_TYPE_ID, fieldDesc: Constants.EntitiesFields.EMP_TYPE_DESC }
            ];

            for (const oDescriptor of aDescriptorConfig) {
                if (!oModel.getProperty(oDescriptor.srcPath)) {
                    continue;
                }

                const sValue = await this.bindEclaimDescr(
                    oDescriptor.entity,
                    oModel.getProperty(oDescriptor.srcPath),
                    oDescriptor.fieldId,
                    oDescriptor.fieldDesc,
                    oDescriptor.srcPath2 ? oModel.getProperty(oDescriptor.srcPath2) : undefined,
                    oDescriptor.fieldId2
                );

                oModel.setProperty(oDescriptor.destPath, sValue);
            }
        },

        /**
         * Resolves and populates display descriptions for claim header fields
         * (submission type, linked request ID) on the given model, using the same
         * config-array + sequential `for...of` pattern as `_applyEmpDataDescr`.
         *
         * For each entry whose source path has a value, looks up the description
         * via `bindEclaimDescr` and writes it to the matching `/claim_header/descr/*`
         * path. New lookups can be added by appending to `aDescriptorConfig` without
         * changing the loop itself.
         *
         * @param {sap.ui.model.Model} oModel - the model holding `/claim_header/*`
         * @returns {Promise<void>} resolves once every applicable description has been set
         */
        applyClaimHeaderDataDescr: async function (oModel) {
            const aDescriptorConfig = [
                { srcPath: "/claim_header/submission_type", destPath: "/claim_header/descr/submission_type", entity: Constants.Entities.ZSUBMISSION_TYPE, fieldId: Constants.EntitiesFields.SUBMISSION_TYPE_ID, fieldDesc: Constants.EntitiesFields.SUBMISSION_TYPE_DESC },
                { srcPath: "/claim_header/request_id", destPath: "/claim_header/descr/request_id", entity: Constants.Entities.ZREQUEST_HEADER, fieldId: Constants.EntitiesFields.REQUESTID, fieldDesc: Constants.EntitiesFields.OBJECTIVE_PURPOSE }
                // add future claim_header description lookups here
            ];

            for (const o of aDescriptorConfig) {
                if (!oModel.getProperty(o.srcPath)) {
                    continue;
                }

                const sValue = await this.bindEclaimDescr(
                    o.entity,
                    oModel.getProperty(o.srcPath),
                    o.fieldId,
                    o.fieldDesc,
                    o.srcPath2 ? oModel.getProperty(o.srcPath2) : undefined,
                    o.fieldId2
                );

                oModel.setProperty(o.destPath, sValue);
            }
        },

        /**
         * Looks up a single record's description field by ID (and optionally a
         * second ID/value pair for a composite filter, e.g. state filtered by
         * country) against a given OData entity set, using a one-row list-binding
         * read.
         *
         * Builds an EQ filter on `oFieldId`/`oInputValue`, AND-ed with a second EQ
         * filter on `oFieldId2`/`oInputValue2` when `oFieldId2` is provided, then
         * reads the first matching row's `oFieldDescr` value. Returns `null` (never
         * throws) if no row matches or the request fails — errors are logged via
         * `console.error` so a lookup failure degrades to a blank description
         * instead of crashing the caller.
         *
         * @param {string} oTable - absolute entity set path, e.g. `Constant.Entities.ZCOST_CENTER`
         * @param {string} oInputValue - the ID value to filter on
         * @param {string} oFieldId - the entity's ID field name
         * @param {string} oFieldDescr - the entity's description field name to return
         * @param {string} [oInputValue2] - optional second filter value
         * @param {string} [oFieldId2] - optional second filter field name; when omitted, only the first filter is applied
         * @returns {Promise<string|null>} the description string, or `null` if not found or on error
         */
        bindEclaimDescr: async function (oTable, oInputValue, oFieldId, oFieldDescr, oInputValue2, oFieldId2) {
            var aFilterArray = [new Filter(oFieldId, FilterOperator.EQ, oInputValue)];
            if (oFieldId2) {
                aFilterArray = aFilterArray.concat(new Filter(oFieldId2, FilterOperator.EQ, oInputValue2));
            }
            const oListBinding = this._oOwnerComponent.getModel().bindList(oTable, null, null, aFilterArray);

            try {
                const aContexts = await oListBinding.requestContexts(0, 1);

                if (aContexts.length > 0) {
                    const oData = aContexts[0].getObject();
                    return oData[oFieldDescr];
                } else {
                    return null;
                }
            } catch (oError) {
                return null; // Return null so the app doesn't crash
            }
        },

        /**
         * Looks up a ZEMP_MASTER record by a given field (EEID or EMAIL) and maps
         * it to the flat employee-detail shape used across App, ClaimSubmission,
         * and MyApproval controllers.
         *
         * @param {sap.ui.model.Model} oModel
         * @param {string} sFieldName - Constant.EntitiesFields.EEID or Constant.EntitiesFields.EMAIL
         * @param {string} sValue
         * @param {boolean} [bCaseSensitive=true] - pass false for email lookups
         * @returns {Promise<object|null>}
         */
        getEmpIdDetail: async function (oModel, sFieldName, sValue, bCaseSensitive) {
            const oListBinding = oModel.bindList(Constants.Entities.ZEMP_MASTER, null, null, [
                new Filter({
                    path: sFieldName,
                    operator: FilterOperator.EQ,
                    value1: sValue,
                    caseSensitive: bCaseSensitive !== false
                })
            ]);

            try {
                const aContexts = await oListBinding.requestContexts(0, 1);

                if (aContexts.length > 0) {
                    const oData = aContexts[0].getObject();
                    return {
                        eeid: oData.EEID,
                        name: oData.NAME,
                        grade: oData.GRADE,
                        cc: oData.CC,
                        pos: oData.POS,
                        dep: oData.DEP,
                        unit_section: oData.UNIT_SECTION,
                        b_place: oData.B_PLACE,
                        marital: oData.MARITAL,
                        job_group: oData.JOB_GROUP,
                        office_location: oData.OFFICE_LOCATION,
                        address_line1: oData.ADDRESS_LINE1,
                        address_line2: oData.ADDRESS_LINE2,
                        address_line3: oData.ADDRESS_LINE3,
                        postcode: oData.POSTCODE,
                        state: oData.STATE,
                        country: oData.COUNTRY,
                        contact_no: oData.CONTACT_NO,
                        email: oData.EMAIL,
                        direct_supperior: oData.DIRECT_SUPPERIOR,
                        role: oData.ROLE,
                        user_type: oData.USER_TYPE,
                        mobile_bill_eligibility: oData.MOBILE_BILL_ELIGIBILITY,
                        mobile_bill_elig_amount: oData.MOBILE_BILL_ELIG_AMOUNT,
                        employee_type: oData.EMPLOYEE_TYPE,
                        position_name: oData.POSITION_NAME,
                        position_start_date: oData.POSITION_START_DATE,
                        position_event_reason: oData.POSITION_EVENT_REASON,
                        confirmation_date: oData.CONFIRMATION_DATE,
                        effective_date: oData.EFFECTIVE_DATE,
                        updated_date: oData.UPDATED_DATE,
                        inserted_date: oData.INSERTED_DATE,
                        medical_insurance_entitlement: oData.MEDICAL_INSURANCE_ENTITLEMENT,
                        descr: {
                            cc: null,
                            dep: null,
                            unit_section: null,
                            marital: null,
                            job_group: null,
                            state: null,
                            country: null,
                            direct_supperior: null,
                            role: null,
                            user_type: null,
                            employee_type: null
                        }
                    };
                }

                console.warn(`No employee found with ${sFieldName}: ${sValue}`);
                return null;
            } catch (oError) {
                console.error("Error fetching employee detail", oError);
                return null;
            }
        }

    };
});