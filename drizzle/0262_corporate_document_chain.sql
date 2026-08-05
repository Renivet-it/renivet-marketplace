CREATE TABLE IF NOT EXISTS "corporate_document_settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "legal_name" text DEFAULT 'Renivet' NOT NULL,
    "trade_name" text DEFAULT 'Renivet' NOT NULL,
    "gstin" text,
    "cin" text,
    "address_line_1" text,
    "address_line_2" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "country" text DEFAULT 'India' NOT NULL,
    "email" text,
    "phone" text,
    "bank_name" text DEFAULT 'IDFC',
    "bank_account_name" text DEFAULT 'Renivet' NOT NULL,
    "bank_account_number" text DEFAULT '73564993505',
    "bank_account_type" text,
    "bank_ifsc_code" text DEFAULT 'IDFB0090174',
    "bank_branch" text,
    "authorized_signatory_name" text DEFAULT 'Renivet' NOT NULL,
    "default_payment_terms" text DEFAULT '30% advance on PO confirmation; balance within 15 days of dispatch.' NOT NULL,
    "proforma_validity_days" integer DEFAULT 14 NOT NULL,
    "balance_due_days" integer DEFAULT 15 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_document_settings_active_idx" ON "corporate_document_settings" ("is_active");
--> statement-breakpoint
INSERT INTO "corporate_document_settings" (
    "legal_name", "trade_name", "gstin", "address_line_1", "address_line_2",
    "city", "state", "postal_code", "country", "email", "phone",
    "bank_name", "bank_account_name", "bank_account_number", "bank_ifsc_code",
    "authorized_signatory_name"
)
SELECT
    'Renivet', 'Renivet', '10AANCR5687A1ZG', 'Dasta Concerto', 'Yamare Village',
    'Bangalore', 'Karnataka', '562125', 'India', 'contact@renivet.com',
    '+917356499350', 'IDFC', 'Renivet', '73564993505', 'IDFB0090174', 'Renivet'
WHERE NOT EXISTS (SELECT 1 FROM "corporate_document_settings");
--> statement-breakpoint
UPDATE "corporate_document_settings"
SET
    "gstin" = CASE
        WHEN "gstin" IS NULL OR "gstin" = '10AANCR5687A1AG' THEN '10AANCR5687A1ZG'
        ELSE "gstin"
    END,
    "address_line_1" = COALESCE("address_line_1", 'Dasta Concerto'),
    "address_line_2" = COALESCE("address_line_2", 'Yamare Village'),
    "city" = COALESCE("city", 'Bangalore'),
    "state" = COALESCE("state", 'Karnataka'),
    "postal_code" = COALESCE("postal_code", '562125'),
    "country" = COALESCE("country", 'India'),
    "email" = 'contact@renivet.com',
    "phone" = COALESCE("phone", '+917356499350'),
    "bank_name" = COALESCE("bank_name", 'IDFC'),
    "bank_account_name" = COALESCE("bank_account_name", 'Renivet'),
    "bank_account_number" = COALESCE("bank_account_number", '73564993505'),
    "bank_ifsc_code" = COALESCE("bank_ifsc_code", 'IDFB0090174'),
    "authorized_signatory_name" = 'Renivet',
    "updated_at" = now()
WHERE "is_active" = true;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "corporate_document_sequences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "document_prefix" text NOT NULL,
    "financial_year" text NOT NULL,
    "last_sequence" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_document_sequences_prefix_fy_idx"
ON "corporate_document_sequences" ("document_prefix", "financial_year");
--> statement-breakpoint

