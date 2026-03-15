sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (MessageToast, JSONModel, Filter, FilterOperator, Sorter) {
  "use strict";

  /* ---------------------------
   * Helpers
   * --------------------------- */
  function _parseKeyFromV4Path(path, keyProp) {
    // e.g. /ZEMP_CLAIM_HEADER_VIEW(CLAIM_ID='202600000001')
    const re = new RegExp("\\(.*" + keyProp + "='([^']+)'.*\\)");
    const m = re.exec(path || "");
    return m ? m[1] : null;
  }

  function _waitForModel(controller, name) {
    return new Promise((resolve) => {
      const check = () => {
        const m = controller.getOwnerComponent().getModel(name);
        if (m) resolve(m); else setTimeout(check, 40);
      };
      check();
    });
  }

  async function ensureModelReady(controller, name) {
    const oModel = await _waitForModel(controller, name);
    // OData V4
    if (oModel?.getMetaModel?.()?.requestObject) {
      try {
        await oModel.getMetaModel().requestObject("/$EntityContainer");
      } catch (_e) {
        await oModel.getMetaModel().requestObject("/");
      }
      return oModel;
    }
    // OData V2
    if (oModel?.metadataLoaded) {
      await oModel.metadataLoaded();
    }
    return oModel;
  }

  function _getClaimInputModel(controller) {
    // 1) try view
    let oModel = controller.getView().getModel("claimsubmission_input");
    if (oModel) return oModel;

    // 2) component
    oModel = controller.getOwnerComponent().getModel("claimsubmission_input");
    if (oModel) return oModel;

    // 3) init
    oModel = new JSONModel({
      claim_header: {},
      claim_items: [],
      claim_items_count: 0,
      is_new: false,
      is_approver: false
    });
    controller.getOwnerComponent().setModel(oModel, "claimsubmission_input");
    return oModel;
  }

  function _mapClaimHeaderToForm(o) {
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
        attachment_email_approver: null
      }
    };
  }

  /* ---------------------------
   * Description helpers
   * --------------------------- */
  async function _bindEclaimDescr(controller, table, inputValue, idField, descField, inputValue2, idField2) {
    const oModel = controller.getOwnerComponent().getModel();
    let filters = [ new Filter(idField, FilterOperator.EQ, inputValue) ];
    if (idField2) filters.push(new Filter(idField2, FilterOperator.EQ, inputValue2));

    const list = oModel.bindList(table, null, null, filters);
    try {
      const aCtx = await list.requestContexts(0, 1);
      if (aCtx.length > 0) {
        const row = aCtx[0].getObject();
        return row[descField];
      }
    } catch (e) {
      // ignore; will return null
      // console.error("Descr lookup failed", e);
    }
    return null;
  }

  async function _getEmpIdDetail(controller, sEEID) {
    const oModel = controller.getOwnerComponent().getModel();
    const list = oModel.bindList("/ZEMP_MASTER", null, null, [
      new Filter("EEID", FilterOperator.EQ, sEEID)
    ]);

    try {
      const aCtx = await list.requestContexts(0, 1);
      if (aCtx.length === 0) return null;

      const o = aCtx[0].getObject();
      return {
        eeid: o.EEID,
        name: o.NAME,
        grade: o.GRADE,
        cc: o.CC,
        pos: o.POS,
        dep: o.DEP,
        unit_section: o.UNIT_SECTION,
        b_place: o.B_PLACE,
        marital: o.MARITAL,
        job_group: o.JOB_GROUP,
        office_location: o.OFFICE_LOCATION,
        address_line1: o.ADDRESS_LINE1,
        address_line2: o.ADDRESS_LINE2,
        address_line3: o.ADDRESS_LINE3,
        postcode: o.POSTCODE,
        state: o.STATE,
        country: o.COUNTRY,
        contact_no: o.CONTACT_NO,
        email: o.EMAIL,
        direct_supperior: o.DIRECT_SUPPERIOR,
        role: o.ROLE,
        user_type: o.USER_TYPE,
        mobile_bill_eligibility: o.MOBILE_BILL_ELIGIBILITY,
        mobile_bill_elig_amount: o.MOBILE_BILL_ELIG_AMOUNT,
        employee_type: o.EMPLOYEE_TYPE,
        position_name: o.POSITION_NAME,
        position_start_date: o.POSITION_START_DATE,
        position_event_reason: o.POSITION_EVENT_REASON,
        confirmation_date: o.CONFIRMATION_DATE,
        effective_date: o.EFFECTIVE_DATE,
        updated_date: o.UPDATED_DATE,
        inserted_date: o.INSERTED_DATE,
        medical_insurance_entitlement: o.MEDICAL_INSURANCE_ENTITLEMENT,
        descr: {
          cc: null, dep: null, unit_section: null, marital: null, job_group: null,
          state: null, country: null, direct_supperior: null, role: null,
          user_type: null, employee_type: null
        }
      };
    } catch (oError) {
      // console.error("Error fetching employee detail", oError);
      return null;
    }
  }

  async function _getEmpDataDescr(controller, oClaimInput) {
    // cost center
    if (oClaimInput.getProperty("/emp_master/cc")) {
      oClaimInput.setProperty("/emp_master/descr/cc",
        await _bindEclaimDescr(controller, "/ZCOST_CENTER",
          oClaimInput.getProperty("/emp_master/cc"), "COST_CENTER_ID", "COST_CENTER_DESC"));
    }
    // department
    if (oClaimInput.getProperty("/emp_master/dep")) {
      oClaimInput.setProperty("/emp_master/descr/dep",
        await _bindEclaimDescr(controller, "/ZDEPARTMENT",
          oClaimInput.getProperty("/emp_master/dep"), "DEPARTMENT_ID", "DEPARTMENT_DESC"));
    }
    // branch / unit section
    if (oClaimInput.getProperty("/emp_master/unit_section")) {
      oClaimInput.setProperty("/emp_master/descr/unit_section",
        await _bindEclaimDescr(controller, "/ZBRANCH",
          oClaimInput.getProperty("/emp_master/unit_section"), "BRANCH_ID", "BRANCH_DESC"));
    }
    // job group
    if (oClaimInput.getProperty("/emp_master/job_group")) {
      oClaimInput.setProperty("/emp_master/descr/job_group",
        await _bindEclaimDescr(controller, "/ZJOB_GROUP",
          oClaimInput.getProperty("/emp_master/job_group"), "JOB_GROUP_ID", "JOB_GROUP_DESC"));
    }
    // office location (depends on state)
    if (oClaimInput.getProperty("/emp_master/office_location")) {
      oClaimInput.setProperty("/emp_master/descr/office_location",
        await _bindEclaimDescr(controller, "/ZOFFICE_LOCATION",
          oClaimInput.getProperty("/emp_master/office_location"), "LOCATION_ID", "LOCATION_DESC",
          oClaimInput.getProperty("/emp_master/state"), "STATE_ID"));
    }
    // state (depends on country)
    if (oClaimInput.getProperty("/emp_master/state")) {
      oClaimInput.setProperty("/emp_master/descr/state",
        await _bindEclaimDescr(controller, "/ZSTATE",
          oClaimInput.getProperty("/emp_master/state"), "STATE_ID", "STATE_DESC",
          oClaimInput.getProperty("/emp_master/country"), "COUNTRY_ID"));
    }
    // country
    if (oClaimInput.getProperty("/emp_master/country")) {
      oClaimInput.setProperty("/emp_master/descr/country",
        await _bindEclaimDescr(controller, "/ZCOUNTRY",
          oClaimInput.getProperty("/emp_master/country"), "COUNTRY_ID", "COUNTRY_DESC"));
    }
    // role
    if (oClaimInput.getProperty("/emp_master/role")) {
      oClaimInput.setProperty("/emp_master/descr/role",
        await _bindEclaimDescr(controller, "/ZROLE",
          oClaimInput.getProperty("/emp_master/role"), "ROLE_ID", "ROLE_DESC"));
    }
    // user type
    if (oClaimInput.getProperty("/emp_master/user_type")) {
      oClaimInput.setProperty("/emp_master/descr/user_type",
        await _bindEclaimDescr(controller, "/ZUSER_TYPE",
          oClaimInput.getProperty("/emp_master/user_type"), "USER_TYPE_ID", "USER_TYPE_DESC"));
    }
    // employee type
    if (oClaimInput.getProperty("/emp_master/employee_type")) {
      oClaimInput.setProperty("/emp_master/descr/employee_type",
        await _bindEclaimDescr(controller, "/ZEMP_TYPE",
          oClaimInput.getProperty("/emp_master/employee_type"), "EMP_TYPE_ID", "EMP_TYPE_DESC"));
    }
  }

  async function _getClaimHeaderDataDescr(controller, oClaimInput) {
    // submission type
    if (oClaimInput.getProperty("/claim_header/submission_type")) {
      oClaimInput.setProperty("/claim_header/descr/submission_type",
        await _bindEclaimDescr(controller, "/ZSUBMISSION_TYPE",
          oClaimInput.getProperty("/claim_header/submission_type"), "SUBMISSION_TYPE_ID", "SUBMISSION_TYPE_DESC"));
    }
    // request ID
    if (oClaimInput.getProperty("/claim_header/request_id")) {
      oClaimInput.setProperty("/claim_header/descr/request_id",
        await _bindEclaimDescr(controller, "/ZREQUEST_HEADER",
          oClaimInput.getProperty("/claim_header/request_id"), "REQUEST_ID", "OBJECTIVE_PURPOSE"));
    }
  }

  /* ---------------------------
   * Load Claim (header + items)
   * --------------------------- */
  async function loadClaimById(controller, sClaimId) {
    const oClaimInput = _getClaimInputModel(controller);
    const oModel = await ensureModelReady(controller, "employee_view");
    const sId = String(sClaimId);

    const filters = [ new Filter("CLAIM_ID", FilterOperator.EQ, sId) ];

    // Header
    const hdr = oModel.bindList("/ZEMP_CLAIM_HEADER_VIEW", null, null, filters, {
      $$ownRequest: true, $count: true, $select: ["*"]
    });

    // Items (desc fields are present in the same view with *_DESC)
    const itm = oModel.bindList("/ZEMP_CLAIM_ITEM_VIEW", null, [ new Sorter("CLAIM_SUB_ID", false) ], filters, {
      $$ownRequest: true, $count: true, $select: ["*"]
    });

    try {
      const [aHdr, aItm] = await Promise.all([
        hdr.requestContexts(0, 1),
        itm.requestContexts(0, Infinity)
      ]);

      const rawHdr = aHdr[0]?.getObject();
      if (!rawHdr) {
        MessageToast.show("No claim header found for the selected item.");
        oClaimInput.setProperty("/claim_header", {});
        oClaimInput.setProperty("/claim_items", []);
        oClaimInput.setProperty("/claim_items_count", 0);
        return { header: null, items: [] };
      }

      // Map header
      const header = _mapClaimHeaderToForm(rawHdr);
      oClaimInput.setProperty("/claim_header", header);
      await _getClaimHeaderDataDescr(controller, oClaimInput);

      // Map items (values + descr)
      const items = aItm.map(ctx => ctx.getObject()).map(it => ({
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

        // Descriptions (from *_DESC fields)
        descr: {
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
          attachment_file_2: null
        }
      }));

      // Derive totals if header empty
      const nTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      if (!header.total_claim_amount) {
        oClaimInput.setProperty("/claim_header/total_claim_amount", nTotal);
      }

      oClaimInput.setProperty("/claim_items", items);
      oClaimInput.setProperty("/claim_items_count", items.length);

      // Enrich employee master
      const empData = await _getEmpIdDetail(controller, oClaimInput.getProperty("/claim_header/emp_id"));
      if (empData) {
        oClaimInput.setProperty("/emp_master", empData);
        await _getEmpDataDescr(controller, oClaimInput);
      }

      return { header: rawHdr, items };
    } catch (err) {
      // console.error("Failed to load claim header/items:", err);
      oClaimInput.setProperty("/claim_header", {});
      oClaimInput.setProperty("/claim_items", []);
      oClaimInput.setProperty("/claim_items_count", 0);
      return { header: null, items: [] };
    }
  }

  /* ---------------------------
   * Navigation (NavContainer → Page)
   * --------------------------- */
  async function navToClaimPage(controller, { navContainerId = "pageContainer", pageId = "navcontainer_claimsubmission" } = {}) {
    const root = controller.getOwnerComponent().getRootControl();
    if (!root) throw new Error("Root view not available");

    const nav = root.byId(navContainerId);
    if (!nav) throw new Error(`NavContainer '${navContainerId}' not found`);

    const page = root.byId(pageId);
    if (!page) {
      MessageToast.show("Claim Submission page not found.");
      return;
    }
    nav.to(page);
  }

  /* ---------------------------
   * Main: onRowPress
   * --------------------------- */
  async function onRowPress({
    controller,
    event,
    modelName = "employee_view",
    keyProp = "CLAIM_ID",
    navContainerId,
    pageId
  }) {
    const view = controller.getView();
    try {
      view?.setBusy(true);

      const item = event?.getParameter?.("listItem");
      let ctx =
        item?.getBindingContext(modelName) ||
        item?.getBindingContext("claim_status2") ||
        item?.getBindingContext("request_status") ||
        item?.getBindingContext() ||
        null;

      // fallback: selected row on known tables
      if (!ctx) {
        const t = controller.byId("tb_myapproval_claim") || controller.byId("claimtable");
        const sel = t?.getSelectedItem?.();
        if (sel) {
          ctx =
            sel.getBindingContext(modelName) ||
            sel.getBindingContext("claim_status2") ||
            sel.getBindingContext("request_status") ||
            sel.getBindingContext();
        }
      }

      if (!ctx) { MessageToast.show("Select a claim to open"); return; }

      let id = ctx.getProperty(keyProp) || _parseKeyFromV4Path(ctx.getPath?.(), keyProp);
      if (!id) { MessageToast.show(`${keyProp} is missing on the selected row.`); return; }

      // 1) Load data
      await loadClaimById(controller, String(id));

      // 2) Navigate
      await navToClaimPage(controller, { navContainerId, pageId });

    } catch (e) {
      sap.base?.Log?.error?.("onRowPress failed:", e);
      MessageToast.show("Failed to open the selected claim.");
    } finally {
      view?.setBusy(false);
    }
  }

  /* ---------------------------
   * Public API
   * --------------------------- */
  return {
    onRowPress,
    loadClaimById,
    navToClaimPage,
    ensureModelReady
  };
});