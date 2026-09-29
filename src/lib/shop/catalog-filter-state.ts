export function preserveCatalogSearch<T extends Record<string, unknown>>(
    search: string,
    updates: T
): T & { search: string } {
    return {
        ...updates,
        search,
    };
}
