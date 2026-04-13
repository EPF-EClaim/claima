sap.ui.define([
    "claima/utils/Constants",
    "sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"claima/utils/Utility",
	"claima/utils/DateUtility",
	"sap/m/MessageBox",
], function (
    Constants,
	Fragment,
	Filter,
	FilterOperator,
	Utility,
	DateUtility,
	MessageBox) {
    "use strict";

    return {
        
		/**
         * Initialize the RequestUtility
         * @public
         */
        init: function(oOwnerComponent, oView) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
		},

		/**
         * Determine the default cost center for specific claim type
         * @public
         */
        determineDefaultCostCenter: async function (oEvent) {
			var oSelectControl = oEvent.getSource();
    		var sClaimTypeId = oSelectControl.getSelectedKey();
			const oDialogModel = this.oDialogFragment.getModel("reqDialog");

            const oFunction = this._oDataModel.bindContext("/checkDefaultCostCenter(...)");
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
         * Determine the office mileage 
         * @public
         */
        determineOfficeMileage: async function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oDataModel = this._oDataModel ? this._oDataModel : this._oOwnerComponent.getModel();
            const oReqItem  =oReqModel.getProperty("/req_item");

            var sFromState  = oReqItem.from_state;
            var sFromOffice = oReqItem.from_location_office;
            var sToState    = oReqItem.to_state
            var sToOffice   = oReqItem.to_location_office;

            if (!sFromState || !sFromOffice || !sToState || !sToOffice) return;

            const oFunction = oDataModel.bindContext("/getOfficeDistance(...)");
            oFunction.setParameter("sFromState", sFromState);
            oFunction.setParameter("sFromOffice", sFromOffice);
            oFunction.setParameter("sToState", sToState);
            oFunction.setParameter("sToOffice", sToOffice);

            try {
                await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

                var fMileage = parseFloat(oResult.value);

                oReqModel.setProperty("/req_item/kilometer", fMileage);

                this.populateAllocatedAmount();

            } catch (error) {
                return parseFloat(0).toFixed(2);
            }
        },

		/**
         * Populate the allocated amount when needed 
         * @public
         */
        populateAllocatedAmount: async function () {
            const oReqModel = this._oReqModel ? this._oReqModel : this._oOwnerComponent.getModel('request');
            const oReqItem  = oReqModel.getProperty("/req_item");
            const aReqPart  = oReqModel.getProperty("/participant");
            let calculatedAllocAmount;

            if (oReqModel.getProperty("/view") === Constants.PARMode.CREATE ||
                oReqModel.getProperty("/view") === Constants.PARMode.EDIT ) {
                switch (oReqItem.claim_type_item_id) {
                    case Constants.ClaimTypeItem.LODGING_L:
                    case Constants.ClaimTypeItem.LODG_O:
                        // calculate lodging amount
                        calculatedAllocAmount = await this._retrieveLodgingAmount();
                        break;

                    case Constants.ClaimTypeItem.MAKAN_L:
                    case Constants.ClaimTypeItem.MAKAN_O:
                        this._calculateTravelDuration();
                        calculatedAllocAmount = await this._retrieveEntitlementAmount();
                        if (oReqItem.currency_rate) {
                            calculatedAllocAmount = calculatedAllocAmount * parseFloat(oReqItem.currency_rate);
                        }
                        break;
                    
                    case Constants.ClaimTypeItem.LAUT:
                        this._getEntitledMeterCube();
                        break;
                    
                    default:
                        // calculate kilometer amount 
                        calculatedAllocAmount = this._calculateKilometer(oReqItem);
                        break;

                }
            }


            // populate allocated amount
            if (calculatedAllocAmount) {
                aReqPart.forEach((row, index) => {
                    if (row.PARTICIPANTS_ID) {
                        oReqModel.setProperty(`/participant/${index}/ALLOCATED_AMOUNT`,
                            parseFloat(calculatedAllocAmount).toFixed(2)
                        );
                    }
                });
            }

            // populate estimated amount
            var fEstAmount = this._calculateEstimatedAmount(oReqItem, aReqPart);
            oReqModel.setProperty("/req_item/est_amount", fEstAmount.toFixed(2));
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

            if (!sClaimType || !sClaimTypeItem || !sEmpId || !iNoOfDays) return;

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
            var sRegion         = oReqItem.sss || "01";
            var nTravelDay      = oReqItem.travel_day;
            var nTravelHour     = oReqItem.total_travel_hour;
            var nBreakfast      = 0;        // always be 0 as this one is only applicable for claim
            var nLunch          = 0;        // always be 0 as this one is only applicable for claim
            var nDinner         = 0;        // always be 0 as this one is only applicable for claim

            if (!nTravelDay || !nTravelHour || !sRegion) return;

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

                return fAmount + fDailyAllowance
                

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
                return; 
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
            const sEmpId        = this._oOwnerComponent.getModel("session").getProperty("/userId");

			const oFunction = oDataModel.bindContext("/getMeterCubeEntitlement(...)");
			oFunction.setParameter("empId", sEmpId);

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
        
    };
});