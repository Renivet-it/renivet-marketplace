import { describe, expect, test } from "bun:test";
import { PgDialect } from "drizzle-orm/pg-core";
import {
    getAdminProductSearchPredicate,
    shouldUseSemanticProductSearch,
} from "./product-admin-search";

describe("getAdminProductSearchPredicate", () => {
    test("searches admin-visible product identity fields with a parameterized term", () => {
        const predicate = getAdminProductSearchPredicate("  Linen-42  ");
        const query = new PgDialect().sqlToQuery(predicate!);
        const normalizedSql = query.sql.toLowerCase();

        expect(normalizedSql).toContain('"products"."title"');
        expect(normalizedSql).toContain('"products"."native_sku"');
        expect(normalizedSql).toContain("product_variants");
        expect(normalizedSql).toContain("pv.native_sku");
        expect(normalizedSql).toContain("pv.sku");
        expect(normalizedSql).toContain("brands");
        expect(query.params).toEqual([
            "%Linen-42%",
            "%Linen-42%",
            "%Linen-42%",
            "%Linen-42%",
            "%Linen-42%",
        ]);
    });

    test("does not create a predicate for whitespace-only search", () => {
        expect(getAdminProductSearchPredicate("   ")).toBeUndefined();
    });
});

describe("shouldUseSemanticProductSearch", () => {
    test("keeps semantic search on the public catalogue", () => {
        expect(
            shouldUseSemanticProductSearch({
                adminList: false,
                search: "linen shirt",
            })
        ).toBe(true);
    });

    test("bypasses semantic services for the admin list", () => {
        expect(
            shouldUseSemanticProductSearch({
                adminList: true,
                search: "linen shirt",
            })
        ).toBe(false);
    });
});
