import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { orders } from "./order";
import { users } from "./user";

export const refunds = pgTable("refunds", {
    id: text("id").primaryKey().notNull().unique(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade",
        }),
    orderId: text("order_id")
        .notNull()
        .references(() => orders.id, {
            onDelete: "cascade",
        }),
    paymentId: text("payment_id").notNull().unique(),
    status: text("status", {
        enum: ["pending", "processed", "failed"],
    })
        .notNull()
        .default("pending"),
    amount: integer("amount").notNull(),
    reasonCode: text("reason_code"),
    reasonNotes: text("reason_notes"),
    processedBy: text("processed_by"),
    failedReason: text("failed_reason"),
    refundType: text("refund_type", {
        enum: ["full", "partial", "exchange", "credit_note"],
    }).default("full"),
    policyBucket: text("policy_bucket", {
        enum: ["brand_fault", "renivet_fault", "customer_fault", "courier_fault"],
    }),
    approvalStatus: text("approval_status", {
        enum: ["pending", "approved", "rejected"],
    })
        .notNull()
        .default("pending"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    rejectedBy: text("rejected_by"),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
    reversePickupRequired: boolean("reverse_pickup_required")
        .notNull()
        .default(false),
    reversePickupShipmentId: uuid("reverse_pickup_shipment_id"),
    razorpayRefundId: text("razorpay_refund_id"),
    escalationStatus: text("escalation_status", {
        enum: ["none", "raised", "resolved"],
    })
        .notNull()
        .default("none"),
    recoveredInPayoutCycleId: uuid("recovered_in_payout_cycle_id"),
    metadata: jsonb("metadata")
        .$type<Record<string, unknown>>()
        .notNull()
        .default({}),
    ...timestamps,
});

export const refundRelations = relations(refunds, ({ one }) => ({
    user: one(users, {
        fields: [refunds.userId],
        references: [users.id],
    }),
    order: one(orders, {
        fields: [refunds.orderId],
        references: [orders.id],
    }),
}));
