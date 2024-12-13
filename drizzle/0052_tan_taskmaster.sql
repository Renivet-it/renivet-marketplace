ALTER TABLE "orders" ADD COLUMN "payment_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_payment_id_idx" ON "orders" USING btree ("payment_id");