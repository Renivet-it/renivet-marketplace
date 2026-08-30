import { describe, expect, test } from "bun:test";
import { normalizeGuestWishlistItems } from "../src/app/(protected)/guestWishlist/guest-wishlist-data";

describe("REN-108 guest wishlist data", () => {
    test("normalizes current product and legacy fullProduct storage shapes", () => {
        expect(
            normalizeGuestWishlistItems([
                {
                    productId: "p-1",
                    variantId: 2,
                    product: {
                        id: "p-1",
                        slug: "linen-shirt",
                        name: "Linen Shirt",
                        brand: { name: "Acme" },
                        price: 1200,
                    },
                },
                {
                    id: "legacy-1",
                    title: "Lamp",
                    slug: "lamp",
                    brand: "Home",
                    price: 800,
                    fullProduct: { slug: "lamp", media: [] },
                },
            ])
        ).toEqual([
            expect.objectContaining({
                id: "p-1:2",
                title: "Linen Shirt",
                slug: "linen-shirt",
                brand: "Acme",
                price: 1200,
            }),
            expect.objectContaining({
                id: "legacy-1",
                title: "Lamp",
                slug: "lamp",
                brand: "Home",
                price: 800,
            }),
        ]);
    });
});
