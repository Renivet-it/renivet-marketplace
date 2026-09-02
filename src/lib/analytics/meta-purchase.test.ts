import { expect, test } from "bun:test";
import {
    buildMetaPurchasePayload,
    buildMetaPurchaseTrackingEvent,
    isCompleteMetaPurchaseOrder,
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
