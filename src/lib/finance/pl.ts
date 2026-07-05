import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

function getMonthRange(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

export async function buildMonthlyPl(monthKey: string) {
    const { start, end } = getMonthRange(monthKey);
    const [orders, manualSummary, codRows] = await Promise.all([
        financeComplianceQueries.listOrdersForFinanceWindow({ start, end }),
        financeComplianceQueries.getPlSummary(monthKey),
        financeComplianceQueries.listCodReconciliation(),
    ]);

    const refundRows = await financeComplianceQueries.listRecentRefundsForOrderIds(
        orders.map((order) => order.id)
    );

    const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
    const revenuePaise = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const refundsPaise = refundRows.reduce((sum, refund) => sum + refund.amount, 0);
    const codShortfallPaise = codRows
        .filter((row) => ["short", "missing"].includes(row.status))
        .reduce((sum, row) => sum + Math.abs(row.discrepancyAmountPaise), 0);
    const razorpayFeesPaise = Math.round(revenuePaise * 0.02);
    const delhiveryInvoicePaise = paidOrders
        .filter((order) => order.shipments.some((shipment) => shipment.awbNumber))
        .reduce((sum, order) => sum + order.deliveryAmount, 0);
    const shiprocketInvoicePaise = paidOrders
        .filter((order) => order.shipments.some((shipment) => shipment.shiprocketShipmentId))
        .reduce((sum, order) => sum + order.deliveryAmount, 0);
    const manualExpensePaise = manualSummary.manualExpensePaise;

    return {
        monthKey,
        revenuePaise,
        refundsPaise,
        codShortfallPaise,
        razorpayFeesPaise,
        delhiveryInvoicePaise,
        shiprocketInvoicePaise,
        manualExpensePaise,
        netContributionPaise:
            revenuePaise -
            refundsPaise -
            codShortfallPaise -
            razorpayFeesPaise -
            delhiveryInvoicePaise -
            shiprocketInvoicePaise -
            manualExpensePaise,
        sources: {
            ordersCount: orders.length,
            refundCount: refundRows.length,
            codRows: codRows.length,
            generatedAt: new Date().toISOString(),
        },
    };
}

export async function lockMonthlyPl(monthKey: string, actorId: string) {
    const snapshot = await buildMonthlyPl(monthKey);
    const row = await financeComplianceQueries.upsertPlSnapshot({
        monthKey,
        snapshotType: "locked",
        summary: snapshot,
        lockedBy: actorId,
        lockedAt: new Date(),
        unlockedBy: null,
        unlockedAt: null,
        unlockReason: null,
    });

    await auditAndAlert({
        actorId,
        actionType: "monthly_pl_locked",
        entityType: "pl_snapshot",
        entityId: row.id,
        afterValue: row as Record<string, unknown>,
        reason: "monthly_pl_locked",
        title: "Monthly P&L locked",
        message: `Month ${monthKey} has been locked for finance close.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "monthly_pl_locked",
        dedupeKey: `pl:lock:${monthKey}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return row;
}

export async function unlockMonthlyPl(monthKey: string, actorId: string, reason: string) {
    const existing = await financeComplianceQueries.getPlSnapshot(monthKey);
    const row = await financeComplianceQueries.upsertPlSnapshot({
        monthKey,
        snapshotType: existing?.snapshotType ?? "locked",
        summary: existing?.summary ?? {},
        lockedBy: existing?.lockedBy ?? null,
        lockedAt: existing?.lockedAt ?? null,
        unlockedBy: actorId,
        unlockedAt: new Date(),
        unlockReason: reason,
        fileUrl: existing?.fileUrl ?? null,
    });

    await auditAndAlert({
        actorId,
        actionType: "monthly_pl_unlocked",
        entityType: "pl_snapshot",
        entityId: row.id,
        beforeValue: existing as Record<string, unknown> | null,
        afterValue: row as Record<string, unknown>,
        reason,
        title: "Monthly P&L unlocked",
        message: `Month ${monthKey} has been unlocked.`,
        severity: "warning",
        ownerRole: "finance_admin",
        type: "monthly_pl_unlocked",
        dedupeKey: `pl:unlock:${monthKey}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return row;
}
