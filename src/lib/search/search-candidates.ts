const PRODUCT_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function toSearchCandidateIds(data: unknown): string[] {
    if (!Array.isArray(data)) return [];
    const ids = data.flatMap((row) => {
        const id = row && typeof row === "object" ? row.id : undefined;
        return typeof id === "string" && PRODUCT_ID.test(id) ? [id] : [];
    });
    return [...new Set(ids)].slice(0, 150);
}
