import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";

// Single guarded path for RTO fault-owner writes (AQ-61). The payout cycle uses
// the RTO disposition and its faultOwner to decide who bears the payment fee, so
// every writer (return-replace, order-ops router, order-ops page) applies the same
// payout lock, notes rule and finance audit.

export type RtoAttributionCheck =
    | { ok: true }
    | { ok: false; code: "CONFLICT" | "BAD_REQUEST"; message: string };

export function rtoFaultOwnerChanges(input: {
    existing: { faultOwner: string | null } | null | undefined;
    nextFaultOwner: string;
}) {
    return !input.existing || input.existing.faultOwner !== input.nextFaultOwner;
}

export async function checkRtoAttributionWritable(input: {
    orderId: string;
    rtoId?: string | null;
    previousFaultOwner?: string | null;
    nextFaultOwner: string;
    notes?: string | null;
}): Promise<RtoAttributionCheck> {
    const lockedCycle = await financeComplianceQueries.findLockedPayoutCycleForReferences(
        [input.rtoId ?? "", input.orderId]
    );
    if (lockedCycle) {
        return {
            ok: false,
            code: "CONFLICT",
            message: "RTO attribution is locked because this case is in an approved payout cycle.",
        };
    }
    if (
        input.previousFaultOwner &&
        input.previousFaultOwner !== input.nextFaultOwner &&
        !input.notes?.trim()
    ) {
        return {
            ok: false,
            code: "BAD_REQUEST",
            message: "Notes are required when reclassifying RTO attribution.",
        };
    }
    return { ok: true };
}

export async function recordRtoAttributionAudit(input: {
    actorId: string;
    rtoId: string;
    before: { faultOwner: string | null; notes: string | null } | null;
    after: { faultOwner: string; notes: string | null };
    reason?: string | null;
}) {
    return writeFinanceAuditEvent({
        actorId: input.actorId,
        actorType: "admin",
        actionType: "rto_attribution_set",
        entityType: "rto_disposition",
        entityId: input.rtoId,
        reason: input.reason,
        beforeValue: input.before,
        afterValue: input.after,
    });
}
