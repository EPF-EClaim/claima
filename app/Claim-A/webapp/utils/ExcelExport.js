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
		* @param {string} sParticipant - used for pre-approval, checks if generating for participant data 
		* @return filename based on claim ID and current date
        */
		_getExcelFileName: function (sSubmissionType, sParticipant) {
            switch (sSubmissionType) {
                case Constants.SubmissionTypePrefix.CLAIM:
                    const oHeaderModelData = this._oView.getModel("claimsubmission_input")?.getData() || {};
                    const sClaimID = oHeaderModelData?.claim_header?.claim_id ?? "Claim";
                    return this._sanitizeFileName(`Claim_${sClaimID}_${DateUtility.toYMD(DateUtility.today())}.xlsx`);
                case Constants.SubmissionTypePrefix.REQUEST:
                    if (sParticipant == 'participant') {
                        const oInput = this._oOwnerComponent.getModel("request")?.getData() || {};
                        const sReqId = oInput?.req_header?.reqid || "";
                        const sReqSubId = oInput?.req_item?.req_subid || "";

                        return this._sanitizeFileName(`Pre_Approval_Request_${sReqId}_${sReqSubId}_Participant_Data.xlsx`);
                    } else {
                        const oInput = this.getOwnerComponent().getModel("request")?.getData() || {};
                        const sReqId = oInput?.req_header?.reqid || "";

                        return this._sanitizeFileName(`Pre_Approval_Request_${sReqId}_${DateUtility.toYMD(DateUtility.today())}.xlsx`);
                    }
            }
		},

		/**
        * Pressing Download button generates Excel file with header and item data
        * @public
		* @param {string} sSubmissionType - claim or request passed into method 
		* @param {object} oHeaderInput - header object passed into param
		* @param {object} oHeaderRowInput - header data values passed into param
		* @param {array} aHeaderColumnsInput - labels for header data
		* @param {array} aItemsInput - array of claim/request items passed into param
		* @param {array} aItemsColumnsMainInput - labels for main claim/request item data
		* @param {array} aItemsColumnsAdditionalInput - labels for additional item data based on claim type item
        */
		onDownloadExcelReport: async function (sSubmissionType, oHeaderInput, oHeaderRowInput, aHeaderColumnsInput, aItemsInput, aItemsColumnsMainInput, aItemsColumnsAdditionalInput) {
			try {
				this._oView.setBusy(true);

				const oHeader = oHeaderInput || {};
				const aItems = aItemsInput || [];

				// -------------------------------
				// Build Header Row
				// -------------------------------
				const oHeaderRow = oHeaderRowInput;

				const aHeaderColumns = aHeaderColumnsInput;

				const aHeaderLabels = aHeaderColumns.map(oColumn => oColumn.label);
				const aHeaderValues = aHeaderColumns.map(oColumn => oHeaderRow[oColumn.property] ?? "");

				const oWorksheetHeader = this._oExcel.utils.aoa_to_sheet([aHeaderLabels, aHeaderValues]);
				this._applyColumnMeta(oWorksheetHeader, aHeaderColumns, 1);

				// -------------------------------
				// Items Sheet
				// -------------------------------
				const aItemsColumnsMain = aItemsColumnsMainInput;

				const aItemsColumnsAdditional = aItemsColumnsAdditionalInput;

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
                switch (sSubmissionType) {
                    case Constants.SubmissionTypePrefix.CLAIM:
                        var sSubmissionTypeFilter = Constants.ClaimFieldVisibilityConfig.SUBMISSION_TYPE;
                        var sComponentTypeFilter = Constants.ClaimFieldVisibilityConfig.ITEM;
                        break;
                    case Constants.SubmissionTypePrefix.REQUEST:
                        sSubmissionTypeFilter = Constants.RequestFieldVisibilityConfig.SUBMISSION_TYPE;
                        sComponentTypeFilter = Constants.RequestFieldVisibilityConfig.ITEM;
                        break;
                }
				var aFieldIdsCombined = [];
				for (var iClaimTypeItem = 0; iClaimTypeItem < aClaimTypeItemsUnique.length; iClaimTypeItem++) {
					var oClaimTypeItem = aClaimTypeItemsUnique[iClaimTypeItem];
					const oModel = this._oOwnerComponent.getModel();
					const oListBinding = oModel.bindList("/ZDB_STRUCTURE", null, null, [
						new Filter("SUBMISSION_TYPE", FilterOperator.EQ, sSubmissionTypeFilter),
						new Filter("COMPONENT_LEVEL", FilterOperator.EQ, sComponentTypeFilter),
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
				for (var iAdditionalColumn = 0; iAdditionalColumn < aItemsColumnsAdditional.length; iAdditionalColumn++) {
					if (aFieldIdsCombined.includes(aItemsColumnsAdditional[iAdditionalColumn]["field"])) {
						aItemsColumns.push(aItemsColumnsAdditional[iAdditionalColumn]);
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

				this._oExcel.writeFile(oWorkbook, this._getExcelFileName(sSubmissionType), {
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