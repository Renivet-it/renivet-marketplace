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
    uuid,
} from "drizzle-orm/pg-core";
import { Profile } from "../validations";

// SCHEMAS

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sitePermissions: text("site_permissions").notNull(),
    brandPermissions: text("brand_permissions").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
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

export const userRoles = pgTable(
    "user_roles",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, {
                onDelete: "cascade",
            }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => {
        return {
            userIdIdx: index("user_id_idx").on(table.userId),
            roleIdIdx: index("role_id_idx").on(table.roleId),
        };
    }
);

export const contactUs = pgTable("contact_us", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const brandsWaitlist = pgTable("brands_waitlist", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    brandName: text("brand_name").notNull(),
    brandEmail: text("brand_email").notNull().unique(),
    brandPhone: text("brand_phone"),
    brandWebsite: text("brand_website"),
});

export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogs = pgTable("blogs", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
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

export const blogTags = pgTable(
    "blog_tags",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        blogId: uuid("blog_id")
            .notNull()
            .references(() => blogs.id, { onDelete: "cascade" }),
        tagId: uuid("tag_id")
            .notNull()
            .references(() => tags.id, { onDelete: "cascade" }),
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
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const brands = pgTable("brands", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
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
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
    categoryId: uuid("category_id")
        .notNull()
        .references(() => category.id, {
            onDelete: "cascade",
        }),
    subCategoryId: uuid("sub_category_id")
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
    roles: many(userRoles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}));

export const blogsRelations = relations(blogs, ({ one, many }) => ({
    author: one(users, {
        fields: [blogs.authorId],
        references: [users.id],
    }),
    tags: many(blogTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    blogTags: many(blogTags),
}));

export const blogTagsRelations = relations(blogTags, ({ one }) => ({
    blog: one(blogs, {
        fields: [blogTags.blogId],
        references: [blogs.id],
    }),
    tag: one(blogTags, {
        fields: [blogTags.tagId],
        references: [blogTags.id],
    }),
}));
