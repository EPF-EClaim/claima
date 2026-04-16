sap.ui.define([
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"claima/utils/Constants",
	"claima/utils/Utility",
	"claima/utils/DateUtility"
], function (
	Sorter,
	Filter,
	FilterOperator,
	JSONModel,
	BusyIndicator,
	MessageBox,
	MessageToast,
	Constant,
	Utility,
	DateUtility
) {
	"use strict";

	return {

		/**
		 * Initialize the ClaimUtility
		 * @public
		 */
		init: function (oOwnerComponent, oView) {
			this._oOwnerComponent = oOwnerComponent;
			this._oView = oView;
		},

		/**
		* Checks if course has already been used by user for a previously approved claim
		* @public
		* @param {string} sCourseCode - course code ID to check from database
		* @param {string} sSessionNumber - session number ID to check from database
		* @param {string} sParticipantId - participant ID to check from database
		* @returns {boolean} if records found, return true; else return false
		*/
		checkExistingCourseCode: async function (sCourseCode, sSessionNumber, sParticipantId) {
			const oModel = this._oOwnerComponent.getModel();
			// filter by claim status (approved, pending approval)
			const oFilterRoleId = new Filter({
				filters: [
					new Filter("STATUS_ID", FilterOperator.EQ, Constant.ClaimStatus.APPROVED),
					new Filter("STATUS_ID", FilterOperator.EQ, Constant.ClaimStatus.PENDING_APPROVAL)
				],
				and: false
			});
			const oListBinding = oModel.bindList(Constant.Entities.ZCLAIM_HEADER, null, null, [
				// check if claim exists with following 
				new Filter("COURSE_CODE", FilterOperator.EQ, sCourseCode),
				new Filter("SESSION_NUMBER", FilterOperator.EQ, sSessionNumber),
				new Filter("EMP_ID", FilterOperator.EQ, sParticipantId),
				oFilterRoleId
			]);

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					return true;
				} else {
					return false;
				}
			} catch (oError) {
				MessageBox.error(Utility.getText("error_msg_course_code_err", [oError]));
				return false;
			} finally {
				BusyIndicator.hide();
			}
		},

		/**
		* Set default values for claim item fields
		* Request is made to get values from table ZELIGIBILITY_RULE, based on user role and claim type/claim item given 
		* if record found, value is retrieved from the table and populated in the claim item model
		* @public
		* @param {object} oClaimSubmissionModel - claim submission to be passed into param
		* @param {object} oInputModel - claim item model to be passed into param
		* @param {string} sClaimItemField - claim item field to be populated
		* @param {string} sEligibilityRule - field to retrieve value from db table
		* @param {string} sDefaultValue - default value to set if none found
		*/
		setClaimItemDefaultValues: async function (oClaimSubmissionModel, oInputModel, sClaimItemField, sEligibilityRule, sDefaultValue) {
			const oModel = this._oOwnerComponent.getModel();
			//// filter by employee role ID or * (all)
			const oFilterRoleId = new Filter({
				filters: [
					new Filter(Constant.EligibilityRule.ROLE_ID, FilterOperator.EQ, oClaimSubmissionModel.getProperty("/emp_master/role")),
					new Filter(Constant.EligibilityRule.ROLE_ID, FilterOperator.EQ, '*')
				],
				and: false
			});
			//// filter by employee role ID or * (all)
			const oFilterPersonalGrade = new Filter({
				filters: [
					new Filter(Constant.EligibilityRule.PERSONAL_GRADE, FilterOperator.EQ, oClaimSubmissionModel.getProperty("/emp_master/grade")),
					new Filter(Constant.EligibilityRule.PERSONAL_GRADE, FilterOperator.EQ, '*')
				],
				and: false
			});
			const oListBinding = oModel.bindList(Constant.Entities.ZELIGIBILITY_RULE, null, [
				new Sorter(Constant.EligibilityRule.PERSONAL_GRADE, true),
				new Sorter(Constant.EligibilityRule.ROLE_ID, true),
				new Sorter(Constant.EligibilityRule.POSITION_NO_DESC, true),
				new Sorter(Constant.EligibilityRule.ROW_COUNT, true),
			], [
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oInputModel.getProperty("/claim_item/claim_type_id")),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oInputModel.getProperty("/claim_item/claim_type_item_id")),
				oFilterRoleId,
				oFilterPersonalGrade,
				// ensure status is active
				new Filter("STATUS", FilterOperator.EQ, Constant.ClaimTypeItemStatus.ACTIVE),
				new Filter("START_DATE", FilterOperator.LE, DateUtility.getHanaDate(DateUtility.today())),
				new Filter("END_DATE", FilterOperator.GE, DateUtility.getHanaDate(DateUtility.today())),
			]);

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					oInputModel.setProperty("/claim_item/" + sClaimItemField, oData[sEligibilityRule]);
				} else {
					oInputModel.setProperty("/claim_item/" + sClaimItemField, sDefaultValue);
					MessageToast.show(Utility.getText("msg_claimdetails_input_" + sClaimItemField + "_none"));
				}
			} catch (oError) {
				oInputModel.setProperty("/claim_item/percentage_compensation", 0.0);
				MessageBox.error(Utility.getText("msg_claimdetails_input_" + sClaimItemField + "_err", [oError]));
			} finally {
				BusyIndicator.hide();
			}
		},

		/**
		* Set filters for state and office location when values found for existing claim item
		* @public
		*/
		setFiltersExistingStateLocation: function () {
			var oInputModel = this._oView.getModel("claimitem_input");
			if (!oInputModel) return;

			// set filters
			var sFromState = oInputModel.getProperty("/claim_item/from_state_id");
			var sFromOffice = oInputModel.getProperty("/claim_item/from_location_office");
			var sToState = oInputModel.getProperty("/claim_item/to_state_id");

			if (!sFromState || !sFromOffice || !sToState) return;

			// filter From Location (Office)
			var oSelectFromLoc = this._oView.byId("select_claimdetails_input_from_location");
			var oBindingFromLoc = oSelectFromLoc?.getBinding("items");
			var aFiltersFromLoc = [
				new Filter(Constant.EntitiesFields.STATUS, FilterOperator.EQ, Constant.Status.ACTIVE),
				new Filter(Constant.EntitiesFields.STATE_ID, FilterOperator.EQ, sFromState)
			];
			oBindingFromLoc?.filter(aFiltersFromLoc);

			// filter To State
			var oSelectToState = this._oView.byId("select_claimdetails_input_to_state_id");
			var oBindingToState = oSelectToState?.getBinding("items");
			var aFiltersToState = [
				new Filter(Constant.EntitiesFields.FROM_STATE_ID, FilterOperator.EQ, sFromState),
				new Filter(Constant.EntitiesFields.FROM_LOCATION_ID, FilterOperator.EQ, sFromOffice)
			];
			oBindingToState?.filter(aFiltersToState);

			// filter To Location (Office)
			var oSelectToLoc = this._oView.byId("select_claimdetails_input_to_location");
			var oBindingToLoc = oSelectToLoc?.getBinding("items");
			var aFiltersToLoc = [
				new Filter(Constant.EntitiesFields.FROM_STATE_ID, FilterOperator.EQ, sFromState),
				new Filter(Constant.EntitiesFields.FROM_LOCATION_ID, FilterOperator.EQ, sFromOffice),
				new Filter(Constant.EntitiesFields.TO_STATE_ID, FilterOperator.EQ, sToState)
			];
			oBindingToLoc?.filter(aFiltersToLoc);
		},

		/**
		* Check if current user ID has previously approved claim with elaun pengangkutan claim item
		* Method retrieves db table to be checked with fields and values to be filtered against
		* if records found and have been approved, return true; else, return false
		* @public
		* @param {string} sEmpId - employee ID to retrieve dependents for
		* @returns {boolean} if records found, return true; else, return false
		*/
		getPreviousElaunPengangkutan: async function (sEmpId) {
			const oModel = this._oOwnerComponent.getModel();
			const oListBinding = oModel.bindList(Constant.Entities.ZCLAIM_ITEM, null, [
				new Sorter("CLAIM_ID")
			], [
				new Filter("EMP_ID", FilterOperator.EQ, sEmpId),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, Constant.ClaimTypeItem.E_PENGAKUT)
			], {
				$expand: { "ZCLAIM_HEADER": { $select: "STATUS_ID" } }
			});

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					for (var iContext = 0; iContext < aContexts.length; iContext++) {
						var oData = aContexts[iContext].getObject();
						if (oData["ZCLAIM_HEADER"]["STATUS_ID"] === Constant.ClaimStatus.APPROVED ||
							oData["ZCLAIM_HEADER"]["STATUS_ID"] === Constant.ClaimStatus.PENDING_APPROVAL
						) {
							// if approved claim header found, return true
							return true;
						}
					}
					// if exit for loop, no approved claim header found with elaun pengangkutan
				}
				return false;
			} catch (oError) {
				MessageBox.error(Utility.getText("msg_claimdetails_input_pengangkutan_err", [oError]));
				return false;
			} finally {
				BusyIndicator.hide();
			}
		},
		
		/**
		 * Fetch entitlement amount from the backend function
		 * @public
		 * @param {sap.ui.model.json.JSONModel} oClaimItemInputModel Claim item input
		 */
		fetchAndApplyEntitlement: function (oClaimItemInputModel) {
			var nDay, nDependent;
			if ((oClaimItemInputModel.getProperty("/claim_item/claim_type_item_id") === Constant.ClaimTypeItem.MKN_LOAN)) {
				nDay = oClaimItemInputModel.getProperty("/claim_item/no_of_days") > 2 ? 2 : oClaimItemInputModel.getProperty("/claim_item/no_of_days");
				nDependent = oClaimItemInputModel.getProperty("/claim_item/no_of_family_member");
			} else {
				nDay = oClaimItemInputModel.getProperty("/claim_item/travel_duration_day");
				nDependent = 0;
			}
			//get total hours based on diffrence hour + day
			var nHour = nDay > 1? oClaimItemInputModel.getProperty("/claim_item/travel_duration_hour") + (nDay * 24) : oClaimItemInputModel.getProperty("/claim_item/travel_duration_hour") ;
			var sLocation = oClaimItemInputModel.getProperty("/claim_item/region");
			var sClaimtype = oClaimItemInputModel.getProperty("/claim_item/claim_type_id");
			var sClaimItem = oClaimItemInputModel.getProperty("/claim_item/claim_type_item_id");
			var nBreakfast = parseInt(oClaimItemInputModel.getProperty("/claim_item/provided_breakfast"));
			var nLunch = parseInt(oClaimItemInputModel.getProperty("/claim_item/provided_lunch"));
			var nDinner = parseInt(oClaimItemInputModel.getProperty("/claim_item/provided_dinner"));
			if (!this.byId("input_claimdetails_input_exclude_tips").getVisible()) {
				oClaimItemInputModel.setProperty(("/claim_item/exclude_tips"), true);
			}
			var bTips = oClaimItemInputModel.getProperty("/claim_item/exclude_tips");

			var oSessionModel = this.getView().getModel("session");
			var sEEID = oSessionModel.getProperty("/userId");


			nBreakfast = Number.isNaN(nBreakfast) ? 0 : nBreakfast;
			nLunch = Number.isNaN(nLunch) ? 0 : nLunch;
			nDinner = Number.isNaN(nDinner) ? 0 : nDinner;

			const oModel = this.getView().getModel();
			const oContext = oModel.bindContext("/getAmountEntitlement(...)");

			oContext.setParameter("day", nDay);
			oContext.setParameter("hours", nHour);
			oContext.setParameter("location", sLocation != null ? sLocation : '03');
			oContext.setParameter("claimtypeid", sClaimtype);
			oContext.setParameter("claimtypeitem", sClaimItem);
			oContext.setParameter("breakfast", nBreakfast);
			oContext.setParameter("lunch", nLunch);
			oContext.setParameter("dinner", nDinner);
			oContext.setParameter("employeeid", sEEID);
			oContext.setParameter("dependent", nDependent);
			oContext.setParameter("exclude_tips", bTips);

			return oContext.execute()
				.then(() => oContext.requestObject());

		},

		/**
		 * Check for default cost center assigned to claim type, if no data found, return null value
		 * @public
		 * @param {string} sClaimTypeId claim type to be checked
		 * @returns {string} cost center selected
		 */
		determineDefaultCostCenter: async function (sClaimTypeId) {
			try {
				const oFunction = this._oOwnerComponent.getModel().bindContext("/checkDefaultCostCenter(...)");

				oFunction.setParameter("sClaimTypeId", sClaimTypeId);

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject() || null;

				return oResult.sCostCenter;

			} catch (oError) {
				return null;
			}
		},

		/**
		 * Retrieve rate per km data for item based on vehicle type and claim type item
		 * @public
		 * @param {String} sVehicleType - vehicle type based on selected item
		 * @param {String} sClaimTypeItem - claim type item of selected item
		 * @return {Object} - returns id and value of rate per km retrieved from table
		 */
		fetchRatePerKm: async function (sVehicleType, sClaimTypeItem) {
			var oResult = {
				id: null,
				value: null
			};
			try {
				BusyIndicator.show(0);
				const oFunction = this._oOwnerComponent.getModel().bindContext("/getRatePerKm(...)");

				oFunction.setParameter("sVehicleType", sVehicleType);
				oFunction.setParameter("sClaimTypeItem", sClaimTypeItem);

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oData = oContext.getObject();

				oResult = {
					id: oData.id,
					value: oData.value
				}

			} catch (oError) {
				MessageToast.show(oError);
				oResult = {
					id: null,
					value: null
				}
			} finally {
				BusyIndicator.hide();
			}

			return oResult;
		},
		
		/**
		 * Retrieve approved amount and marriage category data for user selecting Elaun Pengangkutan, based on Marital Status and Employee Type
		 * @public
		 * @return {Decimal} - returns eligible amount retrieved from table
		 */
		fetchUserAmountElaunPengangkutan: async function () {
			// get eligible amount based on current user
			var dResult = 0.00;
			try {
				BusyIndicator.show(0);
				const oFunction = this._oOwnerComponent.getModel().bindContext("/getUserEligibleAmountEPengakut(...)");

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				dResult = oContext.getObject("value") || 0.00;

			} catch (oError) {
				MessageBox.error(oError.toString());
				dResult = null;
			} finally {
				BusyIndicator.hide();
			}

			return dResult;
		},

		/**
		 * Retrieve status of existing employee claim with item Elaun Pengangkutan
		 * @public
		 * @return {String} - return status of existing claim with item Elaun Pengangkutan
		 */
		fetchUserClaimStatusElaunPengangkutan: async function () {
			// check if claim exists with claim item elaun pengangkutan for employee
			try {
				const oFunction = this._oOwnerComponent.getModel().bindContext("/getUserClaimStatusEPengakut(...)");

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const dResult = oContext.getObject("value") || null;

				return dResult;

			} catch (oError) {
				return null;
			}
		},

		/**
		 * Bind to existing claim header with claim ID, if not found return null value
		 * @public
		 * @param {object} oODataModel model used for claim data binding
		 * @param {string} sClaimId claim ID to check from database
		 * @returns {object} Bound context of the claim header, null value if not found
		 */
		getClaimHeader: async function (oODataModel, sClaimId) {
			try {
				const oContextBinding = oODataModel.bindContext(
					`/ZCLAIM_HEADER('${encodeURIComponent(sClaimId)}')`
				);

				await oContextBinding.requestObject(); 
				const oContext = oContextBinding.getBoundContext();
				return oContext;
			} catch (oError) {
				return null;
			}
		},

		/**
		 * Retrieve and apply meter cube entitlement from backend service.
		 *
		 * Calls backend entitlement function using the logged-in employee ID
		 * and updates the entitled meter cube value in the claim item input model.
		 *
		 * @public
		 * @param {sap.ui.model.json.JSONModel} oInputModel - Claim item input model
		 * @param {sap.ui.model.json.JSONModel} oSessionModel - User session model
		 * @returns Updates entitled meter cube field upon completion
		 */
		fetchMeterCubeEntitlement: function (oInputModel) {
			const oContext = this._oView.getModel().bindContext("/getMeterCubeEntitlement(...)");

			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((result) => {
					oInputModel.setProperty(
						"/claim_item/meter_cube_entitled",
						Number(result).toFixed(2)
					);
				});
		},

		/**
		 * Retrieve and apply Pengangkutan Laut claim amount from backend service.
		 *
		 * Calls backend calculation function using employee ID, actual meter cube,
		 * and actual amount, then updates entitled meter cube and final payable
		 * amount in the claim item input model.
		 *
		 * @public
		 * @param {sap.ui.model.json.JSONModel} oInputModel - Claim item input model
		 * @param {sap.ui.model.json.JSONModel} oSessionModel - User session model
		 * @returns Updates claim item fields upon completion
		 */
		fetchPengangkutanLautAmount: function (oInputModel) {
			const oContext = this._oView.getModel().bindContext("/calculatePengangkutanLautAmount(...)");
			oContext.setParameter("actualMeterCube", oInputModel.getProperty("/claim_item/meter_cube_actual"));
			oContext.setParameter("actualAmount", oInputModel.getProperty("/claim_item/actual_amount"));

			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {
					oInputModel.setProperty("/claim_item/meter_cube_entitled", oResult.entitled);
					oInputModel.setProperty("/claim_item/amount", oResult.amount);
				});
		},

		/**
		 * Check if PAR has been reused for claim submission 
		 * @public
		 * @param {String} sRequestID - Pre-approval request ID
		 * @returns {Boolean} bIsUsed - show if warning should be sent
		 */
		checkReusedPAR: async function (sRequestID) {
			const oModel = this._oView.getModel();
			const oContext = oModel.bindContext("/checkPreApprovalUsage(...)");
			oContext.setParameter("requestID", sRequestID);
			return oContext.execute().then(() => oContext.requestObject());
		},

		/**
		 * Get Fare Type filters based on Claim Type and Claim Item
		 * @public
		 * @param {string} sClaimTypeId
		 * @param {string} sClaimTypeItemId
		 * @returns {sap.ui.model.Filter[]} array of filters
		 */
		getFareTypeFilters: function (sClaimTypeId, sClaimTypeItemId) {
			var aFilters = [];
			if ((sClaimTypeId === Constant.ClaimType.KURSUS_DLM_NEGARA || sClaimTypeId === Constant.ClaimType.DLM_NEGARA) &&
				sClaimTypeItemId === Constant.ClaimTypeItem.TAMBANG) {
				aFilters.push(new Filter("FARE_TYPE_ID", FilterOperator.NE, Constant.FareType.FLIGHT));
			}
			return aFilters;
		},

		/**
		 * Calculate Matawang 3% fields - Uses CAP Backend to calculate.
		 * @public
		 */
		calculateMatawangAmount: async function () {
			const oSubmissionModel = this._oView.getModel("claimsubmission_input");
			const oInputModel = this._oView.getModel("claimitem_input");
			const oCalculateMataWangAmountContext = this._oView.getModel().bindContext("/calculateMatawangAmount(...)");
			oCalculateMataWangAmountContext.setParameter(
				"claimItems",
				JSON.stringify(oSubmissionModel.getProperty("/claim_items") || [])
			);
			return await oCalculateMataWangAmountContext.execute()
				.then(() => oCalculateMataWangAmountContext.requestObject())
				.then((oResult) => {

					const aClaimItems = oSubmissionModel.getProperty("/claim_items") || [];
					const iMatawangIndex = aClaimItems.findIndex(
						oItem => oItem.claim_type_item_id === Constant.ClaimTypeItem.MATAWANG
					);

					if (iMatawangIndex > -1) {
						oSubmissionModel.setProperty(
							`/claim_items/${iMatawangIndex}/percentage_compensation`,
							oResult.percentage
						);
						oSubmissionModel.setProperty(
							`/claim_items/${iMatawangIndex}/amount`,
							oResult.amount
						);
					}

					else if (
						oInputModel.getProperty("/claim_item/claim_type_item_id") ===
						Constant.ClaimTypeItem.MATAWANG
					) {
						oInputModel.setProperty(
							"/claim_item/percentage_compensation",
							oResult.percentage
						);
						oInputModel.setProperty(
							"/claim_item/amount",
							oResult.amount
						);
					}
				});
		},
		/**
		 * Save Matawang item after calculation.
		 *
		 * @public
		 * @param {Function} fnSaveClaimItem - controller save function (callback)
		 */
		saveUpdatedMatawang: async function (fnSaveClaimItem) {

			const oSubmissionModel = this._oView.getModel("claimsubmission_input");
			const oInputModel = this._oView.getModel("claimitem_input");
			const oPreviousClaimItem = oInputModel.getProperty("/claim_item");
			const bPreviousIsNew = oInputModel.getProperty("/is_new");
			const aClaimItems = oSubmissionModel.getProperty("/claim_items") || [];
			
			const iMatawangIndex = aClaimItems.findIndex(
				oItem =>
					oItem.claim_type_item_id ===
					Constant.ClaimTypeItem.MATAWANG
			);

			if (iMatawangIndex === -1) {
				return false;
			}

			const oMatawangItem = {
				...aClaimItems[iMatawangIndex]
			};
			oInputModel.setProperty("/claim_item", oMatawangItem);
			oInputModel.setProperty("/is_new", false);
			await fnSaveClaimItem();
			oInputModel.setProperty("/claim_item", oPreviousClaimItem);
			oInputModel.setProperty("/is_new", bPreviousIsNew);
		}, 
	}
});