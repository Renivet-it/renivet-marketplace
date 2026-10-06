ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "provider_order_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_provider_order_id_idx" ON "orders" USING btree ("provider_order_id");
