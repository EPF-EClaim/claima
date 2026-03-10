sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/BusyIndicator"
], function (Controller, MessageToast, JSONModel, Dialog, Button, Label, Fragment, Spreadsheet, BusyIndicator) {
    "use strict";

    return Controller.extend("claima.controller.MyApproval", {

        /* =========================================================
        * Lifecycle
        * ======================================================= */
        async onInit() {

        },

        /* =========================================================
        * Helpers: Model & Service
        * ======================================================= */

        _getReqModel() {
            return this.getOwnerComponent().getModel("request");
        },

        _getReqStatModel() {
            return this.getOwnerComponent().getModel("request_status");
        },

        _getClaimModel() {
            return this.getOwnerComponent().getModel("claim");
        },

        _getClaimStatModel() {
            return this.getOwnerComponent().getModel("claim_status");
        },

        //Manual Navigation for Claim Submission


        _getRootAndContainer: function () {
            const oRootView = this.getOwnerComponent().getRootControl();
            if (!oRootView) throw new Error("Root view not available");
            const oPageContainer = oRootView.byId("pageContainer");
            if (!oPageContainer) throw new Error("pageContainer not found in Root view");
            return { oRootView, oPageContainer };
        },

        /** Navigate manually to Claim Submission (same style as ClaimStatus.controller) */
        _navToClaimSubmissionManual: function () {
            const { oRootView, oPageContainer } = this._getRootAndContainer();
            const oClaimSubmission = oRootView.byId("navcontainer_claimsubmission"); // <-- matches App.view.xml
            if (!oClaimSubmission) {
                sap.m.MessageToast.show("Claim Submission page not found.");
                return;
            }
            oPageContainer.to(oClaimSubmission);
        },



        /* =========================================================
        * Main Logic
        * ======================================================= */

        //Aiman Salim - Added for MyApproval - Pre Approval Request

        async openItemFromList(oEvent) {
            try {
                this.getView().setBusy(true);

                const oReqModel = this._getReqModel();
                oReqModel.setProperty("/view", "view");

                // Resolve selected row/context
                const oListItem = oEvent?.getParameter("listItem");
                let oCtx =
                    oListItem?.getBindingContext("request_status") ||
                    oListItem?.getBindingContext() || null;

                if (!oCtx) {
                    // Fallback: from table selection
                    const oTable = this.byId("tb_myapproval_req");
                    const oSelected = oTable?.getSelectedItem?.();
                    if (oSelected) {
                        oCtx =
                            oSelected.getBindingContext("request_status") ||
                            oSelected.getBindingContext();
                    }
                }

                if (!oCtx) {
                    sap.m.MessageToast.show("Select an item to open");
                    return;
                }

                const row = oCtx.getObject();

                // Pick the right Request ID from the row
                // Prefer REQUEST_ID (works for both header & items views)
                const sRequestId =
                    row.REQUEST_ID ||
                    row.PREAPPROVAL_REQUEST_ID || // if your list exposes this
                    row.CLAIM_REQUEST_ID || // or this, depending on your view
                    row.PREAPPROVAL_ID;           // fallback only if header view can be filtered by it

                if (!sRequestId) {
                    sap.m.MessageToast.show("Request ID is missing on the selected row.");
                    return;
                }

                // Load header + items from backend (not from the list row)
                await this._loadRequestById(String(sRequestId));

                // Keep your DRAFT switching logic if needed
                if (row.STATUS === "DRAFT") {
                    oReqModel.setProperty("/view", "list");
                }

                // Navigate with the request_id
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RequestForm", { request_id: encodeURIComponent(String(sRequestId)) });
            } catch (e) {
                jQuery.sap.log.error("openItemFromList failed: " + e);
                sap.m.MessageToast.show("Failed to open the selected item.");
            } finally {
                this.getView().setBusy(false);
            }
        },

        /**
 * Loads the request's header & items by REQUEST_ID
 * and populates the "request" JSONModel.
 */
        async _loadRequestById(sRequestId) {
            const oReq = this._getReqModel();
            //const oModel = this.getOwnerComponent().getModel("employee_view");
            const oModel = await this._ensureModelReady("employee_view");
            const sReq = String(sRequestId);

            // Build a shared filter for both calls
            const aFilters = [
                new sap.ui.model.Filter("REQUEST_ID", sap.ui.model.FilterOperator.EQ, sReq)
            ];

            // Header binding (should return one row)
            const oHeaderBinding = oModel.bindList(
                "/ZEMP_REQUEST_VIEW",
                null,
                null,                // no sort needed for single header
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    // Only fetch what you render (adjust list as needed)
                    $select: [
                        "REQUEST_ID", "REQUEST_TYPE_ID", "IND_OR_GROUP_DESC",
                        "TRIP_START_DATE", "TRIP_END_DATE", "EVENT_START_DATE", "EVENT_END_DATE",
                        "OBJECTIVE_PURPOSE", "TYPE_OF_TRANSPORTATION", "ALTERNATE_COST_CENTER",
                        "LOCATION", "COST_CENTER", "CASH_ADVANCE", "PREAPPROVAL_AMOUNT",
                        "ATTACHMENT1", "ATTACHMENT2", "STATUS", "STATUS_DESC", "CLAIM_TYPE_ID",
                        "EVENT_FIELD1", "EVENT_FIELD2", "EVENT_FIELD3", "EVENT_FIELD4"
                    ]
                }
            );

            // Item binding (all items for the request)
            const oItemBinding = oModel.bindList(
                "/ZEMP_REQUEST_ITEM_VIEW",
                null,
                [new sap.ui.model.Sorter("REQUEST_SUB_ID", false)],
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    $select: [
                        "REQUEST_ID", "REQUEST_SUB_ID", "EST_NO_PARTICIPANT",
                        "EST_AMOUNT", "CASH_ADVANCE",
                    ]
                }
            );

            try {
                const [aHeaderCtx, aItemCtx] = await Promise.all([
                    oHeaderBinding.requestContexts(0, 1),
                    oItemBinding.requestContexts(0, Infinity)
                ]);

                // --- Header ---
                const oHeader = aHeaderCtx[0]?.getObject();
                if (!oHeader) {
                    sap.m.MessageToast.show("No header found for the selected request.");
                    // Clear and bail gracefully
                    oReq.setProperty("/req_header", {});
                    oReq.setProperty("/req_item_rows", []);
                    oReq.setProperty("/list_count", 0);
                    return { header: null, items: [] };
                }

                // Map/normalize header into your form shape
                const oReqHeader = this._mapHeaderToForm(oHeader);
                oReq.setProperty("/req_header", oReqHeader);

                // --- Items ---
                const aItems = aItemCtx.map((ctx) => ctx.getObject());

                aItems.forEach((it) => {
                    if (it.EST_AMOUNT != null) it.EST_AMOUNT = parseFloat(it.EST_AMOUNT);
                    if (it.EST_NO_PARTICIPANT != null) it.EST_NO_PARTICIPANT = parseInt(it.EST_NO_PARTICIPANT, 10);
                });

                // Recompute the amounts (same logic you had)
                const cashadv_amt = aItems.reduce((sum, it) => {
                    return it.CASH_ADVANCE === "YES" ? sum + (Number(it.EST_AMOUNT) || 0) : sum;
                }, 0);

                const req_amt = aItems.reduce((sum, it) => {
                    return it.CASH_ADVANCE === null || it.CASH_ADVANCE === "NO"
                        ? sum + (Number(it.EST_AMOUNT) || 0)
                        : sum;
                }, 0);

                oReq.setProperty("/req_header/cashadvamt", cashadv_amt);
                oReq.setProperty("/req_header/reqamt", req_amt);
                oReq.setProperty("/req_item_rows", aItems);
                oReq.setProperty("/list_count", aItems.length);
                oReq.setProperty("/view", "approver");

                return { header: oHeader, items: aItems };
            } catch (err) {
                console.error("Failed to load header/items:", err);
                oReq.setProperty("/req_header", {});
                oReq.setProperty("/req_item_rows", []);
                oReq.setProperty("/list_count", 0);
                return { header: null, items: [] };
            }
        },

        _mapHeaderToForm(o) {
            return {
                purpose: o.OBJECTIVE_PURPOSE || "",
                reqtype: o.REQUEST_TYPE_DESC || "",
                tripstartdate: o.TRIP_START_DATE || "",
                tripenddate: o.TRIP_END_DATE || "",
                eventstartdate: o.EVENT_START_DATE || "",
                eventenddate: o.EVENT_END_DATE || "",
                grptype: o.IND_OR_GROUP_DESC || "",
                location: o.LOCATION || "",
                transport: o.TYPE_OF_TRANSPORTATION || "",
                altcostcenter: o.ALTERNATE_COST_CENTER || "",
                doc1: o.ATTACHMENT1 || "",
                doc2: o.ATTACHMENT2 || "",
                comment: o.REMARK || "",
                eventdetail1: o.EVENT_FIELD1 || "",
                eventdetail2: o.EVENT_FIELD2 || "",
                eventdetail3: o.EVENT_FIELD3 || "",
                eventdetail4: o.EVENT_FIELD4 || "",
                reqid: o.REQUEST_ID || "",
                reqstatus: o.STATUS_DESC || "",
                reqstatus_id: o.STATUS_ID || "",
                costcenter: o.COST_CENTER || "",
                cashadvamt: o.CASH_ADVANCE || 0,       // will be recalculated from items below anyway
                reqamt: o.PREAPPROVAL_AMOUNT || 0, // will be recalculated from items
                claimtype: o.CLAIM_TYPE_ID || "",
                claimtypedesc: o.CLAIM_TYPE_DESC || "",
                reqdate: o.REQUEST_DATE
            };
        },

        // For Claim.
        async openItemFromClaimList(oEvent) {
            try {
                this.getView().setBusy(true);

                const oListItem = oEvent?.getParameter("listItem");

                let oCtx =
                    oListItem?.getBindingContext("claim_status") ||
                    oListItem?.getBindingContext("request_status") ||
                    oListItem?.getBindingContext() || null;

                if (!oCtx) {
                    const oTable = this.byId("tb_myapproval_claim"); // adjust ID if different
                    const oSelected = oTable?.getSelectedItem?.();
                    if (oSelected) {
                        oCtx =
                            oSelected.getBindingContext("claim_status") ||
                            oSelected.getBindingContext("request_status") ||
                            oSelected.getBindingContext();
                    }
                }

                if (!oCtx) {
                    sap.m.MessageToast.show("Select a claim to open");
                    return;
                }

                const row = oCtx.getObject();

                const sClaimId =
                    row.CLAIM_ID ||
                    row.CLAIM_REQUEST_ID ||
                    row.CLAIMID ||
                    null;

                if (!sClaimId) {
                    sap.m.MessageToast.show("Claim ID is missing on the selected row.");
                    return;
                }

                // Load claim header + items and populate claimsubmission_input model
                await this._loadClaimById(String(sClaimId));

                // === Manual navigation to Claim Submission (like ClaimStatus.controller) ===
                this._navToClaimSubmissionManual();

            } catch (e) {
                sap.base.Log.error("openItemFromClaimList failed:", e);
                sap.m.MessageToast.show("Failed to open the selected claim.");
            } finally {
                this.getView().setBusy(false);
            }
        },
        _getClaimInputModel: function () {
            // Try view first (if you intend view-scope)
            let oModel = this.getView().getModel("claimsubmission_input");
            if (oModel) return oModel;

            // Fallback to component-scope
            oModel = this.getOwnerComponent().getModel("claimsubmission_input");
            if (oModel) return oModel;

            // Last resort: create at component so other views can reuse it
            oModel = new sap.ui.model.json.JSONModel({
                claim_header: {},
                claim_items: [],
                claim_items_count: 0
            });
            this.getOwnerComponent().setModel(oModel, "claimsubmission_input");
            return oModel;
        },

        _mapClaimHeaderToForm(o) {
            return {
                purpose: o.PURPOSE || "",
                claim_id: o.CLAIM_ID || "",
                trip_start_date: o.TRIP_START_DATE || "",
                trip_end_date: o.TRIP_END_DATE || "",
                event_start_date: o.EVENT_START_DATE || "",
                event_end_date: o.EVENT_END_DATE || "",
                comment: o.COMMENT || "",
                location: o.LOCATION || "",
                cost_center: o.COST_CENTER || "",
                alternate_cost_center: o.ALTERNATE_COST_CENTER || "",
                status_id: o.STATUS || "",
                total_claim_amount: o.TOTAL_CLAIM_AMOUNT || 0,
                cash_advance_amount: o.CASH_ADVANCE_AMOUNT || 0,
                final_amount_to_receive: o.FINAL_AMOUNT_TO_RECEIVE || 0,
            };


        },

        async _loadClaimById(sClaimId) {

            const oClaimInput = this._getClaimInputModel()

            //const oModel = this.getOwnerComponent().getModel("employee_view");
            const oModel = await this._ensureModelReady("employee_view");
            const sId = String(sClaimId);

            const aFilters = [new sap.ui.model.Filter("CLAIM_ID", sap.ui.model.FilterOperator.EQ, sId)];

            // Header binding
            const oHeaderBinding = oModel.bindList(
                "/ZEMP_CLAIM_HEADER_VIEW", // <-- adjust if different
                null,
                null,
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    $select: [
                        "CLAIM_ID", "REQUEST_ID", "PURPOSE", "TRIP_START_DATE", "TRIP_END_DATE",
                        "EVENT_START_DATE", "EVENT_END_DATE", "COMMENT", "LOCATION", "COST_CENTER",
                        "ALTERNATE_COST_CENTER", "STATUS_ID", "STATUS_DESC",
                        "TOTAL_CLAIM_AMOUNT", "PREAPPROVED_AMOUNT", "CASH_ADVANCE_AMOUNT", "FINAL_AMOUNT_TO_RECEIVE"
                    ]
                }
            );

            // Items binding
            const oItemBinding = oModel.bindList(
                "/ZEMP_CLAIM_ITEM_VIEW", // <-- adjust if different
                null,
                [new sap.ui.model.Sorter("CLAIM_SUB_ID", false)],
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    $select: [
                        "CLAIM_ID", "CLAIM_SUB_ID", "START_DATE", "RECEIPT_NUMBER",
                        "CLAIM_TYPE_ID", "CLAIM_TYPE_ITEM_ID", "AMOUNT", "CLAIM_CATEGORY"
                    ]
                }
            );

            try {
                const [aHeaderCtx, aItemCtx] = await Promise.all([
                    oHeaderBinding.requestContexts(0, 1),
                    oItemBinding.requestContexts(0, Infinity)
                ]);

                // Header
                const oHeaderRaw = aHeaderCtx[0]?.getObject();
                if (!oHeaderRaw) {
                    sap.m.MessageToast.show("No claim header found for the selected item.");
                    oClaimInput.setProperty("/claim_header", {});
                    oClaimInput.setProperty("/claim_items", []);
                    oClaimInput.setProperty("/claim_items_count", 0);
                    return { header: null, items: [] };
                }

                const oHeader = this._mapClaimHeaderToForm(oHeaderRaw);
                oClaimInput.setProperty("/claim_header", oHeader);

                // Items
                const aItems = aItemCtx.map(ctx => ctx.getObject()).map(it => ({
                    // Map to the fragment's structure
                    claim_sub_id: it.CLAIM_SUB_ID,
                    start_date: it.START_DATE,
                    receipt_number: it.RECEIPT_NUMBER,
                    amount: it.AMOUNT != null ? parseFloat(it.AMOUNT) : 0,
                    // Provide `descr/*` fields the fragment uses
                    descr: {
                        claim_type_id: it.CLAIM_TYPE_ID || "",
                        claim_type_item_id: it.CLAIM_TYPE_ITEM_ID || "",
                        claim_category: it.CLAIM_CATEGORY || ""
                    }
                }));

                // Derive totals from items (just in case)
                const nTotal = aItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

                // Only overwrite header totals if header had null/0 (tweak to your preference)
                if (!oHeader.total_claim_amount) {
                    oClaimInput.setProperty("/claim_header/total_claim_amount", nTotal);
                }

                oClaimInput.setProperty("/claim_items", aItems);
                oClaimInput.setProperty("/claim_items_count", aItems.length);

                return { header: oHeaderRaw, items: aItems };
            } catch (err) {
                console.error("Failed to load claim header/items:", err);
                oClaimInput.setProperty("/claim_header", {});
                oClaimInput.setProperty("/claim_items", []);
                oClaimInput.setProperty("/claim_items_count", 0);
                return { header: null, items: [] };
            }
        },

        // Wait until a named model exists on the Component.
        _waitForModel(name) {
            return new Promise((resolve) => {
                const check = () => {
                    const m = this.getOwnerComponent().getModel(name);
                    if (m) {
                        resolve(m);
                    } else {
                        setTimeout(check, 40);
                    }
                };
                check();
            });
        },

        // For V4: wait for metadata to be available.
        // For V2 models, fallback to metadataLoaded if present.
        async _ensureModelReady(name) {
            const oModel = await this._waitForModel(name);
            // V4 meta ready
            if (oModel?.getMetaModel?.()?.requestObject) {
                try {
                    await oModel.getMetaModel().requestObject("/$EntityContainer");
                } catch (e) {
                    // swallow; some backends may restrict $EntityContainer; any requestObject call will do
                    await oModel.getMetaModel().requestObject("/");
                }
                return oModel;
            }
            // V2 meta ready
            if (oModel?.metadataLoaded) {
                await oModel.metadataLoaded();
            }
            return oModel;
        },

    });
});