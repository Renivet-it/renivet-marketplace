import { Product } from "@/lib/validations";
import { relations } from "drizzle-orm";
import {
    index,
    integer,
    jsonb,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { products } from "./product";
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
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, {
                onDelete: "cascade",
            }),
        quantity: integer("quantity").notNull().default(1),
        size: text("size").notNull().$type<Product["sizes"][number]["name"]>(),
        color: jsonb("color").$type<Product["colors"][number]>(),
        ...timestamps,
    },
    (table) => ({
        cartUserIdIdx: index("cart_user_id_idx").on(table.userId),
        cartUserIdProductIdIdx: index("cart_user_id_product_id_idx").on(
            table.userId,
            table.productId
        ),
    })
);

export const cartRelations = relations(carts, ({ one }) => ({
    user: one(users, {
        fields: [carts.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [carts.productId],
        references: [products.id],
    }),
}));
