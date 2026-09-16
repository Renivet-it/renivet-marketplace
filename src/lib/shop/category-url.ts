const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CategorySlugRedirectMode = "off" | "temporary" | "permanent";

export const getCategorySlugRedirectMode = (
    value: string | undefined
): CategorySlugRedirectMode =>
    value === "temporary" || value === "permanent" ? value : "off";

export const getCategorySlugRedirectStatus = (
    mode: Exclude<CategorySlugRedirectMode, "off">
): 301 | 307 => (mode === "permanent" ? 301 : 307);

export const buildCategoryUrl = (
    slug: string,
    filters: Record<string, string | undefined> = {}
) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }
    const query = params.toString();
    return `/shop/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`;
};

export const replacePathPreservingSearch = (url: URL, pathname: string) => {
    const result = new URL(url.toString());
    result.pathname = pathname;
    return result;
};

export type LegacyProductTypeRedirectReason =
    | "success"
    | "invalid_uuid"
    | "duplicate_product_type"
    | "category_conflict"
    | "subcategory_conflict"
    | "subcategory_alias_conflict";

export const getLegacyProductTypeRedirectReason = (
    params: URLSearchParams
): LegacyProductTypeRedirectReason => {
    const productTypeIds = params.getAll("productTypeId");
    if (productTypeIds.length !== 1) return "duplicate_product_type";
    if (!UUID.test(productTypeIds[0])) return "invalid_uuid";
    if (params.has("categoryId")) return "category_conflict";
    if (params.has("subCategoryId") && params.has("subcategoryId"))
        return "subcategory_alias_conflict";
    if (params.has("subCategoryId") || params.has("subcategoryId"))
        return "subcategory_conflict";
    return "success";
};

type HierarchyRecord = {
    id: string;
    categoryId: string;
};

type ProductTypeHierarchyRecord = HierarchyRecord & {
    subCategoryId: string | null;
};

export const getCategoryHierarchyReason = ({
    categoryId,
    requestedCategoryId,
    requestedSubCategoryId,
    requestedProductTypeId,
    subCategory,
    productType,
}: {
    categoryId: string;
    requestedCategoryId?: string;
    requestedSubCategoryId?: string;
    requestedProductTypeId?: string;
    subCategory?: HierarchyRecord;
    productType?: ProductTypeHierarchyRecord;
}): "success" | "hierarchy_mismatch" => {
    if (requestedCategoryId && requestedCategoryId !== categoryId)
        return "hierarchy_mismatch";
    if (
        requestedSubCategoryId &&
        (!subCategory || subCategory.categoryId !== categoryId)
    )
        return "hierarchy_mismatch";
    if (
        requestedProductTypeId &&
        (!productType ||
            productType.categoryId !== categoryId ||
            (requestedSubCategoryId &&
                productType.subCategoryId !== requestedSubCategoryId))
    )
        return "hierarchy_mismatch";
    return "success";
};
