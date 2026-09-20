import { describe, expect, test } from "bun:test";
import {
    PRODUCT_IMPORT_MAX_PRODUCTS_PER_BATCH,
    ProductImportBatchingError,
    createProductImportBatches,
} from "./batching";

describe("createProductImportBatches", () => {
    test("defaults to small sequential batches for the embedding-heavy backend import", () => {
        const products = Array.from({ length: 11 }, (_, index) => ({
            sku: `SKU-${index}`,
        }));

        const batches = createProductImportBatches(products, {
            maxBytes: 10_000_000,
        });

        expect(PRODUCT_IMPORT_MAX_PRODUCTS_PER_BATCH).toBe(10);
        expect(batches.map((batch) => batch.length)).toEqual([10, 1]);
    });

    test("keeps complete products together while splitting at the product limit", () => {
        const products = Array.from({ length: 201 }, (_, index) => ({
            sku: `SKU-${index}`,
            variants: [{ sku: `VARIANT-${index}-1` }],
        }));

        const batches = createProductImportBatches(products, {
            maxProducts: 100,
            maxBytes: 10_000_000,
        });

        expect(batches.map((batch) => batch.length)).toEqual([100, 100, 1]);
        expect(batches.flat()).toEqual(products);
        expect(batches.every((batch) => batch.every((product) => product.variants))).toBe(true);
    });

    test("starts a new batch before exceeding the serialized payload limit", () => {
        const products = [
            { sku: "SKU-1", description: "a".repeat(80) },
            { sku: "SKU-2", description: "b".repeat(80) },
        ];

        const batches = createProductImportBatches(products, {
            maxProducts: 100,
            maxBytes: JSON.stringify([products[0]]).length + 1,
        });

        expect(batches).toEqual([[products[0]], [products[1]]]);
    });

    test("rejects a single product that cannot fit in one request", () => {
        expect(() =>
            createProductImportBatches([{ sku: "SKU-1", description: "x".repeat(100) }], {
                maxProducts: 100,
                maxBytes: 10,
            })
        ).toThrow(ProductImportBatchingError);
    });

    test("rejects an oversized product after flushing a valid batch", () => {
        expect(() =>
            createProductImportBatches(
                [
                    { sku: "SKU-1", description: "small" },
                    { sku: "SKU-2", description: "x".repeat(1_000) },
                ],
                {
                    maxProducts: 100,
                    maxBytes: 100,
                }
            )
        ).toThrow(ProductImportBatchingError);
    });
});
