import { Product } from "@/lib/validations";
import { relations } from "drizzle-orm";
import {
    boolean,
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
    description: text("description").notNull(),
    price: numeric("price", {
        precision: 10,
        scale: 2,
    }).notNull(),
    sizes: jsonb("sizes")
        .$type<Product["sizes"]>()
        .default([
            {
                name: "One Size",
                quantity: 0,
            },
        ])
        .notNull(),
    colors: jsonb("colors").$type<Product["colors"]>().default([]).notNull(),
    brandId: uuid("brand_id")
        .notNull()
        .references(() => brands.id, {
            onDelete: "cascade",
        }),
    imageUrls: jsonb("image_urls")
        .$type<Product["imageUrls"]>()
        .default([])
        .notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
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
    ...timestamps,
});

export const productsRelations = relations(products, ({ one, many }) => ({
    categories: many(productCategories),
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id],
    }),
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
