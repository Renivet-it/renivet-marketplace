-- Migration: 0269_corporate_orders_build_spec_v5.sql
-- Corporate Orders Consolidated Build Spec v5.0 Schema Remediation

-- 1. Brand Onboarding & Capabilities
ALTER TABLE "brands"
    ADD COLUMN IF NOT EXISTS "is_corporate_enabled" boolean DEFAULT false NOT NULL;

ALTER TABLE "brand_confidentials"
    ADD COLUMN IF NOT EXISTS "entity_type" text,
    ADD COLUMN IF NOT EXISTS "aggregate_annual_turnover_paise" bigint,
    ADD COLUMN IF NOT EXISTS "authorized_signatory_image_url" text,
    ADD COLUMN IF NOT EXISTS "corporate_sla_lead_time_days" integer,
    ADD COLUMN IF NOT EXISTS "corporate_monthly_capacity" integer,
    ADD COLUMN IF NOT EXISTS "pan_verified" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "pan_verified_at" timestamp with time zone;

-- 2. Corporate Product Configs
ALTER TABLE "corporate_product_configs"
    ADD COLUMN IF NOT EXISTS "unit_of_measurement" text DEFAULT 'Pc' NOT NULL,
    ADD COLUMN IF NOT EXISTS "weight_grams_per_unit" integer,
    ADD COLUMN IF NOT EXISTS "hsn_override_id" uuid REFERENCES "public"."hsn_master"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "sample_available" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "max_print_area_sq_cm" integer,
    ADD COLUMN IF NOT EXISTS "certifications" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 3. Corporate Fulfillment Orders
CREATE TABLE IF NOT EXISTS "corporate_fulfillment_orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fo_number" text NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "public"."corporate_orders"("id") ON DELETE CASCADE,
    "brand_id" uuid NOT NULL REFERENCES "public"."brands"("id") ON DELETE RESTRICT,
    "issue_date" date NOT NULL,
    "expected_delivery_date" date,
    "quantity" integer NOT NULL,
    "unit_sell_price_paise" integer DEFAULT 0 NOT NULL,
    "total_amount_paise" integer DEFAULT 0 NOT NULL,
    "delivery_mode" text DEFAULT 'direct_to_customer' NOT NULL,
    "delivery_address" text NOT NULL,
    "payment_terms" text NOT NULL,
    "delivery_instructions" text,
    "status" text DEFAULT 'issued' NOT NULL,
    "created_by_user_id" text REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_fulfillment_orders_number_idx"
    ON "corporate_fulfillment_orders" ("fo_number");
CREATE INDEX IF NOT EXISTS "corporate_fulfillment_orders_order_idx"
    ON "corporate_fulfillment_orders" ("order_id");
CREATE INDEX IF NOT EXISTS "corporate_fulfillment_orders_brand_idx"
    ON "corporate_fulfillment_orders" ("brand_id");

-- 4. Corporate Brand Tax Invoices (Deprecation Flag)
ALTER TABLE "corporate_brand_tax_invoices"
    ADD COLUMN IF NOT EXISTS "is_deprecated" boolean DEFAULT true NOT NULL;

-- 5. Corporate Delivery Challans
ALTER TABLE "corporate_delivery_challans"
    ALTER COLUMN "on_behalf_of" DROP NOT NULL,
    ALTER COLUMN "on_behalf_of" DROP DEFAULT;

-- 6. Corporate Tax Invoices (Brand-Issued Facilitator Model)
ALTER TABLE "corporate_tax_invoices"
    ADD COLUMN IF NOT EXISTS "brand_id" uuid REFERENCES "public"."brands"("id") ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS "buyer_gstin" text,
    ADD COLUMN IF NOT EXISTS "po_reference" text,
    ADD COLUMN IF NOT EXISTS "advance_adjustment_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "payment_terms" text,
    ADD COLUMN IF NOT EXISTS "bank_details_snapshot" jsonb;

-- 7. Corporate Credit Notes
ALTER TABLE "corporate_credit_notes"
    ADD COLUMN IF NOT EXISTS "brand_id" uuid REFERENCES "public"."brands"("id") ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS "buyer_gstin" text,
    ADD COLUMN IF NOT EXISTS "hsn_code" text,
    ADD COLUMN IF NOT EXISTS "cgst_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "sgst_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "igst_paise" integer DEFAULT 0 NOT NULL;

-- 8. Corporate Debit Notes (New Table)
CREATE TABLE IF NOT EXISTS "corporate_debit_notes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "brand_id" uuid NOT NULL REFERENCES "public"."brands"("id") ON DELETE RESTRICT,
    "order_id" uuid NOT NULL REFERENCES "public"."corporate_orders"("id") ON DELETE CASCADE,
    "original_invoice_id" uuid REFERENCES "public"."corporate_tax_invoices"("id") ON DELETE SET NULL,
    "debit_note_number" text NOT NULL,
    "buyer_gstin" text NOT NULL,
    "hsn_code" text NOT NULL,
    "reason" text,
    "taxable_value_paise" integer NOT NULL,
    "cgst_paise" integer DEFAULT 0 NOT NULL,
    "sgst_paise" integer DEFAULT 0 NOT NULL,
    "igst_paise" integer DEFAULT 0 NOT NULL,
    "total_paise" integer NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_debit_notes_number_idx"
    ON "corporate_debit_notes" ("debit_note_number");
