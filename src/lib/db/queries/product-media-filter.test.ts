import { describe, expect, test } from "bun:test";
import { and, count, sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import { products } from "../schema";
import {
    buildCatalogMediaPostFilterObservation,
    emitCatalogMediaPostFilterObservation,
    filterProductsByResolvedMedia,
    getCatalogRequireMediaPredicate,
    shouldRequireCatalogMedia,
} from "./product-media-filter";

type TestProduct = {
    id: string;
    media: Array<{ mediaItem?: { url?: string | null } | null }>;
};

describe("catalog requireMedia behavior", () => {
    test("enables the database media predicate only for explicit true", () => {
        expect(shouldRequireCatalogMedia(true)).toBe(true);
        expect(shouldRequireCatalogMedia(false)).toBe(false);
        expect(shouldRequireCatalogMedia(undefined)).toBe(false);
    });

    test("generates the same zero-media exclusion for page and count queries", () => {
        const predicate = getCatalogRequireMediaPredicate(true);
        const whereClause = and(predicate);
        const dialect = new PgDialect();
        const pageQuery = dialect.sqlToQuery(
            sql`select ${products.id} from ${products} where ${whereClause} limit ${12}`
        );
        const countQuery = dialect.sqlToQuery(
            sql`select ${count()} from ${products} where ${whereClause}`
        );

        expect(pageQuery.sql).toContain("jsonb_array_length");
        expect(countQuery.sql).toContain("jsonb_array_length");
        expect(getCatalogRequireMediaPredicate(false)).toBeUndefined();
    });

    test("keeps only products with a resolved media URL without reordering", () => {
        const products: TestProduct[] = [
            { id: "missing", media: [] },
            { id: "first-valid", media: [{ mediaItem: { url: "https://cdn.test/1.jpg" } }] },
            { id: "unresolved", media: [{ mediaItem: null }] },
            { id: "second-valid", media: [{ mediaItem: { url: "https://cdn.test/2.jpg" } }] },
        ];

        expect(filterProductsByResolvedMedia(products, true).map((product) => product.id)).toEqual([
            "first-valid",
            "second-valid",
        ]);
    });

    test("returns the original collection when requireMedia is disabled", () => {
        const products: TestProduct[] = [
            { id: "missing", media: [] },
            { id: "unresolved", media: [{ mediaItem: null }] },
        ];

        expect(filterProductsByResolvedMedia(products, false)).toBe(products);
    });
});

describe("catalog media post-filter observation", () => {
    test("builds exact counts only when the post-filter removed products", () => {
        expect(
            buildCatalogMediaPostFilterObservation({
                inputCount: 5,
                outputCount: 3,
                hasSearch: true,
            })
        ).toEqual({
            event: "catalog_media_post_filter",
            inputCount: 5,
            outputCount: 3,
            removedCount: 2,
            hasSearch: true,
        });

        expect(
            buildCatalogMediaPostFilterObservation({
                inputCount: 3,
                outputCount: 3,
                hasSearch: false,
            })
        ).toBeNull();
    });

    test("does not let a failing telemetry sink affect catalog behavior", () => {
        expect(() =>
            emitCatalogMediaPostFilterObservation(
                {
                    event: "catalog_media_post_filter",
                    inputCount: 2,
                    outputCount: 1,
                    removedCount: 1,
                    hasSearch: false,
                },
                () => {
                    throw new Error("telemetry unavailable");
                }
            )
        ).not.toThrow();
    });
});
