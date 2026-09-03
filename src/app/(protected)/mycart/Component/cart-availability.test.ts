import { expect, test } from "bun:test";
import { isCartItemAvailable } from "./cart-availability";

const availableItem = {
    product: {
        isPublished: true,
        verificationStatus: "approved" as const,
        isDeleted: false,
        isAvailable: true,
        quantity: 3,
        isActive: true,
    },
    variant: null,
};

test("accepts an eligible product regardless of cart selection status", () => {
    expect(isCartItemAvailable(availableItem)).toBe(true);
});

test("rejects products that are not published, approved, active, or available", () => {
    for (const change of [
        { isPublished: false },
        { verificationStatus: "pending" as const },
        { isDeleted: true },
        { isAvailable: false },
        { isActive: false },
    ]) {
        expect(
            isCartItemAvailable({
                ...availableItem,
                product: { ...availableItem.product, ...change },
            })
        ).toBe(false);
    }
});

test("rejects a deleted or out-of-stock selected variant", () => {
    expect(
        isCartItemAvailable({
            ...availableItem,
            variant: { isDeleted: true, quantity: 3 },
        })
    ).toBe(false);
    expect(
        isCartItemAvailable({
            ...availableItem,
            variant: { isDeleted: false, quantity: 0 },
        })
    ).toBe(false);
});
