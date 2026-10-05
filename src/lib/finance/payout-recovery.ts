// Provider outcome classification and cross-cycle paid-ness for payouts (REN-253 N-2).
//
// A provider call has exactly one of these outcomes, and none of them may be inferred from
// the success or failure of the bookkeeping (audit, alert, TDS ledger, persistence) that
// follows it:
//   accepted  - the provider answered 2xx with a payout id: money movement is recorded
//   rejected  - the provider answered 4xx: it refused the request, nothing was paid
//   unknown   - a network error, timeout, 5xx or an unreadable/identity-less 2xx: the
//               payout may or may not exist; it is unresolved and must not be re-sent
// Provider-side idempotency behaviour is UNVERIFIED and is not relied on here.

export class PayoutProviderRejectedError extends Error {
    constructor(readonly status: number) {
        super(`Razorpay payout rejected with ${status}.`);
        this.name = "PayoutProviderRejectedError";
    }
}

export class PayoutProviderUnknownOutcomeError extends Error {
    constructor(readonly reason: string) {
        super(`Razorpay payout outcome is unknown: ${reason}.`);
        this.name = "PayoutProviderUnknownOutcomeError";
    }
}

// The provider accepted the payout but the local record of that fact could not be written.
// The brand stays in its durable pre-call `processing` state (unresolved); nothing is
// recorded as failed and nothing is retried.
export class PayoutPersistenceAfterAcceptanceError extends Error {
    constructor(
        readonly cycleId: string,
        readonly brandId: string,
        readonly transactionId: string
    ) {
        super(
            `Payout accepted by the provider (transaction ${transactionId}) but the local record could not be written for brand ${brandId} in cycle ${cycleId}; the payout is unresolved and must be reconciled before any further execution.`
        );
        this.name = "PayoutPersistenceAfterAcceptanceError";
    }
}

// A cycle write lost a race: the cycle is no longer in the state or basis the caller read.
export class PayoutCycleConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PayoutCycleConflictError";
    }
}

export type PriorBrandPayoutEntry = {
    brandId: string;
    executionStatus?: string | null;
    transactionId?: string | null;
    metadata?: Record<string, unknown> | null;
    lineItems?: Array<{ lineType: string; referenceId?: string | null }> | null;
};

export type PriorPayoutClass = "paid" | "in_flight" | "unresolved" | "none";

// What a brand entry in ANOTHER cycle means for paying the same orders again. Read from the
// persisted summary, independently of the other cycle's own status or payout date.
export function classifyPriorBrandPayout(entry: PriorBrandPayoutEntry): PriorPayoutClass {
    const outcome = entry.metadata?.providerOutcome;
    const status = entry.executionStatus ?? "";
    if (entry.transactionId || status === "completed") return "paid";
    if (status === "processing" && outcome === "unknown") return "unresolved";
    if (["processing", "submitted", "awaiting_manual_confirmation"].includes(status)) {
        return "in_flight";
    }
    // A failed brand is released only when the provider definitely rejected the request.
    // A failure with no recorded rejection (older records, unknown cause) stays unresolved.
    if (status === "failed") return outcome === "rejected" ? "none" : "unresolved";
    return "none";
}

const PRIOR_CLASS_RANK: Record<PriorPayoutClass, number> = {
    none: 0,
    in_flight: 1,
    unresolved: 2,
    paid: 3,
};

export function priorPayoutDiagnostic(klass: Exclude<PriorPayoutClass, "none">) {
    if (klass === "paid") {
        return { disposition: "excluded" as const, reason: "prior_cycle_settled" };
    }
    if (klass === "in_flight") {
        return { disposition: "excluded" as const, reason: "prior_payout_in_flight" };
    }
    return { disposition: "held" as const, reason: "prior_payout_unresolved" };
}

// Map `${brandId}:${orderId}` -> the strongest prior class of any other cycle that holds a
// sale line for that brand and order.
export function findPriorPayoutBlocks(
    cycles: Array<{
        id: string;
        calculationSummary?: Record<string, unknown> | null;
    }>,
    currentCycleId: string
) {
    const blocks = new Map<string, Exclude<PriorPayoutClass, "none">>();
    for (const other of cycles) {
        if (other.id === currentCycleId) continue;
        const brands = ((other.calculationSummary as { brands?: PriorBrandPayoutEntry[] } | null)
            ?.brands ?? []) as PriorBrandPayoutEntry[];
        for (const entry of brands) {
            const klass = classifyPriorBrandPayout(entry);
            if (klass === "none") continue;
            for (const line of entry.lineItems ?? []) {
                if (line.lineType !== "sale" || !line.referenceId) continue;
                const key = `${entry.brandId}:${line.referenceId}`;
                const existing = blocks.get(key);
                if (!existing || PRIOR_CLASS_RANK[klass] > PRIOR_CLASS_RANK[existing]) {
                    blocks.set(key, klass);
                }
            }
        }
    }
    return blocks;
}
