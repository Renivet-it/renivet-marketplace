import { ilike, or, sql, type SQL } from "drizzle-orm";
import { products } from "../schema";

export function getAdminProductSearchPredicate(
    search: string
): SQL | undefined {
    const normalizedSearch = search.trim();
    if (!normalizedSearch) return undefined;

    const pattern = `%${normalizedSearch}%`;

    return or(
        ilike(products.title, pattern),
        ilike(products.nativeSku, pattern),
        sql`EXISTS (
            SELECT 1
            FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND pv.is_deleted = false
              AND (pv.native_sku ILIKE ${pattern} OR pv.sku ILIKE ${pattern})
        )`,
        sql`EXISTS (
            SELECT 1
            FROM brands b
            WHERE b.id = ${products.brandId}
              AND b.name ILIKE ${pattern}
        )`
    );
}

export function shouldUseSemanticProductSearch(input: {
    adminList?: boolean;
    search?: string;
}): boolean {
    return !input.adminList && Boolean(input.search?.trim());
}
