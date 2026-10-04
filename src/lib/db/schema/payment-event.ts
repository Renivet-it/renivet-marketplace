import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { orders } from "./order";

export const paymentEventReceipts = pgTable(
    "payment_event_receipts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        provider: text("provider").notNull().default("razorpay"),
        eventType: text("event_type").notNull(),
        providerPaymentId: text("provider_payment_id").notNull(),
        providerOrderId: text("provider_order_id").notNull(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        orderIntentId: text("order_intent_id"),
        amountPaise: integer("amount_paise").notNull(),
        currency: text("currency").notNull(),
        status: text("status", {
            enum: ["received", "applied", "rejected"],
        })
            .notNull()
            .default("received"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        appliedAt: timestamp("applied_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        paymentEventIdentityIdx: uniqueIndex(
            "payment_event_receipts_identity_idx"
        ).on(
            table.provider,
            table.eventType,
            table.providerPaymentId,
            table.orderId
        ),
        orderIdIdx: index("payment_event_receipts_order_id_idx").on(
            table.orderId
        ),
        providerOrderIdIdx: index(
            "payment_event_receipts_provider_order_id_idx"
        ).on(table.providerOrderId),
    })
);
