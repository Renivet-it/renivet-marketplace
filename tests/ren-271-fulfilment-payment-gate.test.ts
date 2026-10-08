import { expect, test } from "bun:test";
import { assertCorporateFulfilmentPaymentGate } from "../src/lib/services/corporate-fulfilment-integrity";

test("REN-271 blocks fulfilment issuance until Corporate payment is paid", () => {
    expect(() =>
        assertCorporateFulfilmentPaymentGate({ paymentStatus: "pending" })
    ).toThrow("payment");
    expect(
        assertCorporateFulfilmentPaymentGate({ paymentStatus: "paid" })
    ).toBe(true);
});
