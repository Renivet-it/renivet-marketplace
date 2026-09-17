function normalize(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, " ");
}

export function getBrandSearchTerms(
    originalQuery: string,
    brandName?: string,
    brandSlug?: string
) {
    const query = normalize(originalQuery);
    const brandTerms = [brandName, brandSlug]
        .filter(Boolean)
        .map((value) => normalize(value!));

    for (const brandTerm of brandTerms) {
        if (query === brandTerm) return undefined;
        if (query.startsWith(`${brandTerm} `)) {
            const remainder = query.slice(brandTerm.length).trim();
            return remainder || undefined;
        }
    }

    return query || undefined;
}
