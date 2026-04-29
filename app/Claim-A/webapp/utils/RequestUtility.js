sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "claima/utils/Utility",
	"claima/utils/DateUtility",
    "claima/utils/Constants"
], function (
    MessageBox,
	Fragment,
	Filter,
	FilterOperator,
	Utility,
	DateUtility,
    Constants ) {
    "use strict";

    return {
        
		/**
         * Initialize the RequestUtility
         * @public
         */
        init: function(oOwnerComponent, oView, oDialogFragment) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
            this._oDialogFragment = oDialogFragment;
		},

        /**
         * trigger when selecting claim type
         * @public
         * @param {object} oEvent 
         * @param {boolean} bEligibleForElaunTukar 
         */
        onSelectClaimType: async function (oEvent, bEligibleForElaunTukar) {
			var oSelectControl = oEvent.getSource();
    		var sClaimTypeId = oSelectControl.getSelectedKey();

            if (sClaimTypeId === Constants.ClaimType.ELAUN_TUKAR) {
                var sMarriageCategory = await Utility.getMarriageCategoryBasedOnStatus();
                if (sMarriageCategory === Constants.MarriageCategory.SINGLE) {
                    Fragment.byId("request", "req_transferalonefamily").setEnabled(false);
                    Fragment.byId("request", "req_transferalonefamily").setSelectedKey(Constants.TravelAloneOrWithFamily.ALONE);
                }

                switch (bEligibleForElaunTukar) {
                    case Constants.ElaunTukarStatus.ALLOWED_FAMILY_NOW_ONLY:
                        Fragment.byId("request", "req_transferalonefamily").setEnabled(false);
                        Fragment.byId("request", "req_transferalonefamily").setSelectedKey(Constants.TravelAloneOrWithFamily.WITH_FAMILY);
                        Fragment.byId("request", "req_transferfamilynowlater").setEnabled(false);
                        Fragment.byId("request", "req_transferfamilynowlater").setSelectedKey(Constants.TravelWithFamilyNowOrLater.NOW);
                        break;
                    
                    case Constants.ElaunTukarStatus.ON_GOING:
                        MessageBox.warning(Utility.getText("req_d_w_on_going_elaun_tukar", []));
                        break;
                }
            };

            this.determineDefaultCostCenter(oEvent);
        },

		/**
         * Determine the default cost center for specific claim type
         * @public
         */
        determineDefaultCostCenter: async function (oEvent) {
			var oSelectControl = oEvent.getSource();
    		var sClaimTypeId = oSelectControl.getSelectedKey();
			const oDialogModel = this._oDialogFragment.getModel("reqDialog");
            const oDataModel    = this._oDataModel ? this._oDataModel : this._oOwnerComponent.getModel();

            const oFunction = oDataModel.bindContext("/checkDefaultCostCenter(...)");
            oFunction.setParameter("sClaimTypeId", sClaimTypeId);
          
            try {
				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

                var sCostCenter = oResult.sCostCenter;
                var sCostCenterDesc = oResult.sCostCenterDesc;

                if (sCostCenter) {
                    Fragment.byId("request", "req_acc").setEditMode("ReadOnly");
                    oDialogModel.setProperty("/altcostcenter", sCostCenter);
                    oDialogModel.setProperty("/altcostcenter_desc", sCostCenterDesc);
                } else {
                    Fragment.byId("request", "req_acc").setEditMode("Editable");
                    oDialogModel.setProperty("/altcostcenter", null);
                    oDialogModel.setProperty("/altcostcenter_desc", null);
                }

			} catch (oError) {
				return null;
			}
		},

        /**
         * Get PAR header info for claim submission
         * @public
         * @param {string} sReqID Request ID to fetch from database
         * @returns Data for claim submission population, if not found returns null
         */
        getPARHeaderInfo: async function (sReqID) {
            const oListBinding = this._oOwnerComponent.getModel().bindList("/ZREQUEST_HEADER", null, null, [
				new Filter("REQUEST_ID", FilterOperator.EQ, sReqID)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return {
                        tripStart: oData.TRIP_START_DATE,
                        tripEnd: oData.TRIP_END_DATE,
						eventStart: oData.EVENT_START_DATE,
                        eventEnd: oData.EVENT_END_DATE,
                        altcc: oData.ALTERNATE_COST_CENTER
                    }
                }
            } catch (oError) {
				return null; 
			}
        },

		/**
         * Populate the allocated amount when needed 
         * @public
         */
        populateAllocatedAmount: async function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oReqHeader = oReqModel.getProperty("/req_header");
            const oReqItem  = oReqModel.getProperty("/req_item");
            const aReqPart  = oReqModel.getProperty("/participant");
            let fCalculatedAllocatedAmount;

            if (oReqModel.getProperty("/view") === Constants.PARMode.CREATE ||
                oReqModel.getProperty("/view") === Constants.PARMode.EDIT ) {
                switch (oReqItem.claim_type_item_id) {
                    case Constants.ClaimTypeItem.LODGING_L:
                        fCalculatedAllocatedAmount = await this._retrieveLodgingAmount();
                        break;
                    
                    case Constants.ClaimTypeItem.LODG_O:
                        fCalculatedAllocatedAmount = await this._retrieveOverseaLodgingAmount();
                        break;

                    case Constants.ClaimTypeItem.LOD_TUKAR:
                        var iNumberOfTraveler = oReqItem.no_of_traveler ? oReqItem.no_of_traveler : 1;
                        fCalculatedAllocatedAmount = await this._retrieveLodgingAmount();
                        if (oReqItem.claim_type_item_id === Constants.ClaimTypeItem.LOD_TUKAR) {
                            fCalculatedAllocatedAmount = fCalculatedAllocatedAmount * parseFloat(iNumberOfTraveler);
                        }
                        break;

                    case Constants.ClaimTypeItem.MAKAN_L:
                    case Constants.ClaimTypeItem.MAKAN_O:
                    case Constants.ClaimTypeItem.MKN_TUKAR:
                        this._calculateTravelDuration();
                        fCalculatedAllocatedAmount = await this._retrieveEntitlementAmount();
                        if (!!oReqItem.currency_rate) {
                            fCalculatedAllocatedAmount = fCalculatedAllocatedAmount * parseFloat(oReqItem.currency_rate);
                        }
                        break;
                    
                    case Constants.ClaimTypeItem.LAUT:
                        this._getEntitledMeterCube();
                        break;

                    case Constants.ClaimTypeItem.DARAT:
                        const oResult = await Utility.determineDaratAmount(Constants.SubmissionTypePrefix.REQUEST);
                        if (oResult) {
                            oReqModel.setProperty("/req_item/rate_per_kilometer", oResult.fRate);
                            if (!oReqItem.kilometer) break;
                            fCalculatedAllocatedAmount = oResult.fAmount;
                            // check if using minimum eligible amount, show notification
                            if (oResult.bMinimum) {
                                MessageBox.alert(Utility.getText("d_i_minimum_amount", [oResult.fAmount]))
                            }
                        }
                        break;
                    
                    case Constants.ClaimTypeItem.PINDAH:
                        fCalculatedAllocatedAmount = await this._getPemberianPindahAmount();
                        break;
                    
                    case Constants.ClaimTypeItem.KILOMETER:
                        // calculate kilometer amount 
                        fCalculatedAllocatedAmount = this._calculateKilometer(oReqItem);
                        break;

                }
            }


            // populate allocated amount
            if (fCalculatedAllocatedAmount >= 0) {
                aReqPart.forEach((row, index) => {
                    if (row.PARTICIPANTS_ID) {
                        oReqModel.setProperty(`/participant/${index}/ALLOCATED_AMOUNT`,
                            parseFloat(fCalculatedAllocatedAmount).toFixed(2)
                        );
                    }
                });
            }

            // populate estimated amount
            var fEstAmount = this._calculateEstimatedAmount(oReqItem, aReqPart);
            oReqModel.setProperty("/req_item/est_amount", fEstAmount.toFixed(2));
        },

        /** 
         * Bind to an existing request header by request ID.
         * Returns the bound context if found; otherwise returns null.
		 * @param {object} oODataModel model used for request data binding
		 * @param {string} sReqId Request ID to retrieve from the backend
		 * @returns {object} Bound context of the request header, or null if not found
		 */
		getReqHeader: async function (oODataModel, sReqId) {
			try {
				const oContextBinding = oODataModel.bindContext(
					`/ZREQUEST_HEADER('${encodeURIComponent(sReqId)}')`
				);

				await oContextBinding.requestObject(); 
				const oContext = oContextBinding.getBoundContext();
				return oContext;
			} catch (oError) {
				return null;
			}
		},

        /**
		 * Get condition for Event dates editability
         * @public
		 * @param {string} sRequestTypeID Request Type ID to be checked
         * @returns {boolean} Determine Event Date is Required
		 */
		getEventDateRequired: function (sRequestTypeID) {
			if (sRequestTypeID == Constants.RequestType.TRAVEL || sRequestTypeID == Constants.RequestType.EVENTS) {
				return true;
			}
            return false;
		},

		/**
         * Calculate the total for km and rate per km 
         * @private
         */
        _calculateKilometer: function (oReqItem) {
            var fKilometer  = parseFloat(oReqItem.kilometer).toFixed(2) || 0;
            var fRatePerKm  = parseFloat(oReqItem.rate_per_kilometer).toFixed(2) || 0;
            var fTollAmt    = parseFloat(oReqItem.toll_amt).toFixed(2) || 0;

            if (!fKilometer || !fRatePerKm) return;

            var fTotalAmount = parseFloat(fKilometer) * parseFloat(fRatePerKm);

            if (!isNaN(fTollAmt)) {
                return parseFloat(fTotalAmount) + parseFloat(fTollAmt);
            }
            return fTotalAmount;
        },

		/**
         * Retrieve the eligible lodging amount from backend 
         * @private
         */
        _retrieveLodgingAmount: async function () {
            const oReqModel     = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oDataModel    = this._oDataModel ? this._oDataModel : this._oOwnerComponent.getModel();
            const oReqHeader    = oReqModel.getProperty('/req_header');
            const oReqItem      = oReqModel.getProperty('/req_item');

            var sClaimType      = oReqHeader.claimtype;
            var sClaimTypeItem  = oReqItem.claim_type_item_id;
            var sEmpId          = this._oOwnerComponent.getModel('session')?.getProperty("/userId");
            var iNoOfDays       = oReqItem.no_of_days;

            if (!sClaimType || !sClaimTypeItem || !sEmpId || !iNoOfDays) return 0;

            const oFunction = oDataModel.bindContext("/getLodgingAmount(...)");
            oFunction.setParameter("sClaimTypeId", sClaimType);
            oFunction.setParameter("sClaimTypeItemId", sClaimTypeItem);
            oFunction.setParameter("sEmpId", sEmpId);

            try {
                await oFunction.execute();
				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

                return oResult.value * iNoOfDays;

            } catch (error) {
                return parseFloat(0).toFixed(2);
            }

        },

        /**
         * Retrieve the eligible lodging oversea amount from backend 
         * @private
         */
        _retrieveOverseaLodgingAmount: async function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oReqItem  = oReqModel.getProperty('/req_item');
            var iNoOfDays   = oReqItem.no_of_days;

            var oResult     = await Utility.getLodgingOverseaAmountAndCat(Constants.SubmissionTypePrefix.REQUEST);
            oReqModel.setProperty("/req_item/lodging_cat", oResult.sCategory);

            return oResult.iEligibleAmount * iNoOfDays

        },

		/**
         * Retrieve MAKAN_O & MAKAN_L entitled amount from backend 
         * @private
         */
        _retrieveEntitlementAmount: async function () {
            const oReqModel     = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oDataModel    = this._oDataModel ? this._oDataModel : this._oOwnerComponent.getModel();
            const oReqHeader    = oReqModel.getProperty('/req_header');
            const oReqItem      = oReqModel.getProperty("/req_item");

            var sEmpId          = this._oOwnerComponent.getModel('session')?.getProperty("/userId");
            var sClaimType      = oReqHeader.claimtype;
            var sClaimTypeItem  = oReqItem.claim_type_item_id;
            var sRegion         = oReqItem.sss;
            var nTravelDay      = oReqItem.travel_day || 0;
            var nTravelHour     = oReqItem.total_travel_hour || 0;
            var nBreakfast      = 0;        // always be 0 as this one is only applicable for claim
            var nLunch          = 0;        // always be 0 as this one is only applicable for claim
            var nDinner         = 0;        // always be 0 as this one is only applicable for claim
            var nDependent      = oReqItem.no_of_traveler ? oReqItem.no_of_traveler : 1;

            if (sClaimTypeItem === Constants.ClaimTypeItem.MKN_TUKAR) {
                var nTravelDay      = oReqItem.no_of_days || 0;
                var nTravelHour     = oReqItem.no_of_days * 24 || 1;
            }

            if (!nTravelHour || !sRegion) return;

            const oFunction = oDataModel.bindContext("/getAmountEntitlement(...)");
            
            oFunction.setParameter("day", nTravelDay || 0);
            oFunction.setParameter("hours", nTravelHour || 0);
            oFunction.setParameter("claimtypeid", sClaimType);
            oFunction.setParameter("claimtypeitem", sClaimTypeItem);
            oFunction.setParameter("location", sRegion);
			oFunction.setParameter("breakfast", nBreakfast);
			oFunction.setParameter("lunch", nLunch);
			oFunction.setParameter("dinner", nDinner);
            oFunction.setParameter("employeeid", sEmpId);
            oFunction.setParameter("exclude_tips", true);
            oFunction.setParameter("dependent", nDependent);

            try {
                await oFunction.execute();
                const oContext  = oFunction.getBoundContext();
                
                const oResult   = oContext.getObject();
                
                const oData     = oResult.value || oResult;

                const fAmount           = oData.amount;
                const sCurrency         = oData.currency_code;
                const fDailyAllowance   = oData.daily_allowance;

                oReqModel.setProperty("/req_item/daily_allowance", fDailyAllowance);
                oReqModel.setProperty("/req_item/currency_code", sCurrency);

                return fAmount;
                

            } catch (oError) {
                MessageBox.error("Could not fetch Elaun Makan entitlement", oError);
            }
        },

		/**
         * Calculate the estimated amount based on the allocated amount of each participant 
         * @private
         * @param {Array} aParticipantList 
         * @param {Object} oReqItem 
         * @returns {Float} fTotalSum
         */
		_calculateEstimatedAmount(oReqItem, aParticipantList) {

			const fTotalSum = aParticipantList.reduce((sum, row) => {
				return sum + parseFloat(row.ALLOCATED_AMOUNT || 0);
			}, 0);

			return fTotalSum;
		},

		/**
         * Calculate the Travel Duration 
         * @private
         */
        _calculateTravelDuration: function () {
            const oReqModel     = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oReqItem      = oReqModel.getProperty('/req_item');

            var dTripStartDate  = oReqItem.trip_start_date;
            var dTripEndDate    = oReqItem.trip_end_date;
            var tTripStartTime  = oReqItem.trip_start_time;
            var tTripEndTime    = oReqItem.trip_end_time;

            if (!dTripStartDate || !dTripEndDate || !tTripStartTime || !tTripEndTime) {
                var dTripStartDate  = oReqItem.start_date;
                var dTripEndDate    = oReqItem.end_date;
                var tTripStartTime  = "00:00:00"
                var tTripEndTime    = "24:00:00"
                if (!dTripStartDate || !dTripEndDate || !tTripStartTime || !tTripEndTime) return;
            }

            const oStartDateTime = DateUtility.parseDateTime(dTripStartDate, tTripStartTime);
            const oEndDateTime = DateUtility.parseDateTime(dTripEndDate, tTripEndTime);

            const iDiffMs = oEndDateTime.getTime() - oStartDateTime.getTime();

            if (iDiffMs < 0) {
                MessageBox.error(Utility.getText("req_d_e_end_date_less_then_start_date"));
                oReqModel.setProperty('/req_item/travel_day', 0);
                oReqModel.setProperty('/req_item/travel_hour', 0);
                return;
            }

            const iTotalHours = iDiffMs / (1000 * 60 * 60);
            
            const iDays = Math.floor(iTotalHours / 24);
            const iHours = Math.floor(iTotalHours);
            const iRemainingHours = Math.floor(iTotalHours % 24);

            oReqModel.setProperty('/req_item/travel_day', iDays);
            oReqModel.setProperty('/req_item/travel_hour', iRemainingHours);
            oReqModel.setProperty('/req_item/total_travel_hour', iHours);
            oReqModel.setProperty('/req_item/entitled_breakfast', iDays);
            oReqModel.setProperty('/req_item/entitled_lunch', iDays);
            oReqModel.setProperty('/req_item/entitled_dinner', iDays);
            
        },

        /**
		 * Retrieve and apply meter cube entitlement from backend service.
		 *
		 * Calls backend entitlement function using the logged-in employee ID
		 * and updates the entitled meter cube value in the claim item input model.
		 *
         * @private
		 * @returns Updates entitled meter cube field upon completion
		 */
		_getEntitledMeterCube: async function () {
            const oReqModel     = this._oOwnerComponent.getModel("request");
            const oDataModel    = this._oOwnerComponent.getModel();

			const oFunction = oDataModel.bindContext("/getMeterCubeEntitlement(...)");

            try {
                await oFunction.execute();
                const oContext  = oFunction.getBoundContext();
                
                const oResult   = oContext.getObject();
                const oData     = oResult.value || oResult;

                oReqModel.setProperty("/req_item/cube_eligible", Number(oData).toFixed(2));
                

            } catch (oError) {
                oReqModel.setProperty("/req_item/cube_eligible", 0);
            }
		},

        
        /**
		 * Retrieve and apply Pemberian Pindah claim amount from backend service.
		 *
		 * Calls backend calculation function using employee ID,region, marital status
		 * and actual amount, then updates approved amount
		 * in the claim item input model.
		 *
		 * @private
		 * @returns Updates request item fields upon completion
		 */
		_getPemberianPindahAmount: async function () {
			var oReqModel = this._oOwnerComponent.getModel("request");
			const oFunction = this._oOwnerComponent.getModel().bindContext("/getUserEligibleAmountPemPindah(...)");
			oFunction.setParameter("sRegion", oReqModel.getProperty("/req_item/sss"));
			oFunction.setParameter("sClaimType", oReqModel.getProperty("/req_header/claimtype"));
			oFunction.setParameter("sClaimTypeItem", oReqModel.getProperty("/req_item/claim_type_item_id"));
            oFunction.setParameter("sTravelAloneFamily", oReqModel.getProperty("/req_header/transferalonefamily"));
            oFunction.setParameter("sTravelFamilyNowLater", oReqModel.getProperty("/req_header/transferfamilynowlater"));

            try {
                await oFunction.execute();
                const oContext  = oFunction.getBoundContext();
                const oResult   = oContext.getObject();

                return oResult.fAmount;

            } catch (error) {
                return 0;
            }
        },

        /**
         * To get the dependent list of the requestor
         * @returns Filter properties to the dependent field
         */
	    getDependentFilter: function (){
			var oReqModel = this._oOwnerComponent.getModel("request");
            var oReqHeader = oReqModel.getProperty('/req_header');
            var sEmpId = oReqHeader.empid;

            var oEmpFilter = new Filter(
                Constants.EntitiesFields.EMP_ID,
                FilterOperator.EQ,
                sEmpId
            );

            switch(oReqHeader.claimtype){
                case Constants.ClaimType.WILAYAH_ASAL:
                   
                    var d18YearsFromCurrentDate = DateUtility.today().getFullYear() - Number(Constants.Age.EIGHTEEN);
                    var d19YearsFromCurrentDate = DateUtility.today().getFullYear() - Number(Constants.Age.NINETEEN);
                    var d25YearsFromCurrentDate = DateUtility.today().getFullYear() - Number(Constants.Age.TWENTY_FIVE);

                    d18YearsFromCurrentDate = new Date(d18YearsFromCurrentDate, 0, 1).toLocaleDateString("en-CA");
                    d19YearsFromCurrentDate = new Date(d19YearsFromCurrentDate, 0, 1).toLocaleDateString("en-CA");
                    d25YearsFromCurrentDate = new Date(d25YearsFromCurrentDate, 0, 1).toLocaleDateString("en-CA");

                    var oSpouseFilter = new Filter(Constants.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, Constants.Relationship.SPOUSE);

                    var oChildBelow18 = new Filter({
                        filters: [
                            new Filter(Constants.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, Constants.Relationship.CHILD),
                            new Filter(Constants.EntitiesFields.DOB, FilterOperator.GT, d18YearsFromCurrentDate)
                        ],
                        and: true
                    })

                    var oChildStudying = new Filter({
                        filters: [
                            new Filter(Constants.EntitiesFields.RELATIONSHIP, FilterOperator.EQ, Constants.Relationship.CHILD),
                            new Filter(Constants.EntitiesFields.DOB, FilterOperator.BT, d25YearsFromCurrentDate, d19YearsFromCurrentDate),
                            new Filter(Constants.EntitiesFields.STUDENT, FilterOperator.EQ, true),
                        ],
                        and: true
                    })

                    var oDependentRuleFilter = new Filter({
                        filters: [
                            oSpouseFilter,
                            oChildBelow18,
                            oChildStudying
                        ],
                        and: false
                    })

                    return new Filter({
                        filters: [
                            oEmpFilter,
                            oDependentRuleFilter
                        ],
                        and: true
                    })
                default:
                    return new Filter({
						filters: [
							oEmpFilter
						]
					})
            }

		}
        
    };
});