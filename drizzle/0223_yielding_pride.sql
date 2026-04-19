ALTER TABLE "brand_unicommerce_integrations" ADD COLUMN "encrypted_access_token" text;--> statement-breakpoint
ALTER TABLE "brand_unicommerce_integrations" ADD COLUMN "encrypted_refresh_token" text;--> statement-breakpoint
ALTER TABLE "brand_unicommerce_integrations" ADD COLUMN "access_token_expires_at" timestamp;