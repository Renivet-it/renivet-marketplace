export type ProductSort = "price" | "createdAt" | "best-sellers";

export function buildPriorityProductOrderCase(priorityProductIds: string[]) {
    return priorityProductIds
        .map(
            (id, index) =>
                `WHEN products.id::text = '${id.replaceAll("'", "''")}' THEN ${index}`
        )
        .join(" ");
}

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
