sap.ui.define([
    "sap/ui/mdc/ValueHelpDelegate",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/mdc/enums/RequestShowContainerReason",
    "claima/utils/Constants"
], function (
    ValueHelpDelegate,
    Filter,
    FilterOperator,
    RequestShowContainerReason,
    Constants
) {
    "use strict";

    const DynamicVH = Object.assign({}, ValueHelpDelegate);

    // -----------------------------------------------------------------------
    // 1. Retrieve Content — Build MTable dynamically based on payload
    // -----------------------------------------------------------------------
    DynamicVH.retrieveContent = function (oValueHelp, oContainer) {

        const oContent = oContainer.getContent()?.[0];

        // When table already created, resolve immediately
        if (!oContent || !oContent.isA("sap.ui.mdc.valuehelp.content.MTable") || oContent.getTable()) {
            return Promise.resolve();
        }

        const oPayload = oValueHelp.getPayload();  
        const sModelName = oPayload.modelName || "employee"; 
        const sPath = oPayload.entitySet;         

        return new Promise((resolve, reject) => {

            sap.ui.require([
                "sap/m/library",
                "sap/m/Table",
                "sap/m/Column",
                "sap/m/ColumnListItem",
                "sap/m/Label",
                "sap/m/Text"
            ], function (library, Table, Column, ColumnListItem, Label, Text) {

                const { ListMode } = library;

                const oTable = new Table(oContainer.getId() + "-Table", {
                    width: "100%",
                    mode: oContainer.isTypeahead() ?
                        ListMode.SingleSelectMaster :
                        ListMode.SingleSelectLeft,

                    // Build table columns from payload
                    columns: [
                        new Column({
                            width: "75px",
                            header: new Label({ text: oPayload.columns[0] })
                        }),
                        new Column({
                            width: "auto",
                            header: new Label({ text: oPayload.columns[1] })
                        })
                    ],

                    // Bind table rows dynamically
                    items: {
                        path: sPath,  // e.g., "employee>/ZCURRENCY"
                        template: new ColumnListItem({
                            type: "Active",
                            cells: [
                                new Text({
                                    text: `{${sModelName}>${oPayload.keyField}}`
                                }),
                                new Text({
                                    text: `{${sModelName}>${oPayload.descriptionField}}`
                                })
                            ]
                        })
                    }
                });

                // Resize Popover
                function resizePopoverToField() {

                    const oField = oValueHelp.getControl();
                    if (!oField) return;

                    const oDom = oField.getDomRef();
                    if (!oDom) return;

                    const fieldWidth = oDom.getBoundingClientRect().width;

                    const oInnerPopover = oContainer.getAggregation("_container");

                    if (oInnerPopover?.setContentWidth) {
                        oInnerPopover.setContentWidth(fieldWidth + "px");
                    }

                    if (oTable?.setWidth) {
                        oTable.setWidth(fieldWidth + "px");
                    }
                }

                // Hook into the REAL popover's rendering lifecycle
                const oInnerPopover = oContainer.getAggregation("_container");
                if (oInnerPopover) {
                    oInnerPopover.addEventDelegate({
                        onAfterRendering: resizePopoverToField
                    });
                }

                // Apply after table renders
                oTable.addEventDelegate({
                    onAfterRendering: resizePopoverToField
                });

                // Required for MDC
                oContent.setUseAsValueHelp(true);
                oContent.setTable(oTable);
                resolve();
            }, reject);
        });
    };


    // -----------------------------------------------------------------------
    // 2. Search Logic
    // -----------------------------------------------------------------------
    DynamicVH.updateBindingInfo = function (oValueHelp, oContent, oBindingInfo) {
        ValueHelpDelegate.updateBindingInfo(oValueHelp, oContent, oBindingInfo);

        oBindingInfo.length = 300;
        if (!oBindingInfo.parameters) {
            oBindingInfo.parameters = {};
        }
        oBindingInfo.parameters.threshold = 300;

        const oPayload = oValueHelp.getPayload();
        const oInputModel = oValueHelp.getModel("claimitem_input");

        if(oPayload.filters?.length){
            const aPayloadFilter =  oPayload.filters.map(filter => {
               let sValue = filter.value1;

               if(typeof filter.value1 === "string" && filter.value1.startsWith("/")){
                    const sModelName = filter.model;
                    sValue = oValueHelp.getModel(sModelName)?.getProperty(filter.value1);
               }
                
                return !sValue ? null : new Filter({
                    path: filter.path,
                    operator: FilterOperator[filter.operator] || filter.operator,
                    value1: sValue
                });
            })
            if(aPayloadFilter.length){
                oBindingInfo.filters.push(...aPayloadFilter)
            }
        }

        if(oInputModel.getProperty("/claim_item/claim_type_item_id") === Constants.ClaimType.POST_EDUCATION_ASSISTANCE){
            oBindingInfo.filters.push(new Filter({
                path: Constants.EntitiesFields.RELATIONSHIP,
                operator: FilterOperator.EQ,
                value1: "02"
            }));
        }

        if (oPayload.searchKeys) {
            const aFilters = oPayload.searchKeys.map(key => new Filter({
                path: key,
                operator: FilterOperator.Contains,
                value1: oContent.getSearch(),
                caseSensitive: false
            }));

            if (aFilters.length > 0) {
                oBindingInfo.filters.push(new Filter(aFilters, false));
            }
        }
    };

    DynamicVH.isSearchSupported = function (oValueHelp) {
        return !!oValueHelp.getPayload().searchKeys;
    };


    // -----------------------------------------------------------------------
    // 3. When to open popover or dialog
    // -----------------------------------------------------------------------
    DynamicVH.requestShowContainer = function (oValueHelp, oContainer, reason) {
        const p = oValueHelp.getPayload();
        const map = {
            [RequestShowContainerReason.Tap]: !!p.openOnClick,
            [RequestShowContainerReason.Tab]: !!p.openOnTab,
            [RequestShowContainerReason.Filter]: true
        };

        return (reason in map)
            ? map[reason]
            : ValueHelpDelegate.requestShowContainer.apply(this, arguments);
    };

    return DynamicVH;
});