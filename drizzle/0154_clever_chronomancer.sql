ALTER TABLE "orders" ADD COLUMN "is_rto_return" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_shipments" DROP COLUMN IF EXISTS "is_rto_return";