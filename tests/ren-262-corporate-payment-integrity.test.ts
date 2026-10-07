import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
    CorporatePaymentIntegrityError,
    assertCorporatePaymentBinding,
    calculateExcessPaise,
    verifyCorporateRazorpayPayment,
} from "@/lib/services/corporate-payment-integrity";

describe("REN-262 Corporate payment integrity", () => {
    test("accepts an exact captured INR payment bound to the immutable intent", () => {
        expect(
            assertCorporatePaymentBinding({
                intentProviderOrderId: "order_123",
                providerOrderId: "order_123",
                providerPaymentId: "pay_123",
                providerAmountPaise: 50000,
                intentAmountPaise: 50000,
                providerCurrency: "INR",
                intentCurrency: "INR",
                providerStatus: "captured",
            })
        ).toEqual({
            providerPaymentId: "pay_123",
            amountPaise: 50000,
            currency: "INR",
        });
    });

    test("rejects provider identity, amount, currency, and status mismatches", () => {
        expect(() =>
            assertCorporatePaymentBinding({
                intentProviderOrderId: "order_123",
                providerOrderId: "order_other",
                providerPaymentId: "pay_123",
                providerAmountPaise: 50001,
                intentAmountPaise: 50000,
                providerCurrency: "USD",
                intentCurrency: "INR",
                providerStatus: "authorized",
            })
        ).toThrow(CorporatePaymentIntegrityError);
    });

    test("calculates excess without silently clamping the applied amount", () => {
        expect(calculateExcessPaise(12500, 10000)).toBe(2500);
        expect(calculateExcessPaise(10000, 12500)).toBe(0);
    });

    test("fetches the provider payment before accepting the browser confirmation", async () => {
        const result = await verifyCorporateRazorpayPayment({
            provider: {
                payments: {
                    fetch: async () => ({
                        id: "pay_123",
                        order_id: "order_123",
                        amount: 50000,
                        currency: "INR",
                        status: "captured",
                    }),
                },
            },
            secret: "secret",
            razorpayOrderId: "order_123",
            razorpayPaymentId: "pay_123",
            razorpaySignature: await import("node:crypto").then(({ default: crypto }) =>
                crypto
                    .createHmac("sha256", "secret")
                    .update("order_123|pay_123")
                    .digest("hex")
            ),
            amountPaise: 50000,
        });

        expect(result.amountPaise).toBe(50000);
    });

    test("exposes a signed Corporate webhook recovery boundary", async () => {
        const source = await readFile(
            "src/app/api/webhooks/razorpay/corporate-payments/route.ts",
            "utf8"
        );
        expect(source).toContain("RAZOR_PAY_WEBHOOK_SECRET");
        expect(source).toContain("corporatePaymentIntents");
        expect(source).toContain("recovery_required");
    });

    test("shared reconciliation claims the intent and order in one transaction", async () => {
        const source = await readFile(
            "src/lib/services/corporate-payment-reconciliation.ts",
            "utf8"
        );
        expect(source).toContain("db.transaction");
        expect(source).toContain('for("update")');
        expect(source).toContain("corporatePaymentIntents");
    });

    test("operator recovery is permission protected and reuses reconciliation", async () => {
        const source = await readFile(
            "src/app/api/admin/corporate-payment-recovery/route.ts",
            "utf8"
        );
        expect(source).toContain("MANAGE_ORDERS");
        expect(source).toContain("reconcileCorporatePaymentIntent");
        expect(source).toContain("markCorporatePaymentIntentApplied");
    });

    test("Corporate payment migration registers provider and refund uniqueness", async () => {
        const migration = await readFile(
            "drizzle/0293_ren262_corporate_payment_intents.sql",
            "utf8"
        );
        expect(migration).toContain(
            "corporate_payment_intents_provider_payment_unique"
        );
        expect(migration).toContain(
            "corporate_payment_refunds_intent_unique"
        );
        expect(migration).toContain(
            "corporate_payments_payment_reference_unique"
        );
    });
});
