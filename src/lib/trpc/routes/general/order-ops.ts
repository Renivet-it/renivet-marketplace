import { BitFieldSitePermission } from "@/config/permissions";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
import { executeOrderCancellation } from "@/lib/support/cancel-order-helper";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const orderOpsStateSchema = z.enum([
    "placed",
    "payment_pending",
    "confirmed",
    "failed",
    "fraud_review",
    "brand_pending",
    "cancelled",
    "brand_acknowledged",
    "brand_chased",
    "auto_cancelled",
    "in_production",
    "ready_to_ship",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
    "rto_in_transit",
    "rto_delivered",
    "return_requested",
    "return_approved",
    "return_pickup_scheduled",
    "return_in_transit",
    "return_qc",
    "refunded",
    "return_disputed",
    "completed",
]);

function normalizeBlocklistValue(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function weekWindow(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
}

async function ensureOrder(ctx: any, orderId: string) {
    const order = await ctx.db.query.orders.findFirst({
        where: eq(ctx.schemas.orders.id, orderId),
    });
    if (!order)
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
        });
    return order;
}

async function setOrderOpsState({
    ctx,
    orderId,
    state,
    actorId,
    reasonCode,
    notes,
    dueAt,
    metadata,
}: {
    ctx: any;
    orderId: string;
    state: z.infer<typeof orderOpsStateSchema>;
    actorId?: string | null;
    reasonCode?: string | null;
    notes?: string | null;
    dueAt?: Date | null;
    metadata?: Record<string, unknown>;
}) {
    const current = await ctx.db.query.orderOpsStates.findFirst({
        where: and(
            eq(ctx.schemas.orderOpsStates.orderId, orderId),
            eq(ctx.schemas.orderOpsStates.isCurrent, true)
        ),
    });

    if (current?.state === state) return current;

    if (state === "cancelled" || state === "auto_cancelled") {
        await executeOrderCancellation({
            orderId,
            actorId: actorId ?? "system",
            reasonCode: reasonCode ?? "STATE_TRANSITION_CANCEL",
            notes: notes ?? "Cancelled via Order Ops transition",
        });
    }

    if (current) {
        await ctx.db
            .update(ctx.schemas.orderOpsStates)
            .set({
                isCurrent: false,
                exitedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(ctx.schemas.orderOpsStates.id, current.id));
    }

    const inserted = await ctx.db
        .insert(ctx.schemas.orderOpsStates)
        .values({
            orderId,
            state,
            previousState: current?.state ?? null,
            ownerId: actorId ?? null,
            reasonCode,
            notes,
            dueAt,
            metadata: metadata ?? {},
        })
        .returning()
        .then((rows: any[]) => rows[0]);

    await auditEntityChange({
        actorId,
        actionType: "order_ops_state_changed",
        entityType: "order",
        entityId: orderId,
        beforeValue: current ? { state: current.state } : null,
        afterValue: { state, reasonCode, dueAt },
        reason: reasonCode ?? notes,
        metadata: metadata ?? {},
    });

    return inserted;
}

export const orderOpsRouter = createTRPCRouter({
    getDashboard: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(async ({ ctx }) => {
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const fourHoursAgo = new Date(now.getTime() - 4 * HOUR);
            const eighteenHoursAgo = new Date(now.getTime() - 18 * HOUR);
            const dayAgo = new Date(now.getTime() - DAY);
            const twoDaysAgo = new Date(now.getTime() - 2 * DAY);
            const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);
            const week = weekWindow(now);

            const [
                fraudQueue,
                rtoQueue,
                carrierClaims,
                codRuns,
                currentStates,
                metricsRows,
                topRtoBrands,
            ] = await Promise.all([
                ctx.db.query.fraudReviews.findMany({
                    where: eq(ctx.schemas.fraudReviews.status, "pending"),
                    orderBy: [desc(ctx.schemas.fraudReviews.createdAt)],
                    limit: 25,
                    with: { order: true },
                }),
                ctx.db.query.rtoDispositions.findMany({
                    where: inArray(ctx.schemas.rtoDispositions.status, [
                        "pending",
                        "recovering",
                    ]),
                    orderBy: [desc(ctx.schemas.rtoDispositions.createdAt)],
                    limit: 25,
                    with: { order: true, shipment: true },
                }),
                ctx.db.query.carrierClaims.findMany({
                    where: inArray(ctx.schemas.carrierClaims.status, [
                        "draft",
                        "filed",
                        "in_review",
                    ]),
                    orderBy: [desc(ctx.schemas.carrierClaims.createdAt)],
                    limit: 25,
                }),
                ctx.db.query.codReconciliationRuns.findMany({
                    orderBy: [desc(ctx.schemas.codReconciliationRuns.runDate)],
                    limit: 10,
                    with: { items: true },
                }),
                ctx.db.query.orderOpsStates.findMany({
                    where: eq(ctx.schemas.orderOpsStates.isCurrent, true),
                    orderBy: [desc(ctx.schemas.orderOpsStates.enteredAt)],
                    limit: 25,
                    with: { order: true },
                }),
                ctx.db
                    .select({
                        orders24h: sql<number>`count(*) filter (where ${ctx.schemas.orders.createdAt} >= ${today})`,
                        brandAckRisk18h: sql<number>`count(*) filter (where ${ctx.schemas.orders.status} in ('pending','processing') and ${ctx.schemas.orders.brandAcknowledgedAt} is null and ${ctx.schemas.orders.createdAt} < ${eighteenHoursAgo} and ${ctx.schemas.orders.createdAt} >= ${dayAgo})`,
                        brandAckBreached24h: sql<number>`count(*) filter (where ${ctx.schemas.orders.status} in ('pending','processing') and ${ctx.schemas.orders.brandAcknowledgedAt} is null and ${ctx.schemas.orders.createdAt} < ${dayAgo})`,
                        fraudQueueOver4h: sql<number>`count(*) filter (where lower(coalesce(${ctx.schemas.orders.paymentMethod}, '')) = 'cod' and ${ctx.schemas.orders.status} in ('pending','processing') and ${ctx.schemas.orders.createdAt} < ${fourHoursAgo})`,
                        stuckOrders48h: sql<number>`count(*) filter (where ${ctx.schemas.orders.status} in ('pending','processing','shipped') and ${ctx.schemas.orders.updatedAt} < ${twoDaysAgo})`,
                        deliveredToday: sql<number>`count(*) filter (where ${ctx.schemas.orders.status} = 'delivered' and ${ctx.schemas.orders.updatedAt} >= ${today})`,
                        pendingCodAmount: sql<number>`coalesce(sum(${ctx.schemas.orders.totalAmount}) filter (where ${ctx.schemas.orders.status} = 'delivered' and lower(coalesce(${ctx.schemas.orders.paymentMethod}, '')) = 'cod' and ${ctx.schemas.orders.updatedAt} < ${fourteenDaysAgo}), 0)`,
                    })
                    .from(ctx.schemas.orders)
                    .then((rows: any[]) => rows[0]),
                ctx.db
                    .select({
                        brandId: ctx.schemas.orderShipments.brandId,
                        rtoCount: sql<number>`count(*)`,
                    })
                    .from(ctx.schemas.orderShipments)
                    .where(
                        and(
                            inArray(ctx.schemas.orderShipments.status, [
                                "rto_initiated",
                                "rto_delivered",
                            ]),
                            gte(
                                ctx.schemas.orderShipments.updatedAt,
                                week.start
                            )
                        )
                    )
                    .groupBy(ctx.schemas.orderShipments.brandId)
                    .orderBy(sql`count(*) desc`)
                    .limit(5),
            ]);

            const rtoInTransit = await ctx.db.$count(
                ctx.schemas.orderShipments,
                eq(ctx.schemas.orderShipments.status, "rto_initiated")
            );
            const rtoPending7d = await ctx.db.$count(
                ctx.schemas.rtoDispositions,
                and(
                    inArray(ctx.schemas.rtoDispositions.status, [
                        "pending",
                        "recovering",
                    ]),
                    lt(ctx.schemas.rtoDispositions.createdAt, sevenDaysAgo)
                )
            );
            const failedDeliveryToday = await ctx.db.$count(
                ctx.schemas.orderShipments,
                and(
                    eq(ctx.schemas.orderShipments.status, "failed"),
                    gte(ctx.schemas.orderShipments.updatedAt, today)
                )
            );
            const codMissing30d = await ctx.db.$count(
                ctx.schemas.codReconciliationItems,
                and(
                    inArray(ctx.schemas.codReconciliationItems.status, [
                        "missing",
                        "disputed",
                    ]),
                    lt(
                        ctx.schemas.codReconciliationItems.updatedAt,
                        fourteenDaysAgo
                    )
                )
            );

            return {
                metrics: {
                    ...(metricsRows ?? {}),
                    rtoInTransit,
                    rtoPending7d,
                    failedDeliveryToday,
                    codMissing30d,
                },
                fraudQueue,
                rtoQueue,
                carrierClaims,
                codRuns,
                currentStates,
                topRtoBrands,
            };
        }),

    syncOrder: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            const order = await ensureOrder(ctx, input.orderId);
            const isCod = order.paymentMethod?.toLowerCase() === "cod";
            const state =
                order.status === "cancelled"
                    ? "cancelled"
                    : order.status === "delivered"
                      ? "delivered"
                      : order.status === "shipped"
                        ? "shipped"
                        : isCod
                          ? "fraud_review"
                          : order.brandAcknowledgedAt
                            ? "brand_acknowledged"
                            : "brand_pending";

            await setOrderOpsState({
                ctx,
                orderId: order.id,
                state,
                actorId: ctx.user.id,
                reasonCode: "manual_sync",
                metadata: { paymentMethod: order.paymentMethod },
            });

            if (isCod) {
                await ctx.db
                    .insert(ctx.schemas.fraudReviews)
                    .values({
                        orderId: order.id,
                        riskLevel: order.totalAmount > 3000 ? "high" : "medium",
                        triggers:
                            order.totalAmount > 3000
                                ? ["cod_order", "aov_over_3000"]
                                : ["cod_order"],
                        dueAt: new Date(order.createdAt.getTime() + 4 * HOUR),
                    })
                    .onConflictDoNothing();
            }

            return { success: true, state };
        }),

    setState: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                state: orderOpsStateSchema,
                reasonCode: z.string().optional(),
                notes: z.string().optional(),
                dueAt: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            await ensureOrder(ctx, input.orderId);
            const state = await setOrderOpsState({
                ctx,
                orderId: input.orderId,
                state: input.state,
                actorId: ctx.user.id,
                reasonCode: input.reasonCode,
                notes: input.notes,
                dueAt: input.dueAt ? new Date(input.dueAt) : null,
            });
            return state;
        }),

    decideFraudReview: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                decision: z.enum(["verified", "fraud"]),
                riskLevel: z.enum(["low", "medium", "high"]).optional(),
                notes: z.string().optional(),
                blocklistPhone: z.string().optional(),
                blocklistAddress: z.string().optional(),
                blocklistPincode: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            const order = await ensureOrder(ctx, input.orderId);
            const status = input.decision;
            const reasonCode =
                input.decision === "fraud"
                    ? "CAN_FRAUD_FLAG"
                    : "FRAUD_VERIFIED";

            const review = await ctx.db
                .insert(ctx.schemas.fraudReviews)
                .values({
                    orderId: input.orderId,
                    status,
                    riskLevel:
                        input.riskLevel ??
                        (status === "fraud" ? "high" : "low"),
                    reviewerId: ctx.user.id,
                    reviewedAt: new Date(),
                    decisionReasonCode: reasonCode,
                    notes: input.notes,
                    dueAt: new Date(order.createdAt.getTime() + 4 * HOUR),
                })
                .onConflictDoUpdate({
                    target: ctx.schemas.fraudReviews.orderId,
                    set: {
                        status,
                        riskLevel:
                            input.riskLevel ??
                            (status === "fraud" ? "high" : "low"),
                        reviewerId: ctx.user.id,
                        reviewedAt: new Date(),
                        decisionReasonCode: reasonCode,
                        notes: input.notes,
                        updatedAt: new Date(),
                    },
                })
                .returning()
                .then((rows: any[]) => rows[0]);

            if (status === "fraud") {
                await executeOrderCancellation({
                    orderId: input.orderId,
                    actorId: ctx.user.id,
                    reasonCode: "CAN_FRAUD_FLAG",
                    notes: input.notes,
                });
                for (const [type, value] of [
                    ["phone", input.blocklistPhone],
                    ["address", input.blocklistAddress],
                    ["pincode", input.blocklistPincode],
                ] as const) {
                    if (!value?.trim()) continue;
                    await ctx.db
                        .insert(ctx.schemas.fraudBlocklist)
                        .values({
                            type,
                            value: normalizeBlocklistValue(value),
                            reason: input.notes ?? "Confirmed fraud order",
                            severity: "block",
                            addedBy: ctx.user.id,
                            metadata: { orderId: input.orderId },
                        })
                        .onConflictDoUpdate({
                            target: [
                                ctx.schemas.fraudBlocklist.type,
                                ctx.schemas.fraudBlocklist.value,
                            ],
                            set: {
                                reason: input.notes ?? "Confirmed fraud order",
                                severity: "block",
                                updatedAt: new Date(),
                            },
                        });
                }
            }

            await setOrderOpsState({
                ctx,
                orderId: input.orderId,
                state: status === "fraud" ? "cancelled" : "brand_pending",
                actorId: ctx.user.id,
                reasonCode,
                notes: input.notes,
            });

            await createOperationalAlert({
                actorId: ctx.user.id,
                entityType: "order",
                entityId: input.orderId,
                type:
                    status === "fraud"
                        ? "order_fraud_cancelled"
                        : "order_fraud_verified",
                severity: status === "fraud" ? "critical" : "info",
                ownerRole: "order_manager",
                title:
                    status === "fraud"
                        ? "COD fraud order cancelled"
                        : "COD fraud review cleared",
                message:
                    status === "fraud"
                        ? `Order ${input.orderId} was cancelled with CAN_FRAUD_FLAG.`
                        : `Order ${input.orderId} passed fraud review and can go to brand acknowledgement.`,
                dedupeKey: `order:fraud-decision:${input.orderId}:${status}`,
                metadata: { reasonCode, reviewId: review?.id },
            });

            return review;
        }),

    upsertRtoDisposition: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                shipmentId: z.string().uuid().optional(),
                status: z.enum([
                    "pending",
                    "recovering",
                    "reshipped",
                    "restocked",
                    "damaged",
                    "lost",
                    "refunded",
                    "cancelled",
                ]),
                rtoReason: z.enum([
                    "undeliverable_address",
                    "customer_refused",
                    "customer_unavailable",
                    "carrier_failure",
                    "brand_error",
                    "unknown",
                ]),
                faultOwner: z.enum([
                    "customer",
                    "carrier",
                    "brand",
                    "renivet",
                    "unknown",
                ]),
                recoveryDecision: z.enum([
                    "reship",
                    "refund",
                    "cancel",
                    "restock",
                    "claim",
                    "pending",
                ]),
                notes: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            await ensureOrder(ctx, input.orderId);
            const now = new Date();
            const disposition = await ctx.db
                .insert(ctx.schemas.rtoDispositions)
                .values({
                    ...input,
                    handledBy: ctx.user.id,
                    customerContactedAt: now,
                    dispositionDueAt: new Date(now.getTime() + 7 * DAY),
                    dispositionAt:
                        input.status === "pending" ||
                        input.status === "recovering"
                            ? null
                            : now,
                })
                .onConflictDoUpdate({
                    target: ctx.schemas.rtoDispositions.orderId,
                    set: {
                        shipmentId: input.shipmentId,
                        status: input.status,
                        rtoReason: input.rtoReason,
                        faultOwner: input.faultOwner,
                        recoveryDecision: input.recoveryDecision,
                        notes: input.notes,
                        handledBy: ctx.user.id,
                        customerContactedAt: now,
                        dispositionAt:
                            input.status === "pending" ||
                            input.status === "recovering"
                                ? null
                                : now,
                        updatedAt: now,
                    },
                })
                .returning()
                .then((rows: any[]) => rows[0]);

            await setOrderOpsState({
                ctx,
                orderId: input.orderId,
                state:
                    input.status === "reshipped"
                        ? "ready_to_ship"
                        : input.status === "refunded"
                          ? "refunded"
                          : input.status === "cancelled"
                            ? "cancelled"
                            : "rto_delivered",
                actorId: ctx.user.id,
                reasonCode: `RTO_${input.recoveryDecision.toUpperCase()}`,
                notes: input.notes,
            });

            return disposition;
        }),

    fileCarrierClaim: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                shipmentId: z.string().uuid().optional(),
                brandId: z.string().uuid().optional(),
                awbNumber: z.string().optional(),
                claimType: z.enum([
                    "lost",
                    "damaged",
                    "shortage",
                    "delay",
                    "other",
                ]),
                declaredValue: z.number().int().nonnegative().default(0),
                claimAmount: z.number().int().nonnegative().default(0),
                notes: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            await ensureOrder(ctx, input.orderId);
            const now = new Date();
            const claim = await ctx.db
                .insert(ctx.schemas.carrierClaims)
                .values({
                    ...input,
                    status: "filed",
                    filedAt: now,
                    dueAt: new Date(now.getTime() + 45 * DAY),
                    filedBy: ctx.user.id,
                })
                .returning()
                .then((rows: any[]) => rows[0]);

            await createOperationalAlert({
                actorId: ctx.user.id,
                entityType: "carrier_claim",
                entityId: claim.id,
                type: "carrier_claim_filed",
                severity: "warning",
                ownerRole: "order_manager",
                title: "Carrier claim filed",
                message: `Carrier claim for order ${input.orderId} is due within 45 days.`,
                dedupeKey: `carrier-claim:filed:${claim.id}`,
                metadata: {
                    orderId: input.orderId,
                    claimType: input.claimType,
                },
            });

            return claim;
        }),

    updateCarrierClaim: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                status: z.enum([
                    "draft",
                    "filed",
                    "in_review",
                    "approved",
                    "rejected",
                    "settled",
                ]),
                approvedAmount: z.number().int().nonnegative().optional(),
                notes: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            const claim = await ctx.db
                .update(ctx.schemas.carrierClaims)
                .set({
                    status: input.status,
                    approvedAmount: input.approvedAmount,
                    notes: input.notes,
                    settledAt:
                        input.status === "settled" ? new Date() : undefined,
                    updatedAt: new Date(),
                })
                .where(eq(ctx.schemas.carrierClaims.id, input.id))
                .returning()
                .then((rows: any[]) => rows[0]);
            if (!claim)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Carrier claim not found",
                });
            return claim;
        }),

    createCodReconciliationRun: protectedProcedure
        .input(
            z.object({
                weekStart: z.string().optional(),
                weekEnd: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            const window =
                input.weekStart && input.weekEnd
                    ? {
                          start: new Date(input.weekStart),
                          end: new Date(input.weekEnd),
                      }
                    : weekWindow();

            const deliveredCodOrders = await ctx.db
                .select({
                    orderId: ctx.schemas.orders.id,
                    codAmount: ctx.schemas.orders.totalAmount,
                    deliveredAt: ctx.schemas.orders.updatedAt,
                    awbNumber: ctx.schemas.orderShipments.awbNumber,
                })
                .from(ctx.schemas.orders)
                .leftJoin(
                    ctx.schemas.orderShipments,
                    eq(
                        ctx.schemas.orderShipments.orderId,
                        ctx.schemas.orders.id
                    )
                )
                .where(
                    and(
                        eq(ctx.schemas.orders.status, "delivered"),
                        sql`lower(coalesce(${ctx.schemas.orders.paymentMethod}, '')) = 'cod'`,
                        gte(ctx.schemas.orders.updatedAt, window.start),
                        lt(ctx.schemas.orders.updatedAt, window.end)
                    )
                );

            const expectedAmount = deliveredCodOrders.reduce(
                (sum: number, row: any) => sum + Number(row.codAmount ?? 0),
                0
            );

            const run = await ctx.db
                .insert(ctx.schemas.codReconciliationRuns)
                .values({
                    weekStart: window.start,
                    weekEnd: window.end,
                    status: "in_progress",
                    expectedAmount,
                    notes: input.notes,
                })
                .returning()
                .then((rows: any[]) => rows[0]);

            if (deliveredCodOrders.length) {
                for (const row of deliveredCodOrders) {
                    await ctx.db
                        .insert(ctx.schemas.codReconciliationItems)
                        .values({
                            runId: run.id,
                            orderId: row.orderId,
                            awbNumber: row.awbNumber,
                            deliveredAt: row.deliveredAt,
                            codAmount: row.codAmount,
                            status: "pending",
                        });
                }
            }

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "cod_reconciliation_run_created",
                entityType: "cod_reconciliation_run",
                entityId: run.id,
                afterValue: {
                    expectedAmount,
                    itemCount: deliveredCodOrders.length,
                },
                reason: "weekly_thursday_reconciliation",
            });

            return run;
        }),

    updateCodItem: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                remittedAmount: z.number().int().nonnegative(),
                status: z.enum([
                    "pending",
                    "matched",
                    "short_paid",
                    "excess_paid",
                    "missing",
                    "disputed",
                ]),
                remittanceReference: z.string().optional(),
                varianceReason: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db
                .update(ctx.schemas.codReconciliationItems)
                .set({
                    remittedAmount: input.remittedAmount,
                    status: input.status,
                    remittanceReference: input.remittanceReference,
                    varianceReason: input.varianceReason,
                    notes: input.notes,
                    updatedAt: new Date(),
                })
                .where(eq(ctx.schemas.codReconciliationItems.id, input.id))
                .returning()
                .then((rows: any[]) => rows[0]);
            if (!item)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "COD reconciliation item not found",
                });

            const totals = await ctx.db
                .select({
                    expectedAmount: sql<number>`coalesce(sum(${ctx.schemas.codReconciliationItems.codAmount}), 0)`,
                    remittedAmount: sql<number>`coalesce(sum(${ctx.schemas.codReconciliationItems.remittedAmount}), 0)`,
                })
                .from(ctx.schemas.codReconciliationItems)
                .where(eq(ctx.schemas.codReconciliationItems.runId, item.runId))
                .then((rows: any[]) => rows[0]);

            await ctx.db
                .update(ctx.schemas.codReconciliationRuns)
                .set({
                    expectedAmount: totals?.expectedAmount ?? 0,
                    remittedAmount: totals?.remittedAmount ?? 0,
                    varianceAmount:
                        (totals?.remittedAmount ?? 0) -
                        (totals?.expectedAmount ?? 0),
                    updatedAt: new Date(),
                })
                .where(eq(ctx.schemas.codReconciliationRuns.id, item.runId));

            return item;
        }),

    completeCodRun: protectedProcedure
        .input(
            z.object({ id: z.string().uuid(), notes: z.string().optional() })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            const openItems = await ctx.db.$count(
                ctx.schemas.codReconciliationItems,
                and(
                    eq(ctx.schemas.codReconciliationItems.runId, input.id),
                    inArray(ctx.schemas.codReconciliationItems.status, [
                        "pending",
                        "missing",
                        "disputed",
                    ])
                )
            );

            const run = await ctx.db
                .update(ctx.schemas.codReconciliationRuns)
                .set({
                    status: openItems > 0 ? "escalated" : "completed",
                    completedAt: new Date(),
                    completedBy: ctx.user.id,
                    notes: input.notes,
                    updatedAt: new Date(),
                })
                .where(eq(ctx.schemas.codReconciliationRuns.id, input.id))
                .returning()
                .then((rows: any[]) => rows[0]);
            if (!run)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "COD reconciliation run not found",
                });

            return run;
        }),

    recordCommunication: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                channel: z.enum(["phone", "whatsapp", "email", "admin_note"]),
                templateKey: z.string().optional(),
                subject: z.string().optional(),
                message: z.string().min(1),
                direction: z
                    .enum(["outbound", "inbound", "internal"])
                    .default("outbound"),
                recipient: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .mutation(async ({ ctx, input }) => {
            await ensureOrder(ctx, input.orderId);
            const row = await ctx.db
                .insert(ctx.schemas.orderOpsCommunications)
                .values({
                    ...input,
                    sentBy: ctx.user.id,
                })
                .returning()
                .then((rows: any[]) => rows[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "order_ops_communication_recorded",
                entityType: "order",
                entityId: input.orderId,
                afterValue: {
                    channel: input.channel,
                    templateKey: input.templateKey,
                    direction: input.direction,
                },
                reason: input.templateKey ?? "manual_order_ops_contact",
            });
            return row;
        }),
});
