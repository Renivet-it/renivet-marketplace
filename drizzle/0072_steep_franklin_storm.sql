ALTER TABLE "brand_requests" ADD COLUMN "rzp_account_id" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "rzp_account_id" text NOT NULL;