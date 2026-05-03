sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/core/Item",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/routing/History",
	"sap/ui/core/ValueState",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/format/DateFormat",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/ListMode",
	"claima/model/models",
	"claima/utils/Utility",
	"claima/utils/ClaimUtility",
	"claima/utils/Attachment",
	"claima/utils/budgetCheck",
	"claima/utils/ApprovalLog",
	"claima/utils/ApproveDialog",
	"claima/utils/RejectDialog",
	"claima/utils/SendBackDialog",
	"claima/utils/ApproverUtility",
	"claima/utils/workflowApproval",
	"claima/utils/DateUtility",
	"claima/utils/ExcelExport",
	"claima/utils/EligibilityCheck",
	"claima/utils/EligibilityScenarios/EligibleScenarioCheck",
	"claima/utils/CustomValidator",
	"claima/utils/CustomDuplicationCheck",
	"claima/utils/Constants",
	"claima/utils/Common",
	"claima/utils/ClaimInitialization"
], function (
	Fragment,
	Item,
	Controller,
	BusyIndicator,
	History,
	ValueState,
	JSONModel,
	Filter,
	FilterOperator,
	Sorter,
	DateFormat,
	MessageBox,
	MessageToast,
	Dialog,
	Button,
	Label,
	ListMode,
	models,
	Utility,
	ClaimUtility,
	Attachment,
	budgetCheck,
	ApprovalLog,
	ApproveDialog,
	RejectDialog,
	SendBackDialog,
	ApproverUtility,
	workflowApproval,
	DateUtility,
	ExcelExport,
	EligibilityCheck,
	EligibleScenarioCheck,
	CustomValidator,
	CustomDuplicationCheck,
	Constants,
	Common,
	ClaimInitialization
) {
	"use strict";

	return Controller.extend("claima.controller.ClaimSubmission", {

		DateUtility: DateUtility,

		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oConstant = this.getOwnerComponent().getModel("constant").getData();
			this._oClaimModel = this.getOwnerComponent().getModel("claim");
			this._oApprovalLogModel = this.getOwnerComponent().getModel('approval_log')
			this._oDataModel = this.getOwnerComponent().getModel();
			this._oViewModel = this.getOwnerComponent().getModel("employee_view");
			this._oSessionModel = this.getOwnerComponent().getModel("session");
			this._oClaimFragments = Object.create(null);
			this._oDeleteAttachmentDialog = null;

			// declare claim utility
			ClaimUtility.init(this.getOwnerComponent(), this.getView());
			// decalre custom validator
			CustomValidator.init(this.getOwnerComponent(), this.getView());
			// declare excel export utility
			ExcelExport.init(this.getOwnerComponent(), this.getView(), window.XLSX);
			//declare utility
			Utility.init(this.getOwnerComponent(), this.getView());

			// URL Access
			this._oRouter.getRoute("ClaimSubmission").attachPatternMatched(this._onMatched, this);

			this.getView().setModel(models.createClaimHeaderEditableModel(), "claimSubmissionHeaderEditableModel");
			this.getView().setModel(models.createEditButtonModel(), "editButtonModel");
		},

		/* =========================================================
		* URL Access
		* ======================================================= */

		async _onMatched(oEvent) {
			let sClaimId = oEvent.getParameter("arguments").claim_id;

			try { sClaimId = decodeURIComponent(sClaimId); } catch (e) { }

			console.log("Deep-link claim ID:", sClaimId);

			this._oClaimModel.setProperty("/claim_header/claim_id", sClaimId);
			this._oClaimModel.setProperty('/view', 'view');

			this.getView().getModel("editButtonModel").setProperty("/state", false);

			await this._loadClaim(sClaimId);
		},

		async _loadClaim(sClaimId) {
			BusyIndicator.show(0);
			const oClaimSubmissionPage = this.byId("page_claimsubmission");
			// hard reset
			oClaimSubmissionPage.removeAllContent();

			// destroy ALL fragments
			if (this._oClaimFragments) {
				for (const sFrag of Object.keys(this._oClaimFragments)) {
					try {
						const oFrag = await this._oClaimFragments[sFrag];
						oFrag?.destroy(true);
					} catch { }
				}
			}
			this._oClaimFragments = Object.create(null);
			// declare claim initialization
			ClaimInitialization.init(this.getOwnerComponent(), this.getView());
			try {
				await ClaimInitialization.getHeader(sClaimId);
				await ClaimInitialization.getItemList(sClaimId);
				await this._showHeaderFragment();
				await this._showItemList(sClaimId);
			} catch (error) {
				console.log(error);
			} finally {
				BusyIndicator.hide();
			}
		},

		/* =========================================================
		* Helpers: Fragment Management
		* ======================================================= */

		async _getFormFragment(sName) {
			const oView = this.getView();
			if (!this._oClaimFragments[sName]) {
				this._oClaimFragments[sName] = Fragment.load({
					id: oView.getId(),
					name: "claima.fragment." + sName,
					type: "XML",
					controller: this
				}).then((oFrag) => {
					oView.addDependent(oFrag);
					return oFrag;
				});
			}
			return this._oClaimFragments[sName];
		},

		async _replaceContentAt(oPage, iIndex, oControl) {
			// Ensure the slot exists
			const iSafe = Math.min(iIndex, oPage.getContent().length);
			oPage.insertContent(oControl, iSafe);
		},

		/**
		 * Remove fragment from display
		 * @param {string} sLocalId name of fragment to be removed
		 * @returns 
		 */
		async _removeByLocalId(sLocalId) {
			const oCache = this._oClaimFragments;
			const oFragment = oCache?.[sLocalId];
			if (!oFragment) return;

			const oResolved = await oFragment;
			this.byId("page_claimsubmission").removeContent(oResolved);
			oResolved.destroy(true);
			delete oCache[sLocalId];
		},

		async _showItemCreate(bEdit) {
			const oPage = this.byId("page_claimsubmission");
			if (!oPage) return;

			await this._removeByLocalId("claimsubmission_summary_claimitem");
			await this._removeByLocalId("approval_log");

			const oCreate = await this._getFormFragment("claimsubmission_claimdetails_input");
			await this._replaceContentAt(oPage, 1, oCreate);

			ClaimInitialization.determineFooterButton(this);		// check if the footer button can share with PAR
		},

		/**
		 * Display editable/non-editable header fragment based on edit button state
		 * If edit button state is true, displays editable fragment, if false, displays non-editable fragment
		 */
		_showHeaderFragment: async function () {
			this._removeByLocalId("claimsubmission_summary_claimheader");
			var oClaimPage = this.byId("page_claimsubmission");

			const sFragmentName = this.getView().getModel("editButtonModel").getProperty("/state") ? "request_header_edit" : "claimsubmission_summary_claimheader"
			await this._getFormFragment(sFragmentName).then(function (oVBox) {
				oClaimPage.insertContent(oVBox, 0);
			});
		},


		async _showItemList(sClaimId) {
			const oPage = this.byId("page_claimsubmission");
			if (!oPage) return;

			await this._removeByLocalId("claimsubmission_summary_claimitem");
			await this._removeByLocalId("claimsubmission_claimdetails_input");
			await this._removeByLocalId("approval_log");

			const oList = await this._getFormFragment("claimsubmission_summary_claimitem");
			await this._replaceContentAt(oPage, 1, oList);

			// determine approver mode
			var sClaimStatus = this._oClaimModel.getProperty("/claim_header/status_id");
			var bDisplayApproval = sClaimStatus !== this._oConstant.ClaimStatus.DRAFT && sClaimStatus !== this._oConstant.ClaimStatus.CANCELLED;
			if (bDisplayApproval) {
				var aApprover = await ApprovalLog.getApproverList(this._oApprovalLogModel, this._oViewModel, sClaimId);
				for (const row of aApprover) {
					if (row.STATUS === this._oConstant.ClaimStatus.PENDING_APPROVAL &&
						(row.SUBSTITUTE_APPROVER_ID == this._oSessionModel.getProperty("/userId") ||
							row.APPROVER_ID == this._oSessionModel.getProperty("/userId"))) {
						this._oClaimModel.setProperty('/view', this._oConstant.AccessMode.APPROVER);
						break;
					} else {
						this._oClaimModel.setProperty('/view', this._oConstant.AccessMode.VIEW);
					}
				}
				const oApproval = await this._getFormFragment("approval_log");
				await this._replaceContentAt(oPage, 2, oApproval);
			} else {
				ClaimInitialization.getCurrentState(this);
			}

			Common.init(this.getOwnerComponent(), this.getView());
			if (sClaimStatus !== this._oConstant.RequestStatus.DRAFT && sClaimStatus !== this._oConstant.RequestStatus.SEND_BACK) {
				await Common.setHeaderEditable(Constants.SubmissionTypePrefix.CLAIMHEADER, false);
			}
			ClaimInitialization.determineFooterButton(this);
		},
	});
});
