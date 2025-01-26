import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { plans } from "./plan";

export const brandSubscriptions = pgTable(
    "brand_subscriptions",
    {
        id: text("id").primaryKey().notNull().unique(),
        planId: text("plan_id")
            .notNull()
            .references(() => plans.id, {
                onDelete: "cascade",
            }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        totalCount: integer("total_count").notNull().default(1),
        quantity: integer("quantity").notNull().default(1),
        startAt: timestamp("start_at").notNull(),
        expireBy: timestamp("expire_by"),
        customerNotify: boolean("customer_notify").notNull().default(true),
        isActive: boolean("is_active").notNull().default(false),
        renewedAt: timestamp("renewed_at"),
        ...timestamps,
    },
    (table) => ({
        brandSubcriptionIsActiveIdx: index(
            "brand_subscription_is_active_idx"
        ).on(table.isActive),
        brandSubcriptionBrandIdIsActiveIdx: index(
            "brand_subscription_brand_id_is_active_idx"
        ).on(table.brandId, table.isActive),
        brandSubcriptionPlanIdIsActiveIdx: index(
            "brand_subscription_plan_id_is_active_idx"
        ).on(table.planId, table.isActive),
    })
);

export const brandSubscriptionRelations = relations(
    brandSubscriptions,
    ({ one }) => ({
        brand: one(brands, {
            fields: [brandSubscriptions.brandId],
            references: [brands.id],
        }),
        plan: one(plans, {
            fields: [brandSubscriptions.planId],
            references: [plans.id],
        }),
    })
);
