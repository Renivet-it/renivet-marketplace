import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const whatsappMessageLogs = pgTable("whatsapp_message_logs", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    fullName: text("full_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    templateKey: text("template_key").notNull(),
    templateName: text("template_name").notNull(),
    status: text("status").notNull(),
    success: boolean("success").notNull().default(false),
    sid: text("sid"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(1),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    ...timestamps,
});
