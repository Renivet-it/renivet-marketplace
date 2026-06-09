import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        timestampUtc: timestamp("timestamp_utc").notNull().defaultNow(),
        userId: text("user_id"),
        userRoleSnapshot: text("user_role_snapshot"),
        actionType: text("action_type").notNull(),
        entityType: text("entity_type").notNull(),
        entityId: text("entity_id").notNull(),
        beforeValue: jsonb("before_value").$type<Record<string, unknown> | null>(),
        afterValue: jsonb("after_value").$type<Record<string, unknown> | null>(),
        reason: text("reason"),
        ipAddress: text("ip_address"),
        sessionId: text("session_id"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        voidedBy: text("voided_by"),
        voidedAt: timestamp("voided_at"),
        voidReason: text("void_reason"),
        ...timestamps,
    },
    (table) => ({
        auditEntityIdx: index("audit_log_entity_idx").on(table.entityType, table.entityId),
        auditActionIdx: index("audit_log_action_idx").on(table.actionType),
        auditUserIdx: index("audit_log_user_idx").on(table.userId),
        auditTimestampIdx: index("audit_log_timestamp_idx").on(table.timestampUtc),
    })
);

export const monitoringAlerts = pgTable(
    "monitoring_alerts",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        type: text("type").notNull(),
        severity: text("severity", {
            enum: ["info", "warning", "critical"],
        })
            .notNull()
            .default("warning"),
        entityType: text("entity_type").notNull(),
        entityId: text("entity_id").notNull(),
        title: text("title").notNull(),
        message: text("message").notNull(),
        ownerId: text("owner_id"),
        ownerRole: text("owner_role"),
        channels: jsonb("channels").$type<Array<"whatsapp" | "email" | "admin">>().default(["admin"]),
        recipients: jsonb("recipients").$type<string[]>().default([]),
        dueAt: timestamp("due_at"),
        acknowledgedDueAt: timestamp("acknowledged_due_at"),
        status: text("status", {
            enum: ["open", "acknowledged", "escalated", "resolved"],
        })
            .notNull()
            .default("open"),
        dedupeKey: text("dedupe_key").notNull(),
        acknowledgedBy: text("acknowledged_by"),
        acknowledgedAt: timestamp("acknowledged_at"),
        escalatedBy: text("escalated_by"),
        escalatedAt: timestamp("escalated_at"),
        resolvedBy: text("resolved_by"),
        resolvedAt: timestamp("resolved_at"),
        reasonCode: text("reason_code"),
        notes: text("notes"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        ...timestamps,
    },
    (table) => ({
        alertStatusIdx: index("monitoring_alert_status_idx").on(table.status),
        alertSeverityIdx: index("monitoring_alert_severity_idx").on(table.severity),
        alertDueAtIdx: index("monitoring_alert_due_at_idx").on(table.dueAt),
        alertDedupeOpenIdx: uniqueIndex("monitoring_alert_dedupe_status_idx").on(
            table.dedupeKey,
            table.status
        ),
    })
);

export const monitoringAlertEvents = pgTable(
    "monitoring_alert_events",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        alertId: uuid("alert_id")
            .notNull()
            .references(() => monitoringAlerts.id, { onDelete: "cascade" }),
        action: text("action").notNull(),
        actorId: text("actor_id"),
        reasonCode: text("reason_code"),
        notes: text("notes"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        ...timestamps,
    },
    (table) => ({
        alertEventAlertIdx: index("monitoring_alert_event_alert_idx").on(table.alertId),
    })
);

export const monitoringAlertDeliveries = pgTable(
    "monitoring_alert_deliveries",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        alertId: uuid("alert_id")
            .notNull()
            .references(() => monitoringAlerts.id, { onDelete: "cascade" }),
        channel: text("channel", {
            enum: ["whatsapp", "email", "admin"],
        }).notNull(),
        recipient: text("recipient").notNull(),
        status: text("status", {
            enum: ["pending", "sent", "failed", "skipped"],
        })
            .notNull()
            .default("pending"),
        providerMessageId: text("provider_message_id"),
        error: text("error"),
        sentAt: timestamp("sent_at"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        ...timestamps,
    },
    (table) => ({
        alertDeliveryAlertIdx: index("monitoring_alert_delivery_alert_idx").on(table.alertId),
        alertDeliveryChannelIdx: index("monitoring_alert_delivery_channel_idx").on(table.channel),
    })
);

export const slaRules = pgTable(
    "sla_rules",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        code: text("code").notNull().unique(),
        entityType: text("entity_type").notNull(),
        description: text("description").notNull(),
        ownerRole: text("owner_role").notNull().default("operations"),
        channels: jsonb("channels").$type<Array<"whatsapp" | "email" | "admin">>().default(["admin"]),
        recipients: jsonb("recipients").$type<string[]>().default([]),
        severity: text("severity", {
            enum: ["info", "warning", "critical"],
        })
            .notNull()
            .default("warning"),
        thresholdHours: text("threshold_hours").notNull(),
        isActive: text("is_active").notNull().default("true"),
        ...timestamps,
    },
    (table) => ({
        slaRuleCodeIdx: uniqueIndex("sla_rule_code_idx").on(table.code),
        slaRuleActiveIdx: index("sla_rule_active_idx").on(table.isActive),
    })
);

