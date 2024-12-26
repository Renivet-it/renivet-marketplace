import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { productVariants } from "./product";
import { users } from "./user";

export const carts = pgTable(
    "carts",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        sku: text("sku")
            .notNull()
            .references(() => productVariants.sku, {
                onDelete: "cascade",
            }),
        quantity: integer("quantity").notNull().default(1),
        status: boolean("status").notNull().default(true),
        ...timestamps,
    },
    (table) => ({
        cartUserIdIdx: index("cart_user_id_idx").on(table.userId),
        cartUserIdSkuIdx: index("cart_user_id_sku_idx").on(
            table.userId,
            table.sku
        ),
    })
);

export const cartRelations = relations(carts, ({ one }) => ({
    user: one(users, {
        fields: [carts.userId],
        references: [users.id],
    }),
    item: one(productVariants, {
        fields: [carts.sku],
        references: [productVariants.sku],
    }),
}));
