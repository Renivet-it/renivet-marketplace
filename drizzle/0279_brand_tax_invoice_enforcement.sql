ALTER TABLE "corporate_fulfillment_orders"
    ADD COLUMN IF NOT EXISTS "gst_rate_bps" integer,
    ADD COLUMN IF NOT EXISTS "taxable_value_paise" integer,
    ADD COLUMN IF NOT EXISTS "cgst_paise" integer,
    ADD COLUMN IF NOT EXISTS "sgst_paise" integer,
    ADD COLUMN IF NOT EXISTS "igst_paise" integer,
    ADD COLUMN IF NOT EXISTS "supplier_gstin" text,
    ADD COLUMN IF NOT EXISTS "recipient_gstin" text,
    ADD COLUMN IF NOT EXISTS "hsn_code" text;

CREATE TABLE IF NOT EXISTS "corporate_brand_tax_invoice_uploads" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "corporate_orders"("id") ON DELETE cascade,
    "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE restrict,
    "vendor_purchase_order_id" uuid NOT NULL REFERENCES "corporate_fulfillment_orders"("id") ON DELETE cascade,
    "declared_invoice_date" date,
    "file_name" text NOT NULL,
    "file_url" text NOT NULL,
    "file_key" text NOT NULL,
    "file_type" text NOT NULL,
    "file_size" integer NOT NULL,
    "status" text DEFAULT 'pending_review' NOT NULL,
    "uploaded_by_user_id" text REFERENCES "users"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_brand_tax_invoice_uploads_order_file_idx"
    ON "corporate_brand_tax_invoice_uploads" ("order_id", "file_key");
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_brand_tax_invoice_uploads_pending_fo_idx"
    ON "corporate_brand_tax_invoice_uploads" ("vendor_purchase_order_id")
    WHERE "status" = 'pending_review';

ALTER TABLE "corporate_brand_tax_invoices"
    ADD COLUMN IF NOT EXISTS "upload_id" uuid REFERENCES "corporate_brand_tax_invoice_uploads"("id") ON DELETE set null,
    ADD COLUMN IF NOT EXISTS "supersedes_invoice_id" uuid REFERENCES "corporate_brand_tax_invoices"("id") ON DELETE set null,
    ADD COLUMN IF NOT EXISTS "fo_reference" text,
    ADD COLUMN IF NOT EXISTS "quantity" integer,
    ADD COLUMN IF NOT EXISTS "unit_rate_paise" integer,
    ADD COLUMN IF NOT EXISTS "file_key" text,
    ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" text REFERENCES "users"("id") ON DELETE set null,
    ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "transition_version" integer DEFAULT 1 NOT NULL,
    ADD COLUMN IF NOT EXISTS "is_current_accepted" boolean DEFAULT false NOT NULL;

WITH ranked AS (
    SELECT
        "id",
        row_number() OVER (
            PARTITION BY COALESCE("vendor_purchase_order_id"::text, "id"::text)
            ORDER BY "created_at" DESC, "id" DESC
        ) AS position
    FROM "corporate_brand_tax_invoices"
    WHERE "validation_status" <> 'rejected'
)
UPDATE "corporate_brand_tax_invoices" AS invoice
SET "validation_status" = CASE
    WHEN ranked.position = 1 THEN 'held'
    ELSE 'superseded'
END,
"is_current_accepted" = false
FROM ranked
WHERE invoice."id" = ranked."id";

ALTER TABLE "corporate_brand_tax_invoices"
    ALTER COLUMN "validation_status" SET DEFAULT 'held';

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_brand_tax_invoices_held_fo_idx"
    ON "corporate_brand_tax_invoices" ("vendor_purchase_order_id")
    WHERE "validation_status" = 'held' AND "vendor_purchase_order_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_brand_tax_invoices_current_accepted_fo_idx"
    ON "corporate_brand_tax_invoices" ("vendor_purchase_order_id")
    WHERE "is_current_accepted" = true AND "vendor_purchase_order_id" IS NOT NULL;
