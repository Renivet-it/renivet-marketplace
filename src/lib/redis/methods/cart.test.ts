import { describe, expect, test } from "bun:test";
import {
    CART_CACHE_TTL_SECONDS,
    cartIndexKey,
    cartItemKey,
    cartMembershipMatches,
} from "./cart-key";

describe("cart cache index contract", () => {
    test("scopes the index and item identity by user, product, and optional variant", () => {
        expect(cartIndexKey("user-1")).toBe("cart:index:user-1");
        expect(cartItemKey("user-1", "product-1")).toBe(
            "cart:user-1:product-1"
        );
        expect(cartItemKey("user-1", "product-1", "variant-1")).toBe(
            "cart:user-1:product-1:variant-1"
        );
    });

    test("keeps the existing seven-day cart TTL", () => {
        expect(CART_CACHE_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
    });

    test("rejects a same-count index with different cart membership", () => {
        expect(
            cartMembershipMatches(
                ["cart:user-1:product-1", "cart:user-1:product-2"],
                ["cart:user-1:product-1", "cart:user-1:product-3"]
            )
        ).toBe(false);
    });
});
