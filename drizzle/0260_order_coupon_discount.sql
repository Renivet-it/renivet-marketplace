ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_discount_amount" integer DEFAULT 0 NOT NULL;
