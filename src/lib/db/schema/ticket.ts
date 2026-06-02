import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const tickets = pgTable("tickets", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    ...timestamps,
});

export const supportTickets = pgTable("support_tickets", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    brandId: uuid("brand_id").notNull(),
    title: text("title").notNull(),
    issueType: text("issue_type").notNull(),
    issueLabel: text("issue_label"),
    description: text("description"),
    sourceChannel: text("source_channel").notNull().default("admin_manual"),
    firstResponseDueAt: timestamp("first_response_due_at"),
    firstRespondedAt: timestamp("first_responded_at"),
    resolutionDueAt: timestamp("resolution_due_at"),
    nextCustomerUpdateDueAt: timestamp("next_customer_update_due_at"),
    autoAckSentAt: timestamp("auto_ack_sent_at"),
    autoAckTemplateKey: text("auto_ack_template_key"),
    resolutionCode: text("resolution_code"),
    customerPingCount: integer("customer_ping_count").notNull().default(0),
    escalatedAt: timestamp("escalated_at"),
    escalationOwner: text("escalation_owner"),
    autoCloseEligibleAt: timestamp("auto_close_eligible_at"),
    reopenAllowedUntil: timestamp("reopen_allowed_until"),
    csatScore: integer("csat_score"),
    csatComment: text("csat_comment"),
    csatSentAt: timestamp("csat_sent_at"),
    csatRespondedAt: timestamp("csat_responded_at"),
    preventable: boolean("preventable").notNull().default(false),
    patternTags: jsonb("pattern_tags").$type<string[]>().default([]),
    assignedAdminId: text("assigned_admin_id"),
    latestMessageAt: timestamp("latest_message_at").defaultNow(),
    lastOpenedAt: timestamp("last_opened_at"),
    statusChangedAt: timestamp("status_changed_at").defaultNow(),
    resolutionType: text("resolution_type"),
    resolutionSummary: text("resolution_summary"),
    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    tags: jsonb("tags").$type<string[]>().default([]),
    status: text("status").notNull().default("open"),
    priority: text("priority").default("normal"),
    unreadByBrand: text("unread_by_brand").notNull().default("true"),
    unreadByAdmin: text("unread_by_admin").notNull().default("true"),
    ...timestamps,
});

export const supportMessages = pgTable("support_messages", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    ticketId: uuid("ticket_id")
        .notNull()
        .references(() => supportTickets.id),
    sender: text("sender").notNull(),
    senderId: text("sender_id").notNull(),
    text: text("text").notNull(),
    messageType: text("message_type").notNull().default("message"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    ...timestamps,
});

export const supportAttachments = pgTable("support_attachments", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    messageId: uuid("message_id")
        .notNull()
        .references(() => supportMessages.id),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    contentType: text("content_type"),
    sizeBytes: text("size_bytes"),
    fileKey: text("file_key"),
    ...timestamps,
});

export const supportInternalNotes = pgTable("support_internal_notes", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    ticketId: uuid("ticket_id")
        .notNull()
        .references(() => supportTickets.id),
    authorId: text("author_id").notNull(),
    note: text("note").notNull(),
    attachments: jsonb("attachments").$type<
        Array<{
            filename: string;
            url: string;
            contentType?: string | null;
        }>
    >().default([]),
    ...timestamps,
});

export const supportAssignments = pgTable("support_assignments", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    ticketId: uuid("ticket_id")
        .notNull()
        .references(() => supportTickets.id),
    adminId: text("admin_id").notNull(),
    ...timestamps,
});

export const supportTicketStatusHistory = pgTable(
    "support_ticket_status_history",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        ticketId: uuid("ticket_id")
            .notNull()
            .references(() => supportTickets.id),
        prevStatus: text("prev_status"),
        newStatus: text("new_status").notNull(),
        changedBy: text("changed_by"),
        reason: text("reason"),
        ...timestamps,
    }
);

export const userSupportTickets = pgTable("user_support_tickets", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: text("user_id").notNull(),
    orderId: text("order_id"),
    orderItemId: uuid("order_item_id"),
    brandId: uuid("brand_id"),
    title: text("title").notNull(),
    category: text("category").notNull(),
    issueType: text("issue_type").notNull(),
    issueLabel: text("issue_label"),
    description: text("description"),
    sourceChannel: text("source_channel").notNull().default("web_form"),
    firstResponseDueAt: timestamp("first_response_due_at"),
    firstRespondedAt: timestamp("first_responded_at"),
    resolutionDueAt: timestamp("resolution_due_at"),
    nextCustomerUpdateDueAt: timestamp("next_customer_update_due_at"),
    autoAckSentAt: timestamp("auto_ack_sent_at"),
    autoAckTemplateKey: text("auto_ack_template_key"),
    resolutionCode: text("resolution_code"),
    customerPingCount: integer("customer_ping_count").notNull().default(0),
    escalatedAt: timestamp("escalated_at"),
    escalationOwner: text("escalation_owner"),
    autoCloseEligibleAt: timestamp("auto_close_eligible_at"),
    reopenAllowedUntil: timestamp("reopen_allowed_until"),
    csatScore: integer("csat_score"),
    csatComment: text("csat_comment"),
    csatSentAt: timestamp("csat_sent_at"),
    csatRespondedAt: timestamp("csat_responded_at"),
    preventable: boolean("preventable").notNull().default(false),
    patternTags: jsonb("pattern_tags").$type<string[]>().default([]),
    assignedAdminId: text("assigned_admin_id"),
    latestMessageAt: timestamp("latest_message_at").defaultNow(),
    lastOpenedAt: timestamp("last_opened_at"),
    statusChangedAt: timestamp("status_changed_at").defaultNow(),
    resolutionType: text("resolution_type"),
    resolutionSummary: text("resolution_summary"),
    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    tags: jsonb("tags").$type<string[]>().default([]),
    intakeContext: jsonb("intake_context").$type<Record<string, unknown> | null>().default(null),
    brandActionRequired: boolean("brand_action_required").notNull().default(false),
    brandActionStatus: text("brand_action_status").default("not_required"),
    linkedReplacementOrderId: text("linked_replacement_order_id"),
    status: text("status").notNull().default("open"),
    priority: text("priority").default("normal"),
    unreadByUser: text("unread_by_user").notNull().default("false"),
    unreadByAdmin: text("unread_by_admin").notNull().default("true"),
    ...timestamps,
});

