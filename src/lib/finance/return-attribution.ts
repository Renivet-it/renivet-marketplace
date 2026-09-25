export type PayoutCycleStatus =
    | "draft"
    | "calculated"
    | "approved"
    | "processing"
    | "completed"
    | "failed";

export type ReturnCostAllocation =
    | "brand_fault"
    | "customer_fault"
    | "renivet_fault"
    | "carrier_fault";

export function requiresReturnAttributionNotes(input: {
    previous: string | null | undefined;
    next: string;
}) {
    return Boolean(input.previous && input.previous !== input.next);
}

export function isPayoutAttributionLocked(status: PayoutCycleStatus) {
    return ["approved", "processing", "completed"].includes(status);
}

export function payoutLineItemReferencesCase(
    lineItem: { referenceId: string | null; orderId: string },
    caseReferenceId: string
) {
    return lineItem.referenceId === caseReferenceId ||
        (!lineItem.referenceId && lineItem.orderId === caseReferenceId);
}

export function buildReturnAttributionUpdate(input: {
    previous: ReturnCostAllocation | null | undefined;
    next: ReturnCostAllocation;
    notes?: string | null;
}) {
    if (requiresReturnAttributionNotes(input) && !input.notes?.trim()) {
        throw new Error("Notes are required when reclassifying attribution.");
    }

    if ((input.next === "renivet_fault" || input.next === "carrier_fault") && !input.notes?.trim()) {
        throw new Error("Notes are required for renivet_fault and carrier_fault attribution.");
    }

    return {
        costAllocation: input.next,
        policyBucket: input.next,
        notes: input.notes?.trim() || null,
    };
}
