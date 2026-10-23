import { describe, expect, test } from "bun:test";
import {
    buildAdminProductsQueryInput,
    getAdminProductsPageForChange,
    parseAdminBrandIds,
} from "./admin-products-query-state";

describe("buildAdminProductsQueryInput", () => {
    test("normalizes all-values and keeps the admin fast-path contract", () => {
        expect(
            buildAdminProductsQueryInput({
                page: 3,
                limit: 25,
                search: "  linen shirt  ",
                verificationStatus: "all",
                qcStatus: "warning",
                catalogIssue: "all",
                productImage: "all",
                productVisiblity: "public",
                isFestiveProduct: "all",
                categoryId: "all",
                productTypeId: "type-1",
                sizeChartFilter: "without",
                variantPriceFilter: "all",
                brandIds: ["brand-1", "brand-2"],
            })
        ).toEqual({
            page: 3,
            limit: 25,
            search: "linen shirt",
            qcStatus: "warning",
            productVisiblity: "public",
            productTypeId: "type-1",
            sizeChartFilter: "without",
            brandIds: ["brand-1", "brand-2"],
            adminList: true,
        });
    });

    test("uses the scoped brand instead of global brand selections", () => {
        const input = buildAdminProductsQueryInput({
            page: 1,
            limit: 15,
            search: "",
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
            brandIds: ["ignored-brand"],
            scopedBrandId: "scoped-brand",
        });

        expect(input.brandIds).toEqual(["scoped-brand"]);
        expect(input.search).toBeUndefined();
    });

    test("normalizes malformed URL pagination before it reaches the API", () => {
        const input = buildAdminProductsQueryInput({
            page: -4,
            limit: 5000,
            search: "",
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

        expect(input.page).toBe(1);
        expect(input.limit).toBe(15);
    });
});

describe("admin product page transitions", () => {
    test("resets to page one for result-changing filters", () => {
        expect(getAdminProductsPageForChange(8, "filter")).toBe(1);
    });

    test("preserves an explicitly selected page during pagination", () => {
        expect(getAdminProductsPageForChange(8, "pagination")).toBe(8);
    });

    test("parses repeated and comma-separated brand parameters", () => {
        expect(parseAdminBrandIds(["brand-1,brand-2", "brand-3"])).toEqual([
            "brand-1",
            "brand-2",
            "brand-3",
        ]);
    });
});
