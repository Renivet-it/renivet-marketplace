import { expect, test } from "bun:test";
import {
    buildMetaPurchasePayload,
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

test("only considers a full brand-split order eligible for Purchase", () => {
    expect(isCompleteMetaPurchaseOrder(2, 2)).toBe(true);
    expect(isCompleteMetaPurchaseOrder(1, 2)).toBe(false);
    expect(isCompleteMetaPurchaseOrder(0, 2)).toBe(false);
});

test("both checkout implementations have one full-order Purchase dispatch", async () => {
    const checkoutSource = await Bun.file(
        new URL(
            "../../app/(protected)/checkout/checkout-content.tsx",
            import.meta.url
        )
    ).text();
    const paymentSource = await Bun.file(
        new URL(
            "../../app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx",
            import.meta.url
        )
    ).text();

    for (const source of [checkoutSource, paymentSource]) {
        expect(source.match(/fbEvent\("Purchase"/g)?.length).toBe(1);
        expect(source.match(/trackPurchaseCapi\(/g)?.length).toBe(1);
        expect(source).toContain("buildMetaPurchasePayload");
    }
});
