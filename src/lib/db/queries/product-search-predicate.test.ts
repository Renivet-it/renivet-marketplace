import { describe, expect, test } from "bun:test";
import { and, count, sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { products } from "../schema";
import { getCatalogSearchPredicate } from "./product-search-predicate";

const compileDataAndCountQueries = (ragProductIds: string[]) => {
    const predicate = getCatalogSearchPredicate({
        processedSearch: "sarees",
        ragProductIds,
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
    test("uses only parameterized product ID membership when RAG returns candidates", () => {
        const queries = compileDataAndCountQueries([
            "rag-product-1",
            "rag-product-2",
        ]);

        for (const query of queries) {
            expect(query.sql.toLowerCase()).toContain(" in ");
            expect(query.sql.toLowerCase()).not.toContain(" ilike ");
            expect(query.sql.toLowerCase()).not.toContain("exists");
            expect(query.params).toContain("rag-product-1");
            expect(query.params).toContain("rag-product-2");
            expect(query.params).not.toContain("%sarees%");
        }
    });

    test("retains the complete local fallback when RAG returns no candidates", () => {
        const queries = compileDataAndCountQueries([]);

        for (const query of queries) {
            const normalizedSql = query.sql.toLowerCase();

            expect(normalizedSql.match(/\bilike\b/g)).toHaveLength(4);
            expect(normalizedSql.match(/\bexists\b/g)).toHaveLength(4);
            expect(query.params).not.toContain("rag-product-1");
            expect(
                query.params.filter((value) => value === "%sarees%")
            ).toHaveLength(8);
        }
    });
});
