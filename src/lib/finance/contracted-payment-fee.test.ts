import { describe, expect, test } from "bun:test";
import { calculateContractedPaymentFeePaise } from "./contracted-payment-fee";

describe("REN-210 contracted Payment Fee", () => {
    test("uses the ₹20 minimum at the boundary", () => {
        expect(calculateContractedPaymentFeePaise(99_999)).toBe(2_000);
        expect(calculateContractedPaymentFeePaise(100_000)).toBe(2_000);
        expect(calculateContractedPaymentFeePaise(100_001)).toBe(2_000);
    });

    test("uses 2% above the minimum", () => {
        expect(calculateContractedPaymentFeePaise(200_000)).toBe(4_000);
    });

    test("does not create a fee for invalid or zero totals", () => {
        expect(calculateContractedPaymentFeePaise(0)).toBe(0);
        expect(calculateContractedPaymentFeePaise(-1)).toBe(0);
        expect(calculateContractedPaymentFeePaise(Number.NaN)).toBe(0);
    });
});
