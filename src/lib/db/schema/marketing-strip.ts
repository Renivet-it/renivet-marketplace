import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const marketingStrip = pgTable("marketing_strip", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    url: text("url"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
});
