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

const FESTIVE_CATEGORY_PRIORITY = new Map([
    ["home & living", 0],
    ["home and living", 0],
    ["beauty products", 1],
    ["beauty and personal care", 1],
    ["beauty & personal care", 1],
    ["women", 2],
    ["men", 3],
]);

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
    return normalized
        ? (FESTIVE_CATEGORY_PRIORITY.get(normalized) ??
              FESTIVE_CATEGORY_PRIORITY.size)
        : FESTIVE_CATEGORY_PRIORITY.size;
}

export function rankFestiveProductIds(products: MerchandisingProduct[]) {
    return [...products]
        .sort((a, b) => {
            const discountBand =
                Number(getProductDiscountPercent(b) > 30) -
                Number(getProductDiscountPercent(a) > 30);
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

export function buildFestiveCatalogOrdering(
    entries: Array<{
        productId: string;
        product: MerchandisingProduct & {
            categoryId?: string | null;
            subcategoryId?: string | null;
        };
    }>,
    categories: Array<{ id: string; name: string }>,
    subcategories: Array<{ id: string; name: string }>
) {
    const categoryNames = new Map(
        categories.map((category) => [category.id, category.name])
    );
    const subcategoryNames = new Map(
        subcategories.map((subcategory) => [subcategory.id, subcategory.name])
    );
    const products = entries.map(({ product }) => ({
        ...product,
        categoryName: product.categoryId
            ? categoryNames.get(product.categoryId)
            : undefined,
        subcategoryName: product.subcategoryId
            ? subcategoryNames.get(product.subcategoryId)
            : undefined,
    }));

    return {
        curatedProductIds: Array.from(
            new Set(entries.map((entry) => entry.productId).filter(Boolean))
        ),
        curatedDefaultOrder: Array.from(
            new Set(rankFestiveProductIds(products))
        ),
    };
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

const BAMBOOLOGY_CATEGORY_PRIORITY = new Map([
    ["women", 0],
    ["men", 1],
    ["home & living", 2],
    ["home and living", 2],
    ["beauty", 3],
    ["beauty products", 3],
    ["beauty and personal care", 3],
    ["beauty & personal care", 3],
]);

const BAMBOOLOGY_SUBCATEGORY_PRIORITY = new Map([
    ["women|western wear", 0],
    ["women|women sports and active wear", 1],
    ["women|women sports & active wear", 1],
    ["women|lingerie and sleepwear", 2],
    ["men|topwear", 0],
    ["men|men sports and active wear", 1],
    ["men|men sports & active wear", 1],
    ["men|innerwear and sleepwear", 2],
]);

function normalizedMerchandisingName(value?: string | null) {
    return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

export function rankProductIdsByCategoryAndSubcategory(
    subcategories: Array<{
        id: string;
        categoryId: string;
        name: string;
    }>,
    categories: Array<{ id: string; name: string }>
) {
    const categoryNames = new Map(
        categories.map((category) => [
            category.id,
            normalizedMerchandisingName(category.name),
        ])
    );

    return [...subcategories]
        .map((subcategory, index) => {
            const categoryName =
                categoryNames.get(subcategory.categoryId) ?? "";
            const categoryRank =
                BAMBOOLOGY_CATEGORY_PRIORITY.get(categoryName) ?? 4;
            const subcategoryName = normalizedMerchandisingName(
                subcategory.name
            );
            const subcategoryRank =
                BAMBOOLOGY_SUBCATEGORY_PRIORITY.get(
                    `${categoryName}|${subcategoryName}`
                ) ?? 1;

            return {
                id: subcategory.id,
                rank: categoryRank * 100 + subcategoryRank,
                index,
            };
        })
        .sort(
            (left, right) => left.rank - right.rank || left.index - right.index
        )
        .map((subcategory) => subcategory.id);
}
