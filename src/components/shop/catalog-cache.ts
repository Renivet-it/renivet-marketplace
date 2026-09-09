import { SHOP_PRICE_FILTER_MAX } from "./price-filter-config";

export type CategoryCatalogCacheInput = {
    page: number;
    limit: number;
    categoryId?: string;
    sortBy?: "price" | "createdAt" | "best-sellers";
    sortOrder?: "asc" | "desc";
    search?: string;
    brandIds?: string[];
    minPrice?: number | null;
    maxPrice?: number | null;
    subcategoryId?: string;
    productTypeId?: string;
    colors?: string[];
    sizes?: string[];
    minDiscount?: number | null;
    curated?: boolean;
    personalized?: boolean;
    prioritizeBestSellers?: boolean;
    prioritizeNewProducts?: boolean;
};

const CACHE_VERSION = "category-catalog-v1";
export const CATEGORY_CATALOG_CACHE_TTL_SECONDS = 60;

export function isCategoryCatalogCacheable(
    input: CategoryCatalogCacheInput
): boolean {
    return Boolean(
        input.page === 1 &&
            input.limit === 28 &&
            input.categoryId &&
            !input.search?.trim() &&
            !input.brandIds?.length &&
            (input.minPrice === undefined ||
                input.minPrice === null ||
                input.minPrice === 0) &&
            (input.maxPrice === undefined ||
                input.maxPrice === null ||
                input.maxPrice >= SHOP_PRICE_FILTER_MAX) &&
            !input.subcategoryId &&
            !input.productTypeId &&
            !input.colors?.length &&
            !input.sizes?.length &&
            !input.minDiscount &&
            !input.curated &&
            !input.personalized &&
            (!input.sortBy ||
                input.sortBy === "price" ||
                input.sortBy === "createdAt") &&
            (!input.sortBy ? !input.sortOrder : Boolean(input.sortOrder))
    );
}

export function getCategoryCatalogCacheKey(
    input: Pick<
        CategoryCatalogCacheInput,
        | "categoryId"
        | "page"
        | "limit"
        | "sortBy"
        | "sortOrder"
        | "prioritizeBestSellers"
        | "prioritizeNewProducts"
    >
): string {
    if (!input.categoryId) {
        throw new Error("Category catalog cache requires a category ID");
    }

    return [
        CACHE_VERSION,
        `category:${input.categoryId}`,
        `page:${input.page}`,
        `limit:${input.limit}`,
        `sort:${input.sortBy ?? "default"}:${input.sortOrder ?? "default"}`,
        `best-sellers:${input.prioritizeBestSellers ? "1" : "0"}`,
        `new-products:${input.prioritizeNewProducts ? "1" : "0"}`,
    ].join(":");
}

export function buildCategoryCatalogQueryInput(
    input: CategoryCatalogCacheInput
) {
    if (!input.categoryId) {
        throw new Error("Category catalog query requires a category ID");
    }

    return {
        page: 1,
        limit: 28,
        isAvailable: true,
        isActive: true,
        isPublished: true,
        isDeleted: false,
        verificationStatus: "approved" as const,
        minPrice: 0,
        categoryId: input.categoryId,
        sortBy: input.sortBy === "best-sellers" ? undefined : input.sortBy,
        sortOrder: input.sortOrder,
        prioritizeBestSellers: Boolean(input.prioritizeBestSellers),
        prioritizeNewProducts: Boolean(input.prioritizeNewProducts),
        requireMedia: true,
    };
}

export type CategoryCatalogCacheFactory = <T>(
    load: () => Promise<T>,
    keyParts: string[],
    options: { revalidate: number }
) => () => Promise<T>;

export function createCategoryCatalogCachedLoader<T>({
    descriptor,
    load,
    cache,
}: {
    descriptor: CategoryCatalogCacheInput;
    load: () => Promise<T>;
    cache: CategoryCatalogCacheFactory;
}) {
    return cache(load, [getCategoryCatalogCacheKey(descriptor)], {
        revalidate: CATEGORY_CATALOG_CACHE_TTL_SECONDS,
    });
}
