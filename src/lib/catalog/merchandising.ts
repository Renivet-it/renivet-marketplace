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

function isAromaAndCandles(product: MerchandisingProduct) {
    const text =
        `${product.title ?? ""} ${product.categoryName ?? ""} ${product.subcategoryName ?? ""}`.toLowerCase();
    return (
        /aroma|candle/.test(text) && getProductDiscountPercent(product) >= 30
    );
}

export function rankFestiveProductIds(products: MerchandisingProduct[]) {
    return [...products]
        .sort((a, b) => {
            const aromaPriority =
                Number(isAromaAndCandles(b)) - Number(isAromaAndCandles(a));
            if (aromaPriority !== 0) return aromaPriority;

            const discountPriority =
                getProductDiscountPercent(b) - getProductDiscountPercent(a);
            if (discountPriority !== 0) return discountPriority;

            return categoryRank(a.categoryName) - categoryRank(b.categoryName);
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

    return Math.max(28, curatedProductCount);
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
