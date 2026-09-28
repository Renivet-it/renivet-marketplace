import { describe, expect, test } from "bun:test";
import { describePaymentFeeOutcome, resolvePaymentFeeOutcome } from "./payment-fee-allocation";

describe("payment fee allocation", () => {
    test("charges forward fees to the brand", () => {
        const outcome = resolvePaymentFeeOutcome({ isRto: false });
        expect(outcome.brandChargeable).toBe(true);
        expect(describePaymentFeeOutcome(outcome)).toBe("Payment fee (Forward)");
    });

    test("charges only brand-fault RTO fees to the brand", () => {
        expect(resolvePaymentFeeOutcome({ isRto: true, faultOwner: "brand" }).chargedTo).toBe("brand");
        for (const faultOwner of ["customer", "carrier", "renivet", "unknown", null, undefined] as const) {
            const outcome = resolvePaymentFeeOutcome({ isRto: true, faultOwner });
            expect(outcome.chargedTo).toBe("renivet");
            expect(describePaymentFeeOutcome(outcome)).toContain("absorbed by Renivet");
        }
    });

    test("never uses a customer reason as a chargeability input", () => {
        expect(resolvePaymentFeeOutcome({ isRto: true }).faultOwner).toBe("unknown");
    });
});
