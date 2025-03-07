DROP INDEX IF EXISTS "brand_confidential_is_verified_index";--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "verification_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "confidential_verification_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_confidential_verification_status_index" ON "brand_confidentials" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_is_confidential_verification_status_index" ON "brands" USING btree ("confidential_verification_status");--> statement-breakpoint
ALTER TABLE "brand_confidentials" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN IF EXISTS "is_confidential_verified";