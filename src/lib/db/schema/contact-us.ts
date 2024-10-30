import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const contactUs = pgTable("contact_us", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    company: text(),
    message: text().notNull(),
    ...timestamps,
});
