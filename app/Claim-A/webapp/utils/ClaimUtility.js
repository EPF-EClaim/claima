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

    return {

		/**
         * Initialize the ClaimUtility
         * @public
         */
        init: function(oOwnerComponent, oView) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
        },

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
			var oClaimSubmissionModel = this._oView.getModel("claimsubmission_input");
			var oInputModel = this._oView.getModel("claimitem_input");
			const oModel = this._oOwnerComponent.getModel();
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
			var oInputModel = this._oView.getModel("claimitem_input");
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
                    return[];
                }
            } catch (oError) {
                MessageBox.error(Utility.getText("msg_claimdetails_input_err", [oError]));
                return [];
            } finally {
                BusyIndicator.hide();
            }
		}
    }
});