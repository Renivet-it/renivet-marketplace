import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { blogTags } from "./blog";

export const tags = pgTable("tags", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    ...timestamps,
});

export const tagRelations = relations(tags, ({ many }) => ({
    blogTags: many(blogTags),
}));
