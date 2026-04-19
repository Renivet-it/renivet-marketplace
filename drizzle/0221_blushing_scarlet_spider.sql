CREATE TABLE IF NOT EXISTS "brand_unicommerce_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"tenant" text,
	"facility_id" text,
	"base_url" text,
	"username" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_status" text DEFAULT 'idle' NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_unicommerce_integrations" ADD CONSTRAINT "brand_unicommerce_integrations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brand_unicommerce_integration_brand_id_unique_idx" ON "brand_unicommerce_integrations" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_unicommerce_integration_active_idx" ON "brand_unicommerce_integrations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_unicommerce_integration_sync_status_idx" ON "brand_unicommerce_integrations" USING btree ("last_sync_status");