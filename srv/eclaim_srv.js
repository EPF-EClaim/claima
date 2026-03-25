const cds = require('@sap/cds');
const { INSERT, UPDATE, UPSERT, SELECT, where } = require('@sap/cds/lib/ql/cds-ql');
const express = require('express');
const app = express();
const { Constant } = require("./utils/constant");

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
            const { ZEMP_MASTER, ZDEPARTMENT } = srv.entities;
            const emailFromToken =
                req.user?.attr?.email ||
                req.user?.attr?.mail ||
                req.user?.attr?.user_name ||
                req.user?.attr?.login_name ||
                req.user?.id ||
                "";

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

            const email = String(emailFromToken).trim().toLowerCase();
            const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });
            const dept = await SELECT.one.from(ZDEPARTMENT).where({ DEPARTMENT_ID: result.DEP });

            return {
                id: email,
                userType: result?.USER_TYPE || "UNKNOWN",
                costcenters: result?.CC || "UNKNOWN",
                userId: result?.EEID || "UNKNOWN",
                name: result?.NAME || "UNKNOWN",
                position: result?.POSITION_NAME || "UNKNOWN",
                origin: sOrigin,
                grade: result?.GRADE || "UNKNOWN",
                department: dept?.DEPARTMENT_DESC || "UNKNOWN"
            };
        });

    srv.on('runjob', req => {
        console.log('==> [APP JOB LOG] Job is running . . .');
        return {
            responseArray: [{ "message": "finished" }]
        };
    });

    srv.on('READ', 'FeatureControl', async (req) => {
        const { ZEMP_MASTER } = srv.entities;
        const emailFromToken = req.user?.attr?.email || req.user?.id || "";
        const email = String(emailFromToken).trim().toLowerCase();
        const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });
        const user_type = result?.USER_TYPE;

        let operationHidden = true;
        if (user_type === Constant.UserType.JKEW_ADMIN) {
            operationHidden = true;
        } else if (user_type === Constant.UserType.DTD_ADMIN || user_type === Constant.UserType.SUPER_ADMIN) {
            operationHidden = false;
        }

        return {
            operationHidden: operationHidden,
            operationEnabled: !operationHidden,
        }
    });

    srv.on('READ', 'BudgetControl', async (req) => {
        const { ZEMP_MASTER } = srv.entities;
        const emailFromToken = req.user?.attr?.email || req.user?.id || "";
        const email = String(emailFromToken).trim().toLowerCase();
        const result = await SELECT.one.from(ZEMP_MASTER).where({ EMAIL: email });
        const user_type = result?.USER_TYPE;

        let operationHidden = (user_type === Constant.UserType.GA_ADMIN);
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
        const ISserivce = await cds.connect.to('IS_NonProd_Conn');
        ISserivce.send({
            method: 'POST',
            path: "/http/EmailNotification_BTP_DEV",
            data: { ...req.data }
        });
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
        try {
            const { budget } = req.data;
            if (!budget || budget.length === 0) throw new Error('No Data Sent');

            const tx = cds.tx(req);

            //if record hasnt been created yet, direct insert record into database
            //else, update the record but exclude the five fields
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
                } else {
                    const excludeFields = Constant.BudgetUpload.EXCLUDE_FIELDS;

                    const updatePayload = { ...row };
                    excludeFields.forEach(f => delete updatePayload[f]);
                    
                    updatePayload.CURRENT_BUDGET = row.ORIGINAL_BUDGET + row.VIREMENT_IN + row.VIREMENT_OUT + row.SUPPLEMENT + row.RETURN;

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
                }
            }
            return 'Records updated';
        } catch (error) {
            req.error(400, `Fail creating record: ${error.message}`);
        }
    });

    /* ======================================================================================================================================= */
    /* Below are Jefry's functions with the help of Ain. Don't slot your function in between tq. You are making my life harder. Appreciate it. */
    /* ======================================================================================================================================= */

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
                const condition = {
                    YEAR: entry.YEAR,
                    INTERNAL_ORDER: entry.INTERNAL_ORDER,
                    FUND_CENTER: entry.FUND_CENTER,
                    MATERIAL_GROUP: entry.MATERIAL_GROUP,
                    COMMITMENT_ITEM: entry.COMMITMENT_ITEM
                };

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
        const current = Number(row.CURRENT || 0);
        const yy = String(new Date().getFullYear()).slice(-2);

        const nextNumber = `${prefix}${yy}${String(current).padStart(9, "0")}`;
        req.data.REQUEST_ID = String(nextNumber);

        await tx.run(
            UPDATE('ZNUM_RANGE')
                .set({ CURRENT: String(current + 1) })
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

    async function updateClaimHeaderTotals(req, sClaimId, tx) {
        if (!sClaimId) return;

        const result = await tx.run(
            SELECT.one`
                SUM(AMOUNT) as TotalClaimAmount
            `
                .from('ZCLAIM_ITEM')
                .where({ CLAIM_ID: sClaimId })
        );

        const totalClaimAmount = result.TotalClaimAmount || 0;

        await tx.run(
            UPDATE('ZCLAIM_HEADER')
                .set({
                    TOTAL_CLAIM_AMOUNT: totalClaimAmount
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

        console.log(`Updated Header ${sRequestId}: PreApproval=${totalEstAmount}, CashAdvance=${totalCashAdvance}`);
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

    /* ======================================================================================================================================= */
    /* Above are Jefry's functions with the help of Ain. Don't slot your function in between tq. You are making my life harder. Appreciate it. */
    /* ======================================================================================================================================= */

    srv.on('onFinalApproveInsert', async (req) => {
        const { ZCLM_APPR_REQ_STAT } = srv.entities;
        try {
            const { ApproveRequest } = req.data;
            console.log(ApproveRequest);
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

}