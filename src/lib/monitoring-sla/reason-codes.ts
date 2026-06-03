export const refundReasonCodes = [
    "RTN_QUALITY",
    "RTN_NOT_AS_DESC",
    "RTN_DAMAGED_TRANSIT",
    "RTN_WRONG_ITEM",
    "RTN_SIZE_FIT",
    "RTN_CHANGE_MIND",
    "RTN_LATE_DELIVERY",
    "RTN_NEVER_DELIVERED",
    "RTN_GOODWILL",
    "RTN_DUPLICATE",
    "RTN_FRAUD",
] as const;

export const cancellationReasonCodes = [
    "CAN_BRAND_STOCKOUT",
    "CAN_BRAND_NO_RESPONSE",
    "CAN_CUSTOMER_REQUEST",
    "CAN_FRAUD_FLAG",
    "CAN_PAYMENT_FAILED",
    "CAN_LOGISTICS_UNAVAILABLE",
    "CAN_DUPLICATE_ORDER",
    "CAN_OTHER",
] as const;

export const brandStatusReasonCodes = [
    "BRD_ACTIVATED",
    "BRD_PAUSED_REQUEST",
    "BRD_PAUSED_NON_RESPONSE",
    "BRD_PAUSED_QUALITY",
    "BRD_OFFBOARDED_AMICABLE",
    "BRD_OFFBOARDED_BREACH",
    "BRD_OFFBOARDED_NO_SALES",
] as const;

export type RefundReasonCode = (typeof refundReasonCodes)[number];
export type CancellationReasonCode = (typeof cancellationReasonCodes)[number];
export type BrandStatusReasonCode = (typeof brandStatusReasonCodes)[number];

export function isRefundReasonCode(value: string | null | undefined) {
    return refundReasonCodes.includes(value as RefundReasonCode);
}

export function isCancellationReasonCode(value: string | null | undefined) {
    return cancellationReasonCodes.includes(value as CancellationReasonCode);
}

export function isBrandStatusReasonCode(value: string | null | undefined) {
    return brandStatusReasonCodes.includes(value as BrandStatusReasonCode);
}
