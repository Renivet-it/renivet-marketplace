export type ProductSort = "price" | "createdAt" | "best-sellers";

export function shouldApplySearchRelevanceOrdering({
    isRagSearchActive,
    hasRagResults,
    sortBy,
}: {
    isRagSearchActive: boolean;
    hasRagResults: boolean;
    sortBy?: ProductSort;
}) {
    return isRagSearchActive && hasRagResults && !sortBy;
}
