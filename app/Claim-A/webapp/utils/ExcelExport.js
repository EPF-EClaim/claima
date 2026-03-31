sap.ui.define([
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox", 
    "claima/utils/Utility"
], function (Spreadsheet, exportLibrary, MessageToast, MessageBox, Utility) {
    "use strict";


    return {
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

        // EdmType: exportLibrary.EdmType
    };
});