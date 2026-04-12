const cds = require("@sap/cds");
const { SELECT, where } = require("@sap/cds/lib/ql/cds-ql");
const BuildSelectWhereConditions = require("../BuildSelectWhereConditions");
const { Constant } = require("../constant");
const DalamNegara = require("./DalamNegara");
const LuarNegara = require("./LuarNegara");
const KursusDalam = require("./KursusDalam");
const KursusLuar = require("./KursusLuar");
const IPAD = require("./IPAD");
const Handphone = require("./Handphone");
const JalurLebar = require("./JalurLebar");

module.exports = {
  /**
   * Drill down of eligibility scenarios for each claim type after retrieving employee and eligibility rules data
   * @public
   * @param {Array} aPayload - Array of Payload data containing ClaimType, ClaimItmType, List Array of fields to be checked;
   * @param {Object} tx - CDS Transaction
   * @returns {Array} Arrays of Object Payload with results field in CheckFields List Array populated
   */
  onEligibilityCheck: async function (aPayload, tx) {
    const aParticipantList = aPayload.map((d) => d.EmpId);

    // Get Employee Data
    const aEmpData = await tx.run(
      SELECT.from(Constant.Entities.ZEMP_MASTER).where({
        EEID: { in: aParticipantList }
      })
    );
    // Sort Employee Data by Grade
    aEmpData.sort(function (a, b) {
      return a.GRADE - b.GRADE;
    });

    // Get employee grade
    let aPersonalGrade = aEmpData.map((d) => d.GRADE);
    aPersonalGrade.push(Constant.Wildcard.All);
    aPersonalGrade.push(Constant.Wildcard.NA);

    // Get Employee Role
    let aEmpRoleId = aEmpData.map((d) => d.ROLE);
    aEmpRoleId.push(Constant.Wildcard.All);
    aEmpRoleId.push(Constant.Wildcard.NA);
    
    //Find which submission type logic to process
    let aSubmissionType = [];
    aSubmissionType.push(aPayload[0].RecordId.substring(0,3));
    aSubmissionType.push(Constant.Wildcard.All);

    // Build Eligibility Select Where Conditions
    let aEligibilityCondition = {
      [Constant.EntitiesFields.SUBMISSION_TYPE]: {in: aSubmissionType},
      [Constant.EntitiesFields.PERSONAL_GRADE]: { in: aPersonalGrade },
      [Constant.EntitiesFields.ROLE_ID]: { in: aEmpRoleId },
      [Constant.EntitiesFields.CLAIM_TYPE_ID]: aPayload[0].ClaimType,
      [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID]: aPayload[0].ClaimTypeItem
    };
 
    // Claim Type that requires additional Job Group filtering
    if (
      aPayload[0].ClaimType == Constant.ClaimType.HANDPHONE &&
      aPayload[0].ClaimTypeItem == Constant.ClaimTypeItem.TELEFON_B
    ) {
      let aEmpJobGrp = aEmpData.map((d) => d.JOB_GROUP);
      aEmpJobGrp.push(Constant.Wildcard.NA);
      aEmpJobGrp.push(Constant.Wildcard.All);
      aEligibilityCondition[Constant.EntitiesFields.JOB_GROUP] = {
        in: aEmpJobGrp
      };
    };
    const sEligibilityCondition = BuildSelectWhereConditions.buildWhereCondition(aEligibilityCondition);
    // Get Eligibility Rules
    const aEligibilityRules = await tx.run(
      SELECT.from(Constant.Entities.ZELIGIBILITY_RULE).where(
        `${sEligibilityCondition}`
      )
    );
    let oReturnPayload = [];

    // loop each participant data
    for (let i = 0; i < aPayload.length; i++) {
      // Proceed to each Claim Type
      switch (aPayload[i].ClaimType) {
        case Constant.ClaimType.DLM_NEGARA:
          oReturnPayload = DalamNegara.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
          );
          break;

        case Constant.ClaimType.LUAR_NEGARA:
          oReturnPayload = LuarNegara.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
          );
          break;

        case Constant.ClaimType.KURSUS_DLM_NEGARA:
          oReturnPayload = KursusDalam.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
          );
          break;

        case Constant.ClaimType.KURSUS_LUAR_NEGARA:
          oReturnPayload = KursusLuar.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
          );
          break;

        case Constant.ClaimType.I_PAD:
          oReturnPayload = await IPAD.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
            tx,
          );
          break;

        case Constant.ClaimType.HANDPHONE:
          oReturnPayload = await Handphone.onEligibleCheck(
            aPayload[i],
            aEmpData[0],
            aEligibilityRules,
            tx,
          );
          break;

        case Constant.ClaimType.JALUR_LEB:
          oReturnPayload = JalurLebar.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
          );
          break;

        case Constant.ClaimType.ELAUN_PINDAH:
           oReturnPayload = ElaunPindah.onEligibleCheck(
            aPayload[i],
            aEligibilityRules,
          );
          break;

        // case PELBAGAI: // Pelbagai no requirement checking needed
        //     break;

        default:
          oReturnPayload = aPayload[i];
          break;
      }
      aPayload[i] = oReturnPayload; //Update Payload with Result value
    }

    return aPayload;
  },
};
