DROP INDEX IF EXISTS "brand_is_confidential_sent_for_verification_index";--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "confidential_verification_status" SET DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN IF EXISTS "is_confidential_sent_for_verification";