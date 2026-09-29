import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { orders } from "./order";

export const whatsappDelayedOrderAlerts = pgTable(
    "whatsapp_delayed_order_alerts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        alertType: text("alert_type", {
            enum: ["unshipped_48h", "undelivered_7d"],
        }).notNull(),
        phoneNumber: text("phone_number").notNull(),
        digestLine: text("digest_line").notNull(),
        status: text("status", {
            enum: ["pending", "sending", "sent", "failed"],
        })
            .notNull()
            .default("pending"),
        batchId: text("batch_id"),
        attempts: integer("attempts").notNull().default(0),
        sid: text("sid"),
        error: text("error"),
        lastAttemptAt: timestamp("last_attempt_at"),
        sentAt: timestamp("sent_at"),
        ...timestamps,
    },
    (table) => ({
        identityUniqueIndex: uniqueIndex(
            "whatsapp_delayed_order_alert_identity_idx"
        ).on(table.orderId, table.alertType, table.phoneNumber),
        batchIndex: index("whatsapp_delayed_order_alert_batch_idx").on(
            table.batchId
        ),
        statusIndex: index("whatsapp_delayed_order_alert_status_idx").on(
            table.status,
            table.alertType
        ),
    })
);
