import { financeModules } from "@/lib/db/schema";
import { legalCache } from "@/lib/redis/methods/legal";
import {
    getFinanceModuleAccess,
    hasFinanceAdminAccess,
    isAjSuperAdmin,
} from "@/lib/finance/access";
import {
    computeTdsDeduction,
    getFinancialYearForDate,
    splitGstByState,
} from "@/lib/finance/calculations";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import {
    categorizeCodReconciliation,
    resolveCodDiscrepancy,
    syncCarrierFeeSchedule,
    syncCodReconciliationRun,
    writeOffCodDiscrepancy,
} from "@/lib/finance/cod";
import {
    createDeletionRequest,
    executeDeletionRequest,
    listUserConsentState,
    recordConsent,
    reviewDeletionRequest,
    runDeletionRequestSlaSweep,
    verifyDeletionRequest,
} from "@/lib/finance/dpdp";
import { generateGstExport, previewGstExport } from "@/lib/finance/gst";
import { buildMonthlyPl, lockMonthlyPl, refreshMonthlyPl, unlockMonthlyPl } from "@/lib/finance/pl";
import {
    approvePayoutCycle,
    approvePayoutOverride,
    calculatePayoutCycle,
    completeManualBrandPayout,
    createPayoutOverride,
    executePayoutCycle,
    runPayoutCycleAlerts,
} from "@/lib/finance/payouts";
import { buildQuarterlyTdsExport, runTdsFinancialYearRollover } from "@/lib/finance/tds";
import {
    approveFinanceRefundCase,
    createFinanceRefundCase,
    createReversePickupForRefund,
    markFinanceRefundReturnReceived,
    processFinanceRefundCase,
    rejectFinanceRefundCase,
    retryFinanceRefund,
    updateFinanceRefundQcStatus,
} from "@/lib/finance/refunds";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
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
        roles: ctx.user.roles ?? [],
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
                source: z.enum(["manual", "automatic"]).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "view");
            return ctx.queries.financeCompliance.listRefunds(input ?? {});
        }),

    listRefundReasons: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "refunds", "view");
        return ctx.queries.financeCompliance.listRefundReasons();
    }),

    listRefundEligibleOrders: protectedProcedure
        .input(
            z.object({
                q: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "view");
            return ctx.queries.financeCompliance.listRefundEligibleOrders(input?.q);
        }),

    getOrderDetailsForRefund: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "view");
            const order = await ctx.queries.orders.getOrderById(input.orderId);
            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }
            const user = await ctx.queries.users.getUser(order.userId);
            return {
                orderId: order.id,
                userId: order.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
                paymentId: order.paymentId ?? "",
                amount: order.totalAmount, // in paise
            };
        }),

    createRefundCase: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                orderId: z.string(),
                paymentId: z.string(),
                amount: z.number().int().nonnegative(),
                reasonCode: z.string().uuid(),
                notes: z.string().optional(),
                refundType: z.enum(["full", "partial", "exchange", "credit_note"]).default("full"),
                costAllocation: z.enum([
                    "brand_fault",
                    "renivet_fault",
                    "customer_fault",
                    "carrier_fault",
                ]),
                returnShippingPaidBy: z.enum(["renivet", "customer", "na"]).optional(),
                evidenceUrls: z.array(z.string().url()).default([]),
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
                notes: input.notes,
                refundType: input.refundType,
                costAllocation: input.costAllocation as any,
                returnShippingPaidBy: input.returnShippingPaidBy,
                evidenceUrls: input.evidenceUrls,
                actorId: ctx.user.id,
            });
        }),

    approveRefundCase: protectedProcedure
        .input(
            z.object({
                refundId: z.string(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return approveFinanceRefundCase(input.refundId, ctx.user.id, input.reason);
        }),

    rejectRefundCase: protectedProcedure
        .input(
            z.object({
                refundId: z.string(),
                reason: z.string().min(3),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return rejectFinanceRefundCase(input.refundId, ctx.user.id, input.reason);
        }),

    processRefundCase: protectedProcedure
        .input(z.object({ refundId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return processFinanceRefundCase(input.refundId, ctx.user.id);
        }),

    createReverseLogistics: protectedProcedure
        .input(z.object({ refundId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return createReversePickupForRefund(input.refundId, ctx.user.id);
        }),

    markRefundReturnReceived: protectedProcedure
        .input(
            z.object({
                refundId: z.string(),
                receivedAt: z.date().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return markFinanceRefundReturnReceived(
                input.refundId,
                ctx.user.id,
                input.receivedAt
            );
        }),

    updateRefundQcStatus: protectedProcedure
        .input(
            z.object({
                refundId: z.string(),
                qcStatus: z.enum(["pending", "passed", "failed", "na"]),
                note: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return updateFinanceRefundQcStatus({
                refundId: input.refundId,
                actorId: ctx.user.id,
                qcStatus: input.qcStatus,
                note: input.note,
            });
        }),

    retryRefundCase: protectedProcedure
        .input(z.object({ refundId: z.string(), failedReason: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "refunds", "manage");
            return retryFinanceRefund(input.refundId, ctx.user.id);
        }),

    listCodReconciliation: protectedProcedure
        .input(
            z.object({
                status: z.string().optional(),
                q: z.string().optional(),
                attentionOnly: z.boolean().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "cod_reconciliation", "view");
            const [items, runs] = await Promise.all([
                ctx.queries.financeCompliance.listCodReconciliation(input ?? {}),
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

            const categorization = categorizeCodReconciliation({
                expectedRemittancePaise: input.expectedAmountPaise,
                remittedAmountPaise:
                    input.remittedAmountPaise > 0 ? input.remittedAmountPaise : null,
                deliveryDate: input.remittanceDate ?? null,
                tolerancePaise: 1000,
            });

            const row = await ctx.queries.financeCompliance.upsertCodReconciliation({
                orderId: input.orderId,
                runId: run.id,
                awbNumber: null,
                carrier: "delhivery",
                codAmountPaise: input.expectedAmountPaise,
                codFeeRateBps: null,
                codFeeFlatPaise: null,
                expectedAmountPaise: input.expectedAmountPaise,
                expectedRemittancePaise: input.expectedAmountPaise,
                remittedAmountPaise: input.remittedAmountPaise,
                expectedFeePaise: 0,
                actualFeePaise: 0,
                discrepancyAmountPaise: categorization.discrepancyAmountPaise,
                ageingDays: categorization.ageingDays,
                remittanceReference: input.remittanceReference,
                deliveryDate: input.remittanceDate ?? null,
                remittedAt: input.remittanceDate ?? null,
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
                status: "success",
                rowsProcessed: 1,
                recordsSynced: 1,
                matchedCount: categorization.status === "matched" ? 1 : 0,
                pendingCount: categorization.status === "pending" ? 1 : 0,
                discrepancyCount:
                    categorization.status === "matched" || categorization.status === "pending"
                        ? 0
                        : 1,
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

    runCodFeeSync: adminProcedure.mutation(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "cod_reconciliation", "manage");
        return syncCarrierFeeSchedule(ctx.user.id);
    }),

    runCodRemittanceSync: adminProcedure.mutation(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "cod_reconciliation", "manage");
        return syncCodReconciliationRun(ctx.user.id);
    }),

    resolveCodRow: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                status: z.enum([
                    "pending",
                    "matched",
                    "discrepancy",
                    "overdue",
                    "critical",
                    "ghost",
                ]),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "cod_reconciliation", "manage");
            return resolveCodDiscrepancy({
                ...input,
                actorId: ctx.user.id,
            });
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

    listCarrierFeeSchedules: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "cod_reconciliation", "view");
        return ctx.queries.financeCompliance.listCarrierFeeSchedules();
    }),

    listPayoutCycles: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "payouts", "view");
        return ctx.queries.financeCompliance.listPayoutCycles();
    }),

    getPayoutCycleDetail: protectedProcedure
        .input(z.object({ cycleId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "view");
            const cycle = await ctx.queries.financeCompliance.getPayoutCycle(input.cycleId);
            if (!cycle) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Payout cycle not found." });
            }
            const [lineItems, overrides] = await Promise.all([
                ctx.queries.financeCompliance.listPayoutLineItems(input.cycleId),
                ctx.queries.financeCompliance.listPayoutOverrides(input.cycleId),
            ]);
            return { cycle, lineItems, overrides };
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
        .input(z.object({ cycleId: z.string().uuid(), brandId: z.string().uuid().optional() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return approvePayoutCycle(input.cycleId, ctx.user.id, input.brandId);
        }),

    executePayoutCycle: adminProcedure
        .input(z.object({ cycleId: z.string().uuid(), brandId: z.string().uuid().optional() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return executePayoutCycle(input.cycleId, ctx.user.id, input.brandId);
        }),

    createPayoutOverride: adminProcedure
        .input(
            z.object({
                cycleId: z.string().uuid(),
                brandId: z.string().uuid(),
                adjustmentType: z.enum([
                    "shipping_cost_dispute",
                    "qc_adjustment",
                    "manual_correction",
                    "duplicate_deduction",
                    "other",
                ]),
                amountPaise: z.number().int(),
                reasonCode: z.string().min(2),
                notes: z.string().min(3),
                proofFileUrl: z.string().url(),
                approverId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return createPayoutOverride({
                ...input,
                actorId: ctx.user.id,
            });
        }),

    approvePayoutOverride: adminProcedure
        .input(z.object({ overrideId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return approvePayoutOverride(input.overrideId, ctx.user.id);
        }),

    completeManualPayout: adminProcedure
        .input(
            z.object({
                cycleId: z.string().uuid(),
                brandId: z.string().uuid(),
                transactionId: z.string().min(3),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            return completeManualBrandPayout({
                ...input,
                actorId: ctx.user.id,
            });
        }),

    runPayoutCycleAlerts: adminProcedure.mutation(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "payouts", "manage");
        return runPayoutCycleAlerts(ctx.user.id);
    }),

    listPayoutConfigs: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "payouts", "view");
        return ctx.queries.financeCompliance.listPayoutConfigs();
    }),

    upsertPayoutConfig: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                payoutMethod: z.enum(["razorpay_route", "manual_neft"]),
                payoutCycleAnchor: z.enum(["1st", "16th"]).default("1st"),
                holdbackPercentBps: z.number().int().nonnegative().default(500),
                minimumPayoutPaise: z.number().int().nonnegative().default(0),
                payoutEmail: z.string().email().optional(),
                isActive: z.boolean().default(true),
                bankSnapshot: z.record(z.any()).default({}),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            const previous = (await ctx.queries.financeCompliance.listPayoutConfigs([input.id]))[0];
            const row = await ctx.queries.financeCompliance.upsertPayoutConfig({
                ...input,
            });

            const previousBank = previous?.bankSnapshot as Record<string, unknown> | undefined;
            const nextBank = row.bankSnapshot as Record<string, unknown>;
            const bankChanged =
                previousBank?.bankAccountNumber !== nextBank.bankAccountNumber ||
                previousBank?.bankIfsc !== nextBank.bankIfsc;

            if (bankChanged) {
                await auditAndAlert({
                    actorId: ctx.user.id,
                    actionType: "brand_bank_details_changed",
                    entityType: "brand_payout_config",
                    entityId: row.id,
                    beforeValue: previous as any,
                    afterValue: row as any,
                    reason: "bank_details_updated",
                    title: "Brand payout bank details changed",
                    message: `Bank details changed for brand ${row.id}. Review immediately.`,
                    severity: "critical",
                    ownerRole: "finance_admin",
                    type: "brand_bank_details_changed",
                    dedupeKey: `brand-bank-change:${row.id}:${row.updatedAt.toISOString()}`,
                    channels: ["admin", "email"],
                    metadata: {
                        module: "finance_compliance",
                    },
                });
            } else {
                await writeFinanceAuditEvent({
                    actorId: ctx.user.id,
                    actionType: "brand_payout_config.upserted",
                    entityType: "brand_payout_config",
                    entityId: row.id,
                    beforeValue: previous as any,
                    afterValue: row as any,
                });
            }

            return row;
        }),

    listCommissionRules: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid().optional(),
                categoryId: z.string().uuid().optional(),
                isActive: z.boolean().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "view");
            return ctx.queries.financeCompliance.listCommissionRules(input);
        }),

    upsertCommissionRule: adminProcedure
        .input(
            z.object({
                id: z.string().uuid().optional(),
                ruleName: z.string().min(2),
                brandId: z.string().uuid().optional(),
                categoryId: z.string().uuid().optional(),
                productTypeId: z.string().uuid().optional(),
                commissionPercentBps: z.number().int().nonnegative(),
                holdbackPercentBps: z.number().int().nonnegative().default(500),
                priority: z.number().int().default(0),
                effectiveFrom: z.string(),
                effectiveTo: z.string().optional(),
                isActive: z.boolean().default(true),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "payouts", "manage");
            const row = await ctx.queries.financeCompliance.upsertCommissionRule(input);
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "commission_rule.upserted",
                entityType: "commission_rule",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
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

    listBrandTdsTracking: protectedProcedure
        .input(z.object({ financialYear: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "tds_reports", "view");
            return ctx.queries.financeCompliance.listBrandTdsTracking(input?.financialYear);
        }),

    exportQuarterlyTdsPreview: adminProcedure
        .input(
            z.object({
                financialYear: z.string().optional(),
                quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "tds_reports", "manage");
            return buildQuarterlyTdsExport(input);
        }),

    runTdsFinancialYearRollover: adminProcedure.mutation(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "tds_reports", "manage");
        return runTdsFinancialYearRollover(ctx.user.id);
    }),

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

    listPlatformSettings: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "compliance_admin", "view");
        return ctx.queries.financeCompliance.listPlatformSettings();
    }),

    upsertPlatformSetting: protectedProcedure
        .input(
            z.object({
                key: z.string().min(2),
                value: z.record(z.any()),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "compliance_admin", "manage");
            const previous = await ctx.queries.financeCompliance.getPlatformSetting(input.key);
            const row = await ctx.queries.financeCompliance.upsertPlatformSetting({
                key: input.key,
                value: input.value,
                description: input.description,
                updatedBy: ctx.user.id,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: previous ? "platform_settings.changed" : "platform_settings.created",
                entityType: "platform_setting",
                entityId: row.key,
                reason: "platform_setting_updated",
                beforeValue: previous as any,
                afterValue: row as any,
            });
            return row;
        }),

    listModuleAccess: protectedProcedure
        .input(z.object({ moduleKey: financeModuleEnum.optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "audit_log_finance", "view");
            return ctx.queries.financeCompliance.listModuleAccess(input?.moduleKey);
        }),

    searchFinanceUsers: protectedProcedure
        .input(z.object({ q: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "audit_log_finance", "view");
            return ctx.queries.financeCompliance.searchFinanceUsers(input?.q);
        }),

    upsertModuleAccess: protectedProcedure
        .input(
            z.object({
                moduleKey: financeModuleEnum,
                userId: z.string(),
                canView: z.boolean().default(true),
                canManage: z.boolean().default(false),
                notes: z.string().optional(),
                revoke: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "audit_log_finance", "manage");
            if (!isAjSuperAdmin(ctx.user.id)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only AJ can grant or revoke module access.",
                });
            }
            const row = await ctx.queries.financeCompliance.upsertModuleAccess({
                ...input,
                grantedBy: ctx.user.id,
                grantedAt: new Date(),
                revokedAt: input.revoke ? new Date() : null,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: input.revoke
                    ? "module_access.revoked"
                    : "module_access.upserted",
                entityType: "module_access",
                entityId: row.id,
                afterValue: row as any,
            });
            return row;
        }),

    getMonthlyPlDashboard: protectedProcedure
        .input(z.object({ monthKey: z.string() }))
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "view");
            const [entries, previousEntries, snapshot, summary] = await Promise.all([
                ctx.queries.financeCompliance.listPlEntries(input.monthKey),
                ctx.queries.financeCompliance.getLatestPreviousPlEntries(input.monthKey),
                ctx.queries.financeCompliance.getPlSnapshot(input.monthKey),
                buildMonthlyPl(input.monthKey),
            ]);
            return {
                entries,
                previousEntries,
                snapshot,
                summary,
                isLocked: snapshot?.snapshotType === "locked",
                canUnlock: isAjSuperAdmin(ctx.user.id),
            };
        }),

    upsertPlEntry: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid().optional(),
                monthKey: z.string(),
                lineItem: z.string(),
                subLabel: z.string().optional(),
                description: z.string(),
                amountPaise: z.number().int(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "manage");
            const snapshot = await ctx.queries.financeCompliance.getPlSnapshot(input.monthKey);
            if (snapshot?.snapshotType === "locked") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Locked months are immutable.",
                });
            }
            const before = input.id
                ? await ctx.queries.financeCompliance.getPlEntryById(input.id)
                : null;
            const row = await ctx.queries.financeCompliance.upsertPlEntry({
                id: input.id,
                monthKey: input.monthKey,
                month: input.monthKey,
                category: input.lineItem,
                lineItem: input.lineItem,
                subLabel: input.subLabel,
                description: input.description,
                amountPaise: input.amountPaise,
                notes: input.notes,
                createdBy: ctx.user.id,
                enteredBy: ctx.user.id,
                enteredAt: new Date(),
                updatedBy: ctx.user.id,
                isLocked: false,
                lockedAt: null,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actionType: "monthly_pl.entry_upserted",
                entityType: "pl_manual_entry",
                entityId: row.id,
                beforeValue: before as any,
                afterValue: row as any,
            });
            return row;
        }),

    refreshMonthlyPl: protectedProcedure
        .input(z.object({ monthKey: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "manage");
            return refreshMonthlyPl(input.monthKey, ctx.user.id);
        }),

    lockPlMonth: protectedProcedure
        .input(z.object({ monthKey: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "monthly_pl", "manage");
            return lockMonthlyPl(input.monthKey, ctx.user.id);
        }),

    unlockPlMonth: protectedProcedure
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
                notes: z.string().optional(),
                userEmail: z.string().email().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await createDeletionRequest({
                userId: ctx.user.id,
                userEmail: input.userEmail ?? ctx.user.email,
                notes: input.notes,
                actorId: ctx.user.id,
            });
            return row;
        }),

    listDataDeletionRequests: protectedProcedure
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "data_deletion", "view");
            return ctx.queries.financeCompliance.listDeletionRequests(input?.status);
        }),

    verifyDataDeletionRequest: publicProcedure
        .input(
            z.object({
                token: z.string().min(8),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return verifyDeletionRequest(input.token, ctx.user?.id ?? null);
        }),

    reviewDataDeletionRequest: adminProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                status: z.enum(["pending", "in_progress", "rejected"]),
                notes: z.string().optional(),
                rejectionReason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "data_deletion", "manage");
            return reviewDeletionRequest({
                requestId: input.id,
                actorId: ctx.user.id,
                status: input.status,
                notes: input.notes,
                rejectionReason: input.rejectionReason,
            });
        }),

    executeDataDeletionRequest: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "data_deletion", "manage");
            return executeDeletionRequest(input.id, ctx.user.id);
        }),

    runDataDeletionSlaSweep: adminProcedure.mutation(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "data_deletion", "manage");
        return runDeletionRequestSlaSweep(ctx.user.id);
    }),

    listLegalContacts: protectedProcedure.query(async ({ ctx }) => {
        await assertFinanceAccess(ctx, "compliance_admin", "view");
        return ctx.queries.financeCompliance.listLegalContacts();
    }),

    upsertLegalContact: adminProcedure
        .input(
            z.object({
                role: z.enum([
                    "gro",
                    "dpo",
                    "nodal_officer",
                    "compliance_officer",
                ]),
                name: z.string(),
                email: z.string().email(),
                phone: z.string().optional(),
                address: z.string().optional(),
                designation: z.string().optional(),
                notes: z.string().optional(),
                effectiveFrom: z.string().optional(),
                isActive: z.boolean().default(true),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await assertFinanceAccess(ctx, "compliance_admin", "manage");
            const previous = await ctx.queries.financeCompliance.getActiveLegalContactByRole(
                input.role
            );
            const row = await ctx.queries.financeCompliance.upsertLegalContact({
                ...input,
                effectiveFrom: input.effectiveFrom,
                updatedBy: ctx.user.id,
            });

            if (input.role === "gro") {
                const legalContent = await ctx.queries.financeCompliance.getLegalContent();
                if (legalContent) {
                    await ctx.queries.financeCompliance.updateLegalContent({
                        grievanceOfficerName: row.name,
                        grievanceOfficerEmail: row.email,
                        grievanceOfficerPhone: row.phone,
                        grievanceOfficerAddress: row.address,
                        isConsumerProtectionPublished: true,
                    });
                } else {
                    await ctx.queries.legal.createLegal({
                        termsOfService: null,
                        privacyPolicy: null,
                        refundPolicy: null,
                        shippingPolicy: null,
                        grievanceOfficerName: row.name,
                        grievanceOfficerEmail: row.email,
                        grievanceOfficerPhone: row.phone,
                        grievanceOfficerAddress: row.address,
                        supportEmail: null,
                        supportPhone: null,
                        dpdpConsentVersion: null,
                        isConsumerProtectionPublished: true,
                    });
                }
                await legalCache.remove();

                await auditAndAlert({
                    actorId: ctx.user.id,
                    actionType: "legal_contact.gro_changed",
                    entityType: "legal_contact",
                    entityId: row.id,
                    beforeValue: previous as any,
                    afterValue: row as any,
                    reason: input.notes ?? "grievance_redressal_officer_updated",
                    title: "Grievance Redressal Officer details changed",
                    message: `GRO details were updated to ${row.name} effective ${row.effectiveFrom}.`,
                    severity: "warning",
                    ownerRole: "aj",
                    type: "gro_contact_updated",
                    dedupeKey: `gro-update:${row.id}:${row.createdAt.toISOString()}`,
                    channels: ["admin", "email"],
                    metadata: {
                        module: "finance_compliance",
                        role: input.role,
                    },
                });
            } else {
                await writeFinanceAuditEvent({
                    actorId: ctx.user.id,
                    actionType: "legal_contact.upserted",
                    entityType: "legal_contact",
                    entityId: row.id,
                    beforeValue: previous as any,
                    afterValue: row as any,
                    metadata: {
                        role: input.role,
                    },
                });
            }
            return row;
        }),

    grantConsent: protectedProcedure
        .input(
            z.object({
                consentType: z.enum([
                    "data_processing",
                    "marketing_emails",
                    "whatsapp_notifications",
                    "analytics_tracking",
                ]),
                consentGiven: z.boolean().default(true),
                source: z.string().default("web"),
                consentVersion: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ipAddress =
                ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
                null;
            const userAgent = ctx.req.headers.get("user-agent");

            return recordConsent({
                userId: ctx.user.id,
                consentType: input.consentType,
                consentGiven: input.consentGiven,
                source: input.source,
                consentVersion: input.consentVersion,
                ipAddress,
                userAgent,
            });
        }),

    getConsentCenterState: protectedProcedure.query(async ({ ctx }) => {
        return listUserConsentState(ctx.user.id);
    }),

    listFinanceAuditModules: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user?.sitePermissions) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "You're not authorized" });
        }
        const canManageMonitoring = hasFinanceAdminAccess({
            sitePermissions: ctx.user.sitePermissions,
            roles: ctx.user.roles ?? [],
        });
        return {
            modules: financeModules,
            canManageMonitoring,
            currentFinancialYear: getFinancialYearForDate(new Date()),
        };
    }),

    listFinanceAuditLogs: protectedProcedure
        .input(
            z.object({
                entityType: z.string().optional(),
                entityId: z.string().optional(),
                actionType: z.string().optional(),
                actorId: z.string().optional(),
                actorType: z.enum(["admin", "system", "brand", "customer"]).optional(),
                from: z.date().optional(),
                to: z.date().optional(),
                q: z.string().optional(),
                attachmentOnly: z.boolean().optional(),
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
