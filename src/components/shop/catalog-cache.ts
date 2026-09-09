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
};

const CACHE_VERSION = "category-catalog-v1";

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
        "categoryId" | "page" | "limit" | "sortBy" | "sortOrder"
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
    ].join(":");
}
