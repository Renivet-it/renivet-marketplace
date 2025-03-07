import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const legals = pgTable("legals", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    privacyPolicy: text("privacy_policy"),
    termsOfService: text("terms_of_service"),
    shippingPolicy: text("shipping_policy"),
    refundPolicy: text("refund_policy"),
    ppCreatedAt: timestamp("pp_created_at").notNull().defaultNow(),
    tosCreatedAt: timestamp("tos_created_at").notNull().defaultNow(),
    spCreatedAt: timestamp("sp_created_at").notNull().defaultNow(),
    rpCreatedAt: timestamp("rp_created_at").notNull().defaultNow(),
    ppUpdatedAt: timestamp("pp_updated_at").notNull().defaultNow(),
    tosUpdatedAt: timestamp("tos_updated_at").notNull().defaultNow(),
    spUpdatedAt: timestamp("sp_updated_at").notNull().defaultNow(),
    rpUpdatedAt: timestamp("rp_updated_at").notNull().defaultNow(),
});
