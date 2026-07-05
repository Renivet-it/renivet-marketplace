import { BitFieldSitePermission } from "@/config/permissions";
import { financeModules } from "@/lib/db/schema";
import { getFinanceModuleAccess } from "@/lib/finance/access";
import {
    categorizeCodDiscrepancy,
    computeTdsDeduction,
    getFinancialYearForDate,
    splitGstByState,
} from "@/lib/finance/calculations";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { syncCodReconciliationRun, writeOffCodDiscrepancy } from "@/lib/finance/cod";
import { executeDeletionRequest, recordConsent } from "@/lib/finance/dpdp";
import { generateGstExport, previewGstExport } from "@/lib/finance/gst";
import { lockMonthlyPl, unlockMonthlyPl } from "@/lib/finance/pl";
import {
    approvePayoutCycle,
    calculatePayoutCycle,
    executePayoutCycle,
} from "@/lib/finance/payouts";
import {
    createFinanceRefundCase,
    createReversePickupForRefund,
    executeApprovedRefund,
    retryFinanceRefund,
} from "@/lib/finance/refunds";
import {
    adminProcedure,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const financeModuleEnum = z.enum(financeModules);

async function assertFinanceAccess(ctx: any, moduleKey: (typeof financeModules)[number], mode: "view" | "manage") {
    if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You're not authorized" });
    }

    const access = await getFinanceModuleAccess({
        userId: ctx.user.id,
        sitePermissions: ctx.user.sitePermissions ?? 0,
        moduleKey,
    });

    if ((mode === "manage" && !access.canManage) || (mode === "view" && !access.canView && !access.canManage)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: `You do not have ${mode} access for ${moduleKey}.`,
        });
    }
}

