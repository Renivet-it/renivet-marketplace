export interface MerchandisingProduct {
    id: string;
    title?: string | null;
    categoryName?: string | null;
    subcategoryName?: string | null;
    price?: number | null;
    compareAtPrice?: number | null;
    variants?: Array<{
        price?: number | null;
        compareAtPrice?: number | null;
    }>;
}

const FESTIVE_CATEGORY_PRIORITY = [
    "home & living",
    "beauty products",
    "women",
    "men",
];

function discountPercent(
    price?: number | null,
    compareAtPrice?: number | null
): number {
    if (!price || !compareAtPrice || compareAtPrice <= price) return 0;
    return ((compareAtPrice - price) / compareAtPrice) * 100;
}

export function getProductDiscountPercent(product: MerchandisingProduct) {
    const productDiscount = discountPercent(
        product.price,
        product.compareAtPrice
    );
    const variantDiscount = (product.variants ?? []).reduce(
        (highest, variant) =>
            Math.max(
                highest,
                discountPercent(variant.price, variant.compareAtPrice)
            ),
        0
    );
    return Math.max(productDiscount, variantDiscount);
}

function categoryRank(categoryName?: string | null) {
    const normalized = categoryName?.trim().toLowerCase();
    const index = normalized
        ? FESTIVE_CATEGORY_PRIORITY.indexOf(normalized)
        : -1;
    return index === -1 ? FESTIVE_CATEGORY_PRIORITY.length : index;
}

export function rankFestiveProductIds(products: MerchandisingProduct[]) {
    return [...products]
        .sort((a, b) => {
            const discountBand =
                Number(getProductDiscountPercent(b) >= 30) -
                Number(getProductDiscountPercent(a) >= 30);
            if (discountBand !== 0) return discountBand;

            const categoryPriority =
                categoryRank(a.categoryName) - categoryRank(b.categoryName);
            if (categoryPriority !== 0) return categoryPriority;

            const discountPriority =
                getProductDiscountPercent(b) - getProductDiscountPercent(a);
            if (discountPriority !== 0) return discountPriority;

            return 0;
        })
        .map((product) => product.id);
}

export function getFestiveCatalogLimit(
    requestedLimit: string | undefined,
    curatedProductCount: number
) {
    const parsedLimit = requestedLimit
        ? Number.parseInt(requestedLimit, 10)
        : Number.NaN;

    if (Number.isFinite(parsedLimit) && parsedLimit > 0) return parsedLimit;

    return 28;
}

export function rankProductIdsBySubcategory(
    products: Array<{ id: string; subcategoryName?: string | null }>,
    priority: string[]
) {
    const priorityMap = new Map(
        priority.map((name, index) => [name.trim().toLowerCase(), index])
    );

    return [...products]
        .sort(
            (a, b) =>
                (priorityMap.get(
                    a.subcategoryName?.trim().toLowerCase() ?? ""
                ) ?? priority.length) -
                (priorityMap.get(
                    b.subcategoryName?.trim().toLowerCase() ?? ""
                ) ?? priority.length)
        )
        .map((product) => product.id);
}
