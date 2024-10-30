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
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    title: text().notNull(),
    slug: text().notNull().unique(),
    description: text().notNull(),
    content: text().notNull(),
    thumbnailUrl: text(),
    authorId: text()
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    isPublished: boolean().notNull().default(false),
    publishedAt: timestamp(),
    ...timestamps,
});

export const blogTags = pgTable(
    "blog_tags",
    {
        id: uuid().primaryKey().notNull().unique().defaultRandom(),
        blogId: uuid()
            .notNull()
            .references(() => blogs.id, { onDelete: "cascade" }),
        tagId: uuid()
            .notNull()
            .references(() => tags.id, { onDelete: "cascade" }),
        ...timestamps,
    },
    (table) => {
        return {
            blogIdIdx: index().on(table.blogId),
            tagIdIdx: index().on(table.tagId),
            blogTagIdx: uniqueIndex().on(table.blogId, table.tagId),
        };
    }
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
    tag: one(blogTags, {
        fields: [blogTags.tagId],
        references: [blogTags.id],
    }),
}));
