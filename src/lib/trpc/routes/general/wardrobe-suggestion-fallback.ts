import { sql, type SQL } from "drizzle-orm";

type CartItemWithCategory = {
    product?: {
        categoryId?: string | null;
    };
};

export const getWardrobeFallbackCategoryIds = (
    cart: CartItemWithCategory[]
) =>
    Array.from(
        new Set(
            cart
                .map((item) => item.product?.categoryId)
                .filter((categoryId): categoryId is string => Boolean(categoryId))
        )
    );

type WardrobeFallbackRow = Record<string, unknown>;

type VectorOrFallbackQuery = {
    getVectorRows: () => Promise<WardrobeFallbackRow[]>;
    getFallbackRows: () => Promise<WardrobeFallbackRow[]>;
    onFallback: (reason: "empty_ml_results" | "ml_failure") => void;
};

export const getVectorOrDeterministicFallbackRows = async ({
    getVectorRows,
    getFallbackRows,
    onFallback,
}: VectorOrFallbackQuery): Promise<WardrobeFallbackRow[]> => {
    try {
        const vectorRows = await getVectorRows();
        if (vectorRows.length > 0) return vectorRows;

        onFallback("empty_ml_results");
    } catch {
        onFallback("ml_failure");
    }

    return getFallbackRows();
};

type WardrobeFallbackQuery = {
    categoryIds: string[];
    cartProductIds: string[];
    execute: (query: SQL) => Promise<unknown>;
};

export const getDeterministicWardrobeFallbackRows = async ({
    categoryIds,
    cartProductIds,
    execute,
}: WardrobeFallbackQuery): Promise<WardrobeFallbackRow[]> => {
    if (!categoryIds.length) return [];

    const categoryList = sql.join(
        categoryIds.map((categoryId) => sql`${categoryId}`),
        sql`, `
    );
    const excludeList = sql.join(
        cartProductIds.map((productId) => sql`${productId}`),
        sql`, `
    );

    const result = await execute(sql`
        SELECT
            p.id::text AS id,
            p.title,
            p.slug,
            COALESCE(NULLIF(p.price, 0), (SELECT MIN(price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_deleted = false)) AS price,
            COALESCE(NULLIF(p.compare_at_price, 0), (SELECT MIN(compare_at_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_deleted = false)) AS "compareAtPrice",
            p.brand_id::text AS "brandId",
            p.media,
            p.category_id::text AS "categoryId",
            b.name AS "brandName",
            (
                SELECT id::text
                FROM product_variants pv
                WHERE pv.product_id = p.id
                  AND pv.is_deleted = false
                  AND pv.quantity > 0
                LIMIT 1
            ) AS "defaultVariantId",
            0 AS distance
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.category_id::text IN (${categoryList})
          AND p.id::text NOT IN (${excludeList})
          AND p.is_deleted = false
          AND p.is_active = true
          AND p.is_available = true
          AND p.is_published = true
          AND p.verification_status = 'approved'
        ORDER BY
            CASE WHEN p.is_best_seller = true THEN 0 ELSE 1 END ASC,
            p.created_at DESC
        LIMIT 8
    `);

    if (Array.isArray(result)) return result as WardrobeFallbackRow[];

    const rows = (result as { rows?: unknown[] } | null)?.rows;
    return Array.isArray(rows) ? (rows as WardrobeFallbackRow[]) : [];
};
