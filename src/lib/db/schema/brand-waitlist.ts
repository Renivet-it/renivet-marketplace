import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const brandsWaitlist = pgTable("brands_waitlist", {
    id: uuid().primaryKey().notNull().unique().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    brandName: text().notNull(),
    brandEmail: text().notNull().unique(),
    brandPhone: text(),
    brandWebsite: text(),
    ...timestamps,
});
