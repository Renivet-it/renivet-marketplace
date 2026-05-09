import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name"),
    email: text("email").unique(),
    phone: text("phone").unique(),
    userId: text("user_id").unique(),
    source: text("source").notNull().default("newsletter"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
});
