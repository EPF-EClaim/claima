sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
], function (Filter, FilterOperator, Sorter, MessageToast) {
    "use strict";

    return {

        /* =========================================================
        * Attachments Upload
        * ======================================================= */

        async postAttachment(fileName, fileBase64, emp_id) {

            const res = await fetch("/SuccessFactors_API/upsert", {
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
                    fileContent: fileBase64   // base64 only, no "data:*;base64," prefix
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

        async postMDF(reqID, attachment1, attachment2) {
			const sServiceUrl = "/SuccessFactors_API/cust_EPF_CLAIM_ATTACHMENTS_Parent";

			const hasAttachment2 = attachment2 && String(attachment2).trim().length > 0;

			const payload = {
				__metadata: {
					type: "SFOData.cust_EPF_CLAIM_ATTACHMENTS_Parent" 
				},
				externalCode: reqID, 
				cust_Parent_attachment1Nav: {
					__metadata: {
						uri: `Attachment('${attachment1}')`
					}
				}
			};

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
				MessageToast.show("Error creating MDF: " + error.message);
				return false;
			}
		},

		async deleteAttachment(attachmentID) {
			var url = `SuccessFactors_API/odata/v2/Attachment(attachmentId=${attachmentID})`;

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


    };
});