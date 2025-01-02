ALTER TABLE "brands" ADD COLUMN "is_confidential_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN IF EXISTS "has_added_confidential_details";