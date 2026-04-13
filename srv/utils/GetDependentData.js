const { Constant } = require("./constant");
module.exports = {
    /**
     * Get marriage category for employee based on marital status and number of dependents
     * @public
     * @param {String} sEmpId - Employee ID
     * @return {String} - return marriage category based on status and number of dependents
     */
    getMarriageCategory: async function(sEmpId) {
        try {
            const oEmpData = await SELECT.one.from(Constant.Entities.ZEMP_MASTER).columns('MARITAL').where({ EEID: sEmpId });
            if (!oEmpData) {
                throw new Error(404, `No employee data found.`);
            }

            var sMarriageCategory = null;
            if (oEmpData.MARITAL === Constant.MaritalStatus.SINGLE) {
                sMarriageCategory = Constant.MarriageCategory.SINGLE;
            }
            else {
                const aDependents = await SELECT
                    .from(Constant.Entities.ZEMP_DEPENDENT)
                    .where({
                        EMP_ID: sEmpId,
                        RELATIONSHIP: Constant.Relationship.CHILD
                    })
                    .orderBy([
                        Constant.EntitiesFields.DEPENDENT_NO
                    ]);

                if (!aDependents) {
                    throw new Error (404, `Dependents not found for given employee.`);
                }

                var iDependents = aDependents.length;
                switch (true) {
                    case (iDependents >= 4):
                        sMarriageCategory = Constant.MarriageCategory.MARRIED_4_OR_MORE_CHILDREN;
                        break;
                    case (iDependents >= 1 && iDependents <= 3):
                        sMarriageCategory = Constant.MarriageCategory.MARRIED_1_TO_3_CHILDREN;
                        break;
                    case (iDependents == 0):
                    default:
                        sMarriageCategory = Constant.MarriageCategory.MARRIED_NO_CHILDREN;
                        break;
                }

            }

            return sMarriageCategory;

        } catch (error) {
            throw new Error('An error occurred while checking Employee Dependent table.');
        }
    }
};