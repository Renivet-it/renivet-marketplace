import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { orders } from "./order";
import { reasonMasters } from "./reason";
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
        enum: [
            "pending",
            "awaiting_approval",
            "awaiting_return",
            "awaiting_qc",
            "qc_failed",
            "processed",
            "failed",
            "rejected",
        ],
    })
        .notNull()
        .default("pending"),
    amount: integer("amount").notNull(),
    reasonCode: uuid("reason_code").references(() => reasonMasters.id, {
        onDelete: "set null",
    }),
    reasonNotes: text("reason_notes"),
    costAllocation: text("cost_allocation", {
        enum: ["brand_fault", "customer_fault", "renivet_fault", "carrier_fault"],
    }),
    notes: text("notes"),
    returnShippingPaidBy: text("return_shipping_paid_by", {
        enum: ["renivet", "customer", "na"],
    }),
    returnReceivedAt: timestamp("return_received_at"),
    returnQcStatus: text("return_qc_status", {
        enum: ["pending", "passed", "failed", "na"],
    }),
    processedBy: text("processed_by"),
    failedReason: text("failed_reason"),
    refundType: text("refund_type", {
        enum: ["full", "partial", "exchange", "credit_note"],
    }).default("full"),
    policyBucket: text("policy_bucket", {
        enum: ["brand_fault", "renivet_fault", "customer_fault", "carrier_fault"],
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
    reasonMaster: one(reasonMasters, {
        fields: [refunds.reasonCode],
        references: [reasonMasters.id],
    }),
}));
