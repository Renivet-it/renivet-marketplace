ALTER TABLE "orders" ADD COLUMN "receipt_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_receipt_id_idx" ON "orders" USING btree ("receipt_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_receipt_id_unique" UNIQUE("receipt_id");