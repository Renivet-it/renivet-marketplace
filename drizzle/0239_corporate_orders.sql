CREATE TABLE "corporate_product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_gsm_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"gsm_value" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_fabric_compositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_color_options" (
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
CREATE TABLE "corporate_print_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price_modifier_paise" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_logo_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"placement_group" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_extra_charge_rules" (
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
CREATE TABLE "corporate_pricing_slabs" (
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
CREATE TABLE "corporate_order_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gst_rate_bps" integer DEFAULT 1800 NOT NULL,
	"advance_percent_bps" integer DEFAULT 3000 NOT NULL,
	"expected_timeline_text" text DEFAULT '10-15 business days from approval and artwork confirmation.' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_orders" (
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
	"artwork_file" jsonb DEFAULT null,
	"employee_sheet_file" jsonb DEFAULT null,
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
CREATE TABLE "corporate_order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_order_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_user_id" text,
	"note" text,
	"metadata" jsonb DEFAULT null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "corporate_pricing_slabs" ADD CONSTRAINT "corporate_pricing_slabs_product_type_id_corporate_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."corporate_product_types"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corporate_pricing_slabs" ADD CONSTRAINT "corporate_pricing_slabs_gsm_option_id_corporate_gsm_options_id_fk" FOREIGN KEY ("gsm_option_id") REFERENCES "public"."corporate_gsm_options"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corporate_order_status_history" ADD CONSTRAINT "corporate_order_status_history_corporate_order_id_corporate_orders_id_fk" FOREIGN KEY ("corporate_order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corporate_order_status_history" ADD CONSTRAINT "corporate_order_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_product_types_name_unique" ON "corporate_product_types" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_gsm_options_label_unique" ON "corporate_gsm_options" USING btree ("label");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_fabric_compositions_name_unique" ON "corporate_fabric_compositions" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_color_options_name_unique" ON "corporate_color_options" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_print_methods_name_unique" ON "corporate_print_methods" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_logo_locations_name_unique" ON "corporate_logo_locations" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_extra_charge_rules_code_unique" ON "corporate_extra_charge_rules" USING btree ("code");
--> statement-breakpoint
CREATE INDEX "corporate_pricing_slabs_lookup_idx" ON "corporate_pricing_slabs" USING btree ("product_type_id","gsm_option_id","min_quantity");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_orders_public_order_unique" ON "corporate_orders" USING btree ("public_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_orders_sequence_unique" ON "corporate_orders" USING btree ("sequence_no");
--> statement-breakpoint
CREATE INDEX "corporate_orders_user_idx" ON "corporate_orders" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "corporate_orders_status_idx" ON "corporate_orders" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "corporate_orders_payment_status_idx" ON "corporate_orders" USING btree ("payment_status");
--> statement-breakpoint
CREATE INDEX "corporate_order_status_history_order_idx" ON "corporate_order_status_history" USING btree ("corporate_order_id");
