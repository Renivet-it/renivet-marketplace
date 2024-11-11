import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
});
