import { relations } from "drizzle-orm";
import {
    boolean,
    date,
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
import { brands, brandConfidentials } from "./brand";
import { orders } from "./order";
import { refunds } from "./refund";
import { users } from "./user";

export const financeModules = [
    "refunds",
    "cod_reconciliation",
    "payouts",
    "gst_reports",
    "tds_reports",
    "monthly_pl",
    "data_deletion",
    "audit_log_finance",
] as const;

export const platformSettings = pgTable(
    "platform_settings",
    {
        key: text("key").primaryKey().notNull(),
        value: jsonb("value")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        description: text("description"),
        updatedBy: text("updated_by").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        platformSettingsUpdatedByIdx: index("platform_settings_updated_by_idx").on(
            table.updatedBy
        ),
    })
);

export const carrierFeeSchedule = pgTable(
    "carrier_fee_schedule",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        carrier: text("carrier").notNull().default("delhivery"),
        feeType: text("fee_type").notNull().default("cod"),
        paymentMode: text("payment_mode").notNull().default("cod"),
        zoneCode: text("zone_code"),
        stateCode: text("state_code"),
        minAmountPaise: integer("min_amount_paise").notNull().default(0),
        maxAmountPaise: integer("max_amount_paise"),
        feeFlatPaise: integer("fee_flat_paise").notNull().default(0),
        feePercentBps: integer("fee_percent_bps").notNull().default(0),
        effectiveFrom: date("effective_from"),
        effectiveTo: date("effective_to"),
        sourcePayload: jsonb("source_payload")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        isActive: boolean("is_active").notNull().default(true),
        ...timestamps,
    },
    (table) => ({
        carrierFeeScheduleCarrierIdx: index("carrier_fee_schedule_carrier_idx").on(
            table.carrier
        ),
        carrierFeeScheduleWindowIdx: index("carrier_fee_schedule_window_idx").on(
            table.effectiveFrom,
            table.effectiveTo
        ),
    })
);

export const financeCodReconciliationRuns = pgTable(
    "finance_cod_reconciliation_runs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        runType: text("run_type", {
            enum: ["fee_sync", "remittance_sync", "manual_refresh"],
        })
            .notNull()
            .default("remittance_sync"),
        status: text("status", {
            enum: ["running", "completed", "failed"],
        })
            .notNull()
            .default("running"),
        requestedBy: text("requested_by").references(() => users.id, {
            onDelete: "set null",
        }),
        startedAt: timestamp("started_at").notNull().defaultNow(),
        finishedAt: timestamp("finished_at"),
        rowsProcessed: integer("rows_processed").notNull().default(0),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        error: text("error"),
        ...timestamps,
    },
    (table) => ({
        financeCodReconciliationRunsStatusIdx: index("finance_cod_reconciliation_runs_status_idx").on(
            table.status
        ),
    })
);

export const financeCodReconciliation = pgTable(
    "finance_cod_reconciliation",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        orderId: text("order_id")
            .notNull()
            .references(() => orders.id, {
                onDelete: "cascade",
            }),
        runId: uuid("run_id").references(() => financeCodReconciliationRuns.id, {
            onDelete: "set null",
        }),
        carrier: text("carrier").notNull().default("delhivery"),
        expectedAmountPaise: integer("expected_amount_paise").notNull().default(0),
        remittedAmountPaise: integer("remitted_amount_paise")
            .notNull()
            .default(0),
        expectedFeePaise: integer("expected_fee_paise").notNull().default(0),
        actualFeePaise: integer("actual_fee_paise").notNull().default(0),
        discrepancyAmountPaise: integer("discrepancy_amount_paise")
            .notNull()
            .default(0),
        ageingDays: integer("ageing_days").notNull().default(0),
        remittanceReference: text("remittance_reference"),
        remittanceDate: date("remittance_date"),
        status: text("status", {
            enum: ["matched", "short", "missing", "delayed", "excess", "review"],
        })
            .notNull()
            .default("review"),
        notes: text("notes"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        resolvedBy: text("resolved_by").references(() => users.id, {
            onDelete: "set null",
        }),
        resolvedAt: timestamp("resolved_at"),
        ...timestamps,
    },
    (table) => ({
        financeCodReconciliationOrderIdx: uniqueIndex("finance_cod_reconciliation_order_idx").on(
            table.orderId
        ),
        financeCodReconciliationStatusIdx: index("finance_cod_reconciliation_status_idx").on(
            table.status
        ),
    })
);

