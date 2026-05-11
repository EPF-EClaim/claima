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
	Constants,
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
					new Filter("STATUS_ID", FilterOperator.EQ, Constants.ClaimStatus.APPROVED),
					new Filter("STATUS_ID", FilterOperator.EQ, Constants.ClaimStatus.PENDING_APPROVAL)
				],
				and: false
			});
			const oListBinding = oModel.bindList(Constants.Entities.ZCLAIM_HEADER, null, null, [
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
		setClaimItemDefaultValues: async function (oEmpModel, oClaimModel, sClaimItemField, sEligibilityRule, sDefaultValue) {
			const oModel = this._oOwnerComponent.getModel();
			//// filter by employee role ID or * (all)
			const oFilterRoleId = new Filter({
				filters: [
					new Filter(Constants.EligibilityRule.ROLE_ID, FilterOperator.EQ, oEmpModel.getProperty("/emp_master/role")),
					new Filter(Constants.EligibilityRule.ROLE_ID, FilterOperator.EQ, '*')
				],
				and: false
			});
			//// filter by employee role ID or * (all)
			const oFilterPersonalGrade = new Filter({
				filters: [
					new Filter(Constants.EligibilityRule.PERSONAL_GRADE, FilterOperator.EQ, oEmpModel.getProperty("/emp_master/grade")),
					new Filter(Constants.EligibilityRule.PERSONAL_GRADE, FilterOperator.EQ, '*')
				],
				and: false
			});
			const oListBinding = oModel.bindList(Constants.Entities.ZELIGIBILITY_RULE, null, [
				new Sorter(Constants.EligibilityRule.PERSONAL_GRADE, true),
				new Sorter(Constants.EligibilityRule.ROLE_ID, true),
				new Sorter(Constants.EligibilityRule.POSITION_NO_DESC, true),
				new Sorter(Constants.EligibilityRule.ROW_COUNT, true),
			], [
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oClaimModel.getProperty("/claim_item/claim_type_id")),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oClaimModel.getProperty("/claim_item/claim_type_item_id")),
				oFilterRoleId,
				oFilterPersonalGrade,
				// ensure status is active
				new Filter("STATUS", FilterOperator.EQ, Constants.ClaimTypeItemStatus.ACTIVE),
				new Filter("START_DATE", FilterOperator.LE, DateUtility.getHanaDate(DateUtility.today())),
				new Filter("END_DATE", FilterOperator.GE, DateUtility.getHanaDate(DateUtility.today())),
			]);

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					oClaimModel.setProperty("/claim_item/" + sClaimItemField, oData[sEligibilityRule]);
				} else {
					oClaimModel.setProperty("/claim_item/" + sClaimItemField, sDefaultValue);
					MessageBox.error(Utility.getText("msg_claimdetails_input_" + sClaimItemField + "_none"));
				}
			} catch (oError) {
				oClaimModel.setProperty("/claim_item/percentage_compensation", 0.0);
				MessageBox.error(Utility.getText("msg_claimdetails_input_" + sClaimItemField + "_err", [oError]));
			} finally {
				BusyIndicator.hide();
			}
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
			const oListBinding = oModel.bindList(Constants.Entities.ZCLAIM_ITEM, null, [
				new Sorter("CLAIM_ID")
			], [
				new Filter("EMP_ID", FilterOperator.EQ, sEmpId),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, Constants.ClaimTypeItem.E_PENGAKUT)
			], {
				$expand: { "ZCLAIM_HEADER": { $select: "STATUS_ID" } }
			});

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					for (var iContext = 0; iContext < aContexts.length; iContext++) {
						var oData = aContexts[iContext].getObject();
						if (oData["ZCLAIM_HEADER"]["STATUS_ID"] === Constants.ClaimStatus.APPROVED ||
							oData["ZCLAIM_HEADER"]["STATUS_ID"] === Constants.ClaimStatus.PENDING_APPROVAL
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
		* Retrieve start end dates for course code from db table, based on selected course code ID and user ID
		* Method retrieves db table to be checked with fields and values to be filtered against
		* if records found, first record is retrieved from the table and returns values from the record
		* @public
		* @param {string} sEmpId - employee ID to retrieve dependents for
		* @returns {integer} if records found, return total number of dependents for employee
		*/
		getNumberOfFamilyMembers: async function (sEmpId) {
			const oModel = this._oOwnerComponent.getModel();
			const oListBinding = oModel.bindList(Constants.Entities.ZEMP_DEPENDENT, null, [
				new Sorter("DEPENDENT_NO")
			], [
				new Filter("EMP_ID", FilterOperator.EQ, sEmpId)
			]);

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				return aContexts.length;
			} catch (oError) {
				MessageBox.error(Utility.getText("msg_claimdetails_input_no_of_family_member_err", [oError]));
				return 0;
			} finally {
				BusyIndicator.hide();
			}
		},

		/**
		 * Fetch entitlement amount from the backend function
		 * @public
		 */
		fetchAndApplyEntitlement: function () {
			var nDay, nDependent;
			const oClaimModel = this._oOwnerComponent.getModel("claim");

			if ((oClaimModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.MKN_LOAN)) {
				nDay = oClaimModel.getProperty("/claim_item/no_of_days") > 2 ? 2 : oClaimModel.getProperty("/claim_item/no_of_days");
				nDependent = oClaimItemInputModel.getProperty("/claim_item/no_of_family_member") ? oClaimItemInputModel.getProperty("/claim_item/no_of_family_member") : 1;
			} else if(oClaimModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.MKN_TUKAR){
				if(oClaimModel.getProperty("/claim_header/travel_family_now_later") == Constants.TravelWithFamilyNowOrLater.NOW){
					nDay = oClaimModel.getProperty("/claim_item/no_of_days");
					nDependent = oClaimModel.getProperty("/claim_item/number_of_travellers") ? oClaimModel.getProperty("/claim_item/number_of_travellers") : oClaimModel.getProperty("/claim_item/no_of_family_member");
				}else{
					nDay = oClaimModel.getProperty("/claim_item/no_of_days");
					nDependent = 1;
				}
			}
			else{
				nDay = oClaimModel.getProperty("/claim_item/travel_duration_day");
				nDependent = 1;
			}
			//get total hours based on diffrence hour + day
			var nHour = (nDay * 24) + oClaimModel.getProperty("/claim_item/travel_duration_hour");
			var sLocation = oClaimModel.getProperty("/claim_item/region");
			var sClaimtype = oClaimModel.getProperty("/claim_item/claim_type_id");
			var sClaimItem = oClaimModel.getProperty("/claim_item/claim_type_item_id");
			var nBreakfast = parseInt(oClaimModel.getProperty("/claim_item/provided_breakfast"));
			var nLunch = parseInt(oClaimModel.getProperty("/claim_item/provided_lunch"));
			var nDinner = parseInt(oClaimModel.getProperty("/claim_item/provided_dinner"));
			var bTips = oClaimModel.getProperty("/claim_item/exclude_tips");

			var oSessionModel = this._oOwnerComponent.getModel("session");
			var sEEID = oSessionModel.getProperty("/userId");

			nBreakfast = Number.isNaN(nBreakfast) ? 0 : nBreakfast;
			nLunch = Number.isNaN(nLunch) ? 0 : nLunch;
			nDinner = Number.isNaN(nDinner) ? 0 : nDinner;

			const oModel = this._oOwnerComponent.getModel();
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
		 */
		fetchRatePerKm: async function () {

			let oResult = { id: null, value: null };
			const oInputModel = this._oView.getModel("claimitem_input");
			const oClaimItem = oInputModel.getProperty("/claim_item");

			if (!oClaimItem || !oClaimItem.vehicle_type) return;

			const dRateDate =
				oClaimItem.start_date || oClaimItem.receipt_date;
			try {
				BusyIndicator.show(0);

				const oFunction = this._oOwnerComponent
					.getModel()
					.bindContext("/getRatePerKm(...)");

				oFunction.setParameter("sVehicleType", oClaimItem.vehicle_type);
				oFunction.setParameter("sClaimTypeItem", oClaimItem.claim_type_item_id);
				oFunction.setParameter("dRateDate", dRateDate);

				await oFunction.execute();

				const oData = oFunction.getBoundContext().getObject();
				oResult = { id: oData.id, value: oData.value };

			} catch (oError) {
				MessageToast.show(oError?.message || "Failed to fetch Rate per KM");
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
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			// get eligible amount based on current user
			var dResult = 0.00;
			try {
				BusyIndicator.show(0);
				const oContext = this._oOwnerComponent.getModel().bindContext("/getUserEligibleAmountEPengakut(...)");

				return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {
					oClaimModel.setProperty("/claim_item/amount", oResult.value);
				});

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
		 * Retrieve eligible amount for user selecting lodging claim type item, based on Employee Grade
		 * @public
		 * @return {Decimal} - returns eligible amount retrieved from table
		 */
		fetchUserAmountLodging: async function () {
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const oDataModel = this._oOwnerComponent.getModel();
			const sClaimType = oClaimModel.getProperty("/claim_item/claim_type_id");
			const sClaimTypeItem = oClaimModel.getProperty("/claim_item/claim_type_item_id");

			// get eligible amount based on current user
			var dResult = 0.00;
			try {
				BusyIndicator.show(0);
				const oContext = oDataModel.bindContext("/getUserEligibleAmountLodging(...)");

				oContext.setParameter("sClaimType", sClaimType);
				oContext.setParameter("sClaimTypeItem", sClaimTypeItem);

				// await oFunction.execute();

				// const oContext = oFunction.getBoundContext();
				// dResult = oContext.getObject("value") || 0.00;
				return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {
					oClaimModel.setProperty("/claim_item/eligible_amount", oResult.value);
				});

			} catch (oError) {
				MessageBox.error(oError);
				dResult = 0.00;
			} finally {
				BusyIndicator.hide();
			}			
		},

		/**
		 * Calculate approved amount for lodging based on params
		 * @public
		 * @return {Decimal} dResult - returns approved amount based on above parameters
		 */
		calculateAmountLodging: function () {
			const oInputModel = this._oView.getModel("claimitem_input");
			const oSubmissionModel = this._oView.getModel("claimsubmission_input");
			const sClaimTypeItem = oInputModel.getProperty("/claim_item/claim_type_item_id");
			const dEligibleAmount = oInputModel.getProperty("/claim_item/eligible_amount");
			const iNoOfDays = oInputModel.getProperty("/claim_item/no_of_days");
			const iNoOfFamilyMembers = oInputModel.getProperty("/claim_item/number_of_travellers") ? oInputModel.getProperty("/claim_item/number_of_travellers") : oInputModel.getProperty("/claim_item/no_of_family_member");

			if (!sClaimTypeItem || !dEligibleAmount || !iNoOfDays) return 0.00;

			// calculate approved amount
			switch (sClaimTypeItem) {
				case Constants.ClaimTypeItem.LOD_TUKAR:
					if(oSubmissionModel.getProperty("/claim_header/travel_family_now_later") == Constants.TravelWithFamilyNowOrLater.NOW_DESC ||
					   oSubmissionModel.getProperty("/claim_header/travel_family_now_later") == Constants.TravelWithFamilyNowOrLater.NOW){
						var dResult = parseFloat(dEligibleAmount) * iNoOfDays * iNoOfFamilyMembers;
					}else{
						var dResult = parseFloat(dEligibleAmount) * iNoOfDays * 1;
					}
					
					break;
				default:
					var dResult = parseFloat(dEligibleAmount) * iNoOfDays;
					break;
			}
			return !isNaN(dResult) ? dResult : 0.00;
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
		fetchMeterCubeEntitlement: function () {
			const oDataModel = this._oOwnerComponent.getModel();
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const oContext = oDataModel.bindContext("/getMeterCubeEntitlement(...)");

			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((result) => {
					oClaimModel.setProperty(
						"/claim_item/meter_cube_entitled",
						Number(result.value).toFixed(2)
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
		fetchPengangkutanLautAmount: function () {
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const oDataModel = this._oOwnerComponent.getModel();
			const oContext = oDataModel.bindContext("/calculatePengangkutanLautAmount(...)");
			oContext.setParameter("actualMeterCube", oClaimModel.getProperty("/claim_item/meter_cube_actual"));
			oContext.setParameter("actualAmount", oClaimModel.getProperty("/claim_item/actual_amount"));
			
			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {
					oClaimModel.setProperty("/claim_item/meter_cube_entitled", oResult.entitled);
					oClaimModel.setProperty("/claim_item/amount", oResult.amount);
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
			if ([Constants.ClaimType.KURSUS_DLM_NEGARA,
			Constants.ClaimType.DLM_NEGARA,
			Constants.ClaimType.KURSUS_LUAR_NEGARA,
			Constants.ClaimType.LUAR_NEGARA,
			Constants.ClaimType.ELAUN_TUKAR
			].includes(sClaimTypeId)&&
				sClaimTypeItemId === Constants.ClaimTypeItem.TAMBANG) {
				aFilters.push(new Filter("FARE_TYPE_ID", FilterOperator.NE, Constants.FareType.FLIGHT));
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
						oItem => oItem.claim_type_item_id === Constants.ClaimTypeItem.MATAWANG
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
						Constants.ClaimTypeItem.MATAWANG
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
					Constants.ClaimTypeItem.MATAWANG
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

		/**
		* Retrieve start end dates for course code from db table, based on selected course code ID and user ID
		* Method retrieves db table to be checked with fields and values to be filtered against
		* if records found, first record is retrieved from the table and returns values from the record
		* @public
		* @param {string} sEmpId - employee ID to retrieve dependents for
		* @returns {integer} if records found, return total number of dependents for employee
		*/
		getSpouseChildNo: async function () {
			const oContext = this._oView.getModel().bindContext("/getNumberOfFamilyMembers(...)");
			oContext.setParameter("IND", "IND1"); //Get count of spouse and children + self
			
 			await oContext.execute();

   		 	// Read return value
			const oResult = await oContext.requestObject();

    		return oResult?.value ?? 0;
		}, 

		/**
		 * Retrieve and apply Pemberian Pindah claim amount from backend service.
		 *
		 * Calls backend calculation function using employee ID,region, marital status
		 * and actual amount, then updates approved amount
		 * in the claim item input model.
		 *
		 * @public
		 * @returns Updates claim item fields upon completion
		 */
		fetchPemberianPindahAmount: function () {
			var oInputModel = this._oView.getModel("claimitem_input");
			var oClaimSubmissionModel = this._oView.getModel("claimsubmission_input");
			const oContext = this._oView.getModel().bindContext("/getUserEligibleAmountPemPindah(...)");

			oContext.setParameter("sRegion", oInputModel.getProperty("/claim_item/region"));
			oContext.setParameter("sClaimType", oClaimSubmissionModel.getProperty("/claim_header/claim_type_id"));
			oContext.setParameter("sClaimTypeItem", oInputModel.getProperty("/claim_item/claim_type_item_id"));
			oContext.setParameter("sTravelAloneFamily", oClaimSubmissionModel.getProperty("/claim_header/travel_alone_family"));
			oContext.setParameter("sTravelFamilyNowLater", oClaimSubmissionModel.getProperty("/claim_header/travel_family_now_later"));

			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {
					if(oInputModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.PEM_PINDAH){
						oInputModel.setProperty("/claim_item/actual_amount", oResult.fAmount);
						oInputModel.setProperty("/claim_item/amount", oResult.fFinalAmount);
					}else{
						oInputModel.setProperty("/claim_item/amount", oResult.fAmount);
					}
					
				});
		},

		// one logic to calculate all the required calculation field
		onCalculation: async function (){
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const oHeader = oClaimModel.getProperty("/claim_header");
			const oItem = oClaimModel.getProperty("/claim_item");

			const sClaimTypeItem = oClaimModel.getProperty("/claim_item/claim_type_item_id");
			

			switch(sClaimTypeItem){
				case Constants.ClaimTypeItem.MATAWANG:
				case Constants.ClaimTypeItem.POST_EDUCATION_ASSISTANCE:
				case Constants.ClaimTypeItem.PEM_PINDAH:
					const oEmpDefaultAmt = await this.getEmpDefaultAmount();
					oClaimModel.setProperty("/claim_item/percentage_compensation", oEmpDefaultAmt.iSubsidisedRate)
					break;

				case Constants.ClaimTypeItem.LAUT:
					if(!!oItem.meter_cube_actual && !!oItem.actual_amount){
						await this.fetchPengangkutanLautAmount();
					}
					break;

				case Constants.ClaimTypeItem.LODG_O:
				case Constants.ClaimTypeItem.LOD_TUKAR:
				case Constants.ClaimTypeItem.LODGING_L:
					await this.fetchUserAmountLodging();
					break;

				case Constants.ClaimTypeItem.MAKAN_L:
				case Constants.ClaimTypeItem.MAKAN_O:
					await this.onCalculateEntitlement();
					await this.onCalculatePerDiem();
					break;
				case Constants.ClaimTypeItem.TAMBANG:
					await this.onCalculatePerDiem();
					break;

			}
			
		},

		onPopulateAllocatedAmount: async function(){
			const oClaimModel = this._oOwnerComponent.getModel("claim");

			const sClaimTypeItem = oClaimModel.getProperty("/claim_item/claim_type_item_id");

			switch (sClaimTypeItem) {
						case Constants.ClaimTypeItem.DARAT:
						//populate entitled amount 
						case Constants.ClaimTypeItem.LAUT:
							if (oClaimModel.getProperty("/view") === Constants.AccessMode.CREATE) { 
								await this.fetchMeterCubeEntitlement();
							}
							break;
						case Constants.ClaimTypeItem.E_PENGAKUT:
							const iEligibleAmount = await this.fetchUserAmountElaunPengangkutan();
							// populate item values
							if (iEligibleAmount === null) return;
							else oInputModel.setProperty("/claim_item/amount", iEligibleAmount);
							break;

						// remove business class option for FLIGHT_L
						// case Constants.ClaimTypeItem.FLIGHT_L:
						// 	this._removeBusinessClass();

						default:
							break;
					}
		},

		getEmpDefaultAmount: async function(){
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const oDataModel = this._oOwnerComponent.getModel();
			const oContext = oDataModel.bindContext("/getEmpDefaultAmount(...)");
			oContext.setParameter("sClaimType", oClaimModel.getProperty("/claim_item/claim_type_id"));
			oContext.setParameter("sClaimTypeItem", oClaimModel.getProperty("/claim_item/claim_type_item_id"));
			await oContext.execute();
   		 	// Read return value
			const oResult = await oContext.requestObject();
			return oResult;
		},
		onCalculatePerDiem: async function(){
			const oDataModel = this._oOwnerComponent.getModel();
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const sClaimTypeItem = oClaimModel.getProperty("/claim_item/claim_type_item_id");

			const oResult = await this.fetchAndApplyEntitlement();
			// if(!!oResult || oResult.amount == 0){
			// 	return;
			// }

			switch(sClaimTypeItem){
				case Constants.ClaimTypeItem.MAKAN_O:
					oClaimModel.setProperty("/claim_item/daily_allowance", oResult.daily_allowance);

					oClaimModel.setProperty("/claim_item/currency_code", oResult.currency_code);
					oClaimModel.setProperty("/claim_item/currency_amount", oResult.amount);

					if(oClaimModel.getProperty("/claim_item/currency_rate") && oClaimModel.getProperty("/claim_item/currency_amount")){
						var nAmountMYR = (oClaimModel.getProperty("/claim_item/currency_rate") * oClaimModel.getProperty("/claim_item/currency_amount"));
						oClaimModel.setProperty("/claim_item/amount", nAmountMYR);
					}

					oClaimModel.setProperty("/claim_item/tips", oResult.tips_amount);

					break;
				case Constants.ClaimTypeItem.MAKAN_L:
					oClaimModel.setProperty("/claim_item/daily_allowance", oResult.daily_allowance);
					oClaimModel.setProperty("/claim_item/amount", oResult.amount);
					break;
				case Constants.ClaimTypeItem.TAMBANG:
					
					break;
				default:
					oClaimModel.setProperty("/claim_item/amount", oResult.amount);
					break;
			}


			//oResult. amount daily_allowance currency_code tips_amount
		},

		onCalculateEntitlement: async function(){
			const oClaimModel = this._oOwnerComponent.getModel("claim");
			const oHeader = oClaimModel.getProperty("/claim_header");
			const oItem = oClaimModel.getProperty("/claim_item");

			const dStartDate = oClaimModel.getProperty("/claim_item/start_date");
			const dEndDate = oClaimModel.getProperty("/claim_item/end_date");
			const dStartTime = oClaimModel.getProperty("/claim_item/start_time");
			const dEndTime= oClaimModel.getProperty("/claim_item/end_time");
			
			if(!dStartDate || !dEndDate) return;

			const iNoOfDays = await DateUtility.calculateNumberOfDays(Constants.SubmissionTypePrefix.CLAIM, oHeader, oItem);

			oClaimModel.setProperty("/claim_item/travel_duration_day", iNoOfDays);

			if(oClaimModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.MAKAN_O || oClaimModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimTypeItem.MAKAN_L){
				oClaimModel.setProperty("/claim_item/entitled_breakfast", iNoOfDays);
				oClaimModel.setProperty("/claim_item/entitled_lunch", iNoOfDays);
				oClaimModel.setProperty("/claim_item/entitled_dinner", iNoOfDays);
			}

			if(!dStartTime || !dEndTime) return;

			const dFullStartDate = DateUtility.parseDateTime(dStartDate, dStartTime);
			const dFullEndDate = DateUtility.parseDateTime(dEndDate, dEndTime);

			const iDiffMs = dFullEndDate.getTime() - dFullStartDate.getTime(); 
			const iTotalHours = iDiffMs / (1000 * 60 * 60);
			const iRemainingHours = iTotalHours % 24;
			
			oClaimModel.setProperty("/claim_item/travel_duration_hour", Math.floor(iRemainingHours));
		},
		


	}
});