CREATE INDEX IF NOT EXISTS "corporate_debit_notes_order_idx"
    ON "corporate_debit_notes" ("order_id");
CREATE INDEX IF NOT EXISTS "corporate_debit_notes_brand_idx"
    ON "corporate_debit_notes" ("brand_id");

-- 9. Corporate Refund Vouchers (New Table)
CREATE TABLE IF NOT EXISTS "corporate_refund_vouchers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "voucher_number" text NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "public"."corporate_orders"("id") ON DELETE CASCADE,
    "cancellation_id" uuid REFERENCES "public"."corporate_cancellations"("id") ON DELETE SET NULL,
    "refund_id" uuid REFERENCES "public"."corporate_refunds"("id") ON DELETE SET NULL,
    "receipt_voucher_id" uuid REFERENCES "public"."corporate_receipt_vouchers"("id") ON DELETE SET NULL,
    "voucher_date" date NOT NULL,
    "amount_paise" integer NOT NULL,
    "reason" text,
    "status" text DEFAULT 'issued' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_refund_vouchers_number_idx"
    ON "corporate_refund_vouchers" ("voucher_number");
CREATE INDEX IF NOT EXISTS "corporate_refund_vouchers_order_idx"
    ON "corporate_refund_vouchers" ("order_id");

-- 10. Corporate Shipments & Brand Payouts
ALTER TABLE "corporate_shipments"
    ADD COLUMN IF NOT EXISTS "actual_quantity_delivered" integer;

ALTER TABLE "corporate_brand_payouts"
    ADD COLUMN IF NOT EXISTS "settlement_hold_until" timestamp with time zone;

-- 11. Corporate Quotes Extras, HSN & Commission Fields
ALTER TABLE "corporate_quotes"
    ADD COLUMN IF NOT EXISTS "hsn_code" text,
    ADD COLUMN IF NOT EXISTS "extra_charge_rule_ids" jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "manual_extra_amount_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "manual_extra_description" text,
    ADD COLUMN IF NOT EXISTS "commission_amount_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "commission_gst_rate_bps" integer DEFAULT 1800 NOT NULL,
    ADD COLUMN IF NOT EXISTS "commission_gst_amount_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "commission_total_paise" integer DEFAULT 0 NOT NULL;

-- 12. Corporate Orders Commission Fields
ALTER TABLE "corporate_orders"
    ADD COLUMN IF NOT EXISTS "commission_amount_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "commission_gst_rate_bps" integer DEFAULT 1800 NOT NULL,
    ADD COLUMN IF NOT EXISTS "commission_gst_amount_paise" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "commission_total_paise" integer DEFAULT 0 NOT NULL;

-- 13. Update Foreign Key references for Fulfillment Orders
ALTER TABLE "corporate_brand_tax_invoices"
    DROP CONSTRAINT IF EXISTS "corporate_brand_tax_invoices_vendor_purchase_order_id_fkey";

ALTER TABLE "corporate_brand_tax_invoices"
    ADD CONSTRAINT "corporate_brand_tax_invoices_vendor_purchase_order_id_fkey"
    FOREIGN KEY ("vendor_purchase_order_id") REFERENCES "corporate_fulfillment_orders"("id")
    ON DELETE SET NULL;

ALTER TABLE "corporate_delivery_challans"
    DROP CONSTRAINT IF EXISTS "corporate_delivery_challans_vendor_purchase_order_id_fkey";

ALTER TABLE "corporate_delivery_challans"
    ADD CONSTRAINT "corporate_delivery_challans_vendor_purchase_order_id_fkey"
    FOREIGN KEY ("vendor_purchase_order_id") REFERENCES "corporate_fulfillment_orders"("id")
    ON DELETE SET NULL;

-- 14. Corporate Settlement Statements (Doc 7 Waterfall)
CREATE TABLE IF NOT EXISTS "corporate_settlement_statements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "public"."corporate_orders"("id") ON DELETE CASCADE,
    "brand_id" uuid NOT NULL REFERENCES "public"."brands"("id") ON DELETE CASCADE,
    "statement_number" text NOT NULL,
    "statement_date" date NOT NULL,
    "gross_paid_paise" integer NOT NULL,
    "gst_embedded_paise" integer NOT NULL,
    "taxable_value_paise" integer NOT NULL,
    "commission_percent_bps" integer NOT NULL,
    "commission_amount_paise" integer NOT NULL,
    "commission_gst_rate_bps" integer DEFAULT 1800 NOT NULL,
    "commission_gst_amount_paise" integer NOT NULL,
    "tcs_percent_bps" integer DEFAULT 50 NOT NULL,
    "tcs_amount_paise" integer NOT NULL,
    "tds_percent_bps" integer DEFAULT 10 NOT NULL,
    "tds_amount_paise" integer NOT NULL,
    "net_remittance_paise" integer NOT NULL,
    "status" text DEFAULT 'issued' NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_settlement_statements_number_idx"
    ON "corporate_settlement_statements" ("statement_number");
CREATE INDEX IF NOT EXISTS "corporate_settlement_statements_order_idx"
    ON "corporate_settlement_statements" ("order_id");
CREATE INDEX IF NOT EXISTS "corporate_settlement_statements_brand_idx"
    ON "corporate_settlement_statements" ("brand_id");