export const commissionRules = pgTable(
    "commission_rules",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id").references(() => brands.id, {
            onDelete: "cascade",
        }),
        categoryId: uuid("category_id"),
        productTypeId: uuid("product_type_id"),
        ruleName: text("rule_name").notNull(),
        commissionPercentBps: integer("commission_percent_bps")
            .notNull()
            .default(0),
        holdbackPercentBps: integer("holdback_percent_bps")
            .notNull()
            .default(0),
        priority: integer("priority").notNull().default(100),
        effectiveFrom: date("effective_from"),
        effectiveTo: date("effective_to"),
        isActive: boolean("is_active").notNull().default(true),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    },
    (table) => ({
        commissionRulesBrandIdx: index("commission_rules_brand_idx").on(
            table.brandId
        ),
        commissionRulesPriorityIdx: index("commission_rules_priority_idx").on(
            table.priority
        ),
    })
);

export const brandPayoutConfig = pgTable(
    "brand_payout_config",
    {
        id: uuid("id")
            .primaryKey()
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        payoutMethod: text("payout_method", {
            enum: ["razorpay_route", "manual_neft"],
        })
            .notNull()
            .default("manual_neft"),
        payoutCycleAnchor: text("payout_cycle_anchor", {
            enum: ["1st", "16th"],
        })
            .notNull()
            .default("1st"),
        holdbackPercentBps: integer("holdback_percent_bps")
            .notNull()
            .default(0),
        minimumPayoutPaise: integer("minimum_payout_paise")
            .notNull()
            .default(0),
        payoutEmail: text("payout_email"),
        bankSnapshot: jsonb("bank_snapshot")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        isActive: boolean("is_active").notNull().default(true),
        ...timestamps,
    }
);

export const brandPayoutCycles = pgTable(
    "brand_payout_cycles",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        cycleKey: text("cycle_key").notNull().unique(),
        cycleStart: date("cycle_start").notNull(),
        cycleEnd: date("cycle_end").notNull(),
        payoutDate: date("payout_date").notNull(),
        status: text("status", {
            enum: ["draft", "calculated", "approved", "processing", "completed", "failed"],
        })
            .notNull()
            .default("draft"),
        calculatedBy: text("calculated_by").references(() => users.id, {
            onDelete: "set null",
        }),
        approvedBy: text("approved_by").references(() => users.id, {
            onDelete: "set null",
        }),
        executedBy: text("executed_by").references(() => users.id, {
            onDelete: "set null",
        }),
        calculationSummary: jsonb("calculation_summary")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    },
    (table) => ({
        brandPayoutCyclesWindowIdx: index("brand_payout_cycles_window_idx").on(
            table.cycleStart,
            table.cycleEnd
        ),
    })
);

export const brandPayoutLineItems = pgTable(
    "brand_payout_line_items",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        cycleId: uuid("cycle_id")
            .notNull()
            .references(() => brandPayoutCycles.id, {
                onDelete: "cascade",
            }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        lineType: text("line_type").notNull(),
        referenceType: text("reference_type"),
        referenceId: text("reference_id"),
        description: text("description").notNull(),
        amountPaise: integer("amount_paise").notNull().default(0),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    },
    (table) => ({
        brandPayoutLineItemsCycleIdx: index("brand_payout_line_items_cycle_idx").on(
            table.cycleId
        ),
        brandPayoutLineItemsBrandIdx: index("brand_payout_line_items_brand_idx").on(
            table.brandId
        ),
    })
);

