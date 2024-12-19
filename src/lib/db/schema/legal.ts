import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const legals = pgTable("legals", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    privacyPolicy: text("privacy_policy"),
    termsOfService: text("terms_of_service"),
    ppCreatedAt: timestamp("pp_created_at").notNull().defaultNow(),
    tosCreatedAt: timestamp("tos_created_at").notNull().defaultNow(),
    ppUpdatedAt: timestamp("pp_updated_at").notNull().defaultNow(),
    tosUpdatedAt: timestamp("tos_updated_at").notNull().defaultNow(),
});
