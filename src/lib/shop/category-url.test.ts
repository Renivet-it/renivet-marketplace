import { describe, expect, test } from "bun:test";
import {
    buildCategoryUrl,
    getCategoryHierarchyReason,
    getCategorySlugRedirectMode,
    getCategorySlugRedirectStatus,
    getLegacyProductTypeRedirectReason,
    replacePathPreservingSearch,
} from "./category-url";

describe("REN-221 category URLs", () => {
    test("builds a canonical category URL", () => {
        expect(buildCategoryUrl("women", { subCategoryId: "abc" })).toBe(
            "/shop/women?subCategoryId=abc"
        );
    });

    test("preserves the complete legacy query when changing only the path", () => {
        const input = new URL(
            "https://renivet.test/shop?productTypeId=pt%201&search=a%2Bb&search=a%2Bc"
        );
        expect(
            replacePathPreservingSearch(input, "/shop/women").toString()
        ).toBe(
            "https://renivet.test/shop/women?productTypeId=pt%201&search=a%2Bb&search=a%2Bc"
        );
    });

    test.each([
        ["invalid_uuid", "not-a-uuid", ""],
        [
            "duplicate_product_type",
            "00000000-0000-4000-8000-000000000001",
            "productTypeId=00000000-0000-4000-8000-000000000002",
        ],
        [
            "category_conflict",
            "00000000-0000-4000-8000-000000000001",
            "categoryId=00000000-0000-4000-8000-000000000003",
        ],
        [
            "subcategory_alias_conflict",
            "00000000-0000-4000-8000-000000000001",
            "subCategoryId=00000000-0000-4000-8000-000000000003&subcategoryId=00000000-0000-4000-8000-000000000004",
        ],
        [
            "subcategory_conflict",
            "00000000-0000-4000-8000-000000000001",
            "subCategoryId=00000000-0000-4000-8000-000000000003",
        ],
        [
            "subcategory_conflict",
            "00000000-0000-4000-8000-000000000001",
            "subcategoryId=00000000-0000-4000-8000-000000000003",
        ],
    ] as const)("rejects %s", (reason, id, extra) => {
        const params = new URLSearchParams(
            `productTypeId=${id}${extra ? `&${extra}` : ""}`
        );
        expect(getLegacyProductTypeRedirectReason(params)).toBe(reason);
    });
});

describe("REN-221 slug hierarchy", () => {
    const categoryId = "00000000-0000-4000-8000-000000000001";
    const subCategory = {
        id: "00000000-0000-4000-8000-000000000002",
        categoryId,
    };
    const productType = {
        id: "00000000-0000-4000-8000-000000000003",
        categoryId,
        subCategoryId: subCategory.id,
    };

    test("allows a product type without an explicit subcategory filter", () => {
        expect(
            getCategoryHierarchyReason({
                categoryId,
                requestedProductTypeId: productType.id,
                productType,
            })
        ).toBe("success");
    });

    test("rejects a product type outside the requested subcategory", () => {
        expect(
            getCategoryHierarchyReason({
                categoryId,
                requestedSubCategoryId: "00000000-0000-4000-8000-000000000004",
                requestedProductTypeId: productType.id,
                productType,
            })
        ).toBe("hierarchy_mismatch");
    });
});

describe("REN-221 redirect mode", () => {
    test("defaults missing and invalid values to off", () => {
        expect(getCategorySlugRedirectMode(undefined)).toBe("off");
        expect(getCategorySlugRedirectMode("unexpected")).toBe("off");
    });

    test("accepts temporary and permanent modes", () => {
        expect(getCategorySlugRedirectMode("temporary")).toBe("temporary");
        expect(getCategorySlugRedirectMode("permanent")).toBe("permanent");
    });

    test("maps temporary to 307 and permanent to 301", () => {
        expect(getCategorySlugRedirectStatus("temporary")).toBe(307);
        expect(getCategorySlugRedirectStatus("permanent")).toBe(301);
    });
});
