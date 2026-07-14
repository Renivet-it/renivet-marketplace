import { relations, sql } from "drizzle-orm";
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
    "hsn_master",
    "gst_reports",
    "tds_reports",
    "monthly_pl",
    "data_deletion",
    "compliance_admin",
    "audit_log_finance",
] as const;

export const dpdpConsentTypes = [
    "data_processing",
    "marketing_emails",
    "whatsapp_notifications",
    "analytics_tracking",
] as const;

export const dpdpDeletionStatuses = [
    "pending",
    "identity_check",
    "in_progress",
    "completed",
    "rejected",
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
        carrier: text("carrier"),
        runType: text("run_type", {
            enum: ["fee_sync", "remittance_sync", "manual_refresh"],
        })
            .notNull()
            .default("remittance_sync"),
        status: text("status", {
            enum: ["running", "success", "partial", "failed"],
        })
            .notNull()
            .default("running"),
        requestedBy: text("requested_by").references(() => users.id, {
            onDelete: "set null",
        }),
        runAt: timestamp("run_at").notNull().defaultNow(),
        startedAt: timestamp("started_at").notNull().defaultNow(),
        finishedAt: timestamp("finished_at"),
        rowsProcessed: integer("rows_processed").notNull().default(0),
        recordsSynced: integer("records_synced").notNull().default(0),
        matchedCount: integer("matched_count").notNull().default(0),
        pendingCount: integer("pending_count").notNull().default(0),
        discrepancyCount: integer("discrepancy_count").notNull().default(0),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        errors: jsonb("errors")
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
        orderId: text("order_id").references(() => orders.id, {
            onDelete: "cascade",
        }),
        runId: uuid("run_id").references(() => financeCodReconciliationRuns.id, {
            onDelete: "set null",
        }),
        awbNumber: text("awb_number"),
        carrier: text("carrier").notNull().default("delhivery"),
        codAmountPaise: integer("cod_amount_paise").notNull().default(0),
        codFeeRateBps: integer("cod_fee_rate_bps"),
        codFeeFlatPaise: integer("cod_fee_flat_paise"),
        expectedAmountPaise: integer("expected_amount_paise").notNull().default(0),
        expectedRemittancePaise: integer("expected_remittance_paise")
            .notNull()
            .default(0),
        remittedAmountPaise: integer("remitted_amount_paise"),
        expectedFeePaise: integer("expected_fee_paise").notNull().default(0),
        actualFeePaise: integer("actual_fee_paise"),
        discrepancyAmountPaise: integer("discrepancy_amount_paise"),
        ageingDays: integer("ageing_days").notNull().default(0),
        remittanceReference: text("remittance_reference"),
        deliveryDate: timestamp("delivery_date"),
        remittedAt: timestamp("remitted_at"),
        remittanceDate: date("remittance_date"),
        status: text("status", {
            enum: [
                "pending",
                "matched",
                "discrepancy",
                "overdue",
                "critical",
                "ghost",
                "written_off",
            ],
        })
            .notNull()
            .default("pending"),
        notes: text("notes"),
        proofFileUrl: text("proof_file_url"),
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
        financeCodReconciliationAwbIdx: uniqueIndex("finance_cod_reconciliation_awb_idx").on(
            table.awbNumber
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
        annualCommissionYtdPaise: integer("annual_commission_ytd_paise")
            .notNull()
            .default(0),
        tdsDeductedYtdPaise: integer("tds_deducted_ytd_paise")
            .notNull()
            .default(0),
        thresholdCrossedAt: timestamp("threshold_crossed_at"),
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
        grantedAt: timestamp("granted_at").notNull().defaultNow(),
        revokedAt: timestamp("revoked_at"),
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
        month: text("month"),
        category: text("category").notNull(),
        lineItem: text("line_item"),
        subLabel: text("sub_label"),
        description: text("description").notNull(),
        amountPaise: integer("amount_paise").notNull(),
        notes: text("notes"),
        createdBy: text("created_by").references(() => users.id, {
            onDelete: "set null",
        }),
        enteredBy: text("entered_by").references(() => users.id, {
            onDelete: "set null",
        }),
        enteredAt: timestamp("entered_at"),
        updatedBy: text("updated_by").references(() => users.id, {
            onDelete: "set null",
        }),
        isLocked: boolean("is_locked").notNull().default(false),
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
        month: text("month"),
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
        consentType: text("consent_type", {
            enum: dpdpConsentTypes,
        }).notNull(),
        consentGiven: boolean("consent_given").notNull().default(true),
        consentGivenAt: timestamp("consent_given_at").notNull().defaultNow(),
        consentVersion: text("consent_version").notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        source: text("source").notNull().default("web"),
        revokedAt: timestamp("revoked_at"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        ...timestamps,
    },
    (table) => ({
        userConsentsUserIdx: index("user_consents_user_idx").on(table.userId),
        userConsentsTypeIdx: index("user_consents_type_idx").on(
            table.userId,
            table.consentType
        ),
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
        userEmail: text("user_email").notNull(),
        requestedAt: timestamp("requested_at").notNull().defaultNow(),
        identityVerifiedAt: timestamp("identity_verified_at"),
        status: text("status", {
            enum: dpdpDeletionStatuses,
        })
            .notNull()
            .default("identity_check"),
        completedAt: timestamp("completed_at"),
        deletionScope: jsonb("deletion_scope")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        retentionScope: jsonb("retention_scope")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        executedBy: text("executed_by").references(() => users.id, {
            onDelete: "set null",
        }),
        rejectionReason: text("rejection_reason"),
        notes: text("notes"),
        verificationToken: text("verification_token"),
        verificationExpiresAt: timestamp("verification_expires_at"),
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
        dataDeletionRequestsVerificationIdx: index(
            "data_deletion_requests_verification_idx"
        ).on(table.verificationToken),
    })
);

export const breachIncidents = pgTable(
    "breach_incidents",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        detectedAt: timestamp("detected_at").notNull().defaultNow(),
        scope: text("scope"),
        usersAffected: integer("users_affected"),
        rootCause: text("root_cause"),
        notifiedAt: timestamp("notified_at"),
        remediationSteps: jsonb("remediation_steps")
            .$type<string[]>()
            .notNull()
            .default([]),
        notes: text("notes"),
        ...timestamps,
    }
);

