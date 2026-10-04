import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
    PaymentReconciliationError,
    reconcilePaymentBinding,
} from "@/lib/payments/payment-reconciliation";

describe("REN-255 payment reconciliation", () => {
    const read = (path: string) => readFile(path, "utf8");

    test("accepts a matching server binding and normalizes the provider amount to paise", () => {
        expect(
            reconcilePaymentBinding({
                providerOrderId: "rzp_order_1",
                expectedProviderOrderId: "rzp_order_1",
                providerPaymentId: "pay_1",
                expectedPaymentId: null,
                providerAmountPaise: 12500,
                expectedAmountPaise: 12500,
                providerCurrency: "INR",
                expectedCurrency: "INR",
            })
        ).toEqual({
            providerOrderId: "rzp_order_1",
            providerPaymentId: "pay_1",
            amountPaise: 12500,
            currency: "INR",
        });
    });

    test("rejects a missing or mismatched provider identity", () => {
        expect(() =>
            reconcilePaymentBinding({
                providerOrderId: "rzp_order_other",
                expectedProviderOrderId: "rzp_order_1",
                providerPaymentId: "pay_1",
                expectedPaymentId: null,
                providerAmountPaise: 12500,
                expectedAmountPaise: 12500,
                providerCurrency: "INR",
                expectedCurrency: "INR",
            })
        ).toThrow(PaymentReconciliationError);
    });

    test("rejects an amount or currency mismatch before payment can be applied", () => {
        expect(() =>
            reconcilePaymentBinding({
                providerOrderId: "rzp_order_1",
                expectedProviderOrderId: "rzp_order_1",
                providerPaymentId: "pay_1",
                expectedPaymentId: null,
                providerAmountPaise: 12400,
                expectedAmountPaise: 12500,
                providerCurrency: "USD",
                expectedCurrency: "INR",
            })
        ).toThrow(PaymentReconciliationError);
    });

    test("rejects a payment ID that conflicts with the server binding", () => {
        expect(() =>
            reconcilePaymentBinding({
                providerOrderId: "rzp_order_1",
                expectedProviderOrderId: "rzp_order_1",
                providerPaymentId: "pay_2",
                expectedPaymentId: "pay_1",
                providerAmountPaise: 12500,
                expectedAmountPaise: 12500,
                providerCurrency: "INR",
                expectedCurrency: "INR",
            })
        ).toThrow(PaymentReconciliationError);
    });

    test("payment webhook claims the event before stock and side effects", async () => {
        const source = await read("src/app/api/webhooks/razorpay/payments/route.ts");

        expect(source).toContain("paymentEventQueries.claim");
        expect(source.lastIndexOf("paymentEventQueries.claim")).toBeLessThan(
            source.lastIndexOf("productQueries.updateProductStock")
        );
        expect(source).toContain("if (!eventClaim.claimed)");
    });
});
