ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "is_creator_coupon" boolean DEFAULT false NOT NULL;
