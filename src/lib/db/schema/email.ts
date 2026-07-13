import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { newsletterSubscribers } from "./newsletter-subscriber";
import { users } from "./user";

export const emailMessageLogs = pgTable("email_message_logs", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    subscriberId: uuid("subscriber_id").references(() => newsletterSubscribers.id, {
        onDelete: "set null",
    }),
    subject: text("subject").notNull(),
    emailContent: text("email_content").notNull(),
    campaignType: text("campaign_type", {
        enum: [
            "welcome",
            "new_arrivals",
            "blog_digest",
            "promotional",
            "abandoned_cart",
            "post_purchase_review",
            "win_back",
        ],
    }),
    campaignId: uuid("campaign_id").references(() => marketingCampaigns.id, {
        onDelete: "set null",
    }),
    automationKey: text("automation_key"),
    stepNumber: integer("step_number"),
    status: text("status").notNull(),
    success: boolean("success").notNull().default(false),
    messageId: text("message_id"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(1),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    ...timestamps,
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    type: text("type", {
        enum: [
            "welcome",
            "new_arrivals",
            "blog_digest",
            "promotional",
            "abandoned_cart",
            "post_purchase_review",
            "win_back",
        ],
    }).notNull(),
    subject: text("subject").notNull(),
    status: text("status", {
        enum: ["draft", "scheduled", "sending", "completed", "failed"],
    })
        .notNull()
        .default("draft"),
    scheduledAt: timestamp("scheduled_at"),
    contentHtml: text("content_html").notNull().default(""),
    createdBy: text("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
});

export const marketingAutomationRuns = pgTable("marketing_automation_runs", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    automationType: text("automation_type", {
        enum: ["abandoned_cart", "post_purchase_review", "win_back"],
    }).notNull(),
    automationKey: text("automation_key").notNull().unique(),
    campaignId: uuid("campaign_id").references(() => marketingCampaigns.id, {
        onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    subscriberId: uuid("subscriber_id").references(() => newsletterSubscribers.id, {
        onDelete: "set null",
    }),
    email: text("email").notNull(),
    stepNumber: integer("step_number").notNull().default(1),
    status: text("status", {
        enum: ["pending", "sent", "skipped", "stopped", "failed"],
    })
        .notNull()
        .default("pending"),
    lastAttemptAt: timestamp("last_attempt_at"),
    sentAt: timestamp("sent_at"),
    error: text("error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
});

export const marketingPartnerships = pgTable("marketing_partnerships", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    partnerName: text("partner_name").notNull(),
    brandId: uuid("brand_id"),
    campaignType: text("campaign_type").notNull(),
    plannedDate: timestamp("planned_date"),
    liveDate: timestamp("live_date"),
    goal: text("goal").notNull(),
    couponCode: text("coupon_code"),
    trackingUrl: text("tracking_url"),
    notes: text("notes"),
    status: text("status", {
        enum: ["planned", "live", "completed", "cancelled"],
    })
        .notNull()
        .default("planned"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
});

export const emailMessageLogRelations = relations(emailMessageLogs, ({ one }) => ({
    subscriber: one(newsletterSubscribers, {
        fields: [emailMessageLogs.subscriberId],
        references: [newsletterSubscribers.id],
    }),
    campaign: one(marketingCampaigns, {
        fields: [emailMessageLogs.campaignId],
        references: [marketingCampaigns.id],
    }),
}));
