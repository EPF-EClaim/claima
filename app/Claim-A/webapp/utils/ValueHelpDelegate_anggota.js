sap.ui.define([
	"sap/ui/mdc/ValueHelpDelegate",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/mdc/enums/RequestShowContainerReason"
], (
	ValueHelpDelegate,
	Filter,
	FilterOperator,
	RequestShowContainerReason
) => {
	"use strict";

	const JSONValueHelpDelegate = Object.assign({}, ValueHelpDelegate);

	JSONValueHelpDelegate.retrieveContent = function(oValueHelp, oContainer, sContentId) {

		const aContent = oContainer.getContent();
		const oContent = aContent[0];

		if (!oContent || !oContent.isA("sap.ui.mdc.valuehelp.content.MTable") || oContent.getTable()) {
			return Promise.resolve();
		}

		return new Promise((fnResolve, fnReject) => {
			sap.ui.require(["sap/m/library", "sap/m/Table", "sap/m/Column", "sap/m/ColumnListItem", "sap/m/Label", "sap/m/Text", "sap/ui/model/type/String"], function() {
				const [library, Table, Column, ColumnListItem, Label, Text, StringType] = Array.from(arguments);
				const { ListMode } = library;
                const oPayload = oValueHelp.getPayload();
				const oTable = new Table(oContainer.getId() + "-Table", {
					width: oContainer.isTypeahead() ? "13rem" : "100%",
					mode: oContainer.isTypeahead() ? ListMode.SingleSelectMaster : ListMode.SingleSelectLeft,
					columns: [
						new Column({
							width: "6rem",
							header: new Label({text: oPayload.columns[0]})
						}),
						new Column({
							width: "15rem",
							header: new Label({text: oPayload.columns[1]})
						})
					],
					items: {path: "employee>/ZEMP_MASTER", template: new ColumnListItem({
						type: "Active",
						cells: [
							new Text({text: {path: 'employee>EEID', type: new StringType()}}),
							new Text({text: {path: 'employee>NAME', type: new StringType()}})
						]
					})}
				});
				oContent.setTable(oTable);
				fnResolve();
			}, fnReject);
		});
	};

	JSONValueHelpDelegate.updateBindingInfo = function(oValueHelp, oContent, oBindingInfo) {
		ValueHelpDelegate.updateBindingInfo(oValueHelp, oContent, oBindingInfo);

		// create search filters
		const oPayload = oValueHelp.getPayload();
		if (oPayload.searchKeys) { // TODO: Move filter generation in separate method?
			const aFilters = oPayload.searchKeys.map((sPath) => new Filter({path: sPath, operator: FilterOperator.Contains, value1: oContent.getSearch(), caseSensitive: oContent.getCaseSensitive()}));
			const oSearchFilter = aFilters && aFilters.length && new Filter(aFilters, false);
			if (oSearchFilter) {
				oBindingInfo.filters = oBindingInfo.filters.concat(oSearchFilter);
			}
		}
	};

	// enable typeahead
	JSONValueHelpDelegate.isSearchSupported = function (oValueHelp, oContent, oListBinding) {
		const {searchKeys} = oValueHelp.getPayload();
		return !!searchKeys;
	};

	// enable dropdown on click and tab-navigation, ignoring missing filter
	JSONValueHelpDelegate.requestShowContainer = function (oValueHelp, oContainer, sRequestShowContainerReason) {
		const {openOnClick, openOnTab} = oValueHelp.getPayload();
		const mResultMap = {
			[RequestShowContainerReason.Tap]: !!openOnClick,
			[RequestShowContainerReason.Tab]: !!openOnTab,
			[RequestShowContainerReason.Filter]: true
		};
		return sRequestShowContainerReason in mResultMap ? mResultMap[sRequestShowContainerReason] : ValueHelpDelegate.requestShowContainer.apply(this, arguments);
	};

	return JSONValueHelpDelegate;

}

);