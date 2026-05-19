import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
