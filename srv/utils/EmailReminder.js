const { Constant } = require("./constant");
module.exports = {

    getFirstScenario: function (sTripEndDate, sTodayDate) {
        const nDifference = this.getDateDifference(sTripEndDate, sTodayDate);
        return Constant.ReminderMilestone.SCENARIO1[nDifference] || null;
    },

    getSecondScenario: function (sTripEndDate, sTodayDate) {
        const tripEndDate = new Date(sTripEndDate);
        const today = new Date(sTodayDate);
        const nDifference = this.getDateDifference(sTripEndDate, sTodayDate);

        if (nDifference === 1) return '1';

        const followingMonth = (tripEndDate.getMonth() + 1) % 12;
        const followingYear = tripEndDate.getMonth() === 11
            ? tripEndDate.getFullYear() + 1
            : tripEndDate.getFullYear();

        const bIsFollowingMonth = today.getMonth() === followingMonth
            && today.getFullYear() === followingYear;

        if (bIsFollowingMonth) {
            const nDay = today.getDate();
            if (nDay >= 11 && nDay <= 16) return String(nDay);
        }

        return null;
    },

    getDateDifference: function (sTripEndDate, sTodayDate) {
        const tripEndDate = new Date(sTripEndDate);
        const todayDate = new Date(sTodayDate);
        const difference = todayDate - tripEndDate;
        return Math.floor(difference / (1000 * 60 * 60 * 24));
    },

    getClaimStatus: async function (ZCLAIM_HEADER, tx, sPreapprovalID) {
        const claim = await tx.run(
            SELECT.one.from(ZCLAIM_HEADER).where({ REQUEST_ID: sPreapprovalID })
        );
        return claim?.STATUS_ID === Constant.Status.STAT01 || !claim;
    },

    getClaimantDetails: async function (ZEMP_MASTER, ZROLEHIERARCHY, ZCONSTANTS, tx, sEmpID, nScenario) {
        let sName, sEmail, sDirectSuperiorID;
        let sCCEmail = null;
        let iDepth = 20;

        const claimantDetails = await tx.run(
            SELECT.one.from(ZEMP_MASTER).where({ EEID: sEmpID })
        );

        //employee details not found
        if (!claimantDetails) return { sName: null, sEmail: null, sCCEmail: null };

        sName = claimantDetails.NAME;
        sEmail = claimantDetails.EMAIL;

        if (nScenario === Constant.ReminderScenario[2]) {

            // check if claimant is CEO - if yes, CCEmail should goes to CEO_FI
            if (claimantDetails.ROLE === Constant.Role.CEO) {
                const aConstants = await this.getZConstant(ZCONSTANTS, tx);
                const oCeoFi = aConstants?.find(c => c.ID === Constant.Role.CEO_FI);
                let sCeoFI = oCeoFi?.VALUE || null;

                if (!sCeoFI) {
                    console.warn('getClaimantDetails: CEO_FI not found in ZCONSTANTS');
                    return { sName, sEmail, sCCEmail: null };
                }

                const oCeoFIEmail = await tx.run(
                    SELECT.one.from(ZEMP_MASTER).columns('EMAIL').where({ EEID: sCeoFI })
                );

                sCCEmail = oCeoFIEmail?.EMAIL || null;

            } else {
                //HOD rank 
                //the checking need to surpass this rank
                const oHodRank = await this.getRoleRank(ZROLEHIERARCHY, Constant.Role.HOD, tx);
                const iHodRank = oHodRank?.RANK || 0;

                // get claimant rank
                const oClaimantRank = await this.getRoleRank(ZROLEHIERARCHY, claimantDetails.ROLE, tx);
                const iClaimantRank = oClaimantRank?.RANK || 0;

                //current superior id
                sDirectSuperiorID = claimantDetails.DIRECT_SUPPERIOR;

                while (iDepth > 0) {
                    iDepth--;

                    if (!sDirectSuperiorID) break;

                    const oSuperior = await tx.run(
                        SELECT.one.from(ZEMP_MASTER).where({ EEID: sDirectSuperiorID })
                    );

                    //stop if no superior
                    if (!oSuperior) break;

                    //CEO check - if superior is CEO
                    if (oSuperior.ROLE === Constant.Role.CEO) {
                        sCCEmail = oSuperior.EMAIL;
                        break;
                    }

                    // get superior rank
                    const oSuperiorRank = await this.getRoleRank(ZROLEHIERARCHY, oSuperior.ROLE, tx);
                    const iSuperiorRank = oSuperiorRank?.RANK || 0;

                    // superior rank must be higher than claimant rank
                    //claimant rank + 1 - refer to workflowapproval process
                    if (iSuperiorRank > iClaimantRank && iSuperiorRank >= iHodRank) {
                        sCCEmail = oSuperior.EMAIL;
                        break;
                    }

                    //move up one level
                    sDirectSuperiorID = oSuperior.DIRECT_SUPPERIOR;
                }
            }
        }


        return { sName, sEmail, sCCEmail };
    },

    getRoleRank: async function (ZROLEHIERARCHY, sRole, tx) {
        const rank = await tx.run(
            SELECT.one.from(ZROLEHIERARCHY).where({ ROLE: sRole })
        );
        return rank;
    },

    getZConstant: async function (ZCONSTANTS, tx) {
        const aConstant = await tx.run(SELECT.from(ZCONSTANTS).columns('ID', 'VALUE'));
        return aConstant;
    }
};