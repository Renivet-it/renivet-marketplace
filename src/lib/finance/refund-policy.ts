export type RefundCostAllocation =
    | "brand_fault"
    | "customer_fault"
    | "renivet_fault"
    | "carrier_fault";

export type RefundReturnShippingPayer = "renivet" | "customer" | "na";

export type RefundQcStatus = "pending" | "passed" | "failed" | "na";

function normalizeReasonText(value: string | null | undefined) {
    return (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function inferRefundCostAllocationFromReason(input: {
    reasonName?: string | null;
    parentReasonName?: string | null;
}) {
    const combined = `${normalizeReasonText(input.parentReasonName)} ${normalizeReasonText(
        input.reasonName
    )}`.trim();

    if (
        /(wrong item|different product|wrong color|wrong size|wrong quantity|someone else s order|quality|used|refurbished|stitching|finish|material feels cheap|not as described|defect|defective|performance|functionality)/.test(
            combined
        )
    ) {
        return "brand_fault" satisfies RefundCostAllocation;
    }

    if (/(size fit|too small|too large|size chart|tight uncomfortable|changed mind)/.test(combined)) {
        return "customer_fault" satisfies RefundCostAllocation;
    }

    if (/(catalog|system glitch|pricing glitch|listing error)/.test(combined)) {
        return "renivet_fault" satisfies RefundCostAllocation;
    }

    if (/(damaged|broken during transit|seal was broken|packaging was damaged|lost|not delivered|transit)/.test(combined)) {
        return "carrier_fault" satisfies RefundCostAllocation;
    }

    return null;
}

export function getReturnShippingPaidBy(costAllocation: RefundCostAllocation) {
    switch (costAllocation) {
        case "customer_fault":
            return "customer" satisfies RefundReturnShippingPayer;
        case "carrier_fault":
            return "na" satisfies RefundReturnShippingPayer;
        default:
            return "renivet" satisfies RefundReturnShippingPayer;
    }
}

export function requiresNotesForCostAllocation(costAllocation: RefundCostAllocation) {
    return costAllocation === "renivet_fault" || costAllocation === "carrier_fault";
}

export function requiresReversePickup(costAllocation: RefundCostAllocation) {
    return costAllocation === "brand_fault" || costAllocation === "renivet_fault";
}

export function requiresPhysicalReturn(costAllocation: RefundCostAllocation) {
    return costAllocation !== "carrier_fault";
}

export function getDefaultQcStatus(costAllocation: RefundCostAllocation): RefundQcStatus {
    return costAllocation === "carrier_fault" ? "na" : "pending";
}

export function getAwaitingStatus(costAllocation: RefundCostAllocation) {
    return costAllocation === "carrier_fault" ? "pending" : "awaiting_return";
}

export function isLateWindowExceptionAllowed(costAllocation: RefundCostAllocation) {
    return costAllocation === "brand_fault" || costAllocation === "carrier_fault";
}
