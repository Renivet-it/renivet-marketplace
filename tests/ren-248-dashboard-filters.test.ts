import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const read = (path: string) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("REN-248 dashboard exposes the requested composable filters", async () => {
    const table = await read(
        "src/components/dashboard/general/products/products-review-table.tsx"
    );

    expect(table).toContain('"categoryId"');
    expect(table).toContain('"productTypeId"');
    expect(table).toContain('"sizeChartFilter"');
    expect(table).toContain("Filter by Category");
    expect(table).toContain("Filter by Product Type");
    expect(table).toContain("With Size Chart");
    expect(table).toContain("Without Size Chart");
    expect(table).toContain('setCategoryId("all")');
    expect(table).toContain('setProductTypeId("all")');
    expect(table).toContain('setSizeChartFilter("all")');
});

test("REN-248 forwards the filters through the dashboard query path", async () => {
    const route = await read("src/lib/trpc/routes/brands/products.ts");
    const productQuery = await read("src/lib/db/queries/product.ts");

    expect(route).toContain("sizeChartFilter");
    expect(route).toContain("categoryId: input.categoryId");
    expect(route).toContain("productTypeId: input.productTypeId");
    expect(productQuery).toContain("getSizeChartFilterQuery(sizeChartFilter)");
});
