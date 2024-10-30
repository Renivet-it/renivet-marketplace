import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    isActive: boolean().notNull().default(true),
    ...timestamps,
});
