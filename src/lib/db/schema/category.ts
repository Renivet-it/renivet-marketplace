import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { productCategories, products } from "./product";

export const categories = pgTable("categories", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text(),
    ...timestamps,
});

export const subCategories = pgTable("sub_categories", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    categoryId: uuid()
        .notNull()
        .references(() => categories.id, {
            onDelete: "cascade",
        }),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text(),
    ...timestamps,
});

export const productTypes = pgTable("product_types", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    subCategoryId: uuid()
        .notNull()
        .references(() => subCategories.id, {
            onDelete: "cascade",
        }),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text(),
    ...timestamps,
});

export const categoriesRelations = relations(categories, ({ many }) => ({
    subCategories: many(subCategories),
    productCategories: many(productCategories),
}));

export const subCategoriesRelations = relations(
    subCategories,
    ({ one, many }) => ({
        category: one(categories, {
            fields: [subCategories.categoryId],
            references: [categories.id],
        }),
        productTypes: many(productTypes),
        productCategories: many(productCategories),
    })
);

export const productTypesRelations = relations(
    productTypes,
    ({ one, many }) => ({
        subCategory: one(subCategories, {
            fields: [productTypes.subCategoryId],
            references: [subCategories.id],
        }),
        products: many(products),
        productCategories: many(productCategories),
    })
);
