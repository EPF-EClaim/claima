sap.ui.define([
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
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
	BusyIndicator,
	MessageBox,
	MessageToast,
	Constant,
	Utility,
	DateUtility
) {
	"use strict";

	// Claim-side utility module - mirrors RequestUtility.js's shape (one flat
	// file per domain: init + every scenario as a method on the singleton),
	// rather than splitting into several small files. Covers course-code/cost
	// center/PAR checks, entitlement auto-populate scenarios, and header/item
	// load-save mapping.

	function nonNan(n) {
		return isNaN(n) ? 0 : n;
	}

	/**
	 * Builds the ZCLAIM_ITEM OData payload from a claim item object. Single source
	 * of truth, replacing two independently-maintained ~90-field payload builders
	 * that used to live in ClaimSubmission.controller.js (_saveClaimItem, used when
	 * saving one item from the item-detail form, and _updateClaimItems, used to
	 * bulk-resync all items e.g. after a delete) which had drifted apart: missing
	 * POTONGAN_ELAUN/CASH_REPAY special-casing, wrong CURRENCY_RATE precision,
	 * RATE_PER_KM read from the wrong field, DEPENDENT double-stringified or not
	 * stringified depending on caller, and several fields silently dropped.
	 *
	 * Accepts either shape claim items take in this app: the live `claimitem_input`
	 * model's `/claim_item` (mid-edit; `dependent` may be an array, deserialized
	 * from DB for the multi-select control) or an entry from `claimsubmission_input`
	 * `/claim_items` (persisted shape; `dependent` is already the DB's JSON string).
	 *
	 * @param {object} oItem - claim_item object
	 * @param {object} [oHeader] - claim_header object, for the alternate_cost_center
	 *        fallback when the item has no cost_center of its own
	 * @returns {object} ZCLAIM_ITEM OData payload
	 */
	function buildItemPayload(oItem, oHeader) {
		const isSpecialGlItem = oItem.claim_type_item_id === Constant.ClaimTypeItem.PERSONAL_EXP ||
			oItem.claim_type_item_id === Constant.ClaimTypeItem.POTONGAN_ELAUN;

		return {
			CLAIM_ID: oItem.claim_id,
			CLAIM_SUB_ID: oItem.claim_sub_id,
			CLAIM_TYPE_ITEM_ID: oItem.claim_type_item_id,
			PERCENTAGE_COMPENSATION: nonNan(parseFloat(oItem.percentage_compensation)).toFixed(2),
			ACCOUNT_NO: oItem.account_no,
			AMOUNT: nonNan(parseFloat(oItem.amount)).toFixed(2),
			ATTACHMENT_FILE_1: oItem.attachment_file_1,
			ATTACHMENT_FILE_2: oItem.attachment_file_2,
			BILL_NO: oItem.bill_no,
			BILL_DATE: DateUtility.getHanaDate(oItem.bill_date),
			CLAIM_CATEGORY: oItem.claim_category,
			COUNTRY: oItem.country,
			DISCLAIMER: oItem.disclaimer,
			START_DATE: DateUtility.getHanaDate(oItem.start_date),
			END_DATE: DateUtility.getHanaDate(oItem.end_date),
			START_TIME: DateUtility.getHanaTime(oItem.start_time),
			END_TIME: DateUtility.getHanaTime(oItem.end_time),
			FLIGHT_CLASS: oItem.flight_class,
			FROM_LOCATION: oItem.from_location,
			FROM_LOCATION_OFFICE: oItem.from_location_office,
			KM: nonNan(parseFloat(oItem.km)).toFixed(2),
			LOCATION: oItem.location,
			LOCATION_TYPE: oItem.location_type,
			LODGING_CATEGORY: oItem.lodging_category,
			LODGING_ADDRESS: oItem.lodging_address,
			MARRIAGE_CATEGORY: oItem.marriage_category,
			AREA: oItem.area,
			NO_OF_FAMILY_MEMBER: oItem.no_of_family_member,
			PARKING: nonNan(parseFloat(oItem.parking)),
			PHONE_NO: oItem.phone_no,
			// the rate VALUE lives in descr.rate_per_km; the top-level rate_per_km
			// field holds the rate lookup's ID, not the decimal rate.
			RATE_PER_KM: oItem.descr ? oItem.descr.rate_per_km : oItem.rate_per_km,
			RECEIPT_DATE: DateUtility.getHanaDate(oItem.receipt_date),
			RECEIPT_NUMBER: oItem.receipt_number,
			REMARK: oItem.remark,
			ROOM_TYPE: oItem.room_type,
			REGION: oItem.region,
			FROM_STATE_ID: oItem.from_state_id,
			TO_STATE_ID: oItem.to_state_id,
			TO_LOCATION: oItem.to_location,
			TO_LOCATION_OFFICE: oItem.to_location_office,
			TOLL: nonNan(parseFloat(oItem.toll)).toFixed(2),
			TOTAL_EXP_AMOUNT: nonNan(parseFloat(oItem.total_exp_amount)).toFixed(2),
			VEHICLE_TYPE: oItem.vehicle_type,
			VEHICLE_FARE: oItem.vehicle_fare,
			TRIP_START_DATE: DateUtility.getHanaDate(oItem.trip_start_date),
			TRIP_END_DATE: DateUtility.getHanaDate(oItem.trip_end_date),
			EVENT_START_DATE: DateUtility.getHanaDate(oItem.event_start_date),
			EVENT_END_DATE: DateUtility.getHanaDate(oItem.event_end_date),
			TRAVEL_DURATION_DAY: nonNan(parseFloat(oItem.travel_duration_day)).toFixed(1),
			TRAVEL_DURATION_HOUR: nonNan(parseFloat(oItem.travel_duration_hour)).toFixed(1),
			PROVIDED_BREAKFAST: oItem.provided_breakfast?.toString(),
			PROVIDED_LUNCH: oItem.provided_lunch?.toString(),
			PROVIDED_DINNER: oItem.provided_dinner?.toString(),
			ENTITLED_BREAKFAST: oItem.entitled_breakfast?.toString(),
			ENTITLED_LUNCH: oItem.entitled_lunch?.toString(),
			ENTITLED_DINNER: oItem.entitled_dinner?.toString(),
			ANGGOTA_ID: oItem.anggota_id,
			ANGGOTA_NAME: oItem.anggota_name,
			DEPENDENT_NAME: oItem.dependent_name,
			TYPE_OF_PROFESSIONAL_BODY: oItem.type_of_professional_body,
			DISCLAIMER_GALAKAN: oItem.disclaimer_galakan,
			TRANSFER_DATE: DateUtility.getHanaDate(oItem.transfer_date),
			NO_OF_DAYS: oItem.no_of_days,
			FAMILY_COUNT: oItem.family_count,
			FUNERAL_TRANSPORTATION: oItem.funeral_transportation,
			ROUND_TRIP: oItem.round_trip,
			TRIP_END_TIME: DateUtility.getHanaTime(oItem.trip_end_time),
			TRIP_START_TIME: DateUtility.getHanaTime(oItem.trip_start_time),
			COST_CENTER: isSpecialGlItem ? null : (oItem.cost_center || oHeader?.alternate_cost_center),
			GL_ACCOUNT: isSpecialGlItem
				? Constant.StatementDueInfo.GL_CODE
				: (oItem.claim_type_item_id === Constant.ClaimTypeItem.CASH_REPAY ? Constant.Default.CASH_REPAY_GL : oItem.gl_account),
			MATERIAL_CODE: isSpecialGlItem ? null : oItem.material_code,
			VEHICLE_OWNERSHIP_ID: oItem.vehicle_ownership_id,
			ACTUAL_AMOUNT: nonNan(parseFloat(oItem.actual_amount)).toFixed(2),
			ARRIVAL_TIME: oItem.arrival_time ? new Date(oItem.arrival_time).toISOString() : null,
			CLAIM_TYPE_ID: oItem.claim_type_id,
			COURSE_TITLE: oItem.course_title,
			CURRENCY_AMOUNT: nonNan(parseFloat(oItem.currency_amount)).toFixed(2),
			CURRENCY_CODE: oItem.currency_code,
			CURRENCY_RATE: nonNan(parseFloat(oItem.currency_rate)).toFixed(4),
			DEPARTURE_TIME: oItem.departure_time ? new Date(oItem.departure_time).toISOString() : null,
			// already a JSON string when it comes from the claim_items summary array
			// (as persisted); still an array when it comes from the live item-detail
			// form's multi-select binding (deserialized on load) - stringify only then.
			DEPENDENT: typeof oItem.dependent === "string" ? oItem.dependent : JSON.stringify(oItem.dependent),
			EMP_ID: oItem.emp_id,
			FARE_TYPE_ID: oItem.fare_type_id,
			INSURANCE_CERT_END_DATE: DateUtility.getHanaDate(oItem.insurance_cert_end_date),
			INSURANCE_CERT_START_DATE: DateUtility.getHanaDate(oItem.insurance_cert_start_date),
			INSURANCE_PACKAGE_ID: oItem.insurance_package_id,
			INSURANCE_PROVIDER_ID: oItem.insurance_provider_id,
			INSURANCE_PROVIDER_NAME: oItem.insurance_provider_name,
			INSURANCE_PURCHASE_DATE: DateUtility.getHanaDate(oItem.insurance_purchase_date),
			METER_CUBE_ACTUAL: nonNan(parseFloat(oItem.meter_cube_actual)).toFixed(2),
			METER_CUBE_ENTITLED: nonNan(parseFloat(oItem.meter_cube_entitled)).toFixed(2),
			MOBILE_CATEGORY_PURPOSE_ID: oItem.mobile_category_purpose_id,
			NEED_FOREIGN_CURRENCY: oItem.need_foreign_currency,
			POLICY_NUMBER: oItem.policy_number,
			PURPOSE: oItem.purpose,
			REQUEST_APPROVAL_AMOUNT: oItem.request_approval_amount,
			STUDY_LEVELS_ID: oItem.study_levels_id,
			TRAVEL_DAYS_ID: oItem.travel_days_id,
			VEHICLE_CLASS_ID: oItem.vehicle_class_id,
			DAILY_ALLOWANCE: nonNan(parseInt(oItem.daily_allowance)),
			TIPS: nonNan(parseInt(oItem.tips)),
			EXCLUDE_TIPS: oItem.exclude_tips,
			TOTAL_TRAVELLER: oItem.number_of_travellers,
			DEPENDENT_TYPE_ID: oItem.dependent_type,
			INTERNAL_ORDER: oItem.internal_order,
			COURSE_DURATION: oItem.course_duration,
			CHARGED_TO_CCC: isSpecialGlItem ? true : !!oItem.charged_to_ccc,
			POLICY_START_DATE: DateUtility.getHanaDate(oItem.policy_start_date),
			POLICY_END_DATE: DateUtility.getHanaDate(oItem.policy_end_date),
			DEPENDENT_NATIONAL_ID: oItem.dependent_national_id,
			INSURANCE_MEDICAL_PROVIDER_ID: oItem.insurance_medical_provider_id,
			INSURANCE_MEDICAL_PROVIDER_NAME: oItem.insurance_medical_provider_name,
			ATTACHMENT_FILE_3: oItem.attachment_file_3,
			ATTACHMENT_FILE_4: oItem.attachment_file_4,
			POLICY_YEAR: oItem.policy_year
		};
	}

	/**
	 * Maps raw ZEMP_CLAIM_ITEM_VIEW rows to the flat item structure the
	 * fragment binds against. `descr` starts empty - filled separately by
	 * `applyClaimItemDescr` from the same raw rows.
	 */
	function mapClaimItems(aRawItems) {
		return aRawItems.map(it => ({
			claim_id: it.CLAIM_ID,
			claim_sub_id: it.CLAIM_SUB_ID,
			claim_type_item_id: it.CLAIM_TYPE_ITEM_ID,
			charged_to_ccc: !!it.CHARGED_TO_CCC,
			percentage_compensation: it.PERCENTAGE_COMPENSATION,
			account_no: it.ACCOUNT_NO,
			amount: it.AMOUNT != null ? parseFloat(it.AMOUNT) : 0,
			attachment_file_1: it.ATTACHMENT_FILE_1,
			attachment_file_2: it.ATTACHMENT_FILE_2,
			bill_no: it.BILL_NO,
			bill_date: it.BILL_DATE,
			claim_category: it.CLAIM_CATEGORY,
			country: it.COUNTRY,
			disclaimer: it.DISCLAIMER,
			start_date: it.START_DATE,
			end_date: it.END_DATE,
			start_time: it.START_TIME,
			end_time: it.END_TIME,
			flight_class: it.FLIGHT_CLASS,
			from_location: it.FROM_LOCATION,
			from_location_office: it.FROM_LOCATION_OFFICE,
			km: it.KM,
			location: it.LOCATION,
			location_type: it.LOCATION_TYPE,
			lodging_category: it.LODGING_CATEGORY,
			lodging_address: it.LODGING_ADDRESS,
			marriage_category: it.MARRIAGE_CATEGORY,
			area: it.AREA,
			no_of_family_member: it.NO_OF_FAMILY_MEMBER,
			parking: it.PARKING,
			phone_no: it.PHONE_NO,
			rate_per_km: it.RATE_PER_KM,
			receipt_date: it.RECEIPT_DATE,
			receipt_number: it.RECEIPT_NUMBER,
			remark: it.REMARK,
			room_type: it.ROOM_TYPE,
			region: it.REGION,
			from_state_id: it.FROM_STATE_ID,
			to_state_id: it.TO_STATE_ID,
			to_location: it.TO_LOCATION,
			to_location_office: it.TO_LOCATION_OFFICE,
			toll: it.TOLL,
			total_exp_amount: it.TOTAL_EXP_AMOUNT,
			vehicle_type: it.VEHICLE_TYPE,
			vehicle_fare: it.VEHICLE_FARE,
			trip_start_date: it.TRIP_START_DATE,
			trip_end_date: it.TRIP_END_DATE,
			event_start_date: it.EVENT_START_DATE,
			event_end_date: it.EVENT_END_DATE,
			travel_duration_day: it.TRAVEL_DURATION_DAY,
			travel_duration_hour: it.TRAVEL_DURATION_HOUR,
			provided_breakfast: it.PROVIDED_BREAKFAST,
			provided_lunch: it.PROVIDED_LUNCH,
			provided_dinner: it.PROVIDED_DINNER,
			entitled_breakfast: it.ENTITLED_BREAKFAST,
			entitled_lunch: it.ENTITLED_LUNCH,
			entitled_dinner: it.ENTITLED_DINNER,
			dependent_type: it.DEPENDENT_TYPE_ID,
			anggota_id: it.ANGGOTA_ID,
			anggota_name: it.ANGGOTA_NAME,
			dependent_name: it.DEPENDENT_NAME,
			dependent: it.DEPENDENT,
			type_of_professional_body: it.TYPE_OF_PROFESSIONAL_BODY,
			disclaimer_galakan: it.DISCLAIMER_GALAKAN,
			mode_of_transfer: it.MODE_OF_TRANSFER,
			travel_alone_family: it.TRAVEL_ALONE_FAMILY,
			travel_family_now_later: it.TRAVEL_FAMILY_NOW_LATER,
			transfer_date: it.TRANSFER_DATE,
			no_of_days: it.NO_OF_DAYS,
			family_count: it.FAMILY_COUNT,
			funeral_transportation: it.FUNERAL_TRANSPORTATION,
			round_trip: it.ROUND_TRIP,
			trip_end_time: it.TRIP_END_TIME,
			trip_start_time: it.TRIP_START_TIME,
			cost_center: it.COST_CENTER,
			gl_account: it.GL_ACCOUNT,
			material_code: it.MATERIAL_CODE,
			vehicle_ownership_id: it.VEHICLE_OWNERSHIP_ID,
			actual_amount: it.ACTUAL_AMOUNT,
			arrival_time: it.ARRIVAL_TIME,
			claim_type_id: it.CLAIM_TYPE_ID,
			course_title: it.COURSE_TITLE,
			currency_amount: it.CURRENCY_AMOUNT,
			currency_code: it.CURRENCY_CODE,
			currency_rate: it.CURRENCY_RATE,
			departure_time: it.DEPARTURE_TIME,
			emp_id: it.EMP_ID,
			fare_type_id: it.FARE_TYPE_ID,
			insurance_cert_end_date: it.INSURANCE_CERT_END_DATE,
			insurance_cert_start_date: it.INSURANCE_CERT_START_DATE,
			insurance_package_id: it.INSURANCE_PACKAGE_ID,
			insurance_provider_id: it.INSURANCE_PROVIDER_ID,
			insurance_provider_name: it.INSURANCE_PROVIDER_NAME,
			insurance_purchase_date: it.INSURANCE_PURCHASE_DATE,
			meter_cube_actual: it.METER_CUBE_ACTUAL,
			meter_cube_entitled: it.METER_CUBE_ENTITLED,
			mobile_category_purpose_id: it.MOBILE_CATEGORY_PURPOSE_ID,
			need_foreign_currency: it.NEED_FOREIGN_CURRENCY,
			policy_number: it.POLICY_NUMBER,
			purpose: it.PURPOSE,
			request_approval_amount: it.REQUEST_APPROVAL_AMOUNT,
			study_levels_id: it.STUDY_LEVELS_ID,
			travel_days_id: it.TRAVEL_DAYS_ID,
			vehicle_class_id: it.VEHICLE_CLASS_ID,
			daily_allowance: it.DAILY_ALLOWANCE,
			tips: it.TIPS,
			exclude_tips: it.EXCLUDE_TIPS,
			number_of_travellers: it.TOTAL_TRAVELLER,
			internal_order: it.INTERNAL_ORDER,
			course_duration: it.COURSE_DURATION,
			insurance_medical_provider_id: it.INSURANCE_MEDICAL_PROVIDER_ID,
			insurance_medical_provider_name: it.INSURANCE_MEDICAL_PROVIDER_NAME,
			policy_start_date: it.POLICY_START_DATE,
			policy_end_date: it.POLICY_END_DATE,
			dependent_national_id: it.DEPENDENT_NATIONAL_ID,
			previous_policy_number: it.PREVIOUS_POLICY_NUMBER,
			current_policy_number: it.CURRENT_POLICY_NUMBER,
			next_policy_number: it.NEXT_POLICY_NUMBER,
			attachment_file_3: it.ATTACHMENT_FILE_3,
			attachment_file_4: it.ATTACHMENT_FILE_4,
			policy_year: it.POLICY_YEAR,
			descr: {}
		}));
	}

	/**
	 * Maps each raw item row's *_DESC (and related) fields to the `descr`
	 * sub-object the fragment expects, and writes it onto /claim_items/{i}/descr.
	 * Uses the same raw rows already fetched for item values - no second query.
	 */
	function applyClaimItemDescr(oClaimSubmissionModel, aRawItems) {
		const aItemsD = aRawItems.map(it => ({
			claim_type_item_id: it.CLAIM_TYPE_ITEM_DESC,
			claim_category: it.CLAIM_CATEGORY_DESC,
			country: it.COUNTRY_DESC,
			flight_class: it.FLIGHT_CLASS_DESC,
			from_location_office: null,
			location_type: it.LOC_TYPE_DESC,
			lodging_category: it.LODGING_CATEGORY_DESC,
			marriage_category: it.MARRIAGE_CATEGORY_DESC,
			area: it.AREA_DESC,
			rate_per_km: it.RATE_PER_KM,
			room_type: it.ROOM_TYPE_DESC,
			region: it.REGION_DESC,
			from_state_id: null,
			to_state_id: null,
			to_location_office: null,
			vehicle_type: it.VEHICLE_TYPE_DESC,
			type_of_professional_body: null,
			no_of_days: null,
			funeral_transportation: null,
			material_code: null,
			vehicle_ownership_id: it.VEHICLE_OWNERSHIP_DESC,
			fare_type_id: null,
			insurance_package_id: null,
			insurance_provider_id: null,
			meter_cube_entitled: null,
			mobile_category_purpose_id: null,
			study_levels_id: null,
			claim_type_id: it.CLAIM_TYPE_DESC,
			vehicle_class_id: null,
			attachment_file_1: null,
			attachment_file_2: null,
			mode_of_transfer: it.TRANSFER_MODE_DESC,
			travel_alone_family: it.TRAVEL_TYPE_DESC,
			travel_family_now_later: it.FAMILY_TIMING_DESC,
			attachment_file_3: null,
			attachment_file_4: null
		}));

		aItemsD.forEach((oDescr, i) => {
			oClaimSubmissionModel.setProperty("/claim_items/" + i + "/descr", oDescr);
		});
	}

	/**
	 * Single source of truth for "what does this claim's status_id allow", replacing
	 * independent DRAFT/SEND_BACK re-derivations previously scattered across
	 * ClaimSubmission.controller.js (_onMatched, _afterLoadFragments x2, _loadClaimById,
	 * _applyClaimHeader, and the header fragment's own XML binding).
	 *
	 * Today only DRAFT and SEND_BACK are actually editable - every other status
	 * collapses to the same view-only/approval-log-visible behavior. That business
	 * decision (what PENDING_APPROVAL/REJECTED/APPROVED/COMPLETED_DISBURSEMENT/
	 * CANCELLED should each individually allow or display) is explicitly out of
	 * scope for this pass - the point of this function is that changing it later is a
	 * one-line edit here instead of finding every call site again.
	 *
	 * @param {string} sStatusId - claim_header/status_id (one of Constant.ClaimStatus)
	 * @returns {object} { isEditableStatus, showApprovalLog, baseFooterMode }
	 */
	function getStatusPolicy(sStatusId) {
		switch (sStatusId) {
			case Constant.ClaimStatus.DRAFT:
				return {
					isEditableStatus: true,
					showApprovalLog: false,
					baseFooterMode: Constant.ClaimFooterMode.SUMMARY
				};

			case Constant.ClaimStatus.SEND_BACK:
				return {
					isEditableStatus: true,
					showApprovalLog: true,
					baseFooterMode: Constant.ClaimFooterMode.SUMMARY
				};

			case Constant.ClaimStatus.PENDING_APPROVAL:
			case Constant.ClaimStatus.REJECTED:
			case Constant.ClaimStatus.APPROVED:
			case Constant.ClaimStatus.COMPLETED_DISBURSEMENT:
			case Constant.ClaimStatus.CANCELLED:
			default:
				// Every other status (including an unrecognized one) is view-only,
				// matching today's "not DRAFT and not SEND_BACK -> view_only" rule.
				return {
					isEditableStatus: false,
					showApprovalLog: true,
					baseFooterMode: Constant.ClaimFooterMode.VIEW_ONLY
				};
		}
	}

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
		checkExistingCourseCode: async function (sCourseCode, sSessionNumber, sParticipantId, sClaimId) {
			const oModel = this._oOwnerComponent.getModel();
			// filter by claim status (approved, pending approval)
			const oFilterRoleId = new Filter({
				filters: [
					new Filter("STATUS_ID", FilterOperator.NE, Constant.ClaimStatus.CANCELLED),
					new Filter("STATUS_ID", FilterOperator.NE, Constant.ClaimStatus.REJECTED)
				],
				and: true
			});

			const aFilters = [
				// check if claim exists with following
				new Filter("COURSE_CODE", FilterOperator.EQ, sCourseCode),
				new Filter("SESSION_NUMBER", FilterOperator.EQ, sSessionNumber),
				new Filter("EMP_ID", FilterOperator.EQ, sParticipantId),
				oFilterRoleId
			];

			if (sClaimId) {
				aFilters.push(new Filter("CLAIM_ID", FilterOperator.NE, sClaimId));
			};

			const oListBinding = oModel.bindList(Constant.Entities.ZCLAIM_HEADER, null, null, aFilters);

			try {
				BusyIndicator.show(0);
				const aContexts = await oListBinding.requestContexts(0, Infinity);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData.STATUS_ID;
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
			if ([Constant.ClaimType.KURSUS_DLM_NEGARA,
			Constant.ClaimType.DLM_NEGARA,
			Constant.ClaimType.KURSUS_LUAR_NEGARA,
			Constant.ClaimType.LUAR_NEGARA,
			Constant.ClaimType.ELAUN_TUKAR
			].includes(sClaimTypeId) &&
				sClaimTypeItemId === Constant.ClaimTypeItem.TAMBANG) {
				aFilters.push(new Filter("FARE_TYPE_ID", FilterOperator.NE, Constant.FareType.FLIGHT));
			}
			return aFilters;
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
		 * Fetch entitlement amount from the backend function
		 * @public
		 * @param {sap.ui.model.json.JSONModel} oClaimItemInputModel Claim item input
		 */
		fetchAndApplyEntitlement: function (oClaimItemInputModel, oSubmissionModel) {
			var nDay, nDependent;

			if ((oClaimItemInputModel.getProperty("/claim_item/claim_type_item_id") === Constant.ClaimTypeItem.MKN_LOAN)) {
				nDay = oClaimItemInputModel.getProperty("/claim_item/no_of_days") > 2 ? 2 : oClaimItemInputModel.getProperty("/claim_item/no_of_days");
				nDependent = oClaimItemInputModel.getProperty("/claim_item/no_of_family_member") ? oClaimItemInputModel.getProperty("/claim_item/no_of_family_member") : 1;
			} else if (oClaimItemInputModel.getProperty("/claim_item/claim_type_item_id") === Constant.ClaimTypeItem.MKN_TUKAR) {
				if (oSubmissionModel.getProperty("/claim_header/travel_family_now_later") == Constant.TravelWithFamilyNowOrLater.NOW_DESC ||
					oSubmissionModel.getProperty("/claim_header/travel_family_now_later") == Constant.TravelWithFamilyNowOrLater.NOW) {
					nDay = oClaimItemInputModel.getProperty("/claim_item/no_of_days");
					nDependent = oClaimItemInputModel.getProperty("/claim_item/number_of_travellers") ? oClaimItemInputModel.getProperty("/claim_item/number_of_travellers") : oClaimItemInputModel.getProperty("/claim_item/no_of_family_member");
				} else {
					nDay = oClaimItemInputModel.getProperty("/claim_item/no_of_days");
					nDependent = 1;

				}
			}
			else {
				nDay = oClaimItemInputModel.getProperty("/claim_item/travel_duration_day");
				nDependent = 1;
			}
			//get total hours based on diffrence hour + day
			var nHour = (nDay * 24) + oClaimItemInputModel.getProperty("/claim_item/travel_duration_hour");
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
		 * Retrieve eligible amount for user selecting lodging claim type item, based on Employee Grade
		 * @public
		 * @return {Decimal} - returns eligible amount retrieved from table
		 */
		fetchUserAmountLodging: async function () {
			const oInputModel = this._oView.getModel("claimitem_input");
			const sClaimType = oInputModel.getProperty("/claim_item/claim_type_id");
			const sClaimTypeItem = oInputModel.getProperty("/claim_item/claim_type_item_id");

			// get eligible amount based on current user
			var dResult = 0.00;
			try {
				BusyIndicator.show(0);
				const oFunction = this._oOwnerComponent.getModel().bindContext("/getUserEligibleAmountLodging(...)");

				oFunction.setParameter("sClaimType", sClaimType);
				oFunction.setParameter("sClaimTypeItem", sClaimTypeItem);

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
				case Constant.ClaimTypeItem.LOD_TUKAR:
					if (oSubmissionModel.getProperty("/claim_header/travel_family_now_later") == Constant.TravelWithFamilyNowOrLater.NOW_DESC ||
						oSubmissionModel.getProperty("/claim_header/travel_family_now_later") == Constant.TravelWithFamilyNowOrLater.NOW) {
						var dResult = parseFloat(dEligibleAmount) * iNoOfDays * iNoOfFamilyMembers;
					} else {
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
			if (!oInputModel) {
				oInputModel = this._oView.getModel("claimitem_input");
			}
			var aSelectedDependents = oInputModel.getProperty("/claim_item/dependents") || [];
			const oContext = this._oView.getModel().bindContext("/getMeterCubeEntitlement(...)");

			oContext.setParameter("selectedDependents", aSelectedDependents);

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
			if (!oInputModel) {
				oInputModel = this._oView.getModel("claimitem_input");
			}

			var aSelectedDependents = oInputModel.getProperty("/claim_item/dependent") || [];
			const oContext = this._oView.getModel().bindContext("/calculatePengangkutanLautAmount(...)");
			oContext.setParameter("actualMeterCube", oInputModel.getProperty("/claim_item/meter_cube_actual"));
			oContext.setParameter("actualAmount", oInputModel.getProperty("/claim_item/actual_amount"));
			oContext.setParameter("selectedDependents", aSelectedDependents);

			return oContext.execute()
				.then(() => oContext.requestObject())
				.then((oResult) => {
					oInputModel.setProperty("/claim_item/meter_cube_entitled", oResult.entitled);
					oInputModel.setProperty("/claim_item/amount", oResult.amount);
				});
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
					if (oInputModel.getProperty("/claim_item/claim_type_item_id") === Constant.ClaimTypeItem.PEM_PINDAH) {
						oInputModel.setProperty("/claim_item/actual_amount", oResult.fAmount);
						oInputModel.setProperty("/claim_item/amount", oResult.fFinalAmount);
					} else {
						oInputModel.setProperty("/claim_item/amount", oResult.fAmount);
					}

				});
		},
		getFuneralTransportEligibleAmount: async function (sTransportPassingID, sClaimTypeItem, sClaimType) {
			const oContext = this._oView.getModel().bindContext("/getJenazahEligibleAmount(...)");

			oContext.setParameter("sTransportPassingID", sTransportPassingID);
			oContext.setParameter("sClaimType", sClaimType);
			oContext.setParameter("sClaimTypeItem", sClaimTypeItem);
			try {
				await oContext.execute();
				// Read return value
				const oResult = await oContext.requestObject();
				return oResult.iAmount;
			}
			catch (oError) {
				return 0;
			}
		},

		getCeramahEligibleAmount: async function (fDurationMinute) {
			if (!fDurationMinute || fDurationMinute <= 0) {
                MessageBox.error(Utility.getText("ceramah_duration_must_be_greater_than_zero"));
                return 0;
            }
			var fDurationHour = parseFloat((fDurationMinute) / 60).toFixed(2);
			const oContext = this._oView.getModel().bindContext("/getCeramahEntitlement(...)");
			oContext.setParameter("fDuration", fDurationHour);

			try {
				await oContext.execute();
				const oResult = await oContext.requestObject();
				return oResult.iAmount;
			}
			catch (oError) {
				return 0;
			}
		},

		getBantuanKematianEligibleAmount: async function (sDependentType) {
			const oContext = this._oView.getModel().bindContext("/getBantuanKebajikanKematianAmount(...)");
			oContext.setParameter("sDependentType", sDependentType);
			try {
				await oContext.execute();
				const oResult = await oContext.requestObject();
				return oResult.value;
			}
			catch (oError) {
				return 0;
			}
		},

		/**
		 * Maps a raw ZEMP_CLAIM_HEADER_VIEW row to the flat form shape the
		 * claimsubmission_input/claim header fragments bind against.
		 * @public
		 * @param {object} oHeaderRaw - raw header row
		 * @returns {object} mapped header
		 */
		mapClaimHeaderToForm: function (oHeaderRaw) {
            return {
                claim_id: oHeaderRaw.CLAIM_ID,
                emp_id: oHeaderRaw.EMP_ID,
                purpose: oHeaderRaw.PURPOSE,
                trip_start_date: oHeaderRaw.TRIP_START_DATE,
                trip_end_date: oHeaderRaw.TRIP_END_DATE,
                event_start_date: oHeaderRaw.EVENT_START_DATE,
                event_end_date: oHeaderRaw.EVENT_END_DATE,
                submission_type: oHeaderRaw.SUBMISSION_TYPE,
                comment: oHeaderRaw.COMMENT,
                alternate_cost_center: oHeaderRaw.ALTERNATE_COST_CENTER,
                cost_center: oHeaderRaw.COST_CENTER,
                request_id: oHeaderRaw.REQUEST_ID,
                attachment_email_approver: oHeaderRaw.ATTACHMENT_EMAIL_APPROVER,
                status_id: oHeaderRaw.STATUS_ID,
                claim_type_id: oHeaderRaw.CLAIM_TYPE_ID,
                total_claim_amount: oHeaderRaw.TOTAL_CLAIM_AMOUNT,
                final_amount_to_receive: oHeaderRaw.FINAL_AMOUNT_TO_RECEIVE,
                last_modified_date: oHeaderRaw.LAST_MODIFIED_DATE,
                submitted_date: oHeaderRaw.SUBMITTED_DATE,
                last_approved_date: oHeaderRaw.LAST_APPROVED_DATE,
                last_approved_time: oHeaderRaw.LAST_APPROVED_TIME,
                payment_date: oHeaderRaw.PAYMENT_DATE,
                location: oHeaderRaw.LOCATION,
                spouse_office_address: oHeaderRaw.SPOUSE_OFFICE_ADDRESS,
                house_completion_date: oHeaderRaw.HOUSE_COMPLETION_DATE,
                move_in_date: oHeaderRaw.MOVE_IN_DATE,
                housing_loan_scheme: oHeaderRaw.HOUSING_LOAN_SCHEME,
                lender_name: oHeaderRaw.LENDER_NAME,
                specify_details: oHeaderRaw.SPECIFY_DETAILS,
                new_house_address: oHeaderRaw.NEW_HOUSE_ADDRESS,
                dist_old_house_to_office_km: oHeaderRaw.DIST_OLD_HOUSE_TO_OFFICE_KM,
                dist_old_house_to_new_house_km: oHeaderRaw.DIST_OLD_HOUSE_TO_NEW_HOUSE_KM,
                approver1: null,
                approver2: null,
                approver3: null,
                approver4: null,
                approver5: null,
                last_push_back_date: null,
                course_code: oHeaderRaw.COURSE_CODE,
                session_number: oHeaderRaw.SESSION_NUMBER,
                project_code: oHeaderRaw.PROJECT_CODE,
                cash_advance_amount: oHeaderRaw.CASH_ADVANCE_AMOUNT,
                preapproved_amount: oHeaderRaw.PREAPPROVED_AMOUNT,
                reject_reason_id: null,
                push_back_reason_id: null,
                last_push_back_time: null,
                reject_reason_date: null,
                reject_reason_time: null,
                mode_of_transfer: oHeaderRaw.TRANSFER_MODE_DESC,
                travel_alone_family: oHeaderRaw.TRAVEL_TYPE_DESC,
                travel_family_now_later: oHeaderRaw.FAMILY_TIMING_DESC,
                mode_of_transfer_id: oHeaderRaw.MODE_OF_TRANSFER,
                card_no: oHeaderRaw.CARD_NO,
                card_advance_amount: oHeaderRaw.CCC_ADV_AMT,
                original_card_advance_amount: oHeaderRaw.CCC_ADV_AMT,
                descr: {
                    submission_type: null,
                    alternate_cost_center: oHeaderRaw.ALT_COST_CENTER_DESC,
                    cost_center: oHeaderRaw.COST_CENTER_DESC,
                    request_id: null,
                    status_id: oHeaderRaw.STATUS_DESC,
                    claim_type_id: oHeaderRaw.CLAIM_TYPE_DESC,
                    housing_loan_scheme: oHeaderRaw.HOUSING_LOAN_SCHEME_DESC,
                    lender_name: oHeaderRaw.LENDER_DESC,
                    course_code: oHeaderRaw.COURSE_CODE_DESC,
                    project_code: oHeaderRaw.PROJECT_DESC,
                    attachment_email_approver: null,
                    mode_of_transfer: oHeaderRaw.TRANSFER_MODE_DESC,
                    travel_alone_family: oHeaderRaw.TRAVEL_TYPE_DESC,
                    travel_family_now_later: oHeaderRaw.FAMILY_TIMING_DESC,
                }
            };
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

		buildItemPayload: buildItemPayload,
		mapClaimItems: mapClaimItems,
		applyClaimItemDescr: applyClaimItemDescr,
		getStatusPolicy: getStatusPolicy

	};
});
