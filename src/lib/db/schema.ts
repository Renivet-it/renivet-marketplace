import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
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

export const brandsWaitlist = pgTable("brands_waitlist", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    brandName: text("brand_name").notNull(),
    brandEmail: text("brand_email").notNull().unique(),
    brandPhone: text("brand_phone"),
    brandWebsite: text("brand_website"),
});

export const blogTags = pgTable("blog_tags", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogs = pgTable("blogs", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    authorId: text("author_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogToTags = pgTable(
    "blog_to_tags",
    {
        id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
        blogId: text("blog_id")
            .notNull()
            .references(() => blogs.id, { onDelete: "cascade" }),
        tagId: text("tag_id")
            .notNull()
            .references(() => blogTags.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => {
        return {
            blogIdIdx: index("blog_id_idx").on(table.blogId),
            tagIdIdx: index("tag_id_idx").on(table.tagId),
            blogTagIdx: uniqueIndex("blog_tag_idx").on(
                table.blogId,
                table.tagId
            ),
        };
    }
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: text("id").primaryKey().notNull().unique().$defaultFn(generateId),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
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

export const usersRelations = relations(users, ({ one, many }) => ({
    profile: one(profiles),
    blogs: many(blogs),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));

export const blogsRelations = relations(blogs, ({ one, many }) => ({
    author: one(users, {
        fields: [blogs.authorId],
        references: [users.id],
    }),
    blogToTags: many(blogToTags),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
    blogToTags: many(blogToTags),
}));

export const blogToTagsRelations = relations(blogToTags, ({ one }) => ({
    blog: one(blogs, {
        fields: [blogToTags.blogId],
        references: [blogs.id],
    }),
    tag: one(blogTags, {
        fields: [blogToTags.tagId],
        references: [blogTags.id],
    }),
}));
