sap.ui.define([
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/core/ValueState",
	"sap/ui/core/format/NumberFormat",
	"claima/utils/Constants",
	"claima/utils/Utility"
], function (MessageBox,
	Fragment,
	ValueState,
	NumberFormat,
	Constants,
	Utility) {
	"use strict";

	return {

		/* =========================================================
		* Eligibility Checking Function
		* ======================================================= */

		/**
		* Generate the payload needed for eligibility check
		* @public
		* @param {Object} oController - Object Model from Controller;
		* @param {String} sSubmissionType - Submission Type of the request E.g Claim or Request
		* @param {String} oClaimItemPayload - The claim item that the user wishes to duplicate in the claim submission
		* @returns {Object} Object Payload with results field in CheckFields List Array populated
		*/
		generateEligibilityCheckPayload(oController, sSubmissionType, oClaimItemPayload) {
			switch (sSubmissionType) {
				case Constants.SubmissionTypePrefix.REQUEST:
					var oItemData = oController._oReqModel.getProperty('/req_item');
					var aItemPartData = oController._oReqModel.getProperty('/participant');
					var sRecordId = oController._oReqModel.getProperty('/req_header/reqid');
					var sRecordSubId = oItemData?.req_subid || null;
					var sClaimType = oController._oReqModel.getProperty('/req_header/claimtype');
					var sClaimTypeItem = oItemData.claim_type_item_id;

					var oMapping = {
						// field                : db technical name
						"vehicle_ownership": "VEHICLE_OWNERSHIP_ID",
						"est_amount": "ELIGIBLE_AMOUNT",
						"cat_purpose": "MOBILE_PHONE_BILL",
						"sss": "REGION_ID",
						"no_of_days": "TRAVEL_DAYS_ID",
						"rate_per_kilometer": "RATE",
						"room_type": "ROOM_TYPE_ID",
						"flight_class": "FLIGHT_CLASS_ID",
						"marriage_cat": "MARRIAGE_CATEGORY",
						"fare_type": "FARE_TYPE_ID",
						"vehicle_class": "TRANSPORT_CLASS",
						"no_of_hours": "TRAVEL_HOURS",
						"no_of_traveler": "TOTAL_TRAVELLER",
						"trip_start_date": "RECEIPT_DATE",
						"lodging_cat": "LODGING_CATEGORY"
					};
					break;

				case Constants.SubmissionTypePrefix.CLAIM:
					var sEmpId = oController._oSessionModel.getProperty("/userId");
					const oHeaderModel = oController.getView().getModel("claimsubmission_input");
					const oItemModel = oController.getView().getModel("claimitem_input");
					var aItemPartData = [{ PARTICIPANTS_ID: sEmpId }];
					var oItemData = oItemModel?.getProperty('/claim_item') || oClaimItemPayload;
					var sRecordId = oHeaderModel.getProperty("/claim_header/claim_id");
					var sRecordSubId = oItemData?.claim_sub_id;
					var sClaimType = oHeaderModel.getProperty('/claim_header/claim_type_id');
					var sClaimTypeItem = oItemData.claim_type_item_id;
					var sAmount = sClaimTypeItem === Constants.ClaimTypeItem.PEM_PINDAH ? "actual_amount" : "amount" 
					var receipt_date = oItemData.receipt_date ? "receipt_date" : "bill_date"

					var oMapping = {
						// field                		: db technical name
						[sAmount]: "ELIGIBLE_AMOUNT",
						"no_of_days": "TRAVEL_DAYS_ID",
						"fare_type_id": "FARE_TYPE_ID",
						"vehicle_class_id": "TRANSPORT_CLASS",
						"flight_class": "FLIGHT_CLASS_ID",
						"room_type": "ROOM_TYPE_ID",
						"mobile_category_purpose_id": "MOBILE_PHONE_BILL",
						[receipt_date]: "RECEIPT_DATE",
						"no_of_hours": "TRAVEL_HOURS",
						"region" : "REGION_ID",
						"number_of_travellers": "TOTAL_TRAVELLER",
						"lodging_category": "LODGING_CATEGORY"
					};
					break;

				default:
					break;
			}

			const aActiveFields = Object.entries(oMapping).reduce((aCheckField, [sKey, sTargetName]) => {
				const sVal = oItemData[sKey];

				aCheckField.push({
					fieldName: sTargetName,
					value: String(sVal),
					result: null
				});
				return aCheckField;
			}, []);

			const aPayload = [];
			aItemPartData.forEach((row) => {
				if (row.PARTICIPANTS_ID) {
					var aNewActiveFields = aActiveFields.map(field => {
						var oNewField = { ...field };

						if (oNewField.fieldName === Constants.EntitiesFields.ELIGIBLE_AMOUNT && sSubmissionType === Constants.SubmissionTypePrefix.REQUEST) {
							oNewField.value = String(row.ALLOCATED_AMOUNT);
						}

						return oNewField;
					});

					// Push the payload using the NEW array, not the shared one
					aPayload.push({
						EmpId: row.PARTICIPANTS_ID,
						RecordId: sRecordId,
						RecordSubId: sRecordSubId,
						ClaimType: sClaimType,
						ClaimTypeItem: sClaimTypeItem,
						CheckFields: aNewActiveFields
					});
				}
			});

			return aPayload;
		},

		/**
		* Validation for eligibility
		* @public
		* @param {Object} oController - Object Model from Controller;
		* @param {String} aPayload - the generated payload from the EligibleScenarioCheck
		* @param {String} sSubmissionType - Submission Type of the request E.g Claim or Request
		* @returns {Boolean} Boolean to determine if there is an error with the checking
		*/
		eligibilityHandling: function (oController, aPayload, sSubmissionType) {
			let oDBToUIControlMap = {};

			switch (sSubmissionType) {
				case Constants.SubmissionTypePrefix.REQUEST:
					oDBToUIControlMap = {
						"VEHICLE_OWNERSHIP_ID": "i_vehicle_ownership",
						"ELIGIBLE_AMOUNT": "TABLE_ALLOC_AMOUNT", // <-- Special flag for table handling
						"MOBILE_PHONE_BILL": "i_category_purpose",
						"REGION_ID": "i_sss",
						"RATE": "i_rate_per_kilometer",
						"ROOM_TYPE_ID": "i_room_type",
						"FLIGHT_CLASS_ID": "i_flight_class",
						"MARRIAGE_CATEGORY": "i_marriage_cat",
						"TRANSPORT_CLASS": "i_vehicle_class"
					};
					break;

				case Constants.SubmissionTypePrefix.CLAIM:
					oDBToUIControlMap = {
						"ELIGIBLE_AMOUNT": "input_claimdetails_input_amount",
						"TRAVEL_DAYS_ID": "input_claimdetails_input_no_of_days",
						"FARE_TYPE_ID": "select_claimdetails_input_fare_type_id",
						"TRANSPORT_CLASS": "select_claimdetails_input_vehicle_class_id",
						"FLIGHT_CLASS_ID": "select_claimdetails_input_flight_class",
						"ROOM_TYPE_ID": "select_claimdetails_input_room_type",
						"MOBILE_PHONE_BILL": "select_claimdetails_input_mobile_category_purpose_id",
						"RECEIPT_DATE": "datepicker_claimdetails_input_receipt_date"
					};
					break;

				default:
					break;
			}

			const aErrorMessages = [];

			const getControl = (sId) => {
				if (!sId || sId === "TABLE_ALLOC_AMOUNT") return null;
				const oFormElement = Fragment.byId("request", sId) || oController.byId(sId);
				return oFormElement?.getFields?.()[0] || oFormElement;
			};

			Object.values(oDBToUIControlMap).forEach(sId => {
				if (sId === "TABLE_ALLOC_AMOUNT") {
					this._setTableValueState(oController, null, ValueState.None);
				} else {
					const oInputControl = getControl(sId);
					if (oInputControl?.setValueState) {
						oInputControl.setValueState(ValueState.None);
						oInputControl.setValueStateText("");
					}
				}
			});

			var oFloatFormat = NumberFormat.getFloatInstance({
				minFractionDigits: 2,
				maxFractionDigits: 2,
				groupingEnabled: true 
			});

			aPayload.forEach((oSinglePayload) => {
				const aCheckFields = oSinglePayload.CheckFields || [];
				const sEmpId = oSinglePayload.EmpId;
				const sClaimTypeItem = Constants.ClaimTypeItemDesc[oSinglePayload.ClaimTypeItem] || oSinglePayload.ClaimTypeItem;

				aCheckFields.forEach((oField) => {
					if (oField.result === true || oField.result === null) {
						return;
					}

					var sErrorField = Constants.ApprovalProcess[oField.fieldName] || oField.fieldName;
					let sErrorMsg;

					switch (oField.fieldName) {
						case Constants.EntitiesFields.ELIGIBLE_AMOUNT:
							sErrorMsg = Utility.getText("eligibility_validation_amount", [oFloatFormat.format(oField.result), sEmpId]);
							break;
						
						case Constants.EntitiesFields.TRAVEL_DAYS_ID:
							sErrorMsg = Utility.getText("eligibility_validation_travel_days", [oField.result, sClaimTypeItem, sEmpId]);
							break;

						case Constants.EntitiesFields.FLIGHT_CLASS_ID:
							sErrorMsg = Utility.getText("eligibility_validation_flight_class", [oField.value, sEmpId]);
							break;
					
						default:
							sErrorMsg = Utility.getText("eligibility_validation_default_msg", [sErrorField, sEmpId]);
							break;
					}
					if (!aErrorMessages.includes(sErrorMsg)) {
						aErrorMessages.push(sErrorMsg);
					}

					const sMappedId = oDBToUIControlMap[oField.fieldName];

					if (sMappedId === "TABLE_ALLOC_AMOUNT") {
						this._setTableValueState(oController, sEmpId, ValueState.Error);
					} else {
						const oInputControl = getControl(sMappedId);
						if (oInputControl?.setValueState) {
							oInputControl.setValueState(ValueState.Error);
						}
					}
				});
			});

			const bIsEligible = aErrorMessages.length === 0;

			if (!bIsEligible) {
				const sFormattedErrors = "• " + aErrorMessages[0];
				MessageBox.error(Utility.getText("req_e_validation_msg") + sFormattedErrors, {
					title: Utility.getText("req_e_validation_title"),
					actions: [MessageBox.Action.CLOSE]
				});
			}

			return bIsEligible;
		},

		_setTableValueState(oController, sEmpIdToMatch, sValueState) {
			const oTable = Fragment.byId("request", "req_participant_table") || oController.byId("req_participant_table");
			if (!oTable) return;

			oTable.getRows().forEach(oRow => {
				const oContext = oRow.getBindingContext("request");
				if (oContext) {
					const sRowEmpId = oContext.getProperty("PARTICIPANTS_ID");

					if (!sEmpIdToMatch || sRowEmpId === sEmpIdToMatch) {
						oRow.getCells().forEach(oCell => {
							if (oCell.getId().includes("alloc_amount") && oCell.setValueState) {
								oCell.setValueState(sValueState);
							}
						});
					}
				}
			});
		},

		checkElaunTukarEligibility: async function (oDataModel, bIsClaim) {
            const oFunction = oDataModel.bindContext("/checkElaunTukarEligible(...)");
			oFunction.setParameter("IS_CLAIM", bIsClaim);

            try {
                await oFunction.execute();
                const oContext  = oFunction.getBoundContext();
                return oContext.getObject().value; 

            } catch (oError) {
                return false;
            }
		}

	};
});