export const brandPayoutOverrides = pgTable(
    "brand_payout_overrides",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        cycleId: uuid("cycle_id")
            .notNull()
            .references(() => brandPayoutCycles.id, {
                onDelete: "cascade",
            }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        adjustmentType: text("adjustment_type").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        reasonCode: text("reason_code").notNull(),
        notes: text("notes").notNull(),
        proofFileUrl: text("proof_file_url").notNull(),
        createdBy: text("created_by")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        approvedBy: text("approved_by").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        brandPayoutOverridesCycleIdx: index("brand_payout_overrides_cycle_idx").on(
            table.cycleId
        ),
    })
);

export const brandTdsTracking = pgTable(
    "brand_tds_tracking",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        financialYear: text("financial_year").notNull(),
        cumulativeCommissionPaise: integer("cumulative_commission_paise")
            .notNull()
            .default(0),
        cumulativeTdsPaise: integer("cumulative_tds_paise")
            .notNull()
            .default(0),
        thresholdPaise: integer("threshold_paise").notNull().default(3000000),
        tdsRateBps: integer("tds_rate_bps").notNull().default(100),
        lastAppliedCycleId: uuid("last_applied_cycle_id").references(
            () => brandPayoutCycles.id,
            { onDelete: "set null" }
        ),
        ...timestamps,
    },
    (table) => ({
        brandTdsTrackingUniqueIdx: uniqueIndex("brand_tds_tracking_unique_idx").on(
            table.brandId,
            table.financialYear
        ),
    })
);

export const hsnMaster = pgTable(
    "hsn_master",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        hsnCode: text("hsn_code").notNull().unique(),
        description: text("description").notNull(),
        gstRateBps: integer("gst_rate_bps").notNull().default(0),
        categoryLabel: text("category_label"),
        isActive: boolean("is_active").notNull().default(true),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    }
);

export const gstReportRuns = pgTable(
    "gst_report_runs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        monthKey: text("month_key").notNull(),
        status: text("status", {
            enum: ["draft", "generated", "failed"],
        })
            .notNull()
            .default("draft"),
        generatedBy: text("generated_by").references(() => users.id, {
            onDelete: "set null",
        }),
        fileUrl: text("file_url"),
        recordCount: integer("record_count").notNull().default(0),
        validationSummary: jsonb("validation_summary")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        totals: jsonb("totals")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    },
    (table) => ({
        gstReportRunsMonthIdx: index("gst_report_runs_month_idx").on(
            table.monthKey
        ),
    })
);

export const moduleAccess = pgTable(
    "module_access",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        moduleKey: text("module_key", {
            enum: financeModules,
        }).notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        grantedBy: text("granted_by").references(() => users.id, {
            onDelete: "set null",
        }),
        canView: boolean("can_view").notNull().default(true),
        canManage: boolean("can_manage").notNull().default(false),
        notes: text("notes"),
        ...timestamps,
    },
    (table) => ({
        moduleAccessUniqueIdx: uniqueIndex("module_access_unique_idx").on(
            table.moduleKey,
            table.userId
        ),
    })
);

export const plManualEntries = pgTable(
    "pl_manual_entries",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        monthKey: text("month_key").notNull(),
        category: text("category").notNull(),
        description: text("description").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        notes: text("notes"),
        createdBy: text("created_by").references(() => users.id, {
            onDelete: "set null",
        }),
        updatedBy: text("updated_by").references(() => users.id, {
            onDelete: "set null",
        }),
        lockedAt: timestamp("locked_at"),
        ...timestamps,
    },
    (table) => ({
        plManualEntriesMonthIdx: index("pl_manual_entries_month_idx").on(
            table.monthKey
        ),
    })
);

