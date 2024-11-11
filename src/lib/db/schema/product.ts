import { relations } from "drizzle-orm";
import {
    boolean,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { categories, productTypes, subCategories } from "./category";

export const products = pgTable("products", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", {
        precision: 10,
        scale: 2,
    }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    colors: text("colors").$type<string[]>(),
    brandId: uuid("brand_id")
        .notNull()
        .references(() => brands.id, {
            onDelete: "cascade",
        }),
    productTypeId: uuid("product_type_id")
        .notNull()
        .references(() => productTypes.id, {
            onDelete: "cascade",
        }),
    images: jsonb("images").$type<
        {
            color: string;
            urls: string[];
        }[]
    >(),
    ...timestamps,
});

export const productCategories = pgTable("product_categories", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),
    subcategoryId: uuid("subcategory_id")
        .notNull()
        .references(() => subCategories.id, {
            onDelete: "cascade",
        }),
    productTypeId: uuid("product_type_id")
        .notNull()
        .references(() => productTypes.id, {
            onDelete: "cascade",
        }),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...timestamps,
});

export const productsRelations = relations(products, ({ one, many }) => ({
    primaryType: one(productTypes, {
        fields: [products.productTypeId],
        references: [productTypes.id],
    }),
    categories: many(productCategories),
}));

export const productCategoriesRelations = relations(
    productCategories,
    ({ one }) => ({
        product: one(products, {
            fields: [productCategories.productId],
            references: [products.id],
        }),
        category: one(categories, {
            fields: [productCategories.categoryId],
            references: [categories.id],
        }),
        subcategory: one(subCategories, {
            fields: [productCategories.subcategoryId],
            references: [subCategories.id],
        }),
        productType: one(productTypes, {
            fields: [productCategories.productTypeId],
            references: [productTypes.id],
        }),
    })
);
