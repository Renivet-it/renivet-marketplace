import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { products } from "./product";
import { users } from "./user";

export const wishlists = pgTable(
    "wishlists",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, {
                onDelete: "cascade",
            }),
        ...timestamps,
    },
    (table) => ({
        wishlistUserIdIdx: index("wishlist_user_id_idx").on(table.userId),
        wishlistUserIdProductIdIdx: uniqueIndex(
            "wishlist_user_id_product_id_idx"
        ).on(table.userId, table.productId),
    })
);

export const wishlistRelations = relations(wishlists, ({ one }) => ({
    user: one(users, {
        fields: [wishlists.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [wishlists.productId],
        references: [products.id],
    }),
}));
