import { sql, SQL } from "drizzle-orm";
import { products } from "../schema";

export type SizeChartFilter = "with" | "without" | "all";
export type VariantPriceFilter = "different" | "all";

export function getSizeChartFilterQuery(
    filter?: SizeChartFilter
): SQL | undefined {
    if (filter === "with") {
        return sql`jsonb_array_length(${products.sizeChartMedia}) > 0`;
    }

    if (filter === "without") {
        return sql`jsonb_array_length(${products.sizeChartMedia}) = 0`;
    }

    return undefined;
}

export function getVariantPriceFilterQuery(
    filter?: VariantPriceFilter
): SQL | undefined {
    if (filter !== "different") return undefined;

    return sql`(
        ${products.productHasVariants} = true
        AND EXISTS (
            SELECT 1
            FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND pv.is_deleted = false
              AND pv.price IS NOT NULL
            GROUP BY pv.product_id
            HAVING COUNT(DISTINCT pv.price) > 1
        )
    )`;
}
