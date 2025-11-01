ALTER TABLE "orders_intent" ADD COLUMN "shiprocket_request" jsonb;--> statement-breakpoint
ALTER TABLE "orders_intent" ADD COLUMN "shiprocket_response" jsonb;--> statement-breakpoint
ALTER TABLE "orders_intent" ADD COLUMN "order_log" jsonb;