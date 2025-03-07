import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { coupons } from "./coupon";
import { products } from "./product";
import { users } from "./user";

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    commissionRate: integer("commission_rate").notNull().default(0),
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

export const categoryRequests = pgTable("category_requests", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    brandId: uuid("brand_id")
        .notNull()
        .references(() => brands.id, {
            onDelete: "cascade",
        }),
    content: text("content").notNull(),
    status: text("status", {
        enum: ["pending", "approved", "rejected"],
    })
        .notNull()
        .default("pending"),
    rejectionReason: text("rejection_reason"),
    rejectedAt: timestamp("rejected_at"),
    ...timestamps,
});

export const categoriesRelations = relations(categories, ({ many }) => ({
    subCategories: many(subCategories),
    productTypes: many(productTypes),
    coupons: many(coupons),
}));

export const subCategoriesRelations = relations(
    subCategories,
    ({ one, many }) => ({
        category: one(categories, {
            fields: [subCategories.categoryId],
            references: [categories.id],
        }),
        productTypes: many(productTypes),
        coupons: many(coupons),
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
        coupons: many(coupons),
    })
);

export const categoryRequestsRelations = relations(
    categoryRequests,
    ({ one }) => ({
        user: one(users, {
            fields: [categoryRequests.userId],
            references: [users.id],
        }),
        brand: one(brands, {
            fields: [categoryRequests.brandId],
            references: [brands.id],
        }),
    })
);
