type NamedProductSize = { name: string };

type ProductSizeSortKey = {
    group: number;
    primary: number;
    secondary: number;
};

const WORD_SIZE_ORDER: Record<string, number> = {
    TRIPLEEXTRASMALL: 0,
    "3XSMALL": 0,
    DOUBLEEXTRASMALL: 1,
    "2XSMALL": 1,
    EXTRASMALL: 2,
    XSMALL: 2,
    SMALL: 3,
    MEDIUM: 4,
    LARGE: 5,
    EXTRALARGE: 6,
    XLARGE: 6,
    DOUBLEEXTRALARGE: 7,
    "2XLARGE": 7,
    TRIPLEEXTRALARGE: 8,
    "3XLARGE": 8,
    "4XLARGE": 9,
    "5XLARGE": 10,
    "6XLARGE": 11,
};

function getAlphaSizeRank(name: string) {
    const normalizedName = name
        .trim()
        .toUpperCase()
        .replace(/[\s_-]+/g, "");
    const wordRank = WORD_SIZE_ORDER[normalizedName];

    if (wordRank !== undefined) return wordRank;

    const xSmallMatch = normalizedName.match(/^(X{1,3})S$/);
    if (xSmallMatch) return 3 - xSmallMatch[1].length;

    const numberedXSmallMatch = normalizedName.match(/^([2-3])XS$/);
    if (numberedXSmallMatch) {
        return 3 - Number(numberedXSmallMatch[1]);
    }

    if (normalizedName === "S") return 3;
    if (normalizedName === "M") return 4;
    if (normalizedName === "L") return 5;

    const xLargeMatch = normalizedName.match(/^(X{1,6})L$/);
    if (xLargeMatch) return 5 + xLargeMatch[1].length;

    const numberedXLargeMatch = normalizedName.match(/^([2-6])XL$/);
    if (numberedXLargeMatch) {
        return 5 + Number(numberedXLargeMatch[1]);
    }

    const inclusiveSizeMatch = normalizedName.match(/^([1-6])X$/);
    if (inclusiveSizeMatch) {
        return 6 + Number(inclusiveSizeMatch[1]);
    }

    return null;
}

function getProductSizeSortKey(name: string): ProductSizeSortKey {
    const alphaRank = getAlphaSizeRank(name);
    if (alphaRank !== null) {
        return { group: 0, primary: alphaRank, secondary: 0 };
    }

    const numericMatch = name
        .trim()
        .toUpperCase()
        .match(
            /^(?:(?:EU|UK|US|AU|SIZE)\s*)?(\d+(?:\.\d+)?)(?:\s*(?:-|\/|TO)\s*(\d+(?:\.\d+)?))?(?:\s*(?:EU|UK|US|AU))?$/
        );

    if (numericMatch) {
        const primary = Number(numericMatch[1]);
        return {
            group: 1,
            primary,
            secondary: numericMatch[2] ? Number(numericMatch[2]) : primary,
        };
    }

    return { group: 2, primary: 0, secondary: 0 };
}

export function sortProductSizeValues<T extends NamedProductSize>(
    values: readonly T[]
): T[] {
    return values
        .map((value, index) => ({
            value,
            index,
            key: getProductSizeSortKey(value.name),
        }))
        .sort(
            (a, b) =>
                a.key.group - b.key.group ||
                a.key.primary - b.key.primary ||
                a.key.secondary - b.key.secondary ||
                a.index - b.index
        )
        .map(({ value }) => value);
}

export function isProductSizeOptionName(name: string) {
    return /\bsizes?\b/i.test(name.trim());
}
