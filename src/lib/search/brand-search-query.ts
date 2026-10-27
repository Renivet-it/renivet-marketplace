function normalize(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, " ");
}

export function normalizeBrandSearchKey(value: string) {
    return normalize(value).replaceAll(" ", "");
}

export function normalizeBrandSearchIdentity(value: string) {
    return normalize(value)
        .split(" ")
        .map((word) =>
            word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
                ? word.slice(0, -1)
                : word
        )
        .join("");
}

export function getBrandSearchTerms(
    originalQuery: string,
    brandName?: string,
    brandSlug?: string
) {
    const query = normalize(originalQuery);
    const compactQuery = normalizeBrandSearchKey(originalQuery);
    const brandTerms = [brandName, brandSlug]
        .filter(Boolean)
        .map((value) => normalize(value!));

    for (const brandTerm of brandTerms) {
        if (
            query === brandTerm ||
            compactQuery === normalizeBrandSearchKey(brandTerm)
        )
            return undefined;
        if (query.startsWith(`${brandTerm} `)) {
            const remainder = query.slice(brandTerm.length).trim();
            return remainder || undefined;
        }
    }

    return query || undefined;
}
