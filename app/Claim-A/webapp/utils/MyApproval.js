sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Filter, FilterOperator, Sorter, JSONModel, MessageToast) {
    "use strict";

    return {

        navigateFromId: async function (oController, sId) {
            if (sId.startsWith("REQ")) {
                await this.navigateToRequest(oController, sId);
            } else if (sId.startsWith("CLM")) {
                await this.navigateToClaim(oController, sId);
            } 
        },

        navigateToRequest: async function (oController, sRequestId) {
            try {
                oController.getView().setBusy(true);

                const oReqModel = oController.getOwnerComponent().getModel("request");
                oReqModel.setProperty("/view", "view");

                await this._loadRequestById(oController, String(sRequestId));

                oController.getOwnerComponent().getRouter().navTo("RequestForm", {
                    request_id: encodeURIComponent(String(sRequestId))
                });
            } catch (e) {
                console.error("failed:", e);
                MessageToast.show("Failed to load request");
            } finally {
                oController.getView().setBusy(false);
            }
        },

        navigateToClaim: async function (oController, sClaimId) {
            try {
                oController.getView().setBusy(true);

                await this._loadClaimById(oController, String(sClaimId));

                oController.getOwnerComponent().getRouter().navTo("ClaimSubmission", {
                    claim_id: encodeURIComponent(String(sClaimId))
                });
            } catch (e) {
                console.error("failed:", e);
                MessageToast.show("Failed to load claim");
            } finally {
                oController.getView().setBusy(false);
            }
        },

        _loadRequestById: async function (oController, sRequestId) {
            const oReq = oController.getOwnerComponent().getModel("request");
            const oModel = await this._ensureModelReady(oController, "employee_view");

            const aFilters = [new Filter("REQUEST_ID", FilterOperator.EQ, sRequestId)];

            const oHeaderBinding = oModel.bindList("/ZEMP_REQUEST_VIEW", null, null, aFilters, {
                $$ownRequest: true,
                $count: true,
                $select: [
                    "REQUEST_ID", "REQUEST_TYPE_ID", "IND_OR_GROUP_DESC",
                    "TRIP_START_DATE", "TRIP_END_DATE", "EVENT_START_DATE", "EVENT_END_DATE",
                    "OBJECTIVE_PURPOSE", "TYPE_OF_TRANSPORTATION", "ALTERNATE_COST_CENTER",
                    "LOCATION", "COST_CENTER", "CASH_ADVANCE", "PREAPPROVAL_AMOUNT",
                    "ATTACHMENT1", "ATTACHMENT2", "STATUS", "STATUS_DESC", "CLAIM_TYPE_ID",
                    "EVENT_FIELD1", "EVENT_FIELD2", "EVENT_FIELD3", "EVENT_FIELD4"
                ]
            });

            const oItemBinding = oModel.bindList("/ZEMP_REQUEST_ITEM_VIEW", null,
                [new Sorter("REQUEST_SUB_ID", false)], aFilters, {
                    $$ownRequest: true,
                    $count: true,
                    $select: ["REQUEST_ID", "REQUEST_SUB_ID", "EST_NO_PARTICIPANT", "EST_AMOUNT", "CASH_ADVANCE"]
                }
            );

            try {
                const [aHeaderCtx, aItemCtx] = await Promise.all([
                    oHeaderBinding.requestContexts(0, 1),
                    oItemBinding.requestContexts(0, Infinity)
                ]);

                const oHeader = aHeaderCtx[0]?.getObject();
                if (!oHeader) {
                    oReq.setProperty("/req_header", {});
                    oReq.setProperty("/req_item_rows", []);
                    oReq.setProperty("/list_count", 0);
                    return;
                }

                oReq.setProperty("/req_header", this._mapHeaderToForm(oHeader));

                const aItems = aItemCtx.map(ctx => ctx.getObject());
                aItems.forEach(it => {
                    if (it.EST_AMOUNT != null) it.EST_AMOUNT = parseFloat(it.EST_AMOUNT);
                    if (it.EST_NO_PARTICIPANT != null) it.EST_NO_PARTICIPANT = parseInt(it.EST_NO_PARTICIPANT, 10);
                });

                const cashadv_amt = aItems.reduce((sum, it) =>
                    it.CASH_ADVANCE === "YES" ? sum + (Number(it.EST_AMOUNT) || 0) : sum, 0);
                const req_amt = aItems.reduce((sum, it) =>
                    it.CASH_ADVANCE === null || it.CASH_ADVANCE === "NO" ? sum + (Number(it.EST_AMOUNT) || 0) : sum, 0);

                oReq.setProperty("/req_header/cashadvamt", cashadv_amt);
                oReq.setProperty("/req_header/reqamt", req_amt);
                oReq.setProperty("/req_item_rows", aItems);
                oReq.setProperty("/list_count", aItems.length);
                oReq.setProperty("/view", "approver");

            } catch (err) {
                console.error("_loadRequestById failed:", err);
                oReq.setProperty("/req_header", {});
                oReq.setProperty("/req_item_rows", []);
                oReq.setProperty("/list_count", 0);
            }
        },

        _loadClaimById: async function (oController, sClaimId) {
            const oClaimInput = this._getClaimInputModel(oController);
            const oModel = await this._ensureModelReady(oController, "employee_view");
            const oModel2 = oController.getOwnerComponent().getModel();

            const aFilters = [new Filter("CLAIM_ID", FilterOperator.EQ, sClaimId)];

            const oHeaderBinding = oModel.bindList("/ZEMP_CLAIM_HEADER_VIEW", null, null, aFilters, {
                $$ownRequest: true, $count: true, $select: ["*"]
            });
            const oItemBinding = oModel2.bindList("/ZCLAIM_ITEM", null,
                [new Sorter("CLAIM_SUB_ID", false)], aFilters, {
                    $$ownRequest: true, $count: true, $select: ["*"]
                }
            );
            const oItemDescrBinding = oModel.bindList("/ZEMP_CLAIM_ITEM_VIEW", null,
                [new Sorter("CLAIM_SUB_ID", false)], aFilters, {
                    $$ownRequest: true, $count: true, $select: ["*"]
                }
            );

            try {
                const [aHeaderCtx, aItemCtx, aItemDCtx] = await Promise.all([
                    oHeaderBinding.requestContexts(0, 1),
                    oItemBinding.requestContexts(0, Infinity),
                    oItemDescrBinding.requestContexts(0, Infinity)
                ]);

                const oHeaderRaw = aHeaderCtx[0]?.getObject();
                if (!oHeaderRaw) {
                    oClaimInput.setProperty("/claim_header", {});
                    oClaimInput.setProperty("/claim_items", []);
                    oClaimInput.setProperty("/claim_items_count", 0);
                    return;
                }

                oClaimInput.setProperty("/claim_header", this._mapClaimHeaderToForm(oHeaderRaw));

                const aItems = aItemCtx.map(ctx => ctx.getObject()).map(it => ({
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
                    descr: {}
                }));

                oClaimInput.setProperty("/claim_items", aItems);
                oClaimInput.setProperty("/claim_items_count", aItems.length);

                const aItemsD = aItemDCtx.map(ctx => ctx.getObject()).map(it => ({
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

                oClaimInput.getProperty("/claim_items").forEach((item, i) => {
                    oClaimInput.setProperty("/claim_items/" + i + "/descr", aItemsD[i]);
                });

            } catch (err) {
                console.error("_loadClaimById failed:", err);
                oClaimInput.setProperty("/claim_header", {});
                oClaimInput.setProperty("/claim_items", []);
                oClaimInput.setProperty("/claim_items_count", 0);
            }
        },

        _mapHeaderToForm: function (o) {
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
                cashadvamt: o.CASH_ADVANCE || 0,
                reqamt: o.PREAPPROVAL_AMOUNT || 0,
                claimtype: o.CLAIM_TYPE_ID || "",
                claimtypedesc: o.CLAIM_TYPE_DESC || "",
                reqdate: o.REQUEST_DATE
            };
        },

        _mapClaimHeaderToForm: function (o) {
            return {
                claim_id: o.CLAIM_ID,
                emp_id: o.EMP_ID,
                purpose: o.PURPOSE,
                trip_start_date: o.TRIP_START_DATE,
                trip_end_date: o.TRIP_END_DATE,
                status_id: o.STATUS_ID,
                claim_type_id: o.CLAIM_TYPE_ID,
                total_claim_amount: o.TOTAL_CLAIM_AMOUNT,
                final_amount_to_receive: o.FINAL_AMOUNT_TO_RECEIVE,
                cost_center: o.COST_CENTER,
                descr: {
                    status_id: o.STATUS_DESC,
                    claim_type_id: o.CLAIM_TYPE_DESC,
                    cost_center: o.COST_CENTER_DESC,
                    alternate_cost_center: o.ALT_COST_CENTER_DESC,
                }
            };
        },

        _getClaimInputModel: function (oController) {
            let oModel = oController.getView().getModel("claimsubmission_input")
                || oController.getOwnerComponent().getModel("claimsubmission_input");

            if (!oModel) {
                oModel = new JSONModel({
                    emp_master: {},
                    claim_header: {},
                    claim_items: [],
                    claim_items_count: 0,
                    is_new: false,
                    is_approver: true,
                    view_only: true
                });
                oController.getOwnerComponent().setModel(oModel, "claimsubmission_input");
            }
            return oModel;
        },

        _waitForModel: function (oController, name) {
            return new Promise((resolve) => {
                const check = () => {
                    const m = oController.getOwnerComponent().getModel(name);
                    if (m) resolve(m);
                    else setTimeout(check, 40);
                };
                check();
            });
        },

        _ensureModelReady: async function (oController, name) {
            const oModel = await this._waitForModel(oController, name);
            if (oModel?.getMetaModel?.()?.requestObject) {
                try {
                    await oModel.getMetaModel().requestObject("/$EntityContainer");
                } catch (e) {
                    await oModel.getMetaModel().requestObject("/");
                }
            }
            return oModel;
        }
    };
});