import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { productCategories, products } from "./product";

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    ...timestamps,
});

export const subCategories = pgTable("sub_categories", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    categoryId: uuid("category_id")
        .notNull()
        .references(() => categories.id, {
            onDelete: "cascade",
        }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    ...timestamps,
});

export const productTypes = pgTable("product_types", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    categoryId: uuid("category_id")
        .notNull()
        .references(() => categories.id, {
            onDelete: "cascade",
        }),
    subCategoryId: uuid("sub_category_id")
        .notNull()
        .references(() => subCategories.id, {
            onDelete: "cascade",
        }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    ...timestamps,
});

export const categoriesRelations = relations(categories, ({ many }) => ({
    subCategories: many(subCategories),
    productTypes: many(productTypes),
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
        category: one(categories, {
            fields: [productTypes.categoryId],
            references: [categories.id],
        }),
        products: many(products),
        productCategories: many(productCategories),
    })
);
