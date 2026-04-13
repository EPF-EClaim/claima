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
					for ( var iContext = 0; iContext < aContexts.length; iContext++ ) {
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
		* Retrieve start end dates for course code from db table, based on selected course code ID and user ID
		* Method retrieves db table to be checked with fields and values to be filtered against
		* if records found, first record is retrieved from the table and returns values from the record
		* @public
		* @param {string} sEmpId - employee ID to retrieve dependents for
		* @returns {integer} if records found, return total number of dependents for employee
		*/
		getNumberOfFamilyMembers: async function (sEmpId) {
			const oModel = this._oOwnerComponent.getModel();
			const oListBinding = oModel.bindList(Constant.Entities.ZEMP_DEPENDENT, null, [
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
		* Retrieve backend data from db table based on selected claim item value
		* Method retrieves db table to be checked with fields and values to be filtered against
		* if records found, first record is retrieved from the table and returns values from the record
		* @public
		* @param {string} sEntity - name of table to check from database
		* @param {array} aEntityFields - array of entity fields and values to filter by
		* @param {array} aRetrievalFields - array of entity fields to retrieve values from
		* @returns {array} if records found, returns array of values from first selected record; else, returns empty array
		*/
		setClaimItemValueFromSelection: async function (sEntity, aEntityFields, aRetrievalFields) {
			const oModel = this._oOwnerComponent.getModel();
			// set filters based on given entity fields
			var aSorters = [];
			var aFilters = [];
			for (var iEntityField = 0; iEntityField < aEntityFields.length; iEntityField++) {
				//// filter entity field to be checked by selection input or * (all)
				var oFilterEntityField = new Filter({
					filters: [
						new Filter(aEntityFields[iEntityField].entity_field, FilterOperator.EQ, aEntityFields[iEntityField].filter_value),
						new Filter(aEntityFields[iEntityField].entity_field, FilterOperator.EQ, '*')
					],
					and: false
				});
				aFilters.push(oFilterEntityField);
				aSorters.push(new Sorter(aEntityFields[iEntityField].entity_field, true));
			}
			// ensure status is active
			aFilters.push(
				new Filter("STATUS", FilterOperator.EQ, Constant.ClaimTypeItemStatus.ACTIVE),
				new Filter("START_DATE", FilterOperator.LE, DateUtility.getHanaDate(DateUtility.today())),
				new Filter("END_DATE", FilterOperator.GE, DateUtility.getHanaDate(DateUtility.today())),
			);
			const oListBinding = oModel.bindList(sEntity, null, aSorters, aFilters);

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					var aReturnFields = [];
					for (var iRetrievalField = 0; iRetrievalField < aRetrievalFields.length; iRetrievalField++) {
						aReturnFields.push(oData[aRetrievalFields[iRetrievalField]]);
					}
					return aReturnFields;
				} else {
					return [];
				}
			} catch (oError) {
				MessageBox.error(Utility.getText("msg_claimdetails_input_err", [oError]));
				return [];
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
				nDay = oClaimItemInputModel.getProperty("/claim_item/no_of_days") > 2? 2: oClaimItemInputModel.getProperty("/claim_item/no_of_days");
				nDependent = oClaimItemInputModel.getProperty("/claim_item/no_of_family_member");
			} else {
				nDay = oClaimItemInputModel.getProperty("/claim_item/travel_duration_day");
				nDependent = 0;
			}
			var nHour = oClaimItemInputModel.getProperty("/claim_item/travel_duration_hour");
			var sLocation = oClaimItemInputModel.getProperty("/claim_item/region");
			var sClaimtype = oClaimItemInputModel.getProperty("/claim_item/claim_type_id");
			var sClaimItem = oClaimItemInputModel.getProperty("/claim_item/claim_type_item_id");
			var nBreakfast = parseInt(oClaimItemInputModel.getProperty("/claim_item/provided_breakfast"));
			var nLunch = parseInt(oClaimItemInputModel.getProperty("/claim_item/provided_lunch"));
			var nDinner = parseInt(oClaimItemInputModel.getProperty("/claim_item/provided_dinner"));
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
			oContext.setParameter("tips", bTips);

			return oContext.execute()
				.then(() => oContext.requestObject());

		},

		determineDefaultCostCenter: async function (sClaimTypeId) {
			try {
				const oFunction = this._oOwnerComponent.getModel().bindContext("/checkDefaultCostCenter(...)");

				oFunction.setParameter("sClaimTypeId", sClaimTypeId);

				await oFunction.execute();

				const oContext = oFunction.getBoundContext();
				const oResult = oContext.getObject();

				return oResult.sCostCenter

			} catch (oError) {
				return null;
			}
		},

		/**
		 * Retrieve approved amount and marriage category data for user selecting Elaun Pengangkutan, based on Marital Status
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
				MessageToast.show(oError);
				dResult = 0.00;
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

			oContext.setParameter("empId",this._oOwnerComponent.getModel("session").getProperty("/userId"));
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

			oContext.setParameter("empId",this._oOwnerComponent.getModel("session").getProperty("/userId"));
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
		checkReusedPAR: async function(sRequestID) {
			const oModel = this._oView.getModel();
			const oContext = oModel.bindContext("/checkPreApprovalUsage(...)");
			oContext.setParameter("requestID", sRequestID);
			return oContext.execute().then(() => oContext.requestObject());
		},

		/**
		 * Calculate Matawang 3% fields (UI-only).
		 *
		 * @public
		 */
		calculateMatawangAmount: function () {
			const oSubmissionModel = this._oView.getModel("claimsubmission_input");
			const oInputModel = this._oView.getModel("claimitem_input");
			const oContext = this._oView.getModel().bindContext("/calculateMatawangAmount(...)");
			oContext.setParameter(
				"claimItems",
				JSON.stringify(oSubmissionModel.getProperty("/claim_items") || [])
			);
			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {

					const aClaimItems = oSubmissionModel.getProperty("/claim_items") || [];
					const iMatawangIndex = aClaimItems.findIndex(
						oItem => oItem.claim_type_item_id === Constant.ClaimTypeItem.MATAWANG
					);

					if (iMatawangIndex > -1) {
						oSubmissionModel.setProperty(
							`/claim_items/${iMatawangIndex}/percentage_compensation`,
							Constant.Percentage.THREE
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
							Constant.Percentage.THREE
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

			const aClaimItems = oSubmissionModel.getProperty("/claim_items") || [];

			const iMatawangIndex = aClaimItems.findIndex(
				oItem => oItem.claim_type_item_id === Constant.ClaimTypeItem.MATAWANG
			);

			if (iMatawangIndex === -1) { return; }

			const oMatawangItem = aClaimItems[iMatawangIndex];

			// Put Matawang item into input model
			oInputModel.setProperty("/claim_item", oMatawangItem);
			oInputModel.setProperty("/is_new", false);

			// Save using controller's existing save function
			return await fnSaveClaimItem();
		}
	}
});