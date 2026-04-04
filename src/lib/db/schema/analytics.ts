import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { users } from "./user";

export const analyticsDailyCommerce = pgTable(
    "analytics_daily_commerce",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        dateKey: text("date_key").notNull(),
        timezone: text("timezone").notNull().default("Asia/Kolkata"),
        currency: text("currency").notNull().default("INR"),

        grossSalesPaise: integer("gross_sales_paise").notNull().default(0),
        discountsPaise: integer("discounts_paise").notNull().default(0),
        returnsPaise: integer("returns_paise").notNull().default(0),
        netSalesPaise: integer("net_sales_paise").notNull().default(0),
        shippingPaise: integer("shipping_paise").notNull().default(0),
        taxesPaise: integer("taxes_paise").notNull().default(0),
        totalSalesPaise: integer("total_sales_paise").notNull().default(0),

        ordersCount: integer("orders_count").notNull().default(0),
        ordersFulfilledCount: integer("orders_fulfilled_count").notNull().default(0),
        customersCount: integer("customers_count").notNull().default(0),
        newCustomersCount: integer("new_customers_count").notNull().default(0),
        returningCustomersCount: integer("returning_customers_count").notNull().default(0),

        ...timestamps,
    },
    (table) => ({
        analyticsDailyCommerceUniqueIdx: uniqueIndex("analytics_daily_commerce_unique_idx").on(
            table.dateKey,
            table.timezone,
            table.currency
        ),
        analyticsDailyCommerceDateIdx: index("analytics_daily_commerce_date_idx").on(table.dateKey),
    })
);

export const analyticsDailyBehavior = pgTable(
    "analytics_daily_behavior",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        dateKey: text("date_key").notNull(),
        timezone: text("timezone").notNull().default("Asia/Kolkata"),

        sessions: integer("sessions").notNull().default(0),
        visitors: integer("visitors").notNull().default(0),
        sessionsWithCart: integer("sessions_with_cart").notNull().default(0),
        sessionsReachedCheckout: integer("sessions_reached_checkout").notNull().default(0),
        bounceSessions: integer("bounce_sessions").notNull().default(0),

        ...timestamps,
    },
    (table) => ({
        analyticsDailyBehaviorUniqueIdx: uniqueIndex("analytics_daily_behavior_unique_idx").on(
            table.dateKey,
            table.timezone
        ),
        analyticsDailyBehaviorDateIdx: index("analytics_daily_behavior_date_idx").on(table.dateKey),
    })
);

export const analyticsLandingPageDaily = pgTable(
    "analytics_landing_page_daily",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        dateKey: text("date_key").notNull(),
        timezone: text("timezone").notNull().default("Asia/Kolkata"),
        landingPath: text("landing_path").notNull(),
        landingType: text("landing_type").notNull().default("unknown"),

        sessions: integer("sessions").notNull().default(0),
        visitors: integer("visitors").notNull().default(0),
        sessionsWithCart: integer("sessions_with_cart").notNull().default(0),
        sessionsReachedCheckout: integer("sessions_reached_checkout").notNull().default(0),

        ...timestamps,
    },
    (table) => ({
        analyticsLandingPageDailyUniqueIdx: uniqueIndex("analytics_landing_page_daily_unique_idx").on(
            table.dateKey,
            table.timezone,
            table.landingPath,
            table.landingType
        ),
        analyticsLandingPageDailyDateIdx: index("analytics_landing_page_daily_date_idx").on(table.dateKey),
        analyticsLandingPageDailyPathIdx: index("analytics_landing_page_daily_path_idx").on(table.landingPath),
    })
);

export const analyticsSavedReports = pgTable(
    "analytics_saved_reports",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        name: text("name").notNull(),
        category: text("category", {
            enum: ["Sales", "Behavior", "Acquisition"],
        })
            .notNull()
            .default("Sales"),
        createdBy: text("created_by").references(() => users.id, {
            onDelete: "set null",
        }),

        metrics: jsonb("metrics").$type<string[]>().notNull().default([]),
        dimensions: jsonb("dimensions").$type<string[]>().notNull().default([]),
        filtersJson: jsonb("filters_json").$type<Record<string, unknown>>().notNull().default({}),
        visualizationType: text("visualization_type").notNull().default("line"),

        isSystemReport: boolean("is_system_report").notNull().default(false),
        isActive: boolean("is_active").notNull().default(true),
        lastViewedAt: text("last_viewed_at"),

        ...timestamps,
    },
    (table) => ({
        analyticsSavedReportsNameIdx: index("analytics_saved_reports_name_idx").on(table.name),
        analyticsSavedReportsCreatedByIdx: index("analytics_saved_reports_created_by_idx").on(table.createdBy),
        analyticsSavedReportsActiveIdx: index("analytics_saved_reports_active_idx").on(table.isActive),
    })
);

export const analyticsSavedReportsRelations = relations(
    analyticsSavedReports,
    ({ one }) => ({
        user: one(users, {
            fields: [analyticsSavedReports.createdBy],
            references: [users.id],
        }),
    })
);

