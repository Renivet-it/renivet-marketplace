export interface StorefrontBrand {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

const PRIORITY_ALIASES = [
    ["my mithila", "mymithila"],
    ["greysome", "grey some"],
    ["anushe pirani", "anush pirani"],
    ["rasa homes", "rasa home", "rasahomes", "rasahome"],
    ["islands of loom", "island of loom"],
    ["ocau", "o cau", "okau", "ok au"],
    ["terra luna", "terraluna"],
    ["raasaa", "raasa"],
    ["masilo"],
    ["greensole"],
    ["bahem"],
    ["asf shop", "the asf shop", "asfshop"],
    ["sobek", "sobek natural", "sobek naturals"],
    ["eagi crafts", "eagicrafts", "egai crafts", "egaicrafts"],
    ["nanhey"],
    ["bamboology"],
    ["onearth", "on earth"],
] as const;

function normalizeBrandName(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toLowerCase();
}

function collapseRepeatedCharacters(value: string) {
    return value.replace(/(.)\1+/g, "$1");
}

const priorityByAlias = new Map<string, number>();
PRIORITY_ALIASES.forEach((aliases, index) => {
    aliases.forEach((alias) =>
        priorityByAlias.set(normalizeBrandName(alias), index)
    );
});

function getPriority(brand: StorefrontBrand) {
    return (
        priorityByAlias.get(normalizeBrandName(brand.name)) ??
        priorityByAlias.get(normalizeBrandName(brand.slug)) ??
        Number.POSITIVE_INFINITY
    );
}

export function sortStorefrontBrands<T extends StorefrontBrand>(brands: T[]) {
    return [...brands].sort((left, right) => {
        const priorityDifference = getPriority(left) - getPriority(right);
        if (Number.isFinite(priorityDifference) && priorityDifference !== 0)
            return priorityDifference;
        if (getPriority(left) !== getPriority(right))
            return getPriority(left) - getPriority(right);

        return left.name.localeCompare(right.name, undefined, {
            sensitivity: "base",
        });
    });
}

export function filterStorefrontBrands<T extends StorefrontBrand>(
    brands: T[],
    query: string
) {
    const normalizedQuery = normalizeBrandName(query);
    const sorted = sortStorefrontBrands(brands);
    if (!normalizedQuery) return sorted;

    return sorted.filter((brand) => {
        const searchableName = normalizeBrandName(
            `${brand.name} ${brand.slug}`
        );
        return (
            searchableName.includes(normalizedQuery) ||
            collapseRepeatedCharacters(searchableName).includes(
                collapseRepeatedCharacters(normalizedQuery)
            )
        );
    });
}
