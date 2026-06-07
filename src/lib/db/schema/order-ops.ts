import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { brands } from "./brand";
import { orders } from "./order";
import { orderShipments } from "./order-shipment";
import { users } from "./user";

export const ORDER_OPS_STATES = [
    "placed",
    "payment_pending",
    "confirmed",
    "failed",
    "fraud_review",
    "brand_pending",
    "cancelled",
    "brand_acknowledged",
    "brand_chased",
    "auto_cancelled",
    "in_production",
    "ready_to_ship",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
    "rto_in_transit",
    "rto_delivered",
    "return_requested",
    "return_approved",
    "return_pickup_scheduled",
    "return_in_transit",
    "return_qc",
    "refunded",
    "return_disputed",
    "completed",
] as const;

export const orderOpsStates = pgTable(
    "order_ops_states",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        state: text("state", {
            enum: ORDER_OPS_STATES,
        }).notNull(),
        previousState: text("previous_state", {
            enum: ORDER_OPS_STATES,
        }),
        ownerId: text("owner_id").references(() => users.id, {
            onDelete: "set null",
        }),
        reasonCode: text("reason_code"),
        notes: text("notes"),
        metadata: jsonb("metadata").default({}),
        enteredAt: timestamp("entered_at").notNull().defaultNow(),
        dueAt: timestamp("due_at"),
        exitedAt: timestamp("exited_at"),
        isCurrent: boolean("is_current").notNull().default(true),
        ...timestamps,
    },
    (table) => ({
        orderOpsStateOrderIdx: index("order_ops_state_order_idx").on(
            table.orderId
        ),
        orderOpsStateCurrentIdx: index("order_ops_state_current_idx").on(
            table.isCurrent
        ),
        orderOpsStateStateIdx: index("order_ops_state_state_idx").on(
            table.state
        ),
    })
);

export const fraudBlocklist = pgTable(
    "fraud_blocklist",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        type: text("type", {
            enum: ["phone", "address", "pincode"],
        }).notNull(),
        value: text("value").notNull(),
        reason: text("reason").notNull(),
        severity: text("severity", {
            enum: ["watch", "block"],
        })
            .notNull()
            .default("watch"),
        addedBy: text("added_by").references(() => users.id, {
            onDelete: "set null",
        }),
        expiresAt: timestamp("expires_at"),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        fraudBlocklistValueIdx: uniqueIndex("fraud_blocklist_value_idx").on(
            table.type,
            table.value
        ),
    })
);

export const fraudReviews = pgTable(
    "fraud_reviews",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        status: text("status", {
            enum: ["pending", "verified", "fraud", "cancelled"],
        })
            .notNull()
            .default("pending"),
        riskLevel: text("risk_level", {
            enum: ["low", "medium", "high"],
        })
            .notNull()
            .default("medium"),
        triggers: jsonb("triggers").default([]),
        reviewerId: text("reviewer_id").references(() => users.id, {
            onDelete: "set null",
        }),
        reviewedAt: timestamp("reviewed_at"),
        decisionReasonCode: text("decision_reason_code"),
        notes: text("notes"),
        dueAt: timestamp("due_at"),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        fraudReviewOrderIdx: uniqueIndex("fraud_review_order_idx").on(
            table.orderId
        ),
        fraudReviewStatusIdx: index("fraud_review_status_idx").on(table.status),
    })
);

export const rtoDispositions = pgTable(
    "rto_dispositions",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        shipmentId: uuid("shipment_id").references(() => orderShipments.id, {
            onDelete: "set null",
        }),
        status: text("status", {
            enum: [
                "pending",
                "recovering",
                "reshipped",
                "restocked",
                "damaged",
                "lost",
                "refunded",
                "cancelled",
            ],
        })
            .notNull()
            .default("pending"),
        rtoReason: text("rto_reason", {
            enum: [
                "undeliverable_address",
                "customer_refused",
                "customer_unavailable",
                "carrier_failure",
                "brand_error",
                "unknown",
            ],
        }).notNull(),
        faultOwner: text("fault_owner", {
            enum: ["customer", "carrier", "brand", "renivet", "unknown"],
        })
            .notNull()
            .default("unknown"),
        customerContactedAt: timestamp("customer_contacted_at"),
        recoveryDecision: text("recovery_decision", {
            enum: ["reship", "refund", "cancel", "restock", "claim", "pending"],
        })
            .notNull()
            .default("pending"),
        dispositionDueAt: timestamp("disposition_due_at"),
        dispositionAt: timestamp("disposition_at"),
        handledBy: text("handled_by").references(() => users.id, {
            onDelete: "set null",
        }),
        notes: text("notes"),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        rtoDispositionOrderIdx: uniqueIndex("rto_disposition_order_idx").on(
            table.orderId
        ),
        rtoDispositionStatusIdx: index("rto_disposition_status_idx").on(
            table.status
        ),
    })
);

export const carrierClaims = pgTable(
    "carrier_claims",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        shipmentId: uuid("shipment_id").references(() => orderShipments.id, {
            onDelete: "set null",
        }),
        brandId: uuid("brand_id").references(() => brands.id, {
            onDelete: "set null",
        }),
        awbNumber: text("awb_number"),
        claimType: text("claim_type", {
            enum: ["lost", "damaged", "shortage", "delay", "other"],
        }).notNull(),
        status: text("status", {
            enum: [
                "draft",
                "filed",
                "in_review",
                "approved",
                "rejected",
                "settled",
            ],
        })
            .notNull()
            .default("draft"),
        declaredValue: integer("declared_value").notNull().default(0),
        claimAmount: integer("claim_amount").notNull().default(0),
        approvedAmount: integer("approved_amount"),
        filedAt: timestamp("filed_at"),
        dueAt: timestamp("due_at"),
        settledAt: timestamp("settled_at"),
        filedBy: text("filed_by").references(() => users.id, {
            onDelete: "set null",
        }),
        evidence: jsonb("evidence").default([]),
        notes: text("notes"),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        carrierClaimOrderIdx: index("carrier_claim_order_idx").on(
            table.orderId
        ),
        carrierClaimStatusIdx: index("carrier_claim_status_idx").on(
            table.status
        ),
    })
);

