import { expect, test } from "bun:test";

const pagePath = "src/app/(protected)/dashboard/general/products/page.tsx";
const tablePath =
    "src/components/dashboard/general/products/products-review-table.tsx";
const actionPath =
    "src/components/dashboard/general/products/product-admin-action.tsx";
const queryPath = "src/lib/db/queries/product.ts";

test("admin products page passes the festive filter to the product query", async () => {
    const page = await Bun.file(pagePath).text();

    expect(page).toContain("isFestiveProduct");
    expect(page).toContain("isFestiveProductRaw");
    expect(page).toContain("isFestiveProduct,");
});

test("product query filters festive products and exposes their sequence position", async () => {
    const query = await Bun.file(queryPath).text();

    expect(query).toContain("isFestiveProduct,");
    expect(query).toContain("fsp.product_id");
    expect(query).toContain("festiveSeasonProducts.position");
    expect(query).toContain("festivePosition");
});

test("products table provides a Festive filter and sequence column", async () => {
    const table = await Bun.file(tablePath).text();

    expect(table).toContain('parseAsStringLiteral(["all", "festive"]');
    expect(table).toContain("Filter by Festive");
    expect(table).toContain("festivePosition");
    expect(table).toContain("Festive Sequence");
});

test("product action menu is vertically scrollable", async () => {
    const action = await Bun.file(actionPath).text();

    expect(action).toContain("max-h-[min(70vh,36rem)]");
    expect(action).toContain("overflow-y-auto");
});
