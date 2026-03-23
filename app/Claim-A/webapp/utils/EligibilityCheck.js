sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {

		/* =========================================================
		* Eligibility Checking Function
		* ======================================================= */

		generateEligibilityCheckPayload (oController) {
			var oData     = oController._oReqModel.getProperty('/req_item');

			var sEmpId         = oController._oReqModel.getProperty('/user');
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

    };
});