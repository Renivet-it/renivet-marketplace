ALTER TABLE "corporate_orders" ADD COLUMN IF NOT EXISTS "delivery_state" text;
ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "place_of_supply_state_code" text;
ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "place_of_supply_state_name" text;
ALTER TABLE "corporate_tax_invoices" ADD COLUMN IF NOT EXISTS "place_of_supply_source" text;
