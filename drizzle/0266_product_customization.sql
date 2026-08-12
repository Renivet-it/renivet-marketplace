ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customization_available" boolean DEFAULT false NOT NULL;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "customization_request" text;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "customization_request" text;
