import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const emailMessageLogs = pgTable("email_message_logs", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    subject: text("subject").notNull(),
    emailContent: text("email_content").notNull(),
    status: text("status").notNull(),
    success: boolean("success").notNull().default(false),
    messageId: text("message_id"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(1),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    ...timestamps,
});
