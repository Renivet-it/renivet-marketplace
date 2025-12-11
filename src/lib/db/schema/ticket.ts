import {
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../helper";

/* -------------------------------------------------------
 * EXISTING TABLE YOU SHARED
 * ------------------------------------------------------- */
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  ...timestamps,
});

/* -------------------------------------------------------
 * SUPPORT SYSTEM TABLES (FULL)
 * ------------------------------------------------------- */

/* ------------------------------
 * 1) SUPPORT TICKETS
 * ------------------------------ */
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),

  brandId: uuid("brand_id").notNull(), // FK to your brands table

  title: text("title").notNull(),
  issueType: text("issue_type").notNull(), // orders | payouts | products | account
  description: text("description"),

  status: text("status").notNull().default("open"),
  // open | in_progress | resolved | escalated

  priority: text("priority").default("normal"),
  // low | normal | high

  unreadByBrand: text("unread_by_brand").notNull().default("true"),
  unreadByAdmin: text("unread_by_admin").notNull().default("true"),

  ...timestamps,
});

/* ------------------------------
 * 2) SUPPORT MESSAGES (CHAT)
 * ------------------------------ */
export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),

  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => supportTickets.id),

  sender: text("sender").notNull(), // brand | admin
  senderId: uuid("sender_id"), // FK to brand user or admin user table

  text: text("text").notNull(),

  ...timestamps,
});

/* ------------------------------
 * 3) SUPPORT ATTACHMENTS
 * ------------------------------ */
export const supportAttachments = pgTable("support_attachments", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),

  messageId: uuid("message_id")
    .notNull()
    .references(() => supportMessages.id),

  filename: text("filename").notNull(),
  url: text("url").notNull(),

  contentType: text("content_type"),
  sizeBytes: text("size_bytes"),

  ...timestamps,
});

/* ------------------------------
 * 4) OPTIONAL — ASSIGN TICKET TO ADMIN
 * ------------------------------ */
export const supportAssignments = pgTable("support_assignments", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),

  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => supportTickets.id),

  adminId: uuid("admin_id").notNull(), // FK to your users table

  ...timestamps,
});

/* ------------------------------
 * 5) OPTIONAL — TICKET STATUS HISTORY
 * ------------------------------ */
export const supportTicketStatusHistory = pgTable(
  "support_ticket_status_history",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id),

    prevStatus: text("prev_status"),
    newStatus: text("new_status").notNull(),
    changedBy: uuid("changed_by"), // admin id
    reason: text("reason"),

    ...timestamps,
  }
);
