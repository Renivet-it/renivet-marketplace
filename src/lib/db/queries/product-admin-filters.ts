import { sql, SQL } from "drizzle-orm";
import { products } from "../schema";

export type SizeChartFilter = "with" | "without" | "all";

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
