CREATE TABLE IF NOT EXISTS "platform_settings" (
    "key" text PRIMARY KEY NOT NULL,
    "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "description" text,
    "updated_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carrier_fee_schedule" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "carrier" text DEFAULT 'delhivery' NOT NULL,
    "fee_type" text DEFAULT 'cod' NOT NULL,
    "payment_mode" text DEFAULT 'cod' NOT NULL,
    "zone_code" text,
    "state_code" text,
    "min_amount_paise" integer DEFAULT 0 NOT NULL,
    "max_amount_paise" integer,
    "fee_flat_paise" integer DEFAULT 0 NOT NULL,
    "fee_percent_bps" integer DEFAULT 0 NOT NULL,
    "effective_from" date,
    "effective_to" date,
    "source_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_cod_reconciliation_runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "run_type" text DEFAULT 'remittance_sync' NOT NULL,
    "status" text DEFAULT 'running' NOT NULL,
    "requested_by" text,
    "started_at" timestamp DEFAULT now() NOT NULL,
    "finished_at" timestamp,
    "rows_processed" integer DEFAULT 0 NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "error" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_cod_reconciliation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" text NOT NULL,
    "run_id" uuid,
    "carrier" text DEFAULT 'delhivery' NOT NULL,
    "expected_amount_paise" integer DEFAULT 0 NOT NULL,
    "remitted_amount_paise" integer DEFAULT 0 NOT NULL,
    "expected_fee_paise" integer DEFAULT 0 NOT NULL,
    "actual_fee_paise" integer DEFAULT 0 NOT NULL,
    "discrepancy_amount_paise" integer DEFAULT 0 NOT NULL,
    "ageing_days" integer DEFAULT 0 NOT NULL,
    "remittance_reference" text,
    "remittance_date" date,
    "status" text DEFAULT 'review' NOT NULL,
    "notes" text,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "resolved_by" text,
    "resolved_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commission_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "brand_id" uuid,
    "category_id" uuid,
    "product_type_id" uuid,
    "rule_name" text NOT NULL,
    "commission_percent_bps" integer DEFAULT 0 NOT NULL,
    "holdback_percent_bps" integer DEFAULT 0 NOT NULL,
    "priority" integer DEFAULT 100 NOT NULL,
    "effective_from" date,
    "effective_to" date,
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_payout_config" (
    "id" uuid PRIMARY KEY NOT NULL,
    "payout_method" text DEFAULT 'manual_neft' NOT NULL,
    "payout_cycle_anchor" text DEFAULT '1st' NOT NULL,
    "holdback_percent_bps" integer DEFAULT 0 NOT NULL,
    "minimum_payout_paise" integer DEFAULT 0 NOT NULL,
    "payout_email" text,
    "bank_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_payout_cycles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "cycle_key" text NOT NULL UNIQUE,
    "cycle_start" date NOT NULL,
    "cycle_end" date NOT NULL,
    "payout_date" date NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "calculated_by" text,
    "approved_by" text,
    "executed_by" text,
    "calculation_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_payout_line_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "cycle_id" uuid NOT NULL,
    "brand_id" uuid NOT NULL,
    "line_type" text NOT NULL,
    "reference_type" text,
    "reference_id" text,
    "description" text NOT NULL,
    "amount_paise" integer DEFAULT 0 NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_payout_overrides" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "cycle_id" uuid NOT NULL,
    "brand_id" uuid NOT NULL,
    "adjustment_type" text NOT NULL,
    "amount_paise" integer NOT NULL,
    "reason_code" text NOT NULL,
    "notes" text NOT NULL,
    "proof_file_url" text NOT NULL,
    "created_by" text NOT NULL,
    "approved_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_tds_tracking" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "brand_id" uuid NOT NULL,
    "financial_year" text NOT NULL,
    "cumulative_commission_paise" integer DEFAULT 0 NOT NULL,
    "cumulative_tds_paise" integer DEFAULT 0 NOT NULL,
    "threshold_paise" integer DEFAULT 3000000 NOT NULL,
    "tds_rate_bps" integer DEFAULT 100 NOT NULL,
    "last_applied_cycle_id" uuid,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "brand_tds_tracking_unique_idx" UNIQUE("brand_id","financial_year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hsn_master" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "hsn_code" text NOT NULL UNIQUE,
    "description" text NOT NULL,
    "gst_rate_bps" integer DEFAULT 0 NOT NULL,
    "category_label" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gst_report_runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "month_key" text NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "generated_by" text,
    "file_url" text,
    "record_count" integer DEFAULT 0 NOT NULL,
    "validation_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "totals" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "module_access" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "module_key" text NOT NULL,
    "user_id" text NOT NULL,
    "granted_by" text,
    "can_view" boolean DEFAULT true NOT NULL,
    "can_manage" boolean DEFAULT false NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "module_access_unique_idx" UNIQUE("module_key","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pl_manual_entries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "month_key" text NOT NULL,
    "category" text NOT NULL,
    "description" text NOT NULL,
    "amount_paise" integer NOT NULL,
    "notes" text,
    "created_by" text,
    "updated_by" text,
    "locked_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pl_snapshots" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "month_key" text NOT NULL UNIQUE,
    "snapshot_type" text DEFAULT 'locked' NOT NULL,
    "summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "locked_by" text,
    "locked_at" timestamp,
    "unlocked_by" text,
    "unlocked_at" timestamp,
    "unlock_reason" text,
    "file_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_consents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "consent_type" text NOT NULL,
    "version" text NOT NULL,
    "source" text DEFAULT 'web' NOT NULL,
    "is_granted" boolean DEFAULT true NOT NULL,
    "granted_at" timestamp DEFAULT now() NOT NULL,
    "revoked_at" timestamp,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_deletion_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "status" text DEFAULT 'requested' NOT NULL,
    "reason" text,
    "requested_by_email" text,
    "reviewed_by" text,
    "reviewed_at" timestamp,
    "executed_at" timestamp,
    "completion_evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "error" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legal_contacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "contact_type" text NOT NULL,
    "name" text NOT NULL,
    "email" text,
    "phone" text,
    "address" text,
    "designation" text,
    "notes" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sustainability_certificates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "brand_id" uuid NOT NULL,
    "certificate_type" text NOT NULL,
    "certificate_number" text,
    "issued_by" text,
    "issued_at" date,
    "expires_at" date,
    "file_url" text,
    "verification_url" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_gstin" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "reason_notes" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "refund_type" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "policy_bucket" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "approval_status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "approved_by" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "rejected_by" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "reverse_pickup_required" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "reverse_pickup_shipment_id" uuid;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "razorpay_refund_id" text;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "escalation_status" text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "recovered_in_payout_cycle_id" uuid;
--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN IF NOT EXISTS "bank_account_type" text;
--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN IF NOT EXISTS "beneficiary_code" text;
--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN IF NOT EXISTS "payout_reference" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "grievance_officer_name" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "grievance_officer_email" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "grievance_officer_phone" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "grievance_officer_address" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "support_email" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "support_phone" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "dpdp_consent_version" text;
--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN IF NOT EXISTS "is_consumer_protection_published" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO "platform_settings" ("key", "value", "description")
VALUES (
    'refund_approval_threshold_paise',
    '{"value":200000}'::jsonb,
    'Approval threshold for refund execution in paise'
)
ON CONFLICT ("key") DO NOTHING;
