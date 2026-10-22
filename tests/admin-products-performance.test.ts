import { expect, test } from "bun:test";

const pagePath = "src/app/(protected)/dashboard/general/products/page.tsx";
const tablePath =
    "src/components/dashboard/general/products/products-review-table.tsx";
const queryPath = "src/lib/db/queries/product.ts";
const routePath = "src/lib/trpc/routes/brands/products.ts";

test("admin product server and client queries use the same normalized inputs", async () => {
    const page = await Bun.file(pagePath).text();
    const table = await Bun.file(tablePath).text();

    expect(page).toContain("adminList: true");
    expect(table).toContain("search: search || undefined");
    expect(table).toContain('productImage === "all" ? undefined : productImage');
    expect(table).toContain(
        'productVisiblity === "all" ? undefined : productVisiblity'
    );
});

test("admin product query uses the lightweight list projection", async () => {
    const query = await Bun.file(queryPath).text();
    const route = await Bun.file(routePath).text();

    expect(query).toContain("adminList?: boolean");
    expect(query).toContain("const productRows = adminList");
    expect(route).toContain("adminList: z.boolean().optional()");
    expect(route).toContain("adminList: input.adminList");
});
