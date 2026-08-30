import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";
import {
    buildPurchaseCompletedEvent,
    capturePurchaseCompleted,
} from "./purchase-events";

const checkout = {
    checkoutId: "intent-123",
    distinctId: "user-123",
    orderIds: ["order-a", "order-b"],
    productIds: ["product-a", "product-b"],
    brandIds: ["brand-a", "brand-b"],
    totalAmountPaise: 12500,
    totalItems: 3,
    paymentMethod: "razorpay" as const,
};

test("builds one allowlisted purchase event for a split checkout", () => {
    expect(buildPurchaseCompletedEvent(checkout)).toEqual({
        event: "purchase_completed",
        distinctId: "user-123",
        properties: {
            $insert_id: "intent-123",
            checkout_id: "intent-123",
            order_ids: ["order-a", "order-b"],
            product_ids: ["product-a", "product-b"],
            brand_ids: ["brand-a", "brand-b"],
            total_amount: 125,
            currency: "INR",
            total_items: 3,
            payment_method: "razorpay",
        },
    });
});

test("purchase capture is failure-isolated", () => {
    expect(() =>
        capturePurchaseCompleted(() => {
            throw new Error("posthog unavailable");
        }, checkout)
    ).not.toThrow();
});

test("client PostHog purchase/add-to-cart events are not reporting sources", async () => {
    const checkoutSource = await readFile(
        new URL(
            "../../app/(protected)/checkout/checkout-content.tsx",
            import.meta.url
        ),
        "utf8"
    );
    const paymentSource = await readFile(
        new URL(
            "../../app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx",
            import.meta.url
        ),
        "utf8"
    );
    const addToCartSource = await readFile(
        new URL("../hooks/useAddToCartTracking.ts", import.meta.url),
        "utf8"
    );
    const cartRouteSource = await readFile(
        new URL("../trpc/routes/general/cart.ts", import.meta.url),
        "utf8"
    );

    expect(checkoutSource).not.toContain(
        "posthog?.capture(POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED"
    );
    expect(paymentSource).not.toContain(
        "posthog?.capture(POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED"
    );
    expect(addToCartSource).not.toContain(
        "posthog?.capture(POSTHOG_EVENTS.COMMERCE.ADD_TO_CART"
    );
    expect(cartRouteSource).toContain("POSTHOG_EVENTS.CART.ADDED");
});
