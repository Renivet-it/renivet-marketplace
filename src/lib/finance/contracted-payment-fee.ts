const MINIMUM_PAYMENT_FEE_PAISE = 2_000;
const PAYMENT_FEE_BPS = 200;

/** Terra Luna's confirmed contractual Payment Fee: max(2% of order total, ₹20). */
export function calculateContractedPaymentFeePaise(orderTotalPaise: number) {
    if (!Number.isFinite(orderTotalPaise) || orderTotalPaise <= 0) return 0;
    return Math.max(
        MINIMUM_PAYMENT_FEE_PAISE,
        Math.round((orderTotalPaise * PAYMENT_FEE_BPS) / 10_000)
    );
}

export const CONTRACTED_PAYMENT_FEE_METADATA = {
    formula: "max(2% of order total, INR 20)",
    basis: "order_total",
    chargeability: "forward_and_reverse_rto",
    sourceStatus: "internally_confirmed",
    approver: "Akshay",
    agreementReference: "Terra Luna Annexure 4 / BIZ-14",
} as const;