export const codReconciliationRuns = pgTable(
    "cod_reconciliation_runs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        runDate: timestamp("run_date").notNull().defaultNow(),
        weekStart: timestamp("week_start").notNull(),
        weekEnd: timestamp("week_end").notNull(),
        status: text("status", {
            enum: ["draft", "in_progress", "completed", "escalated"],
        })
            .notNull()
            .default("draft"),
        expectedAmount: integer("expected_amount").notNull().default(0),
        remittedAmount: integer("remitted_amount").notNull().default(0),
        varianceAmount: integer("variance_amount").notNull().default(0),
        completedAt: timestamp("completed_at"),
        completedBy: text("completed_by").references(() => users.id, {
            onDelete: "set null",
        }),
        notes: text("notes"),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        codReconRunDateIdx: index("cod_recon_run_date_idx").on(table.runDate),
    })
);

export const codReconciliationItems = pgTable(
    "cod_reconciliation_items",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        runId: uuid("run_id")
            .notNull()
            .references(() => codReconciliationRuns.id, {
                onDelete: "cascade",
            }),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        awbNumber: text("awb_number"),
        deliveredAt: timestamp("delivered_at"),
        codAmount: integer("cod_amount").notNull().default(0),
        remittedAmount: integer("remitted_amount").notNull().default(0),
        status: text("status", {
            enum: [
                "pending",
                "matched",
                "short_paid",
                "excess_paid",
                "missing",
                "disputed",
            ],
        })
            .notNull()
            .default("pending"),
        remittanceReference: text("remittance_reference"),
        varianceReason: text("variance_reason"),
        notes: text("notes"),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        codReconItemRunIdx: index("cod_recon_item_run_idx").on(table.runId),
        codReconItemOrderIdx: uniqueIndex("cod_recon_item_order_run_idx").on(
            table.runId,
            table.orderId
        ),
    })
);

export const orderOpsCommunications = pgTable(
    "order_ops_communications",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        channel: text("channel", {
            enum: ["phone", "whatsapp", "email", "admin_note"],
        }).notNull(),
        templateKey: text("template_key"),
        subject: text("subject"),
        message: text("message").notNull(),
        direction: text("direction", {
            enum: ["outbound", "inbound", "internal"],
        })
            .notNull()
            .default("outbound"),
        recipient: text("recipient"),
        sentBy: text("sent_by").references(() => users.id, {
            onDelete: "set null",
        }),
        sentAt: timestamp("sent_at").notNull().defaultNow(),
        metadata: jsonb("metadata").default({}),
        ...timestamps,
    },
    (table) => ({
        orderOpsCommOrderIdx: index("order_ops_comm_order_idx").on(
            table.orderId
        ),
    })
);

export const orderOpsStatesRelations = relations(orderOpsStates, ({ one }) => ({
    order: one(orders, {
        fields: [orderOpsStates.orderId],
        references: [orders.id],
    }),
    owner: one(users, {
        fields: [orderOpsStates.ownerId],
        references: [users.id],
    }),
}));

export const fraudReviewsRelations = relations(fraudReviews, ({ one }) => ({
    order: one(orders, {
        fields: [fraudReviews.orderId],
        references: [orders.id],
    }),
    reviewer: one(users, {
        fields: [fraudReviews.reviewerId],
        references: [users.id],
    }),
}));

export const rtoDispositionsRelations = relations(
    rtoDispositions,
    ({ one }) => ({
        order: one(orders, {
            fields: [rtoDispositions.orderId],
            references: [orders.id],
        }),
        shipment: one(orderShipments, {
            fields: [rtoDispositions.shipmentId],
            references: [orderShipments.id],
        }),
        handler: one(users, {
            fields: [rtoDispositions.handledBy],
            references: [users.id],
        }),
    })
);

export const carrierClaimsRelations = relations(carrierClaims, ({ one }) => ({
    order: one(orders, {
        fields: [carrierClaims.orderId],
        references: [orders.id],
    }),
    shipment: one(orderShipments, {
        fields: [carrierClaims.shipmentId],
        references: [orderShipments.id],
    }),
    brand: one(brands, {
        fields: [carrierClaims.brandId],
        references: [brands.id],
    }),
}));

export const codReconciliationRunsRelations = relations(
    codReconciliationRuns,
    ({ many, one }) => ({
        items: many(codReconciliationItems),
        completedByUser: one(users, {
            fields: [codReconciliationRuns.completedBy],
            references: [users.id],
        }),
    })
);

export const codReconciliationItemsRelations = relations(
    codReconciliationItems,
    ({ one }) => ({
        run: one(codReconciliationRuns, {
            fields: [codReconciliationItems.runId],
            references: [codReconciliationRuns.id],
        }),
        order: one(orders, {
            fields: [codReconciliationItems.orderId],
            references: [orders.id],
        }),
    })
);

export const orderOpsCommunicationsRelations = relations(
    orderOpsCommunications,
    ({ one }) => ({
        order: one(orders, {
            fields: [orderOpsCommunications.orderId],
            references: [orders.id],
        }),
        sender: one(users, {
            fields: [orderOpsCommunications.sentBy],
            references: [users.id],
        }),
    })
);
