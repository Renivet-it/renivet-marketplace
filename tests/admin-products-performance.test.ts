import { expect, test } from "bun:test";
import { buildAdminProductsQueryInput } from "../src/components/dashboard/general/products/admin-products-query-state";

const queryPath = "src/lib/db/queries/product.ts";
const routePath = "src/lib/trpc/routes/brands/products.ts";

test("admin product server and client queries share the lightweight contract", () => {
    const input = buildAdminProductsQueryInput({
        page: 2,
        limit: 15,
        search: "   ",
        verificationStatus: "all",
        qcStatus: "all",
        catalogIssue: "all",
        productImage: "all",
        productVisiblity: "all",
        isFestiveProduct: "all",
        categoryId: "all",
        productTypeId: "all",
        sizeChartFilter: "all",
        variantPriceFilter: "all",
        brandIds: [],
    });

    expect(input).toEqual({ page: 2, limit: 15, adminList: true });
});

test("admin product query uses the lightweight list projection", async () => {
    const query = await Bun.file(queryPath).text();
    const route = await Bun.file(routePath).text();

    expect(query).toContain("adminList?: boolean");
    expect(query).toContain("const productRows = adminList");
    expect(route).toContain("adminList: z.boolean().optional()");
    expect(route).toContain("adminList: input.adminList");
});
