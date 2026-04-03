sap.ui.define([
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox", 
    "claima/utils/Constants",
    "claima/utils/Utility",
    "claima/utils/DateUtility"
], function (
    Spreadsheet,
    exportLibrary,
    BusyIndicator,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox,
    Constants,
    Utility,
    DateUtility
) {
    "use strict";

    return {

		/**
         * Initialize the ExcelExport utility
         * @public
         */
        init: function(oOwnerComponent, oView, oExcel) {
            this._oOwnerComponent = oOwnerComponent;
            this._oView = oView;
			this._oExcel = oExcel;
        },

        exportToExcel: function (oTable, aColumns, sFileName) {

            if (!oTable) {
                MessageToast.show(Utility.getText("msg_no_table"));
                return;
            }

            const oBinding =
                oTable.getBinding("items") ||
                oTable.getBinding("rows");

            if (!oBinding) {
                 MessageToast.show(Utility.getText("msg_export_no_data"));
                return;
            }

            const oSheet = new Spreadsheet({
                workbook: { columns: aColumns },
                dataSource: oBinding,
                fileName: sFileName || "Export.xlsx",
                worker: false
            });

            oSheet.build()
                .then(() => MessageToast.show(Utility.getText("msg_export_success")))
                .catch(err => MessageBox.error(Utility.getText("msg_export_fail") + (err.message || err)))
                .finally(() => oSheet.destroy());
        },

		/**
        * Return input value as Excel-readable number; if invalid, return as null
        * @private
		* @param {integer} iVal - value passed into method
		* @return Excel-readable Number based on input value; else, return as null
        */
        _num: function (iVal) {
            if (iVal === null || iVal === undefined || iVal === "") return null;
            const i = Number(iVal);
            return Number.isFinite(i) ? i : null;
        },

		/**
        * Set metadata for worksheet columns in worksheet based on data type
        * @private
		* @param {object} oWorksheet - worksheetto be applied
		* @param {array} aColumns - array of columns to fill worksheet
		* @param {integer} iStartDataRow - first row number with data (non-header row)
        */
        _applyColumnMeta: function (oWorksheet, aColumns, iStartDataRow) {
            oWorksheet["!cols"] = aColumns.map(oColumn => ({ wch: oColumn.width || 12 }));

            const sReference = oWorksheet["!ref"]; // reference to cell range
            if (!sReference) return;

            const sRange = this._oExcel.utils.decode_range(sReference);

            for (let iColumn = 0; iColumn < aColumns.length; iColumn++) {
                const oMeta = aColumns[iColumn];
                if (!oMeta.type) continue;

                for (let iRow = iStartDataRow; iRow <= sRange.e.r; iRow++) {
                    const oAddress = this._oExcel.utils.encode_cell({ iColumn, iRow });
                    const oCell = oWorksheet[oAddress];
                    if (!oCell) continue;

                    // FORCE DATE FORMAT YYYY-MM-DD

                    if (oMeta.type === "date") {
                        const oDate = DateUtility.toDate(oCell.v);

                        if (oDate) {
                            oCell.t = "d";
                            oCell.v = oDate;
                            oCell.z = "yyyy-mm-dd";
                        } else {
                            // clear invalid date to avoid showing 1970-01-01
                            delete oWorksheet[oAddress];
                        }
                    }

                    // Time
                    if (oMeta.type === "time") {
                        const oTime = DateUtility.toTime(oCell.v);

                        if (oTime) {
                            oCell.t = "d";
                            oCell.v = oTime;
                            oCell.z = "hh:mm:ss";
                        } else {
                            // clear invalid date to avoid showing incorrect time
                            delete oWorksheet[oAddress];
                        }
                    }

                    // Numbers
                    if (oMeta.type === "number") {
                        const iNumber = this._num(oCell.v);
                        if (iNumber === null) {
                            delete oWorksheet[oAddress];
                        } else {
                            oCell.t = "n";
                            oCell.v = iNumber;
                            oCell.z = oMeta.scale === 2 ? "#,##0.00" : "#,##0";
                        }
                    }
                }
            }
        },

		/**
        * Sanitize name to be used for Excel file
        * @private
		* @param {string} sFileName - excel file name 
		* @return updated Excel file name
        */
		_sanitizeFileName: function (sFileName) {
			return (sFileName || "")
				.replace(/[\\/:*?"<>|]/g, "_")
				.replace(/\s+/g, " ")
				.trim()
				.substring(0, 80);
		},

		/**
        * Get Excel file name based on claim header data 
        * @private
		* @param {string} sSubmissionType - claim or request passed into method 
		* @return filename based on claim ID and current date
        */
		_getExcelFileName: function (sSubmissionType) {
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.CLAIM:
                    const oHeaderModelData = this._oView.getModel("claimsubmission_input")?.getData() || {};
                    const sClaimID = oHeaderModelData?.claim_header?.claim_id ?? "Claim";
                    return this._sanitizeFileName(`Claim_${sClaimID}_${DateUtility.getHanaDate(DateUtility.today())}.xlsx`);
                case Constants.SubmissionTypePrefix.REQUEST:
                    break;
            }
		},

		/**
        * Pressing Download button generates Excel file with claim header and item data
        * @public
        */
		onDownloadExcelReport_Claims: async function () {
			try {
				this._oView.setBusy(true);

				const oInput = this._oView.getModel("claimsubmission_input")?.getData();
				if (!oInput) {
					MessageBox.error(Utility.getText("msg_claimsubmission_noload"));
					return;
				}

				const oHeader = oInput.claim_header || {};
				const aItems = oInput.claim_items || [];

				// -------------------------------
				// Build Header Row
				// -------------------------------
				const oHeaderRow = {
					"Claim ID": oHeader.claim_id || "",
					"Purpose": oHeader.purpose || "",
					"Trip Start Date": oHeader.trip_start_date,
					"Trip End Date": oHeader.trip_end_date,
					"Event Start Date": oHeader.event_start_date,
					"Event End Date": oHeader.event_end_date,
					"Pre-Approval Request": oHeader.request_id + oHeader.descr.request_id,
					"Location": oHeader.location || "",
					"Comment": oHeader.comment || "",
					"Cost Center": oHeader.cost_center || "",
					"Alternate Cost Center": oHeader.alternate_cost_center || "",
					"Total Claim Amount": oHeader.total_claim_amount,
					"Pre-Approved Amount": oHeader.preapproved_amount,
					"Cash Advance": oHeader.cash_advance_amount,
					"Final Amount To Receive": oHeader.final_amount_to_receive
				};

				const aHeaderColumns = [
					{ label: "Claim ID", property: "Claim ID", width: 18 },
					{ label: "Purpose", property: "Purpose", width: 30 },
					{ label: "Trip Start Date", property: "Trip Start Date", width: 18 },
					{ label: "Trip End Date", property: "Trip End Date", width: 18 },
					{ label: "Event Start Date", property: "Event Start Date", width: 18 },
					{ label: "Event End Date", property: "Event End Date", width: 18 },
					{ label: "Pre-Approval Request", property: "Pre-Approval Request", width: 50 },
					{ label: "Location", property: "Location", width: 20 },
					{ label: "Comment", property: "Comment", width: 30 },
					{ label: "Cost Center", property: "Cost Center", width: 18 },
					{ label: "Alternate Cost Center", property: "Alternate Cost Center", width: 20 },
					{ label: "Total Claim Amount", property: "Total Claim Amount", type: "number", scale: 2, width: 18 },
					{ label: "Pre-Approved Amount", property: "Pre-Approved Amount", type: "number", scale: 2, width: 18 },
					{ label: "Cash Advance", property: "Cash Advance", type: "number", scale: 2, width: 18 },
					{ label: "Final Amount To Receive", property: "Final Amount To Receive", type: "number", scale: 2, width: 18 }
				];

				const aHeaderLabels = aHeaderColumns.map(oColumn => oColumn.label);
				const aHeaderValues = aHeaderColumns.map(oColumn => oHeaderRow[oColumn.property] ?? "");

				const oWorksheetHeader = this._oExcel.utils.aoa_to_sheet([aHeaderLabels, aHeaderValues]);
				this._applyColumnMeta(oWorksheetHeader, aHeaderColumns, 1);

				// -------------------------------
				// Items Sheet
				// -------------------------------
				const aItemsColumnsMain = [
					{ label: Utility.getText("label_claimdetails_input_claim_id"), property: "claim_id", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_claim_sub_id"), property: "claim_sub_id", width: 20 },
					{ label: Utility.getText("label_claimdetails_input_claimtype"), property: "claim_type_id", type: "descr", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_claimitem"), property: "claim_type_item_id", type: "descr", width: 30 },
				];

				const aClaimDetailColumns = [
					{ label: Utility.getText("label_claimdetails_input_anggota"), property: "anggota_name", field: "input_claimdetails_input_anggota_name", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_dependent"), property: "dependent_name", field: "input_claimdetails_input_dependent_name", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_profbodytype"), property: "type_of_professional_body", field: "select_claimdetails_input_type_of_professional_body", type: "descr", width: 40 },
					{ label: Utility.getText("label_claimdetails_input_policyno"), property: "policy_number", field: "input_claimdetails_input_policy_number", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_funeraltransport"), property: "funeral_transportation", field: "select_claimdetails_input_funeral_transportation", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_amount_actual"), property: "actual_amount", field: "input_claimdetails_input_actual_amount", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_amount_subsidised"), property: "subsidised_amount", field: "input_claimdetails_input_subsidised_amount", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_amount_reqapproved"), property: "request_approval_amount", field: "input_claimdetails_input_request_approval_amount", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_amount"), property: "amount", field: "input_claimdetails_input_amount", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_compensation"), property: "percentage_compensation", field: "input_claimdetails_input_percentage_compensation", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_coursetitle"), property: "course_title", field: "input_claimdetails_input_course_title", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_levelstudies"), property: "study_levels_id", field: "select_claimdetails_input_study_levels_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_receiptno"), property: "receipt_number", field: "input_claimdetails_input_receipt_number", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_receiptdate"), property: "receipt_date", field: "datepicker_claimdetails_input_receipt_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_purpose"), property: "purpose", field: "input_claimdetails_input_purpose", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_startdate"), property: "start_date", field: "datepicker_claimdetails_input_startdate", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_starttime"), property: "start_time", field: "timepicker_claimdetails_input_starttime", type: "time", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_enddate"), property: "end_date", field: "datepicker_claimdetails_input_enddate", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_endtime"), property: "end_time", field: "timepicker_claimdetails_input_endtime", type: "time", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_insurance_provider_id"), property: "insurance_provider_id", field: "select_claimdetails_input_insurance_provider_id", type: "descr", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_insurance_provider_name"), property: "insurance_provider_name", field: "input_claimdetails_input_insurance_provider_name", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_insurance_package_id"), property: "insurance_package_id", field: "select_claimdetails_input_insurance_package_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_insurance_purchase_date"), property: "insurance_purchase_date", field: "datepicker_claimdetails_input_insurance_purchase_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_insurance_cert_start_date"), property: "insurance_cert_start_date", field: "datepicker_claimdetails_input_insurance_cert_start_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_insurance_cert_end_date"), property: "insurance_cert_end_date", field: "datepicker_claimdetails_input_insurance_cert_end_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_numberofdays"), property: "no_of_days", field: "input_claimdetails_input_no_of_days", type: "number", scale: 0, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_typeofvehicle"), property: "vehicle_type", field: "select_claimdetails_input_vehicle_type", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_vehicleownership"), property: "vehicle_ownership_id", field: "select_claimdetails_input_vehicle_ownership_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_km"), property: "km", field: "input_claimdetails_input_km", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_km_rate"), property: "rate_per_km", field: "input_claimdetails_input_rate_per_km", width: 14 },
					{ label: Utility.getText("label_claimdetails_input_faretype"), property: "fare_type_id", field: "select_claimdetails_input_fare_type_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_vehicleclass"), property: "vehicle_class_id", field: "select_claimdetails_input_vehicle_class_id", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_flightclass"), property: "flight_class", field: "select_claimdetails_input_flight_class", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_toll"), property: "toll", field: "input_claimdetails_input_toll", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_parking"), property: "parking", field: "checkbox_claimdetails_input_parking", width: 10 },
					{ label: Utility.getText("label_claimdetails_input_locationtype"), property: "location_type", field: "select_claimdetails_input_location_type", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_state_from"), property: "from_state_id", field: "input_claimdetails_input_from_state_id", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_location_from"), property: "from_location", field: "input_claimdetails_input_from_location", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_state_to"), property: "to_state_id", field: "input_claimdetails_input_to_state_id", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_location_to"), property: "to_location", field: "input_claimdetails_input_to_location", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_roomtype"), property: "room_type", field: "select_claimdetails_input_room_type", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_country"), property: "country", field: "select_claimdetails_input_country", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_location"), property: "location", field: "input_claimdetails_input_location", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_needforeigncurrency"), property: "need_foreign_currency", field: "checkbox_claimdetails_input_needforeigncurrency", width: 10 },
					{ label: Utility.getText("label_claimdetails_input_currencycode"), property: "currency_code", field: "select_claimdetails_input_currency_code", width: 10 },
					{ label: Utility.getText("label_claimdetails_input_currencyrate"), property: "currency_rate", field: "input_claimdetails_input_currency_rate", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_currencyamt"), property: "currency_amount", field: "input_claimdetails_input_currency_amount", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_trip_startdate"), property: "trip_start_date", field: "datepicker_claimdetails_input_trip_start_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_trip_starttime"), property: "trip_start_time", field: "timepicker_claimdetails_input_trip_starttime", type: "time", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_time_depart"), property: "departure_time", field: "timepicker_claimdetails_input_departure_time", type: "time", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_trip_enddate"), property: "trip_end_date", field: "datepicker_claimdetails_input_trip_end_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_trip_endtime"), property: "trip_end_time", field: "timepicker_claimdetails_input_trip_endtime", type: "time", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_time_arrive"), property: "arrival_time", field: "timepicker_claimdetails_input_arrival_time", type: "time", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_travel_duration_day"), property: "travel_duration_day", field: "input_claimdetails_input_travel_duration_day", type: "number", scale: 1, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_travel_duration_hour"), property: "travel_duration_hour", field: "input_claimdetails_input_travel_duration_hour", type: "number", scale: 1, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_provided_breakfast"), property: "provided_breakfast", field: "input_claimdetails_input_provided_breakfast", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_provided_lunch"), property: "provided_lunch", field: "input_claimdetails_input_provided_lunch", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_provided_dinner"), property: "provided_dinner", field: "input_claimdetails_input_provided_dinner", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_entitled_breakfast"), property: "entitled_breakfast", field: "input_claimdetails_input_entitled_breakfast", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_entitled_lunch"), property: "entitled_lunch", field: "input_claimdetails_input_entitled_lunch", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_entitled_dinner"), property: "entitled_dinner", field: "input_claimdetails_input_entitled_dinner", type: "number", scale: 2, width: 14 },
					{ label: Utility.getText("label_claimdetails_input_lodging_address"), property: "lodging_address", field: "input_claimdetails_input_lodging_address", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_region"), property: "region", field: "select_claimdetails_input_region", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_area"), property: "area", field: "select_claimdetails_input_area", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_lodging_category"), property: "lodging_category", field: "select_claimdetails_input_lodging_category", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_familyno"), property: "no_of_family_member", field: "input_claimdetails_input_no_of_family_member", type: "number", scale: 2, width: 10 },
					{ label: Utility.getText("label_claimdetails_input_cat_purpose"), property: "claim_category", field: "select_claimdetails_input_claim_category", type: "descr", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_billno"), property: "bill_no", field: "input_claimdetails_input_bill_no", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_accountno"), property: "account_no", field: "input_claimdetails_input_account_no", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_billdate"), property: "bill_date", field: "datepicker_claimdetails_input_bill_date", type: "date", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_phoneno"), property: "phone_no", field: "input_claimdetails_input_phone_no", width: 18 },
					{ label: Utility.getText("label_claimdetails_input_disclaimer"), property: "disclaimer", field: "checkbox_claimdetails_input_disclaimer", width: 10 },
					{ label: Utility.getText("label_claimdetails_input_remarks"), property: "remark", field: "input_claimdetails_input_remarks", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_attachment_file_1"), property: "attachment_file_1", field: "fileuploader_claimdetails_input_attachment_file_1", width: 30 },
					{ label: Utility.getText("label_claimdetails_input_attachment_file_2"), property: "attachment_file_2", field: "fileuploader_claimdetails_input_attachment_file_2", width: 30 },
				];

				// find claim type items used
				const aClaimTypeItems = aItems.map(oItem => {
					return { claim_type_id: oItem.claim_type_id, claim_type_item_id: oItem.claim_type_item_id };
				});
				//// remove duplicates
				const aClaimTypeItemsUnique = [
					...new Set(aClaimTypeItems.map(oItem => JSON.stringify(oItem)))
				].map(oItem => JSON.parse(oItem));

				// get columns based on claim type items used
				var aItemsColumns = aItemsColumnsMain;
				BusyIndicator.show(0);
				var aFieldIdsCombined = [];
				for (var iClaimTypeItem = 0; iClaimTypeItem < aClaimTypeItemsUnique.length; iClaimTypeItem++) {
					var oClaimTypeItem = aClaimTypeItemsUnique[iClaimTypeItem];
					const oModel = this._oOwnerComponent.getModel();
					const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
						new Filter("SUBMISSION_TYPE", FilterOperator.EQ, Constants.ClaimFieldVisibilityConfig.SUBMISSION_TYPE),
						new Filter("COMPONENT_LEVEL", FilterOperator.EQ, Constants.ClaimFieldVisibilityConfig.ITEM),
						new Filter("CLAIM_TYPE_ITEM_ID", FilterOperator.EQ, oClaimTypeItem.claim_type_item_id),
						new Filter("CLAIM_TYPE_ID", FilterOperator.EQ, oClaimTypeItem.claim_type_id)
					]);

					const aCtx = await oListBinding.requestContexts(0, Infinity);

					if (!aCtx || aCtx.length === 0) {
						continue;
					}
					else {
						const oData = aCtx[0].getObject();
						const aFieldIds = oData.FIELD.replace(/[\[\]\s]/g, "").split(",");

						if (aFieldIds != []) {
							aFieldIdsCombined.push(...aFieldIds);
						} else {
							continue;
						}
					}
				}
				// set visible fields based on combined items
				for (var iClaimDetailColumn = 0; iClaimDetailColumn < aClaimDetailColumns.length; iClaimDetailColumn++) {
					if (aFieldIdsCombined.includes(aClaimDetailColumns[iClaimDetailColumn]["field"])) {
						aItemsColumns.push(aClaimDetailColumns[iClaimDetailColumn]);
					}
				}

				// set labels for claim item columns
				const aItemsLabels = aItemsColumns.map(oColumn => oColumn.label);

				// get item values to include in excel
				const aItemRows = aItems.map(oItem => {
					return aItemsColumns.map(oColumn => {
						if (oColumn.type === "date") return DateUtility.toDate(oItem[oColumn.property]);
						if (oColumn.type === "time") return DateUtility.toTime(oItem[oColumn.property]);
						if (oColumn.type === "number") return this._num(oItem[oColumn.property]);
						if (oColumn.type === "descr") return (oItem["descr"][oColumn.property] || oItem[oColumn.property]);
						return oItem[oColumn.property] ?? "";
					});
				});

				const oWorksheetItems = this._oExcel.utils.aoa_to_sheet([aItemsLabels, ...aItemRows]);
				this._applyColumnMeta(oWorksheetItems, aItemsColumns, 1);

				const oWorkbook = this._oExcel.utils.book_new();
				this._oExcel.utils.book_append_sheet(oWorkbook, oWorksheetHeader, "Header");
				this._oExcel.utils.book_append_sheet(oWorkbook, oWorksheetItems, "Items");

				this._oExcel.writeFile(oWorkbook, this._getExcelFileName(Constants.SubmissionTypePrefix.CLAIM), {
					bookType: "xlsx",
					cellDates: true,
					compression: true
				});

			} catch (e) {
				MessageBox.error(Utility.getText("msg_claimsubmission_excel", [e]));
			} finally {
				this._oView.setBusy(false);
				BusyIndicator.hide();
			}
		},

        EdmType: exportLibrary.EdmType
    };

});