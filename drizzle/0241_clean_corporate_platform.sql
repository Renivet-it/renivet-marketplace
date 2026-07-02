CREATE TABLE IF NOT EXISTS "corporate_color_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hex_code" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_extra_charge_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"charge_type" text DEFAULT 'flat' NOT NULL,
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"is_default_selected" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_fabric_compositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_gsm_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"gsm_value" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_logo_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"placement_group" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_order_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gst_rate_bps" integer DEFAULT 1800 NOT NULL,
	"advance_percent_bps" integer DEFAULT 3000 NOT NULL,
	"expected_timeline_text" text DEFAULT '10-15 business days from approval and artwork confirmation.' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_order_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_user_id" text,
	"note" text,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_no" serial NOT NULL,
	"public_order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"company_name" text NOT NULL,
	"contact_person_name" text NOT NULL,
	"email_address" text NOT NULL,
	"mobile_number" text NOT NULL,
	"gst_number" text,
	"delivery_address" text NOT NULL,
	"number_of_employees" integer NOT NULL,
	"employee_count" integer NOT NULL,
	"quantity" integer NOT NULL,
	"size_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"employee_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"company_snapshot" jsonb NOT NULL,
	"product_config_snapshot" jsonb NOT NULL,
	"branding_config_snapshot" jsonb NOT NULL,
	"pricing_snapshot" jsonb NOT NULL,
	"artwork_file" jsonb DEFAULT 'null'::jsonb,
	"employee_sheet_file" jsonb DEFAULT 'null'::jsonb,
	"subtotal_paise" integer NOT NULL,
	"customization_paise" integer DEFAULT 0 NOT NULL,
	"gst_rate_bps" integer NOT NULL,
	"gst_paise" integer NOT NULL,
	"total_paise" integer NOT NULL,
	"advance_percent_bps" integer NOT NULL,
	"advance_paid_paise" integer NOT NULL,
	"balance_due_paise" integer NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"payment_reference" text,
	"balance_payment_link" text,
	"balance_payment_notes" text,
	"balance_payment_status" text DEFAULT 'pending' NOT NULL,
	"customer_notes" text,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_pricing_slabs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_type_id" uuid NOT NULL,
	"gsm_option_id" uuid NOT NULL,
	"min_quantity" integer NOT NULL,
	"max_quantity" integer,
	"unit_price_paise" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_print_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price_modifier_paise" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_activity_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"event_name" text NOT NULL,
	"event_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" text,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"old_value" jsonb DEFAULT 'null'::jsonb,
	"new_value" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_brand_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_brand_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"commission_percentage_bps" integer DEFAULT 0 NOT NULL,
	"effective_from" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_brand_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"gross_order_value_paise" integer NOT NULL,
	"commission_amount_paise" integer NOT NULL,
	"net_payable_paise" integer NOT NULL,
	"payout_status" text DEFAULT 'queued' NOT NULL,
	"payout_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_cancellations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"requested_by_user_id" text,
	"cancellation_reason" text NOT NULL,
	"refund_percentage_bps" integer DEFAULT 0 NOT NULL,
	"refund_amount_paise" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_invoice_id" uuid,
	"credit_note_number" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_cron_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" text NOT NULL,
	"execution_status" text NOT NULL,
	"remarks" text,
	"executed_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_customizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid,
	"order_id" uuid,
	"customization_type" text NOT NULL,
	"cost_paise" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size_bytes" integer,
	"mime_type" text,
	"version" integer DEFAULT 1 NOT NULL,
	"uploaded_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"escalation_level" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"triggered_at" date,
	"resolved_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exception_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_finance_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_id" text,
	"notification_type" text NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" date,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_payment_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"quote_id" uuid,
	"payment_term" text DEFAULT 'immediate' NOT NULL,
	"advance_percentage_bps" integer DEFAULT 0 NOT NULL,
	"balance_due_days" integer,
	"approved_by_user_id" text,
	"custom_terms_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"quote_id" uuid,
	"payment_type" text DEFAULT 'advance' NOT NULL,
	"payment_mode" text DEFAULT 'razorpay' NOT NULL,
	"amount_paise" integer NOT NULL,
	"payment_reference" text,
	"payment_status" text DEFAULT 'payment_pending' NOT NULL,
	"payment_date" date,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_product_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"corporate_title" text NOT NULL,
	"corporate_description" text,
	"moq" integer DEFAULT 1 NOT NULL,
	"max_capacity_per_order" integer,
	"monthly_capacity" integer,
	"lead_time_days" integer DEFAULT 10 NOT NULL,
	"available_sizes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"available_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customization_options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"customization_charges" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_range_min_paise" integer DEFAULT 0 NOT NULL,
	"price_range_max_paise" integer,
	"sustainability_notes" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"gst_number" text,
	"website" text,
	"company_size" text,
	"industry" text,
	"contact_person" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"billing_address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"shipping_address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_proforma_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"quote_id" uuid NOT NULL,
	"customer_id" uuid,
	"invoice_date" date,
	"subtotal_paise" integer NOT NULL,
	"gst_amount_paise" integer NOT NULL,
	"total_amount_paise" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" text NOT NULL,
	"corporate_order_id" uuid,
	"quote_id" uuid,
	"corporate_profile_id" uuid,
	"po_value_paise" integer NOT NULL,
	"po_date" date,
	"delivery_date" date,
	"uploaded_file_url" text,
	"status" text DEFAULT 'po_uploaded' NOT NULL,
	"approved_by_user_id" text,
	"approved_at" date,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_qc_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qc_submission_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"image_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_qc_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"submitted_by_user_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"remarks" text,
	"sample_coverage_percent" integer,
	"submitted_at" date,
	"reviewed_by_user_id" text,
	"reviewed_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_quote_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"customization_cost_paise" integer DEFAULT 0 NOT NULL,
	"gst_amount_paise" integer DEFAULT 0 NOT NULL,
	"total_amount_paise" integer NOT NULL,
	"comments" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_number" text NOT NULL,
	"rfq_id" uuid,
	"corporate_profile_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"product_id" uuid,
	"corporate_product_config_id" uuid,
	"quantity" integer NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"customization_cost_paise" integer DEFAULT 0 NOT NULL,
	"gst_amount_paise" integer DEFAULT 0 NOT NULL,
	"total_amount_paise" integer NOT NULL,
	"advance_amount_paise" integer DEFAULT 0 NOT NULL,
	"balance_amount_paise" integer DEFAULT 0 NOT NULL,
	"valid_until" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"customer_decision_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cancellation_id" uuid,
	"order_id" uuid,
	"refund_amount_paise" integer NOT NULL,
	"refund_method" text NOT NULL,
	"refund_reference" text,
	"refund_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_type" text NOT NULL,
	"file_url" text,
	"generated_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_rfq_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"assigned_to_user_id" text NOT NULL,
	"assigned_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_rfq_brand_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"confidence_score_bps" integer DEFAULT 0 NOT NULL,
	"recommendation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_rfq_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size_bytes" integer,
	"uploaded_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_number" text NOT NULL,
	"corporate_profile_id" uuid,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"contact_person" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"use_case" text NOT NULL,
	"quantity" integer NOT NULL,
	"budget_per_unit_paise" integer,
	"delivery_date" date,
	"sustainability_required" boolean DEFAULT false NOT NULL,
	"branding_required" boolean DEFAULT true NOT NULL,
	"requirement_description" text NOT NULL,
	"status" text DEFAULT 'rfq_submitted' NOT NULL,
	"assigned_admin_user_id" text,
	"procurement_mode" text DEFAULT 'rfq' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"courier_name" text,
	"tracking_number" text,
	"awb_number" text,
	"tracking_url" text,
	"dispatch_date" date,
	"delivery_date" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_size_breakdowns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"size_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_sla_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_type" text NOT NULL,
	"stage_name" text NOT NULL,
	"sla_hours" integer NOT NULL,
	"escalation_level_1_hours" integer,
	"escalation_level_2_hours" integer,
	"escalation_level_3_hours" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"assigned_to_user_id" text,
	"due_date" date,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_tax_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_date" date,
	"taxable_value_paise" integer NOT NULL,
	"cgst_paise" integer DEFAULT 0 NOT NULL,
	"sgst_paise" integer DEFAULT 0 NOT NULL,
	"igst_paise" integer DEFAULT 0 NOT NULL,
	"total_amount_paise" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_swap_reward_order" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "swap_reward_cycle" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reward_redemption_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_status" text DEFAULT 'pass' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_score" integer DEFAULT 100 NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_last_checked_at" timestamp;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_findings" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_suggested_fixes" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_reviewed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_reviewed_by" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_escalated_to" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qc_owner" text DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inventory_last_synced_at" timestamp;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inventory_source" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_order_status_history" ADD CONSTRAINT "corporate_order_status_history_corporate_order_id_corporate_orders_id_fk" FOREIGN KEY ("corporate_order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_order_status_history" ADD CONSTRAINT "corporate_order_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_pricing_slabs" ADD CONSTRAINT "corporate_pricing_slabs_product_type_id_corporate_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."corporate_product_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_pricing_slabs" ADD CONSTRAINT "corporate_pricing_slabs_gsm_option_id_corporate_gsm_options_id_fk" FOREIGN KEY ("gsm_option_id") REFERENCES "public"."corporate_gsm_options"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_admin_audit_logs" ADD CONSTRAINT "corporate_admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_brand_audit_logs" ADD CONSTRAINT "corporate_brand_audit_logs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_brand_audit_logs" ADD CONSTRAINT "corporate_brand_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_brand_commissions" ADD CONSTRAINT "corporate_brand_commissions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_brand_payouts" ADD CONSTRAINT "corporate_brand_payouts_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_brand_payouts" ADD CONSTRAINT "corporate_brand_payouts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_cancellations" ADD CONSTRAINT "corporate_cancellations_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_cancellations" ADD CONSTRAINT "corporate_cancellations_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_credit_notes" ADD CONSTRAINT "corporate_credit_notes_tax_invoice_id_corporate_tax_invoices_id_fk" FOREIGN KEY ("tax_invoice_id") REFERENCES "public"."corporate_tax_invoices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_customizations" ADD CONSTRAINT "corporate_customizations_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_customizations" ADD CONSTRAINT "corporate_customizations_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_documents" ADD CONSTRAINT "corporate_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_finance_audit_logs" ADD CONSTRAINT "corporate_finance_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_payment_terms" ADD CONSTRAINT "corporate_payment_terms_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_payment_terms" ADD CONSTRAINT "corporate_payment_terms_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_payment_terms" ADD CONSTRAINT "corporate_payment_terms_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_payments" ADD CONSTRAINT "corporate_payments_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_payments" ADD CONSTRAINT "corporate_payments_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_product_configs" ADD CONSTRAINT "corporate_product_configs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_product_configs" ADD CONSTRAINT "corporate_product_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_profiles" ADD CONSTRAINT "corporate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_proforma_invoices" ADD CONSTRAINT "corporate_proforma_invoices_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_proforma_invoices" ADD CONSTRAINT "corporate_proforma_invoices_customer_id_corporate_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."corporate_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_purchase_orders" ADD CONSTRAINT "corporate_purchase_orders_corporate_order_id_corporate_orders_id_fk" FOREIGN KEY ("corporate_order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_purchase_orders" ADD CONSTRAINT "corporate_purchase_orders_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_purchase_orders" ADD CONSTRAINT "corporate_purchase_orders_corporate_profile_id_corporate_profiles_id_fk" FOREIGN KEY ("corporate_profile_id") REFERENCES "public"."corporate_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_purchase_orders" ADD CONSTRAINT "corporate_purchase_orders_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_qc_images" ADD CONSTRAINT "corporate_qc_images_qc_submission_id_corporate_qc_submissions_id_fk" FOREIGN KEY ("qc_submission_id") REFERENCES "public"."corporate_qc_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_qc_submissions" ADD CONSTRAINT "corporate_qc_submissions_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_qc_submissions" ADD CONSTRAINT "corporate_qc_submissions_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_qc_submissions" ADD CONSTRAINT "corporate_qc_submissions_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quote_revisions" ADD CONSTRAINT "corporate_quote_revisions_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quote_revisions" ADD CONSTRAINT "corporate_quote_revisions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_rfq_id_corporate_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."corporate_rfqs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_corporate_profile_id_corporate_profiles_id_fk" FOREIGN KEY ("corporate_profile_id") REFERENCES "public"."corporate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_corporate_product_config_id_corporate_product_configs_id_fk" FOREIGN KEY ("corporate_product_config_id") REFERENCES "public"."corporate_product_configs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_refunds" ADD CONSTRAINT "corporate_refunds_cancellation_id_corporate_cancellations_id_fk" FOREIGN KEY ("cancellation_id") REFERENCES "public"."corporate_cancellations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_refunds" ADD CONSTRAINT "corporate_refunds_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_assignments" ADD CONSTRAINT "corporate_rfq_assignments_rfq_id_corporate_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."corporate_rfqs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_assignments" ADD CONSTRAINT "corporate_rfq_assignments_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_assignments" ADD CONSTRAINT "corporate_rfq_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_brand_matches" ADD CONSTRAINT "corporate_rfq_brand_matches_rfq_id_corporate_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."corporate_rfqs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_brand_matches" ADD CONSTRAINT "corporate_rfq_brand_matches_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_documents" ADD CONSTRAINT "corporate_rfq_documents_rfq_id_corporate_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."corporate_rfqs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfq_documents" ADD CONSTRAINT "corporate_rfq_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfqs" ADD CONSTRAINT "corporate_rfqs_corporate_profile_id_corporate_profiles_id_fk" FOREIGN KEY ("corporate_profile_id") REFERENCES "public"."corporate_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfqs" ADD CONSTRAINT "corporate_rfqs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_rfqs" ADD CONSTRAINT "corporate_rfqs_assigned_admin_user_id_users_id_fk" FOREIGN KEY ("assigned_admin_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_shipments" ADD CONSTRAINT "corporate_shipments_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_size_breakdowns" ADD CONSTRAINT "corporate_size_breakdowns_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_tasks" ADD CONSTRAINT "corporate_tasks_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_tax_invoices" ADD CONSTRAINT "corporate_tax_invoices_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_color_options_name_unique" ON "corporate_color_options" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_extra_charge_rules_code_unique" ON "corporate_extra_charge_rules" USING btree ("code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_fabric_compositions_name_unique" ON "corporate_fabric_compositions" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_gsm_options_label_unique" ON "corporate_gsm_options" USING btree ("label");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_logo_locations_name_unique" ON "corporate_logo_locations" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_order_status_history_order_idx" ON "corporate_order_status_history" USING btree ("corporate_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_orders_public_order_unique" ON "corporate_orders" USING btree ("public_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_orders_sequence_unique" ON "corporate_orders" USING btree ("sequence_no");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_orders_user_idx" ON "corporate_orders" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_orders_status_idx" ON "corporate_orders" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_orders_payment_status_idx" ON "corporate_orders" USING btree ("payment_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_pricing_slabs_lookup_idx" ON "corporate_pricing_slabs" USING btree ("product_type_id","gsm_option_id","min_quantity");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_print_methods_name_unique" ON "corporate_print_methods" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_product_types_name_unique" ON "corporate_product_types" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_activity_timeline_entity_idx" ON "corporate_activity_timeline" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_customizations_quote_idx" ON "corporate_customizations" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_customizations_order_idx" ON "corporate_customizations" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_documents_entity_idx" ON "corporate_documents" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_escalations_entity_idx" ON "corporate_escalations" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_payments_order_idx" ON "corporate_payments" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_payments_status_idx" ON "corporate_payments" USING btree ("payment_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_product_configs_product_idx" ON "corporate_product_configs" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_product_configs_brand_idx" ON "corporate_product_configs" USING btree ("brand_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_profiles_user_idx" ON "corporate_profiles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_purchase_orders_number_idx" ON "corporate_purchase_orders" USING btree ("po_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_qc_images_qc_idx" ON "corporate_qc_images" USING btree ("qc_submission_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_qc_submissions_order_idx" ON "corporate_qc_submissions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_quote_revisions_quote_idx" ON "corporate_quote_revisions" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_quotes_number_idx" ON "corporate_quotes" USING btree ("quote_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_quotes_profile_idx" ON "corporate_quotes" USING btree ("corporate_profile_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_quotes_status_idx" ON "corporate_quotes" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_rfq_assignments_rfq_idx" ON "corporate_rfq_assignments" USING btree ("rfq_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_rfq_brand_matches_rfq_idx" ON "corporate_rfq_brand_matches" USING btree ("rfq_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_rfq_documents_rfq_idx" ON "corporate_rfq_documents" USING btree ("rfq_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_rfqs_number_idx" ON "corporate_rfqs" USING btree ("rfq_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_rfqs_user_idx" ON "corporate_rfqs" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_rfqs_status_idx" ON "corporate_rfqs" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_shipments_order_idx" ON "corporate_shipments" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_shipments_tracking_idx" ON "corporate_shipments" USING btree ("tracking_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_size_breakdowns_order_idx" ON "corporate_size_breakdowns" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_tasks_entity_idx" ON "corporate_tasks" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_tasks_assignee_idx" ON "corporate_tasks" USING btree ("assigned_to_user_id");
