ALTER TABLE "corporate_fulfillment_orders"
ADD COLUMN IF NOT EXISTS "customizations" jsonb NOT NULL DEFAULT '[]'::jsonb;
