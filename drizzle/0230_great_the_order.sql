CREATE TABLE IF NOT EXISTS "access_review_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"role_summary" text NOT NULL,
	"last_activity_at" timestamp,
	"decision" text DEFAULT 'pending' NOT NULL,
	"decision_notes" text,
	"decided_by" text,
	"decided_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_review_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_review_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_period" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"generated_by" text,
	"completed_by" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_review_runs_id_unique" UNIQUE("id"),
	CONSTRAINT "access_review_runs_review_period_unique" UNIQUE("review_period")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_export_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_month" text NOT NULL,
	"export_type" text NOT NULL,
	"status" text DEFAULT 'generated' NOT NULL,
	"generated_by" text,
	"redaction_mode" text DEFAULT 'standard' NOT NULL,
	"row_count" text DEFAULT '0' NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_export_runs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_health_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_date" text NOT NULL,
	"metrics" jsonb NOT NULL,
	"status" text DEFAULT 'green' NOT NULL,
	"generated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_health_snapshots_id_unique" UNIQUE("id"),
	CONSTRAINT "daily_health_snapshots_snapshot_date_unique" UNIQUE("snapshot_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"reason_code" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monitoring_alert_events_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"owner_id" text,
	"due_at" timestamp,
	"status" text DEFAULT 'open' NOT NULL,
	"dedupe_key" text NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"escalated_by" text,
	"escalated_at" timestamp,
	"resolved_by" text,
	"resolved_at" timestamp,
	"reason_code" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monitoring_alerts_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sla_check_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_key" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"checked_count" text DEFAULT '0' NOT NULL,
	"breach_count" text DEFAULT '0' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sla_check_runs_id_unique" UNIQUE("id"),
	CONSTRAINT "sla_check_runs_run_key_unique" UNIQUE("run_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sla_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"entity_type" text NOT NULL,
	"description" text NOT NULL,
	"owner_role" text DEFAULT 'operations' NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"threshold_hours" text NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sla_rules_id_unique" UNIQUE("id"),
	CONSTRAINT "sla_rules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_reporting_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" text NOT NULL,
	"week_end" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"executive_snapshot" text,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"generated_by" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_reporting_packs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "support_assignments" ALTER COLUMN "admin_id" SET DATA TYPE text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "access_review_items" ADD CONSTRAINT "access_review_items_review_id_access_review_runs_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."access_review_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitoring_alert_events" ADD CONSTRAINT "monitoring_alert_events_alert_id_monitoring_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."monitoring_alerts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_review_item_review_idx" ON "access_review_items" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_review_item_user_idx" ON "access_review_items" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "access_review_period_idx" ON "access_review_runs" USING btree ("review_period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_export_window_idx" ON "compliance_export_runs" USING btree ("export_month","export_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_health_snapshot_date_idx" ON "daily_health_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alert_event_alert_idx" ON "monitoring_alert_events" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alert_status_idx" ON "monitoring_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alert_severity_idx" ON "monitoring_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alert_due_at_idx" ON "monitoring_alerts" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monitoring_alert_dedupe_status_idx" ON "monitoring_alerts" USING btree ("dedupe_key","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sla_check_run_key_idx" ON "sla_check_runs" USING btree ("run_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sla_rule_code_idx" ON "sla_rules" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sla_rule_active_idx" ON "sla_rules" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_pack_window_idx" ON "weekly_reporting_packs" USING btree ("week_start","week_end");--> statement-breakpoint
INSERT INTO "sla_rules" ("code", "entity_type", "description", "owner_role", "severity", "threshold_hours")
VALUES
	('SUPPORT_TICKET_24H', 'support_ticket', 'Open support tickets must move within 24 hours.', 'operations', 'critical', '24'),
	('ORDER_PROCESSING_48H', 'order', 'Pending or processing orders must move within 48 hours.', 'operations', 'warning', '48'),
	('REFUND_PENDING_72H', 'refund', 'Pending refunds must be processed or reasoned within 72 hours.', 'finance', 'critical', '72'),
	('BRAND_REQUEST_72H', 'brand_request', 'Pending brand onboarding requests must be reviewed within 72 hours.', 'partnerships', 'warning', '72')
ON CONFLICT ("code") DO NOTHING;