ALTER TABLE "corporate_proforma_invoices" ADD COLUMN IF NOT EXISTS "valid_until" date;
--> statement-breakpoint
ALTER TABLE "corporate_proforma_invoices" ADD COLUMN IF NOT EXISTS "payment_terms" text;
--> statement-breakpoint
ALTER TABLE "corporate_proforma_invoices" ADD COLUMN IF NOT EXISTS "delivery_timeline" text;
--> statement-breakpoint
ALTER TABLE "corporate_proforma_invoices" ADD COLUMN IF NOT EXISTS "terms_and_conditions" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_proforma_invoices_number_unique_idx"
ON "corporate_proforma_invoices" ("invoice_number");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "corporate_receipt_vouchers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "voucher_number" text NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "corporate_orders"("id") ON DELETE CASCADE,
    "payment_id" uuid REFERENCES "corporate_payments"("id") ON DELETE SET NULL,
    "voucher_date" date NOT NULL,
    "amount_paise" integer NOT NULL,
    "payment_mode" text NOT NULL,
    "payment_reference" text,
    "po_reference" text,
    "status" text DEFAULT 'issued' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_receipt_vouchers_number_idx" ON "corporate_receipt_vouchers" ("voucher_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_receipt_vouchers_order_idx" ON "corporate_receipt_vouchers" ("order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_receipt_vouchers_payment_idx" ON "corporate_receipt_vouchers" ("payment_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "corporate_vendor_purchase_orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "po_number" text NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "corporate_orders"("id") ON DELETE CASCADE,
    "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE RESTRICT,
    "issue_date" date NOT NULL,
    "expected_delivery_date" date,
    "quantity" integer NOT NULL,
    "unit_buy_price_paise" integer NOT NULL,
    "taxable_value_paise" integer NOT NULL,
    "gst_rate_bps" integer NOT NULL,
    "cgst_paise" integer DEFAULT 0 NOT NULL,
    "sgst_paise" integer DEFAULT 0 NOT NULL,
    "igst_paise" integer DEFAULT 0 NOT NULL,
    "total_amount_paise" integer NOT NULL,
    "delivery_mode" text DEFAULT 'renivet_warehouse' NOT NULL,
    "delivery_address" text NOT NULL,
    "payment_terms" text NOT NULL,
    "delivery_instructions" text,
    "status" text DEFAULT 'issued' NOT NULL,
    "created_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_vendor_purchase_orders_number_idx" ON "corporate_vendor_purchase_orders" ("po_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_vendor_purchase_orders_order_idx" ON "corporate_vendor_purchase_orders" ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_vendor_purchase_orders_brand_idx" ON "corporate_vendor_purchase_orders" ("brand_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "corporate_brand_tax_invoices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "corporate_orders"("id") ON DELETE CASCADE,
    "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE RESTRICT,
    "vendor_purchase_order_id" uuid REFERENCES "corporate_vendor_purchase_orders"("id") ON DELETE SET NULL,
    "invoice_number" text NOT NULL,
    "invoice_date" date NOT NULL,
    "supplier_gstin" text NOT NULL,
    "recipient_gstin" text NOT NULL,
    "hsn_code" text NOT NULL,
    "taxable_value_paise" integer NOT NULL,
    "cgst_paise" integer DEFAULT 0 NOT NULL,
    "sgst_paise" integer DEFAULT 0 NOT NULL,
    "igst_paise" integer DEFAULT 0 NOT NULL,
    "total_amount_paise" integer NOT NULL,
    "file_name" text NOT NULL,
    "file_url" text NOT NULL,
    "validation_status" text DEFAULT 'pending' NOT NULL,
    "validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "gstr2b_status" text DEFAULT 'pending' NOT NULL,
    "review_notes" text,
    "uploaded_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_brand_tax_invoices_brand_number_idx" ON "corporate_brand_tax_invoices" ("brand_id", "invoice_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_brand_tax_invoices_order_idx" ON "corporate_brand_tax_invoices" ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_brand_tax_invoices_gstr2b_idx" ON "corporate_brand_tax_invoices" ("gstr2b_status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "corporate_delivery_challans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "challan_number" text NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "corporate_orders"("id") ON DELETE CASCADE,
    "vendor_purchase_order_id" uuid REFERENCES "corporate_vendor_purchase_orders"("id") ON DELETE SET NULL,
    "challan_date" date NOT NULL,
    "consignor_name" text NOT NULL,
    "consignor_address" text NOT NULL,
    "consignee_name" text NOT NULL,
    "consignee_address" text NOT NULL,
    "on_behalf_of" text DEFAULT 'Renivet' NOT NULL,
    "reason_for_movement" text DEFAULT 'Supply of goods' NOT NULL,
    "e_way_bill_number" text,
    "status" text DEFAULT 'issued' NOT NULL,
    "created_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_delivery_challans_number_idx" ON "corporate_delivery_challans" ("challan_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_delivery_challans_order_idx" ON "corporate_delivery_challans" ("order_id");
--> statement-breakpoint

ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "receipt_voucher_id" uuid REFERENCES "corporate_receipt_vouchers"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "due_date" date;
--> statement-breakpoint
ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "e_way_bill_number" text;
--> statement-breakpoint
ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "irn" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_tax_invoices_number_unique_idx" ON "corporate_tax_invoices" ("invoice_number");
