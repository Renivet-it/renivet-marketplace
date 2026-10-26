import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const rewearPickupRequests = pgTable("rewear_pickup_requests", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    fullName: text("full_name").notNull(),
    mobileNumber: text("mobile_number").notNull(),
    locality: text("locality").notNull(),
    garmentCount: text("garment_count").notNull(),
    contactMethod: text("contact_method").notNull(),
    categoryNote: text("category_note"),
    consent: boolean("consent").notNull(),
    ...timestamps,
});
