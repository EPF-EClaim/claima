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
					items: {
						path: "employee>/ZEMP_DEPENDENT", 
						template: new ColumnListItem({
						type: "Active",
						cells: [
							new Text({text: {path: 'employee>LEGAL_NAME', type: new StringType()}}),
						],
						
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

		const oView = oValueHelp.getParent();
		const sEmpID = oView.getModel("session").getProperty("/userId");

		const aFilters = [];

		aFilters.push(
			new Filter("EMP_ID", FilterOperator.EQ, sEmpID)
		);

		const sSearch = oContent.getSearch();
		if(sSearch && oPayload.searchKeys?.length){
			const aSearchFilters = oPayload.searchKeys.map((sPath)=>
				new Filter({
					path: sPath,
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				})
			);
			aFilters.push(new Filter(aSearchFilters, false));
		}
		oBindingInfo.filters = aFilters;
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