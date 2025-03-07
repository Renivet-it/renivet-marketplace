import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const brandsWaitlist = pgTable("brands_waitlist", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    brandName: text("brand_name").notNull(),
    brandEmail: text("brand_email").notNull().unique(),
    brandPhone: text("brand_phone").notNull(),
    brandWebsite: text("brand_website").notNull(),
    demoUrl: text("demo_url"),
    ...timestamps,
});
