import { describe, expect, test } from "bun:test";
import { sanitizeWishlistQuantities } from "./wishlist-quantities";

describe("sanitizeWishlistQuantities", () => {
    test("clamps negative product and variant quantities before validation", () => {
        const wishlist = {
            product: {
                quantity: -3,
                variants: [{ quantity: -2 }, { quantity: 4 }],
            },
        };

        expect(sanitizeWishlistQuantities(wishlist)).toEqual({
            product: {
                quantity: 0,
                variants: [{ quantity: 0 }, { quantity: 4 }],
            },
        });
    });
});
