import { expect, test } from "bun:test";
import {
    buildCategoryCatalogQueryInput,
    createCategoryCatalogCachedLoader,
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
    prioritizeBestSellers: false,
    prioritizeNewProducts: false,
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

test("keeps priority ordering in both the cache key and catalog query", () => {
    const shopDefault = {
        ...eligible,
        prioritizeBestSellers: true,
    };
    const swapPassport = {
        ...eligible,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        prioritizeNewProducts: true,
    };
    const explicitCreatedAt = {
        ...eligible,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
    };

    expect(getCategoryCatalogCacheKey(shopDefault)).not.toBe(
        getCategoryCatalogCacheKey(explicitCreatedAt)
    );
    expect(getCategoryCatalogCacheKey(swapPassport)).not.toBe(
        getCategoryCatalogCacheKey(explicitCreatedAt)
    );
    expect(buildCategoryCatalogQueryInput(shopDefault)).toMatchObject({
        categoryId: "category-1",
        prioritizeBestSellers: true,
        prioritizeNewProducts: false,
    });
    expect(buildCategoryCatalogQueryInput(swapPassport)).toMatchObject({
        sortBy: "createdAt",
        sortOrder: "desc",
        prioritizeBestSellers: false,
        prioritizeNewProducts: true,
    });
});

test("uses the 60-second cache contract for repeated category reads", async () => {
    let now = 0;
    let queryCalls = 0;
    const entries = new Map<string, { expiresAt: number; value: number }>();
    const cache = <T>(
        load: () => Promise<T>,
        keyParts: string[],
        options: { revalidate: number }
    ) => {
        const key = keyParts.join("|");
        return async () => {
            const current = entries.get(key) as
                | { expiresAt: number; value: T }
                | undefined;
            if (current && current.expiresAt > now) return current.value;
            const value = await load();
            entries.set(key, {
                value: value as number,
                expiresAt: now + options.revalidate * 1000,
            });
            return value;
        };
    };

    const load = () => Promise.resolve(++queryCalls);
    const first = createCategoryCatalogCachedLoader({
        descriptor: eligible,
        load,
        cache,
    });
    const second = createCategoryCatalogCachedLoader({
        descriptor: eligible,
        load,
        cache,
    });

    expect(await first()).toBe(1);
    expect(await second()).toBe(1);
    now = 60_000;
    expect(await second()).toBe(2);
});
