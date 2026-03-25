sap.ui.define([
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/core/ValueState"
], function (MessageBox, Fragment, ValueState) {
    "use strict";

    return {

		/* =========================================================
		* Eligibility Checking Function
		* ======================================================= */

		generateEligibilityCheckPayload (oController) {
			var oData     = oController._oReqModel.getProperty('/req_item');

			var sEmpId         = oController._oSessionModel.getProperty("/userId")
			var sClaimType     = oController._oReqModel.getProperty('/req_header/claimtype');
			var sClaimTypeItem = oData.claim_type_item_id;

			const oMapping = {
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
				"travel_hours"          : "TRAVEL_HOURS"
			};

			const aActiveFields = Object.entries(oMapping).reduce((acc, [sKey, sTargetName]) => {
				const val = oData[sKey];
				
				const bIsValid = val !== null && val !== undefined;

				if (bIsValid) {
					acc.push({
						fieldName: sTargetName,
						value: val,
						result: null
					});
				}
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
		
		eligibilityHandling: function(oController, oPayload) {

			const oDBToUIControlMap = {
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