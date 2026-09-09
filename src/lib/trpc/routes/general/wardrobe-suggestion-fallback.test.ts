import { describe, expect, test } from "bun:test";
import {
    getDeterministicWardrobeFallbackRows,
    getVectorOrDeterministicFallbackRows,
    getWardrobeFallbackCategoryIds,
} from "./wardrobe-suggestion-fallback";

describe("getWardrobeFallbackCategoryIds", () => {
    test("uses each non-empty cart category once for the local fallback", () => {
        const categoryIds = getWardrobeFallbackCategoryIds([
            { product: { categoryId: "sarees" } },
            { product: { categoryId: "sarees" } },
            { product: { categoryId: "tops" } },
            { product: { categoryId: null } },
            { product: {} },
        ]);

        expect(categoryIds).toEqual(["sarees", "tops"]);
    });

    test("returns no fallback categories when cart products are uncategorized", () => {
        const categoryIds = getWardrobeFallbackCategoryIds([
            { product: { categoryId: null } },
            { product: {} },
        ]);

        expect(categoryIds).toEqual([]);
    });
});

describe("getVectorOrDeterministicFallbackRows", () => {
    test("returns local catalog rows when the ML-backed vector lookup rejects", async () => {
        const rows = await getVectorOrDeterministicFallbackRows({
            getVectorRows: async () => {
                throw new Error("ML host unavailable");
            },
            getFallbackRows: async () => [{ id: "local-saree", distance: 0 }],
            onFallback: () => undefined,
        });

        expect(rows).toEqual([{ id: "local-saree", distance: 0 }]);
    });

    test("keeps vector rows when the ML-backed lookup returns candidates", async () => {
        let fallbackCalls = 0;

        const rows = await getVectorOrDeterministicFallbackRows({
            getVectorRows: async () => [{ id: "vector-match", distance: 0.2 }],
            getFallbackRows: async () => {
                fallbackCalls += 1;
                return [{ id: "local-saree", distance: 0 }];
            },
            onFallback: () => undefined,
        });

        expect(rows).toEqual([{ id: "vector-match", distance: 0.2 }]);
        expect(fallbackCalls).toBe(0);
    });
});

describe("getDeterministicWardrobeFallbackRows", () => {
    test("does not query the catalog when the cart has no usable category", async () => {
        let executeCalls = 0;

        const rows = await getDeterministicWardrobeFallbackRows({
            categoryIds: [],
            cartProductIds: ["cart-product"],
            execute: async () => {
                executeCalls += 1;
                return [{ id: "unexpected" }];
            },
        });

        expect(rows).toEqual([]);
        expect(executeCalls).toBe(0);
    });

    test("returns catalog rows for categorized cart fallback candidates", async () => {
        const rows = await getDeterministicWardrobeFallbackRows({
            categoryIds: ["sarees"],
            cartProductIds: ["cart-product"],
            execute: async () => [{ id: "local-saree", distance: 0 }],
        });

        expect(rows).toEqual([{ id: "local-saree", distance: 0 }]);
    });
});
