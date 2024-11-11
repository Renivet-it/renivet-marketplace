import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { blogTags } from "./blog";

export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ...timestamps,
});

export const tagRelations = relations(tags, ({ many }) => ({
    blogTags: many(blogTags),
}));
