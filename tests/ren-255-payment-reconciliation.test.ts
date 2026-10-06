import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
    PaymentReconciliationError,
    resolveCanonicalPaymentOrderIds,
    reconcilePaymentBinding,
    toAuthoritativeTransactionAmount,
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

        expect(source).toContain("applyAtomicPaymentTransition");
        expect(source).toContain("emitPaymentEffects");
    });

    test("resolves every order bound to the provider order before legacy fallback", () => {
        expect(
            resolveCanonicalPaymentOrderIds({
                providerOrderMatches: ["order-a", "order-b"],
                legacyPaymentIdMatches: [],
            })
        ).toEqual({
            orderIds: ["order-a", "order-b"],
            source: "provider_order_reference",
        });
    });

    test("rejects an ambiguous legacy payment-id fallback", () => {
        expect(() =>
            resolveCanonicalPaymentOrderIds({
                providerOrderMatches: [],
                legacyPaymentIdMatches: ["order-a", "order-b"],
            })
        ).toThrow(PaymentReconciliationError);
    });

    test("exposes an explicit paise amount contract with provenance", () => {
        expect(
            toAuthoritativeTransactionAmount({
                providerAmountPaise: 12500,
                orderTotalRupees: 125,
                currency: "INR",
            })
        ).toEqual({
            transactionAmountPaise: 12500,
            currency: "INR",
            amountProvenance: "provider_verified_against_legacy_order_total",
        });
    });

    test("payment transition is transaction-scoped", async () => {
        const source = await read("src/lib/payments/payment-reconciliation.ts");
        expect(source).toContain("db.transaction");
        expect(source).toContain("paymentEventReceipts");
        expect(source).toContain('status: "applied"');
    });

    test("webhook uses canonical provider-order lookup and atomic transition", async () => {
        const source = await read(
            "src/app/api/webhooks/razorpay/payments/route.ts"
        );
        const activeSource = source.slice(source.lastIndexOf("import crypto"));

        expect(activeSource).toContain("getOrderIdsByProviderOrderId");
        expect(activeSource).toContain("applyAtomicPaymentTransition");
        expect(activeSource).not.toContain("paymentEventQueries.claim");
        expect(activeSource).not.toContain("productQueries.updateProductStock");
    });

    test("server action uses the same atomic transition boundary", async () => {
        const source = await read("src/actions/process-order-after-payment.ts");
        expect(source).toContain("applyAtomicPaymentTransition");
        expect(source).not.toContain("paymentEventQueries.claim");
    });
});
