const cds = require('@sap/cds');
const { INSERT, UPDATE, UPSERT, SELECT, DELETE, where } = require('@sap/cds/lib/ql/cds-ql');
const express = require('express');
const app = express();
const { Constant } = require("./utils/constant");
const { results } = require('@sap/cds/lib/utils/cds-utils');
const EligibleScenarioCheck = require('./utils/EligibilityScenarios/EligibleScenarioCheck')
const EmailReminder = require('./utils/EmailReminder');
const GetDependentData = require('./utils/GetDependentData');
const UpdateHeader = require('./utils/UpdateHeader');
const { sendEmailInternal } = require('./utils/EmailHelper');
const UpdateDependent = require('./utils/UpdateDependent');

module.exports = (srv) => {

    srv.on('batchCreateEmployee', async (req) => {
        const { ZEMP_MASTER } = srv.entities;
        try {
            const { employees } = req.data;
            if (!employees || employees.length === 0) {
                throw new Error('No Data Sent')
            }
            const tx = cds.tx(req);
            const results = await tx.run(
                UPSERT(employees).into(ZEMP_MASTER)
            );
            return 'Records updated';
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`);
        }
    }),

        srv.on('batchCreateCostCenter', async (req) => {
            const { ZCOST_CENTER } = srv.entities;
            try {
                const { costcenters } = req.data;
                if (!costcenters || costcenters.length === 0) {
                    throw new Error('No Data Sent')
                }
                const tx = cds.tx(req);
                const results = await tx.run(
                    UPSERT(costcenters).into(ZCOST_CENTER)
                );
                return 'Records updated';
            } catch (error) {
                req.error(400, `Fail creating record: ${error.message}`);
            }
        }),

        srv.on('batchCreateDependent', async (req) => {
            const { ZEMP_DEPENDENT } = srv.entities;
            try {
                const { dependents } = req.data;
                if (!dependents || dependents.length === 0) {
                    throw new Error('No Data Sent')
                }
                const tx = cds.tx(req);
                const results = await tx.run(
                    UPSERT(dependents).into(ZEMP_DEPENDENT)
                );
                return 'Records updated';
            } catch (error) {
                req.error(400, `Fail creating record: ${error.message}`);
            }
        }),

        srv.on('getUserType', async (req) => {
            const tx = cds.tx(req);
            const { ZDEPARTMENT } = srv.entities;
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            let sOrigin = null;
            try {
                const authHeader = req.http?.req?.headers?.authorization ?? '';
                const token = authHeader.split(' ')[1];
                if (token) {
                    const oToken = JSON.parse(
                        Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
                    );
                    sOrigin = oToken.origin;
                }
            } catch (e) {
                console.log("Token parsing failed:", e.message);
            }

            const oRoles = {
                isClaimant: req.user.is('Claimant'),
                isApprover: req.user.is('Approver'),
                isDTDAdmin: req.user.is(Constant.Admin.DTD_Admin),
                isAdminSystem: req.user.is(Constant.Admin.Admin_System),
                isAdminCC: req.user.is(Constant.Admin.Admin_CC)
            };

            let sDeptDesc = "UNKNOWN";
            if (oEmp.DEP) {
                const dept = await SELECT.one.from(ZDEPARTMENT).where({ DEPARTMENT_ID: oEmp.DEP });
                sDeptDesc = dept?.DEPARTMENT_DESC || "UNKNOWN";
            }

            return {
                id: oEmp.EMAIL || oEmp.email || "UNKNOWN",
                userType: oEmp.USER_TYPE || "UNKNOWN",
                costcenters: oEmp.CC || "UNKNOWN",
                userId: oEmp.EEID || "UNKNOWN",
                name: oEmp.NAME || "UNKNOWN",
                position: oEmp.POSITION_NAME || "UNKNOWN",
                origin: sOrigin,
                grade: oEmp.GRADE || "UNKNOWN",
                department: sDeptDesc,
                roles: oRoles
            };
        });

    // srv.on('getUserType', async (req) => {
    //     const { ZEMP_MASTER, ZDEPARTMENT } = srv.entities;
    //     const emailFromToken =
    //         req.user?.attr?.email ||
    //         req.user?.attr?.mail ||
    //         req.user?.attr?.user_name ||
    //         req.user?.attr?.login_name ||
    //         req.user?.id ||
    //         "";

    //     let sOrigin = null;

    //     try {
    //         const authHeader = req.http?.req?.headers?.authorization ?? '';
    //         const token = authHeader.split(' ')[1];
    //         if (token) {
    //             const oToken = JSON.parse(
    //                 Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    //             );
    //             sOrigin = oToken.origin;
    //         }
    //     } catch (e) {
    //         console.log("Token parsing failed:", e.message);
    //     }

    //     const email = String(emailFromToken).trim().toLowerCase();
    //     const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });
    //     //no record maintained in ZEMP_MASTER table
    //     if (!result) {
    //         return {
    //             id: email,
    //             userType: "UNKNOWN",
    //             costcenters: "UNKNOWN",
    //             userId: "UNKNOWN",
    //             name: "UNKNOWN",
    //             position: "UNKNOWN",
    //             origin: sOrigin,
    //             grade: "UNKNOWN",
    //             department: "UNKNOWN"
    //         };
    //     }

    //     let dept = null;
    //     if (result.DEP) {
    //         dept = await SELECT.one.from(ZDEPARTMENT).where({ DEPARTMENT_ID: result.DEP });
    //     }

    //     return {
    //         id: email,
    //         userType: result?.USER_TYPE || "UNKNOWN",
    //         costcenters: result?.CC || "UNKNOWN",
    //         userId: result?.EEID || "UNKNOWN",
    //         name: result?.NAME || "UNKNOWN",
    //         position: result?.POSITION_NAME || "UNKNOWN",
    //         origin: sOrigin,
    //         grade: result?.GRADE || "UNKNOWN",
    //         department: dept?.DEPARTMENT_DESC || "UNKNOWN"
    //     };
    // });

    srv.on('READ', 'FeatureControl', async (req) => {
        //crud operation visibility in config table for DTD and JKEW
        let operationHidden = true;
        if (req.user.is(Constant.Admin.DTD_Admin)) {
            operationHidden = false;
        }

        return {
            operationHidden: operationHidden,
            operationEnabled: !operationHidden,
        }
    });

    srv.on('READ', 'BudgetControl', async (req) => {
        //crud operation visibility for Budget table  
        // should be accessible for edit by DTD and JKEW only - hidden for GA
        let operationHidden = false;
        if (req.user.is(Constant.Admin.Admin_CC)) {
            operationHidden = true;
        }
        return {
            operationHidden: operationHidden,
            operationEnabled: !operationHidden,
        }
    });

    srv.on('batchUpdatePreApproved', async (req) => {
        const { ZREQUEST_ITEM } = srv.entities;
        try {
            const { PreApprove } = req.data;
            if (!PreApprove) throw new Error('No Data Sent');
            const tx = cds.tx(req);
            for (var entry of PreApprove) {
                await tx.run(UPDATE(ZREQUEST_ITEM).set({ SEND_TO_SF: 1 }).where({ REQUEST_ID: entry.REQUEST_ID, REQUEST_SUB_ID: entry.REQUEST_SUB_ID }));
            }
            await tx.commit();
            return { success: true, req: PreApprove };
        } catch (error) {
            req.error(400, `Fail updating record: ${error.message}`);
        }
    });

    srv.on('sendEmail', async (req) => {
        try {
            const response = await sendEmailInternal(req.data);
            return response;
        } catch (error) {
            req.error(400, error.message);
        }
    });

    srv.on('updateDisbursementStatus', async (req) => {
        const { ZEMP_CA_PAYMENT } = srv.entities;
        const tx = cds.tx(req);
        const payment = await tx.run(SELECT.from(ZEMP_CA_PAYMENT).columns('REQUEST_ID').where({ DISBURSEMENT_STATUS: Constant.DisbursementStatus.BYPASS }));
        const ids = payment.map(r => r.REQUEST_ID);
        await tx.run(UPDATE(ZEMP_CA_PAYMENT).set({ DISBURSEMENT_STATUS: Constant.DisbursementStatus.DISBURSED }).where({ REQUEST_ID: { in: ids } }));
        return { results: payment };
    });

    srv.on('batchCreateCourse', async (req) => {
        const { ZTRAIN_COURSE_PART } = srv.entities;
        try {
            const { course } = req.data;
            if (!course || course.length === 0) throw new Error('No Data Sent');
            await cds.tx(req).run(UPSERT(course).into(ZTRAIN_COURSE_PART));
            return 'Records updated';
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`);
        }
    });

    srv.on('batchCreateBudget', async (req) => {
        const { ZBUDGET } = srv.entities;
        let original_budget, virement_in, virement_out, supplement, return_value, consumed;
        let results = [];
        try {
            const { budget } = req.data;
            if (!budget || budget.length === 0) throw new Error('No Data Sent');

            const tx = cds.tx(req);

            //if record hasnt been created yet, direct insert record into database
            //else, update the record but exclude the commitment, actual, consumed
            //IS to exclude current budget, commitment, actual, consumed and budget balance from payload
            for (const row of budget) {

                const existing = await tx.read(ZBUDGET)
                    .where({
                        YEAR: row.YEAR,
                        INTERNAL_ORDER: row.INTERNAL_ORDER,
                        COMMITMENT_ITEM: row.COMMITMENT_ITEM,
                        FUND_CENTER: row.FUND_CENTER,
                        MATERIAL_GROUP: row.MATERIAL_GROUP
                    })
                    .limit(1);

                if (!existing.length) {
                    await tx.run(INSERT.into(ZBUDGET).entries(row));

                    results.push({
                        status: " record inserted",
                        year: row.YEAR,
                        internalorder: row.INTERNAL_ORDER,
                        commitment_item: row.COMMITMENT_ITEM,
                        fund_center: row.FUND_CENTER,
                        materialgroup: row.MATERIAL_GROUP,
                        currentBudget: row.CURRENT_BUDGET,
                        budgetBalance: row.BUDGET_BALANCE
                    });
                } else {
                    const excludeFields = Constant.BudgetUpload.EXCLUDE_FIELDS;

                    const updatePayload = { ...row };
                    excludeFields.forEach(f => delete updatePayload[f]);

                    original_budget = Number(row.ORIGINAL_BUDGET) || 0;
                    virement_in = Number(row.VIREMENT_IN) || 0;
                    virement_out = Number(row.VIREMENT_OUT) || 0;
                    supplement = Number(row.SUPPLEMENT) || 0;
                    return_value = Number(row.RETURN) || 0;
                    consumed = Number(existing[0].CONSUMED);

                    var new_virement_in = virement_in + Number(existing[0].VIREMENT_IN);
                    var new_virement_out = virement_out + Number(existing[0].VIREMENT_OUT);
                    var new_supplement = supplement + Number(existing[0].SUPPLEMENT);
                    var new_return = return_value + Number(existing[0].RETURN);
                    original_budget = original_budget === 0 ? Number(existing[0].ORIGINAL_BUDGET) : original_budget;

                    //if amount is maintained for the Virement In, Virement Out, Supplement and Return 
                    // the system need to take the existing amount from the table and add on the amount maintained inside the upload file
                    // Current Budget field should take in latest amount from Original Budget, Virement In, Virement Out, Supplement, Return
                    var total_budget = original_budget + new_virement_in + new_virement_out + new_supplement + new_return;
                    var total_budget_balance = total_budget + consumed;
                    updatePayload.CURRENT_BUDGET = total_budget.toFixed(2);
                    updatePayload.BUDGET_BALANCE = total_budget_balance.toFixed(2);
                    updatePayload.VIREMENT_IN = new_virement_in.toFixed(2);
                    updatePayload.VIREMENT_OUT = new_virement_out.toFixed(2);
                    updatePayload.SUPPLEMENT = new_supplement.toFixed(2);
                    updatePayload.RETURN = new_return.toFixed(2);

                    await tx.run(
                        UPDATE(ZBUDGET)
                            .set(updatePayload)
                            .where({
                                YEAR: row.YEAR,
                                INTERNAL_ORDER: row.INTERNAL_ORDER,
                                COMMITMENT_ITEM: row.COMMITMENT_ITEM,
                                FUND_CENTER: row.FUND_CENTER,
                                MATERIAL_GROUP: row.MATERIAL_GROUP
                            })
                    );
                    results.push(
                        {
                            status: " record updated",
                            year: row.YEAR,
                            internalorder: row.INTERNAL_ORDER,
                            commitment_item: row.COMMITMENT_ITEM,
                            fund_center: row.FUND_CENTER,
                            materialgroup: row.MATERIAL_GROUP,
                            currentBudget: updatePayload.CURRENT_BUDGET,
                            budgetBalance: updatePayload.BUDGET_BALANCE
                        }

                    )

                }
            }
            return { results };
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`);
        }
    });

    srv.on('budgetchecking', async (req) => {
        const { ZBUDGET } = srv.entities;
        const { budget } = req.data;

        const toNum = (v) => Number(v) || 0;
        const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

        const tx = cds.tx(req);
        const results = [];
        let error = false;

        try {
            let error = false;
            let errorResults = [];
            let successResults = [];

            for (var entry of budget) {
                if (entry.INTERNAL_ORDER != Constant.Wildcard.NA) {
                    var condition = {
                        YEAR: entry.YEAR,
                        INTERNAL_ORDER: entry.INTERNAL_ORDER,
                    };
                } else {
                    condition = {
                        YEAR: entry.YEAR,
                        INTERNAL_ORDER: entry.INTERNAL_ORDER,
                        FUND_CENTER: entry.FUND_CENTER,
                        MATERIAL_GROUP: entry.MATERIAL_GROUP,
                        COMMITMENT_ITEM: entry.COMMITMENT_ITEM
                    };
                }

                let budgetRecord = entry.INDICATOR === Constant.BudgetSubmissionType.CLAIM
                    ? await tx.run(SELECT.one.from(ZBUDGET).where(condition).forShareLock())
                    : await tx.run(SELECT.one.from(ZBUDGET).where(condition));

                if (!budgetRecord) {
                    error = true;
                    errorResults.push({
                        ...condition,
                        STATUS: Constant.BudgetCheckStatus.NOT_FOUND,
                        CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM
                    });
                    continue;
                }

                if (entry.INDICATOR === Constant.BudgetSubmissionType.REQUEST ||
                    (entry.INDICATOR === Constant.BudgetSubmissionType.CLAIM && entry.ACTION === Constant.BudgetProcessingAction.SUBMIT)) {
                    const bSufficient = toNum(entry.AMOUNT) <= toNum(budgetRecord.BUDGET_BALANCE);
                    if (!bSufficient) {
                        error = true;
                        errorResults.push({
                            ...condition,
                            STATUS: Constant.BudgetCheckStatus.INSUFFICIENT,
                            CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM,
                            AMOUNT: entry.AMOUNT,
                            AVAILABLE: budgetRecord.BUDGET_BALANCE
                        });
                        continue;
                    }
                }

                if (error) continue;

                if (entry.INDICATOR === Constant.BudgetSubmissionType.REQUEST) {
                    successResults.push({
                        ...condition,
                        STATUS: Constant.BudgetCheckStatus.SUFFICIENT,
                        CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM
                    });
                    continue;
                }

                let newCommitment = toNum(budgetRecord.COMMITMENT);
                let newActual = toNum(budgetRecord.ACTUAL);
                const amount = toNum(entry.AMOUNT);

                if (entry.ACTION === Constant.BudgetProcessingAction.SUBMIT) {
                    newCommitment = round2(newCommitment - amount);
                } else if (entry.ACTION === Constant.BudgetProcessingAction.APPROVE) {
                    newCommitment = round2(newCommitment + amount);
                    newActual = round2(newActual - amount);
                } else if (entry.ACTION === Constant.BudgetProcessingAction.REJECT) {
                    newCommitment = round2(newCommitment + amount);
                }

                const newConsumed = round2(newCommitment + newActual);
                const newBudgetBalance = round2(toNum(budgetRecord.CURRENT_BUDGET) + newConsumed);

                await tx.run(
                    UPDATE(ZBUDGET)
                        .set({
                            CONSUMED: newConsumed.toFixed(2),
                            COMMITMENT: newCommitment.toFixed(2),
                            BUDGET_BALANCE: newBudgetBalance.toFixed(2),
                            ACTUAL: newActual.toFixed(2)
                        })
                        .where(condition)
                );

                successResults.push({
                    ...condition,
                    STATUS: Constant.BudgetCheckStatus.UPDATED,
                    CLAIM_TYPE_ITEM: entry.CLAIM_TYPE_ITEM,
                    NEW_CONSUMED: newConsumed,
                    NEW_BUDGETBALANCE: newBudgetBalance
                });
            }

            if (error) {
                await tx.rollback();
                return { results: errorResults };
            }

            await tx.commit();
            return { results: successResults };

        } catch (err) {
            await tx.rollback();
            req.error(400, `Budget checking failed: ${err.message}`);
        }
    });



    srv.before('CREATE', 'ZREQUEST_HEADER', async (req) => {
        const tx = cds.tx(req);
        const range_id = Constant.NumberRange.REQUEST;

        const row = await tx.run(
            SELECT.one.from('ZNUM_RANGE')
                .where({ RANGE_ID: String(range_id) })
                .forUpdate()
        );

        if (!row) return req.error(404, `Range ID ${range_id} not found`);

        const prefix = row.PREFIX || "";
        const currentYearInDb = row.CURRENT_YEAR;
        const systemYearFull = String(new Date().getFullYear());
        const yy = systemYearFull.slice(-2);

        let current;
        var oUpdateVariables = {};

        if (currentYearInDb !== systemYearFull) {
            current = 1;
            oUpdateVariables.CURRENT_YEAR = systemYearFull;
        } else {
            current = Number(row.CURRENT || 0);
        }

        oUpdateVariables.CURRENT = String(current + 1);

        const nextNumber = `${prefix}${yy}${String(current).padStart(9, "0")}`;
        req.data.REQUEST_ID = String(nextNumber);

        await tx.run(
            UPDATE('ZNUM_RANGE')
                .set(oUpdateVariables)
                .where({ RANGE_ID: String(range_id) })
        );

        console.log(`[HANA] Assigned ID: ${req.data.REQUEST_ID}`);
    });

    srv.before('CREATE', 'ZREQUEST_ITEM', async (req) => {
        const tx = cds.tx(req);
        const data = req.data;

        const timeFields = ['START_TIME', 'END_TIME', 'DEPARTURE_TIME', 'ARRIVAL_TIME'];
        timeFields.forEach(field => {
            if (data[field] && typeof data[field] === 'string' && data[field].length === 5) {
                data[field] = data[field] + ":00";
            }
        });

        if (data.EST_NO_PARTICIPANT === undefined || data.EST_NO_PARTICIPANT === null) {
            data.EST_NO_PARTICIPANT = 1;
        }

        const participants = data.PARTICIPANTS || [];
        if (participants.length > 0) {
            const allocatedTotal = participants.reduce((sum, p) => sum + (Number(p.ALLOCATED_AMOUNT) || 0), 0);
            const estAmount = Number(data.EST_AMOUNT) || 0;

            if (allocatedTotal > estAmount) {
                return req.error(400, "Total participant allocated amount exceeds the Item's Estimated Amount.");
            }
        }

        if (!data.REQUEST_SUB_ID && data.REQUEST_ID) {
            const existingItems = await tx.run(SELECT.from('ZREQUEST_ITEM').columns('REQUEST_SUB_ID').where({ REQUEST_ID: data.REQUEST_ID }));
            let nextSequence = 1;
            if (existingItems && existingItems.length > 0) {
                const maxCurrent = Math.max(...existingItems.map(item => parseInt(String(item.REQUEST_SUB_ID).substring(data.REQUEST_ID.length), 10) || 0), 0);
                nextSequence = maxCurrent + 1;
            }
            data.REQUEST_SUB_ID = data.REQUEST_ID + String(nextSequence).padStart(3, "0");
        }
    });

    srv.before('CREATE', 'ZCLAIM_HEADER', async (req) => {
        const tx = cds.tx(req);
        const range_id = Constant.NumberRange.CLAIM;

        const row = await tx.run(
            SELECT.one.from('ZNUM_RANGE')
                .where({ RANGE_ID: String(range_id) })
                .forUpdate()
        );

        if (!row) return req.error(404, `Range ID ${range_id} not found`);

        const prefix = row.PREFIX || "";
        const currentYearInDb = row.CURRENT_YEAR;
        const systemYearFull = String(new Date().getFullYear());
        const yy = systemYearFull.slice(-2);

        let current;
        var oUpdateVariables = {};

        if (currentYearInDb !== systemYearFull) {
            current = 1;
            oUpdateVariables.CURRENT_YEAR = systemYearFull;
        } else {
            current = Number(row.CURRENT || 0);
        }

        oUpdateVariables.CURRENT = String(current + 1);

        const nextNumber = `${prefix}${yy}${String(current).padStart(9, "0")}`;
        req.data.CLAIM_ID = String(nextNumber);

        await tx.run(
            UPDATE('ZNUM_RANGE')
                .set(oUpdateVariables)
                .where({ RANGE_ID: String(range_id) })
        );

        console.log(`[HANA] Assigned ID: ${req.data.CLAIM_ID}`);
    });

    async function updateClaimHeaderTotals(req, sClaimId, tx) {
        if (!sClaimId) return;

        const headerResult = await SELECT.one.from('ZCLAIM_HEADER').where({ CLAIM_ID: sClaimId });

        const result = await tx.run(
            SELECT.one`
                SUM(AMOUNT) as TotalClaimAmount
            `
                .from('ZCLAIM_ITEM')
                .where({ CLAIM_ID: sClaimId })
        );

        const totalClaimAmount = result.TotalClaimAmount || 0;
        const finalAmountToReceive = (totalClaimAmount - headerResult.CASH_ADVANCE_AMOUNT) || 0;

        await tx.run(
            UPDATE('ZCLAIM_HEADER')
                .set({
                    TOTAL_CLAIM_AMOUNT: totalClaimAmount,
                    FINAL_AMOUNT_TO_RECEIVE: finalAmountToReceive
                })
                .where({ CLAIM_ID: sClaimId })
        );

        console.log(`Updated Header ${sClaimId}: ClaimAmount=${totalClaimAmount}`);
    }

    async function updateHeaderTotals(req, sRequestId, tx) {
        if (!sRequestId) return;

        const result = await tx.run(
            SELECT.one`
                SUM(EST_AMOUNT) as TotalEstAmount,
                SUM(CASE WHEN CASH_ADVANCE = true THEN EST_AMOUNT ELSE 0 END) as TotalCashAdvance
            `
                .from('ZREQUEST_ITEM')
                .where({ REQUEST_ID: sRequestId })
        );

        const totalEstAmount = result.TotalEstAmount || 0;
        const totalCashAdvance = result.TotalCashAdvance || 0;

        await tx.run(
            UPDATE('ZREQUEST_HEADER')
                .set({
                    PREAPPROVAL_AMOUNT: totalEstAmount,
                    CASH_ADVANCE: totalCashAdvance
                })
                .where({ REQUEST_ID: sRequestId })
        );
    }

    async function getInternalOrderByProjectCode(tx, sProjectCode) {

        if (!sProjectCode) {
            return null;
        }

        const sCurrentYear = String(new Date().getFullYear());
        const oBudget = await tx.run(
            SELECT.one
                .from('ZBUDGET')
                .columns('WBS_CODE')
                .where({
                    PROJECT_CODE: sProjectCode,
                    YEAR: sCurrentYear
                })
        );

        return oBudget?.WBS_CODE || null;
    }

    srv.after('CREATE', 'ZCLAIM_ITEM', async (data, req) => {
        const tx = cds.tx(req);
        await updateClaimHeaderTotals(req, data.CLAIM_ID, tx);
    });

    srv.after('UPDATE', 'ZCLAIM_ITEM', async (data, req) => {
        const tx = cds.tx(req);
        const sClaimId = data.CLAIM_ID || req.data.CLAIM_ID;

        if (sClaimId) {
            await updateClaimHeaderTotals(req, sClaimId, tx);
        } else {
            const itemKeys = req.query.UPDATE.entity.keys || [req.data];
            if (itemKeys && itemKeys.length > 0 && itemKeys[0].CLAIM_ID) {
                await updateClaimHeaderTotals(req, itemKeys[0].CLAIM_ID, tx);
            }
        }
    });

    srv.after('DELETE', 'ZCLAIM_ITEM', async (data, req) => {
        const tx = cds.tx(req);
        const sClaimId = req.data.CLAIM_ID;
        if (sClaimId) {
            await updateClaimHeaderTotals(req, sClaimId, tx);
        }
    });

    srv.after('CREATE', 'ZREQUEST_ITEM', async (data, req) => {
        const tx = cds.tx(req);
        await updateHeaderTotals(req, data.REQUEST_ID, tx);
    });

    srv.after('UPDATE', 'ZREQUEST_ITEM', async (data, req) => {
        const tx = cds.tx(req);
        const requestId = data.REQUEST_ID || req.data.REQUEST_ID;

        if (requestId) {
            await updateHeaderTotals(req, requestId, tx);
        } else {
            const itemKeys = req.query.UPDATE.entity.keys || [req.data];
            if (itemKeys && itemKeys.length > 0 && itemKeys[0].REQUEST_ID) {
                await updateHeaderTotals(req, itemKeys[0].REQUEST_ID, tx);
            }
        }
    });

    srv.after('DELETE', 'ZREQUEST_ITEM', async (data, req) => {
        const tx = cds.tx(req);
        const requestId = req.data.REQUEST_ID;
        if (requestId) {
            await updateHeaderTotals(req, requestId, tx);
        }
    });

    srv.on('onFinalApproveInsert', async (req) => {
        const { ZCLM_APPR_REQ_STAT } = srv.entities;
        try {
            const { ApproveRequest } = req.data;

            if (!ApproveRequest || ApproveRequest.length === 0) {
                throw new Error('No Data Sent')
            }
            const tx = cds.tx(req);
            const results = await tx.run(
                INSERT(ApproveRequest).into(ZCLM_APPR_REQ_STAT)
            );
            await tx.commit();

            return { success: true };
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`, req);
        }
    });

    srv.on('batchDisbursementUpdate', async (req) => {
        const { ZEMP_CA_PAYMENT } = srv.entities;
        try {
            const { disbursement } = req.data;
            if (!disbursement || disbursement.length === 0) {
                throw new Error('No Data Sent')
            }

            const first = disbursement[0];
            const tx = cds.tx(req);

            if (!("DISBURSEMENT_STATUS" in first)) {

                const requestIds = disbursement.map(d => d.REQUEST_ID);
                const results = await tx.run(
                    SELECT.from(ZEMP_CA_PAYMENT)
                        .where({ REQUEST_ID: { in: requestIds } })
                );

                return results;

            } else {
                const updatePromises = disbursement.map(item => {
                    return tx.run(
                        UPDATE(ZEMP_CA_PAYMENT)
                            .set({ DISBURSEMENT_STATUS: item.DISBURSEMENT_STATUS })
                            .where({ REQUEST_ID: item.REQUEST_ID })
                    );
                });
                await Promise.all(updatePromises);
                return "Records updated";
            }
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`);
        }
    });

    /**
     * Deletes and re-inserts Approver details based on Claim or Request ID
     * @public
     * @param {Array} aPayloadToCreateApproverDetailsTable - Array of Approver Details;
     * @returns {String} If Success, Results of Deletion and Insert Calls. If fail, Returns error message
     */
    srv.on('UpdateApproverDetails', async (req) => {
        try {
            const { aPayloadToCreateApproverDetailsTable } = req.data;
            console.log(aPayloadToCreateApproverDetailsTable);
            if (!aPayloadToCreateApproverDetailsTable || aPayloadToCreateApproverDetailsTable.length === 0) {
                throw new Error('No Data Sent')
            }
            const tx = cds.tx(req);
            const sIDType = aPayloadToCreateApproverDetailsTable[0].ID.substring(0, 3);
            var sDelete = "";
            var sInsert = "";
            var aApproverDetails = "";

            if (sIDType == Constant.WorkflowType.REQUEST) {

                aApproverDetails = aPayloadToCreateApproverDetailsTable.map(item => ({
                    PREAPPROVAL_ID: item.ID,
                    LEVEL: item.LEVEL,
                    APPROVER_ID: item.APPROVER_ID,
                    SUBSTITUTE_APPROVER_ID: item.SUBSTITUTE_APPROVER_ID,
                    STATUS: item.STATUS,
                    REJECT_REASON_ID: item.REJECT_REASON_ID,
                    PROCESS_TIMESTAMP: item.PROCESS_TIMESTAMP,
                    COMMENT: item.COMMENT
                }));

                sTableName = Constant.ApproverDetailsTable.REQUEST;
                sKeyName = Constant.ApproverDetailsTable.PREAPPROVAL_ID;
            }
            else if (sIDType == Constant.WorkflowType.CLAIM) {

                aApproverDetails = aPayloadToCreateApproverDetailsTable.map(item => ({
                    CLAIM_ID: item.ID,
                    LEVEL: item.LEVEL,
                    APPROVER_ID: item.APPROVER_ID,
                    SUBSTITUTE_APPROVER_ID: item.SUBSTITUTE_APPROVER_ID,
                    STATUS: item.STATUS,
                    REJECT_REASON_ID: item.REJECT_REASON_ID,
                    PROCESS_TIMESTAMP: item.PROCESS_TIMESTAMP,
                    COMMENT: item.COMMENT
                }));

                sTableName = Constant.ApproverDetailsTable.CLAIM;
                sKeyName = Constant.ApproverDetailsTable.CLAIM_ID;
            }

            sDelete = await DeleteApproverDetails(sTableName, sKeyName, aPayloadToCreateApproverDetailsTable[0].ID, tx);
            sInsert = await InsertRecords(sTableName, aApproverDetails, tx);

            return { success: true, sDelete, sInsert };
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`, req);
        }
    });

    /**
     * Deletes Approver Details based on Table name and Claim ID / Preapproval ID field
     * @public
     * @param {String} sTableName - Table name to delete records from;
     * @param {String} sKeyName - Claim ID field name;
     * @param {String} sClaimID - Claim ID / Preapproval ID;
     * @param {Array} tx - CDS call;
     * @returns {String} sResult - Result of deletion of records
     */
    async function DeleteApproverDetails(sTableName, sKeyName, sClaimID, tx) {

        sResult = await tx.run(
            DELETE.from(sTableName).where({ [sKeyName]: sClaimID })
        )
        return sResult;
    };

    /**
     * Inserts Records into table
     * @public
     * @param {String} sTableName - Table name for records to be inserted;
     * @param {Array} aRecordDetails - Array of records to be inserted;
     * @param {Array} tx - CDS call;
     * @returns {String} sResult - Result of Insertion of records
     */
    async function InsertRecords(sTableName, aRecordDetails, tx) {
        sResult = await tx.run(
            INSERT(aRecordDetails).into(sTableName)
        )
        return sResult;
    };

    /**
    * Delete Approver Detail Records From table
    * @public
    * @param {String} req - Claim ID to be deleted;
    * @returns {String} sResult - Result of Deletion of records
    */
    srv.on('DeleteApproverDetails', async (req) => {
        try {
            const { ID } = req.data;

            if (!ID) {
                throw new Error('No Data Sent')
            }
            const tx = cds.tx(req);
            const sIDType = ID.substring(0, 3);
            var sDelete = "";

            if (sIDType == Constant.WorkflowType.REQUEST) {

                sTableName = Constant.ApproverDetailsTable.REQUEST;
                sKeyName = Constant.ApproverDetailsTable.PREAPPROVAL_ID;
            }
            else if (sIDType == Constant.WorkflowType.CLAIM) {

                sTableName = Constant.ApproverDetailsTable.CLAIM;
                sKeyName = Constant.ApproverDetailsTable.CLAIM_ID;
            }

            sDelete = await DeleteApproverDetails(sTableName, sKeyName, ID, tx);

            return { success: true, sDelete };
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`, req);
        }
    });

    /**
         * Checking of Claim Types eligible to user
         * @public
         * @param {String} ID - User employee ID to be checked against;
         * @returns {Array} Array of all claim types and claim item types available for user
         */
    srv.on('CheckUserClaimTypes', async (req) => {
        try {
            const { sEmpId } = req.data;
            if (!!sEmpId) {
                throw new Error('No Data Sent')
            }
            const tx = cds.tx(req);
            // Get Employee Data
            const aEmpData = await tx.run(
                SELECT.from(Constant.Entities.ZEMP_MASTER).where({ EEID: sEmpId })
            )

            // Get employee grade
            let aPersonalGrade = aEmpData.map(d => d.GRADE);
            aPersonalGrade.push(Constant.Wildcard.All);

            let aEmpRoleId = aEmpData.map(d => d.ROLE);
            aEmpRoleId.push(Constant.Wildcard.All);

            // Get Eligibility Rules
            const aEligibilityRules = await tx.run(
                SELECT.distinct
                    .from(Constant.Entities.ZELIGIBILITY_RULE)
                    .columns(Constant.EntitiesFields.CLAIM_TYPE_ID,
                        Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID)
                    .where({
                        PERSONAL_GRADE: { in: aPersonalGrade },
                        ROLE_ID: { in: aEmpRoleId }
                    })
                    .orderBy(Constant.EntitiesFields.CLAIM_TYPE_ID)
            );

            const aAllEligibleClaims = [];

            for (const row of aEligibilityRules) {
                let group = aAllEligibleClaims.find(g => g.claimTypeId === row.CLAIM_TYPE_ID);

                if (!group) {
                    group = {
                        claimTypeId: row.CLAIM_TYPE_ID,
                        items: []
                    };
                    aAllEligibleClaims.push(group);
                }

                group.items.push({
                    claimTypeItemId: row.CLAIM_TYPE_ITEM_ID
                });
            }
            return aAllEligibleClaims;

        } catch (error) {
            req.error(500, `Fail processing records: ${error.message}`, req);
        }
    });

    /**
         * Checking of Eligibility scenarios for each claim type
         * @public
         * @param {Array} aPayload - Array of Payload data containing ClaimType, ClaimItmType, List Array of fields to be checked;
         * @returns {Object} Object Payload with results field in CheckFields List Array populated
         */
    srv.on('EligibilityCheck', async (req) => {
        try {
            const { aPayload } = req.data;
            if (!aPayload || aPayload.length === 0) {
                throw new Error('No Data Sent')
            }
            const tx = cds.tx(req);
            result = await EligibleScenarioCheck.onEligibilityCheck(aPayload, tx);
            return result;

        } catch (error) {
            return req.reject(400, `Fail processing records: ${error.message}`);
        }
    });

    /**
     * Get cash advance amount from request, based on request items that have cash advance amount and has been sent to SF 
     * @public
     * @param {String} sRequestId - ID of pre-approval request
     * @return {Decimal} - return total cash advance amount from records returned
     */
    srv.on('getApprovedCashAdvanceAmount', async (req) => {
        const { sRequestId } = req.data;
        if (!sRequestId) return 0.00;

        try {
            const aRequestItems = await SELECT
                .from(Constant.Entities.ZREQUEST_ITEM)
                .columns(Constant.EntitiesFields.EST_AMOUNT)
                .where({
                    // values to filter
                    REQUEST_ID: sRequestId,
                    CASH_ADVANCE: true,
                    SEND_TO_SF: true
                })
                .orderBy([{ ref: [Constant.EntitiesFields.REQUEST_SUB_ID], sort: 'asc' }]);

            if (aRequestItems.length > 0) {
                var dResult = 0.00;

                for (var iIndex = 0; iIndex < aRequestItems.length; iIndex++) {
                    dResult += parseFloat(aRequestItems[iIndex].EST_AMOUNT);
                }
                return dResult;
            }
            else {
                return 0.00;
            }

        } catch (error) {
            req.error(500, 'An error occurred while checking Request Item table.');
        }
    });

    /**
    * Perdiem calculation for Claim Submission
    * @public
    * @param {Integer} day - Travel duration - day;
    * @param {Decimal} hours - Travel duration - hours;
    * @param {String}  location - 01-Semenanjung-Sabah/Sarawak, 02, 03-Oversea;
    * @param {String} claimtypeid - Claim Type ID;
    * @param {String} claimtypeitem - Claim Type Item ID;
    * @param {Integer} breakfast - Breakfast provided;
    * @param {Integer} lunch - Lunch provided;
    * @param {Integer} dinner - Dinner provided;
    * @returns {Decimal} perdiem - Entitlement amount, Daily Allowance
    */
    srv.on('getAmountEntitlement', async (req) => {
        const { ZEMP_MASTER, ZPERDIEM_ENT } = srv.entities;
        const tx = cds.tx(req);
        const today = new Date().toISOString().slice(0, 10);

        let entitlement = null;
        let meal_allowance = 0;
        let daily_allowance = 0;
        let time_difference = 0;
        let bfast, lunch, dinner, total_meal_allowance = 0;
        var total_tips = 0;

        //get employee personal grade 
        const result = await tx.run(
            SELECT.one.from(ZEMP_MASTER).where({ EEID: req.data.employeeid })
        );

        try {
            if (result.GRADE) {
                entitlement = await tx.run(SELECT.one.from(ZPERDIEM_ENT).where({
                    PERSONAL_GRADE: result.GRADE,
                    LOCATION: req.data.location,
                    CLAIM_TYPE_ID: req.data.claimtypeid,
                    CLAIM_TYPE_ITEM_ID: req.data.claimtypeitem,
                    START_DATE: { '<=': today },
                    END_DATE: { '>=': today }
                })
                );

                //use the wildcard if no entitlement avavailable - for MAKAN_O
                if (!entitlement) {
                    entitlement = await tx.run(SELECT.one.from(ZPERDIEM_ENT).where({
                        PERSONAL_GRADE: '*',
                        LOCATION: req.data.location,
                        CLAIM_TYPE_ID: req.data.claimtypeid,
                        CLAIM_TYPE_ITEM_ID: req.data.claimtypeitem,
                        START_DATE: { '<=': today },
                        END_DATE: { '>=': today }
                    })
                    );
                }
            }
        } catch (err) {
            req.error(400, "Failed to retrieve entitlement information");
        }
        console.log(entitlement);
        if (!entitlement) {
            return { amount: 0, daily_allowance: 0, currency_code: null };
        } else {
            //calculation for MKN_LOAN and MKN_TUKAR based on dependent
            if (req.data.claimtypeitem === Constant.ClaimTypeItem.MKN_LOAN || req.data.claimtypeitem === Constant.ClaimTypeItem.MKN_TUKAR) {
                total_amt_dp = (entitlement.AMOUNT * req.data.dependent * req.data.day);
                return { amount: total_amt_dp, tips_amount: total_tips };
            } else {
                time_difference = req.data.day != 0 ? req.data.hours - (24 * req.data.day) : 0;

                //checking on the daily and meal allowance entitlement
                if (req.data.day === 0 && req.data.hours < 8.0) {
                    //no entitlement
                    meal_allowance = 0;
                } else if (req.data.day === 0 && req.data.hours >= 8.0 && req.data.hours < 24.0) {
                    //entitle for daily allowance
                    meal_allowance = entitlement.AMOUNT / 2;
                }
                else if (req.data.day > 0) {
                    meal_allowance = req.data.day * entitlement.AMOUNT;
                    if (time_difference >= 8.0 && time_difference < 24.0) {
                        daily_allowance = entitlement.AMOUNT / 2;
                    }
                    meal_allowance += daily_allowance;
                }

                //deduction of meal allowance
                //// no deduction for elaun makan perpindahan
                if (req.data.claimtypeitem === Constant.ClaimTypeItem.MKN_LOAN) {
                    bfast = req.data.breakfast != 0 ? entitlement.AMOUNT * req.data.breakfast : 0;
                    lunch = req.data.lunch != 0 ? entitlement.AMOUNT * req.data.lunch : 0;
                    dinner = req.data.dinner != 0 ? entitlement.AMOUNT * req.data.dinner : 0;
                } else {
                    //20% from breakfast, 40% from lunch, 40% from dinner 
                    bfast = req.data.breakfast != 0 ? (0.2 * entitlement.AMOUNT) * req.data.breakfast : 0;
                    lunch = req.data.lunch != 0 ? (0.4 * entitlement.AMOUNT) * req.data.lunch : 0;
                    dinner = req.data.dinner != 0 ? (0.4 * entitlement.AMOUNT) * req.data.dinner : 0;
                }
                total_meal_allowance = meal_allowance != 0 ? (meal_allowance - bfast - lunch - dinner) : 0;

                //to include tips calculation (15%) from total entitlement
                // only applicable for claim submission
                // if true, exclude tips and set total tips to be 0. Else, include 15% tips
                if (!req.data.exclude_tips) {
                    total_tips = 0.15 * total_meal_allowance;
                    total_meal_allowance += total_tips;
                }

                return {
                    amount: total_meal_allowance,
                    daily_allowance: daily_allowance,
                    currency_code: entitlement.CURRENCY,
                    tips_amount: total_tips
                }
            }
        }
    });

    /**
    * Function for aging calculation for pre-approval travel/reimbursement
    * Checks approved pre-approval requests against aging milestones and
    * returns a list of reminders for claimants who have not submitted their claim
    * @public
    * @returns {Array} aResult - Array of reminder objects
    */
    srv.on('getEmailReminder', async (req) => {
        //TRIP_END_DATE 2 months from current date
        //RT0001 and RT0002 - travel and reimbursement
        //select pre-approval request for travel/reimbursement where trip end date 2 months from current date
        const today = new Date();
        const baseline = new Date();

        baseline.setMonth(baseline.getMonth() - 3);

        const sTodayDate = today.toISOString().slice(0, 10);
        const sBaselineDate = baseline.toISOString().slice(0, 10);
        const { ZREQUEST_HEADER, ZCLAIM_HEADER, ZEMP_MASTER, ZROLEHIERARCHY, ZCONSTANTS } = srv.entities;
        const tx = cds.tx(req);

        let aResult = [];

        //get pre-approval records 3 months from current date
        const preapproval = await tx.run(
            SELECT.from(ZREQUEST_HEADER).where({
                REQUEST_TYPE_ID: {
                    in: [Constant.RequestType.Travel,
                    Constant.RequestType.Reimbursement]
                },
                STATUS: Constant.Status.APPROVED,  //Approved
            }).and(
                `TRIP_END_DATE > '${sBaselineDate}' AND 
                TRIP_END_DATE <= '${sTodayDate}'`)
        );

        for (var oRequest of preapproval) {
            try {
                let sAgingDay = null;
                let sScenario = null;
                let sClaimStatus = null;
                let sName = null;
                let sEmail = null;
                let sCCEmail = null;

                if (parseFloat(oRequest.CASH_ADVANCE) === 0) {
                    //Scenario 1
                    //candidates for email aging -  T+1,T+30, T+60, T+85
                    sScenario = Constant.ReminderScenario.NO_CASH_ADVANCE;
                    sAgingDay = EmailReminder.getNoCashAdvanceAgingDay(oRequest.TRIP_END_DATE, sTodayDate);
                } else if (parseFloat(oRequest.CASH_ADVANCE) > 0 && oRequest.REQUEST_TYPE_ID === Constant.RequestType.Travel) {
                    //Scenario 2
                    //candidates for email aging -  Trip end date+1, 11th-15th following month, 16 following month
                    sScenario = Constant.ReminderScenario.WITH_CASH_ADVANCE;
                    sAgingDay = EmailReminder.getCashAdvanceAgingDay(oRequest.TRIP_END_DATE, sTodayDate);
                }

                if (sAgingDay != null) {
                    sClaimStatus = await EmailReminder.getClaimStatus(ZCLAIM_HEADER, tx, oRequest.REQUEST_ID);  //return true or false
                    if (sClaimStatus) {
                        ({ sName, sEmail, sCCEmail } = await EmailReminder.getClaimantDetails(ZEMP_MASTER, ZROLEHIERARCHY, ZCONSTANTS, tx, oRequest.EMP_ID, sScenario, sAgingDay));
                    }

                    aResult.push({
                        empName: sName,
                        empEmail: sEmail,
                        ccEmail: sCCEmail,
                        tripEndDate: new Date(oRequest.TRIP_END_DATE).toISOString().slice(0, 10),
                        scenario: sScenario,
                        milestone: sAgingDay
                    })
                }
            } catch (error) {
                console.log(`Error processing request ${oRequest.REQUEST_ID}:`, error.message);
                req.info(`Error processing request ${oRequest.REQUEST_ID}:`, error.message);
                continue;
            }
        }


        if (aResult.length === 0) {
            req.info('No reminders available');
            return [];
        }

        return aResult;
    });

    srv.on('checkDefaultCostCenter', async (req) => {
        const { sClaimTypeId } = req.data;

        if (!sClaimTypeId) {
            return req.error(400, 'Please provide an Employee ID.');
        }

        try {
            const oClaimTypeRecord = await SELECT.one('COST_CENTER')
                .from('ZCLAIM_TYPE')
                .where({ CLAIM_TYPE_ID: sClaimTypeId });

            if (!oClaimTypeRecord) {
                return req.error(404, `Claim Type ${oClaimTypeRecord} not found.`);
            }

            const sCostCenterId = oClaimTypeRecord.COST_CENTER || "";

            const oCostCenterRecord = await SELECT.one('COST_CENTER_DESC')
                .from('ZCOST_CENTER')
                .where({ COST_CENTER_ID: sCostCenterId });

            const sCostCenterDesc = oCostCenterRecord ? oCostCenterRecord.COST_CENTER_DESC : '';

            return {
                sCostCenter: String(sCostCenterId) || "",
                sCostCenterDesc: String(sCostCenterDesc) || ""
            }

        } catch (error) {
            return req.error(500, 'An error occurred while checking claim type table.');
        }
    });

    srv.after('UPDATE', 'ZREQUEST_HEADER', async (data, req) => {

        const sStatus = data.STATUS || req.data.STATUS;

        if (sStatus === Constant.Status.APPROVED) {
            var oRequestRecord;
            const sRequestId = data.REQUEST_ID || req.data.REQUEST_ID;
            try {
                oRequestRecord = await
                    SELECT.one.from(Constant.Entities.ZREQUEST_HEADER).where({ REQUEST_ID: sRequestId });

            } catch (error) {
                req.error(500, `Failed searching for request header: ${sRequestId}, ${error.message}`);
            }

            if (!oRequestRecord) return;
            if (!sRequestId) return;

            cds.spawn({ user: req.user }, async (tx) => {
                switch (oRequestRecord.CLAIM_TYPE_ID) {
                    case Constant.ClaimType.HANDPHONE:
                        try {
                            var result;
                            const aReqItem = await tx.run(
                                SELECT.from(Constant.Entities.ZREQUEST_ITEM).where({
                                    REQUEST_ID: sRequestId
                                })
                            );

                            const aReqSubId = aReqItem.map((d) => d.REQUEST_SUB_ID);
                            const aParticipantData = await tx.run(
                                SELECT.from(Constant.Entities.ZREQ_ITEM_PART).where({
                                    REQUEST_ID: sRequestId,
                                    REQUEST_SUB_ID: { in: aReqSubId }
                                })
                            );
                            for (let i = 0; i < aParticipantData.length; i++) {
                                var aPartReqItem = aReqItem.filter(function (item) {
                                    return item.REQUEST_SUB_ID === aParticipantData[i].REQUEST_SUB_ID;
                                });
                                result = await tx.run(
                                    INSERT.into('ZCLM_TYPE_EXCEPTION_LIST').entries({
                                        EMP_ID: aParticipantData[i].PARTICIPANTS_ID,
                                        CLAIM_TYPE_ID: aPartReqItem[0].CLAIM_TYPE_ID,
                                        START_DATE: aPartReqItem[0].START_DATE,
                                        END_DATE: aPartReqItem[0].END_DATE,
                                        ELIGIBLE_AMOUNT: aParticipantData[i].ALLOCATED_AMOUNT
                                    })
                                );
                            };

                        } catch (error) {
                            req.error(400, `Failed inserting records for Exception List Table: ${error.message}`);
                        }
                        break;

                    default:
                        try {
                            const oCashAdvanceItem = await tx.run(
                                SELECT.one.from('ZREQUEST_ITEM').where({
                                    REQUEST_ID: sRequestId,
                                    CASH_ADVANCE: true
                                })
                            );

                            if (!oCashAdvanceItem) return;

                            const sEmpId = oRequestRecord.EMP_ID;
                            const sTripStartDate = oRequestRecord.TRIP_START_DATE;

                            const oExistingCashAdvRecords = await tx.run(
                                SELECT.one.from('ZEMP_CA_PAYMENT').where({
                                    REQUEST_ID: sRequestId,
                                    EMP_ID: sEmpId
                                })
                            );

                            if (oExistingCashAdvRecords) return;

                            let dDate = new Date(sTripStartDate);
                            dDate.setDate(dDate.getDate() - 14);
                            const sDisbursementDate = dDate.toISOString().split('T')[0];

                            await tx.run(
                                INSERT.into('ZEMP_CA_PAYMENT').entries({
                                    REQUEST_ID: sRequestId,
                                    EMP_ID: sEmpId,
                                    DISBURSEMENT_DATE: sDisbursementDate,
                                    DISBURSEMENT_STATUS: Constant.DisbursementStatus.TO_BE_DISBURSED
                                })
                            );

                        } catch (error) {
                            req.error(400, `Fail inserting records for Cash Advance Table: ${error.message}`);
                        }
                        break;
                }
            });
        }
    });

    /**
     * Get rate per km id and description, based on Vehicle Type, Claim Type Item Claim Item, Start Date or Receipt Date
     * @public
     * @param {String} sVehicleType - vehicle type to check in table 
     * @param {String} sClaimTypeItem - claim type item to check in table
     * @param {date} dRateDate - Date to check in table
     * @return {Object} rateperkm - return rate per km ID and description
     */
    srv.on("getRatePerKm", async (req) => {
        const {
            sVehicleType,
            sClaimTypeItem,
            dRateDate
        } = req.data;

        if (!dRateDate) {
            return req.error(400, "Rate date is required.");
        }

        try {
            let aVehicleTypeFilters = [Constant.Wildcard.All];
            if (sVehicleType) {
                aVehicleTypeFilters.push(sVehicleType);
            }

            let aClaimTypeItemFilters = [Constant.Wildcard.All];
            if (sClaimTypeItem) {
                aClaimTypeItemFilters.push(sClaimTypeItem);
            }

            const oRatePerKm = await SELECT.one
                .from(Constant.Entities.ZRATE_KM)
                .columns(
                    Constant.EntitiesFields.RATE_KM_ID,
                    Constant.EntitiesFields.RATE
                )
                .where({
                    STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                    START_DATE: { "<=": dRateDate },
                    END_DATE: { ">=": dRateDate },
                    VEHICLE_TYPE_ID: aVehicleTypeFilters,
                    CLAIM_TYPE_ITEM_ID: aClaimTypeItemFilters
                })
                .orderBy([
                    { ref: [Constant.EntitiesFields.VEHICLE_TYPE_ID], sort: "desc" },
                    { ref: [Constant.EntitiesFields.CLAIM_TYPE_ITEM_ID], sort: "desc" }
                ]);

            if (!oRatePerKm) {
                return req.error(404, "Rate per KM not found for given parameters.");
            }

            return {
                id: oRatePerKm.RATE_KM_ID,
                value: oRatePerKm.RATE
            };

        } catch (error) {
            return req.error(
                500,
                "An error occurred while determining Rate per KM."
            );
        }
    });
    /**
     * Get eligible amount for employee on Elaun Pengangkutan, based on Marital Status
     * @public
     * @return {Decimal} - return eligible amount retrieved from table
     */
    srv.on('getUserEligibleAmountEPengakut', async (req) => {
        const sUserEmail = req.user?.attr?.email || req.user?.attr?.mail || req.user?.attr?.user_name || req.user?.attr?.login_name || req.user?.id || "";
        const sEmail = String(sUserEmail).trim().toLowerCase();

        try {
            const oEmpData = await SELECT.one.from(Constant.Entities.ZEMP_MASTER).columns('EEID', 'MARITAL').where({ EMAIL: sEmail });
            if (!oEmpData) {
                return req.error(404, `No employee data found.`);
            }

            const sMarriageCategory = await GetDependentData.getMarriageCategory(oEmpData.EEID);
            if (!sMarriageCategory) {
                return req.error(404, `No marriage category available for employee.`);
            }

            const sTodayDate = new Date().toISOString().slice(0, 10);
            var aMaritalStatusValues = [Constant.Wildcard.All];
            if (!!oEmpData.MARITAL) {
                aMaritalStatusValues.push(oEmpData.MARITAL);
            }
            var aMarriageCategoryValues = [Constant.Wildcard.All];
            if (!!sMarriageCategory) {
                aMarriageCategoryValues.push(sMarriageCategory);
            }

            const oEligibilityRule = await SELECT.one
                .from(Constant.Entities.ZELIGIBILITY_RULE)
                .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT)
                .where({
                    // claim type + claim type item
                    CLAIM_TYPE_ID: Constant.ClaimType.ELAUN_PINDAH,
                    CLAIM_TYPE_ITEM_ID: Constant.ClaimTypeItem.E_PENGAKUT,
                    // status check
                    STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                    START_DATE: { '<=': sTodayDate },
                    END_DATE: { '>=': sTodayDate },
                    // values to filter
                    MARITAL_STATUS: { 'in': aMaritalStatusValues },
                    MARRIAGE_CATEGORY: { 'in': aMarriageCategoryValues }
                })
                .orderBy([
                    { ref: [Constant.EntitiesFields.MARITAL_STATUS], sort: 'desc' },
                    { ref: [Constant.EntitiesFields.MARRIAGE_CATEGORY], sort: 'desc' }
                ]);

            if (!oEligibilityRule) {
                req.error(404, `Eligible amount not found for given employee.`);
            }

            return oEligibilityRule.ELIGIBLE_AMOUNT;

        } catch (error) {
            req.error(500, 'An error occurred while checking Eligibility Rule table.');
        }
    });

    /**
     * Check if user has already approved claim with elaun pengangkutan claim item
     * @public
     * @return {String} - return claim status if approved claim already exists with elaun pengangkutan claim item
     */
    srv.on('getUserClaimStatusEPengakut', async (req) => {
        const sUserEmail = req.user?.attr?.email || req.user?.attr?.mail || req.user?.attr?.user_name || req.user?.attr?.login_name || req.user?.id || "";
        const sEmail = String(sUserEmail).trim().toLowerCase();

        try {
            const oEmpData = await SELECT.one.from(Constant.Entities.ZEMP_MASTER).columns('EEID').where({ EMAIL: sEmail });
            if (!oEmpData) {
                return req.error(404, `No employee data found.`);
            }

            const aClaimSubmissions = await SELECT
                .from(Constant.Entities.ZCLAIM_ITEM)
                .columns(item => {
                    item.CLAIM_ID
                    item.ZCLAIM_HEADER(header => header.STATUS_ID)
                })
                .where({
                    EMP_ID: oEmpData.EEID,
                    CLAIM_TYPE_ITEM_ID: Constant.ClaimTypeItem.E_PENGAKUT,
                    "ZCLAIM_HEADER.STATUS_ID": [Constant.Status.PENDING_APPROVAL, Constant.Status.APPROVED]
                })
                .orderBy([
                    "ZCLAIM_HEADER.STATUS_ID",
                    Constant.EntitiesFields.CLAIMID,
                    Constant.EntitiesFields.CLAIM_SUB_ID
                ]);

            if (!aClaimSubmissions) {
                req.error(404, `Unable to retrieve previous claims.`);
            }

            return (aClaimSubmissions.length > 0) ? aClaimSubmissions[0].ZCLAIM_HEADER.STATUS_ID : null;

        } catch (error) {
            req.error(500, 'An error occurred while retrieving claims from Claim Item table.');
        }
    });

    /**
     * Get eligible amount for user employee on Lodging claim type items, based on Employee Grade
     * @public
     * @param {String} sClaimType - claim type to retrieve amount
     * @param {String} sClaimTypeItem - claim type item to retrieve amount
     * @return {Decimal} - return eligible amount retrieved from table
     */
    srv.on('getUserEligibleAmountLodging', async (req) => {
        const { sClaimType, sClaimTypeItem } = req.data;

        try {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp) {
                req.error(404, `No employee data found.`);
            }
            else {
                const sTodayDate = new Date().toISOString().slice(0, 10);
                var aPersonalGradeFilters = [Constant.Wildcard.All];
                if (!!oEmp.GRADE) aPersonalGradeFilters.push(oEmp.GRADE);

                const oEligibilityRule = await SELECT.one
                    .from(Constant.Entities.ZELIGIBILITY_RULE)
                    .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT)
                    .where({
                        // claim type + claim type item
                        CLAIM_TYPE_ID: sClaimType,
                        CLAIM_TYPE_ITEM_ID: sClaimTypeItem,
                        // status check
                        STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                        START_DATE: { '<=': sTodayDate },
                        END_DATE: { '>=': sTodayDate },
                        // values to filter
                        PERSONAL_GRADE: { 'in': aPersonalGradeFilters }
                    })
                    .orderBy([{ ref: [Constant.EntitiesFields.PERSONAL_GRADE], sort: 'desc' }]);

                if (!oEligibilityRule) {
                    req.error(404, `Eligible amount not found for given employee.`);
                }
                else {
                    return oEligibilityRule.ELIGIBLE_AMOUNT;
                }
            }

        } catch (error) {
            req.error(500, 'An error occurred while checking Eligibility Rule table.');
        }
    });

    srv.on('getOfficeDistance', async (req) => {
        const {
            sFromState,
            sFromOffice,
            sToState,
            sToOffice
        } = req.data;

        try {
            const oRoute = await SELECT.one.from('ZOFFICE_DISTANCE').where({
                FROM_STATE_ID: sFromState,
                FROM_LOCATION_ID: sFromOffice,
                TO_STATE_ID: sToState,
                TO_LOCATION_ID: sToOffice
            });

            if (oRoute) {
                return oRoute.MILEAGE;
            }

            req.error(404, 'No distance record found for the selected route.');

        } catch (error) {
            req.error(500, `Failed to retrieve mileage: ${error.message}`);
        }
    });

    /**
    * Function to check if Pre-approval request has been used for claim submission
    * Show warning if Pre-approval request has been used, exclude REJECT & CANCEL status
    * returns a boolean true/false
    * @public
    * @param {String} requestId - Pre-Approval Request ID
    * @returns {Boolean} PreApprovalUsageCheck - isUsed
    */
    srv.on('checkPreApprovalUsage', async (req) => {
        const { ZCLAIM_HEADER } = srv.entities;
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

        const claim = await tx.run(
            SELECT.one.from(ZCLAIM_HEADER).where({
                EMP_ID: oEmp.EEID,
                REQUEST_ID: req.data.requestID,
                STATUS_ID: { 'not in': [Constant.Status.REJECTED, Constant.Status.CANCELLED] }
            })
        );

        if (claim) {
            return { isUsed: true }
        } else {
            return { isUsed: false }
        }
    });

    srv.on('deleteParticipants', async (req) => {
        const { participants } = req.data;

        if (!participants || participants.length === 0) {
            return true;
        }

        try {
            const tx = cds.tx(req);

            const aDeletePromises = participants.map(p =>
                tx.run(
                    DELETE.from('ZREQ_ITEM_PART').where({
                        REQUEST_ID: p.REQUEST_ID,
                        REQUEST_SUB_ID: p.REQUEST_SUB_ID,
                        PARTICIPANTS_ID: p.PARTICIPANTS_ID
                    })
                )
            );

            await Promise.all(aDeletePromises);

            return true;

        } catch (error) {
            req.error(500, `Failed to delete participants: ${error.message}`);
        }
    });

    srv.on("getLodgingAmount", async (req) => {
        const { sClaimTypeId, sClaimTypeItemId, sEmpId } = req.data;

        if (!sClaimTypeId || !sClaimTypeItemId || !sEmpId) {
            return req.error(400, "Missing required parameters: Claim Type, Claim Type Item, or Employee ID.");
        }

        try {
            const oEmployee = await SELECT.one.from('ZEMP_MASTER').where({ EEID: sEmpId });
            if (!oEmployee || !oEmployee.GRADE) {
                return req.error(404, `Employee record or Personal Grade not found for ID: ${sEmpId}`);
            }

            const sPersonalGrade = oEmployee.GRADE;

            const oRule = await SELECT.one.from('ZELIGIBILITY_RULE').where({
                CLAIM_TYPE_ID: sClaimTypeId,
                CLAIM_TYPE_ITEM_ID: sClaimTypeItemId,
                PERSONAL_GRADE: sPersonalGrade
            });

            if (oRule && oRule.ELIGIBLE_AMOUNT !== undefined) {
                return oRule.ELIGIBLE_AMOUNT;
            } else {
                return req.error(404, `No eligibility rule configured for Grade ${sPersonalGrade} on this claim item.`);
            }

        } catch (error) {
            req.error(500, `Failed to retrieve lodging amount: ${error.message}`);
        }
    });

    /**
     * Compute total meter cube entitlement for an employee.
     * This helper method applies business rules to calculate the total meter cube
     * entitlement based on employee profile and dependent information.
     *
     * Entitlement computation includes:
     *  - Base employee entitlement
     *  - Additional entitlement based on marital status (single / married)
     *  - Dependent-based entitlement for spouse, additional spouse, and children
     *    (with child age conditions applied)
     *
     * Meter cube values are retrieved from the ZMETER_CUBE configuration table.
     * Employee and dependent details are retrieved from ZEMP_MASTER and ZEMP_DEPENDENT
     * respectively.
     *
     * @private
     * @async
     * @param {object} tx - CAP transaction context for database operations
     * @param {string} oEmp - Employee ID used to retrieve employee and dependent records
     * @param {object} entities - CAP service entities containing database models
     * @returns {number} Total entitled meter cube value (rounded to 2 decimal places)
     */
    async function computeMeterCubeEntitlement(tx, oEmp, entities, aSelectedDependentNos = []) {
        const { ZEMP_MASTER, ZEMP_DEPENDENT, ZMETER_CUBE } = entities;

        let total = 0;

        const aMeterCube = await tx.run(SELECT.from(ZMETER_CUBE));
        const getCube = (id) =>
            Number(aMeterCube.find(c => c.METER_CUBE_ID === id)?.METER_CUBE || 0);

        total += getCube(Constant.MeterCubeId.EMPLOYEE);

        if (oEmp.MARITAL === Constant.MaritalStatus.SINGLE) {
            total += getCube(Constant.MeterCubeId.SINGLE);
        }
        if (oEmp.MARITAL === Constant.MaritalStatus.MARRIED) {
            total += getCube(Constant.MeterCubeId.MARRIED);
        }

        let dependents = await tx.run(
            SELECT.from(ZEMP_DEPENDENT).where({ EMP_ID: oEmp.EEID })
        );

        if (aSelectedDependentNos && aSelectedDependentNos.length > 0) {
            const aStringifiedKeys = aSelectedDependentNos.map(String);
            dependents = dependents.filter(d => aStringifiedKeys.includes(String(d.DEPENDENT_NO))
            );
        } else {
            dependents = [];
        }

        const year = new Date().getFullYear();

        for (const d of dependents) {

            if (d.RELATIONSHIP === Constant.RelationshipType.SPOUSE) {
                total += getCube(Constant.MeterCubeId.SPOUSE);
            }

            else if (d.RELATIONSHIP === Constant.RelationshipType.ADDITIONAL_SPOUSE) {
                total += getCube(Constant.MeterCubeId.ADDITIONAL_SPOUSE);
            }

            else if (d.RELATIONSHIP === Constant.RelationshipType.CHILD && d.DOB) {
                const age = year - new Date(d.DOB).getFullYear();
                total += age >= 3
                    ? getCube(Constant.MeterCubeId.CHILD_GE_3)
                    : getCube(Constant.MeterCubeId.CHILD_LT_3);
            }
        }

        return Number(total.toFixed(2));
    }

    /**
     * Retrieve employee master record for logged-in user.
     *
     * @private
     * @async
     * @param {object} tx - CAP transaction context
     * @param {object} req - CAP request object
     * @param {object} entities - CAP service entities
     * @returns {object} Employee master record
     */
    async function getLoggedInEmployee(tx, req, entities) {
        const { ZEMP_MASTER } = entities;
        const sUserEmail =
            req.user?.attr?.email ||
            req.user?.attr?.mail ||
            req.user?.attr?.user_name ||
            req.user?.attr?.login_name ||
            req.user?.id;

        if (!sUserEmail) {
            req.error(401, "Unable to determine logged-in user");
        }
        const oEmp = await tx.run(
            SELECT.one.from(ZEMP_MASTER).where({ EMAIL: String(sUserEmail).trim().toLowerCase() })
        );
        if (!oEmp) {
            req.error(404, "Employee record not found");
        }

        return oEmp;
    }

    /**
     * Retrieve meter cube entitlement for an employee.
     * Calculates total meter cube entitlement based on employee profile
     * and dependent relationships using backend business rules.
     *
     * @public
     * @async
     * @param {object} req - CAP request object containing employee context
     * @returns {number} Total entitled meter cube value
     */
    srv.on('getMeterCubeEntitlement', async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        const { selectedDependents } = req.data;

        if (oEmp) {
            return await computeMeterCubeEntitlement(
                tx,
                oEmp,
                srv.entities,
                selectedDependents
            );
        }

    });

    /**
     * Calculate final claim amount for Pengangkutan Laut.
     * Determines the payable amount by comparing actual meter cube
     * against entitled meter cube and applying proration if required.
     * Entitlement is always recalculated in backend for consistency.
     *
     * @public
     * @async
     * @param {object} req - CAP request object containing input values
     * @returns {object} Result containing entitled meter cube and final amount
     */
    srv.on('calculatePengangkutanLautAmount', async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        const nActualMC = Number(req.data.actualMeterCube);
        const nActualAmount = Number(req.data.actualAmount);
        const { selectedDependents } = req.data;

        if (isNaN(nActualMC) || isNaN(nActualAmount)) {
            return { entitled: 0, amount: 0 };
        }

        const nEntitledMC = await computeMeterCubeEntitlement(tx, oEmp, srv.entities, selectedDependents);

        const nFinalAmount =
            (nActualMC > nEntitledMC && nEntitledMC > 0)
                ? (nActualAmount / nActualMC) * nEntitledMC
                : nActualAmount;

        return {
            entitled: nEntitledMC,
            amount: Number(nFinalAmount.toFixed(2))
        };
    });

    srv.on('calculateMatawangAmount', async (req) => {
        const tx = cds.tx(req);

        const aClaimItems = JSON.parse(req.data.claimItems || "[]");
        if (!Array.isArray(aClaimItems)) {
            req.error(400, "Invalid claim item list.");
        }

        let iTotal = 0;

        aClaimItems.forEach(oItem => {
            if (
                oItem.claim_type_item_id !== Constant.ClaimTypeItem.MATAWANG &&
                oItem.need_foreign_currency === true
            ) {
                iTotal += Number(oItem.amount || 0);
            }
        });
        const nPercentage = 3.00; // 3%
        const nThreePercent =
            Math.ceil(iTotal * (nPercentage / 100) * 100) / 100;
        return {
            percentage: nPercentage,
            amount: nThreePercent
        };
    });

    /**
     * Get Total count of dependent based on Employee ID
     * IND1 - fetch Spouse and Child Only
     * @public
     * @async
     * @returns {Integer} Total count of dependent 
     */
    srv.on('getNumberOfFamilyMembers', async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        const { ZEMP_DEPENDENT } = srv.entities;
        const sIndicator = req.data.IND;
        var aDependent;

        //get total dependent based on Employee ID - IND1 filter by spouse and child
        if (oEmp) {
            if (sIndicator === Constant.Indicator.Spouse_Child) {
                aDependent = await tx.run(
                    SELECT.from(ZEMP_DEPENDENT).where({
                        EMP_ID: oEmp.EEID,
                        RELATIONSHIP: {
                            in: [Constant.RelationshipType.SPOUSE,
                            Constant.Relationship.CHILD]
                        }
                    })
                );
            } else {
                aDependent = await tx.run(
                    SELECT.from(ZEMP_DEPENDENT).where({
                        EMP_ID: oEmp.EEID
                    })
                );
            }
            return aDependent.length + 1;
        }
    });

    /**
     * method to retrieve the minimum eligible amount and rate per km based on the requestor / claimant ranks
     * @public
     * @async
     * @param {String} sRegion : location 
     * @param {Float} fKilometer : input from requestor
     * @returns {Object} DaratAmounts: returning minimum eligible amount & rate per km
     */
    srv.on('getPengangkutanDaratAmount', async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        const { ZELIGIBILITY_RULE } = srv.entities;
        const { sRegion, fKilometer } = req.data;

        if (oEmp) {
            if (req.data.sMaritalCategory) {
                var sMarriageCategory = req.data.sMaritalCategory;
                if (req.data.sMaritalCategory == Constant.MarriageCategory.SINGLE) {
                    var sMaritalStatus = Constant.MaritalStatus.SINGLE;
                } else {
                    var sMaritalStatus = oEmp.MARITAL;
                }
            } else {
                var sMarriageCategory = await GetDependentData.getMarriageCategory(oEmp.EEID);
                var sMaritalStatus = oEmp.MARITAL;
            }

            if (!sMarriageCategory) {
                req.error(404, `No marriage category available for employee.`);
            }

            const sTodayDate = new Date().toISOString().slice(0, 10);

            const oEligibilityRule = await SELECT.one.from(ZELIGIBILITY_RULE).where({
                CLAIM_TYPE_ID: Constant.ClaimType.ELAUN_TUKAR,
                CLAIM_TYPE_ITEM_ID: Constant.ClaimTypeItem.DARAT,
                MARITAL_STATUS: sMaritalStatus,
                MARRIAGE_CATEGORY: sMarriageCategory,
                REGION_ID: sRegion,
                STATUS: Constant.ConfigStatus.ACTIVE,
                START_DATE: { '<=': sTodayDate },
                END_DATE: { '>=': sTodayDate },
            }).orderBy([
                { ref: [Constant.EntitiesFields.MARITAL_STATUS], sort: 'desc' },
                { ref: [Constant.EntitiesFields.MARRIAGE_CATEGORY], sort: 'desc' }
            ]);

            if (!oEligibilityRule) {
                req.error(404, `Eligibility not found.`);
            }
            console.log(oEligibilityRule);
            const fCalculatedAmount = parseFloat(fKilometer) * parseFloat(oEligibilityRule.RATE);
            const fMinimumEligibleAmount = parseFloat(oEligibilityRule.ELIGIBLE_AMOUNT);

            return {
                fAmount: Math.max(fCalculatedAmount, fMinimumEligibleAmount),
                fRate: oEligibilityRule.RATE,
                bMinimum: fCalculatedAmount < fMinimumEligibleAmount
            };
        } else {
            req.error(404, `Employee Not Found.`);
        }
    });

    /**
    * Get eligible amount for employee on Elaun Pemberian Pindah, based on Marital Status
    * @public
    * @return {Decimal} - return eligible amount retrieved from table
    */
    srv.on('getUserEligibleAmountPemPindah', async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

        try {
            if (oEmp) {
                if ((req.data.sTravelAloneFamily == Constant.TravelAloneOrWithFamily.ALONE_DESC || req.data.sTravelFamilyNowLater == Constant.TravelWithFamilyNowOrLater.LATER_DESC) ||
                    (req.data.sTravelAloneFamily == Constant.TravelAloneOrWithFamily.ALONE || req.data.sTravelFamilyNowLater == Constant.TravelWithFamilyNowOrLater.LATER)) {
                    var sMarriageCategory = Constant.MarriageCategory.SINGLE;
                    var sEmpMarital = Constant.MaritalStatus.SINGLE
                } else {
                    var sMarriageCategory = await GetDependentData.getMarriageCategory(oEmp.EEID);
                    var sEmpMarital = oEmp.MARITAL;
                }

                if (!sMarriageCategory) {
                    req.error(404, `No marriage category available for employee.`);
                }

                const sTodayDate = new Date().toISOString().slice(0, 10);
                var aMaritalStatusValues = [Constant.Wildcard.All];
                if (sEmpMarital) {
                    aMaritalStatusValues.push(sEmpMarital);
                }
                var aMarriageCategoryValues = [Constant.Wildcard.All];
                if (sMarriageCategory) {
                    aMarriageCategoryValues.push(sMarriageCategory);
                }

                const oEligibilityRule = await SELECT.one
                    .from(Constant.Entities.ZELIGIBILITY_RULE)
                    .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT, Constant.EntitiesFields.SUBSIDISED_RATE)
                    .where({
                        // claim type + claim type item
                        CLAIM_TYPE_ID: req.data.sClaimType,
                        CLAIM_TYPE_ITEM_ID: req.data.sClaimTypeItem,
                        PERSONAL_GRADE: oEmp.GRADE,
                        REGION_ID: req.data.sRegion,
                        // status check
                        STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                        START_DATE: { '<=': sTodayDate },
                        END_DATE: { '>=': sTodayDate },
                        // values to filter
                        MARITAL_STATUS: { 'in': aMaritalStatusValues },
                        MARRIAGE_CATEGORY: { 'in': aMarriageCategoryValues }
                    })
                    .orderBy([
                        { ref: [Constant.EntitiesFields.MARITAL_STATUS], sort: 'desc' },
                        { ref: [Constant.EntitiesFields.MARRIAGE_CATEGORY], sort: 'desc' }
                    ]);

                if (!oEligibilityRule) {
                    return 0;
                }

                var fFinalAmount = (parseFloat(oEligibilityRule.ELIGIBLE_AMOUNT) * parseFloat(oEligibilityRule.SUBSIDISED_RATE)) / 100;

                return {
                    fAmount: oEligibilityRule.ELIGIBLE_AMOUNT,
                    fPercentage: oEligibilityRule.SUBSIDISED_RATE,
                    fFinalAmount: fFinalAmount
                }
            }

        } catch (error) {
            req.error(500, 'An error occurred while checking Eligibility Rule table.');
        }
    });

    /**
     * Validate PEA total amount by calculating:
     * - existing PEA header total
     * - new or updated line item amount
     * 
     * Ensures the final adjusted total does not exceed RM25,000.
     *
     * @public
     * @return {Object} - return validation result indicating whether processing can proceed
     */
    srv.on('validatePEATotal', async (req) => {

        const {
            headerTotal,
            currentAmount,
            isNew,
            oldAmount
        } = req.data;

        const nHeaderTotal = Number(headerTotal) || 0;
        const nCurrentAmount = Number(currentAmount) || 0;
        const nOldAmount = Number(oldAmount) || 0;
        const bIsNew = Boolean(isNew);

        let nAdjustedTotal = nHeaderTotal + nCurrentAmount;
        // Editing existing item → subtract old amount first
        if (!bIsNew) {
            nAdjustedTotal = nHeaderTotal - nOldAmount + nCurrentAmount;
        }
        if (nAdjustedTotal > 25000) {
            // Business validation error (NOT technical)
            req.error(400, 'Total amount exceeds RM25,000');
        }
        return { canProceed: true };
    });

    srv.on('checkElaunTukarEligible', async (req) => {
        const tx = cds.tx(req);

        const bIsClaimSide = req.data.IS_CLAIM === true;

        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

        if (!oEmp) {
            return req.error(404, 'Employee not found');
        }

        // ---------------------------------------------------------
        // 1. Current Checking (Position & Date Logic)
        // ---------------------------------------------------------
        const sPositionEvent = oEmp.POSITION_EVENT_REASON;
        const sPositionStartDate = oEmp.POSITION_START_DATE;

        if (!Object.values(Constant.PositionEventId).includes(sPositionEvent) || !sPositionStartDate) {
            return Constant.ElaunTukarStatus.NOT_ALLOWED;
        }

        const oConstantRec = await tx.run(
            SELECT.one.from(Constant.Entities.ZCONSTANTS)
                .columns(Constant.EntitiesFields.VALUE)
                .where({ ID: Constant.ConstantId.ELAUN_TUKAR_ELIGIBLE_AFTER_DAY_NUMBER })
        );

        const iDays = parseInt(oConstantRec?.VALUE || '0', 10);
        const dEligibleDate = new Date(sPositionStartDate);
        dEligibleDate.setUTCDate(dEligibleDate.getUTCDate() + iDays);

        const dCurrentDate = new Date();
        dCurrentDate.setUTCHours(0, 0, 0, 0);

        if (dCurrentDate <= dEligibleDate) {
            return Constant.ElaunTukarStatus.NOT_ALLOWED;
        }

        const sEligibleDateQueryFormat = dEligibleDate.toISOString().split('T')[0];

        // ---------------------------------------------------------
        // 2. Check Historical Data (Filtered by Eligible Date)
        // ---------------------------------------------------------
        const { ZCLAIM_HEADER, ZREQUEST_HEADER } = srv.entities;
        const sClaimType = Constant.ClaimType.ELAUN_TUKAR;
        const aBlockingStatuses = [Constant.Status.DRAFT, Constant.Status.PENDING_APPROVAL, Constant.Status.APPROVED];
        const sEmployeeId = oEmp.EEID;

        const [aExistingClaimsRaw, aExistingRequestsRaw] = await Promise.all([
            tx.run(SELECT.from(ZCLAIM_HEADER).where({
                EMP_ID: sEmployeeId,
                CLAIM_TYPE_ID: sClaimType,
                STATUS_ID: { 'in': aBlockingStatuses },
                TRIP_START_DATE: { '>=': sEligibleDateQueryFormat }
            })),
            tx.run(SELECT.from(ZREQUEST_HEADER).where({
                EMP_ID: sEmployeeId,
                CLAIM_TYPE_ID: sClaimType,
                STATUS: { 'in': aBlockingStatuses },
                TRIP_START_DATE: { '>=': sEligibleDateQueryFormat }
            }))
        ]);

        const aExistingClaims = aExistingClaimsRaw || [];
        const aExistingRequests = aExistingRequestsRaw || [];

        let sFinalStatus = Constant.ElaunTukarStatus.ALLOWED_CREATION;

        // ---------------------------------------------------------
        // 3. Logic Branch: CLAIM SIDE vs REQUEST SIDE
        // ---------------------------------------------------------

        if (bIsClaimSide) {
            // ==========================================
            // IF TRIGGERED FROM CLAIM UI
            // ==========================================

            // Check Claims First
            for (const claim of aExistingClaims) {
                const sStatus = claim.STATUS_ID;
                if (sStatus === Constant.Status.DRAFT) return Constant.ElaunTukarStatus.ON_GOING;

                if (sStatus === Constant.Status.APPROVED || sStatus === Constant.Status.PENDING_APPROVAL) {
                    if (claim.TRAVEL_ALONE_FAMILY === Constant.TravelAloneOrWithFamily.WITH_FAMILY &&
                        claim.TRAVEL_FAMILY_NOW_LATER === Constant.TravelWithFamilyNowOrLater.LATER) {
                        sFinalStatus = Constant.ElaunTukarStatus.ALLOWED_FAMILY_NOW_ONLY;
                    } else {
                        return Constant.ElaunTukarStatus.NOT_ALLOWED;
                    }
                }
            }

        } else {
            // ==========================================
            // IF TRIGGERED FROM REQUEST UI
            // ==========================================

            // Check Requests First
            for (const request of aExistingRequests) {
                const sStatus = request.STATUS;
                if (sStatus === Constant.Status.DRAFT) sFinalStatus = Constant.ElaunTukarStatus.ON_GOING;

                if (sStatus === Constant.Status.APPROVED || sStatus === Constant.Status.PENDING_APPROVAL) {
                    if (request.TRAVEL_ALONE_FAMILY === Constant.TravelAloneOrWithFamily.WITH_FAMILY &&
                        request.TRAVEL_FAMILY_NOW_LATER === Constant.TravelWithFamilyNowOrLater.LATER) {
                        sFinalStatus = Constant.ElaunTukarStatus.ALLOWED_FAMILY_NOW_ONLY;
                    } else {
                        console.log("here_req", request)
                        return Constant.ElaunTukarStatus.NOT_ALLOWED;
                    }
                }
            }

            // Check Claims Second
            for (const claim of aExistingClaims) {
                const sStatus = claim.STATUS_ID;
                if (sStatus === Constant.Status.DRAFT) sFinalStatus = Constant.ElaunTukarStatus.ON_GOING;

                if (sStatus === Constant.Status.APPROVED || sStatus === Constant.Status.PENDING_APPROVAL) {
                    if (claim.TRAVEL_ALONE_FAMILY === Constant.TravelAloneOrWithFamily.WITH_FAMILY &&
                        claim.TRAVEL_FAMILY_NOW_LATER === Constant.TravelWithFamilyNowOrLater.LATER) {
                        sFinalStatus = Constant.ElaunTukarStatus.ALLOWED_FAMILY_NOW_ONLY;
                    } else {
                        return Constant.ElaunTukarStatus.NOT_ALLOWED;
                    }
                }
            }
        }
        // ---------------------------------------------------------
        // 4. Passed all checks - Return Final Status
        // ---------------------------------------------------------
        return sFinalStatus;
    });

    srv.on('getMarriageCategoryBasedOnStatus', async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        if (oEmp) {
            const sMarriageCategory = await GetDependentData.getMarriageCategory(oEmp.EEID);
            const sMarriageStatus = oEmp.MARITAL;

            if (!sMarriageCategory) {
                req.error(404, `No marriage category available for employee.`);
            }

            switch (sMarriageCategory) {
                case Constant.MarriageCategory.MARRIED_NO_CHILDREN:
                    if (sMarriageStatus == Constant.MaritalStatus.WIDOWED || sMarriageStatus == Constant.MaritalStatus.SEPARATED || sMarriageStatus == Constant.MaritalStatus.DIVORCED) {
                        return Constant.MarriageCategory.SINGLE;
                    }
                    return sMarriageCategory;
                case Constant.MarriageCategory.MARRIED_1_TO_3_CHILDREN:
                    break;
                case Constant.MarriageCategory.MARRIED_4_OR_MORE_CHILDREN:
                    break;
            }
            return sMarriageCategory;
        } else {
            req.error(404, `Employee Not Found.`);
        }
    });

    srv.on('getLodgingOverseaAmountAndCat', async (req) => {
        const tx = cds.tx(req);
        const { ZCOUNTRY } = srv.entities;
        const sTodayDate = new Date().toISOString().slice(0, 10);
        try {
            var oLodgingCategory = await tx.run(SELECT.one
                .from(Constant.Entities.ZCOUNTRY)
                .columns(Constant.EntitiesFields.LODGING_CATEGORY)
                .where({
                    COUNTRY_ID: req.data.sCountry,
                    STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                    START_DATE: { '<=': sTodayDate },
                    END_DATE: { '>=': sTodayDate },
                })
            )

            var oEligibleAmount = await tx.run(
                SELECT.one
                    .from(Constant.Entities.ZELIGIBILITY_RULE)
                    .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT)
                    .where({
                        LODGING_CATEGORY: oLodgingCategory.LODGING_CATEGORY,
                        CLAIM_TYPE_ID: req.data.sClaimType,
                        CLAIM_TYPE_ITEM_ID: req.data.sClaimTypeItem,
                        STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                        START_DATE: { '<=': sTodayDate },
                        END_DATE: { '>=': sTodayDate },
                    })
            )
            return {
                sCategory: oLodgingCategory.LODGING_CATEGORY,
                iEligibleAmount: oEligibleAmount.ELIGIBLE_AMOUNT
            };
        } catch (err) {
            req.error(404, `Amount not found.`);
        }
    });

    /**
        * Update Header tables with approver actions
        * @public
        * @returns {Integer} number of records updated in header table
        */
    srv.on('updateApproverHeader', async (req) => {
        try {
            const oPayload = req.data;
            if (!oPayload || oPayload.length === 0) {
                throw new Error('No Data Sent')
            }
            var sRecordId = oPayload.sRecordId;
            var sStatus = oPayload.sStatus;
            const tx = cds.tx(req);

            var result = await UpdateHeader.updateApproverActionToHeader(sRecordId, sStatus, tx);
            return result;
        } catch (error) {
            return req.reject(400, `Fail processing records: ${error.message}`);
        }
    });

    /**
    * Update Header tables with approver actions
    * @public
    * @returns {Integer} number of records updated in header table
    */
    srv.on('calculateRoundTripKM', async (req) => {
        const { fKM } = req.data;
        if (!fKM) {
            return { fFinalAmount: 0.00 };
        }
        const fResult = Math.round(fKM * 2 * 100) / 100;
        return {
            fFinalAmount: fResult
        };
    });

    srv.before('READ', 'ZEMP_REQUEST_REPORT_SUMMARY', async (req) => {
        const isAdminCC = req.user.is(Constant.Admin.Admin_CC);
        if (!isAdminCC)
            return;

        try {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp || !oEmp.CC) {
                return req.reject(403, 'You do not have the required Admin role.');
            }

            const sUserCC = oEmp.CC;

            // To this (Array format):
            const ccFilter = [{ ref: ['COST_CENTER'] }, '=', { val: sUserCC }];

            if (req.query.SELECT.where) {
                req.query.where([
                    ...req.query.SELECT.where,
                    'and',
                    ...ccFilter // Spread the array elements here
                ]);
            } else {
                req.query.where(ccFilter);
            }

        } catch (error) {
            return req.reject(500, 'Internal server error while checking permisisons');
        }
    });

    srv.before('READ', 'ZEMP_REQUEST_REPORT_DETAILS', async (req) => {
        const isAdminCC = req.user.is(Constant.Admin.Admin_CC);
        if (!isAdminCC)
            return;

        try {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp || !oEmp.CC) {
                return req.reject(403, 'You do not have the required Admin role.');
            }

            const sUserCC = oEmp.CC;

            // To this (Array format):
            const ccFilter = [{ ref: ['COST_CENTER'] }, '=', { val: sUserCC }];

            if (req.query.SELECT.where) {
                req.query.where([
                    ...req.query.SELECT.where,
                    'and',
                    ...ccFilter // Spread the array elements here
                ]);
            } else {
                req.query.where(ccFilter);
            }

        } catch (error) {
            return req.reject(500, 'Internal server error while checking permisisons');
        }
    });

    srv.before('READ', 'ZEMP_CLAIM_REPORT_SUMMARY', async (req) => {
        const isAdminCC = req.user.is(Constant.Admin.Admin_CC);
        if (!isAdminCC)
            return;

        try {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp || !oEmp.CC) {
                return req.reject(403, 'You do not have the required Admin role.');
            }

            const sUserCC = oEmp.CC;

            // To this (Array format):
            const ccFilter = [{ ref: ['COST_CENTER'] }, '=', { val: sUserCC }];

            if (req.query.SELECT.where) {
                req.query.where([
                    ...req.query.SELECT.where,
                    'and',
                    ...ccFilter // Spread the array elements here
                ]);
            } else {
                req.query.where(ccFilter);
            }

        } catch (error) {
            return req.reject(500, 'Internal server error while checking permisisons');
        }
    });

    srv.before('READ', 'ZEMP_CLAIM_REPORT_DETAILS', async (req) => {
        const isAdminCC = req.user.is(Constant.Admin.Admin_CC);
        if (!isAdminCC)
            return;

        try {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp || !oEmp.CC) {
                return req.reject(403, 'You do not have the required Admin role.');
            }

            const sUserCC = oEmp.CC;

            // To this (Array format):
            const ccFilter = [{ ref: ['COST_CENTER'] }, '=', { val: sUserCC }];

            if (req.query.SELECT.where) {
                req.query.where([
                    ...req.query.SELECT.where,
                    'and',
                    ...ccFilter // Spread the array elements here
                ]);
            } else {
                req.query.where(ccFilter);
            }

        } catch (error) {
            return req.reject(500, 'Internal server error while checking permisisons');
        }
    });

    srv.before('READ', 'ZCOST_CENTER_VH', async (req) => {

        if (req.user.is(Constant.Admin.Admin_CC)) {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp || !oEmp.DEP) {
                req.query.where('1 = 0');
                return;
            }

            const aDeptRecords = await tx.run(
                SELECT.distinct('CC')
                    .from('ZEMP_MASTER')
                    .where({ DEP: oEmp.DEP })
            );

            const aCostCenters = aDeptRecords
                .map(record => record.CC)
                .filter(cc => cc !== null && cc !== undefined && cc !== '');

            if (aCostCenters.length > 0) {

                req.query.where({ COST_CENTER_ID: { 'in': aCostCenters } });

            } else {
                req.query.where('1 = 0');
            }
        }
    });

    srv.on("getJenazahEligibleAmount", async (req) => {
        const tx = cds.tx(req);
        const sTodayDate = new Date().toISOString().slice(0, 10);
        try {
            var oEligibleAmount = await tx.run(
                SELECT.one
                    .from(Constant.Entities.ZELIGIBILITY_RULE)
                    .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT)
                    .where({
                        TRANSPORT_PASSING_ID: req.data.sTransportPassingID,
                        CLAIM_TYPE_ID: req.data.sClaimType,
                        CLAIM_TYPE_ITEM_ID: req.data.sClaimTypeItem,
                        STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                        START_DATE: { '<=': sTodayDate },
                        END_DATE: { '>=': sTodayDate },
                    })
            )
            return {
                iAmount: oEligibleAmount.ELIGIBLE_AMOUNT
            };
        } catch (err) {
            req.error(404, `Amount not found.`);
        }
    });



    srv.on('batchUpdatePaymentStatus', async (req) => {
        const { ZCLAIM_HEADER, ZREQUEST_HEADER } = srv.entities;
        try {
            const { aPayment } = req.data;
            if (!aPayment || aPayment.length === 0) {
                throw new Error('No Data Sent');
            }
            const tx = cds.tx(req);
            const aClaimUpdates = [];
            const aRequestUpdates = [];
            for (var i = 0; i < aPayment.length; i++) {
                var oPayment = aPayment[i];
                if (!oPayment.ID) continue;
                var sPrefix = oPayment.ID.substring(0, 3);
                if (sPrefix === Constant.WorkflowType.CLAIM) {
                    aClaimUpdates.push(
                        UPDATE(ZCLAIM_HEADER)
                            .set({
                                PAYMENT_DATE: oPayment.PAYMENT_DATE,
                                STATUS_ID: oPayment.STATUS_ID
                            })
                            .where({ CLAIM_ID: oPayment.ID })
                    );
                } else if (sPrefix === Constant.WorkflowType.REQUEST) {
                    aRequestUpdates.push(
                        UPDATE(ZREQUEST_HEADER)
                            .set({
                                PAYMENT_DATE: oPayment.PAYMENT_DATE,
                                STATUS: oPayment.STATUS_ID
                            })
                            .where({ REQUEST_ID: oPayment.ID })
                    );
                }
            }
            if (aClaimUpdates.length > 0) {
                await Promise.all(aClaimUpdates.map(function (q) { return tx.run(q); }));
            }
            if (aRequestUpdates.length > 0) {
                await Promise.all(aRequestUpdates.map(function (q) { return tx.run(q); }));
            }
            return 'Records updated successfully';
        } catch (error) {
            req.error(400, `Fail updating records: ${error.message}`);
        }
    });

    /**
        * Update Dependent tables with Used Entitlement Amout for each dependent
        * @public
        * @returns {Integer} number of records updated in header table
        */
    srv.on('updatePEDUEntitleAmount', async (req) => {
        try {
            const oPayload = req.data;
            if (!oPayload || oPayload.length === 0) {
                throw new Error('No Data Sent')
            }
            var sRecordId = oPayload.sRecordId;
            var sStatus = oPayload.sStatus;
            const tx = cds.tx(req);

            var result = await UpdateDependent.updateUsedEntitlementAmount(sRecordId, sStatus, tx);
            return result;
        } catch (error) {
            return req.reject(400, `Fail processing records: ${error.message}`);
        }
    });

    srv.on("getJenazahEligibleAmount", async (req) => {
        const tx = cds.tx(req);
        const sTodayDate = new Date().toISOString().slice(0, 10);
        try {
            var oEligibleAmount = await tx.run(
                SELECT.one
                    .from(Constant.Entities.ZELIGIBILITY_RULE)
                    .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT)
                    .where({
                        TRANSPORT_PASSING_ID: req.data.sTransportPassingID,
                        CLAIM_TYPE_ID: req.data.sClaimType,
                        CLAIM_TYPE_ITEM_ID: req.data.sClaimTypeItem,
                        STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                        START_DATE: { '<=': sTodayDate },
                        END_DATE: { '>=': sTodayDate },
                    })
            )
            return {
                iAmount: oEligibleAmount.ELIGIBLE_AMOUNT
            };
        } catch (err) {
            req.error(404, `Amount not found.`);
        }
    });



    srv.on('batchUpdatePaymentStatus', async (req) => {
        const { ZCLAIM_HEADER, ZREQUEST_HEADER } = srv.entities;
        try {
            const { aPayment } = req.data;
            if (!aPayment || aPayment.length === 0) {
                throw new Error('No Data Sent');
            }
            const tx = cds.tx(req);
            const aClaimUpdates = [];
            const aRequestUpdates = [];
            for (var i = 0; i < aPayment.length; i++) {
                var oPayment = aPayment[i];
                if (!oPayment.ID) continue;
                var sPrefix = oPayment.ID.substring(0, 3);
                if (sPrefix === Constant.WorkflowType.CLAIM) {
                    aClaimUpdates.push(
                        UPDATE(ZCLAIM_HEADER)
                            .set({
                                PAYMENT_DATE: oPayment.PAYMENT_DATE,
                                STATUS_ID: oPayment.STATUS_ID
                            })
                            .where({ CLAIM_ID: oPayment.ID })
                    );
                } else if (sPrefix === Constant.WorkflowType.REQUEST) {
                    aRequestUpdates.push(
                        UPDATE(ZREQUEST_HEADER)
                            .set({
                                PAYMENT_DATE: oPayment.PAYMENT_DATE,
                                STATUS: oPayment.STATUS_ID
                            })
                            .where({ REQUEST_ID: oPayment.ID })
                    );
                }
            }
            if (aClaimUpdates.length > 0) {
                await Promise.all(aClaimUpdates.map(function (q) { return tx.run(q); }));
            }
            if (aRequestUpdates.length > 0) {
                await Promise.all(aRequestUpdates.map(function (q) { return tx.run(q); }));
            }
            return 'Records updated successfully';
        } catch (error) {
            req.error(400, `Fail updating records: ${error.message}`);
        }
    });

    srv.on("checkGalakanEligible", async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        if (oEmp) {
            // Implementation for checking Galakan eligibility
            if (oEmp.CONFIRMATION_DATE) {
                if (new Date() >= new Date(oEmp.CONFIRMATION_DATE)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            req.error(404, `Employee Not Found.`);
        }
    });

    srv.on("getCeramahEntitlement", async (req) => {
        const tx = cds.tx(req);
        const fDuration = req.data.fDuration;
        const { ZELIGIBILITY_RULE } = srv.entities;
        const sTodayDate = new Date().toISOString().slice(0, 10);

        try {
            var aRules = await tx.run(
                SELECT
                    .from(ZELIGIBILITY_RULE)
                    .columns(
                        Constant.EntitiesFields.ELIGIBLE_AMOUNT,
                        Constant.EntitiesFields.CONDITION,
                        Constant.EntitiesFields.DURATION
                    )
                    .where({
                        CLAIM_TYPE_ID: Constant.ClaimType.CERAMAH,
                        CLAIM_TYPE_ITEM_ID: Constant.ClaimTypeItem.CERAMAH,
                        STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                        START_DATE: { '<=': sTodayDate },
                        END_DATE: { '>=': sTodayDate }
                    })
            );
            const oMatchedRule = aRules.find(oRule => {
                const sCondition = oRule.CONDITION;
                const iDuration = parseInt(oRule.DURATION);

                if (sCondition === Constant.Operator.GREATERTHANOREQUAL) {
                    return fDuration >= iDuration;
                } else if (sCondition === Constant.Operator.LESSTHAN) {
                    return fDuration < iDuration;
                } else if (sCondition === Constant.Operator.LESSTHANOREQUAL) {
                    return fDuration <= iDuration;
                } else if (sCondition === Constant.Operator.GREATERTHAN) {
                    return fDuration > iDuration;
                }
                return false;
            });

            return {
                iAmount: oMatchedRule ? oMatchedRule.ELIGIBLE_AMOUNT : 0
            };

        } catch (err) {
            req.error(404, `Amount not found.`);
        }
    });

    srv.on('getInternalOrderByProjectCode', async (req) => {

        try {

            const tx = cds.tx(req);

            return await getInternalOrderByProjectCode(
                tx,
                req.data.sProjectCode
            );

        } catch (error) {
            req.error(500, `Failed to retrieve Internal Order: ${error.message}`);
        }
    });

    srv.on("getBantuanKebajikanKematianAmount", async (req) => {
        const tx = cds.tx(req);
        const oEmp = await getLoggedInEmployee(tx, req, srv.entities);
        if (oEmp) {
            const sTodayDate = new Date().toISOString().slice(0, 10);
            try {
                var oEligibleAmount = await tx.run(
                    SELECT.one
                        .from(Constant.Entities.ZELIGIBILITY_RULE)
                        .columns(Constant.EntitiesFields.ELIGIBLE_AMOUNT)
                        .where({
                            CLAIM_TYPE_ID: Constant.ClaimType.AKTIVITI_S,
                            CLAIM_TYPE_ITEM_ID: Constant.ClaimTypeItem.KEMATIAN,
                            STATUS: Constant.ClaimTypeItemStatus.ACTIVE,
                            START_DATE: { '<=': sTodayDate },
                            END_DATE: { '>=': sTodayDate },
                            DEPENDENT_TYPE_ID: req.data.sDependentType
                        })
                )
                return oEligibleAmount.ELIGIBLE_AMOUNT;
            } catch (err) {
                req.error(404, `Amount not found.`);
            }
        } else {
            req.error(404, `Employee Not Found.`);
        }
    });

    srv.after('UPDATE', 'ZCLAIM_HEADER', async (data, req) => {

        const tx = cds.tx(req);
        const sClaimId =
            data.CLAIM_ID || req.data.CLAIM_ID;

        const oHeader = await tx.run(
            SELECT.one
                .from('ZCLAIM_HEADER')
                .where({
                    CLAIM_ID: sClaimId
                })
        );

        if (!oHeader?.PROJECT_CODE) {
            console.log("PROJECT_CODE is empty. Skip INTERNAL_ORDER update.");
            return;
        }

        const sInternalOrder =
            await getInternalOrderByProjectCode(
                tx,
                oHeader.PROJECT_CODE
            );

        await tx.run(
            UPDATE('ZCLAIM_ITEM')
                .set({
                    INTERNAL_ORDER: sInternalOrder
                })
                .where({
                    CLAIM_ID: sClaimId
                })
        );
    });

    srv.after('UPDATE', 'ZREQUEST_HEADER', async (data, req) => {

        const tx = cds.tx(req);
        const sRequestId =
            data.REQUEST_ID || req.data.REQUEST_ID;

        const oHeader = await tx.run(
            SELECT.one
                .from('ZREQUEST_HEADER')
                .where({
                    REQUEST_ID: sRequestId
                })
        );

        if (!oHeader?.PROJECT_CODE) {
            return;
        }

        const sInternalOrder =
            await getInternalOrderByProjectCode(
                tx,
                oHeader.PROJECT_CODE
            );

        await tx.run(
            UPDATE('ZREQUEST_ITEM')
                .set({
                    INTERNAL_ORDER: sInternalOrder
                })
                .where({
                    REQUEST_ID: sRequestId
                })
        );
    });

    srv.before('READ', 'ZEMP_CC_BUDGET_REPORT', async (req) => {

        if (req.user.is(Constant.Admin.Admin_CC)) {
            const tx = cds.tx(req);
            const oEmp = await getLoggedInEmployee(tx, req, srv.entities);

            if (!oEmp || !oEmp.DEP) {
                req.query.where('1 = 0');
                return;
            }

            const aDeptRecords = await tx.run(
                SELECT.distinct('CC')
                    .from('ZEMP_MASTER')
                    .where({ DEP: oEmp.DEP })
            );

            const aCostCenters = aDeptRecords
                .map(record => record.CC)
                .filter(cc => cc !== null && cc !== undefined && cc !== '');

            if (aCostCenters.length > 0) {

                req.query.where({ FUND_CENTER: { 'in': aCostCenters } });

            } else {
                req.query.where('1 = 0');
            }
        }
    });

    /**
     * After creating a substitution rule, this handler will find all relevant claims and pre-approvals 
     * that match the criteria of the new rule and update them with the substitute approver ID. 
     * It will also trigger email notifications for any claims or pre-approvals that are in 
     * pending approval status (STAT02) to inform the substitute approver of their new responsibilities.
     * @public
     * @param {Object} data - The data of the newly created substitution rule.
     * @param {Object} req - The request object containing context and transaction information.
     */
    srv.after('CREATE', ['ZSUBSTITUTION_RULES', 'ZSUBSTITUTION_RULES_CONFIG.drafts'], async (data, req) => {
        const { USER_ID, SUBSTITUTE_ID, VALID_FROM, VALID_TO } = data;
        if (!USER_ID || !SUBSTITUTE_ID || !VALID_FROM || !VALID_TO) return;

        // All entities used here are exposed by THIS service — single consistent model
        const {
            ZEMP_APPROVER_CLAIM_DETAILS,
            ZEMP_APPROVER_REQUEST_DETAILS,
            ZAPPROVER_DETAILS_CLAIMS,
            ZAPPROVER_DETAILS_PREAPPROVAL,
            ZLOG
        } = srv.entities;

        const tx = cds.tx(req);
        const oCurrentUser = await getLoggedInEmployee(tx, req, srv.entities);
        const aLogsToInsert = [];

        try {
            // =======================================================================
            // PROCESS 1: Claims — via ZEMP_APPROVER_CLAIM_DETAILS view
            // =======================================================================

            const aMatchingClaims = await tx.run(
                SELECT.from(ZEMP_APPROVER_CLAIM_DETAILS)
                    .where({ APPROVER_ID: USER_ID })
                    .and(`(STATUS = '${Constant.Status.PENDING_APPROVAL}' OR STATUS IS NULL OR STATUS = '')`)
                    .and('SUBMITTED_DATE >=', VALID_FROM)
                    .and('SUBMITTED_DATE <=', VALID_TO)
                    .columns('CLAIM_ID', 'LEVEL', 'STATUS', 'SUBMITTED_DATE', 'EMPLOYEE_NAME')
            );

            if (aMatchingClaims.length > 0) {
                const aClaimUpdates = aMatchingClaims.map(claim =>
                    UPDATE(ZAPPROVER_DETAILS_CLAIMS)   // write to base table, not the view
                        .set({ SUBSTITUTE_APPROVER_ID: SUBSTITUTE_ID })
                        .where({ CLAIM_ID: claim.CLAIM_ID, LEVEL: claim.LEVEL, APPROVER_ID: USER_ID })
                );
                await Promise.all(aClaimUpdates.map(query => tx.run(query)));

                aMatchingClaims.forEach(claim => {
                    aLogsToInsert.push({
                        TIMESTAMP: new Date(),
                        RECORD_ID: claim.CLAIM_ID,
                        PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                        MESSAGE_TYPE: 'S',
                        STATUS_CODE: '200',
                        MESSAGE: `User ${oCurrentUser.EEID} mapped substitution rule. Claim ${claim.CLAIM_ID} (Level ${claim.LEVEL}) assigned to substitute ${SUBSTITUTE_ID} instead of ${USER_ID}.`
                    });
                });

                const oSubstitute = await tx.run(
                    SELECT.one.from('ZEMP_MASTER')
                        .where({ EEID: SUBSTITUTE_ID })
                        .columns('EMAIL', 'NAME')
                );

                const aPendingClaims = aMatchingClaims.filter(claim => claim.STATUS === Constant.Status.PENDING_APPROVAL);
                for (const claim of aPendingClaims) {
                    try {
                        await sendEmailInternal({
                            ApproverName: oSubstitute.NAME,
                            ClaimID: claim.CLAIM_ID,
                            Action: "Pending Approval (Delegated)",
                            EmailTitle: `Action Required: Delegated Claim ${claim.CLAIM_ID}`,
                            ReceiverEmail: oSubstitute.EMAIL,
                            SubmissionDate: claim.SUBMITTED_DATE,
                            ClaimantName: claim.EMPLOYEE_NAME,
                            RecipientName: oSubstitute.NAME
                        });
                    } catch (oEmailError) {
                        console.error(`Email failed for Claim ${claim.CLAIM_ID}`, oEmailError);
                        aLogsToInsert.push({
                            TIMESTAMP: new Date(),
                            RECORD_ID: claim.CLAIM_ID,
                            PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                            MESSAGE_TYPE: 'W',
                            STATUS_CODE: '207',
                            MESSAGE: `Claim ${claim.CLAIM_ID} updated, but delegation notification email to ${SUBSTITUTE_ID} failed.`
                        });
                    }
                }
            }

            // =======================================================================
            // PROCESS 2: Pre-Approvals — via ZEMP_APPROVER_REQUEST_DETAILS view
            // =======================================================================

            const aMatchingPreApprovals = await tx.run(
                SELECT.from(ZEMP_APPROVER_REQUEST_DETAILS)
                    .where({ APPROVER_ID: USER_ID })
                    .and(`(STATUS = '${Constant.Status.PENDING_APPROVAL}' OR STATUS IS NULL OR STATUS = '')`)
                    .and('REQUEST_DATE >=', VALID_FROM)   // NOTE: REQUEST_DATE, not SUBMITTED_DATE
                    .and('REQUEST_DATE <=', VALID_TO)
                    .columns('PREAPPROVAL_ID', 'LEVEL', 'STATUS', 'REQUEST_DATE', 'EMPLOYEE_NAME')
            );

            if (aMatchingPreApprovals.length > 0) {
                const aPreAppUpdates = aMatchingPreApprovals.map(preApp =>
                    UPDATE(ZAPPROVER_DETAILS_PREAPPROVAL)   // write to base table, not the view
                        .set({ SUBSTITUTE_APPROVER_ID: SUBSTITUTE_ID })
                        .where({ PREAPPROVAL_ID: preApp.PREAPPROVAL_ID, LEVEL: preApp.LEVEL, APPROVER_ID: USER_ID })
                );
                await Promise.all(aPreAppUpdates.map(query => tx.run(query)));

                aMatchingPreApprovals.forEach(preApp => {
                    aLogsToInsert.push({
                        TIMESTAMP: new Date(),
                        RECORD_ID: preApp.PREAPPROVAL_ID,
                        PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                        MESSAGE_TYPE: 'S',
                        STATUS_CODE: '200',
                        MESSAGE: `User ${oCurrentUser.EEID} mapped substitution rule. Pre-Approval ${preApp.PREAPPROVAL_ID} (Level ${preApp.LEVEL}) assigned to substitute ${SUBSTITUTE_ID} instead of ${USER_ID}.`
                    });
                });

                const oSubstitute = await tx.run(
                    SELECT.one.from('ZEMP_MASTER')
                        .where({ EEID: SUBSTITUTE_ID })
                        .columns('EMAIL', 'NAME')
                );

                const aPendingPreApprovals = aMatchingPreApprovals.filter(preApp => preApp.STATUS === Constant.Status.PENDING_APPROVAL);
                for (const preApp of aPendingPreApprovals) {
                    try {
                        await sendEmailInternal({
                            ApproverName: oSubstitute.NAME,
                            ClaimID: preApp.PREAPPROVAL_ID,
                            Action: "Pending Pre-Approval (Delegated)",
                            EmailTitle: `Action Required: Delegated Pre-Approval ${preApp.PREAPPROVAL_ID}`,
                            ReceiverEmail: oSubstitute.EMAIL,
                            SubmissionDate: preApp.REQUEST_DATE,
                            ClaimantName: preApp.EMPLOYEE_NAME,
                            RecipientName: oSubstitute.NAME
                        });
                    } catch (oEmailError) {
                        console.error(`Email failed for Pre-Approval ${preApp.PREAPPROVAL_ID}`, oEmailError);
                        aLogsToInsert.push({
                            TIMESTAMP: new Date(),
                            RECORD_ID: preApp.PREAPPROVAL_ID,
                            PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                            MESSAGE_TYPE: 'W',
                            STATUS_CODE: '207',
                            MESSAGE: `Pre-Approval ${preApp.PREAPPROVAL_ID} updated, but delegation notification email to ${SUBSTITUTE_ID} failed.`
                        });
                    }
                }
            }

            if (aLogsToInsert.length > 0 && ZLOG) {
                await tx.run(INSERT.into(ZLOG).entries(aLogsToInsert));
            }

        } catch (oError) {
            console.error("Substitution assignment log error:", oError);
            req.warn(500, `Substitution rule saved, but failed to update existing records: ${oError.message}`);

            try {
                if (ZLOG) {
                    await cds.tx(async (oLogTx) => {
                        await oLogTx.run(INSERT.into(ZLOG).entries([{
                            TIMESTAMP: new Date(),
                            RECORD_ID: USER_ID,
                            PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                            MESSAGE_TYPE: 'E',
                            STATUS_CODE: '500',
                            MESSAGE: `Substitution batch processing runtime error for ruleset: ${oError.message}`
                        }]));
                    });
                }
            } catch (oFallbackError) {
                console.error("Critical fallback logger failure:", oFallbackError);
            }
        }
    });

    /**
     * Reassign Approver for Claims and Pre-Approvals
     * @public
     * @param {Object} req - The request object containing the payload for reassignment.
     * @returns {Boolean} - Returns true if reassignment is successful, otherwise throws an error.
     */
    srv.on('reassignApprover', async (req) => {
        const {
            ZAPPROVER_DETAILS_CLAIMS,
            ZAPPROVER_DETAILS_PREAPPROVAL,
            ZEMP_APPROVER_CLAIM_DETAILS,
            ZEMP_APPROVER_REQUEST_DETAILS,
            ZEMP_MASTER,
            ZLOG
        } = srv.entities;

        const aPayloads = req.data.payload;
        const tx = cds.tx(req);
        const oCurrentUser = await getLoggedInEmployee(tx, req, srv.entities);

        if (!Array.isArray(aPayloads) || aPayloads.length === 0) {
            return req.error(400, "Payload array is empty or missing.");
        }

        try {
            for (const oItem of aPayloads) {
                const sApproverID = oItem.APPROVER_ID;
                const sNewApproverID = oItem.NEW_APPROVER_ID;
                if (sApproverID && sNewApproverID) {

                    const [oApprover, oApproverNew] = await Promise.all([
                        SELECT.one.from('ZEMP_MASTER').where({ EEID: sApproverID }),
                        SELECT.one.from('ZEMP_MASTER').where({ EEID: sNewApproverID })
                    ]);
                    if (!oApprover || !oApproverNew) {
                        return req.error(400, "Master profile data missing for the selected employees.");
                    }
                    
                    // A. Check matching Department (DEP)
                    // if (oApprover.DEP !== oApproverNew.DEP) {
                    //     return req.error(400, `The selected approver must belong to the same department (${oApprover.DEP}).`);
                    // }
                    // B. Check Grade Sequence Hierarchy Level
                    // let iApproverSeq = 0;
                    // let iSubstituteSeq = 0;
                    // if (oApprover.GRADE) {
                    //     const oConf = await SELECT.one.from('ZCONFIG_VARIABLE').where({ LOW_VALUE: oApprover.GRADE, VARIABLE_NAME: 'PERSONAL_GRADE' });
                    //     if (oConf && oConf.SEQUENCE_NO) iApproverSeq = parseInt(oConf.SEQUENCE_NO, 10);
                    // }
                    // if (oApproverNew.GRADE) {
                    //     const oConf = await SELECT.one.from('ZCONFIG_VARIABLE').where({ LOW_VALUE: oApproverNew.GRADE, VARIABLE_NAME: 'PERSONAL_GRADE' });
                    //     if (oConf && oConf.SEQUENCE_NO) iSubstituteSeq = parseInt(oConf.SEQUENCE_NO, 10);
                    // }
                    // if (iSubstituteSeq < iApproverSeq) {
                    //     return req.error(400, `The selected substitute's grade level (${oApproverNew.GRADE || 'None'}) must be equal to or higher than the current approver's grade (${oApprover.GRADE || 'None'}).`);
                    // }
                }
            }

            const aUpdatePromises = aPayloads.map(async (oItem) => {
                const { APPROVER_ID, ID, LEVEL, NEW_APPROVER_ID, REQUEST_DATE } = oItem;
                let sSubstituteID = null;
                let sOldSubstituteID = null;

                let oLogEntry = {
                    TIMESTAMP: new Date(),
                    RECORD_ID: `${ID}_${LEVEL}`,
                    PROGRAM: 'REASSIGN_APPROVER'
                };

                if (!NEW_APPROVER_ID || NEW_APPROVER_ID.trim() === '') {
                    return;
                }

                if (REQUEST_DATE) {
                    try {
                        const oActiveSubstitution = await tx.run(
                            SELECT.one.from('ZSUBSTITUTION_RULES')
                                .where({ USER_ID: NEW_APPROVER_ID })
                                .and('VALID_FROM <=', REQUEST_DATE)
                                .and('VALID_TO >=', REQUEST_DATE)
                                .columns('SUBSTITUTE_ID')
                        );
                        if (oActiveSubstitution) {
                            sSubstituteID = oActiveSubstitution.SUBSTITUTE_ID;
                        }
                    } catch (oSubError) {
                        console.error(`Substitution lookup failed for record ${ID}:`, oSubError);
                    }
                }

                const sPrefix = ID ? ID.substring(0, 3).toUpperCase() : null;
                let oTargetEntity = null;
                let sIdColumnName = '';

                if (sPrefix === 'CLM') {
                    oTargetEntity = ZAPPROVER_DETAILS_CLAIMS;
                    sIdColumnName = Constant.ApproverDetailsTable.CLAIM_ID;
                } else if (sPrefix === 'REQ') {
                    oTargetEntity = ZAPPROVER_DETAILS_PREAPPROVAL;
                    sIdColumnName = Constant.ApproverDetailsTable.PREAPPROVAL_ID;
                } else {
                    oLogEntry.MESSAGE_TYPE = 'E';
                    oLogEntry.STATUS_CODE = '400';
                    oLogEntry.MESSAGE = `User ${oCurrentUser.EEID} failed reassignment for ID ${ID} (Level ${LEVEL}): Unknown ID prefix.`;
                    return { iRowsAffected: 0, oLog: oLogEntry };
                }

                //keep the old substitute to send email say its revoked
                const oOldSubstitution = await tx.run(
                    SELECT.one.from(oTargetEntity)
                        .where({ [sIdColumnName]: ID })
                        .and({ LEVEL: LEVEL })
                        .columns('SUBSTITUTE_APPROVER_ID')
                );

                if (oOldSubstitution) {
                    sOldSubstituteID = oOldSubstitution.SUBSTITUTE_APPROVER_ID;
                } else {
                    sOldSubstituteID = null;
                }

                const iRowsAffected = await UPDATE(oTargetEntity)
                    .set({
                        APPROVER_ID: NEW_APPROVER_ID,
                        SUBSTITUTE_APPROVER_ID: sSubstituteID // Will be populated if rule exists, or null if it doesn't
                    })
                    .where({
                        [sIdColumnName]: ID,
                        LEVEL: LEVEL,
                        APPROVER_ID: APPROVER_ID
                    });

                if (iRowsAffected > 0) {
                    oLogEntry.MESSAGE_TYPE = 'S';
                    oLogEntry.STATUS_CODE = '200';
                    if (sSubstituteID) {
                        oLogEntry.MESSAGE = `User ${oCurrentUser.EEID} successfully reassigned record ${ID} (Level ${LEVEL}) from approver ${APPROVER_ID} to new approver ${NEW_APPROVER_ID} (Delegated to Substitute ${sSubstituteID}).`;
                    } else {
                        oLogEntry.MESSAGE = `User ${oCurrentUser.EEID} successfully reassigned record ${ID} (Level ${LEVEL}) from approver ${APPROVER_ID} to new approver ${NEW_APPROVER_ID}.`;
                    }
                } else {
                    oLogEntry.MESSAGE_TYPE = 'W';
                    oLogEntry.STATUS_CODE = '404';
                    oLogEntry.MESSAGE = `User ${oCurrentUser.EEID} attempted reassignment for record ${ID} (Level ${LEVEL}), but no match found for current approver ${APPROVER_ID}.`;
                }

                return { iRowsAffected, oLog: oLogEntry, sSubstituteID, sOldSubstituteID };
            });

            const aResults = await Promise.all(aUpdatePromises);

            let iSuccessCount = 0;
            const aLogsToInsert = [];
            const aErrorMessages = [];
            const aSuccessfulPayloads = [];

            aResults.forEach((oResult, index) => {
                if (oResult) {
                    iSuccessCount += oResult.iRowsAffected;
                    aLogsToInsert.push(oResult.oLog);

                    if (oResult.iRowsAffected > 0) {
                        aSuccessfulPayloads.push({
                            ...aPayloads[index],
                            SUBSTITUTE_APPROVER_ID: oResult.sSubstituteID,
                            OLD_SUBSTITUTE_ID: oResult.sOldSubstituteID
                        });
                    } else if (oResult.oLog.STATUS_CODE !== Constant.StatusCode.SUCCESS) {
                        aErrorMessages.push({
                            recordId: oResult.oLog.RECORD_ID,
                            statusCode: oResult.oLog.STATUS_CODE,
                            message: oResult.oLog.MESSAGE
                        });
                    }
                }
            });

            console.log("aLogsToInsert", aLogsToInsert);

            if (aLogsToInsert.length > 0) {
                await cds.tx(async (oLogTx) => {
                    await oLogTx.run(INSERT.into(Constant.Entities.ZLOG).entries(aLogsToInsert));
                });
            }

            const aFilteredPayloads = aSuccessfulPayloads.filter(
                oItem => oItem.STATUS === Constant.Status.PENDING_APPROVAL
            );

            if (aFilteredPayloads.length > 0) {
                const aBackgroundLogs = [];
                for (const oItem of aFilteredPayloads) {
                    const { APPROVER_ID, ID, LEVEL, NEW_APPROVER_ID, SUBSTITUTE_APPROVER_ID, OLD_SUBSTITUTE_ID } = oItem;
                    const sPrefix = ID.substring(0, 3).toUpperCase();
                    try {
                        let oApproverRecord = null;
                        let oOldApproverRecord = null;
                        let oClaimant = null;
                        let oNewSubstitute = null;
                        let oOldSubstitute = null;
                        let sAction = "REASSIGN";

                        if (sPrefix === Constant.WorkflowType.CLAIM) {

                            const aEEIDs = [
                                NEW_APPROVER_ID,
                                APPROVER_ID,
                                SUBSTITUTE_APPROVER_ID,
                                OLD_SUBSTITUTE_ID
                            ].filter(Boolean);

                            const aEmployees = await tx.run(
                                SELECT.from(ZEMP_MASTER)
                                    .where({ EEID: { in: aEEIDs } })
                                    .columns('EEID', 'NAME', 'EMAIL')
                            );

                            const oEmployeeMap = Object.fromEntries(
                                aEmployees.map(emp => [emp.EEID, emp])
                            );

                            oApproverRecord = oEmployeeMap[NEW_APPROVER_ID];
                            oOldApproverRecord = oEmployeeMap[APPROVER_ID];
                            oNewSubstitute = oEmployeeMap[SUBSTITUTE_APPROVER_ID];
                            oOldSubstitute = oEmployeeMap[OLD_SUBSTITUTE_ID];

                            oClaimant = await tx.run(
                                SELECT.one.from(ZEMP_APPROVER_CLAIM_DETAILS)
                                    .where({ CLAIM_ID: ID })
                                    .and('LEVEL =', LEVEL)
                                    .columns('SUBMITTED_DATE', 'EMPLOYEE_NAME')
                            );

                            if (oApproverRecord) {
                                //new approver
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oApproverRecord.NAME,
                                        ClaimID: ID,
                                        Action: "Reassign New",
                                        EmailTitle: `Action Required: Reassigned Claim ${ID}`,
                                        ReceiverEmail: oApproverRecord.EMAIL,
                                        SubmissionDate: oClaimant.SUBMITTED_DATE,
                                        ClaimantName: oClaimant.EMPLOYEE_NAME,
                                        RecipientName: oApproverRecord.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Claim ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                                //old approver
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oOldApproverRecord.NAME,
                                        ClaimID: ID,
                                        Action: sAction,
                                        EmailTitle: `Action Required: Reassigned Claim ${ID}`,
                                        ReceiverEmail: oOldApproverRecord.EMAIL,
                                        SubmissionDate: new Date().toISOString().split('T')[0],//this one todays date
                                        ClaimantName: oCurrentUser.NAME,//for old approver need to put the assigner name
                                        RecipientName: oOldApproverRecord.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Claim ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                            }
                            //send email to new Substitute if found 
                            if (oNewSubstitute) {
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oNewSubstitute.NAME,
                                        ClaimID: ID,
                                        Action: "Reassign New",
                                        EmailTitle: `Action Required: Reassigned Claim ${ID}`,
                                        ReceiverEmail: oNewSubstitute.EMAIL,
                                        SubmissionDate: oClaimant.SUBMITTED_DATE,
                                        ClaimantName: oClaimant.EMPLOYEE_NAME,
                                        RecipientName: oNewSubstitute.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Claim ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                            }
                            //send to substitute that the request has been reassigned
                            if (oOldSubstitute) {
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oOldSubstitute.NAME,
                                        ClaimID: ID,
                                        Action: sAction,
                                        EmailTitle: `Action Required: Reassigned Claim ${ID}`,
                                        ReceiverEmail: oOldSubstitute.EMAIL,
                                        SubmissionDate: new Date().toISOString().split('T')[0],//this one todays date
                                        ClaimantName: oCurrentUser.NAME,//for old approver need to put the assigner name
                                        RecipientName: oOldSubstitute.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Claim ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                            }
                        } else if (sPrefix === Constant.WorkflowType.REQUEST) {

                            const aEEIDs = [
                                NEW_APPROVER_ID,
                                APPROVER_ID,
                                SUBSTITUTE_APPROVER_ID,
                                OLD_SUBSTITUTE_ID
                            ].filter(Boolean);

                            const aEmployees = await tx.run(
                                SELECT.from(ZEMP_MASTER)
                                    .where({ EEID: { in: aEEIDs } })
                                    .columns('EEID', 'NAME', 'EMAIL')
                            );

                            const oEmployeeMap = Object.fromEntries(
                                aEmployees.map(emp => [emp.EEID, emp])
                            );

                            oApproverRecord = oEmployeeMap[NEW_APPROVER_ID];
                            oOldApproverRecord = oEmployeeMap[APPROVER_ID];
                            oNewSubstitute = oEmployeeMap[SUBSTITUTE_APPROVER_ID];
                            oOldSubstitute = oEmployeeMap[OLD_SUBSTITUTE_ID];

                            oClaimant = await tx.run(
                                SELECT.one.from(ZEMP_APPROVER_REQUEST_DETAILS)
                                    .where({ PREAPPROVAL_ID: ID })
                                    .and('LEVEL =', LEVEL)
                                    .columns('REQUEST_DATE', 'EMPLOYEE_NAME')
                            );

                            if (oApproverRecord) {
                                //new approver
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oApproverRecord.NAME,
                                        ClaimID: ID,
                                        Action: "Reassign New",
                                        EmailTitle: `Action Required: Reassigned Pre-Approval ${ID}`,
                                        ReceiverEmail: oApproverRecord.EMAIL,
                                        SubmissionDate: oClaimant.REQUEST_DATE,
                                        ClaimantName: oClaimant.EMPLOYEE_NAME,
                                        RecipientName: oApproverRecord.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Pre-Approval ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                                //old approver
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oOldApproverRecord.NAME,
                                        ClaimID: ID,
                                        Action: sAction,
                                        EmailTitle: `Action Required: Reassigned Pre-Approval ${ID}`,
                                        ReceiverEmail: oOldApproverRecord.EMAIL,
                                        SubmissionDate: new Date().toISOString().split('T')[0],//this one todays date
                                        ClaimantName: oCurrentUser.NAME,//for old approver need to put the assigner name
                                        RecipientName: oOldApproverRecord.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Pre-Approval ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                            }
                            //send email to Substitute if found 
                            if (oNewSubstitute) {
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oNewSubstitute.NAME,
                                        ClaimID: ID,
                                        Action: "Reassign New",
                                        EmailTitle: `Action Required: Reassigned Pre-Approval ${ID}`,
                                        ReceiverEmail: oNewSubstitute.EMAIL,
                                        SubmissionDate: oClaimant.REQUEST_DATE,
                                        ClaimantName: oClaimant.EMPLOYEE_NAME,
                                        RecipientName: oNewSubstitute.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Pre-Approval ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                            }
                            //send to substitute that the request has been reassigned
                            if (oOldSubstitute) {
                                try {
                                    await sendEmailInternal({
                                        ApproverName: oOldSubstitute.NAME,
                                        ClaimID: ID,
                                        Action: sAction,
                                        EmailTitle: `Action Required: Reassigned Pre-Approval ${ID}`,
                                        ReceiverEmail: oOldSubstitute.EMAIL,
                                        SubmissionDate: new Date().toISOString().split('T')[0],//this one todays date
                                        ClaimantName: oCurrentUser.NAME,//for old approver need to put the assigner name
                                        RecipientName: oOldSubstitute.NAME
                                    });
                                } catch (oEmailError) {
                                    console.error(`Email failed for Pre-Approval ${ID}`, oEmailError);
                                    aBackgroundLogs.push({
                                        TIMESTAMP: new Date(),
                                        RECORD_ID: ID,
                                        PROGRAM: 'REASSIGN_TRIGGER',
                                        MESSAGE_TYPE: 'W',
                                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                                        MESSAGE: oEmailError?.message || "No Message"
                                    });
                                }
                            }
                        }
                    } catch (oLoopError) {
                        console.error(`Critical loop processing breakdown for record ${ID}: `, oLoopError);
                    }
                }
                // Write any background warnings to the Log table if email attempts failed
                if (aBackgroundLogs.length > 0) {
                    await tx.run(INSERT.into(ZLOG).entries(aBackgroundLogs));
                }
            }

            if (aErrorMessages.length > 0) {
                return req.error({
                    code: 'BATCH_REASSIGNMENT_FAILED',
                    message: `Batch complete with issues. Failed or skipped ${aErrorMessages.length} record(s).`,
                    status: 400,
                    target: 'payload',
                    details: aErrorMessages
                });
            }

            return true;

        } catch (oError) {
            console.error("Batch reassignment error:", oError);
            return req.error(500, "Database error occurred during batch reassignment.");
        }
    });

    const { ZEMP_MASTER } = cds.entities;

    srv.before('READ', 'ZSUBSTITUTION_RULES_CONFIG', async (req) => {

        //for GA, show their department only. for JKEW show all
        if (req.user.is(Constant.Admin.Admin_CC)) {
            const oEmp = await SELECT.one
                .from(ZEMP_MASTER)
                .where({ EMAIL: req.user.id });
            if (!oEmp || !oEmp.DEP) return;

            const subquery = SELECT('EEID').from(ZEMP_MASTER).where({ DEP: oEmp.DEP });
            req.query.where({
                USER_ID: { in: subquery }
            });
        }
    });

    srv.before('READ', 'ZEMP_APPROVER_VH', async (req) => {

        //for GA, show their department only. for JKEW show all
        // if (req.user.is(Constant.Admin.Admin_CC)) {
        //     const oEmp = await SELECT.one
        //         .from('ZEMP_MASTER')
        //         .where({ EMAIL: req.user.id });

        //     if (!oEmp || !oEmp.DEP) return;

        //     // Admin can sees their own department only
        //     req.query.where({
        //         DEP: oEmp.DEP
        //     });
        // }
    });

    function getFilterValue(where, fieldName) {
        if (!where || !Array.isArray(where)) return null;
        for (let i = 0; i < where.length; i++) {
            if (where[i] && where[i].ref && where[i].ref[0] === fieldName) {
                if ((where[i + 1] === '=' || where[i + 1] === 'eq') && where[i + 2]) {
                    return where[i + 2].val !== undefined ? where[i + 2].val : where[i + 2];
                }
            }
            if (Array.isArray(where[i])) {
                const val = getFilterValue(where[i], fieldName);
                if (val) return val;
            }
        }
        return null;
    }
    // Function to recursively strip out the virtual 'SELECTED_APPROVER' parameter
    // so the database doesn't look for a non-existent database column.
    function removeFilterField(where, fieldName) {
        if (!where || !Array.isArray(where)) return;
        for (let i = where.length - 1; i >= 0; i--) {
            if (where[i] && where[i].ref && where[i].ref[0] === fieldName) {
                // Remove the field ref, the operator (=), and the value
                where.splice(i, 3);
                // Clean up trailing 'and' / 'or' operators left over around it
                if (where[i] === 'and' || where[i] === 'or') where.splice(i, 1);
                else if (i > 0 && (where[i - 1] === 'and' || where[i - 1] === 'or')) where.splice(i - 1, 1);
            } else if (Array.isArray(where[i])) {
                removeFilterField(where[i], fieldName);
            }
        }
    }

    srv.before('READ', 'ZEMP_SUBSTITUTE_VH', async (req) => {
        const oWhereClause = req.query && req.query.SELECT && req.query.SELECT.where;
        let sSelectedApproverID = getFilterValue(oWhereClause, 'SELECTED_APPROVER') || getFilterValue(oWhereClause, 'USER_ID');
        if (!sSelectedApproverID && req._ && req._.req && req._.req.query && req._.req.query.$filter) {
            const sRawFilter = req._.req.query.$filter;
            const oMatch = sRawFilter.match(/(?:SELECTED_APPROVER|USER_ID)\s+(?:eq|=)\s+['"]([^'"]+)['"]/);
            if (oMatch) sSelectedApproverID = oMatch[1];
        }
        removeFilterField(req.query.SELECT.where, 'SELECTED_APPROVER');
        removeFilterField(req.query.SELECT.where, 'USER_ID');
        // if (!sSelectedApproverID || sSelectedApproverID.trim() === "" || sSelectedApproverID === 'FORCE_EMPTY_RESULT') {
        //     const oCurrentUser = await SELECT.one
        //         .from('ZEMP_MASTER')
        //         .where({ EMAIL: req.user.id });
        //     // If we can find their department, apply it as a filter constraint
        //     if (oCurrentUser && oCurrentUser.DEP) {
        //         const oDeptFilter = [{ ref: ['DEP'] }, '=', { val: oCurrentUser.DEP }];
        //         if (req.query.SELECT.where && req.query.SELECT.where.length > 0) {
        //             req.query.SELECT.where = [
        //                 '(', ...req.query.SELECT.where, ')',
        //                 'and',
        //                 ...oDeptFilter
        //             ];
        //         } else {
        //             req.query.SELECT.where = oDeptFilter;
        //         }
        //     }
        //     return;
        // }
        const oApproverData = await SELECT.one.from('ZEMP_MASTER').where({ EEID: sSelectedApproverID });
        //commented out this one just in case later will need to filter by grade/department
        // if (oApproverData) {
        //     let iCurrentSeq = 0;
        //     if (oApproverData.GRADE) {
        //         const oConfig = await SELECT.one.from('ZCONFIG_VARIABLE').where({
        //             LOW_VALUE: oApproverData.GRADE,
        //             VARIABLE_NAME: 'PERSONAL_GRADE'
        //         });
        //         if (oConfig && oConfig.SEQUENCE_NO) {
        //             iCurrentSeq = parseInt(oConfig.SEQUENCE_NO, 10);
        //         }
        //     }

        //     // Fetch all grade strings that match or exceed the current sequence rank
        //     const aValidConfigGrades = await SELECT.from('ZCONFIG_VARIABLE').where({
        //         VARIABLE_NAME: 'PERSONAL_GRADE',
        //         SEQUENCE_NO: { '>=': iCurrentSeq }
        //     });

        //     const aAllowedGradeValues = aValidConfigGrades.map(cfg => cfg.LOW_VALUE);

        //     let oGradeFilter = [];
        //     if (aAllowedGradeValues.length > 0) {
        //         aAllowedGradeValues.forEach((sGrade, index) => {
        //             oGradeFilter.push({ ref: ['GRADE'] }, '=', { val: sGrade });
        //             if (index < aAllowedGradeValues.length - 1) {
        //                 oGradeFilter.push('or');
        //             }
        //         });
        //         if (aAllowedGradeValues.length > 1) {
        //             oGradeFilter = ['(', ...oGradeFilter, ')'];
        //         }
        //     } else {
        //         oGradeFilter = [{ ref: ['GRADE'] }, '=', { val: '' }];
        //     }

        //     const oTargetFilters = [
        //         { ref: ['DEP'] }, '=', { val: oApproverData.DEP },
        //         'and',
        //         ...oGradeFilter,
        //         'and',
        //         { ref: ['EEID'] }, '!=', { val: sSelectedApproverID }
        //     ];

        //     if (req.query.SELECT.where && req.query.SELECT.where.length > 0) {
        //         req.query.SELECT.where = [
        //             '(', ...req.query.SELECT.where, ')',
        //             'and',
        //             '(', ...oTargetFilters, ')'
        //         ];
        //     } else {
        //         req.query.SELECT.where = oTargetFilters;
        //     }
        // }
    });

    const { ZNUM_RANGE, ZSUBSTITUTION_RULES_CONFIG } = srv.entities;

    //need to create for draft table, else ID will not be capture and will throw error
    srv.before('NEW', 'ZSUBSTITUTION_RULES_CONFIG.drafts', async (req) => {
        if (!req.data.SUBSTITUTE_RULE_ID) {
            const tx = cds.tx(req)
            try {
                const oNumRange = await tx.run(
                    SELECT.one.from(ZNUM_RANGE).where({ RANGE_ID: Constant.NumberRange.SUBSTITUTION_RULE })
                );
                if (!oNumRange) {
                    return req.error(500, `Configuration error: Range ID '${Constant.NumberRange.SUBSTITUTION_RULE}' not found in ZNUM_RANGE table.`);
                }

                const sPrefix = oNumRange.PREFIX || "SUB";
                const iCurrent = Number(oNumRange.CURRENT || 0);

                const sGeneratedID = `${sPrefix}${String(iCurrent).padStart(7, "0")}`;

                req.data.SUBSTITUTE_RULE_ID = sGeneratedID;

                const sNextNumberStr = String(iCurrent + 1);

                await tx.run(
                    UPDATE(ZNUM_RANGE)
                        .set({ CURRENT: sNextNumberStr })
                        .where({ RANGE_ID: Constant.NumberRange.SUBSTITUTION_RULE })
                );
            } catch (err) {
                console.error("Number Range Assignment Error:", err);
                return req.error(500, "Failed to automatically generate a unique Substitution Rule ID sequence.");
            }
        }
    });

    srv.before('CREATE', 'ZSUBSTITUTION_RULES_CONFIG.drafts', async (req) => {
        const { USER_ID, SUBSTITUTE_ID, VALID_FROM, VALID_TO, DraftAdministrativeData_DraftUUID } = req.data;
        const tx = cds.tx(req)

        if (!USER_ID || !SUBSTITUTE_ID || !VALID_FROM || !VALID_TO) return;

        const oToday = new Date();
        // Generates a dynamic YYYY-MM-DD string based on today's real-time date
        const sTodayIso = `${oToday.getFullYear()}-${String(oToday.getMonth() + 1).padStart(2, '0')}-${String(oToday.getDate()).padStart(2, '0')}`;
        // 2. Block VALID_TO if it is before today
        if (VALID_TO < sTodayIso) {
            return req.error({
                code: 'PAST_END_DATE',
                message: 'The Valid To date cannot be in the past. Please choose today or a future date.',
                target: 'VALID_TO',
                status: 400
            });
        }

        if (new Date(VALID_TO) < new Date(VALID_FROM)) {
            return req.error({
                code: 'INVALID_DATE_RANGE',
                message: 'The Valid To Date cannot be earlier than the Valid From Date.',
                target: 'VALID_TO',
                status: 400
            });
        }

        // Fetch employee master data profiles in parallel
        const [oApprover, oSubstitute] = await Promise.all([
            SELECT.one.from('ZEMP_MASTER').where({ EEID: USER_ID }),
            SELECT.one.from('ZEMP_MASTER').where({ EEID: SUBSTITUTE_ID })
        ]);

        // if (!oApprover || !oSubstitute) return;
        // // Validate matching Department (DEP) 
        // if (oApprover.DEP !== oSubstitute.DEP) {
        //     return req.error({
        //         code: 'INVALID_SUBSTITUTE_COMBINATION',
        //         message: `The substitute must belong to the same department (${oApprover.DEP})`,
        //         target: 'SUBSTITUTE_ID', // Turns the Substitute ID field border red
        //         status: 400
        //     });
        // }

        // // 2. Validate matching Grade Hierarchy Level (Same or Greater Grade)
        // let iApproverSeq = 0;
        // let iSubstituteSeq = 0;
        // // Fetch sequence ranking config for Approver
        // if (oApprover.GRADE) {
        //     const oApproverConfig = await SELECT.one.from('ZCONFIG_VARIABLE').where({
        //         LOW_VALUE: oApprover.GRADE,
        //         VARIABLE_NAME: 'PERSONAL_GRADE'
        //     });
        //     if (oApproverConfig && oApproverConfig.SEQUENCE_NO) {
        //         iApproverSeq = parseInt(oApproverConfig.SEQUENCE_NO, 10);
        //     }
        // }
        // // Fetch sequence ranking config for Substitute
        // if (oSubstitute.GRADE) {
        //     const oSubstituteConfig = await SELECT.one.from('ZCONFIG_VARIABLE').where({
        //         LOW_VALUE: oSubstitute.GRADE,
        //         VARIABLE_NAME: 'PERSONAL_GRADE'
        //     });
        //     if (oSubstituteConfig && oSubstituteConfig.SEQUENCE_NO) {
        //         iSubstituteSeq = parseInt(oSubstituteConfig.SEQUENCE_NO, 10);
        //     }
        // }
        // // Throw error if the substitute's grade sequence number is lower than the approver's
        // if (iSubstituteSeq < iApproverSeq) {
        //     return req.error({
        //         code: 'INVALID_GRADE_LEVEL',
        //         message: `The selected substitute's grade (${oSubstitute.GRADE || 'None'}) must be equal to or higher than the employee's grade (${oApprover.GRADE || 'None'})`,
        //         target: 'SUBSTITUTE_ID',
        //         status: 400
        //     });
        // }

        const [oActiveOverlap, oDraftOverlap] = await Promise.all([
            // A. Check finalized records in the active table
            tx.run(
                SELECT.one.from('ZSUBSTITUTION_RULES').where({
                    USER_ID: USER_ID,
                    VALID_FROM: { '<=': VALID_TO },
                    VALID_TO: { '>=': VALID_FROM }
                })
            ),
            // B. Check other users' drafts, but EXCLUDE our current editing session GUID
            tx.run(
                SELECT.one.from(ZSUBSTITUTION_RULES_CONFIG.drafts).where({
                    USER_ID: USER_ID,
                    DraftAdministrativeData_DraftUUID: { '!=': DraftAdministrativeData_DraftUUID }, // Don't match against our record
                    VALID_FROM: { '<=': VALID_TO },
                    VALID_TO: { '>=': VALID_FROM }
                })
            )
        ]);

        // If an overlap is stop the transaction
        if (oActiveOverlap || oDraftOverlap) {
            const oExisting = oActiveOverlap || oDraftOverlap;
            return req.error({
                code: 'SUBSTITUTE_OVERLAP',
                message: `This approver already has an assigned substitute within this timeframe (${oExisting.VALID_FROM} to ${oExisting.VALID_TO}).`,
                target: 'VALID_FROM',
                status: 400
            });
        }
    });

    //this is for list report which will be filter by department for GA
    srv.before('READ', 'ZEMP_APPROVER_LIST_DEP', async (req) => {

        //for GA, show their department only. for JKEW show all
        if (req.user.is(Constant.Admin.Admin_CC)) {
            const oEmp = await SELECT.one
                .from('ZEMP_MASTER')
                .where({ EMAIL: req.user.id });

            if (!oEmp || !oEmp.DEP) return;

            // Admin can sees their own department only
            req.query.where({
                DEP: oEmp.DEP
            });
        }
    });

    //this is for list report which will be filter by department for GA
    srv.before('READ', 'ZEMP_PENDING_LIST', async (req) => {

        //for GA, show their department only. for JKEW show all
        if (req.user.is(Constant.Admin.Admin_CC)) {
            const oEmp = await SELECT.one
                .from('ZEMP_MASTER')
                .where({ EMAIL: req.user.id });

            if (!oEmp || !oEmp.DEP) return;

            // Admin can sees their own department only
            req.query.where({
                DEP: oEmp.DEP
            });
        }
    });

    srv.before('UPDATE', ['ZSUBSTITUTION_RULES', 'ZSUBSTITUTION_RULES_CONFIG'], async (req) => {
        const { VALID_FROM, VALID_TO } = req.data;
        if (VALID_FROM === undefined && VALID_TO === undefined) return;
        const tx = cds.tx(req);
        const sRuleId = req.keys?.SUBSTITUTE_RULE_ID || req.data?.SUBSTITUTE_RULE_ID || (req.params && req.params[0]?.SUBSTITUTE_RULE_ID);
        if (!sRuleId) return;
        const oExisting = await tx.run(
            SELECT.one.from(ZSUBSTITUTION_RULES_CONFIG).where({ SUBSTITUTE_RULE_ID: sRuleId })
        );
        if (oExisting) {
            req.context._oldRecord = oExisting; // Store it safely in context
        }
        const sValidFrom = oExisting.VALID_FROM;
        const sValidTo = VALID_TO;
        let sErrorMessage = '';
        if (sValidFrom && sValidTo && new Date(sValidTo) < new Date(sValidFrom)) {
            sErrorMessage = 'The Valid To Date cannot be earlier than the Valid From Date.';
        }
        if (sErrorMessage) {
            req.error({
                code: 'MASS_EDIT_VALIDATION',
                message: sErrorMessage
            });
        }
    });

    srv.after('UPDATE', ['ZSUBSTITUTION_RULES', 'ZSUBSTITUTION_RULES_CONFIG'], async (data, req) => {

        const { SUBSTITUTE_RULE_ID, VALID_TO } = data;
        if (!SUBSTITUTE_RULE_ID || !VALID_TO) return;

        //Get the original value from the database (passed forward from your before hook)
        const sOldValidToStr = req.context._oldRecord?.VALID_TO;
        const sUserID = req.context._oldRecord?.USER_ID;
        const sSubstituteID = req.context._oldRecord?.SUBSTITUTE_ID;

        if (!sOldValidToStr || sOldValidToStr === VALID_TO) return;

        const tx = cds.tx(req);
        const oCurrentUser = await getLoggedInEmployee(tx, req, srv.entities);

        try {
            const oLogEntry = {
                TIMESTAMP: new Date(),
                RECORD_ID: String(SUBSTITUTE_RULE_ID),
                PROGRAM: 'SUBSTITUTION_RULE_UPDATE',
                MESSAGE_TYPE: 'S',
                STATUS_CODE: '200',
                MESSAGE: `User ${oCurrentUser.EEID} updated VALID_TO for Rule ${SUBSTITUTE_RULE_ID} from ${sOldValidToStr} to ${VALID_TO}.`
            };

            await tx.run(
                INSERT.into('ZLOG').entries(oLogEntry)
            );

            if (VALID_TO > sOldValidToStr) {
                console.log(">>> Extension detected. Processing new assignments...");
                // Pass the original validation start as oldDate to only look at the expanded window gap
                await handleNewAssignments(tx, srv.entities, {
                    sUserID, sSubstituteID,
                    VALID_FROM: sOldValidToStr, // Start from the old limit to find new matching records
                    VALID_TO, oCurrentUser
                });
            } else if (VALID_TO < sOldValidToStr) {
                console.log(">>> Shortening detected. Processing de-delegations...");
                await handleDeDelegations(tx, srv.entities, {
                    sUserID, sSubstituteID,
                    VALID_FROM: VALID_TO, // Look into items trapped between the new earlier limit...
                    VALID_TO: sOldValidToStr, // ...and the old higher limit
                    oCurrentUser
                });
            }

        } catch (oError) {
            console.error("Substitution update processing runtime error:", oError);
            req.warn(500, `Substitution rule updated, but post-processing failed: ${oError.message}`);
        }
    });

    async function handleDeDelegations(tx, entities, params) {
        const { sUserID, sSubstituteID, VALID_FROM, VALID_TO, oCurrentUser } = params;
        const { ZEMP_APPROVER_CLAIM_DETAILS,
            ZAPPROVER_DETAILS_CLAIMS,
            ZEMP_APPROVER_REQUEST_DETAILS,
            ZAPPROVER_DETAILS_PREAPPROVAL,
            ZLOG } = entities;
        const aLogsToInsert = [];

        // =======================================================================
        // PROCESS 1: Claims — via ZEMP_APPROVER_CLAIM_DETAILS view
        // =======================================================================        
        // 1. Find Claims previously routed to substitute within the dropped window
        const aOrphanedClaims = await tx.run(
            SELECT.from(ZEMP_APPROVER_CLAIM_DETAILS)
                .where({ APPROVER_ID: sUserID, SUBSTITUTE_APPROVER_ID: sSubstituteID })
                .and(`(STATUS = '${Constant.Status.PENDING_APPROVAL}' OR STATUS IS NULL OR STATUS = '')`)
                .and('SUBMITTED_DATE >', VALID_FROM) // items falling outside the new window
                .and('SUBMITTED_DATE <=', VALID_TO)
                .columns('CLAIM_ID', 'LEVEL', 'STATUS', 'SUBMITTED_DATE', 'EMPLOYEE_NAME')
        );
        if (aOrphanedClaims.length > 0) {
            // 2. Clear out the substitute assignment back to null
            const aClaimClears = aOrphanedClaims.map(claim =>
                UPDATE(ZAPPROVER_DETAILS_CLAIMS)
                    .set({ SUBSTITUTE_APPROVER_ID: null })
                    .where({ CLAIM_ID: claim.CLAIM_ID, LEVEL: claim.LEVEL, APPROVER_ID: sUserID })
            );
            await Promise.all(aClaimClears.map(query => tx.run(query)));
            // 3. Log the removal action
            aOrphanedClaims.forEach(claim => {
                aLogsToInsert.push({
                    TIMESTAMP: new Date(),
                    RECORD_ID: claim.CLAIM_ID,
                    PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                    MESSAGE_TYPE: 'W',
                    STATUS_CODE: '200',
                    MESSAGE: `User ${oCurrentUser.EEID} shortened substitution rule. Claim ${claim.CLAIM_ID} removed from substitute ${sSubstituteID}.`
                });
            });
            // 4. Fetch substitute metadata to inform them of the task revocation
            const oSubstitute = await tx.run(
                SELECT.one.from('ZEMP_MASTER')
                    .where({ EEID: sSubstituteID })
                    .columns('EMAIL', 'NAME')
            );
            const aPendingClaims = aOrphanedClaims.filter(claim => claim.STATUS === Constant.Status.PENDING_APPROVAL);
            for (const claim of aPendingClaims) {
                try {
                    await sendEmailInternal({
                        ApproverName: oSubstitute.NAME,
                        ClaimID: claim.CLAIM_ID,
                        Action: "REVOKE",
                        EmailTitle: `Notification: Revoked Delegated Claim ${claim.CLAIM_ID}`,
                        ReceiverEmail: oSubstitute.EMAIL,
                        SubmissionDate: new Date().toISOString().split('T')[0],//this one todays date
                        ClaimantName: claim.EMPLOYEE_NAME,
                        RecipientName: oSubstitute.NAME
                    });
                } catch (oEmailError) {
                    console.error(`Removal email notification failed for Claim ${claim.CLAIM_ID}`, oEmailError);
                    aLogsToInsert.push({
                        TIMESTAMP: new Date(),
                        RECORD_ID: claim.CLAIM_ID,
                        PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                        MESSAGE_TYPE: 'W',
                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                        MESSAGE: oEmailError?.message || "No Message"
                    });
                }
            }
        }
        // =======================================================================
        // PROCESS 2: Pre-Approvals — via ZEMP_APPROVER_REQUEST_DETAILS view
        // =======================================================================
        // 1. Find Pre-Approvals previously routed to substitute within the dropped window
        const aOrphanedRequests = await tx.run(
            SELECT.from(ZEMP_APPROVER_REQUEST_DETAILS)
                .where({ APPROVER_ID: sUserID, SUBSTITUTE_APPROVER_ID: sSubstituteID })
                .and(`(STATUS = '${Constant.Status.PENDING_APPROVAL}' OR STATUS IS NULL OR STATUS = '')`)
                .and('REQUEST_DATE >', VALID_FROM) // items falling outside the new window
                .and('REQUEST_DATE <=', VALID_TO)
                .columns('PREAPPROVAL_ID', 'LEVEL', 'STATUS', 'REQUEST_DATE', 'EMPLOYEE_NAME')
        );
        if (aOrphanedRequests.length > 0) {
            // 2. Clear out the substitute assignment back to null
            const aRequestClears = aOrphanedRequests.map(preApp =>
                UPDATE(ZAPPROVER_DETAILS_PREAPPROVAL)
                    .set({ SUBSTITUTE_APPROVER_ID: null })
                    .where({ PREAPPROVAL_ID: preApp.PREAPPROVAL_ID, LEVEL: preApp.LEVEL, APPROVER_ID: sUserID })
            );
            await Promise.all(aRequestClears.map(query => tx.run(query)));
            // 3. Log the removal action
            aOrphanedRequests.forEach(preApp => {
                aLogsToInsert.push({
                    TIMESTAMP: new Date(),
                    RECORD_ID: preApp.PREAPPROVAL_ID,
                    PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                    MESSAGE_TYPE: 'W',
                    STATUS_CODE: '200',
                    MESSAGE: `User ${oCurrentUser.EEID} shortened substitution rule. Pre Approval ${preApp.PREAPPROVAL_ID} removed from substitute ${sSubstituteID}.`
                });
            });
            // 4. Fetch substitute metadata to inform them of the task revocation
            const oSubstitute = await tx.run(
                SELECT.one.from('ZEMP_MASTER')
                    .where({ EEID: sSubstituteID })
                    .columns('EMAIL', 'NAME')
            );
            const aPendingRequest = aOrphanedRequests.filter(preApp => preApp.STATUS === Constant.Status.PENDING_APPROVAL);
            for (const preApp of aPendingRequest) {
                try {
                    await sendEmailInternal({
                        ApproverName: oSubstitute.NAME,
                        ClaimID: preApp.PREAPPROVAL_ID,
                        Action: "REVOKE",
                        EmailTitle: `Notification: Revoked Delegated Pre-Approval ${preApp.PREAPPROVAL_ID}`,
                        ReceiverEmail: oSubstitute.EMAIL,
                        SubmissionDate: new Date().toISOString().split('T')[0],//this one todays date
                        ClaimantName: preApp.EMPLOYEE_NAME,
                        RecipientName: oSubstitute.NAME
                    });
                } catch (oEmailError) {
                    console.error(`Removal email notification failed for Claim ${preApp.PREAPPROVAL_ID}`, oEmailError);
                    aLogsToInsert.push({
                        TIMESTAMP: new Date(),
                        RECORD_ID: preApp.PREAPPROVAL_ID,
                        PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                        MESSAGE_TYPE: 'W',
                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                        MESSAGE: oEmailError?.message || "No Message"
                    });
                }
            }
        }

        if (aLogsToInsert.length > 0 && ZLOG) {
            await tx.run(INSERT.into(ZLOG).entries(aLogsToInsert));
        }
    };

    async function handleNewAssignments(tx, entities, params) {
        const { sUserID, sSubstituteID, VALID_FROM, VALID_TO, oCurrentUser } = params;
        const { ZEMP_APPROVER_CLAIM_DETAILS,
            ZAPPROVER_DETAILS_CLAIMS,
            ZEMP_APPROVER_REQUEST_DETAILS,
            ZAPPROVER_DETAILS_PREAPPROVAL,
            ZLOG } = entities;        
        const aLogsToInsert = [];
        // =======================================================================
        // PROCESS 1: Claims — via ZEMP_APPROVER_CLAIM_DETAILS view
        // =======================================================================

        const aMatchingClaims = await tx.run(
            SELECT.from(ZEMP_APPROVER_CLAIM_DETAILS)
                .where({ APPROVER_ID: sUserID })
                .and(`(STATUS = '${Constant.Status.PENDING_APPROVAL}' OR STATUS IS NULL OR STATUS = '')`)
                .and('SUBMITTED_DATE >=', VALID_FROM)
                .and('SUBMITTED_DATE <=', VALID_TO)
                .columns('CLAIM_ID', 'LEVEL', 'STATUS', 'SUBMITTED_DATE', 'EMPLOYEE_NAME')
        );

        if (aMatchingClaims.length > 0) {
            const claimUpdates = aMatchingClaims.map(claim =>
                UPDATE(ZAPPROVER_DETAILS_CLAIMS)   // write to base table, not the view
                    .set({ SUBSTITUTE_APPROVER_ID: sSubstituteID })
                    .where({ CLAIM_ID: claim.CLAIM_ID, LEVEL: claim.LEVEL, APPROVER_ID: sUserID })
            );
            await Promise.all(claimUpdates.map(query => tx.run(query)));

            aMatchingClaims.forEach(claim => {
                aLogsToInsert.push({
                    TIMESTAMP: new Date(),
                    RECORD_ID: claim.CLAIM_ID,
                    PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                    MESSAGE_TYPE: 'S',
                    STATUS_CODE: '200',
                    MESSAGE: `User ${oCurrentUser.EEID} mapped substitution rule. Claim ${claim.CLAIM_ID} (Level ${claim.LEVEL}) assigned to substitute ${sSubstituteID} instead of ${sUserID}.`
                });
            });

            const oSubstitute = await tx.run(
                SELECT.one.from('ZEMP_MASTER')
                    .where({ EEID: sSubstituteID })
                    .columns('EMAIL', 'NAME')
            );

            const aPendingClaims = aMatchingClaims.filter(claim => claim.STATUS === Constant.Status.PENDING_APPROVAL);
            for (const claim of aPendingClaims) {
                try {
                    await sendEmailInternal({
                        ApproverName: oSubstitute.NAME,
                        ClaimID: claim.CLAIM_ID,
                        Action: "Pending Approval (Delegated)",
                        EmailTitle: `Action Required: Delegated Claim ${claim.CLAIM_ID}`,
                        ReceiverEmail: oSubstitute.EMAIL,
                        SubmissionDate: claim.SUBMITTED_DATE,
                        ClaimantName: claim.EMPLOYEE_NAME,
                        RecipientName: oSubstitute.NAME
                    });
                } catch (oEmailError) {
                    console.error(`Email failed for Claim ${claim.CLAIM_ID}`, oEmailError);
                    aLogsToInsert.push({
                        TIMESTAMP: new Date(),
                        RECORD_ID: claim.CLAIM_ID,
                        PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                        MESSAGE_TYPE: 'W',
                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                        MESSAGE: oEmailError?.message || "No Message"
                    });
                }
            }
        }
        // =======================================================================
        // PROCESS 2: Pre-Approvals — via ZEMP_APPROVER_REQUEST_DETAILS view
        // =======================================================================

        const aMatchingPreApprovals = await tx.run(
            SELECT.from(ZEMP_APPROVER_REQUEST_DETAILS)
                .where({ APPROVER_ID: sUserID })
                .and(`(STATUS = '${Constant.Status.PENDING_APPROVAL}' OR STATUS IS NULL OR STATUS = '')`)
                .and('REQUEST_DATE >=', VALID_FROM)   // NOTE: REQUEST_DATE, not SUBMITTED_DATE
                .and('REQUEST_DATE <=', VALID_TO)
                .columns('PREAPPROVAL_ID', 'LEVEL', 'STATUS', 'REQUEST_DATE', 'EMPLOYEE_NAME')
        );

        if (aMatchingPreApprovals.length > 0) {
            const aPreAppUpdates = aMatchingPreApprovals.map(preApp =>
                UPDATE(ZAPPROVER_DETAILS_PREAPPROVAL)   // write to base table, not the view
                    .set({ SUBSTITUTE_APPROVER_ID: sSubstituteID })
                    .where({ PREAPPROVAL_ID: preApp.PREAPPROVAL_ID, LEVEL: preApp.LEVEL, APPROVER_ID: sUserID })
            );
            await Promise.all(aPreAppUpdates.map(query => tx.run(query)));

            aMatchingPreApprovals.forEach(preApp => {
                aLogsToInsert.push({
                    TIMESTAMP: new Date(),
                    RECORD_ID: preApp.PREAPPROVAL_ID,
                    PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                    MESSAGE_TYPE: 'S',
                    STATUS_CODE: '200',
                    MESSAGE: `User ${oCurrentUser.EEID} mapped substitution rule. Pre-Approval ${preApp.PREAPPROVAL_ID} (Level ${preApp.LEVEL}) assigned to substitute ${sSubstituteID} instead of ${sUserID}.`
                });
            });

            const oSubstitute = await tx.run(
                SELECT.one.from('ZEMP_MASTER')
                    .where({ EEID: sSubstituteID })
                    .columns('EMAIL', 'NAME')
            );

            const aPendingPreApprovals = aMatchingPreApprovals.filter(preApp => preApp.STATUS === Constant.Status.PENDING_APPROVAL);
            for (const preApp of aPendingPreApprovals) {
                try {
                    await sendEmailInternal({
                        ApproverName: oSubstitute.NAME,
                        ClaimID: preApp.PREAPPROVAL_ID,
                        Action: "Pending Pre-Approval (Delegated)",
                        EmailTitle: `Action Required: Delegated Pre-Approval ${preApp.PREAPPROVAL_ID}`,
                        ReceiverEmail: oSubstitute.EMAIL,
                        SubmissionDate: preApp.REQUEST_DATE,
                        ClaimantName: preApp.EMPLOYEE_NAME,
                        RecipientName: oSubstitute.NAME
                    });
                } catch (oEmailError) {
                    console.error(`Email failed for Pre-Approval ${preApp.PREAPPROVAL_ID}`, oEmailError);
                    aLogsToInsert.push({
                        TIMESTAMP: new Date(),
                        RECORD_ID: preApp.PREAPPROVAL_ID,
                        PROGRAM: 'SUBSTITUTION_RULE_TRIGGER',
                        MESSAGE_TYPE: 'W',
                        STATUS_CODE: oEmailError?.status || oEmailError?.statusCode || oEmailError?.code || "500",
                        MESSAGE: oEmailError?.message || "No Message"
                    });
                }
            }
        }

        if (aLogsToInsert.length > 0 && ZLOG) {
            await tx.run(INSERT.into(ZLOG).entries(aLogsToInsert));
        }
    }

    srv.on("updateSubstitutionValidTo", async (req) => {

        const { SUBSTITUTE_RULE_ID, USER_ID, SUBSTITUTE_ID, VALID_FROM, OLD_VALID_TO, NEW_VALID_TO } = req.data;

        const tx = cds.tx(req);

        const result = await tx.run(
            UPDATE("ZSUBSTITUTION_RULES")
                .set({
                    VALID_TO: NEW_VALID_TO
                })
                .where({
                    SUBSTITUTE_RULE_ID,
                    USER_ID,
                    SUBSTITUTE_ID,
                    VALID_FROM,
                    VALID_TO: OLD_VALID_TO
                })
        );

        if (!result) {
            return req.error({
                code: "UPDATE_FAILED",
                message: "Failed to update substitution rule."
            });
        }

        // Get current user
        const oCurrentUser = await getLoggedInEmployee(
            tx,
            req,
            srv.entities
        );

        const oLogEntry = {
            TIMESTAMP: new Date(),
            RECORD_ID: String(SUBSTITUTE_RULE_ID),
            PROGRAM: 'SUBSTITUTION_RULE_UPDATE',
            MESSAGE_TYPE: 'S',
            STATUS_CODE: '200',
            MESSAGE: `User ${oCurrentUser.EEID} updated VALID_TO for Rule ${SUBSTITUTE_RULE_ID} from ${OLD_VALID_TO} to ${NEW_VALID_TO}.`
        };

        await tx.run(
            INSERT.into('ZLOG').entries(oLogEntry)
        );

        if (NEW_VALID_TO > OLD_VALID_TO) {
            console.log(">>> Extension detected. Processing new assignments...");
            // Pass the original validation start as oldDate to only look at the expanded window gap
            await handleNewAssignments(tx, srv.entities, {
                sUserID: USER_ID, 
                sSubstituteID: SUBSTITUTE_ID,
                VALID_FROM: OLD_VALID_TO, // Start from the old limit to find new matching records
                VALID_TO: NEW_VALID_TO, oCurrentUser
            });
        } else if (NEW_VALID_TO < OLD_VALID_TO) {
            console.log(">>> Shortening detected. Processing de-delegations...");
            await handleDeDelegations(tx, srv.entities, {
                sUserID: USER_ID, 
                sSubstituteID: SUBSTITUTE_ID,
                VALID_FROM: NEW_VALID_TO, // Look into items trapped between the new earlier limit...
                VALID_TO: OLD_VALID_TO, // ...and the old higher limit
                oCurrentUser
            });
        }

        return true;
    });

     srv.on("checkSubstitutionOverlap", async (req) => {

        const {USER_ID,SUBSTITUTE_ID,VALID_FROM,VALID_TO,SUBSTITUTE_RULE_ID} = req.data;
        const tx = cds.tx(req);
        const aRules = await tx.run(
            SELECT.from("ZSUBSTITUTION_RULES")
                .where({
                    USER_ID: USER_ID
                })
        );

        const dNewFrom = new Date(VALID_FROM);
        const dNewTo = new Date(VALID_TO);

        for (const oRule of aRules) {

            if (
                SUBSTITUTE_RULE_ID &&
                oRule.SUBSTITUTE_RULE_ID === SUBSTITUTE_RULE_ID
            ) {
                continue;
            }

            const dOldFrom = new Date(oRule.VALID_FROM);
            const dOldTo = new Date(oRule.VALID_TO);

            const bOverlap =
                dOldTo >= dNewFrom &&
                dOldFrom <= dNewTo;

            if (bOverlap) {
                return true;
            }
        }

        return false;
    });

}
