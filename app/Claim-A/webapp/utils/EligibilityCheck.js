sap.ui.define([
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/core/ValueState",
	"claima/utils/Constants"
], function (MessageBox, Fragment, ValueState, Constants) {
    "use strict";

    return {

		/* =========================================================
		* Eligibility Checking Function
		* ======================================================= */

		generateEligibilityCheckPayload (oController, sSubmissionType) {
			var sEmpId			= oController._oSessionModel.getProperty("/userId")

			switch (sSubmissionType) {
				case Constants.SubmissionTypePrefix.REQUEST:
					var oItemData		= oController._oReqModel.getProperty('/req_item');
					var sClaimType		= oController._oReqModel.getProperty('/req_header/claimtype');
					var sClaimTypeItem	= oItemData.claim_type_item_id;

					var oMapping = {
						// field                : db technical name
						"vehicle_ownership"     : "VEHICLE_OWNERSHIP_ID",
						"est_amount"            : "ELIGIBLE_AMOUNT",
						"cat_purpose"           : "MOBILE_PHONE_BILL",
						"sss"                   : "REGION_ID",
						"no_of_days"            : "TRAVEL_DAYS_ID",
						"rate_per_kilometer"    : "RATE",
						"room_type"             : "ROOM_TYPE_ID",
						"flight_class"          : "FLIGHT_CLASS_ID",
						"marriage_cat"          : "MARRIAGE_CATEGORY",
						"vehicle_class"         : "TRANSPORT_CLASS",
						"no_of_hours"          	: "TRAVEL_HOURS"
					};
					break;

				case Constants.SubmissionTypePrefix.CLAIM:
					const oHeaderModel 	= oController.getView().getModel("claimsubmission_input");
					const oItemModel 	= oController.getView().getModel("claimitem_input");
					var oItemData		= oItemModel.getProperty('/claim_item');
					var sClaimType		= oHeaderModel.getProperty('/claim_header/claim_type_id');
					var sClaimTypeItem	= oItemData.claim_type_item_id;

					var oMapping = {
						// field                		: db technical name
						"amount"            			: "ELIGIBLE_AMOUNT",
						"no_of_days"           			: "TRAVEL_DAYS_ID",
						"fare_type_id"          		: "FARE_TYPE_ID",
						"vehicle_class_id"      		: "TRANSPORT_CLASS",
						"flight_class"          		: "FLIGHT_CLASS_ID",
						"room_type"          			: "ROOM_TYPE_ID",
						"mobile_category_purpose_id"	: "MOBILE_PHONE_BILL"
					};
					break;
			
				default:
					break;
			}

			const aActiveFields = Object.entries(oMapping).reduce((acc, [sKey, sTargetName]) => {
				const val = oItemData[sKey];
				
				// const bIsValid = val !== null && val !== undefined;

				// if (bIsValid) {
					acc.push({
						fieldName: sTargetName,
						value: val,
						result: null
					});
				// }
				return acc;
			}, []);

			const oPayload = {
				EmpId: sEmpId,
				ClaimType: sClaimType,
				ClaimTypeItem: sClaimTypeItem,
				CheckFields: aActiveFields
			};

			return oPayload;
		},
		
		eligibilityHandling: function(oController, oPayload, sSubmissionType) {

			switch (sSubmissionType) {
				case Constants.SubmissionTypePrefix.REQUEST:
					var oDBToUIControlMap = {
						"VEHICLE_OWNERSHIP_ID": "i_vehicle_ownership",
						"ELIGIBLE_AMOUNT":      "i_amount",
						"MOBILE_PHONE_BILL":    "i_category_purpose",
						"REGION_ID":            "i_sss",
						"RATE":                 "i_rate_per_kilometer",
						"ROOM_TYPE_ID":         "i_room_type",
						"FLIGHT_CLASS_ID":      "i_flight_class",
						"MARRIAGE_CATEGORY":    "i_marriage_cat",
						"TRANSPORT_CLASS":      "i_vehicle_class"
					};
					break;

				case Constants.SubmissionTypePrefix.CLAIM:		// working on this one
					var oDBToUIControlMap = {
						"ELIGIBLE_AMOUNT": 		"input_claimdetails_input_amount",
						"TRAVEL_DAYS_ID": 		"input_claimdetails_input_no_of_days",
						"FARE_TYPE_ID": 		"select_claimdetails_input_fare_type_id",
						"TRANSPORT_CLASS": 		"select_claimdetails_input_vehicle_class_id",
						"FLIGHT_CLASS_ID": 		"select_claimdetails_input_flight_class",
						"ROOM_TYPE_ID": 		"select_claimdetails_input_room_type",
						"MOBILE_PHONE_BILL": 	"select_claimdetails_input_mobile_category_purpose_id"
					};
					break;
			
				default:
					break;
			}

			const aCheckFields = oPayload.CheckFields || [];
			const aErrorMessages = []; 

			const getControl = (sId) => {
				if (!sId) return null;
				const oFormElement = Fragment.byId("request", sId) || oController.byId(sId);
				return oFormElement?.getFields?.()[0]; 
			};

			Object.values(oDBToUIControlMap).forEach(sId => {
				const oInputControl = getControl(sId);
				if (oInputControl?.setValueState) {
					oInputControl.setValueState(ValueState.None);
					oInputControl.setValueStateText("");
				}
			});

			aCheckFields.forEach((oField) => {
				if (oField.result === true || oField.result === null) {
					return; 
				}
				
				const sErrorMsg = (`Validation failed for ${oField.fieldName}.`);
				aErrorMessages.push(sErrorMsg);

				const oInputControl = getControl(oDBToUIControlMap[oField.fieldName]);
				if (oInputControl?.setValueState) {
					oInputControl.setValueState(ValueState.Error);
					// oInputControl.setValueStateText(sErrorMsg);
				}
			});

			const bIsEligible = aErrorMessages.length === 0;

			if (!bIsEligible) {
				// const sFormattedErrors = "• " + aErrorMessages.join("\n• ");
				const sFormattedErrors = "• " + aErrorMessages[0];
				MessageBox.error("You are not eligible for this request. Please review the highlighted items:\n\n" + sFormattedErrors, {
					title: "Eligibility Check Failed",
					actions: [MessageBox.Action.CLOSE]
				});
			}

			return bIsEligible;
		}

    };
});