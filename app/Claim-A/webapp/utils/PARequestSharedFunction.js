sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
], function (Filter, FilterOperator, Sorter) {
    "use strict";

    return {
        
		/* =========================================================
		* JSONModel Reset
		* ======================================================= */

        _ensureRequestModelDefaults(oReq) {
			const data = oReq.getData() || {};
			data.req_header        = { reqid: "", grptype: "IND" };
			data.req_item_rows     = [];
			data.req_item          = data.req_item || {
				cash_advance: "no_cashadv"
			};
			data.participant       = Array.isArray(data.participant) ? data.participant : [{ PARTICIPANTS_ID: "", ALLOCATED_AMOUNT: "" }];
			data.view              = "view";
			data.list_count        = 0;
			oReq.setData(data);
		},

		/* =========================================================
		* Get List from Backend
		* ======================================================= */

		async getPARHeaderList(oReq, oModel) {

			const oListBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", undefined,
				[new Sorter("REQUEST_ID", true)],null,
				{
					$$ownRequest: true,
					$$groupId: "$auto",
					$$updateGroupId: "$auto",
					$count: true
				}
			);

			try {
				const aCtx = await oListBinding.requestContexts(0, Infinity);
				const a = aCtx.map((ctx) => ctx.getObject());

				a.forEach((it) => {
				    if (it.PREAPPROVAL_AMOUNT == null) it.PREAPPROVAL_AMOUNT = 0.0;
				});

				oReq.setProperty("/req_header_list", a);
				oReq.setProperty("/req_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				oReq.setProperty("/req_header_list", []);
				oReq.setProperty("/req_header_count", 0);
				return [];
			}
		},

		_determineCurrentState(that, oReq) {
			switch (oReq.getProperty('/req_header/reqstatus')) {
				case 'DRAFT' || 'RETURN':
					that.byId('req_back_scr').setVisible(false);
					that.byId("req_back").setVisible(true);
					that.byId("req_delete").setVisible(true);
					that.byId("req_submit").setVisible(true);
					oReq.setProperty('/view', 'list');
					break;
				case 'DELETE':
					that.byId('req_back_scr').setVisible(true);
					that.byId("req_back").setVisible(false);
					that.byId("req_delete").setVisible(false);
					that.byId("req_submit").setVisible(false);
					oReq.setProperty('/view', 'view');
					break;
				case 'APPROVED':
					that.byId('req_back_scr').setVisible(true);
					that.byId("req_back").setVisible(false);
					that.byId("req_delete").setVisible(false);
					that.byId("req_submit").setVisible(true);
					oReq.setProperty('/view', 'view');
					that.byId('req_submit').setVisible(true);
					break;
				case 'PENDING APPROVAL':
					that.byId('req_back_scr').setVisible(true);
					that.byId("req_back").setVisible(false);
					that.byId("req_delete").setVisible(true);
					that.byId("req_submit").setVisible(false);
					oReq.setProperty('/view', 'view');
					that.byId('req_delete').setVisible(true);
					break;
				default:
					oReq.setProperty('/view', 'view');
					break;
					
			}
		}

    };
});