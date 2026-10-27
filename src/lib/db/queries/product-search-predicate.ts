import { and, inArray, or, sql } from "drizzle-orm";
import { products } from "../schema";

const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "for",
    "in",
    "of",
    "on",
    "the",
    "with",
]);
const COLORS = new Set([
    "red",
    "blue",
    "green",
    "black",
    "white",
    "pink",
    "yellow",
    "orange",
    "purple",
    "brown",
    "grey",
    "gray",
    "beige",
    "maroon",
    "navy",
]);

export function getCatalogTextSearchPredicate(processedSearch: string) {
    const words = processedSearch
        .trim()
        .split(/[\s-]+/)
        .filter(Boolean);
    const significantWords = words.filter(
        (word) => !STOP_WORDS.has(word.toLowerCase())
    );
    const terms = (significantWords.length ? significantWords : words).slice(
        0,
        8
    );
    return and(
        ...terms.map((word) => {
            const term =
                word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
                    ? word.slice(0, -1)
                    : word;
            // Match word starts: "red" must not match the end of "checkered".
            const pattern = `\\m${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
            if (COLORS.has(term.toLowerCase())) {
                return or(
                    sql`${products.title} ~* ${pattern}`,
                    sql`EXISTS (
                    SELECT 1 FROM product_options po,
                        jsonb_to_recordset(po.values) AS item(name text)
                    WHERE po.product_id = ${products.id}
                      AND LOWER(po.name) IN ('color', 'colour')
                      AND item.name ~* ${pattern}
                )`
                );
            }
            return or(
                sql`${products.title} ~* ${pattern}`,
                sql`${products.description} ~* ${pattern}`,
                sql`${products.metaTitle} ~* ${pattern}`,
                sql`${products.metaDescription} ~* ${pattern}`,
                sql`array_to_string(${products.metaKeywords}, ' ') ~* ${pattern}`,
                sql`EXISTS (SELECT 1 FROM brands b WHERE b.id = ${products.brandId} AND b.name ~* ${pattern})`,
                sql`EXISTS (SELECT 1 FROM categories c WHERE c.id = ${products.categoryId} AND c.name ~* ${pattern})`,
                sql`EXISTS (SELECT 1 FROM sub_categories sc WHERE sc.id = ${products.subcategoryId} AND sc.name ~* ${pattern})`,
                sql`EXISTS (SELECT 1 FROM product_types pt WHERE pt.id = ${products.productTypeId} AND pt.name ~* ${pattern})`
            );
        })
    );
}

export const getCatalogSearchPredicate = ({
    processedSearch,
    ragProductIds,
    vectorProductIds = [],
}: {
    processedSearch: string;
    ragProductIds: string[];
    vectorProductIds?: string[];
}) => {
    const candidates = ragProductIds.length ? ragProductIds : vectorProductIds;
    return or(
        getCatalogTextSearchPredicate(processedSearch),
        candidates.length ? inArray(products.id, candidates) : undefined
    );
};