export const legalContacts = pgTable(
    "legal_contacts",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        role: text("role", {
            enum: ["gro", "dpo", "nodal_officer", "compliance_officer"],
        }).notNull(),
        name: text("name").notNull(),
        email: text("email").notNull(),
        phone: text("phone"),
        address: text("address"),
        designation: text("designation"),
        notes: text("notes"),
        effectiveFrom: date("effective_from").notNull().default(sql`CURRENT_DATE`),
        isActive: boolean("is_active").notNull().default(true),
        updatedBy: text("updated_by").references(() => users.id, {
            onDelete: "set null",
        }),
        ...timestamps,
    },
    (table) => ({
        legalContactsRoleIdx: index("legal_contacts_role_idx").on(
            table.role,
            table.isActive
        ),
        legalContactsEffectiveFromIdx: index("legal_contacts_effective_from_idx").on(
            table.effectiveFrom
        ),
        legalContactsUpdatedByIdx: index("legal_contacts_updated_by_idx").on(
            table.updatedBy
        ),
    })
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

// Canonical future-facing sustainability model for M8 and beyond.
// Existing JSON snapshots on brand_confidentials and the older
// sustainability_certificates table remain for compatibility until the
// dedicated sprint migrates reads and writes onto this table.
export const brandSustainabilityCerts = pgTable(
    "brand_sustainability_certs",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, {
                onDelete: "cascade",
            }),
        certType: text("cert_type", {
            enum: [
                "GOTS",
                "OEKO_TEX",
                "FSC",
                "FAIR_TRADE",
                "BCI",
                "BLUESIGN",
                "RECYCLED_CONTENT",
                "OTHER",
            ],
        }).notNull(),
        certNumber: text("cert_number"),
        certNameOther: text("cert_name_other"),
        fileUrl: text("file_url").notNull(),
        issuedAt: date("issued_at").notNull(),
        expiresAt: date("expires_at").notNull(),
        verificationStatus: text("verification_status", {
            enum: ["pending", "verified", "expired", "rejected"],
        })
            .notNull()
            .default("pending"),
        verifiedBy: text("verified_by").references(() => users.id, {
            onDelete: "set null",
        }),
        verifiedAt: timestamp("verified_at"),
        appliesTo: text("applies_to", {
            enum: ["all_products", "specific_category", "specific_products"],
        })
            .notNull()
            .default("all_products"),
        applicableIds: jsonb("applicable_ids")
            .$type<string[]>()
            .notNull()
            .default([]),
        notes: text("notes"),
        ...timestamps,
    },
    (table) => ({
        brandSustainabilityCertsBrandIdx: index("brand_sustainability_certs_brand_idx").on(
            table.brandId
        ),
        brandSustainabilityCertsStatusIdx: index("brand_sustainability_certs_status_idx").on(
            table.verificationStatus
        ),
        brandSustainabilityCertsExpiryIdx: index("brand_sustainability_certs_expiry_idx").on(
            table.expiresAt
        ),
    })
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