export const slaCheckRuns = pgTable(
    "sla_check_runs",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        runKey: text("run_key").notNull().unique(),
        status: text("status", {
            enum: ["running", "completed", "failed"],
        })
            .notNull()
            .default("running"),
        startedAt: timestamp("started_at").notNull().defaultNow(),
        finishedAt: timestamp("finished_at"),
        checkedCount: text("checked_count").notNull().default("0"),
        breachCount: text("breach_count").notNull().default("0"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        error: text("error"),
        ...timestamps,
    },
    (table) => ({
        slaCheckRunKeyIdx: uniqueIndex("sla_check_run_key_idx").on(table.runKey),
    })
);

export const dailyHealthSnapshots = pgTable(
    "daily_health_snapshots",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        snapshotDate: text("snapshot_date").notNull().unique(),
        metrics: jsonb("metrics").$type<Record<string, number | string>>().notNull(),
        status: text("status", {
            enum: ["green", "amber", "red"],
        })
            .notNull()
            .default("green"),
        generatedBy: text("generated_by"),
        ...timestamps,
    },
    (table) => ({
        dailyHealthDateIdx: uniqueIndex("daily_health_snapshot_date_idx").on(
            table.snapshotDate
        ),
    })
);

export const monitoringSettings = pgTable(
    "monitoring_settings",
    {
        key: text("key").primaryKey().notNull(),
        value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
        updatedBy: text("updated_by"),
        ...timestamps,
    },
    (table) => ({
        monitoringSettingsKeyIdx: uniqueIndex("monitoring_settings_key_idx").on(
            table.key
        ),
    })
);

export const weeklyReportingPacks = pgTable(
    "weekly_reporting_packs",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        weekStart: text("week_start").notNull(),
        weekEnd: text("week_end").notNull(),
        status: text("status", {
            enum: ["draft", "published", "archived"],
        })
            .notNull()
            .default("draft"),
        executiveSnapshot: text("executive_snapshot"),
        actionItems: jsonb("action_items").$type<string[]>().default([]),
        metrics: jsonb("metrics").$type<Record<string, unknown>>().default({}),
        generatedBy: text("generated_by"),
        publishedAt: timestamp("published_at"),
        ...timestamps,
    },
    (table) => ({
        weeklyPackWindowIdx: uniqueIndex("weekly_pack_window_idx").on(
            table.weekStart,
            table.weekEnd
        ),
    })
);

export const complianceExportRuns = pgTable(
    "compliance_export_runs",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        exportMonth: text("export_month").notNull(),
        exportType: text("export_type").notNull(),
        status: text("status", {
            enum: ["generated", "failed"],
        })
            .notNull()
            .default("generated"),
        generatedBy: text("generated_by"),
        redactionMode: text("redaction_mode").notNull().default("standard"),
        rowCount: text("row_count").notNull().default("0"),
        filters: jsonb("filters").$type<Record<string, unknown>>().default({}),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        files: jsonb("files").$type<Array<{ name: string; rowCount: number; path?: string }>>().default([]),
        retentionUntil: timestamp("retention_until"),
        ...timestamps,
    },
    (table) => ({
        complianceExportWindowIdx: index("compliance_export_window_idx").on(
            table.exportMonth,
            table.exportType
        ),
    })
);

export const complianceExportFiles = pgTable(
    "compliance_export_files",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        exportRunId: uuid("export_run_id")
            .notNull()
            .references(() => complianceExportRuns.id, { onDelete: "cascade" }),
        fileName: text("file_name").notNull(),
        contentType: text("content_type").notNull().default("text/csv"),
        rowCount: text("row_count").notNull().default("0"),
        storagePath: text("storage_path"),
        checksum: text("checksum"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
        ...timestamps,
    },
    (table) => ({
        complianceExportFileRunIdx: index("compliance_export_file_run_idx").on(table.exportRunId),
    })
);

export const accessReviewRuns = pgTable(
    "access_review_runs",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        reviewPeriod: text("review_period").notNull().unique(),
        status: text("status", {
            enum: ["draft", "in_review", "completed"],
        })
            .notNull()
            .default("draft"),
        generatedBy: text("generated_by"),
        completedBy: text("completed_by"),
        completedAt: timestamp("completed_at"),
        ...timestamps,
    },
    (table) => ({
        accessReviewPeriodIdx: uniqueIndex("access_review_period_idx").on(
            table.reviewPeriod
        ),
    })
);

export const accessReviewItems = pgTable(
    "access_review_items",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        reviewId: uuid("review_id")
            .notNull()
            .references(() => accessReviewRuns.id, { onDelete: "cascade" }),
        userId: text("user_id").notNull(),
        email: text("email").notNull(),
        roleSummary: text("role_summary").notNull(),
        lastActivityAt: timestamp("last_activity_at"),
        decision: text("decision", {
            enum: ["pending", "keep", "remove", "change"],
        })
            .notNull()
            .default("pending"),
        decisionNotes: text("decision_notes"),
        decidedBy: text("decided_by"),
        decidedAt: timestamp("decided_at"),
        revokedAt: timestamp("revoked_at"),
        ...timestamps,
    },
    (table) => ({
        accessReviewItemReviewIdx: index("access_review_item_review_idx").on(
            table.reviewId
        ),
        accessReviewItemUserIdx: index("access_review_item_user_idx").on(table.userId),
    })
);
