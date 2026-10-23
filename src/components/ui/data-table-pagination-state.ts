const positiveInteger = (value: number, fallback = 1) =>
    Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;

export function getPaginationState({
    page,
    totalPages,
}: {
    page: number;
    totalPages: number;
}) {
    const safeTotalPages = positiveInteger(totalPages);
    const safePage = Math.min(positiveInteger(page), safeTotalPages);

    return {
        page: safePage,
        totalPages: safeTotalPages,
        previousPage: Math.max(1, safePage - 1),
        nextPage: Math.min(safeTotalPages, safePage + 1),
        canGoPrevious: safePage > 1,
        canGoNext: safePage < safeTotalPages,
    };
}

export function getResultRange({
    page,
    pageSize,
    rowCount,
    totalCount,
}: {
    page: number;
    pageSize: number;
    rowCount: number;
    totalCount: number;
}) {
    if (totalCount <= 0 || rowCount <= 0) return { start: 0, end: 0 };

    const safePage = positiveInteger(page);
    const safePageSize = positiveInteger(pageSize, 15);
    const start = (safePage - 1) * safePageSize + 1;

    return {
        start,
        end: Math.min(start + rowCount - 1, totalCount),
    };
}

export function getTotalPages(count: number, pageSize: number) {
    const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
    return Math.max(1, Math.ceil(safeCount / positiveInteger(pageSize, 15)));
}
