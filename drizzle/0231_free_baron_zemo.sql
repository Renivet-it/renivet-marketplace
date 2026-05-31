CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp_utc" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"user_role_snapshot" text,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before_value" jsonb,
	"after_value" jsonb,
	"reason" text,
	"ip_address" text,
	"session_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"voided_by" text,
	"voided_at" timestamp,
	"void_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_export_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_run_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text DEFAULT 'text/csv' NOT NULL,
	"row_count" text DEFAULT '0' NOT NULL,
	"storage_path" text,
	"checksum" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_export_files_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_alert_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"error" text,
	"sent_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monitoring_alert_deliveries_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "sustainability_certificate_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "status_reason_code" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "contract_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "contract_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "brand_acknowledged_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "brand_acknowledged_by" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_reason_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "manual_override_reason" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "reason_code" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "reason_notes" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "processed_by" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "failed_reason" text;--> statement-breakpoint
ALTER TABLE "compliance_export_runs" ADD COLUMN "files" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "compliance_export_runs" ADD COLUMN "retention_until" timestamp;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD COLUMN "owner_role" text;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD COLUMN "channels" jsonb DEFAULT '["admin"]'::jsonb;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD COLUMN "recipients" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD COLUMN "acknowledged_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "sla_rules" ADD COLUMN "channels" jsonb DEFAULT '["admin"]'::jsonb;--> statement-breakpoint
ALTER TABLE "sla_rules" ADD COLUMN "recipients" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_export_files" ADD CONSTRAINT "compliance_export_files_export_run_id_compliance_export_runs_id_fk" FOREIGN KEY ("export_run_id") REFERENCES "public"."compliance_export_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitoring_alert_deliveries" ADD CONSTRAINT "monitoring_alert_deliveries_alert_id_monitoring_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."monitoring_alerts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_logs" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_timestamp_idx" ON "audit_logs" USING btree ("timestamp_utc");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_export_file_run_idx" ON "compliance_export_files" USING btree ("export_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alert_delivery_alert_idx" ON "monitoring_alert_deliveries" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alert_delivery_channel_idx" ON "monitoring_alert_deliveries" USING btree ("channel");