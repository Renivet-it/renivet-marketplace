import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { products, productVariants } from "./product";

export const backInStockRequests = pgTable(
    "back_in_stock_requests",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        variantId: uuid("variant_id").references(() => productVariants.id, {
            onDelete: "set null",
        }),
        userId: text("user_id"),
        email: text("email"),
        phone: text("phone"),
        status: text("status", {
            enum: ["active", "notified", "cancelled"],
        })
            .notNull()
            .default("active"),
        source: text("source").notNull().default("pdp"),
        ...timestamps,
    },
    (table) => ({
        productIdx: index("back_in_stock_requests_product_idx").on(
            table.productId
        ),
        variantIdx: index("back_in_stock_requests_variant_idx").on(
            table.variantId
        ),
        contactUniqueIdx: uniqueIndex(
            "back_in_stock_requests_product_variant_contact_unique"
        ).on(table.productId, table.variantId, table.email, table.phone),
    })
);
