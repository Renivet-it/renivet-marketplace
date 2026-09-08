import { ilike, inArray, or, sql } from "drizzle-orm";
import { products } from "../schema";

export const getCatalogSearchPredicate = ({
    processedSearch,
    ragProductIds,
}: {
    processedSearch: string;
    ragProductIds: string[];
}) => {
    if (ragProductIds.length > 0) {
        return inArray(products.id, ragProductIds);
    }

    const localSearchPattern = `%${processedSearch}%`;

    return or(
        ilike(products.title, localSearchPattern),
        ilike(products.description, localSearchPattern),
        ilike(products.metaTitle, localSearchPattern),
        ilike(products.metaDescription, localSearchPattern),
        sql`EXISTS (
            SELECT 1
            FROM brands b
            WHERE b.id = ${products.brandId}
              AND LOWER(b.name) LIKE ${localSearchPattern}
        )`,
        sql`EXISTS (
            SELECT 1
            FROM categories c
            WHERE c.id = ${products.categoryId}
              AND LOWER(c.name) LIKE ${localSearchPattern}
        )`,
        sql`EXISTS (
            SELECT 1
            FROM sub_categories sc
            WHERE sc.id = ${products.subcategoryId}
              AND LOWER(sc.name) LIKE ${localSearchPattern}
        )`,
        sql`EXISTS (
            SELECT 1
            FROM product_types pt
            WHERE pt.id = ${products.productTypeId}
              AND LOWER(pt.name) LIKE ${localSearchPattern}
        )`
    );
};
