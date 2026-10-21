import { describe, expect, test } from "bun:test";
import { PgDialect } from "drizzle-orm/pg-core";
import {
    getSizeChartFilterQuery,
    getVariantPriceFilterQuery,
} from "./product-admin-filters";

const compile = (filter: "with" | "without" | "all") => {
    const predicate = getSizeChartFilterQuery(filter);
    return predicate ? new PgDialect().sqlToQuery(predicate) : null;
};

const compileVariantPrice = (filter: "different" | "all") => {
    const predicate = getVariantPriceFilterQuery(filter);
    return predicate ? new PgDialect().sqlToQuery(predicate) : null;
};

describe("getSizeChartFilterQuery", () => {
    test("filters to products with size chart media", () => {
        const query = compile("with");

        expect(query?.sql.toLowerCase()).toContain("jsonb_array_length");
        expect(query?.sql).toContain("> 0");
    });

    test("filters to products without size chart media", () => {
        const query = compile("without");

        expect(query?.sql.toLowerCase()).toContain("jsonb_array_length");
        expect(query?.sql).toContain("= 0");
    });

    test("does not add a predicate for all", () => {
        expect(compile("all")).toBeNull();
    });
});

describe("getVariantPriceFilterQuery", () => {
    test("requires more than one distinct active variant price", () => {
        const query = compileVariantPrice("different");

        expect(query?.sql).toContain("COUNT(DISTINCT pv.price) > 1");
        expect(query?.sql).toContain("pv.is_deleted = false");
    });

    test("does not add a predicate for all", () => {
        expect(compileVariantPrice("all")).toBeNull();
    });
});
