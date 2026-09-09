import { expect, test } from "bun:test";
import {
    getCategoryCatalogCacheKey,
    isCategoryCatalogCacheable,
} from "./catalog-cache";

const eligible = {
    page: 1,
    limit: 28,
    categoryId: "category-1",
    sortBy: undefined,
    sortOrder: undefined,
    search: undefined,
    brandIds: undefined,
    minPrice: 0,
    maxPrice: 25000,
    subcategoryId: undefined,
    productTypeId: undefined,
    colors: undefined,
    sizes: undefined,
    minDiscount: undefined,
    curated: false,
    personalized: false,
};

test("allows only the bounded category-only catalog shape", () => {
    expect(isCategoryCatalogCacheable(eligible)).toBe(true);
    expect(isCategoryCatalogCacheable({ ...eligible, search: "saree" })).toBe(
        false
    );
    expect(isCategoryCatalogCacheable({ ...eligible, maxPrice: 10000 })).toBe(
        false
    );
    expect(isCategoryCatalogCacheable({ ...eligible, page: 2 })).toBe(false);
});

test("allows category plus supported sort without key collisions", () => {
    expect(
        isCategoryCatalogCacheable({
            ...eligible,
            sortBy: "price",
            sortOrder: "asc",
        })
    ).toBe(true);
    expect(
        getCategoryCatalogCacheKey({
            ...eligible,
            sortBy: "price",
            sortOrder: "asc",
        })
    ).not.toBe(
        getCategoryCatalogCacheKey({
            ...eligible,
            sortBy: "price",
            sortOrder: "desc",
        })
    );
    expect(
        getCategoryCatalogCacheKey({ ...eligible, categoryId: "category-2" })
    ).not.toBe(getCategoryCatalogCacheKey(eligible));
});

test("bypasses every out-of-scope catalog input", () => {
    const outOfScope = [
        { brandIds: ["brand-1"] },
        { subcategoryId: "sub-1" },
        { productTypeId: "type-1" },
        { colors: ["red"] },
        { sizes: ["m"] },
        { minDiscount: 10 },
        { curated: true },
        { personalized: true },
        { sortBy: "best-sellers" as const },
    ];

    for (const input of outOfScope) {
        expect(isCategoryCatalogCacheable({ ...eligible, ...input })).toBe(
            false
        );
    }
});
