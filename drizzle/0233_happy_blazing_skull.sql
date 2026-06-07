CREATE TABLE IF NOT EXISTS "carrier_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"shipment_id" uuid,
	"brand_id" uuid,
	"awb_number" text,
	"claim_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"declared_value" integer DEFAULT 0 NOT NULL,
	"claim_amount" integer DEFAULT 0 NOT NULL,
	"approved_amount" integer,
	"filed_at" timestamp,
	"due_at" timestamp,
	"settled_at" timestamp,
	"filed_by" text,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cod_reconciliation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"order_id" text NOT NULL,
	"awb_number" text,
	"delivered_at" timestamp,
	"cod_amount" integer DEFAULT 0 NOT NULL,
	"remitted_amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"remittance_reference" text,
	"variance_reason" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cod_reconciliation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_date" timestamp DEFAULT now() NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"expected_amount" integer DEFAULT 0 NOT NULL,
	"remitted_amount" integer DEFAULT 0 NOT NULL,
	"variance_amount" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"completed_by" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"reason" text NOT NULL,
	"severity" text DEFAULT 'watch' NOT NULL,
	"added_by" text,
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fraud_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"triggers" jsonb DEFAULT '[]'::jsonb,
	"reviewer_id" text,
	"reviewed_at" timestamp,
	"decision_reason_code" text,
	"notes" text,
	"due_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_ops_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"channel" text NOT NULL,
	"template_key" text,
	"subject" text,
	"message" text NOT NULL,
	"direction" text DEFAULT 'outbound' NOT NULL,
	"recipient" text,
	"sent_by" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_ops_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"state" text NOT NULL,
	"previous_state" text,
	"owner_id" text,
	"reason_code" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"entered_at" timestamp DEFAULT now() NOT NULL,
	"due_at" timestamp,
	"exited_at" timestamp,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rto_dispositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"shipment_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"rto_reason" text NOT NULL,
	"fault_owner" text DEFAULT 'unknown' NOT NULL,
	"customer_contacted_at" timestamp,
	"recovery_decision" text DEFAULT 'pending' NOT NULL,
	"disposition_due_at" timestamp,
	"disposition_at" timestamp,
	"handled_by" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carrier_claims" ADD CONSTRAINT "carrier_claims_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carrier_claims" ADD CONSTRAINT "carrier_claims_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carrier_claims" ADD CONSTRAINT "carrier_claims_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carrier_claims" ADD CONSTRAINT "carrier_claims_filed_by_users_id_fk" FOREIGN KEY ("filed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cod_reconciliation_items" ADD CONSTRAINT "cod_reconciliation_items_run_id_cod_reconciliation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."cod_reconciliation_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cod_reconciliation_items" ADD CONSTRAINT "cod_reconciliation_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cod_reconciliation_runs" ADD CONSTRAINT "cod_reconciliation_runs_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_blocklist" ADD CONSTRAINT "fraud_blocklist_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_reviews" ADD CONSTRAINT "fraud_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_reviews" ADD CONSTRAINT "fraud_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_ops_communications" ADD CONSTRAINT "order_ops_communications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_ops_communications" ADD CONSTRAINT "order_ops_communications_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_ops_states" ADD CONSTRAINT "order_ops_states_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_ops_states" ADD CONSTRAINT "order_ops_states_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rto_dispositions" ADD CONSTRAINT "rto_dispositions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rto_dispositions" ADD CONSTRAINT "rto_dispositions_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rto_dispositions" ADD CONSTRAINT "rto_dispositions_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carrier_claim_order_idx" ON "carrier_claims" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carrier_claim_status_idx" ON "carrier_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cod_recon_item_run_idx" ON "cod_reconciliation_items" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cod_recon_item_order_run_idx" ON "cod_reconciliation_items" USING btree ("run_id","order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cod_recon_run_date_idx" ON "cod_reconciliation_runs" USING btree ("run_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fraud_blocklist_value_idx" ON "fraud_blocklist" USING btree ("type","value");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fraud_review_order_idx" ON "fraud_reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fraud_review_status_idx" ON "fraud_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_ops_comm_order_idx" ON "order_ops_communications" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_ops_state_order_idx" ON "order_ops_states" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_ops_state_current_idx" ON "order_ops_states" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_ops_state_state_idx" ON "order_ops_states" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rto_disposition_order_idx" ON "rto_dispositions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rto_disposition_status_idx" ON "rto_dispositions" USING btree ("status");