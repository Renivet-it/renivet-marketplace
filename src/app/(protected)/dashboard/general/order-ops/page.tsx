import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    carrierClaims,
    codReconciliationItems,
    codReconciliationRuns,
    fraudReviews,
    orderOpsStates,
    orders,
    orderShipments,
    rtoDispositions,
} from "@/lib/db/schema";
import { auditEntityChange } from "@/lib/monitoring-sla/audit";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

const pagePath = "/dashboard/general/order-ops";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function asText(value: FormDataEntryValue | null) {
    const text = String(value ?? "").trim();
    return text.length ? text : undefined;
}

function asInt(value: FormDataEntryValue | null) {
    const text = asText(value);
    if (!text) return 0;
    const parsed = Number.parseInt(text, 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function finish(notice: string): never {
    revalidatePath(pagePath);
    redirect(`${pagePath}?notice=${encodeURIComponent(notice)}`);
}

async function assertOrderOpsAccess(manage = false) {
    const { userId } = await auth();
    if (!userId) notFound();

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const allowed = hasPermission(
        permissions,
        [
            BitFieldSitePermission.ADMINISTRATOR,
            manage
                ? BitFieldSitePermission.MANAGE_ORDERS
                : BitFieldSitePermission.VIEW_ORDERS,
        ],
        "any"
    );

    if (!allowed) notFound();
    return userId;
}

async function seedCodFraudQueue() {
    "use server";
    const actorId = await assertOrderOpsAccess(true);
    const fourHoursFromNow = new Date(Date.now() + 4 * HOUR);
    const candidates = await db
        .select({
            id: orders.id,
            totalAmount: orders.totalAmount,
            createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
            and(
                inArray(orders.status, ["pending", "processing"]),
                sql`lower(coalesce(${orders.paymentMethod}, '')) = 'cod'`
            )
        )
        .limit(200);

    for (const order of candidates) {
        await db
            .insert(fraudReviews)
            .values({
                orderId: order.id,
                riskLevel: order.totalAmount > 3000 ? "high" : "medium",
                triggers:
                    order.totalAmount > 3000
                        ? ["cod_order", "aov_over_3000"]
                        : ["cod_order"],
                dueAt: fourHoursFromNow,
            })
            .onConflictDoNothing();

        await db
            .insert(orderOpsStates)
            .values({
                orderId: order.id,
                state: "fraud_review",
                ownerId: actorId,
                reasonCode: "COD_FRAUD_SCREENING",
                dueAt: new Date(order.createdAt.getTime() + 4 * HOUR),
                metadata: { source: "order_ops_console" },
            })
            .onConflictDoNothing();
    }

    finish(`Seeded ${candidates.length} COD fraud review candidates`);
}

async function setLifecycleState(formData: FormData) {
    "use server";
    const actorId = await assertOrderOpsAccess(true);
    const orderId = asText(formData.get("orderId"));
    const state = asText(formData.get("state"));
    if (!orderId || !state) finish("Missing order or state");

    const current = await db.query.orderOpsStates.findFirst({
        where: and(
            eq(orderOpsStates.orderId, orderId),
            eq(orderOpsStates.isCurrent, true)
        ),
    });

    if (current) {
        await db
            .update(orderOpsStates)
            .set({
                isCurrent: false,
                exitedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orderOpsStates.id, current.id));
    }

    await db.insert(orderOpsStates).values({
        orderId,
        state: state as any,
        previousState: current?.state,
        ownerId: actorId,
        reasonCode: asText(formData.get("reasonCode")),
        notes: asText(formData.get("notes")),
    });

    await auditEntityChange({
        actorId,
        actionType: "order_ops_state_changed",
        entityType: "order",
        entityId: orderId,
        beforeValue: current ? { state: current.state } : null,
        afterValue: { state },
        reason: asText(formData.get("reasonCode")),
    });

    finish("Lifecycle state updated");
}

async function decideFraud(formData: FormData) {
    "use server";
    const actorId = await assertOrderOpsAccess(true);
    const orderId = asText(formData.get("orderId"));
    const decision = asText(formData.get("decision"));
    if (!orderId || !decision) finish("Missing fraud decision");

    const reasonCode =
        decision === "fraud" ? "CAN_FRAUD_FLAG" : "FRAUD_VERIFIED";

    await db
        .insert(fraudReviews)
        .values({
            orderId,
            status: decision as "verified" | "fraud",
            riskLevel: decision === "fraud" ? "high" : "low",
            reviewerId: actorId,
            reviewedAt: new Date(),
            decisionReasonCode: reasonCode,
            notes: asText(formData.get("notes")),
        })
        .onConflictDoUpdate({
            target: fraudReviews.orderId,
            set: {
                status: decision as "verified" | "fraud",
                riskLevel: decision === "fraud" ? "high" : "low",
                reviewerId: actorId,
                reviewedAt: new Date(),
                decisionReasonCode: reasonCode,
                notes: asText(formData.get("notes")),
                updatedAt: new Date(),
            },
        });

    if (decision === "fraud") {
        await db
            .update(orders)
            .set({
                status: "cancelled",
                cancellationReasonCode: "CAN_FRAUD_FLAG",
                manualOverrideReason: asText(formData.get("notes")),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));
    }

    await db.insert(orderOpsStates).values({
        orderId,
        state: decision === "fraud" ? "cancelled" : "brand_pending",
        ownerId: actorId,
        reasonCode,
        notes: asText(formData.get("notes")),
    });

    finish("Fraud review saved");
}

async function saveRtoDisposition(formData: FormData) {
    "use server";
    const actorId = await assertOrderOpsAccess(true);
    const orderId = asText(formData.get("orderId"));
    if (!orderId) finish("Missing order ID");
    const now = new Date();

    await db
        .insert(rtoDispositions)
        .values({
            orderId,
            shipmentId: asText(formData.get("shipmentId")) as any,
            status: (asText(formData.get("status")) ?? "pending") as any,
            rtoReason: (asText(formData.get("rtoReason")) ?? "unknown") as any,
            faultOwner: (asText(formData.get("faultOwner")) ??
                "unknown") as any,
            recoveryDecision: (asText(formData.get("recoveryDecision")) ??
                "pending") as any,
            handledBy: actorId,
            customerContactedAt: now,
            dispositionDueAt: new Date(now.getTime() + 7 * DAY),
            notes: asText(formData.get("notes")),
        })
        .onConflictDoUpdate({
            target: rtoDispositions.orderId,
            set: {
                status: (asText(formData.get("status")) ?? "pending") as any,
                rtoReason: (asText(formData.get("rtoReason")) ??
                    "unknown") as any,
                faultOwner: (asText(formData.get("faultOwner")) ??
                    "unknown") as any,
                recoveryDecision: (asText(formData.get("recoveryDecision")) ??
                    "pending") as any,
                handledBy: actorId,
                customerContactedAt: now,
                notes: asText(formData.get("notes")),
                updatedAt: now,
            },
        });

    finish("RTO disposition saved");
}

async function fileCarrierClaim(formData: FormData) {
    "use server";
    const actorId = await assertOrderOpsAccess(true);
    const orderId = asText(formData.get("orderId"));
    if (!orderId) finish("Missing order ID");

    await db.insert(carrierClaims).values({
        orderId,
        shipmentId: asText(formData.get("shipmentId")) as any,
        awbNumber: asText(formData.get("awbNumber")),
        claimType: (asText(formData.get("claimType")) ?? "other") as any,
        status: "filed",
        declaredValue: asInt(formData.get("declaredValue")),
        claimAmount: asInt(formData.get("claimAmount")),
        filedAt: new Date(),
        dueAt: new Date(Date.now() + 45 * DAY),
        filedBy: actorId,
        notes: asText(formData.get("notes")),
    });

    finish("Carrier claim filed");
}

async function createCodRun() {
    "use server";
    const actorId = await assertOrderOpsAccess(true);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const deliveredCod = await db
        .select({
            orderId: orders.id,
            codAmount: orders.totalAmount,
            deliveredAt: orders.updatedAt,
            awbNumber: orderShipments.awbNumber,
        })
        .from(orders)
        .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
        .where(
            and(
                eq(orders.status, "delivered"),
                sql`lower(coalesce(${orders.paymentMethod}, '')) = 'cod'`,
                gte(orders.updatedAt, start),
                lt(orders.updatedAt, end)
            )
        );

    const expectedAmount = deliveredCod.reduce(
        (sum, item) => sum + Number(item.codAmount ?? 0),
        0
    );
    const run = await db
        .insert(codReconciliationRuns)
        .values({
            weekStart: start,
            weekEnd: end,
            status: "in_progress",
            expectedAmount,
            completedBy: actorId,
            notes: "Created from Order Ops console",
        })
        .returning()
        .then((rows) => rows[0]);

    if (deliveredCod.length) {
        await db.insert(codReconciliationItems).values(
            deliveredCod.map((item) => ({
                runId: run.id,
                orderId: item.orderId,
                awbNumber: item.awbNumber,
                deliveredAt: item.deliveredAt,
                codAmount: item.codAmount,
                status: "pending" as const,
            }))
        );
    }

    finish(`COD reconciliation run created with ${deliveredCod.length} orders`);
}

function formatDate(value: Date | string | null | undefined) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(new Date(value));
}

function MetricCard({
    label,
    value,
    sublabel,
}: {
    label: string;
    value: number | string;
    sublabel: string;
}) {
    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">{label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{sublabel}</p>
        </div>
    );
}

export default async function OrderOpsPage({
    searchParams,
}: {
    searchParams?: { notice?: string };
}) {
    await assertOrderOpsAccess();

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const dayAgo = new Date(now.getTime() - DAY);
    const eighteenHoursAgo = new Date(now.getTime() - 18 * HOUR);
    const twoDaysAgo = new Date(now.getTime() - 2 * DAY);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);

    const [
        orders24h,
        ackRisk,
        unack24,
        stuck48,
        rtoInTransit,
        rto7d,
        pendingCodAmount,
        fraudQueue,
        states,
        rtoQueue,
        claims,
        codRuns,
    ] = await Promise.all([
        db.$count(orders, gte(orders.createdAt, today)),
        db.$count(
            orders,
            and(
                inArray(orders.status, ["pending", "processing"]),
                isNull(orders.brandAcknowledgedAt),
                lt(orders.createdAt, eighteenHoursAgo),
                gte(orders.createdAt, dayAgo)
            )
        ),
        db.$count(
            orders,
            and(
                inArray(orders.status, ["pending", "processing"]),
                isNull(orders.brandAcknowledgedAt),
                lt(orders.createdAt, dayAgo)
            )
        ),
        db.$count(
            orders,
            and(
                inArray(orders.status, ["pending", "processing", "shipped"]),
                lt(orders.updatedAt, twoDaysAgo)
            )
        ),
        db.$count(orderShipments, eq(orderShipments.status, "rto_initiated")),
        db.$count(
            rtoDispositions,
            and(
                inArray(rtoDispositions.status, ["pending", "recovering"]),
                lt(rtoDispositions.createdAt, sevenDaysAgo)
            )
        ),
        db
            .select({
                amount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.status, "delivered"),
                    sql`lower(coalesce(${orders.paymentMethod}, '')) = 'cod'`,
                    lt(orders.updatedAt, fourteenDaysAgo)
                )
            )
            .then((rows) => rows[0]?.amount ?? 0),
        db.query.fraudReviews.findMany({
            where: eq(fraudReviews.status, "pending"),
            orderBy: [desc(fraudReviews.createdAt)],
            limit: 20,
            with: { order: true },
        }),
        db.query.orderOpsStates.findMany({
            where: eq(orderOpsStates.isCurrent, true),
            orderBy: [desc(orderOpsStates.enteredAt)],
            limit: 20,
            with: { order: true },
        }),
        db.query.rtoDispositions.findMany({
            where: inArray(rtoDispositions.status, ["pending", "recovering"]),
            orderBy: [desc(rtoDispositions.createdAt)],
            limit: 20,
            with: { shipment: true },
        }),
        db.query.carrierClaims.findMany({
            orderBy: [desc(carrierClaims.createdAt)],
            limit: 20,
        }),
        db.query.codReconciliationRuns.findMany({
            orderBy: [desc(codReconciliationRuns.runDate)],
            limit: 10,
            with: { items: true },
        }),
    ]);

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-950">Order Ops</h1>
                <p className="mt-2 text-slate-600">
                    Chapter 4 control room for fraud review, brand
                    acknowledgement, RTO handling, carrier claims, and COD
                    reconciliation.
                </p>
            </div>

            {searchParams?.notice ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {searchParams.notice}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    label="Orders 24H"
                    value={orders24h}
                    sublabel="Placed since midnight"
                />
                <MetricCard
                    label="Ack Risk 18H"
                    value={ackRisk}
                    sublabel="Brand acknowledgement at risk"
                />
                <MetricCard
                    label="Unack >24H"
                    value={unack24}
                    sublabel="Brand chase required"
                />
                <MetricCard
                    label="Stuck >48H"
                    value={stuck48}
                    sublabel="No order movement"
                />
                <MetricCard
                    label="RTO In Transit"
                    value={rtoInTransit}
                    sublabel="Return to origin moving"
                />
                <MetricCard
                    label="RTO >7D"
                    value={rto7d}
                    sublabel="Disposition overdue"
                />
                <MetricCard
                    label="Pending COD"
                    value={`₹${Number(pendingCodAmount).toLocaleString("en-IN")}`}
                    sublabel="Delivered COD older than 14 days"
                />
                <MetricCard
                    label="Fraud Queue"
                    value={fraudQueue.length}
                    sublabel="Pending screening records"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <form
                    action={seedCodFraudQueue}
                    className="rounded-lg border bg-white p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">COD Fraud Queue</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Adds all active COD orders to fraud review before brand
                        acknowledgement.
                    </p>
                    <button className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        Seed COD Fraud Queue
                    </button>
                </form>

                <form
                    action={createCodRun}
                    className="rounded-lg border bg-white p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">Weekly COD</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Creates the Thursday reconciliation run for delivered
                        COD orders from the last 7 days.
                    </p>
                    <button className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        Create COD Reconciliation Run
                    </button>
                </form>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <form
                    action={setLifecycleState}
                    className="space-y-3 rounded-lg border bg-white p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">
                        Set Lifecycle State
                    </h2>
                    <input
                        name="orderId"
                        placeholder="Order ID"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <select
                        name="state"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        {[
                            "brand_pending",
                            "brand_chased",
                            "brand_acknowledged",
                            "in_production",
                            "ready_to_ship",
                            "shipped",
                            "in_transit",
                            "out_for_delivery",
                            "delivered",
                            "delivery_failed",
                            "rto_in_transit",
                            "rto_delivered",
                            "return_qc",
                            "refunded",
                            "completed",
                        ].map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                    <input
                        name="reasonCode"
                        placeholder="Reason code"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <textarea
                        name="notes"
                        placeholder="Notes"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        Save State
                    </button>
                </form>

                <form
                    action={decideFraud}
                    className="space-y-3 rounded-lg border bg-white p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">Fraud Decision</h2>
                    <input
                        name="orderId"
                        placeholder="Order ID"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <select
                        name="decision"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="verified">
                            Verified, send to brand
                        </option>
                        <option value="fraud">Fraud, cancel order</option>
                    </select>
                    <textarea
                        name="notes"
                        placeholder="Review notes / call outcome"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        Save Fraud Decision
                    </button>
                </form>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <form
                    action={saveRtoDisposition}
                    className="space-y-3 rounded-lg border bg-white p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">RTO Disposition</h2>
                    <input
                        name="orderId"
                        placeholder="Order ID"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <input
                        name="shipmentId"
                        placeholder="Shipment ID optional"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                        <select
                            name="status"
                            className="rounded-md border px-3 py-2 text-sm"
                        >
                            <option value="pending">Pending</option>
                            <option value="recovering">Recovering</option>
                            <option value="reshipped">Reshipped</option>
                            <option value="restocked">Restocked</option>
                            <option value="damaged">Damaged</option>
                            <option value="lost">Lost</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                            name="rtoReason"
                            className="rounded-md border px-3 py-2 text-sm"
                        >
                            <option value="unknown">Unknown</option>
                            <option value="undeliverable_address">
                                Undeliverable address
                            </option>
                            <option value="customer_refused">
                                Customer refused
                            </option>
                            <option value="customer_unavailable">
                                Customer unavailable
                            </option>
                            <option value="carrier_failure">
                                Carrier failure
                            </option>
                            <option value="brand_error">Brand error</option>
                        </select>
                        <select
                            name="faultOwner"
                            className="rounded-md border px-3 py-2 text-sm"
                        >
                            <option value="unknown">Unknown</option>
                            <option value="customer">Customer</option>
                            <option value="carrier">Carrier</option>
                            <option value="brand">Brand</option>
                            <option value="renivet">Renivet</option>
                        </select>
                    </div>
                    <select
                        name="recoveryDecision"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="pending">Pending</option>
                        <option value="reship">Reship</option>
                        <option value="refund">Refund</option>
                        <option value="cancel">Cancel</option>
                        <option value="restock">Restock</option>
                        <option value="claim">File claim</option>
                    </select>
                    <textarea
                        name="notes"
                        placeholder="Customer call / brand disposition notes"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        Save RTO Decision
                    </button>
                </form>

                <form
                    action={fileCarrierClaim}
                    className="space-y-3 rounded-lg border bg-white p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">
                        File Carrier Claim
                    </h2>
                    <input
                        name="orderId"
                        placeholder="Order ID"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <input
                        name="shipmentId"
                        placeholder="Shipment ID optional"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <input
                        name="awbNumber"
                        placeholder="AWB"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <select
                        name="claimType"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="lost">Lost</option>
                        <option value="damaged">Damaged</option>
                        <option value="shortage">Shortage</option>
                        <option value="delay">Delay</option>
                        <option value="other">Other</option>
                    </select>
                    <div className="grid gap-3 md:grid-cols-2">
                        <input
                            name="declaredValue"
                            placeholder="Declared value"
                            className="rounded-md border px-3 py-2 text-sm"
                        />
                        <input
                            name="claimAmount"
                            placeholder="Claim amount"
                            className="rounded-md border px-3 py-2 text-sm"
                        />
                    </div>
                    <textarea
                        name="notes"
                        placeholder="Claim notes"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        File Claim
                    </button>
                </form>
            </div>

            <section className="rounded-lg border bg-white shadow-sm">
                <div className="border-b p-4">
                    <h2 className="text-lg font-semibold">Fraud Queue</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="p-3">Order</th>
                                <th className="p-3">Risk</th>
                                <th className="p-3">Triggers</th>
                                <th className="p-3">Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fraudQueue.map((review) => (
                                <tr key={review.id} className="border-t">
                                    <td className="p-3 font-medium">
                                        {review.orderId}
                                    </td>
                                    <td className="p-3">{review.riskLevel}</td>
                                    <td className="p-3">
                                        {Array.isArray(review.triggers)
                                            ? review.triggers.join(", ")
                                            : "-"}
                                    </td>
                                    <td className="p-3">
                                        {formatDate(review.dueAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-lg border bg-white shadow-sm">
                <div className="border-b p-4">
                    <h2 className="text-lg font-semibold">Current Lifecycle</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="p-3">Order</th>
                                <th className="p-3">State</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Entered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {states.map((state) => (
                                <tr key={state.id} className="border-t">
                                    <td className="p-3 font-medium">
                                        {state.orderId}
                                    </td>
                                    <td className="p-3">{state.state}</td>
                                    <td className="p-3">
                                        {state.reasonCode ?? "-"}
                                    </td>
                                    <td className="p-3">
                                        {formatDate(state.enteredAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-lg border bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-semibold">RTO Queue</h2>
                    <div className="mt-4 space-y-3">
                        {rtoQueue.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-md border p-3"
                            >
                                <p className="font-medium">{item.orderId}</p>
                                <p className="text-sm text-slate-500">
                                    {item.status} · {item.rtoReason} · due{" "}
                                    {formatDate(item.dispositionDueAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-semibold">Carrier Claims</h2>
                    <div className="mt-4 space-y-3">
                        {claims.map((claim) => (
                            <div
                                key={claim.id}
                                className="rounded-md border p-3"
                            >
                                <p className="font-medium">{claim.orderId}</p>
                                <p className="text-sm text-slate-500">
                                    {claim.claimType} · {claim.status} · ₹
                                    {claim.claimAmount.toLocaleString("en-IN")}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-semibold">COD Runs</h2>
                    <div className="mt-4 space-y-3">
                        {codRuns.map((run) => (
                            <div key={run.id} className="rounded-md border p-3">
                                <p className="font-medium">
                                    {formatDate(run.runDate)}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {run.status} · {run.items.length} orders ·
                                    expected ₹
                                    {run.expectedAmount.toLocaleString("en-IN")}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
