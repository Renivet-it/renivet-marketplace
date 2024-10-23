import { relations } from "drizzle-orm";
import {
    boolean,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";
import { Profile } from "../validations";

// SCHEMAS

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    phone: text("phone").unique(),
    address: jsonb("address").$type<Profile["address"]>(),
    isProfileCompleted: boolean("is_profile_completed")
        .notNull()
        .default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const brands = pgTable("brands", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    name: text("name").notNull().unique(),
    logoUrl: text("logo_url"),
    registeredBy: text("registered_by")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    bio: text("bio"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const category = pgTable("category", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    name: text("name").notNull().unique(),
    description: text("description"),
    parentId: text("parent_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", {
        precision: 10,
        scale: 2,
    }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    colors: text("colors").$type<string[]>(),
    brandId: text("brand_id")
        .notNull()
        .references(() => brands.id, {
            onDelete: "cascade",
        }),
    categoryId: text("category_id")
        .notNull()
        .references(() => category.id, {
            onDelete: "cascade",
        }),
    subCategoryId: text("sub_category_id")
        .notNull()
        .references(() => category.id, {
            onDelete: "cascade",
        }),
    images: text("images").$type<
        {
            color: string;
            urls: string[];
        }[]
    >(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// RELATIONS

export const usersRelations = relations(users, ({ one }) => ({
    profile: one(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));
