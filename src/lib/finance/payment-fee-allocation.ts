export type RtoFaultOwner = "customer" | "carrier" | "brand" | "renivet" | "unknown";

export function resolvePaymentFeeOutcome(input: {
    isRto: boolean;
    faultOwner?: RtoFaultOwner | null;
}) {
    if (!input.isRto) {
        return {
            shipmentType: "forward" as const,
            chargedTo: "brand" as const,
            brandChargeable: true,
            faultOwner: null,
        };
    }

    const faultOwner = input.faultOwner ?? "unknown";
    return {
        shipmentType: "rto" as const,
        chargedTo: faultOwner === "brand" ? ("brand" as const) : ("renivet" as const),
        brandChargeable: faultOwner === "brand",
        faultOwner,
    };
}

export function describePaymentFeeOutcome(outcome: ReturnType<typeof resolvePaymentFeeOutcome>) {
    if (outcome.shipmentType === "forward") return "Payment fee (Forward)";
    const fault = outcome.faultOwner === "unknown" ? "unresolved" : outcome.faultOwner;
    return outcome.brandChargeable
        ? `Payment fee (RTO — brand-chargeable, fault: ${fault})`
        : `Payment fee (RTO — absorbed by Renivet, fault: ${fault})`;
}
