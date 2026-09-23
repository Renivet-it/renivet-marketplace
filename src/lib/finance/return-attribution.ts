export type PayoutCycleStatus =
    | "draft"
    | "calculated"
    | "approved"
    | "processing"
    | "completed"
    | "failed";

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
