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
import { products, productVariants } from "./product";
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
        variantId: uuid("variant_id").references(() => productVariants.id, {
            onDelete: "cascade",
        }),
        quantity: integer("quantity").notNull().default(1),
        status: boolean("status").notNull().default(true),
        ...timestamps,
    },
    (table) => ({
        cartUserIdIdx: index("cart_user_id_idx").on(table.userId),
        cartUserIdProductIdVariantIdIdx: index(
            "cart_user_id_product_id_variant_id_idx"
        ).on(table.userId, table.productId, table.variantId),
        cartProductIdVariantIdIdx: index("cart_product_id_variant_id_idx").on(
            table.productId,
            table.variantId
        ),
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
    variant: one(productVariants, {
        fields: [carts.variantId],
        references: [productVariants.id],
    }),
}));
