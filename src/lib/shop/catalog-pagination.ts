export function shouldStopCatalogPagination({
    loadedCount,
    totalCount,
    lastPageCount,
}: {
    loadedCount: number;
    totalCount: number;
    lastPageCount: number;
}) {
    return lastPageCount === 0 || loadedCount >= totalCount;
}
