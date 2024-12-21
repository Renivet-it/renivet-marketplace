ALTER TABLE "brand_requests" ADD COLUMN "address_line1" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "postal_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_requests" ADD COLUMN "country" text NOT NULL;