ALTER TABLE "brand_confidentials" ALTER COLUMN "bank_account_verification_document" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;