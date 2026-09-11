import { describe, expect, test } from "bun:test";
import {
    assembleOrderDetailsByBrand,
    AUTO_COUPON_CODE,
    createCustomizationPersistence,
    createLatestWriteQueue,
    createRequestGuard,
    filterAvailableCheckoutItems,
    getAutoCouponAction,
    groupCheckoutItemsByBrand,
    isCheckoutItemAvailable,
    toCheckoutPriceItems,
} from "./shared";

const product = {
    isPublished: true,
    verificationStatus: "approved",
    isDeleted: false,
    isAvailable: true,
    quantity: 3,
    isActive: true,
    price: 1200,
    compareAtPrice: 1500,
    categoryId: "category",
    subcategoryId: "subcategory",
    productTypeId: "type",
    brandId: "brand-a",
    variants: [{ id: "variant", price: 900, compareAtPrice: 1100 }],
};

describe("shared checkout availability", () => {
    test("rejects an unselected or unavailable item", () => {
        expect(
            isCheckoutItemAvailable({ product, variant: null, status: false })
        ).toBe(false);
        expect(
            isCheckoutItemAvailable({
                product: { ...product, isAvailable: false },
                variant: null,
                status: true,
            })
        ).toBe(false);
    });

    test("accepts an available selected variant", () => {
        expect(
            isCheckoutItemAvailable({
                product,
                variant: { id: "variant", isDeleted: false, quantity: 1 },
                status: true,
            })
        ).toBe(true);
    });

    test("can retain eligible unselected items for cart display", () => {
        const item = { product, variant: null, status: false };
        expect(filterAvailableCheckoutItems([item], false)).toEqual([item]);
    });
});

describe("shared checkout pricing inputs", () => {
    test("uses variant pricing and keeps reward value as compare-at price", () => {
        expect(
            toCheckoutPriceItems([
                { product, variantId: "variant", quantity: 2 },
                {
                    product: { ...product, brandId: "brand-b" },
                    variantId: null,
                    quantity: 1,
                    isSwapRewardItem: true,
                    rewardValue: 500,
                },
            ])
        ).toEqual([
            {
                price: 900,
                compareAtPrice: 1100,
                quantity: 2,
                categoryId: "category",
                subCategoryId: "subcategory",
                productTypeId: "type",
            },
            {
                price: 0,
                compareAtPrice: 500,
                quantity: 1,
                categoryId: "category",
                subCategoryId: "subcategory",
                productTypeId: "type",
            },
        ]);
    });
});

describe("shared automatic coupon policy", () => {
    test("applies only above the strict threshold and never replaces a manual coupon", () => {
        expect(getAutoCouponAction(300001, null)).toEqual({
            type: "apply",
            code: AUTO_COUPON_CODE,
        });
        expect(getAutoCouponAction(300000, null)).toEqual({ type: "none" });
        expect(getAutoCouponAction(400000, "MANUAL10")).toEqual({
            type: "none",
        });
    });

    test("clears only the automatic coupon at or below the threshold", () => {
        expect(getAutoCouponAction(300000, AUTO_COUPON_CODE)).toEqual({
            type: "clear",
        });
        expect(getAutoCouponAction(200000, "MANUAL10")).toEqual({
            type: "none",
        });
    });
});

test("groups checkout items by first-seen brand without reordering items", () => {
    const items = [
        { id: "a1", product: { brandId: "brand-a" } },
        { id: "b1", product: { brandId: "brand-b" } },
        { id: "a2", product: { brandId: "brand-a" } },
    ];
    expect(groupCheckoutItemsByBrand(items)).toEqual([
        [items[0], items[2]],
        [items[1]],
    ]);
});

test("assembles complete stable order payloads by brand", () => {
    const items = [
        {
            id: "a1",
            productId: "product-a",
            variantId: null,
            quantity: 2,
            product: { ...product, id: "product-a", nativeSku: "sku-a" },
            customizationRequest: " initials ",
        },
        {
            id: "b1",
            productId: "product-b",
            variantId: null,
            quantity: 1,
            product: {
                ...product,
                id: "product-b",
                brandId: "brand-b",
                nativeSku: "sku-b",
            },
        },
    ];
    expect(
        assembleOrderDetailsByBrand({
            items,
            userId: "user",
            addressId: "address",
            couponCode: "SAVE",
            deliveryAmount: 0,
            couponDiscount: 300,
            productDiscount: 0,
            itemsSubtotal: 3600,
            paymentMethod: "COD",
            paymentOrderId: "cod-1",
            taxForItem: (id) => (id === "a1" ? 20 : 10),
            customizationForItem: (item) =>
                item.customizationRequest?.trim() || null,
        })
    ).toEqual([
        expect.objectContaining({
            userId: "user",
            coupon: "SAVE",
            taxAmount: 20,
            totalItems: 2,
            items: [
                expect.objectContaining({
                    productId: "product-a",
                    customizationRequest: "initials",
                }),
            ],
        }),
        expect.objectContaining({
            taxAmount: 10,
            totalItems: 1,
            items: [expect.objectContaining({ productId: "product-b" })],
        }),
    ]);
});

test("serializes writes and coalesces in-flight edits to the latest value", async () => {
    const releases: Array<() => void> = [];
    const writes: Array<string | null> = [];
    let drained = 0;
    const queue = createLatestWriteQueue<string | null>(
        async (value) => {
            writes.push(value);
            await new Promise<void>((resolve) => releases.push(resolve));
        },
        async () => {
            drained += 1;
        }
    );

    const first = queue.enqueue("first");
    void queue.enqueue("second");
    void queue.enqueue("latest");
    expect(writes).toEqual(["first"]);
    releases.shift()?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(writes).toEqual(["first", "latest"]);
    releases.shift()?.();
    await first;
    expect(drained).toBe(1);
});

test("rejects stale asynchronous coupon completions", () => {
    const guard = createRequestGuard();
    const oldRequest = guard.next();
    const latestRequest = guard.next();
    expect(guard.isCurrent(oldRequest)).toBe(false);
    expect(guard.isCurrent(latestRequest)).toBe(true);
    guard.invalidate();
    expect(guard.isCurrent(latestRequest)).toBe(false);
});

test("persists normalized customization through the cart mutation and refetches", async () => {
    const writes: any[] = [];
    let refetches = 0;
    const persistence = createCustomizationPersistence({
        userId: "user",
        write: async (input) => writes.push(input),
        refetch: async () => {
            refetches += 1;
        },
    });
    await persistence.save(
        { id: "cart", productId: "product", variantId: null },
        "  initials  "
    );
    expect(writes).toEqual([
        {
            userId: "user",
            productId: "product",
            variantId: null,
            customizationRequest: "initials",
        },
    ]);
    expect(refetches).toBe(1);
    expect(persistence.isPending("cart")).toBe(false);
});
