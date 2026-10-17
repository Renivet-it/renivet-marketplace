import {
    index,
    integer,
    jsonb,
    pgTable,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { corporateOrders } from "./corporate-order";

export const corporatePaymentIntents = pgTable(
    "corporate_payment_intents",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: uuid("order_id").references(() => corporateOrders.id, {
            onDelete: "set null",
        }),
        paymentRequestId: uuid("payment_request_id"),
        userId: text("user_id").notNull(),
        paymentKind: text("payment_kind", {
            enum: ["advance", "balance", "payment_request"],
        }).notNull(),
        amountPaise: integer("amount_paise").notNull(),
        currency: text("currency").notNull().default("INR"),
        providerOrderId: text("provider_order_id"),
        providerPaymentId: text("provider_payment_id"),
        status: text("status", {
            enum: [
                "created",
                "provider_order_bound",
                "payment_received",
                "applied",
                "rejected",
                "recovery_required",
                "recovery_applied",
                "refunded",
                "expired",
            ],
        })
            .notNull()
            .default("created"),
        orderSnapshot: jsonb("order_snapshot")
            .$type<Record<string, unknown>>()
            .notNull(),
        rejectionCode: text("rejection_code"),
        recoveryMetadata: jsonb("recovery_metadata").$type<
            Record<string, unknown> | null
        >(),
        expiresAt: text("expires_at"),
        ...timestamps,
    },
    (table) => ({
        providerOrderUnique: uniqueIndex(
            "corporate_payment_intents_provider_order_unique"
        ).on(table.providerOrderId),
        providerPaymentUnique: uniqueIndex(
            "corporate_payment_intents_provider_payment_unique"
        ).on(table.providerPaymentId),
        orderIdx: index("corporate_payment_intents_order_idx").on(
            table.orderId
        ),
        recoveryIdx: index("corporate_payment_intents_recovery_idx").on(
            table.status,
            table.createdAt
        ),
    })
);

export const corporatePaymentRefunds = pgTable(
    "corporate_payment_refunds",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        intentId: uuid("intent_id")
            .notNull()
            .references(() => corporatePaymentIntents.id, {
                onDelete: "cascade",
            }),
        providerPaymentId: text("provider_payment_id").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        status: text("status", {
            enum: ["pending", "submitted", "processed", "failed"],
        })
            .notNull()
            .default("pending"),
        providerRefundId: text("provider_refund_id"),
        failureReason: text("failure_reason"),
        ...timestamps,
    },
    (table) => ({
        intentUnique: uniqueIndex("corporate_payment_refunds_intent_unique").on(
            table.intentId
        ),
        providerRefundUnique: uniqueIndex(
            "corporate_payment_refunds_provider_refund_unique"
        ).on(table.providerRefundId),
    })
);
