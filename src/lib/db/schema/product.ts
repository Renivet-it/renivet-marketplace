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
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    description: text(),
    price: numeric({
        precision: 10,
        scale: 2,
    }).notNull(),
    quantity: integer().notNull().default(0),
    colors: text().$type<string[]>(),
    brandId: uuid()
        .notNull()
        .references(() => brands.id, {
            onDelete: "cascade",
        }),
    productTypeId: uuid()
        .notNull()
        .references(() => productTypes.id, {
            onDelete: "cascade",
        }),
    images: jsonb().$type<
        {
            color: string;
            urls: string[];
        }[]
    >(),
    ...timestamps,
});

export const productCategories = pgTable("product_categories", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    productId: uuid()
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid()
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),
    subcategoryId: uuid()
        .notNull()
        .references(() => subCategories.id, {
            onDelete: "cascade",
        }),
    productTypeId: uuid()
        .notNull()
        .references(() => productTypes.id, {
            onDelete: "cascade",
        }),
    isPrimary: boolean().notNull().default(false),
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
