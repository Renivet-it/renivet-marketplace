import { describe, expect, test } from "bun:test";
import { and, count, sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { products } from "../schema";
import {
    getCatalogSearchPredicate,
    getCatalogTextSearchPredicate,
} from "./product-search-predicate";

const compileDataAndCountQueries = (
    ragProductIds: string[],
    vectorProductIds: string[] = []
) => {
    const predicate = getCatalogSearchPredicate({
        processedSearch: "sarees",
        ragProductIds,
        vectorProductIds,
    });
    const whereClause = and(predicate);
    const dialect = new PgDialect();

    return [
        dialect.sqlToQuery(
            sql`select ${products.id} from ${products} where ${whereClause} limit ${12}`
        ),
        dialect.sqlToQuery(
            sql`select ${count()} from ${products} where ${whereClause}`
        ),
    ];
};

describe("getCatalogSearchPredicate", () => {
    test("includes local matches as well as parameterized RAG candidates in data and count queries", () => {
        const queries = compileDataAndCountQueries([
            "rag-product-1",
            "rag-product-2",
        ]);

        for (const query of queries) {
            expect(query.sql.toLowerCase()).toContain(" in ");
            expect(query.sql.toLowerCase()).toContain(" ~* ");
            expect(query.sql.toLowerCase()).toContain(" or ");
            expect(query.params).toContain("rag-product-1");
            expect(query.params).toContain("rag-product-2");
            expect(query.params).toContain("\\msaree");
        }
    });

    test("retains the complete local fallback when RAG returns no candidates", () => {
        const queries = compileDataAndCountQueries([]);

        for (const query of queries) {
            const normalizedSql = query.sql.toLowerCase();

            expect(normalizedSql).toContain('"products"."title"');
            expect(normalizedSql).toContain('"products"."meta_keywords"');
            expect(normalizedSql).toContain("product_types");
            expect(query.params).not.toContain("rag-product-1");
            expect(query.params).toContain("\\msaree");
        }
    });

    test("uses vector candidates when RAG returns no candidates", () => {
        const queries = compileDataAndCountQueries(
            [],
            ["vector-product-1", "vector-product-2"]
        );

        for (const query of queries) {
            expect(query.sql.toLowerCase()).toContain(" in ");
            expect(query.sql.toLowerCase()).toContain(" ~* ");
            expect(query.params).toContain("vector-product-1");
            expect(query.params).toContain("vector-product-2");
            expect(query.params).toContain("\\msaree");
        }
    });

    test("keeps RAG candidates ahead of local vector candidates", () => {
        const queries = compileDataAndCountQueries(
            ["rag-product-1"],
            ["vector-product-1"]
        );

        for (const query of queries) {
            expect(query.params).toContain("rag-product-1");
            expect(query.params).not.toContain("vector-product-1");
        }
    });

    test("matches multiple query terms across product fields instead of requiring one exact phrase", () => {
        const query = new PgDialect().sqlToQuery(
            getCatalogTextSearchPredicate("red sarees for women")!
        );
        expect(query.sql.toLowerCase()).toContain(" and ");
        expect(query.params).toContain("\\mred");
        expect(query.params).toContain("\\msaree");
        expect(query.params).toContain("\\mwomen");
        expect(query.params).not.toContain("\\mfor");
    });

    test("treats SQL wildcard characters as literal search text", () => {
        const query = new PgDialect().sqlToQuery(
            getCatalogTextSearchPredicate("100%_cotton")!
        );
        expect(query.params).toContain("\\m100%_cotton");
    });

    test("anchors a colour query to word starts so red does not match checkered", () => {
        const query = new PgDialect().sqlToQuery(
            getCatalogTextSearchPredicate("red")!
        );
        expect(query.params).toContain("\\mred");
        expect(query.params).not.toContain("%red%");
        expect(query.sql).toContain("product_options");
        expect(query.sql).not.toContain('"products"."description"');
    });
});
