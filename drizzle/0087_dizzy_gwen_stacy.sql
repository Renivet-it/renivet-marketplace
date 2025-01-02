ALTER TABLE "brands" ALTER COLUMN "rzp_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "is_confidential_sent_for_verification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "confidential_verification_rejected_reason" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "confidential_verification_rejected_at" timestamp;