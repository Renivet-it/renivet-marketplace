import { describe, expect, test } from "bun:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { getSizeChartFilterQuery } from "./product-admin-filters";

const compile = (filter: "with" | "without" | "all") => {
    const predicate = getSizeChartFilterQuery(filter);
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
