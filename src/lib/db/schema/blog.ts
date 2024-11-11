import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { tags } from "./tag";
import { users } from "./user";

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
    ...timestamps,
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
        ...timestamps,
    },
    (table) => ({
        blogIdIdx: index("blog_id_idx").on(table.blogId),
        tagIdIdx: index("tag_id_idx").on(table.tagId),
        blogTagIdx: uniqueIndex("blog_tag_idx").on(table.blogId, table.tagId),
    })
);

export const blogRelations = relations(blogs, ({ one, many }) => ({
    author: one(users, {
        fields: [blogs.authorId],
        references: [users.id],
    }),
    tags: many(blogTags),
}));

export const blogTagRelations = relations(blogTags, ({ one }) => ({
    blog: one(blogs, {
        fields: [blogTags.blogId],
        references: [blogs.id],
    }),
    tag: one(tags, {
        fields: [blogTags.tagId],
        references: [tags.id],
    }),
}));
