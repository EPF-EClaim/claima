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
       
        async postAttachment(fileName, fileBase64) {

            const res = await fetch("/SuccessFactors_API/odata/v2/Attachment?$format=json", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    __metadata: { uri: "Attachment" },
                    deletable: true,
                    fileName: fileName,
                    moduleCategory: "UNSPECIFIED",
                    module: "EMPLOYEE_CENTRAL",
                    userId: "SFAPI",
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
            const id = json?.d?.attachmentId || json?.attachmentId || "";
            const attachmentNumber = id.replace(/.*\('?(.*?)'?\).*/, "$1");
            return attachmentNumber;
        }



    };
});