sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
	"claima/utils/Utility"
], function (Controller, MessageToast, JSONModel, Filter, FilterOperator, Sorter, Utility) {
    "use strict";

    return Controller.extend("claima.controller.MyApproval", {

        /* =========================================================
        * Lifecycle
        * ======================================================= */
        onInit: async function() {
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
            this._oReqModel = this.getOwnerComponent().getModel("request");
            this._oReqStatusModel = this.getOwnerComponent().getModel("request_status");
            this._oEmployeeViewModel = this.getOwnerComponent().getModel("employee_view");
            this._oClaimStatusModel = this.getOwnerComponent().getModel("claim_status");
            this._oSessionModel 	= this.getOwnerComponent().getModel("session");
            this.getOwnerComponent().getRouter().getRoute("MyApproval").attachPatternMatched(this._onMatched, this);
        },

        _onMatched: async function() {
            await this._getMyApproverPAReq();
			await this._getMyApproverClaim();
        },

        _getMyApproverPAReq: async function () {
			const oApproverOrSub = new Filter({
				filters: [
					new Filter(this._oConstant.EntitiesFields.APPROVER_ID, FilterOperator.EQ, this._oSessionModel.getProperty("/userId")),
					new Filter(this._oConstant.EntitiesFields.SUBAPPROVER_ID, FilterOperator.EQ, this._oSessionModel.getProperty("/userId"))
				],
				and: false // OR condition between the two
			});

			const oStatusPending = new Filter(
				this._oConstant.EntitiesFields.STATUS,
				FilterOperator.EQ,
				this._oConstant.ClaimStatus.PENDING_APPROVAL // use the exact code/value your backend expects
			);
			// (APPROVER = id OR SUBSTITUTE_APPROVER = id) AND STATUS = 'PENDING APPROVAL'
			const oCombined = new Filter({
				filters: [oApproverOrSub, oStatusPending],
				and: true // AND between groups
			});


			const oListBinding = this._oEmployeeViewModel.bindList("/ZEMP_APPROVER_REQUEST_DETAILS", undefined,
				[new Sorter(this._oConstant.EntitiesFields.STATUS, true)], // desc by STATUS
				[oCombined],
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

				this._oReqStatusModel.setProperty("/req_header_list", a);
				this._oReqStatusModel.setProperty("/req_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				this._oReqStatusModel.setProperty("/req_header_list", []);
				this._oReqStatusModel.setProperty("/req_header_count", 0);
				return [];
			}
		},

        _getMyApproverClaim: async function () {
			const oApproverOrSub = new Filter({
				filters: [
					new Filter(this._oConstant.EntitiesFields.APPROVER_ID, FilterOperator.EQ, this._oSessionModel.getProperty("/userId")),
					new Filter(this._oConstant.EntitiesFields.SUBAPPROVER_ID, FilterOperator.EQ, this._oSessionModel.getProperty("/userId"))
				],
				and: false // OR condition between the two
			});

			const oStatusPending = new Filter(
				"STATUS",
				FilterOperator.EQ,
				this._oConstant.ClaimStatus.PENDING_APPROVAL // use the exact code/value your backend expects
			);
			// (APPROVER = id OR SUBSTITUTE_APPROVER = id) AND STATUS = 'PENDING APPROVAL'
			const oCombined = new Filter({
				filters: [oApproverOrSub, oStatusPending],
				and: true // AND between groups
			});
			const oListBinding = this._oEmployeeViewModel.bindList("/ZEMP_APPROVER_CLAIM_DETAILS", undefined,
				[new Sorter("STATUS", true)], // desc by STATUS
				[oCombined],

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
					if (it.TOTAL_CLAIM_AMOUNT == null) it.TOTAL_CLAIM_AMOUNT = 0.0;
				});

				this._oClaimStatusModel.setProperty("/claim_header_list", a);
				this._oClaimStatusModel.setProperty("/claim_header_count", a.length);

				return a;
			} catch (err) {
				console.error("OData bindList failed:", err);
				this._oClaimStatusModel.setProperty("/claim_header_list", []);
				this._oClaimStatusModel.setProperty("/claim_header_count", 0);
				return [];
			}
		},

        /* =========================================================
        * Helpers: Model & Service
        * ======================================================= */

        //Manual Navigation for Claim Submission


        _getRootAndContainer: function () {
            const oRootView = this.getOwnerComponent().getRootControl();
            if (!oRootView) throw new Error("Root view not available");
            const oPageContainer = oRootView.byId("pageContainer");
            if (!oPageContainer) throw new Error("pageContainer not found in Root view");
            return { oRootView, oPageContainer };
        },



        /* =========================================================
        * Main Logic
        * ======================================================= */

        //Aiman Salim - Added for MyApproval - Pre Approval Request

        async openItemFromList(oEvent) {
            try {
                this.getView().setBusy(true);

                this._oReqModel.setProperty("/view", "view");

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
                    MessageToast.show(Utility.getText("msg_approval_select_req"));
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
                    MessageToast.show(Utility.getText("msg_approval_missing_req"));
                    return;
                }

                // Load header + items from backend (not from the list row)
                await this._loadRequestById(String(sRequestId));

                // Keep your DRAFT switching logic if needed
                if (row.STATUS === "DRAFT") {
                    this._oReqModel.setProperty("/view", "list");
                }

                // Navigate with the request_id
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RequestForm", { request_id: encodeURIComponent(String(sRequestId)) });
            } catch (e) {
                jQuery.sap.log.error("openItemFromList failed: " + e);
                MessageToast.show(Utility.getText("msg_approval_failed_req"));
            } finally {
                this.getView().setBusy(false);
            }
        },

        /**
 * Loads the request's header & items by REQUEST_ID
 * and populates the "request" JSONModel.
 */
        async _loadRequestById(sRequestId) {
            const _oEmployeeViewModel = await this._ensureModelReady("employee_view");
            const sReq = String(sRequestId);

            // Build a shared filter for both calls
            const aFilters = [
                new Filter("REQUEST_ID", FilterOperator.EQ, sReq)
            ];

            // Header binding (should return one row)
            const oHeaderBinding = _oEmployeeViewModel.bindList(
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
            const oItemBinding = _oEmployeeViewModel.bindList(
                "/ZEMP_REQUEST_ITEM_VIEW",
                null,
                [new Sorter("REQUEST_SUB_ID", false)],
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
                    MessageToast.show(Utility.getText("msg_approval_header_req"));
                    // Clear and bail gracefully
                    this._oReqModel.setProperty("/req_header", {});
                    this._oReqModel.setProperty("/req_item_rows", []);
                    this._oReqModel.setProperty("/list_count", 0);
                    return { header: null, items: [] };
                }

                // Map/normalize header into your form shape
                const oReqHeader = this._mapHeaderToForm(oHeader);
                this._oReqModel.setProperty("/req_header", oReqHeader);

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

                this._oReqModel.setProperty("/req_header/cashadvamt", cashadv_amt);
                this._oReqModel.setProperty("/req_header/reqamt", req_amt);
                this._oReqModel.setProperty("/req_item_rows", aItems);
                this._oReqModel.setProperty("/list_count", aItems.length);
                this._oReqModel.setProperty("/view", "approver");

                return { header: oHeader, items: aItems };
            } catch (err) {
                console.error("Failed to load header/items:", err);
                this._oReqModel.setProperty("/req_header", {});
                this._oReqModel.setProperty("/req_item_rows", []);
                this._oReqModel.setProperty("/list_count", 0);
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
                    MessageToast.show(Utility.getText("msg_approval_select_clm"));
                    return;
                }

                const row = oCtx.getObject();

                const sClaimId =
                    row.CLAIM_ID ||
                    row.CLAIM_REQUEST_ID ||
                    row.CLAIMID ||
                    null;

                if (!sClaimId) {
                    MessageToast.show(Utility.getText("msg_approval_missing_clm"));
                    return;
                }

                // Load claim header + items and populate claimsubmission_input model
                await this._loadClaimById(String(sClaimId));

                // Navigate to claim submission ID
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("ClaimSubmission", { claim_id: encodeURIComponent(String(sClaimId)) });
            } catch (e) {
                console.log("openItemFromClaimList failed:", e);
                MessageToast.show(Utility.getText("msg_approval_failed_clm"));
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
            oModel = new JSONModel({
                emp_master: {},
                claim_header: {},
                claim_items: [],
                claim_items_count: 0,
                is_new: false,
                is_approver: true,
				view_only: true
            });
            this.getOwnerComponent().setModel(oModel, "claimsubmission_input");

            return oModel;
        },

        _mapClaimHeaderToForm(o) {
            return {
                claim_id: o.CLAIM_ID,
				emp_id: o.EMP_ID,
				purpose: o.PURPOSE,
				trip_start_date: o.TRIP_START_DATE,
				trip_end_date: o.TRIP_END_DATE,
				event_start_date: o.EVENT_START_DATE,
				event_end_date: o.EVENT_END_DATE,
				submission_type: o.SUBMISSION_TYPE,
				comment: o.COMMENT,
				alternate_cost_center: o.ALTERNATE_COST_CENTER,
				cost_center: o.COST_CENTER,
				request_id: o.REQUEST_ID,
				attachment_email_approver: o.ATTACHMENT_EMAIL_APPROVER,
				status_id: o.STATUS_ID,
				claim_type_id: o.CLAIM_TYPE_ID,
				total_claim_amount: o.TOTAL_CLAIM_AMOUNT,
				final_amount_to_receive: o.FINAL_AMOUNT_TO_RECEIVE,
				last_modified_date: o.LAST_MODIFIED_DATE,
				submitted_date: o.SUBMITTED_DATE,
				last_approved_date: o.LAST_APPROVED_DATE,
				last_approved_time: o.LAST_APPROVED_TIME,
				payment_date: o.PAYMENT_DATE,
				location: o.LOCATION,
				spouse_office_address: o.SPOUSE_OFFICE_ADDRESS,
				house_completion_date: o.HOUSE_COMPLETION_DATE,
				move_in_date: o.MOVE_IN_DATE,
				housing_loan_scheme: o.HOUSING_LOAN_SCHEME,
				lender_name: o.LENDER_NAME,
				specify_details: o.SPECIFY_DETAILS,
				new_house_address: o.NEW_HOUSE_ADDRESS,
				dist_old_house_to_office_km: o.DIST_OLD_HOUSE_TO_OFFICE_KM,
				dist_old_house_to_new_house_km: o.DIST_OLD_HOUSE_TO_NEW_HOUSE_KM,
				approver1: null,
				approver2: null,
				approver3: null,
				approver4: null,
				approver5: null,
				last_send_back_date: null,
				course_code: null,
				project_code: null,
				cash_advance_amount: o.CASH_ADVANCE_AMOUNT,
				preapproved_amount: o.PREAPPROVED_AMOUNT,
				reject_reason_id: null,
				send_back_reason_id: null,
				last_send_back_time: null,
				reject_reason_date: null,
				reject_reason_time: null,
                descr: {
                    submission_type: null,
                    alternate_cost_center: o.ALT_COST_CENTER_DESC,
                    cost_center: o.COST_CENTER_DESC,
                    request_id: null,
                    status_id: o.STATUS_DESC,
                    claim_type_id: o.CLAIM_TYPE_DESC,
                    housing_loan_scheme: null,
                    lender_name: null,
                    course_code: null,
                    project_code: null,
                    attachment_email_approver: null,
                }
            };


        },

        async _loadClaimById(sClaimId) {
            const oClaimInputModel = this._getClaimInputModel();
            const oModel = await this._ensureModelReady("employee_view");
            const sId = String(sClaimId);

            const aFilters = [new Filter("CLAIM_ID", FilterOperator.EQ, sId)];

            // Header binding
            const oHeaderBinding = oModel.bindList(
                "/ZEMP_CLAIM_HEADER_VIEW", // <-- adjust if different
                null,
                null,
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    $select: ["*"]
                }
            );

            // Items binding
            const oItemBinding = this.getOwnerComponent().getModel().bindList(
                "/ZCLAIM_ITEM", // <-- adjust if different
                null,
                [new Sorter("CLAIM_SUB_ID", false)],
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    $select: ["*"]
                }
            );

            // Items Descr binding
            const oItemDescrBinding = oModel.bindList(
                "/ZEMP_CLAIM_ITEM_VIEW", // <-- adjust if different
                null,
                [new Sorter("CLAIM_SUB_ID", false)],
                aFilters,
                {
                    $$ownRequest: true,
                    $count: true,
                    $select: ["*"]
                }
            );

            try {
                const [aHeaderCtx, aItemCtx, aItemDCtx] = await Promise.all([
                    oHeaderBinding.requestContexts(0, 1),
                    oItemBinding.requestContexts(0, Infinity),
                    oItemDescrBinding.requestContexts(0, Infinity)
                ]);

                // Header
                const oHeaderRaw = aHeaderCtx[0]?.getObject();
                if (!oHeaderRaw) {
                    MessageToast.show(Utility.getText("msg_approval_header_clm"));
                    oClaimInputModel.setProperty("/claim_header", {});
                    oClaimInputModel.setProperty("/claim_items", []);
                    oClaimInputModel.setProperty("/claim_items_count", 0);
                    return { header: null, items: [] };
                }

                const oHeader = this._mapClaimHeaderToForm(oHeaderRaw);
                oClaimInputModel.setProperty("/claim_header", oHeader);
				await this._getClaimHeaderDataDescr(oClaimInputModel);

				// set view-only for non-draft claims
				if (
					oClaimInputModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.DRAFT &&
					oClaimInputModel.getProperty("/claim_header/status_id") !== this._oConstant.ClaimStatus.SEND_BACK
				) {
					oClaimInputModel.setProperty("/view_only", true)
				}
				else {
					oClaimInputModel.setProperty("/view_only", false)
				}

				// enable is_approver from my approval
				if (!oClaimInputModel.getProperty("/is_approver")) {
					oClaimInputModel.setProperty("/is_approver", true)
				}

                // Items
                const aItems = aItemCtx.map(ctx => ctx.getObject()).map(it => ({
                    // Map to the fragment's structure
					claim_id: it.CLAIM_ID,
					claim_sub_id: it.CLAIM_SUB_ID,
					claim_type_item_id: it.CLAIM_TYPE_ITEM_ID,
					percentage_compensation: it.PERCENTAGE_COMPENSATION,
					account_no: it.ACCOUNT_NO,
					amount: it.AMOUNT != null ? parseFloat(it.AMOUNT) : 0,
					attachment_file_1: it.ATTACHMENT_FILE_1,
					attachment_file_2: it.ATTACHMENT_FILE_2,
					bill_no: it.BILL_NO,
					bill_date: it.BILL_DATE,
					claim_category: it.CLAIM_CATEGORY,
					country: it.COUNTRY,
					disclaimer: it.DISCLAIMER,
					start_date: it.START_DATE,
					end_date: it.END_DATE,
					start_time: it.START_TIME,
					end_time: it.END_TIME,
					flight_class: it.FLIGHT_CLASS,
					from_location: it.FROM_LOCATION,
					from_location_office: it.FROM_LOCATION_OFFICE,
					km: it.KM,
					location: it.LOCATION,
					location_type: it.LOCATION_TYPE,
					lodging_category: it.LODGING_CATEGORY,
					lodging_address: it.LODGING_ADDRESS,
					marriage_category: it.MARRIAGE_CATEGORY,
					area: it.AREA,
					no_of_family_member: it.NO_OF_FAMILY_MEMBER,
					parking: it.PARKING,
					phone_no: it.PHONE_NO,
					rate_per_km: it.RATE_PER_KM,
					receipt_date: it.RECEIPT_DATE,
					receipt_number: it.RECEIPT_NUMBER,
					remark: it.REMARK,
					room_type: it.ROOM_TYPE,
					region: it.REGION,
					from_state_id: it.FROM_STATE_ID,
					to_state_id: it.TO_STATE_ID,
					to_location: it.TO_LOCATION,
					to_location_office: it.TO_LOCATION_OFFICE,
					toll: it.TOLL,
					total_exp_amount: it.TOTAL_EXP_AMOUNT,
					vehicle_type: it.VEHICLE_TYPE,
					vehicle_fare: it.VEHICLE_FARE,
					trip_start_date: it.TRIP_START_DATE,
					trip_end_date: it.TRIP_END_DATE,
					event_start_date: it.EVENT_START_DATE,
					event_end_date: it.EVENT_END_DATE,
					travel_duration_day: it.TRAVEL_DURATION_DAY,
					travel_duration_hour: it.TRAVEL_DURATION_HOUR,
					provided_breakfast: it.PROVIDED_BREAKFAST,
					provided_lunch: it.PROVIDED_LUNCH,
					provided_dinner: it.PROVIDED_DINNER,
					entitled_breakfast: it.ENTITLED_BREAKFAST,
					entitled_lunch: it.ENTITLED_LUNCH,
					entitled_dinner: it.ENTITLED_DINNER,
					anggota_id: it.ANGGOTA_ID,
					anggota_name: it.ANGGOTA_NAME,
					dependent_name: it.DEPENDENT_NAME,
					type_of_professional_body: it.TYPE_OF_PROFESSIONAL_BODY,
					disclaimer_galakan: it.DISCLAIMER_GALAKAN,
					mode_of_transfer: it.MODE_OF_TRANSFER,
					transfer_date: it.TRANSFER_DATE,
					no_of_days: it.NO_OF_DAYS,
					family_count: it.FAMILY_COUNT,
					funeral_transportation: it.FUNERAL_TRANSPORTATION,
					round_trip: it.ROUND_TRIP,
					trip_end_time: it.TRIP_END_TIME,
					trip_start_time: it.TRIP_START_TIME,
					cost_center: it.COST_CENTER,
					gl_account: it.GL_ACCOUNT,
					material_code: it.MATERIAL_CODE,
					vehicle_ownership_id: it.VEHICLE_OWNERSHIP_ID,
					actual_amount: it.ACTUAL_AMOUNT,
					arrival_time: it.ARRIVAL_TIME,
					claim_type_id: it.CLAIM_TYPE_ID,
					course_title: it.COURSE_TITLE,
					currency_amount: it.CURRENCY_AMOUNT,
					currency_code: it.CURRENCY_CODE,
					currency_rate: it.CURRENCY_RATE,
					departure_time: it.DEPARTURE_TIME,
					dependent: it.DEPENDENT,
					dependent_relationship: it.DEPENDENT_RELATIONSHIP,
					emp_id: it.EMP_ID,
					fare_type_id: it.FARE_TYPE_ID,
					insurance_cert_end_date: it.INSURANCE_CERT_END_DATE,
					insurance_cert_start_date: it.INSURANCE_CERT_START_DATE,
					insurance_package_id: it.INSURANCE_PACKAGE_ID,
					insurance_provider_id: it.INSURANCE_PROVIDER_ID,
					insurance_provider_name: it.INSURANCE_PROVIDER_NAME,
					insurance_purchase_date: it.INSURANCE_PURCHASE_DATE,
					meter_cube_actual: it.METER_CUBE_ACTUAL,
					meter_cube_entitled: it.METER_CUBE_ENTITLED,
					mobile_category_purpose_id: it.MOBILE_CATEGORY_PURPOSE_ID,
					need_foreign_currency: it.NEED_FOREIGN_CURRENCY,
					policy_number: it.POLICY_NUMBER,
					purpose: it.PURPOSE,
					request_approval_amount: it.REQUEST_APPROVAL_AMOUNT,
					study_levels_id: it.STUDY_LEVELS_ID,
					travel_days_id: it.TRAVEL_DAYS_ID,
					vehicle_class_id: it.VEHICLE_CLASS_ID,
                    descr: {},
                }));

                // Derive totals from items (just in case)
                const nTotal = aItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

                // Only overwrite header totals if header had null/0 (tweak to your preference)
                if (!oHeader.total_claim_amount) {
                    oClaimInputModel.setProperty("/claim_header/total_claim_amount", nTotal);
                }

                oClaimInputModel.setProperty("/claim_items", aItems);
                oClaimInputModel.setProperty("/claim_items_count", aItems.length);

                // Items
                const aItemsD = aItemDCtx.map(ctx => ctx.getObject()).map(it => ({
                    // Provide `descr/*` fields the fragment uses
                    claim_type_item_id: it.CLAIM_TYPE_ITEM_DESC,
                    claim_category: it.CLAIM_CATEGORY_DESC,
                    country: it.COUNTRY_DESC,
                    flight_class: it.FLIGHT_CLASS_DESC,
                    from_location_office: null,
                    location_type: it.LOC_TYPE_DESC,
                    lodging_category: it.LODGING_CATEGORY_DESC,
                    marriage_category: it.MARRIAGE_CATEGORY_DESC,
                    area: it.AREA_DESC,
                    rate_per_km: null,
                    room_type: it.ROOM_TYPE_DESC,
                    region: it.REGION_DESC,
                    from_state_id: null,
                    to_state_id: null,
                    to_location_office: null,
                    vehicle_type: it.VEHICLE_TYPE_DESC,
                    type_of_professional_body: null,
                    mode_of_transfer: null,
                    no_of_days: null,
                    funeral_transportation: null,
                    material_code: null,
                    vehicle_ownership_id: it.VEHICLE_OWNERSHIP_DESC,
                    dependent: null,
                    dependent_relationship: null,
                    fare_type_id: null,
                    insurance_package_id: null,
                    insurance_provider_id: null,
                    meter_cube_entitled: null,
                    mobile_category_purpose_id: null,
                    study_levels_id: null,
                    claim_type_id: it.CLAIM_TYPE_DESC,
                    vehicle_class_id: null,
                    attachment_file_1: null,
                    attachment_file_2: null,
                }));

                // assign description based on claim item index
                oClaimInputModel.getProperty("/claim_items").forEach( function (claim_item, i) {
                    oClaimInputModel.setProperty("/claim_items/" + i + "/descr", aItemsD[i]);
                });

                // set employee data
                const emp_data = await this._getEmpIdDetail(this._oSessionModel.getProperty("/userId"));
                if (emp_data) {
                    oClaimInputModel.setProperty("/emp_master", emp_data);
                    await this._getEmpDataDescr(oClaimInputModel);
                }

                return { header: oHeaderRaw, items: aItems };
            } catch (err) {
                console.error("Failed to load claim header/items:", err);
                oClaimInputModel.setProperty("/claim_header", {});
                oClaimInputModel.setProperty("/claim_items", []);
                oClaimInputModel.setProperty("/claim_items_count", 0);
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

		// get backend data
		async _getEmpIdDetail(sEEID) {
			const oModel = this.getOwnerComponent().getModel();
			const oListBinding = oModel.bindList("/ZEMP_MASTER", null, null, [
				new Filter("EEID", FilterOperator.EQ, sEEID)
			]);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return {
						eeid: oData.EEID,
						name: oData.NAME,
						grade: oData.GRADE,
						cc: oData.CC,
						pos: oData.POS,
						dep: oData.DEP,
						unit_section: oData.UNIT_SECTION,
						b_place: oData.B_PLACE,
						marital: oData.MARITAL,
						job_group: oData.JOB_GROUP,
						office_location: oData.OFFICE_LOCATION,
						address_line1: oData.ADDRESS_LINE1,
						address_line2: oData.ADDRESS_LINE2,
						address_line3: oData.ADDRESS_LINE3,
						postcode: oData.POSTCODE,
						state: oData.STATE,
						country: oData.COUNTRY,
						contact_no: oData.CONTACT_NO,
						email: oData.EMAIL,
						direct_supperior: oData.DIRECT_SUPPERIOR,
						role: oData.ROLE,
						user_type: oData.USER_TYPE,
						mobile_bill_eligibility: oData.MOBILE_BILL_ELIGIBILITY,
						mobile_bill_elig_amount: oData.MOBILE_BILL_ELIG_AMOUNT,
						employee_type: oData.EMPLOYEE_TYPE,
						position_name: oData.POSITION_NAME,
						position_start_date: oData.POSITION_START_DATE,
						position_event_reason: oData.POSITION_EVENT_REASON,
						confirmation_date: oData.CONFIRMATION_DATE,
						effective_date: oData.EFFECTIVE_DATE,
						updated_date: oData.UPDATED_DATE,
						inserted_date: oData.INSERTED_DATE,
						medical_insurance_entitlement: oData.MEDICAL_INSURANCE_ENTITLEMENT,
						descr: {
							cc: null,
							dep: null,
							unit_section: null,
							marital: null,
							job_group: null,
							state: null,
							country: null,
							direct_supperior: null,
							role: null,
							user_type: null,
							employee_type: null
						}
					};
				} else {
					console.warn("No employee found with email: " + sEMAIL);
					return null;
				}
			} catch (oError) {
				console.error("Error fetching employee detail", oError);
				return null; // Return null so the app doesn't crash
			}
		},

		_getEmpDataDescr: async function (oModel) {
			// cost center
			if (oModel.getProperty("/emp_master/cc")) {
				oModel.setProperty("/emp_master/descr/cc", await this._bindEclaimDescr("/ZCOST_CENTER", oModel.getProperty("/emp_master/cc"), 'COST_CENTER_ID', 'COST_CENTER_DESC'));
			}
			// department
			if (oModel.getProperty("/emp_master/dep")) {
				oModel.setProperty("/emp_master/descr/dep", await this._bindEclaimDescr("/ZDEPARTMENT", oModel.getProperty("/emp_master/dep"), 'DEPARTMENT_ID', 'DEPARTMENT_DESC'));
			}
			// branch / unit section
			if (oModel.getProperty("/emp_master/unit_section")) {
				oModel.setProperty("/emp_master/descr/unit_section", await this._bindEclaimDescr("/ZBRANCH", oModel.getProperty("/emp_master/unit_section"), 'BRANCH_ID', 'BRANCH_DESC'));
			}
			// marital status
			if (oModel.getProperty("/emp_master/marital")) {
				oModel.setProperty("/emp_master/descr/marital", await this._bindEclaimDescr("/ZMARITAL_STAT", oModel.getProperty("/emp_master/marital"), 'MARRIAGE_STATUS_ID', 'MARRIAGE_STATUS_DESC'));
			}
			// job group
			if (oModel.getProperty("/emp_master/job_group")) {
				oModel.setProperty("/emp_master/descr/job_group", await this._bindEclaimDescr("/ZJOB_GROUP", oModel.getProperty("/emp_master/job_group"), 'JOB_GROUP_ID', 'JOB_GROUP_DESC'));
			}
			// office location
			if (oModel.getProperty("/emp_master/office_location")) {
				oModel.setProperty("/emp_master/descr/office_location", await this._bindEclaimDescr("/ZOFFICE_LOCATION", oModel.getProperty("/emp_master/office_location"), 'LOCATION_ID', 'LOCATION_DESC', oModel.getProperty("/emp_master/state"), 'STATE_ID'));
			}
			// state
			if (oModel.getProperty("/emp_master/state")) {
				oModel.setProperty("/emp_master/descr/state", await this._bindEclaimDescr("/ZSTATE", oModel.getProperty("/emp_master/state"), 'STATE_ID', 'STATE_DESC', oModel.getProperty("/emp_master/country"), 'COUNTRY_ID'));
			}
			// country
			if (oModel.getProperty("/emp_master/country")) {
				oModel.setProperty("/emp_master/descr/country", await this._bindEclaimDescr("/ZCOUNTRY", oModel.getProperty("/emp_master/country"), 'COUNTRY_ID', 'COUNTRY_DESC'));
			}
			// role
			if (oModel.getProperty("/emp_master/role")) {
				oModel.setProperty("/emp_master/descr/role", await this._bindEclaimDescr("/ZROLE", oModel.getProperty("/emp_master/role"), 'ROLE_ID', 'ROLE_DESC'));
			}
			// user type
			if (oModel.getProperty("/emp_master/user_type")) {
				oModel.setProperty("/emp_master/descr/user_type", await this._bindEclaimDescr("/ZUSER_TYPE", oModel.getProperty("/emp_master/user_type"), 'USER_TYPE_ID', 'USER_TYPE_DESC'));
			}
			// employee type
			if (oModel.getProperty("/emp_master/employee_type")) {
				oModel.setProperty("/emp_master/descr/employee_type", await this._bindEclaimDescr("/ZEMP_TYPE", oModel.getProperty("/emp_master/employee_type"), 'EMP_TYPE_ID', 'EMP_TYPE_DESC'));
			}
		},

		_getClaimHeaderDataDescr: async function (oModel) {
			// submission type
			if (oModel.getProperty("/claim_header/submission_type")) {
				oModel.setProperty("/claim_header/descr/submission_type", await this._bindEclaimDescr("/ZSUBMISSION_TYPE", oModel.getProperty("/claim_header/submission_type"), 'SUBMISSION_TYPE_ID', 'SUBMISSION_TYPE_DESC'));
			}
			// request ID
			if (oModel.getProperty("/claim_header/request_id")) {
				oModel.setProperty("/claim_header/descr/request_id", await this._bindEclaimDescr("/ZREQUEST_HEADER", oModel.getProperty("/claim_header/request_id"), 'REQUEST_ID', 'OBJECTIVE_PURPOSE'));
			}
		},

		_bindEclaimDescr: async function (oTable, oInputValue, oFieldId, oFieldDescr, oInputValue2, oFieldId2) {
			var aFilterArray = [new Filter(oFieldId, FilterOperator.EQ, oInputValue)];
			if (oFieldId2) {
				aFilterArray = aFilterArray.concat(new Filter(oFieldId2, FilterOperator.EQ, oInputValue2));
			}
			const oListBinding = this.getOwnerComponent().getModel().bindList(oTable, null, null, aFilterArray);

			try {
				const aContexts = await oListBinding.requestContexts(0, 1);

				if (aContexts.length > 0) {
					const oData = aContexts[0].getObject();
					return oData[oFieldDescr];
				} else {
					console.warn("No description found");
					return null;
				}
			} catch (oError) {
				console.error("Error fetching description: ", oError);
				return null; // Return null so the app doesn't crash
			}
		},

    });
});
