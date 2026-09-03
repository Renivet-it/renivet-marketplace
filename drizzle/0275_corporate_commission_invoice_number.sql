ALTER TABLE "corporate_orders"
ADD COLUMN IF NOT EXISTS "commission_invoice_number" text;

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_orders_commission_invoice_number_unique"
ON "corporate_orders" ("commission_invoice_number");