export const userSupportMessages = pgTable("user_support_messages", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    ticketId: uuid("ticket_id")
        .notNull()
        .references(() => userSupportTickets.id),
    sender: text("sender").notNull(),
    senderId: text("sender_id").notNull(),
    text: text("text").notNull(),
    messageType: text("message_type").notNull().default("message"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    ...timestamps,
});

export const userSupportAttachments = pgTable("user_support_attachments", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    messageId: uuid("message_id")
        .notNull()
        .references(() => userSupportMessages.id),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    contentType: text("content_type"),
    sizeBytes: text("size_bytes"),
    fileKey: text("file_key"),
    ...timestamps,
});

export const userSupportInternalNotes = pgTable("user_support_internal_notes", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    ticketId: uuid("ticket_id")
        .notNull()
        .references(() => userSupportTickets.id),
    authorId: text("author_id").notNull(),
    note: text("note").notNull(),
    attachments: jsonb("attachments").$type<
        Array<{
            filename: string;
            url: string;
            contentType?: string | null;
        }>
    >().default([]),
    ...timestamps,
});

export const userSupportDisputes = pgTable("user_support_disputes", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    ticketId: uuid("ticket_id")
        .notNull()
        .references(() => userSupportTickets.id),
    orderId: text("order_id").notNull(),
    orderItemId: uuid("order_item_id"),
    brandId: uuid("brand_id").notNull(),
    disputeType: text("dispute_type").notNull().default("replacement"),
    status: text("status").notNull().default("pending_admin_review"),
    adminDecision: text("admin_decision"),
    adminDecisionSummary: text("admin_decision_summary"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    actionRequestedAt: timestamp("action_requested_at"),
    actionCompletedAt: timestamp("action_completed_at"),
    replacementOrderId: text("replacement_order_id"),
    couponCode: text("coupon_code"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    ...timestamps,
});

export const supportDailyCheckIns = pgTable("support_daily_check_ins", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    checkDate: date("check_date").notNull(),
    checkType: text("check_type").notNull(),
    ownerId: text("owner_id"),
    openTickets: integer("open_tickets").notNull().default(0),
    agedTickets24h: integer("aged_tickets_24h").notNull().default(0),
    approachingSla: integer("approaching_sla").notNull().default(0),
    breachedSla: integer("breached_sla").notNull().default(0),
    criticalTickets: integer("critical_tickets").notNull().default(0),
    summary: text("summary"),
    blockers: text("blockers"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    ...timestamps,
});

export const supportWeeklySummaries = pgTable("support_weekly_summaries", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    weekStart: date("week_start").notNull(),
    weekEnd: date("week_end").notNull(),
    ownerId: text("owner_id"),
    ticketsOpened: integer("tickets_opened").notNull().default(0),
    ticketsResolved: integer("tickets_resolved").notNull().default(0),
    openTicketsAtWeekEnd: integer("open_tickets_at_week_end").notNull().default(0),
    agedTickets48h: integer("aged_tickets_48h").notNull().default(0),
    slaBreaches: integer("sla_breaches").notNull().default(0),
    escalatedToAj: integer("escalated_to_aj").notNull().default(0),
    avgFirstResponseMinutes: integer("avg_first_response_minutes"),
    slaHitRate: integer("sla_hit_rate"),
    csatAverage: integer("csat_average"),
    topCategories: jsonb("top_categories").$type<Array<{ category: string; count: number }>>().default([]),
    topResolutionCodes: jsonb("top_resolution_codes").$type<Array<{ code: string; count: number }>>().default([]),
    summary: text("summary"),
    actionItems: jsonb("action_items").$type<string[]>().default([]),
    ...timestamps,
});

export const supportMonthlyPatternReviews = pgTable("support_monthly_pattern_reviews", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    reviewMonth: text("review_month").notNull(),
    ownerId: text("owner_id"),
    totalTickets: integer("total_tickets").notNull().default(0),
    csatAverage: integer("csat_average"),
    firstTouchResolutionRate: integer("first_touch_resolution_rate"),
    refundRate: integer("refund_rate"),
    preventableIssueRate: integer("preventable_issue_rate"),
    topCategories: jsonb("top_categories").$type<Array<{ category: string; count: number }>>().default([]),
    topBrandsByComplaint: jsonb("top_brands_by_complaint").$type<Array<{ brandId: string | null; count: number }>>().default([]),
    customersWithMultipleTickets: jsonb("customers_with_multiple_tickets").$type<Array<{ userId: string; count: number }>>().default([]),
    learnings: text("learnings"),
    driveLink: text("drive_link"),
    actionItems: jsonb("action_items").$type<string[]>().default([]),
    ...timestamps,
});
