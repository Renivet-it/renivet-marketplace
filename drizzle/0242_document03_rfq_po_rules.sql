ALTER TABLE "corporate_purchase_orders"
ADD COLUMN IF NOT EXISTS "company_name" text;

ALTER TABLE "corporate_purchase_orders"
ADD COLUMN IF NOT EXISTS "product_scope_summary" text;

ALTER TABLE "corporate_purchase_orders"
ADD COLUMN IF NOT EXISTS "authorized_signatory_name" text;

ALTER TABLE "corporate_purchase_orders"
ADD COLUMN IF NOT EXISTS "authorized_signatory_confirmed" boolean DEFAULT false NOT NULL;

ALTER TABLE "corporate_purchase_orders"
ADD COLUMN IF NOT EXISTS "validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL;
