import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    unsubscribedAt: timestamp("unsubscribed_at"),
    source: text("source").notNull().default("website"),
    segments: jsonb("segments").$type<string[]>().notNull().default([]),
    ...timestamps,
});
