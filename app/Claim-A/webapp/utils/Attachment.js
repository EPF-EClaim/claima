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

		async fetchCsrfToken() {
            const res = await fetch("/SuccessFactors_API/odata/v2/Attachment?$top=1", {
                method: "GET",
                headers: {
                "x-csrf-token": "Fetch",
                "Accept": "application/json"
                },
                credentials: "include"
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`CSRF GET failed: ${res.status} ${res.statusText} ${body}`);
            }

            const token = res.headers.get("x-csrf-token");
            if (!token) throw new Error("No x-csrf-token header returned");
            return token;
        },

        async postAttachment(fileName, fileBase64) {
            const csrf = await this.fetchCsrfToken();

            const res = await fetch("/SuccessFactors_API/odata/v2/Attachment?$format=json", {
                method: "POST",
                headers: {
                    "x-csrf-token": csrf,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    __metadata: { uri: "Attachment" },
                    deletable: true,
                    fileName,
                    moduleCategory: "UNSPECIFIED",
                    module: "DEFAULT",
                    userId: "SFAPI@EPFSFDEV",
                    viewable: true,
                    searchable: true,
                    fileContent: fileBase64   // base64 only, no "data:*;base64," prefix
                })
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                console.log("Body:", await res.text());
                throw new Error(`Attachment POST failed: ${res.status} ${res.statusText} ${errText}`);
            }

            const json = await res.json();
            const id = json?.d?.id || json?.id || "";
            const attachmentNumber = id.replace(/.*\('?(.*?)'?\).*/, "$1");
            return attachmentNumber;
        }
        


    };
});