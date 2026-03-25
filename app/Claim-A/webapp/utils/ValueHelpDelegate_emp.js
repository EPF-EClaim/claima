sap.ui.define([
    "sap/ui/mdc/ValueHelpDelegate",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/mdc/enums/RequestShowContainerReason"
], function(
    ValueHelpDelegate,
    Filter,
    FilterOperator,
    RequestShowContainerReason
) {
    "use strict";

    const JSONValueHelpDelegate = Object.assign({}, ValueHelpDelegate);

    JSONValueHelpDelegate.retrieveContent = function(oValueHelp, oContainer, sContentId) {
        const aContent = oContainer.getContent();
        const oContent = aContent[0];

        if (!oContent || !oContent.isA("sap.ui.mdc.valuehelp.content.MTable") || oContent.getTable()) {
            return Promise.resolve();
        }

        return new Promise((fnResolve, fnReject) => {
            // Use the standard UI5 require array matching
            sap.ui.require([
                "sap/m/library", 
                "sap/m/Table", 
                "sap/m/Column", 
                "sap/m/ColumnListItem", 
                "sap/m/Label", 
                "sap/m/Text", 
                "sap/ui/model/type/String"
            ], function(mLibrary, Table, Column, ColumnListItem, Label, Text, StringType) {
                
                const { ListMode } = mLibrary;
                const oPayload = oValueHelp.getPayload() || {};
                const aColumns = oPayload.columns || ["ID", "Name", "Cost Center"]; // Safe fallback

                // Properly construct the table and its binding
                const oTable = new Table(oContainer.getId() + "-Table", {
                    width: oContainer.isTypeahead() ? "25rem" : "100%", // Expanded slightly to fit 3 columns
                    mode: oContainer.isTypeahead() ? ListMode.SingleSelectMaster : ListMode.SingleSelectLeft,
                    columns: [
                        new Column({ width: "6rem",  header: new Label({text: aColumns[0]}) }),
                        new Column({ width: "15rem", header: new Label({text: aColumns[1]}) }),
                        new Column({ width: "10rem", header: new Label({text: aColumns[2] || "Cost Center"}) }) // Added 3rd column
                    ]
                });

                // Bind the items to the table instance
                oTable.bindItems({
                    path: "employee>/ZEMP_MASTER",
                    template: new ColumnListItem({
                        type: "Active",
                        cells: [
                            new Text({text: "{employee>EEID}"}),
                            new Text({text: "{employee>NAME}"}),
                            new Text({text: "{employee>CC}"})
                        ]
                    })
                });

                oContent.setTable(oTable);
                fnResolve();
            }, fnReject);
        });
    };

    JSONValueHelpDelegate.updateBindingInfo = function(oValueHelp, oContent, oBindingInfo) {
        ValueHelpDelegate.updateBindingInfo(oValueHelp, oContent, oBindingInfo);

        const oPayload = oValueHelp.getPayload();
        if (oPayload && oPayload.searchKeys) {
            const sSearchQuery = oContent.getSearch();
            if (sSearchQuery) { // Only create filters if there is actual text typed
                const aFilters = oPayload.searchKeys.map((sPath) => {
                    return new Filter({
                        path: sPath, 
                        operator: FilterOperator.Contains, 
                        value1: sSearchQuery, 
                        caseSensitive: oContent.getCaseSensitive()
                    });
                });
                
                const oSearchFilter = new Filter({ filters: aFilters, and: false }); // OR condition between fields
                
                if (!oBindingInfo.filters) {
                    oBindingInfo.filters = [];
                }
                oBindingInfo.filters.push(oSearchFilter);
            }
        }
    };

    JSONValueHelpDelegate.isSearchSupported = function (oValueHelp, oContent, oListBinding) {
        return !!(oValueHelp.getPayload() && oValueHelp.getPayload().searchKeys);
    };

    JSONValueHelpDelegate.requestShowContainer = function (oValueHelp, oContainer, sRequestShowContainerReason) {
        const oPayload = oValueHelp.getPayload() || {};
        const mResultMap = {
            [RequestShowContainerReason.Tap]: !!oPayload.openOnClick,
            [RequestShowContainerReason.Tab]: !!oPayload.openOnTab,
            [RequestShowContainerReason.Filter]: true
        };
        return sRequestShowContainerReason in mResultMap ? mResultMap[sRequestShowContainerReason] : ValueHelpDelegate.requestShowContainer.apply(this, arguments);
    };

    return JSONValueHelpDelegate;
});