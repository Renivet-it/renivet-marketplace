import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";
import {
    buildMetaPurchasePayload,
    buildMetaPurchaseTrackingEvent,
    isCompleteMetaPurchaseOrder,
    trackMetaPurchase,
} from "./meta-purchase";

test("builds one full-order Meta Purchase payload in rupees", () => {
    expect(
        buildMetaPurchasePayload({
            totalAmountPaise: 12500,
            items: [
                { productId: "product-a", quantity: 2 },
                { productId: "product-b", quantity: 1 },
            ],
        })
    ).toEqual({
        value: 125,
        currency: "INR",
        content_type: "product",
        content_ids: ["product-a", "product-b"],
        num_items: 3,
    });
});

test("preserves zero value for a reward Purchase", () => {
    expect(
        buildMetaPurchasePayload({
            totalAmountPaise: 0,
            items: [{ productId: "reward-product", quantity: 1 }],
        }).value
    ).toBe(0);
});

test("only considers a fully-created order eligible for Purchase", () => {
    expect(isCompleteMetaPurchaseOrder(2, 2)).toBe(true);
    expect(isCompleteMetaPurchaseOrder(1, 2)).toBe(false);
    expect(isCompleteMetaPurchaseOrder(0, 2)).toBe(false);
});

test("uses the completed database orders for a repeatable full-order event id", () => {
    expect(
        buildMetaPurchaseTrackingEvent({
            completedOrderIds: ["order-b", "order-a"],
            totalAmountPaise: 12500,
            items: [{ productId: "product-a", quantity: 1 }],
        })
    ).toEqual({
        eventId: "purchase:order-a:order-b",
        purchasePayload: {
            value: 125,
            currency: "INR",
            content_type: "product",
            content_ids: ["product-a"],
            num_items: 1,
            order_id: "purchase:order-a:order-b",
        },
    });
});

test("sends one paired Pixel and CAPI Purchase with the same event id and payload", () => {
    const pixelCalls: any[][] = [];
    const capiCalls: any[][] = [];
    const userData = {
        em: "shopper@example.org",
        ph: "919876543210",
        external_id: "user-123",
    };

    trackMetaPurchase(
        {
            completedOrderIds: ["order-b", "order-a"],
            totalAmountPaise: 12500,
            items: [
                { productId: "product-a", quantity: 2 },
                { productId: "product-b", quantity: 1 },
            ],
            userData,
            sourceUrl: "https://renivet.com/checkout",
        },
        {
            sendPixel: (...args: any[]) => pixelCalls.push(args),
            sendCapi: (...args: any[]) => {
                capiCalls.push(args);
                return Promise.resolve();
            },
            reportError: () => undefined,
        }
    );

    const expectedPayload = {
        value: 125,
        currency: "INR",
        content_type: "product",
        content_ids: ["product-a", "product-b"],
        num_items: 3,
        order_id: "purchase:order-a:order-b",
    };
    expect(pixelCalls).toEqual([
        ["Purchase", expectedPayload, { eventId: "purchase:order-a:order-b" }],
    ]);
    expect(capiCalls).toEqual([
        [
            "purchase:order-a:order-b",
            userData,
            expectedPayload,
            "https://renivet.com/checkout",
        ],
    ]);
});

test("skips Meta Purchase when no completed order ids exist", () => {
    const calls: string[] = [];
    trackMetaPurchase(
        {
            completedOrderIds: [],
            totalAmountPaise: 5000,
            items: [{ productId: "product-a", quantity: 1 }],
            userData: {},
            sourceUrl: "https://renivet.com/checkout",
        },
        {
            sendPixel: () => calls.push("pixel"),
            sendCapi: () => {
                calls.push("capi");
                return Promise.resolve();
            },
            reportError: (message: string) => calls.push(message),
        }
    );

    expect(calls).toEqual([
        "Skipping Meta Purchase without completed order IDs",
    ]);
});

test("still attempts CAPI when Pixel throws", () => {
    const calls: string[] = [];
    expect(() =>
        trackMetaPurchase(
            {
                completedOrderIds: ["order-a"],
                totalAmountPaise: 5000,
                items: [{ productId: "product-a", quantity: 1 }],
                userData: {},
                sourceUrl: "https://renivet.com/checkout",
            },
            {
                sendPixel: () => {
                    calls.push("pixel");
                    throw new Error("pixel unavailable");
                },
                sendCapi: () => {
                    calls.push("capi");
                    return Promise.resolve();
                },
                reportError: (message: string) => calls.push(message),
            }
        )
    ).not.toThrow();

    expect(calls).toEqual(["pixel", "Meta Pixel Purchase Error", "capi"]);
});

test("isolates an asynchronous CAPI rejection", async () => {
    const errors: string[] = [];
    trackMetaPurchase(
        {
            completedOrderIds: ["order-a"],
            totalAmountPaise: 5000,
            items: [{ productId: "product-a", quantity: 1 }],
            userData: {},
            sourceUrl: "https://renivet.com/checkout",
        },
        {
            sendPixel: () => undefined,
            sendCapi: () => Promise.reject(new Error("capi unavailable")),
            reportError: (message: string) => errors.push(message),
        }
    );

    await Promise.resolve();
    expect(errors).toEqual(["CAPI Purchase Error"]);
});

test("both checkout flows delegate Purchase transport to the shared tracker", async () => {
    const sources = await Promise.all([
        readFile(
            new URL(
                "../../app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx",
                import.meta.url
            ),
            "utf8"
        ),
        readFile(
            new URL(
                "../../app/(protected)/checkout/checkout-content.tsx",
                import.meta.url
            ),
            "utf8"
        ),
    ]);

    for (const source of sources) {
        expect(source).toContain(
            'import { trackMetaPurchase } from "@/lib/analytics/meta-purchase"'
        );
        expect(source).not.toContain('fbEvent("Purchase"');
        expect(source).not.toContain("trackPurchaseCapi(");
    }
});
