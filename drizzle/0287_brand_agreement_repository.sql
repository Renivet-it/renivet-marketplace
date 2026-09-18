CREATE TABLE IF NOT EXISTS "brand_agreements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "brand_id" uuid NOT NULL,
    "version" integer NOT NULL,
    "file_key" text NOT NULL,
    "file_name" text NOT NULL,
    "content_type" text NOT NULL,
    "file_size_bytes" integer NOT NULL,
    "signed_date" date NOT NULL,
    "effective_date" date NOT NULL,
    "expiry_date" date,
    "status" text DEFAULT 'active' NOT NULL,
    "uploaded_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "brand_agreements_expiry_after_effective_check" CHECK ("brand_agreements"."expiry_date" IS NULL OR "brand_agreements"."expiry_date" >= "brand_agreements"."effective_date"),
    CONSTRAINT "brand_agreements_file_size_check" CHECK ("brand_agreements"."file_size_bytes" > 0 AND "brand_agreements"."file_size_bytes" <= 16777216)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_agreements" ADD CONSTRAINT "brand_agreements_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_agreements" ADD CONSTRAINT "brand_agreements_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brand_agreements_brand_version_unique" ON "brand_agreements" USING btree ("brand_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_agreements_brand_idx" ON "brand_agreements" USING btree ("brand_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_agreements_status_idx" ON "brand_agreements" USING btree ("status");
