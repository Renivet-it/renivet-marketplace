import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const banners = pgTable("home_banners", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
});