export const plSnapshots = pgTable(
    "pl_snapshots",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        monthKey: text("month_key").notNull().unique(),
        snapshotType: text("snapshot_type", {
            enum: ["draft", "locked"],
        })
            .notNull()
            .default("locked"),
        summary: jsonb("summary")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        lockedBy: text("locked_by").references(() => users.id, {
            onDelete: "set null",
        }),
        lockedAt: timestamp("locked_at"),
        unlockedBy: text("unlocked_by").references(() => users.id, {
            onDelete: "set null",
        }),
        unlockedAt: timestamp("unlocked_at"),
        unlockReason: text("unlock_reason"),
        fileUrl: text("file_url"),
        ...timestamps,
    },
    (table) => ({
        plSnapshotsMonthIdx: index("pl_snapshots_month_idx").on(table.monthKey),
    })
);

export const userConsents = pgTable(
    "user_consents",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        consentType: text("consent_type").notNull(),
        version: text("version").notNull(),
        source: text("source").notNull().default("web"),
        isGranted: boolean("is_granted").notNull().default(true),
        grantedAt: timestamp("granted_at").notNull().defaultNow(),
        revokedAt: timestamp("revoked_at"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    },
    (table) => ({
        userConsentsUserIdx: index("user_consents_user_idx").on(table.userId),
    })
);

export const dataDeletionRequests = pgTable(
    "data_deletion_requests",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        status: text("status", {
            enum: ["requested", "approved", "rejected", "processing", "completed", "failed"],
        })
            .notNull()
            .default("requested"),
        reason: text("reason"),
        requestedByEmail: text("requested_by_email"),
        reviewedBy: text("reviewed_by").references(() => users.id, {
            onDelete: "set null",
        }),
        reviewedAt: timestamp("reviewed_at"),
        executedAt: timestamp("executed_at"),
        completionEvidence: jsonb("completion_evidence")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        error: text("error"),
        ...timestamps,
    },
    (table) => ({
        dataDeletionRequestsUserIdx: index("data_deletion_requests_user_idx").on(
            table.userId
        ),
        dataDeletionRequestsStatusIdx: index("data_deletion_requests_status_idx").on(
            table.status
        ),
    })
);

export const legalContacts = pgTable(
    "legal_contacts",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        contactType: text("contact_type").notNull(),
        name: text("name").notNull(),
        email: text("email"),
        phone: text("phone"),
        address: text("address"),
        designation: text("designation"),
        notes: text("notes"),
        isActive: boolean("is_active").notNull().default(true),
        ...timestamps,
    }
);

export const sustainabilityCertificates = pgTable(
    "sustainability_certificates",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        certificateType: text("certificate_type").notNull(),
        certificateNumber: text("certificate_number"),
        issuedBy: text("issued_by"),
        issuedAt: date("issued_at"),
        expiresAt: date("expires_at"),
        fileUrl: text("file_url"),
        verificationUrl: text("verification_url"),
        status: text("status", {
            enum: ["pending", "verified", "expired", "rejected"],
        })
            .notNull()
            .default("pending"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    }
);

export const financeRelations = relations(brandPayoutConfig, ({ one }) => ({
    brand: one(brands, {
        fields: [brandPayoutConfig.id],
        references: [brands.id],
    }),
    brandConfidential: one(brandConfidentials, {
        fields: [brandPayoutConfig.id],
        references: [brandConfidentials.id],
    }),
}));

export const deletionRequestRelations = relations(
    dataDeletionRequests,
    ({ one }) => ({
        user: one(users, {
            fields: [dataDeletionRequests.userId],
            references: [users.id],
        }),
    })
);

export const financeCodReconciliationRelations = relations(
    financeCodReconciliation,
    ({ one }) => ({
        order: one(orders, {
            fields: [financeCodReconciliation.orderId],
            references: [orders.id],
        }),
        run: one(financeCodReconciliationRuns, {
            fields: [financeCodReconciliation.runId],
            references: [financeCodReconciliationRuns.id],
        }),
    })
);

export const refundWorkflowRelations = relations(refunds, ({ one }) => ({
    payoutCycle: one(brandPayoutCycles, {
        fields: [refunds.recoveredInPayoutCycleId],
        references: [brandPayoutCycles.id],
    }),
}));
