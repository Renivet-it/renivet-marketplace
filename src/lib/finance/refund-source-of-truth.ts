export type RefundEventStatus = "pending" | "processed" | "failed";

export function resolveRefundEventStatus(
    current: RefundEventStatus | null | undefined,
    incoming: RefundEventStatus
): RefundEventStatus {
    if (current === "processed" && incoming === "pending") return "processed";
    if (current === "failed" && incoming === "pending") return "failed";
    return incoming;
}

export type RefundEventIdentity =
    | { kind: "gateway_refund"; value: string }
    | { kind: "refund"; value: string }
    | { kind: "payment"; value: string };

export function deriveOrderPaymentStatus(status: RefundEventStatus) {
    if (status === "processed") return "refunded" as const;
    if (status === "failed") return "refund_failed" as const;
    return "refund_pending" as const;
}

export function deriveOrderPaymentStatusFromRefunds(
    statuses: Array<RefundEventStatus | string>
) {
    if (statuses.includes("processed")) return "refunded" as const;
    if (
        statuses.some((status) =>
            ["pending", "awaiting_approval", "awaiting_return", "awaiting_qc"].includes(
                status
            )
        )
    ) {
        return "refund_pending" as const;
    }
    return "refund_failed" as const;
}

export function getRefundEventIdentity(input: {
    gatewayRefundId?: string | null;
    refundId?: string | null;
    paymentId: string;
    orderId: string;
}): RefundEventIdentity {
    if (input.gatewayRefundId?.trim()) {
        return { kind: "gateway_refund", value: input.gatewayRefundId.trim() };
    }

    if (input.refundId?.trim()) {
        return { kind: "refund", value: input.refundId.trim() };
    }

    if (!input.paymentId.trim()) {
        throw new Error(`Refund for order ${input.orderId} requires a payment identity.`);
    }

    return { kind: "payment", value: input.paymentId.trim() };
}

export type RefundReconciliationClassification =
    | "consistent"
    | "missing_refund_row"
    | "refund_status_conflict";

export function classifyRefundReconciliation(input: {
    paymentStatus: string;
    refundCount: number;
    hasProcessedRefund?: boolean;
}): RefundReconciliationClassification {
    if (
        input.refundCount > 0 &&
        input.hasProcessedRefund === true &&
        input.paymentStatus !== "refunded"
    ) {
        return "refund_status_conflict";
    }

    if (input.paymentStatus === "refunded" && input.refundCount === 0) {
        return "missing_refund_row";
    }

    if (
        input.paymentStatus === "refunded" &&
        input.refundCount > 0 &&
        input.hasProcessedRefund === false
    ) {
        return "refund_status_conflict";
    }

    return "consistent";
}
