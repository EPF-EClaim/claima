sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"claima/utils/Utility",
	"claima/utils/Constants"
], function (Filter, FilterOperator, Sorter, MessageToast, BusyIndicator, MessageBox, Utility, Constants) {
    "use strict";

    return {

		init:function (oOwnerComponent,oView){
			this._oOwnerComponent = oOwnerComponent;
			this._oView = oView;
			this._mDeleteAttachments = {}; // Clear delete tracking
		},


        /* =========================================================
        * Attachments Upload
        * ======================================================= */

		_getSrvLink() {
			const bIsLocal = window.location.hostname.includes("port4004") || 
							window.location.hostname.includes("applicationstudio.cloud.sap");

			const sDestination = "SuccessFactors_API";
			return bIsLocal ? sDestination : "/" + sDestination;
		},

        async postAttachment(fileName, fileBase64, emp_id) {

			var sDestination = this._getSrvLink();
			const sServiceUrl = sDestination + "/upsert";
			
            const res = await fetch(sServiceUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    __metadata: { uri: "Attachment" },
                    deletable: true,
                    fileName: fileName,
                    module: "GENERIC_OBJECT",
                    externalId: emp_id,
                    viewable: true,
                    fileContent: fileBase64
                })
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                console.log("Body:", await res.text());
                throw new Error(`Attachment POST failed: ${res.status} ${res.statusText} ${errText}`);
            }

            const json = await res.json();
            const id = json?.d[0]?.key || json?.key || "";
            const attachmentNumber = id.split('=')[1];
            return attachmentNumber;
        },

        /* =========================================================
        * Attachments Post to MDF
        * ======================================================= */

        async postMDF(reqID, attachment1, attachment2) {

			var sDestination = this._getSrvLink();
			const sServiceUrl = sDestination + "/upsert";

			const hasAttachment1 = attachment1 && String(attachment1).trim().length > 0;
			const hasAttachment2 = attachment2 && String(attachment2).trim().length > 0;

			const payload = {
				__metadata: {
					uri: "cust_EPF_CLAIM_ATTACHMENTS_Parent" 
				},
				Claim_ID: reqID
			};

			if (hasAttachment1) {
				payload.cust_Parent_attachment1Nav = {
					__metadata: {
						uri: `Attachment('${attachment1}')`
					}
				};
			}

			if (hasAttachment2) {
				payload.cust_Parent_attachment2Nav = {
					__metadata: {
						uri: `Attachment('${attachment2}')`
					}
				};
			}

			try {
				const response = await fetch(sServiceUrl, {
					method: "POST",
					headers: { 
						"Content-Type": "application/json",
						"Accept": "application/json" 
					},
					body: JSON.stringify(payload)
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					const message = errData?.error?.message?.value || response.statusText;
					throw new Error(`HTTP ${response.status}: ${message}`);
				}

				console.log("MDF Updated successfully");
				return true;

			} catch (error) {
				console.error("Error creating MDF:", error);
				return false;
			}
		},

        /* =========================================================
        * Attachments Post to Child MDF
        * ======================================================= */

		async postMDFChild(reqID, reqSubID, attachment1, attachment2) {
			
			var sDestination = this._getSrvLink();
			var sServiceUrl = sDestination + "/upsert";

			const hasAttachment1 = attachment1 && String(attachment1).trim().length > 0;
			const hasAttachment2 = attachment2 && String(attachment2).trim().length > 0;

			const payload = {
				__metadata: {
					uri: "cust_EPF_CLAIM_ATTACHMENTS" 
				},
				Claim_Sub_ID: reqSubID,
				cust_EPF_CLAIM_ATTACHMENTS_Parent_Claim_ID: reqID
			};

			if (hasAttachment1) {
				payload.cust_attachment1Nav = {
					__metadata: {
						uri: `Attachment('${attachment1}')`
					}
				};
			}

			if (hasAttachment2) {
				payload.cust_attachment2Nav = {
					__metadata: {
						uri: `Attachment('${attachment2}')`
					}
				};
			}

			try {
				const response = await fetch(sServiceUrl, {
					method: "POST",
					headers: { 
						"Content-Type": "application/json",
						"Accept": "application/json" 
					},
					body: JSON.stringify(payload)
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					const message = errData?.error?.message?.value || response.statusText;
					throw new Error(`HTTP ${response.status}: ${message}`);
				}

				console.log("Child MDF Updated successfully");
				return true;

			} catch (error) {
				console.log("Error creating Child MDF: " + error);
				// MessageToast.show("Error creating Child MDF: " + error);
				return false;
			}
		},

        /* =========================================================
        * Delete Attachments
        * ======================================================= */

		async deleteAttachment(attachmentID) {

			var sDestination = this._getSrvLink();
			var url = `${sDestination}/Attachment(attachmentId=${attachmentID})`;

			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const text = await response.text().catch(() => '');
				throw new Error(`Delete failed: ${response.status} ${response.statusText} ${text}`);
			}

			return true;
		},

		confirmDeleteAttachment: async function (sSubmissionType, sTarget) {
			try {

				switch (sSubmissionType) {
					case Constants.SubmissionTypePrefix.CLAIM:
						this._mDeleteAttachments[sTarget] = true; //Track delete intent (processed on Save)
						var oItemModel = this._oView.getModel("claimitem_input");

						oItemModel.setProperty(`/attachments/attachment${sTarget}/fileName`, null);
						oItemModel.setProperty(`/attachments/attachment${sTarget}/fileContent`, null);
						oItemModel.setProperty(`/claim_item/attachment_file_${sTarget}`, null);
						break;
						
					case Constants.SubmissionTypePrefix.REQUEST:
						this._mDeleteAttachments[sTarget] = true; //Track delete intent (processed on Save)
						var oItemModel = this._oOwnerComponent.getModel("request");

						//Clear file content from UI model
						oItemModel.setProperty(`/req_item/${sTarget}`, null);
						oItemModel.setProperty(`/req_item/${sTarget}_filename`, null);

						if (sTarget === "doc1") {
							this._oView.byId("i_attachment_1_file")?.clear();
							this._oView.byId("i_attachment_1_file").setRequired(true);
						}
						if (sTarget === "doc2") {
							this._oView.byId("i_attachment_2_file")?.clear();
						}
						break;
				}
				oItemModel.refresh(true);
			} catch (e) {
				switch (sSubmissionType) {
					case Constants.SubmissionTypePrefix.CLAIM:
						MessageBox.error(
							e.message || Utility.getText("msg_claiminput_attachment_delete_error")
						);
						break;
					case Constants.SubmissionTypePrefix.REQUEST:
						MessageBox.error(
							e.message || "Failed to delete attachment from SuccessFactors"
						);
						break;
				}
			}
		},

        /* =========================================================
        * View Attachments
        * ======================================================= */

		async onViewDocument(that, attachmentID) {
			var sDestination = this._getSrvLink();
			var sServiceUrl = sDestination + "/Attachment('" + attachmentID + "')";

			BusyIndicator.show(0);
			try {
				const response = await fetch(sServiceUrl, {
					method: "GET"
				});

				if (!response.ok) {
					const errText = await response.text().catch(() => "");
					throw new Error("HTTP " + response.status + " " + response.statusText + ": " + errText);
				}

				const xmlText = await response.text();

				// turn XML into JSON
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlText, "text/xml");

				// Check XML parsing errors
				const parseError = xmlDoc.querySelector("parsererror");
				if (parseError) {
					console.log("Failed to parse XML response.")
					throw new Error("Failed to parse XML response.");
				}

				// get content from xmlDoc
				const content = xmlDoc.querySelector("content");
				if (!content) {
					console.log("No attachment details found (missing <content>).")
					throw new Error("No attachment details found (missing <content>).");
				}

				const props = content.querySelector("properties");
				if (!props) {
					console.log("No attachment details found (missing <properties>).")
					throw new Error("No attachment details found (missing <properties>).");
				}

				const jsonData = {};

				// Only iterate element nodes
				const contentNodes = props.children;
				for (let i = 0; i < contentNodes.length; i++) {
					const node = contentNodes[i];
					jsonData[node.localName] = (node.textContent || "").trim();
				}

				// Validate required fields
				if (!jsonData.fileContent) {
					throw new Error("Attachment fileContent is empty or missing.");
				}
				if (!jsonData.mimeType) {
					jsonData.mimeType = "application/pdf"; // fallback
				}
				if (!jsonData.fileName) {
					jsonData.fileName = "Attachment";
				}

				// Convert base64 -> Blob
				const base64Encoded = jsonData.fileContent;
				// Decode base64 into bytes (note: atob works for base64)
				const decoded = atob(base64Encoded);
				const byteArray = new Uint8Array(decoded.length);

				for (let i = 0; i < decoded.length; i++) {
					byteArray[i] = decoded.charCodeAt(i);
				}

				const blob = new Blob([byteArray], { type: jsonData.mimeType });
				const pdfUrl = URL.createObjectURL(blob);

				// Create/reuse PDFViewer
				if (!that._PDFViewer) {
					that._PDFViewer = new sap.m.PDFViewer({
						isTrustedSource: true,
						width: "auto"
					});

					that.getView().addDependent(that._PDFViewer);

					// Optional: cleanup object URL when viewer closes
					that._PDFViewer.attachEventOnce("afterClose", function () {
						try {
							URL.revokeObjectURL(pdfUrl);
						} catch (e) {
							// ignore cleanup errors
						}
					});
				}

				console.log(pdfUrl);

				that._PDFViewer.setSource(pdfUrl);

				// Register blob as trusted/whitelisted (older UI5)
				jQuery.sap.addUrlWhitelist("blob");

				// Open viewer
				that._PDFViewer.open();
			} catch (error) {
				MessageBox.warning(Utility.getText("req_d_w_attachment_not_found"));
			} finally {
				BusyIndicator.hide();
			}
		},

        /* =========================================================
        * Attachments Helper Functions
        * ======================================================= */

		getFileAsBinary: function (oFile) {
			return new Promise((resolve, reject) => {
				// 1. Check if file exists
				if (!oFile) {
					const sMsg = "No file selected.";
					sap.ui.core.BusyIndicator.hide();
					return reject(new Error(sMsg));
				}

				// 2. Validate format
				const oCheckFileFormat = this.isAllowedFile(oFile);
				if (!oCheckFileFormat.ok) {
					BusyIndicator.hide();
					return reject(new Error(oCheckFileFormat.reason));
				}

				var oReader = new FileReader();
				
				oReader.onload = (e) => {
					var vContent = e.target.result; // Use e.target for better compatibility
					if (vContent) {
						// Returns only the Base64 string (removing the Data URL prefix)
						resolve(vContent.split(",")[1]);
					} else {
						reject(new Error("File content is empty."));
					}
				};

				oReader.onerror = (e) => {
					sap.ui.core.BusyIndicator.hide();
					reject(new Error("Failed to read file: " + oReader.error.message));
				};

				// readAsDataURL is used to get the Base64 string format
				oReader.readAsDataURL(oFile);
			});
		},

		isAllowedFile: function (oFile) {
			const ALLOWED_MIME_TYPES = new Set([
				'application/pdf',
				'image/jpeg',
				'image/png'
			]);

			const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

			if (!oFile) return { ok: false, reason: 'No file provided.' };

			// 1. MIME Type Check
			const sMime = (oFile.type || '').toLowerCase().trim();
			if (sMime && ALLOWED_MIME_TYPES.has(sMime)) {
				return { ok: true };
			}

			// 2. Fallback to Extension Check (if MIME is missing or generic)
			const sFileName = oFile.name || '';
			const sFileExtension = sFileName.split('.').pop().toLowerCase();
			
			if (ALLOWED_EXTENSIONS.has(sFileExtension)) {
				return { ok: true };
			}

			return { ok: false, reason: 'Only PDF and image files (JPG/PNG) are allowed.' };
		}

    };
});