import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { products } from "./product";
import { users } from "./user";

export const reviews = pgTable(
    "reviews",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
        authorName: text("author_name").notNull(),
        rating: integer("rating").notNull(), // 1 to 5
        title: text("title").notNull(),
        content: text("content").notNull(),
        images: jsonb("images").$type<string[]>().default([]).notNull(),
        attributes: jsonb("attributes")
            .$type<{ label: string; value: string }[]>()
            .default([])
            .notNull(),
        status: text("status", {
            enum: ["pending", "approved", "rejected"],
        })
            .notNull()
            .default("pending"),
        verified: boolean("verified").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        productIdIdx: index("review_product_id_idx").on(table.productId),
        userIdIdx: index("review_user_id_idx").on(table.userId),
        statusIdx: index("review_status_idx").on(table.status),
    })
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));
