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
		* Checks if course has already used by user for a previously approved claim
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
		 * Calculate entitled meter cube value for Pengangkutan Laut claim type.
		 * Method retrieves employee master data, marital status, dependent (spouse) data,
		 * and meter cube configuration table to determine the total entitled meter cube
		 * based on predefined rules.
		 *
		 * Entitlement is derived from these components:
		 * - Base employee meter cube
		 * - Additional meter cube based on marital status (single/married)
		 * - Additional meter cube if employee has a spouse
		 *
		 * @public
		 * @param {string} sKey - Selected claim type key
		 * @param {object} oInputModel - Model storing claim item input values
		 * @param {object} oPropertyModel - Model controlling visibility/editability of UI fields
		 * @param {object} oSessionModel - Model containing user session information
		 * @returns {void} Does not return a value; updates claim item model properties directly
		 */
		onSelect_ClaimDetails_MeterCube: async function (sKey, oInputModel, oPropertyModel, oSessionModel) {

			const sEmpId = oSessionModel?.getProperty("/userId");
			if (sKey !== Constant.ClaimTypeItem.LAUT || !sEmpId) {
				return;
			}
			const oMar = Constant.MaritalStatus;
			const oCube = Constant.MeterCubeId;
			const oRel = Constant.RelationshipType;
			const aMaster = await Utility.getMeterCubeCalc("/ZEMP_MASTER", ["EEID"], [sEmpId]);
			const sMarital = aMaster?.[0]?.MARITAL;
			const aDep = await Utility.getMeterCubeCalc(
				"/ZEMP_DEPENDENT",
				["EMP_ID", "RELATIONSHIP"],
				[sEmpId, oRel.SPOUSE]
			);
			const bHasSpouse = aDep.length > 0;
			const aMeter = await Utility.getMeterCubeCalc("/ZMETER_CUBE");
			const fnGetCube = (sId) =>
				aMeter.find(oRow => oRow.METER_CUBE_ID === sId)?.METER_CUBE ?? 0;
			const aParts = [
				fnGetCube(oCube.EMPLOYEE),
				sMarital === oMar.SINGLE ? fnGetCube(oCube.SINGLE) : 0,
				sMarital === oMar.MARRIED ? fnGetCube(oCube.MARRIED) : 0,
				bHasSpouse ? fnGetCube(oCube.SPOUSE) : 0
			];
			const fTotal = aParts.reduce((sum, val) => sum + Number(val), 0);
			//final value
			oInputModel.setProperty("/claim_item/meter_cube_entitled", fTotal.toFixed(2));
			oPropertyModel.setProperty("/meter_cube_entitled/is_editable", false);
			oPropertyModel.setProperty("/meter_cube_entitled/is_visible", true);
		},

		/**
		 * Calculate claim amount for Pengangkutan Laut based on actual meter cube,
		 * entitled meter cube, and actual amount entered by user.
		 *
		 * Method reads relevant values from the input model, validates them,
		 * and applies the entitlement formula to derive the final payable amount.
		 *
		 * @public
		 * @param {object} oInputModel - JSON model containing claim item input values
		 * @returns {void} Updates "/claim_item/amount" in the model; no return value
		 */
		calculatePengangkutanLautAmount: function (oInputModel) {

			const sActualMC = oInputModel.getProperty("/claim_item/meter_cube_actual");
			const sActualAmount = oInputModel.getProperty("/claim_item/actual_amount");

			if (sActualMC === "" || sActualMC === null ||
				sActualAmount === "" || sActualAmount === null) {
				oInputModel.setProperty("/claim_item/amount", null);
				return;
			}

			const nActualMeterCube = Number(sActualMC);
			const nEntitledMeterCube = Number(oInputModel.getProperty("/claim_item/meter_cube_entitled"));

			const nActualAmount = Number(sActualAmount.toString().replace(/,/g, ""));

			if (isNaN(nActualMeterCube) || isNaN(nEntitledMeterCube) || isNaN(nActualAmount)) {
				oInputModel.setProperty("/claim_item/amount", null);
				return;
			}

			let nFinalAmount = 0;

			if (nActualMeterCube > nEntitledMeterCube) {
				nFinalAmount = (nActualAmount / nActualMeterCube) * nEntitledMeterCube;
			} else {
				nFinalAmount = nActualAmount;
			}

			oInputModel.setProperty("/claim_item/amount", nFinalAmount.toFixed(2));
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
		}
	}
});