ALTER TABLE "order_shipments" ADD COLUMN "is_rto_return" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "is_rto_return";