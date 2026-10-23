export type AdminProductsQueryState = {
    page: number;
    limit: number;
    search: string;
    verificationStatus: "all" | "idle" | "pending" | "approved" | "rejected";
    qcStatus: "all" | "pass" | "warning" | "critical";
    catalogIssue: "all" | "oos_but_live" | "stale_inventory" | "claim_mismatch";
    productImage: "all" | "with" | "without";
    productVisiblity: "all" | "private" | "public";
    isFestiveProduct: "all" | "festive";
    categoryId: string;
    productTypeId: string;
    sizeChartFilter: "all" | "with" | "without";
    variantPriceFilter: "all" | "different";
    brandIds: string[];
    scopedBrandId?: string;
};

export function buildAdminProductsQueryInput(state: AdminProductsQueryState) {
    const search = state.search.trim();
    const brandIds = state.scopedBrandId
        ? [state.scopedBrandId]
        : state.brandIds.length > 0
          ? state.brandIds
          : undefined;

    return {
        page: state.page,
        limit: state.limit,
        ...(search ? { search } : {}),
        ...(state.verificationStatus !== "all"
            ? { verificationStatus: state.verificationStatus }
            : {}),
        ...(state.qcStatus !== "all" ? { qcStatus: state.qcStatus } : {}),
        ...(state.catalogIssue !== "all"
            ? { catalogIssue: state.catalogIssue }
            : {}),
        ...(state.productImage !== "all"
            ? { productImage: state.productImage }
            : {}),
        ...(state.productVisiblity !== "all"
            ? { productVisiblity: state.productVisiblity }
            : {}),
        ...(state.isFestiveProduct === "festive"
            ? { isFestiveProduct: true }
            : {}),
        ...(state.categoryId !== "all"
            ? { categoryId: state.categoryId }
            : {}),
        ...(state.productTypeId !== "all"
            ? { productTypeId: state.productTypeId }
            : {}),
        ...(state.sizeChartFilter !== "all"
            ? { sizeChartFilter: state.sizeChartFilter }
            : {}),
        ...(state.variantPriceFilter !== "all"
            ? { variantPriceFilter: state.variantPriceFilter }
            : {}),
        ...(brandIds ? { brandIds } : {}),
        adminList: true as const,
    };
}

export function getAdminProductsPageForChange(
    currentPage: number,
    change: "filter" | "pagination"
) {
    return change === "filter" ? 1 : Math.max(1, Math.trunc(currentPage));
}

export function parseAdminBrandIds(value: string | string[] | undefined) {
    if (!value) return [];

    const values = Array.isArray(value) ? value : [value];
    return Array.from(
        new Set(
            values
                .flatMap((entry) => entry.split(","))
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    );
}