export const financeComplianceRouter = createTRPCRouter({
    health: publicProcedure.query(() => ({
        ok: true,
        modules: financeModules,
    })),

    listRefundCases: protectedProcedure
        .input(
            z.object({
                status: z.string().optional(),
                approvalStatus: z.string().optional(),
                q: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "view");
            return ctx.queries.financeCompliance.listRefunds(input ?? {});
        }),

    createRefundCase: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                userId: z.string(),
                orderId: z.string(),
                paymentId: z.string(),
                amount: z.number().int().nonnegative(),
                reasonCode: z.string().optional(),
                reasonNotes: z.string().optional(),
                refundType: z.enum(["full", "partial", "exchange", "credit_note"]).default("full"),
                policyBucket: z.enum(["brand_fault", "renivet_fault", "customer_fault", "courier_fault"]).optional(),
                reversePickupRequired: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return createFinanceRefundCase({
                orderId: input.orderId,
                userId: input.userId,
                paymentId: input.paymentId,
                amountPaise: input.amount,
                reasonCode: input.reasonCode,
                reasonNotes: input.reasonNotes,
                refundType: input.refundType,
                policyBucket: input.policyBucket as any,
                reversePickupRequired: input.reversePickupRequired,
                actorId: ctx.user.id,
            });
        }),

    approveRefundCase: protectedProcedure
        .input(
            z.object({
                refundId: z.string(),
                approved: z.boolean(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            const existing = await ctx.queries.financeCompliance.getRefundById(
                input.refundId
            );
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Refund not found." });
            }

            const values = input.approved
                ? {
                      approvalStatus: "approved" as const,
                      approvedBy: ctx.user.id,
                      approvedAt: new Date(),
                  }
                : {
                      approvalStatus: "rejected" as const,
                      rejectedBy: ctx.user.id,
                      rejectedAt: new Date(),
                      rejectionReason: input.reason ?? "Rejected by admin",
                      status: "failed" as const,
                  };
            const row = await ctx.queries.financeCompliance.updateRefund(
                input.refundId,
                values
            );
            if (!input.approved) {
                await ctx.queries.monitoringSla.createAlert({
                    type: "refund_rejected_review",
                    severity: "warning",
                    entityType: "refund",
                    entityId: input.refundId,
                    title: "Refund request rejected",
                    message: input.reason ?? "Refund request rejected by finance admin.",
                    ownerId: ctx.user.id,
                    ownerRole: "finance_admin",
                    channels: ["admin"],
                    dedupeKey: `refund-rejected:${input.refundId}`,
                });
            }
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: input.approved ? "refund.approved" : "refund.rejected",
                entityType: "refund",
                entityId: input.refundId,
                reason: input.reason ?? null,
                beforeValue: existing as any,
                afterValue: row as any,
            });

            if (input.approved) {
                return executeApprovedRefund(input.refundId, ctx.user.id);
            }

            return row;
        }),

    createReverseLogistics: protectedProcedure
        .input(z.object({ refundId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return createReversePickupForRefund(input.refundId, ctx.user.id);
        }),

    retryRefundCase: protectedProcedure
        .input(z.object({ refundId: z.string(), failedReason: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return retryFinanceRefund(input.refundId, ctx.user.id);
        }),

    listCodReconciliation: protectedProcedure
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "cod_reconciliation", "view");
            const [items, runs] = await Promise.all([
                ctx.queries.financeCompliance.listCodReconciliation(input?.status),
                ctx.queries.financeCompliance.listCodRuns(),
            ]);
            return { items, runs };
        }),

    createCodSnapshot: adminProcedure
        .input(
            z.object({
                orderId: z.string(),
                expectedAmountPaise: z.number().int(),
                remittedAmountPaise: z.number().int(),
                remittanceDate: z.date().optional(),
                remittanceReference: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const run = await ctx.queries.financeCompliance.createCodRun({
                runType: "manual_refresh",
                status: "running",
                requestedBy: ctx.user.id,
                rowsProcessed: 0,
                metadata: {
                    source: "finance_router",
                },
            });

            const categorization = categorizeCodDiscrepancy({
                expectedAmountPaise: input.expectedAmountPaise,
                remittedAmountPaise: input.remittedAmountPaise,
                remittanceDate: input.remittanceDate,
            });

            const row = await ctx.queries.financeCompliance.upsertCodReconciliation({
                orderId: input.orderId,
                runId: run.id,
                carrier: "delhivery",
                expectedAmountPaise: input.expectedAmountPaise,
                remittedAmountPaise: input.remittedAmountPaise,
                expectedFeePaise: 0,
                actualFeePaise: 0,
                discrepancyAmountPaise: categorization.discrepancyAmountPaise,
                ageingDays: categorization.ageingDays,
                remittanceReference: input.remittanceReference,
                remittanceDate: input.remittanceDate
                    ? input.remittanceDate.toISOString().slice(0, 10)
                    : undefined,
                status: categorization.status as any,
                notes: input.notes,
                metadata: {
                    categorizedBy: "manual_snapshot",
                },
            });

            await ctx.queries.financeCompliance.finishCodRun(run.id, {
                status: "completed",
                rowsProcessed: 1,
                finishedAt: new Date(),
            });

            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "cod_reconciliation.snapshot_upserted",
                entityType: "cod_reconciliation",
                entityId: row.id,
                afterValue: row as any,
            });

            return row;
        }),

    runCodRemittanceSync: adminProcedure.mutation(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "cod_reconciliation", "manage");
        return syncCodReconciliationRun(ctx.user.id);
    }),

    writeOffCodRow: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                reason: z.string().min(3),
                proofFileUrl: z.string().url(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "cod_reconciliation", "manage");
            return writeOffCodDiscrepancy({
                ...input,
                actorId: ctx.user.id,
            });
        }),

    listPayoutCycles: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "payouts", "view");
        return ctx.queries.financeCompliance.listPayoutCycles();
    }),

    createPayoutCycle: adminProcedure
        .input(
            z.object({
                cycleKey: z.string(),
                cycleStart: z.date(),
                cycleEnd: z.date(),
                payoutDate: z.date(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.createPayoutCycle({
                cycleKey: input.cycleKey,
                cycleStart: input.cycleStart.toISOString().slice(0, 10),
                cycleEnd: input.cycleEnd.toISOString().slice(0, 10),
                payoutDate: input.payoutDate.toISOString().slice(0, 10),
                status: "draft",
                calculatedBy: ctx.user.id,
                calculationSummary: {},
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "payout_cycle.created",
                entityType: "payout_cycle",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    calculatePayoutCycle: adminProcedure
        .input(z.object({ cycleId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return calculatePayoutCycle(input.cycleId, ctx.user.id);
        }),

    approvePayoutCycle: adminProcedure
        .input(z.object({ cycleId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return approvePayoutCycle(input.cycleId, ctx.user.id);
        }),

    executePayoutCycle: adminProcedure
        .input(z.object({ cycleId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return executePayoutCycle(input.cycleId, ctx.user.id);
        }),

    computeTdsPreview: protectedProcedure
        .input(
            z.object({
                cumulativeCommissionPaise: z.number().int().nonnegative(),
                cycleCommissionPaise: z.number().int().nonnegative(),
                thresholdPaise: z.number().int().optional(),
                rateBps: z.number().int().optional(),
            })
        )
        .query(({ input }) => computeTdsDeduction(input)),

    listHsnMaster: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "gst_reports", "view");
        return ctx.queries.financeCompliance.listHsnMaster();
    }),

    upsertHsnMaster: adminProcedure
        .input(
            z.object({
                id: z.string().uuid().optional(),
                hsnCode: z.string(),
                description: z.string(),
                gstRateBps: z.number().int().nonnegative(),
                categoryLabel: z.string().optional(),
                isActive: z.boolean().default(true),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.upsertHsn({
                ...input,
                metadata: {},
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "hsn_master.upserted",
                entityType: "hsn_master",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    previewGstSplit: protectedProcedure
        .input(
            z.object({
                taxableValuePaise: z.number().int().nonnegative(),
                gstRateBps: z.number().int().nonnegative(),
                supplierState: z.string().optional(),
                customerState: z.string().optional(),
            })
        )
        .query(({ input }) => splitGstByState(input)),

    listGstReportRuns: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "gst_reports", "view");
        return ctx.queries.financeCompliance.listGstReportRuns();
    }),

    previewGstExport: adminProcedure
        .input(z.object({ monthKey: z.string() }))
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "gst_reports", "manage");
            return previewGstExport(input.monthKey);
        }),

    createGstReportRun: adminProcedure
        .input(
            z.object({
                monthKey: z.string(),
                recordCount: z.number().int().default(0),
                totals: z.record(z.any()).default({}),
                validationSummary: z.record(z.any()).default({}),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.createGstReportRun({
                ...input,
                status: "generated",
                generatedBy: ctx.user.id,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "gst_report.generated",
                entityType: "gst_report_run",
                entityId: row.id,
                afterValue: row as any,
                metadata: {
                    monthKey: row.monthKey,
                },
            });
            return row;
        }),

    generateGstExport: adminProcedure
        .input(z.object({ monthKey: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "gst_reports", "manage");
            return generateGstExport(input.monthKey, ctx.user.id);
        }),

    listModuleAccess: adminProcedure
        .input(z.object({ moduleKey: financeModuleEnum.optional() }).optional())
        .query(async ({ ctx, input }) => {
            return ctx.queries.financeCompliance.listModuleAccess(input?.moduleKey);
        }),

    upsertModuleAccess: adminProcedure
        .input(
            z.object({
                moduleKey: financeModuleEnum,
                userId: z.string(),
                canView: z.boolean().default(true),
                canManage: z.boolean().default(false),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.upsertModuleAccess({
                ...input,
                grantedBy: ctx.user.id,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "module_access.upserted",
                entityType: "module_access",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    listPlEntries: protectedProcedure
        .input(z.object({ monthKey: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "view");
            const monthKey = input?.monthKey;
            const [entries, summary] = await Promise.all([
                ctx.queries.financeCompliance.listPlEntries(monthKey),
                monthKey
                    ? ctx.queries.financeCompliance.getPlSummary(monthKey)
                    : Promise.resolve(null),
            ]);
            return { entries, summary };
        }),

    upsertPlEntry: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid().optional(),
                monthKey: z.string(),
                category: z.string(),
                description: z.string(),
                amountPaise: z.number().int(),
                notes: z.string().optional(),
                lockEntry: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "manage");
            const row = await ctx.queries.financeCompliance.upsertPlEntry({
                id: input.id,
                monthKey: input.monthKey,
                category: input.category,
                description: input.description,
                amountPaise: input.amountPaise,
                notes: input.notes,
                createdBy: ctx.user.id,
                updatedBy: ctx.user.id,
                lockedAt: input.lockEntry ? new Date() : null,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "monthly_pl.entry_upserted",
                entityType: "pl_manual_entry",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    lockPlMonth: adminProcedure
        .input(z.object({ monthKey: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "manage");
            return lockMonthlyPl(input.monthKey, ctx.user.id);
        }),

    unlockPlMonth: adminProcedure
        .input(
            z.object({
                monthKey: z.string(),
                reason: z.string().min(3),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "manage");
            return unlockMonthlyPl(input.monthKey, ctx.user.id, input.reason);
        }),

    createDataDeletionRequest: protectedProcedure
        .input(
            z.object({
                reason: z.string().optional(),
                requestedByEmail: z.string().email().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.createDeletionRequest({
                userId: ctx.user.id,
                status: "requested",
                reason: input.reason,
                requestedByEmail: input.requestedByEmail ?? ctx.user.email,
                completionEvidence: {},
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "data_deletion.requested",
                entityType: "data_deletion_request",
                entityId: row.id,
                reason: input.reason ?? null,
                afterValue: row as any,
            });
            return row;
        }),

    listDataDeletionRequests: protectedProcedure
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "data_deletion", "view");
            return ctx.queries.financeCompliance.listDeletionRequests(input?.status);
        }),

    updateDataDeletionRequest: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                status: z.enum(["requested", "approved", "rejected", "processing", "completed", "failed"]),
                error: z.string().optional(),
                completionEvidence: z.record(z.any()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.updateDeletionRequest(
                input.id,
                {
                    status: input.status,
                    error: input.error,
                    completionEvidence: input.completionEvidence,
                    reviewedBy: ctx.user.id,
                    reviewedAt: new Date(),
                    executedAt: input.status === "completed" ? new Date() : null,
                }
            );
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: `data_deletion.${input.status}`,
                entityType: "data_deletion_request",
                entityId: input.id,
                afterValue: row as any,
            });
            return row;
        }),

    executeDataDeletionRequest: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "data_deletion", "manage");
            return executeDeletionRequest(input.id, ctx.user.id);
        }),

    listLegalContacts: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "audit_log_finance", "view");
        return ctx.queries.financeCompliance.listLegalContacts();
    }),

    upsertLegalContact: adminProcedure
        .input(
            z.object({
                id: z.string().uuid().optional(),
                contactType: z.string(),
                name: z.string(),
                email: z.string().optional(),
                phone: z.string().optional(),
                address: z.string().optional(),
                designation: z.string().optional(),
                notes: z.string().optional(),
                isActive: z.boolean().default(true),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.queries.financeCompliance.upsertLegalContact(input);
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "legal_contact.upserted",
                entityType: "legal_contact",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    grantConsent: protectedProcedure
        .input(
            z.object({
                consentType: z.string(),
                version: z.string(),
                source: z.string().default("web"),
                isGranted: z.boolean().default(true),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await recordConsent({
                userId: ctx.user.id,
                consentType: input.consentType,
                version: input.version,
                source: input.source,
                isGranted: input.isGranted,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "consent.recorded",
                entityType: "user_consent",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    listFinanceAuditModules: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user?.sitePermissions) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You're not authorized" });
        }
        return {
            modules: financeModules,
            canManageMonitoring:
                (ctx.user.sitePermissions & BitFieldSitePermission.MANAGE_MONITORING) > 0,
            currentFinancialYear: getFinancialYearForDate(new Date()),
        };
    }),

    listFinanceAuditLogs: adminProcedure
        .input(
            z.object({
                entityType: z.string().optional(),
                actorId: z.string().optional(),
                from: z.date().optional(),
                to: z.date().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "audit_log_finance", "view");
            return ctx.queries.financeCompliance.listFinanceAuditLogs({
                ...(input ?? {}),
                module: "finance_compliance",
            });
        }),
});
