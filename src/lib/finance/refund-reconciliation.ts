import { classifyRefundReconciliation } from "./refund-source-of-truth";

export type RefundReconciliationRow = {
    id: string;
    status: string;
};

export function getClearedReconciliationDedupeKeys(
    activeDedupeKeys: string[],
    currentDedupeKeys: string[]
) {
    const current = new Set(currentDedupeKeys);
    return activeDedupeKeys.filter((key) => !current.has(key));
}

export function summarizeRefundReconciliation(input: {
    orderId: string;
    paymentStatus: string;
    refunds: RefundReconciliationRow[];
}) {
    const classification = classifyRefundReconciliation({
        paymentStatus: input.paymentStatus,
        refundCount: input.refunds.length,
        hasProcessedRefund: input.refunds.some(
            (refund) => refund.status === "processed"
        ),
    });

    return {
        orderId: input.orderId,
        classification,
        refundIds: input.refunds.map((refund) => refund.id),
        repair: "manual_review_required" as const,
    };
}

export async function runRefundReconciliation(input?: {
    actorId?: string | null;
    orderIds?: string[];
}) {
    const [{ refundQueries, monitoringSlaQueries }, { createOperationalAlert }] =
        await Promise.all([
            import("@/lib/db/queries"),
            import("@/lib/monitoring-sla/audit"),
        ]);
    const rows = await refundQueries.listRefundReconciliationRows(
        input?.orderIds
    );
    const grouped = new Map<
        string,
        { orderId: string; paymentStatus: string; refunds: RefundReconciliationRow[] }
    >();

    for (const row of rows) {
        const current = grouped.get(row.orderId) ?? {
            orderId: row.orderId,
            paymentStatus: row.paymentStatus,
            refunds: [],
        };
        if (row.refundId) {
            current.refunds.push({
                id: row.refundId,
                status: row.refundStatus ?? "unknown",
            });
        }
        grouped.set(row.orderId, current);
    }

    const results = [...grouped.values()].map(summarizeRefundReconciliation);
    const mismatches = results.filter(
        (result) => result.classification !== "consistent"
    );

    await Promise.all(
        mismatches.map((mismatch) =>
            createOperationalAlert({
                actorId: input?.actorId,
                type: "refund_source_of_truth_mismatch",
                severity: "critical",
                entityType: "order",
                entityId: mismatch.orderId,
                title: "Refund source-of-truth mismatch",
                message: `Order ${mismatch.orderId} is ${mismatch.classification}; manual review is required.`,
                ownerRole: "finance_admin",
                dedupeKey: `refund:source-of-truth:${mismatch.orderId}`,
                channels: ["admin", "email"],
                metadata: {
                    classification: mismatch.classification,
                    refundIds: mismatch.refundIds,
                    repair: mismatch.repair,
                },
            })
        )
    );

    await monitoringSlaQueries.resolveOpenAlertsByDedupePrefix({
        prefix: "refund:source-of-truth:",
        activeDedupeKeys: mismatches.map(
            (mismatch) => `refund:source-of-truth:${mismatch.orderId}`
        ),
        actorId: input?.actorId,
    });

    return { results, mismatches };
}
