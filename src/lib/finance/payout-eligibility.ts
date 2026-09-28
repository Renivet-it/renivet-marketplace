export type PayoutOrder = {
    id: string;
    paymentStatus?: string | null;
    paymentId?: string | null;
    paymentMethod?: string | null;
    shipments?: Array<{
        status?: string | null;
        updatedAt?: Date | string | null;
    }>;
};

export type PayoutEligibility =
    | { disposition: "eligible" }
    | {
          disposition: "excluded" | "held";
          reason:
              | "payment_not_confirmed"
              | "cod_reconciliation_pending"
              | "prior_cycle_settled";
      };

function toDate(value?: Date | string | null) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getDeliveredAt(order: Pick<PayoutOrder, "shipments">) {
    const deliveredShipment = order.shipments?.find(
        (shipment) => shipment.status === "delivered"
    );
    return toDate(deliveredShipment?.updatedAt);
}

export function isWithinPayoutWindow(
    deliveredAt: Date | null,
    start: Date,
    end: Date
) {
    if (!deliveredAt) return false;
    return deliveredAt >= start && deliveredAt <= end;
}

function isReconciliationHoldPaymentMethod(paymentMethod?: string | null) {
    const normalized = paymentMethod?.trim().toLowerCase() ?? "";
    return (
        normalized.includes("cod") ||
        normalized.includes("cash") ||
        normalized.includes("split") ||
        normalized.includes("partial")
    );
}

export function evaluatePayoutEligibility(
    order: Pick<
        PayoutOrder,
        "id" | "paymentStatus" | "paymentId" | "paymentMethod"
    >,
    settledOrderIds: ReadonlySet<string> = new Set(),
    ambiguousPaymentIds: ReadonlySet<string> = new Set()
): PayoutEligibility {
    if (settledOrderIds.has(order.id)) {
        return { disposition: "excluded", reason: "prior_cycle_settled" };
    }

    if (
        isReconciliationHoldPaymentMethod(order.paymentMethod) ||
        (!!order.paymentId && ambiguousPaymentIds.has(order.paymentId))
    ) {
        return {
            disposition: "held",
            reason: "cod_reconciliation_pending",
        };
    }

    if (order.paymentStatus !== "paid" || !order.paymentId?.trim()) {
        return { disposition: "excluded", reason: "payment_not_confirmed" };
    }

    return { disposition: "eligible" };
}
