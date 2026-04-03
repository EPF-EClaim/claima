sap.ui.define([
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"claima/utils/DateUtility"
], function (
    Sorter,
	Filter,
	FilterOperator,
	BusyIndicator,
    MessageBox,
    MessageToast,
    DateUtility
) {
	"use strict";

    return {

		/**
        * Set default values for claim item fields
        * Request is made to get values from table ZELIGIBILITY_RULE, based on user role and claim type/claim item given 
        * if record found, value is retrieved from the table and populated in the claim item model
        * @public
		* @param {string} sClaimItemField - claim item field to be populated
		* @param {string} sEligibilityRule - field to retrieve value from db table
		* @param {string} sDefaultValue - default value to set if none found
        */
		setClaimItemDefaultValues: async function (sClaimItemField, sEligibilityRule, sDefaultValue) {
			var oClaimSubmissionModel = this.getView().getModel("claimsubmission_input");
			var oInputModel = this.getView().getModel("claimitem_input");
			const oModel = this.getOwnerComponent().getModel();
			//// filter by employee role ID or * (all)
			const oFilterRoleId = new Filter({
				filters: [
					new Filter("ROLE_ID", FilterOperator.EQ, oClaimSubmissionModel.getProperty("/emp_master/role")),
					new Filter("ROLE_ID", FilterOperator.EQ, '*')
				],
				and: false
			});
			//// filter by employee role ID or * (all)
			const oFilterPersonalGrade = new Filter({
				filters: [
					new Filter("PERSONAL_GRADE", FilterOperator.EQ, oClaimSubmissionModel.getProperty("/emp_master/grade")),
					new Filter("PERSONAL_GRADE", FilterOperator.EQ, '*')
				],
				and: false
			});
			const oListBinding = oModel.bindList("/ZELIGIBILITY_RULE", null, [
				new Sorter("ROLE_ID", true),
				new Sorter("PERSONAL_GRADE", true),
				new Sorter("POSITION_NO_DESC", true),
				new Sorter("ROW_COUNT", true),
			], [
				new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oInputModel.getProperty("/claim_item/claim_type_id")),
				new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oInputModel.getProperty("/claim_item/claim_type_item_id")),
				oFilterRoleId,
				oFilterPersonalGrade,
				// ensure status is active
				new Filter("STATUS", FilterOperator.EQ, this._oConstant.ClaimTypeItemStatus.ACTIVE),
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
		}
    }
});